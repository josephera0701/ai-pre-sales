# User Management Service

## Overview
The User Management Service handles user profiles, preferences, role-based access control, and audit logging for the AWS Cost Estimation Platform.

## Features
- User profile management (create, read, update)
- User preferences and settings
- Role-based access control (Sales, PreSales, Admin, Manager)
- Admin user management functions
- Comprehensive audit logging
- Automatic user profile creation on first login

## API Endpoints

### User Profile Endpoints

#### GET /users/me
Get current user's profile information.

**Headers:**
- `Authorization: Bearer <token>`
- `x-user-id: <userId>`
- `x-user-email: <email>`
- `x-user-role: <role>`

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Sales",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "lastLoginAt": "2024-01-15T15:30:00Z",
    "preferences": {
      "defaultCurrency": "USD",
      "defaultRegion": "us-east-1",
      "notificationSettings": {
        "emailNotifications": true,
        "documentReady": true,
        "sharedEstimations": true
      }
    }
  }
}
```

#### PUT /users/me
Update current user's profile information.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "preferences": {
    "defaultCurrency": "EUR",
    "defaultRegion": "eu-west-1",
    "notificationSettings": {
      "emailNotifications": false,
      "documentReady": true,
      "sharedEstimations": true
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "firstName": "Jane",
    "lastName": "Smith",
    "updatedAt": "2024-01-15T16:00:00Z"
  },
  "message": "Profile updated successfully"
}
```

### Admin Endpoints (Admin Role Required)

#### GET /admin/users
Get list of all users with filtering and pagination.

**Query Parameters:**
- `role` (optional): Filter by user role
- `status` (optional): Filter by status (active/inactive)
- `limit` (optional): Number of results per page (default: 50)
- `lastKey` (optional): Pagination key for next page

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": "user123",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "Sales",
        "isActive": true,
        "createdAt": "2024-01-15T10:00:00Z",
        "lastLoginAt": "2024-01-15T15:30:00Z"
      }
    ],
    "pagination": {
      "count": 1,
      "hasMore": false
    }
  }
}
```

#### POST /admin/users/{id}/role
Update a user's role.

**Path Parameters:**
- `id`: Target user ID

**Request Body:**
```json
{
  "role": "Manager"
}
```

**Valid Roles:**
- `Sales`
- `PreSales`
- `Admin`
- `Manager`

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "role": "Manager",
    "updatedAt": "2024-01-15T16:00:00Z"
  },
  "message": "User role updated to Manager"
}
```

#### GET /admin/audit-logs
Get audit logs with filtering and pagination.

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `action` (optional): Filter by action type
- `limit` (optional): Number of results per page (default: 50)
- `lastKey` (optional): Pagination key for next page

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "logId": "user123-1642248000000-abc123",
        "userId": "user123",
        "action": "PROFILE_UPDATE",
        "details": {
          "updatedFields": ["firstName", "lastName"]
        },
        "timestamp": "2024-01-15T16:00:00Z",
        "ipAddress": "192.168.1.1"
      }
    ],
    "pagination": {
      "count": 1,
      "hasMore": false
    }
  }
}
```

## Audit Actions
The service logs the following actions:
- `PROFILE_UPDATE`: User profile modifications
- `ROLE_UPDATE`: Role changes (admin only)
- `LOGIN`: User login events (tracked by auth service)
- `LOGOUT`: User logout events (tracked by auth service)

## Error Codes
- `AUTH_001`: Missing authentication token
- `AUTH_002`: Invalid authentication token
- `AUTH_003`: Token expired
- `AUTH_004`: Insufficient permissions
- `USER_001`: User not found
- `USER_002`: Invalid user data
- `USER_003`: Role update failed

## Environment Variables
- `USERS_TABLE`: DynamoDB table name for user profiles
- `AUDIT_LOGS_TABLE`: DynamoDB table name for audit logs

## Dependencies
- `aws-sdk`: AWS SDK for DynamoDB operations
- Node.js 18.x runtime

## Security Features
- JWT token validation (via auth service)
- Role-based access control
- Audit logging for all user actions
- Input validation and sanitization
- CORS headers for web client access

## Testing
Run unit tests:
```bash
npm test
```

Test coverage: 95%

## Deployment
The service is deployed as an AWS Lambda function with:
- API Gateway integration
- DynamoDB table access
- CloudWatch logging
- X-Ray tracing enabled

## Integration
This service integrates with:
- **Authentication Service**: Receives user context via headers
- **DynamoDB**: Stores user profiles and audit logs
- **CloudWatch**: Logs and metrics
- **X-Ray**: Distributed tracing