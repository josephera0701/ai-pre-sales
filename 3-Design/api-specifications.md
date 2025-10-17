# API Specifications: AWS Cost Estimation Platform

## Document Information
- **Project:** AWS Cost Estimation Platform for Sagesoft Solutions Inc.
- **Phase:** 3 - System Design
- **Date:** 2024-01-15
- **Version:** 1.0

## 1. API Overview

### 1.1 API Architecture
- **Type:** RESTful API
- **Protocol:** HTTPS only
- **Format:** JSON
- **Authentication:** AWS Cognito JWT tokens
- **Base URL:** `https://api.aws-cost-estimation.sagesoft.com/v1`

### 1.2 Common Headers
```http
Content-Type: application/json
Authorization: Bearer <jwt-token>
X-API-Version: 1.0
X-Request-ID: <uuid>
```

### 1.3 Standard Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-123456"
}
```

### 1.4 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-123456"
}
```

## 2. Authentication Endpoints

### 2.1 User Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john.doe@sagesoft.com",
  "password": "SecurePassword123!",
  "rememberMe": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "userId": "user123",
      "email": "john.doe@sagesoft.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Sales"
    }
  }
}
```

### 2.2 Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2.3 Logout
```http
POST /auth/logout
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2.4 Password Reset Request
```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "email": "john.doe@sagesoft.com"
}
```

## 3. User Management Endpoints

### 3.1 Get Current User Profile
```http
GET /users/me
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "email": "john.doe@sagesoft.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Sales",
    "department": "Sales",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-15T09:30:00Z",
    "preferences": {
      "defaultCurrency": "USD",
      "defaultRegion": "us-east-1",
      "notificationSettings": {
        "emailNotifications": true,
        "documentReady": true,
        "sharedEstimations": true
      }
    }
  }
}
```

### 3.2 Update User Profile
```http
PUT /users/me
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "preferences": {
    "defaultCurrency": "EUR",
    "defaultRegion": "eu-west-1",
    "notificationSettings": {
      "emailNotifications": false,
      "documentReady": true,
      "sharedEstimations": true
    }
  }
}
```

## 4. Estimation Management Endpoints

### 4.1 Get All Estimations
```http
GET /estimations?page=1&limit=20&status=ACTIVE&sortBy=createdAt&sortOrder=desc
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (ACTIVE, ARCHIVED, DELETED)
- `sortBy` (optional): Sort field (createdAt, updatedAt, projectName)
- `sortOrder` (optional): Sort order (asc, desc)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "estimations": [
      {
        "estimationId": "est456",
        "projectName": "Client ABC Infrastructure",
        "description": "AWS infrastructure cost estimation for Client ABC",
        "status": "ACTIVE",
        "inputMethod": "EXCEL_UPLOAD",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "clientInfo": {
          "companyName": "ABC Corporation",
          "industry": "E-commerce"
        },
        "estimationSummary": {
          "totalMonthlyCost": 8500.00,
          "totalAnnualCost": 102000.00,
          "currency": "USD",
          "lastCalculatedAt": "2024-01-15T10:30:00Z"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 95,
      "itemsPerPage": 20
    }
  }
}
```

### 4.2 Create New Estimation
```http
POST /estimations
```

