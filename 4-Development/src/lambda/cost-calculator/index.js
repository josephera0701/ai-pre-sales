const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// AWS service pricing calculators
const EC2Calculator = require('./calculators/ec2Calculator');
const RDSCalculator = require('./calculators/rdsCalculator');
const S3Calculator = require('./calculators/s3Calculator');
const NetworkCalculator = require('./calculators/networkCalculator');

exports.handler = async (event) => {
    try {
        const { estimationId, requirements, region = 'us-east-1', pricingModel = 'ON_DEMAND' } = JSON.parse(event.body);
        
        console.log(`Calculating costs for estimation: ${estimationId}`);
        
        // Get current pricing data
        const pricingData = await getPricingData(region);
        
        // Calculate costs by category
        const computeCosts = await calculateComputeCosts(requirements.computeRequirements, pricingData, region);
        const storageCosts = await calculateStorageCosts(requirements.storageRequirements, pricingData, region);
        const databaseCosts = await calculateDatabaseCosts(requirements.databaseRequirements, pricingData, region);
        const networkCosts = await calculateNetworkCosts(requirements.networkRequirements, pricingData, region);
        const securityCosts = await calculateSecurityCosts(requirements.securityRequirements, pricingData, region);
        
        // Apply business rules
        const totalCosts = applyBusinessRules({
            compute: computeCosts,
            storage: storageCosts,
            database: databaseCosts,
            network: networkCosts,
            security: securityCosts
        });
        
        // Save calculation results
        const calculationResult = {
            calculationId: generateId(),
            estimationId,
            calculatedAt: new Date().toISOString(),
            region,
            pricingModel,
            ...totalCosts
        };
        
        await saveCalculation(calculationResult);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: calculationResult
            })
        };
        
    } catch (error) {
        console.error('Cost calculation error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: {
                    code: 'CALCULATION_ERROR',
                    message: 'Failed to calculate costs',
                    details: error.message
                }
            })
        };
    }
};

async function getPricingData(region) {
    const params = {
        TableName: process.env.PRICING_TABLE,
        IndexName: 'RegionIndex',
        KeyConditionExpression: 'GSI1PK = :region',
        ExpressionAttributeValues: {
            ':region': `REGION#${region}`
        }
    };
    
    const result = await dynamodb.query(params).promise();
    return result.Items.reduce((acc, item) => {
        acc[item.serviceType] = item;
        return acc;
    }, {});
}

async function calculateComputeCosts(computeRequirements, pricingData, region) {
    let totalCost = 0;
    const details = [];
    
    for (const server of computeRequirements || []) {
        const instanceType = suggestInstanceType(server.cpuCores, server.ramGB);
        const pricing = pricingData[`EC2#${instanceType}`];
        
        if (pricing) {
            const hourlyCost = pricing.pricePerHour;
            const monthlyHours = server.monthlyHours || 744;
            const instances = calculateAverageInstances(server);
            
            const monthlyCost = hourlyCost * monthlyHours * instances;
            totalCost += monthlyCost;
            
            details.push({
                serverName: server.serverName,
                instanceType,
                instances,
                hourlyCost,
                monthlyCost,
                annualCost: monthlyCost * 12
            });
        }
    }
    
    return { total: totalCost, details };
}

async function calculateStorageCosts(storageRequirements, pricingData, region) {
    let totalCost = 0;
    const details = [];
    
    for (const storage of storageRequirements || []) {
        const serviceType = determineStorageService(storage);
        const pricing = pricingData[serviceType];
        
        if (pricing) {
            const monthlyCost = calculateStoragePrice(storage, pricing);
            totalCost += monthlyCost;
            
            details.push({
                storageType: storage.storageType,
                serviceType,
                sizeGB: storage.currentGB,
                monthlyCost,
                annualCost: monthlyCost * 12
            });
        }
    }
    
    return { total: totalCost, details };
}

async function calculateDatabaseCosts(databaseRequirements, pricingData, region) {
    let totalCost = 0;
    const details = [];
    
    for (const db of databaseRequirements || []) {
        const pricing = pricingData[`RDS#${db.instanceClass}`];
        
        if (pricing) {
            let monthlyCost = pricing.pricePerHour * 744; // Base instance cost
            
            // Add Multi-AZ cost
            if (db.multiAZ) {
                monthlyCost *= 2;
            }
            
            // Add read replica costs
            if (db.readReplicas > 0) {
                monthlyCost += (pricing.pricePerHour * 744 * db.readReplicas);
            }
            
            // Add storage costs
            const storageCost = db.sizeGB * 0.115; // RDS storage pricing
            monthlyCost += storageCost;
            
            totalCost += monthlyCost;
            
            details.push({
                databaseName: db.databaseName,
                engine: db.engine,
                instanceClass: db.instanceClass,
                multiAZ: db.multiAZ,
                readReplicas: db.readReplicas,
                monthlyCost,
                annualCost: monthlyCost * 12
            });
        }
    }
    
    return { total: totalCost, details };
}

