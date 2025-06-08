import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import api from './api';

// Use the same API configuration as in api.ts
// We'll primarily use the api instance imported above, but keep this for backwards compatibility
const API_BASE_URL = 'https://hoopaywallet.com/api';

class AccountService {
  constructor() {
    // Use the imported api instance as the primary client
    this.api = api;
    
    // Keep a backup client for compatibility with existing code
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // Increased timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add auth token to requests for the backup client
    this.apiClient.interceptors.request.use(async (config) => {
      try {
        // Use SecureStore instead of AsyncStorage
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.log('Error getting auth token:', error);
      }
      return config;
    });
  }

  // Get user profile information
  async getUserProfile() {
    try {
      console.log('Fetching user profile...');
      
      // First try with the main api instance which has the correct token configured
      try {
        // Try the auth/user endpoint first (most reliable)
        const response = await this.api.get('/auth/mobile/user');
        console.log('User profile response:', response.status);
        
        if (response.data.success) {
          return {
            success: true,
            user: response.data.data.user || response.data.data,
          };
        }
      } catch (mainError) {
        console.log('Primary profile endpoint error:', mainError.message);
        // Continue to fallbacks
      }
      
      // Try fallback endpoints with proper error handling
      const endpoints = [
        '/auth/user',
        '/user',
        '/profile',
        '/v1/profile'
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying fallback endpoint: ${endpoint}`);
          const fallbackResponse = await this.api.get(endpoint);
          
          if (fallbackResponse.data.success) {
            return {
              success: true,
              user: fallbackResponse.data.data.user || fallbackResponse.data.data,
            };
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed:`, endpointError.message);
          // Continue to next endpoint
        }
      }
      
