# CI/CD Pipeline Setup: AWS Cost Estimation Platform

## Document Information
- **Project:** AWS Cost Estimation Platform for Sagesoft Solutions Inc.
- **Phase:** 6 - Deployment & Release
- **Date:** 2024-01-15
- **Version:** 1.0

## 1. Pipeline Overview

### 1.1 CI/CD Strategy
- **Source Control:** GitHub repository
- **Build System:** GitHub Actions
- **Deployment Tool:** AWS SAM CLI
- **Infrastructure:** AWS CloudFormation
- **Monitoring:** AWS CloudWatch + X-Ray

### 1.2 Environment Strategy
```
Development → Staging → Production
     ↓           ↓         ↓
   Feature    Integration  Live
   Testing     Testing    System
```

## 2. GitHub Actions Workflow

### 2.1 Pipeline Configuration
```yaml
# .github/workflows/deploy.yml
name: AWS Cost Platform CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  SAM_TEMPLATE: 4-Development/src/infrastructure/template.yaml

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install Dependencies
        run: |
          cd 4-Development/src/lambda/cost-calculator && npm ci
          cd ../excel-processor && npm ci
          cd ../document-generator && npm ci
          cd ../user-management && npm ci
          cd ../auth-handler && npm ci
          cd ../../frontend && npm ci
      
      - name: Run Unit Tests
        run: |
          cd 4-Development/src/lambda/cost-calculator && npm test
          cd ../excel-processor && npm test
          cd ../document-generator && npm test
          cd ../user-management && npm test
          cd ../auth-handler && npm test
      
      - name: Run Frontend Tests
        run: |
          cd 4-Development/src/frontend && npm test -- --coverage --watchAll=false
      
      - name: Security Scan
        run: |
          npm audit --audit-level moderate
          
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup AWS SAM
        uses: aws-actions/setup-sam@v2
        
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: SAM Build
        run: |
          cd 4-Development/src/infrastructure
          sam build --template template.yaml
      
      - name: Deploy to Staging
        if: github.ref == 'refs/heads/develop'
        run: |
          cd 4-Development/src/infrastructure
          sam deploy --config-env staging --no-confirm-changeset --no-fail-on-empty-changeset
      
      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        run: |
          cd 4-Development/src/infrastructure
          sam deploy --config-env production --no-confirm-changeset --no-fail-on-empty-changeset
      
      - name: Run Integration Tests
        run: |
          npm run test:integration
          
      - name: Notify Deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 2.2 SAM Configuration
```toml
# samconfig.toml
version = 0.1

[default.global.parameters]
stack_name = "aws-cost-platform"
region = "us-east-1"
confirm_changeset = true
capabilities = "CAPABILITY_IAM"
image_repositories = []

[default.build.parameters]
cached = true
parallel = true

[default.validate.parameters]
lint = true

[default.deploy.parameters]
capabilities = "CAPABILITY_IAM"
confirm_changeset = true
resolve_s3 = true
s3_prefix = "aws-cost-platform"
region = "us-east-1"
image_repositories = []

[staging]
[staging.deploy.parameters]
stack_name = "aws-cost-platform-staging"
s3_bucket = "aws-cost-platform-deployments-staging"
parameter_overrides = "Environment=staging"

[production]
[production.deploy.parameters]
stack_name = "aws-cost-platform-prod"
s3_bucket = "aws-cost-platform-deployments-prod"
parameter_overrides = "Environment=prod"
```

## 3. Environment Configuration

### 3.1 Development Environment
```bash
# Local development setup
export AWS_PROFILE=dev
export ENVIRONMENT=dev
export API_URL=http://localhost:3000
export COGNITO_USER_POOL_ID=us-east-1_dev123
export COGNITO_CLIENT_ID=dev456
```

### 3.2 Staging Environment
```bash
# Staging environment variables
ENVIRONMENT=staging
API_URL=https://api-staging.aws-cost-estimation.sagesoft.com
COGNITO_USER_POOL_ID=us-east-1_staging123
COGNITO_CLIENT_ID=staging456
MAIN_TABLE=aws-cost-platform-staging
PRICING_TABLE=aws-pricing-data-staging
DOCUMENTS_BUCKET=aws-cost-estimation-documents-staging
UPLOADS_BUCKET=aws-cost-estimation-uploads-staging
```

### 3.3 Production Environment
```bash
# Production environment variables
ENVIRONMENT=prod
API_URL=https://api.aws-cost-estimation.sagesoft.com
COGNITO_USER_POOL_ID=us-east-1_prod123
COGNITO_CLIENT_ID=prod456
MAIN_TABLE=aws-cost-platform-prod
PRICING_TABLE=aws-pricing-data-prod
DOCUMENTS_BUCKET=aws-cost-estimation-documents-prod
UPLOADS_BUCKET=aws-cost-estimation-uploads-prod
```

## 4. Deployment Scripts

### 4.1 Build Script
```bash
#!/bin/bash
# scripts/build.sh

