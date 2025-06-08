import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class DepositService {
  /**
   * Get available deposit accounts
   */
  async getDepositAccounts() {
    try {
      console.log('🏦 DepositService: Getting deposit accounts...');
      const response = await api.get('/mobile/deposits/accounts');
      
      console.log('✅ DepositService: Successfully retrieved deposit accounts', {
        accountCount: response.data?.data?.accounts?.length || 0
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ DepositService: Error getting deposit accounts:', error);
      
      // Return fallback structure for graceful error handling
      return {
        success: false,
        message: 'Failed to load deposit accounts',
        data: {
          accounts: [],
          currency: 'USD',
          minimum_deposit: 1,
          minimum_deposit_crypto: 10,
          maximum_deposit: 500,
          wallet_balance: 0,
          has_accounts: false,
        }
      };
    }
  }

  /**
   * Get deposit instructions for selected account
   */
  async getDepositInstructions(accountId, amount) {
    try {
      console.log('📋 DepositService: Getting deposit instructions...', {
        accountId,
        amount
      });
      
      const response = await api.post('/mobile/deposits/instructions', {
        account_id: accountId,
        amount: amount
      });
      
      console.log('✅ DepositService: Successfully retrieved deposit instructions');
      return response.data;
    } catch (error) {
      console.error('❌ DepositService: Error getting deposit instructions:', error);
      throw error;
    }
  }

  /**
   * Verify deposit payment
   */
  async verifyDeposit(accountId, amount, reference, transactionRef) {
    try {
      console.log('✅ DepositService: Verifying deposit...', {
        accountId,
        amount,
        reference,
        transactionRef
      });
      
      const response = await api.post('/mobile/deposits/verify', {
        account_id: accountId,
        amount: amount,
        reference: reference,
        transaction_ref: transactionRef
      });
      
      console.log('✅ DepositService: Successfully verified deposit');
      return response.data;
    } catch (error) {
      console.error('❌ DepositService: Error verifying deposit:', error);
      throw error;
    }
  }

  /**
   * Check transaction status for verification polling
   */
  async checkTransactionStatus(transactionId) {
    try {
      console.log('🔍 DepositService: Checking transaction status...', {
        transactionId
      });
      
      const response = await api.get(`/mobile/transactions/${transactionId}/status`);
      
      console.log('✅ DepositService: Successfully checked transaction status', {
        status: response.data?.data?.status
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ DepositService: Error checking transaction status:', error);
      throw error;
    }
  }

  /**
   * Get master user information for deposit dashboard
   * This method checks if the user is a master user and returns their master data
   */
  async getMasterUserInfo() {
    try {
      console.log('👑 DepositService: Getting master user information...');
      
      const response = await api.get('/mobile/deposits/master-info');
      
      console.log('✅ DepositService: Successfully retrieved master user info', {
        isMasterUser: response.data?.data?.is_master_user || false,
        masterData: response.data?.data?.master_data ? 'Available' : 'Not available'
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ DepositService: Error getting master user info:', error.response?.data || error.message);
      
      // Return fallback structure for non-master users or API errors
      return {
        success: true,
        message: 'User is not a master user.',
        data: {
          is_master_user: false,
          master_data: null
        }
      };
    }
  }

  /**
   * Cache master user data locally for quick access
   */
  async cacheMasterUserData(masterData) {
    try {
      console.log('💾 DepositService: Caching master user data...');
      await AsyncStorage.setItem('masterUserData', JSON.stringify({
        data: masterData,
        cachedAt: new Date().toISOString()
      }));
      console.log('✅ DepositService: Master user data cached successfully');
    } catch (error) {
      console.error('❌ DepositService: Error caching master user data:', error);
    }
  }

  /**
   * Get cached master user data
   */
  async getCachedMasterUserData() {
    try {
      const cachedData = await AsyncStorage.getItem('masterUserData');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cachedAt = new Date(parsed.cachedAt);
        const now = new Date();
        
        // Check if cache is less than 5 minutes old
        const cacheAgeMs = now.getTime() - cachedAt.getTime();
        const maxCacheAgeMs = 5 * 60 * 1000; // 5 minutes
        
        if (cacheAgeMs < maxCacheAgeMs) {
          console.log('✅ DepositService: Using cached master user data');
          return parsed.data;
        } else {
          console.log('⏰ DepositService: Cached master user data expired, will fetch fresh');
        }
      }
      return null;
    } catch (error) {
      console.error('❌ DepositService: Error getting cached master user data:', error);
      return null;
    }
  }

  /**
   * Get master user info with caching fallback
   */
  async getMasterUserInfoWithCache() {
    try {
      // Try to get fresh data first
      const freshData = await this.getMasterUserInfo();
      
      if (freshData.success && freshData.data.is_master_user) {
        // Cache the data for future use
        await this.cacheMasterUserData(freshData.data);
        return freshData;
      }
      
      return freshData;
    } catch (error) {
      console.log('⚠️ DepositService: Fresh fetch failed, trying cached data...');
      
      // If fresh fetch fails, try cached data
      const cachedData = await this.getCachedMasterUserData();
      if (cachedData) {
        console.log('✅ DepositService: Using cached master user data as fallback');
        return {
          success: true,
          message: 'Using cached master user data',
          data: cachedData
        };
      }
      
      // If no cached data, return default non-master structure
      return {
        success: true,
        message: 'User is not a master user.',
        data: {
          is_master_user: false,
          master_data: null
        }
      };
    }
  }

  /**
   * Clear cached master user data
   */
  async clearMasterUserCache() {
    try {
      await AsyncStorage.removeItem('masterUserData');
      console.log('✅ DepositService: Master user cache cleared');
    } catch (error) {
      console.error('❌ DepositService: Error clearing master user cache:', error);
    }
  }
}

export default new DepositService(); 