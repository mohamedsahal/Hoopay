import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import referralService from '../services/referralService';
import DotsLoading from '../components/DotsLoading';

const { width, height } = Dimensions.get('window');

const ReferralOnboardingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const benefits = [
    {
      icon: 'cash-outline',
      title: 'Earn Real Money',
      description: 'Get 20% commission on every transaction your referrals make',
      color: '#10B981'
    },
    {
      icon: 'people-outline',
      title: 'Unlimited Referrals',
      description: 'No limit on how many friends you can refer - the sky\'s the limit!',
      color: '#3B82F6'
    },
    {
      icon: 'time-outline',
      title: 'Instant Tracking',
      description: 'Real-time tracking of your referrals and earnings',
      color: '#8B5CF6'
    },
    {
      icon: 'wallet-outline',
      title: 'Easy Withdrawals',
      description: 'Withdraw your earnings directly to your Hoopay wallet',
      color: '#F59E0B'
    }
  ];



  const handleOptIn = async () => {
    setIsLoading(true);
    try {
      const result = await referralService.optInToReferralProgram();
      
      if (result.success) {
        Alert.alert(
          'Welcome to the Referral Program! 🎉',
          `Your referral code is: ${result.referralCode}\n\nStart sharing and earning today!`,
          [
            {
              text: 'Go to Dashboard',
              onPress: () => navigation.replace('ReferralDashboard')
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to join referral program');
      }
    } catch (error) {
      console.error('Error opting into referral program:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Referral Program?',
      'You can always join the referral program later from your profile settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: () => navigation.goBack(),
          style: 'destructive'
        }
      ]
    );
  };

  const nextStep = () => {
    if (currentStep < benefits.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderBenefit = (benefit, index) => (
    <Animatable.View
      key={index}
      animation={currentStep === index ? "fadeInUp" : "fadeOut"}
      duration={500}
      style={styles.benefitCard}
    >
      <View style={[styles.iconContainer, { backgroundColor: benefit.color + '20' }]}>
        <Ionicons name={benefit.icon} size={48} color={benefit.color} />
      </View>
      <Text style={styles.benefitTitle}>
        {benefit.title}
      </Text>
      <Text style={styles.benefitDescription}>
        {benefit.description}
      </Text>
    </Animatable.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <Animatable.View animation="fadeInDown" duration={1000} style={styles.welcomeSection}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.welcomeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="gift-outline" size={60} color="white" />
            <Text style={styles.welcomeTitle}>Join Our Referral Program</Text>
            <Text style={styles.welcomeSubtitle}>
              Start earning money by inviting your friends to Hoopay
            </Text>
          </LinearGradient>
        </Animatable.View>

        {/* Benefits Carousel */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>
            Why Join Our Referral Program?
          </Text>
          
          <View style={styles.carouselContainer}>
            {benefits.map((benefit, index) => 
              currentStep === index ? renderBenefit(benefit, index) : null
            )}
          </View>

          {/* Navigation Dots */}
          <View style={styles.dotsContainer}>
            {benefits.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  currentStep === index ? styles.activeDot : styles.inactiveDot
                ]}
                onPress={() => setCurrentStep(index)}
              />
            ))}
          </View>

          {/* Navigation Arrows */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[
                styles.navButton,
                currentStep === 0 && styles.disabledButton
              ]}
              onPress={prevStep}
              disabled={currentStep === 0}
            >
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={currentStep === 0 ? '#999' : '#10B981'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                currentStep === benefits.length - 1 && styles.disabledButton
              ]}
              onPress={nextStep}
              disabled={currentStep === benefits.length - 1}
            >
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={currentStep === benefits.length - 1 ? '#999' : '#10B981'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms Section */}
        <Animatable.View animation="fadeInUp" delay={500} style={styles.termsSection}>
          <View style={styles.termsCard}>
            <Text style={styles.termsTitle}>
              How It Works
            </Text>
            <View style={styles.termsList}>
              <View style={styles.termItem}>
                <Text style={styles.termNumber}>1</Text>
                <Text style={styles.termText}>
                  Get your unique referral code
                </Text>
              </View>
              <View style={styles.termItem}>
                <Text style={styles.termNumber}>2</Text>
                <Text style={styles.termText}>
                  Share it with friends and family
                </Text>
              </View>
              <View style={styles.termItem}>
                <Text style={styles.termNumber}>3</Text>
                <Text style={styles.termText}>
                  Earn 20% commission when they transact
                </Text>
              </View>
              <View style={styles.termItem}>
                <Text style={styles.termNumber}>4</Text>
                <Text style={styles.termText}>
                  Withdraw earnings to your wallet
                </Text>
              </View>
            </View>
          </View>
        </Animatable.View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, { paddingBottom: Math.max(insets.bottom + 30, 50) }]}>
        <TouchableOpacity
          style={[styles.joinButton, isLoading && styles.disabledButton]}
          onPress={handleOptIn}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <DotsLoading size={8} color="white" spacing={6} />
            ) : (
              <>
                <Ionicons name="rocket-outline" size={20} color="white" />
                <Text style={styles.joinButtonText}>Join Now & Start Earning</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.laterButton}
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Text style={styles.laterButtonText}>
            Maybe Later
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 10,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    marginBottom: 30,
  },
  welcomeGradient: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  carouselContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  benefitCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'absolute',
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  benefitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  benefitDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    color: '#666',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#10B981',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: '#E5E7EB',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  termsSection: {
    marginBottom: 30,
  },
  termsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  termsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  termsList: {
    marginTop: 10,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  termNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  termText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: '#666',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#F5F7FA',
  },
  joinButton: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
});

export default ReferralOnboardingScreen; 