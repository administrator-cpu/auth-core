import { AxiosError, AxiosResponse } from 'axios';

type SafeResponse<T> = 
  | { data: T; error: null }
  | { data: null; error: string };

export const safeRequest = async <T>(promise: Promise<AxiosResponse<T>>): Promise<SafeResponse<T>> => {
  try {
    const response = await promise;
    return { data: response.data, error: null };
  } catch (err) {
    const axiosError = err as AxiosError<{ message?: string }>;
    const errorMessage = axiosError.response?.data?.message || 'An unexpected error occurred. Please try again.';
    
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]:', errorMessage, err);
    }

    return { data: null, error: errorMessage };
  }
};