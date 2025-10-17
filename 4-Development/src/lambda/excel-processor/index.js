const AWS = require('aws-sdk');
const XLSX = require('xlsx');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const { s3Bucket, s3Key, estimationId } = JSON.parse(event.body);
        
        console.log(`Processing Excel file: ${s3Key} for estimation: ${estimationId}`);
        
        // Download Excel file from S3
        const excelBuffer = await downloadFromS3(s3Bucket, s3Key);
        
        // Parse Excel sheets
        const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
        const parsedData = parseExcelSheets(workbook);
        
        // Validate data structure
        const validationResult = validateExcelData(parsedData);
        
        if (!validationResult.isValid) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Excel template validation failed',
                        errors: validationResult.errors
                    }
                })
            };
        }
        
        // Map Excel data to form structure
        const mappedData = mapExcelToFormData(parsedData);
        
        // Save mapped data to estimation
        if (estimationId) {
            await updateEstimationWithExcelData(estimationId, mappedData);
        }
        
        // Clean up temporary file
        await s3.deleteObject({ Bucket: s3Bucket, Key: s3Key }).promise();
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: {
                    validationResult,
                    mappedData,
                    estimationUpdated: !!estimationId
                }
            })
        };
        
    } catch (error) {
        console.error('Excel processing error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: {
                    code: 'PROCESSING_ERROR',
                    message: 'Failed to process Excel file',
                    details: error.message
                }
            })
        };
    }
};

async function downloadFromS3(bucket, key) {
    const params = { Bucket: bucket, Key: key };
    const result = await s3.getObject(params).promise();
    return result.Body;
}

function parseExcelSheets(workbook) {
    const requiredSheets = [
        'Client_Info',
        'Compute_Requirements', 
        'Storage_Requirements',
        'Network_CDN',
        'Database_Requirements',
        'Security_Compliance',
        'Cost_Summary',
        'AWS_Service_Mapping'
    ];
    
    const parsedData = {};
    
    for (const sheetName of requiredSheets) {
        if (workbook.SheetNames.includes(sheetName)) {
            const worksheet = workbook.Sheets[sheetName];
            parsedData[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        } else {
            console.warn(`Missing required sheet: ${sheetName}`);
        }
    }
    
    return parsedData;
}

function validateExcelData(parsedData) {
    const errors = [];
    const warnings = [];
    
    // Validate Client_Info sheet
    const clientInfo = parsedData.Client_Info;
    if (!clientInfo || clientInfo.length < 2) {
        errors.push({
            sheet: 'Client_Info',
            message: 'Client information sheet is empty or invalid'
        });
    } else {
        const clientData = parseClientInfo(clientInfo);
        if (!clientData.companyName) {
            errors.push({
                sheet: 'Client_Info',
                field: 'Company Name',
                message: 'Company name is required'
            });
        }
    }
    
    // Validate Compute_Requirements sheet
    const computeReqs = parsedData.Compute_Requirements;
    if (!computeReqs || computeReqs.length < 2) {
        errors.push({
            sheet: 'Compute_Requirements',
            message: 'At least one server configuration is required'
        });
    } else {
        validateComputeRequirements(computeReqs, errors, warnings);
    }
    
    // Validate Storage_Requirements sheet
    const storageReqs = parsedData.Storage_Requirements;
    if (storageReqs && storageReqs.length > 1) {
        validateStorageRequirements(storageReqs, errors, warnings);
    }
    
    // Validate Database_Requirements sheet
    const dbReqs = parsedData.Database_Requirements;
    if (dbReqs && dbReqs.length > 1) {
        validateDatabaseRequirements(dbReqs, errors, warnings);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sheetsValidated: Object.keys(parsedData).length
    };
}

function validateComputeRequirements(data, errors, warnings) {
    const headers = data[0];
    const cpuIndex = headers.indexOf('CPU_Cores');
    const ramIndex = headers.indexOf('RAM_GB');
    const nameIndex = headers.indexOf('Server_Name');
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        if (!row[nameIndex]) {
            errors.push({
                sheet: 'Compute_Requirements',
                row: i + 1,
                field: 'Server_Name',
                message: 'Server name is required'
            });
        }
        
        const cpuCores = parseInt(row[cpuIndex]);
        if (!cpuCores || cpuCores < 1 || cpuCores > 128) {
            errors.push({
                sheet: 'Compute_Requirements',
                row: i + 1,
                field: 'CPU_Cores',
                message: 'CPU cores must be between 1 and 128'
            });
        }
        
        const ramGB = parseInt(row[ramIndex]);
        if (!ramGB || ramGB < 1 || ramGB > 3904) {
            errors.push({
                sheet: 'Compute_Requirements',
                row: i + 1,
                field: 'RAM_GB',
                message: 'RAM must be between 1 and 3904 GB'
            });
        }
    }
}

