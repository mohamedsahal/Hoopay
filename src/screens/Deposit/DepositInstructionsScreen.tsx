import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Clipboard,
  Alert,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';

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

interface WalletType {
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
}

interface RouteParams {
  accountId: number;
  amount: string;
  accountData: {
    display_name: string;
    wallet_type?: {
      name: string;
      account_category: string;
    };
  };
  instructions: string;
  reference: string;
  wallet_type?: WalletType;
}

const DepositInstructionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { accountId, amount, accountData, instructions, reference, wallet_type } = route.params as RouteParams;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await Clipboard.setString(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  // Helper function to format USSD code for display
  const formatUssdCodeForDisplay = (ussdCode: string) => {
    let formattedCode = ussdCode;
    
    // Replace various amount placeholder formats
    formattedCode = formattedCode.replace(/\{amount\}/g, amount);
    formattedCode = formattedCode.replace(/\*amount\*/g, `*${amount}*`);
    formattedCode = formattedCode.replace(/\*amount#/g, `*${amount}#`);
    formattedCode = formattedCode.replace(/amount/g, amount);
    
    return formattedCode;
  };

  // Function to get wallet logo similar to deposit start screen
  const getWalletLogo = () => {
    const accountType = wallet_type?.name?.toLowerCase() || '';
    
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
    if (accountType.includes('premier') || accountType.includes('premier bank')) {
      return walletLogos.premierBank;
    }
    if (accountType.includes('salaam') || accountType.includes('salaam bank')) {
      return walletLogos.salaamBank;
    }
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
    
    return walletLogos.premierBank; // Default
  };

  const renderPaymentDetails = () => {
    if (!wallet_type) {
      return (
        <View style={getStyles(theme).paymentDetails}>
          <Text style={getStyles(theme).instructionsText}>{instructions}</Text>
        </View>
      );
    }

    const category = wallet_type.account_category;

    if (category === 'crypto') {
      return (
        <View style={getStyles(theme).paymentDetails}>
          <View style={getStyles(theme).cryptoContainer}>
            {/* Wallet Address Header */}
            <View style={getStyles(theme).walletAddressHeader}>
              <Text style={getStyles(theme).walletAddressTitle}>Send to Wallet Address</Text>
              <Text style={getStyles(theme).walletAddressSubtitle}>
                Scan QR code or copy address to send your deposit
              </Text>
            </View>

            {/* QR Code Section */}
            <View style={getStyles(theme).qrCodeContainer}>
              <View style={getStyles(theme).qrCodeWrapper}>
                <QRCode
                  value={wallet_type.wallet_address || 'Address not available'}
                  size={160}
                  color="#2C3E50"
                  backgroundColor="#FFFFFF"
                  logoSize={40}
                  logoBackgroundColor="#FFFFFF"
                />
              </View>
              
              {/* Network Badge */}
              {wallet_type.network && (
                <View style={getStyles(theme).networkBadge}>
                  <Text style={getStyles(theme).networkBadgeText}>{wallet_type.network}</Text>
                </View>
              )}
            </View>

            {/* Wallet Address Display */}
            <View style={getStyles(theme).walletAddressCard}>
              <Text style={getStyles(theme).walletAddressLabel}>Wallet Address</Text>
              <TouchableOpacity 
                style={getStyles(theme).walletAddressContainer}
                onPress={() => copyToClipboard(wallet_type.wallet_address || '', 'Wallet Address')}
                activeOpacity={0.7}
              >
                <Text style={getStyles(theme).walletAddressText} numberOfLines={3}>
                  {wallet_type.wallet_address || 'Contact support for address'}
                </Text>
                <View style={getStyles(theme).copyButton}>
                  <MaterialIcons name="content-copy" size={20} color="#39B747" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Transaction Details */}
            <View style={getStyles(theme).transactionDetailsCard}>
              <Text style={getStyles(theme).transactionDetailsTitle}>Transaction Details</Text>
              
              {/* Amount */}
              <View style={getStyles(theme).detailRow}>
                <Text style={getStyles(theme).detailLabel}>Amount:</Text>
                <Text style={getStyles(theme).detailValueHighlight}>${amount}</Text>
              </View>
              
              {/* Network */}
              {wallet_type.network && (
                <View style={getStyles(theme).detailRow}>
                  <Text style={getStyles(theme).detailLabel}>Network:</Text>
                  <Text style={getStyles(theme).detailValue}>{wallet_type.network}</Text>
                </View>
              )}
              
              {/* Deposit ID */}
              <View style={getStyles(theme).detailRow}>
                <Text style={getStyles(theme).detailLabel}>Deposit ID:</Text>
                <TouchableOpacity 
                  style={getStyles(theme).copyableValue}
                  onPress={() => copyToClipboard(reference, 'Deposit ID')}
                >
                  <Text style={getStyles(theme).detailValue}>{reference}</Text>
                  <MaterialIcons name="content-copy" size={16} color="#39B747" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Crypto Instructions */}
          {wallet_type.payment_instructions && (
            <View style={getStyles(theme).instructionsCard}>
              <Text style={getStyles(theme).instructionsTitle}>Deposit Instructions</Text>
              <Text style={getStyles(theme).instructionsText}>{wallet_type.payment_instructions}</Text>
            </View>
          )}
        </View>
      );
    }

    if (category === 'bank') {
      return (
        <View style={getStyles(theme).paymentDetails}>
          <View style={getStyles(theme).bankContainer}>
            {/* Bank Details */}
            <View style={getStyles(theme).detailRow}>
              <Text style={getStyles(theme).detailLabel}>Bank Name:</Text>
              <Text style={getStyles(theme).detailValue}>{wallet_type.bank_name || 'Hoopay Financial Inc'}</Text>
            </View>
            
            <View style={getStyles(theme).detailRow}>
              <Text style={getStyles(theme).detailLabel}>Account Number:</Text>
              <TouchableOpacity 
                style={getStyles(theme).copyableValue}
                onPress={() => copyToClipboard(wallet_type.account_number || '', 'Account Number')}
              >
                <Text style={getStyles(theme).detailValue}>{wallet_type.account_number || '8349572106'}</Text>
                <MaterialIcons name="content-copy" size={16} color="#39B747" />
              </TouchableOpacity>
            </View>
            
            <View style={getStyles(theme).detailRow}>
              <Text style={getStyles(theme).detailLabel}>Beneficiary Name:</Text>
              <Text style={getStyles(theme).detailValue}>{wallet_type.beneficiary_name || 'Hoopay Financial'}</Text>
            </View>
            
            <View style={getStyles(theme).detailRow}>
              <Text style={getStyles(theme).detailLabel}>Amount:</Text>
              <Text style={getStyles(theme).detailValueHighlight}>${amount}</Text>
            </View>
            
            <View style={getStyles(theme).detailRow}>
              <Text style={getStyles(theme).detailLabel}>Reference:</Text>
              <TouchableOpacity 
                style={getStyles(theme).copyableValue}
                onPress={() => copyToClipboard(reference, 'Reference')}
              >
                <Text style={getStyles(theme).detailValue}>{reference}</Text>
                <MaterialIcons name="content-copy" size={16} color="#39B747" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Bank Instructions */}
          {wallet_type.payment_instructions && (
            <View style={getStyles(theme).instructionsCard}>
              <Text style={getStyles(theme).instructionsTitle}>Banking Instructions</Text>
              <Text style={getStyles(theme).instructionsText}>{wallet_type.payment_instructions}</Text>
            </View>
          )}
        </View>
      );
    }

    // Fiat/Mobile Money
    return (
      <View style={getStyles(theme).paymentDetails}>
        <View style={getStyles(theme).fiatContainer}>
          {/* Provider */}
          <View style={getStyles(theme).detailRow}>
            <Text style={getStyles(theme).detailLabel}>Provider:</Text>
            <Text style={getStyles(theme).detailValue}>{wallet_type.name}</Text>
          </View>
          
          {/* Amount */}
          <View style={getStyles(theme).detailRow}>
            <Text style={getStyles(theme).detailLabel}>Amount:</Text>
            <Text style={getStyles(theme).detailValueHighlight}>${amount}</Text>
          </View>
          
          {/* Reference */}
          <View style={getStyles(theme).detailRow}>
            <Text style={getStyles(theme).detailLabel}>Reference:</Text>
            <TouchableOpacity 
              style={getStyles(theme).copyableValue}
              onPress={() => copyToClipboard(reference, 'Reference')}
            >
              <Text style={getStyles(theme).detailValue}>{reference}</Text>
              <MaterialIcons name="content-copy" size={16} color="#39B747" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* USSD Code */}
        {wallet_type.ussd_code && (
          <View style={getStyles(theme).ussdCard}>
            <Text style={getStyles(theme).ussdTitle}>Quick Payment via USSD</Text>
            <TouchableOpacity 
              style={getStyles(theme).ussdCodeButton}
              onPress={handlePayNow}
            >
              <View style={getStyles(theme).ussdCodeContent}>
                <View style={getStyles(theme).ussdCodeTextContainer}>
                  <Text style={getStyles(theme).ussdCodeText}>{formatUssdCodeForDisplay(wallet_type.ussd_code)}</Text>
                </View>
                <TouchableOpacity 
                  style={getStyles(theme).copyIconButton}
                  onPress={() => copyToClipboard(formatUssdCodeForDisplay(wallet_type.ussd_code!), 'USSD Code')}
                >
                  <MaterialIcons name="content-copy" size={18} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Mobile Money Instructions */}
        {wallet_type.payment_instructions && (
          <View style={getStyles(theme).instructionsCard}>
            <Text style={getStyles(theme).instructionsTitle}>{wallet_type.name} Payment Instructions</Text>
            <Text style={getStyles(theme).instructionsText}>{wallet_type.payment_instructions}</Text>
          </View>
        )}
      </View>
    );
  };

  const handleContinue = () => {
    setIsLoading(true);
    // Simulate processing time
    setTimeout(() => {
      setIsLoading(false);
      (navigation as any).navigate('DepositVerification', {
        accountId,
        amount,
        reference,
        wallet_type,
      });
    }, 1000);
  };

  const handlePayNow = async () => {
    if (wallet_type?.ussd_code) {
      try {
        // Format USSD code for dialing and replace amount placeholders
        let ussdCode = wallet_type.ussd_code;
        
        // Replace various amount placeholder formats
        ussdCode = ussdCode.replace(/\{amount\}/g, amount);
        ussdCode = ussdCode.replace(/\*amount\*/g, `*${amount}*`);
        ussdCode = ussdCode.replace(/\*amount#/g, `*${amount}#`);
        ussdCode = ussdCode.replace(/amount/g, amount);
        
        if (!ussdCode.startsWith('*')) {
          ussdCode = '*' + ussdCode;
        }
        if (!ussdCode.endsWith('#')) {
          ussdCode = ussdCode + '#';
        }

        // Android-specific enhanced flow
        if (Platform.OS === 'android') {
          // Show pre-dial confirmation with payment details
          Alert.alert(
            'Mobile Money Payment',
            `You're about to dial ${ussdCode} to pay $${amount} via ${wallet_type.name}.\n\nAfter dialing, follow the prompts on your phone to complete the payment.`,
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Dial Now',
                onPress: async () => {
                  try {
                    const dialUrl = `tel:${ussdCode}`;
                    const canOpen = await Linking.canOpenURL(dialUrl);
                    
                    if (canOpen) {
                      await Linking.openURL(dialUrl);
                      
                      // Auto-navigate to verification after a short delay
                      setTimeout(() => {
                        Alert.alert(
                          'Payment Status',
                          'Have you completed the payment on your phone?',
                          [
                            {
                              text: 'Not Yet',
                              style: 'cancel'
                            },
                            {
                              text: 'Payment Completed',
                              onPress: () => {
                                setIsLoading(true);
                                // Navigate to verification stage
                                setTimeout(() => {
                                  setIsLoading(false);
                                  (navigation as any).navigate('DepositVerification', {
                                    accountId,
                                    amount,
                                    reference,
                                    wallet_type,
                                    paymentMethod: 'ussd',
                                    ussdCode: ussdCode
                                  });
                                }, 1000);
                              },
                              style: 'default'
                            }
                          ]
                        );
                      }, 3000); // 3 second delay to allow user to complete USSD flow
                    } else {
                      Alert.alert(
                        'Manual Dial Required',
                        `Your device cannot auto-dial USSD codes. Please manually dial: ${ussdCode}`,
                        [
                          {
                            text: 'Copy Code',
                            onPress: () => copyToClipboard(ussdCode, 'USSD Code')
                          },
                          {
                            text: 'Continue to Verification',
                            onPress: handleContinue,
                            style: 'default'
                          }
                        ]
                      );
                    }
                  } catch (error) {
                    console.error('Error dialing USSD:', error);
                    Alert.alert(
                      'Dial Error',
                      'Could not dial automatically. Please dial manually and then continue to verification.',
                      [
                        {
                          text: 'Copy USSD Code',
                          onPress: () => copyToClipboard(ussdCode, 'USSD Code')
                        },
                        {
                          text: 'Continue Anyway',
                          onPress: handleContinue,
                          style: 'default'
                        }
                      ]
                    );
                  }
                }
              }
            ]
          );
        } else {
          // iOS or other platforms - use existing flow
          const dialUrl = `tel:${ussdCode}`;
          const canOpen = await Linking.canOpenURL(dialUrl);
          
          if (canOpen) {
            await Linking.openURL(dialUrl);
            
            Alert.alert(
              'USSD Dialed',
              'The USSD code has been dialed. Follow the prompts on your phone to complete the payment.',
              [
                {
                  text: 'I\'ve Completed Payment',
                  onPress: handleContinue,
                  style: 'default'
                },
                {
                  text: 'Cancel',
                  style: 'cancel'
                }
              ]
            );
          } else {
            Alert.alert(
              'Cannot Dial',
              `Unable to dial USSD code automatically. Please dial ${ussdCode} manually on your phone.`,
              [
                {
                  text: 'Copy USSD Code',
                  onPress: () => copyToClipboard(ussdCode, 'USSD Code')
                },
                {
                  text: 'OK',
                  style: 'default'
                }
              ]
            );
          }
        }
      } catch (error) {
        console.error('Error dialing USSD:', error);
        Alert.alert(
          'Error',
          'Failed to dial USSD code. Please dial it manually.',
          [
            {
              text: 'Copy USSD Code',
              onPress: () => copyToClipboard(wallet_type.ussd_code!, 'USSD Code')
            },
            {
              text: 'OK'
            }
          ]
        );
      }
    } else {
      // Fallback if no USSD code
      handleContinue();
    }
  };

  // Determine button text and action based on payment method
  const getButtonConfig = () => {
    const isFiatWithUssd = wallet_type?.account_category === 'fiat' && wallet_type?.ussd_code;
    
    return {
      text: isFiatWithUssd ? 'Pay Now' : 'I\'ve Made the Payment',
      action: isFiatWithUssd ? handlePayNow : handleContinue,
      icon: isFiatWithUssd ? 'payment' : 'check-circle'
    };
  };

  return (
    <>     
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={getStyles(theme).container}>
        {/* Header */}
        <View style={getStyles(theme).header}>
          <TouchableOpacity style={getStyles(theme).backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={getStyles(theme).headerTitle}>Deposit Instructions</Text>
          <View style={getStyles(theme).placeholder} />
        </View>

        {/* Progress Indicator */}
        <View style={getStyles(theme).progressContainer}>
          <View style={getStyles(theme).progressTrack}>
            <View style={[getStyles(theme).progressFill, { width: '50%' }]} />
          </View>
          <View style={getStyles(theme).progressLabels}>
            <Text style={getStyles(theme).progressLabelComplete}>Details</Text>
            <Text style={getStyles(theme).progressLabelActive}>Instructions</Text>
            <Text style={getStyles(theme).progressLabel}>Verification</Text>
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
                <Text style={getStyles(theme).amountLabel}>Amount to Deposit</Text>
                <Text style={getStyles(theme).amountValue}>${amount}</Text>
              </View>
              <MaterialIcons name="attach-money" size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Account Card */}
          <View style={getStyles(theme).accountCard}>
            <View style={getStyles(theme).accountHeader}>
              <View style={getStyles(theme).accountIcon}>
                <Image source={getWalletLogo()} style={{ width: 40, height: 40 }} resizeMode="contain" />
              </View>
              <View style={getStyles(theme).accountInfo}>
                <Text style={getStyles(theme).accountName}>{accountData.display_name}</Text>
                <Text style={getStyles(theme).accountType}>
                  {wallet_type?.account_category || accountData.wallet_type?.account_category || 'Payment Method'}
                </Text>
              </View>
            </View>
          </View>

          {/* Reference Card */}
          {reference && (
            <View style={getStyles(theme).referenceCard}>
              <View style={getStyles(theme).referenceHeader}>
                <MaterialIcons name="confirmation-number" size={20} color={theme.primary} />
                <Text style={[getStyles(theme).referenceLabel, { marginLeft: 8 }]}>Reference Number</Text>
              </View>
              <TouchableOpacity 
                style={getStyles(theme).referenceContent}
                onPress={() => copyToClipboard(reference, 'Reference')}
                activeOpacity={0.7}
              >
                <Text style={getStyles(theme).referenceValue}>{reference}</Text>
                <MaterialIcons 
                  name={copiedField === 'Reference' ? 'check' : 'content-copy'} 
                  size={20} 
                  color={copiedField === 'Reference' ? theme.success : theme.textSecondary} 
                />
              </TouchableOpacity>
              <Text style={getStyles(theme).referenceNote}>Use this reference when making your deposit</Text>
            </View>
          )}

          {/* Payment Details */}
          {renderPaymentDetails()}

          {/* Footer with no Important Notes section */}
        </ScrollView>

        {/* Footer */}
        <View style={[getStyles(theme).footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={getStyles(theme).continueButton}
            onPress={getButtonConfig().action}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={getStyles(theme).continueButtonText}>{getButtonConfig().text}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
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
  paymentDetails: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  instructionsText: {
    fontSize: 16,
    color: theme.text,
    lineHeight: 24,
  },
  bankContainer: {
    marginBottom: 24,
  },
  fiatContainer: {
    marginBottom: 24,
  },
  ussdCard: {
    padding: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  ussdTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  ussdCodeButton: {
    width: '100%',
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  ussdCodeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ussdCodeTextContainer: {
    flex: 1,
  },
  ussdCodeText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
  },
  copyIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  copyableValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.successBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.success,
  },
  footer: {
    padding: 16,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
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
  amountCurrency: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  accountCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: theme.surface,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  accountType: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  referenceCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: theme.surface,
  },
  referenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  referenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  referenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referenceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  referenceNote: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  notesCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: theme.surface,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  notesList: {
    marginBottom: 16,
  },
  noteItem: {
    fontSize: 14,
    color: theme.text,
    marginBottom: 4,
  },
  // Crypto specific styles
  cryptoContainer: {
    alignItems: 'center',
  },
  walletAddressHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  walletAddressTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  walletAddressSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  networkBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  networkBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  walletAddressCard: {
    width: '100%',
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  walletAddressLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  walletAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletAddressText: {
    fontSize: 14,
    color: theme.text,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
    flex: 1,
    marginRight: 8,
  },
  copyButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#E8F7EA',
    marginLeft: 8,
  },
  transactionDetailsCard: {
    padding: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  transactionDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  detailValueHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#39B747',
  },
  instructionsCard: {
    padding: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
});

export default DepositInstructionsScreen; 