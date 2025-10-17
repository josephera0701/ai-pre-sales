# Deployment Guide: AWS Cost Estimation Platform

## Document Information
- **Project:** AWS Cost Estimation Platform for Sagesoft Solutions Inc.
- **Phase:** 6 - Deployment & Release
- **Date:** 2024-01-15
- **Version:** 1.0

## 1. Deployment Overview

### 1.1 Deployment Strategy
- **Blue-Green Deployment:** Zero-downtime production deployments
- **Canary Releases:** Gradual rollout with traffic splitting
- **Rollback Capability:** Immediate rollback within 5 minutes
- **Environment Progression:** Dev → Staging → Production

### 1.2 Infrastructure Components
```
┌─────────────────────────────────────────────────────────────┐
│                    Production Architecture                   │
├─────────────────────────────────────────────────────────────┤
│ CloudFront CDN → API Gateway → Lambda Functions             │
│                              ↓                              │
│ S3 (Frontend) ← → DynamoDB ← → S3 (Documents)              │
│                              ↓                              │
│ Cognito User Pool ← → CloudWatch ← → X-Ray                 │
└─────────────────────────────────────────────────────────────┘
```

## 2. Pre-Deployment Checklist

### 2.1 Environment Preparation
- [ ] AWS Account configured with proper IAM roles
- [ ] Domain name registered and DNS configured
- [ ] SSL certificates provisioned in ACM
- [ ] S3 buckets created for deployments
- [ ] Secrets stored in AWS Secrets Manager
- [ ] Monitoring and alerting configured

### 2.2 Code Readiness
- [ ] All Phase 5 high-severity bugs resolved
- [ ] Code coverage >80%
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Backup procedures tested

### 2.3 Team Readiness
- [ ] Deployment team trained
- [ ] Support team prepared
- [ ] User training materials ready
- [ ] Communication plan activated
- [ ] Rollback procedures documented

## 3. Environment Configuration

### 3.1 Production Environment Variables
```bash
# Core application settings
ENVIRONMENT=prod
AWS_REGION=us-east-1
NODE_ENV=production

# API Configuration
API_URL=https://api.aws-cost-estimation.sagesoft.com
CORS_ORIGINS=https://aws-cost-estimation.sagesoft.com

# Authentication
COGNITO_USER_POOL_ID=us-east-1_PROD123ABC
COGNITO_CLIENT_ID=prod456def789ghi
JWT_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789:secret:jwt-secret

# Database
MAIN_TABLE=aws-cost-platform-prod
PRICING_TABLE=aws-pricing-data-prod

# Storage
DOCUMENTS_BUCKET=aws-cost-estimation-documents-prod-123456789
UPLOADS_BUCKET=aws-cost-estimation-uploads-prod-123456789
FRONTEND_BUCKET=aws-cost-estimation-frontend-prod-123456789

# Monitoring
LOG_LEVEL=info
ENABLE_XRAY=true
METRICS_NAMESPACE=AWSCostPlatform/Production

# Performance
LAMBDA_MEMORY_SIZE=1536
LAMBDA_TIMEOUT=60
API_THROTTLE_RATE=1000
API_BURST_LIMIT=2000
```

### 3.2 Security Configuration
```yaml
# KMS Key for encryption
ProductionKMSKey:
  Type: AWS::KMS::Key
  Properties:
    Description: "Production encryption key for AWS Cost Platform"
    KeyPolicy:
      Statement:
        - Sid: Enable IAM User Permissions
          Effect: Allow
          Principal:
            AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
          Action: "kms:*"
          Resource: "*"
        - Sid: Allow CloudWatch Logs
          Effect: Allow
          Principal:
            Service: logs.amazonaws.com
          Action:
            - kms:Encrypt
            - kms:Decrypt
            - kms:ReEncrypt*
            - kms:GenerateDataKey*
            - kms:DescribeKey
          Resource: "*"

# WAF for API protection
WebACL:
  Type: AWS::WAFv2::WebACL
  Properties:
    Name: !Sub "${Environment}-WebACL"
    Scope: REGIONAL
    DefaultAction:
      Allow: {}
    Rules:
      - Name: RateLimitRule
        Priority: 1
        Statement:
          RateBasedStatement:
            Limit: 2000
            AggregateKeyType: IP
        Action:
          Block: {}
        VisibilityConfig:
          SampledRequestsEnabled: true
          CloudWatchMetricsEnabled: true
          MetricName: RateLimitRule
```

## 4. Deployment Procedures

