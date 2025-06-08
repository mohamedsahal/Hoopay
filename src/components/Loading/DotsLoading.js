import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';

const DotsLoading = ({ 
  size = 8, 
  color, 
  spacing = 4, 
  animationDuration = 600,
  style 
}) => {
  // Use fallback colors if theme context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    colors = Colors;
  }

  const dotColor = color || colors.primary;
  
  // Animation values for each dot
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDots = () => {
      // Animate dots in sequence
      Animated.sequence([
        Animated.timing(dot1, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(dot2, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(dot3, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset all dots and repeat
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 0.3,
            duration: animationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0.3,
            duration: animationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0.3,
            duration: animationDuration,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Repeat the animation
          animateDots();
        });
      });
    };

    animateDots();
  }, [dot1, dot2, dot3, animationDuration]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            backgroundColor: dotColor,
            opacity: dot1,
            marginRight: spacing,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            backgroundColor: dotColor,
            opacity: dot2,
            marginRight: spacing,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            backgroundColor: dotColor,
            opacity: dot3,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 50,
  },
});

export default DotsLoading; 