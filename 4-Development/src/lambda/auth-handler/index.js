const AWS = require('aws-sdk');
const crypto = require('crypto');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider();

exports.handler = async (event) => {
    try {
        const { httpMethod, path, body } = event;
        
        console.log(`${httpMethod} ${path}`);
        
        switch (path) {
            case '/auth/login':
                return await handleLogin(JSON.parse(body));
            case '/auth/refresh':
                return await handleRefreshToken(JSON.parse(body));
            case '/auth/logout':
                return await handleLogout(JSON.parse(body));
            case '/auth/reset-password':
                return await handlePasswordReset(JSON.parse(body));
            default:
                return {
                    statusCode: 404,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({
                        success: false,
                        error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
                    })
                };
        }
        
    } catch (error) {
        console.error('Auth handler error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: error.message }
            })
        };
    }
};

async function handleLogin(loginData) {
    const { email, password, rememberMe = false } = loginData;
    
    // Validate input
    if (!email || !password) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' }
            })
        };
    }
    
    try {
        // Authenticate with Cognito
        const authParams = {
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        };
        
        const authResult = await cognito.initiateAuth(authParams).promise();
        
        if (authResult.ChallengeName) {
            // Handle MFA or other challenges
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({
                    success: true,
                    data: {
                        challengeName: authResult.ChallengeName,
                        session: authResult.Session,
                        challengeParameters: authResult.ChallengeParameters
                    }
                })
            };
        }
        
        const tokens = authResult.AuthenticationResult;
        
        // Get user details from token
        const userInfo = await getUserFromToken(tokens.AccessToken);
        
        // Update last login time
        await updateLastLogin(userInfo.sub);
        
        // Create user profile if it doesn't exist
        await ensureUserProfile(userInfo);
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    accessToken: tokens.AccessToken,
                    refreshToken: tokens.RefreshToken,
                    idToken: tokens.IdToken,
                    expiresIn: tokens.ExpiresIn,
                    tokenType: 'Bearer',
                    user: {
                        userId: userInfo.sub,
                        email: userInfo.email,
                        firstName: userInfo.given_name,
                        lastName: userInfo.family_name,
                        role: userInfo['custom:role'] || 'Sales'
                    }
                }
            })
        };
        
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed';
        let errorCode = 'LOGIN_FAILED';
        
        if (error.code === 'NotAuthorizedException') {
            errorMessage = 'Invalid email or password';
            errorCode = 'INVALID_CREDENTIALS';
        } else if (error.code === 'UserNotConfirmedException') {
            errorMessage = 'Account not confirmed. Please check your email';
            errorCode = 'ACCOUNT_NOT_CONFIRMED';
        } else if (error.code === 'UserNotFoundException') {
            errorMessage = 'User not found';
            errorCode = 'USER_NOT_FOUND';
        } else if (error.code === 'TooManyRequestsException') {
            errorMessage = 'Too many login attempts. Please try again later';
            errorCode = 'TOO_MANY_REQUESTS';
        }
        
        return {
            statusCode: 401,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: errorCode, message: errorMessage }
            })
        };
    }
}

async function handleRefreshToken(refreshData) {
    const { refreshToken } = refreshData;
    
    if (!refreshToken) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Refresh token is required' }
            })
        };
    }
    
    try {
        const params = {
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken
            }
        };
        
        const result = await cognito.initiateAuth(params).promise();
        const tokens = result.AuthenticationResult;
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    accessToken: tokens.AccessToken,
                    idToken: tokens.IdToken,
                    expiresIn: tokens.ExpiresIn,
                    tokenType: 'Bearer'
                }
            })
        };
        
    } catch (error) {
        console.error('Token refresh error:', error);
        
        return {
            statusCode: 401,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'TOKEN_REFRESH_FAILED', message: 'Failed to refresh token' }
            })
        };
    }
}

async function handleLogout(logoutData) {
    const { accessToken } = logoutData;
    
    if (!accessToken) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Access token is required' }
            })
        };
    }
    
    try {
        // Revoke the token in Cognito
        await cognito.globalSignOut({
            AccessToken: accessToken
        }).promise();
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: { message: 'Logged out successfully' }
            })
        };
        
    } catch (error) {
        console.error('Logout error:', error);
        
        // Even if logout fails, return success to client
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: { message: 'Logged out successfully' }
            })
        };
    }
}

