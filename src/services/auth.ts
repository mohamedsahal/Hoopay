import api from './api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ENDPOINTS } from '../config/apiConfig';
import { logTokenInfo } from '../utils/jwtUtils';

declare const __DEV__: boolean;

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified: boolean;
  is_verified: boolean;
  referral_code: string;
  phone?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  referral_code?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface AuthResponse {
  success: boolean;
  user?: User | null;
  token?: string;
  message?: string;
  requiresVerification?: boolean;
  isVerified?: boolean;
  lastLoginAt?: string;
  email?: string;
  needs2FA?: boolean;
  recovery_codes_left?: number | null;
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const { data: response } = await api.post<ApiResponse>(ENDPOINTS.AUTH.REGISTER, userData);

      if (response.success) {
        const { user, token } = response.data || {};
        
        if (token) {
          await this.setToken(token);
          const sanitizedUser = this.sanitizeUserData(user);
          await SecureStore.setItemAsync('userData', JSON.stringify(sanitizedUser));
        }
        
        return {
          success: true,
          user: user || null,
          token: token || null,
          requiresVerification: !token,
        };
      }
      
      throw new Error(response.message || 'Registration failed');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
      }
      throw new Error(error.message || 'Registration failed');
    }
  }

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    try {
      // Store the email for potential fallback use
      await SecureStore.setItemAsync('userEmail', credentials.email);
      
      // Use the hardcoded endpoint path for maximum reliability
      const loginEndpoint = '/auth/login';
      console.log('Attempting login with endpoint:', loginEndpoint);
      
      // Add debugging for the full request URL
      console.log('Login credentials:', { email: credentials.email, password: '[REDACTED]' });
      
      // Make the login request with explicit URL construction to avoid path issues
      const { data: response } = await api.post<ApiResponse>(loginEndpoint, credentials);

      console.log('API Response:', 200, {
        config: { method: 'POST', url: loginEndpoint },
        data: response
      });

      if (response.success) {
        // Check for 2FA requirement FIRST
        if (response.data?.needs_2fa) {
          console.log('2FA required detected in success response');
          return {
            success: false,
            needs2FA: true,
            message: response.message || 'Two-factor authentication required',
            email: response.data?.email || credentials.email,
          };
        }
        
        // Extract user and token from the response
        const user = response.data?.user;
        const token = response.data?.token || response.data?.access_token;
        
        if (user && token) {
          // Save the token in the proper format expected by the backend
          await this.setToken(token);
          
          // Store the user data with sanitization
          const sanitizedUser = this.sanitizeUserData(user);
          await SecureStore.setItemAsync('userData', JSON.stringify(sanitizedUser));
          
          // Log token details for debugging in dev mode using safe JWT utilities
          if (__DEV__) {
            logTokenInfo(token, 'Login Token');
          }
          
          // Check if wallet information is included in the response
          const walletId = response.data?.wallet_id || response.data?.wallet?.id || null;
          const walletBalance = response.data?.wallet_balance || response.data?.wallet?.balance || null;
          
          // Log wallet information for debugging
          if (__DEV__) {
            console.log('Wallet information in login response:', { 
              hasWallet: !!walletId, 
              walletId,
              walletBalance 
            });
          }
          
          return {
            success: true,
            user: {
              ...user,
              walletId,
              walletBalance
            },
            token: token,
            isVerified: user?.email_verified || false,
            lastLoginAt: new Date().toISOString()
          };
        }
      } else if (response.message?.includes('not verified') || 
                 (response.errors && response.errors['email']?.includes('not verified'))) {
        // Handle unverified email case
        return {
          success: false,
          requiresVerification: true,
          message: response.message || 'Email not verified',
          email: credentials.email,
        };
      }

      return {
        success: false,
        message: response.message || 'Login failed'
      };

    } catch (error: any) {
      // Enhanced error logging
      if (__DEV__) {
        console.error('Login error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          originalError: error
        });
      }

      // Handle validation errors
      if (error.response?.status === 422) {
        const validationErrors = error.response.data?.errors;
        if (validationErrors) {
          const errorMessages = Object.values(validationErrors)
            .flat()
            .filter((msg): msg is string => typeof msg === 'string');
          
          if (errorMessages.length > 0) {
            throw new Error(errorMessages[0]);
          }
        }
      }

      // Handle other specific error cases
      switch (error.response?.status) {
        case 401:
          throw new Error('Invalid email or password');
        case 403:
          // Check for the specific 'Email not verified' response structure from Laravel
          if (error.response?.data?.message === 'Email not verified' || 
              error.response?.data?.errors?.needs_verification || 
              error.response?.data?.message?.includes('verify your email')) {
              
            // Get the email from the response if available
            const emailFromResponse = error.response?.data?.errors?.email;
              
            return {
              success: false,
              requiresVerification: true,
              email: emailFromResponse, // Store the email directly in the response
              user: null,
              message: 'Please verify your email before logging in.'
            };
          }
          throw new Error(error.response?.data?.message || 'Access denied');
        case 429:
          throw new Error('Too many login attempts. Please try again later.');
        default:
          throw new Error(error.message || 'Login failed. Please try again.');
      }
    }
  }

  async verify2FALogin(data: { email: string; code: string }): Promise<AuthResponse> {
    try {
      console.log('AuthService.verify2FALogin: Verifying 2FA for email:', data.email);
      
      const { data: response } = await api.post<ApiResponse>('/mobile/2fa/verify-login', {
        email: data.email,
        code: data.code
      });
      
      console.log('AuthService.verify2FALogin: API response received:', {
        success: response.success,
        hasToken: !!response.data?.token,
        hasUser: !!response.data?.user
      });
      
      if (response.success) {
        const { token, user } = response.data || {};
        
        if (user && token) {
          // Store auth data
          await this.setToken(token);
          await SecureStore.setItemAsync('userData', JSON.stringify(user));
          await SecureStore.setItemAsync('userEmail', user.email);
          
          console.log('AuthService.verify2FALogin: 2FA verification successful, data stored');
          
          return {
            success: true,
            token,
            user,
            message: response.message || '2FA verification successful'
          };
        }
      }
      
      return {
        success: false,
        message: response.message || '2FA verification failed'
      };
    } catch (error: any) {
      console.error('AuthService.verify2FALogin: Error occurred:', error);
      
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || '2FA verification failed'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      // Local logout only - no server notification
      console.log('Performing local logout only');
      
      // Clear the token from memory
      this.token = null;
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear the local session regardless of server response
      await this.clearSession();
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await SecureStore.getItemAsync('auth_token');
    }
    return this.token;
  }

  private async setToken(token: string): Promise<void> {
    this.token = token;
    await SecureStore.setItemAsync('auth_token', token);
  }

  // Public method for direct token setting (used by direct biometric auth)
  async setAuthToken(token: string): Promise<void> {
    return this.setToken(token);
  }

  private async clearSession(): Promise<void> {
    this.token = null;
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('userData');
    
    // Note: Biometric credentials are preserved during normal logout
    // They will be validated and cleared only if session becomes invalid
    console.log('AuthService: Preserving biometric credentials for next login');
  }

  private sanitizeUserData(userData: any): User {
    try {
      // Handle null or undefined input
      if (!userData || typeof userData !== 'object') {
        console.error('Invalid user data provided to AuthService sanitizeUserData:', userData);
        throw new Error('Invalid user data: cannot sanitize null or undefined');
      }

      // Validate essential properties exist
      if (!userData.id || !userData.email) {
        console.error('Missing essential user properties in AuthService:', userData);
        throw new Error('Invalid user data: missing id or email');
      }

      // Create a clean copy with only serializable data
      const sanitized: User = {
        id: userData.id,
        name: userData.name || '',
        email: userData.email,
        email_verified: userData.email_verified || false,
        is_verified: userData.is_verified || false,
        referral_code: userData.referral_code || '',
        phone: userData.phone || undefined,
      };

      // Add other properties that are serializable (using proper type handling)
      const additionalProps: Record<string, any> = {};
      Object.keys(userData).forEach(key => {
        if (key !== 'id' && key !== 'name' && key !== 'email' && key !== 'email_verified' && 
            key !== 'is_verified' && key !== 'referral_code' && key !== 'phone') {
          const value = userData[key];
          
          // Only include primitive values and simple objects
          if (value !== null && value !== undefined) {
            const type = typeof value;
            if (type === 'string' || type === 'number' || type === 'boolean') {
              additionalProps[key] = value;
            } else if (type === 'object' && !Array.isArray(value)) {
              // For objects, try to serialize them to check if they're valid
              try {
                JSON.stringify(value);
                additionalProps[key] = value;
              } catch (e) {
                console.warn(`Skipping non-serializable property: ${key}`);
              }
            } else if (Array.isArray(value)) {
              // For arrays, check if they're serializable
              try {
                JSON.stringify(value);
                additionalProps[key] = value;
              } catch (e) {
                console.warn(`Skipping non-serializable array property: ${key}`);
              }
            }
          }
        }
      });

      // Merge additional properties with the base user object
      return { ...sanitized, ...additionalProps };
    } catch (error) {
      console.error('Error sanitizing user data in AuthService:', error);
      
      // If we have at least some basic user data, try to create a minimal fallback
      if (userData && userData.id && userData.email) {
        return {
          id: userData.id,
          name: userData.name || '',
          email: userData.email,
          email_verified: userData.email_verified || false,
          is_verified: userData.is_verified || false,
          referral_code: userData.referral_code || '',
          phone: userData.phone || undefined,
        };
      }
      
      // If we can't create a fallback, throw the error up
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
  
  async getUser(): Promise<User | null> {
    try {
      // Get the token for authorization
      const token = await this.getToken();
      
      // First try the direct endpoint with absolutely no auth requirements
      try {
        console.log('Attempting to fetch user data from direct endpoint');
        const directResponse = await api.get('/api/direct/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        console.log('Successfully fetched user data from direct endpoint');
        console.log('Direct endpoint response:', JSON.stringify(directResponse.data));
        
        if (directResponse.data.success && directResponse.data.data?.user) {
          const userData = directResponse.data.data.user;
          // Sanitize and store the user data for offline use
          const sanitizedUserData = this.sanitizeUserData(userData);
          await SecureStore.setItemAsync('userData', JSON.stringify(sanitizedUserData));
          return sanitizedUserData;
        }
      } catch (error) {
        const directError = error as Error;
        console.log('Direct endpoint failed:', directError.message);
      }
      
      // Then try the debug endpoint 
      try {
        console.log('Attempting to fetch user data from debug endpoint');
        const debugResponse = await api.get('/api/debug/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        console.log('Successfully fetched user data from debug endpoint');
        
        if (debugResponse.data.success && debugResponse.data.data?.user) {
          const userData = debugResponse.data.data.user;
          // Sanitize and store the user data for offline use
          const sanitizedUserData = this.sanitizeUserData(userData);
          await SecureStore.setItemAsync('userData', JSON.stringify(sanitizedUserData));
          return sanitizedUserData;
        }
      } catch (debugError) {
        console.log('Debug endpoint failed, falling back to standard endpoint');
      }
      
      // Fall back to the original endpoint
      console.log('Attempting to fetch user data from auth/user endpoint');
      const response = await api.get(ENDPOINTS.AUTH.USER, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Successfully fetched user data from /api/auth/user');
      
      // Handle different response formats from Laravel
      let userData = null;
      
      if (response.data.success && response.data.data) {
        userData = response.data.data;
      } else if (response.data.success && response.data.user) {
        userData = response.data.user;
      } else if (response.data.user) {
        userData = response.data.user;
      } else if (typeof response.data === 'object') {
        userData = response.data;
      }
      
      if (userData) {
        // Sanitize user data before storing to prevent serialization errors
        const sanitizedUserData = this.sanitizeUserData(userData);
        console.log('Storing sanitized user data:', sanitizedUserData);
        
        await SecureStore.setItemAsync('userData', JSON.stringify(sanitizedUserData));
        return sanitizedUserData;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error fetching user data:', error.response?.status || error.message);
      
      // Try to get user from local storage as fallback
      try {
        const userStr = await SecureStore.getItemAsync('userData');
        if (userStr) {
          console.log('Successfully loaded user from local storage');
          return JSON.parse(userStr);
        }
      } catch (storageError) {
        console.error('Error getting user from storage:', storageError);
      }
      
      return null;
    }
  }

  async getStoredEmail(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('userEmail');
    } catch (error) {
      console.error('Error getting stored email:', error);
      return null;
    }
  }

  // Biometric authentication with local data
  async loginWithBiometric(biometricCredentials: any): Promise<AuthResponse> {
    try {
      console.log('Starting biometric authentication with local data');
      
      // Use the local user data from biometric credentials
      if (biometricCredentials.localUserData) {
        const localUser = biometricCredentials.localUserData;
        
        // Ensure we have valid user data
        if (!localUser.id || !localUser.email) {
          console.error('Invalid local user data:', localUser);
          return {
            success: false,
            message: 'Invalid biometric credentials. Please log in with your password to update biometric authentication.'
          };
        }
        
        // Create a user object from local data
        const user: User = {
          id: Number(localUser.id), // Ensure it's a number
          name: localUser.name || 'User',
          email: localUser.email,
          email_verified: true, // Assume verified for local auth
          is_verified: true,
          referral_code: '', // Will be fetched later if needed
          phone: localUser.phone || undefined
        };
        
        console.log('Created user object for biometric auth:', user);
        
        // Store the user data for session continuity (use sanitized data)
        const sanitizedUser = this.sanitizeUserData(user);
        console.log('Sanitized user for storage:', sanitizedUser);
        await SecureStore.setItemAsync('userData', JSON.stringify(sanitizedUser));
        await SecureStore.setItemAsync('userEmail', user.email);
        
        // For session-based biometric auth, try to restore the session token
        if (biometricCredentials.sessionBased && biometricCredentials.sessionToken) {
          await this.setToken(biometricCredentials.sessionToken);
          console.log('Session token restored from biometric credentials');
        }
        
        // Mark as successful biometric authentication
        console.log('Biometric authentication successful with local data');
        
        console.log('Returning user object from loginWithBiometric:', user);
        
        return {
          success: true,
          user: user,
          token: biometricCredentials.sessionToken || null,
          isVerified: true,
          lastLoginAt: new Date().toISOString()
        };
      }
      
      // Fallback for old-style credentials without local data
      return {
        success: false,
        message: 'Please log in with your password to update biometric authentication'
      };
      
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        message: error.message || 'Biometric authentication failed'
      };
    }
  }

  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: response } = await api.post<ApiResponse>('/api/mobile/resend-verification', { email });

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Verification code sent successfully'
        };
      }

      throw new Error(response.message || 'Failed to send verification code');
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to send verification code'
      };
    }
  }

  async verifyEmail(email: string, verificationCode: string): Promise<AuthResponse> {
    try {
      const { data: response } = await api.post<ApiResponse>('/api/mobile/verify-email', {
        email,
        verification_code: verificationCode
      });

      if (response.success) {
        const { user, token } = response.data || {};
        
        if (token && user) {
          await this.setToken(token);
          await SecureStore.setItemAsync('userData', JSON.stringify(user));
          
          return {
            success: true,
            user,
            token,
            message: response.message || 'Email verified successfully'
          };
        }
        
        return {
          success: true,
          message: response.message || 'Email verified successfully'
        };
      }

      throw new Error(response.message || 'Email verification failed');
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Email verification failed'
      };
    }
  }

  async checkVerificationStatus(email: string): Promise<{ success: boolean; data: any }> {
    try {
      const { data: response } = await api.get<ApiResponse>(`/api/mobile/verification-status?email=${encodeURIComponent(email)}`);

      return {
        success: response.success || false,
        data: response.data || {}
      };
    } catch (error: any) {
      return {
        success: false,
        data: { error: error.message }
      };
    }
  }
}

export const authService = AuthService.getInstance();
export default authService; 