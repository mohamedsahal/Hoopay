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
        {/* Small Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.smallLogoContainer}>
            <Text style={styles.textLogo}>H</Text>
          </View>
        </View>
        
        {/* App Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.appName}>Hoopay</Text>
          <Text style={styles.tagline}>Your Digital Wallet</Text>
        </View>

        {/* Loading Dots */}
        <View style={styles.loadingSection}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  smallLogoContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textLogo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '300',
  },
  loadingSection: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    opacity: 0.7,
    marginHorizontal: 4,
  },
});

export default SplashScreen; 