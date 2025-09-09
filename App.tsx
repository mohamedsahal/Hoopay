import React, { useRef } from 'react';

// Initialize React Native compatibility polyfill after React is imported
const { initializeReactNativePolyfill } = require('./src/utils/reactNativePolyfill');

// Initialize polyfill early but after React import
if (typeof global !== 'undefined') {
  // Ensure React is available globally for polyfill
  global.React = React;
  initializeReactNativePolyfill();
}
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import Colors from './src/constants/Colors';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { setNavigator } from './src/services/navigationService';
import LoadingIndicator from './src/components/LoadingIndicator';
import { TabParamList, RootStackParamList, CommunityStackParamList, ProfileStackParamList, AuthStackParamList } from './src/types/navigation';

// Import screens
import AccountScreen from './src/screens/AccountScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import HomeScreen from './src/screens/HomeScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import CommunityRedirectScreen from './src/screens/CommunityRedirectScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

// Import Transfer screen
import TransferScreen from './src/screens/TransferScreen';

// Import Withdraw screen
import WithdrawScreen from './src/screens/WithdrawScreen';

// Import Deposit screens
import DepositStartScreen from './src/screens/Deposit/DepositStartScreen';
import DepositInstructionsScreen from './src/screens/Deposit/DepositInstructionsScreen';
import DepositVerificationScreen from './src/screens/Deposit/DepositVerificationScreen';
import DepositCompleteScreen from './src/screens/Deposit/DepositCompleteScreen';

// Import Two-Factor Authentication screens
import TwoFactorChallengeScreen from './src/screens/Auth/TwoFactorChallengeScreen';
import TwoFactorSetupScreen from './src/screens/TwoFactorSetupScreen';
import TwoFactorManagementScreen from './src/screens/TwoFactorManagementScreen';

// Import Change Password screen
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';

// Import KYC Verification screen
import UnifiedKycScreen from './src/screens/UnifiedKycScreen';

// Import Referral screens
import ReferralDashboardScreen from './src/screens/ReferralDashboardScreen';
import ReferralOnboardingScreen from './src/screens/ReferralOnboardingScreen';
import ReferralSharingScreen from './src/screens/ReferralSharingScreen';

// Import Master Dashboard screen
import MasterDashboardScreen from './src/screens/MasterDashboardScreen';

// Import Discussion screens
import PostDetailScreen from './src/screens/PostDetailScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';

// Import Notification screens
import NotificationsScreen from './src/screens/NotificationsScreen';

// Import About screen
import AboutScreen from './src/screens/AboutScreen';

// Import Help Center screen
import HelpCenterScreen from './src/screens/HelpCenterScreen';

// Import custom components
import TabBar from './src/components/TabBar';
import HomeButton from './src/components/HomeButton';
import CommunityButton from './src/components/CommunityButton';
import NotificationToast from './src/components/NotificationToast';
import ErrorBoundary from './src/components/ErrorBoundary';
import ForceUpdateModal from './src/components/ForceUpdateModal';

// Import hooks
import { useVersionCheck } from './src/hooks/useVersionCheck';

// Create strongly typed navigators
const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const CommunityStack = createNativeStackNavigator<CommunityStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// Custom theme
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
  },
};

// Define icon props type
interface IconProps {
  color: string;
  size: number;
}

// Icon rendering functions
const renderAccountIcon = ({ color, size }: IconProps) => (
  <MaterialIcons name="account-balance" size={size * 1.3} color={color} />
);

const renderTransactionsIcon = ({ color, size }: IconProps) => (
  <MaterialIcons name="swap-horiz" size={size * 1.3} color={color} />
);

const renderCommunityIcon = ({ color, size }: IconProps) => (
  <MaterialIcons name="groups" size={size * 1.3} color={color} />
);

