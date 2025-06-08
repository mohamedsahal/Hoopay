import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Tab bar constants
export const TAB_BAR_HEIGHT = 70; // Height of the custom tab bar container

/**
 * Hook to get the total safe height needed for bottom padding when using the custom tab bar.
 * This includes the tab bar height + bottom safe area insets (for devices with home indicators).
 * 
 * Usage:
 * ```javascript
 * const tabBarHeight = useTabBarSafeHeight();
 * 
 * // For ScrollView
 * <ScrollView 
 *   contentContainerStyle={{
 *     paddingBottom: tabBarHeight + 20 // Add extra spacing as needed
 *   }}
 * />
 * 
 * // For FlatList
 * <FlatList 
 *   contentContainerStyle={{
 *     paddingBottom: tabBarHeight + 20 // Add extra spacing as needed
 *   }}
 * />
 * ```
 */
export const useTabBarSafeHeight = () => {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom;
};

// Screen dimensions
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

// Common spacing values
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Header heights
export const HEADER_HEIGHT = 60;

export default {
  TAB_BAR_HEIGHT,
  useTabBarSafeHeight,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  SPACING,
  HEADER_HEIGHT,
}; 