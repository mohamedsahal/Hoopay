import api from './api';

/**
 * Dedicated Password Reset Service
 * Direct API calls for password reset functionality
 */
const passwordResetService = {
  /**
   * Step 1: Request password reset
   */
  requestReset: async (email) => {
    try {
      console.log('PasswordResetService: Requesting reset for:', email);
      
      const response = await api.post('/mobile/password/reset/request', {
        email
      });
      
      console.log('PasswordResetService: Full Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      
      // Check if the response indicates success
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Password reset code sent successfully',
          data: response.data.data || {}
        };
      } else {
        // Handle error response
        console.error('PasswordResetService: API returned error:', response.data);
        return {
          success: false,
          message: response.data?.message || 'Failed to send reset code',
          errors: response.data?.errors || response.data?.data || {}
        };
      }
    } catch (error) {
      console.error('PasswordResetService: Request error:', error);
      console.error('PasswordResetService: Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Network error occurred',
        errors: error.response?.data?.errors || error.response?.data?.data || {}
      };
    }
  },

  /**
   * Step 2: Verify reset code
   */
  verifyCode: async (email, code) => {
    try {
      console.log('PasswordResetService: Verifying code for:', email);
      
      const response = await api.post('/mobile/password/reset/verify', {
        email,
        code
      });
      
      console.log('PasswordResetService: Verify response:', response.data);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Code verified successfully',
          resetToken: response.data.data?.reset_token || '',
          data: response.data.data || {}
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Invalid verification code',
          errors: response.data?.errors || response.data?.data || {}
        };
      }
    } catch (error) {
      console.error('PasswordResetService: Verify error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Verification failed',
        errors: error.response?.data?.errors || error.response?.data?.data || {}
      };
    }
  },

  /**
   * Step 3: Complete password reset
   */
  completeReset: async (email, resetToken, password, passwordConfirmation) => {
    try {
      console.log('PasswordResetService: Completing reset for:', email);
      
      const response = await api.post('/mobile/password/reset/complete', {
        email,
        reset_token: resetToken,
        password,
        password_confirmation: passwordConfirmation
      });
      
      console.log('PasswordResetService: Complete response:', response.data);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Password reset successfully',
          data: response.data.data || {}
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to reset password',
          errors: response.data?.errors || response.data?.data || {}
        };
      }
    } catch (error) {
      console.error('PasswordResetService: Complete error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Reset failed',
        errors: error.response?.data?.errors || error.response?.data?.data || {}
      };
    }
  },

  /**
   * Resend verification code
   */
  resendCode: async (email) => {
    try {
      console.log('PasswordResetService: Resending code for:', email);
      
      const response = await api.post('/mobile/password/reset/resend', {
        email
      });
      
      console.log('PasswordResetService: Resend response:', response.data);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'New verification code sent',
          data: response.data.data || {}
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to resend code',
          errors: response.data?.errors || response.data?.data || {}
        };
      }
    } catch (error) {
      console.error('PasswordResetService: Resend error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Resend failed',
        errors: error.response?.data?.errors || error.response?.data?.data || {}
      };
    }
  }
};

export default passwordResetService; 