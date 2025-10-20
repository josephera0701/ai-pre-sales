/**
 * Dashboard Service Lambda Handler
 * Handles dashboard statistics and metrics
 */
exports.handler = async (event) => {
    const { httpMethod, path } = event;
    
    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
        return createCorsResponse(200, { message: 'CORS preflight successful' });
    }
    
    try {
        const route = `${httpMethod} ${path}`;
        
        switch (route) {
            case 'GET /dashboard/stats':
                return await handleGetDashboardStats();
            default:
                return createCorsResponse(404, { error: 'Route not found' });
        }
    } catch (error) {
        console.error('Dashboard service error:', error);
        return createCorsResponse(500, { 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

/**
 * Get dashboard statistics
 */
async function handleGetDashboardStats() {
    // Mock data for now - in production this would query DynamoDB
    const stats = {
        totalEstimations: 25,
        documentsGenerated: 15,
        averageCost: 1250,
        recentActivity: [
            { type: 'estimation_created', count: 3, date: '2025-01-20' },
            { type: 'document_generated', count: 2, date: '2025-01-20' },
            { type: 'user_login', count: 8, date: '2025-01-20' }
        ]
    };
    
    return createCorsResponse(200, {
        success: true,
        data: stats
    });
}

/**
 * Create CORS-enabled response
 */
function createCorsResponse(statusCode, body) {
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
            timestamp: new Date().toISOString()
        })
    };
}