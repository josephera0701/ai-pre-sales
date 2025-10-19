const AWS = require('aws-sdk');
const axios = require('axios');

// Integration test configuration
const TEST_CONFIG = {
    apiUrl: process.env.TEST_API_URL || 'https://api-test.aws-cost-estimation.sagesoft.com',
    cognitoUserPoolId: process.env.TEST_COGNITO_USER_POOL_ID,
    cognitoClientId: process.env.TEST_COGNITO_CLIENT_ID,
    testUser: {
        email: 'test-auth@sagesoft.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
    }
};

describe('Authentication Service Integration Tests', () => {
    let testUserId;
    let accessToken;
    let refreshToken;

    beforeAll(async () => {
        // Setup test environment
        console.log('Setting up integration test environment...');
    });

    afterAll(async () => {
        // Cleanup test data
        if (testUserId) {
            await cleanupTestUser(testUserId);
        }
    });

    describe('User Registration Flow', () => {
        test('should register new user successfully', async () => {
            const response = await axios.post(`${TEST_CONFIG.apiUrl}/auth/register`, {
                email: TEST_CONFIG.testUser.email,
                password: TEST_CONFIG.testUser.password,
                firstName: TEST_CONFIG.testUser.firstName,
                lastName: TEST_CONFIG.testUser.lastName,
                role: 'Sales'
            });

            expect(response.status).toBe(201);
            expect(response.data.success).toBe(true);
            expect(response.data.data.email).toBe(TEST_CONFIG.testUser.email);
            
            testUserId = response.data.data.userId;
        });

        test('should reject duplicate user registration', async () => {
            try {
                await axios.post(`${TEST_CONFIG.apiUrl}/auth/register`, {
                    email: TEST_CONFIG.testUser.email,
                    password: TEST_CONFIG.testUser.password,
                    firstName: TEST_CONFIG.testUser.firstName,
                    lastName: TEST_CONFIG.testUser.lastName
                });
                fail('Should have thrown error for duplicate user');
            } catch (error) {
                expect(error.response.status).toBe(409);
                expect(error.response.data.code).toBe('AUTH_008');
            }
        });
    });

    describe('Authentication Flow', () => {
        beforeAll(async () => {
            // Confirm test user (simulate email confirmation)
            await confirmTestUser(TEST_CONFIG.testUser.email);
        });

        test('should login with valid credentials', async () => {
            const response = await axios.post(`${TEST_CONFIG.apiUrl}/auth/login`, {
                email: TEST_CONFIG.testUser.email,
                password: TEST_CONFIG.testUser.password
            });

            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.accessToken).toBeDefined();
            expect(response.data.data.refreshToken).toBeDefined();
            expect(response.data.data.user.email).toBe(TEST_CONFIG.testUser.email);

            accessToken = response.data.data.accessToken;
            refreshToken = response.data.data.refreshToken;
        });

        test('should reject invalid credentials', async () => {
            try {
                await axios.post(`${TEST_CONFIG.apiUrl}/auth/login`, {
                    email: TEST_CONFIG.testUser.email,
                    password: 'wrongpassword'
                });
                fail('Should have thrown error for invalid credentials');
            } catch (error) {
                expect(error.response.status).toBe(401);
                expect(error.response.data.code).toBe('AUTH_001');
            }
        });

        test('should validate access token', async () => {
            const response = await axios.post(`${TEST_CONFIG.apiUrl}/auth/validate`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.valid).toBe(true);
            expect(response.data.data.user.email).toBe(TEST_CONFIG.testUser.email);
        });

        test('should refresh access token', async () => {
            const response = await axios.post(`${TEST_CONFIG.apiUrl}/auth/refresh`, {
                refreshToken: refreshToken
            });

            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.accessToken).toBeDefined();
            expect(response.data.data.accessToken).not.toBe(accessToken);

            // Update access token for subsequent tests
            accessToken = response.data.data.accessToken;
        });

        test('should logout successfully', async () => {
            const response = await axios.post(`${TEST_CONFIG.apiUrl}/auth/logout`, {
                refreshToken: refreshToken
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
        });

        test('should reject requests with invalidated token', async () => {
            try {
                await axios.post(`${TEST_CONFIG.apiUrl}/auth/validate`, {}, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                fail('Should have thrown error for invalidated token');
            } catch (error) {
                expect(error.response.status).toBe(401);
                expect(error.response.data.code).toBe('AUTH_003');
            }
        });
    });

    describe('Password Reset Flow', () => {
        test('should send password reset email', async () => {
            const response = await axios.post(`${TEST_CONFIG.apiUrl}/auth/reset-password`, {
                email: TEST_CONFIG.testUser.email
            });

            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.message).toContain('Password reset instructions');
        });

        test('should handle non-existent user gracefully', async () => {
            const response = await axios.post(`${TEST_CONFIG.apiUrl}/auth/reset-password`, {
                email: 'nonexistent@example.com'
            });

            // Should return success for security (don't reveal user existence)
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle malformed requests', async () => {
            try {
                await axios.post(`${TEST_CONFIG.apiUrl}/auth/login`, {
                    email: 'invalid-email',
                    // missing password
                });
                fail('Should have thrown validation error');
            } catch (error) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.error).toContain('required');
            }
        });

        test('should handle missing authorization header', async () => {
            try {
                await axios.post(`${TEST_CONFIG.apiUrl}/auth/validate`, {});
                fail('Should have thrown authorization error');
            } catch (error) {
                expect(error.response.status).toBe(401);
                expect(error.response.data.code).toBe('AUTH_003');
            }
        });

        test('should handle invalid JSON', async () => {
            try {
                await axios.post(`${TEST_CONFIG.apiUrl}/auth/login`, 'invalid json', {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                fail('Should have thrown JSON parsing error');
            } catch (error) {
                expect(error.response.status).toBe(500);
            }
        });
    });

    describe('Performance Tests', () => {
        test('should respond within acceptable time limits', async () => {
            const startTime = Date.now();
            
            const response = await axios.post(`${TEST_CONFIG.apiUrl}/auth/login`, {
                email: TEST_CONFIG.testUser.email,
                password: TEST_CONFIG.testUser.password
            });
            
            const responseTime = Date.now() - startTime;
            
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(500); // 500ms target
        });

        test('should handle concurrent requests', async () => {
            const concurrentRequests = 10;
            const requests = [];

            for (let i = 0; i < concurrentRequests; i++) {
                requests.push(
                    axios.post(`${TEST_CONFIG.apiUrl}/auth/reset-password`, {
                        email: `test${i}@example.com`
                    })
                );
            }

            const responses = await Promise.all(requests);
            
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
        });
    });
});

/**
 * Helper function to confirm test user
 */
async function confirmTestUser(email) {
    const cognito = new AWS.CognitoIdentityServiceProvider();
    
    try {
        await cognito.adminConfirmSignUp({
            UserPoolId: TEST_CONFIG.cognitoUserPoolId,
            Username: email
        }).promise();
    } catch (error) {
        console.warn('User confirmation failed:', error.message);
    }
}

/**
 * Helper function to cleanup test user
 */
async function cleanupTestUser(userId) {
    const cognito = new AWS.CognitoIdentityServiceProvider();
    
    try {
        await cognito.adminDeleteUser({
            UserPoolId: TEST_CONFIG.cognitoUserPoolId,
            Username: userId
        }).promise();
        console.log('Test user cleaned up successfully');
    } catch (error) {
        console.warn('Test user cleanup failed:', error.message);
    }
}