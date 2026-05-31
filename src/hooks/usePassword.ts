import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/client';
import { safeRequest } from '../utils/safeRequest';
import { ForgotPasswordFormData, ResetPasswordFormData } from '../schemas/authSchemas';

// 1. Define the dual-configuration interface
export interface PasswordHookOptions {
  requestEndpoint?: string;
  requestMethod?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  resetEndpoint?: string;
  resetMethod?: 'get' | 'post' | 'put' | 'patch' | 'delete';
}

export const usePassword = (options?: PasswordHookOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  const requestEndpoint = options?.requestEndpoint || '/auth/forgot-password';
  const requestMethod = options?.requestMethod || 'post';

  const resetEndpoint = options?.resetEndpoint || '/auth/reset-password';
  const resetMethod = options?.resetMethod || 'post';

  const requestReset = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    const requestPromise = requestMethod === 'get'
      ? authApi.get(requestEndpoint, { params: data })
      : authApi[requestMethod](requestEndpoint, data);

    const { error: apiError } = await safeRequest(requestPromise);

    setIsLoading(false);

    if (apiError) {
      setError(apiError);
      return { success: false, error: apiError };
    }

    return { success: true };
  };

  const resetPassword = async (data: ResetPasswordFormData & { email: string; otp: string }) => {
    setIsLoading(true);
    setError(null);

    const payload = {
      email: data.email,
      otp: data.otp,
      password: data.password,
    };

    const requestPromise = resetMethod === 'get'
      ? authApi.get(resetEndpoint, { params: payload })
      : authApi[resetMethod](resetEndpoint, payload);

    const { data: responseData, error: apiError } = await safeRequest(requestPromise);

    setIsLoading(false);

    if (apiError) {
      setError(apiError);
      return { success: false, error: apiError };
    }

    if (responseData?.user) {
      setSession(responseData.user);
    }

    return { success: true };
  };

  const resetError = () => setError(null);

  return { requestReset, resetPassword, isLoading, error, resetError };
};