const renderProfileIcon = ({ color, size }: IconProps) => (
  <Ionicons name="person" size={size * 1.3} color={color} />
);

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false,
        animation: 'slide_from_right'
      }}
      initialRouteName="Login"
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <AuthStack.Screen name="TwoFactorChallenge" component={TwoFactorChallengeScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// Community Stack Navigator
function CommunityNavigator() {
  return (
    <CommunityStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: Colors.background }
      }}
    >
      <CommunityStack.Screen 
        name="CommunityHome" 
        component={CommunityScreen}
        options={{
          contentStyle: { backgroundColor: Colors.background }
        }}
      />
      <CommunityStack.Screen 
        name="PostDetail" 
        component={PostDetailScreen}
        options={{
          headerShown: true,
          title: 'Post Details',
          contentStyle: { backgroundColor: Colors.background }
        }}
      />
      <CommunityStack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background }
        }}
      />
    </CommunityStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator
      initialRouteName="ProfileMain"
      screenOptions={{ headerShown: false }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="TwoFactorManagement" component={TwoFactorManagementScreen} />
      <ProfileStack.Screen name="TwoFactorSetup" component={TwoFactorSetupScreen} />
      <ProfileStack.Screen name="TwoFactorChallenge" component={TwoFactorChallengeScreen} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
              <ProfileStack.Screen name="KycVerification" component={UnifiedKycScreen} />
      <ProfileStack.Screen name="ReferralDashboard" component={ReferralDashboardScreen} />
      <ProfileStack.Screen name="ReferralOnboarding" component={ReferralOnboardingScreen} />
      <ProfileStack.Screen name="ReferralSharing" component={ReferralSharingScreen} />
      <ProfileStack.Screen name="MasterDashboard" component={MasterDashboardScreen} />
      <ProfileStack.Screen name="About" component={AboutScreen} />
      <ProfileStack.Screen name="HelpCenter" component={HelpCenterScreen} />
    </ProfileStack.Navigator>
  );
}

// Main Tab Navigator (4 tabs only - no Community)
function MainApp() {
  const handleNotificationPress = (notification: any) => {
    try {
      // Handle notification press by navigating to relevant screen
      console.log('Notification pressed:', notification);
      // Add navigation logic here if needed
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            height: 60,
            backgroundColor: Colors.background,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.text,
        }}
        tabBar={props => <TabBar {...props} />}
      >
        <Tab.Screen 
          name="Community" 
          component={CommunityRedirectScreen} 
          options={{ 
            tabBarIcon: renderCommunityIcon,
          }}
        />
        <Tab.Screen 
          name="Account" 
          component={AccountScreen} 
          options={{ tabBarIcon: renderAccountIcon }}
        />
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ tabBarButton: HomeButton }}
        />
        <Tab.Screen 
          name="Transactions" 
          component={TransactionsScreen} 
          options={{ tabBarIcon: renderTransactionsIcon }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileNavigator} 
          options={{ tabBarIcon: renderProfileIcon }}
        />
      </Tab.Navigator>
      
      {/* Global notification toast */}
      <NotificationToast
        onPress={handleNotificationPress}
        onDismiss={() => {
          try {
            console.log('Notification dismissed');
          } catch (error) {
            console.error('Error dismissing notification:', error);
          }
        }}
      />
    </View>
  );
}

