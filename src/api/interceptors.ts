import { authApi } from './client';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export interface InterceptorConfig {
  onLogout: () => void;
  enableRefresh?: boolean;
  refreshEndpoint?: string;
}

export const setupInterceptors = ({ 
  onLogout, 
  enableRefresh = false, 
  refreshEndpoint = '/auth/refresh' 
}: InterceptorConfig) => {
  
  // Clear any existing interceptors to prevent memory leaks during hot-reloads
  authApi.interceptors.response.clear();

  authApi.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // 1. The Login Bypass: Let UI handle invalid credentials
      if (originalRequest.url?.includes('/login') || originalRequest.url?.includes('/register')) {
        return Promise.reject(error);
      }

      // 2. Catch 401 Unauthorized errors
      if (error.response?.status === 401 && !originalRequest._retry) {
        
        // FORK A: The server does NOT support refresh tokens
        if (!enableRefresh) {
          onLogout();
          return Promise.reject(error);
        }

        // FORK B: The server DOES support refresh tokens
        if (originalRequest.url?.includes(refreshEndpoint)) {
          onLogout();
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            return authApi(originalRequest);
          }).catch((err) => {
            return Promise.reject(err);
          });
        }

        isRefreshing = true;

        try {
          await authApi.post(refreshEndpoint);
          processQueue(null);
          return authApi(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          onLogout(); 
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};