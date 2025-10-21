// Use AWS SDK v3 (built into Node.js 18 runtime)
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize AWS services
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

// Environment variables
const ENHANCED_TABLE = process.env.ENHANCED_TABLE || 'aws-cost-platform-enhanced-dev';
const PRICING_TABLE = process.env.PRICING_TABLE || 'aws-cost-platform-pricing-dev';
const ESTIMATIONS_TABLE = process.env.ESTIMATIONS_TABLE || 'aws-cost-platform-estimations-dev';

/**
 * Cost Calculator Service Lambda Handler
 * Calculates AWS costs based on infrastructure requirements
 */
exports.handler = async (event) => {
    const { httpMethod, path, body, headers, pathParameters, queryStringParameters } = event;
    
    try {
        // Parse request body
        const requestBody = body ? JSON.parse(body) : {};
        
        // Extract user context from headers (set by auth service)
        const userContext = extractUserContext(headers) || {
            userId: 'anonymous-user',
            email: 'anonymous@example.com',
            role: 'User',
            firstName: 'Anonymous',
            lastName: 'User'
        };
        
        // Route to appropriate handler
        const route = `${httpMethod} ${path}`;
        
        switch (route) {
            case 'POST /calculations/cost':
                return await handleCalculateCost(userContext, requestBody);
            case 'POST /calculations/compare':
                return await handleCompareConfigurations(userContext, requestBody);
            case 'GET /calculations/pricing-data':
                return await handleGetPricingData(userContext, queryStringParameters);
            case 'GET /calculations/history':
                return await handleGetCalculationHistory(userContext, queryStringParameters);
            case 'GET /calculations/{id}':
                return await handleGetCalculation(userContext, pathParameters.id);
            
            // Enhanced API endpoints for 200+ field support
            case 'GET /validation-rules':
                return await handleGetValidationRules();
            case 'GET /dropdown-lists':
                return await handleGetDropdownLists();
            case 'GET /service-mappings':
                return await handleGetServiceMappings();
            case 'GET /optimization-tips':
                return await handleGetOptimizationTips();
            case 'GET /estimations':
                return await handleGetEstimations(userContext, queryStringParameters);
            case 'POST /estimations':
                return await handleCreateEstimation(userContext, requestBody);
            case 'GET /estimations/{id}':
                return await handleGetEstimation(userContext, pathParameters.id);
            
            default:
                return createResponse(404, { error: 'Route not found' });
        }
    } catch (error) {
        console.error('Cost calculator service error:', error);
        return createResponse(500, { 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

/**
 * Calculate AWS costs based on infrastructure requirements
 */
async function handleCalculateCost(userContext, body) {
    const { requirements, region = 'us-east-1', duration = 12 } = body;
    
    if (!requirements) {
        return createResponse(400, { 
            error: 'Infrastructure requirements are required',
            code: 'CALC_001'
        });
    }
    
    try {
        // Calculate costs for each service category
        const computeCosts = await calculateComputeCosts(requirements.compute || [], region);
        const storageCosts = await calculateStorageCosts(requirements.storage || [], region);
        const databaseCosts = await calculateDatabaseCosts(requirements.database || [], region);
        const networkCosts = await calculateNetworkCosts(requirements.network || {}, region);
        
        // Calculate total costs
        const monthlyCosts = {
            compute: computeCosts.monthly,
            storage: storageCosts.monthly,
            database: databaseCosts.monthly,
            network: networkCosts.monthly
        };
        
        const totalMonthlyCost = Object.values(monthlyCosts).reduce((sum, cost) => sum + cost, 0);
        const totalAnnualCost = totalMonthlyCost * 12;
        
        // Generate cost breakdown and recommendations
        const costBreakdown = {
            monthly: monthlyCosts,
            annual: {
                compute: computeCosts.monthly * 12,
                storage: storageCosts.monthly * 12,
                database: databaseCosts.monthly * 12,
                network: networkCosts.monthly * 12
            },
            details: {
                compute: computeCosts.details,
                storage: storageCosts.details,
                database: databaseCosts.details,
                network: networkCosts.details
            }
        };
        
        const recommendations = generateRecommendations(costBreakdown, requirements);
        
        // Create estimation record
        const estimation = {
            estimationId: `est-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: userContext.userId,
            requirements,
            region,
            duration,
            totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
            totalAnnualCost: Math.round(totalAnnualCost * 100) / 100,
            costBreakdown,
            recommendations,
            createdAt: new Date().toISOString(),
            status: 'completed'
        };
        
        // Skip database save for now (DynamoDB access not configured)
        console.log('Cost calculation completed:', estimation.estimationId);
        
        return createResponse(200, {
            success: true,
            data: estimation,
            message: 'Cost calculation completed successfully'
        });
        
    } catch (error) {
        console.error('Calculate cost error:', error);
        throw error;
    }
}

/**
 * Compare multiple configurations
 */
async function handleCompareConfigurations(userContext, body) {
    const { configurations, region = 'us-east-1' } = body;
    
    if (!configurations || !Array.isArray(configurations) || configurations.length < 2) {
        return createResponse(400, { 
            error: 'At least 2 configurations required for comparison',
            code: 'CALC_002'
        });
    }
    
    try {
        const comparisons = [];
        
        for (let i = 0; i < configurations.length; i++) {
            const config = configurations[i];
            const result = await handleCalculateCost(userContext, {
                requirements: config.requirements,
                region,
                duration: config.duration || 12
            });
            
            const calculationData = JSON.parse(result.body).data;
            comparisons.push({
                name: config.name || `Configuration ${i + 1}`,
                totalMonthlyCost: calculationData.totalMonthlyCost,
                totalAnnualCost: calculationData.totalAnnualCost,
                costBreakdown: calculationData.costBreakdown,
                recommendations: calculationData.recommendations
            });
        }
        
        // Generate comparison insights
        const insights = generateComparisonInsights(comparisons);
        
        return createResponse(200, {
            success: true,
            data: {
                comparisons,
                insights,
                recommendedConfiguration: insights.mostCostEffective
            },
            message: 'Configuration comparison completed'
        });
        
    } catch (error) {
        console.error('Compare configurations error:', error);
        throw error;
    }
}

/**
 * Get AWS pricing data for specific services
 */
async function handleGetPricingData(userContext, queryParams) {
    const { service, region = 'us-east-1', instanceType } = queryParams || {};
    
    try {
        let params = {
            TableName: PRICING_TABLE,
            FilterExpression: '#region = :region',
            ExpressionAttributeNames: { '#region': 'region' },
            ExpressionAttributeValues: { ':region': region }
        };
        
        if (service) {
            params.FilterExpression += ' AND service = :service';
            params.ExpressionAttributeValues[':service'] = service;
        }
        
        if (instanceType) {
            params.FilterExpression += ' AND instanceType = :instanceType';
            params.ExpressionAttributeValues[':instanceType'] = instanceType;
        }
        
        const result = await dynamodb.send(new ScanCommand(params));
        
        return createResponse(200, {
            success: true,
            data: {
                pricingData: result.Items,
                region,
                lastUpdated: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Get pricing data error:', error);
        throw error;
    }
}

/**
 * Get calculation history for user
 */
async function handleGetCalculationHistory(userContext, queryParams) {
    const { limit = 20, lastKey } = queryParams || {};
    
    try {
        let params = {
            TableName: ESTIMATIONS_TABLE,
            IndexName: 'UserTimeIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: { ':userId': userContext.userId },
            ScanIndexForward: false,
            Limit: parseInt(limit)
        };
        
        if (lastKey) {
            params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastKey));
        }
        
        const result = await dynamodb.send(new QueryCommand(params));
        
        const response = {
            success: true,
            data: {
                estimations: result.Items,
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
        console.error('Get calculation history error:', error);
        throw error;
    }
}

/**
 * Get specific calculation by ID
 */
async function handleGetCalculation(userContext, estimationId) {
    try {
        const params = {
            TableName: ESTIMATIONS_TABLE,
            Key: { estimationId }
        };
        
        const result = await dynamodb.send(new GetCommand(params));
        
        if (!result.Item) {
            return createResponse(404, { 
                error: 'Calculation not found',
                code: 'CALC_003'
            });
        }
        
        // Check if user owns this calculation
        if (result.Item.userId !== userContext.userId && userContext.role !== 'Admin') {
            return createResponse(403, { 
                error: 'Access denied',
                code: 'CALC_004'
            });
        }
        
        return createResponse(200, {
            success: true,
            data: result.Item
        });
        
    } catch (error) {
        console.error('Get calculation error:', error);
        throw error;
    }
}

/**
 * Calculate compute costs (EC2, Lambda, etc.)
 */
async function calculateComputeCosts(computeRequirements, region) {
    let totalMonthlyCost = 0;
    const details = [];
    
    for (const requirement of computeRequirements) {
        const { service, instanceType, quantity = 1, hoursPerMonth = 730 } = requirement;
        
        // Use default pricing (DynamoDB access not configured)
        const hourlyCost = getDefaultPricing(service, instanceType);
        
        const monthlyCost = hourlyCost * hoursPerMonth * quantity;
        totalMonthlyCost += monthlyCost;
        
        details.push({
            service,
            instanceType,
            quantity,
            hoursPerMonth,
            hourlyCost,
            monthlyCost: Math.round(monthlyCost * 100) / 100
        });
    }
    
    return {
        monthly: Math.round(totalMonthlyCost * 100) / 100,
        details
    };
}

/**
 * Calculate storage costs (S3, EBS, etc.)
 */
async function calculateStorageCosts(storageRequirements, region) {
    let totalMonthlyCost = 0;
    const details = [];
    
    for (const requirement of storageRequirements) {
        const { service, storageType, sizeGB, accessPattern = 'standard' } = requirement;
        
        // Use default pricing (DynamoDB access not configured)
        const pricePerGB = getDefaultStoragePricing(service, storageType);
        
        const monthlyCost = pricePerGB * sizeGB;
        totalMonthlyCost += monthlyCost;
        
        details.push({
            service,
            storageType,
            sizeGB,
            accessPattern,
            pricePerGB,
            monthlyCost: Math.round(monthlyCost * 100) / 100
        });
    }
    
    return {
        monthly: Math.round(totalMonthlyCost * 100) / 100,
        details
    };
}

/**
 * Calculate database costs (RDS, DynamoDB, etc.)
 */
async function calculateDatabaseCosts(databaseRequirements, region) {
    let totalMonthlyCost = 0;
    const details = [];
    
    for (const requirement of databaseRequirements) {
        const { service, instanceType, storageGB = 0, backupGB = 0 } = requirement;
        
        // Use default pricing (DynamoDB access not configured)
        const instanceCost = getDefaultDatabasePricing(service, instanceType) * 730;
        
        const storageCost = storageGB * 0.115; // Default RDS storage pricing
        const backupCost = backupGB * 0.095; // Default backup pricing
        
        const monthlyCost = instanceCost + storageCost + backupCost;
        totalMonthlyCost += monthlyCost;
        
        details.push({
            service,
            instanceType,
            instanceCost: Math.round(instanceCost * 100) / 100,
            storageCost: Math.round(storageCost * 100) / 100,
            backupCost: Math.round(backupCost * 100) / 100,
            monthlyCost: Math.round(monthlyCost * 100) / 100
        });
    }
    
    return {
        monthly: Math.round(totalMonthlyCost * 100) / 100,
        details
    };
}

/**
 * Calculate network costs (Data Transfer, CloudFront, etc.)
 */
async function calculateNetworkCosts(networkRequirements, region) {
    const { dataTransferGB = 0, cloudFrontGB = 0, requests = 0 } = networkRequirements;
    
    const dataTransferCost = dataTransferGB * 0.09; // Default data transfer pricing
    const cloudFrontCost = cloudFrontGB * 0.085; // Default CloudFront pricing
    const requestsCost = requests * 0.0000004; // Default request pricing
    
    const totalMonthlyCost = dataTransferCost + cloudFrontCost + requestsCost;
    
    return {
        monthly: Math.round(totalMonthlyCost * 100) / 100,
        details: {
            dataTransferCost: Math.round(dataTransferCost * 100) / 100,
            cloudFrontCost: Math.round(cloudFrontCost * 100) / 100,
            requestsCost: Math.round(requestsCost * 100) / 100
        }
    };
}

/**
 * Get pricing for specific service from database
 */
async function getPricingForService(service, instanceType, region) {
    try {
        const params = {
            TableName: PRICING_TABLE,
            Key: {
                service,
                instanceType,
                region
            }
        };
        
        const result = await dynamodb.send(new GetCommand(params));
        return result.Item;
    } catch (error) {
        console.error('Get pricing error:', error);
        return null;
    }
}

/**
 * Default pricing fallback
 */
function getDefaultPricing(service, instanceType) {
    const defaultPricing = {
        'EC2': {
            't3.micro': 8.5,
            't3.small': 17,
            't3.medium': 34,
            't3.large': 67,
            'm5.large': 70,
            'm5.xlarge': 140
        },
        'Lambda': {
            'default': 0.0000166667
        }
    };
    
    return (defaultPricing[service]?.[instanceType] || 50) / 730; // Convert monthly to hourly
}

function getDefaultStoragePricing(service, storageType) {
    const defaultStoragePricing = {
        'S3': {
            'standard': 0.023,
            'ia': 0.0125,
            'glacier': 0.004
        },
        'EBS': {
            'gp3': 0.08,
            'io2': 0.125
        }
    };
    
    return defaultStoragePricing[service]?.[storageType] || 0.023;
}

function getDefaultDatabasePricing(service, instanceType) {
    const defaultDatabasePricing = {
        'RDS': {
            'db.t3.micro': 0.017,
            'db.t3.small': 0.034,
            'db.m5.large': 0.192
        },
        'DynamoDB': {
            'on-demand': 1.25 // per million requests
        }
    };
    
    return defaultDatabasePricing[service]?.[instanceType] || 0.05;
}

/**
 * Generate cost optimization recommendations
 */
function generateRecommendations(costBreakdown, requirements) {
    const recommendations = [];
    
    // Compute recommendations
    if (costBreakdown.monthly.compute > 500) {
        recommendations.push({
            category: 'compute',
            type: 'cost-optimization',
            title: 'Consider Reserved Instances',
            description: 'Save up to 75% on compute costs with 1-year or 3-year Reserved Instances',
            potentialSavings: Math.round(costBreakdown.monthly.compute * 0.4 * 100) / 100,
            priority: 'high'
        });
    }
    
    // Storage recommendations
    if (costBreakdown.monthly.storage > 200) {
        recommendations.push({
            category: 'storage',
            type: 'cost-optimization',
            title: 'Implement Storage Lifecycle Policies',
            description: 'Move infrequently accessed data to cheaper storage classes',
            potentialSavings: Math.round(costBreakdown.monthly.storage * 0.3 * 100) / 100,
            priority: 'medium'
        });
    }
    
    // Database recommendations
    if (costBreakdown.monthly.database > 300) {
        recommendations.push({
            category: 'database',
            type: 'performance',
            title: 'Optimize Database Instance Size',
            description: 'Right-size database instances based on actual usage patterns',
            potentialSavings: Math.round(costBreakdown.monthly.database * 0.25 * 100) / 100,
            priority: 'high'
        });
    }
    
    return recommendations;
}

/**
 * Generate comparison insights
 */
function generateComparisonInsights(comparisons) {
    const sortedByMonthlyCost = [...comparisons].sort((a, b) => a.totalMonthlyCost - b.totalMonthlyCost);
    const mostCostEffective = sortedByMonthlyCost[0];
    const mostExpensive = sortedByMonthlyCost[sortedByMonthlyCost.length - 1];
    
    const costDifference = mostExpensive.totalMonthlyCost - mostCostEffective.totalMonthlyCost;
    const percentageSavings = Math.round((costDifference / mostExpensive.totalMonthlyCost) * 100);
    
    return {
        mostCostEffective: mostCostEffective.name,
        mostExpensive: mostExpensive.name,
        monthlySavings: Math.round(costDifference * 100) / 100,
        annualSavings: Math.round(costDifference * 12 * 100) / 100,
        percentageSavings,
        summary: `${mostCostEffective.name} is ${percentageSavings}% more cost-effective than ${mostExpensive.name}`
    };
}

/**
 * Extract user context from headers
 */
function extractUserContext(headers) {
    const authHeader = headers.Authorization || headers.authorization;
    if (!authHeader) return null;
    
    return {
        userId: headers['x-user-id'],
        email: headers['x-user-email'],
        role: headers['x-user-role'],
        firstName: headers['x-user-firstname'],
        lastName: headers['x-user-lastname']
    };
}

/**
 * Get validation rules from enhanced database
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
        return createResponse(500, { error: 'Failed to get validation rules' });
    }
}

/**
 * Get dropdown lists from enhanced database
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
        return createResponse(500, { error: 'Failed to get dropdown lists' });
    }
}

/**
 * Get service mappings from enhanced database
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
        
        const result = await dynamodb.send(new QueryCommand(params));
        
        return createResponse(200, {
            success: true,
            data: result.Items
        });
        
    } catch (error) {
        console.error('Get service mappings error:', error);
        return createResponse(500, { error: 'Failed to get service mappings' });
    }
}

/**
 * Get optimization tips from enhanced database
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
        
        const result = await dynamodb.send(new QueryCommand(params));
        
        return createResponse(200, {
            success: true,
            data: result.Items
        });
        
    } catch (error) {
        console.error('Get optimization tips error:', error);
        return createResponse(500, { error: 'Failed to get optimization tips' });
    }
}

/**
 * Get estimations from enhanced database
 */
async function handleGetEstimations(userContext, queryParams) {
    const { page = 1, limit = 20, status } = queryParams || {};
    
    try {
        const params = {
            TableName: ENHANCED_TABLE,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :userPK AND begins_with(GSI1SK, :estimationPrefix)',
            ExpressionAttributeValues: {
                ':userPK': `USER#${userContext.userId}`,
                ':estimationPrefix': 'ESTIMATION#'
            },
            ScanIndexForward: false,
            Limit: parseInt(limit)
        };
        
        if (status) {
            params.FilterExpression = '#status = :status';
            params.ExpressionAttributeNames = { '#status': 'Status' };
            params.ExpressionAttributeValues[':status'] = status;
        }
        
        const result = await dynamodb.send(new QueryCommand(params));
        
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
        return createResponse(500, { error: 'Failed to get estimations' });
    }
}

/**
 * Create estimation in enhanced database
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
            EnhancedClientInfo: enhancedClientInfo,
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
            }
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
                enhancedSupport: true
            },
            message: 'Estimation created successfully'
        });
        
    } catch (error) {
        console.error('Create estimation error:', error);
        return createResponse(500, { error: 'Failed to create estimation' });
    }
}

/**
 * Get estimation from enhanced database
 */
async function handleGetEstimation(userContext, estimationId) {
    try {
        const params = {
            TableName: ENHANCED_TABLE,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': `ESTIMATION#${estimationId}`
            }
        };
        
        const result = await dynamodb.send(new QueryCommand(params));
        
        if (!result.Items || result.Items.length === 0) {
            return createResponse(404, { error: 'Estimation not found' });
        }
        
        // Organize data by entity type
        const estimation = {};
        const servers = [];
        const storage = [];
        const databases = [];
        
        result.Items.forEach(item => {
            switch (item.EntityType) {
                case 'Estimation':
                    estimation.metadata = item;
                    break;
                case 'ComputeServer':
                    servers.push(item);
                    break;
                case 'StorageItem':
                    storage.push(item);
                    break;
                case 'DatabaseItem':
                    databases.push(item);
                    break;
                case 'CostCalculation':
                    if (!estimation.calculations) estimation.calculations = [];
                    estimation.calculations.push(item);
                    break;
            }
        });
        
        return createResponse(200, {
            success: true,
            data: {
                ...estimation.metadata,
                servers,
                storage,
                databases,
                calculations: estimation.calculations || []
            }
        });
        
    } catch (error) {
        console.error('Get estimation error:', error);
        return createResponse(500, { error: 'Failed to get estimation' });
    }
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
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-user-id,x-user-email,x-user-role',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
            ...body,
            timestamp: new Date().toISOString(),
            requestId: process.env.AWS_REQUEST_ID
        })
    };
}