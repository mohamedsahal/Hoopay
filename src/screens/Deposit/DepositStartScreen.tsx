import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import kycService from '../../services/kycService';
import { Loading } from '../../components/Loading';

// Import wallet logos
const walletLogos = {
  sahal: require('../../../assets/wallet logo/Sahal.png'),
  premierBank: require('../../../assets/wallet logo/Premier Bank.png'),
  evc: require('../../../assets/wallet logo/Evc plus.png'),
  zaad: require('../../../assets/wallet logo/Zaad.png'),
  trc: require('../../../assets/wallet logo/trc.png'),
  usdc: require('../../../assets/wallet logo/USDC.png'),
  usdt: require('../../../assets/wallet logo/USDT.png'),
  usdtBep20: require('../../../assets/wallet logo/USDT Bep 20.png'),
  edahab: require('../../../assets/wallet logo/Edahab.jpg'),
  salaamBank: require('../../../assets/wallet logo/Salaam Bank.png')
};

interface Account {
  id: number;
  account_number: string;
  account_type: string;
  currency: string;
  wallet_type?: {
    id: number;
    name: string;
    account_category: string;
  };
  is_crypto: boolean;
  display_name: string;
}

interface DepositInfo {
  accounts: Account[];
  currency: string;
  minimum_deposit: number;
  minimum_deposit_crypto: number;
  maximum_deposit: number;
  wallet_balance: number;
  has_accounts: boolean;
}

const DepositStartScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [kycLimits, setKycLimits] = useState<any>(null);

  useEffect(() => {
    loadDepositAccounts();
    loadKycStatus();
  }, []);

  const loadDepositAccounts = async (): Promise<void> => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.get('/mobile/deposits/accounts');
      
      if (response.data.success) {
        const data = response.data.data;
        setAccounts(data.accounts || []);
        setDepositInfo(data);
        console.log('Deposit accounts loaded:', data.accounts?.length || 0);
      } else {
        setError('Failed to load deposit accounts');
      }
    } catch (err: any) {
      console.error('Error loading accounts:', err);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadKycStatus = async (): Promise<void> => {
    try {
      const kycResponse = await kycService.getKycStatus();
      if (kycResponse.success) {
        setKycStatus(kycResponse.data);
        
        const verificationLevel = kycResponse.data.verification_level || 'unverified';
        const verificationStatus = kycResponse.data.verification_status;
        
        if (verificationStatus === 'approved') {
          // For verified users, set unlimited limits
          setKycLimits({
            withdrawal_limit: -1, // Unlimited
            deposit_limit: -1,    // Unlimited
            transaction_limit: -1, // Unlimited
          });
        } else {
          setKycLimits(getUnverifiedLimits());
        }
      } else {
        setKycLimits(getUnverifiedLimits());
      }
    } catch (error) {
      console.error('Error loading KYC status:', error);
      setKycLimits(getUnverifiedLimits());
    }
  };

  const getUnverifiedLimits = () => ({
    withdrawal_limit: 5000.00,
    deposit_limit: 5000.00,
    transaction_limit: 5000.00,
  });

  const validateInput = (): boolean => {
    if (!selectedAccount) {
      setError('Please select a deposit method');
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    const depositAmount = parseFloat(amount);
    
    // Determine minimum based on account type
    const isCrypto = selectedAccount.is_crypto || 
                    selectedAccount.wallet_type?.account_category === 'crypto';
    const minimumAmount = isCrypto 
      ? (depositInfo?.minimum_deposit_crypto || 10)
      : (depositInfo?.minimum_deposit || 1);
    
    if (depositAmount < minimumAmount) {
      setError(`Minimum deposit amount is $${minimumAmount}${isCrypto ? ' for crypto' : ''}`);
      return false;
    }

    // Check deposit limit - skip for verified users with unlimited deposits
    const kycVerified = kycStatus?.verification_status === 'approved';
    const hasUnlimitedDeposits = kycVerified && kycLimits?.deposit_limit === -1;
    
    if (!hasUnlimitedDeposits && depositInfo?.maximum_deposit && depositAmount > depositInfo.maximum_deposit) {
      if (!kycVerified) {
        setError(`Unverified users can only deposit up to $${depositInfo.maximum_deposit.toFixed(2)}. Complete KYC verification for unlimited deposits.`);
        setTimeout(() => {
          Alert.alert(
            'Verification Required',
            `Complete KYC verification for unlimited deposits.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Verify Now', 
                onPress: () => (navigation as any).navigate('KycVerification')
              }
            ]
          );
        }, 100);
      } else {
        setError(`Your current verification level allows deposits up to $${depositInfo.maximum_deposit.toFixed(2)}. Upgrade your verification for unlimited deposits.`);
        setTimeout(() => {
          Alert.alert(
            'Limit Exceeded',
            `Upgrade your KYC verification for unlimited deposits.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Upgrade Verification', 
                onPress: () => (navigation as any).navigate('KycVerification')
              }
            ]
          );
        }, 100);
      }
      return false;
    }

    return true;
  };

  const handleContinue = async (): Promise<void> => {
    if (!validateInput()) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Get deposit instructions for the selected account
      const response = await api.post('/mobile/deposits/instructions', {
        account_id: selectedAccount!.id,
        amount: parseFloat(amount)
      });

      if (response.data.success) {
        const instructionsData = response.data.data;
        
        // Navigate to instructions screen
        (navigation as any).navigate('DepositInstructions', {
          accountId: selectedAccount!.id,
          amount: amount,
          accountData: selectedAccount,
          instructions: instructionsData.instructions,
          reference: instructionsData.reference,
          wallet_type: instructionsData.wallet_type,
        });
      } else {
        setError(response.data.message || 'Failed to get deposit instructions');
      }
    } catch (err: any) {
      console.error('Error getting instructions:', err);
      setError('Failed to prepare deposit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectAccount = (account: Account) => {
    setSelectedAccount(account);
    setShowAccountModal(false);
    setError('');
  };

  // Function to get appropriate wallet logo for account type
  const getWalletLogo = (account: Account) => {
    const accountType = account.wallet_type?.name?.toLowerCase() || account.account_type?.toLowerCase() || '';
    const category = account.wallet_type?.account_category?.toLowerCase() || '';
    
    // Somali Mobile Money providers
    if (accountType.includes('edahab') || accountType.includes('e-dahab')) {
      return walletLogos.edahab;
    }
    if (accountType.includes('evc') || accountType.includes('evc plus')) {
      return walletLogos.evc;
    }
    if (accountType.includes('zaad') || accountType.includes('zaad service')) {
      return walletLogos.zaad;
    }
    if (accountType.includes('sahal') || accountType.includes('sahal payment')) {
      return walletLogos.sahal;
    }
    
    // Banking
    if (accountType.includes('premier') || accountType.includes('premier bank')) {
      return walletLogos.premierBank;
    }
    if (accountType.includes('salaam') || accountType.includes('salaam bank')) {
      return walletLogos.salaamBank;
    }
    
    // Crypto currencies
    if (account.is_crypto || category.includes('crypto')) {
      if (accountType.includes('usdt') && accountType.includes('bep20')) {
        return walletLogos.usdtBep20;
      }
      if (accountType.includes('usdt') || accountType.includes('tether')) {
        return walletLogos.usdt;
      }
      if (accountType.includes('usdc')) {
        return walletLogos.usdc;
      }
      if (accountType.includes('trc') || accountType.includes('trx')) {
        return walletLogos.trc;
      }
      // Default crypto logo
      return walletLogos.usdt;
    }
    
    // Default for unknown types
    return walletLogos.premierBank;
  };

  // Function to get appropriate background color for account type
  const getAccountBgColor = (account: Account) => {
    const accountType = account.wallet_type?.name?.toLowerCase() || account.account_type?.toLowerCase() || '';
    const category = account.wallet_type?.account_category?.toLowerCase() || '';
    
    if (accountType.includes('edahab') || accountType.includes('e-dahab')) {
      return '#E8F5E8'; // Green
    }
    if (accountType.includes('evc') || accountType.includes('evc plus')) {
      return '#FFF2ED'; // Orange
    }
    if (accountType.includes('zaad') || accountType.includes('zaad service')) {
      return '#E3F2FD'; // Blue
    }
    if (accountType.includes('sahal') || accountType.includes('sahal payment')) {
      return '#F3E5F5'; // Purple
    }
    if (accountType.includes('premier') || accountType.includes('premier bank')) {
      return '#FFEBEE'; // Red
    }
    if (accountType.includes('salaam') || accountType.includes('salaam bank')) {
      return '#E1F5FE'; // Light blue
    }
    if (account.is_crypto || category.includes('crypto')) {
      return '#FFF8E1'; // Light yellow
    }
    
    return '#F5F7FA'; // Default light gray
  };

  const renderAccountItem = (account: Account, index: number) => {
    return (
      <TouchableOpacity
        key={account.id}
        style={[
          getStyles(theme).modalAccountItem,
          index === 0 && getStyles(theme).firstModalItem,
          index === accounts.length - 1 && getStyles(theme).lastModalItem
        ]}
        onPress={() => selectAccount(account)}
        activeOpacity={0.7}
      >
        <View style={getStyles(theme).modalAccountIcon}>
          <Image 
            source={getWalletLogo(account)} 
            style={getStyles(theme).modalAccountImage}
            resizeMode="contain"
          />
        </View>
        
        <View style={getStyles(theme).modalAccountInfo}>
          <Text style={getStyles(theme).modalAccountName}>{account.display_name}</Text>
          <Text style={getStyles(theme).modalAccountType}>
            {account.wallet_type?.name || account.account_type} • {account.currency || 'USD'}
          </Text>
        </View>
        
        <MaterialIcons name="keyboard-arrow-right" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={getStyles(theme).container}>
      {/* Header */}
      <View style={getStyles(theme).header}>
        <TouchableOpacity style={getStyles(theme).backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={getStyles(theme).headerTitle}>Deposit</Text>
        <View style={getStyles(theme).placeholder} />
      </View>

      {/* Progress Indicator */}
      <View style={getStyles(theme).progressContainer}>
        <View style={getStyles(theme).progressTrack}>
          <View style={[getStyles(theme).progressFill, { width: '25%' }]} />
        </View>
        <View style={getStyles(theme).progressLabels}>
          <Text style={getStyles(theme).progressLabelActive}>Details</Text>
          <Text style={getStyles(theme).progressLabel}>Instructions</Text>
          <Text style={getStyles(theme).progressLabel}>Verification</Text>
          <Text style={getStyles(theme).progressLabel}>Complete</Text>
        </View>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={getStyles(theme).content} showsVerticalScrollIndicator={false}>
        {/* Account Selection */}
        <View style={getStyles(theme).section}>
          <Text style={getStyles(theme).sectionTitle}>Select Deposit Method</Text>
          <TouchableOpacity
            style={[
              getStyles(theme).dropdownButton,
              selectedAccount && getStyles(theme).dropdownButtonSelected
            ]}
            onPress={() => setShowAccountModal(true)}
            activeOpacity={0.7}
          >
            <View style={getStyles(theme).dropdownContent}>
              {selectedAccount ? (
                <View style={getStyles(theme).selectedAccountContainer}>
                  <View style={getStyles(theme).accountIconContainer}>
                    <Image source={getWalletLogo(selectedAccount)} style={getStyles(theme).accountIcon} />
                  </View>
                  <View style={getStyles(theme).accountInfo}>
                    <Text style={getStyles(theme).accountName}>{selectedAccount.display_name}</Text>
                    <Text style={getStyles(theme).accountType}>
                      {selectedAccount.wallet_type?.account_category || selectedAccount.account_type}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={getStyles(theme).dropdownPlaceholder}>Choose deposit method</Text>
              )}
              <MaterialIcons name="keyboard-arrow-down" size={24} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={getStyles(theme).section}>
          <Text style={getStyles(theme).sectionTitle}>Amount</Text>
          <View style={getStyles(theme).amountContainer}>
            <Text style={getStyles(theme).currencySymbol}>$</Text>
            <TextInput
              style={getStyles(theme).amountInput}
              value={amount}
              onChangeText={(text) => {
                // Only allow numbers and one decimal point
                const filtered = text.replace(/[^0-9.]/g, '');
                const parts = filtered.split('.');
                if (parts.length <= 2) {
                  setAmount(filtered);
                  setError('');
                }
              }}
              placeholder="0.00"
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              maxLength={10}
            />
          </View>
          
          {depositInfo && kycLimits && (
            <View>
              <Text style={getStyles(theme).limitText}>
                Your Limit: ${depositInfo.minimum_deposit} - {kycLimits.deposit_limit === -1 ? 'Unlimited' : `$${depositInfo.maximum_deposit.toLocaleString()}`}
              </Text>
              {kycStatus?.verification_status === 'approved' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.success || '#4CAF50'} />
                  <Text style={[getStyles(theme).limitText, { color: theme.success || '#4CAF50', marginLeft: 4 }]}>
                    Verified - Unlimited deposits
                  </Text>
                </View>
              ) : (
                <TouchableOpacity onPress={() => (navigation as any).navigate('KycVerification')}>
                  <Text style={[getStyles(theme).limitText, { color: theme.warning, marginTop: 4 }]}>
                    {kycStatus?.verification_status === 'pending' ? 'Verification Pending' : 'Tap to verify for unlimited deposits'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Error Message */}
        {error ? (
          <View style={getStyles(theme).errorContainer}>
            <MaterialIcons name="error-outline" size={16} color={theme.error} />
            <Text style={getStyles(theme).errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Quick Amount Buttons */}
        <View style={getStyles(theme).section}>
          <Text style={getStyles(theme).sectionTitle}>Quick Amounts</Text>
          <View style={getStyles(theme).quickAmountsContainer}>
            {[50, 100, 200, 500].map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={getStyles(theme).quickAmountButton}
                onPress={() => {
                  setAmount(quickAmount.toString());
                  setError('');
                  Keyboard.dismiss(); // Dismiss keyboard when quick amount is selected
                }}
                activeOpacity={0.7}
              >
                <Text style={getStyles(theme).quickAmountText}>${quickAmount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Continue Button */}
      <View style={[getStyles(theme).footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[
            getStyles(theme).continueButton,
            (!selectedAccount || !amount || parseFloat(amount) <= 0 || accounts.length === 0) && getStyles(theme).continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedAccount || !amount || parseFloat(amount) <= 0 || isSubmitting || accounts.length === 0}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={getStyles(theme).continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Account Selection Modal */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={getStyles(theme).modalOverlay}>
          <View style={getStyles(theme).modalContainer}>
            {/* Modal Header */}
            <View style={getStyles(theme).modalHeader}>
              <Text style={getStyles(theme).modalTitle}>Select Deposit Method</Text>
              <TouchableOpacity
                style={getStyles(theme).modalCloseButton}
                onPress={() => setShowAccountModal(false)}
              >
                <MaterialIcons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView style={getStyles(theme).modalContent} showsVerticalScrollIndicator={false}>
              {accounts.length > 0 ? (
                accounts.map((account, index) => renderAccountItem(account, index))
              ) : (
                <View style={getStyles(theme).emptyState}>
                  <MaterialIcons name="account-balance" size={48} color={theme.textSecondary} />
                  <Text style={getStyles(theme).emptyStateText}>No deposit methods available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Loading 
        type="overlay"
        visible={isLoading} 
        message="Loading deposit methods..."
        size="large"
        variant="bounce"
        position="center"
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 2,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelActive: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
  },
  progressLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  dropdownButton: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dropdownButtonSelected: {
    borderColor: theme.primary,
    borderWidth: 2,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: theme.placeholder,
  },
  selectedAccountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  accountType: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    paddingVertical: 12,
  },
  limitText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.errorBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: theme.error,
    marginLeft: 8,
    flex: 1,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAmountButton: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: '22%',
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  footer: {
    padding: 20,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  continueButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: theme.primaryDisabled,
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    maxHeight: 400,
  },
  modalAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  firstModalItem: {
    borderTopWidth: 0,
  },
  lastModalItem: {
    borderBottomWidth: 0,
  },
  modalAccountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalAccountImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  modalAccountInfo: {
    flex: 1,
  },
  modalAccountName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  modalAccountType: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 12,
  },
  balanceCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  noAccountsMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.surface,
    borderRadius: 8,
    marginBottom: 16,
  },
  noAccountsText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 8,
  },
  selectedAccountImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

export default DepositStartScreen; 