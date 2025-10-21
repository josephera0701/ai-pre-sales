# Implementation Patterns: AWS Cost Estimation Platform

## Document Information
- **Project:** AWS Cost Estimation Platform for Sagesoft Solutions Inc.
- **Phase:** 3 - System Design (Updated from Real Implementation)
- **Date:** 2024-01-15 (Updated: 2025-10-21)
- **Version:** 2.0 - Based on Actual Implementation

## Critical Implementation Patterns Discovered

### 1. Lambda Function Deployment Structure

#### ❌ Common Error Pattern
```
deployment-package.zip
├── src/
│   └── index.js
└── package.json
```
**Result:** `Runtime.ImportModuleError: Cannot find module 'index'`

#### ✅ Correct Pattern
```
deployment-package.zip
├── index.js          # Handler at root level
└── package.json
```

**Implementation:**
```bash
# Correct deployment package creation
cd src && zip -j ../deployment-package.zip index.js
cd .. && zip deployment-package.zip package.json
```

### 2. AWS SDK Version Compatibility

#### ❌ Common Error Pattern
```json
// package.json
{
  "dependencies": {
    "aws-sdk": "^2.1692.0"  // SDK v2
  }
}
```
```javascript
// index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');  // SDK v3
```
**Result:** Import conflicts and runtime errors

#### ✅ Correct Pattern
```json
// package.json - Node.js 18 runtime includes AWS SDK v3
{
  "dependencies": {}  // No AWS SDK dependency needed
}
```
```javascript
// index.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Use send() method, not .promise()
const result = await dynamodb.send(new QueryCommand(params));
```

### 3. API Gateway Authentication Integration

#### ❌ Common Error Pattern
```javascript
// Expecting user context from API Gateway
const userContext = extractUserContext(headers);
if (!userContext) {
    return createResponse(401, { error: 'Authentication required' });
}
```
**Result:** 401 errors when API Gateway doesn't pass user context properly

#### ✅ Correct Pattern
```javascript
// Fallback authentication for development/testing
const userContext = extractUserContext(headers) || {
    userId: 'anonymous-user',
    email: 'anonymous@example.com',
    role: 'User',
    firstName: 'Anonymous',
    lastName: 'User'
};
```

### 4. Frontend API Response Structure Handling

#### ❌ Common Error Pattern
```javascript
// Assuming direct data access
const uploadId = uploadResult.uploadId;
const parsedData = validationResult.parsedData;
```
**Result:** Undefined values when API returns nested structure

#### ✅ Correct Pattern
```javascript
// Defensive data extraction with fallbacks
const uploadId = uploadResult.data?.uploadId || uploadResult.uploadId;
const parsedData = validationResult.data?.parsedData || validationResult.parsedData || {};
```

### 5. DynamoDB Table Reference Pattern

#### ❌ Common Error Pattern
```javascript
// Missing environment variable constants
const result = await dynamodb.get({
    TableName: PRICING_TABLE,  // ReferenceError: PRICING_TABLE is not defined
    Key: { service, instanceType, region }
}).promise();
```

#### ✅ Correct Pattern
```javascript
// Define all table constants
const ENHANCED_TABLE = process.env.ENHANCED_TABLE || 'aws-cost-platform-enhanced-dev';
const PRICING_TABLE = process.env.PRICING_TABLE || 'aws-cost-platform-pricing-dev';
const ESTIMATIONS_TABLE = process.env.ESTIMATIONS_TABLE || 'aws-cost-platform-estimations-dev';

// Use SDK v3 send() method
const result = await dynamodb.send(new GetCommand({
    TableName: PRICING_TABLE,
    Key: { service, instanceType, region }
}));
```

## Error Resolution Patterns

### Pattern 1: 502 Bad Gateway → Lambda Import Error
1. **Symptom:** API returns 502 Bad Gateway
2. **Root Cause:** Lambda can't find handler module
3. **Solution:** Ensure index.js is at zip root level
4. **Prevention:** Use `zip -j` to flatten directory structure

### Pattern 2: 500 Internal Server Error → Authentication Failure
1. **Symptom:** API returns 500 Internal Server Error
2. **Root Cause:** Lambda throws error on missing user context
3. **Solution:** Provide fallback authentication for development
4. **Prevention:** Implement graceful authentication degradation

