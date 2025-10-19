const AWS = require('aws-sdk');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } = require('docx');
const XLSX = require('xlsx');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();

const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE || 'generated-documents';
const DOCUMENTS_BUCKET = process.env.DOCUMENTS_BUCKET || 'generated-documents-bucket';
const TEMPLATES_BUCKET = process.env.TEMPLATES_BUCKET || 'document-templates-bucket';

exports.handler = async (event) => {
  console.log('Document Generator Event:', JSON.stringify(event, null, 2));
  
  try {
    const { httpMethod, path, body, headers, pathParameters } = event;
    const userId = headers['x-user-id'];
    
    if (!userId) {
      return createResponse(401, { error: 'Authentication required' });
    }

    // Route handling
    if (httpMethod === 'POST' && path === '/documents/generate') {
      return await handleDocumentGeneration(JSON.parse(body), userId);
    }
    
    if (httpMethod === 'GET' && path.startsWith('/documents/') && path.includes('/status')) {
      const documentId = pathParameters?.id;
      return await handleGetDocumentStatus(documentId, userId);
    }
    
    if (httpMethod === 'GET' && path.startsWith('/documents/') && path.includes('/download')) {
      const documentId = pathParameters?.id;
      return await handleDocumentDownload(documentId, userId);
    }
    
    if (httpMethod === 'GET' && path === '/documents') {
      return await handleGetDocuments(userId);
    }
    
    if (httpMethod === 'GET' && path === '/documents/templates') {
      return await handleGetTemplates(userId);
    }

    return createResponse(404, { error: 'Endpoint not found' });
    
  } catch (error) {
    console.error('Document Generator Error:', error);
    return createResponse(500, { 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

async function handleDocumentGeneration(data, userId) {
  const { documentType, templateType, estimationData, clientInfo, options } = data;
  
  if (!documentType || !estimationData) {
    return createResponse(400, { 
      error: 'Missing required fields: documentType, estimationData' 
    });
  }

  try {
    const documentId = generateId();
    
    // Store generation request
    const documentRecord = {
      documentId,
      userId,
      documentType,
      templateType: templateType || 'standard',
      status: 'generating',
      createdAt: new Date().toISOString(),
      clientInfo: clientInfo || {},
      options: options || {}
    };

    await dynamodb.put({
      TableName: DOCUMENTS_TABLE,
      Item: documentRecord
    }).promise();

    // Generate document based on type
    let documentBuffer;
    let contentType;
    let fileExtension;

    switch (documentType.toLowerCase()) {
      case 'pdf':
        documentBuffer = await generatePDF(estimationData, clientInfo, options);
        contentType = 'application/pdf';
        fileExtension = 'pdf';
        break;
      case 'word':
      case 'docx':
        documentBuffer = await generateWord(estimationData, clientInfo, options);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileExtension = 'docx';
        break;
      case 'excel':
      case 'xlsx':
        documentBuffer = await generateExcel(estimationData, clientInfo, options);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;
      default:
        return createResponse(400, { error: 'Unsupported document type' });
    }

    // Store document in S3
    const s3Key = `documents/${userId}/${documentId}.${fileExtension}`;
    await s3.putObject({
      Bucket: DOCUMENTS_BUCKET,
      Key: s3Key,
      Body: documentBuffer,
      ContentType: contentType,
      Metadata: {
        userId,
        documentId,
        documentType,
        generatedAt: new Date().toISOString()
      }
    }).promise();

    // Update document record
    await dynamodb.update({
      TableName: DOCUMENTS_TABLE,
      Key: { documentId },
      UpdateExpression: 'SET #status = :status, s3Key = :s3Key, contentType = :contentType, fileSize = :fileSize, completedAt = :timestamp',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':s3Key': s3Key,
        ':contentType': contentType,
        ':fileSize': documentBuffer.length,
        ':timestamp': new Date().toISOString()
      }
    }).promise();

    return createResponse(200, {
      message: 'Document generated successfully',
      documentId,
      documentType,
      fileSize: documentBuffer.length,
      downloadUrl: `/documents/${documentId}/download`
    });

  } catch (error) {
    console.error('Document generation error:', error);
    
    // Update status to failed
    if (documentId) {
      await dynamodb.update({
        TableName: DOCUMENTS_TABLE,
        Key: { documentId },
        UpdateExpression: 'SET #status = :status, errorMessage = :error, failedAt = :timestamp',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'failed',
          ':error': error.message,
          ':timestamp': new Date().toISOString()
        }
      }).promise();
    }

    return createResponse(500, { 
      error: 'Failed to generate document',
      details: error.message 
    });
  }
}

async function handleGetDocumentStatus(documentId, userId) {
  try {
    const result = await dynamodb.get({
      TableName: DOCUMENTS_TABLE,
      Key: { documentId }
    }).promise();

    if (!result.Item || result.Item.userId !== userId) {
      return createResponse(404, { error: 'Document not found' });
    }

    const document = result.Item;
    return createResponse(200, {
      documentId,
      status: document.status,
      documentType: document.documentType,
      createdAt: document.createdAt,
      completedAt: document.completedAt,
      fileSize: document.fileSize,
      downloadUrl: document.status === 'completed' ? `/documents/${documentId}/download` : null
    });

  } catch (error) {
    console.error('Get document status error:', error);
    return createResponse(500, { 
      error: 'Failed to get document status',
      details: error.message 
    });
  }
}

async function handleDocumentDownload(documentId, userId) {
  try {
    const result = await dynamodb.get({
      TableName: DOCUMENTS_TABLE,
      Key: { documentId }
    }).promise();

    if (!result.Item || result.Item.userId !== userId) {
      return createResponse(404, { error: 'Document not found' });
    }

    const document = result.Item;
    if (document.status !== 'completed') {
      return createResponse(400, { 
        error: 'Document not ready for download',
        status: document.status 
      });
    }

    // Generate presigned URL for download
    const downloadUrl = s3.getSignedUrl('getObject', {
      Bucket: DOCUMENTS_BUCKET,
      Key: document.s3Key,
      Expires: 3600, // 1 hour
      ResponseContentDisposition: `attachment; filename="${documentId}.${getFileExtension(document.documentType)}"`
    });

    return createResponse(200, {
      documentId,
      downloadUrl,
      expiresIn: 3600,
      fileSize: document.fileSize,
      contentType: document.contentType
    });

  } catch (error) {
    console.error('Document download error:', error);
    return createResponse(500, { 
      error: 'Failed to generate download URL',
      details: error.message 
    });
  }
}

async function handleGetDocuments(userId) {
  try {
    const result = await dynamodb.query({
      TableName: DOCUMENTS_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false,
      Limit: 50
    }).promise();

    const documents = result.Items.map(item => ({
      documentId: item.documentId,
      documentType: item.documentType,
      templateType: item.templateType,
      status: item.status,
      createdAt: item.createdAt,
      completedAt: item.completedAt,
      fileSize: item.fileSize,
      clientInfo: item.clientInfo
    }));

    return createResponse(200, {
      documents,
      totalCount: result.Count
    });

  } catch (error) {
    console.error('Get documents error:', error);
    return createResponse(500, { 
      error: 'Failed to retrieve documents',
      details: error.message 
    });
  }
}

async function handleGetTemplates(userId) {
  try {
    const templates = [
      {
        templateType: 'standard',
        name: 'Standard Cost Proposal',
        description: 'Professional cost estimation proposal with AWS service breakdown',
        supportedFormats: ['pdf', 'word', 'excel']
      },
      {
        templateType: 'executive',
        name: 'Executive Summary',
        description: 'High-level executive summary with key metrics and recommendations',
        supportedFormats: ['pdf', 'word']
      },
      {
        templateType: 'detailed',
        name: 'Detailed Technical Report',
        description: 'Comprehensive technical report with detailed cost analysis',
        supportedFormats: ['pdf', 'word', 'excel']
      }
    ];

    return createResponse(200, {
      templates,
      totalCount: templates.length
    });

  } catch (error) {
    console.error('Get templates error:', error);
    return createResponse(500, { 
      error: 'Failed to retrieve templates',
      details: error.message 
    });
  }
}

async function generatePDF(estimationData, clientInfo, options) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text('AWS Cost Estimation Proposal', 50, 50);
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);

      // Client Information
      if (clientInfo && clientInfo.companyName) {
        doc.fontSize(16).text('Client Information', 50, 120);
        doc.fontSize(12)
           .text(`Company: ${clientInfo.companyName}`, 50, 150)
           .text(`Contact: ${clientInfo.contactName || 'N/A'}`, 50, 170)
           .text(`Email: ${clientInfo.email || 'N/A'}`, 50, 190);
      }

      // Cost Summary
      doc.fontSize(16).text('Cost Summary', 50, 230);
      if (estimationData.totalMonthlyCost) {
        doc.fontSize(14)
           .text(`Monthly Cost: $${estimationData.totalMonthlyCost.toFixed(2)}`, 50, 260)
           .text(`Annual Cost: $${(estimationData.totalMonthlyCost * 12).toFixed(2)}`, 50, 280);
      }

      // Service Breakdown
      if (estimationData.costBreakdown) {
        doc.fontSize(16).text('Service Breakdown', 50, 320);
        let yPos = 350;
        
        Object.entries(estimationData.costBreakdown).forEach(([service, cost]) => {
          doc.fontSize(12).text(`${service}: $${cost.toFixed(2)}`, 50, yPos);
          yPos += 20;
        });
      }

      // Recommendations
      if (estimationData.recommendations && estimationData.recommendations.length > 0) {
        doc.fontSize(16).text('Recommendations', 50, yPos + 30);
        yPos += 60;
        
        estimationData.recommendations.forEach((rec, index) => {
          doc.fontSize(12)
             .text(`${index + 1}. ${rec.title || rec.recommendation}`, 50, yPos)
             .text(`   Savings: $${rec.savings || 0}`, 50, yPos + 15);
          yPos += 40;
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function generateWord(estimationData, clientInfo, options) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "AWS Cost Estimation Proposal",
              bold: true,
              size: 32
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated on: ${new Date().toLocaleDateString()}`,
              size: 24
            })
          ]
        }),
        new Paragraph({ text: "" }),
        
        // Client Information
        ...(clientInfo && clientInfo.companyName ? [
          new Paragraph({
            children: [
              new TextRun({
                text: "Client Information",
                bold: true,
                size: 28
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Company: ${clientInfo.companyName}`,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Contact: ${clientInfo.contactName || 'N/A'}`,
                size: 24
              })
            ]
          }),
          new Paragraph({ text: "" })
        ] : []),

        // Cost Summary
        new Paragraph({
          children: [
            new TextRun({
              text: "Cost Summary",
              bold: true,
              size: 28
            })
          ]
        }),
        ...(estimationData.totalMonthlyCost ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `Monthly Cost: $${estimationData.totalMonthlyCost.toFixed(2)}`,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Annual Cost: $${(estimationData.totalMonthlyCost * 12).toFixed(2)}`,
                size: 24
              })
            ]
          })
        ] : [])
      ]
    }]
  });

  return await Packer.toBuffer(doc);
}

