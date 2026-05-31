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

export const setupInterceptors = (onLogout: () => void) => {
  authApi.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        
        if (originalRequest.url?.includes('/auth/refresh')) {
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
          await authApi.post('/auth/refresh');
          
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