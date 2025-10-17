import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.aws-cost-estimation.sagesoft.com';

class AuthService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add auth headers
    this.apiClient.interceptors.request.use(
      (config) => {
        const tokens = this.getStoredTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `${tokens.tokenType} ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const tokens = this.getStoredTokens();
            if (tokens?.refreshToken) {
              const refreshedTokens = await this.refreshToken(tokens.refreshToken);
              this.storeTokens(refreshedTokens);
              
              originalRequest.headers.Authorization = `${refreshedTokens.tokenType} ${refreshedTokens.accessToken}`;
              return this.apiClient(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            this.clearStoredTokens();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async login(email, password, rememberMe = false) {
    try {
      const response = await this.apiClient.post('/auth/login', {
        email,
        password,
        rememberMe
      });
      
      if (response.data.success) {
        const tokens = {
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
          idToken: response.data.data.idToken,
          expiresIn: response.data.data.expiresIn,
          tokenType: response.data.data.tokenType
        };
        
        this.storeTokens(tokens, rememberMe);
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login service error:', error);
      throw error;
    }
  }

  async logout(accessToken) {
    try {
      await this.apiClient.post('/auth/logout', {
        accessToken
      });
    } catch (error) {
      console.error('Logout service error:', error);
      // Don't throw error for logout - continue with local cleanup
    } finally {
      this.clearStoredTokens();
    }
  }

  async refreshToken(refreshToken) {
    try {
      const response = await this.apiClient.post('/auth/refresh', {
        refreshToken
      });
      
      if (response.data.success) {
        const tokens = {
          accessToken: response.data.data.accessToken,
          idToken: response.data.data.idToken,
          expiresIn: response.data.data.expiresIn,
          tokenType: response.data.data.tokenType,
          refreshToken // Keep the same refresh token
        };
        
        return tokens;
      } else {
        throw new Error(response.data.error?.message || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh service error:', error);
      throw error;
    }
  }

  async resetPassword(email, newPassword = null, confirmationCode = null) {
    try {
      const response = await this.apiClient.post('/auth/reset-password', {
        email,
        newPassword,
        confirmationCode
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset service error:', error);
      throw error;
    }
  }

  async getUserProfile(accessToken) {
    try {
      const response = await this.apiClient.get('/users/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to get user profile');
      }
    } catch (error) {
      console.error('Get user profile service error:', error);
      throw error;
    }
  }

  async updateProfile(profileData, accessToken) {
    try {
      const response = await this.apiClient.put('/users/me', profileData, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (response.data.success) {
        return response.data.data.user;
      } else {
        throw new Error(response.data.error?.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Update profile service error:', error);
      throw error;
    }
  }

  // Token storage utilities
  storeTokens(tokens, persistent = false) {
    const storage = persistent ? localStorage : sessionStorage;
    storage.setItem('authTokens', JSON.stringify(tokens));
  }

  getStoredTokens() {
    try {
      const tokens = localStorage.getItem('authTokens') || sessionStorage.getItem('authTokens');
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      console.error('Error parsing stored tokens:', error);
      return null;
    }
  }

  clearStoredTokens() {
    localStorage.removeItem('authTokens');
    sessionStorage.removeItem('authTokens');
  }

  isTokenValid(token) {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  getAuthHeaders() {
    const tokens = this.getStoredTokens();
    if (!tokens?.accessToken) {
      return {};
    }
    
    return {
      'Authorization': `${tokens.tokenType} ${tokens.accessToken}`,
      'Content-Type': 'application/json'
    };
  }
}

export const authService = new AuthService();