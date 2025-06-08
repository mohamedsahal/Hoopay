import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: { screen?: string } | undefined;
  // Community - Separate Navigation System
  CommunityStack: undefined;
  // Transfer screen
  Transfer: undefined;
  // Withdraw screen
  Withdraw: undefined;
  // Notification screens
  NotificationsScreen: undefined;
  // Master Dashboard screen
  MasterDashboard: undefined;
  // Referral screens
  ReferralDashboard: undefined;
  ReferralOnboarding: undefined;
  // KYC screens
  KycVerification: undefined;
  PersonalInfo: undefined;
  // Deposit screens
  DepositStart: undefined;
  DepositInstructions: undefined;
  DepositVerification: undefined;
  DepositComplete: undefined;
  // Legacy types for backwards compatibility
  Login: undefined;
  Register: undefined;
  Verification: { email: string };
  Home: undefined;
  Signup: undefined;
  EmailVerification: { email: string };
  Account: undefined;
  Transactions: undefined;
  Profile: undefined;
  EditProfile: undefined;
  TwoFactorChallenge: { email: string };
  TwoFactorSetup: undefined;
  TwoFactorManagement: undefined;
  ChangePassword: undefined;
  PostDetail: { postId: number };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type NavigationProps = RootStackScreenProps<keyof RootStackParamList>;