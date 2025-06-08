import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';
import Logo from '../assets/images/logo.svg';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const logoRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    if (logoRef.current) {
      logoRef.current.fadeIn(1000);
    }
    
    if (textRef.current) {
      textRef.current.fadeIn(1500);
    }
  }, []);

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      style={styles.container}
    >
      <Animatable.View
        ref={logoRef}
        animation="fadeIn"
        duration={1000}
        style={styles.logoContainer}
      >
        <Logo width={300} height={100} />
      </Animatable.View>
      
      <Animatable.View
        ref={textRef}
        animation="fadeIn"
        duration={1500}
        style={styles.textContainer}
      >
        <Text style={styles.title}>Hoopay</Text>
        <Text style={styles.subtitle}>Your Digital Wallet</Text>
      </Animatable.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  textContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.background,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.background,
    marginTop: 8,
    opacity: 0.9,
  },
});

export default SplashScreen; 