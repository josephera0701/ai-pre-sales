# Monitoring Setup: AWS Cost Estimation Platform

## Document Information
- **Project:** AWS Cost Estimation Platform for Sagesoft Solutions Inc.
- **Phase:** 6 - Deployment & Release
- **Date:** 2024-01-15
- **Version:** 1.0

## 1. Monitoring Architecture

### 1.1 Monitoring Stack
```
Application Metrics → CloudWatch → CloudWatch Alarms → SNS → Slack/Email
Performance Data → X-Ray → Service Map → Performance Insights
Logs → CloudWatch Logs → Log Insights → Dashboards
Business Metrics → Custom Metrics → Business Dashboards
```

### 1.2 Key Monitoring Components
- **AWS CloudWatch:** Core metrics and alarms
- **AWS X-Ray:** Distributed tracing and performance analysis
- **CloudWatch Logs:** Centralized logging
- **CloudWatch Dashboards:** Visual monitoring
- **SNS:** Alert notifications
- **Custom Metrics:** Business KPIs

## 2. CloudWatch Metrics Configuration

### 2.1 Lambda Function Metrics
```yaml
# CloudFormation template for Lambda monitoring
Resources:
  LambdaMetricsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
      Policies:
        - PolicyName: CustomMetricsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: "*"

  # Custom metrics for business KPIs
  EstimationCreatedMetric:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${Environment}-EstimationCreated"
      AlarmDescription: "Track estimation creation rate"
      MetricName: EstimationCreated
      Namespace: AWSCostPlatform/Business
      Statistic: Sum
      Period: 3600
      EvaluationPeriods: 1
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
```

### 2.2 API Gateway Metrics
```yaml
ApiGatewayMetrics:
  Type: AWS::ApiGateway::RequestValidator
  Properties:
    RestApiId: !Ref CostEstimationApi
    Name: !Sub "${Environment}-RequestValidator"
    ValidateRequestBody: true
    ValidateRequestParameters: true

# Enable detailed CloudWatch metrics
CostEstimationApi:
  Type: AWS::Serverless::Api
  Properties:
    TracingEnabled: true
    MethodSettings:
      - ResourcePath: "/*"
        HttpMethod: "*"
        MetricsEnabled: true
        DataTraceEnabled: true
        LoggingLevel: INFO
```

### 2.3 DynamoDB Metrics
```yaml
# DynamoDB monitoring
MainTable:
  Type: AWS::DynamoDB::Table
  Properties:
    StreamSpecification:
      StreamEnabled: true
      StreamViewType: NEW_AND_OLD_IMAGES
    PointInTimeRecoverySpecification:
      PointInTimeRecoveryEnabled: true
    
# DynamoDB alarms
DynamoDBThrottleAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub "${Environment}-DynamoDB-Throttles"
    AlarmDescription: "DynamoDB throttling detected"
    MetricName: UserErrors
    Namespace: AWS/DynamoDB
    Dimensions:
      - Name: TableName
        Value: !Ref MainTable
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 2
    Threshold: 5
    ComparisonOperator: GreaterThanThreshold
```

## 3. CloudWatch Alarms

### 3.1 Critical System Alarms
```yaml
# High error rate alarm
HighErrorRateAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub "${Environment}-HighErrorRate"
    AlarmDescription: "Lambda function error rate > 5%"
    MetricName: Errors
    Namespace: AWS/Lambda
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 2
    Threshold: 10
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - !Ref CriticalAlertsTopicArn
    TreatMissingData: notBreaching

# High latency alarm
HighLatencyAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub "${Environment}-HighLatency"
    AlarmDescription: "API response time > 5 seconds"
    MetricName: Duration
    Namespace: AWS/Lambda
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 5000
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - !Ref PerformanceAlertsTopicArn

# Memory utilization alarm
HighMemoryUsageAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub "${Environment}-HighMemoryUsage"
    AlarmDescription: "Lambda memory usage > 90%"
    MetricName: MemoryUtilization
    Namespace: AWS/Lambda
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 90
    ComparisonOperator: GreaterThanThreshold
```

