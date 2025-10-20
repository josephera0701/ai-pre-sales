# System Architecture: AWS Cost Estimation Platform

## Document Information
- **Project:** AWS Cost Estimation Platform for Sagesoft Solutions Inc.
- **Phase:** 3 - System Design
- **Date:** 2024-01-15
- **Version:** 1.0

## 1. Architecture Overview

### 1.1 Serverless Architecture Pattern
The system follows a fully serverless architecture using AWS managed services to achieve zero server maintenance and cost optimization objectives.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │   Lambda        │
│   (React SPA)   │◄──►│   REST APIs      │◄──►│   Functions     │
│   S3 + CloudFront│    │   Authentication │    │   Business Logic│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cognito       │    │   DynamoDB       │    │   S3 Storage    │
│   User Auth     │    │   Data Storage   │    │   Documents     │
│   MFA & Roles   │    │   Sessions       │    │   Templates     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 1.2 Core Components

#### Frontend Layer
- **Technology:** React.js Single Page Application (SPA)
- **Hosting:** S3 Static Website + CloudFront CDN
- **Features:** Responsive design, Excel upload, real-time cost calculation
- **Security:** HTTPS only, CSP headers, XSS protection

#### API Layer
- **Technology:** AWS API Gateway REST APIs
- **Authentication:** AWS Cognito integration
- **Features:** Rate limiting, request validation, CORS configuration
- **Security:** IAM authorization, API keys, throttling

#### Business Logic Layer
- **Technology:** AWS Lambda Functions (Node.js/Python)
- **Functions:** Cost calculation, Excel processing, document generation
- **Features:** Auto-scaling, provisioned concurrency for critical functions
- **Security:** VPC isolation, IAM roles, environment variables

#### Data Layer
- **Primary Storage:** DynamoDB (on-demand scaling)
- **Document Storage:** S3 (multiple buckets for different purposes)
- **Caching:** DynamoDB DAX for frequently accessed pricing data
- **Security:** Encryption at rest, fine-grained access control

## 2. Detailed Component Architecture

### 2.1 Frontend Architecture

#### React Application Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Header.jsx
│   │   ├── Navigation.jsx
│   │   └── Footer.jsx
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── PasswordReset.jsx
│   ├── estimation/
│   │   ├── InputMethodSelector.jsx
│   │   ├── ExcelUpload.jsx
│   │   ├── ManualForm.jsx
│   │   ├── CostCalculator.jsx
│   │   └── ConfigurationComparison.jsx
│   ├── documents/
│   │   ├── ProposalGenerator.jsx
│   │   ├── DocumentPreview.jsx
│   │   └── ExportOptions.jsx
│   └── admin/
│       ├── UserManagement.jsx
│       ├── AuditLogs.jsx
│       └── SystemSettings.jsx
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── costCalculation.js
│   └── documentGeneration.js
├── utils/
│   ├── excelParser.js
│   ├── validation.js
│   └── formatting.js
└── store/
    ├── authStore.js
    ├── estimationStore.js
    └── uiStore.js
```

#### State Management
- **Technology:** Zustand (lightweight state management)
- **Stores:** Authentication, Estimation Data, UI State
- **Features:** Persistent storage, optimistic updates, error handling

### 2.2 API Gateway Architecture

#### API Structure
```
/{stage}/
├── /estimations (🔒 Auth Required)
│   ├── GET /estimations
│   ├── POST /estimations
│   ├── GET /estimations/{id}
│   ├── PUT /estimations/{id}
│   ├── DELETE /estimations/{id}
│   └── POST /estimations/{id}/clone
├── /users (🔒 Auth Required)
│   ├── GET /users/me
│   └── PUT /users/me
├── /excel
│   ├── GET /excel/template (🌐 Public)
│   ├── POST /excel/upload (🔒 Auth Required)
│   ├── POST /excel/validate (🔒 Auth Required)
│   └── POST /excel/process (🔒 Auth Required)
├── /calculations (🔒 Auth Required)
│   ├── POST /calculations/cost
│   ├── POST /calculations/compare
│   └── GET /calculations/pricing-data
├── /documents (🔒 Auth Required)
│   ├── POST /documents/generate
│   ├── GET /documents/{id}/status
│   ├── GET /documents/{id}/download
│   ├── GET /documents
│   └── POST /documents/export
├── /dashboard (🔒 Auth Required)
│   └── GET /dashboard/metrics
└── /admin (👑 Admin Only)
    ├── GET /admin/users
    ├── GET /admin/audit-logs
    └── GET /admin/metrics
