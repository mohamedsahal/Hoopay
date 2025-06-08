import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Image,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Svg, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { useTabBarSafeHeight } from '../constants/Layout';
import LoadingIndicator from '../components/LoadingIndicator';
import { LoadingSkeleton } from '../components/Loading';
import { useTheme } from '../contexts/ThemeContext';
import accountService from '../services/accountService';

// Import the images
const profileImage = require('../assets/images/profile.jpg');

// Import wallet logos
const walletLogos = {
  sahal: require('../../assets/wallet logo/Sahal.png'),
  premierBank: require('../../assets/wallet logo/Premier Bank.png'),
  evc: require('../../assets/wallet logo/Evc plus.png'),
  zaad: require('../../assets/wallet logo/Zaad.png'),
  trc: require('../../assets/wallet logo/trc.png'),
  usdc: require('../../assets/wallet logo/USDC.png'),
  usdt: require('../../assets/wallet logo/USDT.png'),
  usdtBep20: require('../../assets/wallet logo/USDT Bep 20.png'),
  edahab: require('../../assets/wallet logo/Edahab.jpg'),
  salaamBank: require('../../assets/wallet logo/Salaam Bank.png')
};

const AccountCard = ({ account, onPress, colors }) => {
  // We'll prioritize logo_url from the API
  // If that doesn't exist, we'll use local wallet logos based on account type
  const getAccountImage = () => {
    if (account.logo_url) {
      return { uri: account.logo_url };
    }
    
    // If no logo_url, fallback to appropriate local logo based on account type/name
    const typeLower = (account.accountType || '').toLowerCase();
    const nameLower = (account.name || '').toLowerCase();
    
    if (typeLower.includes('sahal') || nameLower.includes('sahal')) {
      return walletLogos.sahal;
    } else if (typeLower.includes('premier bank') || nameLower.includes('premier bank')) {
      return walletLogos.premierBank;
    } else if (typeLower.includes('premier') || nameLower.includes('premier')) {
      return walletLogos.premierBank;
    } else if (typeLower.includes('evc') || nameLower.includes('evc')) {
      return walletLogos.evc;
    } else if (typeLower.includes('zaad') || nameLower.includes('zaad')) {
      return walletLogos.zaad;
    } else if (typeLower.includes('trx') || nameLower.includes('trx') || typeLower.includes('trc') || nameLower.includes('trc')) {
      return walletLogos.trc;
    } else if (typeLower.includes('usdc') || nameLower.includes('usdc')) {
      return walletLogos.usdc;
    } else if (typeLower.includes('usdt bep') || nameLower.includes('usdt bep')) {
      return walletLogos.usdtBep20;
    } else if (typeLower.includes('usdt') || nameLower.includes('usdt')) {
      return walletLogos.usdt;
    } else if (typeLower.includes('edahab') || nameLower.includes('edahab')) {
      return walletLogos.edahab;
    } else if (typeLower.includes('salaam') || nameLower.includes('salaam')) {
      return walletLogos.salaamBank;
    } else {
      // Default to premier bank if no match
      return walletLogos.premierBank;
    }
  };

  const imageSource = getAccountImage();
  
  return (
    <TouchableOpacity style={[styles.accountCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} onPress={onPress}>
      <View style={styles.accountCardLeft}>
        <View style={[styles.accountLogoContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image 
            source={imageSource} 
            style={styles.accountLogo} 
            onError={(e) => {
              console.log('Error loading account image:', e.nativeEvent.error);
              // If image loading fails, we could set a fallback image here if needed
            }}
            resizeMode="cover"
          />
        </View>
        <View style={styles.accountInfo}>
          <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
          <Text style={[styles.accountType, { color: colors.primary }]}>{account.accountType || account.type || 'Account'}</Text>
          <Text style={[styles.accountDetails, { color: colors.textSecondary }]}>{account.accountNumber}</Text>
        </View>
      </View>
      <View style={styles.accountCardRight}>
        <View style={[styles.accountStatusPill, { backgroundColor: `${colors.primary}20` }]}>
          <Text style={[styles.accountStatusText, { color: colors.primary }]}>{account.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Accounts Screen Skeleton Components
const AccountCardSkeleton = ({ colors }) => (
  <View style={[styles.accountCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
    <View style={styles.accountCardLeft}>
      <LoadingSkeleton width={45} height={45} borderRadius={22.5} />
      <View style={styles.accountInfo}>
        <LoadingSkeleton width={100} height={16} borderRadius={4} />
        <LoadingSkeleton width={80} height={14} borderRadius={4} style={{ marginTop: 4 }} />
        <LoadingSkeleton width={120} height={12} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
    </View>
    <View style={styles.accountCardRight}>
      <LoadingSkeleton width={60} height={24} borderRadius={12} />
    </View>
  </View>
);

const AccountsScreenSkeleton = ({ colors }) => (
  <>
    {/* Summary Card Skeleton */}
    <View style={styles.accountSummaryCard}>
      <LoadingSkeleton 
        width="100%" 
        height={120} 
        borderRadius={20}
        style={styles.summaryGradient}
      >
        <View style={styles.summaryContent}>
          <LoadingSkeleton width={100} height={16} borderRadius={4} />
          <LoadingSkeleton width={150} height={32} borderRadius={8} style={{ marginTop: 10 }} />
          <LoadingSkeleton width={120} height={14} borderRadius={4} style={{ marginTop: 10 }} />
        </View>
      </LoadingSkeleton>
    </View>
    
    {/* Accounts List Skeleton */}
    <View style={styles.accountsListContainer}>
      <View style={styles.accountsHeader}>
        <LoadingSkeleton width={120} height={20} borderRadius={6} />
        <LoadingSkeleton width={60} height={16} borderRadius={8} />
      </View>
      
      <View style={styles.accountsList}>
        {[...Array(4)].map((_, index) => (
          <AccountCardSkeleton key={index} colors={colors} />
        ))}
      </View>
    </View>
    
    {/* Quick Actions Skeleton */}
    <View style={styles.quickActionsContainer}>
      <LoadingSkeleton width={100} height={18} borderRadius={6} style={{ marginBottom: 15 }} />
      <View style={styles.actionButtonsContainer}>
        {[...Array(4)].map((_, index) => (
          <LoadingSkeleton 
            key={index}
            width={80} 
            height={80} 
            borderRadius={16}
            style={{ marginRight: 15 }}
          />
        ))}
      </View>
    </View>
  </>
);

const AccountsScreen = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarSafeHeight();
  
  // Use fallback colors and theme if context is not available
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in AccountsScreen, using default colors');
    colors = Colors;
    isDarkMode = false;
  }
  
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  
  useEffect(() => {
    // Fetch accounts from API
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        
        // Call the account service to get real account data
        const response = await accountService.getAllAccounts();
        
        // Process the response based on API structure
        let fetchedAccounts = [];
        
        if (response?.data?.accounts) {
          fetchedAccounts = response.data.accounts;
        } else if (response?.accounts) {
          fetchedAccounts = response.accounts;
        } else if (Array.isArray(response?.data)) {
          fetchedAccounts = response.data;
        } else if (Array.isArray(response)) {
          fetchedAccounts = response;
        } else {
          // Fallback to sample accounts if API format doesn't match expectations
          fetchedAccounts = [
    {
      id: '1',
      name: 'Sahal',
      accountNumber: '•••• 4532',
      balance: '12,450.80',
      status: 'Active',
      image: walletLogos.sahal
    },
    {
      id: '2',
      name: 'Premier',
      accountNumber: '•••• 7851',
      balance: '3,250.45',
      status: 'Active',
      image: walletLogos.premier
    }
  ];
        }
        
        // Map API response to expected UI format if needed
        const formattedAccounts = fetchedAccounts.map(account => {
          // Check and log if logo_url exists
          if (account.logo_url) {
            console.log(`Account ${account.name || account.id} has logo: ${account.logo_url}`);
          }
          
          return {
            id: account.id || account.account_id || String(Math.random()),
            name: account.name || account.wallet_name || account.account_name || 'Account',
            accountNumber: account.account_number || '•••• 0000',
            accountType: account.wallet_type_name || account.account_type || account.wallet_type || account.type || '',
            status: account.status || 'Active',
            logo_url: account.logo_url,
            // Don't use any default images - we'll handle this in the component
          };
        });
        
        setAccounts(formattedAccounts);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const renderAccountItem = ({ item }) => (
    <AccountCard 
      account={item} 
      onPress={() => console.log('Account pressed:', item.name)}
      colors={colors}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top || 30, backgroundColor: colors.headerBackground }]}>
          <View style={styles.userSection}>
            <View style={[styles.profileImageContainer, { borderColor: colors.primary }]}>
              <Image source={profileImage} style={styles.profileImage} />
            </View>
            <View style={styles.greetingContainer}>
              <Text style={[styles.greeting, { color: colors.text }]}>Hello <Text style={[styles.username, { color: colors.primary }]}>Mohamed</Text></Text>
              <Text style={[styles.timeOfDay, { color: colors.textSecondary }]}>Good Night</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.addAccountButton, { backgroundColor: colors.primary }]}>
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
        
        <AccountsScreenSkeleton colors={colors} />
        <View style={[styles.centerLoading, { backgroundColor: colors.background }]}>
          <LoadingIndicator size={16} color={colors.primary} variant="grow" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your accounts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || 30, backgroundColor: colors.headerBackground }]}>
        <View style={styles.userSection}>
          <View style={[styles.profileImageContainer, { borderColor: colors.primary }]}>
            <Image source={profileImage} style={styles.profileImage} />
          </View>
          <View style={styles.greetingContainer}>
            <Text style={[styles.greeting, { color: colors.text }]}>Hello <Text style={[styles.username, { color: colors.primary }]}>Mohamed</Text></Text>
            <Text style={[styles.timeOfDay, { color: colors.textSecondary }]}>Good Night</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.addAccountButton, { backgroundColor: colors.primary }]}>
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
      
      {/* Accounts Summary Card */}
      <View style={styles.accountSummaryCard}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryGradient}
        >
          <View style={styles.summaryContent}>
            <Text style={styles.totalAccountsLabel}>Total Balance</Text>
            <Text style={styles.totalBalance}>$15,701.25</Text>
            <View style={styles.balanceChangeContainer}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M7 13l5-5 5 5"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.balanceChange}>+$243.50 this month</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
      
      {/* Accounts List */}
      <View style={styles.accountsListContainer}>
        <View style={styles.accountsHeader}>
          <Text style={[styles.accountsHeaderTitle, { color: colors.text }]}>My Accounts</Text>
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
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
      
      {/* Quick Actions */}
      <View style={[
        styles.quickActionsContainer,
        { marginBottom: tabBarHeight + 20 } // Tab bar height + extra spacing
      ]}>
        <Text style={[styles.quickActionsTitle, { color: colors.text }]}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIconContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M17 1l4 4-4 4"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M21 13v2a4 4 0 01-4 4H3"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Exchange</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIconContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 13h6m-3-3v6M21 10V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-2"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Add Money</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIconContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M15 5l3 3-3 3M15 19l3-3-3-3M21 12H11"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Transfer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIconContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 14l6-6M4 4h16v16H4V4z"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Pay Bills</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  accountLogoContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(78, 122, 81, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  accountLogo: {
    width: 45,
    height: 45,
    resizeMode: 'cover',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
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
  accountSummaryCard: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 25,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryGradient: {
    borderRadius: 20,
  },
  summaryContent: {
    padding: 25,
  },
  totalAccountsLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginBottom: 8,
  },
  totalBalance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  balanceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceChange: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginLeft: 6,
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
    marginBottom: 3,
  },
  accountType: {
    fontSize: 14,
    color: '#4E7A51',
    fontWeight: '500',
    marginBottom: 3,
  },
  accountDetails: {
    fontSize: 13,
    color: '#6A8A71',
    fontWeight: '500',
  },
  accountCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
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
  quickActionsContainer: {
    marginTop: 5,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 14,
    marginLeft: 20,
  },
  actionButtonsContainer: {
    paddingHorizontal: 12,
  },
  actionButton: {
    alignItems: 'center',
    marginHorizontal: 12,
    width: 80,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EAF7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(200, 230, 200, 0.8)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#385A3C',
    fontWeight: '600',
  }
});

export default AccountsScreen; 