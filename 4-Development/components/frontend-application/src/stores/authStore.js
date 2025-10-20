import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user 
  }),
  
  logout: () => set({ 
    user: null, 
    isAuthenticated: false
  }),
  
  hasRole: (role) => {
    const { user } = get();
    return user?.role === role || user?.role === 'admin';
  }
}));