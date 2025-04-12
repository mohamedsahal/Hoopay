import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';

const ReferralScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  const handleJoinPress = () => {
    // Navigate to dashboard
    console.log('Navigating to referral dashboard');
    navigation.navigate('ReferralDashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || 30 }]}>
        <Text style={styles.headerTitle}>Referral Program</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Join Our Referral Program</Text>
            <Text style={styles.cardSubtitle}>Become an affiliate and earn rewards</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitNumber}>01</Text>
              <View style={styles.benefitDetails}>
                <Text style={styles.benefitTitle}>Earn Cash Rewards</Text>
                <Text style={styles.benefitText}>Get cash rewards for every successful referral you make</Text>
              </View>
            </View>
            
            <View style={styles.benefitItem}>
              <Text style={styles.benefitNumber}>02</Text>
              <View style={styles.benefitDetails}>
                <Text style={styles.benefitTitle}>Invite Your Friends</Text>
                <Text style={styles.benefitText}>Share your unique referral code with friends and family</Text>
              </View>
            </View>
            
            <View style={styles.benefitItem}>
              <Text style={styles.benefitNumber}>03</Text>
              <View style={styles.benefitDetails}>
                <Text style={styles.benefitTitle}>Track Your Progress</Text>
                <Text style={styles.benefitText}>Monitor your referrals and earnings in real-time</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <Text style={styles.infoText}>
            Join our affiliate program and earn rewards for each successful referral. 
            The more friends you invite, the more rewards you get. Our referral system 
            makes it easy to track your earnings and receive payments.
          </Text>
        </View>
        
        {/* Join Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.joinButton}
            onPress={handleJoinPress}
          >
            <LinearGradient
              colors={['#4E7A51', '#6BA86E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinButtonGradient}
            >
              <Text style={styles.joinButtonText}>Join Now</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 16,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 200, 0.7)',
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#EAF7EB',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 230, 200, 0.7)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#4E7A51',
    fontWeight: '500',
  },
  cardContent: {
    padding: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  benefitNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4E7A51',
    width: 32,
  },
  benefitDetails: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 200, 0.7)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  joinButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  joinButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ReferralScreen; 