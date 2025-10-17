# Database Schema: AWS Cost Estimation Platform

## Document Information
- **Project:** AWS Cost Estimation Platform for Sagesoft Solutions Inc.
- **Phase:** 3 - System Design
- **Date:** 2024-01-15
- **Version:** 1.0

## 1. Database Design Overview

### 1.1 NoSQL Design Principles
The system uses DynamoDB as the primary database following NoSQL design patterns:
- **Single Table Design:** Minimize cross-table queries
- **Denormalization:** Store related data together
- **Access Patterns:** Design based on query requirements
- **Partition Key Strategy:** Ensure even data distribution

### 1.2 Data Access Patterns
1. **User Authentication:** Get user by email, get user by ID
2. **Estimation Management:** Get estimations by user, get estimation by ID
3. **Cost Calculation:** Get pricing data by service and region
4. **Audit Logging:** Get logs by user and time range
5. **Document Storage:** Get documents by estimation ID
6. **Sharing:** Get shared estimations by user

## 2. DynamoDB Table Designs

### 2.1 Main Application Table (Single Table Design)

#### Table: `aws-cost-platform`

```json
{
  "TableName": "aws-cost-platform",
  "BillingMode": "ON_DEMAND",
  "AttributeDefinitions": [
    { "AttributeName": "PK", "AttributeType": "S" },
    { "AttributeName": "SK", "AttributeType": "S" },
    { "AttributeName": "GSI1PK", "AttributeType": "S" },
    { "AttributeName": "GSI1SK", "AttributeType": "S" },
    { "AttributeName": "GSI2PK", "AttributeType": "S" },
    { "AttributeName": "GSI2SK", "AttributeType": "S" }
  ],
  "KeySchema": [
    { "AttributeName": "PK", "KeyType": "HASH" },
    { "AttributeName": "SK", "KeyType": "RANGE" }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "GSI1",
      "KeySchema": [
        { "AttributeName": "GSI1PK", "KeyType": "HASH" },
        { "AttributeName": "GSI1SK", "KeyType": "RANGE" }
      ],
      "Projection": { "ProjectionType": "ALL" }
    },
    {
      "IndexName": "GSI2",
      "KeySchema": [
        { "AttributeName": "GSI2PK", "KeyType": "HASH" },
        { "AttributeName": "GSI2SK", "KeyType": "RANGE" }
      ],
      "Projection": { "ProjectionType": "ALL" }
    }
  ],
  "StreamSpecification": {
    "StreamEnabled": true,
    "StreamViewType": "NEW_AND_OLD_IMAGES"
  },
  "PointInTimeRecoverySpecification": {
    "PointInTimeRecoveryEnabled": true
  },
  "SSESpecification": {
    "SSEEnabled": true,
    "KMSMasterKeyId": "alias/aws-cost-platform-key"
  }
}
```

### 2.2 Entity Designs

#### 2.2.1 User Entity

```json
{
  "PK": "USER#user123",
  "SK": "PROFILE",
  "GSI1PK": "USER#email@company.com",
  "GSI1SK": "PROFILE",
  "EntityType": "User",
  "UserId": "user123",
  "Email": "john.doe@sagesoft.com",
  "FirstName": "John",
  "LastName": "Doe",
  "Role": "Sales",
  "Department": "Sales",
  "IsActive": true,
  "CreatedAt": "2024-01-15T10:00:00Z",
  "UpdatedAt": "2024-01-15T10:00:00Z",
  "LastLoginAt": "2024-01-15T09:30:00Z",
  "Preferences": {
    "DefaultCurrency": "USD",
    "DefaultRegion": "us-east-1",
    "NotificationSettings": {
      "EmailNotifications": true,
      "DocumentReady": true,
      "SharedEstimations": true
    }
  },
  "MFAEnabled": false,
  "TTL": null
}
```

#### 2.2.2 Estimation Entity

