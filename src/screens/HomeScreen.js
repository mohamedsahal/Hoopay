import React, { useState, useEffect } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Svg, Path } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoadingIndicator from '../components/LoadingIndicator';
import { LoadingSkeleton } from '../components/Loading';
import NotificationBell from '../components/NotificationBell';
import { useTabBarSafeHeight } from '../constants/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import Colors from '../constants/Colors';

// Action Button Component
const ActionButton = ({ icon, title, subtitle, onPress, color }) => (
  <TouchableOpacity 
    style={[styles.actionButton, { backgroundColor: color }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.actionButtonIcon}>
      {icon}
    </View>
    <Text style={styles.actionButtonTitle}>{title}</Text>
    {subtitle && <Text style={styles.actionButtonSubtitle}>{subtitle}</Text>}
  </TouchableOpacity>
);

// Home Screen Skeleton Components
const BalanceCardSkeleton = ({ colors }) => (
  <View style={styles.balanceCardContainer}>
    <LoadingSkeleton 
      width="100%" 
      height={180} 
      borderRadius={24}
      style={[styles.skeletonCard, { backgroundColor: colors.cardBackground }]}
    >
      <View style={styles.skeletonBalanceContent}>
        <View style={styles.skeletonBalanceHeader}>
          <LoadingSkeleton width={120} height={16} borderRadius={8} />
          <LoadingSkeleton width={60} height={24} borderRadius={12} />
        </View>
        <LoadingSkeleton width={200} height={48} borderRadius={8} style={{ marginTop: 20 }} />
        <View style={styles.skeletonBalanceFooter}>
          <LoadingSkeleton width={100} height={32} borderRadius={16} />
          <LoadingSkeleton width={24} height={18} borderRadius={4} />
        </View>
      </View>
    </LoadingSkeleton>
  </View>
);

const ActionButtonsSkeleton = ({ colors }) => (
  <View style={styles.actionButtonsContainer}>
    {[1, 2, 3].map((_, index) => (
      <View key={index} style={[styles.skeletonActionButtonCard, { backgroundColor: colors.cardBackground }]}>
        <LoadingSkeleton 
          width="100%" 
          height={110} 
          borderRadius={16}
          style={styles.skeletonActionButton}
        >
          <View style={styles.skeletonActionButtonContent}>
            <LoadingSkeleton width={42} height={42} borderRadius={21} style={{ marginBottom: 12 }} />
            <LoadingSkeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <LoadingSkeleton width="60%" height={11} borderRadius={4} />
          </View>
        </LoadingSkeleton>
      </View>
    ))}
  </View>
);

const RecentTransactionsSkeleton = ({ colors }) => (
  <View style={styles.recentActivitiesContainer}>
    <View style={styles.sectionHeader}>
      <LoadingSkeleton width={150} height={24} borderRadius={6} />
      <LoadingSkeleton width={60} height={16} borderRadius={8} />
    </View>
    {[1, 2, 3, 4].map((_, index) => (
      <View key={index} style={[styles.skeletonTransactionCard, { backgroundColor: colors.cardBackground }]}>
        <LoadingSkeleton 
          width="100%" 
          height={76} 
          borderRadius={15}
          style={styles.skeletonTransactionItem}
        >
          <View style={styles.skeletonTransactionItemContent}>
            <LoadingSkeleton width={46} height={46} borderRadius={23} />
            <View style={styles.skeletonTransactionContent}>
              <LoadingSkeleton width={120} height={16} borderRadius={4} />
              <LoadingSkeleton width={80} height={13} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.skeletonTransactionAmount}>
              <LoadingSkeleton width={80} height={16} borderRadius={4} />
              <LoadingSkeleton width={60} height={12} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
        </LoadingSkeleton>
      </View>
    ))}
  </View>
);

