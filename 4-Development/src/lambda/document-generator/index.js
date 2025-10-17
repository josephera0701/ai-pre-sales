const AWS = require('aws-sdk');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } = require('docx');
const XLSX = require('xlsx');

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const { estimationId, documentType, template = 'standard', options = {} } = JSON.parse(event.body);
        
        console.log(`Generating ${documentType} document for estimation: ${estimationId}`);
        
        // Retrieve estimation data
        const estimation = await getEstimationData(estimationId);
        
        if (!estimation) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: {
                        code: 'ESTIMATION_NOT_FOUND',
                        message: 'Estimation not found'
                    }
                })
            };
        }
        
        // Generate document based on type
        let documentBuffer;
        let fileName;
        let contentType;
        
        switch (documentType.toLowerCase()) {
            case 'pdf':
            case 'pdf_proposal':
                documentBuffer = await generatePDFProposal(estimation, template, options);
                fileName = `${estimation.clientInfo.companyName}_AWS_Proposal.pdf`;
                contentType = 'application/pdf';
                break;
                
            case 'word':
            case 'word_document':
                documentBuffer = await generateWordDocument(estimation, template, options);
                fileName = `${estimation.clientInfo.companyName}_AWS_Proposal.docx`;
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
                
            case 'excel':
            case 'excel_export':
                documentBuffer = await generateExcelExport(estimation, options);
                fileName = `${estimation.clientInfo.companyName}_AWS_Cost_Analysis.xlsx`;
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;
                
            default:
                throw new Error(`Unsupported document type: ${documentType}`);
        }
        
        // Store document in S3
        const documentUrl = await storeDocumentInS3(documentBuffer, estimationId, fileName, contentType);
        
        // Save document metadata
        const documentRecord = {
            documentId: generateId(),
            estimationId,
            documentType: documentType.toUpperCase(),
            fileName,
            s3Url: documentUrl,
            fileSize: documentBuffer.length,
            generatedAt: new Date().toISOString(),
            template,
            options
        };
        
        await saveDocumentRecord(documentRecord);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: {
                    documentId: documentRecord.documentId,
                    fileName,
                    downloadUrl: documentUrl,
                    fileSize: documentBuffer.length,
                    generatedAt: documentRecord.generatedAt
                }
            })
        };
        
    } catch (error) {
        console.error('Document generation error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: {
                    code: 'GENERATION_ERROR',
                    message: 'Failed to generate document',
                    details: error.message
                }
            })
        };
    }
};

async function getEstimationData(estimationId) {
    // Get estimation metadata
    const metadataParams = {
        TableName: process.env.MAIN_TABLE,
        Key: {
            PK: `ESTIMATION#${estimationId}`,
            SK: 'METADATA'
        }
    };
    
    // Get estimation requirements
    const requirementsParams = {
        TableName: process.env.MAIN_TABLE,
        Key: {
            PK: `ESTIMATION#${estimationId}`,
            SK: 'REQUIREMENTS'
        }
    };
    
    // Get latest calculation
    const calculationParams = {
        TableName: process.env.MAIN_TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
            ':pk': `CALCULATION#${estimationId}`
        },
        ScanIndexForward: false,
        Limit: 1
    };
    
    const [metadataResult, requirementsResult, calculationResult] = await Promise.all([
        dynamodb.get(metadataParams).promise(),
        dynamodb.get(requirementsParams).promise(),
        dynamodb.query(calculationParams).promise()
    ]);
    
    if (!metadataResult.Item) {
        return null;
    }
    
    return {
        ...metadataResult.Item,
        requirements: requirementsResult.Item || {},
        calculation: calculationResult.Items[0] || {}
    };
}