set -e

echo "🔨 Building AWS Cost Estimation Platform..."

# Install dependencies
echo "📦 Installing Lambda dependencies..."
for dir in 4-Development/src/lambda/*/; do
    if [ -f "$dir/package.json" ]; then
        echo "Installing dependencies for $(basename "$dir")"
        cd "$dir" && npm ci --production && cd - > /dev/null
    fi
done

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd 4-Development/src/frontend && npm ci && cd - > /dev/null

# Build frontend
echo "🏗️ Building frontend..."
cd 4-Development/src/frontend && npm run build && cd - > /dev/null

# SAM build
echo "🏗️ Building SAM application..."
cd 4-Development/src/infrastructure
sam build --template template.yaml

echo "✅ Build completed successfully!"
```

### 4.2 Deploy Script
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-staging}
REGION=${2:-us-east-1}

echo "🚀 Deploying to $ENVIRONMENT environment in $REGION..."

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'prod'"
    exit 1
fi

# Build application
./scripts/build.sh

# Deploy infrastructure
echo "🏗️ Deploying infrastructure..."
cd 4-Development/src/infrastructure
sam deploy --config-env $ENVIRONMENT --region $REGION

# Deploy frontend to S3
echo "📤 Deploying frontend..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name aws-cost-platform-$ENVIRONMENT \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
    --output text)

aws s3 sync ../frontend/build/ s3://$BUCKET_NAME/ --delete

# Invalidate CloudFront cache
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name aws-cost-platform-$ENVIRONMENT \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text)

aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*"

echo "✅ Deployment to $ENVIRONMENT completed successfully!"
```

### 4.3 Rollback Script
```bash
#!/bin/bash
# scripts/rollback.sh

set -e

ENVIRONMENT=${1:-staging}
VERSION=${2}

if [ -z "$VERSION" ]; then
    echo "❌ Please specify version to rollback to"
    echo "Usage: ./scripts/rollback.sh <environment> <version>"
    exit 1
fi

echo "🔄 Rolling back $ENVIRONMENT to version $VERSION..."

# Get previous stack template
aws cloudformation get-template \
    --stack-name aws-cost-platform-$ENVIRONMENT \
    --template-stage Processed \
    > /tmp/rollback-template.json

# Deploy previous version
aws cloudformation deploy \
    --template-file /tmp/rollback-template.json \
    --stack-name aws-cost-platform-$ENVIRONMENT \
    --capabilities CAPABILITY_IAM

echo "✅ Rollback to version $VERSION completed!"
```

## 5. Quality Gates

### 5.1 Pre-deployment Checks
```bash
#!/bin/bash
# scripts/quality-gates.sh

set -e

echo "🔍 Running quality gates..."

# Code coverage check
echo "📊 Checking code coverage..."
COVERAGE=$(npm run test:coverage | grep "All files" | awk '{print $10}' | sed 's/%//')
if [ "$COVERAGE" -lt 80 ]; then
    echo "❌ Code coverage ($COVERAGE%) below threshold (80%)"
    exit 1
fi

# Security scan
echo "🔒 Running security scan..."
npm audit --audit-level moderate

# Performance tests
echo "⚡ Running performance tests..."
npm run test:performance

# Integration tests
echo "🔗 Running integration tests..."
npm run test:integration

echo "✅ All quality gates passed!"
```

### 5.2 Post-deployment Validation
```bash
#!/bin/bash
# scripts/validate-deployment.sh

set -e

ENVIRONMENT=${1:-staging}
API_URL=$(aws cloudformation describe-stacks \
    --stack-name aws-cost-platform-$ENVIRONMENT \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

echo "🔍 Validating deployment to $ENVIRONMENT..."

# Health check
echo "❤️ Checking API health..."
curl -f "$API_URL/health" || exit 1

# Authentication test
echo "🔐 Testing authentication..."
curl -f -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"invalid"}' || exit 1

# Database connectivity
echo "💾 Testing database connectivity..."
curl -f "$API_URL/estimations" \
    -H "Authorization: Bearer $TEST_TOKEN" || exit 1

echo "✅ Deployment validation successful!"
```

## 6. Monitoring Setup

### 6.1 CloudWatch Alarms
```yaml
# monitoring/cloudwatch-alarms.yaml
Resources:
  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${Environment}-HighErrorRate"
      AlarmDescription: "High error rate detected"
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopicArn

  HighLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${Environment}-HighLatency"
      AlarmDescription: "High response latency detected"
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5000
      ComparisonOperator: GreaterThanThreshold
```

### 6.2 X-Ray Tracing
```javascript
// Enable X-Ray tracing in Lambda functions
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.handler = AWSXRay.captureAsyncFunc('handler', async (event) => {
    // Function logic with automatic tracing
});
```

## 7. Security Configuration

### 7.1 IAM Roles and Policies
```yaml
# security/iam-policies.yaml
DeploymentRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: codebuild.amazonaws.com
          Action: sts:AssumeRole
    Policies:
      - PolicyName: DeploymentPolicy
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - cloudformation:*
                - lambda:*
                - apigateway:*
                - dynamodb:*
                - s3:*
              Resource: "*"
```

### 7.2 Secrets Management
```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
    --name "aws-cost-platform/staging/database" \
    --description "Database credentials for staging" \
    --secret-string '{"username":"admin","password":"secure-password"}'

# Reference in CloudFormation
DatabasePassword:
  Type: AWS::SecretsManager::Secret
  Properties:
    Name: !Sub "${Environment}/database/password"
    GenerateSecretString:
      SecretStringTemplate: '{"username": "admin"}'
      GenerateStringKey: 'password'
      PasswordLength: 32
      ExcludeCharacters: '"@/\'
```

## 8. Backup and Recovery

### 8.1 Database Backup
```yaml
# Enable point-in-time recovery for DynamoDB
MainTable:
  Type: AWS::DynamoDB::Table
  Properties:
    PointInTimeRecoverySpecification:
      PointInTimeRecoveryEnabled: true
    BackupPolicy:
      PointInTimeRecoveryEnabled: true
```

### 8.2 S3 Backup
```yaml
# S3 versioning and lifecycle
DocumentsBucket:
  Type: AWS::S3::Bucket
  Properties:
    VersioningConfiguration:
      Status: Enabled
    LifecycleConfiguration:
      Rules:
        - Id: BackupRetention
          Status: Enabled
          Transitions:
            - TransitionInDays: 30
              StorageClass: STANDARD_IA
            - TransitionInDays: 90
              StorageClass: GLACIER
```

## 9. Performance Optimization

### 9.1 Lambda Configuration
```yaml
# Optimized Lambda settings
CostCalculatorFunction:
  Type: AWS::Serverless::Function
  Properties:
    MemorySize: 1536  # Increased from 512MB
    Timeout: 60       # Increased from 30s
    ReservedConcurrencyLimit: 10
    ProvisionedConcurrencyConfig:
      ProvisionedConcurrencyUnits: 2
```

### 9.2 API Gateway Caching
```yaml
# Enable API Gateway caching
CostEstimationApi:
  Type: AWS::Serverless::Api
  Properties:
    CacheClusterEnabled: true
    CacheClusterSize: "0.5"
    MethodSettings:
      - ResourcePath: "/*"
        HttpMethod: "*"
        CachingEnabled: true
        CacheTtlInSeconds: 300
```

## 10. Deployment Checklist

### 10.1 Pre-deployment
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code coverage >80%
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Backup procedures tested

### 10.2 Deployment
- [ ] Infrastructure deployed successfully
- [ ] Application deployed to staging
- [ ] Smoke tests passed
- [ ] Performance validation completed
- [ ] Security validation completed
- [ ] Monitoring configured

### 10.3 Post-deployment
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] User acceptance testing completed
- [ ] Documentation published
- [ ] Team training completed
- [ ] Support procedures activated

This CI/CD setup provides automated, reliable, and secure deployment pipeline for the AWS Cost Estimation Platform with comprehensive quality gates and monitoring.