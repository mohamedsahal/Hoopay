import * as SecureStore from 'expo-secure-store';
import api from './api';
import { ENDPOINTS } from '../config/apiConfig';

class TransferService {
  constructor() {
    this.api = api;
  }

  /**
   * Validate wallet ID format (6 digits)
   */
  validateWalletId(walletId) {
    const wallet = walletId.toString().trim();
    return /^\d{6}$/.test(wallet);
  }

  /**
   * Validate transfer amount
   */
  validateAmount(amount, availableBalance) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }
    if (numAmount > availableBalance) {
      return { valid: false, error: 'Insufficient funds' };
    }
    return { valid: true };
  }

  /**
   * Get user by wallet ID to verify recipient exists
   */
  async getUserByWalletId(walletId) {
    try {
      console.log('Looking up user by wallet ID:', walletId);
      
      const response = await this.api.get(`/mobile/users/wallet/${walletId}`);
      
      if (response.data.success) {
        return {
          success: true,
          user: response.data.data.user || response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'User not found',
        };
      }
    } catch (error) {
      console.error('Error looking up user by wallet ID:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Wallet ID not found',
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to lookup recipient',
      };
    }
  }

  /**
   * Initiate transfer (create pending transaction)
   */
  async initiateTransfer(transferData) {
    try {
      const { walletId, amount, note, recipient } = transferData;
      
      console.log('Initiating transfer:', {
        recipient_wallet_id: walletId,
        amount: amount,
        note: note || '',
      });

      const response = await this.api.post('/mobile/transactions/transfer/initiate', {
        recipient_wallet_id: walletId,
        amount: parseFloat(amount),
        currency: 'USD',
        note: note || '',
        recipient_name: recipient?.name,
        recipient_email: recipient?.email,
      });

      if (response.data.success) {
        return {
          success: true,
          transaction: response.data.data.transaction || response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to initiate transfer',
        };
      }
    } catch (error) {
      console.error('Error initiating transfer:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to initiate transfer',
      };
    }
  }

  /**
   * Confirm and execute transfer
   */
  async confirmTransfer(transactionId) {
    try {
      console.log('Confirming transfer:', transactionId);

      const response = await this.api.post('/mobile/transactions/transfer/confirm', {
        transaction_id: transactionId,
      });

      if (response.data.success) {
        return {
          success: true,
          transaction: response.data.data.transaction || response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to confirm transfer',
        };
      }
    } catch (error) {
      console.error('Error confirming transfer:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to confirm transfer',
      };
    }
  }

  /**
   * Cancel pending transfer
   */
  async cancelTransfer(transactionId) {
    try {
      console.log('Canceling transfer:', transactionId);

      const response = await this.api.post('/mobile/transactions/transfer/cancel', {
        transaction_id: transactionId,
      });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Transfer cancelled successfully',
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to cancel transfer',
        };
      }
    } catch (error) {
      console.error('Error canceling transfer:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to cancel transfer',
      };
    }
  }

  /**
   * Simple transfer (for compatibility with existing API if available)
   */
  async simpleTransfer(transferData) {
    try {
      const { walletId, amount, note, recipientEmail } = transferData;
      
      console.log('Executing simple transfer:', {
        recipient_email: recipientEmail,
        amount: amount,
        note: note || '',
      });

      const response = await this.api.post(ENDPOINTS.TRANSFER, {
        recipient_email: recipientEmail,
        amount: parseFloat(amount),
        currency: 'USD',
        description: note || 'Mobile transfer',
      });

      if (response.data.success) {
        return {
          success: true,
          transaction: response.data.data.transaction || response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Transfer failed',
        };
      }
    } catch (error) {
      console.error('Error executing simple transfer:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Transfer failed',
      };
    }
  }

  /**
   * Get current user's wallet information
   */
  async getUserWallet() {
    try {
      const response = await this.api.get('/mobile/wallet');
      
      if (response.data.success) {
        return {
          success: true,
          wallet: response.data.data.wallet || response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to get wallet info',
        };
      }
    } catch (error) {
      console.error('Error getting wallet info:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get wallet info',
      };
    }
  }

  /**
   * Format currency amount
   */
  formatAmount(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Generate transaction reference
   */
  generateTransactionRef() {
    return 'TRF' + Date.now().toString(36).toUpperCase();
  }
}

export default new TransferService(); 