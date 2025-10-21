#!/bin/bash

# Endpoint Testing Script
echo "🧪 Testing Enhanced Lambda API Endpoints..."

# Test 1: CORS Preflight
echo "1. Testing CORS preflight..."
aws lambda invoke --function-name user-management-service-staging \
  --payload '{"httpMethod":"OPTIONS","path":"/validation-rules","headers":{"Origin":"http://localhost:3000"}}' \
  --region us-east-1 cors-test.json
echo "CORS Response:" && cat cors-test.json && echo ""

# Test 2: Validation Rules
echo "2. Testing validation rules endpoint..."
aws lambda invoke --function-name user-management-service-staging \
  --payload '{"httpMethod":"GET","path":"/validation-rules","headers":{"x-user-id":"test-user"}}' \
  --region us-east-1 validation-test.json
echo "Validation Rules Response:" && cat validation-test.json && echo ""

# Test 3: Dropdown Lists
echo "3. Testing dropdown lists endpoint..."
aws lambda invoke --function-name user-management-service-staging \
  --payload '{"httpMethod":"GET","path":"/dropdown-lists","headers":{"x-user-id":"test-user"}}' \
  --region us-east-1 dropdown-test.json
echo "Dropdown Lists Response:" && cat dropdown-test.json && echo ""

# Test 4: Service Mappings
echo "4. Testing service mappings endpoint..."
aws lambda invoke --function-name user-management-service-staging \
  --payload '{"httpMethod":"GET","path":"/service-mappings","headers":{"x-user-id":"test-user"}}' \
  --region us-east-1 service-test.json
echo "Service Mappings Response:" && cat service-test.json && echo ""

# Test 5: Optimization Tips
echo "5. Testing optimization tips endpoint..."
aws lambda invoke --function-name user-management-service-staging \
  --payload '{"httpMethod":"GET","path":"/optimization-tips","headers":{"x-user-id":"test-user"}}' \
  --region us-east-1 optimization-test.json
echo "Optimization Tips Response:" && cat optimization-test.json && echo ""

# Cleanup
rm -f cors-test.json validation-test.json dropdown-test.json service-test.json optimization-test.json

echo "✅ Endpoint testing completed!"