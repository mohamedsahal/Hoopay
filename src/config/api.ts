import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { sessionExpiryHandler } from '../services/sessionExpiryHandler';

// Production Base URL
export const BASE_URL = 'https://hoopaywallet.com';

// Debug flag
const DEBUG = __DEV__;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Production headers
    'User-Agent': 'HoopayMobileApp/1.0',
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
        // Skip path fixes for auth endpoints - these should go directly without additional /api prefix
        if (config.url.includes('auth/login')) {
          // For /auth/login endpoint, make sure it has the correct format but don't add /api prefix
          if (!config.url.startsWith('/')) {
            config.url = '/' + config.url;
          }
          // Don't modify auth login endpoint further - it should go to /auth/login directly
        } else if (config.url.includes('/api/mobile/')) {
          // For /api/mobile/* endpoints, they already have the full path, don't modify them
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

    // Handle 401 Unauthorized errors (session expiration)
    if (error.response?.status === 401) {
      // Only handle session expiry if this isn't an auth endpoint and we're not already retrying
      const isAuthEndpoint = originalRequest.url?.includes('auth/login') || 
                             originalRequest.url?.includes('auth/register');
      
      if (!isAuthEndpoint && !originalRequest._retry) {
        const token = await SecureStore.getItemAsync('auth_token');
        
        if (token) {
          // We have a token but got 401 - session has expired
          console.log('Session expired - handling with session expiry handler');
          
          // Use the session expiry handler to clear data and redirect to login
          await sessionExpiryHandler.handleSessionExpiry(false); // No alert, just redirect
          
          // Mark this request as handled to prevent retry loops
          originalRequest._retry = true;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api; 