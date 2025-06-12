import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';
import passwordResetService from '../services/passwordResetService';

const { width, height } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Countdown timer for resend functionality
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Utility functions
  const clearErrors = () => setErrors({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  // Step 1: Request password reset
  const handleRequestReset = async () => {
    try {
      setIsLoading(true);
      clearErrors();

      if (!email.trim()) {
        setErrors({ email: 'Email is required' });
        return;
      }

      if (!validateEmail(email)) {
        setErrors({ email: 'Please enter a valid email address' });
        return;
      }

      console.log('=== REQUESTING PASSWORD RESET ===');
      console.log('Email:', email);

      const result = await passwordResetService.requestReset(email);
      
      console.log('Reset request result:', result);

      if (result.success) {
        setCurrentStep(2);
        setCountdown(120); // 2 minutes countdown
        Alert.alert('Success', result.message || 'Verification code sent to your email');
      } else {
        // Show detailed error information
        console.error('Password reset request failed:', result);
        
        // Check for specific validation errors
        if (result.errors && typeof result.errors === 'object') {
          if (result.errors.email) {
            setErrors({ email: Array.isArray(result.errors.email) ? result.errors.email[0] : result.errors.email });
          } else {
            setErrors({ general: result.message || 'Failed to send reset code' });
          }
        } else {
          setErrors({ general: result.message || 'Failed to send reset code' });
        }
        
        // Show alert with detailed error
        Alert.alert(
          'Error', 
          result.message || 'Failed to send reset code. Please check your email address and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Request reset error:', error);
      setErrors({ general: 'An error occurred. Please try again.' });
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify reset code
  const handleVerifyCode = async () => {
    try {
      setIsLoading(true);
      clearErrors();

      if (!verificationCode.trim()) {
        setErrors({ code: 'Verification code is required' });
        return;
      }

      if (verificationCode.length !== 6) {
        setErrors({ code: 'Please enter the 6-digit code' });
        return;
      }

      console.log('=== VERIFYING CODE ===');
      console.log('Email:', email, 'Code:', verificationCode);

      const result = await passwordResetService.verifyCode(email, verificationCode);
      
      console.log('Verify code result:', result);

      if (result.success) {
        setResetToken(result.resetToken);
        setCurrentStep(3);
        Alert.alert('Success', 'Code verified successfully');
      } else {
        setErrors({ code: result.message || 'Invalid verification code' });
      }
    } catch (error) {
      console.error('Verify code error:', error);
      setErrors({ code: 'Failed to verify code' });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    try {
      setIsLoading(true);
      clearErrors();

      if (!newPassword.trim()) {
        setErrors({ password: 'New password is required' });
        return;
      }

      if (!validatePassword(newPassword)) {
        setErrors({ password: 'Password must be at least 8 characters long' });
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrors({ confirmPassword: 'Passwords do not match' });
        return;
      }

      console.log('=== COMPLETING PASSWORD RESET ===');
      console.log('Email:', email, 'Has token:', !!resetToken);

      const result = await passwordResetService.completeReset(email, resetToken, newPassword, confirmPassword);
      
      console.log('Complete reset result:', result);

      if (result.success) {
        setCurrentStep(4);
        Alert.alert('Success', 'Password reset successfully');
      } else {
        setErrors({ general: result.message || 'Failed to reset password' });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setErrors({ general: 'Failed to reset password' });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    try {
      setIsLoading(true);
      clearErrors();

      console.log('=== RESENDING CODE ===');
      console.log('Email:', email);

      const result = await passwordResetService.resendCode(email);
      
      console.log('Resend code result:', result);

      if (result.success) {
        setCountdown(120);
        Alert.alert('Success', 'New verification code sent');
      } else {
        setErrors({ general: result.message || 'Failed to resend code' });
      }
    } catch (error) {
      console.error('Resend code error:', error);
      setErrors({ general: 'Failed to resend code' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderError = (field) => {
    if (errors[field]) {
      return <Text style={getStyles(colors).errorText}>{errors[field]}</Text>;
    }
    return null;
  };

  // Step 1: Request Reset
  const renderRequestStep = () => (
    <Animated.View 
      style={[getStyles(colors).stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={getStyles(colors).stepTitle}>Forgot Password?</Text>
      <Text style={getStyles(colors).stepDescription}>
        Enter your email address and we'll send you a verification code to reset your password.
      </Text>

      <View style={[getStyles(colors).inputContainer, errors.email && getStyles(colors).inputError]}>
        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={getStyles(colors).inputIcon} />
        <TextInput
          style={getStyles(colors).input}
          placeholder="Email Address"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) clearErrors();
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {renderError('email')}
      {renderError('general')}

      <TouchableOpacity onPress={handleRequestReset} disabled={isLoading}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={getStyles(colors).button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={getStyles(colors).buttonText}>Send Reset Code</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  // Step 2: Verify Code
  const renderVerifyStep = () => (
    <Animated.View 
      style={[getStyles(colors).stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={getStyles(colors).stepTitle}>Enter Verification Code</Text>
      <Text style={getStyles(colors).stepDescription}>
        We've sent a 6-digit verification code to {email}. Please enter it below.
      </Text>

      <View style={[getStyles(colors).inputContainer, errors.code && getStyles(colors).inputError]}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} style={getStyles(colors).inputIcon} />
        <TextInput
          style={getStyles(colors).input}
          placeholder="6-digit code"
          placeholderTextColor={colors.textSecondary}
          value={verificationCode}
          onChangeText={(text) => {
            setVerificationCode(text);
            if (errors.code) clearErrors();
          }}
          keyboardType="numeric"
          maxLength={6}
        />
      </View>
      {renderError('code')}
      {renderError('general')}

      <TouchableOpacity onPress={handleVerifyCode} disabled={isLoading}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={getStyles(colors).button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={getStyles(colors).buttonText}>Verify Code</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleResendCode} 
        disabled={countdown > 0 || isLoading}
        style={getStyles(colors).resendButton}
      >
        <Text style={[
          getStyles(colors).resendText,
          (countdown > 0 || isLoading) && getStyles(colors).resendTextDisabled
        ]}>
          {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // Step 3: Reset Password
  const renderResetStep = () => (
    <Animated.View 
      style={[getStyles(colors).stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={getStyles(colors).stepTitle}>Create New Password</Text>
      <Text style={getStyles(colors).stepDescription}>
        Enter your new password. Make sure it's at least 8 characters long.
      </Text>

      <View style={[getStyles(colors).inputContainer, errors.password && getStyles(colors).inputError]}>
        <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={getStyles(colors).inputIcon} />
        <TextInput
          style={getStyles(colors).input}
          placeholder="New Password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!isPasswordVisible}
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            if (errors.password) clearErrors();
          }}
        />
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={getStyles(colors).passwordVisibilityButton}
        >
          <Ionicons
            name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      {renderError('password')}

      <View style={[getStyles(colors).inputContainer, errors.confirmPassword && getStyles(colors).inputError]}>
        <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={getStyles(colors).inputIcon} />
        <TextInput
          style={getStyles(colors).input}
          placeholder="Confirm New Password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!isConfirmPasswordVisible}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.confirmPassword) clearErrors();
          }}
        />
        <TouchableOpacity
          onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
          style={getStyles(colors).passwordVisibilityButton}
        >
          <Ionicons
            name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      {renderError('confirmPassword')}
      {renderError('general')}

      <TouchableOpacity onPress={handleResetPassword} disabled={isLoading}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={getStyles(colors).button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={getStyles(colors).buttonText}>Reset Password</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  // Step 4: Success
  const renderSuccessStep = () => (
    <Animated.View 
      style={[getStyles(colors).stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <View style={getStyles(colors).successIcon}>
        <Ionicons name="checkmark-circle" size={80} color={colors.success || '#4CAF50'} />
      </View>
      
      <Text style={getStyles(colors).successTitle}>Password Reset Successful!</Text>
      <Text style={getStyles(colors).stepDescription}>
        Your password has been reset successfully. You can now log in with your new password.
      </Text>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={getStyles(colors).button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={getStyles(colors).buttonText}>Back to Login</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderRequestStep();
      case 2:
        return renderVerifyStep();
      case 3:
        return renderResetStep();
      case 4:
        return renderSuccessStep();
      default:
        return renderRequestStep();
    }
  };

  return (
    <SafeAreaView style={getStyles(colors).container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor="transparent" translucent={false} />
      
      <KeyboardAvoidingView
        style={getStyles(colors).container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={getStyles(colors).scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={getStyles(colors).header}>
            <TouchableOpacity
              style={getStyles(colors).backButton}
              onPress={() => {
                if (currentStep === 1) {
                  navigation.goBack();
                } else if (currentStep === 2) {
                  setCurrentStep(1);
                } else if (currentStep === 3) {
                  setCurrentStep(2);
                } else if (currentStep === 4) {
                  navigation.navigate('Login');
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={getStyles(colors).progressContainer}>
              <View style={[
                getStyles(colors).progressStep,
                currentStep > 1 && getStyles(colors).progressStepCompleted
              ]} />
              <View style={[
                getStyles(colors).progressStep,
                currentStep > 2 && getStyles(colors).progressStepCompleted
              ]} />
              <View style={[
                getStyles(colors).progressStep,
                currentStep > 3 && getStyles(colors).progressStepCompleted
              ]} />
            </View>
          </View>

          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  progressStepCompleted: {
    backgroundColor: colors.primary,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
  passwordVisibilityButton: {
    padding: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 16,
    marginLeft: 4,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  resendText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: colors.textSecondary,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.success || '#4CAF50',
    textAlign: 'center',
    marginBottom: 12,
  },
});

export default ForgotPasswordScreen; 