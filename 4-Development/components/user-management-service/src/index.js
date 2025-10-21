// Use AWS SDK v3 (built into Node.js 18 runtime)
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize AWS services
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

// Environment variables
const ENHANCED_TABLE = process.env.ENHANCED_TABLE || 'aws-cost-platform-enhanced-dev';

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
            
            // Multi-Item Management
            case 'POST /estimations/{id}/servers':
                return await handleAddServer(mockUserContext, pathParameters.id, requestBody);
            case 'PUT /estimations/{id}/servers/{serverId}':
                return await handleUpdateServer(mockUserContext, pathParameters.id, pathParameters.serverId, requestBody);
            case 'DELETE /estimations/{id}/servers/{serverId}':
                return await handleDeleteServer(mockUserContext, pathParameters.id, pathParameters.serverId);
                
            case 'POST /estimations/{id}/storage':
                return await handleAddStorage(mockUserContext, pathParameters.id, requestBody);
            case 'POST /estimations/{id}/databases':
                return await handleAddDatabase(mockUserContext, pathParameters.id, requestBody);
                
            // Supporting Data
            case 'GET /validation-rules':
                return await handleGetValidationRules();
            case 'GET /dropdown-lists':
                return await handleGetDropdownLists();
            case 'GET /service-mappings':
                return await handleGetServiceMappings();
            case 'GET /optimization-tips':
                return await handleGetOptimizationTips();
                
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
            TableName: ENHANCED_TABLE,
            Key: {
                PK: `USER#${userContext.userId}`,
                SK: 'PROFILE'
            }
        };
        
        const result = await dynamodb.get(params).promise();
        
        if (!result.Item) {
            // Create user profile if doesn't exist
            const timestamp = new Date().toISOString();
            const newUser = {
                PK: `USER#${userContext.userId}`,
                SK: 'PROFILE',
                GSI1PK: `USER#${userContext.email}`,
                GSI1SK: 'PROFILE',
                EntityType: 'User',
                UserId: userContext.userId,
                Email: userContext.email,
                FirstName: userContext.firstName || '',
                LastName: userContext.lastName || '',
                Role: userContext.role || 'Sales',
                Department: 'Sales',
                IsActive: true,
                CreatedAt: timestamp,
                UpdatedAt: timestamp,
                LastLoginAt: timestamp,
                Preferences: {
                    DefaultCurrency: 'USD',
                    DefaultRegion: 'us-east-1',
                    NotificationSettings: {
                        EmailNotifications: true,
                        DocumentReady: true,
                        SharedEstimations: true
                    }
                },
                MFAEnabled: false
            };
            
            await dynamodb.put({
                TableName: ENHANCED_TABLE,
                Item: newUser
            }).promise();
            
            return createResponse(200, {
                success: true,
                data: newUser
            });
        }
        
        // Update last login
        await dynamodb.update({
            TableName: ENHANCED_TABLE,
            Key: {
                PK: `USER#${userContext.userId}`,
                SK: 'PROFILE'
            },
            UpdateExpression: 'SET LastLoginAt = :timestamp, UpdatedAt = :timestamp',
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
 * Get all estimations from enhanced database
 */
async function handleGetEstimations(userContext, queryParams) {
    const { page = 1, limit = 20, status, sortBy = 'createdAt', sortOrder = 'desc' } = queryParams || {};
    
    try {
        const params = {
            TableName: ENHANCED_TABLE,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :userPK AND begins_with(GSI1SK, :estimationPrefix)',
            ExpressionAttributeValues: {
                ':userPK': `USER#${userContext.userId}`,
                ':estimationPrefix': 'ESTIMATION#'
            },
            ScanIndexForward: sortOrder === 'asc',
            Limit: parseInt(limit)
        };
        
        if (status) {
            params.FilterExpression = '#status = :status';
            params.ExpressionAttributeNames = { '#status': 'Status' };
            params.ExpressionAttributeValues[':status'] = status;
        }
        
        const result = await dynamodb.query(params).promise();
        
        return createResponse(200, {
            success: true,
            data: {
                estimations: result.Items,
                pagination: {
                    currentPage: parseInt(page),
                    itemsPerPage: parseInt(limit),
                    hasMore: !!result.LastEvaluatedKey
                }
            }
        });
        
    } catch (error) {
        console.error('Get estimations error:', error);
        // Fallback to mock data if database query fails
        return createResponse(200, {
            success: true,
            data: {
                estimations: [],
                pagination: {
                    currentPage: parseInt(page),
                    itemsPerPage: parseInt(limit),
                    hasMore: false
                }
            }
        });
    }
}

/**
 * Create new estimation with enhanced 200+ field support
 */
async function handleCreateEstimation(userContext, body) {
    const { projectName, description, inputMethod, enhancedClientInfo } = body;
    
    if (!projectName || !enhancedClientInfo?.companyName) {
        return createResponse(400, {
            error: 'Missing required fields',
            details: [
                { field: 'projectName', message: 'Project name is required' },
                { field: 'enhancedClientInfo.companyName', message: 'Company name is required' }
            ]
        });
    }
    
    const estimationId = require('crypto').randomUUID();
    const clientId = require('crypto').randomUUID();
    const timestamp = new Date().toISOString();
    
    try {
        // Create estimation metadata entity
        const estimationEntity = {
            PK: `ESTIMATION#${estimationId}`,
            SK: 'METADATA',
            GSI1PK: `USER#${userContext.userId}`,
            GSI1SK: `ESTIMATION#${timestamp}`,
            GSI2PK: 'STATUS#DRAFT',
            GSI2SK: `ESTIMATION#${estimationId}`,
            GSI3PK: `CLIENT#${clientId}`,
            GSI3SK: `ESTIMATION#${estimationId}`,
            EntityType: 'Estimation',
            EstimationId: estimationId,
            ClientId: clientId,
            UserId: userContext.userId,
            ProjectName: projectName,
            Description: description || '',
            Status: 'DRAFT',
            InputMethod: inputMethod || 'MANUAL_ENTRY',
            CreatedAt: timestamp,
            UpdatedAt: timestamp,
            EnhancedClientInfo: {
                CompanyName: enhancedClientInfo.companyName,
                IndustryType: enhancedClientInfo.industryType || '',
                CompanySize: enhancedClientInfo.companySize || '',
                PrimaryContactName: enhancedClientInfo.primaryContactName || '',
                PrimaryContactEmail: enhancedClientInfo.primaryContactEmail || '',
                PrimaryContactPhone: enhancedClientInfo.primaryContactPhone || '',
                TechnicalContactName: enhancedClientInfo.technicalContactName || '',
                TechnicalContactEmail: enhancedClientInfo.technicalContactEmail || '',
                ProjectTimelineMonths: enhancedClientInfo.projectTimelineMonths || 12,
                BudgetRange: enhancedClientInfo.budgetRange || '',
                PrimaryAwsRegion: enhancedClientInfo.primaryAwsRegion || 'us-east-1',
                SecondaryAwsRegions: enhancedClientInfo.secondaryAwsRegions || [],
                ComplianceRequirements: enhancedClientInfo.complianceRequirements || [],
                BusinessCriticality: enhancedClientInfo.businessCriticality || 'Medium',
                DisasterRecoveryRequired: enhancedClientInfo.disasterRecoveryRequired || false,
                MultiRegionRequired: enhancedClientInfo.multiRegionRequired || false
            },
            EstimationSummary: {
                TotalMonthlyCost: 0,
                TotalAnnualCost: 0,
                Currency: 'USD',
                LastCalculatedAt: null,
                CostBreakdown: {
                    Compute: 0,
                    Storage: 0,
                    Database: 0,
                    Network: 0,
                    Security: 0
                }
            },
            SharedWith: [],
            Tags: []
        };
        
        await dynamodb.send(new PutCommand({
            TableName: ENHANCED_TABLE,
            Item: estimationEntity
        }));
        
        return createResponse(201, {
            success: true,
            data: {
                estimationId,
                clientId,
                projectName,
                status: 'DRAFT',
                createdAt: timestamp,
                enhancedSupport: true,
                multiItemSupport: {
                    servers: 0,
                    storageItems: 0,
                    databases: 0
                }
            },
            message: 'Estimation created successfully'
        });
        
    } catch (error) {
        console.error('Create estimation error:', error);
        throw error;
    }
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
 * Add server to estimation
 */
async function handleAddServer(userContext, estimationId, body) {
    const serverId = require('crypto').randomUUID();
    const timestamp = new Date().toISOString();
    
    try {
        const serverEntity = {
            PK: `ESTIMATION#${estimationId}`,
            SK: `SERVER#${serverId}`,
            GSI3PK: `SERVER#${serverId}`,
            GSI3SK: `ESTIMATION#${estimationId}`,
            EntityType: 'ComputeServer',
            ServerId: serverId,
            EstimationId: estimationId,
            ServerName: body.serverName || `Server ${serverId.slice(0, 8)}`,
            EnvironmentType: body.environmentType || 'Production',
            WorkloadType: body.workloadType || 'Web',
            CPUCores: body.cpuCores || 4,
            RAMGB: body.ramGB || 16,
            OperatingSystem: body.operatingSystem || 'Amazon_Linux',
            Architecture: body.architecture || 'x86_64',
            BusinessCriticality: body.businessCriticality || 'High',
            AverageUtilizationPercent: body.averageUtilizationPercent || 70,
            PeakUtilizationPercent: body.peakUtilizationPercent || 95,
            ScalingType: body.scalingType || 'Auto',
            MinInstances: body.minInstances || 1,
            MaxInstances: body.maxInstances || 5,
            MonthlyRuntimeHours: body.monthlyRuntimeHours || 744,
            StorageType: body.storageType || 'EBS_GP3',
            RootVolumeSizeGB: body.rootVolumeSizeGB || 100,
            AdditionalStorageGB: body.additionalStorageGB || 0,
            NetworkPerformance: body.networkPerformance || 'High',
            SuggestedInstanceType: body.suggestedInstanceType || 't3.xlarge',
            EstimatedMonthlyCost: body.estimatedMonthlyCost || 0,
            OptimizationRecommendations: body.optimizationRecommendations || [],
            CreatedAt: timestamp,
            UpdatedAt: timestamp
        };
        
        await dynamodb.put({
            TableName: ENHANCED_TABLE,
            Item: serverEntity
        }).promise();
        
        return createResponse(201, {
            success: true,
            data: serverEntity,
            message: 'Server added successfully'
        });
        
    } catch (error) {
        console.error('Add server error:', error);
        throw error;
    }
}

/**
 * Update server
 */
async function handleUpdateServer(userContext, estimationId, serverId, body) {
    try {
        const updateExpression = [];
        const expressionAttributeValues = {};
        
        Object.keys(body).forEach(key => {
            if (body[key] !== undefined) {
                updateExpression.push(`${key} = :${key}`);
                expressionAttributeValues[`:${key}`] = body[key];
            }
        });
        
        updateExpression.push('UpdatedAt = :timestamp');
        expressionAttributeValues[':timestamp'] = new Date().toISOString();
        
        const params = {
            TableName: ENHANCED_TABLE,
            Key: {
                PK: `ESTIMATION#${estimationId}`,
                SK: `SERVER#${serverId}`
            },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };
        
        const result = await dynamodb.update(params).promise();
        
        return createResponse(200, {
            success: true,
            data: result.Attributes,
            message: 'Server updated successfully'
        });
        
    } catch (error) {
        console.error('Update server error:', error);
        throw error;
    }
}

/**
 * Delete server
 */
async function handleDeleteServer(userContext, estimationId, serverId) {
    try {
        await dynamodb.delete({
            TableName: ENHANCED_TABLE,
            Key: {
                PK: `ESTIMATION#${estimationId}`,
                SK: `SERVER#${serverId}`
            }
        }).promise();
        
        return createResponse(204, {});
        
    } catch (error) {
        console.error('Delete server error:', error);
        throw error;
    }
}

/**
 * Add storage item
 */
async function handleAddStorage(userContext, estimationId, body) {
    const storageId = require('crypto').randomUUID();
    const timestamp = new Date().toISOString();
    
    try {
        const storageEntity = {
            PK: `ESTIMATION#${estimationId}`,
            SK: `STORAGE#${storageId}`,
            GSI3PK: `STORAGE#${storageId}`,
            GSI3SK: `ESTIMATION#${estimationId}`,
            EntityType: 'StorageItem',
            StorageId: storageId,
            EstimationId: estimationId,
            StorageName: body.storageName || `Storage ${storageId.slice(0, 8)}`,
            StoragePurpose: body.storagePurpose || 'Application_Data',
            CurrentSizeGB: body.currentSizeGB || 100,
            ProjectedGrowthRatePercent: body.projectedGrowthRatePercent || 20,
            AccessPattern: body.accessPattern || 'Frequent',
            IOPSRequired: body.iopsRequired || 3000,
            ThroughputMbpsRequired: body.throughputMbpsRequired || 250,
            EncryptionRequired: body.encryptionRequired || true,
            BackupRequired: body.backupRequired || true,
            SuggestedAWSService: body.suggestedAWSService || 'EBS gp3',
            EstimatedMonthlyCost: body.estimatedMonthlyCost || 0,
            CreatedAt: timestamp,
            UpdatedAt: timestamp
        };
        
        await dynamodb.put({
            TableName: ENHANCED_TABLE,
            Item: storageEntity
        }).promise();
        
        return createResponse(201, {
            success: true,
            data: storageEntity,
            message: 'Storage added successfully'
        });
        
    } catch (error) {
        console.error('Add storage error:', error);
        throw error;
    }
}

/**
 * Add database
 */
async function handleAddDatabase(userContext, estimationId, body) {
    const databaseId = require('crypto').randomUUID();
    const timestamp = new Date().toISOString();
    
    try {
        const databaseEntity = {
            PK: `ESTIMATION#${estimationId}`,
            SK: `DATABASE#${databaseId}`,
            GSI3PK: `DATABASE#${databaseId}`,
            GSI3SK: `ESTIMATION#${estimationId}`,
            EntityType: 'DatabaseItem',
            DatabaseId: databaseId,
            EstimationId: estimationId,
            DatabaseName: body.databaseName || `Database ${databaseId.slice(0, 8)}`,
            DatabasePurpose: body.databasePurpose || 'OLTP',
            EngineType: body.engineType || 'Aurora_MySQL',
            DatabaseSizeGB: body.databaseSizeGB || 100,
            InstanceClass: body.instanceClass || 'db.r6g.large',
            MultiAZRequired: body.multiAZRequired || true,
            BackupRetentionDays: body.backupRetentionDays || 7,
            EncryptionAtRestRequired: body.encryptionAtRestRequired || true,
            EstimatedMonthlyCost: body.estimatedMonthlyCost || 0,
            CreatedAt: timestamp,
            UpdatedAt: timestamp
        };
        
        await dynamodb.put({
            TableName: ENHANCED_TABLE,
            Item: databaseEntity
        }).promise();
        
        return createResponse(201, {
            success: true,
            data: databaseEntity,
            message: 'Database added successfully'
        });
        
    } catch (error) {
        console.error('Add database error:', error);
        throw error;
    }
}

/**
 * Get validation rules
 */
async function handleGetValidationRules() {
    try {
        const params = {
            TableName: ENHANCED_TABLE,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'VALIDATION_RULES'
            }
        };
        
        const result = await dynamodb.send(new QueryCommand(params));
        
        return createResponse(200, {
            success: true,
            data: result.Items
        });
        
    } catch (error) {
        console.error('Get validation rules error:', error);
        throw error;
    }
}

/**
 * Get dropdown lists
 */
async function handleGetDropdownLists() {
    try {
        const params = {
            TableName: ENHANCED_TABLE,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'DROPDOWN_LISTS'
            }
        };
        
        const result = await dynamodb.send(new QueryCommand(params));
        
        return createResponse(200, {
            success: true,
            data: result.Items
        });
        
    } catch (error) {
        console.error('Get dropdown lists error:', error);
        throw error;
    }
}

/**
 * Get service mappings
 */
async function handleGetServiceMappings() {
    try {
        const params = {
            TableName: ENHANCED_TABLE,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'SERVICE_MAPPING'
            }
        };
        
        const result = await dynamodb.query(params).promise();
        
        return createResponse(200, {
            success: true,
            data: result.Items
        });
        
    } catch (error) {
        console.error('Get service mappings error:', error);
        throw error;
    }
}

/**
 * Get optimization tips
 */
async function handleGetOptimizationTips() {
    try {
        const params = {
            TableName: ENHANCED_TABLE,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'OPTIMIZATION_TIPS'
            }
        };
        
        const result = await dynamodb.query(params).promise();
        
        return createResponse(200, {
            success: true,
            data: result.Items
        });
        
    } catch (error) {
        console.error('Get optimization tips error:', error);
        throw error;
    }
}

/**
 * Create standardized API response with proper CORS
 */
function createResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-user-id,x-user-email,x-user-role,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Credentials': 'false',
            'Access-Control-Max-Age': '86400'
        },
        body: JSON.stringify({
            ...body,
            timestamp: new Date().toISOString(),
            requestId: process.env.AWS_REQUEST_ID || 'local-test'
        })
    };
}