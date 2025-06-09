import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type TabParamList = {
  Account: undefined;
  Transactions: undefined;
  Home: undefined;
  Community: undefined;
  Profile: undefined;
};

export type CommunityStackParamList = {
  CommunityHome: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  TwoFactorManagement: undefined;
  TwoFactorSetup: undefined;
  TwoFactorChallenge: { email: string };
  ChangePassword: undefined;
  KycVerification: undefined;
  ReferralDashboard: undefined;
  ReferralOnboarding: undefined;
  ReferralSharing: undefined;
  MasterDashboard: undefined;
  About: undefined;
  HelpCenter: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  EmailVerification: undefined;
  TwoFactorChallenge: { email: string };
};

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  CommunityStack: undefined;
  Transfer: undefined;
  Withdraw: undefined;
  NotificationsScreen: undefined;
  DepositStart: undefined;
  DepositInstructions: undefined;
  DepositVerification: undefined;
  DepositComplete: undefined;
  // Community - Separate Navigation System
  // Transfer screen
  // Withdraw screen
  // Notification screens
  // Master Dashboard screen
  // Referral screens
  // KYC screens
  // Deposit screens
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