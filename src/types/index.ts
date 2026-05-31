
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  [key: string]: any; 
}

export interface AuthResponse {
  user: User;
  message?: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}