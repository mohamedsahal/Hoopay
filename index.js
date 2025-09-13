// Silence logs as early as possible in development
if (typeof global !== 'undefined') {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // No-op console methods in dev session (keep errors only)
    const error = console.error;
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.warn = () => {};
    console.error = error;
  }
}

// Import polyfill early
import './src/utils/reactNativePolyfill';

import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';
import App from './App';

// Suppress any remaining framework warnings
LogBox.ignoreAllLogs(true);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