function validateStorageRequirements(data, errors, warnings) {
    const headers = data[0];
    const sizeIndex = headers.indexOf('Current_GB');
    const typeIndex = headers.indexOf('Storage_Type');
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        if (!row[typeIndex]) {
            errors.push({
                sheet: 'Storage_Requirements',
                row: i + 1,
                field: 'Storage_Type',
                message: 'Storage type is required'
            });
        }
        
        const sizeGB = parseInt(row[sizeIndex]);
        if (!sizeGB || sizeGB < 1) {
            errors.push({
                sheet: 'Storage_Requirements',
                row: i + 1,
                field: 'Current_GB',
                message: 'Storage size must be greater than 0'
            });
        }
    }
}

function validateDatabaseRequirements(data, errors, warnings) {
    const headers = data[0];
    const nameIndex = headers.indexOf('Database_Name');
    const engineIndex = headers.indexOf('Engine');
    const sizeIndex = headers.indexOf('Size_GB');
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        if (!row[nameIndex]) {
            errors.push({
                sheet: 'Database_Requirements',
                row: i + 1,
                field: 'Database_Name',
                message: 'Database name is required'
            });
        }
        
        if (!row[engineIndex]) {
            errors.push({
                sheet: 'Database_Requirements',
                row: i + 1,
                field: 'Engine',
                message: 'Database engine is required'
            });
        }
        
        const sizeGB = parseInt(row[sizeIndex]);
        if (!sizeGB || sizeGB < 20) {
            warnings.push({
                sheet: 'Database_Requirements',
                row: i + 1,
                field: 'Size_GB',
                message: 'Database size should be at least 20 GB'
            });
        }
    }
}

function mapExcelToFormData(parsedData) {
    return {
        clientInfo: parseClientInfo(parsedData.Client_Info),
        computeRequirements: parseComputeRequirements(parsedData.Compute_Requirements),
        storageRequirements: parseStorageRequirements(parsedData.Storage_Requirements),
        networkRequirements: parseNetworkRequirements(parsedData.Network_CDN),
        databaseRequirements: parseDatabaseRequirements(parsedData.Database_Requirements),
        securityRequirements: parseSecurityRequirements(parsedData.Security_Compliance)
    };
}

function parseClientInfo(data) {
    if (!data || data.length < 2) return {};
    
    const clientInfo = {};
    for (let i = 1; i < data.length; i++) {
        const [field, value] = data[i];
        if (field && value) {
            switch (field) {
                case 'Company Name':
                    clientInfo.companyName = value;
                    break;
                case 'Industry':
                    clientInfo.industry = value;
                    break;
                case 'Primary Contact':
                    clientInfo.primaryContact = value;
                    break;
                case 'Email':
                    clientInfo.email = value;
                    break;
                case 'Phone':
                    clientInfo.phone = value;
                    break;
                case 'Timeline':
                    clientInfo.timeline = value;
                    break;
                case 'Budget Range':
                    clientInfo.budgetRange = value;
                    break;
            }
        }
    }
    
    return clientInfo;
}

function parseComputeRequirements(data) {
    if (!data || data.length < 2) return [];
    
    const headers = data[0];
    const requirements = [];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const requirement = {};
        
        headers.forEach((header, index) => {
            const value = row[index];
            if (value !== undefined && value !== '') {
                switch (header) {
                    case 'Server_Name':
                        requirement.serverName = value;
                        break;
                    case 'Environment':
                        requirement.environment = value;
                        break;
                    case 'CPU_Cores':
                        requirement.cpuCores = parseInt(value);
                        break;
                    case 'RAM_GB':
                        requirement.ramGB = parseInt(value);
                        break;
                    case 'OS':
                        requirement.os = value;
                        break;
                    case 'Criticality':
                        requirement.criticality = value;
                        break;
                    case 'Utilization_%':
                        requirement.utilizationPercent = parseInt(value);
                        break;
                    case 'Peak_Utilization_%':
                        requirement.peakUtilizationPercent = parseInt(value);
                        break;
                    case 'Scaling_Type':
                        requirement.scalingType = value;
                        break;
                    case 'Min_Instances':
                        requirement.minInstances = parseInt(value);
                        break;
                    case 'Max_Instances':
                        requirement.maxInstances = parseInt(value);
                        break;
                    case 'Monthly_Hours':
                        requirement.monthlyHours = parseInt(value);
                        break;
                    case 'Notes':
                        requirement.notes = value;
                        break;
                }
            }
        });
        
        if (requirement.serverName) {
            requirements.push(requirement);
        }
    }
    
    return requirements;
}