**Request Body:**
```json
{
  "projectName": "Client XYZ Infrastructure",
  "description": "AWS cost estimation for Client XYZ migration",
  "inputMethod": "MANUAL_ENTRY",
  "clientInfo": {
    "companyName": "XYZ Corporation",
    "industry": "Healthcare",
    "primaryContact": "Dr. Smith",
    "email": "dr.smith@xyz.com",
    "phone": "+1-555-0199",
    "timeline": "Q3 2024",
    "budgetRange": "100000-200000",
    "regionPreference": ["us-east-1"],
    "complianceRequirements": ["HIPAA", "SOC2"]
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "estimationId": "est789",
    "projectName": "Client XYZ Infrastructure",
    "status": "DRAFT",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

### 4.3 Get Estimation Details
```http
GET /estimations/{estimationId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "estimationId": "est456",
    "projectName": "Client ABC Infrastructure",
    "description": "AWS infrastructure cost estimation for Client ABC",
    "status": "ACTIVE",
    "inputMethod": "EXCEL_UPLOAD",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "clientInfo": {
      "companyName": "ABC Corporation",
      "industry": "E-commerce",
      "primaryContact": "Jane Smith",
      "email": "jane.smith@abc.com",
      "phone": "+1-555-0123",
      "timeline": "Q2 2024",
      "budgetRange": "50000-100000",
      "regionPreference": ["us-east-1", "us-west-2"],
      "complianceRequirements": ["SOC2", "PCI-DSS"]
    },
    "requirements": {
      "computeRequirements": [...],
      "storageRequirements": [...],
      "networkRequirements": {...},
      "databaseRequirements": [...],
      "securityRequirements": {...}
    },
    "estimationSummary": {
      "totalMonthlyCost": 8500.00,
      "totalAnnualCost": 102000.00,
      "currency": "USD",
      "lastCalculatedAt": "2024-01-15T10:30:00Z",
      "costBreakdown": {
        "compute": 4500.00,
        "storage": 1200.00,
        "database": 2000.00,
        "network": 500.00,
        "security": 300.00
      }
    },
    "sharedWith": ["user789", "user101"],
    "tags": ["client-abc", "e-commerce", "production"]
  }
}
```

### 4.4 Update Estimation
```http
PUT /estimations/{estimationId}
```

**Request Body:**
```json
{
  "projectName": "Updated Project Name",
  "description": "Updated description",
  "requirements": {
    "computeRequirements": [
      {
        "serverName": "Web Server",
        "environment": "Production",
        "cpuCores": 8,
        "ramGB": 32,
        "os": "Linux",
        "criticality": "High",
        "utilizationPercent": 75,
        "peakUtilizationPercent": 95,
        "scalingType": "Auto",
        "minInstances": 2,
        "maxInstances": 12,
        "monthlyHours": 744
      }
    ]
  }
}
```

### 4.5 Delete Estimation
```http
DELETE /estimations/{estimationId}
```

**Response (204 No Content)**

### 4.6 Clone Estimation
```http
POST /estimations/{estimationId}/clone
```

**Request Body:**
```json
{
  "projectName": "Cloned Project Name",
  "description": "Cloned from original estimation"
}
```

## 5. Excel Processing Endpoints

### 5.1 Upload Excel File
```http
POST /excel/upload
```

**Request (multipart/form-data):**
```
Content-Type: multipart/form-data

file: <excel-file>
estimationId: est456
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "uploadId": "upload123",
    "fileName": "client_requirements.xlsx",
    "fileSize": 2048576,
    "uploadedAt": "2024-01-15T10:15:00Z",
    "status": "UPLOADED"
  }
}
```

### 5.2 Validate Excel Template
```http
POST /excel/validate
```

**Request Body:**
```json
{
  "uploadId": "upload123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "validationId": "validation456",
    "isValid": true,
    "sheetsValidated": 8,
    "errors": [],
    "warnings": [
      {
        "sheet": "Database_Requirements",
        "row": 3,
        "column": "Backup_Retention",
        "message": "Value exceeds recommended maximum of 35 days"
      }
    ],
    "summary": {
      "clientInfo": "Valid",
      "computeRequirements": "Valid (3 servers)",
      "storageRequirements": "Valid (4 storage types)",
      "networkRequirements": "Valid",
      "databaseRequirements": "Valid (2 databases)",
      "securityRequirements": "Valid"
    }
  }
}
```

### 5.3 Process Excel Data
```http
POST /excel/process
```

**Request Body:**
```json
{
  "validationId": "validation456",
  "estimationId": "est456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "processingId": "process789",
    "status": "COMPLETED",
    "mappedData": {
      "clientInfo": {...},
      "requirements": {...}
    },
    "estimationUpdated": true
  }
}
```

### 5.4 Download Excel Template
```http
GET /excel/template
```

**Response (200 OK):**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="AWS_Cost_Estimation_Template.xlsx"

<binary-excel-data>
```

## 6. Cost Calculation Endpoints

### 6.1 Calculate Costs
```http
POST /calculations/cost
```

