# Cost Calculator Service

## Overview
The Cost Calculator Service is the core business logic component that calculates AWS infrastructure costs based on requirements, provides cost comparisons, and generates optimization recommendations for the AWS Cost Estimation Platform.

## Features
- AWS cost calculations for compute, storage, database, and network services
- Multi-configuration cost comparisons
- Cost optimization recommendations
- Pricing data management
- Calculation history tracking
- Real-time cost estimates

## API Endpoints

### Cost Calculation Endpoints

#### POST /calculations/cost
Calculate AWS costs based on infrastructure requirements.

**Headers:**
- `Authorization: Bearer <token>`
- `x-user-id: <userId>`
- `x-user-email: <email>`
- `x-user-role: <role>`

**Request Body:**
```json
{
  "requirements": {
    "compute": [
      {
        "service": "EC2",
        "instanceType": "t3.medium",
        "quantity": 2,
        "hoursPerMonth": 730
      }
    ],
    "storage": [
      {
        "service": "S3",
        "storageType": "standard",
        "sizeGB": 1000,
        "accessPattern": "standard"
      }
    ],
    "database": [
      {
        "service": "RDS",
        "instanceType": "db.t3.small",
        "storageGB": 100,
        "backupGB": 50
      }
    ],
    "network": {
      "dataTransferGB": 500,
      "cloudFrontGB": 200,
      "requests": 1000000
    }
  },
  "region": "us-east-1",
  "duration": 12
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "estimationId": "est-1642248000000-abc123",
    "userId": "user123",
    "totalMonthlyCost": 245.67,
    "totalAnnualCost": 2948.04,
    "costBreakdown": {
      "monthly": {
        "compute": 120.45,
        "storage": 23.00,
        "database": 89.22,
        "network": 13.00
      },
      "annual": {
        "compute": 1445.40,
        "storage": 276.00,
        "database": 1070.64,
        "network": 156.00
      },
      "details": {
        "compute": [
          {
            "service": "EC2",
            "instanceType": "t3.medium",
            "quantity": 2,
            "hoursPerMonth": 730,
            "hourlyCost": 0.0416,
            "monthlyCost": 60.77
          }
        ]
      }
    },
    "recommendations": [
      {
        "category": "compute",
        "type": "cost-optimization",
        "title": "Consider Reserved Instances",
        "description": "Save up to 75% on compute costs with 1-year or 3-year Reserved Instances",
        "potentialSavings": 48.18,
        "priority": "high"
      }
    ],
    "createdAt": "2024-01-15T16:00:00Z",
    "status": "completed"
  },
  "message": "Cost calculation completed successfully"
}
```

#### POST /calculations/compare
Compare multiple infrastructure configurations.

**Request Body:**
```json
{
  "configurations": [
    {
      "name": "Basic Configuration",
      "requirements": { /* infrastructure requirements */ },
      "duration": 12
    },
    {
      "name": "Advanced Configuration",
      "requirements": { /* infrastructure requirements */ },
      "duration": 12
    }
  ],
  "region": "us-east-1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comparisons": [
      {
        "name": "Basic Configuration",
        "totalMonthlyCost": 245.67,
        "totalAnnualCost": 2948.04,
        "costBreakdown": { /* detailed breakdown */ },
        "recommendations": [ /* optimization recommendations */ ]
      },
      {
        "name": "Advanced Configuration",
        "totalMonthlyCost": 456.89,
        "totalAnnualCost": 5482.68,
        "costBreakdown": { /* detailed breakdown */ },
        "recommendations": [ /* optimization recommendations */ ]
      }
    ],
    "insights": {
      "mostCostEffective": "Basic Configuration",
      "mostExpensive": "Advanced Configuration",
      "monthlySavings": 211.22,
      "annualSavings": 2534.64,
      "percentageSavings": 46,
      "summary": "Basic Configuration is 46% more cost-effective than Advanced Configuration"
    },
    "recommendedConfiguration": "Basic Configuration"
  },
  "message": "Configuration comparison completed"
}
```

### Pricing Data Endpoints

#### GET /calculations/pricing-data
Get AWS pricing data for specific services.

**Query Parameters:**
- `service` (optional): AWS service name (e.g., "EC2", "S3")
- `region` (optional): AWS region (default: "us-east-1")
- `instanceType` (optional): Instance type filter

**Response:**
```json
{
  "success": true,
  "data": {
    "pricingData": [
      {
        "service": "EC2",
        "instanceType": "t3.medium",
        "region": "us-east-1",
        "pricePerHour": 0.0416,
        "lastUpdated": "2024-01-15T12:00:00Z"
      }
    ],
    "region": "us-east-1",
    "lastUpdated": "2024-01-15T16:00:00Z"
  }
}
```

### History Endpoints

#### GET /calculations/history
Get calculation history for the current user.

**Query Parameters:**
- `limit` (optional): Number of results (default: 20)
- `lastKey` (optional): Pagination key for next page

