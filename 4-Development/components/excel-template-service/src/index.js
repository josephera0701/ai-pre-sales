// Use AWS SDK v3 (built into Node.js 18 runtime)
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize AWS services
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Environment variables
const TEMPLATES_BUCKET = process.env.TEMPLATES_BUCKET || 'document-templates-staging-367471965495';

/**
 * Excel Template Download Service Lambda Handler
 * Generates presigned URLs for Excel template downloads
 */
exports.handler = async (event) => {
    const { httpMethod, path, queryStringParameters } = event;
    
    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
        return createResponse(200, { message: 'CORS preflight successful' });
    }
    
    try {
        // Route to appropriate handler
        const route = `${httpMethod} ${path}`;
        
        switch (route) {
            case 'GET /excel/template':
                return await handleDownloadTemplate(queryStringParameters);
            default:
                return createResponse(404, { error: 'Route not found' });
        }
    } catch (error) {
        console.error('Excel template service error:', error);
        return createResponse(500, { 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

/**
 * Generate presigned URL for Excel template download
 */
async function handleDownloadTemplate(queryParams) {
    const { version = '2.0', type = 'enhanced', redirect = 'false' } = queryParams || {};
    
    try {
        // Determine template file based on parameters
        const templateFileName = type === 'enhanced' 
            ? 'Enhanced_AWS_Cost_Estimation_Template.xlsx'
            : 'Basic_AWS_Cost_Estimation_Template.xlsx';
        
        const s3Key = `templates/${templateFileName}`;
        
        // Generate presigned URL for direct S3 download
        const command = new GetObjectCommand({
            Bucket: TEMPLATES_BUCKET,
            Key: s3Key
        });
        
        const presignedUrl = await getSignedUrl(s3Client, command, { 
            expiresIn: 3600 // 1 hour expiration
        });
        
        // Return redirect response or presigned URL
        if (redirect === 'true') {
            return {
                statusCode: 302,
                headers: {
                    'Location': presignedUrl,
                    'Cache-Control': 'no-cache',
                    'Access-Control-Allow-Origin': '*'
                }
            };
        } else {
            return createResponse(200, {
                success: true,
                data: {
                    downloadUrl: presignedUrl,
                    fileName: templateFileName,
                    version: version,
                    expiresAt: new Date(Date.now() + 3600000).toISOString()
                }
            });
        }
        
    } catch (error) {
        console.error('Template download error:', error);
        return createResponse(500, {
            success: false,
            error: {
                code: 'TEMPLATE_DOWNLOAD_ERROR',
                message: 'Failed to generate download URL for template'
            }
        });
    }
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
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Credentials': 'false',
            'Access-Control-Max-Age': '86400',
            'Cache-Control': 'max-age=300' // 5 minutes cache
        },
        body: JSON.stringify({
            ...body,
            timestamp: new Date().toISOString(),
            requestId: process.env.AWS_REQUEST_ID || 'local-test'
        })
    };
}