// Root Stack Navigator with Auth Check
function RootNavigator() {
  const { isAuthenticated, isLoading, isFromLogout } = useAuth();
  const { isLoading: themeLoading } = useTheme();
  const [hasSeenOnboarding, setHasSeenOnboarding] = React.useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = React.useState(true);

  // Check if user has seen onboarding before
  React.useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const onboardingComplete = await SecureStore.getItemAsync('onboardingComplete');
        if (onboardingComplete === 'true') {
          setHasSeenOnboarding(true);
        }
        console.log('Onboarding check:', { onboardingComplete, hasSeenOnboarding: onboardingComplete === 'true' });
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Don't crash the app if SecureStore fails - assume first time user
        setHasSeenOnboarding(false);
      } finally {
        setCheckingOnboarding(false);
      }
    }
    
    checkOnboardingStatus();
  }, []);

  // Wait for both auth and theme to load, plus onboarding check
  if (isLoading || themeLoading || checkingOnboarding) {
    return <LoadingIndicator style={{}} color={Colors.primary} />;
  }

  console.log('Navigation state:', { isAuthenticated, isFromLogout, hasSeenOnboarding });

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false,
        animation: 'fade'
      }}
    >
      {!isAuthenticated ? (
        // If user logged out OR has seen onboarding before, go directly to Auth
        isFromLogout || hasSeenOnboarding ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          // Only show onboarding for first-time users
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Auth" component={AuthNavigator} />
          </>
        )
      ) : (
        <>
          <Stack.Screen name="Main" component={MainApp} />
          
          {/* Community - Separate Stack (No main nav) */}
          <Stack.Screen 
            name="CommunityStack" 
            component={CommunityNavigator}
            options={{
              headerShown: false,
              gestureEnabled: true,
              animation: 'fade',
              contentStyle: { backgroundColor: Colors.background }
            }}
          />

          {/* Transfer Screen - Modal Presentation */}
          <Stack.Screen 
            name="Transfer" 
            component={TransferScreen}
            options={{
              presentation: 'modal',
              gestureEnabled: true,
            }}
          />
          
          {/* Withdraw Screen - Modal Presentation */}
          <Stack.Screen 
            name="Withdraw" 
            component={WithdrawScreen}
            options={{
              presentation: 'modal',
              gestureEnabled: true,
            }}
          />
          
          {/* Notification Screen */}
          <Stack.Screen 
            name="NotificationsScreen" 
            component={NotificationsScreen}
            options={{
              gestureEnabled: true,
            }}
          />
          
          {/* Deposit Screens */}
          <Stack.Screen name="DepositStart" component={DepositStartScreen} />
          <Stack.Screen name="DepositInstructions" component={DepositInstructionsScreen} />
          <Stack.Screen name="DepositVerification" component={DepositVerificationScreen} />
          <Stack.Screen name="DepositComplete" component={DepositCompleteScreen} />
          
          {/* KYC Verification - Available from anywhere in the app */}
          <Stack.Screen 
            name="KycVerification" 
            component={UnifiedKycScreen}
            options={{
              gestureEnabled: true,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// App Content Component that can access the theme context
function AppContent() {
  const navigationRef = useRef(null);
  const [navigationReady, setNavigationReady] = React.useState(false);
  
  // Version check hook
  const {
    shouldShowUpdateModal,
    isForceUpdate,
    currentVersion,
    latestVersion,
    storeUrl,
    handleSkipUpdate,
    handleUpdateComplete,
    dismissModal,
  } = useVersionCheck();
  
  // Use theme context with fallback
  let isDarkMode = null;
  try {
    const theme = useTheme();
    isDarkMode = theme?.isDarkMode ?? null;
  } catch (error) {
    console.warn('ThemeContext not available in App, using auto:', error);
    isDarkMode = null; // Will use "auto" as fallback
  }

  const handleNavigationReady = React.useCallback(() => {
    try {
      if (navigationRef.current) {
        setNavigator(navigationRef.current);
        setNavigationReady(true);
        console.log('Navigation is ready');
      }
    } catch (error) {
      console.error('Error setting navigator:', error);
      setNavigationReady(true); // Still allow app to continue
    }
  }, []);

  const handleStateChange = React.useCallback((state: any) => {
    try {
      console.log('Navigation state changed:', state?.routeNames || 'unknown');
    } catch (error) {
      console.error('Error logging navigation state:', error);
    }
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={MyTheme}
      onReady={handleNavigationReady}
      onStateChange={handleStateChange}
      fallback={<LoadingIndicator style={{}} color={Colors.primary} />}
    >
      <RootNavigator />
      <StatusBar 
        style={isDarkMode !== null ? (isDarkMode ? "light" : "dark") : "auto"} 
        backgroundColor="transparent"
        translucent={false}
      />
      
      {/* Force Update Modal */}
      <ForceUpdateModal
        visible={shouldShowUpdateModal}
        currentVersion={currentVersion}
        latestVersion={latestVersion}
        onUpdate={handleUpdateComplete}
        isForceUpdate={isForceUpdate}
      />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AuthProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
} 