```json
{
  "PK": "ESTIMATION#est456",
  "SK": "METADATA",
  "GSI1PK": "USER#user123",
  "GSI1SK": "ESTIMATION#2024-01-15T10:00:00Z",
  "GSI2PK": "STATUS#ACTIVE",
  "GSI2SK": "ESTIMATION#est456",
  "EntityType": "Estimation",
  "EstimationId": "est456",
  "UserId": "user123",
  "ProjectName": "Client ABC Infrastructure",
  "Description": "AWS infrastructure cost estimation for Client ABC",
  "Status": "ACTIVE",
  "InputMethod": "EXCEL_UPLOAD",
  "CreatedAt": "2024-01-15T10:00:00Z",
  "UpdatedAt": "2024-01-15T10:30:00Z",
  "ClientInfo": {
    "CompanyName": "ABC Corporation",
    "Industry": "E-commerce",
    "PrimaryContact": "Jane Smith",
    "Email": "jane.smith@abc.com",
    "Phone": "+1-555-0123",
    "Timeline": "Q2 2024",
    "BudgetRange": "50000-100000",
    "RegionPreference": ["us-east-1", "us-west-2"],
    "ComplianceRequirements": ["SOC2", "PCI-DSS"]
  },
  "EstimationSummary": {
    "TotalMonthlyCost": 8500.00,
    "TotalAnnualCost": 102000.00,
    "Currency": "USD",
    "LastCalculatedAt": "2024-01-15T10:30:00Z",
    "CostBreakdown": {
      "Compute": 4500.00,
      "Storage": 1200.00,
      "Database": 2000.00,
      "Network": 500.00,
      "Security": 300.00
    }
  },
  "SharedWith": ["user789", "user101"],
  "Tags": ["client-abc", "e-commerce", "production"],
  "TTL": null
}
```

#### 2.2.3 Estimation Requirements Entity

```json
{
  "PK": "ESTIMATION#est456",
  "SK": "REQUIREMENTS",
  "EntityType": "EstimationRequirements",
  "EstimationId": "est456",
  "ComputeRequirements": [
    {
      "ServerName": "Web Server",
      "Environment": "Production",
      "CPUCores": 4,
      "RAMGB": 16,
      "OS": "Linux",
      "Criticality": "High",
      "UtilizationPercent": 70,
      "PeakUtilizationPercent": 95,
      "ScalingType": "Auto",
      "MinInstances": 2,
      "MaxInstances": 10,
      "SuggestedInstanceType": "t3.xlarge",
      "MonthlyHours": 744,
      "Notes": "Frontend web servers"
    }
  ],
  "StorageRequirements": [
    {
      "StorageType": "Application Data",
      "CurrentGB": 500,
      "GrowthRatePercent": 10,
      "IOPSRequired": 3000,
      "ThroughputMBps": 250,
      "BackupRequired": true,
      "RetentionDays": 30,
      "AccessPattern": "Frequent",
      "SuggestedAWSService": "EBS gp3"
    }
  ],
  "NetworkRequirements": {
    "DataTransferOutGBMonth": 1000,
    "PeakBandwidthMbps": 2000,
    "LoadBalancerCount": 1,
    "SSLCertificateRequired": true,
    "WAFRequired": true,
    "DDoSProtectionRequired": false,
    "GlobalDistributionRequired": true
  },
  "DatabaseRequirements": [
    {
      "DatabaseName": "Primary DB",
      "Engine": "MySQL",
      "Version": "8.0",
      "SizeGB": 500,
      "InstanceClass": "db.r5.xlarge",
      "MultiAZ": true,
      "ReadReplicas": 2,
      "BackupRetention": 30,
      "EncryptionEnabled": true
    }
  ],
  "SecurityRequirements": {
    "AWSConfig": true,
    "CloudTrail": true,
    "GuardDuty": true,
    "SecurityHub": false,
    "Inspector": false,
    "Macie": false,
    "KMS": true,
    "SecretsManager": true
  }
}
```

#### 2.2.4 Cost Calculation Entity

