import api from './api';
import { ENDPOINTS } from '../config/apiConfig';
import * as SecureStore from 'expo-secure-store';
import profileService from './profileService';

// Account data type definitions
interface AccountData {
  name: string;
  account_number?: string;
  account_type: string;
  bank_name?: string;
  currency?: string;
  [key: string]: any; // For any additional properties
}

/**
 * Service for handling account-related API calls
 */
const accountService = {
  /**
   * Get all accounts
   * @returns Promise with accounts data
   */
  getAllAccounts: async (): Promise<any> => {
    try {
      // First check if we have a valid auth token and refresh if needed
      await profileService.refreshTokenIfNeeded();
      
      console.log('Fetching accounts from mobile API endpoint');
      
      // Use the path that matches the actual Laravel routes
      const endpoint = '/auth/mobile/accounts';
      console.log('Using endpoint:', endpoint);
      
      // Don't add custom headers as they will be added by the request interceptor
      const response = await api.get(endpoint, {
        timeout: 10000 // Add shorter timeout to avoid long waits
      });
      
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  /**
   * Create a new account
   * @param accountData - Account data to be created
   * @returns Promise with created account data
   */
  createAccount: async (accountData: AccountData): Promise<any> => {
    try {
      // First check if we have a valid auth token and refresh if needed
      await profileService.refreshTokenIfNeeded();
      
      console.log('Creating account with mobile API endpoint');
      // Use the path that matches the actual Laravel routes
      const endpoint = '/auth/mobile/accounts';
      console.log('Using endpoint for creation:', endpoint);
      
      // Add detailed logging of account data being sent
      console.log('Account data being sent:', JSON.stringify(accountData, null, 2));
      
      // Don't add custom headers as they will be added by the request interceptor
      const response = await api.post(endpoint, accountData, {
        timeout: 10000, // Add shorter timeout to avoid long waits
        headers: {
          'Content-Type': 'application/json' // Explicitly set content type
        }
      });
      
      console.log('API Create Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating account:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get account details
   * @param accountId - ID of the account to retrieve
   * @returns Promise with account details
   */
  getAccountDetails: async (accountId: string | number): Promise<any> => {
    try {
      // First check if we have a valid auth token and refresh if needed
      await profileService.refreshTokenIfNeeded();
      
      console.log(`Fetching account details for ID: ${accountId}`);
      // Use the path that matches the actual Laravel routes
      const detailEndpoint = `/auth/mobile/accounts/${accountId}`;
      console.log('Using detail endpoint:', detailEndpoint);
      
      // Don't add custom headers as they will be added by the request interceptor
      const response = await api.get(detailEndpoint, {
        timeout: 10000 // Add shorter timeout to avoid long waits
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching account details:', error);
      throw error;
    }
  },

  /**
   * Update an account
   * @param accountId - ID of the account to update
   * @param accountData - Updated account data
   * @returns Promise with updated account data
   */
  updateAccount: async (accountId: string | number, accountData: AccountData): Promise<any> => {
    try {
      // First check if we have a valid auth token and refresh if needed
      await profileService.refreshTokenIfNeeded();
      
      console.log(`Updating account with ID: ${accountId}`);
      // Use the path that matches the actual Laravel routes
      const updateEndpoint = `/auth/mobile/accounts/${accountId}`;
      console.log('Using update endpoint:', updateEndpoint);
      
      // Don't add custom headers as they will be added by the request interceptor
      const response = await api.put(updateEndpoint, accountData, {
        timeout: 10000 // Add shorter timeout to avoid long waits
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  },

  /**
   * Delete an account
   * @param accountId - ID of the account to delete
   * @returns Promise with deletion confirmation
   */
  deleteAccount: async (accountId: string | number): Promise<any> => {
    try {
      // First check if we have a valid auth token and refresh if needed
      await profileService.refreshTokenIfNeeded();
      
      console.log(`Deleting account with ID: ${accountId}`);
      // Use the path that matches the actual Laravel routes
      const deleteEndpoint = `/auth/mobile/accounts/${accountId}`;
      console.log('Using delete endpoint:', deleteEndpoint);
      
      // Don't add custom headers as they will be added by the request interceptor
      const response = await api.delete(deleteEndpoint, {
        timeout: 10000 // Add shorter timeout to avoid long waits
      });
      
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
};

export default accountService;
