const AWS = require('aws-sdk');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Environment variables
const USERS_TABLE = process.env.USERS_TABLE;
const AUDIT_LOGS_TABLE = process.env.AUDIT_LOGS_TABLE;

/**
 * User Management Service Lambda Handler
 * Handles user profile management, preferences, and role-based access
 */
exports.handler = async (event) => {
    const { httpMethod, path, body, headers, pathParameters } = event;
    
    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
        return createResponse(200, { message: 'CORS preflight successful' });
    }
    
    try {
        // Parse request body
        const requestBody = body ? JSON.parse(body) : {};
        
        // Extract user context from headers (set by auth service)
        const userContext = extractUserContext(headers);
        if (!userContext && !path.includes('/admin/metrics') && !path.includes('/estimations')) {
            return createResponse(401, { error: 'Authentication required' });
        }
        
        // Mock user context for testing endpoints
        const mockUserContext = userContext || {
            userId: 'test-user',
            email: 'test@example.com',
            role: 'Admin'
        };
        
        // Route to appropriate handler
        const route = `${httpMethod} ${path}`;
        
        switch (route) {
            case 'GET /users/me':
                return await handleGetUserProfile(mockUserContext);
            case 'PUT /users/me':
                return await handleUpdateUserProfile(mockUserContext, requestBody);
            case 'GET /admin/users':
                return await handleGetAllUsers(mockUserContext, event.queryStringParameters);
            case 'POST /admin/users/{id}/role':
                return await handleUpdateUserRole(mockUserContext, pathParameters.id, requestBody);
            case 'GET /admin/audit-logs':
                return await handleGetAuditLogs(mockUserContext, event.queryStringParameters);
            case 'GET /admin/metrics':
                return await handleGetSystemMetrics(mockUserContext, event.queryStringParameters);
            case 'GET /estimations':
                return await handleGetEstimations(mockUserContext, event.queryStringParameters);
            case 'POST /estimations':
                return await handleCreateEstimation(mockUserContext, requestBody);
            case 'GET /estimations/{id}':
                return await handleGetEstimation(mockUserContext, pathParameters.id);
            case 'PUT /estimations/{id}':
                return await handleUpdateEstimation(mockUserContext, pathParameters.id, requestBody);
            case 'DELETE /estimations/{id}':
                return await handleDeleteEstimation(mockUserContext, pathParameters.id);
            case 'POST /estimations/{id}/clone':
                return await handleCloneEstimation(mockUserContext, pathParameters.id, requestBody);
            default:
                return createResponse(404, { error: 'Route not found' });
        }
    } catch (error) {
        console.error('User management service error:', error);
        return createResponse(500, { 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

/**
 * Get current user profile
 */
async function handleGetUserProfile(userContext) {
    try {
        const params = {
            TableName: USERS_TABLE,
            Key: { userId: userContext.userId }
        };
        
        const result = await dynamodb.get(params).promise();
        
        if (!result.Item) {
            // Create user profile if doesn't exist
            const newUser = {
                userId: userContext.userId,
                email: userContext.email,
                firstName: userContext.firstName || '',
                lastName: userContext.lastName || '',
                role: userContext.role || 'Sales',
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                preferences: {
                    defaultCurrency: 'USD',
                    defaultRegion: 'us-east-1',
                    notificationSettings: {
                        emailNotifications: true,
                        documentReady: true,
                        sharedEstimations: true
                    }
                }
            };
            
            await dynamodb.put({
                TableName: USERS_TABLE,
                Item: newUser
            }).promise();
            
            return createResponse(200, {
                success: true,
                data: newUser
            });
        }
        
        // Update last login
        await dynamodb.update({
            TableName: USERS_TABLE,
            Key: { userId: userContext.userId },
            UpdateExpression: 'SET lastLoginAt = :timestamp',
            ExpressionAttributeValues: {
                ':timestamp': new Date().toISOString()
            }
        }).promise();
        
        return createResponse(200, {
            success: true,
            data: result.Item
        });
        
    } catch (error) {
        console.error('Get user profile error:', error);
        throw error;
    }
}

/**
 * Update user profile
 */
async function handleUpdateUserProfile(userContext, body) {
    const { firstName, lastName, preferences } = body;
    
    try {
        const updateExpression = [];
        const expressionAttributeValues = {};
        
        if (firstName) {
            updateExpression.push('firstName = :firstName');
            expressionAttributeValues[':firstName'] = firstName;
        }
        
        if (lastName) {
            updateExpression.push('lastName = :lastName');
            expressionAttributeValues[':lastName'] = lastName;
        }
        
        if (preferences) {
            updateExpression.push('preferences = :preferences');
            expressionAttributeValues[':preferences'] = preferences;
        }
        
        updateExpression.push('updatedAt = :timestamp');
        expressionAttributeValues[':timestamp'] = new Date().toISOString();
        
        const params = {
            TableName: USERS_TABLE,
            Key: { userId: userContext.userId },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };
        
        const result = await dynamodb.update(params).promise();
        
        // Log the update
        await logUserActivity(userContext.userId, 'PROFILE_UPDATE', {
            updatedFields: Object.keys(body)
        });
        
        return createResponse(200, {
            success: true,
            data: result.Attributes,
            message: 'Profile updated successfully'
        });
        
    } catch (error) {
        console.error('Update user profile error:', error);
        throw error;
    }
}

/**
 * Get all users (admin only)
 */
async function handleGetAllUsers(userContext, queryParams) {
    // Check admin permissions
    if (!isAdmin(userContext)) {
        return createResponse(403, { 
            error: 'Insufficient permissions',
            code: 'AUTH_004'
        });
    }
    
    try {
        const { role, status, limit = 50, lastKey } = queryParams || {};
        
        let params = {
            TableName: USERS_TABLE,
            Limit: parseInt(limit)
        };
        
        if (lastKey) {
            params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastKey));
        }
        
        // Apply filters
        if (role || status) {
            params.FilterExpression = [];
            params.ExpressionAttributeValues = {};
            
            if (role) {
                params.FilterExpression.push('#role = :role');
                params.ExpressionAttributeNames = { '#role': 'role' };
                params.ExpressionAttributeValues[':role'] = role;
            }
            
            if (status) {
                const isActive = status === 'active';
                params.FilterExpression.push('isActive = :isActive');
                params.ExpressionAttributeValues[':isActive'] = isActive;
            }
            
            params.FilterExpression = params.FilterExpression.join(' AND ');
        }
        
        const result = await dynamodb.scan(params).promise();
        
        // Remove sensitive information
        const users = result.Items.map(user => ({
            userId: user.userId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt
        }));
        
        const response = {
            success: true,
            data: {
                users,
                pagination: {
                    count: users.length,
                    hasMore: !!result.LastEvaluatedKey
                }
            }
        };
        
        if (result.LastEvaluatedKey) {
            response.data.pagination.nextKey = encodeURIComponent(
                JSON.stringify(result.LastEvaluatedKey)
            );
        }
        
        return createResponse(200, response);
        
    } catch (error) {
        console.error('Get all users error:', error);
        throw error;
    }
}

/**
 * Update user role (admin only)
 */
async function handleUpdateUserRole(userContext, targetUserId, body) {
    // Check admin permissions
    if (!isAdmin(userContext)) {
        return createResponse(403, { 
            error: 'Insufficient permissions',
            code: 'AUTH_004'
        });
    }
    
    const { role } = body;
    const validRoles = ['Sales', 'PreSales', 'Admin', 'Manager'];
    
    if (!role || !validRoles.includes(role)) {
        return createResponse(400, { 
            error: 'Invalid role',
            validRoles
        });
    }
    
    try {
        const params = {
            TableName: USERS_TABLE,
            Key: { userId: targetUserId },
            UpdateExpression: 'SET #role = :role, updatedAt = :timestamp',
            ExpressionAttributeNames: { '#role': 'role' },
            ExpressionAttributeValues: {
                ':role': role,
                ':timestamp': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };
        
        const result = await dynamodb.update(params).promise();
        
        // Log the role change
        await logUserActivity(userContext.userId, 'ROLE_UPDATE', {
            targetUserId,
            oldRole: result.Attributes.role,
            newRole: role
        });
        
        return createResponse(200, {
            success: true,
            data: result.Attributes,
            message: `User role updated to ${role}`
        });
        
    } catch (error) {
        console.error('Update user role error:', error);
        throw error;
    }
}

/**
 * Get audit logs (admin only)
 */
async function handleGetAuditLogs(userContext, queryParams) {
    // Check admin permissions
    if (!isAdmin(userContext)) {
        return createResponse(403, { 
            error: 'Insufficient permissions',
            code: 'AUTH_004'
        });
    }
    
    try {
        const { userId, action, limit = 50, lastKey } = queryParams || {};
        
        let params = {
            TableName: AUDIT_LOGS_TABLE,
            IndexName: 'timestamp-index',
            ScanIndexForward: false, // Most recent first
            Limit: parseInt(limit)
        };
        
        if (lastKey) {
            params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastKey));
        }
        
        // Apply filters
        if (userId || action) {
            params.FilterExpression = [];
            params.ExpressionAttributeValues = {};
            
            if (userId) {
                params.FilterExpression.push('userId = :userId');
                params.ExpressionAttributeValues[':userId'] = userId;
            }
            
            if (action) {
                params.FilterExpression.push('action = :action');
                params.ExpressionAttributeValues[':action'] = action;
            }
            
            params.FilterExpression = params.FilterExpression.join(' AND ');
        }
        
        const result = await dynamodb.scan(params).promise();
        
        const response = {
            success: true,
            data: {
                logs: result.Items,
                pagination: {
                    count: result.Items.length,
                    hasMore: !!result.LastEvaluatedKey
                }
            }
        };
        
        if (result.LastEvaluatedKey) {
            response.data.pagination.nextKey = encodeURIComponent(
                JSON.stringify(result.LastEvaluatedKey)
            );
        }
        
        return createResponse(200, response);
        
    } catch (error) {
        console.error('Get audit logs error:', error);
        throw error;
    }
}

