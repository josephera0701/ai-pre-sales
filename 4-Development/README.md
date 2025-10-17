# AWS Cost Estimation Platform - Development

## Project Overview
A serverless web application for generating professional AWS cost estimates and proposals for Sagesoft Solutions Inc. clients.

## Architecture
- **Frontend:** React SPA hosted on S3 + CloudFront
- **Backend:** AWS Lambda functions with API Gateway
- **Database:** DynamoDB with single-table design
- **Storage:** S3 for documents and file uploads
- **Authentication:** AWS Cognito User Pool
- **Infrastructure:** CloudFormation/SAM templates

## Project Structure
```
4-Development/
├── src/
│   ├── lambda/                 # Lambda function source code
│   │   ├── cost-calculator/    # Cost calculation engine
│   │   ├── excel-processor/    # Excel file processing
│   │   ├── document-generator/ # PDF/Word/Excel generation
│   │   ├── user-management/    # User and estimation CRUD
│   │   └── auth-handler/       # Authentication endpoints
│   ├── frontend/              # React application (to be created)
│   └── infrastructure/        # CloudFormation/SAM templates
├── tests/                     # Unit and integration tests
├── docs/                      # Development documentation
└── README.md                  # This file
```

## Lambda Functions

### 1. Cost Calculator (`cost-calculator/`)
- **Purpose:** Calculate AWS service costs based on requirements
- **Memory:** 512MB
- **Timeout:** 30 seconds
- **Features:**
  - EC2, RDS, S3, EBS cost calculations
  - Business rules application (10% buffer, support plans)
  - Instance type recommendations
  - Volume discount calculations

### 2. Excel Processor (`excel-processor/`)
- **Purpose:** Process uploaded Excel templates and validate data
- **Memory:** 1024MB
- **Timeout:** 60 seconds
- **Features:**
  - Parse 8 Excel sheets (Client Info, Compute, Storage, etc.)
  - Data validation with detailed error reporting
  - Map Excel data to form structure
  - Update estimation records

### 3. Document Generator (`document-generator/`)
- **Purpose:** Generate PDF, Word, and Excel documents
- **Memory:** 1024MB
- **Timeout:** 60 seconds
- **Features:**
  - Professional PDF proposals with branding
  - Word documents for internal collaboration
  - Excel exports for analysis
  - S3 storage with presigned URLs

### 4. User Management (`user-management/`)
- **Purpose:** Handle user profiles and estimation CRUD operations
- **Memory:** 256MB
- **Timeout:** 15 seconds
- **Features:**
  - User profile management
  - Estimation lifecycle (create, read, update, delete)
  - Sharing and collaboration
  - Audit logging

### 5. Auth Handler (`auth-handler/`)
- **Purpose:** Authentication and authorization endpoints
- **Memory:** 256MB
- **Timeout:** 15 seconds
- **Features:**
  - Login/logout functionality
  - Token refresh
  - Password reset
  - Integration with Cognito

## Key Features Implemented

### Excel Template Integration
- Support for standardized 8-sheet Excel template
- Real-time validation with specific error messages
- Automatic mapping to UI form fields
- Dual input method (Excel upload OR manual entry)

### Cost Calculation Engine
- AWS service pricing integration
- Real-time cost updates
- Configuration comparison
- Business rule application
- Instance type recommendations

### Document Generation
- Professional PDF proposals with company branding
- Word documents for internal review
- Excel exports for detailed analysis
- S3 storage with lifecycle management

### Security & Compliance
- AWS Cognito authentication
- Role-based access control (Sales, Pre-Sales, Admin)
- Data encryption at rest and in transit
- Audit logging for compliance
- GDPR-compliant data handling

## Development Setup

### Prerequisites
- Node.js 18.x
- AWS CLI configured
- SAM CLI installed
- Docker (for local testing)

### Local Development
```bash
# Install dependencies for all Lambda functions
cd src/lambda/cost-calculator && npm install
cd ../excel-processor && npm install
cd ../document-generator && npm install
cd ../user-management && npm install
cd ../auth-handler && npm install

# Start local API Gateway
sam local start-api --template src/infrastructure/template.yaml

# Run tests
npm test
```

