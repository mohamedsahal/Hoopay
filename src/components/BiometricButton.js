import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import Colors from '../constants/Colors';
import biometricAuthService from '../services/biometricAuthService';

const BiometricButton = ({ 
  onSuccess, 
  onError, 
  onFallback,
  size = 'large',
  showLabel = true,
  style = {},
  disabled = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const { available } = await biometricAuthService.isBiometricAvailable();
      const isEnabled = await biometricAuthService.isBiometricEnabled();
      const types = await biometricAuthService.getSupportedBiometricTypes();
      const displayName = await biometricAuthService.getBiometricDisplayName();

      setIsAvailable(available && isEnabled);
      setBiometricInfo({
        types,
        displayName,
        enabled: isEnabled,
      });
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleBiometricAuth = async () => {
    if (disabled || isLoading || !isAvailable) return;

    setIsLoading(true);
    startPulseAnimation();

    try {
      const result = await biometricAuthService.quickBiometricLogin();

      if (result.success) {
        stopPulseAnimation();
        onSuccess?.(result);
      } else if (result.fallbackToPassword) {
        stopPulseAnimation();
        onFallback?.(result);
      } else {
        stopPulseAnimation();
        onError?.(result);
      }
    } catch (error) {
      stopPulseAnimation();
      onError?.({ 
        success: false, 
        error: error.message || 'Biometric authentication failed' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getBiometricIcon = () => {
    if (!biometricInfo?.types || biometricInfo.types.length === 0) {
      return renderFingerprintIcon();
    }

    // Prioritize Face ID if available
    const hasFaceId = biometricInfo.types.some(t => t.type === 'faceId');
    const hasFingerprint = biometricInfo.types.some(t => t.type === 'fingerprint');

    if (hasFaceId) {
      return renderFaceIdIcon();
    } else if (hasFingerprint) {
      return renderFingerprintIcon();
    } else {
      return renderGenericBiometricIcon();
    }
  };

  const renderFingerprintIcon = () => (
    <Svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 1C8.1 1 5 4.1 5 8V10.6C5 14.8 7.2 18.4 10.5 20.4C11 20.7 11.5 20.3 11.5 19.7V19.1C11.5 18.8 11.3 18.6 11 18.4C8.4 16.9 6.5 13.9 6.5 10.6V8C6.5 4.9 8.9 2.5 12 2.5S17.5 4.9 17.5 8V10.6C17.5 13.9 15.6 16.9 13 18.4C12.7 18.6 12.5 18.8 12.5 19.1V19.7C12.5 20.3 13 20.7 13.5 20.4C16.8 18.4 19 14.8 19 10.6V8C19 4.1 15.9 1 12 1Z"
        fill={getIconColor()}
      />
      <Path
        d="M12 6C10.3 6 9 7.3 9 9V11.8C9 13.5 9.8 15.1 11.1 16.1C11.4 16.3 11.5 16.7 11.3 17C11.1 17.3 10.7 17.4 10.4 17.2C8.8 15.9 7.5 13.9 7.5 11.8V9C7.5 6.5 9.5 4.5 12 4.5S16.5 6.5 16.5 9V11.8C16.5 13.9 15.2 15.9 13.6 17.2C13.3 17.4 12.9 17.3 12.7 17C12.5 16.7 12.6 16.3 12.9 16.1C14.2 15.1 15 13.5 15 11.8V9C15 7.3 13.7 6 12 6Z"
        fill={getIconColor()}
      />
    </Svg>
  );

  const renderFaceIdIcon = () => (
    <Svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 10C8.45 10 8 9.55 8 9S8.45 8 9 8 10 8.45 10 9 9.55 10 9 10Z"
        fill={getIconColor()}
      />
      <Path
        d="M15 10C14.45 10 14 9.55 14 9S14.45 8 15 8 16 8.45 16 9 15.55 10 15 10Z"
        fill={getIconColor()}
      />
      <Path
        d="M12 17.5C14.33 17.5 16.31 16.04 17 14H7C7.69 16.04 9.67 17.5 12 17.5Z"
        fill={getIconColor()}
      />
      <Path
        d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20Z"
        fill={getIconColor()}
        stroke={getIconColor()}
        strokeWidth="1"
      />
    </Svg>
  );

  const renderGenericBiometricIcon = () => (
    <Svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9S13.1 11 12 11 10 10.1 10 9 10.9 7 12 7ZM18 14.43C18 16.22 15.86 17.78 12 17.78S6 16.22 6 14.43V13.57C6 13.1 6.45 12.7 7 12.7S8 13.1 8 13.57C8 14.38 9.71 15.28 12 15.28S16 14.38 16 13.57C16 13.1 16.45 12.7 17 12.7S18 13.1 18 13.57V14.43Z"
        fill={getIconColor()}
      />
    </Svg>
  );

  const getIconSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'medium': return 28;
      case 'large': return 36;
      case 'xlarge': return 48;
      default: return 36;
    }
  };

  const getIconColor = () => {
    if (disabled || !isAvailable) {
      return '#C0C0C0';
    }
    return isLoading ? Colors.primary : Colors.secondary;
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small': return 40;
      case 'medium': return 56;
      case 'large': return 72;
      case 'xlarge': return 88;
      default: return 72;
    }
  };

  // Don't render if biometrics are not available or enabled
  if (!isAvailable) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: getButtonSize(),
              height: getButtonSize(),
              backgroundColor: disabled ? '#F5F5F5' : Colors.surface,
              borderColor: disabled ? '#E0E0E0' : Colors.primary,
            }
          ]}
          onPress={handleBiometricAuth}
          disabled={disabled || isLoading || !isAvailable}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            getBiometricIcon()
          )}
        </TouchableOpacity>
      </Animated.View>
      
      {showLabel && biometricInfo && (
        <Text style={[
          styles.label,
          { color: disabled ? '#C0C0C0' : Colors.textSecondary }
        ]}>
          {biometricInfo.displayName}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 100,
  },
});

export default BiometricButton; 