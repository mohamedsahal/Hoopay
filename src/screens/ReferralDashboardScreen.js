import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';

// Sample referral data
const referralData = [
  {
    id: '1',
    name: 'Ahmed Hassan',
    status: 'Signed Up',
    date: 'Today, 10:45 AM',
    reward: 'Pending'
  },
  {
    id: '2',
    name: 'Fatima Omar',
    status: 'Completed',
    date: 'Yesterday, 3:20 PM',
    reward: '$10.00'
  },
  {
    id: '3',
    name: 'Ali Mohammed',
    status: 'Completed',
    date: 'Mar 15, 9:00 AM',
    reward: '$10.00'
  }
];

const ReferralItem = ({ referral }) => (
  <View style={styles.referralItem}>
    <View style={styles.referralDetails}>
      <Text style={styles.referralName}>{referral.name}</Text>
      <Text style={styles.referralDate}>{referral.date}</Text>
    </View>
    <View style={styles.referralStatus}>
      <View style={[
        styles.statusPill, 
        {backgroundColor: referral.status === 'Completed' ? 'rgba(78, 122, 81, 0.15)' : 'rgba(240, 173, 78, 0.15)'}
      ]}>
        <Text style={[
          styles.statusText,
          {color: referral.status === 'Completed' ? '#4E7A51' : '#F0AD4E'}
        ]}>{referral.status}</Text>
      </View>
      <Text style={styles.rewardText}>{referral.reward}</Text>
    </View>
  </View>
);

const ReferralDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || 30 }]}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Referral Dashboard</Text>
        </View>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>$20.00</Text>
            <Text style={styles.statLabel}>Total Rewards</Text>
          </View>
        </View>
        
        {/* Referral Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeTitle}>Your Referral Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>MOHAMED123</Text>
            <TouchableOpacity style={styles.copyButton}>
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.codeInfo}>Share this code with friends to earn rewards</Text>
        </View>
        
        {/* Referrals List */}
        <View style={styles.referralsCard}>
          <Text style={styles.referralsTitle}>Your Referrals</Text>
          
          <FlatList
            data={referralData}
            renderItem={({ item }) => <ReferralItem referral={item} />}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No referrals yet. Start inviting friends!</Text>
            }
          />
        </View>
        
        {/* Share Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share Your Referral Code</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 10,
    padding: 20,
    flexDirection: 'row',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 200, 0.7)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(200, 230, 200, 0.7)',
    marginHorizontal: 15,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 10,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 200, 0.7)',
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAF7EB',
    borderRadius: 10,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4E7A51',
    letterSpacing: 1,
  },
  copyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  codeInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  referralsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 10,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 200, 0.7)',
  },
  referralsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  referralItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 230, 230, 0.8)',
  },
  referralDetails: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  referralDate: {
    fontSize: 13,
    color: '#95a5a6',
  },
  referralStatus: {
    alignItems: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4E7A51',
  },
  emptyText: {
    textAlign: 'center',
    color: '#95a5a6',
    paddingVertical: 20,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  shareButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ReferralDashboardScreen; 