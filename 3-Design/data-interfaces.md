# Data Interfaces: AWS Cost Estimation Platform

## Document Information
- **Project:** AWS Cost Estimation Platform for Sagesoft Solutions Inc.
- **Phase:** 3 - System Design
- **Date:** 2024-01-15
- **Version:** 1.0

## 1. API Data Interfaces

### 1.1 Authentication Interfaces

#### Login Request
```json
{
  "endpoint": "POST /auth/login",
  "request": {
    "email": "string (required, email format)",
    "password": "string (required, min 8 chars)",
    "rememberMe": "boolean (optional, default false)"
  },
  "response": {
    "success": "boolean",
    "data": {
      "accessToken": "string (JWT token)",
      "refreshToken": "string (JWT token)",
      "expiresIn": "number (seconds)",
      "tokenType": "string (Bearer)",
      "user": {
        "userId": "string (UUID)",
        "email": "string",
        "firstName": "string",
        "lastName": "string",
        "role": "string (Sales|PreSales|Admin)"
      }
    }
  }
}
```

#### User Profile Interface
```json
{
  "endpoint": "GET /users/me",
  "response": {
    "success": "boolean",
    "data": {
      "userId": "string (UUID)",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "string",
      "department": "string",
      "isActive": "boolean",
      "createdAt": "string (ISO 8601)",
      "lastLoginAt": "string (ISO 8601)",
      "preferences": {
        "defaultCurrency": "string (USD|EUR|GBP)",
        "defaultRegion": "string (AWS region)",
        "notificationSettings": {
          "emailNotifications": "boolean",
          "documentReady": "boolean",
          "sharedEstimations": "boolean"
        }
      }
    }
  }
}
```

### 1.2 Estimation Interfaces

#### Create Estimation Request
```json
{
  "endpoint": "POST /estimations",
  "request": {
    "projectName": "string (required, 3-100 chars)",
    "description": "string (optional, max 500 chars)",
    "inputMethod": "string (EXCEL_UPLOAD|MANUAL_ENTRY)",
    "clientInfo": {
      "companyName": "string (required, 2-100 chars)",
      "industry": "string (required)",
      "primaryContact": "string (required)",
      "email": "string (required, email format)",
      "phone": "string (optional)",
      "timeline": "string (optional)",
      "budgetRange": "string (optional)",
      "regionPreference": ["string (AWS regions)"],
      "complianceRequirements": ["string (SOC2|HIPAA|PCI-DSS|GDPR)"]
    }
  },
  "response": {
    "success": "boolean",
    "data": {
      "estimationId": "string (UUID)",
      "projectName": "string",
      "status": "string (DRAFT|ACTIVE|ARCHIVED)",
      "createdAt": "string (ISO 8601)"
    }
  }
}
```

