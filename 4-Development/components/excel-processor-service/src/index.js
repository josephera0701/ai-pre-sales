const AWS = require('aws-sdk');
const XLSX = require('xlsx');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();

const TEMPLATES_TABLE = process.env.TEMPLATES_TABLE || 'excel-templates';
const PROCESSED_DATA_TABLE = process.env.PROCESSED_DATA_TABLE || 'processed-excel-data';
const TEMPLATES_BUCKET = process.env.TEMPLATES_BUCKET || 'excel-templates-bucket';

// Template validation schemas
const TEMPLATE_SCHEMAS = {
  'cost-estimation': {
    requiredSheets: ['Infrastructure', 'Pricing', 'Summary'],
    sheetValidations: {
      'Infrastructure': {
        requiredColumns: ['Service', 'Type', 'Quantity', 'Region'],
        dataTypes: {
          'Service': 'string',
          'Type': 'string', 
          'Quantity': 'number',
          'Region': 'string'
        }
      },
      'Pricing': {
        requiredColumns: ['Service', 'Unit', 'Price', 'Currency'],
        dataTypes: {
          'Service': 'string',
          'Unit': 'string',
          'Price': 'number',
          'Currency': 'string'
        }
      }
    }
  }
};

exports.handler = async (event) => {
  console.log('Excel Processor Event:', JSON.stringify(event, null, 2));
  
  try {
    const { httpMethod, path, body, headers, pathParameters } = event;
    const userId = headers['x-user-id'];
    
    // Public endpoints that don't require authentication
    const publicEndpoints = ['/excel/template'];
    const isPublicEndpoint = publicEndpoints.includes(path);
    
    if (!userId && !isPublicEndpoint) {
      return createResponse(401, { error: 'Authentication required' });
    }

    // Route handling
    if (httpMethod === 'POST' && path === '/excel/upload') {
      return await handleFileUpload(JSON.parse(body), userId);
    }
    
    if (httpMethod === 'POST' && path === '/excel/validate') {
      return await handleTemplateValidation(JSON.parse(body), userId);
    }
    
    if (httpMethod === 'POST' && path === '/excel/process') {
      return await handleDataProcessing(JSON.parse(body), userId);
    }
    
    if (httpMethod === 'GET' && path === '/excel/templates') {
      return await handleGetTemplates(userId);
    }
    
    if (httpMethod === 'GET' && path.startsWith('/excel/processed/')) {
      const processId = pathParameters?.id;
      return await handleGetProcessedData(processId, userId);
    }
    
    if (httpMethod === 'GET' && path === '/excel/history') {
      return await handleGetProcessingHistory(userId);
    }
    
    if (httpMethod === 'GET' && path === '/excel/template') {
      return await handleDownloadTemplate(); // Public endpoint - no auth required
    }

    return createResponse(404, { error: 'Endpoint not found' });
    
  } catch (error) {
    console.error('Excel Processor Error:', error);
    return createResponse(500, { 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

async function handleFileUpload(data, userId) {
  const { fileName, fileContent, templateType } = data;
  
  if (!fileName || !fileContent || !templateType) {
    return createResponse(400, { 
      error: 'Missing required fields: fileName, fileContent, templateType' 
    });
  }

  try {
    // Decode base64 file content
    const buffer = Buffer.from(fileContent, 'base64');
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Basic file validation
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return createResponse(400, { error: 'Invalid Excel file: No sheets found' });
    }

    // Store file in S3
    const s3Key = `uploads/${userId}/${Date.now()}-${fileName}`;
    await s3.putObject({
      Bucket: TEMPLATES_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }).promise();

    // Store upload metadata
    const uploadRecord = {
      uploadId: generateId(),
      userId,
      fileName,
      templateType,
      s3Key,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
      sheetNames: workbook.SheetNames
    };

    await dynamodb.put({
      TableName: PROCESSED_DATA_TABLE,
      Item: uploadRecord
    }).promise();

    return createResponse(200, {
      message: 'File uploaded successfully',
      uploadId: uploadRecord.uploadId,
      sheetNames: workbook.SheetNames,
      s3Key
    });

  } catch (error) {
    console.error('File upload error:', error);
    return createResponse(500, { 
      error: 'Failed to upload file',
      details: error.message 
    });
  }
}

async function handleTemplateValidation(data, userId) {
  const { uploadId, templateType } = data;
  
  if (!uploadId || !templateType) {
    return createResponse(400, { 
      error: 'Missing required fields: uploadId, templateType' 
    });
  }

  try {
    // Get upload record
    const uploadResult = await dynamodb.get({
      TableName: PROCESSED_DATA_TABLE,
      Key: { uploadId }
    }).promise();

    if (!uploadResult.Item || uploadResult.Item.userId !== userId) {
      return createResponse(404, { error: 'Upload not found' });
    }

    // Get file from S3
    const s3Object = await s3.getObject({
      Bucket: TEMPLATES_BUCKET,
      Key: uploadResult.Item.s3Key
    }).promise();

    // Parse Excel file
    const workbook = XLSX.read(s3Object.Body, { type: 'buffer' });
    
    // Validate template
    const validationResult = validateTemplate(workbook, templateType);
    
    // Update record with validation results
    await dynamodb.update({
      TableName: PROCESSED_DATA_TABLE,
      Key: { uploadId },
      UpdateExpression: 'SET #status = :status, validationResult = :validation, validatedAt = :timestamp',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': validationResult.isValid ? 'validated' : 'validation_failed',
        ':validation': validationResult,
        ':timestamp': new Date().toISOString()
      }
    }).promise();

    return createResponse(200, {
      message: 'Template validation completed',
      uploadId,
      validation: validationResult
    });

  } catch (error) {
    console.error('Template validation error:', error);
    return createResponse(500, { 
      error: 'Failed to validate template',
      details: error.message 
    });
  }
}

async function handleDataProcessing(data, userId) {
  const { uploadId, mappingConfig } = data;
  
  if (!uploadId) {
    return createResponse(400, { error: 'Missing required field: uploadId' });
  }

  try {
    // Get upload record
    const uploadResult = await dynamodb.get({
      TableName: PROCESSED_DATA_TABLE,
      Key: { uploadId }
    }).promise();

    if (!uploadResult.Item || uploadResult.Item.userId !== userId) {
      return createResponse(404, { error: 'Upload not found' });
    }

    const uploadRecord = uploadResult.Item;
    
    if (uploadRecord.status !== 'validated') {
      return createResponse(400, { 
        error: 'File must be validated before processing',
        currentStatus: uploadRecord.status 
      });
    }

    // Get file from S3
    const s3Object = await s3.getObject({
      Bucket: TEMPLATES_BUCKET,
      Key: uploadRecord.s3Key
    }).promise();

    // Parse and process Excel data
    const workbook = XLSX.read(s3Object.Body, { type: 'buffer' });
    const processedData = processExcelData(workbook, uploadRecord.templateType, mappingConfig);
    
    // Store processed data
    const processResult = {
      processId: generateId(),
      uploadId,
      userId,
      templateType: uploadRecord.templateType,
      processedData,
      mappingConfig: mappingConfig || {},
      processedAt: new Date().toISOString(),
      status: 'completed'
    };

    await dynamodb.put({
      TableName: PROCESSED_DATA_TABLE,
      Item: processResult
    }).promise();

    // Update upload record
    await dynamodb.update({
      TableName: PROCESSED_DATA_TABLE,
      Key: { uploadId },
      UpdateExpression: 'SET #status = :status, processId = :processId, processedAt = :timestamp',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'processed',
        ':processId': processResult.processId,
        ':timestamp': new Date().toISOString()
      }
    }).promise();

    return createResponse(200, {
      message: 'Data processing completed',
      processId: processResult.processId,
      recordCount: processedData.totalRecords,
      summary: processedData.summary
    });

  } catch (error) {
    console.error('Data processing error:', error);
    return createResponse(500, { 
      error: 'Failed to process data',
      details: error.message 
    });
  }
}

async function handleGetTemplates(userId) {
  try {
    // Get available templates
    const templates = Object.keys(TEMPLATE_SCHEMAS).map(templateType => ({
      templateType,
      schema: TEMPLATE_SCHEMAS[templateType],
      description: getTemplateDescription(templateType)
    }));

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

async function handleGetProcessedData(processId, userId) {
  try {
    const result = await dynamodb.get({
      TableName: PROCESSED_DATA_TABLE,
      Key: { processId }
    }).promise();

    if (!result.Item || result.Item.userId !== userId) {
      return createResponse(404, { error: 'Processed data not found' });
    }

    return createResponse(200, {
      processId,
      data: result.Item
    });

  } catch (error) {
    console.error('Get processed data error:', error);
    return createResponse(500, { 
      error: 'Failed to retrieve processed data',
      details: error.message 
    });
  }
}

async function handleGetProcessingHistory(userId) {
  try {
    const result = await dynamodb.query({
      TableName: PROCESSED_DATA_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false,
      Limit: 50
    }).promise();

    const history = result.Items.map(item => ({
      uploadId: item.uploadId,
      processId: item.processId,
      fileName: item.fileName,
      templateType: item.templateType,
      status: item.status,
      uploadedAt: item.uploadedAt,
      processedAt: item.processedAt
    }));

    return createResponse(200, {
      history,
      totalCount: result.Count
    });

  } catch (error) {
    console.error('Get processing history error:', error);
    return createResponse(500, { 
      error: 'Failed to retrieve processing history',
      details: error.message 
    });
  }
}

async function handleDownloadTemplate() {
  try {
    // Create simple CSV template for now (Excel generation requires more complex setup)
    const csvContent = `Company Name,Industry,Contact Email,Project Timeline,Budget Range,Region Preference
ABC Corporation,Technology,contact@abc.com,Q2 2024,100000-200000,us-east-1

Server Name,Environment,CPU Cores,RAM (GB),OS,Instance Type,Quantity
Web Server,Production,4,16,Linux,t3.xlarge,2
Database Server,Production,8,32,Linux,m5.2xlarge,1

Storage Type,Size (GB),IOPS,Throughput,Backup Required
EBS gp3,500,3000,125,Yes
S3 Standard,1000,N/A,N/A,Yes`;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="AWS_Cost_Estimation_Template.csv"',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: csvContent
    };
    
  } catch (error) {
    console.error('Download template error:', error);
    return createResponse(500, { 
      error: 'Failed to generate template',
      details: error.message 
    });
  }
}

function validateTemplate(workbook, templateType) {
  const schema = TEMPLATE_SCHEMAS[templateType];
  if (!schema) {
    return {
      isValid: false,
      errors: [`Unknown template type: ${templateType}`]
    };
  }

  const errors = [];
  const warnings = [];

  // Check required sheets
  for (const requiredSheet of schema.requiredSheets) {
    if (!workbook.SheetNames.includes(requiredSheet)) {
      errors.push(`Missing required sheet: ${requiredSheet}`);
    }
  }

  // Validate sheet structures
  for (const [sheetName, sheetSchema] of Object.entries(schema.sheetValidations)) {
    if (workbook.SheetNames.includes(sheetName)) {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      if (sheetData.length === 0) {
        warnings.push(`Sheet ${sheetName} is empty`);
        continue;
      }

      const headers = sheetData[0];
      
      // Check required columns
      for (const requiredCol of sheetSchema.requiredColumns) {
        if (!headers.includes(requiredCol)) {
          errors.push(`Sheet ${sheetName} missing required column: ${requiredCol}`);
        }
      }

      // Validate data types (sample first few rows)
      const dataRows = sheetData.slice(1, Math.min(6, sheetData.length));
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        for (const [colName, expectedType] of Object.entries(sheetSchema.dataTypes)) {
          const colIndex = headers.indexOf(colName);
          if (colIndex !== -1 && row[colIndex] !== undefined) {
            const value = row[colIndex];
            if (!validateDataType(value, expectedType)) {
              warnings.push(`Sheet ${sheetName}, row ${i + 2}, column ${colName}: Expected ${expectedType}, got ${typeof value}`);
            }
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    templateType,
    validatedAt: new Date().toISOString()
  };
}

function processExcelData(workbook, templateType, mappingConfig = {}) {
  const processedData = {
    templateType,
    sheets: {},
    totalRecords: 0,
    summary: {}
  };

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    
    // Apply mapping configuration if provided
    const mappedData = mappingConfig[sheetName] 
      ? applyMapping(jsonData, mappingConfig[sheetName])
      : jsonData;

    processedData.sheets[sheetName] = {
      data: mappedData,
      recordCount: mappedData.length,
      columns: Object.keys(mappedData[0] || {})
    };
    
    processedData.totalRecords += mappedData.length;
  }

  // Generate summary based on template type
  processedData.summary = generateDataSummary(processedData, templateType);

  return processedData;
}

function applyMapping(data, mapping) {
  return data.map(row => {
    const mappedRow = {};
    for (const [targetField, sourceField] of Object.entries(mapping)) {
      mappedRow[targetField] = row[sourceField] || null;
    }
    return mappedRow;
  });
}

function generateDataSummary(processedData, templateType) {
  const summary = {
    totalSheets: Object.keys(processedData.sheets).length,
    totalRecords: processedData.totalRecords
  };

  if (templateType === 'cost-estimation') {
    const infraSheet = processedData.sheets['Infrastructure'];
    if (infraSheet) {
      const services = [...new Set(infraSheet.data.map(row => row.Service))];
      const regions = [...new Set(infraSheet.data.map(row => row.Region))];
      
      summary.uniqueServices = services.length;
      summary.uniqueRegions = regions.length;
      summary.services = services;
      summary.regions = regions;
    }
  }

  return summary;
}

function validateDataType(value, expectedType) {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return true;
  }
}

function getTemplateDescription(templateType) {
  const descriptions = {
    'cost-estimation': 'AWS cost estimation template with Infrastructure, Pricing, and Summary sheets'
  };
  return descriptions[templateType] || 'Template description not available';
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