```json
{
  "PK": "ESTIMATION#est456",
  "SK": "CALCULATION#2024-01-15T10:30:00Z",
  "GSI1PK": "CALCULATION#est456",
  "GSI1SK": "2024-01-15T10:30:00Z",
  "EntityType": "CostCalculation",
  "EstimationId": "est456",
  "CalculationId": "calc789",
  "CalculatedAt": "2024-01-15T10:30:00Z",
  "Region": "us-east-1",
  "Currency": "USD",
  "PricingModel": "ON_DEMAND",
  "DetailedCosts": {
    "Compute": {
      "EC2Instances": [
        {
          "InstanceType": "t3.xlarge",
          "Quantity": 2,
          "HoursPerMonth": 744,
          "PricePerHour": 0.1664,
          "MonthlyCost": 247.42,
          "AnnualCost": 2969.04
        }
      ],
      "AutoScaling": {
        "AverageInstances": 3.5,
        "MonthlyCost": 433.24,
        "AnnualCost": 5198.88
      },
      "TotalCompute": 4500.00
    },
    "Storage": {
      "EBS": [
        {
          "VolumeType": "gp3",
          "SizeGB": 500,
          "IOPS": 3000,
          "ThroughputMBps": 250,
          "MonthlyCost": 45.00,
          "AnnualCost": 540.00
        }
      ],
      "S3": [
        {
          "StorageClass": "Standard",
          "SizeGB": 2000,
          "MonthlyCost": 46.00,
          "AnnualCost": 552.00
        }
      ],
      "TotalStorage": 1200.00
    },
    "Database": {
      "RDS": [
        {
          "Engine": "MySQL",
          "InstanceClass": "db.r5.xlarge",
          "MultiAZ": true,
          "StorageGB": 500,
          "MonthlyCost": 1800.00,
          "AnnualCost": 21600.00
        }
      ],
      "TotalDatabase": 2000.00
    },
    "Network": {
      "DataTransfer": 150.00,
      "CloudFront": 200.00,
      "LoadBalancer": 150.00,
      "TotalNetwork": 500.00
    },
    "Security": {
      "GuardDuty": 150.00,
      "CloudTrail": 50.00,
      "KMS": 100.00,
      "TotalSecurity": 300.00
    }
  },
  "TotalMonthlyCost": 8500.00,
  "TotalAnnualCost": 102000.00,
  "BusinessRulesApplied": {
    "BufferPercentage": 10,
    "VolumeDiscounts": true,
    "SupportPlanIncluded": true
  }
}
```

#### 2.2.5 Document Entity

```json
{
  "PK": "ESTIMATION#est456",
  "SK": "DOCUMENT#doc123",
  "GSI1PK": "DOCUMENT#doc123",
  "GSI1SK": "2024-01-15T11:00:00Z",
  "EntityType": "Document",
  "DocumentId": "doc123",
  "EstimationId": "est456",
  "DocumentType": "PDF_PROPOSAL",
  "FileName": "ABC_Corporation_AWS_Proposal.pdf",
  "S3Bucket": "aws-cost-estimation-documents",
  "S3Key": "proposals/est456/ABC_Corporation_AWS_Proposal_20240115.pdf",
  "FileSize": 2048576,
  "GeneratedAt": "2024-01-15T11:00:00Z",
  "GeneratedBy": "user123",
  "Status": "COMPLETED",
  "DownloadCount": 3,
  "LastDownloadedAt": "2024-01-15T14:30:00Z",
  "ExpiresAt": "2024-07-15T11:00:00Z",
  "Metadata": {
    "Template": "standard_proposal",
    "IncludeExecutiveSummary": true,
    "IncludeDetailedBreakdown": true,
    "IncludeArchitectureDiagram": false,
    "Branding": "sagesoft"
  }
}
```

#### 2.2.6 Audit Log Entity

```json
{
  "PK": "AUDIT#2024-01-15",
  "SK": "LOG#user123#10:30:00.123Z",
  "GSI1PK": "USER#user123",
  "GSI1SK": "AUDIT#2024-01-15T10:30:00Z",
  "EntityType": "AuditLog",
  "LogId": "log456",
  "UserId": "user123",
  "Action": "ESTIMATION_CREATED",
  "ResourceType": "Estimation",
  "ResourceId": "est456",
  "Timestamp": "2024-01-15T10:30:00.123Z",
  "IPAddress": "192.168.1.100",
  "UserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "SessionId": "sess789",
  "Details": {
    "ProjectName": "Client ABC Infrastructure",
    "InputMethod": "EXCEL_UPLOAD",
    "EstimatedCost": 8500.00
  },
  "Result": "SUCCESS",
  "TTL": 1736942400
}
```

