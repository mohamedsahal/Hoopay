import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import authService from '../../services/authService';
import Colors from '../../constants/Colors';
import { RootStackScreenProps } from '../../types/navigation';

const VerificationScreen: React.FC<RootStackScreenProps<'Verification'>> = ({ navigation, route }) => {
  const { login } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Use theme context with fallback
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in VerificationScreen, using default colors');
    colors = Colors;
    isDarkMode = false;
  }

  useEffect(() => {
    // Get email from route params or AsyncStorage
    const initEmail = async () => {
      const routeEmail = route.params?.email;
      if (routeEmail) {
        setEmail(routeEmail);
      } else {
        const storedEmail = await authService.getStoredEmail();
        if (storedEmail) {
          setEmail(storedEmail);
        } else {
          // No email found, go back to login
          navigation.replace('Login');
        }
      }
    };
    initEmail();
  }, [route.params?.email]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerification = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email not found. Please try logging in again.');
      navigation.replace('Login');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyEmail(email, verificationCode);

      if (response.success) {
        if (response.token && response.user) {
          await login(response.token, response.user);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          Alert.alert('Success', 'Email verified successfully! Please log in.');
          navigation.replace('Login');
        }
      } else {
        Alert.alert('Error', response.message || 'Verification failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendDisabled) return;

    setLoading(true);
    try {
      const response = await authService.resendVerificationEmail(email);
      if (response.success) {
        Alert.alert('Success', 'Verification code sent to your email');
        setResendDisabled(true);
        setCountdown(60); // 60 seconds cooldown
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Text style={[styles.title, { color: colors.text }]}>Email Verification</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Please enter the verification code sent to:
      </Text>
      <Text style={[styles.email, { color: colors.primary }]}>{email}</Text>

      <TextInput
        style={[styles.input, { 
          borderColor: colors.border, 
          backgroundColor: colors.surface,
          color: colors.text 
        }]}
        placeholder="Enter verification code"
        placeholderTextColor={colors.placeholder}
        value={verificationCode}
        onChangeText={setVerificationCode}
        keyboardType="number-pad"
        maxLength={6}
        editable={!loading}
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
        onPress={handleVerification}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify Email</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.resendButton, resendDisabled && styles.resendDisabled]}
        onPress={handleResendCode}
        disabled={resendDisabled || loading}
      >
        <Text style={[styles.resendText, { color: colors.primary }, resendDisabled && styles.resendTextDisabled]}>
          {resendDisabled 
            ? `Resend Code (${countdown}s)` 
            : 'Resend Code'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 20,
    padding: 10,
  },
  resendDisabled: {
    opacity: 0.6,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 16,
  },
  resendTextDisabled: {
    color: Colors.textSecondary,
  },
});

export default VerificationScreen; 