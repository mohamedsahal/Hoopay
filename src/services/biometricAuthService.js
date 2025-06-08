import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';

class BiometricAuthService {
  constructor() {
    this.BIOMETRIC_KEY = 'biometric_enabled';
    this.USER_CREDENTIALS_KEY = 'user_biometric_credentials';
  }

  // Check if biometric authentication is available on the device
  async isBiometricAvailable() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      return {
        available: hasHardware && isEnrolled,
        hasHardware,
        isEnrolled,
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return {
        available: false,
        hasHardware: false,
        isEnrolled: false,
      };
    }
  }

  // Get available biometric types on the device
  async getSupportedBiometricTypes() {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const biometricTypes = [];

      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricTypes.push({
          type: 'fingerprint',
          name: 'Fingerprint',
          icon: 'fingerprint',
        });
      }

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricTypes.push({
          type: 'faceId',
          name: Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition',
          icon: 'face-recognition',
        });
      }

      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricTypes.push({
          type: 'iris',
          name: 'Iris Recognition',
          icon: 'eye',
        });
      }

      return biometricTypes;
    } catch (error) {
      console.error('Error getting biometric types:', error);
      return [];
    }
  }

  // Get user-friendly biometric name for display
  async getBiometricDisplayName() {
    try {
      const types = await this.getSupportedBiometricTypes();
      
      if (types.length === 0) {
        return 'Biometric Authentication';
      }

      if (types.length === 1) {
        return types[0].name;
      }

      // Multiple types available
      const names = types.map(t => t.name);
      if (names.length === 2) {
        return `${names[0]} or ${names[1]}`;
      }
      
      return `${names.slice(0, -1).join(', ')}, or ${names[names.length - 1]}`;
    } catch (error) {
      console.error('Error getting biometric display name:', error);
      return 'Biometric Authentication';
    }
  }

  // Enable biometric authentication for a user
  async enableBiometricAuth(userCredentials) {
    try {
      const { available } = await this.isBiometricAvailable();
      console.log('Enabling biometric auth - availability:', available);
      
      if (!available) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // Authenticate user first to ensure they can use biometrics
      const biometricName = await this.getBiometricDisplayName();
      console.log('Setting up biometric auth with:', biometricName);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Set up biometric authentication',
        subtitle: `Use your ${biometricName} to enable quick sign in`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Cancel Setup',
      });
      
      console.log('Biometric setup result:', result);
      
      if (result.success) {
        // Store user credentials securely
        await SecureStore.setItemAsync(
          this.USER_CREDENTIALS_KEY,
          JSON.stringify(userCredentials)
        );
        
        // Enable biometric flag
        await SecureStore.setItemAsync(this.BIOMETRIC_KEY, 'true');
        console.log('Biometric auth enabled successfully');
        
        return {
          success: true,
          message: 'Biometric authentication enabled successfully',
        };
      } else {
        let errorMessage = 'Biometric setup failed';
        
        if (result.error === 'user_cancel') {
          errorMessage = 'Biometric setup was cancelled by user';
        } else if (result.error === 'user_fallback') {
          errorMessage = 'User cancelled biometric setup';
        } else if (result.error === 'biometric_unknown_error') {
          errorMessage = 'Unknown biometric error occurred during setup';
        }
        
        console.log('Biometric setup failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      throw new Error(error.message || 'Failed to enable biometric authentication');
    }
  }

  // Disable biometric authentication
  async disableBiometricAuth() {
    try {
      await SecureStore.deleteItemAsync(this.BIOMETRIC_KEY);
      await SecureStore.deleteItemAsync(this.USER_CREDENTIALS_KEY);
      
      return {
        success: true,
        message: 'Biometric authentication disabled',
      };
    } catch (error) {
      console.error('Error disabling biometric auth:', error);
      throw new Error('Failed to disable biometric authentication');
    }
  }

  // Check if biometric authentication is enabled for the current user
  async isBiometricEnabled() {
    try {
      const enabled = await SecureStore.getItemAsync(this.BIOMETRIC_KEY);
      console.log('Biometric enabled status:', enabled);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return false;
    }
  }

  // Authenticate user with biometrics
  async authenticateWithBiometrics(promptMessage = 'Authenticate to access your account') {
    try {
      const { available } = await this.isBiometricAvailable();
      
      if (!available) {
        return {
          success: false,
          error: 'Biometric authentication is not available',
          fallbackToPassword: true,
        };
      }

      const biometricName = await this.getBiometricDisplayName();
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        subtitle: `Use your ${biometricName} to continue`,
        cancelLabel: 'Use Password',
        disableDeviceFallback: false,
        fallbackLabel: 'Use Password Instead',
      });

      if (result.success) {
        // Get stored user credentials
        const credentialsJson = await SecureStore.getItemAsync(this.USER_CREDENTIALS_KEY);
        
        if (credentialsJson) {
          const credentials = JSON.parse(credentialsJson);
          return {
            success: true,
            userCredentials: credentials,
            authMethod: 'biometric',
          };
        } else {
          return {
            success: false,
            error: 'No stored credentials found',
            fallbackToPassword: true,
          };
        }
      } else {
        let errorMessage = 'Biometric authentication failed';
        
        if (result.error === 'unknown') {
          errorMessage = 'Biometric authentication was cancelled';
        } else if (result.error === 'user_cancel') {
          errorMessage = 'Authentication was cancelled by user';
        } else if (result.error === 'user_fallback') {
          errorMessage = 'User chose to use password instead';
        } else if (result.error === 'biometric_unknown_error') {
          errorMessage = 'Unknown biometric error occurred';
        } else if (result.error === 'invalid_context') {
          errorMessage = 'Invalid authentication context';
        } else if (result.error === 'not_dismissed') {
          errorMessage = 'Authentication dialog not dismissed';
        }

        return {
          success: false,
          error: errorMessage,
          fallbackToPassword: result.error === 'user_fallback' || result.error === 'user_cancel',
        };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: error.message || 'Biometric authentication failed',
        fallbackToPassword: true,
      };
    }
  }

  // Quick biometric login (for login screen)
  async quickBiometricLogin() {
    try {
      const isEnabled = await this.isBiometricEnabled();
      console.log('Quick login - biometric enabled:', isEnabled);
      
      if (!isEnabled) {
        return {
          success: false,
          error: 'Biometric authentication is not enabled',
          requireSetup: true,
        };
      }

      const authResult = await this.authenticateWithBiometrics('Sign in to Hoopay');
      console.log('Quick login - auth result:', authResult);
      
      if (authResult.success) {
        return {
          success: true,
          userCredentials: authResult.userCredentials,
          message: 'Biometric login successful',
        };
      } else {
        return authResult;
      }
    } catch (error) {
      console.error('Quick biometric login error:', error);
      return {
        success: false,
        error: error.message || 'Biometric login failed',
        fallbackToPassword: true,
      };
    }
  }

  // Show biometric setup prompt
  async showBiometricSetupPrompt() {
    try {
      const { available, hasHardware, isEnrolled } = await this.isBiometricAvailable();
      const biometricName = await this.getBiometricDisplayName();
      
      if (!hasHardware) {
        Alert.alert(
          'Biometric Authentication Unavailable',
          'This device does not support biometric authentication.',
          [{ text: 'OK' }]
        );
        return false;
      }

      if (!isEnrolled) {
        Alert.alert(
          'No Biometrics Enrolled',
          `Please set up ${biometricName} in your device settings first.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // On iOS, this will open Settings app
              if (Platform.OS === 'ios') {
                LocalAuthentication.authenticateAsync({
                  promptMessage: 'Please set up biometrics in Settings',
                });
              }
            }}
          ]
        );
        return false;
      }

      return new Promise((resolve) => {
        Alert.alert(
          'Enable Biometric Login',
          `Would you like to use ${biometricName} to sign in to Hoopay quickly and securely?`,
          [
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Enable',
              onPress: () => resolve(true),
            },
          ]
        );
      });
    } catch (error) {
      console.error('Error showing biometric setup prompt:', error);
      return false;
    }
  }

  // Get security level description
  async getSecurityInfo() {
    try {
      const { available } = await this.isBiometricAvailable();
      const types = await this.getSupportedBiometricTypes();
      
      if (!available) {
        return {
          level: 'password',
          description: 'Password authentication only',
          icon: 'lock',
        };
      }

      const hasFingerprint = types.some(t => t.type === 'fingerprint');
      const hasFaceId = types.some(t => t.type === 'faceId');
      
      if (hasFaceId) {
        return {
          level: 'high',
          description: 'Face ID + Password',
          icon: 'face-recognition',
        };
      } else if (hasFingerprint) {
        return {
          level: 'high',
          description: 'Fingerprint + Password',
          icon: 'fingerprint',
        };
      } else {
        return {
          level: 'medium',
          description: 'Biometric + Password',
          icon: 'shield-check',
        };
      }
    } catch (error) {
      console.error('Error getting security info:', error);
      return {
        level: 'password',
        description: 'Password authentication',
        icon: 'lock',
      };
    }
  }

  // Debug function to check biometric status
  async debugBiometricStatus() {
    try {
      console.log('=== Biometric Debug Info ===');
      
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isEnabled = await this.isBiometricEnabled();
      
      console.log('Has biometric hardware:', hasHardware);
      console.log('Has enrolled biometrics:', isEnrolled);
      console.log('Supported types:', types);
      console.log('Is biometric enabled in app:', isEnabled);
      
      const storedCredentials = await SecureStore.getItemAsync(this.USER_CREDENTIALS_KEY);
      console.log('Has stored credentials:', !!storedCredentials);
      
      console.log('=== End Debug Info ===');
      
      return {
        hasHardware,
        isEnrolled,
        types,
        isEnabled,
        hasStoredCredentials: !!storedCredentials,
      };
    } catch (error) {
      console.error('Error getting debug info:', error);
      return null;
    }
  }
}

export default new BiometricAuthService(); 