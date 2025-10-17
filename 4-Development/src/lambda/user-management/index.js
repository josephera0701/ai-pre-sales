const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const { httpMethod, pathParameters, body, requestContext } = event;
        const userId = requestContext.authorizer?.claims?.sub;
        
        console.log(`${httpMethod} ${event.path} - User: ${userId}`);
        
        switch (httpMethod) {
            case 'GET':
                if (event.path === '/users/me') {
                    return await getUserProfile(userId);
                } else if (event.path === '/estimations') {
                    return await getUserEstimations(userId, event.queryStringParameters);
                } else if (pathParameters?.estimationId) {
                    return await getEstimation(pathParameters.estimationId, userId);
                }
                break;
                
            case 'POST':
                if (event.path === '/estimations') {
                    return await createEstimation(JSON.parse(body), userId);
                }
                break;
                
            case 'PUT':
                if (event.path === '/users/me') {
                    return await updateUserProfile(JSON.parse(body), userId);
                } else if (pathParameters?.estimationId) {
                    return await updateEstimation(pathParameters.estimationId, JSON.parse(body), userId);
                }
                break;
                
            case 'DELETE':
                if (pathParameters?.estimationId) {
                    return await deleteEstimation(pathParameters.estimationId, userId);
                }
                break;
        }
        
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
            })
        };
        
    } catch (error) {
        console.error('User management error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: error.message }
            })
        };
    }
};

async function getUserProfile(userId) {
    const params = {
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' }
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'User profile not found' }
            })
        };
    }
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
            success: true,
            data: {
                userId: result.Item.UserId,
                email: result.Item.Email,
                firstName: result.Item.FirstName,
                lastName: result.Item.LastName,
                role: result.Item.Role,
                department: result.Item.Department,
                isActive: result.Item.IsActive,
                createdAt: result.Item.CreatedAt,
                lastLoginAt: result.Item.LastLoginAt,
                preferences: result.Item.Preferences || {
                    defaultCurrency: 'USD',
                    defaultRegion: 'us-east-1',
                    notificationSettings: {
                        emailNotifications: true,
                        documentReady: true,
                        sharedEstimations: true
                    }
                }
            }
        })
    };
}

async function updateUserProfile(updates, userId) {
    const allowedUpdates = ['firstName', 'lastName', 'department', 'preferences'];
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
            updateExpression.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key.charAt(0).toUpperCase() + key.slice(1);
            expressionAttributeValues[`:${key}`] = updates[key];
        }
    });
    
    if (updateExpression.length === 0) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'INVALID_UPDATE', message: 'No valid fields to update' }
            })
        };
    }
    
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'UpdatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    const params = {
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
            success: true,
            data: { message: 'Profile updated successfully', user: result.Attributes }
        })
    };
}

async function getUserEstimations(userId, queryParams = {}) {
    const { status, limit = 20, lastKey } = queryParams;
    
    let params = {
        TableName: process.env.MAIN_TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: { ':pk': `USER#${userId}` },
        ScanIndexForward: false,
        Limit: parseInt(limit)
    };
    
    if (status) {
        params.FilterExpression = '#status = :status';
        params.ExpressionAttributeNames = { '#status': 'Status' };
        params.ExpressionAttributeValues[':status'] = status.toUpperCase();
    }
    
    if (lastKey) {
        params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
    }
    
    const result = await dynamodb.query(params).promise();
    
    const estimations = result.Items.map(item => ({
        estimationId: item.EstimationId,
        projectName: item.ProjectName,
        description: item.Description,
        status: item.Status,
        inputMethod: item.InputMethod,
        createdAt: item.CreatedAt,
        updatedAt: item.UpdatedAt,
        clientInfo: {
            companyName: item.ClientInfo?.companyName,
            industry: item.ClientInfo?.industry,
            primaryContact: item.ClientInfo?.primaryContact
        },
        estimationSummary: item.EstimationSummary
    }));
    
    const response = {
        success: true,
        data: {
            estimations,
            count: estimations.length,
            hasMore: !!result.LastEvaluatedKey
        }
    };
    
    if (result.LastEvaluatedKey) {
        response.data.nextKey = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
    }
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(response)
    };
}