### 3.2 Business Metrics Alarms
```yaml
# Low estimation creation rate
LowEstimationRateAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub "${Environment}-LowEstimationRate"
    AlarmDescription: "Estimation creation rate below normal"
    MetricName: EstimationCreated
    Namespace: AWSCostPlatform/Business
    Statistic: Sum
    Period: 3600
    EvaluationPeriods: 2
    Threshold: 5
    ComparisonOperator: LessThanThreshold
    AlarmActions:
      - !Ref BusinessAlertsTopicArn

# High document generation failures
DocumentGenerationFailureAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub "${Environment}-DocumentGenerationFailures"
    AlarmDescription: "Document generation failure rate > 10%"
    MetricName: DocumentGenerationFailures
    Namespace: AWSCostPlatform/Business
    Statistic: Sum
    Period: 900
    EvaluationPeriods: 2
    Threshold: 3
    ComparisonOperator: GreaterThanThreshold
```

## 4. X-Ray Tracing Setup

### 4.1 Lambda Tracing Configuration
```javascript
// Lambda function with X-Ray tracing
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

// Custom subsegment for business logic
exports.handler = AWSXRay.captureAsyncFunc('costCalculation', async (event) => {
    const segment = AWSXRay.getSegment();
    
    // Create subsegment for cost calculation
    const subsegment = segment.addNewSubsegment('calculateCosts');
    subsegment.addAnnotation('estimationId', event.estimationId);
    subsegment.addMetadata('requirements', event.requirements);
    
    try {
        const result = await calculateCosts(event.requirements);
        
        // Add custom metrics
        subsegment.addMetadata('result', {
            totalCost: result.totalMonthlyCost,
            serviceCount: result.serviceCount
        });
        
        subsegment.close();
        return result;
    } catch (error) {
        subsegment.addError(error);
        subsegment.close();
        throw error;
    }
});
```

### 4.2 Service Map Configuration
```yaml
# Enable X-Ray tracing for all services
XRayTracingConfig:
  TracingConfig:
    Mode: Active

# Lambda functions with tracing
CostCalculatorFunction:
  Type: AWS::Serverless::Function
  Properties:
    Tracing: Active
    Environment:
      Variables:
        _X_AMZN_TRACE_ID: !Ref AWS::NoValue
```

## 5. CloudWatch Dashboards

### 5.1 Operational Dashboard
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", "FunctionName", "cost-calculator"],
          ["AWS/Lambda", "Errors", "FunctionName", "cost-calculator"],
          ["AWS/Lambda", "Duration", "FunctionName", "cost-calculator"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Cost Calculator Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApiGateway", "Count", "ApiName", "CostEstimationApi"],
          ["AWS/ApiGateway", "4XXError", "ApiName", "CostEstimationApi"],
          ["AWS/ApiGateway", "5XXError", "ApiName", "CostEstimationApi"],
          ["AWS/ApiGateway", "Latency", "ApiName", "CostEstimationApi"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "API Gateway Metrics"
      }
    }
  ]
}
```

### 5.2 Business Dashboard
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWSCostPlatform/Business", "EstimationCreated"],
          ["AWSCostPlatform/Business", "DocumentGenerated"],
          ["AWSCostPlatform/Business", "UserRegistrations"],
          ["AWSCostPlatform/Business", "ActiveUsers"]
        ],
        "period": 3600,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Business Metrics"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/aws/lambda/cost-calculator'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20",
        "region": "us-east-1",
        "title": "Recent Errors"
      }
    }
  ]
}
```

## 6. Custom Metrics Implementation

