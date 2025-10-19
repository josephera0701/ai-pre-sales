# Document Generator Service

## Overview
The Document Generator Service creates professional PDF, Word, and Excel documents from AWS cost estimation data. It provides secure document generation, storage, and download capabilities for the cost estimation platform.

## Features
- **Multi-Format Generation**: PDF, Word (DOCX), and Excel (XLSX) document creation
- **Template Support**: Multiple document templates (standard, executive, detailed)
- **Secure Storage**: Documents stored in S3 with presigned download URLs
- **Document Tracking**: Complete document lifecycle management
- **Client Branding**: Customizable client information and branding
- **Cost Visualization**: Professional cost breakdowns and recommendations

## API Endpoints

### POST /documents/generate
Generate a new document from estimation data.

**Request:**
```json
{
  "documentType": "pdf",
  "templateType": "standard",
  "estimationData": {
    "totalMonthlyCost": 150.50,
    "costBreakdown": {
      "EC2": 73.92,
      "S3": 23.00,
      "RDS": 53.58
    },
    "recommendations": [
      {
        "title": "Consider Reserved Instances",
        "savings": 25.50,
        "priority": "High"
      }
    ]
  },
  "clientInfo": {
    "companyName": "Acme Corp",
    "contactName": "John Doe",
    "email": "john@acme.com"
  },
  "options": {
    "includeLogo": true,
    "includeCharts": false
  }
}
```

**Response:**
```json
{
  "message": "Document generated successfully",
  "documentId": "abc123",
  "documentType": "pdf",
  "fileSize": 245760,
  "downloadUrl": "/documents/abc123/download"
}
```

### GET /documents/{id}/status
Get document generation status.

**Response:**
```json
{
  "documentId": "abc123",
  "status": "completed",
  "documentType": "pdf",
  "createdAt": "2023-01-01T00:00:00Z",
  "completedAt": "2023-01-01T00:01:30Z",
  "fileSize": 245760,
  "downloadUrl": "/documents/abc123/download"
}
```

### GET /documents/{id}/download
Get secure download URL for completed document.

**Response:**
```json
{
  "documentId": "abc123",
  "downloadUrl": "https://s3.amazonaws.com/bucket/signed-url",
  "expiresIn": 3600,
  "fileSize": 245760,
  "contentType": "application/pdf"
}
```

### GET /documents
Get user's document history.

**Response:**
```json
{
  "documents": [
    {
      "documentId": "abc123",
      "documentType": "pdf",
      "templateType": "standard",
      "status": "completed",
      "createdAt": "2023-01-01T00:00:00Z",
      "fileSize": 245760,
      "clientInfo": {
        "companyName": "Acme Corp"
      }
    }
  ],
  "totalCount": 1
}
```

### GET /documents/templates
Get available document templates.

**Response:**
```json
{
  "templates": [
    {
      "templateType": "standard",
      "name": "Standard Cost Proposal",
      "description": "Professional cost estimation proposal with AWS service breakdown",
      "supportedFormats": ["pdf", "word", "excel"]
    },
    {
      "templateType": "executive",
      "name": "Executive Summary",
      "description": "High-level executive summary with key metrics",
      "supportedFormats": ["pdf", "word"]
    }
  ],
  "totalCount": 2
}
```

## Document Types

### PDF Documents
- **Library**: PDFKit
- **Features**: Professional layout, charts, tables, branding
- **Use Cases**: Client proposals, executive summaries
- **File Size**: Typically 200-500KB

### Word Documents (DOCX)
- **Library**: docx
- **Features**: Editable format, professional styling, tables
- **Use Cases**: Collaborative editing, detailed reports
- **File Size**: Typically 50-200KB

### Excel Documents (XLSX)
- **Library**: xlsx
- **Features**: Multiple sheets, formulas, data analysis
- **Use Cases**: Detailed cost analysis, budget planning
- **File Size**: Typically 20-100KB

## Template Types

### Standard Template
- **Description**: Professional cost estimation proposal
- **Sections**: Client info, cost summary, service breakdown, recommendations
- **Formats**: PDF, Word, Excel
- **Use Case**: Standard client proposals

### Executive Template
- **Description**: High-level executive summary
- **Sections**: Executive summary, key metrics, strategic recommendations
- **Formats**: PDF, Word
- **Use Case**: C-level presentations

### Detailed Template
- **Description**: Comprehensive technical report
- **Sections**: Technical details, cost analysis, implementation plan
- **Formats**: PDF, Word, Excel
- **Use Case**: Technical stakeholder reviews

## Document Generation Process

1. **Request Validation**: Validate document type and estimation data
2. **Document Creation**: Generate document using appropriate library
3. **Content Population**: Fill template with estimation data and client info
4. **S3 Storage**: Store generated document in secure S3 bucket
5. **Metadata Storage**: Save document metadata in DynamoDB
6. **Response**: Return document ID and download URL

## Security Features

- **Authentication**: Requires x-user-id header for all operations
- **Authorization**: Users can only access their own documents
- **Secure Storage**: Documents stored in private S3 bucket
- **Presigned URLs**: Time-limited download URLs (1 hour expiry)
- **Data Isolation**: User documents completely isolated
- **Input Validation**: All inputs validated and sanitized

## Performance Characteristics

- **PDF Generation**: 2-5 seconds for standard documents
- **Word Generation**: 1-3 seconds for standard documents
- **Excel Generation**: 1-2 seconds for standard documents
- **File Storage**: < 1 second S3 upload
- **Download URL**: < 100ms presigned URL generation
- **Memory Usage**: 512MB-1GB depending on document complexity

## Error Handling

### Generation Errors
- Invalid document type
- Missing estimation data
- Template processing failures
- S3 storage failures

### Access Errors
- Document not found
- Unauthorized access
- Document not ready for download
- Expired download URLs

### System Errors
- DynamoDB connection issues
- S3 service unavailable
- Memory allocation failures
- Timeout errors

## Dependencies

- **aws-sdk**: AWS service integration
- **pdfkit**: PDF document generation
- **docx**: Word document generation
- **xlsx**: Excel document generation
- **jest**: Testing framework

## Environment Variables

- `DOCUMENTS_TABLE`: DynamoDB table for document metadata
- `DOCUMENTS_BUCKET`: S3 bucket for generated documents
- `TEMPLATES_BUCKET`: S3 bucket for document templates
- `AWS_REGION`: AWS region for services

## Testing

Run tests with coverage:
```bash
npm test
```

Watch mode for development:
```bash
npm run test:watch
```

## Integration Points

### Cost Calculator Service
- Consumes cost estimation data
- Formats cost breakdowns and recommendations
- Integrates pricing analysis

### Excel Processor Service
- Uses processed Excel data for document generation
- Maintains data consistency across services
- Supports template-based generation

### User Management Service
- Applies user preferences and branding
- Manages document access permissions
- Tracks user document history

## Deployment

The service is deployed as an AWS Lambda function with:
- 1GB memory allocation (document generation intensive)
- 120-second timeout (complex document generation)
- API Gateway integration
- DynamoDB and S3 permissions
- Enhanced monitoring and logging