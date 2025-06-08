import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { LOADING_SIZES, LOADING_VARIANTS } from './types';

/**
 * LoadingSpinner Component
 * Provides various spinner animations with theme support
 */
const LoadingSpinner = ({
  size = LOADING_SIZES.MEDIUM,
  variant = LOADING_VARIANTS.SPINNER,
  color,
  style,
  duration = 1200,
  testID = 'loading-spinner',
}) => {
  const { colors } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0.8)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Size configurations
  const sizeConfig = {
    [LOADING_SIZES.SMALL]: { width: 20, height: 20, borderWidth: 2 },
    [LOADING_SIZES.MEDIUM]: { width: 32, height: 32, borderWidth: 3 },
    [LOADING_SIZES.LARGE]: { width: 48, height: 48, borderWidth: 4 },
    [LOADING_SIZES.EXTRA_LARGE]: { width: 64, height: 64, borderWidth: 5 },
  };

  const currentSize = sizeConfig[size] || sizeConfig[LOADING_SIZES.MEDIUM];
  const spinnerColor = color || colors.primary;

  useEffect(() => {
    let animation;

    if (variant === LOADING_VARIANTS.SPINNER) {
      // Rotation animation
      animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
    } else if (variant === LOADING_VARIANTS.PULSE) {
      // Pulse animation
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.2,
            duration: duration / 2,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 0.8,
            duration: duration / 2,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
        ])
      );
    } else if (variant === LOADING_VARIANTS.WAVE) {
      // Scale wave animation
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.3,
            duration: duration / 3,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.7,
            duration: duration / 3,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: duration / 3,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
        ])
      );
    }

    if (animation) {
      animation.start();
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [variant, duration, spinValue, pulseValue, scaleValue]);

  const getSpinnerStyle = () => {
    const baseStyle = {
      width: currentSize.width,
      height: currentSize.height,
      borderRadius: currentSize.width / 2,
    };

    switch (variant) {
      case LOADING_VARIANTS.SPINNER:
        return {
          ...baseStyle,
          borderWidth: currentSize.borderWidth,
          borderColor: colors.border,
          borderTopColor: spinnerColor,
          transform: [
            {
              rotate: spinValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        };

      case LOADING_VARIANTS.PULSE:
        return {
          ...baseStyle,
          backgroundColor: spinnerColor,
          transform: [{ scale: pulseValue }],
        };

      case LOADING_VARIANTS.WAVE:
        return {
          ...baseStyle,
          backgroundColor: spinnerColor,
          opacity: 0.8,
          transform: [{ scale: scaleValue }],
        };

      default:
        return baseStyle;
    }
  };

  return (
    <View 
      style={[styles.container, style]}
      testID={testID}
      accessible={true}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    >
      <Animated.View style={[styles.spinner, getSpinnerStyle()]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  spinner: {
    // Base styles - specific styles are applied dynamically
  },
});

export default LoadingSpinner; 