async function handlePasswordReset(resetData) {
    const { email, newPassword, confirmationCode } = resetData;
    
    if (!email) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Email is required' }
            })
        };
    }
    
    try {
        if (newPassword && confirmationCode) {
            // Confirm password reset
            await cognito.confirmForgotPassword({
                ClientId: process.env.COGNITO_CLIENT_ID,
                Username: email,
                Password: newPassword,
                ConfirmationCode: confirmationCode
            }).promise();
            
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({
                    success: true,
                    data: { message: 'Password reset successfully' }
                })
            };
            
        } else {
            // Initiate password reset
            await cognito.forgotPassword({
                ClientId: process.env.COGNITO_CLIENT_ID,
                Username: email
            }).promise();
            
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({
                    success: true,
                    data: { message: 'Password reset code sent to your email' }
                })
            };
        }
        
    } catch (error) {
        console.error('Password reset error:', error);
        
        let errorMessage = 'Password reset failed';
        let errorCode = 'PASSWORD_RESET_FAILED';
        
        if (error.code === 'UserNotFoundException') {
            errorMessage = 'User not found';
            errorCode = 'USER_NOT_FOUND';
        } else if (error.code === 'CodeMismatchException') {
            errorMessage = 'Invalid confirmation code';
            errorCode = 'INVALID_CODE';
        } else if (error.code === 'ExpiredCodeException') {
            errorMessage = 'Confirmation code has expired';
            errorCode = 'EXPIRED_CODE';
        } else if (error.code === 'InvalidPasswordException') {
            errorMessage = 'Password does not meet requirements';
            errorCode = 'INVALID_PASSWORD';
        }
        
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: { code: errorCode, message: errorMessage }
            })
        };
    }
}

async function getUserFromToken(accessToken) {
    const params = { AccessToken: accessToken };
    const result = await cognito.getUser(params).promise();
    
    const userInfo = { sub: result.Username };
    result.UserAttributes.forEach(attr => {
        userInfo[attr.Name] = attr.Value;
    });
    
    return userInfo;
}

async function updateLastLogin(userId) {
    const params = {
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
        UpdateExpression: 'SET #lastLogin = :lastLogin',
        ExpressionAttributeNames: { '#lastLogin': 'LastLoginAt' },
        ExpressionAttributeValues: { ':lastLogin': new Date().toISOString() }
    };
    
    try {
        await dynamodb.update(params).promise();
    } catch (error) {
        console.error('Failed to update last login:', error);
        // Don't fail the login if this update fails
    }
}

async function ensureUserProfile(userInfo) {
    const userId = userInfo.sub;
    
    // Check if user profile exists
    const getParams = {
        TableName: process.env.MAIN_TABLE,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' }
    };
    
    const existing = await dynamodb.get(getParams).promise();
    
    if (!existing.Item) {
        // Create user profile
        const now = new Date().toISOString();
        const userProfile = {
            PK: `USER#${userId}`,
            SK: 'PROFILE',
            GSI1PK: `USER#${userInfo.email}`,
            GSI1SK: 'PROFILE',
            EntityType: 'User',
            UserId: userId,
            Email: userInfo.email,
            FirstName: userInfo.given_name || '',
            LastName: userInfo.family_name || '',
            Role: userInfo['custom:role'] || 'Sales',
            Department: 'Sales',
            IsActive: true,
            CreatedAt: now,
            UpdatedAt: now,
            LastLoginAt: now,
            Preferences: {
                DefaultCurrency: 'USD',
                DefaultRegion: 'us-east-1',
                NotificationSettings: {
                    EmailNotifications: true,
                    DocumentReady: true,
                    SharedEstimations: true
                }
            },
            MFAEnabled: false
        };
        
        await dynamodb.put({
            TableName: process.env.MAIN_TABLE,
            Item: userProfile
        }).promise();
        
        console.log(`Created user profile for ${userInfo.email}`);
    }
}