### Deployment
```bash
# Build and deploy to development environment
sam build --template src/infrastructure/template.yaml
sam deploy --guided --parameter-overrides Environment=dev

# Deploy to staging
sam deploy --parameter-overrides Environment=staging

# Deploy to production
sam deploy --parameter-overrides Environment=prod
```

## Environment Variables
Each Lambda function uses these environment variables:
- `ENVIRONMENT`: Deployment environment (dev/staging/prod)
- `MAIN_TABLE`: DynamoDB main table name
- `PRICING_TABLE`: DynamoDB pricing data table name
- `DOCUMENTS_BUCKET`: S3 bucket for generated documents
- `UPLOADS_BUCKET`: S3 bucket for file uploads

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh token
- `POST /auth/reset-password` - Password reset

### User Management
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile

### Estimations
- `GET /estimations` - List user estimations
- `POST /estimations` - Create new estimation
- `GET /estimations/{id}` - Get estimation details
- `PUT /estimations/{id}` - Update estimation
- `DELETE /estimations/{id}` - Delete estimation

### Excel Processing
- `POST /excel/upload` - Upload Excel file
- `POST /excel/validate` - Validate Excel template
- `POST /excel/process` - Process and map Excel data

### Cost Calculations
- `POST /calculations/cost` - Calculate costs
- `POST /calculations/compare` - Compare configurations
- `GET /calculations/pricing-data` - Get pricing data

### Document Generation
- `POST /documents/generate` - Generate document
- `GET /documents/{id}` - Get document details
- `GET /documents/{id}/download` - Download document

## Database Schema
Single-table DynamoDB design with the following entities:
- **Users:** User profiles and preferences
- **Estimations:** Project metadata and requirements
- **Calculations:** Cost calculation results
- **Documents:** Generated document metadata
- **Audit Logs:** User activity tracking
- **Pricing Data:** AWS service pricing (with TTL)

## Testing Strategy
- **Unit Tests:** Individual function testing
- **Integration Tests:** API endpoint testing
- **End-to-End Tests:** Complete workflow testing
- **Performance Tests:** Load and stress testing
- **Security Tests:** Vulnerability scanning

## Monitoring & Logging
- **CloudWatch Logs:** All Lambda function logs
- **CloudWatch Metrics:** Custom business metrics
- **X-Ray Tracing:** Request tracing and performance analysis
- **CloudWatch Alarms:** Error rate and latency monitoring

## Cost Optimization
- **Serverless Architecture:** Pay-per-use pricing model
- **DynamoDB On-Demand:** Automatic scaling without provisioning
- **S3 Lifecycle Policies:** Automatic cleanup of temporary files
- **Lambda Memory Optimization:** Right-sized memory allocation
- **CloudFront Caching:** Reduced API Gateway costs

## Security Measures
- **IAM Roles:** Least privilege access
- **KMS Encryption:** Customer-managed keys
- **VPC Isolation:** Network security (where applicable)
- **Input Validation:** Comprehensive request validation
- **Rate Limiting:** API throttling and quotas
- **HTTPS Only:** TLS 1.3 encryption

## Compliance Features
- **Audit Logging:** Complete user activity tracking
- **Data Retention:** Configurable retention policies
- **Data Export:** GDPR-compliant data export
- **Data Deletion:** Right to be forgotten implementation
- **Encryption:** End-to-end data protection

## Performance Targets
- **API Response Time:** < 2 seconds
- **Document Generation:** < 10 seconds
- **File Upload Processing:** < 60 seconds
- **Concurrent Users:** 50+ simultaneous users
- **Availability:** 99.5% uptime during business hours

## Next Steps
1. Implement remaining Lambda functions (user-management, auth-handler)
2. Create React frontend application
3. Add comprehensive unit tests
4. Set up CI/CD pipeline
5. Performance optimization and monitoring
6. Security testing and compliance validation
7. User acceptance testing with sales team