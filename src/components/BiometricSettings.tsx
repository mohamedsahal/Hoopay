import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import Colors from '../constants/Colors';
import biometricAuthService from '../services/biometricAuthService';

interface BiometricSettingsProps {
  colors?: any;
  onBiometricChange?: (enabled: boolean) => void;
}

const BiometricSettings: React.FC<BiometricSettingsProps> = ({
  colors = Colors,
  onBiometricChange
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [displayName, setDisplayName] = useState('Biometric Authentication');

  useEffect(() => {
    loadBiometricInfo();
  }, []);

  const loadBiometricInfo = async () => {
    try {
      setIsLoading(true);
      
      const [
        availability,
        enabled,
        biometricDisplayName
      ] = await Promise.all([
        biometricAuthService.isBiometricAvailable(),
        biometricAuthService.isBiometricEnabled(),
        biometricAuthService.getBiometricDisplayName()
      ]);

      setIsAvailable(availability.available);
      setIsEnabled(enabled);
      setDisplayName(biometricDisplayName);
      
      console.log('Loaded biometric info:', { 
        available: availability.available, 
        enabled, 
        displayName: biometricDisplayName 
      });
    } catch (error) {
      console.error('Error loading biometric info:', error);
      setIsAvailable(false);
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (isToggling) return;

    try {
      setIsToggling(true);

      if (value) {
        await enableBiometric();
      } else {
        await disableBiometric();
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const enableBiometric = async () => {
    try {
      const shouldSetup = await biometricAuthService.showBiometricSetupPrompt();
      
      if (!shouldSetup) {
        return;
      }

      Alert.alert(
        'Setup Required',
        'To enable biometric authentication, please log out and log back in. You will be prompted to set up biometric authentication during login.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK' }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Setup Failed',
        error.message || 'Failed to enable biometric authentication',
        [{ text: 'OK' }]
      );
    }
  };

  const disableBiometric = async () => {
    try {
      Alert.alert(
        'Disable Biometric Authentication',
        `Are you sure you want to disable ${displayName}? You will need to use your password to sign in.`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await biometricAuthService.disableBiometricAuth();
                if (result.success) {
                  setIsEnabled(false);
                  onBiometricChange?.(false);
                  
                  Alert.alert(
                    'Disabled',
                    'Biometric authentication has been disabled.',
                    [{ text: 'OK' }]
                  );
                }
              } catch (error: any) {
                Alert.alert(
                  'Error',
                  error.message || 'Failed to disable biometric authentication',
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to disable biometric authentication',
        [{ text: 'OK' }]
      );
    }
  };

  const renderBiometricIcon = () => {
    const iconColor = colors.textSecondary || '#666';

    return (
      <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 1C8.1 1 5 4.1 5 8V10.6C5 14.8 7.2 18.4 10.5 20.4C11 20.7 11.5 20.3 11.5 19.7V19.1C11.5 18.8 11.3 18.6 11 18.4C8.4 16.9 6.5 13.9 6.5 10.6V8C6.5 4.9 8.9 2.5 12 2.5S17.5 4.9 17.5 8V10.6C17.5 13.9 15.6 16.9 13 18.4C12.7 18.6 12.5 18.8 12.5 19.1V19.7C12.5 20.3 13 20.7 13.5 20.4C16.8 18.4 19 14.8 19 10.6V8C19 4.1 15.9 1 12 1Z"
          fill={iconColor}
        />
      </Svg>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary || Colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary || '#666' }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!isAvailable) {
    return (
      <View style={styles.unavailableContainer}>
        {renderBiometricIcon()}
        <View style={styles.unavailableTextContainer}>
          <Text style={[styles.unavailableTitle, { color: colors.text || '#000' }]}>
            Biometric Authentication
          </Text>
          <Text style={[styles.unavailableDescription, { color: colors.textSecondary || '#666' }]}>
            Not available on this device
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.settingIconContainer}>
        {renderBiometricIcon()}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text || '#000' }]}>
          {displayName}
        </Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary || '#666' }]}>
          {isEnabled 
            ? 'Quick and secure access enabled'
            : 'Enable for quick sign in'
          }
        </Text>
      </View>
      <View style={styles.settingControl}>
        {isToggling ? (
          <ActivityIndicator size="small" color={colors.primary || Colors.primary} />
        ) : (
          <Switch
            value={isEnabled}
            onValueChange={handleToggleBiometric}
            trackColor={{ 
              false: colors.border || '#E0E0E0', 
              true: colors.primaryLight || colors.primary || Colors.primary 
            }}
            thumbColor={colors.surface || '#FFF'}
            disabled={isToggling}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  unavailableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    opacity: 0.6,
  },
  unavailableTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  unavailableTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  unavailableDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  settingControl: {
    marginLeft: 15,
  },
});

export default BiometricSettings; 