### 6.1 Business Metrics Collection
```javascript
// Custom metrics helper
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

class MetricsCollector {
    async putMetric(metricName, value, unit = 'Count', dimensions = []) {
        const params = {
            Namespace: 'AWSCostPlatform/Business',
            MetricData: [{
                MetricName: metricName,
                Value: value,
                Unit: unit,
                Dimensions: dimensions,
                Timestamp: new Date()
            }]
        };
        
        try {
            await cloudwatch.putMetricData(params).promise();
        } catch (error) {
            console.error('Failed to put metric:', error);
        }
    }
    
    async recordEstimationCreated(userId, estimationType) {
        await this.putMetric('EstimationCreated', 1, 'Count', [
            { Name: 'UserId', Value: userId },
            { Name: 'EstimationType', Value: estimationType }
        ]);
    }
    
    async recordDocumentGenerated(documentType, generationTime) {
        await this.putMetric('DocumentGenerated', 1, 'Count', [
            { Name: 'DocumentType', Value: documentType }
        ]);
        
        await this.putMetric('DocumentGenerationTime', generationTime, 'Milliseconds', [
            { Name: 'DocumentType', Value: documentType }
        ]);
    }
    
    async recordCostCalculation(calculationTime, serviceCount) {
        await this.putMetric('CostCalculationTime', calculationTime, 'Milliseconds');
        await this.putMetric('ServicesCalculated', serviceCount, 'Count');
    }
}

module.exports = new MetricsCollector();
```

### 6.2 Performance Metrics
```javascript
// Performance monitoring wrapper
function withPerformanceMonitoring(functionName) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = async function(...args) {
            const startTime = Date.now();
            const metrics = require('./metricsCollector');
            
            try {
                const result = await originalMethod.apply(this, args);
                const duration = Date.now() - startTime;
                
                await metrics.putMetric(`${functionName}Duration`, duration, 'Milliseconds');
                await metrics.putMetric(`${functionName}Success`, 1, 'Count');
                
                return result;
            } catch (error) {
                const duration = Date.now() - startTime;
                
                await metrics.putMetric(`${functionName}Duration`, duration, 'Milliseconds');
                await metrics.putMetric(`${functionName}Error`, 1, 'Count');
                
                throw error;
            }
        };
        
        return descriptor;
    };
}

// Usage example
class CostCalculator {
    @withPerformanceMonitoring('CostCalculation')
    async calculateCosts(requirements) {
        // Cost calculation logic
    }
}
```

## 7. Log Management

### 7.1 Structured Logging
```javascript
// Structured logging utility
class Logger {
    constructor(service, version) {
        this.service = service;
        this.version = version;
    }
    
    log(level, message, metadata = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            service: this.service,
            version: this.version,
            message,
            metadata,
            requestId: process.env.AWS_REQUEST_ID,
            traceId: process.env._X_AMZN_TRACE_ID
        };
        
        console.log(JSON.stringify(logEntry));
    }
    
    info(message, metadata) { this.log('info', message, metadata); }
    warn(message, metadata) { this.log('warn', message, metadata); }
    error(message, metadata) { this.log('error', message, metadata); }
    debug(message, metadata) { this.log('debug', message, metadata); }
}

module.exports = Logger;
```

### 7.2 Log Insights Queries
```sql
-- Error analysis query
fields @timestamp, @message, @requestId
| filter @message like /ERROR/
| stats count() by bin(5m)
| sort @timestamp desc

-- Performance analysis query
fields @timestamp, @duration, @message
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), min(@duration) by bin(5m)

-- Business metrics query
fields @timestamp, @message
| filter @message like /EstimationCreated/
| stats count() by bin(1h)
| sort @timestamp desc
```

## 8. Alert Configuration

### 8.1 SNS Topics Setup
```yaml
# Critical alerts (immediate response required)
CriticalAlertsTopicArn:
  Type: AWS::SNS::Topic
  Properties:
    TopicName: !Sub "${Environment}-critical-alerts"
    DisplayName: "Critical System Alerts"
    Subscription:
      - Protocol: email
        Endpoint: "devops@sagesoft.com"
      - Protocol: sms
        Endpoint: "+1234567890"

# Performance alerts (monitoring required)
PerformanceAlertsTopicArn:
  Type: AWS::SNS::Topic
  Properties:
    TopicName: !Sub "${Environment}-performance-alerts"
    DisplayName: "Performance Alerts"
    Subscription:
      - Protocol: email
        Endpoint: "performance@sagesoft.com"

# Business alerts (business impact)
BusinessAlertsTopicArn:
  Type: AWS::SNS::Topic
  Properties:
    TopicName: !Sub "${Environment}-business-alerts"
    DisplayName: "Business Metrics Alerts"
    Subscription:
      - Protocol: email
        Endpoint: "business@sagesoft.com"
```

