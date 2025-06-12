import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { Svg, Path } from 'react-native-svg';
import { authService } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

// Safe import for ColorLogo
let ColorLogo;
try {
  ColorLogo = require('../assets/images/color-logo.svg').default;
} catch (error) {
  console.warn('ColorLogo import failed:', error);
  ColorLogo = null;
}

// Safe import for BiometricButton
let BiometricButton;
try {
  BiometricButton = require('../components/BiometricButton').default;
} catch (error) {
  console.warn('BiometricButton import failed:', error);
  BiometricButton = null;
}

const { width, height } = Dimensions.get('window');

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'The email or password you entered is incorrect. Please try again.',
  UNVERIFIED_EMAIL: 'Please verify your email address before logging in. Check your inbox for a verification link.',
  TOO_MANY_ATTEMPTS: 'Too many failed login attempts. Please wait a few minutes and try again.',
  DEFAULT: 'Something went wrong. Please try again.',
};

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    isPasswordVisible: false,
    isLoading: false,
    errors: {}
  });

  const updateFormState = useCallback((updates) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    const { email, password } = formState;

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      errors.email = 'Please enter a valid email';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    updateFormState({ errors });
    return Object.keys(errors).length === 0;
  }, [formState.email, formState.password, updateFormState]);

  const handleLogin = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    updateFormState({ isLoading: true });
    try {
      const { email, password } = formState;
      const response = await authService.login({ email, password });
      
      console.log('Login response:', response);
      
      if (!response.success) {
        console.log('Login not successful, checking conditions...');
        console.log('requiresVerification:', response.requiresVerification);
        console.log('needs2FA:', response.needs2FA);
        
        // Check if email verification is required
        if (response.requiresVerification) {
          console.log('Email requires verification:', response.email);
          await AsyncStorage.setItem('userEmail', response.email);
          navigation.navigate('EmailVerification', { email: response.email });
          return;
        }

        // Check if 2FA is required
        if (response.needs2FA) {
          console.log('2FA required for user:', response.email);
          navigation.navigate('TwoFactorChallenge', { email: response.email });
          return;
        }
        
        console.log('No special conditions met, throwing error...');
        throw new Error(response.message || 'Login failed');
      }

      // Successful login - response already contains token and user
      await login(response.token, response.user);
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = getErrorMessage(error);
      if (error.message.toLowerCase().includes('verify your email')) {
        Alert.alert('Email Verification Required', errorMessage, [
          {
            text: 'Go to Verification',
            onPress: () => {
              navigation.navigate('EmailVerification', { email: formState.email });
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Login Failed', errorMessage, [{ text: 'OK' }]);
      }
    } finally {
      updateFormState({ isLoading: false });
    }
  }, [formState, validateForm, login, navigation]);

  const handleResendVerification = useCallback(async () => {
    updateFormState({ isLoading: true });
    try {
      const result = await authService.resendVerificationEmail(formState.email);
      if (result.success) {
        Alert.alert(
          'Code Sent!',
          result.message || 'Verification code sent to your email.',
          [
            {
              text: 'Go to Verification',
              onPress: () => {
                navigation.navigate('EmailVerification', { email: formState.email });
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          result.message || 'Failed to send verification email. Please try again later.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Failed to send verification email. Please try again later.'
      );
    } finally {
      updateFormState({ isLoading: false });
    }
  }, [formState.email, navigation]);

  const handleBiometricSuccess = useCallback(async (result) => {
    try {
      console.log('🚨🚨🚨 BIOMETRIC SUCCESS IN LOGINSCREEN.JS 🚨🚨🚨');
      console.log('Biometric result:', result);
      
      // Extract the actual user data from biometric credentials
      const localUserData = result.userCredentials?.localUserData;
      
      if (!localUserData || !localUserData.id || !localUserData.email) {
        throw new Error('Invalid biometric credentials. Please log in with your password.');
      }
      
      // Create a proper user object from localUserData
      const user = {
        id: Number(localUserData.id),
        name: String(localUserData.name || ''),
        email: String(localUserData.email),
        email_verified: true,
        is_verified: true,
        referral_code: '',
        phone: localUserData.phone ? String(localUserData.phone) : undefined
      };
      
      console.log('Created user object for biometric login:', user);
      
      // Use the session token if available
      const token = result.userCredentials?.sessionToken || '';
      
      await login(token, user);
    } catch (error) {
      console.error('Biometric login error:', error);
      Alert.alert(
        'Error',
        'Failed to complete biometric login. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [login]);

  const getErrorMessage = useCallback((error) => {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid email or password')) {
      return ERROR_MESSAGES.INVALID_CREDENTIALS;
    } else if (message.includes('verify your email')) {
      return ERROR_MESSAGES.UNVERIFIED_EMAIL;
    } else if (message.includes('too many login attempts')) {
      return ERROR_MESSAGES.TOO_MANY_ATTEMPTS;
    }
    
    return ERROR_MESSAGES.DEFAULT;
  }, []);

  const renderError = useCallback((fieldName) => {
    if (formState.errors[fieldName]) {
      return <Text style={getStyles(colors).errorText}>{formState.errors[fieldName]}</Text>;
    }
    return null;
  }, [formState.errors, colors]);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const formRef = useRef(null);

  const handleBiometricError = (result) => {
    console.log('Biometric authentication error:', result);
    Alert.alert(
      'Authentication Failed', 
      result.error || 'Biometric authentication was cancelled or failed.',
      [{ text: 'OK' }]
    );
  };

  const handleBiometricFallback = (result) => {
    console.log('Biometric fallback to password:', result);
  };

  const handleForgotPassword = () => {
    // Navigate to the comprehensive password reset flow
    navigation.navigate('ForgotPassword');
  };

  const navigateToSignup = () => {
    try {
      navigation.navigate('Signup');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Safe rendering function for ColorLogo
  const renderLogo = () => {
    if (ColorLogo && typeof ColorLogo !== 'number') {
      try {
        return <ColorLogo width={width * 0.7} height={60} />;
      } catch (error) {
        console.warn('ColorLogo render error:', error);
        return (
          <View style={getStyles(colors).logoFallback}>
            <Text style={getStyles(colors).logoText}>Hoopay</Text>
          </View>
        );
      }
    }
    return (
      <View style={getStyles(colors).logoFallback}>
        <Text style={getStyles(colors).logoText}>Hoopay</Text>
      </View>
    );
  };

  // Safe rendering function for BiometricButton
  const renderBiometricButton = () => {
    if (BiometricButton && typeof BiometricButton !== 'number') {
      try {
        return (
          <BiometricButton
            onSuccess={handleBiometricSuccess}
            onError={handleBiometricError}
            onFallback={handleBiometricFallback}
            size="medium"
            showLabel={true}
            disabled={formState.isLoading}
          />
        );
      } catch (error) {
        console.warn('BiometricButton render error:', error);
        return null;
      }
    }
    return null;
  };

  return (
    <SafeAreaView style={getStyles(colors).container}>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor="transparent"
        translucent={false}
      />
      
      <KeyboardAvoidingView 
        style={getStyles(colors).container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={getStyles(colors).content}>
          <View style={getStyles(colors).header}>
            <Animatable.View 
              animation="fadeIn" 
              duration={1000} 
              style={getStyles(colors).logoContainer}
            >
              {renderLogo()}
            </Animatable.View>

            <Animatable.Text
              animation="fadeIn"
              duration={1000}
              style={getStyles(colors).headerTitle}
            >
              Welcome Back
            </Animatable.Text>
          </View>

          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={300}
            style={getStyles(colors).formContainer}
          >
            <View style={getStyles(colors).biometricSection}>
              {renderBiometricButton()}
            </View>

            {BiometricButton && (
              <View style={getStyles(colors).separator}>
                <View style={getStyles(colors).separatorLine} />
                <Text style={getStyles(colors).separatorText}>OR</Text>
                <View style={getStyles(colors).separatorLine} />
              </View>
            )}

            <View style={getStyles(colors).inputContainer}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={getStyles(colors).inputIcon}>
                <Path
                  d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z"
                  fill={colors.textSecondary}
                />
              </Svg>
              <TextInput
                style={[getStyles(colors).input, formState.errors.email && getStyles(colors).inputError]}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formState.email}
                onChangeText={(text) => {
                  updateFormState({ email: text });
                  updateFormState({ errors: { ...formState.errors, email: null } });
                }}
              />
            </View>
            {renderError('email')}

            <View style={getStyles(colors).inputContainer}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={getStyles(colors).inputIcon}>
                <Path
                  d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z"
                  fill={colors.textSecondary}
                />
              </Svg>
              <TextInput
                style={[getStyles(colors).input, formState.errors.password && getStyles(colors).inputError]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!formState.isPasswordVisible}
                value={formState.password}
                onChangeText={(text) => {
                  updateFormState({ password: text });
                  updateFormState({ errors: { ...formState.errors, password: null } });
                }}
              />
              <TouchableOpacity
                style={getStyles(colors).passwordVisibilityButton}
                onPress={() => updateFormState({ isPasswordVisible: !formState.isPasswordVisible })}
              >
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d={formState.isPasswordVisible
                      ? "M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
                      : "M12 6C15.79 6 19.17 8.13 20.82 12C19.17 15.87 15.79 18 12 18C8.21 18 4.83 15.87 3.18 12C4.83 8.13 8.21 6 12 6ZM12 4C7 4 2.73 7.11 1 12C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12C21.27 7.11 17 4 12 4ZM12 9C13.38 9 14.5 10.12 14.5 11.5C14.5 12.88 13.38 14 12 14C10.62 14 9.5 12.88 9.5 11.5C9.5 10.12 10.62 9 12 9ZM12 7C9.52 7 7.5 9.02 7.5 11.5C7.5 13.98 9.52 16 12 16C14.48 16 16.5 13.98 16.5 11.5C16.5 9.02 14.48 7 12 7Z"}
                    fill={colors.textSecondary}
                  />
                </Svg>
              </TouchableOpacity>
            </View>
            {renderError('password')}

            <TouchableOpacity 
              style={getStyles(colors).forgotPasswordButton}
              onPress={handleForgotPassword}
            >
              <Text style={getStyles(colors).forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleLogin}
              disabled={formState.isLoading}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={getStyles(colors).loginButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {formState.isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={getStyles(colors).loginButtonText}>LOG IN</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={getStyles(colors).footer}>
              <Text style={getStyles(colors).footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={navigateToSignup}>
                <Text style={getStyles(colors).signupText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: height * 0.03,
    marginTop: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.7,
    height: 60,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  formContainer: {
    width: '100%',
  },
  biometricSection: {
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    color: colors.textSecondary,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
  passwordVisibilityButton: {
    padding: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: colors.secondary,
    fontSize: 14,
  },
  loginButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  signupText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginLeft: 15,
    marginTop: 4,
  },
});

export default LoginScreen; 