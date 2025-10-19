# Excel Processor Service Test Plan

## Test Overview
Comprehensive testing strategy for the Excel Processor Service covering file upload, template validation, data processing, and integration capabilities.

## Test Scope
- Excel file upload and storage
- Template validation against schemas
- Data extraction and mapping
- Field mapping configuration
- Integration with auth and user services
- Error handling and edge cases
- Performance benchmarks

## Test Categories

### 1. Unit Tests (95% Coverage Target)
**Location:** `4-Development/components/excel-processor-service/tests/`

**File Upload Tests:**
- ✅ POST /excel/upload - Successful file upload
- ✅ POST /excel/upload - Missing required fields validation
- ✅ POST /excel/upload - Authentication required
- ✅ POST /excel/upload - Invalid Excel file handling
- ✅ S3 storage integration
- ✅ DynamoDB metadata storage

**Template Validation Tests:**
- ✅ POST /excel/validate - Successful validation
- ✅ POST /excel/validate - Missing required sheets detection
- ✅ POST /excel/validate - Missing required columns detection
- ✅ POST /excel/validate - Data type validation
- ✅ POST /excel/validate - Non-existent upload handling
- ✅ Template schema compliance

**Data Processing Tests:**
- ✅ POST /excel/process - Successful data processing
- ✅ POST /excel/process - Field mapping application
- ✅ POST /excel/process - Unvalidated file rejection
- ✅ POST /excel/process - Data summary generation
- ✅ Multi-sheet processing
- ✅ Record counting accuracy

**Template Management Tests:**
- ✅ GET /excel/templates - Available templates retrieval
- ✅ Template schema structure
- ✅ Template descriptions

**Data Retrieval Tests:**
- ✅ GET /excel/processed/{id} - Processed data retrieval
- ✅ GET /excel/processed/{id} - Access control validation
- ✅ GET /excel/history - Processing history
- ✅ User data isolation

**Error Handling Tests:**
- ✅ DynamoDB error handling
- ✅ S3 error handling
- ✅ Unknown endpoint handling
- ✅ Malformed request handling

**Coverage Metrics:**
- Functions: 95%
- Lines: 95%
- Branches: 90%

### 2. Integration Tests
**Location:** `5-Testing/integration-tests/excel-processor-integration.test.js`

**Cross-Component Integration:**
- Authentication service integration
- User management service integration
- Cost calculator service data flow
- Complete file processing workflow
- Error propagation handling

**Data Flow Tests:**
- Auth → File Upload → Validation → Processing
- Processed Data → Cost Calculator Integration
- User History → Data Retrieval
- Admin Access → All Processing Data

### 3. Template Validation Tests
**Focus:** Excel template schema compliance

**Test Scenarios:**
- **Cost Estimation Template:**
  - Infrastructure sheet validation
  - Pricing sheet validation
  - Summary sheet validation
  - Required column presence
  - Data type compliance

- **Schema Validation:**
  - Missing sheet detection
  - Extra sheet handling
  - Column name variations
  - Data type mismatches
  - Empty sheet handling

### 4. Data Processing Tests
**Focus:** Excel data extraction and mapping accuracy

**Test Cases:**
- Multi-sheet data extraction
- Field mapping configuration
- Data type conversion
- Summary generation
- Record counting
- Large file processing

### 5. Security Tests
**Focus:** Authentication, authorization, and data protection

**Test Cases:**
- JWT token validation through auth service
- User-based file access control
- Data isolation between users
- Input sanitization and validation
- File content security scanning
- Audit trail completeness

### 6. Performance Tests
**Focus:** Response times and scalability

**Benchmarks:**
- File upload: < 5 seconds (10MB file)
- Template validation: < 3 seconds
- Data processing: < 10 seconds (1000 records)
- Data retrieval: < 1 second
- History retrieval: < 2 seconds
- Concurrent uploads: 50+ files/minute

**Load Testing:**
- Concurrent file uploads: 20+ users
- Memory usage: < 512MB per invocation
- Cold start performance: < 5 seconds
- Large file processing: 10MB+ files

## Test Data

### Sample Excel Files

#### Valid Cost Estimation Template
```
Infrastructure Sheet:
Service    | Type        | Quantity | Region
EC2        | t3.medium   | 2        | us-east-1
Lambda     | 256MB       | 1000000  | us-east-1
S3         | standard    | 1000     | us-east-1

Pricing Sheet:
Service | Unit      | Price | Currency
EC2     | hour      | 0.042 | USD
Lambda  | GB-second | 0.000016667 | USD
S3      | GB-month  | 0.023 | USD

Summary Sheet:
Total Services: 3
Total Monthly Cost: $150.50
```

