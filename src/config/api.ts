import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Production Base URL
export const BASE_URL = 'https://a0b0-102-217-123-227.ngrok-free.app';

// Debug flag
const DEBUG = __DEV__;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Utility function to fix paths that might have extra /api prefix
const fixApiPath = (path: string) => {
  // First, normalize the path by removing any starting /api if it exists
  let normalizedPath = path;
  if (normalizedPath.startsWith('/api/')) {
    normalizedPath = normalizedPath.substring(4); // Remove '/api'
  }
  
  // Make sure it starts with a slash
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }
  
  // Now add the /api prefix consistently
  return `/api${normalizedPath}`;
};

// Request interceptor for API calls
api.interceptors.request.use(
  async (config) => {
    try {
      // Get token from secure storage
      const token = await SecureStore.getItemAsync('auth_token');
      
      // Only log in development mode
      if (DEBUG) {
        console.log('API Request:', config.method?.toUpperCase(), config.url, {
          data: config.data,
          headers: {
            ...config.headers,
            Authorization: token ? 'Bearer [TOKEN]' : undefined
          }
        });
      }
      
      // Add auth token if available
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Handle API path fixes
      if (config.url) {
        // Skip path fixes for auth endpoints
        if (config.url.includes('auth/login') || config.url.includes('/auth/register')) {
          // For auth endpoints, make sure they have the correct format
          if (!config.url.startsWith('/')) {
            config.url = '/' + config.url;
          }
        } else {
          // For all other endpoints (especially profile), ensure we have the correct API path
          config.url = fixApiPath(config.url);
          
          // Debug specific endpoints
          if (DEBUG && config.url.includes('profile')) {
            console.log('Profile request URL:', config.url);
          }
        }
      }
      
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (DEBUG) {
      console.log('API Response:', response.status, {
        config: {
          method: response.config.method,
          url: response.config.url
        },
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log API errors
    if (DEBUG && error.response) {
      console.error(`API Error (${error.response.status}):`, {
        data: error.response.data,
        headers: originalRequest.headers,
        method: originalRequest.method,
        url: originalRequest.url
      });
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Only logout if this isn't an auth endpoint and we're not already retrying
      const isAuthEndpoint = originalRequest.url?.includes('auth/login') || 
                             originalRequest.url?.includes('auth/register');
      
      if (!isAuthEndpoint && !originalRequest._retry) {
        // For login failures, don't log out automatically
        // For other 401 errors, check if we're logged in and need to refresh
        const token = await SecureStore.getItemAsync('auth_token');
        
        if (token) {
          // We have a token but got 401 - it might be expired
          // You could implement token refresh logic here if your API supports it
          
          // For now, we'll only log the user out on profile page or after a certain time threshold
          // Don't automatically log out on profile requests - this is causing refresh logout issues
          // Instead, only log out for specific endpoints that indicate critical auth failures
          const isCriticalEndpoint = originalRequest.url?.includes('/logout') || 
                                    originalRequest.url?.includes('/auth/status');
          
          // If this is a profile request, just log the error but don't log out
          if (originalRequest.url?.includes('/profile')) {
            console.log('Profile request failed with 401, but not logging out');
            // Don't logout on profile errors - these could be transient
          } else if (isCriticalEndpoint) {
            console.log('Session expired on critical endpoint, logging out...');
            // Clear auth data
            await SecureStore.deleteItemAsync('auth_token');
            await SecureStore.deleteItemAsync('userData');
            // You'd typically need to navigate to login here or update your auth state
            // This would be handled by your app's state management
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api; 