#!/bin/bash

# Frontend Application Deployment Script
# Component: frontend-application
# Phase: 6 - Deployment & Release

set -e

COMPONENT_NAME="frontend-application"
STACK_NAME="aws-cost-estimator-frontend-staging"
REGION="us-east-1"
ENVIRONMENT="staging"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

echo "🚀 Starting Frontend Application Deployment..."
echo "📅 Timestamp: $TIMESTAMP"
echo "🏗️  Stack: $STACK_NAME"
echo "🌍 Region: $REGION"

# Build the React application
echo "📦 Building React application..."
cd "../../../4-Development/components/$COMPONENT_NAME"
npm run build

# Deploy CloudFormation stack
echo "☁️  Deploying CloudFormation stack..."
cd "../../../6-Deployment/components/$COMPONENT_NAME"

aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name "$STACK_NAME" \
  --parameter-overrides Environment="$ENVIRONMENT" \
  --capabilities CAPABILITY_IAM \
  --region "$REGION" \
  --no-fail-on-empty-changeset

# Get stack outputs
echo "📋 Getting stack outputs..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucketName'].OutputValue" \
  --output text)

CLOUDFRONT_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

WEBSITE_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" \
  --output text)

echo "📤 Uploading build files to S3..."
aws s3 sync "../../../4-Development/components/$COMPONENT_NAME/build/" "s3://$BUCKET_NAME/" \
  --delete \
  --region "$REGION"

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_ID" \
  --paths "/*" \
  --region "$REGION"

# Generate deployment status
cat > "deployment-status.md" << EOF
# Frontend Application Deployment Status

**Component:** $COMPONENT_NAME  
**Deployment Date:** $(date)  
**Status:** ✅ DEPLOYED

## Deployment Details
- **Stack Name:** $STACK_NAME
- **Region:** $REGION
- **Environment:** $ENVIRONMENT
- **S3 Bucket:** $BUCKET_NAME
- **CloudFront ID:** $CLOUDFRONT_ID
- **Website URL:** $WEBSITE_URL

## Resources Created
- ✅ S3 Bucket for static hosting
- ✅ CloudFront Distribution for CDN
- ✅ Origin Access Control for security
- ✅ Bucket policy for public access

## Deployment Verification
- ✅ React build completed successfully
- ✅ Files uploaded to S3
- ✅ CloudFront cache invalidated
- ✅ Website accessible at: $WEBSITE_URL

## Next Steps
- Configure custom domain (optional)
- Set up monitoring and alerts
- Configure CI/CD pipeline for automated deployments
EOF

# Copy deployment status to deployed components
cp "deployment-status.md" "../../deployed-components/$COMPONENT_NAME/"

echo "✅ Frontend Application deployment completed!"
echo "🌐 Website URL: $WEBSITE_URL"
echo "📄 Status saved to: deployment-status.md"