async function generatePDFProposal(estimation, template, options) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];
            
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            
            // Header with company branding
            doc.fontSize(24).text('AWS Cost Estimation Proposal', { align: 'center' });
            doc.moveDown();
            
            // Client information section
            doc.fontSize(18).text('Client Information', { underline: true });
            doc.moveDown(0.5);
            
            const clientInfo = estimation.ClientInfo || {};
            doc.fontSize(12)
               .text(`Company: ${clientInfo.companyName || 'N/A'}`)
               .text(`Industry: ${clientInfo.industry || 'N/A'}`)
               .text(`Contact: ${clientInfo.primaryContact || 'N/A'}`)
               .text(`Email: ${clientInfo.email || 'N/A'}`)
               .text(`Timeline: ${clientInfo.timeline || 'N/A'}`);
            
            doc.moveDown();
            
            // Executive Summary
            if (options.includeExecutiveSummary !== false) {
                doc.fontSize(18).text('Executive Summary', { underline: true });
                doc.moveDown(0.5);
                
                const calculation = estimation.calculation;
                if (calculation.totalMonthlyCost) {
                    doc.fontSize(12)
                       .text(`Total Monthly Cost: $${calculation.totalMonthlyCost.toLocaleString()}`)
                       .text(`Total Annual Cost: $${calculation.totalAnnualCost.toLocaleString()}`)
                       .text(`Region: ${calculation.region || 'us-east-1'}`)
                       .text(`Pricing Model: ${calculation.pricingModel || 'On-Demand'}`);
                }
                
                doc.moveDown();
            }
            
            // Cost Breakdown
            if (options.includeDetailedBreakdown !== false) {
                doc.fontSize(18).text('Cost Breakdown', { underline: true });
                doc.moveDown(0.5);
                
                const costBreakdown = estimation.calculation.costBreakdown || {};
                
                Object.entries(costBreakdown).forEach(([category, costs]) => {
                    if (costs && costs.total) {
                        doc.fontSize(14).text(`${category.charAt(0).toUpperCase() + category.slice(1)}: $${costs.total.toLocaleString()}/month`);
                        
                        if (costs.details && Array.isArray(costs.details)) {
                            costs.details.forEach(detail => {
                                doc.fontSize(10).text(`  • ${detail.name || detail.serverName || detail.storageType}: $${detail.monthlyCost?.toLocaleString() || 'N/A'}`);
                            });
                        }
                        doc.moveDown(0.5);
                    }
                });
            }
            
            // Infrastructure Requirements
            doc.addPage();
            doc.fontSize(18).text('Infrastructure Requirements', { underline: true });
            doc.moveDown(0.5);
            
            // Compute Requirements
            const computeReqs = estimation.requirements.ComputeRequirements || [];
            if (computeReqs.length > 0) {
                doc.fontSize(14).text('Compute Resources:', { underline: true });
                doc.moveDown(0.3);
                
                computeReqs.forEach(server => {
                    doc.fontSize(12)
                       .text(`${server.serverName}: ${server.cpuCores} vCPUs, ${server.ramGB} GB RAM`)
                       .text(`  Environment: ${server.environment}, OS: ${server.os}`)
                       .text(`  Scaling: ${server.scalingType} (${server.minInstances}-${server.maxInstances} instances)`);
                    doc.moveDown(0.3);
                });
            }
            
            // Storage Requirements
            const storageReqs = estimation.requirements.StorageRequirements || [];
            if (storageReqs.length > 0) {
                doc.fontSize(14).text('Storage Requirements:', { underline: true });
                doc.moveDown(0.3);
                
                storageReqs.forEach(storage => {
                    doc.fontSize(12)
                       .text(`${storage.storageType}: ${storage.currentGB} GB`)
                       .text(`  IOPS: ${storage.iopsRequired}, Access Pattern: ${storage.accessPattern}`);
                    doc.moveDown(0.3);
                });
            }
            
            // Database Requirements
            const dbReqs = estimation.requirements.DatabaseRequirements || [];
            if (dbReqs.length > 0) {
                doc.fontSize(14).text('Database Requirements:', { underline: true });
                doc.moveDown(0.3);
                
                dbReqs.forEach(db => {
                    doc.fontSize(12)
                       .text(`${db.databaseName}: ${db.engine} ${db.version}`)
                       .text(`  Instance: ${db.instanceClass}, Storage: ${db.sizeGB} GB`)
                       .text(`  Multi-AZ: ${db.multiAZ ? 'Yes' : 'No'}, Read Replicas: ${db.readReplicas}`);
                    doc.moveDown(0.3);
                });
            }
            
            // Footer with disclaimers
            doc.addPage();
            doc.fontSize(18).text('Terms and Disclaimers', { underline: true });
            doc.moveDown(0.5);
            
            doc.fontSize(10)
               .text('• Pricing estimates are based on current AWS pricing and may vary.')
               .text('• Actual costs may differ based on usage patterns and AWS pricing changes.')
               .text('• This proposal includes a 10% buffer for pricing fluctuations.')
               .text('• AWS Business Support plan costs are included in the estimate.')
               .text('• Reserved Instance pricing may provide additional savings.')
               .text('• Contact Sagesoft Solutions for detailed implementation planning.');
            
            doc.end();
            
        } catch (error) {
            reject(error);
        }
    });
}

