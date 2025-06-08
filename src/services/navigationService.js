// Navigation service for controlling navigation outside of React components
import { CommonActions } from '@react-navigation/native';

// Reference to the navigation object
let _navigator;

// Set the navigator from the NavigationContainer ref
function setNavigator(navigatorRef) {
  _navigator = navigatorRef;
  console.log('Navigator set:', _navigator ? 'Success' : 'Failed');
}

// Navigate directly to the Login screen, bypassing Onboarding
export function navigateToLogin() {
  if (_navigator) {
    // Using the direct screen name rather than going through Auth navigator
    _navigator.dispatch(
      CommonActions.navigate({
        name: 'Auth',
        params: {
          screen: 'Login'
        }
      })
    );
  } else {
    console.warn('Navigator is not set. Cannot navigate to Login.');
  }
}

// Perform a full reset to the Login screen
export function resetToLogin() {
  if (_navigator) {
    // Direct reset to Auth navigator with Login as the initial screen
    _navigator.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Auth',
            params: {
              screen: 'Login'
            }
          }
        ]
      })
    );
  } else {
    console.warn('Navigator is not set. Cannot reset to Login.');
  }
}

// Basic navigation function
function navigate(routeName, params) {
  console.log('Attempting to navigate to:', routeName, 'with params:', params);
  
  if (_navigator) {
    try {
      console.log('Using stored navigator');
      _navigator.navigate(routeName, params);
      return true;
    } catch (error) {
      console.error('Navigation failed with stored navigator:', error);
    }
  } else {
    console.warn('Navigator not available');
  }
  return false;
}

// Navigate to Transfer screen from anywhere in the app
export function navigateToTransfer() {
  console.log('navigateToTransfer called');
  
  // First attempt: Use the stored navigator
  if (navigate('Transfer')) {
    console.log('Navigation successful with stored navigator');
    return;
  }
  
  // If we reach here, navigation failed
  console.error('All navigation attempts failed for Transfer screen');
  
  // Optionally throw an error or show an alert
  throw new Error('Could not navigate to Transfer screen. Please try again.');
}

// Navigate to any screen in the root navigator
export function navigateToScreen(screenName, params = {}) {
  if (_navigator) {
    _navigator.dispatch(
      CommonActions.navigate({
        name: screenName,
        params: params
      })
    );
  } else {
    console.warn('Navigator is not set. Cannot navigate to screen:', screenName);
  }
}

// Helper function to check if navigator is available
function isNavigatorReady() {
  return _navigator !== null && _navigator !== undefined;
}

// Helper function to get current route name
function getCurrentRouteName() {
  if (_navigator) {
    try {
      return _navigator.getCurrentRoute?.name;
    } catch (error) {
      console.warn('Could not get current route name:', error);
    }
  }
  return null;
}

// Export all functions
export default {
  setNavigator,
  navigateToLogin,
  resetToLogin,
  navigateToTransfer,
  navigateToScreen,
  navigate,
  isNavigatorReady,
  getCurrentRouteName,
};
