import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import LottieView from 'lottie-react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  
  const onboardingData = [
    {
      id: '1',
      title: 'Welcome to Hoopay',
      subtitle: 'Your secure digital wallet solution',
      animation: require('../assets/lottie/newwallet.json'),
    },
    {
      id: '2',
      title: 'Deposit Money Instantly',
      subtitle: 'Exchange currencies with the best rates in seconds',
      animation: require('../assets/lottie/newtransection.json'),
    },
    {
      id: '3',
      title: 'Secure & Private',
      subtitle: 'Your security is our priority',
      animation: require('../assets/lottie/NewSecurity.json'),
    },
  ];

  const scrollToIndex = (index) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * width,
        animated: true,
      });
      setCurrentIndex(index);
    }
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    if (index !== currentIndex && index >= 0 && index < onboardingData.length) {
      setCurrentIndex(index);
    }
  };

  const nextSlide = async () => {
    try {
      const nextIndex = currentIndex + 1;
      if (nextIndex < onboardingData.length) {
        scrollToIndex(nextIndex);
      } else {
        // Mark onboarding as complete before navigating
        await SecureStore.setItemAsync('onboardingComplete', 'true');
        navigation.replace('Auth');
      }
    } catch (error) {
      console.error('Error in nextSlide:', error);
      // Fallback navigation in case of error
      navigation.replace('Auth');
    }
  };

  const skipToLogin = async () => {
    try {
      // Mark onboarding as complete before navigating
      await SecureStore.setItemAsync('onboardingComplete', 'true');
      navigation.replace('Auth');
    } catch (error) {
      console.error('Error in skipToLogin:', error);
      // Fallback navigation
      navigation.replace('Auth');
    }
  };

  const renderSlide = (item, index) => {
    return (
      <View key={item.id} style={styles.slide}>
        <View style={styles.animationContainer}>
          <LottieView
            source={item.animation}
            style={styles.lottieAnimation}
            autoPlay={index === currentIndex}
            loop
            resizeMode="contain"
            onError={(error) => {
              console.log('Animation failed to load:', error);
            }}
          />
        </View>
        <Animatable.View
          animation="fadeInUp"
          delay={300}
          style={styles.textContainer}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </Animatable.View>
      </View>
    );
  };

  return (
    <>
      <StatusBar 
        backgroundColor={Colors.gradientStart} 
        barStyle="light-content" 
        hidden={true}
      />
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.container}
      >
        <View style={styles.header}>
        {currentIndex < onboardingData.length - 1 && (
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={skipToLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {onboardingData.map((item, index) => renderSlide(item, index))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.paginationContainer}>
          {onboardingData.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex
                  ? styles.paginationDotActive
                  : styles.paginationDotInactive,
              ]}
              onPress={() => scrollToIndex(index)}
              activeOpacity={0.7}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={nextSlide}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    minHeight: 50,
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  skipButton: {
    padding: 10,
    borderRadius: 20,
  },
  skipButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // This ensures the ScrollView content takes the full height
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
  },
  animationContainer: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.background,
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.background,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 26,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  paginationDotActive: {
    backgroundColor: Colors.background,
    width: 20,
  },
  paginationDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  button: {
    backgroundColor: Colors.background,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginHorizontal: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});

// Fallback component in case of crashes
const OnboardingFallback = ({ navigation }) => {
  const handleContinue = async () => {
    try {
      await SecureStore.setItemAsync('onboardingComplete', 'true');
      navigation.replace('Auth');
    } catch (error) {
      console.error('Error in fallback continue:', error);
      navigation.replace('Auth');
    }
  };

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      style={styles.container}
    >
      <View style={[styles.slide, { paddingHorizontal: 30 }]}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Welcome to Hoopay</Text>
          <Text style={styles.subtitle}>
            Your secure digital wallet solution. Let's get started!
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.button, { marginTop: 40 }]} 
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

// Enhanced OnboardingScreen with error boundary
const EnhancedOnboardingScreen = (props) => {
  try {
    return <OnboardingScreen {...props} />;
  } catch (error) {
    console.error('OnboardingScreen crashed, using fallback:', error);
    return <OnboardingFallback {...props} />;
  }
};

export default EnhancedOnboardingScreen; 