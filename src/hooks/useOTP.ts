import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/client';
import { OTPFormData } from '../schemas/authSchemas';
import { safeRequest } from '../utils/safeRequest';

export interface OTPHookOptions {
  verifyEndpoint?: string;
  verifyMethod?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  resendEndpoint?: string;
  resendMethod?: 'get' | 'post' | 'put' | 'patch' | 'delete';
}

export const useOTP = (options?: OTPHookOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  const verifyEndpoint = options?.verifyEndpoint || '/auth/verify-otp';
  const verifyMethod = options?.verifyMethod || 'post';
  
  const resendEndpoint = options?.resendEndpoint || '/user/resend-otp';
  const resendMethod = options?.resendMethod || 'post';

  const verifyOTP = async (data: OTPFormData & { email: string }) => {
    setIsLoading(true);
    setError(null);

    const requestPromise = verifyMethod === 'get'
      ? authApi.get(verifyEndpoint, { params: data })
      : authApi[verifyMethod](verifyEndpoint, data);

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

  const resendOTP = async (email: string) => {
    setIsLoading(true);
    setError(null);

    const requestPromise = resendMethod === 'get'
      ? authApi.get(resendEndpoint, { params: { email } })
      : authApi[resendMethod](resendEndpoint, { email });

    const { error: apiError } = await safeRequest(requestPromise);

    setIsLoading(false);

    if (apiError) {
      setError(apiError);
      return { success: false, error: apiError };
    }

    return { success: true };
  };

  const resetError = () => setError(null);

  return { verifyOTP, resendOTP, isLoading, error, resetError };
};