#### Estimation Details Response
```json
{
  "endpoint": "GET /estimations/{estimationId}",
  "response": {
    "success": "boolean",
    "data": {
      "estimationId": "string (UUID)",
      "projectName": "string",
      "description": "string",
      "status": "string",
      "inputMethod": "string",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)",
      "clientInfo": {
        "companyName": "string",
        "industry": "string",
        "primaryContact": "string",
        "email": "string",
        "phone": "string",
        "timeline": "string",
        "budgetRange": "string",
        "regionPreference": ["string"],
        "complianceRequirements": ["string"]
      },
      "requirements": {
        "computeRequirements": [
          {
            "serverName": "string",
            "environment": "string (Production|Staging|Development)",
            "cpuCores": "number (1-128)",
            "ramGB": "number (1-3904)",
            "os": "string (Linux|Windows)",
            "criticality": "string (Low|Medium|High|Critical)",
            "utilizationPercent": "number (10-100)",
            "peakUtilizationPercent": "number (10-100)",
            "scalingType": "string (Manual|Auto|Scheduled)",
            "minInstances": "number (1-100)",
            "maxInstances": "number (1-1000)",
            "monthlyHours": "number (1-744)",
            "notes": "string (optional)"
          }
        ],
        "storageRequirements": [
          {
            "storageType": "string",
            "currentGB": "number (min 1)",
            "growthRatePercent": "number (0-1000)",
            "iopsRequired": "number (100-64000)",
            "throughputMBps": "number (125-4000)",
            "backupRequired": "boolean",
            "retentionDays": "number (1-2555)",
            "accessPattern": "string (Frequent|Infrequent|Archive)"
          }
        ],
        "networkRequirements": {
          "dataTransferOutGBMonth": "number (min 0)",
          "peakBandwidthMbps": "number (1-100000)",
          "loadBalancerCount": "number (0-100)",
          "sslCertificateRequired": "boolean",
          "wafRequired": "boolean",
          "ddosProtectionRequired": "boolean",
          "globalDistributionRequired": "boolean"
        },
        "databaseRequirements": [
          {
            "databaseName": "string",
            "engine": "string (MySQL|PostgreSQL|Oracle|SQL Server)",
            "version": "string",
            "sizeGB": "number (20-65536)",
            "instanceClass": "string (AWS RDS instance class)",
            "multiAZ": "boolean",
            "readReplicas": "number (0-15)",
            "backupRetention": "number (0-35)",
            "encryptionEnabled": "boolean"
          }
        ],
        "securityRequirements": {
          "awsConfig": "boolean",
          "cloudTrail": "boolean",
          "guardDuty": "boolean",
          "securityHub": "boolean",
          "inspector": "boolean",
          "macie": "boolean",
          "kms": "boolean",
          "secretsManager": "boolean"
        }
      },
      "estimationSummary": {
        "totalMonthlyCost": "number",
        "totalAnnualCost": "number",
        "currency": "string",
        "lastCalculatedAt": "string (ISO 8601)",
        "costBreakdown": {
          "compute": "number",
          "storage": "number",
          "database": "number",
          "network": "number",
          "security": "number"
        }
      }
    }
  }
}
```

### 1.3 Cost Calculation Interfaces

#### Cost Calculation Request
```json
{
  "endpoint": "POST /calculations/cost",
  "request": {
    "estimationId": "string (UUID)",
    "region": "string (AWS region, default us-east-1)",
    "pricingModel": "string (ON_DEMAND|RESERVED|SPOT)",
    "currency": "string (USD|EUR|GBP, default USD)",
    "requirements": {
      "computeRequirements": ["object (as defined above)"],
      "storageRequirements": ["object (as defined above)"],
      "networkRequirements": "object (as defined above)",
      "databaseRequirements": ["object (as defined above)"],
      "securityRequirements": "object (as defined above)"
    }
  },
  "response": {
    "success": "boolean",
    "data": {
      "calculationId": "string (UUID)",
      "calculatedAt": "string (ISO 8601)",
      "region": "string",
      "currency": "string",
      "pricingModel": "string",
      "totalMonthlyCost": "number",
      "totalAnnualCost": "number",
      "costBreakdown": {
        "compute": {
          "ec2Instances": "number",
          "autoScaling": "number",
          "total": "number",
          "details": [
            {
              "serverName": "string",
              "instanceType": "string",
              "instances": "number",
              "hourlyCost": "number",
              "monthlyCost": "number",
              "annualCost": "number"
            }
          ]
        },
        "storage": {
          "ebs": "number",
          "s3": "number",
          "total": "number",
          "details": [
            {
              "storageType": "string",
              "serviceType": "string",
              "sizeGB": "number",
              "monthlyCost": "number",
              "annualCost": "number"
            }
          ]
        },
        "database": {
          "rds": "number",
          "elasticache": "number",
          "total": "number",
          "details": [
            {
              "databaseName": "string",
              "engine": "string",
              "instanceClass": "string",
              "multiAZ": "boolean",
              "readReplicas": "number",
              "monthlyCost": "number",
              "annualCost": "number"
            }
          ]
        },
        "network": {
          "dataTransfer": "number",
          "cloudFront": "number",
          "loadBalancer": "number",
          "total": "number"
        },
        "security": {
          "guardDuty": "number",
          "cloudTrail": "number",
          "kms": "number",
          "awsConfig": "number",
          "total": "number"
        }
      },
      "businessRulesApplied": {
        "bufferPercentage": "number",
        "volumeDiscounts": "boolean",
        "supportPlanIncluded": "boolean",
        "supportPlanCost": "number"
      },
      "recommendations": [
        {
          "type": "string (COST_OPTIMIZATION|PERFORMANCE|SECURITY)",
          "message": "string",
          "potentialSavings": "number (optional)"
        }
      ]
    }
  }
}
```

