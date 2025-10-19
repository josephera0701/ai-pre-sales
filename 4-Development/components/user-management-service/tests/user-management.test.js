// Mock AWS SDK first
const mockDynamoDB = {
    get: jest.fn(),
    put: jest.fn(),
    update: jest.fn(),
    scan: jest.fn()
};

jest.mock('aws-sdk', () => ({
    DynamoDB: {
        DocumentClient: jest.fn(() => mockDynamoDB)
    }
}));

const { handler } = require('../src/index');

// Mock environment variables
process.env.USERS_TABLE = 'test-users-table';
process.env.AUDIT_LOGS_TABLE = 'test-audit-logs-table';

describe('User Management Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDynamoDB.get.mockReturnValue({ promise: jest.fn() });
        mockDynamoDB.put.mockReturnValue({ promise: jest.fn() });
        mockDynamoDB.update.mockReturnValue({ promise: jest.fn() });
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

    describe('GET /users/me', () => {
        it('should return existing user profile', async () => {
            const existingUser = {
                userId: 'user123',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'Sales'
            };

            mockDynamoDB.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Item: existingUser })
            });
            mockDynamoDB.update.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const event = {
                httpMethod: 'GET',
                path: '/users/me',
                headers: mockHeaders
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.userId).toBe('user123');
        });

        it('should create new user profile if not exists', async () => {
            mockDynamoDB.get.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });
            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const event = {
                httpMethod: 'GET',
                path: '/users/me',
                headers: mockHeaders
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(mockDynamoDB.put).toHaveBeenCalled();
        });

        it('should return 401 without authentication', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/users/me',
                headers: {}
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(401);
            expect(body.error).toBe('Authentication required');
        });
    });

    describe('PUT /users/me', () => {
        it('should update user profile successfully', async () => {
            const updatedUser = {
                userId: 'user123',
                firstName: 'Jane',
                lastName: 'Smith'
            };

            mockDynamoDB.update.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Attributes: updatedUser })
            });
            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const event = {
                httpMethod: 'PUT',
                path: '/users/me',
                headers: mockHeaders,
                body: JSON.stringify({
                    firstName: 'Jane',
                    lastName: 'Smith'
                })
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.message).toBe('Profile updated successfully');
        });
    });

    describe('GET /admin/users', () => {
        it('should return users list for admin', async () => {
            const mockUsers = [
                { userId: 'user1', email: 'user1@example.com', role: 'Sales' },
                { userId: 'user2', email: 'user2@example.com', role: 'PreSales' }
            ];

            mockDynamoDB.scan.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Items: mockUsers })
            });

            const adminHeaders = { ...mockHeaders, 'x-user-role': 'Admin' };
            const event = {
                httpMethod: 'GET',
                path: '/admin/users',
                headers: adminHeaders
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.users).toHaveLength(2);
        });

        it('should return 403 for non-admin users', async () => {
            const event = {
                httpMethod: 'GET',
                path: '/admin/users',
                headers: mockHeaders
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(403);
            expect(body.error).toBe('Insufficient permissions');
        });
    });

    describe('POST /admin/users/{id}/role', () => {
        it('should update user role for admin', async () => {
            const updatedUser = {
                userId: 'target123',
                role: 'Manager'
            };

            mockDynamoDB.update.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Attributes: updatedUser })
            });
            mockDynamoDB.put.mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            });

            const adminHeaders = { ...mockHeaders, 'x-user-role': 'Admin' };
            const event = {
                httpMethod: 'POST',
                path: '/admin/users/{id}/role',
                headers: adminHeaders,
                pathParameters: { id: 'target123' },
                body: JSON.stringify({ role: 'Manager' })
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.message).toBe('User role updated to Manager');
        });

        it('should return 400 for invalid role', async () => {
            const adminHeaders = { ...mockHeaders, 'x-user-role': 'Admin' };
            const event = {
                httpMethod: 'POST',
                path: '/admin/users/{id}/role',
                headers: adminHeaders,
                pathParameters: { id: 'target123' },
                body: JSON.stringify({ role: 'InvalidRole' })
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(400);
            expect(body.error).toBe('Invalid role');
        });
    });

    describe('GET /admin/audit-logs', () => {
        it('should return audit logs for admin', async () => {
            const mockLogs = [
                { logId: 'log1', userId: 'user1', action: 'LOGIN' },
                { logId: 'log2', userId: 'user2', action: 'PROFILE_UPDATE' }
            ];

            mockDynamoDB.scan.mockReturnValue({
                promise: jest.fn().mockResolvedValue({ Items: mockLogs })
            });

            const adminHeaders = { ...mockHeaders, 'x-user-role': 'Admin' };
            const event = {
                httpMethod: 'GET',
                path: '/admin/audit-logs',
                headers: adminHeaders
            };

            const result = await handler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.logs).toHaveLength(2);
        });
    });

    describe('Error handling', () => {
        it('should handle DynamoDB errors gracefully', async () => {
            mockDynamoDB.get.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
            });

            const event = {
                httpMethod: 'GET',
                path: '/users/me',
                headers: mockHeaders
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
});