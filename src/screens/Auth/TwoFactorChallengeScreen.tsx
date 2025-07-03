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
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { authService } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { sessionExpiryHandler } from '../../services/sessionExpiryHandler';
import Colors from '../../constants/Colors';
import { RootStackScreenProps } from '../../types/navigation';

const { width, height } = Dimensions.get('window');

type TwoFactorChallengeScreenProps = RootStackScreenProps<'TwoFactorChallenge'>;

const TwoFactorChallengeScreen: React.FC<TwoFactorChallengeScreenProps> = ({ navigation, route }) => {
  const { login } = useAuth();
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
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
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Use session expiry handler instead of showing alert
          sessionExpiryHandler.handleSessionExpiry(true, 'Your 2FA session has expired. Please log in again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigation]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (!useRecoveryCode && code.length !== 6) {
      Alert.alert('Error', 'Verification code must be 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.verify2FALogin({ email, code });
      
      if (response.success) {
        const { user, token } = response;
        
        // Check for recovery codes info in the response
        if (response.recovery_codes_left !== null && response.recovery_codes_left !== undefined) {
          Alert.alert(
            'Recovery Code Used',
            `You have ${response.recovery_codes_left} recovery codes remaining.`,
            [{ text: 'OK' }]
          );
        }
        
        if (token && user) {
          await login(token, user);
        } else {
          Alert.alert('Error', 'Authentication data missing from response');
        }
      } else {
        Alert.alert('Error', response.message || 'Verification failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  const toggleRecoveryCode = () => {
    setUseRecoveryCode(!useRecoveryCode);
    setCode('');
    setTimeout(() => codeInputRef.current?.focus(), 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.keyboardAvoidingView, { backgroundColor: colors.background }]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content, 
            { 
              backgroundColor: colors.background,
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: Math.max(insets.bottom + 100, 120), // Extra padding for tab bar
              paddingLeft: Math.max(insets.left, 30),
              paddingRight: Math.max(insets.right, 30),
            }
          ]}
          style={{ flex: 1, backgroundColor: colors.background }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="shield-checkmark" size={60} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Two-Factor Authentication</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the {useRecoveryCode ? 'recovery code' : '6-digit code'} from your authenticator app
            </Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{email}</Text>
          </Animatable.View>

          {/* Timer */}
          <Animatable.View animation="fadeIn" delay={500} style={styles.timerContainer}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.timerText, { color: colors.textSecondary }]}>Session expires in {formatTime(timeLeft)}</Text>
          </Animatable.View>

          {/* Code Input */}
          <Animatable.View animation="fadeInUp" delay={500} duration={1000} style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {useRecoveryCode ? 'Recovery Code' : 'Authentication Code'}
              </Text>
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
                placeholder={useRecoveryCode ? 'Enter recovery code' : '000000'}
                placeholderTextColor={colors.textSecondary}
                keyboardType={useRecoveryCode ? 'default' : 'number-pad'}
                maxLength={useRecoveryCode ? 20 : 6}
                autoFocus
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                { backgroundColor: colors.primary },
                isLoading && styles.verifyButtonDisabled
              ]}
              onPress={handleVerifyCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Text style={[styles.verifyButtonText, { color: colors.background }]}>Verify</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.background} />
                </>
              )}
            </TouchableOpacity>

            {/* Toggle Recovery Code */}
            <TouchableOpacity style={styles.toggleButton} onPress={toggleRecoveryCode}>
              <Text style={[styles.toggleButtonText, { color: colors.primary }]}>
                {useRecoveryCode ? 'Use authenticator code' : 'Use recovery code'}
              </Text>
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
              <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
              <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Back to Login</Text>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  },
  email: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 5,
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    marginLeft: 5,
    fontSize: 14,
    opacity: 0.8,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  codeInput: {
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
    borderWidth: 1,
  },
  verifyButton: {
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  toggleButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleButtonText: {
    fontSize: 14,
    opacity: 0.8,
    textDecorationLine: 'underline',
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 14,
    marginLeft: 5,
    opacity: 0.8,
  },
});

export default TwoFactorChallengeScreen; 