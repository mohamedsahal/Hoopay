import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { Svg, Path } from 'react-native-svg';
import { authService } from '../services/auth';
import biometricAuthService from '../services/biometricAuthService';
import referralService from '../services/referralService';

const { width, height } = Dimensions.get('window');

const SignupScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isReferralCodeValid, setIsReferralCodeValid] = useState(null);
  const [referralCodeChecking, setReferralCodeChecking] = useState(false);

  const formRef = useRef(null);

  // Debounced referral code validation
  useEffect(() => {
    if (referralCode.trim() === '') {
      setIsReferralCodeValid(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await validateReferralCode(referralCode);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [referralCode]);

  const validateReferralCode = async (code) => {
    if (!code.trim()) {
      setIsReferralCodeValid(null);
      return;
    }

    setReferralCodeChecking(true);
    try {
      const result = await referralService.checkReferralCode(code);
      // Check the actual validation result from the API, not just if the API call succeeded
      setIsReferralCodeValid(result.success && result.data?.valid === true);
    } catch (error) {
      console.error('Error validating referral code:', error);
      setIsReferralCodeValid(false);
    } finally {
      setReferralCodeChecking(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    try {
      const userData = {
        name,
        email,
        password,
        password_confirmation: confirmPassword,
        referral_code: referralCode,
      };

      console.log('Starting signup process...');
      const response = await authService.register(userData);
      
      if (response.success) {
        if (response.requiresVerification) {
          // Email verification required
          Alert.alert(
            'Registration Successful!',
            'Please check your email for a verification code to complete your registration.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('EmailVerification', { email }),
              },
            ]
          );
        } else {
          // Registration complete, check for biometric setup
          console.log('Registration successful, checking biometric availability...');
          
          try {
            const shouldSetupBiometric = await biometricAuthService.showBiometricSetupPrompt();
            
            if (shouldSetupBiometric) {
              console.log('User chose to enable biometric auth...');
              try {
                await biometricAuthService.enableBiometricAuth({
                  email: email,
                  userId: response.user?.id,
                  token: response.token,
                  authMethod: 'signup',
                });
                
                Alert.alert(
                  'Welcome to Hoopay!',
                  'Your account has been created and biometric authentication has been enabled for secure access.',
                  [
                    {
                      text: 'Get Started',
                      onPress: () => {
                        // Clear the navigation stack and go to main app
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Main' }],
                        });
                      },
                    },
                  ]
                );
              } catch (biometricError) {
                console.log('Biometric setup failed:', biometricError.message);
                // Continue with normal signup even if biometric setup fails
                Alert.alert(
                  'Account Created Successfully!',
                  'Your account has been created. You can enable biometric authentication later in settings.',
                  [
                    {
                      text: 'Continue',
                      onPress: () => {
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Main' }],
                        });
                      },
                    },
                  ]
                );
              }
            } else {
              // User declined biometric setup
              Alert.alert(
                'Welcome to Hoopay!',
                'Your account has been created successfully. You can enable biometric authentication anytime in settings.',
                [
                  {
                    text: 'Get Started',
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                      });
                    },
                  },
                ]
              );
            }
          } catch (biometricPromptError) {
            console.error('Error with biometric prompt:', biometricPromptError);
            // If biometric prompt fails, just continue normally
            Alert.alert(
              'Welcome to Hoopay!',
              'Your account has been created successfully.',
              [
                {
                  text: 'Get Started',
                  onPress: () => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Main' }],
                    });
                  },
                },
              ]
            );
          }
        }
      } else {
        // Registration failed
        Alert.alert(
          'Registration Failed',
          response.message || 'Failed to create account. Please try again.'
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Failed to create account. Please try again.';
      
      // Handle specific error cases
      if (error.message) {
        if (error.message.includes('email')) {
          errorMessage = 'This email is already registered. Please use a different email or try logging in.';
        } else if (error.message.includes('password')) {
          errorMessage = 'Password requirements not met. Please check your password.';
        } else if (error.message.includes('validation')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const renderError = (fieldName) => {
    if (errors[fieldName]) {
      return (
        <Text style={getStyles(colors).errorText}>{errors[fieldName]}</Text>
      );
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={getStyles(colors).container}
    >
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor={colors.background}
        translucent={false}
      />
      <ScrollView
        contentContainerStyle={getStyles(colors).scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={getStyles(colors).header}>
          <Animatable.Text
            animation="fadeIn"
            duration={1000}
            style={getStyles(colors).headerTitle}
          >
            Create Account
          </Animatable.Text>
          <Text style={getStyles(colors).headerSubtitle}>Join Hoopay and start swapping money securely</Text>
        </View>

        <Animatable.View
          ref={formRef}
          animation="fadeInUp"
          duration={800}
          delay={300}
          style={getStyles(colors).formContainer}
        >
          {/* Name Input */}
          <View style={getStyles(colors).inputContainer}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={getStyles(colors).inputIcon}>
              <Path
                d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                fill={colors.textSecondary}
              />
            </Svg>
            <TextInput
              style={[getStyles(colors).input, errors.name && getStyles(colors).inputError]}
              placeholder="Full Name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setErrors((prev) => ({ ...prev, name: null }));
              }}
            />
          </View>
          {renderError('name')}

          {/* Email Input */}
          <View style={getStyles(colors).inputContainer}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={getStyles(colors).inputIcon}>
              <Path
                d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z"
                fill={colors.textSecondary}
              />
            </Svg>
            <TextInput
              style={[getStyles(colors).input, errors.email && getStyles(colors).inputError]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors((prev) => ({ ...prev, email: null }));
              }}
            />
          </View>
          {renderError('email')}

          {/* Password Input */}
          <View style={getStyles(colors).inputContainer}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={getStyles(colors).inputIcon}>
              <Path
                d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z"
                fill={colors.textSecondary}
              />
            </Svg>
            <TextInput
              style={[getStyles(colors).input, errors.password && getStyles(colors).inputError]}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors((prev) => ({ ...prev, password: null }));
              }}
            />
            <TouchableOpacity
              style={getStyles(colors).passwordVisibilityButton}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d={
                    isPasswordVisible
                      ? "M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
                      : "M12 6C15.79 6 19.17 8.13 20.82 12C19.17 15.87 15.79 18 12 18C8.21 18 4.83 15.87 3.18 12C4.83 8.13 8.21 6 12 6ZM12 4C7 4 2.73 7.11 1 12C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12C21.27 7.11 17 4 12 4ZM12 9C13.38 9 14.5 10.12 14.5 11.5C14.5 12.88 13.38 14 12 14C10.62 14 9.5 12.88 9.5 11.5C9.5 10.12 10.62 9 12 9ZM12 7C9.52 7 7.5 9.02 7.5 11.5C7.5 13.98 9.52 16 12 16C14.48 16 16.5 13.98 16.5 11.5C16.5 9.02 14.48 7 12 7Z"
                  }
                  fill={colors.textSecondary}
                />
              </Svg>
            </TouchableOpacity>
          </View>
          {renderError('password')}

          {/* Confirm Password Input */}
          <View style={getStyles(colors).inputContainer}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={getStyles(colors).inputIcon}>
              <Path
                d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z"
                fill={colors.textSecondary}
              />
            </Svg>
            <TextInput
              style={[getStyles(colors).input, errors.confirmPassword && getStyles(colors).inputError]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!isConfirmPasswordVisible}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors((prev) => ({ ...prev, confirmPassword: null }));
              }}
            />
            <TouchableOpacity
              style={getStyles(colors).passwordVisibilityButton}
              onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d={
                    isConfirmPasswordVisible
                      ? "M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
                      : "M12 6C15.79 6 19.17 8.13 20.82 12C19.17 15.87 15.79 18 12 18C8.21 18 4.83 15.87 3.18 12C4.83 8.13 8.21 6 12 6ZM12 4C7 4 2.73 7.11 1 12C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12C21.27 7.11 17 4 12 4ZM12 9C13.38 9 14.5 10.12 14.5 11.5C14.5 12.88 13.38 14 12 14C10.62 14 9.5 12.88 9.5 11.5C9.5 10.12 10.62 9 12 9ZM12 7C9.52 7 7.5 9.02 7.5 11.5C7.5 13.98 9.52 16 12 16C14.48 16 16.5 13.98 16.5 11.5C16.5 9.02 14.48 7 12 7Z"
                  }
                  fill={colors.textSecondary}
                />
              </Svg>
            </TouchableOpacity>
          </View>
          {renderError('confirmPassword')}

          {/* Referral Code Input */}
          <View style={[
            getStyles(colors).inputContainer,
            isReferralCodeValid === true && getStyles(colors).inputValid,
            isReferralCodeValid === false && getStyles(colors).inputError
          ]}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={getStyles(colors).inputIcon}>
              <Path
                d="M9 11.75C8.31 11.75 7.75 12.31 7.75 13C7.75 13.69 8.31 14.25 9 14.25C9.69 14.25 10.25 13.69 10.25 13C10.25 12.31 9.69 11.75 9 11.75ZM15 11.75C14.31 11.75 13.75 12.31 13.75 13C13.75 13.69 14.31 14.25 15 14.25C15.69 14.25 16.25 13.69 16.25 13C16.25 12.31 15.69 11.75 15 11.75ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                fill={colors.textSecondary}
              />
            </Svg>
            <TextInput
              style={getStyles(colors).input}
              placeholder="Referral Code (Optional)"
              placeholderTextColor={colors.textSecondary}
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="characters"
            />
            {referralCodeChecking && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
            )}
            {isReferralCodeValid === true && (
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 8 }}>
                <Path
                  d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"
                  fill="#10B981"
                />
              </Svg>
            )}
            {isReferralCodeValid === false && (
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 8 }}>
                <Path
                  d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                  fill="#EF4444"
                />
              </Svg>
            )}
          </View>
          {isReferralCodeValid === false && referralCode.trim() !== '' && (
            <Text style={getStyles(colors).errorText}>Invalid referral code</Text>
          )}
          {isReferralCodeValid === true && (
            <Text style={getStyles(colors).successText}>Valid referral code! You'll earn rewards when you transact.</Text>
          )}

          <TouchableOpacity
            onPress={handleSignup}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={getStyles(colors).signupButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={getStyles(colors).signupButtonText}>CREATE ACCOUNT</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={getStyles(colors).footer}>
            <Text style={getStyles(colors).footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={getStyles(colors).loginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: colors.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputValid: {
    borderColor: '#10B981',
  },
  successText: {
    color: '#10B981',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 15,
  },
  passwordVisibilityButton: {
    padding: 8,
  },
  signupButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
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
  loginText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 15,
  },
});

export default SignupScreen; 