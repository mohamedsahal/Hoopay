import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  Share,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import Colors from '../constants/Colors';
import api from '../services/api';
import kycService from '../services/kycService';
import { Loading } from '../components/Loading';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import ThermalReceipt from '../components/ThermalReceipt';

const { width: screenWidth } = Dimensions.get('window');

// Perforated Edge Component for Receipt
const PerforatedEdge = ({ isTop = true }) => {
  const dots = [];
  const receiptWidth = Dimensions.get('window').width - 40;
  const numDots = Math.floor(receiptWidth / 20);
  
  for (let i = 0; i < numDots; i++) {
    dots.push(
      <View key={i} style={styles.perforationDot} />
    );
  }
  
  return (
    <View style={[styles.perforatedContainer, isTop ? styles.perforatedTop : styles.perforatedBottom]}>
      {dots}
    </View>
  );
};

type RootStackParamList = {
  Withdraw: undefined;
  Home: undefined;
  WithdrawHistory: undefined;
};

type WithdrawScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Withdraw'>;
type WithdrawScreenRouteProp = RouteProp<RootStackParamList, 'Withdraw'>;

interface Props {
  navigation: WithdrawScreenNavigationProp;
  route: WithdrawScreenRouteProp;
}

interface WithdrawalInfo {
  wallet_balance: number;
  currency: string;
  accounts: Account[];
  minimum_withdrawal: number;
  maximum_withdrawal: number;
  has_accounts: boolean;
  recent_withdrawals: RecentWithdrawal[];
}

interface Account {
  id: number;
  display_name: string;
  account_type: string;
  is_crypto: boolean;
  minimum_withdrawal: number;
  wallet_type?: {
    name: string;
    account_category: string;
  };
}

interface FeeInfo {
  withdrawal_amount: number;
  fee_amount: number;
  fee_percentage: number;
  net_amount: number;
}

interface RecentWithdrawal {
  id: number;
  amount: number | string;
  destination: string;
  created_at: string;
  status: string;
}

interface WithdrawalResult {
  withdrawal: {
    id: number;
    withdrawal_id: string;
    amount: number | string;
    net_amount: number;
    status: string;
    account: {
      id: number;
      type: string;
      number: string;
      is_crypto: boolean;
    };
    created_at: string;
  };
}

type Step = 'info' | 'select' | 'amount' | 'confirm' | 'success';

const WithdrawScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const { refreshNotifications } = useNotifications();
  const insets = useSafeAreaInsets();
  
  // Use fallback colors and theme if context is not available
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in WithdrawScreen, using default colors');
    colors = Colors;
    isDarkMode = false;
  }
  
  const receiptRef = useRef<ViewShot>(null);
  
  // Remove custom toast - using global NotificationToast instead
  const [step, setStep] = useState<Step>('info');
  const [withdrawalInfo, setWithdrawalInfo] = useState<WithdrawalInfo | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [feeInfo, setFeeInfo] = useState<FeeInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading withdrawal information...');
  const [withdrawalResult, setWithdrawalResult] = useState<WithdrawalResult | null>(null);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [kycLimits, setKycLimits] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset form function
  const resetWithdrawalForm = () => {
    setStep('info');
    setSelectedAccount(null);
    setAmount('');
    setFeeInfo(null);
    setWithdrawalResult(null);
    setIsSubmitting(false);
    setIsCapturing(false);
    setError(null);
  };

  // Simple state reset on mount - only reset if not already in info step
  React.useEffect(() => {
    if (step !== 'info') {
      // Resetting withdrawal screen state on mount
      resetWithdrawalForm();
    }
  }, []); // Only run on mount

 

  // Cleanup effect for iOS - reset state when component unmounts
  React.useEffect(() => {
    return () => {
      // Cleanup function to reset state on unmount
      resetWithdrawalForm();
    };
  }, []);

  useEffect(() => {
    loadWithdrawalInfo();
    loadKycStatus();
  }, []);

  // Status polling effect - check for status updates every 10 seconds when on success screen
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    
    if (step === 'success' && withdrawalResult?.withdrawal?.withdrawal_id) {
      statusInterval = setInterval(async () => {
        try {
          const response = await api.get(`/mobile/withdrawals/${withdrawalResult.withdrawal.withdrawal_id}/status`);
          if (response.data.success && response.data.data.withdrawal.status !== withdrawalResult.withdrawal.status) {
            const newStatus = response.data.data.withdrawal.status;
            const oldStatus = withdrawalResult.withdrawal.status;
            
            // Status has changed, update the withdrawal result
            setWithdrawalResult(prev => prev ? {
              ...prev,
              withdrawal: {
                ...prev.withdrawal,
                status: newStatus
              }
            } : null);
            
            // Withdrawal status updated
            
            // Refresh notifications when status changes
            try {
              await refreshNotifications();
            } catch (error) {
              // Failed to refresh notifications
            }
            
            // Don't show custom toasts for status changes - let the global NotificationToast handle backend notifications
            // Only log for debugging
            // Withdrawal status changed
          }
        } catch (error) {
          // Status check failed
        }
      }, 10000); // Check every 10 seconds
    }

    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [step, withdrawalResult?.withdrawal?.withdrawal_id, withdrawalResult?.withdrawal?.status, refreshNotifications]);

  const loadWithdrawalInfo = async (): Promise<void> => {
    setIsLoading(true);
    setLoadingMessage('Loading withdrawal information...');
    
    try {
      const response = await api.get('/mobile/withdrawals/info');
      // Withdrawal info loaded
      setWithdrawalInfo(response.data.data);
    } catch (error) {
      console.error('Error loading withdrawal info:', error);
      Alert.alert('Error', 'Failed to load withdrawal information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadKycStatus = async (): Promise<void> => {
    try {
      const kycResponse = await kycService.getKycStatus();
      if (kycResponse.success) {
        setKycStatus(kycResponse.data);
        
        // Get the verification level, default to 'unverified' if not set
        const verificationLevel = kycResponse.data.verification_level || 'unverified';
        const verificationStatus = kycResponse.data.verification_status;
        
        // Set limits based on verification status
        if (verificationStatus === 'approved') {
          // For verified users, set unlimited limits
          setKycLimits({
            withdrawal_limit: -1, // Unlimited
            deposit_limit: -1,    // Unlimited
            transaction_limit: -1, // Unlimited
          });
        } else {
          // User is not verified or pending verification, use minimal limits
          setKycLimits(getUnverifiedLimits());
        }
      } else {
        // If KYC service fails, set minimal limits for safety
        setKycLimits(getUnverifiedLimits());
      }
    } catch (error) {
      console.error('Error loading KYC status:', error);
      // If KYC service fails, set minimal limits for safety
      setKycLimits(getUnverifiedLimits());
    }
  };

  const getUnverifiedLimits = () => ({
    withdrawal_limit: 1500.00,  // Max 1500 for non-verified users
    deposit_limit: 1500.00,     // Max 1500 for non-verified users
    transaction_limit: 1500.00, // Max 1500 for non-verified users
  });

  const calculateFee = async (accountId: number, withdrawAmount: string): Promise<FeeInfo> => {
    try {
      const response = await api.post('/mobile/withdrawals/calculate-fee', {
        account_id: accountId,
        amount: parseFloat(withdrawAmount)
      });
      return response.data.data;
    } catch (error) {
      console.error('Error calculating fee:', error);
      throw error;
    }
  };

  const handleAccountSelect = (account: Account): void => {
    // handleAccountSelect called
    setSelectedAccount(account);
    // Use setTimeout for iOS to ensure state updates are processed correctly
    if (Platform.OS === 'ios') {
      setTimeout(() => setStep('amount'), 0);
    } else {
      setStep('amount');
    }
  };

  const handleAmountChange = (value: string): void => {
    // Only allow numbers and one decimal point
    const filtered = value.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    if (parts.length <= 2) {
      setAmount(filtered);
      
      // Calculate fee asynchronously without blocking UI
      if (filtered && selectedAccount && parseFloat(filtered) > 0) {
        // Use setTimeout to make this non-blocking
        setTimeout(async () => {
          try {
            const fee = await calculateFee(selectedAccount.id, filtered);
            setFeeInfo(fee);
          } catch (error) {
            setFeeInfo(null);
          }
        }, 0);
      } else {
        setFeeInfo(null);
      }
    }
  };

  const handleContinueToConfirm = (): void => {
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }

    if (!withdrawalInfo) {
      Alert.alert('Error', 'Withdrawal information not available.');
      return;
    }

    if (withdrawAmount > withdrawalInfo.wallet_balance) {
      Alert.alert('Insufficient Funds', `Your available balance is $${withdrawalInfo.wallet_balance.toFixed(2)}`);
      return;
    }

    // Use account-specific minimum withdrawal
    const accountMinimum = selectedAccount?.minimum_withdrawal || withdrawalInfo.minimum_withdrawal;
    if (withdrawAmount < accountMinimum) {
      const accountType = selectedAccount?.is_crypto ? 'crypto' : 'regular';
      Alert.alert(
        'Minimum Amount', 
        `Minimum withdrawal amount for ${accountType} accounts is $${accountMinimum.toFixed(2)}`
      );
      return;
    }

    // Check KYC limits first (more restrictive than system limits) - skip for verified users
    if (kycLimits && kycLimits.withdrawal_limit !== -1 && withdrawAmount > kycLimits.withdrawal_limit) {
      const kycVerified = kycStatus?.verification_status === 'approved';
      if (!kycVerified) {
        Alert.alert(
          'Verification Required', 
          `Unverified users can only withdraw up to $${kycLimits.withdrawal_limit.toFixed(2)}. Complete KYC verification for unlimited withdrawals.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Verify Now', 
              onPress: () => navigation.navigate('KycVerification' as never) 
            }
          ]
        );
      } else {
        Alert.alert(
          'Limit Exceeded', 
          `Your current verification level allows withdrawals up to $${kycLimits.withdrawal_limit.toFixed(2)}. Upgrade your verification for unlimited withdrawals.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Upgrade Verification', 
              onPress: () => navigation.navigate('KycVerification' as never) 
            }
          ]
        );
      }
      return;
    }

    // Check system maximum withdrawal limit
    if (withdrawAmount > withdrawalInfo.maximum_withdrawal) {
      Alert.alert('Maximum Amount', `Maximum withdrawal amount is $${withdrawalInfo.maximum_withdrawal.toFixed(2)}`);
      return;
    }

    setStep('confirm');
  };

  const executeWithdrawal = async (): Promise<void> => {
    setIsSubmitting(true);
    setLoadingMessage('Processing withdrawal...');
    
    try {
      const response = await api.post('/mobile/withdrawals/initiate', {
        account_id: selectedAccount?.id,
        amount: parseFloat(amount),
        description: `Withdrawal to ${selectedAccount?.wallet_type?.name || 'Account'}`
      });

      // Withdrawal completed
      setWithdrawalResult(response.data.data);
      
      setLoadingMessage('Withdrawal completed! Updating balance...');
      
      // Refresh notifications to include the new withdrawal notification
      try {
        await refreshNotifications();
      } catch (error) {
        // Failed to refresh notifications after withdrawal
      }
      
      // Update user balance with the new balance from the API response
      if (updateUser && user && response.data.data.new_wallet_balance !== undefined) {
        const updatedUser = {
          ...user,
          wallet: {
            ...user.wallet,
            available_balance: response.data.data.new_wallet_balance,
            total_balance: response.data.data.new_wallet_balance
          }
        };
        // Updating user balance
        await updateUser(updatedUser);
      }
      
      setLoadingMessage('Preparing withdrawal receipt...');
      
      // Add delay for smooth transition 
      setTimeout(() => {
        setStep('success');
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      const errorMessage = (error as any).response?.data?.message || 'Failed to process withdrawal. Please try again.';
      Alert.alert('Withdrawal Failed', errorMessage);
      setIsSubmitting(false);
    }
  };

  // Share receipt functionality
  const shareReceipt = async () => {
    try {
      setIsCapturing(true);
      
      // Capture the receipt view as image
      if (!receiptRef.current || !receiptRef.current.capture) {
        throw new Error('Receipt ref not available');
      }
      const uri = await receiptRef.current.capture();
      // Receipt captured
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Withdrawal Receipt',
          UTI: 'public.jpeg'
        });
      } else {
        // Fallback to React Native's built-in Share API
        if (Platform.OS === 'ios') {
          await Share.share({
            url: uri,
            message: 'Withdrawal Receipt from Hoopay Wallet',
            title: 'Withdrawal Receipt',
          });
        } else {
          await Share.share({
            message: 'Withdrawal Receipt from Hoopay Wallet',
            title: 'Withdrawal Receipt',
            url: uri,
          });
        }
      }
    } catch (error: any) {
      console.error('Error capturing/sharing receipt:', error);
      
      // Check if user cancelled sharing
      const errorMessage = error.message || '';
      if (errorMessage.includes('User did not share') || 
          errorMessage.includes('cancelled') || 
          errorMessage.includes('dismiss')) {
        // User cancelled sharing
        return;
      }
      
      // Enhanced fallback to text sharing
      try {
        const receiptText = `
🧾 WITHDRAWAL RECEIPT 🧾

✅ Withdrawal ${withdrawalResult?.withdrawal?.status === 'completed' ? 'Completed' : 'Submitted'}!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 From: ${user?.name || 'Unknown'}
🏦 To: ${selectedAccount?.wallet_type?.name || 'Account'}
💰 Amount: $${typeof withdrawalResult?.withdrawal?.amount === 'number' 
                ? withdrawalResult.withdrawal.amount.toFixed(2) 
                : typeof withdrawalResult?.withdrawal?.amount === 'string'
                ? parseFloat(withdrawalResult.withdrawal.amount).toFixed(2)
                : '0.00'}
💳 Account: ${withdrawalResult?.withdrawal?.account?.number || 'N/A'}
📋 Transaction ID: ${withdrawalResult?.withdrawal?.withdrawal_id}
📊 Status: ${withdrawalResult?.withdrawal?.status?.toUpperCase()}
📅 Date: ${new Date().toLocaleDateString()}
⏰ Time: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💙 Powered by Hoopay Wallet
        `.trim();

        await Share.share({
          message: receiptText,
          title: 'Withdrawal Receipt',
        });
      } catch (fallbackError) {
        console.error('Fallback sharing also failed:', fallbackError);
        Alert.alert('Error', 'Failed to share receipt. Please try again.');
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Custom toast removed - using global NotificationToast instead

  const renderWithdrawalInfo = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor={colors.background}
        translucent={false}
      />
      <View style={[styles.header, { 
        backgroundColor: colors.background, 
        borderBottomColor: colors.border,
        paddingTop: Math.max(insets.top, 10) + 10
      }]}>
        <TouchableOpacity onPress={() => {
          // Use navigation.goBack() for first screen, reset for others
          if (step === 'info') {
            navigation.goBack();
          } else {
            setStep('info');
          }
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Withdraw Funds</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={[styles.content, { backgroundColor: colors.background }]} 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#39B747', '#2E8B3A']}
            style={styles.balanceGradient}
          >
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              ${withdrawalInfo?.wallet_balance?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.balanceCurrency}>{withdrawalInfo?.currency || 'USD'}</Text>
          </LinearGradient>
        </View>

        {/* Withdrawal Info */}
        <View style={[styles.infoSection, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Min Withdrawal:</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>
              ${withdrawalInfo?.minimum_withdrawal?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Your Limit:</Text>
            <Text style={[styles.infoValue, { color: kycLimits ? colors.primary : colors.warning }]}>
              {kycLimits ? (kycLimits.withdrawal_limit === -1 ? 'Unlimited' : `$${kycLimits.withdrawal_limit?.toFixed(2)}`) : 'Loading...'}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Status:</Text>
            {kycStatus?.verification_status === 'approved' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success || '#4CAF50'} />
                <Text style={[styles.infoValue, { color: colors.success || '#4CAF50', marginLeft: 4 }]}>
                  Verified - Unlimited withdrawals
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => navigation.navigate('KycVerification' as never)}>
                <Text style={[styles.infoValue, { color: colors.warning }]}>
                  {kycStatus?.verification_status === 'pending' ? 'Verification Pending' : 'Unverified - Tap to verify'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Processing Time:</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>Immediate</Text>
          </View>
        </View>

        {/* Continue or No Accounts */}
        {withdrawalInfo?.has_accounts ? (
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary, marginBottom: Math.max(insets.bottom, 20) }]}
            onPress={() => {
              // Start Withdrawal pressed
              // Use setTimeout for iOS to ensure state updates are processed correctly
              if (Platform.OS === 'ios') {
                setTimeout(() => setStep('select'), 0);
              } else {
                setStep('select');
              }
            }}
          >
            <Text style={styles.continueButtonText}>Start Withdrawal</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.noAccountsCard, { backgroundColor: colors.cardBackground }]}>
            <Ionicons name="card-outline" size={48} color={colors.error} />
            <Text style={[styles.noAccountsTitle, { color: colors.text }]}>No Active Accounts</Text>
            <Text style={[styles.noAccountsText, { color: colors.textSecondary }]}>
              You need to add a withdrawal account before you can withdraw funds. Please contact support to add an account.
            </Text>
            <TouchableOpacity 
              style={[styles.addAccountButton, { backgroundColor: colors.primary, marginBottom: Math.max(insets.bottom, 20) }]}
              onPress={() => Alert.alert('Contact Support', 'Please contact our support team to add a withdrawal account.')}
            >
              <Text style={styles.addAccountButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Withdrawals */}
        {withdrawalInfo?.recent_withdrawals && withdrawalInfo.recent_withdrawals.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Withdrawals</Text>
            {withdrawalInfo.recent_withdrawals.slice(0, 3).map((item, index) => (
              <View key={index} style={[styles.recentItem, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.recentInfo}>
                  <Text style={[styles.recentAmount, { color: colors.text }]}>${item.amount}</Text>
                  <Text style={[styles.recentDestination, { color: colors.textSecondary }]}>{item.destination}</Text>
                  <Text style={[styles.recentDate, { color: colors.textSecondary }]}>{item.created_at}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  const renderAccountSelection = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor={colors.background}
        translucent={false}
      />
      <View style={[styles.header, { 
        backgroundColor: colors.background, 
        borderBottomColor: colors.border,
        paddingTop: Math.max(insets.top, 10) + 10
      }]}>
        <TouchableOpacity onPress={() => {
          // Back to info pressed
          // Use setTimeout for iOS to ensure state updates are processed correctly
          if (Platform.OS === 'ios') {
            setTimeout(() => setStep('info'), 0);
          } else {
            setStep('info');
          }
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Select Account</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={[styles.content, { backgroundColor: colors.background }]} 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Choose Withdrawal Account</Text>
        
        {withdrawalInfo?.accounts && withdrawalInfo.accounts.length > 0 ? (
          withdrawalInfo.accounts.map((item) => (
            <TouchableOpacity
              key={item.id.toString()}
              style={[styles.accountItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => handleAccountSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.accountInfo}>
                <View style={[styles.accountIcon, { backgroundColor: `${colors.primary}20` }]}>
                  <Ionicons 
                    name={item.is_crypto ? "logo-bitcoin" : "card-outline"} 
                    size={24} 
                    color={colors.primary} 
                  />
                </View>
                <View style={styles.accountDetails}>
                  <Text style={[styles.accountName, { color: colors.text }]}>{item.display_name}</Text>
                  <Text style={[styles.accountType, { color: colors.textSecondary }]}>
                    {item.wallet_type?.name || item.account_type}
                  </Text>
                  <Text style={[styles.accountMin, { color: colors.textSecondary }]}>
                    Min: ${item.minimum_withdrawal}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.noAccountsCard, { backgroundColor: colors.cardBackground }]}>
            <Ionicons name="card-outline" size={48} color={colors.error} />
            <Text style={[styles.noAccountsTitle, { color: colors.text }]}>No Accounts Available</Text>
            <Text style={[styles.noAccountsText, { color: colors.textSecondary }]}>
              No withdrawal accounts found. Please contact support to add an account.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  const renderAmountInput = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor={colors.background}
        translucent={false}
      />
      <View style={[styles.header, { 
        backgroundColor: colors.background, 
        borderBottomColor: colors.border,
        paddingTop: Math.max(insets.top, 10) + 10
      }]}>
        <TouchableOpacity onPress={() => {
          // Back to select pressed
          // Use setTimeout for iOS to ensure state updates are processed correctly
          if (Platform.OS === 'ios') {
            setTimeout(() => setStep('select'), 0);
          } else {
            setStep('select');
          }
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Enter Amount</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={[styles.content, { backgroundColor: colors.background }]} 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
          <View style={[styles.selectedAccountCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={[styles.accountIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons 
                name={selectedAccount?.is_crypto ? "logo-bitcoin" : "card-outline"} 
                size={24} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: colors.text }]}>{selectedAccount?.display_name}</Text>
              <Text style={[styles.accountType, { color: colors.textSecondary }]}>{selectedAccount?.wallet_type?.account_category}</Text>
            </View>
          </View>

          <View style={[styles.amountSection, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Withdrawal Amount</Text>
            <View style={[styles.amountInputContainer, { borderColor: colors.border }]}>
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>$</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
                autoFocus
                placeholderTextColor={colors.placeholder}
                maxLength={10}
                selectTextOnFocus
              />
            </View>
            
            <View style={styles.balanceInfo}>
              <Text style={[styles.balanceInfoText, { color: colors.textSecondary }]}>
                Available: ${withdrawalInfo?.wallet_balance?.toFixed(2) || '0.00'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const maxAmount = withdrawalInfo?.wallet_balance?.toString() || '0';
                  handleAmountChange(maxAmount);
                  Keyboard.dismiss();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.maxButton, { color: colors.primary }]}>MAX</Text>
              </TouchableOpacity>
            </View>

            {/* Show account-specific minimum */}
            <View style={styles.minimumInfo}>
              <Text style={[styles.minimumInfoText, { color: colors.textSecondary }]}>
                Minimum: ${selectedAccount?.minimum_withdrawal?.toFixed(2) || '1.00'}
                {selectedAccount?.is_crypto && (
                  <Text style={[styles.cryptoNote, { color: colors.warning }]}> (Crypto minimum)</Text>
                )}
              </Text>
            </View>

            {feeInfo && (
              <View style={[styles.feeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Withdrawal Amount:</Text>
                  <Text style={[styles.feeValue, { color: colors.text }]}>${feeInfo.withdrawal_amount.toFixed(2)}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Fee ({feeInfo.fee_percentage}%):</Text>
                  <Text style={[styles.feeValue, { color: colors.error }]}>${feeInfo.fee_amount.toFixed(2)}</Text>
                </View>
                <View style={[styles.feeRow, styles.feeTotal, { borderTopColor: colors.border }]}>
                  <Text style={[styles.feeTotalLabel, { color: colors.text }]}>You'll receive:</Text>
                  <Text style={[styles.feeTotalValue, { color: colors.primary }]}>${feeInfo.net_amount.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton, 
              { 
                backgroundColor: (!amount || !feeInfo) ? colors.primaryDisabled : colors.primary,
                marginBottom: Math.max(insets.bottom, 20) 
              }
            ]}
            onPress={handleContinueToConfirm}
            disabled={!amount || !feeInfo}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
    </SafeAreaView>
  );

  const renderConfirmation = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor={colors.background}
        translucent={false}
      />
      <View style={[styles.header, { 
        backgroundColor: colors.background, 
        borderBottomColor: colors.border,
        paddingTop: Math.max(insets.top, 10) + 10
      }]}>
        <TouchableOpacity onPress={() => {
          // Back to amount pressed
          // Use setTimeout for iOS to ensure state updates are processed correctly
          if (Platform.OS === 'ios') {
            setTimeout(() => setStep('amount'), 0);
          } else {
            setStep('amount');
          }
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Confirm Withdrawal</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={[styles.content, { backgroundColor: colors.background }]} 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.confirmCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.confirmHeader}>
            <Ionicons name="card-outline" size={32} color={colors.primary} />
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Withdrawal Summary</Text>
          </View>

          <View style={styles.confirmDetails}>
            <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>To Account:</Text>
              <Text style={[styles.confirmValue, { color: colors.text }]}>{selectedAccount?.display_name}</Text>
            </View>
            <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Account Type:</Text>
              <Text style={[styles.confirmValue, { color: colors.text }]}>{selectedAccount?.wallet_type?.account_category}</Text>
            </View>
            <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Withdrawal Amount:</Text>
              <Text style={[styles.confirmValue, { color: colors.text }]}>${parseFloat(amount).toFixed(2)}</Text>
            </View>
            <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Processing Fee:</Text>
              <Text style={[styles.confirmValue, { color: colors.error }]}>${feeInfo?.fee_amount?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={[styles.confirmRow, styles.confirmTotal, { borderTopColor: colors.border }]}>
              <Text style={[styles.confirmTotalLabel, { color: colors.text }]}>You'll receive:</Text>
              <Text style={[styles.confirmTotalValue, { color: colors.primary }]}>${feeInfo?.net_amount?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>

          <View style={[styles.warningCard, { backgroundColor: `${colors.warning}20`, borderColor: colors.warning }]}>
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.warning }]}>
              This withdrawal will be processed immediately. You cannot cancel once confirmed.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            { 
              backgroundColor: isSubmitting ? colors.primaryDisabled : colors.primary,
              marginBottom: Math.max(insets.bottom, 20) 
            }
          ]}
          onPress={executeWithdrawal}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const renderSuccess = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor={colors.background}
        translucent={false}
      />
      <ScrollView 
        style={[styles.content, { backgroundColor: colors.background }]} 
        contentContainerStyle={[styles.contentContainer, { paddingTop: Math.max(insets.top, 20) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Message */}
        <View style={[styles.successHeader, { marginTop: 20, marginBottom: 32 }]}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="check-circle" size={64} color={colors.primary} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Withdrawal {getDisplayStatus()}!</Text>
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
            Your withdrawal request has been {withdrawalResult?.withdrawal?.status === 'completed' ? 'completed' : 'submitted'} successfully. Your receipt is ready below.
          </Text>
        </View>

        {/* Enhanced Receipt Card for Image Capture */}
        <View style={styles.receiptContainer}>
          <ViewShot ref={receiptRef} options={{ format: "jpg", quality: 0.9 }}>
            <ThermalReceipt
              transactionType="withdrawal"
              transactionId={withdrawalResult?.withdrawal?.withdrawal_id || ''}
              amount={withdrawalResult?.withdrawal?.amount || '0'}
              status={withdrawalResult?.withdrawal?.status || 'pending'}
              date={withdrawalResult?.withdrawal?.created_at}
              senderInfo={{
                name: user?.name || 'You'
              }}
              recipientInfo={{
                name: selectedAccount?.wallet_type?.name || 'Account',
                account: withdrawalResult?.withdrawal?.account?.number || 'N/A'
              }}
              feeAmount={feeInfo?.fee_amount || 0}
              netAmount={withdrawalResult?.withdrawal?.net_amount || 0}
            />
          </ViewShot>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionButtonsContainer, { 
          paddingBottom: Math.max(insets.bottom, 32),
          paddingTop: 32,
          paddingHorizontal: 20,
          marginTop: 20
        }]}>
          <TouchableOpacity
            style={[styles.shareButton, styles.buttonFlex, { backgroundColor: colors.primary }]}
            onPress={shareReceipt}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size={20} color={colors.background} />
            ) : (
              <MaterialIcons name="share" size={20} color={colors.background} />
            )}
            <Text style={styles.shareButtonText}>
              {isCapturing ? 'Preparing...' : 'Share Receipt'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.homeButton, styles.buttonFlex, { borderColor: colors.border }]}
            onPress={() => {
              // Navigate to main home screen with reset (like DepositScreen)
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' as never }],
              });
            }}
          >
            <MaterialIcons name="home" size={20} color={colors.primary} />
            <Text style={[styles.homeButtonText, { color: colors.primary }]}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // Helper functions for status display
  const getDisplayStatus = (): string => {
    const status = withdrawalResult?.withdrawal?.status || 'pending';
    switch (status.toLowerCase()) {
      case 'completed': return 'Completed';
      case 'processing': return 'Processing';
      case 'pending': return 'Submitted';
      case 'rejected': return 'Rejected';
      default: return 'Submitted';
    }
  };

  const getStatusIcon = (): string => {
    const status = withdrawalResult?.withdrawal?.status || 'pending';
    switch (status.toLowerCase()) {
      case 'completed': return 'check-circle';
      case 'processing': return 'autorenew';
      case 'pending': return 'schedule';
      case 'rejected': return 'cancel';
      default: return 'schedule';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed': return colors.primary;
      case 'pending': return colors.warning;
      case 'processing': return colors.primary;
      case 'rejected': return colors.error;
      case 'cancelled': return colors.secondary;
      default: return colors.secondary;
    }
  };

  if (isLoading || isSubmitting) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar 
          style={isDarkMode ? "light" : "dark"} 
          backgroundColor={colors.background}
          translucent={false}
        />
        <Loading 
          type="overlay"
          visible={true} 
          message={loadingMessage} 
          size="large"
          variant="rotate"
          position="center"
        />
      </View>
    );
  }

  const renderCurrentStep = () => {
    // WithdrawScreen renderCurrentStep
    switch (step) {
      case 'info':
        return renderWithdrawalInfo();
      case 'select':
        return renderAccountSelection();
      case 'amount':
        return renderAmountInput();
      case 'confirm':
        return renderConfirmation();
      case 'success':
        return renderSuccess();
      default:
        return renderWithdrawalInfo();
    }
  };

  return renderCurrentStep();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 16,
  },
  balanceCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  balanceGradient: {
    padding: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balanceCurrency: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  infoSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 16,
    color: '#3C3C43',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#39B747',
  },
  continueButton: {
    backgroundColor: '#39B747',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  noAccountsCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  noAccountsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3C3C43',
    marginTop: 16,
    marginBottom: 8,
  },
  noAccountsText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  addAccountButton: {
    backgroundColor: '#39B747',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recentSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 16,
  },
  recentItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentInfo: {
    flex: 1,
  },
  recentDestination: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 4,
  },
  recentDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  recentAmount: {
    alignItems: 'flex-end',
  },
  recentAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 4,
  },
  recentStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F7EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  accountMin: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  selectedAccountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#39B747',
    paddingBottom: 8,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#39B747',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3C3C43',
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceInfoText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  maxButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#39B747',
  },
  feeCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 16,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#3C3C43',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
  },
  feeTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  feeTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C43',
  },
  feeTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#39B747',
  },
  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  confirmHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3C3C43',
    marginTop: 12,
  },
  confirmDetails: {
    marginBottom: 24,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  confirmLabel: {
    fontSize: 16,
    color: '#3C3C43',
  },
  confirmValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C43',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  confirmTotal: {
    borderBottomWidth: 0,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#E5E5EA',
  },
  confirmTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C3C43',
  },
  confirmTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#39B747',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  warningCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningText: {
    fontSize: 14,
    color: '#B8860B',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: '#39B747',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  receiptContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3C3C43',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  successDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 32,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  successLabel: {
    fontSize: 16,
    color: '#3C3C43',
  },
  successValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C43',
  },
  statusPending: {
    color: '#FF9500',
    textTransform: 'uppercase',
  },
  successActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  homeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#39B747',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#39B747',
    marginLeft: 8,
  },
  buttonFlex: {
    flex: 1,
  },
  // Receipt styles
  receiptImageContainer: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    marginHorizontal: 8,
    marginVertical: 12,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptCard: {
    backgroundColor: '#FEFEFE',
    width: Dimensions.get('window').width - 40,
    maxWidth: 400,
    position: 'relative',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: Platform.OS === 'android' ? 3 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000000' : 'transparent',
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 4 : 0,
  },
  receiptContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#333333',
    marginLeft: 6,
    textAlign: 'center',
    flex: 1,
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
  },
  receiptBody: {
    marginBottom: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginVertical: 1,
  },
  receiptLabel: {
    fontSize: 13,
    color: '#666666',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
    fontWeight: Platform.OS === 'android' ? '400' : 'normal',
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#333333',
    textAlign: 'right',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 6,
    borderStyle: 'dashed',
  },
  receiptAmount: {
    color: '#39B747',
    fontWeight: 'bold',
  },
  receiptTotal: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  transactionIdText: {
    color: '#39B747',
    fontSize: 11,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#E8F5E8',
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    marginLeft: 3,
    fontWeight: '600',
  },
  hoopayBrand: {
    backgroundColor: '#39B747',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    position: 'absolute',
    right: 0,
    elevation: Platform.OS === 'android' ? 1 : 0,
  },
  brandText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: Platform.OS === 'android' ? 0.2 : 0,
  },
  receiptFooter: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  receiptFooterText: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
    letterSpacing: Platform.OS === 'android' ? 0.2 : 0,
  },
  perforatedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  perforatedTop: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  perforatedBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  perforationDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },
  receiptSuccessContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  receiptSuccessTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#39B747',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
  },
  receiptSuccessMessage: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 8,
    gap: 12,
    width: '100%',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#39B747',
    borderRadius: 8,
    justifyContent: 'center',
    elevation: Platform.OS === 'android' ? 3 : 0,
    shadowColor: Platform.OS === 'ios' ? '#39B747' : 'transparent',
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0,
    shadowRadius: Platform.OS === 'ios' ? 4 : 0,
    minHeight: 48,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
    textAlign: 'center',
  },
  minimumInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  minimumInfoText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  cryptoNote: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  accountMinimum: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  cryptoBadge: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
});

export default WithdrawScreen; 