### 1.4 Excel Processing Interfaces

#### Excel Upload Response
```json
{
  "endpoint": "POST /excel/upload",
  "request": {
    "file": "multipart/form-data (Excel file)",
    "estimationId": "string (UUID, optional)"
  },
  "response": {
    "success": "boolean",
    "data": {
      "uploadId": "string (UUID)",
      "fileName": "string",
      "fileSize": "number (bytes)",
      "uploadedAt": "string (ISO 8601)",
      "status": "string (UPLOADED|PROCESSING|COMPLETED|FAILED)"
    }
  }
}
```

#### Excel Validation Response
```json
{
  "endpoint": "POST /excel/validate",
  "request": {
    "uploadId": "string (UUID)"
  },
  "response": {
    "success": "boolean",
    "data": {
      "validationId": "string (UUID)",
      "isValid": "boolean",
      "sheetsValidated": "number",
      "errors": [
        {
          "sheet": "string (sheet name)",
          "row": "number (optional)",
          "column": "string (optional)",
          "field": "string (optional)",
          "message": "string",
          "severity": "string (ERROR|WARNING)"
        }
      ],
      "warnings": [
        {
          "sheet": "string",
          "row": "number (optional)",
          "column": "string (optional)",
          "field": "string (optional)",
          "message": "string"
        }
      ],
      "summary": {
        "clientInfo": "string (Valid|Invalid|Missing)",
        "computeRequirements": "string (e.g., Valid (3 servers))",
        "storageRequirements": "string (e.g., Valid (4 storage types))",
        "networkRequirements": "string",
        "databaseRequirements": "string (e.g., Valid (2 databases))",
        "securityRequirements": "string"
      }
    }
  }
}
```

### 1.5 Document Generation Interfaces

#### Document Generation Request
```json
{
  "endpoint": "POST /documents/generate",
  "request": {
    "estimationId": "string (UUID)",
    "documentType": "string (PDF_PROPOSAL|WORD_DOCUMENT|EXCEL_EXPORT)",
    "template": "string (standard|executive|technical, default standard)",
    "options": {
      "includeExecutiveSummary": "boolean (default true)",
      "includeDetailedBreakdown": "boolean (default true)",
      "includeArchitectureDiagram": "boolean (default false)",
      "branding": "string (sagesoft|custom, default sagesoft)",
      "customizations": {
        "logoUrl": "string (optional)",
        "primaryColor": "string (hex color, optional)",
        "companyAddress": "string (optional)"
      }
    }
  },
  "response": {
    "success": "boolean",
    "data": {
      "documentId": "string (UUID)",
      "status": "string (GENERATING|COMPLETED|FAILED)",
      "estimatedCompletionTime": "string (ISO 8601, optional)",
      "documentType": "string"
    }
  }
}
```

#### Document Status Response
```json
{
  "endpoint": "GET /documents/{documentId}/status",
  "response": {
    "success": "boolean",
    "data": {
      "documentId": "string (UUID)",
      "status": "string (GENERATING|COMPLETED|FAILED)",
      "documentType": "string",
      "fileName": "string (when completed)",
      "fileSize": "number (bytes, when completed)",
      "generatedAt": "string (ISO 8601, when completed)",
      "downloadUrl": "string (presigned URL, when completed)",
      "expiresAt": "string (ISO 8601, when completed)",
      "error": {
        "code": "string (when failed)",
        "message": "string (when failed)"
      }
    }
  }
}
```

## 2. Database Interfaces

### 2.1 DynamoDB Item Structures

