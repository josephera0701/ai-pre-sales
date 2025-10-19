# Excel Processor Service

## Overview
The Excel Processor Service handles Excel template validation and data mapping for the AWS Cost Estimation Platform. It provides secure file upload, template validation, and data processing capabilities.

## Features
- **File Upload**: Secure Excel file upload to S3 with metadata tracking
- **Template Validation**: Validates Excel files against predefined schemas
- **Data Processing**: Extracts and maps Excel data with configurable field mapping
- **Template Management**: Provides available template schemas and descriptions
- **Processing History**: Tracks user upload and processing history
- **Security**: User-based access control and data isolation

## API Endpoints

### POST /excel/upload
Upload Excel file for processing.

**Request:**
```json
{
  "fileName": "cost-estimation.xlsx",
  "fileContent": "base64-encoded-file-content",
  "templateType": "cost-estimation"
}
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "uploadId": "abc123",
  "sheetNames": ["Infrastructure", "Pricing", "Summary"],
  "s3Key": "uploads/user123/1234567890-cost-estimation.xlsx"
}
```

### POST /excel/validate
Validate uploaded Excel file against template schema.

**Request:**
```json
{
  "uploadId": "abc123",
  "templateType": "cost-estimation"
}
```

**Response:**
```json
{
  "message": "Template validation completed",
  "uploadId": "abc123",
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": [],
    "templateType": "cost-estimation",
    "validatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### POST /excel/process
Process validated Excel data with optional field mapping.

**Request:**
```json
{
  "uploadId": "abc123",
  "mappingConfig": {
    "Infrastructure": {
      "service": "Service",
      "type": "Type",
      "quantity": "Quantity"
    }
  }
}
```

**Response:**
```json
{
  "message": "Data processing completed",
  "processId": "def456",
  "recordCount": 150,
  "summary": {
    "totalSheets": 3,
    "totalRecords": 150,
    "uniqueServices": 8,
    "uniqueRegions": 3
  }
}
```

### GET /excel/templates
Get available template schemas.

**Response:**
```json
{
  "templates": [
    {
      "templateType": "cost-estimation",
      "schema": {
        "requiredSheets": ["Infrastructure", "Pricing", "Summary"],
        "sheetValidations": { ... }
      },
      "description": "AWS cost estimation template with Infrastructure, Pricing, and Summary sheets"
    }
  ],
  "totalCount": 1
}
```

### GET /excel/processed/{processId}
Get processed data by process ID.

**Response:**
```json
{
  "processId": "def456",
  "data": {
    "templateType": "cost-estimation",
    "sheets": {
      "Infrastructure": {
        "data": [...],
        "recordCount": 50,
        "columns": ["service", "type", "quantity"]
      }
    },
    "totalRecords": 150,
    "summary": { ... }
  }
}
```

### GET /excel/history
Get user's processing history.

**Response:**
```json
{
  "history": [
    {
      "uploadId": "abc123",
      "processId": "def456",
      "fileName": "cost-estimation.xlsx",
      "templateType": "cost-estimation",
      "status": "processed",
      "uploadedAt": "2023-01-01T00:00:00Z",
      "processedAt": "2023-01-01T00:05:00Z"
    }
  ],
  "totalCount": 1
}
```

## Template Schemas

### Cost Estimation Template
Required sheets and columns:

**Infrastructure Sheet:**
- Service (string): AWS service name
- Type (string): Service type/instance type
- Quantity (number): Resource quantity
- Region (string): AWS region

**Pricing Sheet:**
- Service (string): AWS service name
- Unit (string): Pricing unit
- Price (number): Unit price
- Currency (string): Price currency

**Summary Sheet:**
- Free-form summary data

## Data Processing Flow

1. **Upload**: User uploads Excel file with template type
2. **Storage**: File stored in S3, metadata in DynamoDB
3. **Validation**: File validated against template schema
4. **Processing**: Data extracted and mapped according to configuration
5. **Storage**: Processed data stored with unique process ID
6. **Retrieval**: User can retrieve processed data and history

## Error Handling

### Validation Errors
- Missing required sheets
- Missing required columns
- Invalid data types
- Empty sheets

### Processing Errors
- File not found
- Unvalidated files
- Mapping configuration errors
- Storage failures

## Security Features

- **Authentication**: Requires x-user-id header
- **Authorization**: Users can only access their own data
- **Data Isolation**: User data stored with user ID prefix
- **Input Validation**: All inputs validated and sanitized
- **Error Handling**: Secure error messages without data leakage

## Performance Characteristics

- **File Size**: Supports Excel files up to 10MB
- **Processing Time**: < 30 seconds for typical files
- **Concurrent Users**: Supports 100+ concurrent uploads
- **Storage**: Efficient S3 storage with lifecycle policies
- **Memory**: Optimized for Lambda 512MB memory limit

## Dependencies

- **aws-sdk**: AWS service integration
- **xlsx**: Excel file parsing and processing
- **jest**: Testing framework

## Environment Variables

- `TEMPLATES_TABLE`: DynamoDB table for template metadata
- `PROCESSED_DATA_TABLE`: DynamoDB table for processed data
- `TEMPLATES_BUCKET`: S3 bucket for file storage
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

## Deployment

The service is deployed as an AWS Lambda function with:
- 512MB memory allocation
- 30-second timeout
- API Gateway integration
- DynamoDB and S3 permissions