const AWS = require('aws-sdk');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Environment variables
const ESTIMATIONS_TABLE = process.env.ESTIMATIONS_TABLE;
const PRICING_TABLE = process.env.PRICING_TABLE;

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
        const userContext = extractUserContext(headers);
        if (!userContext) {
            return createResponse(401, { error: 'Authentication required' });
        }
        
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
        
        // Save estimation to database
        await dynamodb.put({
            TableName: ESTIMATIONS_TABLE,
            Item: estimation
        }).promise();
        
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
        
        const result = await dynamodb.scan(params).promise();
        
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
        
        const result = await dynamodb.query(params).promise();
        
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
        
        const result = await dynamodb.get(params).promise();
        
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
        
        // Get pricing for this instance type
        const pricing = await getPricingForService(service, instanceType, region);
        const hourlyCost = pricing ? pricing.pricePerHour : getDefaultPricing(service, instanceType);
        
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
        
        const pricing = await getPricingForService(service, storageType, region);
        const pricePerGB = pricing ? pricing.pricePerGB : getDefaultStoragePricing(service, storageType);
        
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
        
        const instancePricing = await getPricingForService(service, instanceType, region);
        const instanceCost = instancePricing ? instancePricing.pricePerHour * 730 : getDefaultDatabasePricing(service, instanceType);
        
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
        
        const result = await dynamodb.get(params).promise();
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
            't3.micro': 0.0104,
            't3.small': 0.0208,
            't3.medium': 0.0416,
            't3.large': 0.0832,
            'm5.large': 0.096,
            'm5.xlarge': 0.192
        },
        'Lambda': {
            'default': 0.0000166667 // per GB-second
        }
    };
    
    return defaultPricing[service]?.[instanceType] || 0.05;
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
 * Create standardized API response
 */
function createResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify(body)
    };
}