const AWS = require('aws-sdk');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Environment variables
const ESTIMATIONS_TABLE = process.env.ESTIMATIONS_TABLE || 'aws-cost-estimations-staging';
const USERS_TABLE = process.env.USERS_TABLE || 'cost-estimation-users-staging';

/**
 * Dashboard API Service Lambda Handler
 * Handles /admin/metrics and /estimations endpoints per technical design
 * Designed to be integrated into main API Gateway (9u3ohhh561)
 */

exports.handler = async (event) => {
    const { httpMethod, path, queryStringParameters, headers } = event;
    
    console.log('Dashboard API Request:', { httpMethod, path, queryStringParameters });
    
    // Handle CORS preflight requests
    if (httpMethod === 'OPTIONS') {
        return createResponse(200, { message: 'CORS preflight successful' });
    }
    
    try {
        // Extract user context from Cognito claims (set by API Gateway)
        const userContext = extractUserContext(event);
        
        // Route to appropriate handler based on path
        if (path === '/dashboard/metrics' && httpMethod === 'GET') {
            return await handleGetDashboardMetrics(queryStringParameters, userContext);
        } else if (path === '/admin/metrics' && httpMethod === 'GET') {
            return await handleGetAdminMetrics(queryStringParameters, userContext);
        } else if (path === '/estimations' && httpMethod === 'GET') {
            return await handleGetEstimations(queryStringParameters, userContext);
        } else {
            return createResponse(404, { 
                error: 'Endpoint not found',
                availableEndpoints: [
                    'GET /dashboard/metrics',
                    'GET /admin/metrics',
                    'GET /estimations'
                ]
            });
        }
    } catch (error) {
        console.error('Dashboard API Error:', error);
        return createResponse(500, {
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Handle GET /dashboard/metrics endpoint
 * Per technical design section 9.1 - Available to all authenticated users
 */
async function handleGetDashboardMetrics(queryParams, userContext) {
    const { period = '24h' } = queryParams || {};
    
    try {
        // Query user's estimations from DynamoDB
        const userEstimations = await getUserEstimations(userContext.userId);
        
        // Calculate user-specific metrics from real data
        const totalProjects = userEstimations.length;
        const monthlyTotal = userEstimations.reduce((sum, est) => 
            sum + (est.estimationSummary?.totalMonthlyCost || 0), 0
        );
        const activeEstimations = userEstimations.filter(est => 
            est.status === 'ACTIVE'
        ).length;
        
        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const recentEstimations = userEstimations.filter(est => 
            est.createdAt > thirtyDaysAgo
        );
        
        const dashboardMetrics = {
            period,
            timestamp: new Date().toISOString(),
            userMetrics: {
                totalProjects,
                monthlyTotal,
                activeEstimations,
                recentActivity: {
                    estimationsCreated: recentEstimations.length,
                    documentsGenerated: 0, // Would need documents table
                    lastLoginAt: new Date().toISOString()
                }
            },
            systemMetrics: {
                teamSize: userContext.role === 'Admin' ? await getTotalUsers() : 1,
                avgEstimationCost: totalProjects > 0 ? monthlyTotal / totalProjects : 0
            }
        };
        
        return createResponse(200, {
            success: true,
            data: dashboardMetrics
        });
    } catch (error) {
        console.error('Dashboard metrics error:', error);
        // Fallback to basic metrics if database query fails
        return createResponse(200, {
            success: true,
            data: {
                period,
                timestamp: new Date().toISOString(),
                userMetrics: {
                    totalProjects: 0,
                    monthlyTotal: 0,
                    activeEstimations: 0,
                    recentActivity: {
                        estimationsCreated: 0,
                        documentsGenerated: 0,
                        lastLoginAt: new Date().toISOString()
                    }
                },
                systemMetrics: {
                    teamSize: 1,
                    avgEstimationCost: 0
                },
                note: 'Using fallback data - database query failed'
            }
        });
    }
}

/**
 * Handle GET /admin/metrics endpoint
 * Per technical design section 9.4 - Admin only
 */
async function handleGetAdminMetrics(queryParams, userContext) {
    // Check if user has admin permissions
    if (userContext.role !== 'Admin') {
        return createResponse(403, {
            error: 'Insufficient permissions',
            code: 'AUTH_004',
            message: 'Admin access required for system metrics'
        });
    }
    
    const { period = '24h', metric } = queryParams || {};
    
    // Mock system metrics data (in production, query CloudWatch/DynamoDB)
    const metrics = {
        period,
        timestamp: new Date().toISOString(),
        metrics: {
            api_requests: 1250,
            cost_calculations: 45,
            document_generations: 15,
            active_users: 8,
            total_estimations: 25,
            avg_estimation_cost: 8500,
            system_uptime: 99.9
        }
    };
    
    // Filter metrics if specific ones requested
    if (metric) {
        const requestedMetrics = metric.split(',');
        const filteredMetrics = {};
        requestedMetrics.forEach(m => {
            if (metrics.metrics[m] !== undefined) {
                filteredMetrics[m] = metrics.metrics[m];
            }
        });
        metrics.metrics = filteredMetrics;
    }
    
    return createResponse(200, {
        success: true,
        data: metrics
    });
}

/**
 * Handle GET /estimations endpoint
 * Per technical design section 4.1
 */
async function handleGetEstimations(queryParams, userContext) {
    const { 
        page = 1, 
        limit = 20, 
        status, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
    } = queryParams || {};
    
    try {
        // Query user's estimations from DynamoDB
        const userEstimations = await getUserEstimations(userContext.userId);
        
        // Apply status filter if provided
        let filteredEstimations = userEstimations;
        if (status) {
            filteredEstimations = userEstimations.filter(est => 
                est.status?.toLowerCase() === status.toLowerCase()
            );
        }
        
        // Apply sorting
        filteredEstimations.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }
            
            if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });
        
        // Apply pagination
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedEstimations = filteredEstimations.slice(startIndex, endIndex);
        
        return createResponse(200, {
            success: true,
            data: {
                estimations: paginatedEstimations,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(filteredEstimations.length / parseInt(limit)),
                    totalItems: filteredEstimations.length,
                    itemsPerPage: parseInt(limit),
                    hasMore: endIndex < filteredEstimations.length
                }
            }
        });
    } catch (error) {
        console.error('Estimations query error:', error);
        // Fallback to mock data if database query fails
        const mockEstimations = [
        {
            estimationId: 'est_001',
            projectName: 'ABC Corporation Infrastructure',
            description: 'E-commerce platform AWS migration',
            status: 'ACTIVE',
            inputMethod: 'EXCEL_UPLOAD',
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
        },
        {
            estimationId: 'est_002',
            projectName: 'XYZ Corp Migration Project',
            description: 'Legacy system modernization',
            status: 'DRAFT',
            inputMethod: 'MANUAL_ENTRY',
            createdAt: '2024-01-14T15:00:00Z',
            updatedAt: '2024-01-14T15:30:00Z',
            clientInfo: {
                companyName: 'XYZ Corporation',
                industry: 'Technology',
                primaryContact: 'John Doe',
                email: 'john.doe@xyz.com'
            },
            estimationSummary: {
                totalMonthlyCost: 12300.00,
                totalAnnualCost: 147600.00,
                currency: 'USD',
                lastCalculatedAt: '2024-01-14T15:30:00Z',
                costBreakdown: {
                    compute: 6500.00,
                    storage: 2000.00,
                    database: 2800.00,
                    network: 700.00,
                    security: 300.00
                }
            }
        },
        {
            estimationId: 'est_003',
            projectName: 'DEF Startup Platform',
            description: 'New product launch infrastructure',
            status: 'ARCHIVED',
            inputMethod: 'MANUAL_ENTRY',
            createdAt: '2024-01-13T09:00:00Z',
            updatedAt: '2024-01-13T09:45:00Z',
            clientInfo: {
                companyName: 'DEF Startup',
                industry: 'FinTech',
                primaryContact: 'Sarah Wilson',
                email: 'sarah@defstartup.com'
            },
            estimationSummary: {
                totalMonthlyCost: 3200.00,
                totalAnnualCost: 38400.00,
                currency: 'USD',
                lastCalculatedAt: '2024-01-13T09:45:00Z',
                costBreakdown: {
                    compute: 1800.00,
                    storage: 600.00,
                    database: 500.00,
                    network: 200.00,
                    security: 100.00
                }
            }
            }
        ];
        
        return createResponse(200, {
            success: true,
            data: {
                estimations: mockEstimations,
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: mockEstimations.length,
                    itemsPerPage: parseInt(limit),
                    hasMore: false
                },
                note: 'Using fallback data - database query failed'
            }
        });
    }
}

