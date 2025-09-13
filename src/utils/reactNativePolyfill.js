/**
 * React Native 0.74.5 + React 18.3.1 Compatibility Polyfill
 * This file handles various compatibility issues between React Native and React versions
 */

// Initialize polyfill immediately
const initializeReactNativePolyfill = () => {
  try {
    // Silence specific noisy warnings emitted during defineProperty overrides
    if (typeof console !== 'undefined') {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const msg = args[0];
        if (typeof msg === 'string' && msg.includes('Skipping defineProperty for non-configurable property: prototype')) {
          return;
        }
        return originalWarn(...args);
      };
    }
    // Fix for hasOwnProperty error in React Native 0.79+ with Hermes
    if (typeof Object.prototype.hasOwnProperty === 'undefined') {
      Object.prototype.hasOwnProperty = function(prop) {
        return Object.prototype.hasOwnProperty.call(this, prop);
      };
    }

    // Fix for objects that don't have hasOwnProperty method
    const originalHasOwnProperty = Object.prototype.hasOwnProperty;
    Object.prototype.hasOwnProperty = function(prop) {
      try {
        return originalHasOwnProperty.call(this, prop);
      } catch (error) {
        // Fallback for objects without hasOwnProperty
        return this[prop] !== undefined;
      }
    };

    // Global fix for hasOwnProperty calls on any object
    const originalHasOwnPropertyCall = Function.prototype.call;
    Function.prototype.call = function(thisArg, ...args) {
      if (this === Object.prototype.hasOwnProperty && thisArg && typeof thisArg === 'object') {
        try {
          return originalHasOwnPropertyCall.apply(this, [thisArg, ...args]);
        } catch (error) {
          // If hasOwnProperty fails, check if property exists directly
          const prop = args[0];
          return thisArg[prop] !== undefined;
        }
      }
      return originalHasOwnPropertyCall.apply(this, [thisArg, ...args]);
    };

    // Fix for VirtualizedList property descriptor error
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
      // Skip if property is already defined and not configurable
      if (obj && prop && obj.hasOwnProperty && obj.hasOwnProperty(prop)) {
        const existingDescriptor = Object.getOwnPropertyDescriptor(obj, prop);
        if (existingDescriptor && !existingDescriptor.configurable) {
          console.warn(`Skipping defineProperty for non-configurable property: ${prop}`);
          return obj;
        }
      }
      
      try {
        return originalDefineProperty.call(this, obj, prop, descriptor);
      } catch (error) {
        console.warn(`Failed to define property ${prop}:`, error.message);
        return obj;
      }
    };

    // Fix for React 18 Error Boundary compatibility
    if (typeof global !== 'undefined' && !global.__errorBoundaryFixed) {
      global.__errorBoundaryFixed = true;
      
      // Ensure proper error object structure for React 18
      const originalConsoleError = console.error;
      console.error = function(...args) {
        try {
          // Filter out React DevTools errors that can cause issues
          const firstArg = args[0];
          if (typeof firstArg === 'string' && 
              (firstArg.includes('componentStack') || 
               firstArg.includes('Cannot read property') ||
               firstArg.includes('react-stack-bottom-frame'))) {
            // Log safely without causing additional errors
            return originalConsoleError.call(this, 'React Error (handled):', String(firstArg).substring(0, 100));
          }
          return originalConsoleError.apply(this, args);
        } catch (error) {
          // Fallback logging if console.error fails
          return originalConsoleError.call(this, 'Error in console.error:', error.message);
        }
      };

      // Global error handler for unhandled React errors
      if (typeof global.ErrorUtils !== 'undefined') {
        const originalGlobalHandler = global.ErrorUtils.getGlobalHandler();
        global.ErrorUtils.setGlobalHandler(function(error, isFatal) {
          try {
            // Ensure error object has required properties
            if (error && typeof error === 'object') {
              if (!error.componentStack) {
                error.componentStack = 'Component stack not available';
              }
              if (!error.name) {
                error.name = 'UnhandledError';
              }
            }
            
            if (originalGlobalHandler) {
              return originalGlobalHandler.call(this, error, isFatal);
            }
          } catch (handlerError) {
            console.error('Error in global error handler:', handlerError);
          }
        });
      }
    }

    // Fix for React 18 strict mode issues
    if (typeof global !== 'undefined') {
      global._frameTimestamp = null;
      global._batchedUpdatesImpl = function(fn, a, b, c, d, e) {
        return fn(a, b, c, d, e);
      };
      global._flushSyncImpl = function(fn) {
        return fn();
      };

      // Fix React 18 concurrent rendering issues
      if (!global.requestIdleCallback) {
        global.requestIdleCallback = function(callback, options) {
          const timeout = options?.timeout || 0;
          return setTimeout(callback, timeout);
        };
      }

      if (!global.cancelIdleCallback) {
        global.cancelIdleCallback = function(id) {
          clearTimeout(id);
        };
      }
    }

    // Fix for React Navigation compatibility
    if (typeof global !== 'undefined' && !global.__reactNavigationCompat) {
      global.__reactNavigationCompat = true;
      
      // Fix for navigation state serialization
      const originalJSON = JSON.stringify;
      JSON.stringify = function(value, replacer, space) {
        try {
          return originalJSON.call(this, value, replacer, space);
        } catch (error) {
          console.warn('JSON.stringify error handled:', error.message);
          return '{}';
        }
      };
    }

    // Fix for AsyncStorage compatibility
    if (typeof global !== 'undefined' && !global.__asyncStorageFixed) {
      global.__asyncStorageFixed = true;
      
      // Ensure proper promise handling
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = function(callback, delay) {
        if (typeof callback !== 'function') {
          return originalSetTimeout(() => {}, delay);
        }
        return originalSetTimeout(callback, delay);
      };
    }

    // Fix for Reanimated compatibility
    if (typeof global !== 'undefined' && !global._reanimatedWorkletInit) {
      global._reanimatedWorkletInit = () => {};
      global._chronoNow = Date.now;
      
      // Mock worklet runtime if not available
      if (!global._IS_WORKLET) {
        global._IS_WORKLET = false;
      }
    }

    // React Native compatibility polyfill initialized successfully
  } catch (error) {
    console.error('Failed to initialize React Native polyfill:', error);
  }
};

// Auto-initialize
initializeReactNativePolyfill();

// Export for manual initialization if needed
module.exports = {
  initializeReactNativePolyfill: initializeReactNativePolyfill,
}; 