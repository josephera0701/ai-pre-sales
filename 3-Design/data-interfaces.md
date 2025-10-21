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
      "clientId": "string (UUID, auto-generated)",
      "companyName": "string (required, 2-100 chars)",
      "industryType": "string (required, from dropdown)",
      "companySize": "string (Startup|SME|Enterprise)",
      "primaryContactName": "string (required)",
      "primaryContactEmail": "string (required, email format)",
      "primaryContactPhone": "string (phone format)",
      "technicalContactName": "string (optional)",
      "technicalContactEmail": "string (optional, email format)",
      "projectDescription": "string (max 500 chars)",
      "projectTimelineMonths": "number (1-60)",
      "budgetRange": "string (from dropdown)",
      "primaryAwsRegion": "string (AWS region)",
      "secondaryAwsRegions": ["string (AWS regions)"],
      "complianceRequirements": ["string (GDPR|HIPAA|SOC2|PCI_DSS|ISO27001|FedRAMP)"],
      "businessCriticality": "string (Low|Medium|High|Critical)",
      "disasterRecoveryRequired": "boolean",
      "multiRegionRequired": "boolean",
      "createdDate": "string (ISO 8601, auto-populated)",
      "lastModified": "string (ISO 8601, auto-populated)"
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
            "computeId": "string (UUID, auto-generated)",
            "clientId": "string (UUID, reference)",
            "serverName": "string (required, unique within project)",
            "environmentType": "string (Production|Staging|Development|Testing)",
            "workloadType": "string (Web|Database|Analytics|ML|Batch)",
            "cpuCores": "number (1-128)",
            "ramGB": "number (1-3904)",
            "operatingSystem": "string (Amazon_Linux|Ubuntu|Windows|RHEL)",
            "architecture": "string (x86_64|ARM64)",
            "businessCriticality": "string (Low|Medium|High|Critical)",
            "averageUtilizationPercent": "number (10-100)",
            "peakUtilizationPercent": "number (average_util to 100)",
            "scalingType": "string (Manual|Auto|Scheduled|Predictive)",
            "minInstances": "number (1-100)",
            "maxInstances": "number (min_instances to 1000)",
            "monthlyRuntimeHours": "number (1-744)",
            "storageType": "string (EBS_GP3|EBS_IO2|Instance_Store)",
            "rootVolumeSizeGB": "number (8-16384)",
            "additionalStorageGB": "number (0-65536)",
            "networkPerformance": "string (Low|Moderate|High|Up_to_10Gbps|25Gbps|100Gbps)",
            "placementGroupRequired": "boolean",
            "dedicatedTenancyRequired": "boolean",
            "hibernationSupportRequired": "boolean",
            "suggestedInstanceType": "string (auto-calculated)",
            "estimatedMonthlyCost": "number (auto-calculated)",
            "optimizationRecommendations": "string (auto-populated)"
          }
        ],
        "storageRequirements": [
          {
            "storageId": "string (UUID, auto-generated)",
            "clientId": "string (UUID, reference)",
            "storageName": "string (required)",
            "storagePurpose": "string (Application_Data|Database|Media|Backup|Archive|Logs)",
            "currentSizeGB": "number (1-unlimited)",
            "projectedGrowthRatePercent": "number (0-1000)",
            "projectedSize12MonthsGB": "number (auto-calculated)",
            "accessPattern": "string (Frequent|Infrequent|Archive|Intelligent_Tiering)",
            "iopsRequired": "number (100-64000)",
            "throughputMbpsRequired": "number (125-4000)",
            "durabilityRequirement": "string (Standard|High|Maximum)",
            "availabilityRequirement": "string (Standard|High|Maximum)",
            "encryptionRequired": "boolean",
            "backupRequired": "boolean",
            "backupFrequency": "string (Hourly|Daily|Weekly|Monthly)",
            "backupRetentionDays": "number (1-2555)",
            "crossRegionReplication": "boolean",
            "versioningRequired": "boolean",
            "lifecycleManagementRequired": "boolean",
            "complianceRequirements": ["string (multi-select)"],
            "suggestedAwsService": "string (auto-calculated)",
            "suggestedStorageClass": "string (auto-calculated)",
            "estimatedMonthlyCost": "number (auto-calculated)",
            "optimizationRecommendations": "string (auto-populated)"
          }
        ],
        "networkRequirements": {
          "networkId": "string (UUID, auto-generated)",
          "clientId": "string (UUID, reference)",
          "dataTransferOutGBMonthly": "number (0-unlimited)",
          "dataTransferInGBMonthly": "number (0-unlimited)",
          "peakBandwidthMbps": "number (1-100000)",
          "concurrentUsersExpected": "number (1-1000000)",
          "geographicDistribution": ["string (multi-select regions)"],
          "loadBalancerCount": "number (0-100)",
          "loadBalancerType": "string (ALB|NLB|CLB)",
          "sslCertificateRequired": "boolean",
          "sslCertificateType": "string (Single|Wildcard|Multi_Domain)",
          "wafRequired": "boolean",
          "ddosProtectionRequired": "boolean",
          "cdnRequired": "boolean",
          "cdnCacheBehavior": "string (Cache_Everything|Cache_Static|Custom)",
          "edgeLocationsRequired": ["string (multi-select)"],
          "apiGatewayRequired": "boolean",
          "apiCallsMonthly": "number (0-unlimited)",
          "vpnConnectionsRequired": "number (0-100)",
          "directConnectRequired": "boolean",
          "bandwidthDirectConnectMbps": "number (50-100000)",
          "estimatedMonthlyCost": "number (auto-calculated)",
          "optimizationRecommendations": "string (auto-populated)"
        },
        "databaseRequirements": [
          {
            "databaseId": "string (UUID, auto-generated)",
            "clientId": "string (UUID, reference)",
            "databaseName": "string (required)",
            "databasePurpose": "string (OLTP|OLAP|Data_Warehouse|Cache|Search)",
            "engineType": "string (MySQL|PostgreSQL|Oracle|SQL_Server|Aurora_MySQL|Aurora_PostgreSQL|DynamoDB|ElastiCache)",
            "engineVersion": "string (dependent on engine_type)",
            "databaseSizeGB": "number (20-65536)",
            "expectedGrowthRatePercent": "number (0-1000)",
            "instanceClass": "string (dependent on engine)",
            "cpuCores": "number (1-128)",
            "ramGB": "number (1-3904)",
            "storageType": "string (GP2|GP3|IO1|IO2|Magnetic)",
            "iopsRequired": "number (100-80000)",
            "multiAzRequired": "boolean",
            "readReplicasCount": "number (0-15)",
            "readReplicaRegions": ["string (multi-select)"],
            "backupRetentionDays": "number (0-35)",
            "backupWindowPreferred": "string (time format)",
            "maintenanceWindowPreferred": "string (time format)",
            "encryptionAtRestRequired": "boolean",
            "encryptionInTransitRequired": "boolean",
            "performanceInsightsRequired": "boolean",
            "monitoringEnhancedRequired": "boolean",
            "connectionPoolingRequired": "boolean",
            "estimatedMonthlyCost": "number (auto-calculated)",
            "optimizationRecommendations": "string (auto-populated)"
          }
        ],
        "securityRequirements": {
          "securityId": "string (UUID, auto-generated)",
          "clientId": "string (UUID, reference)",
          "complianceFrameworks": ["string (GDPR|HIPAA|SOC2|PCI_DSS|ISO27001|FedRAMP)"],
          "dataClassification": "string (Public|Internal|Confidential|Restricted)",
          "awsConfigRequired": "boolean",
          "cloudtrailRequired": "boolean",
          "cloudtrailDataEvents": "boolean",
          "guarddutyRequired": "boolean",
          "securityHubRequired": "boolean",
          "inspectorRequired": "boolean",
          "macieRequired": "boolean",
          "kmsRequired": "boolean",
          "secretsManagerRequired": "boolean",
          "certificateManagerRequired": "boolean",
          "iamAccessAnalyzerRequired": "boolean",
          "vpcFlowLogsRequired": "boolean",
          "wafRequired": "boolean",
          "shieldAdvancedRequired": "boolean",
          "firewallManagerRequired": "boolean",
          "networkFirewallRequired": "boolean",
          "penetrationTestingRequired": "boolean",
          "vulnerabilityScanningRequired": "boolean",
          "securityTrainingRequired": "boolean",
          "incidentResponsePlanRequired": "boolean",
          "estimatedMonthlyCost": "number (auto-calculated)",
          "complianceGapAnalysis": "string (auto-populated)"
        }
      },
      "estimationSummary": {
        "summaryId": "string (UUID, auto-generated)",
        "computeMonthlyCost": "number (auto-calculated)",
        "storageMonthlyCost": "number (auto-calculated)",
        "networkMonthlyCost": "number (auto-calculated)",
        "databaseMonthlyCost": "number (auto-calculated)",
        "securityMonthlyCost": "number (auto-calculated)",
        "supportMonthlyCost": "number (auto-calculated)",
        "totalMonthlyCost": "number (auto-calculated)",
        "totalQuarterlyCost": "number (auto-calculated)",
        "totalAnnualCost": "number (auto-calculated)",
        "reservedInstanceSavingsPotential": "number (auto-calculated)",
        "spotInstanceSavingsPotential": "number (auto-calculated)",
        "savingsPlanSavingsPotential": "number (auto-calculated)",
        "optimizationSavingsPotential": "number (auto-calculated)",
        "costBreakdownByService": "object (JSON format)",
        "costBreakdownByRegion": "object (JSON format)",
        "costTrendProjection": "object (JSON format)",
        "budgetVariancePercent": "number (auto-calculated)",
        "costOptimizationScore": "number (auto-calculated)",
        "currency": "string",
        "lastCalculatedAt": "string (ISO 8601)",
        "lastUpdated": "string (ISO 8601, auto-populated)"
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

## 6. Validation Rules Interface

### 6.1 Validation Rules Response
```json
{
  "endpoint": "GET /validation/rules",
  "response": {
    "success": "boolean",
    "data": [
      {
        "fieldName": "string",
        "validationType": "string (dropdown|number|text|date|email|phone)",
        "validationRule": "string",
        "errorMessage": "string",
        "requiredField": "boolean",
        "dependentField": "string (optional)",
        "dependencyCondition": "string (optional)"
      }
    ]
  }
}
```

### 6.2 Dropdown Lists Interface
```json
{
  "endpoint": "GET /dropdown/lists",
  "response": {
    "success": "boolean",
    "data": {
      "industryTypes": ["string"],
      "companySizes": ["Startup", "SME", "Enterprise"],
      "budgetRanges": ["string"],
      "awsRegions": ["string"],
      "complianceFrameworks": ["GDPR", "HIPAA", "SOC2", "PCI_DSS", "ISO27001", "FedRAMP"],
      "workloadTypes": ["Web", "Database", "Analytics", "ML", "Batch"],
      "operatingSystems": ["Amazon_Linux", "Ubuntu", "Windows", "RHEL"],
      "architectures": ["x86_64", "ARM64"],
      "scalingTypes": ["Manual", "Auto", "Scheduled", "Predictive"],
      "storageTypes": ["EBS_GP3", "EBS_IO2", "Instance_Store"],
      "networkPerformance": ["Low", "Moderate", "High", "Up_to_10Gbps", "25Gbps", "100Gbps"],
      "storagePurposes": ["Application_Data", "Database", "Media", "Backup", "Archive", "Logs"],
      "accessPatterns": ["Frequent", "Infrequent", "Archive", "Intelligent_Tiering"],
      "backupFrequencies": ["Hourly", "Daily", "Weekly", "Monthly"],
      "loadBalancerTypes": ["ALB", "NLB", "CLB"],
      "sslCertificateTypes": ["Single", "Wildcard", "Multi_Domain"],
      "databasePurposes": ["OLTP", "OLAP", "Data_Warehouse", "Cache", "Search"],
      "databaseEngines": ["MySQL", "PostgreSQL", "Oracle", "SQL_Server", "Aurora_MySQL", "Aurora_PostgreSQL", "DynamoDB", "ElastiCache"],
      "storageClasses": ["GP2", "GP3", "IO1", "IO2", "Magnetic"],
      "dataClassifications": ["Public", "Internal", "Confidential", "Restricted"]
    }
  }
}
```

### 6.3 Service Mapping Interface
```json
{
  "endpoint": "GET /service/mapping",
  "response": {
    "success": "boolean",
    "data": [
      {
        "requirementType": "string",
        "requirementValue": "string",
        "suggestedAwsService": "string",
        "alternativeServices": ["string"],
        "costFactor": "number",
        "optimizationNotes": "string"
      }
    ]
  }
}
```

## 7. Data Transformation Interfaces

### 7.1 Enhanced Excel to API Mapping
```javascript
const excelToApiMapping = {
  'Client_Info_Enhanced': {
    'client_id': 'clientInfo.clientId',
    'company_name': 'clientInfo.companyName',
    'industry_type': 'clientInfo.industryType',
    'company_size': 'clientInfo.companySize',
    'primary_contact_name': 'clientInfo.primaryContactName',
    'primary_contact_email': 'clientInfo.primaryContactEmail',
    'primary_contact_phone': 'clientInfo.primaryContactPhone',
    'technical_contact_name': 'clientInfo.technicalContactName',
    'technical_contact_email': 'clientInfo.technicalContactEmail',
    'project_name': 'projectName',
    'project_description': 'clientInfo.projectDescription',
    'project_timeline_months': 'clientInfo.projectTimelineMonths',
    'budget_range': 'clientInfo.budgetRange',
    'primary_aws_region': 'clientInfo.primaryAwsRegion',
    'secondary_aws_regions': 'clientInfo.secondaryAwsRegions',
    'compliance_requirements': 'clientInfo.complianceRequirements',
    'business_criticality': 'clientInfo.businessCriticality',
    'disaster_recovery_required': 'clientInfo.disasterRecoveryRequired',
    'multi_region_required': 'clientInfo.multiRegionRequired'
  },
  'Compute_Requirements_Enhanced': {
    'compute_id': 'computeRequirements[].computeId',
    'server_name': 'computeRequirements[].serverName',
    'environment_type': 'computeRequirements[].environmentType',
    'workload_type': 'computeRequirements[].workloadType',
    'cpu_cores': 'computeRequirements[].cpuCores',
    'ram_gb': 'computeRequirements[].ramGB',
    'operating_system': 'computeRequirements[].operatingSystem',
    'architecture': 'computeRequirements[].architecture',
    'business_criticality': 'computeRequirements[].businessCriticality',
    'average_utilization_percent': 'computeRequirements[].averageUtilizationPercent',
    'peak_utilization_percent': 'computeRequirements[].peakUtilizationPercent',
    'scaling_type': 'computeRequirements[].scalingType',
    'min_instances': 'computeRequirements[].minInstances',
    'max_instances': 'computeRequirements[].maxInstances',
    'monthly_runtime_hours': 'computeRequirements[].monthlyRuntimeHours',
    'storage_type': 'computeRequirements[].storageType',
    'root_volume_size_gb': 'computeRequirements[].rootVolumeSizeGB',
    'additional_storage_gb': 'computeRequirements[].additionalStorageGB',
    'network_performance': 'computeRequirements[].networkPerformance',
    'placement_group_required': 'computeRequirements[].placementGroupRequired',
    'dedicated_tenancy_required': 'computeRequirements[].dedicatedTenancyRequired',
    'hibernation_support_required': 'computeRequirements[].hibernationSupportRequired'
  },
  'Storage_Requirements_Enhanced': {
    'storage_id': 'storageRequirements[].storageId',
    'storage_name': 'storageRequirements[].storageName',
    'storage_purpose': 'storageRequirements[].storagePurpose',
    'current_size_gb': 'storageRequirements[].currentSizeGB',
    'projected_growth_rate_percent': 'storageRequirements[].projectedGrowthRatePercent',
    'access_pattern': 'storageRequirements[].accessPattern',
    'iops_required': 'storageRequirements[].iopsRequired',
    'throughput_mbps_required': 'storageRequirements[].throughputMbpsRequired',
    'durability_requirement': 'storageRequirements[].durabilityRequirement',
    'availability_requirement': 'storageRequirements[].availabilityRequirement',
    'encryption_required': 'storageRequirements[].encryptionRequired',
    'backup_required': 'storageRequirements[].backupRequired',
    'backup_frequency': 'storageRequirements[].backupFrequency',
    'backup_retention_days': 'storageRequirements[].backupRetentionDays',
    'cross_region_replication': 'storageRequirements[].crossRegionReplication',
    'versioning_required': 'storageRequirements[].versioningRequired',
    'lifecycle_management_required': 'storageRequirements[].lifecycleManagementRequired'
  },
  'Network_CDN_Enhanced': {
    'network_id': 'networkRequirements.networkId',
    'data_transfer_out_gb_monthly': 'networkRequirements.dataTransferOutGBMonthly',
    'data_transfer_in_gb_monthly': 'networkRequirements.dataTransferInGBMonthly',
    'peak_bandwidth_mbps': 'networkRequirements.peakBandwidthMbps',
    'concurrent_users_expected': 'networkRequirements.concurrentUsersExpected',
    'geographic_distribution': 'networkRequirements.geographicDistribution',
    'load_balancer_count': 'networkRequirements.loadBalancerCount',
    'load_balancer_type': 'networkRequirements.loadBalancerType',
    'ssl_certificate_required': 'networkRequirements.sslCertificateRequired',
    'ssl_certificate_type': 'networkRequirements.sslCertificateType',
    'waf_required': 'networkRequirements.wafRequired',
    'ddos_protection_required': 'networkRequirements.ddosProtectionRequired',
    'cdn_required': 'networkRequirements.cdnRequired',
    'cdn_cache_behavior': 'networkRequirements.cdnCacheBehavior',
    'edge_locations_required': 'networkRequirements.edgeLocationsRequired',
    'api_gateway_required': 'networkRequirements.apiGatewayRequired',
    'api_calls_monthly': 'networkRequirements.apiCallsMonthly',
    'vpn_connections_required': 'networkRequirements.vpnConnectionsRequired',
    'direct_connect_required': 'networkRequirements.directConnectRequired',
    'bandwidth_direct_connect_mbps': 'networkRequirements.bandwidthDirectConnectMbps'
  },
  'Database_Requirements_Enhanced': {
    'database_id': 'databaseRequirements[].databaseId',
    'database_name': 'databaseRequirements[].databaseName',
    'database_purpose': 'databaseRequirements[].databasePurpose',
    'engine_type': 'databaseRequirements[].engineType',
    'engine_version': 'databaseRequirements[].engineVersion',
    'database_size_gb': 'databaseRequirements[].databaseSizeGB',
    'expected_growth_rate_percent': 'databaseRequirements[].expectedGrowthRatePercent',
    'instance_class': 'databaseRequirements[].instanceClass',
    'cpu_cores': 'databaseRequirements[].cpuCores',
    'ram_gb': 'databaseRequirements[].ramGB',
    'storage_type': 'databaseRequirements[].storageType',
    'iops_required': 'databaseRequirements[].iopsRequired',
    'multi_az_required': 'databaseRequirements[].multiAzRequired',
    'read_replicas_count': 'databaseRequirements[].readReplicasCount',
    'read_replica_regions': 'databaseRequirements[].readReplicaRegions',
    'backup_retention_days': 'databaseRequirements[].backupRetentionDays',
    'backup_window_preferred': 'databaseRequirements[].backupWindowPreferred',
    'maintenance_window_preferred': 'databaseRequirements[].maintenanceWindowPreferred',
    'encryption_at_rest_required': 'databaseRequirements[].encryptionAtRestRequired',
    'encryption_in_transit_required': 'databaseRequirements[].encryptionInTransitRequired',
    'performance_insights_required': 'databaseRequirements[].performanceInsightsRequired',
    'monitoring_enhanced_required': 'databaseRequirements[].monitoringEnhancedRequired',
    'connection_pooling_required': 'databaseRequirements[].connectionPoolingRequired'
  },
  'Security_Compliance_Enhanced': {
    'security_id': 'securityRequirements.securityId',
    'compliance_frameworks': 'securityRequirements.complianceFrameworks',
    'data_classification': 'securityRequirements.dataClassification',
    'aws_config_required': 'securityRequirements.awsConfigRequired',
    'cloudtrail_required': 'securityRequirements.cloudtrailRequired',
    'cloudtrail_data_events': 'securityRequirements.cloudtrailDataEvents',
    'guardduty_required': 'securityRequirements.guarddutyRequired',
    'security_hub_required': 'securityRequirements.securityHubRequired',
    'inspector_required': 'securityRequirements.inspectorRequired',
    'macie_required': 'securityRequirements.macieRequired',
    'kms_required': 'securityRequirements.kmsRequired',
    'secrets_manager_required': 'securityRequirements.secretsManagerRequired',
    'certificate_manager_required': 'securityRequirements.certificateManagerRequired',
    'iam_access_analyzer_required': 'securityRequirements.iamAccessAnalyzerRequired',
    'vpc_flow_logs_required': 'securityRequirements.vpcFlowLogsRequired',
    'waf_required': 'securityRequirements.wafRequired',
    'shield_advanced_required': 'securityRequirements.shieldAdvancedRequired',
    'firewall_manager_required': 'securityRequirements.firewallManagerRequired',
    'network_firewall_required': 'securityRequirements.networkFirewallRequired',
    'penetration_testing_required': 'securityRequirements.penetrationTestingRequired',
    'vulnerability_scanning_required': 'securityRequirements.vulnerabilityScanningRequired',
    'security_training_required': 'securityRequirements.securityTrainingRequired',
    'incident_response_plan_required': 'securityRequirements.incidentResponsePlanRequired'
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