import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Easing, GestureResponderEvent, TouchableOpacityProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import Colors from '../constants/Colors';

// Custom Tab Button for the centered Home tab
const HomeButton = ({ onPress, ...props }: BottomTabBarButtonProps) => {
  // Create multiple animations for a more professional look
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  // Separate JS-driven animations from native-driven ones
  const shadowOpacityValue = useRef(new Animated.Value(0.3)).current;
  const elevationValue = useRef(new Animated.Value(8)).current;
  
  useEffect(() => {
    // Scale animation - using JavaScript driver
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false // Changed to false to match other animations
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false // Changed to false to match other animations
        })
      ])
    );
    
    // Shadow animation - JS driven only
    const shadowOpacityAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shadowOpacityValue, {
          toValue: 0.5,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false
        }),
        Animated.timing(shadowOpacityValue, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false
        })
      ])
    );

    // Start animations
    pulseAnimation.start();
    shadowOpacityAnimation.start();

    // Clean up animations on unmount
    return () => {
      pulseAnimation.stop();
      shadowOpacityAnimation.stop();
    };
  }, []);

  const handlePress = (e: GestureResponderEvent) => {
    // Add a slight scale down effect on press - using JavaScript driver to match other animations
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: false // Changed to false to match other animations
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: false // Changed to false to match other animations
      })
    ]).start();

    // Call the original onPress handler
    if (onPress) {
      onPress(e);
    }
  };

  // Remove rotation interpolation as it's not being used and might cause conflicts

  // Create a combined style for the button
  const buttonStyle = [
    styles.container,
    {
      transform: [{ scale: scaleAnim }],
      shadowOpacity: shadowOpacityValue,
      elevation: 8 // Keep a base elevation for Android
    }
  ];

  // Create a style for the inner glow effect
  const innerGlowStyle = [
    styles.innerGlow,
    {
      transform: [{ scale: scaleAnim }],
      opacity: shadowOpacityValue.interpolate({
        inputRange: [0.3, 0.5],
        outputRange: [0.8, 1]
      })
    }
  ];

  return (
    <View style={styles.wrapper}>
      <Animated.View style={buttonStyle}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.touchable}
          onPress={handlePress}
          {...(props as TouchableOpacityProps)}
        >
          <View style={styles.gradient}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Animated.View style={innerGlowStyle} />
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name="home" 
                size={28} 
                color="#FFFFFF"
                style={styles.icon}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 75,
    height: 75,
    marginTop: -25, // Half of the button height to make it stick out
  },
  container: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 3,
    borderColor: Colors.background,
  },
  touchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 37.5,
    overflow: 'hidden',
  },
  gradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    zIndex: 2,
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  innerGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 37.5,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default HomeButton as (props: BottomTabBarButtonProps) => React.ReactNode;
