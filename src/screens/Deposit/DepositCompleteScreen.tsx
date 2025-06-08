import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Share,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import api from '../../services/api';
import ThermalReceipt from '../../components/ThermalReceipt';

interface RouteParams {
  amount: string;
  transactionRef: string;
  status: string;
  accountData?: {
    display_name?: string;
    wallet_type?: {
      name: string;
    };
  };
  wallet_type?: {
    name: string;
  };
}

const DepositCompleteScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { amount, transactionRef, status, accountData, wallet_type } = route.params as RouteParams;
  const receiptRef = useRef<any>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [isCapturing, setIsCapturing] = useState(false);

  const isVerified = status === 'verified' || status === 'completed';
  const isPending = status === 'pending';

  const getStatusConfig = () => {
    if (isVerified) {
      return {
        icon: 'check-circle',
        color: theme.success,
        title: 'Deposit Verified!',
        subtitle: 'Your funds have been successfully added to your wallet',
        bgColor: theme.successBackground,
      };
    } else {
      return {
        icon: 'schedule',
        color: theme.warning,
        title: 'Deposit Submitted!',
        subtitle: 'Your deposit is being verified and will be processed within 24 hours',
        bgColor: theme.warningBackground,
      };
    }
  };

  const statusConfig = getStatusConfig();

  const handleGoHome = () => {
    // Navigate to main home screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    });
  };

  const handleViewTransactions = () => {
    // Navigate to transactions screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    });
    // Then navigate to transactions tab
    setTimeout(() => {
      (navigation as any).navigate('Transactions');
    }, 100);
  };

  const downloadReceipt = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication required to download receipt');
        return;
      }

      // Construct the receipt download URL with token as query parameter for browser compatibility
      const receiptUrl = `${api.defaults.baseURL}/mobile/transactions/${transactionRef}/receipt?token=${encodeURIComponent(token)}`;
      
      // Open the PDF receipt in the browser
      await Linking.openURL(receiptUrl);
      
    } catch (error: any) {
      console.error('Error downloading receipt:', error);
      Alert.alert('Error', 'Failed to download receipt. Please try again.');
    }
  };

  // Share receipt functionality
  const shareReceipt = async () => {
    try {
      setIsCapturing(true);
      
      // Capture the receipt view as image
      const uri = await receiptRef.current.capture();
      console.log('Receipt captured:', uri);
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Deposit Receipt',
          UTI: 'public.jpeg'
        });
      } else {
        // Fallback to React Native's built-in Share API
        if (Platform.OS === 'ios') {
          await Share.share({
            url: uri,
            message: 'Deposit Receipt from Hoopay Wallet',
            title: 'Deposit Receipt',
          });
        } else {
          await Share.share({
            message: 'Deposit Receipt from Hoopay Wallet',
            title: 'Deposit Receipt',
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
        console.log('User cancelled sharing');
        return;
      }
      
      // Enhanced fallback to text sharing
      try {
        const paymentMethod = wallet_type?.name || accountData?.wallet_type?.name || accountData?.display_name || 'Hoopay Account';
        const receiptText = `
🧾 DEPOSIT RECEIPT 🧾

✅ Deposit ${isVerified ? 'Completed' : 'Submitted'}!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Amount: $${parseFloat(amount).toFixed(2)}
🏦 Method: ${paymentMethod}
📋 Transaction ID: ${transactionRef}
📊 Status: ${isVerified ? 'VERIFIED' : 'PENDING VERIFICATION'}
📅 Date: ${new Date().toLocaleDateString()}
⏰ Time: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💙 Powered by Hoopay Wallet
        `.trim();

        await Share.share({
          message: receiptText,
          title: 'Deposit Receipt',
        });
      } catch (fallbackError: any) {
        console.error('Fallback sharing also failed:', fallbackError);
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

  const getPaymentMethod = () => {
    return wallet_type?.name || accountData?.wallet_type?.name || accountData?.display_name || 'Hoopay Account';
  };

  return (
    <>
      <StatusBar style={theme.isDarkMode ? 'light' : 'dark'} />
      <SafeAreaView style={getStyles(theme).container}>
        {/* Header */}
        <View style={getStyles(theme).header}>
          <TouchableOpacity style={getStyles(theme).closeButton} onPress={handleGoHome}>
            <MaterialIcons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={getStyles(theme).headerTitle}>
            {isVerified ? 'Deposit Complete' : 'Deposit Submitted'}
          </Text>
          <TouchableOpacity 
            style={getStyles(theme).shareButton}
            onPress={shareReceipt}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <MaterialIcons name="share" size={24} color={theme.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Success Animation Area with Integrated Receipt Message */}
        <View style={getStyles(theme).animationContainer}>
          <LinearGradient
            colors={[theme.gradientStart, theme.gradientEnd]}
            style={getStyles(theme).successGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialIcons 
              name={statusConfig.icon as any} 
              size={64} 
              color="white" 
            />
            <Text style={getStyles(theme).successTitle}>{statusConfig.title}</Text>
            <Text style={getStyles(theme).successSubtitle}>
              {isVerified 
                ? 'Your funds have been successfully added to your wallet. Your receipt is ready below.'
                : statusConfig.subtitle
              }
            </Text>
          </LinearGradient>
        </View>

        <ScrollView style={getStyles(theme).content} showsVerticalScrollIndicator={false}>
          {/* Enhanced Thermal Receipt Container */}
          <ViewShot ref={receiptRef} style={getStyles(theme).receiptContainer}>
            <ThermalReceipt
              transactionType="deposit"
              transactionId={transactionRef}
              amount={amount}
              status={status}
              recipientInfo={{
                method: getPaymentMethod()
              }}
            />
          </ViewShot>

          {/* Action Buttons */}
          <View style={[getStyles(theme).actionButtons, { paddingBottom: Math.max(insets.bottom, 32) }]}>
            <TouchableOpacity
              style={getStyles(theme).primaryButton}
              onPress={handleGoHome}
              activeOpacity={0.8}
            >
              <MaterialIcons name="home" size={20} color="white" />
              <Text style={getStyles(theme).primaryButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  closeButton: {
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
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  successGradient: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  receiptContainer: {
    marginBottom: 24,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
});

export default DepositCompleteScreen; 