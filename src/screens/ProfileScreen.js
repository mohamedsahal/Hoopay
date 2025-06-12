import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Image,
  Switch,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import LoadingIndicator from '../components/LoadingIndicator';
import { LoadingSkeleton } from '../components/Loading';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { Svg, Path, Circle, Line } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { useTabBarSafeHeight } from '../constants/Layout';
import { authService } from '../services/auth';
import biometricAuthService from '../services/biometricAuthService';
import axios from 'axios';
import { BASE_URL, ENDPOINTS, getHeaders } from '../config/apiConfig';
import { useAuth } from '../contexts/AuthContext';
import { getTokenInfo } from '../utils/jwtUtils';
import profileService from '../services/profileService';
import referralService from '../services/referralService';
import kycService from '../services/kycService';
import * as SecureStore from 'expo-secure-store';
import Colors from '../constants/Colors';
import VerificationBadge from '../components/VerificationBadge';

// We'll use a placeholder instead of a profile image
// const profileImage = require('../assets/images/profile.jpg');

const SettingItem = ({ icon, title, description, hasSwitch, hasBadge, onPress, switchValue, onSwitchChange, colors }) => {
  return (
    <TouchableOpacity 
      style={[getStyles(colors).settingItem, { borderBottomColor: colors?.border }]} 
      onPress={onPress}
      disabled={hasSwitch}
    >
      <View style={getStyles(colors).settingIconContainer}>
        {icon}
      </View>
      <View style={getStyles(colors).settingContent}>
        <Text style={[getStyles(colors).settingTitle, { color: colors?.text }]}>{title}</Text>
        {description && <Text style={[getStyles(colors).settingDescription, { color: colors?.textSecondary }]}>{description}</Text>}
      </View>
      {hasSwitch && (
        <Switch
          trackColor={{ false: colors?.border, true: colors?.primaryLight }}
          thumbColor={switchValue ? colors?.primary : "#f4f3f4"}
          ios_backgroundColor={colors?.border}
          onValueChange={onSwitchChange}
          value={switchValue}
        />
      )}
      {hasBadge && (
        <View style={[getStyles(colors).notificationBadge, { backgroundColor: colors?.error }]}>
          <Text style={getStyles(colors).notificationBadgeText}>2</Text>
        </View>
      )}
      {!hasSwitch && !hasBadge && (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 18l6-6-6-6"
            stroke={colors?.textSecondary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </TouchableOpacity>
  );
};

// Profile Screen Skeleton Components
const ProfileCardSkeleton = ({ colors }) => (
  <View style={[getStyles(colors).profileCard, { backgroundColor: colors.surface }]}>
    <View style={getStyles(colors).profileHeader}>
      <LoadingSkeleton width={120} height={120} borderRadius={60} style={getStyles(colors).skeletonAvatar} />
    </View>
    <LoadingSkeleton width={150} height={24} borderRadius={6} style={getStyles(colors).skeletonProfileName} />
    <LoadingSkeleton width={200} height={16} borderRadius={4} style={getStyles(colors).skeletonProfileEmail} />
    <LoadingSkeleton width={120} height={16} borderRadius={4} style={getStyles(colors).skeletonProfilePhone} />
    <LoadingSkeleton width={100} height={32} borderRadius={16} style={getStyles(colors).skeletonEditButton} />
  </View>
);

const SettingsCardSkeleton = ({ colors, itemCount = 4 }) => (
  <View style={[getStyles(colors).settingsCard, { backgroundColor: colors.surface }]}>
    {[...Array(itemCount)].map((_, index) => (
      <View key={index} style={[getStyles(colors).settingItem, { borderBottomColor: colors.border }]}>
        <LoadingSkeleton width={40} height={40} borderRadius={20} />
        <View style={getStyles(colors).skeletonSettingContent}>
          <LoadingSkeleton width={120} height={16} borderRadius={4} />
          <LoadingSkeleton width={180} height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <LoadingSkeleton width={20} height={20} borderRadius={4} />
      </View>
    ))}
  </View>
);

const ProfileScreenSkeleton = ({ colors }) => (
  <View style={[getStyles(colors).scrollViewContent, { paddingBottom: 20 }]}>
    <ProfileCardSkeleton colors={colors} />
    
    <View style={getStyles(colors).settingsSection}>
      <LoadingSkeleton width={150} height={18} borderRadius={6} style={getStyles(colors).skeletonSectionTitle} />
      <SettingsCardSkeleton colors={colors} itemCount={4} />
    </View>
    
    <View style={getStyles(colors).settingsSection}>
      <LoadingSkeleton width={120} height={18} borderRadius={6} style={getStyles(colors).skeletonSectionTitle} />
      <SettingsCardSkeleton colors={colors} itemCount={3} />
    </View>
    
    <View style={getStyles(colors).settingsSection}>
      <LoadingSkeleton width={100} height={18} borderRadius={6} style={getStyles(colors).skeletonSectionTitle} />
      <SettingsCardSkeleton colors={colors} itemCount={2} />
    </View>
    
    <LoadingSkeleton width="100%" height={56} borderRadius={24} style={getStyles(colors).skeletonLogoutButton} />
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { logout: authLogout } = useAuth(); // Extract logout function from context
  const tabBarHeight = useTabBarSafeHeight();
  
  // Biometric states
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState(null);
  const [securityInfo, setSecurityInfo] = useState(null);
  
  const { authToken } = useAuth();
  const [userData, setUserData] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycPollingInterval, setKycPollingInterval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use theme context
  const { colors, isDarkMode, toggleTheme } = useTheme();
  
  // Handle navigation to edit profile screen
  const handleEditProfile = () => {
    console.log('Navigating to EditProfile screen');
    try {
      // Simple direct navigation within the same stack
      navigation.navigate('EditProfile');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Handle navigation to referral program
  const handleReferralNavigation = async () => {
    // Show loading immediately and navigate to dashboard by default
    // The dashboard will handle checking opt-in status
    navigation.navigate('ReferralDashboard');
  };

  useEffect(() => {
    checkBiometricStatus();
    fetchUserProfile();
    fetchKycStatus();
    
    // Start KYC status polling for real-time updates
    const intervalId = kycService.startKycStatusPolling((statusUpdate) => {
      if (statusUpdate.statusChanged && statusUpdate.newStatus === 'approved') {
        // KYC was just approved, refresh user profile to get updated name
        Alert.alert(
          '🎉 KYC Verification Approved!',
          'Your identity has been verified successfully. Your profile has been updated with your verified name.',
          [{ text: 'OK', onPress: () => fetchUserProfile() }]
        );
        fetchKycStatus(); // Refresh KYC status
      }
    });
    
    setKycPollingInterval(intervalId);
    
    // Cleanup polling on unmount
    return () => {
      if (intervalId) {
        kycService.stopKycStatusPolling(intervalId);
      }
    };
  }, [authToken]);

  // Define KYC steps for completion alert
  const getKycSteps = () => {
    if (!kycStatus?.steps) return [];
    
    return [
      {
        id: 'personal_info',
        title: 'Personal Information',
        tier: 1,
        completed: kycStatus.steps.personal_info?.completed || false
      },
      {
        id: 'identity_document',
        title: 'Identity Document',
        tier: 1,
        completed: kycStatus.steps.identity_document?.completed || false
      },
      {
        id: 'face_verification',
        title: 'Face Verification',
        tier: 1,
        completed: kycStatus.steps.face_verification?.completed || false
      },
      {
        id: 'residential_address',
        title: 'Residential Address',
        tier: 2,
        completed: kycStatus.steps.residential_address?.completed || false
      },
      {
        id: 'bank_statement',
        title: 'Bank Statement',
        tier: 3,
        completed: kycStatus.steps.bank_statement?.completed || false
      },
      {
        id: 'source_of_funds',
        title: 'Source of Funds',
        tier: 3,
        completed: kycStatus.steps.source_of_funds?.completed || false
      }
    ];
  };






  
  // Get the user's email from the stored data
  const getUserEmail = async () => {
    try {
      const userDataStr = await SecureStore.getItemAsync('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        return userData.email;
      }
      return null;
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  };

  const handleBiometricSetupWithStoredCredentials = async (userEmail) => {
    try {
      // Get the current auth token to validate the user session
      const token = await authService.getToken();
      
      if (!token) {
        throw new Error('Authentication session expired. Please log in again.');
      }
      
      // Get complete user data for local storage
      const userDataStr = await SecureStore.getItemAsync('userData');
      const fullUserData = userDataStr ? JSON.parse(userDataStr) : {};
      
      console.log('Full user data for biometric setup:', fullUserData);
      
      // Extract user information with multiple fallbacks
      // Handle nested user object structure
      const userObj = fullUserData.user || fullUserData;
      const userId = userObj.id || userObj.user_id || fullUserData.id || fullUserData.user_id;
      const userName = userObj.name || userObj.username || userObj.first_name || userObj.full_name || fullUserData.name;
      
      // Validate required fields
      if (!userId) {
        throw new Error('Unable to get user ID. Please log in again to enable biometric authentication.');
      }
      
      if (!userName || userName === 'User') {
        console.warn('Generic user name detected, trying to get real name from KYC data');
        // Try to get the actual name from KYC data if available
        try {
          if (kycStatus?.personal_info?.full_name) {
            console.log('Using name from KYC data:', kycStatus.personal_info.full_name);
          }
        } catch (kycError) {
          console.warn('Could not get name from KYC data:', kycError);
        }
      }
      
      // Use authenticated session credentials with complete user data
      const result = await biometricAuthService.enableBiometricAuth({
        email: userEmail,
        password: 'session-validated', // Placeholder since user is already authenticated
        authMethod: 'authenticated-session',
        sessionToken: token, // Pass the current session token for validation
        // Include complete user data for local authentication
        id: userId,
        user_id: userId,
        name: kycStatus?.personal_info?.full_name || userName || 'User',
        username: userObj.username || userObj.name || fullUserData.username,
        phone: userObj.phone || fullUserData.phone
      });
      
      console.log('Extracted user data for biometric setup:', {
        userId: userId,
        userName: userName,
        email: userEmail,
        finalName: kycStatus?.personal_info?.full_name || userName || 'User'
      });
      
      console.log('Biometric setup completed with user data:', {
        id: userId,
        name: kycStatus?.personal_info?.full_name || userName || 'User',
        email: userEmail
      });
      
      if (result.success) {
        setBiometricEnabled(true);
        await checkBiometricStatus(); // Refresh the security info
        Alert.alert(
          'Success!',
          'Biometric authentication has been enabled successfully. You can now use your biometric data to sign in quickly.',
          [{ text: 'OK' }]
        );
      }
    } catch (setupError) {
      console.error('Biometric setup error:', setupError);
      setBiometricEnabled(false);
      
      let errorMessage = 'Failed to enable biometric authentication.';
      if (setupError.message.includes('session expired') || setupError.message.includes('Authentication')) {
        errorMessage = 'Your session has expired. Please log in again to enable biometric authentication.';
      } else if (setupError.message.includes('cancelled')) {
        errorMessage = 'Biometric setup was cancelled.';
      } else if (setupError.message.includes('not available')) {
        errorMessage = 'Biometric authentication is not available on this device.';
      } else if (setupError.message.includes('not enrolled')) {
        errorMessage = 'Please set up biometrics in your device settings first.';
      } else if (setupError.message) {
        errorMessage = setupError.message;
      }
      
      Alert.alert('Setup Failed', errorMessage, [{ text: 'OK' }]);
    }
  };

  const checkBiometricStatus = async () => {
    try {
      const { available } = await biometricAuthService.isBiometricAvailable();
      const isEnabled = await biometricAuthService.isBiometricEnabled();
      const displayName = await biometricAuthService.getBiometricDisplayName();
      const security = await biometricAuthService.getSecurityInfo();
      
      setBiometricAvailable(available);
      setBiometricEnabled(isEnabled);
      setBiometricInfo({ displayName });
      setSecurityInfo(security);
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const handleBiometricToggle = async (value) => {
    try {
      if (value) {
        // Enable biometric authentication
        console.log('Attempting to enable biometric authentication...');
        
        // Get actual user credentials - handle nested structure
        const userEmail = userData?.user?.email || userData?.email;
        
        if (!userEmail) {
          throw new Error('Unable to get user email. Please try logging in again.');
        }
        
                // For biometric setup, we need to get the user's current password
        // Show a simple password confirmation dialog
        Alert.alert(
          'Password Required',
          `To enable biometric authentication for ${userEmail}, we need to verify your identity. This is a one-time setup for security.`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel', 
              onPress: () => setBiometricEnabled(false) 
            },
            {
              text: 'Continue',
              onPress: () => {
                // For security, let's use the stored credentials from the auth service
                // and enhance the biometric service to validate them properly
                handleBiometricSetupWithStoredCredentials(userEmail);
              }
            }
          ]
        );
         return; // Exit early since we handled the setup
      } else {
        // Disable biometric authentication
        Alert.alert(
          'Disable Biometric Authentication',
          `Are you sure you want to disable ${biometricInfo?.displayName || 'biometric'} authentication?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                try {
                  await biometricAuthService.disableBiometricAuth();
                  setBiometricEnabled(false);
                  await checkBiometricStatus(); // Refresh the security info
                  Alert.alert(
                    'Disabled',
                    'Biometric authentication has been disabled.',
                    [{ text: 'OK' }]
                  );
                } catch (error) {
                  console.error('Error disabling biometric auth:', error);
                  Alert.alert(
                    'Error',
                    'Failed to disable biometric authentication. Please try again.',
                    [{ text: 'OK' }]
                  );
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Biometric toggle error:', error);
      
      // Reset the toggle state if enabling failed
      setBiometricEnabled(false);
      
      let errorMessage = 'Failed to update biometric settings. Please try again.';
      
      if (error.message.includes('cancelled')) {
        errorMessage = 'Biometric setup was cancelled. You can try again anytime.';
      } else if (error.message.includes('not available')) {
        errorMessage = 'Biometric authentication is not available on this device.';
      } else if (error.message.includes('not enrolled')) {
        errorMessage = 'Please set up biometrics in your device settings first.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Setup Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  const getBiometricIcon = () => {
    if (!biometricInfo) {
      return (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"
            stroke={Colors.primary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    }

    if (biometricInfo.displayName.toLowerCase().includes('face')) {
      return (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 10C8.45 10 8 9.55 8 9S8.45 8 9 8 10 8.45 10 9 9.55 10 9 10Z"
            fill={Colors.primary}
          />
          <Path
            d="M15 10C14.45 10 14 9.55 14 9S14.45 8 15 8 16 8.45 16 9 15.55 10 15 10Z"
            fill={Colors.primary}
          />
          <Path
            d="M12 17.5C14.33 17.5 16.31 16.04 17 14H7C7.69 16.04 9.67 17.5 12 17.5Z"
            fill={Colors.primary}
          />
          <Path
            d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20Z"
            stroke={Colors.primary}
            strokeWidth="2"
          />
        </Svg>
      );
    } else {
      return (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 1C8.1 1 5 4.1 5 8V10.6C5 14.8 7.2 18.4 10.5 20.4C11 20.7 11.5 20.3 11.5 19.7V19.1C11.5 18.8 11.3 18.6 11 18.4C8.4 16.9 6.5 13.9 6.5 10.6V8C6.5 4.9 8.9 2.5 12 2.5S17.5 4.9 17.5 8V10.6C17.5 13.9 15.6 16.9 13 18.4C12.7 18.6 12.5 18.8 12.5 19.1V19.7C12.5 20.3 13 20.7 13.5 20.4C16.8 18.4 19 14.8 19 10.6V8C19 4.1 15.9 1 12 1Z"
            fill={Colors.primary}
          />
        </Svg>
      );
    }
  };
  
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Show loading while logout is processing
              setLoading(true);
              
              // First use the dedicated mobile auth service to clear local tokens
              await authService.logout();
              
              // Use the context logout to reset authentication state
              // This will set isAuthenticated to false and isFromLogout to true
              // which will trigger the RootNavigator to show Auth without Onboarding
              await authLogout();
              
              // Don't try to navigate manually - let the RootNavigator handle it
              console.log('Logout successful - auth state reset');
            } catch (error) {
              console.error('Logout error:', error);
              setLoading(false);
              
              // Show error to user
              Alert.alert(
                'Logout Error',
                'There was a problem logging out. Please try again.'
              );
            }
          },
        },
      ]
    );
  };
  
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get profile using our improved service
      const profile = await profileService.getUserProfile();
      console.log('Fetched profile successfully:', profile);
      
      // Check for different response formats and extract user data
      if (profile?.data?.user) {
        // Format: { data: { user: {...} } }
        console.log('Using user data from data.user format');
        setUserData(profile.data.user);
      } else if (profile?.user) {
        // Format: { user: {...} }
        console.log('Using user data from user format');
        setUserData(profile.user);
      } else {
        // Direct user object or other format
        console.log('Using direct user data format');
        setUserData(profile);
      }
      
      // Set basic security info
      setSecurityInfo({
        level: 'high',
        description: 'JWT authentication active',
      });
      
      // Try to get token expiry info if possible
      try {
        const tokenExpiryInfo = await checkTokenExpiry();
        if (tokenExpiryInfo) {
          setSecurityInfo({
            level: tokenExpiryInfo.daysRemaining > 5 ? 'high' : 'medium',
            description: `Token valid for ${tokenExpiryInfo.daysRemaining} days`,
            tokenExpiry: tokenExpiryInfo.expiry,
            tokenStatus: tokenExpiryInfo.status,
          });
        }
      } catch (tokenError) {
        console.log('Token expiry check failed, using default security info');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setError(error.message);
      
      // Try to construct minimal profile from the login email
      try {
        const email = await SecureStore.getItemAsync('userEmail');
        if (email) {
          setUserData({
            email: email,
            name: email.split('@')[0], // Use part before @ as name
            isMinimalProfile: true
          });
          setError(null); // Clear error since we have minimal data
        }
      } catch (storageError) {
        console.error('Storage error:', storageError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchKycStatus = async () => {
    try {
      const response = await kycService.getKycStatus();
      if (response.success) {
        setKycStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      // Don't show error for KYC since it's optional
    }
  };
  
  // Check JWT token expiry using safe JWT utilities
  const checkTokenExpiry = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return null;
      
      // Use the safe JWT utilities to get token info
      const tokenInfo = getTokenInfo(token);
      if (!tokenInfo || !tokenInfo.expiryDate) {
        return null;
      }
      
      return {
        expiry: tokenInfo.expiryDate.toLocaleString(),
        status: tokenInfo.isValid ? 'valid' : 'expired',
        daysRemaining: tokenInfo.daysRemaining || 0
      };
    } catch (error) {
      console.error('Token expiry check error:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  };

  const handleUpdateProfile = async (updatedData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await profileService.updateProfile(updatedData);
      setUserData(updatedProfile);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      setError(error.message);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async (preferences) => {
    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await profileService.updateNotificationPreferences(preferences);
      setUserData(updatedProfile);
    } catch (error) {
      setError(error.message);
      Alert.alert('Error', error.message || 'Failed to update notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      await profileService.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
    } catch (error) {
      setError(error.message);
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[getStyles(colors).container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        
        {/* Header */}
        <View style={[getStyles(colors).header, { paddingTop: insets.top || 30, backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
          <Text style={[getStyles(colors).headerTitle, { color: colors.text }]}>Profile</Text>
        </View>
        
        <ScrollView 
          style={[getStyles(colors).scrollView, { backgroundColor: colors.background }]}
          contentContainerStyle={[
            getStyles(colors).scrollViewContent,
            { paddingBottom: tabBarHeight + 20 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <ProfileScreenSkeleton colors={colors} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <View style={[getStyles(colors).centerContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <Text style={[getStyles(colors).errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity 
          style={[getStyles(colors).retryButton, { backgroundColor: colors.primary }]}
          onPress={fetchUserProfile}
        >
          <Text style={getStyles(colors).retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[getStyles(colors).container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[getStyles(colors).header, { paddingTop: insets.top || 30, backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <Text style={[getStyles(colors).headerTitle, { color: colors.text }]}>Profile</Text>
      </View>
      
      <ScrollView 
        style={[getStyles(colors).scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          getStyles(colors).scrollViewContent,
          { paddingBottom: tabBarHeight + 20 } // Tab bar height + extra spacing
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchUserProfile();
              fetchKycStatus();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Card */}
        <View style={[getStyles(colors).profileCard, { backgroundColor: colors.surface }]}>
          <View style={getStyles(colors).profileHeader}>
            <View style={getStyles(colors).profileImageContainer}>
              {(userData?.avatar_url || userData?.photo_url || userData?.avatar) ? (
                <Image 
                  source={{ uri: userData?.avatar_url || userData?.photo_url || userData?.avatar }} 
                  style={getStyles(colors).profileImage}
                  resizeMode="cover" 
                />
              ) : (
                <View style={[getStyles(colors).profileImagePlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={getStyles(colors).profileImagePlaceholderText}>
                    {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {userData?.isDefaultProfile && (
            <View style={[getStyles(colors).defaultProfileBanner, { backgroundColor: colors.warning }]}>
              <Text style={getStyles(colors).defaultProfileText}>Preview Mode</Text>
            </View>
          )}
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[getStyles(colors).profileName, { color: colors.text }]}>{userData?.name || userData?.user?.name || 'User Name'}</Text>
            <View style={{ marginLeft: 8 }}>
            {(() => {
              const userLevel = kycService.getUserVerificationLevel(userData, kycStatus);
              const userStatus = kycService.getUserVerificationStatus(userData, kycStatus);
              console.log('🔍 ProfileScreen VerificationBadge Debug:', {
                userLevel,
                userStatus,
                userData: userData ? 'exists' : 'null',
                kycStatus: kycStatus ? 'exists' : 'null',
                kycStatusDetail: kycStatus
              });
              return (
                <VerificationBadge
                  level={userLevel}
                  status={userStatus}
                  size={22}
                  showText={false}
                  showUpgradePrompt={true}
                  onPress={() => {
                    const shouldPrompt = kycService.shouldPromptKycVerification(userData, kycStatus);
                    const shouldUpgrade = kycService.shouldPromptUpgrade(userData, kycStatus);
                    
                    if (shouldPrompt) {
                      navigation.navigate('KycVerification');
                    } else if (shouldUpgrade) {
                      const currentLevel = kycService.getUserVerificationLevel(userData, kycStatus);
                      const nextLevel = currentLevel === 'basic' ? 'Intermediate' : 'Advanced';
                      Alert.alert(
                        '⬆️ Upgrade Verification',
                        `Upgrade to ${nextLevel} verification for higher transaction limits and premium features.`,
                        [
                          { text: 'Not Now', style: 'cancel' },
                          { text: 'Upgrade', onPress: () => navigation.navigate('KycVerification') }
                        ]
                      );
                    }
                  }}
                />
              );
            })()}
            </View>
          </View>
          <Text style={[getStyles(colors).profileEmail, { color: colors.textSecondary }]}>{userData?.email || userData?.user?.email || 'email@example.com'}</Text>
          <Text style={[getStyles(colors).profilePhone, { color: colors.textSecondary }]}>{userData?.phone || userData?.user?.phone || 'Add phone number'}</Text>
          
          <TouchableOpacity 
            style={[getStyles(colors).editProfileButton, { backgroundColor: colors.primary }]}
            onPress={handleEditProfile}
          >
            <Text style={[getStyles(colors).editProfileText, { color: colors.background }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        {/* Account Settings */}
        <View style={getStyles(colors).settingsSection}>
          <Text style={[getStyles(colors).sectionTitle, { color: colors.text }]}>Account Settings</Text>
          
          <View style={[getStyles(colors).settingsCard, { backgroundColor: colors.surface }]}>
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                    stroke={colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                    stroke={colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="2FA Authentication"
              description="Password, 2FA & Recovery"
              onPress={() => navigation.navigate('TwoFactorManagement')}
              colors={colors}
            />
            
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"
                    stroke={colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle cx="12" cy="12" r="3" stroke={colors.primary} strokeWidth="2" />
                </Svg>
              }
              title="Change Password"
              description="Update your account password"
              onPress={() => navigation.navigate('ChangePassword')}
              colors={colors}
            />
            
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke={kycStatus?.verification_status === 'approved' ? '#4CAF50' : 
                           kycStatus?.verification_status === 'pending' ? '#FF9800' : colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="KYC Verification"
              description={
                kycStatus?.verification_status === 'approved' ? 
                  `Verified • ${kycStatus.verification_level} level` :
                kycStatus?.verification_status === 'pending' ? 
                  'Under review' :
                kycStatus?.completion_percentage > 0 ?
                  `${kycStatus.completion_percentage}% complete` :
                  'Verify your identity & increase limits'
              }
              hasBadge={kycStatus?.verification_status === 'pending'}
              onPress={() => navigation.navigate('KycVerification')}
              colors={colors}
            />
            
            {/* Biometric Authentication Setting */}
            {biometricAvailable && (
              <SettingItem
                icon={getBiometricIcon()}
                title={`${biometricInfo?.displayName || 'Biometric'} Authentication`}
                description={biometricEnabled ? 'Enabled for quick sign in' : 'Enable for quick sign in'}
                hasSwitch={true}
                switchValue={biometricEnabled}
                onSwitchChange={handleBiometricToggle}
                colors={colors}
              />
            )}
            

            
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                    stroke={colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle cx="9" cy="7" r="4" stroke={colors.primary} strokeWidth="2" />
                  <Path d="m22 21-3-3m0 0-3-3m3 3h-6m6 0v-6" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              }
              title="Referral Program"
              description="Invite friends and earn rewards"
              onPress={handleReferralNavigation}
              colors={colors}
            />
            

          </View>
        </View>
        
        {/* App Preferences */}
        <View style={getStyles(colors).settingsSection}>
          <Text style={[getStyles(colors).sectionTitle, { color: colors.text }]}>App Preferences</Text>
          
          <View style={[getStyles(colors).settingsCard, { backgroundColor: colors.surface }]}>
            {/* Dark Mode Toggle */}
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  {isDarkMode ? (
                    <Path
                      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                      stroke={colors.primary}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <>
                      <Circle cx="12" cy="12" r="5" stroke={colors.primary} strokeWidth="2" />
                      <Line x1="12" y1="1" x2="12" y2="3" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
                      <Line x1="12" y1="21" x2="12" y2="23" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
                      <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
                      <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
                      <Line x1="1" y1="12" x2="3" y2="12" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
                      <Line x1="21" y1="12" x2="23" y2="12" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
                      <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
                      <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
                    </>
                  )}
                </Svg>
              }
              title="Dark Mode"
              description={isDarkMode ? "Dark theme enabled" : "Light theme enabled"}
              hasSwitch={true}
              switchValue={isDarkMode}
              onSwitchChange={toggleTheme}
              colors={colors}
            />
            

            

          </View>
        </View>
        
        {/* Help & About */}
        <View style={getStyles(colors).settingsSection}>
          <Text style={[getStyles(colors).sectionTitle, { color: colors.text }]}>Help & About</Text>
          
          <View style={[getStyles(colors).settingsCard, { backgroundColor: colors.surface }]}>
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke={colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M9.09 9.00001C9.3251 8.33167 9.78915 7.76811 10.4 7.40914C11.0108 7.05016 11.7289 6.91891 12.4272 7.03872C13.1255 7.15853 13.7588 7.52154 14.2151 8.06354C14.6713 8.60553 14.9211 9.29153 14.92 10C14.92 12 11.92 13 11.92 13"
                    stroke={colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M12 17H12.01"
                    stroke={colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="Help Center"
              description="Get support and contact us"
              onPress={() => navigation.navigate('HelpCenter')}
              colors={colors}
            />
            
            <SettingItem
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 8v8M8 12h8"
                    stroke={colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="About Hoopay"
              description="Version 1.0.0 • Learn more about our company"
              onPress={() => navigation.navigate('About')}
              colors={colors}
            />
          </View>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={[getStyles(colors).logoutButton, { backgroundColor: colors.error }]}
          onPress={handleLogout}
        >
          <Text style={getStyles(colors).logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    // backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  profileCard: {
    // backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 10,
  },
  profileHeader: {
    marginBottom: 15,
    padding: 5,
    borderRadius: 75,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: colors.surface,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 15,
  },
  profilePhone: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 15,
  },
  editProfileButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  settingsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notificationBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background + '99',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  walletInfoContainer: {
    backgroundColor: colors.primaryLight,
    borderRadius: 15,
    padding: 12,
    marginVertical: 15,
    width: '90%',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  walletLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginVertical: 2,
  },
  walletCurrency: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  defaultProfileBanner: {
    backgroundColor: colors.warning,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginBottom: 10,
    alignSelf: 'center',
  },
  defaultProfileText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  skeletonAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  skeletonProfileName: {
    width: 150,
    height: 24,
    borderRadius: 6,
  },
  skeletonProfileEmail: {
    width: 200,
    height: 16,
    borderRadius: 4,
  },
  skeletonProfilePhone: {
    width: 120,
    height: 16,
    borderRadius: 4,
  },
  skeletonEditButton: {
    width: 100,
    height: 32,
    borderRadius: 16,
  },
  skeletonSettingContent: {
    flex: 1,
  },
  skeletonSectionTitle: {
    width: 120,
    height: 18,
    borderRadius: 6,
  },
  skeletonLogoutButton: {
    width: '100%',
    height: 56,
    borderRadius: 24,
  },
});

export default ProfileScreen;