async function createEstimation(estimationData, userId) {
    const estimationId = generateId();
    const now = new Date().toISOString();
    
    // Validate required fields
    if (!estimationData.projectName || !estimationData.clientInfo?.companyName) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Project name and company name are required' }
            })
        };
    }
    
    const estimation = {
        PK: `ESTIMATION#${estimationId}`,
        SK: 'METADATA',
        GSI1PK: `USER#${userId}`,
        GSI1SK: `ESTIMATION#${now}`,
        GSI2PK: `STATUS#${estimationData.status || 'DRAFT'}`,
        GSI2SK: `ESTIMATION#${estimationId}`,
        EntityType: 'Estimation',
        EstimationId: estimationId,
        UserId: userId,
        ProjectName: estimationData.projectName,
        Description: estimationData.description || '',
        Status: estimationData.status || 'DRAFT',
        InputMethod: estimationData.inputMethod || 'MANUAL_ENTRY',
        CreatedAt: now,
        UpdatedAt: now,
        ClientInfo: estimationData.clientInfo,
        SharedWith: [],
        Tags: estimationData.tags || []
    };
    
    await dynamodb.put({ TableName: process.env.MAIN_TABLE, Item: estimation }).promise();
    
    return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
            success: true,
            data: {
                estimationId,
                projectName: estimation.ProjectName,
                status: estimation.Status,
                createdAt: estimation.CreatedAt
            }
        })
    };
}

async function getEstimation(estimationId, userId) {
    const params = {
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `ESTIMATION#${estimationId}`, SK: 'METADATA' }
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'ESTIMATION_NOT_FOUND', message: 'Estimation not found' }
            })
        };
    }
    
    // Check access permissions
    if (result.Item.UserId !== userId && !result.Item.SharedWith?.includes(userId)) {
        return {
            statusCode: 403,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'ACCESS_DENIED', message: 'Access denied to this estimation' }
            })
        };
    }
    
    // Get requirements data
    const reqParams = {
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `ESTIMATION#${estimationId}`, SK: 'REQUIREMENTS' }
    };
    
    const reqResult = await dynamodb.get(reqParams).promise();
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
            success: true,
            data: {
                ...result.Item,
                requirements: reqResult.Item || {}
            }
        })
    };
}

async function updateEstimation(estimationId, updates, userId) {
    // First check if estimation exists and user has access
    const getParams = {
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `ESTIMATION#${estimationId}`, SK: 'METADATA' }
    };
    
    const existing = await dynamodb.get(getParams).promise();
    
    if (!existing.Item) {
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'ESTIMATION_NOT_FOUND', message: 'Estimation not found' }
            })
        };
    }
    
    if (existing.Item.UserId !== userId) {
        return {
            statusCode: 403,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'ACCESS_DENIED', message: 'Access denied to this estimation' }
            })
        };
    }
    
    const allowedUpdates = ['projectName', 'description', 'status', 'clientInfo', 'tags'];
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
            updateExpression.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key.charAt(0).toUpperCase() + key.slice(1);
            expressionAttributeValues[`:${key}`] = updates[key];
        }
    });
    
    if (updateExpression.length === 0) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'INVALID_UPDATE', message: 'No valid fields to update' }
            })
        };
    }
    
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'UpdatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    const params = {
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `ESTIMATION#${estimationId}`, SK: 'METADATA' },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
            success: true,
            data: { message: 'Estimation updated successfully', estimation: result.Attributes }
        })
    };
}

async function deleteEstimation(estimationId, userId) {
    // First check if estimation exists and user has access
    const getParams = {
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `ESTIMATION#${estimationId}`, SK: 'METADATA' }
    };
    
    const existing = await dynamodb.get(getParams).promise();
    
    if (!existing.Item) {
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'ESTIMATION_NOT_FOUND', message: 'Estimation not found' }
            })
        };
    }
    
    if (existing.Item.UserId !== userId) {
        return {
            statusCode: 403,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'ACCESS_DENIED', message: 'Access denied to this estimation' }
            })
        };
    }
    
    // Soft delete by updating status
    const params = {
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `ESTIMATION#${estimationId}`, SK: 'METADATA' },
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#status': 'Status',
            '#updatedAt': 'UpdatedAt'
        },
        ExpressionAttributeValues: {
            ':status': 'DELETED',
            ':updatedAt': new Date().toISOString()
        }
    };
    
    await dynamodb.update(params).promise();
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
            success: true,
            data: { message: 'Estimation deleted successfully' }
        })
    };
}

function generateId() {
    return 'est_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}