#### 2.2.7 Pricing Data Entity

```json
{
  "PK": "PRICING#EC2",
  "SK": "us-east-1#t3.xlarge",
  "GSI1PK": "REGION#us-east-1",
  "GSI1SK": "PRICING#EC2#t3.xlarge",
  "EntityType": "PricingData",
  "ServiceType": "EC2",
  "Region": "us-east-1",
  "InstanceType": "t3.xlarge",
  "PricingModel": "ON_DEMAND",
  "PricePerHour": 0.1664,
  "Currency": "USD",
  "LastUpdated": "2024-01-15T08:00:00Z",
  "Source": "AWS_PRICING_API",
  "Specifications": {
    "vCPUs": 4,
    "Memory": "16 GiB",
    "NetworkPerformance": "Up to 5 Gigabit",
    "EBSOptimized": true
  },
  "TTL": 1705395600
}
```

#### 2.2.8 Shared Estimation Entity

```json
{
  "PK": "USER#user789",
  "SK": "SHARED#est456",
  "GSI1PK": "ESTIMATION#est456",
  "GSI1SK": "SHARED#user789",
  "EntityType": "SharedEstimation",
  "EstimationId": "est456",
  "SharedWithUserId": "user789",
  "SharedByUserId": "user123",
  "Permission": "READ_WRITE",
  "SharedAt": "2024-01-15T12:00:00Z",
  "ExpiresAt": "2024-04-15T12:00:00Z",
  "NotificationSent": true,
  "LastAccessedAt": "2024-01-15T13:30:00Z"
}
```

## 3. Access Patterns and Queries

### 3.1 Primary Access Patterns

#### User Management
```javascript
// Get user by ID
const getUserById = (userId) => ({
  TableName: 'aws-cost-platform',
  Key: {
    PK: `USER#${userId}`,
    SK: 'PROFILE'
  }
});

// Get user by email
const getUserByEmail = (email) => ({
  TableName: 'aws-cost-platform',
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :email',
  ExpressionAttributeValues: {
    ':email': `USER#${email}`
  }
});
```

#### Estimation Management
```javascript
// Get all estimations for a user
const getEstimationsByUser = (userId) => ({
  TableName: 'aws-cost-platform',
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :userId AND begins_with(GSI1SK, :prefix)',
  ExpressionAttributeValues: {
    ':userId': `USER#${userId}`,
    ':prefix': 'ESTIMATION#'
  }
});

// Get estimation with all related data
const getEstimationComplete = async (estimationId) => {
  const params = {
    TableName: 'aws-cost-platform',
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `ESTIMATION#${estimationId}`
    }
  };
  // Returns: METADATA, REQUIREMENTS, CALCULATION records
};
```

#### Cost Calculations
```javascript
// Get latest calculation for estimation
const getLatestCalculation = (estimationId) => ({
  TableName: 'aws-cost-platform',
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :estimationId',
  ScanIndexForward: false,
  Limit: 1,
  ExpressionAttributeValues: {
    ':estimationId': `CALCULATION#${estimationId}`
  }
});
```

#### Pricing Data
```javascript
// Get pricing for specific service and region
const getPricingData = (serviceType, region, instanceType) => ({
  TableName: 'aws-cost-platform',
  Key: {
    PK: `PRICING#${serviceType}`,
    SK: `${region}#${instanceType}`
  }
});

