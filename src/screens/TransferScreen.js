import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  Share,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import transferService from '../services/transferService';
import { Loading } from '../components/Loading';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';
import ThermalReceipt from '../components/ThermalReceipt';

// Simple Perforated Edge Component
const PerforatedEdge = ({ isTop = true }) => {
  const dots = [];
  const receiptWidth = Dimensions.get('window').width - 40;
  const numDots = Math.floor(receiptWidth / 20); // Dynamic based on screen width
  
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

const TransferScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { token, user, updateUser } = useAuth();
  
  // Use fallback colors and theme if context is not available
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in TransferScreen, using default colors');
    colors = Colors;
    isDarkMode = false;
  }
  
  const receiptRef = useRef();
  
  // Form states
  const [walletId, setWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [stage, setStage] = useState('form'); // 'form', 'confirm', 'success'
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [error, setError] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [transactionData, setTransactionData] = useState(null); // Store full transaction data

  // Function to refresh user balance (since AuthContext doesn't have refreshUserData)
  const refreshUserBalance = async () => {
    try {
      console.log('Refreshing user balance after transfer...');
      const response = await api.get('/auth/mobile/profile');
      
      if (response.data && response.data.success && response.data.data) {
        const freshUserData = response.data.data.user || response.data.data;
        console.log('User balance refreshed:', freshUserData.wallet?.available_balance);
        
        // Update the user data in AuthContext if we have the updateUser function
        if (updateUser && typeof updateUser === 'function') {
          await updateUser(freshUserData);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.log('Failed to refresh user balance:', error);
      return false;
    }
  };

  // Stage 1: Transfer Form
  const validateWalletId = async () => {
    if (!walletId || walletId.length !== 6 || !/^\d{6}$/.test(walletId)) {
      setError('Please enter a valid 6-digit wallet ID');
      return false;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    setIsLoading(true);
    setLoadingMessage('Looking up recipient...');
    setError(null);

    try {
      console.log('Looking up recipient with wallet ID:', walletId);
      const response = await api.get(`/mobile/users/wallet/${walletId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const recipientData = response.data.data;
        setRecipient(recipientData);
        console.log('Recipient found:', recipientData.name);
        
        setLoadingMessage('Recipient found! Preparing transfer...');
        
        setTimeout(() => {
          setStage('confirm');
          setIsLoading(false);
        }, 800); // Slightly longer delay for better UX
      } else {
        setError(response.data.message || 'Recipient not found');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error looking up recipient:', err);
      setError(err.response?.data?.message || 'Failed to find recipient');
      setIsLoading(false);
    }
  };

  // Stage 2: Confirm Transfer
  const executeTransfer = async () => {
    setIsSubmitting(true);
    setLoadingMessage('Processing transfer...');
    setError(null);

    try {
      console.log('Executing transfer to:', recipient.name);
      
      // Add a brief delay to show processing
      setLoadingMessage('Verifying account details...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setLoadingMessage('Processing payment...');
      const response = await api.post('/mobile/transactions/transfer', {
        recipient_wallet_id: walletId,
        amount: parseFloat(amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setTransactionId(response.data.data.transaction_id);
        setTransactionData(response.data.data);
        console.log('Transfer completed successfully');
        
        setLoadingMessage('Transfer completed! Updating balance...');
        
        // Refresh user data to update balance
        await refreshUserBalance();
        
        setLoadingMessage('Preparing receipt...');
        
        // Add delay for smooth transition like deposit and withdrawal
        setTimeout(() => {
          setStage('success');
          setIsSubmitting(false);
        }, 1000);
      } else {
        setError(response.data.message || 'Transfer failed');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err.response?.data?.message || 'Transfer failed');
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setWalletId('');
    setAmount('');
    setRecipient(null);
    setStage('form');
    setError(null);
    setTransactionId(null);
    setTransactionData(null);
    setIsLoading(false);
    setIsSubmitting(false);
  };

  // Navigate to home with balance refresh
  const navigateToHome = () => {
    // Refresh user data when going back to home
    refreshUserBalance();
    navigation.navigate('Home');
  };

  // Render Progress Indicator
  const renderProgressIndicator = () => {
    const stages = ['Details', 'Confirm', 'Complete'];
    const currentStageIndex = stage === 'form' ? 0 : stage === 'confirm' ? 1 : 2;
    
    return (
      <View style={[styles.progressContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${((currentStageIndex + 1) / stages.length) * 100}%` }]} />
        </View>
        <View style={styles.progressLabels}>
          {stages.map((stageName, index) => (
            <Text 
              key={stageName}
              style={[
                styles.progressLabel,
                { color: index <= currentStageIndex ? colors.primary : colors.textSecondary },
                index <= currentStageIndex && { fontWeight: '600' }
              ]}
            >
              {stageName}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  // Stage 1: Transfer Form
  const renderTransferForm = () => (
    <KeyboardAvoidingView 
      style={styles.stageContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.errorBackground, borderLeftColor: colors.error }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Transfer Details</Text>

          {/* Recipient Wallet ID */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Recipient Wallet ID</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border, 
                backgroundColor: colors.cardBackground,
                color: colors.text 
              }]}
              value={walletId}
              onChangeText={setWalletId}
              placeholder="Enter 6-digit wallet ID"
              keyboardType="numeric"
              maxLength={6}
              placeholderTextColor={colors.placeholder}
              returnKeyType="next"
              onSubmitEditing={() => {
                // Focus on amount input when done with wallet ID
                // Since we don't have a ref to the amount input, just dismiss keyboard
                if (walletId.length === 6) {
                  Keyboard.dismiss();
                }
              }}
              blurOnSubmit={false}
            />
          </View>

          {/* Amount */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
            <View style={[styles.inputContainer, { 
              borderColor: colors.border, 
              backgroundColor: colors.cardBackground 
            }]}>
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>$</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor={colors.placeholder}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>
          </View>
          
          {/* Add some bottom padding to ensure content doesn't get hidden behind footer */}
          <View style={styles.keyboardSpacer} />
        </ScrollView>
      </TouchableWithoutFeedback>

      <View style={[styles.footerCentered, { 
        backgroundColor: colors.background, 
        borderTopColor: colors.border 
      }]}>
        <TouchableOpacity
          style={[
            styles.continueButtonCentered,
            { backgroundColor: colors.primary },
            (!walletId || !amount || parseFloat(amount) <= 0 || isLoading) && { backgroundColor: colors.primaryDisabled }
          ]}
          onPress={validateWalletId}
          disabled={!walletId || !amount || parseFloat(amount) <= 0 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // Stage 2: Confirmation
  const renderConfirmation = () => (
    <KeyboardAvoidingView 
      style={styles.stageContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.errorBackground, borderLeftColor: colors.error }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Confirm Transfer</Text>

        <View style={[styles.confirmationCard, { 
          backgroundColor: colors.cardBackground, 
          borderColor: colors.border 
        }]}>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.textSecondary }]}>Recipient:</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>{recipient?.name}</Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.textSecondary }]}>Wallet ID:</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>{walletId}</Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.textSecondary }]}>Amount:</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>${parseFloat(amount).toFixed(2)}</Text>
          </View>
        </View>
        
        {/* Add some bottom padding to ensure content doesn't get hidden behind footer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { 
        backgroundColor: colors.background, 
        borderTopColor: colors.border 
      }]}>
        <TouchableOpacity
          style={[styles.secondaryButton, styles.buttonFlex, { borderColor: colors.border }]}
          onPress={() => setStage('form')}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.continueButton, 
            styles.buttonFlex, 
            { backgroundColor: colors.primary },
            isSubmitting && { backgroundColor: colors.primaryDisabled }
          ]}
          onPress={executeTransfer}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Confirm Transfer</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // Share receipt functionality - capture as image
  const shareReceipt = async () => {
    try {
      setIsCapturing(true);
      
      // Capture the receipt view as image
      const uri = await receiptRef.current.capture();
      console.log('Receipt captured:', uri);
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Use Expo Sharing for better cross-platform support
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Transfer Receipt',
          UTI: 'public.jpeg'
        });
      } else {
        // Fallback to React Native's built-in Share API
        if (Platform.OS === 'ios') {
          await Share.share({
            url: uri,
            message: 'Transfer Receipt from Hoopay Wallet',
            title: 'Transfer Receipt',
          });
        } else {
          // For Android, try the built-in share with both message and url
          await Share.share({
            message: 'Transfer Receipt from Hoopay Wallet',
            title: 'Transfer Receipt',
            url: uri,
          });
        }
      }
      
    } catch (error) {
      console.error('Error capturing/sharing receipt:', error);
      
      // Check if user cancelled sharing (common error message patterns)
      const errorMessage = error.message || '';
      if (errorMessage.includes('User did not share') || 
          errorMessage.includes('cancelled') || 
          errorMessage.includes('dismiss')) {
        console.log('User cancelled sharing');
        return;
      }
      
      // Enhanced fallback to text sharing if image capture fails
      try {
        const receiptText = `
🧾 TRANSFER RECEIPT 🧾

✅ Transfer Successful!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 From: ${user?.name || 'Unknown'}
📥 To: ${recipient?.name || 'Unknown'}
💰 Amount: $${parseFloat(amount).toFixed(2)}
📋 Transaction ID: ${transactionData?.transaction?.transaction_id || transactionId}
📅 Date: ${new Date().toLocaleDateString()}
⏰ Time: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💙 Powered by Hoopay Wallet
        `.trim();

        await Share.share({
          message: receiptText,
          title: 'Transfer Receipt',
        });
      } catch (fallbackError) {
        console.error('Fallback sharing also failed:', fallbackError);
        // Don't show error if user just cancelled
        const fallbackErrorMessage = fallbackError.message || '';
        if (!fallbackErrorMessage.includes('User did not share') && 
            !fallbackErrorMessage.includes('cancelled') &&
            !fallbackErrorMessage.includes('dismiss')) {
          Alert.alert('Error', 'Failed to share receipt. Please try again.');
        }
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Stage 3: Success with Enhanced Receipt
  const renderSuccess = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
      {/* Success Message */}
      <View style={styles.successHeader}>
        <MaterialIcons name="check-circle" size={64} color={colors.success} />
        <Text style={[styles.successTitle, { color: colors.text }]}>Transfer Successful!</Text>
        <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
          Your transfer has been completed successfully. Your receipt is ready below.
                </Text>
              </View>

      {/* Enhanced Receipt Card for Image Capture */}
      <ViewShot ref={receiptRef} options={{ format: "jpg", quality: 0.9 }}>
        <ThermalReceipt
          transactionType="transfer"
          transactionId={transactionData?.transaction?.transaction_id || transactionId}
          amount={amount}
          status="success"
          senderInfo={{
            name: user?.name || 'You'
          }}
          recipientInfo={{
            name: recipient?.name,
            account: walletId
          }}
          feeAmount={0}
          netAmount={amount}
        />
      </ViewShot>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.shareButton, styles.buttonFlex, { backgroundColor: colors.primary }]}
          onPress={shareReceipt}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator size={20} color="#FFFFFF" />
          ) : (
            <MaterialIcons name="share" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.shareButtonText}>
            {isCapturing ? 'Preparing...' : 'Share Receipt'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.homeButton, styles.buttonFlex, { borderColor: colors.border }]}
          onPress={navigateToHome}
        >
          <MaterialIcons name="home" size={20} color={colors.primary} />
          <Text style={[styles.homeButtonText, { color: colors.primary }]}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? insets.top : insets.top }]}>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor={colors.background}
        translucent={false}
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Transfer Money</Text>
        <View style={styles.placeholderRight} />
      </View>

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Stage Content */}
      {stage === 'form' && renderTransferForm()}
      {stage === 'confirm' && renderConfirmation()}
      {stage === 'success' && renderSuccess()}

      <Loading 
        type="overlay"
        visible={isLoading || isSubmitting}
        message={loadingMessage}
        size="large"
        variant="grow"
        position="center"
        useBlur={true}
      />

      <Loading 
        type="overlay"
        visible={isCapturing}
        message="Preparing receipt image..."
        size="medium"
        variant="wave"
        position="center"
        useBlur={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: Platform.OS === 'android' ? 16 : 0, // Extra bottom padding for Android
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 16 : 12, // Extra top padding for Android
    borderBottomWidth: 1,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 1 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 2 : 0,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.05)' : 'transparent',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    letterSpacing: Platform.OS === 'android' ? 0.5 : 0,
  },
  placeholderRight: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 16 : 12, // Extra padding for Android
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: Platform.OS === 'android' ? '500' : '400',
  },
  stageContainer: {
    flex: 1,
    position: 'relative',
    paddingBottom: Platform.OS === 'android' ? 20 : 0, // Extra padding for Android navigation area
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingHorizontal: Platform.OS === 'android' ? 16 : 12, // Extra horizontal padding for Android
    paddingBottom: Platform.OS === 'android' ? 120 : 20, // Extra padding for Android to avoid footer overlap
  },
  keyboardSpacer: {
    height: Platform.OS === 'android' ? 40 : 30, // Extra space for keyboard on both platforms
  },
  bottomSpacer: {
    height: Platform.OS === 'android' ? 30 : 0, // Increased spacer for Android
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    marginBottom: 16,
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
  },
  errorContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
  },
  errorText: {
    fontSize: 14,
    fontWeight: Platform.OS === 'android' ? '500' : '400',
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: Platform.OS === 'android' ? '500' : '400',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    elevation: Platform.OS === 'android' ? 1 : 0,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 1 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0,
    shadowRadius: Platform.OS === 'ios' ? 2 : 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    elevation: Platform.OS === 'android' ? 1 : 0,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 1 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0,
    shadowRadius: Platform.OS === 'ios' ? 2 : 0,
  },
  currencySymbol: {
    fontSize: 16,
    paddingLeft: 12,
    fontWeight: Platform.OS === 'android' ? '500' : '400',
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  confirmationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0,
    shadowRadius: Platform.OS === 'ios' ? 4 : 0,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  confirmationLabel: {
    fontSize: 16,
    fontWeight: Platform.OS === 'android' ? '500' : '400',
  },
  confirmationValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
  },
  successMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    fontWeight: Platform.OS === 'android' ? '400' : '300',
  },
  transactionIdContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  transactionIdLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 16 : 0, // Lift footer up on Android
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 24 : 16, // Extra padding for Android
    paddingHorizontal: Platform.OS === 'android' ? 20 : 16, // Extra horizontal padding for Android
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Platform.OS === 'ios' ? 12 : 12,
    elevation: Platform.OS === 'android' ? 8 : 0, // Higher elevation for Android
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: -2 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 4 : 0,
    minHeight: Platform.OS === 'android' ? 88 : 64, // Increased minimum height on Android
    marginHorizontal: Platform.OS === 'android' ? 8 : 0, // Margin from screen edges on Android
    borderRadius: Platform.OS === 'android' ? 8 : 0, // Rounded corners on Android
  },
  buttonFlex: {
    flex: 1,
    maxWidth: Platform.OS === 'ios' ? '48%' : 'auto', // Ensure buttons don't exceed container width on iOS
  },
  continueButton: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0,
    shadowRadius: Platform.OS === 'ios' ? 4 : 0,
    minHeight: 48, // Ensure consistent button height
  },
  disabledButton: {
    backgroundColor: Colors.primaryDisabled,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // Ensure consistent button height
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
    textAlign: 'center',
  },
  receiptImageContainer: {
    backgroundColor: '#FFFFFF', // Ensure white background for image capture
    padding: 8,
    marginHorizontal: 8,
    marginVertical: 12,
    borderRadius: 0, // Remove rounded corners for receipt look
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptCard: {
    backgroundColor: '#FEFEFE', // Slightly off-white like thermal paper
    width: Dimensions.get('window').width - 40, // Use most of screen width
    maxWidth: 400, // Maximum width for larger screens
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
    marginVertical: 6,
    borderStyle: 'dashed',
    borderBottomWidth: 1,
  },
  receiptAmount: {
    fontWeight: 'bold',
  },
  receiptTotal: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  transactionIdText: {
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
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
    letterSpacing: Platform.OS === 'android' ? 0.2 : 0,
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
    borderRadius: 8,
    justifyContent: 'center',
    elevation: Platform.OS === 'android' ? 3 : 0,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0,
    shadowRadius: Platform.OS === 'ios' ? 4 : 0,
    minHeight: 48, // Ensure consistent button height
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
    textAlign: 'center',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    elevation: Platform.OS === 'android' ? 1 : 0,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 1 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 2 : 0,
    minHeight: 48, // Ensure consistent button height
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
    textAlign: 'center',
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  footerCentered: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 16 : 0, // Lift footer up on Android
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 24 : 16, // Extra padding for Android
    paddingHorizontal: Platform.OS === 'android' ? 20 : 16, // Extra horizontal padding for Android
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: Platform.OS === 'android' ? 8 : 0,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: -2 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 4 : 0,
    minHeight: Platform.OS === 'android' ? 88 : 64, // Increased minimum height on Android
    marginHorizontal: Platform.OS === 'android' ? 8 : 0, // Margin from screen edges on Android
    borderRadius: Platform.OS === 'android' ? 8 : 0, // Rounded corners on Android
  },
  continueButtonCentered: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0,
    shadowRadius: Platform.OS === 'ios' ? 4 : 0,
    minHeight: 48,
    minWidth: 140,
    maxWidth: 200,
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
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
  },
  receiptSuccessMessage: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
  },
});

export default TransferScreen; 