import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Modal,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import LoadingIndicator from '../components/LoadingIndicator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import AddAccountModal from '../components/AccountCreation/AddAccountModal';
import AccountCard from '../components/AccountCreation/AccountCard';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { parseApiError, getErrorIcon, getErrorColor } from '../utils/errorUtils';
import * as SecureStore from 'expo-secure-store';
import accountService from '../services/accountService';
import { StatusBar } from 'expo-status-bar';
import Colors from '../constants/Colors';

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

const AccountScreen = ({ navigation }) => {
  const { token, isAuthenticated, user } = useAuth();
  
  // Use fallback colors and theme if context is not available
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in AccountScreen, using default colors');
    colors = Colors;
    isDarkMode = false;
  }
  
  const [accounts, setAccounts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const handleError = (error, fallbackMessage) => {
    const rawErrorMessage = error?.response?.data?.message || error?.message || fallbackMessage;
    const userFriendlyMessage = parseApiError(error) || fallbackMessage;
    setError(userFriendlyMessage);
    Alert.alert('Error', userFriendlyMessage);
    console.error('Account error:', rawErrorMessage);
  };

  const fetchAccounts = async (showLoader = true) => {
    if (!isAuthenticated) {
      setError('Please log in to view your accounts');
      return;
    }

    if (showLoader) setIsLoading(true);
    try {
      // Use our new accountService to fetch accounts
      const response = await accountService.getAllAccounts();
      
      if (response.success) {
        setAccounts(response.data.accounts || response.data || []);
        setError(null);
      } else {
        handleError(null, response.message || 'Failed to fetch accounts');
      }
    } catch (err) {
      handleError(err, 'Failed to fetch accounts');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAccounts(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccounts();
    }
  }, [isAuthenticated]);

  const handleAddAccount = async (accountData) => {
    if (!isAuthenticated) {
      setError('Please log in to add an account');
      return;
    }

    setIsModalVisible(false);
    setIsLoading(true);
    try {
      // Use our new accountService to create account
      const response = await accountService.createAccount(accountData);
      
      if (response.success) {
        await fetchAccounts(false);
        Alert.alert('Success', 'Account created successfully');
      } else {
        handleError(null, response.message || 'Failed to create account');
      }
    } catch (err) {
      handleError(err, 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountPress = (account) => {
    setSelectedAccount(account);
    console.log('Account pressed:', account.id, account);
  };

  // Helper function to determine the account's category
  const getAccountCategory = (account) => {
    if (!account) return 'Unknown';
    
    if (account.wallet_type_id === 1 || account.account_type === 'fiat') {
      return 'Fiat';
    } else if (account.wallet_type_id === 2 || account.account_type === 'crypto') {
      return 'Crypto';
    } else {
      return account.account_type || 'Unknown';
    }
  };

  // Helper function to get the display-friendly wallet type name
  const getDisplayWalletType = (account) => {
    if (!account) return 'Unknown';
    
    const walletName = (account.wallet_name || '').toLowerCase();
    const accountType = (account.account_type || '').toLowerCase();
    const walletTypeId = account.wallet_type_id;
    
    console.log(`Determining wallet type for account ${account.id}:`, {
      walletName,
      accountType,
      walletTypeId
    });
    
    if (walletName.includes('edahab')) {
      return 'eDahab';
    } else if (walletName.includes('premier')) {
      return 'Premier Bank';
    } else if (walletName.includes('sahal')) {
      return 'Sahal';
    } else if (walletName.includes('evc plus') || walletName.includes('evc')) {
      return 'EVC Plus';
    } else if (walletName.includes('zaad')) {
      return 'Zaad';
    } else if (walletName.includes('salaam')) {
      return 'Salaam Bank';
    } else if (walletName.includes('usdt') && walletName.includes('bep20')) {
      return 'USDT BEP20';
    } else if (walletName.includes('usdt')) {
      return 'USDT';
    } else if (walletName.includes('usdc')) {
      return 'USDC';
    } else if (walletName.includes('trc')) {
      return 'TRC';
    } else {
      return walletName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  };

  const handleDeleteAccount = (accountId) => {
    if (!accountId) {
      Alert.alert('Error', 'Invalid account ID');
      return;
    }
  
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const response = await accountService.deleteAccount(accountId);
              
              if (response.success) {
                await fetchAccounts(false);
                Alert.alert('Success', 'Account deleted successfully');
              } else {
                handleError(null, response.message || 'Failed to delete account');
              }
            } catch (err) {
              handleError(err, 'Failed to delete account');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  // Helper function to get wallet icon name for fallback
  const getWalletIconName = (account) => {
    if (!account) return 'account-balance-wallet';
    
    const walletName = (account.wallet_name || '').toLowerCase();
    
    if (walletName.includes('bank')) {
      return 'account-balance';
    } else if (walletName.includes('crypto') || walletName.includes('usdt') || walletName.includes('usdc')) {
      return 'currency-exchange';
    } else if (walletName.includes('mobile') || walletName.includes('zaad') || walletName.includes('evc')) {
      return 'phone-android';
    } else {
      return 'account-balance-wallet';
    }
  };

  // Get wallet logo source without JSX wrapper
  const getWalletLogoSource = (account) => {
    if (!account) return walletLogos.premierBank;
    
    const walletName = (account.wallet_name || '').toLowerCase();
    
    if (walletName.includes('sahal')) {
      return walletLogos.sahal;
    } else if (walletName.includes('premier')) {
      return walletLogos.premierBank;
    } else if (walletName.includes('evc plus') || walletName.includes('evc')) {
      return walletLogos.evc;
    } else if (walletName.includes('zaad')) {
      return walletLogos.zaad;
    } else if (walletName.includes('usdt') && walletName.includes('bep20')) {
      return walletLogos.usdtBep20;
    } else if (walletName.includes('usdt')) {
      return walletLogos.usdt;
    } else if (walletName.includes('usdc')) {
      return walletLogos.usdc;
    } else if (walletName.includes('trc') || walletName.includes('trx')) {
      return walletLogos.trc;
    } else if (walletName.includes('edahab')) {
      return walletLogos.edahab;
    } else if (walletName.includes('salaam')) {
      return walletLogos.salaamBank;
    } else {
      return walletLogos.premierBank; // Default
    }
  };

  // Render an individual account item
  const renderAccountItem = (account) => (
    <TouchableOpacity
      key={account.id}
      style={[styles.accountCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={() => handleAccountPress(account)}
      activeOpacity={0.7}
    >
      <View style={[styles.accountIconContainer, { backgroundColor: `${colors.primary}20` }]}>
        {getWalletLogoSource(account) ? (
          <Image 
            source={getWalletLogoSource(account)}
            style={styles.accountLogoImage}
          />
        ) : (
          <MaterialIcons 
            name={getWalletIconName(account)}
            size={24} 
            color={colors.primary} 
          />
        )}
      </View>
      
      <View style={styles.accountDetails}>
        <Text style={[styles.accountName, { color: colors.text }]}>
          {getDisplayWalletType(account)}
        </Text>
        <Text style={[styles.accountType, { color: colors.primary }]}>
          {getAccountCategory(account)}
        </Text>
        <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>
          Account: {account.account_number}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation();
          handleDeleteAccount(account.id);
        }}
      >
        <MaterialIcons 
          name="delete-outline" 
          size={24} 
          color={colors.error} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.messageText}>Please log in to view your accounts</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.headerBackground }]}>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor={colors.headerBackground}
        translucent={false}
      />
      
      {/* Header with consistent design */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>My Accounts</Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setIsModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.centerContent}>
          <LoadingIndicator size={14} color={colors.primary} variant="pulse" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your accounts...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => fetchAccounts()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={[styles.accountsList, { backgroundColor: colors.background }]}
          contentContainerStyle={accounts.length === 0 ? styles.emptyContentContainer : null}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {accounts.length === 0 ? (
            <View style={styles.centerContent}>
              <FontAwesome name="bank" size={60} color={colors.textSecondary} style={styles.emptyIcon} />
              <Text style={[styles.messageText, { color: colors.textSecondary }]}>No accounts found</Text>
              <Text style={[styles.submessageText, { color: colors.textSecondary }]}>Tap the "Add" button to create one</Text>
            </View>
          ) : (
            <View style={styles.accountsContainer}>
              {accounts.map(renderAccountItem)}
            </View>
          )}
        </ScrollView>
      )}

      <AddAccountModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleAddAccount}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
    borderBottomWidth: 0,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  accountsList: {
    flex: 1,
    padding: 20,
  },
  accountsContainer: {
    paddingBottom: 20,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.7,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  accountIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  accountLogoImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 13,
    marginBottom: 4,
  },
  deleteButton: {
    padding: 8,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    fontSize: 16,
  },
  messageText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  submessageText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 15,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccountScreen; 