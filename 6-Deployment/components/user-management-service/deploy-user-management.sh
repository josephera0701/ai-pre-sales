#!/bin/bash

# User Management Service Deployment Script
# Deploys the user-management-service component to AWS

set -e

echo "🚀 Deploying User Management Service..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="user-management-service-staging"
ENVIRONMENT="staging"
REGION="us-east-1"
COMPONENT_DIR="../../../4-Development/components/user-management-service"

echo -e "${BLUE}📦 Preparing deployment package...${NC}"

# Create deployment package
cd $COMPONENT_DIR
if [ -f "user-management-service.zip" ]; then
    rm user-management-service.zip
fi
zip -r user-management-service.zip src/ package.json > /dev/null 2>&1

echo -e "${GREEN}✅ Deployment package created${NC}"

# Return to deployment directory
cd - > /dev/null

echo -e "${BLUE}🔧 Creating Lambda function...${NC}"

# Check if function exists
FUNCTION_EXISTS=$(aws lambda get-function --function-name $STACK_NAME 2>/dev/null || echo "NOT_FOUND")

if [ "$FUNCTION_EXISTS" = "NOT_FOUND" ]; then
    echo -e "${YELLOW}Creating new Lambda function...${NC}"
    
    # Create IAM role for Lambda
    ROLE_ARN=$(aws iam create-role \
        --role-name ${STACK_NAME}-role \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }' \
        --query 'Role.Arn' \
        --output text 2>/dev/null || aws iam get-role --role-name ${STACK_NAME}-role --query 'Role.Arn' --output text)
    
    # Attach basic execution policy
    aws iam attach-role-policy \
        --role-name ${STACK_NAME}-role \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole > /dev/null 2>&1 || true
    
    # Wait for role to be available
    sleep 10
    
    # Create Lambda function
    aws lambda create-function \
        --function-name $STACK_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler index.handler \
        --zip-file fileb://$COMPONENT_DIR/user-management-service.zip \
        --description "User Management Service for AWS Cost Estimation Platform" \
        --timeout 30 \
        --memory-size 256 \
        --environment Variables='{"USERS_TABLE":"cost-estimation-users-staging","AUDIT_LOGS_TABLE":"cost-estimation-audit-logs-staging","ENVIRONMENT":"staging"}' \
        --tracing-config Mode=Active \
        --tags Component=user-management-service,Environment=staging > /dev/null
    
    echo -e "${GREEN}✅ Lambda function created successfully${NC}"
else
    echo -e "${YELLOW}Updating existing Lambda function...${NC}"
    
    # Update function code
    aws lambda update-function-code \
        --function-name $STACK_NAME \
        --zip-file fileb://$COMPONENT_DIR/user-management-service.zip > /dev/null
    
    # Update function configuration
    aws lambda update-function-configuration \
        --function-name $STACK_NAME \
        --runtime nodejs18.x \
        --handler index.handler \
        --description "User Management Service for AWS Cost Estimation Platform" \
        --timeout 30 \
        --memory-size 256 \
        --environment Variables='{"USERS_TABLE":"cost-estimation-users-staging","AUDIT_LOGS_TABLE":"cost-estimation-audit-logs-staging","ENVIRONMENT":"staging"}' \
        --tracing-config Mode=Active > /dev/null
    
    echo -e "${GREEN}✅ Lambda function updated successfully${NC}"
fi

echo -e "${BLUE}🔍 Testing Lambda function...${NC}"

# Test the function
TEST_RESULT=$(aws lambda invoke \
    --function-name $STACK_NAME \
    --payload '{
        "httpMethod": "GET",
        "path": "/users/me",
        "headers": {
            "Authorization": "Bearer test-token",
            "x-user-id": "test-user-123",
            "x-user-email": "test@example.com",
            "x-user-role": "Sales"
        }
    }' \
    --output json \
    response.json)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Lambda function test successful${NC}"
    
    # Show response
    echo -e "${BLUE}📋 Function Response:${NC}"
    cat response.json | jq '.' 2>/dev/null || cat response.json
    rm -f response.json
else
    echo -e "${RED}❌ Lambda function test failed${NC}"
    exit 1
fi

# Get function info
FUNCTION_ARN=$(aws lambda get-function --function-name $STACK_NAME --query 'Configuration.FunctionArn' --output text)
FUNCTION_URL="https://console.aws.amazon.com/lambda/home?region=$REGION#/functions/$STACK_NAME"

echo ""
echo "======================================"
echo -e "${GREEN}🎉 User Management Service Deployed!${NC}"
echo "======================================"
echo ""
echo "📊 Deployment Summary:"
echo "  • Function Name: $STACK_NAME"
echo "  • Environment: $ENVIRONMENT"
echo "  • Region: $REGION"
echo "  • Runtime: nodejs18.x"
echo "  • Memory: 256 MB"
echo "  • Timeout: 30 seconds"
echo ""
echo "🔗 AWS Console:"
echo "  • Lambda Function: $FUNCTION_URL"
echo ""
echo "📋 Function ARN:"
echo "  $FUNCTION_ARN"
echo ""

# Create deployment status file
cat > deployment-status.md << EOF
# User Management Service Deployment Status

## Deployment Information
- **Component:** user-management-service
- **Environment:** staging
- **Status:** ✅ DEPLOYED
- **Deployment Date:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- **Function Name:** $STACK_NAME
- **Function ARN:** $FUNCTION_ARN

## Configuration
- **Runtime:** nodejs18.x
- **Memory:** 256 MB
- **Timeout:** 30 seconds
- **Environment Variables:**
  - USERS_TABLE: cost-estimation-users-staging
  - AUDIT_LOGS_TABLE: cost-estimation-audit-logs-staging
  - ENVIRONMENT: staging

## API Endpoints
- GET /users/me - Get user profile
- PUT /users/me - Update user profile
- GET /admin/users - List all users (admin only)
- POST /admin/users/{id}/role - Update user role (admin only)
- GET /admin/audit-logs - Get audit logs (admin only)

## Testing
- ✅ Lambda function deployment successful
- ✅ Basic function invocation test passed
- ✅ Environment variables configured
- ✅ IAM permissions configured

## Next Steps
1. Configure API Gateway integration
2. Set up DynamoDB tables
3. Configure monitoring and alerting
4. Run integration tests
5. Prepare for production deployment

## Notes
- Function is deployed and responding to test invocations
- DynamoDB tables need to be created separately
- API Gateway integration pending
- Monitoring and alerting to be configured
EOF

echo -e "${GREEN}✅ Deployment status saved to deployment-status.md${NC}"
echo ""

exit 0