async function generateWordDocument(estimation, template, options) {
    const clientInfo = estimation.ClientInfo || {};
    const calculation = estimation.calculation || {};
    
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // Title
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "AWS Cost Estimation Proposal",
                            bold: true,
                            size: 32
                        })
                    ],
                    alignment: 'center'
                }),
                
                // Client Information
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Client Information",
                            bold: true,
                            size: 24
                        })
                    ]
                }),
                
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Company: ${clientInfo.companyName || 'N/A'}\n`
                        }),
                        new TextRun({
                            text: `Industry: ${clientInfo.industry || 'N/A'}\n`
                        }),
                        new TextRun({
                            text: `Contact: ${clientInfo.primaryContact || 'N/A'}\n`
                        }),
                        new TextRun({
                            text: `Email: ${clientInfo.email || 'N/A'}\n`
                        })
                    ]
                }),
                
                // Cost Summary
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Cost Summary",
                            bold: true,
                            size: 24
                        })
                    ]
                }),
                
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Monthly Cost: $${calculation.totalMonthlyCost?.toLocaleString() || 'N/A'}\n`
                        }),
                        new TextRun({
                            text: `Annual Cost: $${calculation.totalAnnualCost?.toLocaleString() || 'N/A'}\n`
                        }),
                        new TextRun({
                            text: `Region: ${calculation.region || 'us-east-1'}\n`
                        })
                    ]
                })
            ]
        }]
    });
    
    return await Packer.toBuffer(doc);
}

async function generateExcelExport(estimation, options) {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
        ['AWS Cost Estimation Summary'],
        [''],
        ['Client Information'],
        ['Company Name', estimation.ClientInfo?.companyName || 'N/A'],
        ['Industry', estimation.ClientInfo?.industry || 'N/A'],
        ['Contact', estimation.ClientInfo?.primaryContact || 'N/A'],
        [''],
        ['Cost Summary'],
        ['Monthly Cost', estimation.calculation?.totalMonthlyCost || 0],
        ['Annual Cost', estimation.calculation?.totalAnnualCost || 0],
        ['Region', estimation.calculation?.region || 'us-east-1'],
        ['Pricing Model', estimation.calculation?.pricingModel || 'On-Demand']
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Cost breakdown sheet
    const costBreakdown = estimation.calculation?.costBreakdown || {};
    const breakdownData = [
        ['Service Category', 'Monthly Cost', 'Annual Cost'],
        ['Compute', costBreakdown.compute?.total || 0, (costBreakdown.compute?.total || 0) * 12],
        ['Storage', costBreakdown.storage?.total || 0, (costBreakdown.storage?.total || 0) * 12],
        ['Database', costBreakdown.database?.total || 0, (costBreakdown.database?.total || 0) * 12],
        ['Network', costBreakdown.network?.total || 0, (costBreakdown.network?.total || 0) * 12],
        ['Security', costBreakdown.security?.total || 0, (costBreakdown.security?.total || 0) * 12]
    ];
    
    const breakdownSheet = XLSX.utils.aoa_to_sheet(breakdownData);
    XLSX.utils.book_append_sheet(workbook, breakdownSheet, 'Cost Breakdown');
    
    // Requirements sheets
    if (estimation.requirements?.ComputeRequirements) {
        const computeData = [
            ['Server Name', 'CPU Cores', 'RAM GB', 'OS', 'Environment', 'Scaling Type', 'Min Instances', 'Max Instances']
        ];
        
        estimation.requirements.ComputeRequirements.forEach(server => {
            computeData.push([
                server.serverName,
                server.cpuCores,
                server.ramGB,
                server.os,
                server.environment,
                server.scalingType,
                server.minInstances,
                server.maxInstances
            ]);
        });
        
        const computeSheet = XLSX.utils.aoa_to_sheet(computeData);
        XLSX.utils.book_append_sheet(workbook, computeSheet, 'Compute Requirements');
    }
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

async function storeDocumentInS3(documentBuffer, estimationId, fileName, contentType) {
    const key = `documents/${estimationId}/${Date.now()}_${fileName}`;
    
    const params = {
        Bucket: process.env.DOCUMENTS_BUCKET,
        Key: key,
        Body: documentBuffer,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
        Metadata: {
            estimationId,
            generatedAt: new Date().toISOString()
        }
    };
    
    await s3.upload(params).promise();
    
    // Generate presigned URL for download (valid for 24 hours)
    return s3.getSignedUrl('getObject', {
        Bucket: process.env.DOCUMENTS_BUCKET,
        Key: key,
        Expires: 86400 // 24 hours
    });
}

async function saveDocumentRecord(documentRecord) {
    const params = {
        TableName: process.env.MAIN_TABLE,
        Item: {
            PK: `ESTIMATION#${documentRecord.estimationId}`,
            SK: `DOCUMENT#${documentRecord.documentId}`,
            GSI1PK: `DOCUMENT#${documentRecord.documentId}`,
            GSI1SK: documentRecord.generatedAt,
            EntityType: 'Document',
            ...documentRecord
        }
    };
    
    await dynamodb.put(params).promise();
}

function generateId() {
    return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}