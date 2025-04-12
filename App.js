import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Svg, Path } from 'react-native-svg';
import Colors from './src/constants/Colors';

// Import screens
import AccountScreen from './src/screens/AccountScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import SwapScreen from './src/screens/SwapScreen';
import ReferralScreen from './src/screens/ReferralScreen';
import ReferralDashboard from './src/screens/ReferralDashboard';
import ProfileScreen from './src/screens/ProfileScreen';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

// Import custom components
import TabBar from './src/components/TabBar';
import SwapButton from './src/components/SwapButton';

// Define navigators
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const ReferralStack = createNativeStackNavigator();

// Referral Stack Navigator
function ReferralNavigator() {
  return (
    <ReferralStack.Navigator screenOptions={{ headerShown: false }}>
      <ReferralStack.Screen name="ReferralHome" component={ReferralScreen} />
      <ReferralStack.Screen name="ReferralDashboard" component={ReferralDashboard} />
    </ReferralStack.Navigator>
  );
}

function MainApp() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 0,
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
      }}
      tabBar={props => <TabBar {...props} />}
    >
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 19C4 17.8954 4.89543 17 6 17H18C19.1046 17 20 17.8954 20 19V21H4V19Z"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M12 13C15.3137 13 18 10.3137 18 7C18 3.68629 15.3137 1 12 1C8.68629 1 6 3.68629 6 7C6 10.3137 8.68629 13 12 13Z"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 6H20M4 12H20M4 18H12"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ),
        }}
      />
      <Tab.Screen
        name="Swap"
        component={SwapScreen}
        options={{
          tabBarButton: (props) => <SwapButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Referral"
        component={ReferralNavigator}
        options={{
          tabBarIcon: ({ color }) => (
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M16 2V6M8 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  console.log("Loading Hoopay App");
  
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Main" component={MainApp} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
