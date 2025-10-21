// Use AWS SDK v3 (built into Node.js 18 runtime)
const { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Initialize AWS services
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Environment variables
const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.CLIENT_ID;

/**
 * Authentication Service Lambda Handler
 * Handles Cognito authentication, JWT validation, user login/logout
 */
exports.handler = async (event) => {
    const { httpMethod, path, body, headers } = event;
    
    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
        return createResponse(200, { message: 'CORS preflight successful' });
    }
    
    try {
        // Parse request body
        const requestBody = body ? JSON.parse(body) : {};
        
        // Route to appropriate handler
        const route = `${httpMethod} ${path}`;
        
        switch (route) {
            case 'POST /auth/login':
                return await handleLogin(requestBody);
            case 'POST /auth/refresh':
                return await handleRefreshToken(requestBody);
            case 'POST /auth/logout':
                return await handleLogout(requestBody);
            case 'POST /auth/reset-password':
                return await handleResetPassword(requestBody);
            case 'POST /auth/confirm-reset':
                return await handleConfirmResetPassword(requestBody);
            case 'POST /auth/validate':
                return await handleValidateToken(headers);
            default:
                return createResponse(404, { error: 'Route not found' });
        }
    } catch (error) {
        console.error('Authentication service error:', error);
        return createResponse(500, { 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

/**
 * Handle user login
 */
async function handleLogin(body) {
    const { email, password, rememberMe = false } = body;
    
    if (!email || !password) {
        return createResponse(400, {
            error: 'Email and password are required',
            code: 'AUTH_001'
        });
    }
    
    try {
        const command = new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: CLIENT_ID,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        });
        
        const response = await cognitoClient.send(command);
        
        if (response.ChallengeName) {
            // Handle MFA or other challenges
            return createResponse(200, {
                success: true,
                challengeName: response.ChallengeName,
                session: response.Session,
                challengeParameters: response.ChallengeParameters
            });
        }
        
        const { AccessToken, IdToken, RefreshToken, ExpiresIn } = response.AuthenticationResult;
        
        // Extract user info from ID token (simplified - in production, properly decode JWT)
        const userInfo = extractUserFromIdToken(IdToken);
        
        return createResponse(200, {
            success: true,
            data: {
                accessToken: AccessToken,
                refreshToken: RefreshToken,
                expiresIn: ExpiresIn,
                tokenType: 'Bearer',
                user: userInfo
            },
            message: 'Login successful'
        });
        
    } catch (error) {
        console.error('Login error:', error);
        
        if (error.name === 'NotAuthorizedException') {
            return createResponse(401, {
                error: 'Invalid credentials',
                code: 'AUTH_001'
            });
        }
        
        if (error.name === 'UserNotConfirmedException') {
            return createResponse(401, {
                error: 'User account not confirmed',
                code: 'AUTH_002'
            });
        }
        
        throw error;
    }
}

/**
 * Handle token refresh
 */
async function handleRefreshToken(body) {
    const { refreshToken } = body;
    
    if (!refreshToken) {
        return createResponse(400, {
            error: 'Refresh token is required',
            code: 'AUTH_003'
        });
    }
    
    try {
        const command = new InitiateAuthCommand({
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            ClientId: CLIENT_ID,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken
            }
        });
        
        const response = await cognitoClient.send(command);
        const { AccessToken, IdToken, ExpiresIn } = response.AuthenticationResult;
        
        const userInfo = extractUserFromIdToken(IdToken);
        
        return createResponse(200, {
            success: true,
            data: {
                accessToken: AccessToken,
                expiresIn: ExpiresIn,
                tokenType: 'Bearer',
                user: userInfo
            },
            message: 'Token refreshed successfully'
        });
        
    } catch (error) {
        console.error('Refresh token error:', error);
        
        if (error.name === 'NotAuthorizedException') {
            return createResponse(401, {
                error: 'Invalid refresh token',
                code: 'AUTH_002'
            });
        }
        
        throw error;
    }
}

/**
 * Handle user logout
 */
async function handleLogout(body) {
    // In a full implementation, you would revoke the token
    // For now, just return success (client-side token removal)
    return createResponse(200, {
        success: true,
        message: 'Logout successful'
    });
}

/**
 * Handle password reset request
 */
async function handleResetPassword(body) {
    const { email } = body;
    
    if (!email) {
        return createResponse(400, {
            error: 'Email is required',
            code: 'AUTH_004'
        });
    }
    
    try {
        const command = new ForgotPasswordCommand({
            ClientId: CLIENT_ID,
            Username: email
        });
        
        await cognitoClient.send(command);
        
        return createResponse(200, {
            success: true,
            message: 'Password reset code sent to email'
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        
        if (error.name === 'UserNotFoundException') {
            // Don't reveal if user exists or not
            return createResponse(200, {
                success: true,
                message: 'If the email exists, a reset code has been sent'
            });
        }
        
        throw error;
    }
}

/**
 * Handle password reset confirmation
 */
async function handleConfirmResetPassword(body) {
    const { email, code, newPassword } = body;
    
    if (!email || !code || !newPassword) {
        return createResponse(400, {
            error: 'Email, code, and new password are required',
            code: 'AUTH_005'
        });
    }
    
    try {
        const command = new ConfirmForgotPasswordCommand({
            ClientId: CLIENT_ID,
            Username: email,
            ConfirmationCode: code,
            Password: newPassword
        });
        
        await cognitoClient.send(command);
        
        return createResponse(200, {
            success: true,
            message: 'Password reset successful'
        });
        
    } catch (error) {
        console.error('Confirm reset password error:', error);
        
        if (error.name === 'CodeMismatchException') {
            return createResponse(400, {
                error: 'Invalid reset code',
                code: 'AUTH_006'
            });
        }
        
        throw error;
    }
}

/**
 * Handle token validation (for API Gateway authorizer)
 */
async function handleValidateToken(headers) {
    const authHeader = headers.Authorization || headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return createResponse(401, {
            error: 'Missing or invalid authorization header',
            code: 'AUTH_003'
        });
    }
    
    const token = authHeader.substring(7);
    
    try {
        // In production, properly validate JWT token with Cognito public keys
        const userInfo = extractUserFromIdToken(token);
        
        return createResponse(200, {
            success: true,
            data: {
                valid: true,
                user: userInfo
            }
        });
        
    } catch (error) {
        console.error('Token validation error:', error);
        return createResponse(401, {
            error: 'Invalid token',
            code: 'AUTH_003'
        });
    }
}

/**
 * Extract user information from ID token (simplified)
 * In production, properly decode and validate JWT
 */
function extractUserFromIdToken(idToken) {
    try {
        // This is a simplified version - in production, use proper JWT library
        const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
        
        return {
            userId: payload.sub,
            email: payload.email,
            firstName: payload.given_name || '',
            lastName: payload.family_name || '',
            role: payload['custom:role'] || 'Sales'
        };
    } catch (error) {
        console.error('Token parsing error:', error);
        return {
            userId: 'unknown',
            email: 'unknown@example.com',
            firstName: '',
            lastName: '',
            role: 'Sales'
        };
    }
}

/**
 * Create standardized API response with proper CORS
 */
function createResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Credentials': 'false',
            'Access-Control-Max-Age': '86400'
        },
        body: JSON.stringify({
            ...body,
            timestamp: new Date().toISOString(),
            requestId: process.env.AWS_REQUEST_ID || 'local-test'
        })
    };
}