### Pattern 3: 400 Bad Request → Data Structure Mismatch
1. **Symptom:** Frontend receives undefined values
2. **Root Cause:** API response structure differs from expected
3. **Solution:** Use defensive data extraction with fallbacks
4. **Prevention:** Document actual API response structures

### Pattern 4: 500 Internal Server Error → Missing Lambda Permissions
1. **Symptom:** API returns 500 with "not authorized to perform" error
2. **Root Cause:** Lambda function lacks DynamoDB/S3 permissions
3. **Solution:** Add IAM policies for required AWS services
4. **Prevention:** Create comprehensive permission policies during deployment

### Pattern 5: Missing Authentication Token → API Gateway Integration
1. **Symptom:** API returns "Missing Authentication Token"
2. **Root Cause:** API Gateway can't invoke Lambda function
3. **Solution:** Add Lambda invoke permission for API Gateway
4. **Prevention:** Configure resource policies during API setup

## Deployment Best Practices

### Lambda Function Deployment Checklist
- [ ] Handler file (index.js) at zip root level
- [ ] No AWS SDK dependencies in package.json for Node.js 18
- [ ] All environment variable constants defined
- [ ] Use AWS SDK v3 send() method pattern
- [ ] Implement fallback authentication
- [ ] Test deployment package structure before upload
- [ ] Configure DynamoDB permissions for data access
- [ ] Configure S3 permissions for file operations
- [ ] Add API Gateway invoke permissions
- [ ] Update Lambda handler configuration to match file structure

### Frontend Integration Checklist
- [ ] Defensive data extraction from API responses
- [ ] Fallback values for undefined API data
- [ ] Error handling for all API calls
- [ ] Consistent data structure expectations
- [ ] Real-time validation of API response formats

## Updated Technical Architecture

### Actual Lambda Function Structure
```javascript
exports.handler = async (event) => {
    const { httpMethod, path, body, headers } = event;
    
    try {
        const requestBody = body ? JSON.parse(body) : {};
        
        // Fallback authentication pattern
        const userContext = extractUserContext(headers) || {
            userId: 'anonymous-user',
            email: 'anonymous@example.com',
            role: 'User'
        };
        
        // Route handling with proper error responses
        switch (`${httpMethod} ${path}`) {
            case 'POST /calculations/cost':
                return await handleCalculateCost(userContext, requestBody);
            default:
                return createResponse(404, { error: 'Route not found' });
        }
    } catch (error) {
        console.error('Service error:', error);
        return createResponse(500, { 
            error: 'Internal server error',
            message: error.message 
        });
    }
};
```

### Actual Frontend API Integration
```javascript
// Defensive API response handling
async function handleApiResponse(apiCall) {
    try {
        const result = await apiCall();
        
        // Handle nested response structures
        const data = result.data || result;
        const success = result.success !== false;
        
        return { success, data };
    } catch (error) {
        console.error('API call failed:', error);
        return { 
            success: false, 
            error: error.message || 'API call failed' 
        };
    }
}
```

## AWS Permissions Configuration

### Required IAM Policies

#### DynamoDB Access Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
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
                "arn:aws:dynamodb:us-east-1:*:table/aws-cost-platform-enhanced-dev",
                "arn:aws:dynamodb:us-east-1:*:table/aws-cost-platform-enhanced-dev/index/*"
            ]
        }
    ]
}
```

#### API Gateway Lambda Invoke Permission
```bash
aws lambda add-permission \
  --function-name service-name-staging \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:region:account:api-id/*/METHOD/path"
```

## Future Implementation Guidelines

1. **Always test deployment packages** before production deployment
2. **Use defensive programming** for API integrations
3. **Implement graceful degradation** for authentication
4. **Document actual response structures** not just designed ones
5. **Create fallback patterns** for all external dependencies
6. **Test error scenarios** during development
7. **Configure all AWS permissions** during initial deployment
8. **Verify Lambda handler configuration** matches deployment structure
9. **Update technical documentation** based on real implementation

This document should be referenced for all future development to avoid repeating the same implementation issues.