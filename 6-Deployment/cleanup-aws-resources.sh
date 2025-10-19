#!/bin/bash

# AWS Cost Estimation Platform - Resource Cleanup Script
# This script removes only pre-sales related AWS resources

echo "🧹 AWS Cost Estimation Platform Resource Cleanup"
echo "================================================"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install and configure AWS CLI first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run: aws configure"
    exit 1
fi

echo "✅ AWS CLI configured"

# Define resource patterns to identify pre-sales resources
STACK_PATTERNS=(
    "aws-cost-platform-*"
    "aws-cost-estimation-*"
)

BUCKET_PATTERNS=(
    "aws-cost-platform-*"
    "aws-cost-estimation-*"
    "*-presales-*"
)

COGNITO_PATTERNS=(
    "*cost-estimation*"
    "*presales*"
)

# Function to list and confirm deletion
confirm_deletion() {
    local resource_type=$1
    local resources=$2
    
    if [ -z "$resources" ]; then
        echo "ℹ️  No $resource_type found matching pre-sales patterns"
        return 0
    fi
    
    echo ""
    echo "🔍 Found $resource_type:"
    echo "$resources"
    echo ""
    read -p "❓ Delete these $resource_type? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        return 0
    else
        echo "⏭️  Skipping $resource_type deletion"
        return 1
    fi
}

# 1. Clean up CloudFormation Stacks
echo ""
echo "🔍 Checking CloudFormation stacks..."
STACKS=""
for pattern in "${STACK_PATTERNS[@]}"; do
    FOUND_STACKS=$(aws cloudformation list-stacks \
        --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
        --query "StackSummaries[?contains(StackName, '$(echo $pattern | sed 's/\*//')')].[StackName]" \
        --output text 2>/dev/null)
    if [ ! -z "$FOUND_STACKS" ]; then
        STACKS="$STACKS$FOUND_STACKS"$'\n'
    fi
done

if confirm_deletion "CloudFormation stacks" "$STACKS"; then
    echo "$STACKS" | while read -r stack; do
        if [ ! -z "$stack" ]; then
            echo "🗑️  Deleting stack: $stack"
            aws cloudformation delete-stack --stack-name "$stack"
        fi
    done
    
    # Wait for stack deletions
    echo "⏳ Waiting for stack deletions to complete..."
    echo "$STACKS" | while read -r stack; do
        if [ ! -z "$stack" ]; then
            aws cloudformation wait stack-delete-complete --stack-name "$stack" 2>/dev/null || true
        fi
    done
fi

# 2. Clean up S3 Buckets
echo ""
echo "🔍 Checking S3 buckets..."
BUCKETS=""
for pattern in "${BUCKET_PATTERNS[@]}"; do
    FOUND_BUCKETS=$(aws s3api list-buckets \
        --query "Buckets[?contains(Name, '$(echo $pattern | sed 's/\*//')')].Name" \
        --output text 2>/dev/null)
    if [ ! -z "$FOUND_BUCKETS" ]; then
        BUCKETS="$BUCKETS$FOUND_BUCKETS"$'\n'
    fi
done

if confirm_deletion "S3 buckets" "$BUCKETS"; then
    echo "$BUCKETS" | while read -r bucket; do
        if [ ! -z "$bucket" ]; then
            echo "🗑️  Emptying and deleting bucket: $bucket"
            # Empty bucket first
            aws s3 rm s3://"$bucket" --recursive 2>/dev/null || true
            # Delete bucket
            aws s3api delete-bucket --bucket "$bucket" 2>/dev/null || true
        fi
    done
fi

# 3. Clean up DynamoDB Tables
echo ""
echo "🔍 Checking DynamoDB tables..."
TABLES=$(aws dynamodb list-tables \
    --query "TableNames[?contains(@, 'cost') || contains(@, 'estimation') || contains(@, 'presales')]" \
    --output text 2>/dev/null)

if confirm_deletion "DynamoDB tables" "$TABLES"; then
    echo "$TABLES" | while read -r table; do
        if [ ! -z "$table" ]; then
            echo "🗑️  Deleting table: $table"
            aws dynamodb delete-table --table-name "$table" 2>/dev/null || true
        fi
    done
fi

