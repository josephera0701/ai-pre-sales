#!/bin/bash

# Deploy Enhanced DynamoDB Schema Migration
# This script creates the enhanced DynamoDB table and migrates existing data

set -e

ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-us-east-1}

echo "🚀 Starting Enhanced DynamoDB Schema Migration"
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"

# Set environment variables
export ENVIRONMENT=$ENVIRONMENT
export AWS_DEFAULT_REGION=$AWS_REGION

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm init -y
    npm install aws-sdk
fi

echo "📋 Step 1: Creating enhanced DynamoDB table..."
node create-enhanced-tables.js

echo "📋 Step 2: Populating validation data..."
node populate-validation-data.js

echo "📋 Step 3: Migrating existing data..."
node migrate-existing-data.js

echo "✅ Enhanced DynamoDB Schema Migration completed successfully!"
echo ""
echo "📊 Summary:"
echo "- Enhanced table: aws-cost-platform-enhanced-$ENVIRONMENT"
echo "- Validation rules and dropdown lists populated"
echo "- Existing data migrated to enhanced schema"
echo ""
echo "🔗 Next steps:"
echo "1. Update Lambda functions to use enhanced table"
echo "2. Test API endpoints with enhanced schema"
echo "3. Update frontend to use new validation endpoints"