```

**Legend:**
- 🌐 Public: No authentication required
- 🔒 Auth Required: Cognito JWT token required
- 👑 Admin Only: Admin role required

#### API Gateway Configuration
- **Authentication:** Cognito User Pool Authorizer for protected endpoints
- **Public Endpoints:** OPTIONS methods and template downloads (no auth)
- **Rate Limiting:** 1000 requests per minute per user
- **Request Validation:** JSON schema validation
- **CORS:** Configured for all origins with proper headers
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Headers: Content-Type,Authorization,X-User-Id,X-User-Email,X-User-Role`
  - `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`
- **Caching:** 5-minute cache for pricing data endpoints

### 2.3 Lambda Functions Architecture

#### Core Functions

##### 1. Cost Calculation Function
```javascript
// cost-calculator-lambda
exports.handler = async (event) => {
    const { requirements, region, pricingModel } = JSON.parse(event.body);
    
    // Calculate EC2 costs
    const computeCosts = await calculateComputeCosts(requirements.compute);
    
    // Calculate storage costs
    const storageCosts = await calculateStorageCosts(requirements.storage);
    
    // Calculate database costs
    const databaseCosts = await calculateDatabaseCosts(requirements.database);
    
    // Calculate network costs
    const networkCosts = await calculateNetworkCosts(requirements.network);
    
    // Apply business rules and discounts
    const totalCosts = applyBusinessRules({
        compute: computeCosts,
        storage: storageCosts,
        database: databaseCosts,
        network: networkCosts
    });
    
    return {
        statusCode: 200,
        body: JSON.stringify(totalCosts)
    };
};
```

##### 2. Excel Processing Function
```javascript
// excel-processor-lambda
exports.handler = async (event) => {
    const { s3Bucket, s3Key } = JSON.parse(event.body);
    
    // Download Excel file from S3
    const excelBuffer = await downloadFromS3(s3Bucket, s3Key);
    
    // Parse Excel sheets
    const parsedData = await parseExcelSheets(excelBuffer);
    
    // Validate data structure
    const validationResult = await validateExcelData(parsedData);
    
    if (validationResult.isValid) {
        // Map to UI form structure
        const mappedData = mapExcelToFormData(parsedData);
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, data: mappedData })
        };
    } else {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, errors: validationResult.errors })
        };
    }
};
```

##### 3. Document Generation Function
```javascript
// document-generator-lambda
exports.handler = async (event) => {
    const { estimationId, documentType, template } = JSON.parse(event.body);
    
    // Retrieve estimation data
    const estimation = await getEstimationFromDynamoDB(estimationId);
    
    // Generate document based on type
    let document;
    switch (documentType) {
        case 'pdf':
            document = await generatePDFProposal(estimation, template);
            break;
        case 'word':
            document = await generateWordDocument(estimation, template);
            break;
        case 'excel':
            document = await generateExcelExport(estimation);
            break;
    }
    
    // Store document in S3
    const documentUrl = await storeDocumentInS3(document, estimationId, documentType);
    
    return {
        statusCode: 200,
        body: JSON.stringify({ documentUrl })
    };
};
```

#### Function Configuration
- **Runtime:** Node.js 18.x
- **Memory:** 512MB (cost calculator), 1024MB (document generator), 256MB (others)
- **Timeout:** 30 seconds (document generation), 10 seconds (others)
- **Environment Variables:** Encrypted with KMS
- **VPC:** No VPC (for better cold start performance)
- **Provisioned Concurrency:** 2 instances for cost calculator during business hours