### 4.1 Infrastructure Deployment
```bash
#!/bin/bash
# deploy-infrastructure.sh

set -e

ENVIRONMENT="prod"
REGION="us-east-1"
STACK_NAME="aws-cost-platform-${ENVIRONMENT}"

echo "🚀 Deploying infrastructure to ${ENVIRONMENT}..."

# Validate CloudFormation template
echo "📋 Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://4-Development/src/infrastructure/template.yaml

# Deploy infrastructure stack
echo "🏗️ Deploying infrastructure stack..."
aws cloudformation deploy \
    --template-file 4-Development/src/infrastructure/template.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides Environment=$ENVIRONMENT \
    --capabilities CAPABILITY_IAM \
    --region $REGION \
    --no-fail-on-empty-changeset

# Wait for stack completion
echo "⏳ Waiting for stack deployment to complete..."
aws cloudformation wait stack-deploy-complete \
    --stack-name $STACK_NAME \
    --region $REGION

# Get stack outputs
echo "📤 Retrieving stack outputs..."
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs'

echo "✅ Infrastructure deployment completed!"
```

### 4.2 Application Deployment
```bash
#!/bin/bash
# deploy-application.sh

set -e

ENVIRONMENT="prod"
REGION="us-east-1"

echo "📦 Deploying application to ${ENVIRONMENT}..."

# Build Lambda functions
echo "🔨 Building Lambda functions..."
for dir in 4-Development/src/lambda/*/; do
    if [ -f "$dir/package.json" ]; then
        echo "Building $(basename "$dir")"
        cd "$dir"
        npm ci --production
        cd - > /dev/null
    fi
done

# Build frontend
echo "🏗️ Building frontend application..."
cd 4-Development/src/frontend
npm ci
npm run build
cd - > /dev/null

# Deploy with SAM
echo "🚀 Deploying with SAM..."
cd 4-Development/src/infrastructure
sam build --template template.yaml
sam deploy --config-env $ENVIRONMENT --region $REGION --no-confirm-changeset

# Deploy frontend to S3
echo "📤 Deploying frontend to S3..."
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name aws-cost-platform-$ENVIRONMENT \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
    --output text \
    --region $REGION)

aws s3 sync ../frontend/build/ s3://$FRONTEND_BUCKET/ \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --region $REGION

# Deploy HTML files with shorter cache
aws s3 sync ../frontend/build/ s3://$FRONTEND_BUCKET/ \
    --delete \
    --cache-control "public, max-age=0, must-revalidate" \
    --include "*.html" \
    --region $REGION

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name aws-cost-platform-$ENVIRONMENT \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text \
    --region $REGION)

aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" \
    --region $REGION

echo "✅ Application deployment completed!"
```

### 4.3 Database Migration
```bash
#!/bin/bash
# migrate-database.sh

set -e

ENVIRONMENT="prod"
REGION="us-east-1"

echo "💾 Running database migrations for ${ENVIRONMENT}..."

# Get table names from CloudFormation
MAIN_TABLE=$(aws cloudformation describe-stacks \
    --stack-name aws-cost-platform-$ENVIRONMENT \
    --query 'Stacks[0].Outputs[?OutputKey==`MainTableName`].OutputValue' \
    --output text \
    --region $REGION)

PRICING_TABLE=$(aws cloudformation describe-stacks \
    --stack-name aws-cost-platform-$ENVIRONMENT \
    --query 'Stacks[0].Outputs[?OutputKey==`PricingTableName`].OutputValue' \
    --output text \
    --region $REGION)

# Initialize pricing data
echo "💰 Initializing pricing data..."
node scripts/initialize-pricing-data.js \
    --table $PRICING_TABLE \
    --region $REGION

# Create initial admin user
echo "👤 Creating initial admin user..."
node scripts/create-admin-user.js \
    --table $MAIN_TABLE \
    --region $REGION \
    --email "admin@sagesoft.com"

echo "✅ Database migration completed!"
```

## 5. Blue-Green Deployment Process

### 5.1 Blue-Green Setup
```bash
#!/bin/bash
# blue-green-deploy.sh

set -e

CURRENT_ENV="blue"
NEW_ENV="green"
DOMAIN="aws-cost-estimation.sagesoft.com"

echo "🔄 Starting blue-green deployment..."

# Deploy to green environment
echo "🟢 Deploying to green environment..."
./deploy-application.sh green

# Run smoke tests on green
echo "🧪 Running smoke tests on green environment..."
./scripts/smoke-tests.sh green

# Switch traffic to green (50/50 split initially)
echo "⚖️ Splitting traffic 50/50..."
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://route53-weighted-50-50.json

# Monitor for 10 minutes
echo "📊 Monitoring green environment..."
sleep 600

# Check error rates and performance
ERROR_RATE=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Errors \
    --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 600 \
    --statistics Sum \
    --query 'Datapoints[0].Sum' \
    --output text)

if [ "$ERROR_RATE" -gt 5 ]; then
    echo "❌ High error rate detected, rolling back..."
    ./rollback.sh
    exit 1
fi

# Switch all traffic to green
echo "🟢 Switching all traffic to green..."
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://route53-green-100.json

echo "✅ Blue-green deployment completed successfully!"
```

