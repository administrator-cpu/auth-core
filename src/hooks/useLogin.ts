import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/client';
import { LoginFormData } from '../schemas/authSchemas';
import { safeRequest } from '../utils/safeRequest';

export interface AuthHookOptions {
  endpoint?: string;
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
}

export const useLogin = (options?: AuthHookOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  const endpoint = options?.endpoint || '/auth/login';
  const method = options?.method || 'post';

  const login = async (credentials: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    const requestPromise = method === 'get' 
      ? authApi.get(endpoint, { params: credentials })
      : authApi[method](endpoint, credentials);

    const { data, error: apiError } = await safeRequest(requestPromise);

    setIsLoading(false);

    if (apiError) {
      setError(apiError);
      return { success: false, error: apiError };
    }

    setSession(data.user);
    return { success: true };
  };

  const resetError = () => setError(null);

  return { login, isLoading, error, resetError };
};