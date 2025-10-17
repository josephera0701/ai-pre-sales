import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    // Check for existing session on app load
    const initializeAuth = async () => {
      try {
        const savedTokens = localStorage.getItem('authTokens');
        if (savedTokens) {
          const parsedTokens = JSON.parse(savedTokens);
          
          // Validate token expiration
          if (isTokenValid(parsedTokens.accessToken)) {
            setTokens(parsedTokens);
            const userProfile = await authService.getUserProfile(parsedTokens.accessToken);
            setUser(userProfile);
          } else {
            // Try to refresh token
            try {
              const refreshedTokens = await authService.refreshToken(parsedTokens.refreshToken);
              setTokens(refreshedTokens);
              localStorage.setItem('authTokens', JSON.stringify(refreshedTokens));
              
              const userProfile = await authService.getUserProfile(refreshedTokens.accessToken);
              setUser(userProfile);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              localStorage.removeItem('authTokens');
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('authTokens');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password, rememberMe);
      
      const newTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        idToken: response.idToken,
        expiresIn: response.expiresIn,
        tokenType: response.tokenType
      };
      
      setTokens(newTokens);
      setUser(response.user);
      
      // Store tokens based on rememberMe preference
      if (rememberMe) {
        localStorage.setItem('authTokens', JSON.stringify(newTokens));
      } else {
        sessionStorage.setItem('authTokens', JSON.stringify(newTokens));
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (tokens?.accessToken) {
        await authService.logout(tokens.accessToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if server logout fails
    } finally {
      setUser(null);
      setTokens(null);
      localStorage.removeItem('authTokens');
      sessionStorage.removeItem('authTokens');
    }
  };

  const resetPassword = async (email) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error(error.response?.data?.error?.message || 'Password reset failed');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }
      
      const updatedUser = await authService.updateProfile(profileData, tokens.accessToken);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw new Error(error.response?.data?.error?.message || 'Profile update failed');
    }
  };

  const refreshAuthToken = async () => {
    try {
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const refreshedTokens = await authService.refreshToken(tokens.refreshToken);
      setTokens(refreshedTokens);
      
      // Update stored tokens
      const storage = localStorage.getItem('authTokens') ? localStorage : sessionStorage;
      storage.setItem('authTokens', JSON.stringify(refreshedTokens));
      
      return refreshedTokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await logout();
      throw new Error('Session expired. Please login again.');
    }
  };

  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  };

  const getAuthHeaders = () => {
    if (!tokens?.accessToken) {
      return {};
    }
    
    return {
      'Authorization': `${tokens.tokenType} ${tokens.accessToken}`,
      'Content-Type': 'application/json'
    };
  };

  const value = {
    user,
    tokens,
    loading,
    login,
    logout,
    resetPassword,
    updateProfile,
    refreshAuthToken,
    getAuthHeaders,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}