**Response:**
```json
{
  "success": true,
  "data": {
    "estimations": [
      {
        "estimationId": "est-123",
        "totalMonthlyCost": 245.67,
        "totalAnnualCost": 2948.04,
        "region": "us-east-1",
        "createdAt": "2024-01-15T16:00:00Z",
        "status": "completed"
      }
    ],
    "pagination": {
      "count": 1,
      "hasMore": false
    }
  }
}
```

#### GET /calculations/{id}
Get specific calculation by ID.

**Path Parameters:**
- `id`: Estimation ID

**Response:**
```json
{
  "success": true,
  "data": {
    "estimationId": "est-123",
    "userId": "user123",
    "requirements": { /* original requirements */ },
    "totalMonthlyCost": 245.67,
    "totalAnnualCost": 2948.04,
    "costBreakdown": { /* detailed breakdown */ },
    "recommendations": [ /* optimization recommendations */ ],
    "createdAt": "2024-01-15T16:00:00Z",
    "status": "completed"
  }
}
```

## Cost Calculation Logic

### Supported Services

#### Compute Services
- **EC2 Instances:** t3.micro, t3.small, t3.medium, t3.large, m5.large, m5.xlarge
- **Lambda Functions:** GB-second pricing model
- **Auto Scaling:** Dynamic instance scaling calculations

#### Storage Services
- **S3 Storage:** Standard, Infrequent Access, Glacier storage classes
- **EBS Volumes:** gp3, io2 volume types with IOPS calculations
- **EFS:** Standard and Infrequent Access storage classes

#### Database Services
- **RDS Instances:** db.t3.micro, db.t3.small, db.m5.large with storage and backup costs
- **DynamoDB:** On-demand and provisioned capacity models
- **ElastiCache:** Redis and Memcached instance types

#### Network Services
- **Data Transfer:** Regional and internet data transfer costs
- **CloudFront:** CDN distribution and request costs
- **Load Balancers:** Application and Network Load Balancer costs

### Pricing Model

#### Default Pricing (USD)
```javascript
// EC2 Instance Pricing (per hour)
{
  't3.micro': 0.0104,
  't3.small': 0.0208,
  't3.medium': 0.0416,
  't3.large': 0.0832,
  'm5.large': 0.096,
  'm5.xlarge': 0.192
}

// Storage Pricing (per GB/month)
{
  'S3-standard': 0.023,
  'S3-ia': 0.0125,
  'S3-glacier': 0.004,
  'EBS-gp3': 0.08,
  'EBS-io2': 0.125
}

// Database Pricing (per hour)
{
  'db.t3.micro': 0.017,
  'db.t3.small': 0.034,
  'db.m5.large': 0.192
}
```

### Cost Optimization Recommendations

#### Compute Optimizations
- **Reserved Instances:** Up to 75% savings for predictable workloads
- **Spot Instances:** Up to 90% savings for fault-tolerant workloads
- **Right-sizing:** Match instance types to actual usage patterns

#### Storage Optimizations
- **Lifecycle Policies:** Automatic transition to cheaper storage classes
- **Compression:** Reduce storage requirements
- **Deduplication:** Eliminate redundant data

#### Database Optimizations
- **Instance Right-sizing:** Match database capacity to usage
- **Read Replicas:** Optimize read performance and costs
- **Backup Optimization:** Efficient backup strategies

## Error Codes

- `CALC_001`: Infrastructure requirements are required
- `CALC_002`: At least 2 configurations required for comparison
- `CALC_003`: Calculation not found
- `CALC_004`: Access denied to calculation

## Environment Variables

- `ESTIMATIONS_TABLE`: DynamoDB table for storing cost estimations
- `PRICING_TABLE`: DynamoDB table for AWS pricing data

## Dependencies

- `aws-sdk`: AWS SDK for DynamoDB operations
- Node.js 18.x runtime

## Security Features

- JWT token validation via auth service
- User-based access control for calculations
- Input validation and sanitization
- Cost calculation audit trail
- CORS headers for web client access

## Testing

Run unit tests:
```bash
npm test
```

Test coverage: 95%

## Performance Considerations

- **Memory:** 512MB for complex calculations
- **Timeout:** 30 seconds for large estimations
- **Concurrency:** Provisioned concurrency for high-demand periods
- **Caching:** Pricing data cached for performance

## Integration

This service integrates with:
- **Authentication Service:** User context validation
- **User Management Service:** User preferences and settings
- **DynamoDB:** Cost estimations and pricing data storage
- **CloudWatch:** Metrics and logging
- **X-Ray:** Distributed tracing

## Business Rules

### Cost Calculation Rules
1. All costs rounded to 2 decimal places
2. Monthly costs calculated based on 730 hours
3. Annual costs calculated as monthly × 12
4. Regional pricing variations applied
5. Volume discounts applied for large deployments

### Recommendation Rules
1. Reserved Instance recommendations for costs > $500/month
2. Storage lifecycle recommendations for storage > $200/month
3. Database optimization recommendations for costs > $300/month
4. Minimum 10% potential savings for recommendations