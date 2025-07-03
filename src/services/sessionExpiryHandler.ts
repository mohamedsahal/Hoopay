import * as SecureStore from 'expo-secure-store';
import { resetToLogin } from './navigationService';
import { Alert } from 'react-native';

/**
 * Global session expiry handler service
 * Handles session expiration by clearing auth data and redirecting to login
 */
class SessionExpiryHandler {
  private isHandlingExpiry = false;

  /**
   * Handle session expiration
   * Clears all auth data (including biometric credentials) and redirects to login page
   * @param showAlert - Whether to show an alert before redirecting (default: false)
   * @param alertMessage - Custom alert message
   */
  async handleSessionExpiry(showAlert: boolean = false, alertMessage?: string) {
    // Prevent multiple simultaneous calls
    if (this.isHandlingExpiry) {
      return;
    }

    this.isHandlingExpiry = true;

    try {
      console.log('Session expired - clearing auth data and redirecting to login');
      
      // Clear all auth-related data
      await this.clearAuthData();

      if (showAlert) {
        const message = alertMessage || 'Your session has expired. Please log in again.';
        Alert.alert(
          'Session Expired',
          message,
          [
            {
              text: 'OK',
              onPress: () => {
                resetToLogin();
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        // Redirect immediately without alert
        resetToLogin();
      }
    } catch (error) {
      console.error('Error handling session expiry:', error);
      // Still redirect to login even if clearing data failed
      resetToLogin();
    } finally {
      this.isHandlingExpiry = false;
    }
  }

  /**
   * Clear all authentication-related data from storage
   * Including biometric authentication data for complete security cleanup
   */
  private async clearAuthData() {
    const authKeys = [
      'auth_token',
      'userData',
      'userEmail',
      'isFromLogout',
      // Biometric authentication keys
      'biometric_enabled',
      'user_biometric_credentials'
    ];

    await Promise.all(
      authKeys.map(key => 
        SecureStore.deleteItemAsync(key).catch(error => 
          console.warn(`Failed to delete ${key}:`, error)
        )
      )
    );

    console.log('Session expiry: Cleared all auth data including biometric credentials');
  }

  /**
   * Check if an error indicates session expiration
   * @param error - The error object to check
   * @returns boolean indicating if it's a session expiry error
   */
  isSessionExpiryError(error: any): boolean {
    if (!error) return false;

    // Check for 401 status code
    if (error.response?.status === 401) {
      return true;
    }

    // Check for specific error messages
    const errorMessage = error.message?.toLowerCase() || '';
    const sessionExpiryMessages = [
      'session expired',
      'authentication failed',
      'token expired',
      'unauthorized',
      'invalid token',
      'session timeout'
    ];

    return sessionExpiryMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Handle API errors and redirect to login if it's a session expiry
   * @param error - The error object
   * @param showAlert - Whether to show alert before redirecting
   */
  async handleApiError(error: any, showAlert: boolean = false) {
    if (this.isSessionExpiryError(error)) {
      await this.handleSessionExpiry(showAlert);
      return true; // Indicates that session expiry was handled
    }
    return false; // Not a session expiry error
  }

  /**
   * Clear only biometric authentication data
   * Useful for biometric-specific session expiry scenarios
   */
  async clearBiometricData() {
    const biometricKeys = [
      'biometric_enabled',
      'user_biometric_credentials'
    ];

    await Promise.all(
      biometricKeys.map(key => 
        SecureStore.deleteItemAsync(key).catch(error => 
          console.warn(`Failed to delete biometric key ${key}:`, error)
        )
      )
    );

    console.log('Session expiry: Cleared biometric authentication data');
  }
}

// Export singleton instance
export const sessionExpiryHandler = new SessionExpiryHandler();
export default sessionExpiryHandler; 