### 5.2 Canary Deployment
```yaml
# API Gateway canary deployment
CostEstimationApi:
  Type: AWS::Serverless::Api
  Properties:
    StageName: prod
    CanarySetting:
      PercentTraffic: 10
      StageVariableOverrides:
        LambdaAlias: !Ref AliasName
      UseStageCache: false
    DeploymentPreference:
      Type: Canary10Percent5Minutes
      Alarms:
        - !Ref AliasErrorMetricGreaterThanZeroAlarm
        - !Ref LatestVersionErrorMetricGreaterThanZeroAlarm
      Hooks:
        PreTraffic: !Ref PreTrafficHook
        PostTraffic: !Ref PostTrafficHook
```

## 6. Post-Deployment Validation

### 6.1 Smoke Tests
```javascript
// smoke-tests.js
const axios = require('axios');

class SmokeTests {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.results = [];
    }
    
    async runAllTests() {
        console.log('🧪 Running smoke tests...');
        
        await this.testHealthEndpoint();
        await this.testAuthenticationEndpoint();
        await this.testEstimationEndpoint();
        await this.testDocumentGeneration();
        
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        console.log(`✅ Smoke tests completed: ${passed}/${total} passed`);
        
        if (passed !== total) {
            throw new Error('Smoke tests failed');
        }
    }
    
    async testHealthEndpoint() {
        try {
            const response = await axios.get(`${this.baseUrl}/health`);
            this.results.push({
                test: 'Health Check',
                passed: response.status === 200,
                message: response.data
            });
        } catch (error) {
            this.results.push({
                test: 'Health Check',
                passed: false,
                message: error.message
            });
        }
    }
    
    async testAuthenticationEndpoint() {
        try {
            const response = await axios.post(`${this.baseUrl}/auth/login`, {
                email: 'test@example.com',
                password: 'invalid'
            });
            
            this.results.push({
                test: 'Authentication',
                passed: response.status === 401,
                message: 'Authentication endpoint responding correctly'
            });
        } catch (error) {
            this.results.push({
                test: 'Authentication',
                passed: error.response?.status === 401,
                message: 'Authentication endpoint validation'
            });
        }
    }
}

// Run smoke tests
const smokeTests = new SmokeTests(process.env.API_URL);
smokeTests.runAllTests().catch(error => {
    console.error('Smoke tests failed:', error);
    process.exit(1);
});
```

### 6.2 Performance Validation
```bash
#!/bin/bash
# performance-validation.sh

set -e

API_URL=$1
DURATION=300  # 5 minutes

echo "⚡ Running performance validation..."

# Install artillery if not present
if ! command -v artillery &> /dev/null; then
    npm install -g artillery
fi

# Run load test
artillery run --target $API_URL \
    --duration $DURATION \
    --arrival-rate 10 \
    performance-test-config.yml

# Check CloudWatch metrics
echo "📊 Checking performance metrics..."

LATENCY=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Duration \
    --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average \
    --query 'Datapoints[0].Average' \
    --output text)

if (( $(echo "$LATENCY > 5000" | bc -l) )); then
    echo "❌ High latency detected: ${LATENCY}ms"
    exit 1
fi

echo "✅ Performance validation passed"
```

## 7. Rollback Procedures

