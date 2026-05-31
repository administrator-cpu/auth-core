import { create } from 'zustand';
import { setupInterceptors } from '../api/interceptors';
import { User } from '../types'; 

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  setSession: (user: User) => void;
  clearSession: () => void;
  setInitialized: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setSession: (user: User) => set({ user, isAuthenticated: true, isInitialized: true }),
  
  clearSession: () => set({ user: null, isAuthenticated: false, isInitialized: true }),
  
  setInitialized: (status: boolean) => set({ isInitialized: status }),
}));

setupInterceptors(useAuthStore.getState().clearSession);