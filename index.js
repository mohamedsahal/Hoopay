import { registerRootComponent } from 'expo';
import App from './App';

// Suppress React Native prototype warnings
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific React Native warnings that don't affect functionality
  const message = args[0];
  if (
    typeof message === 'string' &&
    (
      message.includes('Skipping defineProperty for non-configurable property: prototype') ||
      message.includes('defineProperty for non-configurable property')
    )
  ) {
    return; // Skip these warnings
  }
  // Log all other warnings normally
  originalConsoleWarn.apply(console, args);
};

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
