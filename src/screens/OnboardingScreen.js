import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import LottieView from 'lottie-react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef(null);
  
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

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.animationContainer}>
          <LottieView
            source={item.animation}
            style={styles.lottieAnimation}
            autoPlay
            loop
            onError={() => console.log('Animation failed to load')}
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

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  
  const scrollTo = (index) => {
    if (slidesRef.current) {
      slidesRef.current.scrollToIndex({ index });
    }
  };

  const nextSlide = async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < onboardingData.length) {
      scrollTo(nextIndex);
    } else {
      // Mark onboarding as complete before navigating
      await SecureStore.setItemAsync('onboardingComplete', 'true');
      navigation.replace('Auth');
    }
  };

  const skipToLogin = async () => {
    // Mark onboarding as complete before navigating
    await SecureStore.setItemAsync('onboardingComplete', 'true');
    navigation.replace('Auth');
  };

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      style={styles.container}
    >
      <View style={styles.header}>
        {currentIndex < onboardingData.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={skipToLogin}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
        scrollEnabled={true}
      />

      <View style={styles.footer}>
        <View style={styles.paginationContainer}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex
                  ? styles.paginationDotActive
                  : styles.paginationDotInactive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={nextSlide}>
          <Text style={styles.buttonText}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  skipButton: {
    padding: 10,
  },
  skipButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
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
    marginTop: 'auto',
    marginBottom: 50,
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

export default OnboardingScreen; 