**Request Body:**
```json
{
  "estimationId": "est456",
  "region": "us-east-1",
  "pricingModel": "ON_DEMAND",
  "currency": "USD",
  "requirements": {
    "computeRequirements": [...],
    "storageRequirements": [...],
    "networkRequirements": {...},
    "databaseRequirements": [...],
    "securityRequirements": {...}
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "calculationId": "calc123",
    "calculatedAt": "2024-01-15T10:30:00Z",
    "region": "us-east-1",
    "currency": "USD",
    "pricingModel": "ON_DEMAND",
    "totalMonthlyCost": 8500.00,
    "totalAnnualCost": 102000.00,
    "costBreakdown": {
      "compute": {
        "ec2Instances": 4200.00,
        "autoScaling": 300.00,
        "total": 4500.00
      },
      "storage": {
        "ebs": 800.00,
        "s3": 400.00,
        "total": 1200.00
      },
      "database": {
        "rds": 1800.00,
        "elasticache": 200.00,
        "total": 2000.00
      },
      "network": {
        "dataTransfer": 200.00,
        "cloudFront": 150.00,
        "loadBalancer": 150.00,
        "total": 500.00
      },
      "security": {
        "guardDuty": 150.00,
        "cloudTrail": 50.00,
        "kms": 100.00,
        "total": 300.00
      }
    },
    "businessRulesApplied": {
      "bufferPercentage": 10,
      "volumeDiscounts": true,
      "supportPlanIncluded": true
    },
    "recommendations": [
      {
        "type": "COST_OPTIMIZATION",
        "message": "Consider Reserved Instances for 40% savings on compute costs",
        "potentialSavings": 1800.00
      }
    ]
  }
}
```

### 6.2 Compare Configurations
```http
POST /calculations/compare
```

**Request Body:**
```json
{
  "configurations": [
    {
      "name": "Basic Configuration",
      "requirements": {...}
    },
    {
      "name": "Optimized Configuration",
      "requirements": {...}
    },
    {
      "name": "High Performance Configuration",
      "requirements": {...}
    }
  ],
  "region": "us-east-1",
  "pricingModel": "ON_DEMAND"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "comparisonId": "comp456",
    "comparedAt": "2024-01-15T11:00:00Z",
    "configurations": [
      {
        "name": "Basic Configuration",
        "totalMonthlyCost": 6500.00,
        "totalAnnualCost": 78000.00,
        "costBreakdown": {...},
        "performance": "Basic",
        "scalability": "Limited"
      },
      {
        "name": "Optimized Configuration",
        "totalMonthlyCost": 8500.00,
        "totalAnnualCost": 102000.00,
        "costBreakdown": {...},
        "performance": "Good",
        "scalability": "High"
      },
      {
        "name": "High Performance Configuration",
        "totalMonthlyCost": 12500.00,
        "totalAnnualCost": 150000.00,
        "costBreakdown": {...},
        "performance": "Excellent",
        "scalability": "Very High"
      }
    ],
    "recommendation": "Optimized Configuration provides the best balance of cost and performance"
  }
}
```

### 6.3 Get Pricing Data
```http
GET /calculations/pricing-data?service=EC2&region=us-east-1&instanceType=t3.xlarge
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "serviceType": "EC2",
    "region": "us-east-1",
    "instanceType": "t3.xlarge",
    "pricingModel": "ON_DEMAND",
    "pricePerHour": 0.1664,
    "currency": "USD",
    "lastUpdated": "2024-01-15T08:00:00Z",
    "specifications": {
      "vCPUs": 4,
      "memory": "16 GiB",
      "networkPerformance": "Up to 5 Gigabit",
      "ebsOptimized": true
    }
  }
}
```

## 7. Document Generation Endpoints

### 7.1 Generate Document
```http
POST /documents/generate
```

**Request Body:**
```json
{
  "estimationId": "est456",
  "documentType": "PDF_PROPOSAL",
  "template": "standard_proposal",
  "options": {
    "includeExecutiveSummary": true,
    "includeDetailedBreakdown": true,
    "includeArchitectureDiagram": false,
    "branding": "sagesoft",
    "customizations": {
      "logoUrl": "https://sagesoft.com/logo.png",
      "primaryColor": "#0066cc",
      "companyAddress": "123 Business St, City, State 12345"
    }
  }
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "documentId": "doc123",
    "status": "GENERATING",
    "estimatedCompletionTime": "2024-01-15T11:05:00Z",
    "documentType": "PDF_PROPOSAL"
  }
}
```

