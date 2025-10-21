// Use AWS SDK v3 (built into Node.js 18 runtime)
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize AWS services
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const DOCUMENTS_BUCKET = process.env.DOCUMENTS_BUCKET || 'generated-documents-staging-367471965495';
const ENHANCED_TABLE = process.env.ENHANCED_TABLE || 'aws-cost-platform-enhanced-dev';

/**
 * Document Generation Service Lambda Handler
 * Generates PDF/Word/Excel documents from estimations
 */
exports.handler = async (event) => {
    const { httpMethod, path, body, pathParameters, headers } = event;
    
    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
        return createResponse(200, { message: 'CORS preflight successful' });
    }
    
    try {
        const requestBody = body ? JSON.parse(body) : {};
        
        // Extract user context from headers (set by auth service)
        const userContext = extractUserContext(headers);
        
        // Mock user context for testing endpoints (same pattern as user-management-service)
        const mockUserContext = userContext || {
            userId: 'test-user',
            email: 'test@example.com',
            role: 'User',
            firstName: 'Test',
            lastName: 'User'
        };
        
        // Route to appropriate handler
        const route = `${httpMethod} ${path}`;
        
        switch (route) {
            case 'POST /documents/generate':
                return await handleGenerateDocument(requestBody);
            case 'GET /documents/{id}/status':
                return await handleGetDocumentStatus(pathParameters.id);
            case 'GET /documents/{id}/download':
                return await handleDownloadDocument(pathParameters.id);
            case 'GET /documents':
                return await handleListDocuments(event.queryStringParameters);
            case 'POST /documents/export':
                return await handleExportDocument(requestBody);
            default:
                return createResponse(404, { error: 'Route not found' });
        }
    } catch (error) {
        console.error('Document generator service error:', error);
        return createResponse(500, { 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

/**
 * Generate document from estimation
 */
async function handleGenerateDocument(body) {
    const { estimationId, documentType, template, options = {} } = body;
    
    if (!estimationId || !documentType) {
        return createResponse(400, {
            error: 'Estimation ID and document type are required'
        });
    }
    
    try {
        const documentId = require('crypto').randomUUID();
        const timestamp = new Date().toISOString();
        
        // Get estimation data
        const estimation = await getEstimationData(estimationId);
        if (!estimation) {
            return createResponse(404, {
                error: 'Estimation not found',
                message: `No estimation found with ID: ${estimationId}. Please save your estimation first before generating documents.`,
                estimationId
            });
        }
        
        // Generate document based on type
        const documentContent = generateDocumentContent(estimation, documentType, template, options);
        const fileName = `${estimation.ProjectName || 'Estimation'}_${documentType}.${getFileExtension(documentType)}`;
        
        // Store document in S3
        const s3Key = `proposals/${estimationId}/${timestamp}_${fileName}`;
        
        const command = new PutObjectCommand({
            Bucket: DOCUMENTS_BUCKET,
            Key: s3Key,
            Body: documentContent,
            ContentType: getContentType(documentType),
            Metadata: {
                estimationId,
                documentType,
                generatedAt: timestamp
            }
        });
        
        await s3Client.send(command);
        
        // Save document record to DynamoDB
        const documentEntity = {
            PK: `DOCUMENT#${documentId}`,
            SK: 'METADATA',
            GSI1PK: `ESTIMATION#${estimationId}`,
            GSI1SK: `DOCUMENT#${timestamp}`,
            EntityType: 'Document',
            DocumentId: documentId,
            EstimationId: estimationId,
            DocumentType: documentType,
            FileName: fileName,
            S3Key: s3Key,
            Status: 'COMPLETED',
            GeneratedAt: timestamp,
            FileSize: Buffer.byteLength(documentContent),
            Template: template || 'standard',
            Options: options
        };
        
        await dynamodb.send(new PutCommand({
            TableName: ENHANCED_TABLE,
            Item: documentEntity
        }));
        
        return createResponse(202, {
            success: true,
            data: {
                documentId,
                status: 'COMPLETED',
                documentType,
                fileName
            }
        });
        
    } catch (error) {
        console.error('Generate document error:', error);
        return createResponse(500, {
            error: 'Document generation failed',
            message: error.message
        });
    }
}

/**
 * Get document status
 */
async function handleGetDocumentStatus(documentId) {
    try {
        const result = await dynamodb.send(new GetCommand({
            TableName: ENHANCED_TABLE,
            Key: {
                PK: `DOCUMENT#${documentId}`,
                SK: 'METADATA'
            }
        }));
        
        if (!result.Item) {
            return createResponse(404, {
                error: 'Document not found'
            });
        }
        
        const document = result.Item;
        let downloadUrl = null;
        
        if (document.Status === 'COMPLETED') {
            // Generate presigned URL for download
            downloadUrl = await getSignedUrl(s3Client, new GetObjectCommand({
                Bucket: DOCUMENTS_BUCKET,
                Key: document.S3Key
            }), { expiresIn: 3600 });
        }
        
        return createResponse(200, {
            success: true,
            data: {
                documentId: document.DocumentId,
                status: document.Status,
                documentType: document.DocumentType,
                fileName: document.FileName,
                fileSize: document.FileSize,
                generatedAt: document.GeneratedAt,
                downloadUrl,
                expiresAt: downloadUrl ? new Date(Date.now() + 3600000).toISOString() : null
            }
        });
        
    } catch (error) {
        console.error('Get document status error:', error);
        return createResponse(500, {
            error: 'Failed to get document status',
            message: error.message
        });
    }
}

/**
 * Handle document download
 */
async function handleDownloadDocument(documentId) {
    try {
        const result = await dynamodb.send(new GetCommand({
            TableName: ENHANCED_TABLE,
            Key: {
                PK: `DOCUMENT#${documentId}`,
                SK: 'METADATA'
            }
        }));
        
        if (!result.Item) {
            return createResponse(404, {
                error: 'Document not found'
            });
        }
        
        const document = result.Item;
        
        // Generate presigned URL and redirect
        const downloadUrl = await getSignedUrl(s3Client, new GetObjectCommand({
            Bucket: DOCUMENTS_BUCKET,
            Key: document.S3Key
        }), { expiresIn: 3600 });
        
        return {
            statusCode: 302,
            headers: {
                'Location': downloadUrl,
                'Access-Control-Allow-Origin': '*'
            }
        };
        
    } catch (error) {
        console.error('Download document error:', error);
        return createResponse(500, {
            error: 'Download failed',
            message: error.message
        });
    }
}

/**
 * List documents for estimation
 */
async function handleListDocuments(queryParams) {
    const { estimationId } = queryParams || {};
    
    if (!estimationId) {
        return createResponse(400, {
            error: 'Estimation ID is required'
        });
    }
    
    // Mock response - in production would query DynamoDB
    return createResponse(200, {
        success: true,
        data: {
            documents: [
                {
                    documentId: 'doc123',
                    documentType: 'PDF_PROPOSAL',
                    fileName: 'Sample_Proposal.pdf',
                    fileSize: 2048576,
                    generatedAt: new Date().toISOString(),
                    downloadCount: 3,
                    lastDownloadedAt: new Date().toISOString()
                }
            ]
        }
    });
}

/**
 * Export estimation to Excel
 */
async function handleExportDocument(body) {
    const { estimationId, format = 'EXCEL', includeCalculations = true, includeCharts = true } = body;
    
    if (!estimationId) {
        return createResponse(400, {
            error: 'Estimation ID is required'
        });
    }
    
    try {
        const documentId = require('crypto').randomUUID();
        
        // Mock export - in production would generate actual Excel file
        return createResponse(200, {
            success: true,
            data: {
                documentId,
                status: 'COMPLETED',
                format,
                fileName: `Estimation_Export_${estimationId}.xlsx`,
                downloadUrl: `https://example.com/download/${documentId}`
            }
        });
        
    } catch (error) {
        console.error('Export document error:', error);
        return createResponse(500, {
            error: 'Export failed',
            message: error.message
        });
    }
}

/**
 * Get estimation data from DynamoDB
 */
async function getEstimationData(estimationId) {
    try {
        const result = await dynamodb.send(new GetCommand({
            TableName: ENHANCED_TABLE,
            Key: {
                PK: `ESTIMATION#${estimationId}`,
                SK: 'METADATA'
            }
        }));
        
        return result.Item || null;
        
    } catch (error) {
        console.error('Get estimation data error:', error);
        throw error;
    }
}

/**
 * Generate document content based on type
 */
function generateDocumentContent(estimation, documentType, template, options) {
    // Mock document generation - in production would use proper document libraries
    const content = {
        title: estimation.ProjectName || 'AWS Cost Estimation',
        company: estimation.EnhancedClientInfo?.CompanyName || 'Client Company',
        totalCost: estimation.EstimationSummary?.TotalMonthlyCost || 0,
        generatedAt: new Date().toISOString()
    };
    
    switch (documentType) {
        case 'PDF_PROPOSAL':
            return Buffer.from(`PDF Proposal for ${content.company}\nTotal Monthly Cost: $${content.totalCost}`);
        case 'WORD_DOCUMENT':
            return Buffer.from(`Word Document for ${content.company}\nTotal Monthly Cost: $${content.totalCost}`);
        case 'EXCEL_EXPORT':
            return Buffer.from(`Excel Export for ${content.company}\nTotal Monthly Cost: $${content.totalCost}`);
        default:
            return Buffer.from(`Document for ${content.company}\nTotal Monthly Cost: $${content.totalCost}`);
    }
}

/**
 * Get file extension based on document type
 */
function getFileExtension(documentType) {
    switch (documentType) {
        case 'PDF_PROPOSAL': return 'pdf';
        case 'WORD_DOCUMENT': return 'docx';
        case 'EXCEL_EXPORT': return 'xlsx';
        default: return 'txt';
    }
}

/**
 * Get content type based on document type
 */
function getContentType(documentType) {
    switch (documentType) {
        case 'PDF_PROPOSAL': return 'application/pdf';
        case 'WORD_DOCUMENT': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'EXCEL_EXPORT': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        default: return 'text/plain';
    }
}

/**
 * Extract user context from headers
 */
function extractUserContext(headers) {
    const authHeader = headers.Authorization || headers.authorization;
    if (!authHeader) return null;
    
    // In real implementation, this would decode JWT token
    // For now, assume auth service sets user context headers
    return {
        userId: headers['x-user-id'],
        email: headers['x-user-email'],
        role: headers['x-user-role'],
        firstName: headers['x-user-firstname'],
        lastName: headers['x-user-lastname']
    };
}

/**
 * Create standardized API response with proper CORS
 */
function createResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-user-id,x-user-email,x-user-role,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Credentials': 'false',
            'Access-Control-Max-Age': '86400'
        },
        body: JSON.stringify({
            ...body,
            timestamp: new Date().toISOString(),
            requestId: process.env.AWS_REQUEST_ID || 'local-test'
        })
    };
}