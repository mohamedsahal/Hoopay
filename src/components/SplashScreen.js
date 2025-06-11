import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  return (
    <>
      <StatusBar 
        backgroundColor="#4CAF50" 
        barStyle="light-content" 
        hidden={true}
      />
      <LinearGradient
        colors={['#4CAF50', '#45a049', '#388e3c']}
        style={styles.container}
      >
        <Animatable.View
          animation="bounceIn"
          duration={1500}
          style={styles.logoContainer}
        >
          <Image
            source={require('../../assets/ic_launcher.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animatable.View>
        
        <Animatable.View
          animation="fadeInUp"
          delay={800}
          style={styles.textContainer}
        >
          <Text style={styles.appName}>Hoopay</Text>
          <Text style={styles.tagline}>Your Digital Wallet</Text>
        </Animatable.View>

        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          style={styles.loadingIndicator}
        >
          <View style={styles.loadingDot} />
          <View style={[styles.loadingDot, { marginLeft: 10 }]} />
          <View style={[styles.loadingDot, { marginLeft: 10 }]} />
        </Animatable.View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '300',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 80,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    opacity: 0.7,
  },
});

export default SplashScreen; 