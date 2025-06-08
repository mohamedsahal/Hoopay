import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { LOADING_SIZES, LOADING_VARIANTS } from './types';

/**
 * LoadingDot Component
 * Individual animated dot for the dots loading variant
 */
const LoadingDot = ({ delay, size, color, variant, index, duration }) => {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation;

    if (variant === LOADING_VARIANTS.DOTS) {
      // Modern smooth dots animation with elastic easing
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: duration / 3,
            delay,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: duration / 6,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.6,
            duration: duration / 2,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
    } else if (variant === LOADING_VARIANTS.WAVE) {
      // Modern wave animation with smooth curves
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(translateYAnim, {
            toValue: -size * 0.8,
            duration: duration / 4,
            delay,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: size * 0.4,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: duration / 4,
            easing: Easing.in(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    } else if (variant === LOADING_VARIANTS.PULSE) {
      // Modern pulse with smooth scaling and opacity
      const pulseAnimations = Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.3,
              duration: duration / 2,
              delay,
              easing: Easing.out(Easing.circle),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.6,
              duration: duration / 2,
              easing: Easing.in(Easing.circle),
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: duration / 2,
              delay,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.2,
              duration: duration / 2,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
      animation = pulseAnimations;
    } else if (variant === 'bounce') {
      // Modern bouncing dots with elastic effect
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(translateYAnim, {
            toValue: -size * 1.2,
            duration: duration / 4,
            delay,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: duration / 4,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
          Animated.delay(duration / 2),
        ])
      );
    } else if (variant === 'grow') {
      // Modern growing dots with smooth scaling
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.5,
            duration: duration / 3,
            delay,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: duration / 6,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.4,
            duration: duration / 2,
            easing: Easing.in(Easing.expo),
            useNativeDriver: true,
          }),
        ])
      );
    } else if (variant === 'rotate') {
      // Modern rotating dots with orbit effect
      const rotateAnimations = Animated.parallel([
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: duration * 2,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: duration / 2,
              delay,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: duration / 2,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
      animation = rotateAnimations;
    }

    if (animation) {
      animation.start();
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [scaleAnim, opacityAnim, translateYAnim, rotateAnim, delay, variant, duration, size]);

  const getAnimatedStyle = () => {
    const baseStyle = {
      width: size,
      height: size,
      backgroundColor: color,
      borderRadius: size / 2,
      marginHorizontal: size * 0.2,
    };

    const rotation = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    switch (variant) {
      case LOADING_VARIANTS.DOTS:
        return {
          ...baseStyle,
          transform: [{ scale: scaleAnim }],
          shadowColor: color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 4,
        };
      case LOADING_VARIANTS.WAVE:
        return {
          ...baseStyle,
          transform: [{ translateY: translateYAnim }],
          shadowColor: color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 3,
        };
      case LOADING_VARIANTS.PULSE:
        return {
          ...baseStyle,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 6,
        };
      case 'bounce':
        return {
          ...baseStyle,
          transform: [{ translateY: translateYAnim }],
          shadowColor: color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
          elevation: 5,
        };
      case 'grow':
        return {
          ...baseStyle,
          transform: [{ scale: scaleAnim }],
          shadowColor: color,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 5,
        };
      case 'rotate':
        return {
          ...baseStyle,
          transform: [
            { scale: scaleAnim },
            { rotate: rotation },
          ],
          shadowColor: color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 4,
        };
      default:
        return baseStyle;
    }
  };

  return <Animated.View style={getAnimatedStyle()} />;
};

/**
 * LoadingIndicator Component
 * Provides animated dots with multiple variants and theme support
 */
const LoadingIndicator = ({
  size = LOADING_SIZES.MEDIUM,
  variant = LOADING_VARIANTS.DOTS,
  color,
  style,
  duration = 1200,
  dotCount = 3,
  testID = 'loading-indicator',
}) => {
  const { colors } = useTheme();

  // Size configurations with modern spacing
  const sizeConfig = {
    [LOADING_SIZES.SMALL]: 6,
    [LOADING_SIZES.MEDIUM]: 10,
    [LOADING_SIZES.LARGE]: 14,
    [LOADING_SIZES.EXTRA_LARGE]: 18,
  };

  const dotSize = sizeConfig[size] || sizeConfig[LOADING_SIZES.MEDIUM];
  const dotColor = color || colors.primary;
  const delayIncrement = duration / (dotCount + 2);

  return (
    <View 
      style={[styles.container, style]}
      testID={testID}
      accessible={true}
      accessibilityLabel="Loading indicator"
      accessibilityRole="progressbar"
    >
      {Array.from({ length: dotCount }, (_, index) => (
        <LoadingDot
          key={index}
          index={index}
          delay={index * delayIncrement}
          size={dotSize}
          color={dotColor}
          variant={variant}
          duration={duration}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    minHeight: 40,
  },
});

export default LoadingIndicator; 