### 7.2 Get Document Status
```http
GET /documents/{documentId}/status
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "documentId": "doc123",
    "status": "COMPLETED",
    "documentType": "PDF_PROPOSAL",
    "fileName": "ABC_Corporation_AWS_Proposal.pdf",
    "fileSize": 2048576,
    "generatedAt": "2024-01-15T11:03:00Z",
    "downloadUrl": "https://documents.aws-cost-estimation.sagesoft.com/proposals/doc123/download",
    "expiresAt": "2024-07-15T11:03:00Z"
  }
}
```

### 7.3 Download Document
```http
GET /documents/{documentId}/download
```

**Response (200 OK):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="ABC_Corporation_AWS_Proposal.pdf"
Content-Length: 2048576

<binary-pdf-data>
```

### 7.4 List Documents
```http
GET /documents?estimationId=est456&documentType=PDF_PROPOSAL
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "documentId": "doc123",
        "documentType": "PDF_PROPOSAL",
        "fileName": "ABC_Corporation_AWS_Proposal.pdf",
        "fileSize": 2048576,
        "generatedAt": "2024-01-15T11:03:00Z",
        "downloadCount": 3,
        "lastDownloadedAt": "2024-01-15T14:30:00Z"
      }
    ]
  }
}
```

### 7.5 Export to Excel
```http
POST /documents/export
```

**Request Body:**
```json
{
  "estimationId": "est456",
  "format": "EXCEL",
  "includeCalculations": true,
  "includeCharts": true
}
```

## 8. Sharing and Collaboration Endpoints

### 8.1 Share Estimation
```http
POST /estimations/{estimationId}/share
```

**Request Body:**
```json
{
  "shareWithUsers": [
    {
      "email": "colleague@sagesoft.com",
      "permission": "READ_WRITE"
    }
  ],
  "expiresAt": "2024-04-15T12:00:00Z",
  "message": "Please review this estimation for Client ABC"
}
```

### 8.2 Get Shared Estimations
```http
GET /estimations/shared
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sharedEstimations": [
      {
        "estimationId": "est456",
        "projectName": "Client ABC Infrastructure",
        "sharedBy": "john.doe@sagesoft.com",
        "permission": "READ_WRITE",
        "sharedAt": "2024-01-15T12:00:00Z",
        "expiresAt": "2024-04-15T12:00:00Z"
      }
    ]
  }
}
```

## 9. Admin Endpoints

### 9.1 Get All Users (Admin Only)
```http
GET /admin/users?page=1&limit=50&role=Sales&status=ACTIVE
```

### 9.2 Get Audit Logs (Admin Only)
```http
GET /admin/audit-logs?userId=user123&startDate=2024-01-01&endDate=2024-01-15&action=ESTIMATION_CREATED
```

### 9.3 Get System Metrics (Admin Only)
```http
GET /admin/metrics?period=24h&metric=api_requests,cost_calculations,document_generations
```

## 10. Error Codes

### 10.1 Authentication Errors
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Token invalid
- `AUTH_004`: Insufficient permissions
- `AUTH_005`: Account locked
- `AUTH_006`: MFA required

### 10.2 Validation Errors
- `VAL_001`: Missing required field
- `VAL_002`: Invalid field format
- `VAL_003`: Field value out of range
- `VAL_004`: Invalid file format
- `VAL_005`: File size too large
- `VAL_006`: Excel template structure invalid

### 10.3 Business Logic Errors
- `BIZ_001`: Estimation not found
- `BIZ_002`: Cannot modify shared estimation
- `BIZ_003`: Calculation failed
- `BIZ_004`: Document generation failed
- `BIZ_005`: Pricing data unavailable
- `BIZ_006`: Region not supported

### 10.4 System Errors
- `SYS_001`: Internal server error
- `SYS_002`: Database unavailable
- `SYS_003`: External service unavailable
- `SYS_004`: Rate limit exceeded
- `SYS_005`: Service temporarily unavailable

## 11. Rate Limiting

### 11.1 Rate Limits by Endpoint Category
- **Authentication:** 10 requests per minute
- **Estimation CRUD:** 100 requests per minute
- **Cost Calculations:** 50 requests per minute
- **Document Generation:** 10 requests per minute
- **File Upload:** 5 requests per minute
- **Admin Operations:** 20 requests per minute

### 11.2 Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705315200
```

This API specification provides a comprehensive interface for the AWS Cost Estimation Platform, supporting all required functionality while maintaining security, performance, and usability standards.