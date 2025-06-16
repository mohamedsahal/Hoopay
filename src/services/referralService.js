import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production API URL
const API_URL = 'https://hoopaywallet.com/api';

class ReferralService {
  constructor() {
    this.baseURL = `${API_URL}/mobile/referral`; // Use dedicated mobile endpoints
    this.fallbackURL = `${API_URL}/referral`; // Fallback to original endpoints if needed
  }

  // Helper method to get auth headers
  async getAuthHeaders() {
    const token = await SecureStore.getItemAsync('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  // Get user's referral information and stats
  async getReferralInfo() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseURL}/info`, { headers });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching referral info:', error);
      
      // Try fallback endpoint if mobile endpoint fails
      try {
        console.log('Trying fallback referral info endpoint...');
        const fallbackResponse = await axios.get(`${this.fallbackURL}/info`, { headers: await this.getAuthHeaders() });
        return {
          success: true,
          data: fallbackResponse.data.data
        };
      } catch (fallbackError) {
        console.error('Fallback referral info also failed:', fallbackError);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch referral information'
      };
    }
  }

  // Opt into the referral program
  async optInToReferralProgram() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(`${this.baseURL}/opt-in`, {}, { headers });

      return {
        success: true,
        data: response.data,
        referralCode: response.data.referral_code
      };
    } catch (error) {
      console.error('Error opting into referral program:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to opt into referral program'
      };
    }
  }

  // Get list of user's referrals (privacy-focused mobile endpoint)
  async getReferrals(page = 1, perPage = 15, status = null) {
    try {
      const headers = await this.getAuthHeaders();
      let url = `${this.baseURL}/referrals?page=${page}&per_page=${perPage}`;
      if (status) {
        url += `&status=${status}`;
      }

      console.log('Fetching referrals from mobile endpoint:', url);
      const response = await axios.get(url, { headers });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching referrals from mobile endpoint:', error);
      
      // Try fallback endpoint if mobile endpoint fails
      try {
        console.log('Trying fallback referrals endpoint...');
        let fallbackUrl = `${this.fallbackURL}/list?page=${page}&per_page=${perPage}`;
        if (status) {
          fallbackUrl += `&status=${status}`;
        }
        const fallbackResponse = await axios.get(fallbackUrl, { headers: await this.getAuthHeaders() });
        
        return {
          success: true,
          data: fallbackResponse.data
        };
      } catch (fallbackError) {
        console.error('Fallback referrals also failed:', fallbackError);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch referrals'
      };
    }
  }

  // Get list of user's commissions (privacy-focused mobile endpoint)
  async getCommissions(page = 1, perPage = 15, status = null) {
    try {
      const headers = await this.getAuthHeaders();
      let url = `${this.baseURL}/commissions?page=${page}&per_page=${perPage}`;
      if (status) {
        url += `&status=${status}`;
      }

      console.log('Fetching commissions from mobile endpoint:', url);
      const response = await axios.get(url, { headers });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching commissions from mobile endpoint:', error);
      
      // Try fallback endpoint if mobile endpoint fails
      try {
        console.log('Trying fallback commissions endpoint...');
        let fallbackUrl = `${this.fallbackURL}/commissions?page=${page}&per_page=${perPage}`;
        if (status) {
          fallbackUrl += `&status=${status}`;
        }
        const fallbackResponse = await axios.get(fallbackUrl, { headers: await this.getAuthHeaders() });
        
        console.log('Fallback commissions response:', fallbackResponse.data);
        return {
          success: true,
          data: fallbackResponse.data
        };
      } catch (fallbackError) {
        console.error('Fallback commissions also failed:', fallbackError);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch commissions'
      };
    }
  }

  // Apply a referral code (used during registration)
  async applyReferralCode(referralCode) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(`${this.baseURL}/apply`, {
        referral_code: referralCode
      }, { headers });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error applying referral code:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to apply referral code'
      };
    }
  }

  // Check if a referral code is valid (public endpoint, no authentication required)
  async checkReferralCode(referralCode) {
    try {
      const response = await axios.post(`${API_URL}/referral/check-public`, {
        referral_code: referralCode
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error checking referral code:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid referral code'
      };
    }
  }

  // Generate shareable referral link
  async generateReferralLink(userId) {
    try {
          // Production base URL
    const baseUrl = 'https://hoopaywallet.com';
      
      const token = await SecureStore.getItemAsync('auth_token');
      const response = await axios.get(`${this.baseURL}/generate-link`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error generating referral link:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to generate referral link'
      };
    }
  }

  // Generate sharing text for social media
  generateSharingText(referralCode, referralLink) {
    return `🚀 Join me on Hoopay, the future of digital payments! Use my referral code: ${referralCode}\n\n💰 Earn rewards when you make your first transaction\n🔒 Secure, fast, and reliable\n\nSign up here: ${referralLink}`;
  }

  // Format currency display
  formatCurrency(amount, currency = 'USD') {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
    
    return formatter.format(amount || 0);
  }

  // Calculate referral stats from data
  calculateStats(referralData) {
    if (!referralData || !referralData.stats) {
      return {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalEarnings: 0,
        withdrawableEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
        eligibleForWithdrawal: false,
        minimumWithdrawal: 50,
        // Master user data
        isMasterUser: false,
        masterUserData: null
      };
    }

    const stats = referralData.stats;
    const masterData = referralData.master_user_data;

    // Safely convert all commission values to numbers, defaulting to 0 if null/undefined
    const withdrawableCommission = parseFloat(stats.withdrawable_commission) || 0;
    const pendingCommission = parseFloat(stats.pending_commission) || 0;
    const paidCommission = parseFloat(stats.paid_commission) || 0;
    
    // Calculate total earnings from all commission types
    const totalEarnings = withdrawableCommission + pendingCommission + paidCommission;

    // Include master user data in stats if available
    let masterUserData = null;
    if (masterData && masterData.is_master_user) {
      masterUserData = {
        isMasterUser: true,
        masterInfo: masterData.master_info,
        statistics: masterData.master_info.statistics,
        recentCommissions: masterData.master_info.recent_commissions,
        commissionRate: masterData.master_info.commission_rate
      };
    }

    return {
      totalReferrals: parseInt(stats.total_referrals) || 0,
      completedReferrals: parseInt(stats.completed_referrals) || 0,
      pendingReferrals: Math.max(0, (parseInt(stats.total_referrals) || 0) - (parseInt(stats.completed_referrals) || 0)),
      totalEarnings: totalEarnings,
      withdrawableEarnings: withdrawableCommission,
      pendingEarnings: pendingCommission,
      paidEarnings: paidCommission,
      eligibleForWithdrawal: stats.eligible_for_withdrawal || false,
      minimumWithdrawal: parseFloat(stats.minimum_withdrawal) || 50,
      // Master user data
      isMasterUser: masterUserData !== null,
      masterUserData: masterUserData
    };
  }

  // Get referral program terms and conditions
  async getReferralTerms() {
    try {
      const response = await axios.get(`${this.baseURL}/terms`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching referral terms:', error);
      return {
        success: false,
        message: 'Failed to fetch referral terms',
        data: {
          // Default terms if API fails
          commissionRate: '20%',
          minimumWithdrawal: '$50',
          paymentSchedule: 'Monthly',
          eligibilityCriteria: 'Referred user must complete their first transaction'
        }
      };
    }
  }

  // Request withdrawal of referral earnings (mobile endpoint)
  async requestWithdrawal(amount, withdrawalMethod) {
    try {
      const headers = await this.getAuthHeaders();
      console.log('Requesting withdrawal via mobile endpoint:', { amount, withdrawalMethod });
      
      const response = await axios.post(`${this.baseURL}/withdraw`, {
        amount: amount,
        withdrawal_method: withdrawalMethod
      }, { headers });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error requesting withdrawal from mobile endpoint:', error);
      
      // Try fallback endpoint if mobile endpoint fails
      try {
        console.log('Trying fallback withdrawal endpoint...');
        const fallbackResponse = await axios.post(`${this.fallbackURL}/withdraw`, {
          amount: amount,
          withdrawal_method: withdrawalMethod
        }, { headers: await this.getAuthHeaders() });
        
        return {
          success: true,
          data: fallbackResponse.data
        };
      } catch (fallbackError) {
        console.error('Fallback withdrawal also failed:', fallbackError);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to request withdrawal'
      };
    }
  }

  // Get withdrawal history (privacy-focused mobile endpoint)
  async getWithdrawals(page = 1, perPage = 15) {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.baseURL}/withdrawals?page=${page}&per_page=${perPage}`;
      
      console.log('Fetching withdrawals from mobile endpoint:', url);
      const response = await axios.get(url, { headers });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching withdrawals from mobile endpoint:', error);
      
      // Try fallback endpoint if mobile endpoint fails
      try {
        console.log('Trying fallback withdrawals endpoint...');
        const fallbackUrl = `${this.fallbackURL}/withdrawals?page=${page}&per_page=${perPage}`;
        const fallbackResponse = await axios.get(fallbackUrl, { headers: await this.getAuthHeaders() });
        
        console.log('Fallback withdrawals response:', fallbackResponse.data);
        return {
          success: true,
          data: fallbackResponse.data
        };
      } catch (fallbackError) {
        console.error('Fallback withdrawals also failed:', fallbackError);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch withdrawals'
      };
    }
  }
}

const referralService = new ReferralService();
export default referralService; 