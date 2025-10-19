// Mock AWS SDK first
const mockDynamoDB = {
    get: jest.fn(),
    put: jest.fn(),
    query: jest.fn(),
    scan: jest.fn()
};

jest.mock('aws-sdk', () => ({
    DynamoDB: {
        DocumentClient: jest.fn(() => mockDynamoDB)
    }
}));

const { handler } = require('../src/index');

// Mock environment variables
process.env.ESTIMATIONS_TABLE = 'test-estimations-table';
process.env.PRICING_TABLE = 'test-pricing-table';

describe('Cost Calculator Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDynamoDB.get.mockReturnValue({ promise: jest.fn() });
        mockDynamoDB.put.mockReturnValue({ promise: jest.fn() });
        mockDynamoDB.query.mockReturnValue({ promise: jest.fn() });
        mockDynamoDB.scan.mockReturnValue({ promise: jest.fn() });
    });

    const mockUserContext = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'Sales',
        firstName: 'John',
        lastName: 'Doe'
    };

    const mockHeaders = {
        'Authorization': 'Bearer token',
        'x-user-id': 'user123',
        'x-user-email': 'test@example.com',
        'x-user-role': 'Sales',
        'x-user-firstname': 'John',
        'x-user-lastname': 'Doe'
    };

    const mockRequirements = {
        compute: [
            {
                service: 'EC2',
                instanceType: 't3.medium',
                quantity: 2,
                hoursPerMonth: 730
            }
        ],
        storage: [
            {
                service: 'S3',
                storageType: 'standard',
                sizeGB: 1000,
                accessPattern: 'standard'
            }
        ],
        database: [
            {
                service: 'RDS',
                instanceType: 'db.t3.small',
                storageGB: 100,
                backupGB: 50
            }
        ],
        network: {
            dataTransferGB: 500,
            cloudFrontGB: 200,
            requests: 1000000
        }
    };

    describe('POST /calculations/cost', () => {
        it('should calculate costs successfully', async () => {
            mockDynamoDB.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });
            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const event = {
                httpMethod: 'POST',
                path: '/calculations/cost',
                headers: mockHeaders,
                body: JSON.stringify({
                    requirements: mockRequirements,
                    region: 'us-east-1',
                    duration: 12
                })
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.totalMonthlyCost).toBeGreaterThan(0);
            expect(body.data.totalAnnualCost).toBeGreaterThan(0);
            expect(body.data.costBreakdown).toBeDefined();
            expect(body.data.recommendations).toBeDefined();
            expect(mockDynamoDB.put).toHaveBeenCalled();
        });

        it('should return 400 for missing requirements', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/calculations/cost',
                headers: mockHeaders,
                body: JSON.stringify({
                    region: 'us-east-1'
                })
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(400);
            expect(body.error).toBe('Infrastructure requirements are required');
            expect(body.code).toBe('CALC_001');
        });

        it('should return 401 without authentication', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/calculations/cost',
                headers: {},
                body: JSON.stringify({
                    requirements: mockRequirements
                })
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(401);
            expect(body.error).toBe('Authentication required');
        });
    });

    describe('POST /calculations/compare', () => {
        it('should compare configurations successfully', async () => {
            mockDynamoDB.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });
            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const configurations = [
                {
                    name: 'Basic Configuration',
                    requirements: mockRequirements,
                    duration: 12
                },
                {
                    name: 'Advanced Configuration',
                    requirements: {
                        ...mockRequirements,
                        compute: [
                            {
                                service: 'EC2',
                                instanceType: 'm5.large',
                                quantity: 3,
                                hoursPerMonth: 730
                            }
                        ]
                    },
                    duration: 12
                }
            ];

            const event = {
                httpMethod: 'POST',
                path: '/calculations/compare',
                headers: mockHeaders,
                body: JSON.stringify({
                    configurations,
                    region: 'us-east-1'
                })
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.comparisons).toHaveLength(2);
            expect(body.data.insights).toBeDefined();
            expect(body.data.recommendedConfiguration).toBeDefined();
        });

        it('should return 400 for insufficient configurations', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/calculations/compare',
                headers: mockHeaders,
                body: JSON.stringify({
                    configurations: [{ name: 'Single Config', requirements: mockRequirements }]
                })
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(400);
            expect(body.error).toBe('At least 2 configurations required for comparison');
            expect(body.code).toBe('CALC_002');
        });
    });

    describe('GET /calculations/pricing-data', () => {
        it('should return pricing data successfully', async () => {
            const mockPricingData = [
                {
                    service: 'EC2',
                    instanceType: 't3.medium',
                    region: 'us-east-1',
                    pricePerHour: 0.0416
                },
                {
                    service: 'S3',
                    storageType: 'standard',
                    region: 'us-east-1',
                    pricePerGB: 0.023
                }
            ];

            mockDynamoDB.scan.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Items: mockPricingData })
            });

            const event = {
                httpMethod: 'GET',
                path: '/calculations/pricing-data',
                headers: mockHeaders,
                queryStringParameters: {
                    service: 'EC2',
                    region: 'us-east-1'
                }
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.pricingData).toEqual(mockPricingData);
            expect(body.data.region).toBe('us-east-1');
        });
    });

    describe('GET /calculations/history', () => {
        it('should return calculation history', async () => {
            const mockEstimations = [
                {
                    estimationId: 'est-123',
                    userId: 'user123',
                    totalMonthlyCost: 150.50,
                    createdAt: '2024-01-15T10:00:00Z'
                },
                {
                    estimationId: 'est-456',
                    userId: 'user123',
                    totalMonthlyCost: 200.75,
                    createdAt: '2024-01-14T15:30:00Z'
                }
            ];

            mockDynamoDB.query.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Items: mockEstimations })
            });

            const event = {
                httpMethod: 'GET',
                path: '/calculations/history',
                headers: mockHeaders,
                queryStringParameters: {
                    limit: '10'
                }
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.estimations).toEqual(mockEstimations);
            expect(body.data.pagination.count).toBe(2);
        });
    });

    describe('GET /calculations/{id}', () => {
        it('should return specific calculation', async () => {
            const mockEstimation = {
                estimationId: 'est-123',
                userId: 'user123',
                totalMonthlyCost: 150.50,
                costBreakdown: {},
                createdAt: '2024-01-15T10:00:00Z'
            };

            mockDynamoDB.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Item: mockEstimation })
            });

            const event = {
                httpMethod: 'GET',
                path: '/calculations/{id}',
                headers: mockHeaders,
                pathParameters: { id: 'est-123' }
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data).toEqual(mockEstimation);
        });

        it('should return 404 for non-existent calculation', async () => {
            mockDynamoDB.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const event = {
                httpMethod: 'GET',
                path: '/calculations/{id}',
                headers: mockHeaders,
                pathParameters: { id: 'non-existent' }
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(404);
            expect(body.error).toBe('Calculation not found');
            expect(body.code).toBe('CALC_003');
        });

        it('should return 403 for unauthorized access', async () => {
            const mockEstimation = {
                estimationId: 'est-123',
                userId: 'other-user',
                totalMonthlyCost: 150.50
            };

            mockDynamoDB.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Item: mockEstimation })
            });

            const event = {
                httpMethod: 'GET',
                path: '/calculations/{id}',
                headers: mockHeaders,
                pathParameters: { id: 'est-123' }
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(403);
            expect(body.error).toBe('Access denied');
            expect(body.code).toBe('CALC_004');
        });
    });

    describe('Cost calculation functions', () => {
        it('should calculate compute costs correctly', async () => {
            // This would test the internal calculateComputeCosts function
            // For now, we test it through the main handler
            mockDynamoDB.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });
            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const event = {
                httpMethod: 'POST',
                path: '/calculations/cost',
                headers: mockHeaders,
                body: JSON.stringify({
                    requirements: {
                        compute: [
                            {
                                service: 'EC2',
                                instanceType: 't3.medium',
                                quantity: 1,
                                hoursPerMonth: 730
                            }
                        ]
                    }
                })
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.data.costBreakdown.monthly.compute).toBeGreaterThan(0);
            expect(body.data.costBreakdown.details.compute).toBeDefined();
        });
    });

    describe('Error handling', () => {
        it('should handle DynamoDB errors gracefully', async () => {
            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
            });

            const event = {
                httpMethod: 'POST',
                path: '/calculations/cost',
                headers: mockHeaders,
                body: JSON.stringify({
                    requirements: mockRequirements
                })
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(500);
            expect(body.error).toBe('Internal server error');
        });

        it('should return 404 for unknown routes', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/unknown/route',
                headers: mockHeaders
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(404);
            expect(body.error).toBe('Route not found');
        });
    });

    describe('Recommendations generation', () => {
        it('should generate appropriate recommendations', async () => {
            mockDynamoDB.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });
            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const highCostRequirements = {
                compute: [
                    {
                        service: 'EC2',
                        instanceType: 'm5.xlarge',
                        quantity: 10,
                        hoursPerMonth: 730
                    }
                ]
            };

            const event = {
                httpMethod: 'POST',
                path: '/calculations/cost',
                headers: mockHeaders,
                body: JSON.stringify({
                    requirements: highCostRequirements
                })
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.data.recommendations).toBeDefined();
            expect(body.data.recommendations.length).toBeGreaterThan(0);
            expect(body.data.recommendations[0]).toHaveProperty('category');
            expect(body.data.recommendations[0]).toHaveProperty('potentialSavings');
        });
    });
});