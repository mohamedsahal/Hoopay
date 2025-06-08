import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { setNavigator } from '../services/navigationService';
import { RootStackParamList } from '../types/navigation';

// Import your screens here
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import VerificationScreen from '../screens/Auth/VerificationScreen';
import HomeScreen from '../screens/HomeScreen';
import TransferScreen from '../screens/TransferScreen';
// Import 2FA screens
import TwoFactorChallengeScreen from '../screens/Auth/TwoFactorChallengeScreen';
import TwoFactorSetupScreen from '../screens/TwoFactorSetupScreen';
import TwoFactorManagementScreen from '../screens/TwoFactorManagementScreen';
// Import Discussion screens
import PostDetailScreen from '../screens/PostDetailScreen';
// Import Notification screens
import NotificationsScreen from '../screens/NotificationsScreen';
// Import Master Dashboard screen
import MasterDashboardScreen from '../screens/MasterDashboardScreen';
// Import Referral screens
import ReferralDashboardScreen from '../screens/ReferralDashboardScreen';
import ReferralOnboardingScreen from '../screens/ReferralOnboardingScreen';
// Import KYC screens
import UnifiedKycScreen from '../screens/UnifiedKycScreen';



const Stack = createNativeStackNavigator<RootStackParamList>();

const MainNavigator = () => {
  return (
    <NavigationContainer
      ref={(navigator: NavigationContainerRef<RootStackParamList> | null) => {
        if (navigator) {
          setNavigator(navigator);
        }
      }}
    >
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false
        }}
      >
        {/* Auth Stack */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />
        
        {/* Two-Factor Authentication Screens */}
        <Stack.Screen name="TwoFactorChallenge" component={TwoFactorChallengeScreen} />
        <Stack.Screen name="TwoFactorSetup" component={TwoFactorSetupScreen} />
        <Stack.Screen name="TwoFactorManagement" component={TwoFactorManagementScreen} />
        

        
        {/* Main App Stack */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Transfer" component={TransferScreen} />
        
        {/* Notification Screens */}
        <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
        

        {/* Referral Screens */}
        <Stack.Screen 
          name="ReferralDashboard" 
          component={ReferralDashboardScreen}
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="ReferralOnboarding" 
          component={ReferralOnboardingScreen}
          options={{
            headerShown: false
          }}
        />
        
        {/* KYC Screens */}
        <Stack.Screen 
          name="KycVerification" 
          component={UnifiedKycScreen}
          options={{
            headerShown: false
          }}
        />

        
        {/* Discussion Screens */}
        <Stack.Screen 
          name="PostDetail" 
          component={PostDetailScreen}
          options={{
            headerShown: true,
            title: 'Post Details'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;