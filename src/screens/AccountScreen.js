import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Image,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Svg, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';

// Import the images
const profileImage = require('../assets/images/profile.jpg');
const walletImage = require('../assets/images/wallet.png');
const sahalImage = require('../assets/images/sahal.png');

const AccountCard = ({ account, onPress }) => (
  <TouchableOpacity style={styles.accountCard} onPress={onPress}>
    <View style={styles.accountCardLeft}>
      <View style={styles.accountLogoContainer}>
        <Image source={account.image} style={styles.accountLogo} />
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={styles.accountDetails}>{account.accountNumber}</Text>
      </View>
    </View>
    <View style={styles.accountCardRight}>
      <Text style={styles.accountBalance}>{account.balance}</Text>
      <View style={styles.accountStatusPill}>
        <Text style={styles.accountStatusText}>{account.status}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const AccountScreen = () => {
  const insets = useSafeAreaInsets();
  
  const accounts = [
    {
      id: '1',
      name: 'Sahal',
      accountNumber: 'Mohamed Nur Sahal',
      balance: '+252907366124',
      status: 'Active',
      image: sahalImage
    },
    {
      id: '2',
      name: 'Premier',
      accountNumber: 'Mohamed Nur Sahal',
      balance: '00243684948',
      status: 'Active',
      image: walletImage
    }
  ];

  const renderAccountItem = ({ item }) => (
    <AccountCard 
      account={item} 
      onPress={() => console.log('Account pressed:', item.name)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || 30 }]}>
        <View style={styles.userSection}>
          <View style={styles.profileImageContainer}>
            <Image source={profileImage} style={styles.profileImage} />
          </View>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Hello <Text style={styles.username}>Mohamed</Text></Text>
            <Text style={styles.timeOfDay}>Good Night</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addAccountButton}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 5v14M5 12h14"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
      
      {/* Accounts List */}
      <View style={styles.accountsListContainer}>
        <View style={styles.accountsHeader}>
          <Text style={styles.accountsHeaderTitle}>My Accounts</Text>
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={accounts}
          renderItem={renderAccountItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.accountsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
    paddingTop: 30,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 20,
    color: '#333',
    fontWeight: '300',
  },
  username: {
    color: Colors.primary,
    fontWeight: '700',
  },
  timeOfDay: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 2,
  },
  addAccountButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  accountsListContainer: {
    marginHorizontal: 20,
    flex: 1,
  },
  accountsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountsHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  seeAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  accountsList: {
    paddingBottom: 10,
  },
  accountCard: {
    backgroundColor: '#EAF7EB',
    borderRadius: 18,
    padding: 18,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 200, 0.7)',
  },
  accountCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountLogoContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accountLogo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  accountInfo: {
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  accountDetails: {
    fontSize: 13,
    color: '#6A8A71',
    fontWeight: '500',
  },
  accountCardRight: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  accountStatusPill: {
    backgroundColor: 'rgba(78, 122, 81, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  accountStatusText: {
    fontSize: 12,
    color: '#4E7A51',
    fontWeight: '600',
  },
});

export default AccountScreen; 