/**
 * Extract user context from Cognito claims (provided by API Gateway)
 */
function extractUserContext(event) {
    // In API Gateway with Cognito authorizer, user claims are available in requestContext
    const claims = event.requestContext?.authorizer?.claims || {};
    
    return {
        userId: claims.sub || 'anonymous',
        email: claims.email || 'unknown@example.com',
        firstName: claims.given_name || 'User',
        lastName: claims.family_name || '',
        role: claims['custom:role'] || 'Sales'
    };
}

/**
 * Get user's estimations from DynamoDB
 */
async function getUserEstimations(userId) {
    try {
        const params = {
            TableName: ESTIMATIONS_TABLE,
            IndexName: 'UserIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        };
        
        const result = await dynamodb.query(params).promise();
        return result.Items || [];
    } catch (error) {
        console.error('Error querying user estimations:', error);
        return [];
    }
}

/**
 * Get total number of users (for admin metrics)
 */
async function getTotalUsers() {
    try {
        const params = {
            TableName: USERS_TABLE,
            Select: 'COUNT'
        };
        
        const result = await dynamodb.scan(params).promise();
        return result.Count || 1;
    } catch (error) {
        console.error('Error counting users:', error);
        return 1;
    }
}

/**
 * Create standardized API response with proper CORS headers
 */
function createResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Id,X-User-Email,X-User-Role',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Max-Age': '86400'
        },
        body: JSON.stringify({
            ...body,
            timestamp: new Date().toISOString(),
            requestId: process.env.AWS_REQUEST_ID || 'local-' + Date.now()
        })
    };
}