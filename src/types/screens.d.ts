import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from './navigation';

// Screen Props Types
export type AccountScreenProps = BottomTabScreenProps<TabParamList, 'Account'>;
export type TransactionsScreenProps = BottomTabScreenProps<TabParamList, 'Transactions'>;
export type HomeScreenProps = BottomTabScreenProps<TabParamList, 'Home'>;
export type CommunityScreenProps = BottomTabScreenProps<TabParamList, 'Community'>;
export type ProfileScreenProps = BottomTabScreenProps<TabParamList, 'Profile'>;

// Component Types
declare module '*.js' {
  const Component: React.ComponentType<any>;
  export default Component;
}

declare module '*.jsx' {
  const Component: React.ComponentType<any>;
  export default Component;
}

declare module '*.tsx' {
  const Component: React.ComponentType<any>;
  export default Component;
} 