import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/client';
import { safeRequest } from '../utils/safeRequest';

export interface AuthHookOptions {
  endpoint?: string;
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
}

export const useAuth = (options?: AuthHookOptions) => {
  const { 
    user, 
    isAuthenticated, 
    isInitialized, 
    setSession, 
    setInitialized, 
    clearSession 
  } = useAuthStore();

  const endpoint = options?.endpoint || '/auth/me';
  const method = options?.method || 'get';

  useEffect(() => {
    const checkSession = async () => {
      if (isInitialized) return;

      const requestPromise = method === 'get' 
        ? authApi.get(endpoint) 
        : authApi[method](endpoint);

      // 4. Use your safeRequest wrapper for clean error handling
      const { data, error } = await safeRequest(requestPromise);

      if (error || !data?.user) {
         setInitialized(true);
        return;
      }

      setSession(data.user);
    };

    checkSession();
  }, [isInitialized, setSession, setInitialized, endpoint, method]);

  return { 
    user, 
    isAuthenticated, 
    isInitialized, 
    clearSession 
  };
};