import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../../services/auth';
import biometricAuthService from '../../services/biometricAuthService';
import BiometricButton from '../../components/BiometricButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../constants/Colors';
import { RootStackScreenProps } from '../../types/navigation';

const LoginScreen: React.FC<RootStackScreenProps<'Login'>> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showBiometricButton, setShowBiometricButton] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const { login } = useAuth();

  // Use theme context with fallback
  let colors, isDarkMode;
  try {
    const theme = useTheme() as any; // Type assertion for theme context
    colors = theme.colors || theme.theme || Colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in LoginScreen, using default colors');
    colors = Colors;
    isDarkMode = false;
  }

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const { available } = await biometricAuthService.isBiometricAvailable();
      const isEnabled = await biometricAuthService.isBiometricEnabled();
      
      setBiometricAvailable(available);
      setShowBiometricButton(available && isEnabled);
      
      console.log('Biometric availability:', { available, isEnabled });
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
      setShowBiometricButton(false);
    }
  };

  const handleBiometricLogin = async (passedResult?: any) => {
    try {
      console.log('🚨🚨🚨 HANDLEBIOMETRICLOGIN CALLED - NEW VERSION 🚨🚨🚨');
      console.log('Passed result type:', typeof passedResult);
      setBiometricLoading(true);
      // Use passed result from BiometricButton if available, otherwise call service
      const result = passedResult || await biometricAuthService.quickBiometricLogin();
      
      if (result.success && result.userCredentials) {
        // DIRECT APPROACH: Bypass AuthService entirely for biometric auth
        console.log('Using direct biometric authentication...');
        
        const localUserData = result.userCredentials.localUserData;
        
        if (!localUserData || !localUserData.id || !localUserData.email) {
          throw new Error('Invalid biometric credentials. Please log in with your password.');
        }
        
        // Create a clean user object directly - no sanitization needed since we control the structure
        const directUser = {
          id: Number(localUserData.id),
          name: String(localUserData.name || ''),
          email: String(localUserData.email),
          email_verified: true,
          is_verified: true,
          referral_code: '',
          phone: localUserData.phone ? String(localUserData.phone) : undefined
        };
        
        console.log('Direct user object created:', directUser);
        console.log('User ID type:', typeof directUser.id);
        console.log('User email type:', typeof directUser.email);
        
        // Verify the object is valid before passing to auth context
        if (!directUser.id || !directUser.email) {
          throw new Error('Failed to create valid user object from biometric data');
        }
        
        // Store the session token if available
        const token = result.userCredentials.sessionToken || '';
        if (token) {
          await authService.setAuthToken(token);
        }
        
        console.log('About to call auth context login with direct user');
        
        // Update auth context with the direct user object
        console.log('🔥 CALLING LOGIN WITH DIRECT USER - FINAL CHECK:');
        console.log('🔥 Direct user before login call:', JSON.stringify(directUser));
        console.log('🔥 User is undefined?', directUser === undefined);
        console.log('🔥 User is null?', directUser === null);
        
        await login(token, directUser);
        
        console.log('Biometric authentication completed successfully');
        
        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else if (result.userCredentials && result.userCredentials.password && result.userCredentials.password !== 'session-based') {
        // Traditional biometric auth with real stored password
        const authResponse = await authService.login({
          email: result.userCredentials.email,
          password: result.userCredentials.password
        });

        if (authResponse.success && authResponse.token && authResponse.user) {
          // Update auth context
          await login(authResponse.token, authResponse.user);
          
          // Navigate to main app
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          throw new Error(authResponse.message || 'Authentication failed');
        }
      } else if ((result as any).fallbackToPassword) {
        // User chose to use password instead
        console.log('User chose password fallback');
      } else if ((result as any).requireSetup) {
        // Biometric not set up, show setup option
        showBiometricSetupOption();
      } else {
        throw new Error(result.error || 'Biometric authentication failed');
      }
    } catch (error: any) {
      console.error('Biometric login error:', error);
      Alert.alert(
        'Biometric Login Failed',
        error.message || 'Please try again or use your password',
        [
          { text: 'Use Password', style: 'default' },
          { text: 'Try Again', onPress: handleBiometricLogin }
        ]
      );
    } finally {
      setBiometricLoading(false);
    }
  };

  const showBiometricSetupOption = async () => {
    try {
      const shouldSetup = await biometricAuthService.showBiometricSetupPrompt();
      if (shouldSetup) {
        Alert.alert(
          'Setup Required',
          'Please log in with your password first, then you can enable biometric authentication in the app.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error showing biometric setup option:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login({ email, password });

              if (response.success && response.token && response.user) {
        // Update auth context
        await login(response.token, response.user);
        
        // Update biometric session token if biometric is already enabled
        try {
          const updateResult = await biometricAuthService.updateSessionToken(response.token, email);
          if (updateResult.success) {
            console.log('Biometric session token updated for existing biometric setup');
          }
        } catch (updateError) {
          console.warn('Failed to update biometric session token:', updateError);
        }
        
        // Check if we should offer biometric setup (only if not already enabled)
        const isBiometricEnabled = await biometricAuthService.isBiometricEnabled();
        if (!isBiometricEnabled) {
          await checkAndOfferBiometricSetup({ email, password });
        }
        
        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else if (response.requiresVerification) {
        // Navigate to verification screen
        navigation.navigate('Verification', { email });
      }
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'An error occurred during login'
      );
    } finally {
      setLoading(false);
    }
  };

  const checkAndOfferBiometricSetup = async (credentials: { email: string; password: string }) => {
    try {
      const { available } = await biometricAuthService.isBiometricAvailable();
      const isEnabled = await biometricAuthService.isBiometricEnabled();
      
      // Only offer setup if biometric is available but not enabled
      if (available && !isEnabled) {
        const shouldSetup = await biometricAuthService.showBiometricSetupPrompt();
        
        if (shouldSetup) {
          try {
            const setupResult = await biometricAuthService.enableBiometricAuth(credentials);
            if (setupResult.success) {
              Alert.alert(
                'Success!',
                'Biometric authentication has been enabled. You can now use it to sign in quickly.',
                [{ text: 'Great!' }]
              );
              // Update UI to show biometric button
              setShowBiometricButton(true);
            }
          } catch (setupError: any) {
            console.error('Biometric setup error:', setupError);
            Alert.alert(
              'Setup Failed',
              setupError.message || 'Failed to enable biometric authentication. You can try again later in settings.',
              [{ text: 'OK' }]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error offering biometric setup:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      <Text style={[styles.title, { color: colors.text }]}>Welcome Back!</Text>
      
      {/* Biometric Authentication Section */}
      {showBiometricButton && (
        <View style={styles.biometricSection}>
          <BiometricButton
            onSuccess={handleBiometricLogin}
            onError={(error: any) => {
              console.error('Biometric button error:', error);
              if (!error.fallbackToPassword) {
                Alert.alert('Authentication Error', error.error || 'Biometric authentication failed');
              }
            }}
            onFallback={() => {
              console.log('User chose password fallback');
            }}
            size="large"
            showLabel={true}
            disabled={biometricLoading || loading}
          />
          
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR CONTINUE WITH</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>
        </View>
      )}
      
      <TextInput
        style={[styles.input, { 
          borderColor: colors.border, 
          backgroundColor: colors.surface,
          color: colors.text 
        }]}
        placeholder="Email"
        placeholderTextColor={colors.placeholder}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading && !biometricLoading}
      />
      
      <TextInput
        style={[styles.input, { 
          borderColor: colors.border, 
          backgroundColor: colors.surface,
          color: colors.text 
        }]}
        placeholder="Password"
        placeholderTextColor={colors.placeholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading && !biometricLoading}
      />
      
      <TouchableOpacity
        style={[styles.button, { 
          backgroundColor: (loading || biometricLoading) ? colors.disabled : colors.primary,
          opacity: (loading || biometricLoading) ? 0.6 : 1
        }]}
        onPress={handleLogin}
        disabled={loading || biometricLoading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => navigation.navigate('Register')}
        style={[styles.linkButton, { opacity: (loading || biometricLoading) ? 0.6 : 1 }]}
        disabled={loading || biometricLoading}
      >
        <Text style={[styles.linkText, { color: colors.primary }]}>
          Don't have an account? Sign up
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  biometricSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
  },
});

export default LoginScreen; 