### 2.4 Data Architecture

#### DynamoDB Tables

##### 1. Estimations Table
```json
{
  "TableName": "aws-cost-estimations",
  "KeySchema": [
    { "AttributeName": "estimationId", "KeyType": "HASH" }
  ],
  "AttributeDefinitions": [
    { "AttributeName": "estimationId", "AttributeType": "S" },
    { "AttributeName": "userId", "AttributeType": "S" },
    { "AttributeName": "createdAt", "AttributeType": "S" }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "UserIndex",
      "KeySchema": [
        { "AttributeName": "userId", "KeyType": "HASH" },
        { "AttributeName": "createdAt", "KeyType": "RANGE" }
      ]
    }
  ],
  "BillingMode": "ON_DEMAND",
  "PointInTimeRecoverySpecification": { "PointInTimeRecoveryEnabled": true },
  "SSESpecification": { "SSEEnabled": true }
}
```

##### 2. Users Table
```json
{
  "TableName": "aws-cost-users",
  "KeySchema": [
    { "AttributeName": "userId", "KeyType": "HASH" }
  ],
  "AttributeDefinitions": [
    { "AttributeName": "userId", "AttributeType": "S" },
    { "AttributeName": "email", "AttributeType": "S" }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "EmailIndex",
      "KeySchema": [
        { "AttributeName": "email", "KeyType": "HASH" }
      ]
    }
  ],
  "BillingMode": "ON_DEMAND"
}
```

##### 3. Pricing Data Table
```json
{
  "TableName": "aws-pricing-data",
  "KeySchema": [
    { "AttributeName": "serviceType", "KeyType": "HASH" },
    { "AttributeName": "region", "KeyType": "RANGE" }
  ],
  "AttributeDefinitions": [
    { "AttributeName": "serviceType", "AttributeType": "S" },
    { "AttributeName": "region", "AttributeType": "S" }
  ],
  "BillingMode": "ON_DEMAND",
  "TimeToLiveSpecification": {
    "AttributeName": "ttl",
    "Enabled": true
  }
}
```

##### 4. Audit Logs Table
```json
{
  "TableName": "aws-cost-audit-logs",
  "KeySchema": [
    { "AttributeName": "logId", "KeyType": "HASH" }
  ],
  "AttributeDefinitions": [
    { "AttributeName": "logId", "AttributeType": "S" },
    { "AttributeName": "userId", "AttributeType": "S" },
    { "AttributeName": "timestamp", "AttributeType": "S" }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "UserTimeIndex",
      "KeySchema": [
        { "AttributeName": "userId", "KeyType": "HASH" },
        { "AttributeName": "timestamp", "KeyType": "RANGE" }
      ]
    }
  ],
  "BillingMode": "ON_DEMAND"
}
```

#### S3 Bucket Structure
```
aws-cost-estimation-platform/
├── frontend/                    # Static website files
│   ├── index.html
│   ├── static/
│   └── assets/
├── documents/                   # Generated documents
│   ├── proposals/
│   ├── exports/
│   └── templates/
├── uploads/                     # Excel file uploads
│   └── temp/                    # Temporary files (auto-delete after 24h)
└── backups/                     # Data backups
    ├── estimations/
    └── user-data/
```

## 3. Security Architecture

### 3.1 Authentication & Authorization

