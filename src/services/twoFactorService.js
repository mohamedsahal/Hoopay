import api from './api';

class TwoFactorService {
  static instance = null;

  static getInstance() {
    if (!TwoFactorService.instance) {
      TwoFactorService.instance = new TwoFactorService();
    }
    return TwoFactorService.instance;
  }

  // Get 2FA status for current user
  async getStatus() {
    try {
      const response = await api.get('/mobile/2fa/status');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get 2FA status'
      };
    }
  }

  // Generate QR code and secret for setup
  async generate() {
    try {
      const response = await api.post('/mobile/2fa/generate');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to generate 2FA setup'
      };
    }
  }

  // Verify code and enable 2FA
  async verifyAndEnable(code, password) {
    try {
      const response = await api.post('/mobile/2fa/verify-enable', {
        code,
        password
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to enable 2FA'
      };
    }
  }

  // Disable 2FA
  async disable(password) {
    try {
      const response = await api.post('/mobile/2fa/disable', {
        password
      });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to disable 2FA'
      };
    }
  }

  // Get recovery codes
  async getRecoveryCodes() {
    try {
      const response = await api.get('/mobile/2fa/recovery-codes');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get recovery codes'
      };
    }
  }

  // Regenerate recovery codes
  async regenerateRecoveryCodes(password) {
    try {
      const response = await api.post('/mobile/2fa/recovery-codes/regenerate', {
        password
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to regenerate recovery codes'
      };
    }
  }

  // Verify 2FA code during login
  async verifyLogin(email, code) {
    try {
      const response = await api.post('/mobile/2fa/verify-login', {
        email,
        code
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid verification code'
      };
    }
  }
}

export default TwoFactorService.getInstance(); 