// Transaction Item Component
const TransactionItem = ({ 
  type, 
  amount, 
  date, 
  status, 
  recipient,
  colors
}) => {
  const isCredit = type === 'credit';
  
  let statusColor = colors.textSecondary;
  if (status === 'completed') statusColor = colors.success;
  if (status === 'pending') statusColor = colors.warning;
  if (status === 'failed') statusColor = colors.error;
  
  return (
    <View style={[styles.transactionItem, { backgroundColor: colors.cardBackground }]}>
      <View style={[styles.transactionIconContainer, { 
        backgroundColor: isCredit ? 'rgba(57, 183, 71, 0.1)' : 'rgba(255, 107, 107, 0.1)' 
      }]}>
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          {isCredit ? (
            <Path
              d="M16 3h5v5M14 10l7-7M8 21H3v-5M10 14l-7 7"
              stroke={colors.success}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <Path
              d="M3 3h5v5M14 14l-7-7M21 21h-5v-5M10 10l7 7"
              stroke={colors.error}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionType, { color: colors.text }]}>
          {type === 'credit' ? 'Received' : type === 'transfer' ? 'Transfer to ' + recipient : 'Withdrawal'}
        </Text>
        <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>{date}</Text>
      </View>
      <View style={styles.transactionAmountContainer}>
        <Text style={[styles.transactionAmount, { 
          color: isCredit ? colors.success : colors.text 
        }]}>
          {isCredit ? '+' : '-'}${amount}
        </Text>
        <Text style={[styles.transactionStatus, { color: statusColor }]}>
          {status}
        </Text>
      </View>
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout, authToken, updateUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [userName, setUserName] = useState('');
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const tabBarHeight = useTabBarSafeHeight();
  
  // Use fallback colors and theme if context is not available
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in HomeScreen, using default colors');
    colors = Colors;
    isDarkMode = false;
  }
  
  // Fetch recent activities from database
  const fetchRecentActivities = async () => {
    try {

      
      const response = await api.get('/mobile/recent-activities?limit=5');
      
      if (response.data && response.data.success) {

        setRecentTransactions(response.data.data.transactions || []);
      } else {
        console.log('Failed to fetch recent activities:', response.data.message);
        setRecentTransactions([]);
      }
    } catch (error) {
      console.log('Error fetching recent activities:', error.message);
      // Keep empty array on error instead of crashing
      setRecentTransactions([]);
    }
  };
  
  // Fetch profile data safely without forcing logout on failure
  const fetchProfileData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      

      
      const response = await api.get('/auth/mobile/profile');
      
      if (response.data && response.data.data) {


        
        let userData;
        let extractedBalance = null;
        
        if (response.data.data.user) {
          userData = response.data.data.user;

          
          // Try multiple balance extraction methods with detailed logging
          if (userData.wallet && userData.wallet.available_balance !== undefined) {
            extractedBalance = userData.wallet.available_balance;

          } else if (userData.wallet && userData.wallet.total_balance !== undefined) {
            extractedBalance = userData.wallet.total_balance;

          } else if (userData.wallet_balance !== undefined) {
            extractedBalance = userData.wallet_balance;

          } else if (userData.available_balance !== undefined) {
            extractedBalance = userData.available_balance;

          } else if (userData.total_balance !== undefined) {
            extractedBalance = userData.total_balance;

          } else {
            console.log('❌ NO BALANCE FOUND - Available fields:', Object.keys(userData));
            if (userData.wallet) {
              console.log('❌ Wallet fields:', Object.keys(userData.wallet));
            }
          }
          
          if (userData.name) {
            setUserName(userData.name);
          }
        } else {
          userData = response.data.data;

          
          // Try multiple balance extraction methods for direct data
          if (userData.wallet_balance !== undefined) {
            extractedBalance = userData.wallet_balance;

          } else if (userData.available_balance !== undefined) {
            extractedBalance = userData.available_balance;

          } else if (userData.total_balance !== undefined) {
            extractedBalance = userData.total_balance;

          } else if (userData.wallet && userData.wallet.available_balance !== undefined) {
            extractedBalance = userData.wallet.available_balance;

          } else {
            console.log('❌ NO BALANCE FOUND in direct data - Available fields:', Object.keys(userData));
          }
          
          if (userData.name) {
            setUserName(userData.name);
          }
        }
        
        // Set the balance if we found one
        if (extractedBalance !== null && extractedBalance !== undefined) {
          const numericBalance = parseFloat(extractedBalance);

          
          // Store the raw numeric balance, formatting will happen in display
          setBalance(numericBalance);
        } else {
          console.error('❌ CRITICAL: No balance found in response data');
          console.log('Available userData fields:', userData ? Object.keys(userData) : 'no userData');
          // Try to set a fallback balance
          setBalance(0);
        }
        
        if (userData) {
          try {
            await SecureStore.setItemAsync('userData', JSON.stringify(userData));

          } catch (storageError) {
            console.error('Failed to save to SecureStore:', storageError);
          }
          
          if (updateUser && typeof updateUser === 'function') {
            updateUser(userData);

          }
        }
        
        setLoading(false);
        return true;
      } else {
        console.error('❌ Invalid API response structure');
        console.log('Response:', response.data);
      }
      
      setLoading(false);
      return false;
    } catch (error) {
      console.error('=== PROFILE FETCH ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      setLoading(false);
      return false;
    }
  };
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchProfileData(true),
        fetchRecentActivities()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Format the wallet balance with 2 decimal places
  const formatBalance = (balance) => {
    if (balance === null || balance === undefined) {
      return '0.00';
    }
    
    return parseFloat(balance).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  // Toggle balance visibility
  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };
  
  // Initialize data from user object ONLY if we haven't fetched fresh data yet
  useEffect(() => {
    // Only set balance from user object if:
    // 1. We have user wallet data
    // 2. Current balance is exactly 0 (initial state) 
    // 3. We haven't already set a balance from API
    if (user?.wallet?.available_balance && balance === 0) {
      const userBalance = parseFloat(user.wallet.available_balance);
      setBalance(userBalance);
    }
    
    // Only set name if we don't have one yet
    if (user?.name && !userName) {
      setUserName(user.name);
    }
  }, [user, balance, userName]);
  
  const currency = user?.wallet?.currency || 'USD';
  
  // Function to get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  // Function to get user initials
  const getUserInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    let initials = names[0].charAt(0).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].charAt(0).toUpperCase();
    }
    return initials;
  };
  
  const greeting = getGreeting();
  const displayName = userName || user?.name || '';
  const userInitials = getUserInitials(displayName);
  
  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfileData();
    fetchRecentActivities();
  }, []);
  
  // Refresh data when screen comes into focus (e.g., returning from transfer/withdrawal)
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if we're coming back (not on initial mount)
      if (balance > 0 || userName) {

        fetchProfileData(true);
        fetchRecentActivities();
      }
    }, [balance, userName])
  );
  
  // Clear cached data and force refresh
  const clearCacheAndRefresh = async () => {
    try {
      console.log('=== CLEARING ALL CACHE AND REFRESHING ===');
      
      // Clear SecureStore cached data
      await SecureStore.deleteItemAsync('userData');
      console.log('✅ Cleared userData from SecureStore');
      
      // Reset local state
      setBalance(0);
      setUserName('');
      setRecentTransactions([]); // Clear transaction cache
      
      // Force fresh API calls
      await Promise.all([
        fetchProfileData(true),
        fetchRecentActivities()
      ]);
      

    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.headerBackground }]}>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor={colors.headerBackground}
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userSection}>
          <View style={[styles.profileImageContainer, { borderColor: colors.primary }]}>
            <View style={[styles.placeholderImage, { backgroundColor: colors.gradientStart }]}>
              <Text style={styles.placeholderText}>{userInitials}</Text>
            </View>
          </View>
          <View style={styles.greetingContainer}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Welcome, <Text style={[styles.username, { color: colors.primary }]}>
                {displayName || 'User'}
              </Text>
            </Text>
            <Text style={[styles.timeOfDay, { color: colors.textSecondary }]}>
              {greeting}!
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <NotificationBell
            onPress={() => navigation.navigate('NotificationsScreen')}
            size={20}
            color={colors.textSecondary}
            style={[styles.notificationButton, { backgroundColor: colors.surface }]}
          />
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={[
          styles.scrollContentContainer,
          { paddingBottom: tabBarHeight + 20 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          // Show skeleton loading components
          <>
            <BalanceCardSkeleton colors={colors} />
            <ActionButtonsSkeleton colors={colors} />
            <RecentTransactionsSkeleton colors={colors} />
          </>
        ) : (
          // Show actual content
          <>
            {/* Balance Card */}
            <View style={styles.balanceCardContainer}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceCard}
              >
                <View style={styles.patternOverlay}>
                  {[...Array(8)].map((_, i) => (
                    <View key={i} style={[styles.patternDot, {
                      top: Math.random() * 100 + '%',
                      left: Math.random() * 100 + '%',
                      opacity: 0.05 + Math.random() * 0.05,
                      transform: [{ scale: 0.3 + Math.random() * 0.7 }]
                    }]} />
                  ))}
                </View>
                
                <View style={styles.balanceCardContent}>
                  <View style={styles.balanceCardHeader}>
                    <Text style={styles.balanceLabel}>Total Balance</Text>
                    <View style={styles.currencyPill}>
                      <Text style={styles.currencyText}>{currency}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.balanceAmountContainer}>
                    <Text style={styles.balanceAmount}>
                      {isBalanceVisible ? `$${formatBalance(balance)}` : '••••••'}
                    </Text>
                    <TouchableOpacity 
                      style={styles.eyeIconContainer} 
                      onPress={toggleBalanceVisibility}
                      activeOpacity={0.7}
                    >
                      <Feather 
                        name={isBalanceVisible ? 'eye-off' : 'eye'} 
                        size={20} 
                        color="rgba(255,255,255,0.8)" 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.balanceCardFooter}>
                    <View style={styles.cardNumberContainer}>
                      <Text style={styles.cardNumberLabel}>Wallet ID</Text>
                      <Text style={styles.cardNumber}>
                        {user?.wallet_id || user?.wallet?.id ? 
                        String(user.wallet_id || user.wallet.id) : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.cardChip}>
                      <Svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                        <Path d="M21 1H3C1.89543 1 1 1.89543 1 3V15C1 16.1046 1.89543 17 3 17H21C22.1046 17 23 16.1046 23 15V3C23 1.89543 22.1046 1 21 1Z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
                        <Path d="M16 7H8V11H16V7Z" fill="rgba(255,255,255,0.5)"/>
                      </Svg>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <ActionButton 
                icon={
                  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M17 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M12 17v-6M9 14l3 3 3-3"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                }
                title="Deposit"
                subtitle="Add funds"
                color={colors.primary}
                onPress={() => {
                  console.log('Deposit button pressed, navigating...');
                  navigation.navigate('DepositStart');
                }}
              />
              
              <ActionButton 
                icon={
                  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H7Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M12 7v6M9 10l3-3 3 3"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                }
                title="Withdraw"
                subtitle="Cash out"
                color={colors.secondary}
                onPress={() => {
                  console.log('Withdraw button pressed, navigating...');
                  navigation.navigate('Withdraw');
                }}
              />
              
              <ActionButton 
                icon={
                  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M7 17L17 7M17 7H7M17 7V17"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                }
                title="Transfer"
                subtitle="Send money"
                color="#FF6B6B"
                onPress={() => {
                  console.log('Transfer button pressed, navigating...');
                  navigation.navigate('Transfer');
                }}
              />
            </View>
            
            {/* Recent Activities */}
            <View style={styles.recentActivitiesContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activities</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    type={transaction.type}
                    amount={transaction.amount}
                    date={transaction.date}
                    status={transaction.status}
                    recipient={transaction.recipient}
                    colors={colors}
                  />
                ))
              ) : (
                <View style={styles.emptyTransactionsContainer}>
                  <Feather name="activity" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyTransactionsText, { color: colors.textSecondary }]}>No recent activities</Text>
                  <Text style={[styles.emptyTransactionsSubtext, { color: colors.textSecondary }]}>
                    Your transactions will appear here
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '300',
  },
  username: {
    fontWeight: '600',
  },
  timeOfDay: {
    fontSize: 13,
    marginTop: 1,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  balanceCardContainer: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 24,
    overflow: 'hidden',
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  balanceCardContent: {
    minHeight: 180,
    position: 'relative',
    zIndex: 1,
  },
  balanceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    justifyContent: 'space-between',
  },
  eyeIconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 18,
    marginLeft: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  currencyPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 10,
  },
  currencyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.95,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 42,
    fontWeight: '700',
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  balanceCardFooter: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNumberContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardNumberLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 6,
  },
  cardNumber: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  patternDot: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 30,
  },
  cardChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 25,
  },
  actionButton: {
    width: '31%',
    height: 110,
    borderRadius: 16,
    padding: 15,
    justifyContent: 'space-between',
  },
  actionButtonIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  actionButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  recentActivitiesContainer: {
    marginHorizontal: 20,
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
  },
  transactionIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  emptyTransactionsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTransactionsText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  emptyTransactionsSubtext: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 5,
  },
  // Skeleton Loading Styles
  skeletonCard: {
    padding: 24,
  },
  skeletonBalanceContent: {
    minHeight: 180,
  },
  skeletonBalanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  skeletonBalanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
  skeletonActionButton: {
    marginHorizontal: 5,
  },
  skeletonActionButtonCard: {
    width: '31%',
    height: 110,
    borderRadius: 16,
    padding: 15,
    justifyContent: 'space-between',
  },
  skeletonActionButtonContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  skeletonTransactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
    marginBottom: 12,
  },
  skeletonTransactionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonTransactionContent: {
    flex: 1,
    marginLeft: 14,
  },
  skeletonTransactionAmount: {
    alignItems: 'flex-end',
  },
  skeletonTransactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
    marginBottom: 12,
  },
});

export default HomeScreen; 