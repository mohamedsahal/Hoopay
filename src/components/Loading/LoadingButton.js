import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Platform,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingIndicator from './LoadingIndicator';
import LoadingSpinner from './LoadingSpinner';
import { LOADING_SIZES, LOADING_VARIANTS } from './types';

/**
 * LoadingButton Component
 * Button component with integrated loading states
 */
const LoadingButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  loadingVariant = LOADING_VARIANTS.DOTS,
  loadingSize = LOADING_SIZES.SMALL,
  loadingColor,
  style,
  textStyle,
  loadingText,
  showLoadingText = true,
  testID = 'loading-button',
  children,
  ...props
}) => {
  const { colors } = useTheme();

  const isDisabled = disabled || loading;

  // Size configurations
  const sizeConfig = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
      minHeight: 36,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontSize: 16,
      minHeight: 44,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      fontSize: 18,
      minHeight: 52,
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.medium;

  // Variant configurations
  const getVariantStyles = () => {
    const baseStyles = {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderWidth: 1,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: isDisabled ? colors.primaryDisabled : colors.primary,
          borderColor: isDisabled ? colors.primaryDisabled : colors.primary,
        };
      
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderColor: isDisabled ? colors.primaryDisabled : colors.primary,
          borderWidth: 1,
        };
      
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: isDisabled ? colors.border : colors.primary,
          borderWidth: 2,
        };
      
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        };
      
      case 'danger':
        return {
          backgroundColor: isDisabled ? colors.primaryDisabled : colors.error,
          borderColor: isDisabled ? colors.primaryDisabled : colors.error,
          borderWidth: 1,
        };
      
      case 'success':
        return {
          backgroundColor: isDisabled ? colors.primaryDisabled : colors.success,
          borderColor: isDisabled ? colors.primaryDisabled : colors.success,
          borderWidth: 1,
        };
      
      default:
        return baseStyles;
    }
  };

  const getTextColor = () => {
    if (variant === 'primary' || variant === 'danger' || variant === 'success') {
      return isDisabled ? colors.textSecondary : '#FFFFFF';
    }
    
    return isDisabled ? colors.textSecondary : colors.primary;
  };

  const getLoadingColor = () => {
    if (loadingColor) return loadingColor;
    
    if (variant === 'primary' || variant === 'danger' || variant === 'success') {
      return '#FFFFFF';
    }
    
    return colors.primary;
  };

  const renderLoadingIndicator = () => {
    if (loadingVariant === 'activity') {
      return (
        <ActivityIndicator
          size={loadingSize === LOADING_SIZES.SMALL ? 'small' : 'large'}
          color={getLoadingColor()}
          style={styles.activityIndicator}
        />
      );
    }

    if (loadingVariant === LOADING_VARIANTS.SPINNER ||
        loadingVariant === LOADING_VARIANTS.PULSE ||
        loadingVariant === LOADING_VARIANTS.WAVE) {
      return (
        <LoadingSpinner
          size={loadingSize}
          variant={loadingVariant}
          color={getLoadingColor()}
          style={styles.loadingComponent}
        />
      );
    }

    return (
      <LoadingIndicator
        size={loadingSize}
        variant={loadingVariant}
        color={getLoadingColor()}
        style={styles.loadingComponent}
      />
    );
  };

  const displayText = loading && loadingText && showLoadingText 
    ? loadingText 
    : title;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          minHeight: currentSize.minHeight,
        },
        getVariantStyles(),
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
      testID={testID}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      accessibilityLabel={loading ? `Loading: ${displayText}` : displayText}
      {...props}
    >
      <View style={styles.content}>
        {loading && (
          <View style={styles.loadingContainer}>
            {renderLoadingIndicator()}
          </View>
        )}
        
        {children || (
          <Text
            style={[
              styles.text,
              {
                fontSize: currentSize.fontSize,
                color: getTextColor(),
                opacity: loading ? 0.8 : 1,
              },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {displayText}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: '#000',
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 4 : 0,
  },
  disabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    marginRight: 8,
  },
  loadingComponent: {
    padding: 0,
  },
  activityIndicator: {
    marginRight: 0,
  },
  text: {
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    textAlign: 'center',
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0.1,
  },
});

export default LoadingButton; 