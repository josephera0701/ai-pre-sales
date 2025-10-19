#!/bin/bash

# Document Generator Service Deployment Script
# Component: document-generator-service
# Phase: 6 - Deployment

set -e

echo "🚀 Starting Document Generator Service deployment..."

# Configuration
STACK_NAME="document-generator-service-staging"
TEMPLATE_FILE="template.yaml"
REGION="us-east-1"
S3_BUCKET="sagesoft-cost-platform-staging"

# Validate template
echo "📋 Validating CloudFormation template..."
aws cloudformation validate-template --template-body file://$TEMPLATE_FILE

# Package and deploy
echo "📦 Packaging and deploying to staging..."
sam build --template-file $TEMPLATE_FILE
sam deploy \
  --stack-name $STACK_NAME \
  --s3-bucket $S3_BUCKET \
  --capabilities CAPABILITY_IAM \
  --region $REGION \
  --parameter-overrides \
    Environment=staging \
    LogLevel=INFO

# Get deployment outputs
echo "📊 Getting deployment outputs..."
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs' > deployment-outputs.json

# Test deployment
echo "🧪 Testing deployment..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

# Health check
curl -f "$API_URL/health" || echo "⚠️ Health check failed"

echo "✅ Document Generator Service deployment completed!"
echo "📍 API URL: $API_URL"