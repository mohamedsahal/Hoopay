import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Share,
  Clipboard,
  Linking,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import referralService from '../services/referralService';

const ReferralSharingScreen = ({ navigation, route }) => {
  const [referralData, setReferralData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const referralCode = route?.params?.referralCode;

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setIsLoading(true);
      const result = await referralService.getReferralInfo();
      if (result.success) {
        setReferralData(result.data);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = async () => {
    const code = referralData?.referral_code || referralCode;
    if (code) {
      Clipboard.setString(code);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    }
  };

  const shareViaApp = async (platform) => {
    const code = referralData?.referral_code || referralCode;
    if (!code) return;

    const referralLink = referralService.generateReferralLink(code);
    const shareText = referralService.generateSharingText(code, referralLink);

    try {
      await Share.share({
        message: shareText,
        url: referralLink,
        title: 'Join me on Hoopay!'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const socialPlatforms = [
    { name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
    { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
    { name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
    { name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
    { name: 'SMS', icon: 'chatbubble', color: '#34C759' },
    { name: 'Email', icon: 'mail', color: '#007AFF' }
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading sharing options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const code = referralData?.referral_code || referralCode;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share & Earn</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Animatable.View animation="fadeInUp" duration={800} style={styles.heroSection}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.heroGradient}
          >
            <Ionicons name="gift-outline" size={60} color="white" />
            <Text style={styles.heroTitle}>Share Your Code</Text>
            <Text style={styles.heroSubtitle}>
              Invite friends and earn 20% commission on their transactions
            </Text>
          </LinearGradient>
        </Animatable.View>

        <View style={styles.codeCard}>
          <Text style={styles.codeTitle}>Your Referral Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{code}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={copyReferralCode}>
              <Ionicons name="copy-outline" size={18} color="#10B981" />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>Share on Social Media</Text>
          <View style={styles.socialGrid}>
            {socialPlatforms.map((platform, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.socialButton, { backgroundColor: platform.color + '15' }]}
                onPress={() => shareViaApp(platform.name.toLowerCase())}
              >
                <View style={[styles.socialIconContainer, { backgroundColor: platform.color }]}>
                  <Ionicons name={platform.icon} size={24} color="white" />
                </View>
                <Text style={styles.socialButtonText}>{platform.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  heroSection: {
    marginVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 30,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  codeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copyButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  socialSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  socialButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  socialIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
});

export default ReferralSharingScreen; 