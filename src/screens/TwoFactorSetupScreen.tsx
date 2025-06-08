import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Clipboard,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import QRCode from 'react-native-qrcode-svg';
import twoFactorService from '../services/twoFactorService';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/Colors';
import { RootStackScreenProps } from '../types/navigation';

const { width, height } = Dimensions.get('window');

type TwoFactorSetupScreenProps = RootStackScreenProps<'TwoFactorSetup'>;

const TwoFactorSetupScreen: React.FC<TwoFactorSetupScreenProps> = ({ navigation }) => {
  const [qrData, setQrData] = useState<any>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const codeInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  // Theme support
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available, using default colors');
    colors = Colors;
    isDarkMode = false;
  }

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const response = await (twoFactorService as any).generate();
      if (response.success) {
        setQrData(response.data);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (code.length !== 6) {
      Alert.alert('Error', 'Verification code must be 6 digits');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await (twoFactorService as any).verifyAndEnable(code, password);
      if (response.success) {
        setRecoveryCodes(response.data.recovery_codes);
        setSetupComplete(true);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to enable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = async () => {
    if (qrData?.secret) {
      await Clipboard.setString(qrData.secret);
      Alert.alert('Copied', 'Secret key copied to clipboard');
    }
  };

  const copyRecoveryCodes = async () => {
    const codes = recoveryCodes.join('\n');
    await Clipboard.setString(codes);
    Alert.alert('Copied', 'Recovery codes copied to clipboard');
  };

  const shareRecoveryCodes = async () => {
    const codes = recoveryCodes.join('\n');
    try {
      await Share.share({
        message: `Your Two-Factor Authentication Recovery Codes:\n\n${codes}\n\nSave these codes in a secure location. Each code can only be used once.`,
        title: '2FA Recovery Codes',
      });
    } catch (error) {
      console.error('Error sharing recovery codes:', error);
    }
  };

  const handleComplete = () => {
    Alert.alert(
      'Setup Complete!',
      'Two-factor authentication has been enabled for your account. Make sure to save your recovery codes in a secure location.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (setupComplete) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            {
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: Math.max(insets.bottom + 100, 120), // Extra padding for tab bar
              paddingLeft: Math.max(insets.left, 30),
              paddingRight: Math.max(insets.right, 30),
            }
          ]} 
          style={{ backgroundColor: colors.background }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Success Header */}
            <View style={styles.successHeader}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={80} color={colors.success || colors.primary} />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>2FA Enabled Successfully!</Text>
              <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                Your account is now protected with two-factor authentication
              </Text>
            </View>

            {/* Recovery Codes */}
            <View style={[styles.recoveryCodesContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.recoveryCodesTitle, { color: colors.text }]}>Recovery Codes</Text>
              <Text style={[styles.recoveryCodesDescription, { color: colors.textSecondary }]}>
                Save these codes in a secure location. Each code can only be used once to access your account if you lose your authenticator device.
              </Text>
              
              <View style={styles.codesGrid}>
                {recoveryCodes.map((code, index) => (
                  <View key={index} style={[styles.codeItem, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.codeText, { color: colors.text }]}>{code}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.recoveryActions}>
                <TouchableOpacity style={[styles.copyButton, { backgroundColor: colors.primary }]} onPress={copyRecoveryCodes}>
                  <Ionicons name="copy-outline" size={16} color={colors.background} />
                  <Text style={[styles.copyButtonText, { color: colors.background }]}>Copy Codes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.secondary || colors.primary }]} onPress={shareRecoveryCodes}>
                  <Ionicons name="share-outline" size={16} color={colors.background} />
                  <Text style={[styles.shareButtonText, { color: colors.background }]}>Share Codes</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Complete Button */}
            <TouchableOpacity style={[styles.completeButton, { backgroundColor: colors.primary }]} onPress={handleComplete}>
              <Text style={[styles.completeButtonText, { color: colors.background }]}>Complete Setup</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.background} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom + 100, 120), // Extra padding for tab bar
            paddingLeft: Math.max(insets.left, 30),
            paddingRight: Math.max(insets.right, 30),
          }
        ]} 
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="shield-checkmark" size={60} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Enable Two-Factor Authentication</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Add an extra layer of security to your account
            </Text>
          </Animatable.View>

          {/* Step 1: QR Code */}
          <Animatable.View animation="fadeInUp" delay={300} duration={1000} style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Step 1: Scan QR Code</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Use Google Authenticator, Microsoft Authenticator, or any compatible TOTP app to scan this QR code:
            </Text>
            
            {isGenerating ? (
              <View style={styles.qrLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Generating QR Code...</Text>
              </View>
            ) : qrData ? (
              <View style={[styles.qrContainer, { backgroundColor: colors.surface }]}>
                <QRCode
                  value={qrData.qr_code_url}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
                
                <TouchableOpacity style={[styles.secretContainer, { backgroundColor: colors.background }]} onPress={copySecret}>
                  <Text style={[styles.secretLabel, { color: colors.textSecondary }]}>Manual entry key:</Text>
                  <Text style={[styles.secretText, { color: colors.text }]}>{qrData.secret}</Text>
                  <Ionicons name="copy-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.surface }]} onPress={generateQRCode}>
                <Text style={[styles.retryButtonText, { color: colors.text }]}>Retry</Text>
              </TouchableOpacity>
            )}
          </Animatable.View>

          {/* Step 2: Verify */}
          <Animatable.View animation="fadeInUp" delay={600} duration={1000} style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Step 2: Enter Verification Code</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Authentication Code</Text>
              <TextInput
                ref={codeInputRef}
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  }
                ]}
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Current Password</Text>
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  }
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.enableButton,
                { backgroundColor: colors.primary },
                isLoading && styles.enableButtonDisabled
              ]}
              onPress={handleVerifyAndEnable}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Text style={[styles.enableButtonText, { color: colors.background }]}>Enable 2FA</Text>
                  <Ionicons name="shield-checkmark" size={20} color={colors.background} />
                </>
              )}
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  stepContainer: {
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 20,
    lineHeight: 20,
  },
  qrLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    opacity: 0.8,
  },
  qrContainer: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secretContainer: {
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
  },
  secretLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginRight: 5,
  },
  secretText: {
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 10,
  },
  retryButton: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  retryButtonText: {
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  codeInput: {
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 3,
    borderWidth: 1,
  },
  passwordInput: {
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  enableButton: {
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  enableButtonDisabled: {
    opacity: 0.6,
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  // Success screen styles
  successHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  recoveryCodesContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recoveryCodesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recoveryCodesDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 20,
    lineHeight: 20,
  },
  codesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  codeItem: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recoveryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copyButton: {
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  copyButtonText: {
    marginLeft: 5,
    fontWeight: 'bold',
  },
  shareButton: {
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  shareButtonText: {
    marginLeft: 5,
    fontWeight: 'bold',
  },
  completeButton: {
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default TwoFactorSetupScreen; 