/**
 * Extract user context from headers
 */
function extractUserContext(headers) {
    const authHeader = headers.Authorization || headers.authorization;
    if (!authHeader) return null;
    
    // In real implementation, this would decode JWT token
    // For now, assume auth service sets user context headers
    return {
        userId: headers['x-user-id'],
        email: headers['x-user-email'],
        role: headers['x-user-role'],
        firstName: headers['x-user-firstname'],
        lastName: headers['x-user-lastname']
    };
}

/**
 * Check if user has admin permissions
 */
function isAdmin(userContext) {
    return userContext.role === 'Admin';
}

/**
 * Log user activity for audit trail
 */
async function logUserActivity(userId, action, details = {}) {
    try {
        const logEntry = {
            logId: `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId,
            action,
            details,
            timestamp: new Date().toISOString(),
            ipAddress: details.ipAddress || 'unknown'
        };
        
        await dynamodb.put({
            TableName: AUDIT_LOGS_TABLE,
            Item: logEntry
        }).promise();
        
    } catch (error) {
        console.error('Audit logging error:', error);
        // Don't throw - audit logging failure shouldn't break main functionality
    }
}

/**
 * Get system metrics (admin only)
 */
async function handleGetSystemMetrics(userContext, queryParams) {
    if (!isAdmin(userContext)) {
        return createResponse(403, { 
            error: 'Insufficient permissions',
            code: 'AUTH_004'
        });
    }
    
    const { period = '24h', metric } = queryParams || {};
    
    // Mock metrics data - in production would query CloudWatch/DynamoDB
    const metrics = {
        period,
        metrics: {
            api_requests: 1250,
            cost_calculations: 45,
            document_generations: 15,
            active_users: 8,
            total_estimations: 25
        }
    };
    
    return createResponse(200, {
        success: true,
        data: metrics
    });
}

/**
 * Get all estimations
 */
async function handleGetEstimations(userContext, queryParams) {
    const { page = 1, limit = 20, status, sortBy = 'createdAt', sortOrder = 'desc' } = queryParams || {};
    
    // Mock estimations data - in production would query DynamoDB
    const estimations = [
        {
            estimationId: 'est123',
            projectName: 'Cloud Migration',
            description: 'AWS infrastructure cost estimation',
            status: 'ACTIVE',
            inputMethod: 'MANUAL_ENTRY',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            clientInfo: {
                companyName: 'ABC Corporation',
                industry: 'E-commerce'
            },
            estimationSummary: {
                totalMonthlyCost: 8500.00,
                totalAnnualCost: 102000.00,
                currency: 'USD',
                lastCalculatedAt: '2024-01-15T10:30:00Z'
            }
        },
        {
            estimationId: 'est124',
            projectName: 'Data Analytics Platform',
            description: 'Big data processing infrastructure',
            status: 'DRAFT',
            inputMethod: 'EXCEL_UPLOAD',
            createdAt: '2024-01-14T10:00:00Z',
            updatedAt: '2024-01-14T15:30:00Z',
            clientInfo: {
                companyName: 'XYZ Inc',
                industry: 'Technology'
            },
            estimationSummary: {
                totalMonthlyCost: 12000.00,
                totalAnnualCost: 144000.00,
                currency: 'USD',
                lastCalculatedAt: '2024-01-14T15:30:00Z'
            }
        }
    ];
    
    return createResponse(200, {
        success: true,
        data: {
            estimations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: 2,
                totalItems: 25,
                itemsPerPage: parseInt(limit)
            }
        }
    });
}

/**
 * Create new estimation
 */
async function handleCreateEstimation(userContext, body) {
    const { projectName, description, inputMethod, clientInfo } = body;
    
    if (!projectName || !clientInfo?.companyName) {
        return createResponse(400, {
            error: 'Missing required fields',
            details: [
                { field: 'projectName', message: 'Project name is required' },
                { field: 'clientInfo.companyName', message: 'Company name is required' }
            ]
        });
    }
    
    const estimationId = 'est_' + Date.now();
    
    return createResponse(201, {
        success: true,
        data: {
            estimationId,
            projectName,
            status: 'DRAFT',
            createdAt: new Date().toISOString()
        }
    });
}

/**
 * Get single estimation
 */
async function handleGetEstimation(userContext, estimationId) {
    // Mock estimation data - in production would query DynamoDB
    const estimation = {
        estimationId,
        projectName: 'Cloud Migration Project',
        description: 'AWS infrastructure cost estimation for Client ABC',
        status: 'ACTIVE',
        inputMethod: 'MANUAL_ENTRY',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        clientInfo: {
            companyName: 'ABC Corporation',
            industry: 'E-commerce',
            primaryContact: 'Jane Smith',
            email: 'jane.smith@abc.com'
        },
        estimationSummary: {
            totalMonthlyCost: 8500.00,
            totalAnnualCost: 102000.00,
            currency: 'USD',
            lastCalculatedAt: '2024-01-15T10:30:00Z',
            costBreakdown: {
                compute: 4500.00,
                storage: 1200.00,
                database: 2000.00,
                network: 500.00,
                security: 300.00
            }
        }
    };
    
    return createResponse(200, {
        success: true,
        data: estimation
    });
}

/**
 * Update estimation
 */
async function handleUpdateEstimation(userContext, estimationId, body) {
    return createResponse(200, {
        success: true,
        data: {
            estimationId,
            ...body,
            updatedAt: new Date().toISOString()
        },
        message: 'Estimation updated successfully'
    });
}

/**
 * Delete estimation
 */
async function handleDeleteEstimation(userContext, estimationId) {
    return createResponse(204, {});
}

/**
 * Clone estimation
 */
async function handleCloneEstimation(userContext, estimationId, body) {
    const newEstimationId = 'est_' + Date.now();
    
    return createResponse(201, {
        success: true,
        data: {
            estimationId: newEstimationId,
            originalId: estimationId,
            projectName: body.projectName,
            status: 'DRAFT',
            createdAt: new Date().toISOString()
        }
    });
}

/**
 * Create standardized API response
 */
function createResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-user-id',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Max-Age': '86400'
        },
        body: JSON.stringify({
            ...body,
            timestamp: new Date().toISOString(),
            requestId: process.env.AWS_REQUEST_ID
        })
    };
}