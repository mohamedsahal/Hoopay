import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  Platform, 
  Animated, 
  TouchableWithoutFeedback,
  StatusBar,
  Dimensions,
} from 'react-native';
import LoadingIndicator from './LoadingIndicator';
import LoadingSpinner from './LoadingSpinner';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  LOADING_SIZES, 
  LOADING_VARIANTS, 
  LOADING_POSITIONS,
  ANIMATION_TYPES,
} from './types';

// Conditionally import BlurView
let BlurView;
try {
  BlurView = require('expo-blur').BlurView;
} catch (error) {
  console.log('BlurView not available, using fallback');
  BlurView = null;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * LoadingOverlay Component
 * Full-screen loading overlay with multiple variants and positions
 */
const LoadingOverlay = ({
  visible,
  message = 'Loading...',
  size = LOADING_SIZES.LARGE,
  variant = LOADING_VARIANTS.DOTS,
  position = LOADING_POSITIONS.CENTER,
  animationType = ANIMATION_TYPES.FADE,
  useBlur = false,
  dismissible = false,
  onDismiss,
  backgroundColor,
  color,
  showMessage = true,
  duration = 1200,
  style,
  contentStyle,
  testID = 'loading-overlay',
}) => {
  const { colors, isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      const animations = [];
      
      if (animationType === ANIMATION_TYPES.FADE) {
        animations.push(
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        );
      }
      
      if (animationType === ANIMATION_TYPES.SCALE) {
        animations.push(
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          })
        );
      }
      
      if (animationType === ANIMATION_TYPES.SLIDE) {
        animations.push(
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        );
      }

      Animated.parallel(animations).start();
    } else {
      // Exit animation
      const animations = [];
      
      animations.push(
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      );
      
      if (animationType === ANIMATION_TYPES.SCALE) {
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          })
        );
      }
      
      if (animationType === ANIMATION_TYPES.SLIDE) {
        animations.push(
          Animated.timing(slideAnim, {
            toValue: 50,
            duration: 200,
            useNativeDriver: true,
          })
        );
      }

      Animated.parallel(animations).start();
    }
  }, [visible, animationType, fadeAnim, scaleAnim, slideAnim]);

  if (!visible) return null;

  const getPositionStyle = () => {
    switch (position) {
      case LOADING_POSITIONS.TOP:
        return { justifyContent: 'flex-start', paddingTop: 100 };
      case LOADING_POSITIONS.BOTTOM:
        return { justifyContent: 'flex-end', paddingBottom: 100 };
      case LOADING_POSITIONS.FULL_SCREEN:
        return { justifyContent: 'center', alignItems: 'center' };
      default: // CENTER
        return { justifyContent: 'center', alignItems: 'center' };
    }
  };

  const getContentAnimationStyle = () => {
    const baseStyle = {
      opacity: fadeAnim,
    };

    if (animationType === ANIMATION_TYPES.SCALE) {
      return {
        ...baseStyle,
        transform: [{ scale: scaleAnim }],
      };
    }
    
    if (animationType === ANIMATION_TYPES.SLIDE) {
      return {
        ...baseStyle,
        transform: [{ translateY: slideAnim }],
      };
    }

    return baseStyle;
  };

  const LoadingContent = () => {
    const renderLoadingComponent = () => {
      if (variant === LOADING_VARIANTS.SPINNER || 
          variant === LOADING_VARIANTS.PULSE || 
          variant === LOADING_VARIANTS.WAVE) {
        return (
          <LoadingSpinner
            size={size}
            variant={variant}
            color={color}
            duration={duration}
          />
        );
      }
      
      return (
        <LoadingIndicator
          size={size}
          variant={variant}
          color={color}
          duration={duration}
        />
      );
    };

    return (
      <Animated.View 
        style={[
          styles.loadingContent, 
          contentStyle,
          getContentAnimationStyle(),
          {
            backgroundColor: position === LOADING_POSITIONS.FULL_SCREEN 
              ? 'transparent' 
              : Platform.OS === 'android' 
                ? (isDarkMode ? 'rgba(42, 42, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)')
                : (isDarkMode ? 'rgba(42, 42, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)'),
          }
        ]}
      >
        <View style={styles.loadingIndicatorContainer}>
          {renderLoadingComponent()}
        </View>
        
        {showMessage && message && (
          <Text style={[
            styles.loadingText, 
            { color: colors.text },
            size === LOADING_SIZES.SMALL && styles.smallText,
            position === LOADING_POSITIONS.FULL_SCREEN && styles.fullScreenText,
          ]}>
            {message}
          </Text>
        )}
      </Animated.View>
    );
  };

  const overlayBackgroundColor = backgroundColor || 
    (isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)');

  return (
    <Modal 
      transparent 
      visible={visible} 
      animationType="none"
      statusBarTranslucent
      testID={testID}
    >
      <StatusBar 
        backgroundColor="rgba(0, 0, 0, 0.5)" 
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        translucent
      />
      
      {useBlur && BlurView ? (
        <BlurView 
          intensity={Platform.OS === 'ios' ? 15 : 10} 
          style={[styles.fullScreenBlur, getPositionStyle(), style]}
          tint={isDarkMode ? 'dark' : 'light'}
        >
          {dismissible && (
            <TouchableWithoutFeedback onPress={onDismiss}>
              <View style={styles.dismissibleArea} />
            </TouchableWithoutFeedback>
          )}
          <LoadingContent />
        </BlurView>
      ) : (
        <View style={[styles.overlay, getPositionStyle(), style]}>
          <Animated.View 
            style={[
              styles.backgroundOverlay,
              { 
                backgroundColor: overlayBackgroundColor,
                opacity: fadeAnim,
              }
            ]} 
          />
          
          {dismissible && (
            <TouchableWithoutFeedback onPress={onDismiss}>
              <View style={styles.dismissibleArea} />
            </TouchableWithoutFeedback>
          )}
          
          <LoadingContent />
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullScreenBlur: {
    flex: 1,
  },
  dismissibleArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    minWidth: 200,
    maxWidth: screenWidth - 80,
    elevation: Platform.OS === 'android' ? 8 : 0,
    shadowColor: '#000',
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 4 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0,
    shadowRadius: Platform.OS === 'ios' ? 12 : 0,
  },
  loadingIndicatorContainer: {
    marginBottom: 16,
    padding: 8,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0.1,
    maxWidth: 250,
  },
  smallText: {
    fontSize: 14,
    fontWeight: Platform.OS === 'ios' ? '500' : '600',
    letterSpacing: Platform.OS === 'android' ? 0.2 : 0,
  },
  fullScreenText: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default LoadingOverlay; 