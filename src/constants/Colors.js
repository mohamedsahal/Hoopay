const lightTheme = {
  primary: '#39B747',          // Green from the tab bar active color
  primaryDark: '#2C8D36',      // Darker shade of primary
  primaryLight: '#A5E8AD',     // Lighter shade of primary
  primaryDisabled: '#B0BEC5',  // Disabled state color
  secondary: '#4A90E2',        // Blue color for accent
  background: '#FFFFFF',       // White background
  surface: '#F9F9F9',          // Light gray for cards/surfaces
  cardBackground: '#FFFFFF',   // Card background color
  text: '#333333',             // Dark gray for text
  textSecondary: '#95a5a6',    // Secondary text color from the tab bar
  textTertiary: '#BDC3C7',     // Tertiary text color
  border: '#E0E0E0',           // Border color
  shadow: '#000000',           // Shadow color for iOS shadows
  error: '#FF6B6B',            // Error color
  errorBackground: '#FFEBEE',  // Light red background for error states
  success: '#39B747',          // Success color (same as primary)
  successBackground: '#E8F5E8', // Light green background for success states
  warning: '#FFBD3D',          // Warning color
  warningBackground: '#FFF8E1', // Light yellow background for warning states
  info: '#4A90E2',             // Info color (same as secondary)
  infoBackground: '#E3F2FD',   // Light blue background for info states
  placeholder: '#BDC3C7',      // Placeholder text color
  tabBarBackground: '#FFFFFF', // Tab bar background
  tabBarBorder: '#E0E0E0',     // Tab bar border
  headerBackground: '#F5F7FA', // Header background
  
  // Social login colors
  google: '#DB4437',           // Google red

  // Gradients
  gradientStart: '#39B747',    // Start color for gradients
  gradientEnd: '#2C8D36',      // End color for gradients
};

const darkTheme = {
  primary: '#4CAF50',          // Slightly lighter green for dark mode
  primaryDark: '#388E3C',      // Darker shade of primary
  primaryLight: '#81C784',     // Lighter shade of primary
  primaryDisabled: '#616161',  // Disabled state color for dark mode
  secondary: '#64B5F6',        // Lighter blue for dark mode
  background: '#121212',       // Dark background
  surface: '#1E1E1E',          // Dark gray for cards/surfaces
  cardBackground: '#2C2C2C',   // Card background color
  text: '#FFFFFF',             // White text for dark mode
  textSecondary: '#B0B0B0',    // Secondary text color for dark mode
  textTertiary: '#757575',     // Tertiary text color for dark mode
  border: '#3C3C3C',           // Border color for dark mode
  shadow: '#000000',           // Shadow color remains black
  error: '#F44336',            // Error color for dark mode
  errorBackground: '#2C1C1C',  // Dark red background for error states
  success: '#4CAF50',          // Success color for dark mode
  successBackground: '#1C2C1C', // Dark green background for success states
  warning: '#FF9800',          // Warning color for dark mode
  warningBackground: '#2C2416', // Dark yellow background for warning states
  info: '#2196F3',             // Info color for dark mode
  infoBackground: '#1A237E',   // Dark blue background for info states
  placeholder: '#757575',      // Placeholder text color for dark mode
  tabBarBackground: '#2C2C2C', // Tab bar background for dark mode
  tabBarBorder: '#3C3C3C',     // Tab bar border for dark mode
  headerBackground: '#1E1E1E', // Header background for dark mode
  
  // Social login colors
  google: '#F44336',           // Lighter red for dark mode

  // Gradients
  gradientStart: '#4CAF50',    // Start color for gradients in dark mode
  gradientEnd: '#388E3C',      // End color for gradients in dark mode
};

// Export themes
export { lightTheme, darkTheme };

// Default export remains for backward compatibility
const Colors = lightTheme;
export default Colors; 