#### AWS Cognito Configuration
```json
{
  "UserPool": {
    "PoolName": "aws-cost-estimation-users",
    "Policies": {
      "PasswordPolicy": {
        "MinimumLength": 8,
        "RequireUppercase": true,
        "RequireLowercase": true,
        "RequireNumbers": true,
        "RequireSymbols": false
      }
    },
    "MfaConfiguration": "OFF",
    "AccountRecoverySetting": {
      "RecoveryMechanisms": [
        { "Name": "verified_email", "Priority": 1 }
      ]
    },
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
        "Required": false,
        "Mutable": true
      },
      {
        "Name": "family_name",
        "AttributeDataType": "String",
        "Required": false,
        "Mutable": true
      },
      {
        "Name": "custom:role",
        "AttributeDataType": "String",
        "Required": false,
        "Mutable": true
      }
    ],
    "UserPoolClient": {
      "ClientName": "aws-cost-estimation-client",
      "GenerateSecret": false,
      "ExplicitAuthFlows": [
        "ALLOW_USER_SRP_AUTH",
        "ALLOW_REFRESH_TOKEN_AUTH"
      ],
      "TokenValidityUnits": {
        "AccessToken": "hours",
        "IdToken": "hours",
        "RefreshToken": "days"
      },
      "AccessTokenValidity": 1,
      "IdTokenValidity": 1,
      "RefreshTokenValidity": 30
    }
  }
}
```

#### API Gateway Cognito Integration
```yaml
CognitoAuthorizer:
  Type: AWS::ApiGateway::Authorizer
  Properties:
    Name: CognitoUserPoolAuthorizer
    Type: COGNITO_USER_POOLS
    IdentitySource: method.request.header.Authorization
    RestApiId: !Ref ApiGateway
    ProviderARNs:
      - !GetAtt UserPool.Arn
```

#### IAM Roles and Policies

