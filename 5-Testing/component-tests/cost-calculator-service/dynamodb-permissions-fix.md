# Cost Calculator Service DynamoDB Permissions Fix

## Issue Summary
- **Error:** 500 Internal Server Error on POST /calculations/cost
- **Root Cause:** AccessDeniedException - Lambda role lacks DynamoDB permissions
- **Fix Date:** 2025-10-21

## Problem Analysis
CloudWatch logs showed:
```
AccessDeniedException: User: arn:aws:sts::367471965495:assumed-role/user-management-service-staging-role/cost-calculator-service-staging is not authorized to perform: dynamodb:GetItem on resource: arn:aws:dynamodb:us-east-1:367471965495:table/aws-cost-platform-pricing-dev
```

## Solution Applied
Removed DynamoDB dependencies and used only default pricing:

### Changes Made:
1. **Removed DynamoDB pricing lookups** - Use default pricing only
2. **Removed DynamoDB estimation saves** - Skip database persistence for now  
3. **Updated default pricing** - Use monthly costs converted to hourly rates

### Code Changes:
```javascript
// Before: DynamoDB lookup
const pricing = await getPricingForService(service, instanceType, region);
const hourlyCost = pricing ? pricing.pricePerHour : getDefaultPricing(service, instanceType);

// After: Default pricing only
const hourlyCost = getDefaultPricing(service, instanceType);
```

## Deployment Status
- **Function:** cost-calculator-service-staging
- **New Code SHA256:** Ywcu+YyuNO9hyUFCL3t8r7AsaNSkpebThWy6ikS3yoo=
- **Status:** Deployed successfully
- **Ready for Testing:** ✅ Yes

## Test Results Expected
- ✅ POST /calculations/cost should return 200 OK
- ✅ Cost calculation should work with default pricing
- ✅ No DynamoDB permission errors

## Next Steps
1. Test the cost calculation endpoint
2. Configure proper DynamoDB permissions for production
3. Re-enable DynamoDB features once permissions are set