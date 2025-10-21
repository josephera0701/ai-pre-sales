#!/bin/bash

# S3 Bucket Creation Script for AWS Cost Estimation Platform
# Creates required S3 buckets with proper configuration

set -e

# Environment (default to staging)
ENVIRONMENT=${1:-staging}
AWS_REGION=${2:-us-east-1}

echo "Creating S3 buckets for environment: $ENVIRONMENT in region: $AWS_REGION"

# Bucket names
TEMPLATES_BUCKET="aws-cost-estimation-templates-${ENVIRONMENT}"
DOCUMENTS_BUCKET="aws-cost-estimation-documents-${ENVIRONMENT}"
UPLOADS_BUCKET="aws-cost-estimation-uploads-${ENVIRONMENT}"

# Create Templates Bucket
echo "Creating templates bucket: $TEMPLATES_BUCKET"
aws s3 mb s3://$TEMPLATES_BUCKET --region $AWS_REGION

# Configure templates bucket for public read access to templates
aws s3api put-bucket-policy --bucket $TEMPLATES_BUCKET --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$TEMPLATES_BUCKET'/templates/*"
    }
  ]
}'

# Enable versioning for templates
aws s3api put-bucket-versioning --bucket $TEMPLATES_BUCKET --versioning-configuration Status=Enabled

# Create Documents Bucket
echo "Creating documents bucket: $DOCUMENTS_BUCKET"
aws s3 mb s3://$DOCUMENTS_BUCKET --region $AWS_REGION

# Enable versioning for documents
aws s3api put-bucket-versioning --bucket $DOCUMENTS_BUCKET --versioning-configuration Status=Enabled

# Create Uploads Bucket
echo "Creating uploads bucket: $UPLOADS_BUCKET"
aws s3 mb s3://$UPLOADS_BUCKET --region $AWS_REGION

# Configure lifecycle policy for uploads bucket (delete temp files after 1 day)
aws s3api put-bucket-lifecycle-configuration --bucket $UPLOADS_BUCKET --lifecycle-configuration '{
  "Rules": [
    {
      "ID": "DeleteTempFiles",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "temp/"
      },
      "Expiration": {
        "Days": 1
      }
    }
  ]
}'

# Create folder structure in templates bucket
echo "Creating folder structure in templates bucket"
aws s3api put-object --bucket $TEMPLATES_BUCKET --key templates/ --content-length 0
aws s3api put-object --bucket $TEMPLATES_BUCKET --key template-versions/ --content-length 0
aws s3api put-object --bucket $TEMPLATES_BUCKET --key template-versions/v2.0/ --content-length 0
aws s3api put-object --bucket $TEMPLATES_BUCKET --key template-versions/v1.0/ --content-length 0

# Create folder structure in documents bucket
echo "Creating folder structure in documents bucket"
aws s3api put-object --bucket $DOCUMENTS_BUCKET --key proposals/ --content-length 0
aws s3api put-object --bucket $DOCUMENTS_BUCKET --key exports/ --content-length 0
aws s3api put-object --bucket $DOCUMENTS_BUCKET --key backups/ --content-length 0

# Create folder structure in uploads bucket
echo "Creating folder structure in uploads bucket"
aws s3api put-object --bucket $UPLOADS_BUCKET --key temp/ --content-length 0
aws s3api put-object --bucket $UPLOADS_BUCKET --key processed/ --content-length 0

echo "S3 buckets created successfully!"
echo "Templates bucket: $TEMPLATES_BUCKET"
echo "Documents bucket: $DOCUMENTS_BUCKET"
echo "Uploads bucket: $UPLOADS_BUCKET"

# Output environment variables for Lambda functions
echo ""
echo "Environment variables for Lambda functions:"
echo "TEMPLATES_BUCKET=$TEMPLATES_BUCKET"
echo "DOCUMENTS_BUCKET=$DOCUMENTS_BUCKET"
echo "UPLOADS_BUCKET=$UPLOADS_BUCKET"