#### Invalid Templates (for error testing)
- Missing required sheets
- Missing required columns
- Invalid data types
- Empty sheets
- Malformed Excel files

### Test Scenarios

#### Scenario 1: Complete File Processing Workflow
1. User uploads valid Excel file
2. System stores file in S3 and metadata in DynamoDB
3. User validates template against schema
4. System validates all sheets and columns
5. User processes data with mapping configuration
6. System extracts and maps data, generates summary
7. User retrieves processed data and history

#### Scenario 2: Template Validation Errors
1. User uploads Excel file with missing sheets
2. System detects validation errors
3. User receives detailed error report
4. User corrects file and re-uploads
5. System validates successfully

#### Scenario 3: Large File Processing
1. User uploads large Excel file (5MB+)
2. System handles file efficiently
3. Processing completes within time limits
4. Memory usage stays within limits
5. User retrieves processed data

#### Scenario 4: Concurrent User Processing
1. Multiple users upload files simultaneously
2. System processes files independently
3. Data isolation maintained between users
4. All processing completes successfully

## Test Environment Setup

### Prerequisites
- Node.js 18.x
- Jest testing framework
- AWS SDK mocks
- XLSX library
- Sample Excel files

### Environment Variables
```bash
TEMPLATES_TABLE=test-excel-templates
PROCESSED_DATA_TABLE=test-processed-excel-data
TEMPLATES_BUCKET=test-excel-templates-bucket
AWS_REGION=us-east-1
```

### Mock Configuration
- AWS DynamoDB DocumentClient mocked
- AWS S3 service mocked
- XLSX library mocked for controlled testing
- File system mocked for test files
- Error scenarios controlled

## Test Execution

### Unit Tests
```bash
cd 4-Development/components/excel-processor-service
npm test
```

### Integration Tests
```bash
cd 5-Testing/integration-tests
npm test excel-processor-integration.test.js
```

### Component Tests
```bash
cd 5-Testing/component-tests/excel-processor-service
./test-excel-processor-service.sh
```

### Performance Tests
```bash
cd 5-Testing/component-tests/excel-processor-service
./performance-test.sh
```

## Success Criteria

### Functional Requirements
- ✅ All file upload operations work correctly
- ✅ Template validation detects all schema violations
- ✅ Data processing extracts and maps data accurately
- ✅ Field mapping configuration works as expected
- ✅ Integration with auth and user services seamless

### Non-Functional Requirements
- ✅ 95% unit test coverage achieved
- ✅ All integration tests pass
- ✅ Performance benchmarks met
- ✅ Security validations pass
- ✅ Error handling comprehensive

### Quality Gates
- ✅ Zero critical processing errors
- ✅ All template validations accurate
- ✅ Data mapping preserves integrity
- ✅ API responses follow standard format
- ✅ Complete audit trail maintained

## Business Validation

### Template Validation Accuracy
- **Schema Compliance:** All required sheets and columns detected
- **Data Type Validation:** Accurate type checking and reporting
- **Error Reporting:** Clear, actionable error messages
- **Warning System:** Non-critical issues flagged appropriately

### Data Processing Quality
- **Extraction Accuracy:** All data extracted without loss
- **Mapping Precision:** Field mapping applied correctly
- **Summary Generation:** Accurate data summaries
- **Performance:** Processing within acceptable time limits

## Risk Assessment

### High Risk Areas
- **File Size Limits:** Large files may exceed Lambda limits
- **Processing Time:** Complex files may timeout
- **Memory Usage:** Excel parsing may consume excessive memory
- **Data Integrity:** Mapping errors could corrupt data

### Mitigation Strategies
- File size validation before processing
- Streaming processing for large files
- Memory-efficient Excel parsing
- Comprehensive data validation
- Rollback capabilities for failed processing

## Test Schedule
- **Unit Tests:** 4 hours
- **Integration Tests:** 2 hours
- **Template Validation Tests:** 2 hours
- **Data Processing Tests:** 2 hours
- **Performance Tests:** 1 hour
- **Security Tests:** 1 hour

**Total Estimated Time:** 12 hours
**Target Completion:** End of current session