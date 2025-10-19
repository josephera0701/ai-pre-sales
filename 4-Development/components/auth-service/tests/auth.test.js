const { handler } = require('../src/index');

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
    CognitoIdentityServiceProvider: jest.fn(() => ({
        initiateAuth: jest.fn(),
        getUser: jest.fn(),
        revokeToken: jest.fn(),
        globalSignOut: jest.fn(),
        signUp: jest.fn(),
        forgotPassword: jest.fn()
    })),
    SecretsManager: jest.fn(() => ({
        getSecretValue: jest.fn()
    }))
}));

// Mock environment variables
process.env.COGNITO_USER_POOL_ID = 'test-pool-id';
process.env.COGNITO_CLIENT_ID = 'test-client-id';
process.env.JWT_SECRET_ARN = 'test-secret-arn';

describe('Authentication Service', () => {
    let mockCognito;
    let mockSecretsManager;

    beforeEach(() => {
        const AWS = require('aws-sdk');
        mockCognito = new AWS.CognitoIdentityServiceProvider();
        mockSecretsManager = new AWS.SecretsManager();
        
        // Reset mocks
        jest.clearAllMocks();
    });

    describe('POST /auth/login', () => {
        test('should login successfully with valid credentials', async () => {
            // Mock Cognito responses
            mockCognito.initiateAuth.mockReturnValue({
                promise: () => Promise.resolve({
                    AuthenticationResult: {
                        AccessToken: 'mock-access-token',
                        RefreshToken: 'mock-refresh-token',
                        IdToken: 'mock-id-token',
                        ExpiresIn: 3600
                    }
                })
            });

            mockCognito.getUser.mockReturnValue({
                promise: () => Promise.resolve({
                    Username: 'user123',
                    UserAttributes: [
                        { Name: 'email', Value: 'test@example.com' },
                        { Name: 'given_name', Value: 'John' },
                        { Name: 'family_name', Value: 'Doe' },
                        { Name: 'custom:role', Value: 'Sales' }
                    ],
                    UserCreateDate: new Date(),
                    UserLastModifiedDate: new Date()
                })
            });

            mockSecretsManager.getSecretValue.mockReturnValue({
                promise: () => Promise.resolve({
                    SecretString: 'test-jwt-secret'
                })
            });

            const event = {
                httpMethod: 'POST',
                path: '/auth/login',
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123'
                })
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.accessToken).toBe('mock-access-token');
            expect(body.data.user.email).toBe('test@example.com');
        });

        test('should return 400 for missing credentials', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/auth/login',
                body: JSON.stringify({
                    email: 'test@example.com'
                    // missing password
                })
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(400);
            expect(body.error).toBe('Missing required fields');
        });

        test('should return 401 for invalid credentials', async () => {
            mockCognito.initiateAuth.mockReturnValue({
                promise: () => Promise.reject({
                    code: 'NotAuthorizedException',
                    message: 'Incorrect username or password'
                })
            });

            const event = {
                httpMethod: 'POST',
                path: '/auth/login',
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(401);
            expect(body.error).toBe('Invalid credentials');
            expect(body.code).toBe('AUTH_001');
        });
    });

    describe('POST /auth/logout', () => {
        test('should logout successfully', async () => {
            mockCognito.revokeToken.mockReturnValue({
                promise: () => Promise.resolve()
            });

            mockCognito.globalSignOut.mockReturnValue({
                promise: () => Promise.resolve()
            });

            const event = {
                httpMethod: 'POST',
                path: '/auth/logout',
                headers: {
                    Authorization: 'Bearer mock-access-token'
                },
                body: JSON.stringify({
                    refreshToken: 'mock-refresh-token'
                })
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.message).toBe('Successfully logged out');
        });

        test('should return 401 for missing access token', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/auth/logout',
                headers: {},
                body: JSON.stringify({
                    refreshToken: 'mock-refresh-token'
                })
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(401);
            expect(body.error).toBe('Access token required');
        });
    });

    describe('POST /auth/refresh', () => {
        test('should refresh token successfully', async () => {
            mockCognito.initiateAuth.mockReturnValue({
                promise: () => Promise.resolve({
                    AuthenticationResult: {
                        AccessToken: 'new-access-token',
                        IdToken: 'new-id-token',
                        ExpiresIn: 3600
                    }
                })
            });

            const event = {
                httpMethod: 'POST',
                path: '/auth/refresh',
                body: JSON.stringify({
                    refreshToken: 'mock-refresh-token'
                })
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.accessToken).toBe('new-access-token');
        });

        test('should return 400 for missing refresh token', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/auth/refresh',
                body: JSON.stringify({})
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(400);
            expect(body.error).toBe('Refresh token required');
        });
    });

    describe('POST /auth/register', () => {
        test('should register user successfully', async () => {
            mockCognito.signUp.mockReturnValue({
                promise: () => Promise.resolve({
                    UserSub: 'user123',
                    UserConfirmed: false
                })
            });

            const event = {
                httpMethod: 'POST',
                path: '/auth/register',
                body: JSON.stringify({
                    email: 'newuser@example.com',
                    password: 'password123',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    role: 'Sales'
                })
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(201);
            expect(body.success).toBe(true);
            expect(body.data.userId).toBe('user123');
            expect(body.data.email).toBe('newuser@example.com');
        });

        test('should return 400 for invalid input', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/auth/register',
                body: JSON.stringify({
                    email: 'invalid-email',
                    password: '123', // too short
                    firstName: 'Jane'
                    // missing lastName
                })
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(400);
            expect(body.error).toBe('Validation failed');
            expect(body.details).toHaveLength(3); // email, password, lastName
        });

        test('should return 409 for existing user', async () => {
            mockCognito.signUp.mockReturnValue({
                promise: () => Promise.reject({
                    code: 'UsernameExistsException',
                    message: 'User already exists'
                })
            });

            const event = {
                httpMethod: 'POST',
                path: '/auth/register',
                body: JSON.stringify({
                    email: 'existing@example.com',
                    password: 'password123',
                    firstName: 'Jane',
                    lastName: 'Smith'
                })
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(409);
            expect(body.error).toBe('User already exists');
            expect(body.code).toBe('AUTH_008');
        });
    });

    describe('POST /auth/reset-password', () => {
        test('should send password reset successfully', async () => {
            mockCognito.forgotPassword.mockReturnValue({
                promise: () => Promise.resolve()
            });

            const event = {
                httpMethod: 'POST',
                path: '/auth/reset-password',
                body: JSON.stringify({
                    email: 'test@example.com'
                })
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.message).toBe('Password reset instructions sent to your email');
        });

        test('should return 400 for missing email', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/auth/reset-password',
                body: JSON.stringify({})
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(400);
            expect(body.error).toBe('Email is required');
        });
    });

    describe('POST /auth/validate', () => {
        test('should validate token successfully', async () => {
            mockCognito.getUser.mockReturnValue({
                promise: () => Promise.resolve({
                    Username: 'user123',
                    UserAttributes: [
                        { Name: 'email', Value: 'test@example.com' },
                        { Name: 'given_name', Value: 'John' },
                        { Name: 'family_name', Value: 'Doe' },
                        { Name: 'custom:role', Value: 'Sales' }
                    ],
                    UserCreateDate: new Date(),
                    UserLastModifiedDate: new Date()
                })
            });

            const event = {
                httpMethod: 'POST',
                path: '/auth/validate',
                headers: {
                    Authorization: 'Bearer valid-token'
                }
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.valid).toBe(true);
            expect(body.data.user.email).toBe('test@example.com');
        });

        test('should return 401 for invalid token', async () => {
            mockCognito.getUser.mockReturnValue({
                promise: () => Promise.reject({
                    code: 'NotAuthorizedException',
                    message: 'Invalid token'
                })
            });

            const event = {
                httpMethod: 'POST',
                path: '/auth/validate',
                headers: {
                    Authorization: 'Bearer invalid-token'
                }
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(401);
            expect(body.error).toBe('Invalid or expired token');
            expect(body.code).toBe('AUTH_003');
        });
    });

    describe('Error handling', () => {
        test('should return 404 for unknown route', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/unknown',
                body: null
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(404);
            expect(body.error).toBe('Route not found');
        });

        test('should handle malformed JSON', async () => {
            const event = {
                httpMethod: 'POST',
                path: '/auth/login',
                body: 'invalid json'
            };

            const response = await handler(event);
            const body = JSON.parse(response.body);

            expect(response.statusCode).toBe(500);
            expect(body.error).toBe('Internal server error');
        });
    });
});