### 7.1 Immediate Rollback
```bash
#!/bin/bash
# rollback.sh

set -e

ENVIRONMENT=${1:-prod}
PREVIOUS_VERSION=${2}

echo "🔄 Initiating rollback for ${ENVIRONMENT}..."

if [ -z "$PREVIOUS_VERSION" ]; then
    # Get previous version from CloudFormation
    PREVIOUS_VERSION=$(aws cloudformation describe-stack-events \
        --stack-name aws-cost-platform-$ENVIRONMENT \
        --query 'StackEvents[?ResourceType==`AWS::CloudFormation::Stack` && ResourceStatus==`UPDATE_COMPLETE`] | [1].PhysicalResourceId' \
        --output text)
fi

# Rollback CloudFormation stack
echo "📦 Rolling back CloudFormation stack..."
aws cloudformation cancel-update-stack \
    --stack-name aws-cost-platform-$ENVIRONMENT

# Wait for rollback completion
aws cloudformation wait stack-rollback-complete \
    --stack-name aws-cost-platform-$ENVIRONMENT

# Rollback frontend
echo "🌐 Rolling back frontend..."
aws s3 sync s3://aws-cost-platform-backups/$PREVIOUS_VERSION/ \
    s3://aws-cost-estimation-frontend-$ENVIRONMENT/ \
    --delete

# Invalidate CloudFront
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name aws-cost-platform-$ENVIRONMENT \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text)

aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*"

echo "✅ Rollback completed successfully!"
```

### 7.2 Database Rollback
```bash
#!/bin/bash
# rollback-database.sh

set -e

ENVIRONMENT=${1:-prod}
BACKUP_TIME=${2}

echo "💾 Rolling back database to ${BACKUP_TIME}..."

# Point-in-time recovery for DynamoDB
MAIN_TABLE="aws-cost-platform-${ENVIRONMENT}"
BACKUP_TABLE="${MAIN_TABLE}-rollback-$(date +%s)"

aws dynamodb restore-table-to-point-in-time \
    --source-table-name $MAIN_TABLE \
    --target-table-name $BACKUP_TABLE \
    --restore-date-time $BACKUP_TIME

# Wait for table to be active
aws dynamodb wait table-exists --table-name $BACKUP_TABLE

echo "✅ Database rollback completed!"
```

## 8. Monitoring and Alerting

### 8.1 Deployment Monitoring
```bash
#!/bin/bash
# monitor-deployment.sh

set -e

ENVIRONMENT=${1:-prod}
DURATION=${2:-1800}  # 30 minutes

echo "📊 Monitoring deployment for ${DURATION} seconds..."

START_TIME=$(date +%s)
END_TIME=$((START_TIME + DURATION))

while [ $(date +%s) -lt $END_TIME ]; do
    # Check error rate
    ERROR_RATE=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/Lambda \
        --metric-name Errors \
        --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 300 \
        --statistics Sum \
        --query 'Datapoints[0].Sum' \
        --output text)
    
    if [ "$ERROR_RATE" -gt 10 ]; then
        echo "❌ High error rate detected: $ERROR_RATE errors"
        ./rollback.sh $ENVIRONMENT
        exit 1
    fi
    
    # Check latency
    LATENCY=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/Lambda \
        --metric-name Duration \
        --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 300 \
        --statistics Average \
        --query 'Datapoints[0].Average' \
        --output text)
    
    echo "📈 Current metrics - Errors: $ERROR_RATE, Latency: ${LATENCY}ms"
    
    sleep 60
done

echo "✅ Deployment monitoring completed successfully!"
```

## 9. Production Readiness Checklist

### 9.1 Technical Readiness
- [ ] All infrastructure deployed and configured
- [ ] Application deployed and tested
- [ ] Database initialized with production data
- [ ] Monitoring and alerting active
- [ ] Security configurations validated
- [ ] Performance benchmarks met
- [ ] Backup and recovery procedures tested
- [ ] SSL certificates installed and validated

### 9.2 Operational Readiness
- [ ] Support team trained and ready
- [ ] Runbooks and procedures documented
- [ ] Escalation procedures defined
- [ ] Communication plan activated
- [ ] User training materials prepared
- [ ] Go-live communication sent

### 9.3 Business Readiness
- [ ] User acceptance testing completed
- [ ] Business stakeholders approved
- [ ] Training sessions conducted
- [ ] Support documentation published
- [ ] Success metrics defined
- [ ] Rollback criteria established

## 10. Go-Live Execution

### 10.1 Go-Live Timeline
```
T-24h: Final deployment to staging
T-12h: Production deployment begins
T-8h:  Infrastructure deployment complete
T-4h:  Application deployment complete
T-2h:  Final validation and testing
T-1h:  DNS cutover preparation
T-0:   DNS cutover to production
T+1h:  Monitor and validate
T+4h:  Declare go-live success
```

### 10.2 Success Criteria
- [ ] Application accessible via production URL
- [ ] All critical user journeys working
- [ ] Error rate <1%
- [ ] Response time <2 seconds
- [ ] No critical alerts triggered
- [ ] User authentication working
- [ ] Document generation functional
- [ ] Excel processing operational

This comprehensive deployment guide ensures a smooth, monitored, and reversible production deployment of the AWS Cost Estimation Platform.