##### Lambda Execution Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/aws-cost-*",
        "arn:aws:dynamodb:*:*:table/aws-cost-*/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::aws-cost-estimation-platform/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "arn:aws:kms:*:*:key/*"
    }
  ]
}
```

#### User Context Extraction
```javascript
// Lambda function receives user context from Cognito via API Gateway
function extractUserContext(event) {
  const claims = event.requestContext.authorizer.claims;
  return {
    userId: claims.sub,
    email: claims.email,
    firstName: claims.given_name,
    lastName: claims.family_name,
    role: claims['custom:role'] || 'Sales'
  };
}
```

### 3.2 Data Protection

#### Encryption Strategy
- **Data in Transit:** TLS 1.3 for all communications
- **Data at Rest:** AES-256 encryption for DynamoDB and S3
- **Key Management:** AWS KMS with customer-managed keys
- **Application Secrets:** AWS Systems Manager Parameter Store (encrypted)

#### Data Classification
- **Public:** Marketing materials, documentation
- **Internal:** System configurations, non-sensitive logs
- **Confidential:** User data, estimation details
- **Restricted:** Authentication tokens, encryption keys

### 3.3 Network Security

#### CloudFront Security Headers
```javascript
{
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

#### API Gateway Security
- **Rate Limiting:** 1000 requests/minute per user
- **Request Size Limit:** 10MB for file uploads
- **IP Whitelisting:** Optional for admin functions
- **Request Validation:** JSON schema validation for all endpoints

## 4. Performance Architecture

### 4.1 Caching Strategy

#### Multi-Level Caching
```
Browser Cache (1 hour)
    ↓
CloudFront Cache (24 hours)
    ↓
API Gateway Cache (5 minutes)
    ↓
DynamoDB DAX (microseconds)
    ↓
DynamoDB (milliseconds)
```

#### Cache Configuration
- **Static Assets:** 1 year cache with versioning
- **API Responses:** 5 minutes for pricing data, no cache for user data
- **DynamoDB DAX:** 5-minute TTL for pricing queries
- **Browser Cache:** 1 hour for application data

### 4.2 Performance Optimization

#### Lambda Optimization
- **Memory Allocation:** Right-sized based on function requirements
- **Provisioned Concurrency:** 2 instances for cost calculator
- **Connection Pooling:** Reuse DynamoDB connections
- **Code Optimization:** Minimize cold start impact

#### Database Optimization
- **On-Demand Scaling:** Automatic capacity adjustment
- **Global Secondary Indexes:** Optimized for query patterns
- **Batch Operations:** Reduce API calls for bulk operations
- **Compression:** Gzip compression for large data items

## 5. Monitoring and Observability

### 5.1 CloudWatch Metrics

#### Custom Metrics
- **Cost Calculation Time:** Average processing time per estimation
- **Excel Processing Success Rate:** Percentage of successful uploads
- **Document Generation Time:** Time to generate different document types
- **User Session Duration:** Average time spent in application
- **API Error Rates:** Error rates by endpoint and error type

#### Alarms
- **High Error Rate:** >5% error rate for 5 minutes
- **High Latency:** >2 seconds response time for 3 minutes
- **Lambda Throttling:** Any throttling events
- **DynamoDB Throttling:** Read/write throttling events

### 5.2 Logging Strategy

#### Log Levels
- **ERROR:** System errors, failed operations
- **WARN:** Performance issues, validation failures
- **INFO:** User actions, system events
- **DEBUG:** Detailed execution flow (development only)

#### Log Aggregation
- **CloudWatch Logs:** Centralized log collection
- **Log Groups:** Separate groups per Lambda function
- **Retention:** 30 days for application logs, 1 year for audit logs
- **Search:** CloudWatch Insights for log analysis

## 6. Deployment Architecture

### 6.1 Infrastructure as Code

#### AWS SAM Template Structure
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, prod]

Globals:
  Function:
    Runtime: nodejs18.x
    Timeout: 30
    Environment:
      Variables:
        ENVIRONMENT: !Ref Environment
        DYNAMODB_TABLE_PREFIX: !Sub 'aws-cost-${Environment}'

Resources:
  # API Gateway
  CostEstimationApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: !Ref Environment
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: !GetAtt UserPool.Arn

  # Lambda Functions
  CostCalculatorFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/cost-calculator/
      Handler: index.handler
      MemorySize: 512
      Events:
        Api:
          Type: Api
          Properties:
            RestApiId: !Ref CostEstimationApi
            Path: /calculations/cost
            Method: POST

  # DynamoDB Tables
  EstimationsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'aws-cost-estimations-${Environment}'
      BillingMode: ON_DEMAND
      # ... table configuration

  # S3 Buckets
  DocumentsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'aws-cost-estimation-${Environment}-documents'
      # ... bucket configuration
```

### 6.2 CI/CD Pipeline

#### Deployment Stages
1. **Source:** GitHub repository
2. **Build:** AWS CodeBuild
3. **Test:** Unit tests, integration tests
4. **Deploy Dev:** Automatic deployment to development
5. **Deploy Staging:** Manual approval required
6. **Deploy Production:** Manual approval with additional checks

#### Rollback Strategy
- **Blue/Green Deployment:** Zero-downtime deployments
- **Automatic Rollback:** On health check failures
- **Manual Rollback:** Available through AWS Console
- **Database Migration:** Backward-compatible changes only

## 7. Cost Optimization

### 7.1 Cost Monitoring

#### Cost Allocation Tags
- **Environment:** dev/staging/prod
- **Component:** frontend/api/database/storage
- **Owner:** team responsible for component
- **Project:** aws-cost-estimation-platform

#### Budget Alerts
- **Monthly Budget:** $50 with 80% and 100% alerts
- **Service-Level Budgets:** Individual service monitoring
- **Anomaly Detection:** Unusual spending pattern alerts

### 7.2 Cost Optimization Strategies

#### Serverless Optimization
- **Right-sizing:** Regular review of Lambda memory allocation
- **Reserved Capacity:** Consider for consistent workloads
- **S3 Lifecycle:** Automatic transition to cheaper storage classes
- **DynamoDB On-Demand:** Pay only for actual usage

#### Resource Cleanup
- **Temporary Files:** Automatic S3 lifecycle deletion
- **Old Logs:** CloudWatch log retention policies
- **Unused Resources:** Regular audit and cleanup
- **Development Resources:** Automatic shutdown outside business hours

This system architecture provides a robust, scalable, and cost-effective foundation for the AWS Cost Estimation Platform while meeting all security, performance, and operational requirements.