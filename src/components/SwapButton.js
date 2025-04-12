import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path } from 'react-native-svg';
import Colors from '../constants/Colors';

// Custom Tab Button for the centered Swap tab
const SwapButton = ({ children, onPress }) => {
  // Create multiple animations for a more professional look
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  // Separate JS-driven animations from native-driven ones
  const shadowOpacityValue = useRef(new Animated.Value(0.3)).current;
  const elevationValue = useRef(new Animated.Value(8)).current;
  
  useEffect(() => {
    // Scale animation - native driven
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
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
    
    const elevationAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(elevationValue, {
          toValue: 12,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false
        }),
        Animated.timing(elevationValue, {
          toValue: 8,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false
        })
      ])
    );
    
    pulseAnimation.start();
    shadowOpacityAnimation.start();
    elevationAnimation.start();
    
    return () => {
      pulseAnimation.stop();
      shadowOpacityAnimation.stop();
      elevationAnimation.stop();
    };
  }, []);
  
  const handlePress = () => {
    // Add rotation animation on press - native driven
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.bounce,
      useNativeDriver: true
    }).start(() => {
      rotateAnim.setValue(0);
    });
    
    // Call the original onPress
    onPress();
  };
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.animationWrapper,
          { 
            transform: [
              { scale: scaleAnim },
              { rotate: spin }
            ],
          }
        ]}
      >
        <Animated.View
          style={[
            styles.buttonWrapper,
            {
              shadowOpacity: shadowOpacityValue,
              elevation: elevationValue
            }
          ]}
        >
          <TouchableOpacity
            style={styles.touchableArea}
            onPress={handlePress}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <View style={styles.iconContainer}>
                <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M7.5 21.5L4.5 18.5M4.5 18.5L7.5 15.5M4.5 18.5H15.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M16.5 8.5L19.5 5.5M19.5 5.5L16.5 2.5M19.5 5.5H8.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 70,
  },
  animationWrapper: {
    position: 'absolute',
    top: -20,
  },
  buttonWrapper: {
    borderRadius: 30,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  touchableArea: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  gradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)'
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwapButton; 