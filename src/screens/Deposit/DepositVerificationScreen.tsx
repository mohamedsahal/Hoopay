import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

interface RouteParams {
  accountId: number;
  amount: string;
  reference: string;
  paymentMethod?: string;
  ussdCode?: string;
  wallet_type?: {
    id: number;
    name: string;
    account_category: string;
    payment_instructions?: string;
    ussd_code?: string;
    bank_name?: string;
    account_number?: string;
    beneficiary_name?: string;
    wallet_address?: string;
    network?: string;
  };
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  reference: string;
  created_at: string;
}

type VerificationStatus = 'verifying' | 'completed' | 'failed' | 'rejected' | 'timeout';

const DepositVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { updateUser } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { accountId, amount, reference, wallet_type, paymentMethod, ussdCode } = route.params as RouteParams;
  
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verifying');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [error, setError] = useState<string>('');
  const [isPolling, setIsPolling] = useState(true);

  // Initialize verification on screen load
  useEffect(() => {
    initializeVerification();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Polling for verification status
  useEffect(() => {
    if (!isPolling || !transaction) return;

    const pollInterval = setInterval(() => {
      checkVerificationStatus();
    }, 3000); // Check every 3 seconds

    return () => clearInterval(pollInterval);
  }, [isPolling, transaction]);

  const initializeVerification = async (): Promise<void> => {
    try {
      // Create the deposit transaction immediately
      const response = await api.post('/mobile/deposits/verify', {
        account_id: accountId,
        amount: parseFloat(amount),
        reference: reference,
        transaction_ref: 'AUTO_' + reference,
      });

      if (response.data.success && response.data.data?.transaction) {
        setTransaction(response.data.data.transaction);
        setVerificationStatus('verifying');
        // Start polling for status updates
        setIsPolling(true);
      } else {
        throw new Error(response.data.message || 'Failed to initialize verification');
      }
    } catch (err: any) {
      console.error('Error initializing verification:', err);
      setError(err.response?.data?.message || 'Failed to start verification process');
      setVerificationStatus('failed');
      setIsPolling(false);
    }
  };

  const checkVerificationStatus = async (): Promise<void> => {
    if (!transaction) return;

    try {
      // Check transaction status from backend
      const response = await api.get(`/mobile/transactions/${transaction.id}/status`);
      
      if (response.data.success) {
        const status = response.data.data.status;
        
        if (status === 'completed') {
          setVerificationStatus('completed');
          setIsPolling(false);
          await refreshUserBalance();
        } else if (status === 'failed' || status === 'cancelled') {
          setVerificationStatus('failed');
          setIsPolling(false);
          setError('Payment verification failed. Please contact support.');
        } else if (status === 'rejected') {
          setVerificationStatus('rejected');
          setIsPolling(false);
          setError('Your deposit has been rejected by our verification team. Please contact support for more information or try a different payment method.');
        }
        // If still pending, continue polling
      }
    } catch (err: any) {
      console.error('Error checking verification status:', err);
      // Don't stop polling on network errors, just log them
    }
  };

  const handleTimeout = (): void => {
    setVerificationStatus('timeout');
    setIsPolling(false);
    setError('Verification timeout. Our support team will verify your payment within 24 hours.');
  };

  const refreshUserBalance = async (): Promise<void> => {
    try {
      const response = await api.get('/auth/mobile/profile');
      if (response.data.success && response.data.data?.user) {
        const freshUserData = response.data.data.user;
        console.log('User balance refreshed:', freshUserData.wallet?.available_balance);
        
        if (updateUser) {
          updateUser(freshUserData);
        }
      }
    } catch (err) {
      console.error('Error refreshing user balance:', err);
    }
  };

  const handleContinue = (): void => {
    (navigation as any).navigate('DepositComplete', {
      amount: amount,
      transactionRef: transaction?.id || reference,
      status: verificationStatus,
      wallet_type: wallet_type,
    });
  };

  const handleRetry = (): void => {
    setVerificationStatus('verifying');
    setError('');
    setTimeLeft(180);
    setIsPolling(true);
    initializeVerification();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openWhatsAppSupport = async () => {
    try {
      const phoneNumber = '+252904555253';
      const message = encodeURIComponent(
        `Hello! I need help with my deposit transaction.\n\nTransaction Details:\n- Amount: $${amount}\n- Reference: ${reference}\n- Transaction ID: ${transaction?.id || 'N/A'}\n- Status: ${verificationStatus}\n\nPlease assist me with this issue.`
      );
      
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${message}`;
      const whatsappWebUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${message}`;
      
      // Try to open WhatsApp app first
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to WhatsApp Web
        await Linking.openURL(whatsappWebUrl);
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      // Fallback to showing alert with contact info
      Alert.alert(
        'Contact Support',
        'Please contact our support team:\n\nEmail: support@hoopaywallet.com\nWhatsApp: +252904555253',
        [{ text: 'OK' }]
      );
    }
  };

  const renderVerificationContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <View style={getStyles(theme).verificationContainer}>
            <View style={getStyles(theme).spinnerContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
            <Text style={getStyles(theme).verificationTitle}>Verifying Your Payment</Text>
            <Text style={getStyles(theme).verificationSubtitle}>
              {paymentMethod === 'ussd' 
                ? `We're verifying your mobile money payment via ${wallet_type?.name}. This usually happens instantly but may take a few moments.`
                : 'Please wait while we verify your payment. This usually takes a few moments but may take longer depending on your payment method.'
              }
            </Text>
            
            {/* USSD Payment Details */}
            {paymentMethod === 'ussd' && ussdCode && (
              <View style={getStyles(theme).ussdDetailsCard}>
                <View style={getStyles(theme).ussdHeader}>
                  <MaterialIcons name="phone" size={20} color={theme.primary} />
                  <Text style={getStyles(theme).ussdHeaderText}>USSD Payment Details</Text>
                </View>
                <View style={getStyles(theme).ussdDetail}>
                  <Text style={getStyles(theme).ussdDetailLabel}>Dialed Code:</Text>
                  <Text style={getStyles(theme).ussdDetailValue}>{ussdCode}</Text>
                </View>
                <View style={getStyles(theme).ussdDetail}>
                  <Text style={getStyles(theme).ussdDetailLabel}>Provider:</Text>
                  <Text style={getStyles(theme).ussdDetailValue}>{wallet_type?.name}</Text>
                </View>
                <View style={getStyles(theme).ussdDetail}>
                  <Text style={getStyles(theme).ussdDetailLabel}>Amount:</Text>
                  <Text style={getStyles(theme).ussdDetailValue}>${amount}</Text>
                </View>
                <Text style={getStyles(theme).ussdNote}>
                  ✓ USSD code dialed successfully. We're now checking for payment confirmation from your mobile provider.
                </Text>
              </View>
            )}
            
            {/* Progress Bar */}
            <View style={getStyles(theme).progressBarContainer}>
              <View style={getStyles(theme).progressBar}>
                <View style={[getStyles(theme).progressBarFill, { width: `${((180 - timeLeft) / 180) * 100}%` }]} />
              </View>
            </View>
            
            {/* Countdown Timer */}
            <Text style={getStyles(theme).timerText}>
              Estimated time remaining: <Text style={getStyles(theme).timerValue}>{formatTime(timeLeft)}</Text>
            </Text>
          </View>
        );

      case 'completed':
        return (
          <View style={getStyles(theme).verificationContainer}>
            <View style={getStyles(theme).successIconContainer}>
              <MaterialIcons name="check-circle" size={64} color={theme.success} />
            </View>
            <Text style={getStyles(theme).successTitle}>Deposit Successful!</Text>
            <Text style={getStyles(theme).successSubtitle}>
              Your deposit of <Text style={getStyles(theme).amountHighlight}>${amount}</Text> has been successfully processed and credited to your account.
            </Text>
            
            {transaction && (
              <View style={getStyles(theme).transactionDetails}>
                <View style={getStyles(theme).detailRow}>
                  <Text style={getStyles(theme).detailLabel}>Transaction ID:</Text>
                  <Text style={getStyles(theme).detailValue}>{transaction.id}</Text>
                </View>
                <View style={getStyles(theme).detailRow}>
                  <Text style={getStyles(theme).detailLabel}>Date:</Text>
                  <Text style={getStyles(theme).detailValue}>{transaction.created_at}</Text>
                </View>
                <View style={getStyles(theme).detailRow}>
                  <Text style={getStyles(theme).detailLabel}>Status:</Text>
                  <Text style={getStyles(theme).statusCompleted}>Completed</Text>
                </View>
              </View>
            )}
          </View>
        );

      case 'rejected':
        return (
          <View style={getStyles(theme).verificationContainer}>
            <View style={getStyles(theme).rejectedIconContainer}>
              <MaterialIcons name="cancel" size={64} color={theme.error} />
            </View>
            <Text style={getStyles(theme).rejectedTitle}>Deposit Rejected</Text>
            <Text style={getStyles(theme).rejectedSubtitle}>
              Your deposit of <Text style={getStyles(theme).amountHighlight}>${amount}</Text> has been rejected by our verification team.
            </Text>
            
            <View style={getStyles(theme).rejectedNotice}>
              <Text style={getStyles(theme).rejectedNoticeTitle}>Why was my deposit rejected?</Text>
              <Text style={getStyles(theme).rejectedNoticeText}>
                • Payment details didn't match our records{'\n'}
                • Insufficient payment proof or documentation{'\n'}
                • Payment was from an unauthorized source{'\n'}
                • Technical issues with the payment method
              </Text>
            </View>

            <View style={getStyles(theme).rejectedActions}>
              <Text style={getStyles(theme).rejectedActionTitle}>What can you do?</Text>
              <Text style={getStyles(theme).rejectedActionText}>
                1. Double-check your payment details and try again{'\n'}
                2. Use a different payment method{'\n'}
                3. Contact our support team for assistance
              </Text>
            </View>
            
            {transaction && (
              <View style={getStyles(theme).transactionDetails}>
                <View style={getStyles(theme).detailRow}>
                  <Text style={getStyles(theme).detailLabel}>Transaction ID:</Text>
                  <Text style={getStyles(theme).detailValue}>{transaction.id}</Text>
                </View>
                <View style={getStyles(theme).detailRow}>
                  <Text style={getStyles(theme).detailLabel}>Date:</Text>
                  <Text style={getStyles(theme).detailValue}>{transaction.created_at}</Text>
                </View>
                <View style={getStyles(theme).detailRow}>
                  <Text style={getStyles(theme).detailLabel}>Status:</Text>
                  <Text style={getStyles(theme).statusRejected}>Rejected</Text>
                </View>
              </View>
            )}
          </View>
        );

      case 'failed':
      case 'timeout':
        return (
          <View style={getStyles(theme).verificationContainer}>
            <View style={getStyles(theme).errorIconContainer}>
              <MaterialIcons name="error-outline" size={64} color={theme.error} />
            </View>
            <Text style={getStyles(theme).errorTitle}>
              {verificationStatus === 'timeout' ? 'Verification Time Expired' : 'Payment Verification Failed'}
            </Text>
            <Text style={getStyles(theme).errorSubtitle}>
              {error || 'We were unable to verify your payment. Please try again or contact support.'}
            </Text>
            
            {verificationStatus === 'timeout' && (
              <View style={getStyles(theme).timeoutNotice}>
                <Text style={getStyles(theme).timeoutTitle}>Verification Time Expired</Text>
                <Text style={getStyles(theme).timeoutText}>
                  Your transaction has timed out after waiting for 3 minutes. 
                  Please contact our support team at support@hoopaywallet.com or WhatsApp: +252904555253.
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={getStyles(theme).container}>
      {/* Header */}
      <View style={getStyles(theme).header}>
        <TouchableOpacity style={getStyles(theme).backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={getStyles(theme).headerTitle}>Verify Payment</Text>
        <View style={getStyles(theme).placeholder} />
      </View>

      {/* Progress Indicator */}
      <View style={getStyles(theme).progressContainer}>
        <View style={getStyles(theme).progressTrack}>
          <View style={[getStyles(theme).progressFill, { width: '75%' }]} />
        </View>
        <View style={getStyles(theme).progressLabels}>
          <Text style={getStyles(theme).progressLabelComplete}>Details</Text>
          <Text style={getStyles(theme).progressLabelComplete}>Instructions</Text>
          <Text style={getStyles(theme).progressLabelActive}>Verification</Text>
          <Text style={getStyles(theme).progressLabel}>Complete</Text>
        </View>
      </View>

      <ScrollView style={getStyles(theme).content} showsVerticalScrollIndicator={false}>
        {/* Amount Card */}
        <View style={getStyles(theme).amountCard}>
          <LinearGradient
            colors={[theme.gradientStart, theme.gradientEnd]}
            style={getStyles(theme).amountGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View>
              <Text style={getStyles(theme).amountLabel}>Verifying Payment of</Text>
              <Text style={getStyles(theme).amountValue}>${amount}</Text>
            </View>
            <MaterialIcons name="hourglass-empty" size={32} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Verification Status */}
        {renderVerificationContent()}
      </ScrollView>

      {/* Footer */}
      <View style={[getStyles(theme).footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {verificationStatus === 'completed' && (
          <TouchableOpacity
            style={getStyles(theme).continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={getStyles(theme).continueButtonText}>Continue</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        {verificationStatus === 'rejected' && (
          <View style={getStyles(theme).buttonRow}>
            <TouchableOpacity
              style={getStyles(theme).tryAgainButton}
              onPress={() => navigation.navigate('DepositStart' as never)}
              activeOpacity={0.8}
            >
              <Text style={getStyles(theme).tryAgainButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={getStyles(theme).contactSupportButton}
              onPress={openWhatsAppSupport}
              activeOpacity={0.8}
            >
              <Text style={getStyles(theme).contactSupportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {(verificationStatus === 'failed' || verificationStatus === 'timeout') && (
          <View style={getStyles(theme).buttonRow}>
            <TouchableOpacity
              style={getStyles(theme).retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <Text style={getStyles(theme).retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={getStyles(theme).contactSupportButton}
              onPress={openWhatsAppSupport}
              activeOpacity={0.8}
            >
              <Text style={getStyles(theme).contactSupportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    textAlign: 'center',
    flex: 1,
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
  progressLabelComplete: {
    fontSize: 12,
    color: theme.success,
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
  amountCard: {
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  amountGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  verificationContainer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  spinnerContainer: {
    marginBottom: 24,
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 4,
  },
  timerText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  timerValue: {
    fontWeight: '600',
    color: theme.text,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.success,
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  amountHighlight: {
    fontWeight: '600',
    color: theme.success,
  },
  transactionDetails: {
    width: '100%',
    backgroundColor: theme.successBackground,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.success,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  statusCompleted: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.success,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  timeoutNotice: {
    backgroundColor: theme.warningBackground,
    borderLeftWidth: 4,
    borderLeftColor: theme.warning,
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  timeoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.warning,
    marginBottom: 8,
  },
  timeoutText: {
    fontSize: 14,
    color: theme.warning,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  backToInstructionsButton: {
    backgroundColor: theme.textSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backToInstructionsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactSupportButton: {
    flex: 1,
    backgroundColor: theme.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  contactSupportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rejectedIconContainer: {
    marginBottom: 24,
  },
  rejectedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  rejectedSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  rejectedNotice: {
    backgroundColor: theme.warningBackground,
    borderLeftWidth: 4,
    borderLeftColor: theme.warning,
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  rejectedNoticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.warning,
    marginBottom: 8,
  },
  rejectedNoticeText: {
    fontSize: 14,
    color: theme.warning,
    lineHeight: 20,
  },
  rejectedActions: {
    marginBottom: 24,
  },
  rejectedActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  rejectedActionText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  statusRejected: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.error,
  },
  tryAgainButton: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // USSD-specific styles
  ussdDetailsCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  ussdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ussdHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  ussdDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  ussdDetailLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  ussdDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  ussdNote: {
    fontSize: 12,
    color: theme.success,
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default DepositVerificationScreen; 