### 8.2 Slack Integration
```javascript
// Slack webhook for alerts
const https = require('https');

async function sendSlackAlert(message, channel = '#alerts') {
    const payload = {
        channel: channel,
        username: 'AWS Cost Platform',
        text: message,
        icon_emoji: ':warning:'
    };
    
    const options = {
        hostname: 'hooks.slack.com',
        port: 443,
        path: process.env.SLACK_WEBHOOK_PATH,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            resolve(res.statusCode === 200);
        });
        
        req.on('error', reject);
        req.write(JSON.stringify(payload));
        req.end();
    });
}
```

## 9. Health Checks

### 9.1 Application Health Check
```javascript
// Health check endpoint
exports.healthCheck = async (event) => {
    const checks = {
        database: await checkDatabaseHealth(),
        s3: await checkS3Health(),
        cognito: await checkCognitoHealth(),
        pricing: await checkPricingDataHealth()
    };
    
    const isHealthy = Object.values(checks).every(check => check.status === 'healthy');
    
    return {
        statusCode: isHealthy ? 200 : 503,
        body: JSON.stringify({
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            checks
        })
    };
};

async function checkDatabaseHealth() {
    try {
        await dynamodb.describeTable({ TableName: process.env.MAIN_TABLE }).promise();
        return { status: 'healthy', message: 'Database accessible' };
    } catch (error) {
        return { status: 'unhealthy', message: error.message };
    }
}
```

### 9.2 Synthetic Monitoring
```yaml
# CloudWatch Synthetics canary
SyntheticCanary:
  Type: AWS::Synthetics::Canary
  Properties:
    Name: !Sub "${Environment}-api-canary"
    ArtifactS3Location: !Sub "s3://${MonitoringBucket}/canary-artifacts"
    ExecutionRoleArn: !GetAtt CanaryExecutionRole.Arn
    RuntimeVersion: "syn-nodejs-puppeteer-3.5"
    Schedule:
      Expression: "rate(5 minutes)"
    Code:
      Handler: "apiCanary.handler"
      Script: |
        const synthetics = require('Synthetics');
        const log = require('SyntheticsLogger');
        
        const apiCanary = async function () {
            const page = await synthetics.getPage();
            
            // Test API health endpoint
            const response = await page.goto(`${process.env.API_URL}/health`);
            if (response.status() !== 200) {
                throw new Error(`Health check failed: ${response.status()}`);
            }
            
            // Test authentication endpoint
            await page.goto(`${process.env.API_URL}/auth/login`);
            
            log.info('API canary test completed successfully');
        };
        
        exports.handler = async () => {
            return await synthetics.executeStep('apiCanary', apiCanary);
        };
```

## 10. Monitoring Runbook

### 10.1 Alert Response Procedures
| Alert Type | Response Time | Actions |
|------------|---------------|---------|
| Critical System Error | 15 minutes | 1. Check system status<br>2. Review recent deployments<br>3. Initiate rollback if needed |
| High Error Rate | 30 minutes | 1. Analyze error patterns<br>2. Check resource utilization<br>3. Scale resources if needed |
| Performance Degradation | 1 hour | 1. Review performance metrics<br>2. Optimize slow queries<br>3. Consider caching improvements |
| Business Metric Anomaly | 4 hours | 1. Validate data accuracy<br>2. Check user behavior patterns<br>3. Notify business stakeholders |

### 10.2 Escalation Matrix
```
Level 1: On-call Engineer (0-30 minutes)
Level 2: Senior Engineer (30-60 minutes)
Level 3: Engineering Manager (1-2 hours)
Level 4: CTO/VP Engineering (2+ hours)
```

This comprehensive monitoring setup ensures proactive detection and rapid response to issues in the AWS Cost Estimation Platform production environment.