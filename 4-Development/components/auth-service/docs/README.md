# Authentication Service Component

## Overview
The Authentication Service is a serverless component responsible for user authentication, authorization, and session management using AWS Cognito and custom JWT tokens.

## Features
- User login/logout
- Token refresh and validation
- User registration
- Password reset
- Multi-factor authentication support
- Role-based access control
- Session management

## API Endpoints

### POST /auth/login
Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
    "idToken": "eyJhbGciOiJSUzI1NiIs...",
    "customToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "userId": "user123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Sales"
    }
  }
}
```

### POST /auth/logout
Logout user and invalidate tokens.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Headers:**
```
Authorization: Bearer <access-token>
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

### POST /auth/register
Register new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "Sales"
}
```

### POST /auth/reset-password
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

### POST /auth/validate
Validate access token and get user info.

**Headers:**
```
Authorization: Bearer <access-token>
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| COGNITO_USER_POOL_ID | AWS Cognito User Pool ID | Yes |
| COGNITO_CLIENT_ID | AWS Cognito Client ID | Yes |
| JWT_SECRET_ARN | AWS Secrets Manager ARN for JWT secret | Yes |

## Dependencies

### AWS Services
- AWS Cognito User Pool
- AWS Secrets Manager
- AWS Lambda

### NPM Packages
- aws-sdk
- jsonwebtoken
- bcryptjs

## Deployment

### Lambda Configuration
- **Runtime:** Node.js 18.x
- **Memory:** 256MB
- **Timeout:** 10 seconds
- **Concurrency:** On-demand

### IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:InitiateAuth",
        "cognito-idp:GetUser",
        "cognito-idp:RevokeToken",
        "cognito-idp:GlobalSignOut",
        "cognito-idp:SignUp",
        "cognito-idp:ForgotPassword"
      ],
      "Resource": "arn:aws:cognito-idp:*:*:userpool/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:jwt-*"
    }
  ]
}
```

## Error Codes

| Code | Description |
|------|-------------|
| AUTH_001 | Invalid credentials |
| AUTH_002 | Token expired |
| AUTH_003 | Token invalid |
| AUTH_007 | Account not confirmed |
| AUTH_008 | User already exists |
| AUTH_009 | Password does not meet requirements |

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests:
```bash
npm run test:integration
```

## Security Considerations

1. **Token Security:** All tokens are securely generated and validated
2. **Password Policy:** Enforced through Cognito configuration
3. **Rate Limiting:** Implemented at API Gateway level
4. **Encryption:** All data encrypted in transit and at rest
5. **Audit Logging:** All authentication events are logged

## Monitoring

### CloudWatch Metrics
- Authentication success/failure rates
- Token validation performance
- Error rates by endpoint
- User registration trends

### Alarms
- High authentication failure rate (>10% in 5 minutes)
- Token validation errors (>5% in 5 minutes)
- Lambda function errors or timeouts

## Troubleshooting

### Common Issues

1. **Invalid Cognito Configuration**
   - Verify USER_POOL_ID and CLIENT_ID
   - Check Cognito User Pool settings

2. **JWT Secret Not Found**
   - Verify JWT_SECRET_ARN exists in Secrets Manager
   - Check Lambda IAM permissions

3. **Token Validation Failures**
   - Check token expiration
   - Verify token format and signature

### Logs
All authentication events are logged to CloudWatch with structured logging format:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "event": "USER_LOGIN",
  "userId": "user123",
  "email": "user@example.com",
  "success": true,
  "duration": 250
}
```