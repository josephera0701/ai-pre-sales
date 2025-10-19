// Integration tests for Cost Calculator Service with Auth and User Management services
const AWS = require('aws-sdk');

// Mock AWS services for integration testing
const mockDynamoDB = {
    get: jest.fn(),
    put: jest.fn(),
    query: jest.fn(),
    scan: jest.fn(),
    update: jest.fn()
};

const mockLambda = {
    invoke: jest.fn()
};

jest.mock('aws-sdk', () => ({
    DynamoDB: {
        DocumentClient: jest.fn(() => mockDynamoDB)
    },
    Lambda: jest.fn(() => mockLambda)
}));

describe('Cost Calculator Service Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDynamoDB.get.mockReturnValue({ promise: jest.fn() });
        mockDynamoDB.put.mockReturnValue({ promise: jest.fn() });
        mockDynamoDB.query.mockReturnValue({ promise: jest.fn() });
        mockDynamoDB.scan.mockReturnValue({ promise: jest.fn() });
        mockDynamoDB.update.mockReturnValue({ promise: jest.fn() });
        mockLambda.invoke.mockReturnValue({ promise: jest.fn() });
    });

    describe('Integration with Authentication Service', () => {
        it('should validate user authentication before cost calculation', async () => {
            // Mock auth service response
            mockLambda.invoke.mockReturnValue({
                promise: jest.fn().mockResolvedValue({
                    StatusCode: 200,
                    Payload: JSON.stringify({
                        statusCode: 200,
                        body: JSON.stringify({
                            success: true,
                            data: {
                                userId: 'user123',
                                email: 'test@example.com',
                                role: 'Sales',
                                isValid: true
                            }
                        })
                    })
                })
            });

            // Mock cost calculation success
            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const costCalculatorHandler = require('../../../4-Development/components/cost-calculator-service/src/index').handler;

            const event = {
                httpMethod: 'POST',
                path: '/calculations/cost',
                headers: {
                    'Authorization': 'Bearer valid-token',
                    'x-user-id': 'user123',
                    'x-user-email': 'test@example.com',
                    'x-user-role': 'Sales'
                },
                body: JSON.stringify({
                    requirements: {
                        compute: [{
                            service: 'EC2',
                            instanceType: 't3.medium',
                            quantity: 1,
                            hoursPerMonth: 730
                        }]
                    }
                })
            };

            const result = await costCalculatorHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.userId).toBe('user123');
            expect(mockDynamoDB.put).toHaveBeenCalled();
        });

        it('should reject requests with invalid authentication', async () => {
            const costCalculatorHandler = require('../../../4-Development/components/cost-calculator-service/src/index').handler;

            const event = {
                httpMethod: 'POST',
                path: '/calculations/cost',
                headers: {},
                body: JSON.stringify({
                    requirements: {
                        compute: [{
                            service: 'EC2',
                            instanceType: 't3.medium',
                            quantity: 1
                        }]
                    }
                })
            };

            const result = await costCalculatorHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(401);
            expect(body.error).toBe('Authentication required');
            expect(mockDynamoDB.put).not.toHaveBeenCalled();
        });
    });

    describe('Integration with User Management Service', () => {
        it('should use user preferences for cost calculations', async () => {
            // Mock user management service response with preferences
            const mockUserProfile = {
                userId: 'user123',
                email: 'test@example.com',
                role: 'Sales',
                preferences: {
                    defaultCurrency: 'USD',
                    defaultRegion: 'us-west-2',
                    costOptimizationLevel: 'aggressive'
                }
            };

            mockDynamoDB.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Item: mockUserProfile })
            });

            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const costCalculatorHandler = require('../../../4-Development/components/cost-calculator-service/src/index').handler;

            const event = {
                httpMethod: 'POST',
                path: '/calculations/cost',
                headers: {
                    'Authorization': 'Bearer valid-token',
                    'x-user-id': 'user123',
                    'x-user-email': 'test@example.com',
                    'x-user-role': 'Sales'
                },
                body: JSON.stringify({
                    requirements: {
                        compute: [{
                            service: 'EC2',
                            instanceType: 't3.medium',
                            quantity: 2,
                            hoursPerMonth: 730
                        }]
                    }
                    // Note: region not specified, should use user's default
                })
            };

            const result = await costCalculatorHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.userId).toBe('user123');
        });

        it('should track calculation history per user', async () => {
            const mockCalculationHistory = [
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
                promise: jest.fn().mockResolvedValue({ Items: mockCalculationHistory })
            });

            const costCalculatorHandler = require('../../../4-Development/components/cost-calculator-service/src/index').handler;

            const event = {
                httpMethod: 'GET',
                path: '/calculations/history',
                headers: {
                    'Authorization': 'Bearer valid-token',
                    'x-user-id': 'user123',
                    'x-user-email': 'test@example.com',
                    'x-user-role': 'Sales'
                }
            };

            const result = await costCalculatorHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.estimations).toHaveLength(2);
            expect(mockDynamoDB.query).toHaveBeenCalledWith(
                expect.objectContaining({
                    KeyConditionExpression: 'userId = :userId',
                    ExpressionAttributeValues: { ':userId': 'user123' }
                })
            );
        });
    });

    describe('Cross-Component Data Flow', () => {
        it('should handle complete user journey: auth → profile → calculation', async () => {
            // Step 1: User authentication (simulated)
            const authHeaders = {
                'Authorization': 'Bearer valid-token',
                'x-user-id': 'user123',
                'x-user-email': 'test@example.com',
                'x-user-role': 'Sales'
            };

            // Step 2: Get user profile (simulated user management call)
            const mockUserProfile = {
                userId: 'user123',
                preferences: {
                    defaultCurrency: 'USD',
                    defaultRegion: 'us-east-1'
                }
            };

            mockDynamoDB.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Item: mockUserProfile })
            });

            // Step 3: Cost calculation with user context
            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const costCalculatorHandler = require('../../../4-Development/components/cost-calculator-service/src/index').handler;

            const event = {
                httpMethod: 'POST',
                path: '/calculations/cost',
                headers: authHeaders,
                body: JSON.stringify({
                    requirements: {
                        compute: [{
                            service: 'EC2',
                            instanceType: 't3.medium',
                            quantity: 1,
                            hoursPerMonth: 730
                        }],
                        storage: [{
                            service: 'S3',
                            storageType: 'standard',
                            sizeGB: 100
                        }]
                    },
                    region: 'us-east-1'
                })
            };

            const result = await costCalculatorHandler(event);
            const body = JSON.parse(result.body);

            // Verify complete flow
            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.userId).toBe('user123');
            expect(body.data.totalMonthlyCost).toBeGreaterThan(0);
            expect(body.data.costBreakdown).toBeDefined();
            expect(body.data.recommendations).toBeDefined();

            // Verify data was saved
            expect(mockDynamoDB.put).toHaveBeenCalledWith(
                expect.objectContaining({
                    TableName: expect.any(String),
                    Item: expect.objectContaining({
                        userId: 'user123',
                        totalMonthlyCost: expect.any(Number),
                        costBreakdown: expect.any(Object)
                    })
                })
            );
        });

        it('should handle role-based access for admin functions', async () => {
            // Admin user accessing all calculations
            const adminHeaders = {
                'Authorization': 'Bearer admin-token',
                'x-user-id': 'admin123',
                'x-user-email': 'admin@example.com',
                'x-user-role': 'Admin'
            };

            // Mock calculation owned by different user
            const mockCalculation = {
                estimationId: 'est-123',
                userId: 'other-user',
                totalMonthlyCost: 150.50
            };

            mockDynamoDB.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Item: mockCalculation })
            });

            const costCalculatorHandler = require('../../../4-Development/components/cost-calculator-service/src/index').handler;

            const event = {
                httpMethod: 'GET',
                path: '/calculations/est-123',
                headers: adminHeaders,
                pathParameters: { id: 'est-123' }
            };

            const result = await costCalculatorHandler(event);
            const body = JSON.parse(result.body);

            // Admin should have access to any calculation
            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.estimationId).toBe('est-123');
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle auth service failures gracefully', async () => {
            const costCalculatorHandler = require('../../../4-Development/components/cost-calculator-service/src/index').handler;

            const event = {
                httpMethod: 'POST',
                path: '/calculations/cost',
                headers: {
                    'Authorization': 'Bearer invalid-token'
                    // Missing user context headers
                },
                body: JSON.stringify({
                    requirements: {
                        compute: [{
                            service: 'EC2',
                            instanceType: 't3.medium',
                            quantity: 1
                        }]
                    }
                })
            };

            const result = await costCalculatorHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(401);
            expect(body.error).toBe('Authentication required');
        });

        it('should handle database failures with proper error responses', async () => {
            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('DynamoDB connection failed'))
            });

            const costCalculatorHandler = require('../../../4-Development/components/cost-calculator-service/src/index').handler;

            const event = {
                httpMethod: 'POST',
                path: '/calculations/cost',
                headers: {
                    'Authorization': 'Bearer valid-token',
                    'x-user-id': 'user123',
                    'x-user-email': 'test@example.com',
                    'x-user-role': 'Sales'
                },
                body: JSON.stringify({
                    requirements: {
                        compute: [{
                            service: 'EC2',
                            instanceType: 't3.medium',
                            quantity: 1
                        }]
                    }
                })
            };

            const result = await costCalculatorHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(500);
            expect(body.error).toBe('Internal server error');
            expect(body.message).toContain('DynamoDB connection failed');
        });
    });

    describe('Performance Integration', () => {
        it('should handle large calculation requests efficiently', async () => {
            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const costCalculatorHandler = require('../../../4-Development/components/cost-calculator-service/src/index').handler;

            // Large infrastructure requirements
            const largeRequirements = {
                compute: Array(20).fill({
                    service: 'EC2',
                    instanceType: 'm5.large',
                    quantity: 5,
                    hoursPerMonth: 730
                }),
                storage: Array(10).fill({
                    service: 'S3',
                    storageType: 'standard',
                    sizeGB: 1000
                }),
                database: Array(5).fill({
                    service: 'RDS',
                    instanceType: 'db.m5.large',
                    storageGB: 500
                })
            };

            const event = {
                httpMethod: 'POST',
                path: '/calculations/cost',
                headers: {
                    'Authorization': 'Bearer valid-token',
                    'x-user-id': 'user123',
                    'x-user-email': 'test@example.com',
                    'x-user-role': 'Sales'
                },
                body: JSON.stringify({
                    requirements: largeRequirements
                })
            };

            const startTime = Date.now();
            const result = await costCalculatorHandler(event);
            const endTime = Date.now();
            const executionTime = endTime - startTime;

            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.totalMonthlyCost).toBeGreaterThan(0);
            expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
        });
    });
});