# 4. Clean up Cognito User Pools
echo ""
echo "🔍 Checking Cognito User Pools..."
USER_POOLS=""
for pattern in "${COGNITO_PATTERNS[@]}"; do
    FOUND_POOLS=$(aws cognito-idp list-user-pools --max-items 60 \
        --query "UserPools[?contains(Name, '$(echo $pattern | sed 's/\*//')')].Id" \
        --output text 2>/dev/null)
    if [ ! -z "$FOUND_POOLS" ]; then
        USER_POOLS="$USER_POOLS$FOUND_POOLS"$'\n'
    fi
done

if confirm_deletion "Cognito User Pools" "$USER_POOLS"; then
    echo "$USER_POOLS" | while read -r pool_id; do
        if [ ! -z "$pool_id" ]; then
            echo "🗑️  Deleting User Pool: $pool_id"
            aws cognito-idp delete-user-pool --user-pool-id "$pool_id" 2>/dev/null || true
        fi
    done
fi

# 5. Clean up Lambda Functions
echo ""
echo "🔍 Checking Lambda functions..."
FUNCTIONS=$(aws lambda list-functions \
    --query "Functions[?contains(FunctionName, 'cost') || contains(FunctionName, 'estimation') || contains(FunctionName, 'presales')].FunctionName" \
    --output text 2>/dev/null)

if confirm_deletion "Lambda functions" "$FUNCTIONS"; then
    echo "$FUNCTIONS" | while read -r function; do
        if [ ! -z "$function" ]; then
            echo "🗑️  Deleting function: $function"
            aws lambda delete-function --function-name "$function" 2>/dev/null || true
        fi
    done
fi

# 6. Clean up API Gateways
echo ""
echo "🔍 Checking API Gateways..."
APIS=$(aws apigateway get-rest-apis \
    --query "items[?contains(name, 'cost') || contains(name, 'estimation') || contains(name, 'presales')].id" \
    --output text 2>/dev/null)

if confirm_deletion "API Gateways" "$APIS"; then
    echo "$APIS" | while read -r api_id; do
        if [ ! -z "$api_id" ]; then
            echo "🗑️  Deleting API Gateway: $api_id"
            aws apigateway delete-rest-api --rest-api-id "$api_id" 2>/dev/null || true
        fi
    done
fi

# 7. Clean up CloudFront Distributions
echo ""
echo "🔍 Checking CloudFront distributions..."
DISTRIBUTIONS=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?contains(Comment, 'cost') || contains(Comment, 'estimation') || contains(Comment, 'presales')].Id" \
    --output text 2>/dev/null)

if [ ! -z "$DISTRIBUTIONS" ]; then
    echo "⚠️  Found CloudFront distributions:"
    echo "$DISTRIBUTIONS"
    echo "⚠️  CloudFront distributions must be disabled before deletion."
    echo "ℹ️  Please disable them manually in AWS Console, then run this script again."
fi

# 8. Clean up Secrets Manager secrets
echo ""
echo "🔍 Checking Secrets Manager secrets..."
SECRETS=$(aws secretsmanager list-secrets \
    --query "SecretList[?contains(Name, 'cost') || contains(Name, 'estimation') || contains(Name, 'presales')].Name" \
    --output text 2>/dev/null)

if confirm_deletion "Secrets Manager secrets" "$SECRETS"; then
    echo "$SECRETS" | while read -r secret; do
        if [ ! -z "$secret" ]; then
            echo "🗑️  Deleting secret: $secret"
            aws secretsmanager delete-secret --secret-id "$secret" --force-delete-without-recovery 2>/dev/null || true
        fi
    done
fi

echo ""
echo "✅ AWS Cost Estimation Platform cleanup completed!"
echo ""
echo "📋 Summary:"
echo "- CloudFormation stacks: Deleted"
echo "- S3 buckets: Emptied and deleted"
echo "- DynamoDB tables: Deleted"
echo "- Cognito User Pools: Deleted"
echo "- Lambda functions: Deleted"
echo "- API Gateways: Deleted"
echo "- Secrets Manager: Deleted"
echo ""
echo "⚠️  Note: Some resources may take a few minutes to fully delete."
echo "🔍 Check AWS Console to verify all resources are removed."