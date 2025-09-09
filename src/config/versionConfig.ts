/**
 * Version Check Configuration
 * 
 * This file contains configuration settings for the force update functionality.
 * Update these settings based on your app's requirements.
 */

export const VERSION_CONFIG = {
  // Force update when major version difference is >= this number
  FORCE_UPDATE_THRESHOLD: 2,
  
  // Force update after user skips this many updates
  MAX_SKIPPED_UPDATES: 3,
  
  // Critical version threshold - force update for versions below this
  CRITICAL_VERSION: {
    major: 1,
    minor: 2,
    patch: 0,
  },
  
  // Store URLs (update these with your actual store URLs)
  STORE_URLS: {
    ios: 'https://apps.apple.com/app/hoopay-wallet/id123456789', // Replace with your actual App Store URL
    android: 'https://play.google.com/store/apps/details?id=com.exaliye.HoopayNew',
  },
  
  // Check for updates when app becomes active (in milliseconds)
  CHECK_DELAY: 2000,
  
  // Enable/disable version checking
  ENABLED: true,
  
  // Enable debug logging
  DEBUG: __DEV__,
};

/**
 * Helper function to check if a version is below critical threshold
 */
export const isVersionBelowCritical = (version: string): boolean => {
  const parts = version.split('.').map(Number);
  const current = {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
  
  const critical = VERSION_CONFIG.CRITICAL_VERSION;
  
  if (current.major < critical.major) return true;
  if (current.major === critical.major && current.minor < critical.minor) return true;
  if (
    current.major === critical.major &&
    current.minor === critical.minor &&
    current.patch < critical.patch
  ) return true;
  
  return false;
};

/**
 * Helper function to get store URL for current platform
 */
export const getStoreUrl = (): string => {
  const { Platform } = require('react-native');

  if (Platform.OS === 'ios') {
    return VERSION_CONFIG.STORE_URLS.ios;
  }

  // Default fallback to Android
  return VERSION_CONFIG.STORE_URLS.android;
};