#### User Entity
```json
{
  "PK": "USER#user123",
  "SK": "PROFILE",
  "GSI1PK": "USER#email@company.com",
  "GSI1SK": "PROFILE",
  "EntityType": "User",
  "UserId": "string (UUID)",
  "Email": "string (email format)",
  "FirstName": "string",
  "LastName": "string",
  "Role": "string (Sales|PreSales|Admin)",
  "Department": "string",
  "IsActive": "boolean",
  "CreatedAt": "string (ISO 8601)",
  "UpdatedAt": "string (ISO 8601)",
  "LastLoginAt": "string (ISO 8601)",
  "Preferences": {
    "DefaultCurrency": "string",
    "DefaultRegion": "string",
    "NotificationSettings": {
      "EmailNotifications": "boolean",
      "DocumentReady": "boolean",
      "SharedEstimations": "boolean"
    }
  },
  "MFAEnabled": "boolean",
  "TTL": "number (optional, for temporary users)"
}
```

#### Estimation Entity
```json
{
  "PK": "ESTIMATION#est456",
  "SK": "METADATA",
  "GSI1PK": "USER#user123",
  "GSI1SK": "ESTIMATION#2024-01-15T10:00:00Z",
  "GSI2PK": "STATUS#ACTIVE",
  "GSI2SK": "ESTIMATION#est456",
  "EntityType": "Estimation",
  "EstimationId": "string (UUID)",
  "UserId": "string (UUID)",
  "ProjectName": "string",
  "Description": "string",
  "Status": "string (DRAFT|ACTIVE|ARCHIVED|DELETED)",
  "InputMethod": "string (EXCEL_UPLOAD|MANUAL_ENTRY)",
  "CreatedAt": "string (ISO 8601)",
  "UpdatedAt": "string (ISO 8601)",
  "ClientInfo": "object (as defined in API)",
  "EstimationSummary": {
    "TotalMonthlyCost": "number",
    "TotalAnnualCost": "number",
    "Currency": "string",
    "LastCalculatedAt": "string (ISO 8601)",
    "CostBreakdown": "object"
  },
  "SharedWith": ["string (user IDs)"],
  "Tags": ["string"],
  "TTL": "number (optional, for temporary estimations)"
}
```

#### Pricing Data Entity
```json
{
  "PK": "PRICING#EC2",
  "SK": "us-east-1#t3.xlarge",
  "GSI1PK": "REGION#us-east-1",
  "GSI1SK": "PRICING#EC2#t3.xlarge",
  "EntityType": "PricingData",
  "ServiceType": "string (EC2|RDS|S3|EBS)",
  "Region": "string (AWS region)",
  "InstanceType": "string (optional, for compute services)",
  "PricingModel": "string (ON_DEMAND|RESERVED|SPOT)",
  "PricePerHour": "number (optional)",
  "PricePerGB": "number (optional)",
  "Currency": "string",
  "LastUpdated": "string (ISO 8601)",
  "Source": "string (AWS_PRICING_API|MANUAL)",
  "Specifications": {
    "vCPUs": "number (optional)",
    "Memory": "string (optional)",
    "NetworkPerformance": "string (optional)",
    "EBSOptimized": "boolean (optional)"
  },
  "TTL": "number (expiration timestamp)"
}
```

## 3. External Service Interfaces

### 3.1 AWS Cognito Integration

#### User Pool Configuration
```json
{
  "UserPoolName": "aws-cost-estimation-users-{environment}",
  "Policies": {
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": true
    }
  },
  "MfaConfiguration": "OPTIONAL",
  "Schema": [
    {
      "Name": "email",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    },
    {
      "Name": "given_name",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    },
    {
      "Name": "family_name",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    },
    {
      "Name": "custom:role",
      "AttributeDataType": "String",
      "Required": false,
      "Mutable": true
    }
  ]
}
```

### 3.2 S3 Storage Interfaces

#### Document Storage Structure
```
Bucket: aws-cost-estimation-documents-{environment}
├── proposals/
│   ├── {estimationId}/
│   │   ├── {timestamp}_{filename}.pdf
│   │   └── {timestamp}_{filename}.docx
├── exports/
│   ├── {estimationId}/
│   │   └── {timestamp}_{filename}.xlsx
└── templates/
    ├── proposal_template.pdf
    ├── word_template.docx
    └── excel_template.xlsx
```

