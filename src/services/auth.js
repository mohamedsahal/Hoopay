import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from './api';
import { ENDPOINTS } from '../config/apiConfig';

/**
 * Mobile-specific authentication service
 */
export const authService = {
  /**
   * Login user with email and password
   * @param {Object} credentials - Email and password
   * @returns {Promise<Object>} Login response
   */
  login: async (credentials) => {
    try {
      console.log('🔥 AuthService.login: STARTING LOGIN FUNCTION with credentials:', {
        email: credentials.email,
        hasPassword: !!credentials.password
      });
      
      console.log('AuthService.login: Attempting login with email:', credentials.email);
      
      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password
      });
      
      console.log('AuthService.login: API response received:', {
        success: response.data.success,
        hasToken: !!response.data.data?.token,
        hasUser: !!response.data.data?.user,
        needs2FA: !!response.data.data?.needs_2fa,
        needsVerification: !!response.data.data?.needs_verification,
        fullResponseData: response.data.data
      });
      
      if (response.data.success) {
        console.log('AuthService.login: Response success=true, checking for 2FA...');
        console.log('AuthService.login: response.data.data.needs_2fa =', response.data.data.needs_2fa);
        
        // Check if 2FA is required
        if (response.data.data.needs_2fa) {
          console.log('AuthService.login: 2FA detected, returning needs2FA response');
          const twoFAResponse = {
            success: false,
            needs2FA: true,
            email: response.data.data.email,
            message: response.data.message || 'Two-factor authentication required'
          };
          console.log('AuthService.login: Returning 2FA response:', twoFAResponse);
          return twoFAResponse;
        }
        
        // Check if email verification is required
        if (response.data.data.needs_verification) {
          return {
            success: false,
            requiresVerification: true,
            email: response.data.data.email,
            message: response.data.message || 'Email verification required'
          };
        }
        
        // Normal successful login
        const { token, user } = response.data.data;
        
        // Store auth data
        await SecureStore.setItemAsync('auth_token', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(user));
        await SecureStore.setItemAsync('userEmail', user.email);
        
        console.log('AuthService.login: Login successful, data stored');
        
        return {
          success: true,
          token,
          user,
          message: response.data.message
        };
      } else {
        console.log('AuthService.login: Login failed:', response.data.message);
        return {
          success: false,
          message: response.data.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('AuthService.login: Error occurred:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors
        if (error.response.status === 422 && errorData.data) {
          return {
            success: false,
            message: errorData.message || 'Validation failed',
            errors: errorData.data
          };
        }
        
        // Handle email verification requirement
        if (error.response.status === 403 && errorData.data?.needs_verification) {
          return {
            success: false,
            requiresVerification: true,
            email: errorData.data.email,
            message: errorData.message || 'Email verification required'
          };
        }
        
        // Handle 2FA requirement
        if (errorData.data?.needs_2fa) {
          return {
            success: false,
            needs2FA: true,
            email: errorData.data.email,
            message: errorData.message || 'Two-factor authentication required'
          };
        }
        
        return {
          success: false,
          message: errorData.message || 'Login failed'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  },

  /**
   * Verify 2FA code during login
   * @param {Object} data - Email and 2FA code
   * @returns {Promise<Object>} Verification response
   */
  verify2FALogin: async (data) => {
    try {
      console.log('AuthService.verify2FALogin: Verifying 2FA for email:', data.email);
      
      const response = await api.post('/mobile/2fa/verify-login', {
        email: data.email,
        code: data.code
      });
      
      console.log('AuthService.verify2FALogin: API response received:', {
        success: response.data.success,
        hasToken: !!response.data.data?.token,
        hasUser: !!response.data.data?.user
      });
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Store auth data
        await SecureStore.setItemAsync('auth_token', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(user));
        await SecureStore.setItemAsync('userEmail', user.email);
        
        console.log('AuthService.verify2FALogin: 2FA verification successful, data stored');
        
        return {
          success: true,
          token,
          user,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message || '2FA verification failed'
        };
      }
    } catch (error) {
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
  },

  /**
   * Logout user
   * - Makes API call to logout endpoint (if possible)
   * - Clears all local tokens and auth data
   * - Returns success even if API fails but local tokens are cleared
   */
  logout: async () => {
    try {
      // Get the auth token
      const token = await SecureStore.getItemAsync('auth_token');
      
      // Clear all local auth data first to ensure the user can always log out
      await Promise.all([
        SecureStore.deleteItemAsync('auth_token'),
        SecureStore.deleteItemAsync('userData'),
        SecureStore.deleteItemAsync('biometricEnabled'),
        SecureStore.deleteItemAsync('userEmail')
      ]);
      
      console.log('Local auth data cleared');
      
      // Return success after local logout
      console.log('Local logout completed successfully');
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Error in authService.logout:', error);
      throw error;
    }
  },
  
  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} True if authenticated
   */
  isAuthenticated: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration response
   */
  register: async (userData) => {
    try {
      console.log('AuthService.register: Starting registration with data:', {
        email: userData.email,
        name: userData.name,
        hasPassword: !!userData.password,
        hasPasswordConfirmation: !!userData.password_confirmation,
        hasReferralCode: !!userData.referral_code
      });
      
      // Use the working /api/mobile/register endpoint
      // This is the endpoint that's actually working on the backend
      const response = await api.post('/api/mobile/register', {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.password_confirmation,
        referral_code: userData.referral_code || null,
      });
      
      console.log('AuthService.register: API response received:', {
        success: response.data.success,
        hasToken: !!response.data.data?.token,
        hasUser: !!response.data.data?.user,
        message: response.data.message
      });
      
      if (response.data.success) {
        const { token, user } = response.data.data || {};
        
        if (token && user) {
          // Immediate login after successful registration
          await SecureStore.setItemAsync('auth_token', token);
          await SecureStore.setItemAsync('userData', JSON.stringify(user));
          await SecureStore.setItemAsync('userEmail', user.email);
          
          console.log('AuthService.register: Registration successful with immediate login');
          
          return {
            success: true,
            token,
            user,
            requiresVerification: false,
            message: response.data.message || 'Registration successful'
          };
        } else {
          // Registration successful but requires verification
          console.log('AuthService.register: Registration successful, email verification required');
          await SecureStore.setItemAsync('userEmail', userData.email);
          
          return {
            success: true,
            requiresVerification: true,
            email: userData.email,
            message: response.data.message || 'Registration successful. Please verify your email.'
          };
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('AuthService.register: Error occurred:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors (422)
        if (error.response.status === 422 && errorData.errors) {
          const validationErrors = errorData.errors;
          let errorMessage = 'Validation failed: ';
          
          // Extract first error message
          const firstField = Object.keys(validationErrors)[0];
          const firstError = validationErrors[firstField];
          errorMessage += Array.isArray(firstError) ? firstError[0] : firstError;
          
          return {
            success: false,
            message: errorMessage,
            errors: validationErrors
          };
        }
        
        return {
          success: false,
          message: errorData.message || 'Registration failed'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Network error occurred during registration'
      };
    }
  },

  /**
   * Verify email with verification code
   * @param {string} email - User email
   * @param {string} code - Verification code
   * @returns {Promise<Object>} Verification response
   */
  verifyEmail: async (email, code) => {
    try {
      console.log('AuthService.verifyEmail: Verifying email for:', email);
      
      const response = await api.post('/api/mobile/verify-email', {
        email,
        verification_code: code
      });
      
      console.log('AuthService.verifyEmail: API response received:', {
        success: response.data.success,
        hasToken: !!response.data.data?.token,
        hasUser: !!response.data.data?.user
      });
      
      if (response.data.success) {
        const { token, user } = response.data.data || {};
        
        if (token && user) {
          // Store auth data after verification
          await SecureStore.setItemAsync('auth_token', token);
          await SecureStore.setItemAsync('userData', JSON.stringify(user));
          await SecureStore.setItemAsync('userEmail', user.email);
          
          console.log('AuthService.verifyEmail: Email verification successful with login');
          
          return {
            success: true,
            token,
            user,
            message: response.data.message || 'Email verified successfully'
          };
        } else {
          return {
            success: true,
            message: response.data.message || 'Email verified successfully. Please log in.'
          };
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Email verification failed'
        };
      }
    } catch (error) {
      console.error('AuthService.verifyEmail: Error occurred:', error);
      
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Email verification failed'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Network error occurred during verification'
      };
    }
  },

  /**
   * Resend email verification code
   * @param {string} email - User email
   * @returns {Promise<Object>} Resend response
   */
  resendVerificationEmail: async (email) => {
    try {
      console.log('AuthService.resendVerificationEmail: Resending code for:', email);
      
      const response = await api.post('/api/mobile/resend-verification', {
        email
      });
      
      console.log('AuthService.resendVerificationEmail: API response received:', {
        success: response.data.success,
        message: response.data.message
      });
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Verification code sent to your email'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to resend verification code'
        };
      }
    } catch (error) {
      console.error('AuthService.resendVerificationEmail: Error occurred:', error);
      
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Failed to resend verification code'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  },

  /**
   * Get stored email from secure storage
   * @returns {Promise<string|null>} Stored email or null
   */
  getStoredEmail: async () => {
    try {
      return await SecureStore.getItemAsync('userEmail');
    } catch (error) {
      console.error('Error getting stored email:', error);
      return null;
    }
  },

  /**
   * Forgot password - send reset email (Legacy method)
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset response
   */
  forgotPassword: async (email) => {
    try {
      console.log('AuthService.forgotPassword: Sending reset email for:', email);
      
      const response = await api.post('/auth/reset-password', {
        email
      });
      
      console.log('AuthService.forgotPassword: API response received:', {
        success: response.data.success,
        message: response.data.message
      });
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Password reset email sent'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to send reset email'
        };
      }
    } catch (error) {
      console.error('AuthService.forgotPassword: Error occurred:', error);
      
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Failed to send reset email'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  },

  /**
   * Comprehensive Password Reset System
   */

  /**
   * Step 1: Request password reset - Send verification code to email
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset request response
   */
  requestPasswordReset: async (email) => {
    try {
      console.log('AuthService.requestPasswordReset: Requesting reset for:', email);
      
      const response = await api.post(ENDPOINTS.FORGOT_PASSWORD.REQUEST, {
        email
      });
      
      console.log('AuthService.requestPasswordReset: API response received:', {
        success: response.data.success,
        message: response.data.message,
        nextStep: response.data.data?.next_step
      });
      
      if (response.data.success) {
        return {
          success: true,
          email: response.data.data?.email || email,
          message: response.data.message || 'Password reset code sent to your email',
          expiresInMinutes: response.data.data?.expires_in_minutes || 30,
          nextStep: response.data.data?.next_step || 'verify_code'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to send reset code',
          errors: response.data.errors
        };
      }
    } catch (error) {
      console.error('AuthService.requestPasswordReset: Error occurred:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          message: errorData.message || 'Failed to send reset code',
          errors: errorData.errors
        };
      }
      
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  },

  /**
   * Step 2: Verify password reset code
   * @param {string} email - User email
   * @param {string} code - 6-digit verification code
   * @returns {Promise<Object>} Verification response
   */
  verifyPasswordResetCode: async (email, code) => {
    try {
      console.log('AuthService.verifyPasswordResetCode: Verifying code for:', email);
      
      const response = await api.post(ENDPOINTS.FORGOT_PASSWORD.VERIFY, {
        email,
        code
      });
      
      console.log('AuthService.verifyPasswordResetCode: API response received:', {
        success: response.data.success,
        message: response.data.message,
        hasResetToken: !!response.data.data?.reset_token
      });
      
      if (response.data.success) {
        return {
          success: true,
          email: response.data.data?.email || email,
          resetToken: response.data.data?.reset_token,
          message: response.data.message || 'Code verified successfully',
          expiresInMinutes: response.data.data?.expires_in_minutes || 15,
          nextStep: response.data.data?.next_step || 'reset_password'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Invalid or expired code',
          errors: response.data.errors
        };
      }
    } catch (error) {
      console.error('AuthService.verifyPasswordResetCode: Error occurred:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          message: errorData.message || 'Invalid or expired code',
          errors: errorData.errors
        };
      }
      
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  },

  /**
   * Step 3: Complete password reset with new password
   * @param {string} email - User email
   * @param {string} resetToken - Reset token from verification step
   * @param {string} password - New password
   * @param {string} passwordConfirmation - Password confirmation
   * @returns {Promise<Object>} Reset completion response
   */
  completePasswordReset: async (email, resetToken, password, passwordConfirmation) => {
    try {
      console.log('AuthService.completePasswordReset: Completing reset for:', email);
      
      const response = await api.post(ENDPOINTS.FORGOT_PASSWORD.COMPLETE, {
        email,
        reset_token: resetToken,
        password,
        password_confirmation: passwordConfirmation
      });
      
      console.log('AuthService.completePasswordReset: API response received:', {
        success: response.data.success,
        message: response.data.message
      });
      
      if (response.data.success) {
        return {
          success: true,
          email: response.data.data?.email || email,
          message: response.data.message || 'Password reset successfully',
          nextStep: response.data.data?.next_step || 'login'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to reset password',
          errors: response.data.errors
        };
      }
    } catch (error) {
      console.error('AuthService.completePasswordReset: Error occurred:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          message: errorData.message || 'Failed to reset password',
          errors: errorData.errors
        };
      }
      
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  },

  /**
   * Resend password reset code
   * @param {string} email - User email
   * @returns {Promise<Object>} Resend response
   */
  resendPasswordResetCode: async (email) => {
    try {
      console.log('AuthService.resendPasswordResetCode: Resending code for:', email);
      
      const response = await api.post(ENDPOINTS.FORGOT_PASSWORD.RESEND, {
        email
      });
      
      console.log('AuthService.resendPasswordResetCode: API response received:', {
        success: response.data.success,
        message: response.data.message
      });
      
      if (response.data.success) {
        return {
          success: true,
          email: response.data.data?.email || email,
          message: response.data.message || 'New password reset code sent',
          expiresInMinutes: response.data.data?.expires_in_minutes || 30
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to resend reset code',
          errors: response.data.errors
        };
      }
    } catch (error) {
      console.error('AuthService.resendPasswordResetCode: Error occurred:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          message: errorData.message || 'Failed to resend reset code',
          errors: errorData.errors
        };
      }
      
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  },

  /**
   * Check password reset status
   * @param {string} email - User email
   * @returns {Promise<Object>} Status response
   */
  checkPasswordResetStatus: async (email) => {
    try {
      console.log('AuthService.checkPasswordResetStatus: Checking status for:', email);
      
      const response = await api.get(ENDPOINTS.FORGOT_PASSWORD.STATUS, {
        params: { email }
      });
      
      console.log('AuthService.checkPasswordResetStatus: API response received:', {
        success: response.data.success,
        hasActiveReset: response.data.data?.has_active_reset
      });
      
      if (response.data.success) {
        return {
          success: true,
          email: response.data.data?.email || email,
          hasActiveReset: response.data.data?.has_active_reset || false,
          canRequestNew: response.data.data?.can_request_new || true,
          nextStep: response.data.data?.next_step || 'request_reset',
          expiresAt: response.data.data?.expires_at,
          expiresInMinutes: response.data.data?.expires_in_minutes
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to check reset status',
          errors: response.data.errors
        };
      }
    } catch (error) {
      console.error('AuthService.checkPasswordResetStatus: Error occurred:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          message: errorData.message || 'Failed to check reset status',
          errors: errorData.errors
        };
      }
      
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  },
};

export default authService;