// Get all pricing for region
const getRegionPricing = (region) => ({
  TableName: 'aws-cost-platform',
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :region',
  ExpressionAttributeValues: {
    ':region': `REGION#${region}`
  }
});
```

### 3.2 Batch Operations

#### Batch Write Example
```javascript
const batchWriteEstimation = (estimationData) => ({
  RequestItems: {
    'aws-cost-platform': [
      {
        PutRequest: {
          Item: estimationData.metadata
        }
      },
      {
        PutRequest: {
          Item: estimationData.requirements
        }
      },
      {
        PutRequest: {
          Item: estimationData.calculation
        }
      }
    ]
  }
});
```

## 4. Data Consistency and Transactions

### 4.1 Transaction Examples

#### Create Estimation with Audit Log
```javascript
const createEstimationTransaction = (estimation, auditLog) => ({
  TransactItems: [
    {
      Put: {
        TableName: 'aws-cost-platform',
        Item: estimation.metadata,
        ConditionExpression: 'attribute_not_exists(PK)'
      }
    },
    {
      Put: {
        TableName: 'aws-cost-platform',
        Item: estimation.requirements
      }
    },
    {
      Put: {
        TableName: 'aws-cost-platform',
        Item: auditLog
      }
    }
  ]
});
```

### 4.2 Optimistic Locking

#### Version Control Implementation
```javascript
const updateEstimationWithVersion = (estimationId, updates, currentVersion) => ({
  TableName: 'aws-cost-platform',
  Key: {
    PK: `ESTIMATION#${estimationId}`,
    SK: 'METADATA'
  },
  UpdateExpression: 'SET #data = :data, #version = :newVersion, #updatedAt = :timestamp',
  ConditionExpression: '#version = :currentVersion',
  ExpressionAttributeNames: {
    '#data': 'Data',
    '#version': 'Version',
    '#updatedAt': 'UpdatedAt'
  },
  ExpressionAttributeValues: {
    ':data': updates,
    ':currentVersion': currentVersion,
    ':newVersion': currentVersion + 1,
    ':timestamp': new Date().toISOString()
  }
});
```

## 5. Performance Optimization

### 5.1 Hot Partition Prevention

#### Partition Key Distribution
- **Users:** Distributed by user ID (UUID)
- **Estimations:** Distributed by estimation ID (UUID)
- **Audit Logs:** Distributed by date + user combination
- **Pricing Data:** Distributed by service type

### 5.2 Query Optimization

#### Composite Sort Keys
```javascript
// Efficient time-range queries
SK: "CALCULATION#2024-01-15T10:30:00Z"
SK: "AUDIT#2024-01-15T10:30:00.123Z"
SK: "DOCUMENT#2024-01-15T11:00:00Z"
```

#### Sparse Indexes
```javascript
// Only items with TTL have GSI2PK
GSI2PK: "EXPIRING#2024-07-15"  // Only for temporary items
```

## 6. Backup and Recovery

### 6.1 Backup Strategy

#### Point-in-Time Recovery
- **Enabled:** All production tables
- **Retention:** 35 days
- **Granularity:** Per-second recovery

#### On-Demand Backups
- **Frequency:** Daily automated backups
- **Retention:** 90 days
- **Cross-Region:** Backup to secondary region

### 6.2 Data Archival

#### TTL Implementation
```javascript
// Temporary files (24 hours)
TTL: Math.floor(Date.now() / 1000) + 86400

// Audit logs (1 year)
TTL: Math.floor(Date.now() / 1000) + 31536000

// Expired documents (6 months after generation)
TTL: Math.floor(Date.now() / 1000) + 15552000
```

## 7. Security Considerations

### 7.1 Encryption

#### Encryption at Rest
- **DynamoDB:** Customer-managed KMS key
- **Backup:** Same KMS key as source table
- **Cross-Region:** Separate KMS key per region

#### Field-Level Encryption
```javascript
// Sensitive fields encrypted before storage
const encryptedData = {
  ...publicData,
  ClientEmail: encrypt(clientEmail, kmsKey),
  ContactPhone: encrypt(contactPhone, kmsKey)
};
```

### 7.2 Access Control

#### Fine-Grained Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/aws-cost-platform",
      "Condition": {
        "ForAllValues:StringLike": {
          "dynamodb:LeadingKeys": ["USER#${cognito-identity.amazonaws.com:sub}"]
        }
      }
    }
  ]
}
```

This database schema provides a scalable, performant, and secure foundation for the AWS Cost Estimation Platform while supporting all required access patterns and business requirements.