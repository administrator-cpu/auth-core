import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { setupInterceptors } from '../api/interceptors';
import { authApi } from '../api/client';

export interface AuthHookOptions {
  endpoint?: string;
  enableRefresh?: boolean;
  refreshEndpoint?: string;
}

export const useAuth = (options?: AuthHookOptions) => {
  const { user, isAuthenticated, isInitialized, clearSession } = useAuthStore();
  
  const endpoint = options?.endpoint || '/users/me';
  const enableRefresh = options?.enableRefresh ?? false;
  const refreshEndpoint = options?.refreshEndpoint || '/users/refresh';

  useEffect(() => {
    setupInterceptors({
      onLogout: clearSession,
      enableRefresh,
      refreshEndpoint
    });

    const initAuth = async () => {
      try {
        const response = await authApi.get(endpoint);
        useAuthStore.getState().setSession(response.data.user);
      } catch (error) {
        useAuthStore.getState().clearSession();
      }
    };

    if (!isInitialized) {
      initAuth();
    }
  }, [isInitialized, endpoint, enableRefresh, refreshEndpoint, clearSession]);

  return { user, isAuthenticated, isInitialized, clearSession };
};