async function generateExcel(estimationData, clientInfo, options) {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['AWS Cost Estimation Report'],
    ['Generated on:', new Date().toLocaleDateString()],
    [''],
    ['Client Information'],
    ['Company:', clientInfo?.companyName || 'N/A'],
    ['Contact:', clientInfo?.contactName || 'N/A'],
    ['Email:', clientInfo?.email || 'N/A'],
    [''],
    ['Cost Summary'],
    ['Monthly Cost:', estimationData.totalMonthlyCost || 0],
    ['Annual Cost:', (estimationData.totalMonthlyCost || 0) * 12]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Service Breakdown Sheet
  if (estimationData.costBreakdown) {
    const breakdownData = [
      ['Service', 'Monthly Cost'],
      ...Object.entries(estimationData.costBreakdown).map(([service, cost]) => [service, cost])
    ];
    
    const breakdownSheet = XLSX.utils.aoa_to_sheet(breakdownData);
    XLSX.utils.book_append_sheet(workbook, breakdownSheet, 'Service Breakdown');
  }

  // Recommendations Sheet
  if (estimationData.recommendations && estimationData.recommendations.length > 0) {
    const recommendationsData = [
      ['Recommendation', 'Savings', 'Priority'],
      ...estimationData.recommendations.map(rec => [
        rec.title || rec.recommendation,
        rec.savings || 0,
        rec.priority || 'Medium'
      ])
    ];
    
    const recommendationsSheet = XLSX.utils.aoa_to_sheet(recommendationsData);
    XLSX.utils.book_append_sheet(workbook, recommendationsSheet, 'Recommendations');
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function getFileExtension(documentType) {
  const extensions = {
    'pdf': 'pdf',
    'word': 'docx',
    'docx': 'docx',
    'excel': 'xlsx',
    'xlsx': 'xlsx'
  };
  return extensions[documentType.toLowerCase()] || 'pdf';
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id'
    },
    body: JSON.stringify(body)
  };
}