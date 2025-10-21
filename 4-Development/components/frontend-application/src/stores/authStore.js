import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_ENDPOINT || 'https://9u3ohhh561.execute-api.us-east-1.amazonaws.com/staging';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user 
  }),
  
  login: async (email, password, rememberMe = false) => {
    set({ loading: true });
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
        rememberMe
      });
      
      if (response.data.success) {
        const { accessToken, user } = response.data.data;
        localStorage.setItem('authToken', accessToken);
        set({ 
          user, 
          isAuthenticated: true,
          loading: false 
        });
        return { success: true };
      }
    } catch (error) {
      set({ loading: false });
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Login failed' 
      };
    }
  },
  
  logout: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      set({ 
        user: null, 
        isAuthenticated: false
      });
    }
  },
  
  resetPassword: async (email) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email
      });
      return { 
        success: response.data.success,
        message: response.data.message 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Password reset failed' 
      };
    }
  },
  
  hasRole: (role) => {
    const { user } = get();
    return user?.role === role || user?.role === 'Admin';
  }
}));