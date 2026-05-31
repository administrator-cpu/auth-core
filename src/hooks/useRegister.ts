import { useState } from 'react';
import { authApi } from '../api/client';
import { RegisterFormData } from '../schemas/authSchemas';
import { safeRequest } from '../utils/safeRequest';

// 1. Define the configuration interface
export interface RegisterHookOptions {
  endpoint?: string;
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
}

export const useRegister = (options?: RegisterHookOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Set industry-standard defaults
  const endpoint = options?.endpoint || '/auth/register';
  const method = options?.method || 'post';

  const register = async (userData: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    const requestPromise = method === 'get'
      ? authApi.get(endpoint, { params: userData })
      : authApi[method](endpoint, userData);

    const { error: apiError } = await safeRequest(requestPromise);

    setIsLoading(false);

    if (apiError) {
      setError(apiError);
      return { success: false, error: apiError };
    }

    return { success: true };
  };

  const resetError = () => setError(null);

  return { register, isLoading, error, resetError };
};