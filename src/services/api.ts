import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ENDPOINTS } from '../config/apiConfig';

// API URLs configuration - Production URL
const API_URL = 'https://hoopaywallet.com';  // Base URL without /api
  
// Add /api as a path prefix to avoid double-inclusion in URLs
const API_PATH_PREFIX = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// Configure request transformation to handle API prefix
api.interceptors.request.use(function (config) {
  // Add /api prefix to all URLs that don't already have it
  if (config.url && !config.url.startsWith(API_PATH_PREFIX)) {
    config.url = `${API_PATH_PREFIX}${config.url}`;
  }
  return config;
});

// Declare __DEV__ variable for TypeScript
declare const __DEV__: boolean;

// Request interceptor for API calls
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const token = await SecureStore.getItemAsync('auth_token');
    
    // Create a new headers object
    const headers: Record<string, string> = { ...config.headers as Record<string, string> };
    
    // Set headers for all requests
    headers['Accept'] = 'application/json';
    
    // Add additional headers for file uploads if this is FormData
    if (config.data && config.data._parts) {
      headers['Cache-Control'] = 'no-cache';
      headers['Connection'] = 'keep-alive';
    }
    
    // Only set Content-Type to application/json if not already set or if not multipart/form-data
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    // For multipart uploads, remove Content-Type to let the browser/React Native set it automatically
    if (config.data && config.data._parts) {
      delete headers['Content-Type'];
    }
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      
      // Log request for debugging
      if (__DEV__) {
        const logData = config.data;
        const isFormData = logData && logData._parts;
        
                 console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
           data: isFormData ? { 
             _parts: `FormData with ${logData._parts.length} parts`,
             formDataKeys: logData._parts.map((part: any) => part[0])
           } : config.data,
          headers: {
            Accept: headers['Accept'],
            Authorization: token ? 'Bearer [TOKEN]' : 'None',
            'Content-Type': headers['Content-Type'] || 'undefined'
          },
          timeout: config.timeout,
          baseURL: config.baseURL
        });
      }
    }
    
    // Apply the updated headers
    config.headers = headers;
    
    return config;
  },
  (error: AxiosError) => {
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (__DEV__) {
      console.log(`API Response: ${response.status}`, {
        data: response.data,
        config: {
          url: response.config.url,
          method: response.config.method?.toUpperCase()
        }
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Log error responses in development
    if (error.response) {
      console.error(`❌ API Error (${error.response.status || 'Unknown'}):`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: originalRequest.url,
        method: originalRequest.method?.toUpperCase(),
        headers: {
          'Content-Type': originalRequest.headers?.['Content-Type'],
          'Authorization': originalRequest.headers?.['Authorization'] ? 'Bearer [TOKEN]' : 'None'
        }
      });
    } else if (error.request) {
      console.error('❌ API Error (No Response):', {
        message: error.message,
        code: error.code,
        url: originalRequest.url,
        method: originalRequest.method?.toUpperCase(),
        timeout: originalRequest.timeout,
        requestMade: 'Yes, but no response received'
      });
    } else {
      console.error('❌ API Error (Network):', {
        message: error.message,
        code: error.code,
        name: error.name,
        url: originalRequest?.url,
        method: originalRequest?.method?.toUpperCase()
      });
    }
    
    // Handle 401 responses (authentication errors)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Token refresh could be implemented here if needed
    }
    
    // Special handling for 500 errors with the fixed endpoints
    if (error.response?.status === 500 && originalRequest.url) {
      const url = originalRequest.url.toString();
      
      // If one of our fixed endpoints has an error, log it specially
      if (
        url.includes('/api/profile') || 
        url.includes('/api/auth/user')
      ) {
        console.warn(`Error with fixed endpoint ${url}:`, error.response.data);
      }
    }
    
    return Promise.reject(error);
  }
);

// Export a helper function for auth API calls
export const authApi = {
  // Get current user data from /api/auth/user endpoint
  getUser: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return null;
      
      console.log('Fetching user data from /api/auth/user');
      return await api.get(ENDPOINTS.AUTH.USER, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error in authApi.getUser:', error);
      throw error;
    }
  },
  
  // Logout user - local only implementation
  logout: async () => {
    try {
      // Clear local storage for reliable logout
      console.log('Performing local logout');
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('userData');
      
      console.log('Local logout completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Unexpected error in authApi.logout:', error);
      
      // Final safety net - try once more to clear tokens if something unexpected happened
      try {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('userData');
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
      
      // Return success even if server call failed but we cleared local storage
      return { success: true, message: 'Logged out locally' };
    }
  },
  
  // Get profile data from /api/profile endpoint
  getProfile: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return null;
      
      console.log('Fetching profile data from /api/profile');
      return await api.get(ENDPOINTS.PROFILE.GET, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        timeout: 8000 // Reasonable timeout
      });
    } catch (error) {
      console.error('Error in authApi.getProfile:', error);
      throw error;
    }
  }
};

export default api;