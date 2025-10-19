#!/bin/bash

# Authentication Service Testing Script

echo "🧪 Testing Authentication Service Component"
echo "==========================================="

# Test 1: Basic Lambda Function Test
echo "1. Testing Lambda Function..."
aws lambda invoke --function-name auth-service-staging --payload '{}' response.json
echo "Response:"
cat response.json | jq '.'
echo ""

# Test 2: Check Function Logs
echo "2. Checking Recent Logs..."
aws logs describe-log-streams --log-group-name /aws/lambda/auth-service-staging --order-by LastEventTime --descending --max-items 1 --query 'logStreams[0].logStreamName' --output text | xargs -I {} aws logs get-log-events --log-group-name /aws/lambda/auth-service-staging --log-stream-name {} --limit 5 --query 'events[*].message' --output text

# Test 3: Function Configuration
echo ""
echo "3. Function Configuration:"
aws lambda get-function-configuration --function-name auth-service-staging --query '{Runtime:Runtime,MemorySize:MemorySize,Timeout:Timeout,Environment:Environment}' --output table

# Test 4: Test with Different Payloads
echo ""
echo "4. Testing with HTTP-like Event..."
aws lambda invoke --function-name auth-service-staging --payload '{
  "httpMethod": "POST",
  "path": "/auth/login",
  "body": "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
}' response2.json
echo "Response:"
cat response2.json | jq '.'

# Cleanup
rm -f response.json response2.json

echo ""
echo "✅ Testing Complete!"