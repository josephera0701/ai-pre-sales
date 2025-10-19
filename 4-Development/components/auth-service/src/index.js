const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Initialize AWS services
const cognito = new AWS.CognitoIdentityServiceProvider();
const secretsManager = new AWS.SecretsManager();

// Environment variables
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const JWT_SECRET_ARN = process.env.JWT_SECRET_ARN;

/**
 * Authentication Service Lambda Handler
 * Handles user authentication, token management, and session control
 */
exports.handler = async (event) => {
    const { httpMethod, path, body, headers } = event;
    
    try {
        // Parse request body
        const requestBody = body ? JSON.parse(body) : {};
        
        // Route to appropriate handler
        const route = `${httpMethod} ${path}`;
        
        switch (route) {
            case 'POST /auth/login':
                return await handleLogin(requestBody);
            case 'POST /auth/logout':
                return await handleLogout(requestBody, headers);
            case 'POST /auth/refresh':
                return await handleRefreshToken(requestBody);
            case 'POST /auth/register':
                return await handleRegister(requestBody);
            case 'POST /auth/reset-password':
                return await handlePasswordReset(requestBody);
            case 'POST /auth/validate':
                return await handleTokenValidation(headers);
            default:
                return createResponse(404, { error: 'Route not found' });
        }
    } catch (error) {
        console.error('Auth service error:', error);
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
    
    // Validate input
    if (!email || !password) {
        return createResponse(400, { 
            error: 'Missing required fields',
            details: [
                { field: 'email', message: 'Email is required' },
                { field: 'password', message: 'Password is required' }
            ]
        });
    }
    
    try {
        // Authenticate with Cognito
        const authParams = {
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: CLIENT_ID,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        };
        
        const authResult = await cognito.initiateAuth(authParams).promise();
        
        if (authResult.ChallengeName) {
            // Handle MFA or other challenges
            return createResponse(200, {
                success: true,
                challengeName: authResult.ChallengeName,
                session: authResult.Session,
                challengeParameters: authResult.ChallengeParameters
            });
        }
        
        // Get user attributes
        const userParams = {
            AccessToken: authResult.AuthenticationResult.AccessToken
        };
        
        const userInfo = await cognito.getUser(userParams).promise();
        
        // Create user profile
        const userProfile = createUserProfile(userInfo);
        
        // Generate custom JWT for additional claims
        const customToken = await generateCustomToken(userProfile, rememberMe);
        
        return createResponse(200, {
            success: true,
            data: {
                accessToken: authResult.AuthenticationResult.AccessToken,
                refreshToken: authResult.AuthenticationResult.RefreshToken,
                idToken: authResult.AuthenticationResult.IdToken,
                customToken: customToken,
                expiresIn: authResult.AuthenticationResult.ExpiresIn,
                tokenType: 'Bearer',
                user: userProfile
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        
        if (error.code === 'NotAuthorizedException') {
            return createResponse(401, { 
                error: 'Invalid credentials',
                code: 'AUTH_001'
            });
        }
        
        if (error.code === 'UserNotConfirmedException') {
            return createResponse(401, { 
                error: 'Account not confirmed',
                code: 'AUTH_007'
            });
        }
        
        throw error;
    }
}

/**
 * Handle user logout
 */
async function handleLogout(body, headers) {
    const { refreshToken } = body;
    const accessToken = extractTokenFromHeaders(headers);
    
    if (!accessToken) {
        return createResponse(401, { 
            error: 'Access token required',
            code: 'AUTH_003'
        });
    }
    
    try {
        // Revoke refresh token
        if (refreshToken) {
            await cognito.revokeToken({
                Token: refreshToken,
                ClientId: CLIENT_ID
            }).promise();
        }
        
        // Global sign out (invalidates all tokens)
        await cognito.globalSignOut({
            AccessToken: accessToken
        }).promise();
        
        return createResponse(200, {
            success: true,
            message: 'Successfully logged out'
        });
        
    } catch (error) {
        console.error('Logout error:', error);
        
        if (error.code === 'NotAuthorizedException') {
            return createResponse(401, { 
                error: 'Invalid token',
                code: 'AUTH_003'
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
            error: 'Refresh token required'
        });
    }
    
    try {
        const refreshParams = {
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            ClientId: CLIENT_ID,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken
            }
        };
        
        const authResult = await cognito.initiateAuth(refreshParams).promise();
        
        return createResponse(200, {
            success: true,
            data: {
                accessToken: authResult.AuthenticationResult.AccessToken,
                idToken: authResult.AuthenticationResult.IdToken,
                expiresIn: authResult.AuthenticationResult.ExpiresIn,
                tokenType: 'Bearer'
            }
        });
        
    } catch (error) {
        console.error('Token refresh error:', error);
        
        if (error.code === 'NotAuthorizedException') {
            return createResponse(401, { 
                error: 'Invalid refresh token',
                code: 'AUTH_002'
            });
        }
        
        throw error;
    }
}

/**
 * Handle user registration
 */
async function handleRegister(body) {
    const { email, password, firstName, lastName, role = 'Sales' } = body;
    
    // Validate input
    const validationErrors = validateRegistrationInput(body);
    if (validationErrors.length > 0) {
        return createResponse(400, { 
            error: 'Validation failed',
            details: validationErrors
        });
    }
    
    try {
        const signUpParams = {
            ClientId: CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'given_name', Value: firstName },
                { Name: 'family_name', Value: lastName },
                { Name: 'custom:role', Value: role }
            ]
        };
        
        const result = await cognito.signUp(signUpParams).promise();
        
        return createResponse(201, {
            success: true,
            data: {
                userId: result.UserSub,
                email: email,
                confirmationRequired: !result.UserConfirmed
            },
            message: 'User registered successfully. Please check your email for confirmation.'
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.code === 'UsernameExistsException') {
            return createResponse(409, { 
                error: 'User already exists',
                code: 'AUTH_008'
            });
        }
        
        if (error.code === 'InvalidPasswordException') {
            return createResponse(400, { 
                error: 'Password does not meet requirements',
                code: 'AUTH_009'
            });
        }
        
        throw error;
    }
}

/**
 * Handle password reset request
 */
async function handlePasswordReset(body) {
    const { email } = body;
    
    if (!email) {
        return createResponse(400, { 
            error: 'Email is required'
        });
    }
    
    try {
        await cognito.forgotPassword({
            ClientId: CLIENT_ID,
            Username: email
        }).promise();
        
        return createResponse(200, {
            success: true,
            message: 'Password reset instructions sent to your email'
        });
        
    } catch (error) {
        console.error('Password reset error:', error);
        
        if (error.code === 'UserNotFoundException') {
            // Don't reveal if user exists for security
            return createResponse(200, {
                success: true,
                message: 'Password reset instructions sent to your email'
            });
        }
        
        throw error;
    }
}

/**
 * Handle token validation
 */
async function handleTokenValidation(headers) {
    const accessToken = extractTokenFromHeaders(headers);
    
    if (!accessToken) {
        return createResponse(401, { 
            error: 'Access token required',
            code: 'AUTH_003'
        });
    }
    
    try {
        const userParams = {
            AccessToken: accessToken
        };
        
        const userInfo = await cognito.getUser(userParams).promise();
        const userProfile = createUserProfile(userInfo);
        
        return createResponse(200, {
            success: true,
            data: {
                valid: true,
                user: userProfile
            }
        });
        
    } catch (error) {
        console.error('Token validation error:', error);
        
        if (error.code === 'NotAuthorizedException') {
            return createResponse(401, { 
                error: 'Invalid or expired token',
                code: 'AUTH_003'
            });
        }
        
        throw error;
    }
}

/**
 * Create user profile from Cognito user info
 */
function createUserProfile(userInfo) {
    const attributes = {};
    userInfo.UserAttributes.forEach(attr => {
        attributes[attr.Name] = attr.Value;
    });
    
    return {
        userId: userInfo.Username,
        email: attributes.email,
        firstName: attributes.given_name || '',
        lastName: attributes.family_name || '',
        role: attributes['custom:role'] || 'Sales',
        isEmailVerified: attributes.email_verified === 'true',
        createdAt: userInfo.UserCreateDate,
        lastModified: userInfo.UserLastModifiedDate
    };
}

/**
 * Generate custom JWT token with additional claims
 */
async function generateCustomToken(userProfile, rememberMe) {
    try {
        const secret = await getJWTSecret();
        const expiresIn = rememberMe ? '30d' : '24h';
        
        const payload = {
            userId: userProfile.userId,
            email: userProfile.email,
            role: userProfile.role,
            iat: Math.floor(Date.now() / 1000)
        };
        
        return jwt.sign(payload, secret, { expiresIn });
    } catch (error) {
        console.error('JWT generation error:', error);
        throw error;
    }
}

/**
 * Get JWT secret from AWS Secrets Manager
 */
async function getJWTSecret() {
    try {
        const result = await secretsManager.getSecretValue({
            SecretId: JWT_SECRET_ARN
        }).promise();
        
        return result.SecretString;
    } catch (error) {
        console.error('Failed to get JWT secret:', error);
        throw new Error('JWT secret not available');
    }
}

/**
 * Extract token from Authorization header
 */
function extractTokenFromHeaders(headers) {
    const authHeader = headers.Authorization || headers.authorization;
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
}

/**
 * Validate registration input
 */
function validateRegistrationInput(body) {
    const errors = [];
    const { email, password, firstName, lastName } = body;
    
    if (!email) {
        errors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
    }
    
    if (!password) {
        errors.push({ field: 'password', message: 'Password is required' });
    } else if (password.length < 8) {
        errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
    }
    
    if (!firstName) {
        errors.push({ field: 'firstName', message: 'First name is required' });
    }
    
    if (!lastName) {
        errors.push({ field: 'lastName', message: 'Last name is required' });
    }
    
    return errors;
}

/**
 * Create standardized HTTP response
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
        body: JSON.stringify({
            ...body,
            timestamp: new Date().toISOString(),
            requestId: process.env.AWS_REQUEST_ID
        })
    };
}