      // If we got here, all endpoints failed - check token
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        console.error('No auth token found!');
        return {
          success: false,
          error: 'Authentication required',
        };
      }
      
      // Last resort - return basic user info from JWT if available
      try {
        // Try to extract user ID from token (if it's a JWT)
        if (token.split('.').length === 3) {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          if (tokenData.sub || tokenData.user_id) {
            return {
              success: true,
              user: {
                id: tokenData.sub || tokenData.user_id,
                // Other fields will be empty
              },
            };
          }
        }
      } catch (tokenError) {
        console.error('Error parsing token:', tokenError);
      }

      return {
        success: false,
        error: 'Failed to fetch profile after trying all endpoints',
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch profile',
      };
    }
  }

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      console.log('Fetching dashboard stats...');
      const response = await this.apiClient.get('/dashboard/stats');
      
      if (response.data.success) {
        return {
          success: true,
          stats: response.data.data,
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Dashboard stats error:', error);
      
      // Fallback to basic dashboard
      try {
        const fallbackResponse = await this.apiClient.get('/dashboard');
        if (fallbackResponse.data.success) {
          return {
            success: true,
            stats: fallbackResponse.data.data,
          };
        }
      } catch (fallbackError) {
        console.error('Fallback dashboard error:', fallbackError);
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch dashboard stats',
      };
    }
  }

  // Get user accounts
  async getAccounts() {
    try {
      console.log('Fetching user accounts...');
      const response = await this.apiClient.get('/accounts');
      
      if (response.data.success) {
        const accounts = response.data.data.accounts || response.data.data || [];
        
        // Debug: Log the complete structure of the first account to check for image fields
        if (accounts.length > 0) {
          console.log('ACCOUNT OBJECT STRUCTURE:', JSON.stringify(accounts[0], null, 2));
        }
        
        // Fetch all wallet/account types to get their details
        console.log('Fetching all wallet types...');
        let walletTypes = [];
        
        try {
          // Use the reliable endpoint that works for the deposit flow
          const walletTypesResponse = await this.apiClient.get('/auth/mobile/account-types/fiat');
          
          if (walletTypesResponse.data.success) {
            walletTypes = walletTypesResponse.data.data.account_types || 
                        walletTypesResponse.data.data || [];
            console.log(`Successfully fetched ${walletTypes.length} wallet types with details`);
          }
        } catch (typeError) {
          console.warn('Error fetching wallet types:', typeError.message);
          // Fall back to the less specific endpoint
          try {
            const fallbackResponse = await this.getAccountTypes();
            if (fallbackResponse.success) {
              walletTypes = fallbackResponse.accountTypes || [];
              console.log(`Used fallback to fetch ${walletTypes.length} wallet types`);
            }
          } catch (fallbackError) {
            console.error('All wallet type fetching attempts failed');
          }
        }

        // Process each account to add complete wallet type information
        const enhancedAccounts = accounts.map(account => {
          // Create a proper account object with consistent structure
          const enhancedAccount = { ...account };
          
          // Identify the category (not to be confused with wallet type)
          let category = 'fiat'; // Default category
          
          // Try to determine category from account data
          if (account.category) {
            // Category explicitly provided
            category = account.category.toLowerCase();
          } else if (account.wallet_type && account.wallet_type.account_category) {
            // Category from wallet_type object
            category = account.wallet_type.account_category.toLowerCase();
          } else if (account.account_type_id && typeof account.account_type_id === 'string') {
            // Try to infer from account_type_id
            if (account.account_type_id.includes('crypto')) {
              category = 'crypto';
            } else if (account.account_type_id.includes('bank')) {
              category = 'bank';
            }
          }
          
          // Store the category properly
          enhancedAccount.category = category;
          
          // Now find the correct wallet type (the actual type, not category)
          // 1. Try to find by wallet_type_id (how web version stores it)
          let matchingType = null;
          
          if (account.wallet_type_id) {
            // Web version typically stores wallet_type_id
            matchingType = walletTypes.find(type => type.id == account.wallet_type_id);
          }
          
          // 2. If no match by ID, try name matching
          if (!matchingType) {
            const accountName = (account.name || '').toLowerCase();
            const accountTypeName = (account.account_type || '').toLowerCase();
            
            // Map of common wallet names to standardize matching
            const walletKeywords = {
              'edahab': 'edahab',
              'evc': 'evc_plus',
              'evc plus': 'evc_plus',
              'zaad': 'zaad',
              'sahal': 'sahal',
              'premier': 'premier_bank',
              'premier bank': 'premier_bank',
              'salaam': 'salaam_bank',
              'salaam bank': 'salaam_bank',
              'usdt': 'usdt',
              'usdc': 'usdc',
              'trx': 'trx'
            };
            
            // Debug log for this account's identifiers
            console.log(`Account ${account.id} matching: wallet_name=${account.wallet_name}, account_type=${account.account_type}, wallet_type_id=${account.wallet_type_id}`);
            
            // Prefer wallet_name for matching (most reliable across systems)
            const walletName = account.wallet_name?.toLowerCase() || '';
            
            // First try direct wallet_name matching (most reliable)
            if (walletName) {
              console.log(`Trying direct wallet_name match for: "${walletName}"`);
              // Try to normalize the wallet name to handle ID format mismatches
              const normalizedName = walletKeywords[walletName] || walletName;
              
              matchingType = walletTypes.find(type => {
                const typeName = (type.name || '').toLowerCase();
                const typeId = (type.id || '').toLowerCase();
                
                return typeName === walletName || 
                       typeId === normalizedName ||
                       typeName.includes(walletName) ||
                       walletName.includes(typeName);
              });
              
              if (matchingType) {
                console.log(`✓ Found match by wallet_name: ${matchingType.name}`);
              }
            }
            
            // If no match by wallet_name, try using keyword matching as fallback
            if (!matchingType) {
              console.log('No direct wallet_name match, trying keyword matching...');
              for (const [keyword, standardKey] of Object.entries(walletKeywords)) {
                if (accountName.includes(keyword) || accountTypeName.includes(keyword) || walletName.includes(keyword)) {
                  // Found a match by keyword, now find the actual wallet type
                  matchingType = walletTypes.find(type => {
                    const typeName = (type.name || '').toLowerCase();
                    const typeId = (type.id || '').toLowerCase();
                    
                    return typeName.includes(standardKey) || 
                           typeId.includes(standardKey) || 
                           standardKey.includes(typeName) ||
                           standardKey === typeId;
                  });
                  
                  if (matchingType) {
                    console.log(`✓ Found match by keyword "${keyword}": ${matchingType.name}`);
                    break;
                  }
                }
              }
            }
            
            // If still no match, try a more general match
            if (!matchingType) {
              matchingType = walletTypes.find(type => {
                const typeName = (type.name || '').toLowerCase();
                const typeCode = (type.code || '').toLowerCase();
                
                return typeName === accountName || 
                       typeCode === accountName || 
                       typeName === accountTypeName || 
                       typeCode === accountTypeName || 
                       accountName.includes(typeName) || 
                       accountTypeName.includes(typeName);
              });
            }
          }
          
          // If we found a matching wallet type, use its data to enhance the account
          if (matchingType) {
            console.log(`Found matching wallet type for account ${account.name || account.id}: ${matchingType.name}`);
            
            // Create a proper wallet_type object if it doesn't exist
            enhancedAccount.wallet_type = {
              id: matchingType.id,
              name: matchingType.name,
              code: matchingType.code || matchingType.name?.toLowerCase().replace(/\s+/g, '_'),
              logo: matchingType.logo || null,
              logo_url: matchingType.logo_url || null,
              payment_instructions: matchingType.payment_instructions || '',
              account_category: category
            };
            
            // Add additional fields for different access patterns
            enhancedAccount.wallet_type_id = matchingType.id;
            enhancedAccount.wallet_type_name = matchingType.name;
            enhancedAccount.wallet_code = matchingType.code || matchingType.name?.toLowerCase().replace(/\s+/g, '_');
            
            // Store payment instructions directly for easier access
            if (matchingType.payment_instructions) {
              enhancedAccount.payment_instructions = matchingType.payment_instructions;
            }
            
            // Get logo from wallet type if available
            const logoFromType = matchingType.logo_url || matchingType.logo || null;
            if (logoFromType) {
              enhancedAccount.logo_url = logoFromType;
            }
          } else {
            console.log(`No matching wallet type found for account ${account.name || account.id}`);
            
            // Create basic wallet type info from account data as fallback
            enhancedAccount.wallet_type = {
              id: account.wallet_type_id || account.account_type || 0,
              name: account.name || 'Account',
              code: account.name?.toLowerCase().replace(/\s+/g, '_') || 'account',
              account_category: category
            };
            
            enhancedAccount.wallet_type_name = account.name || 'Account';
          }
          
          return enhancedAccount;
        });
        
        return {
          success: true,
          accounts: enhancedAccounts,
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch accounts');
      }
    } catch (error) {
      console.error('Get accounts error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch accounts',
      };
    }
  }

  // Get account types with logos
  async getAccountTypes() {
    try {
      console.log('Fetching account types...');
      // Using local wallet assets is now prioritized over API calls
      // Try correct endpoints where wallet types with logos might be found
      const endpoints = [
        '/auth/mobile/wallet-types',
        '/auth/mobile/account-types',
        '/auth/mobile/accounts/types',
        '/auth/mobile/wallets/types',
        '/api/wallet-types/all',
        '/api/account-types/all'
      ];
      
      // Try each endpoint until we get a successful response
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying wallet type endpoint: ${endpoint}`);
          const response = await this.apiClient.get(endpoint, { timeout: 5000 }); // Shorter timeout for faster fallback
          
          if (response.data && (response.data.success || Array.isArray(response.data))) {
            const types = response.data.data?.account_types || 
                        response.data.data?.wallet_types || 
                        response.data.data?.types || 
                        response.data.data || 
                        (Array.isArray(response.data) ? response.data : []);
            
            // Log what we found for debugging
            console.log(`Found ${types.length} wallet types from ${endpoint}`);
            if (types.length > 0) {
              console.log('Sample wallet type:', JSON.stringify(types[0], null, 2));
            }
            
            return {
              success: true,
              accountTypes: types,
            };
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed:`, endpointError.message);
          // Continue to the next endpoint
        }
      }
      
      // If all endpoints failed, we'll return a success with empty array
      // This is better than throwing an error since we're using local wallet assets now
      console.log('All wallet type endpoints failed, using local assets only');
      return {
        success: true,
        accountTypes: [],
        usingLocalOnly: true
      };
    } catch (error) {
      console.error('Get account types error:', error);
      // Return success with empty array instead of error
      // Since we're using local wallet assets, API failure isn't critical
      return {
        success: true,
        accountTypes: [],
        usingLocalOnly: true,
        error: error.message || 'Failed to fetch account types'
      };
    }
  }

  // Get account balance
  async getAccountBalance(accountId) {
    try {
      console.log('Fetching account balance for:', accountId);
      const response = await this.apiClient.get(`/accounts/${accountId}/balance`);
      
      if (response.data.success) {
        return {
          success: true,
          balance: response.data.data.balance || response.data.data,
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch balance');
      }
    } catch (error) {
      console.error('Get account balance error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch balance',
      };
    }
  }

  // Get account details with enhanced wallet type information
  async getAccountDetails(accountId) {
    try {
      console.log('Fetching account details for:', accountId);
      
      // First try using the mobile-specific endpoint
      try {
        console.log(`Fetching instructions for account: ${accountId}`);
        const mobileResponse = await this.apiClient.get(`/auth/mobile/accounts/${accountId}`);
        
        if (mobileResponse.data.success) {
          const accountData = mobileResponse.data.data;
          console.log('Account details response:', JSON.stringify(mobileResponse.data, null, 2));
          console.log('Processing account data:', JSON.stringify(accountData, null, 2));
          
          // Get wallet type details if we have wallet_name (most reliable identifier across systems)
          if (accountData.wallet_name) {
            // IMPORTANT: There's a mismatch between systems:
            // - Accounts from web have numeric wallet_type_id (e.g., 2 for eDahab)
            // - API wallet types endpoint returns string IDs (e.g., "edahab")
            // So we must match by name, not by ID
            console.log(`Account has wallet_name: ${accountData.wallet_name}`);
            console.log('Numeric wallet_type_id:', accountData.wallet_type_id, '(not used for matching)');
            console.log('Fetching all wallet types to match by wallet_name');
            
            // Create a map of common wallet name variations to standardized names
            const walletNameMap = {
              'edahab': 'edahab',
              'premier bank': 'premier_bank',
              'premier': 'premier_bank',
              'sahal': 'sahal',
              'evc plus': 'evc_plus',
              'evc': 'evc_plus',
              'zaad': 'zaad',
              'salaam bank': 'salaam_bank',
              'salaam': 'salaam_bank'
            };
            
            // Try to find a match by normalized name first
            const normalizedName = walletNameMap[walletName] || walletName;
            console.log(`Normalized wallet name: "${normalizedName}"`);
            
            // First try to get the specific wallet type using the normalized name
            let walletTypeResponse;
            try {
              console.log(`Fetching wallet type details for ID: ${normalizedName}`);
              walletTypeResponse = await this.apiClient.get(`/auth/mobile/account-types/${normalizedName}`);
              if (!walletTypeResponse.data.success) {
                throw new Error('Specific wallet type not found');
              }
            } catch (err) {
              console.log(`Could not fetch specific wallet type for ${normalizedName}, fetching all account types instead`);
              // Fallback to fetching all account types
              walletTypeResponse = await this.apiClient.get('/auth/mobile/account-types/fiat');
            }
            
            if (walletTypeResponse.data.success) {
              console.log('Mobile API account types response:', JSON.stringify(walletTypeResponse.data, null, 2));
              const walletTypes = walletTypeResponse.data.data.account_types || [];
              
              // Look for matching wallet type primarily by name since IDs don't match between systems
              // (account has numeric IDs, API returns string IDs)
              const walletName = (accountData.wallet_name || '').toLowerCase();
              
              console.log(`Looking for account type matching wallet name: "${walletName}" in ${walletTypes.length} types`);
              
              // normalizedName is already defined above
              
              const matchingType = walletTypes.find(type => {
                const typeNameLower = type.name.toLowerCase();
                const typeIdLower = type.id.toLowerCase();
                
                return (
                  // Direct matches
                  typeNameLower === walletName || 
                  typeIdLower === normalizedName ||
                  
                  // Normalized name matching
                  typeIdLower === walletNameMap[walletName] ||
                  
                  // Partial matches ("eDahab" should match "edahab")
                  typeNameLower.includes(walletName) ||
                  walletName.includes(typeNameLower) ||
                  typeIdLower.includes(normalizedName) ||
                  normalizedName.includes(typeIdLower)
                );
              });
              
              if (matchingType) {
                // Add wallet type to account
                console.log(`MATCH FOUND! Wallet type: ${matchingType.name} (${matchingType.id})`);
                console.log('Complete wallet type data:', JSON.stringify(matchingType, null, 2));
                
                // Create a complete wallet_type object with all necessary fields
                accountData.wallet_type = {
                  id: matchingType.id,
                  name: matchingType.name,
                  code: matchingType.code || matchingType.name.toLowerCase().replace(/\s+/g, '_'),
                  logo: matchingType.logo,
                  payment_instructions: matchingType.payment_instructions || null
                };
                
                // Store payment instructions directly in the account for easier access
                if (matchingType.payment_instructions) {
                  accountData.payment_instructions = matchingType.payment_instructions;
                  console.log('Added payment instructions to account');
                } else {
                  console.log('No payment instructions found in wallet type data');
                }
                
                // Add additional fields that might be helpful
                if (matchingType.currency && !accountData.currency) {
                  accountData.currency = matchingType.currency;
                }
              } else {
                console.log(`NO MATCH FOUND for wallet name: ${walletName}`);
                console.log('Available wallet types:', walletTypes.map(t => `${t.name} (${t.id})`).join(', '));
              }
            }
          }
          
          return {
            success: true,
            account: accountData
          };
        }
      } catch (mobileError) {
        console.log('Mobile endpoint error, falling back to standard endpoint:', mobileError.message);
      }
      
      // Fallback to standard endpoint
      const response = await this.apiClient.get(`/accounts/${accountId}`);
      
      if (response.data.success) {
        return {
          success: true,
          account: response.data.data.account || response.data.data,
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch account details');
      }
    } catch (error) {
      console.error('Get account details error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch account details',
      };
    }
  }

  // Create new account
  async createAccount(accountData) {
    try {
      console.log('Creating new account...');
      
      // First, get wallet type information to ensure we have proper names and IDs
      let walletTypeName = '';
      let walletTypeId = accountData.account_type || accountData.wallet_type_id;
      
      // Get proper wallet name based on the wallet type ID
      try {
        console.log('Fetching wallet types to get proper wallet name...');
        const walletTypesResponse = await this.apiClient.get('/auth/mobile/account-types/fiat');
        
        if (walletTypesResponse.data.success) {
          const walletTypes = walletTypesResponse.data.data.account_types || [];
          
          // Create a map of common wallet name variations to standardized names
          const walletNameMap = {
            'edahab': 'eDahab',
            'premier_bank': 'Premier Bank',
            'premier': 'Premier Bank',
            'sahal': 'Sahal',
            'evc_plus': 'Evc Plus',
            'evc': 'Evc Plus',
            'zaad': 'Zaad',
            'salaam_bank': 'Salaam Bank',
            'salaam': 'Salaam Bank'
          };
          
          // Find matching wallet type by ID or name
          const matchingType = walletTypes.find(type => {
            return type.id == walletTypeId || 
                   type.id.toLowerCase() == walletTypeId.toLowerCase() ||
                   type.name.toLowerCase() == (accountData.name || '').toLowerCase();
          });
          
          if (matchingType) {
            walletTypeName = matchingType.name;
            walletTypeId = matchingType.id;
            console.log(`Found matching wallet type: ${walletTypeName} (${walletTypeId})`);
          } else if (walletNameMap[walletTypeId.toLowerCase()]) {
            // If we can map the ID to a name, use that
            walletTypeName = walletNameMap[walletTypeId.toLowerCase()];
            console.log(`Using mapped wallet name: ${walletTypeName} for ID: ${walletTypeId}`);
          }
        }
      } catch (error) {
        console.warn('Error fetching wallet types:', error.message);
        // Continue with account creation even if wallet type fetch fails
      }
      
      // Restructure data to match web version's account creation
      const normalizedAccountData = {
        name: accountData.name,
        account_number: accountData.account_number,
        wallet_type_id: walletTypeId,
        wallet_name: walletTypeName || accountData.name, // Set explicit wallet_name
        account_type: walletTypeId, // Set account_type to match wallet_type_id
        currency: accountData.currency || 'USD',
      };
      
      // Add any additional fields that might be useful for the mobile app
      if (accountData.bank_name) normalizedAccountData.bank_name = accountData.bank_name;
      if (accountData.deposit_address) normalizedAccountData.deposit_address = accountData.deposit_address;
      if (accountData.network) normalizedAccountData.network = accountData.network;
      
      console.log('Normalized account data:', normalizedAccountData);
      
      const response = await this.apiClient.post('/accounts', normalizedAccountData);
      
      if (response.data.success) {
        const createdAccount = response.data.data.account || response.data.data;
        
        // After account creation, fetch wallet type details to populate payment instructions
        // This ensures the account has all necessary data for deposit flow
        if (createdAccount.wallet_type_id && !createdAccount.wallet_type) {
          console.log('Fetching wallet type details for the new account...');
          try {
            const walletTypeResponse = await this.apiClient.get(`/auth/mobile/account-types/fiat`);
            
            if (walletTypeResponse.data.success) {
              const walletTypes = walletTypeResponse.data.data.account_types || 
                                walletTypeResponse.data.data || [];
              
              // Find matching wallet type
              const matchingType = walletTypes.find(type => 
                type.id == createdAccount.wallet_type_id || 
                type.name.toLowerCase() == (createdAccount.name || '').toLowerCase()
              );
              
              if (matchingType) {
                // Add wallet type data to account for better compatibility
                createdAccount.wallet_type = {
                  id: matchingType.id,
                  name: matchingType.name,
                  code: matchingType.code || matchingType.name?.toLowerCase().replace(/\s+/g, '_'),
                  payment_instructions: matchingType.payment_instructions || ''
                };
                
                // Store payment instructions directly for easier access
                if (matchingType.payment_instructions) {
                  createdAccount.payment_instructions = matchingType.payment_instructions;
                }
              }
            }
          } catch (walletTypeError) {
            console.warn('Could not fetch wallet type details:', walletTypeError.message);
            // Continue even if we couldn't fetch wallet type details
          }
        }
        
        return {
          success: true,
          account: createdAccount,
        };
      } else {
        throw new Error(response.data.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Create account error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create account',
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      console.log('Updating user profile...');
      const response = await this.apiClient.put('/v1/profile', profileData);
      
      if (response.data.success) {
        return {
          success: true,
          user: response.data.data.user || response.data.data,
        };
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      
      // Fallback to user profile endpoint
      try {
        const fallbackResponse = await this.apiClient.put('/user/profile', profileData);
        if (fallbackResponse.data.success) {
          return {
            success: true,
            user: fallbackResponse.data.data.user || fallbackResponse.data.data,
          };
        }
      } catch (fallbackError) {
        console.error('Fallback update profile error:', fallbackError);
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update profile',
      };
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      console.log('Changing user password...');
      const response = await this.apiClient.post('/user/change-password', passwordData);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Password changed successfully',
        };
      } else {
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to change password',
      };
    }
  }

  // Get recent transactions
  async getRecentTransactions(limit = 5) {
    try {
      console.log('Fetching recent transactions...');
      const response = await this.apiClient.get(`/dashboard/recent-transactions?limit=${limit}`);
      
      if (response.data.success) {
        return {
          success: true,
          transactions: response.data.data.transactions || response.data.data || [],
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Get recent transactions error:', error);
      
      // Fallback to general transactions endpoint
      try {
        const fallbackResponse = await this.apiClient.get(`/transactions?limit=${limit}`);
        if (fallbackResponse.data.success) {
          return {
            success: true,
            transactions: fallbackResponse.data.data.transactions || fallbackResponse.data.data || [],
          };
        }
      } catch (fallbackError) {
        console.error('Fallback transactions error:', fallbackError);
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch transactions',
      };
    }
  }

  // Demo mode fallback data
  getDemoData() {
    return {
      success: true,
      user: {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@hoopay.com',
        avatar: null,
        phone: '+1 234 567 8900',
        created_at: new Date().toISOString(),
      },
      stats: {
        total_balance: 1250.50,
        total_transactions: 45,
        pending_withdrawals: 2,
        active_accounts: 2,
        kyc_status: 'pending',
      },
      accounts: [
        {
          id: '1',
          name: 'Main Wallet',
          account_number: 'HW001234567',
          balance: 1250.50,
          currency: 'USD',
          status: 'active',
          type: 'wallet',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Savings Account',
          account_number: 'HW001234568',
          balance: 500.00,
          currency: 'USD',
          status: 'active',
          type: 'savings',
          created_at: new Date().toISOString(),
        }
      ],
      transactions: [
        {
          id: '1',
          type: 'deposit',
          amount: 100.00,
          currency: 'USD',
          status: 'completed',
          description: 'Bank Transfer',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
        {
          id: '2',
          type: 'transfer',
          amount: -25.00,
          currency: 'USD',
          status: 'completed',
          description: 'Payment to John Doe',
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        },
        {
          id: '3',
          type: 'withdrawal',
          amount: -50.00,
          currency: 'USD',
          status: 'pending',
          description: 'ATM Withdrawal',
          created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        },
      ]
    };
  }

  // Get combined account overview (profile + stats + accounts + transactions)
  async getAccountOverview() {
    try {
      console.log('Fetching complete account overview...');
      
      const [profileResult, statsResult, accountsResult, transactionsResult] = await Promise.allSettled([
        this.getUserProfile(),
        this.getDashboardStats(),
        this.getAccounts(),
        this.getRecentTransactions(5),
      ]);

      // Check if we have any successful responses
      const hasValidData = [profileResult, statsResult, accountsResult, transactionsResult]
        .some(result => result.status === 'fulfilled' && result.value.success);

      if (!hasValidData) {
        console.log('No API data available, using demo data');
        return this.getDemoData();
      }

      return {
        success: true,
        user: profileResult.status === 'fulfilled' && profileResult.value.success 
          ? profileResult.value.user 
          : this.getDemoData().user,
        stats: statsResult.status === 'fulfilled' && statsResult.value.success 
          ? statsResult.value.stats 
          : this.getDemoData().stats,
        accounts: accountsResult.status === 'fulfilled' && accountsResult.value.success 
          ? accountsResult.value.accounts 
          : this.getDemoData().accounts,
        transactions: transactionsResult.status === 'fulfilled' && transactionsResult.value.success 
          ? transactionsResult.value.transactions 
          : this.getDemoData().transactions,
      };
    } catch (error) {
      console.error('Account overview error:', error);
      console.log('Falling back to demo data');
      return this.getDemoData();
    }
  }

  // Format currency
  formatCurrency(amount, currency = 'USD') {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      return `$${Number(amount).toFixed(2)}`;
    }
  }

  // Format account number for display
  formatAccountNumber(accountNumber) {
    if (!accountNumber) return 'N/A';
    
    // If it's a phone number format
    if (accountNumber.startsWith('+')) {
      return accountNumber;
    }
    
    // If it's an account number, mask some digits
    if (accountNumber.length > 8) {
      const start = accountNumber.substring(0, 4);
      const end = accountNumber.substring(accountNumber.length - 4);
      return `${start}****${end}`;
    }
    
    return accountNumber;
  }

  // Get greeting based on time of day
  getTimeBasedGreeting() {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else if (hour < 22) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  }

  // Get user initials for avatar
  getUserInitials(name) {
    if (!name) return 'U';
    
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
}

export default new AccountService(); 