#### Upload Storage Structure
```
Bucket: aws-cost-estimation-uploads-{environment}
├── temp/
│   ├── {uploadId}/
│   │   └── {original_filename}
└── processed/
    ├── {estimationId}/
    │   └── {processed_filename}
```

### 3.3 CloudWatch Metrics Interface

#### Custom Metrics
```json
{
  "MetricName": "CostCalculationTime",
  "Namespace": "AWSCostPlatform",
  "Dimensions": [
    {
      "Name": "Environment",
      "Value": "prod"
    },
    {
      "Name": "Region",
      "Value": "us-east-1"
    }
  ],
  "Value": 1.5,
  "Unit": "Seconds",
  "Timestamp": "2024-01-15T10:30:00Z"
}
```

## 4. Error Response Interfaces

### 4.1 Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "string (error code)",
    "message": "string (user-friendly message)",
    "details": "string (technical details, optional)",
    "field": "string (field name for validation errors, optional)",
    "timestamp": "string (ISO 8601)",
    "requestId": "string (UUID for tracking)"
  }
}
```

### 4.2 Validation Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      },
      {
        "field": "cpuCores",
        "message": "CPU cores must be between 1 and 128",
        "value": 0
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

## 5. Data Validation Rules

### 5.1 Input Validation Patterns

#### Email Validation
```regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

#### Phone Validation (International)
```regex
^\+?[1-9]\d{1,14}$
```

#### AWS Region Validation
```javascript
const validRegions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1'
];
```

#### Currency Validation
```javascript
const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
```

### 5.2 Business Rule Validation

#### Cost Calculation Rules
```javascript
const businessRules = {
  bufferPercentage: 10, // 10% buffer for pricing fluctuations
  minimumSupportPlan: 'Business', // Minimum support plan level
  volumeDiscountThreshold: 10000, // Monthly cost threshold for volume discounts
  maxInstancesPerServer: 1000, // Maximum instances in auto-scaling group
  maxStorageSizeGB: 1000000, // Maximum storage size in GB
  maxDatabaseSizeGB: 65536 // Maximum RDS database size in GB
};
```

## 6. Data Transformation Interfaces

### 6.1 Excel to API Mapping
```javascript
const excelToApiMapping = {
  'Client_Info': {
    'Company Name': 'clientInfo.companyName',
    'Industry': 'clientInfo.industry',
    'Primary Contact': 'clientInfo.primaryContact',
    'Email': 'clientInfo.email',
    'Phone': 'clientInfo.phone',
    'Timeline': 'clientInfo.timeline',
    'Budget Range': 'clientInfo.budgetRange'
  },
  'Compute_Requirements': {
    'Server_Name': 'computeRequirements[].serverName',
    'CPU_Cores': 'computeRequirements[].cpuCores',
    'RAM_GB': 'computeRequirements[].ramGB',
    'OS': 'computeRequirements[].os',
    'Environment': 'computeRequirements[].environment',
    'Utilization_%': 'computeRequirements[].utilizationPercent',
    'Scaling_Type': 'computeRequirements[].scalingType',
    'Min_Instances': 'computeRequirements[].minInstances',
    'Max_Instances': 'computeRequirements[].maxInstances'
  }
};
```

### 6.2 API to Document Mapping
```javascript
const apiToDocumentMapping = {
  pdf: {
    clientInfo: 'Client Information Section',
    costBreakdown: 'Cost Analysis Section',
    recommendations: 'Recommendations Section',
    terms: 'Terms and Conditions Section'
  },
  word: {
    clientInfo: 'Document Header',
    requirements: 'Technical Requirements Table',
    costBreakdown: 'Cost Summary Table',
    recommendations: 'Recommendations List'
  },
  excel: {
    summary: 'Summary Sheet',
    breakdown: 'Cost Breakdown Sheet',
    requirements: 'Requirements Sheet',
    recommendations: 'Recommendations Sheet'
  }
};
```

This comprehensive data interfaces documentation ensures consistent data handling, validation, and transformation throughout the AWS Cost Estimation Platform.