function parseStorageRequirements(data) {
    if (!data || data.length < 2) return [];
    
    const headers = data[0];
    const requirements = [];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const requirement = {};
        
        headers.forEach((header, index) => {
            const value = row[index];
            if (value !== undefined && value !== '') {
                switch (header) {
                    case 'Storage_Type':
                        requirement.storageType = value;
                        break;
                    case 'Current_GB':
                        requirement.currentGB = parseInt(value);
                        break;
                    case 'Growth_Rate_%':
                        requirement.growthRatePercent = parseInt(value);
                        break;
                    case 'IOPS_Required':
                        requirement.iopsRequired = parseInt(value);
                        break;
                    case 'Throughput_MBps':
                        requirement.throughputMBps = parseInt(value);
                        break;
                    case 'Backup_Required':
                        requirement.backupRequired = value === 'Yes' || value === true;
                        break;
                    case 'Retention_Days':
                        requirement.retentionDays = parseInt(value);
                        break;
                    case 'Access_Pattern':
                        requirement.accessPattern = value;
                        break;
                }
            }
        });
        
        if (requirement.storageType) {
            requirements.push(requirement);
        }
    }
    
    return requirements;
}

function parseNetworkRequirements(data) {
    if (!data || data.length < 2) return {};
    
    const networkReq = {};
    
    for (let i = 1; i < data.length; i++) {
        const [requirement, currentValue, futureValue] = data[i];
        
        if (requirement && futureValue !== undefined) {
            switch (requirement) {
                case 'Data Transfer Out (GB/month)':
                    networkReq.dataTransferOutGBMonth = parseInt(futureValue);
                    break;
                case 'Peak Bandwidth (Mbps)':
                    networkReq.peakBandwidthMbps = parseInt(futureValue);
                    break;
                case 'Load Balancer':
                    networkReq.loadBalancerCount = parseInt(futureValue);
                    break;
            }
        }
    }
    
    return networkReq;
}

function parseDatabaseRequirements(data) {
    if (!data || data.length < 2) return [];
    
    const headers = data[0];
    const requirements = [];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const requirement = {};
        
        headers.forEach((header, index) => {
            const value = row[index];
            if (value !== undefined && value !== '') {
                switch (header) {
                    case 'Database_Name':
                        requirement.databaseName = value;
                        break;
                    case 'Engine':
                        requirement.engine = value;
                        break;
                    case 'Version':
                        requirement.version = value;
                        break;
                    case 'Size_GB':
                        requirement.sizeGB = parseInt(value);
                        break;
                    case 'Instance_Class':
                        requirement.instanceClass = value;
                        break;
                    case 'Multi_AZ':
                        requirement.multiAZ = value === 'Yes' || value === true;
                        break;
                    case 'Read_Replicas':
                        requirement.readReplicas = parseInt(value) || 0;
                        break;
                    case 'Backup_Retention':
                        requirement.backupRetention = parseInt(value);
                        break;
                    case 'Encryption':
                        requirement.encryptionEnabled = value === 'Yes' || value === true;
                        break;
                }
            }
        });
        
        if (requirement.databaseName) {
            requirements.push(requirement);
        }
    }
    
    return requirements;
}

function parseSecurityRequirements(data) {
    if (!data || data.length < 2) return {};
    
    const securityReq = {};
    
    for (let i = 1; i < data.length; i++) {
        const [service, required] = data[i];
        
        if (service && required !== undefined) {
            const isRequired = required === 'Yes' || required === true;
            
            switch (service) {
                case 'AWS Config':
                    securityReq.awsConfig = isRequired;
                    break;
                case 'CloudTrail':
                    securityReq.cloudTrail = isRequired;
                    break;
                case 'GuardDuty':
                    securityReq.guardDuty = isRequired;
                    break;
                case 'Security Hub':
                    securityReq.securityHub = isRequired;
                    break;
                case 'Inspector':
                    securityReq.inspector = isRequired;
                    break;
                case 'Macie':
                    securityReq.macie = isRequired;
                    break;
                case 'KMS':
                    securityReq.kms = isRequired;
                    break;
                case 'Secrets Manager':
                    securityReq.secretsManager = isRequired;
                    break;
            }
        }
    }
    
    return securityReq;
}

async function updateEstimationWithExcelData(estimationId, mappedData) {
    const params = {
        TableName: process.env.MAIN_TABLE,
        Key: {
            PK: `ESTIMATION#${estimationId}`,
            SK: 'REQUIREMENTS'
        },
        UpdateExpression: 'SET #clientInfo = :clientInfo, #computeReqs = :computeReqs, #storageReqs = :storageReqs, #networkReqs = :networkReqs, #dbReqs = :dbReqs, #securityReqs = :securityReqs, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#clientInfo': 'ClientInfo',
            '#computeReqs': 'ComputeRequirements',
            '#storageReqs': 'StorageRequirements',
            '#networkReqs': 'NetworkRequirements',
            '#dbReqs': 'DatabaseRequirements',
            '#securityReqs': 'SecurityRequirements',
            '#updatedAt': 'UpdatedAt'
        },
        ExpressionAttributeValues: {
            ':clientInfo': mappedData.clientInfo,
            ':computeReqs': mappedData.computeRequirements,
            ':storageReqs': mappedData.storageRequirements,
            ':networkReqs': mappedData.networkRequirements,
            ':dbReqs': mappedData.databaseRequirements,
            ':securityReqs': mappedData.securityRequirements,
            ':updatedAt': new Date().toISOString()
        }
    };
    
    await dynamodb.update(params).promise();
}