async function calculateNetworkCosts(networkRequirements, pricingData, region) {
    let totalCost = 0;
    const details = [];
    
    // Data transfer costs
    const dataTransferGB = networkRequirements.dataTransferOutGBMonth || 0;
    const dataTransferCost = Math.max(0, (dataTransferGB - 100) * 0.09); // First 100GB free
    
    // CloudFront costs
    const cloudFrontCost = networkRequirements.globalDistributionRequired ? 
        dataTransferGB * 0.085 : 0;
    
    // Load balancer costs
    const loadBalancerCost = (networkRequirements.loadBalancerCount || 0) * 22.5;
    
    totalCost = dataTransferCost + cloudFrontCost + loadBalancerCost;
    
    details.push({
        dataTransfer: dataTransferCost,
        cloudFront: cloudFrontCost,
        loadBalancer: loadBalancerCost
    });
    
    return { total: totalCost, details };
}

async function calculateSecurityCosts(securityRequirements, pricingData, region) {
    let totalCost = 0;
    const details = {};
    
    if (securityRequirements.guardDuty) {
        details.guardDuty = 150;
        totalCost += 150;
    }
    
    if (securityRequirements.cloudTrail) {
        details.cloudTrail = 50;
        totalCost += 50;
    }
    
    if (securityRequirements.kms) {
        details.kms = 100;
        totalCost += 100;
    }
    
    if (securityRequirements.awsConfig) {
        details.awsConfig = 60;
        totalCost += 60;
    }
    
    return { total: totalCost, details };
}

function applyBusinessRules(costs) {
    const subtotal = costs.compute.total + costs.storage.total + 
                    costs.database.total + costs.network.total + costs.security.total;
    
    // Apply 10% buffer for pricing fluctuations
    const buffer = subtotal * 0.10;
    
    // Add support plan (Business Support - 10% of monthly usage)
    const supportPlan = subtotal * 0.10;
    
    const totalMonthlyCost = subtotal + buffer + supportPlan;
    const totalAnnualCost = totalMonthlyCost * 12;
    
    return {
        costBreakdown: costs,
        subtotal,
        buffer,
        supportPlan,
        totalMonthlyCost,
        totalAnnualCost,
        businessRulesApplied: {
            bufferPercentage: 10,
            supportPlanIncluded: true,
            volumeDiscounts: false // TODO: Implement volume discount logic
        }
    };
}

function suggestInstanceType(cpuCores, ramGB) {
    // Simple instance type suggestion logic
    if (cpuCores <= 2 && ramGB <= 8) return 't3.large';
    if (cpuCores <= 4 && ramGB <= 16) return 't3.xlarge';
    if (cpuCores <= 8 && ramGB <= 32) return 'm5.2xlarge';
    if (cpuCores <= 16 && ramGB <= 64) return 'm5.4xlarge';
    return 'm5.8xlarge';
}

function calculateAverageInstances(server) {
    if (server.scalingType === 'Auto') {
        // Calculate average between min and expected peak
        const peakInstances = Math.ceil(server.maxInstances * (server.peakUtilizationPercent / 100));
        return (server.minInstances + peakInstances) / 2;
    }
    return server.minInstances || 1;
}

function determineStorageService(storage) {
    switch (storage.accessPattern) {
        case 'Frequent': return storage.iopsRequired > 1000 ? 'EBS#io2' : 'EBS#gp3';
        case 'Infrequent': return 'S3#IA';
        case 'Archive': return 'S3#Glacier';
        default: return 'EBS#gp3';
    }
}

function calculateStoragePrice(storage, pricing) {
    let cost = storage.currentGB * pricing.pricePerGB;
    
    // Add IOPS costs for EBS
    if (pricing.serviceType.startsWith('EBS') && storage.iopsRequired > 3000) {
        const additionalIOPS = storage.iopsRequired - 3000;
        cost += additionalIOPS * 0.065; // Additional IOPS pricing
    }
    
    return cost;
}

async function saveCalculation(calculation) {
    const params = {
        TableName: process.env.MAIN_TABLE,
        Item: {
            PK: `ESTIMATION#${calculation.estimationId}`,
            SK: `CALCULATION#${calculation.calculatedAt}`,
            GSI1PK: `CALCULATION#${calculation.estimationId}`,
            GSI1SK: calculation.calculatedAt,
            EntityType: 'CostCalculation',
            ...calculation
        }
    };
    
    await dynamodb.put(params).promise();
}

function generateId() {
    return 'calc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}