#!/bin/bash

# Deploy Dashboard API Service to AWS Lambda
# Integrates with main API Gateway (9u3ohhh561)

set -e

FUNCTION_NAME="dashboard-api-service-staging"
API_GATEWAY_ID="9u3ohhh561"
REGION="us-east-1"

echo "🚀 Deploying Dashboard API Service..."

# Create deployment package
cd src
zip -r ../dashboard-api-service.zip .
cd ..

# Create IAM role if it doesn't exist
ROLE_NAME="lambda-execution-role"
ROLE_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/$ROLE_NAME"

if ! aws iam get-role --role-name $ROLE_NAME >/dev/null 2>&1; then
    echo "🔐 Creating IAM role: $ROLE_NAME"
    aws iam create-role \
        --role-name $ROLE_NAME \
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
        --region $REGION
    
    # Attach basic execution policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --region $REGION
    
    echo "⏳ Waiting for role to be available..."
    sleep 10
fi

# Deploy Lambda function
echo "📦 Deploying Lambda function: $FUNCTION_NAME"
aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs18.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb://dashboard-api-service.zip \
    --timeout 30 \
    --memory-size 256 \
    --environment Variables='{
        "NODE_ENV":"staging"
    }' \
    --region $REGION 2>/dev/null || \
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://dashboard-api-service.zip \
    --region $REGION

# Get Lambda function ARN
LAMBDA_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --query 'Configuration.FunctionArn' --output text --region $REGION)
echo "✅ Lambda function deployed: $LAMBDA_ARN"

# Add API Gateway integration for /admin/metrics
echo "🔗 Adding /admin/metrics endpoint to API Gateway..."
ADMIN_METRICS_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_GATEWAY_ID --query 'items[?pathPart==`admin`].id' --output text --region $REGION)

if [ -z "$ADMIN_METRICS_RESOURCE_ID" ]; then
    # Create /admin resource
    ROOT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_GATEWAY_ID --query 'items[?pathPart==``].id' --output text --region $REGION)
    ADMIN_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_GATEWAY_ID \
        --parent-id $ROOT_RESOURCE_ID \
        --path-part admin \
        --query 'id' --output text --region $REGION)
    
    # Create /admin/metrics resource
    ADMIN_METRICS_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_GATEWAY_ID \
        --parent-id $ADMIN_RESOURCE_ID \
        --path-part metrics \
        --query 'id' --output text --region $REGION)
else
    echo "Admin resource already exists"
fi

# Add GET method for /admin/metrics
aws apigateway put-method \
    --rest-api-id $API_GATEWAY_ID \
    --resource-id $ADMIN_METRICS_RESOURCE_ID \
    --http-method GET \
    --authorization-type NONE \
    --region $REGION 2>/dev/null || echo "GET method already exists"

# Add OPTIONS method for CORS
aws apigateway put-method \
    --rest-api-id $API_GATEWAY_ID \
    --resource-id $ADMIN_METRICS_RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region $REGION 2>/dev/null || echo "OPTIONS method already exists"

# Add Lambda integration for GET
aws apigateway put-integration \
    --rest-api-id $API_GATEWAY_ID \
    --resource-id $ADMIN_METRICS_RESOURCE_ID \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION 2>/dev/null || echo "GET integration already exists"

# Add Lambda integration for OPTIONS
aws apigateway put-integration \
    --rest-api-id $API_GATEWAY_ID \
    --resource-id $ADMIN_METRICS_RESOURCE_ID \
    --http-method OPTIONS \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION 2>/dev/null || echo "OPTIONS integration already exists"

# Add /estimations endpoint
echo "🔗 Adding /estimations endpoint to API Gateway..."
ROOT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_GATEWAY_ID --query 'items[?pathPart==``].id' --output text --region $REGION)
ESTIMATIONS_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_GATEWAY_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part estimations \
    --query 'id' --output text --region $REGION 2>/dev/null || \
aws apigateway get-resources --rest-api-id $API_GATEWAY_ID --query 'items[?pathPart==`estimations`].id' --output text --region $REGION)

# Add GET method for /estimations
aws apigateway put-method \
    --rest-api-id $API_GATEWAY_ID \
    --resource-id $ESTIMATIONS_RESOURCE_ID \
    --http-method GET \
    --authorization-type NONE \
    --region $REGION 2>/dev/null || echo "GET method already exists"

# Add OPTIONS method for CORS
aws apigateway put-method \
    --rest-api-id $API_GATEWAY_ID \
    --resource-id $ESTIMATIONS_RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region $REGION 2>/dev/null || echo "OPTIONS method already exists"

# Add Lambda integration for GET
aws apigateway put-integration \
    --rest-api-id $API_GATEWAY_ID \
    --resource-id $ESTIMATIONS_RESOURCE_ID \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION 2>/dev/null || echo "GET integration already exists"

# Add Lambda integration for OPTIONS
aws apigateway put-integration \
    --rest-api-id $API_GATEWAY_ID \
    --resource-id $ESTIMATIONS_RESOURCE_ID \
    --http-method OPTIONS \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION 2>/dev/null || echo "OPTIONS integration already exists"

# Add Lambda permissions for API Gateway
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-admin-metrics \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_GATEWAY_ID/*/*" \
    --region $REGION 2>/dev/null || echo "Permission already exists"

# Deploy API Gateway changes
echo "🚀 Deploying API Gateway changes..."
aws apigateway create-deployment \
    --rest-api-id $API_GATEWAY_ID \
    --stage-name staging \
    --description "Added dashboard API endpoints" \
    --region $REGION

echo "✅ Dashboard API Service deployed successfully!"
echo "📍 Endpoints available:"
echo "   GET https://$API_GATEWAY_ID.execute-api.$REGION.amazonaws.com/staging/admin/metrics"
echo "   GET https://$API_GATEWAY_ID.execute-api.$REGION.amazonaws.com/staging/estimations"

# Clean up
rm -f dashboard-api-service.zip