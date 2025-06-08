import { useState, useCallback, useRef, useEffect } from 'react';
import { DEFAULT_CONFIG } from './types';

/**
 * Custom hook for managing loading states
 * Provides a clean API for handling multiple loading states
 */
const useLoading = (initialConfig = {}) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const timeoutRefs = useRef({});
  const config = { ...DEFAULT_CONFIG, ...initialConfig };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  // Start loading for a specific key
  const startLoading = useCallback((key = 'default', options = {}) => {
    const loadingConfig = { ...config, ...options };
    
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        isLoading: true,
        message: loadingConfig.message,
        ...loadingConfig,
      },
    }));

    // Auto-hide after timeout if specified
    if (loadingConfig.timeout) {
      if (timeoutRefs.current[key]) {
        clearTimeout(timeoutRefs.current[key]);
      }
      
      timeoutRefs.current[key] = setTimeout(() => {
        stopLoading(key);
      }, loadingConfig.timeout);
    }
  }, [config]);

  // Stop loading for a specific key
  const stopLoading = useCallback((key = 'default') => {
    if (timeoutRefs.current[key]) {
      clearTimeout(timeoutRefs.current[key]);
      delete timeoutRefs.current[key];
    }

    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  // Start global loading
  const startGlobalLoading = useCallback((options = {}) => {
    setGlobalLoading(true);
    startLoading('global', options);
  }, [startLoading]);

  // Stop global loading
  const stopGlobalLoading = useCallback(() => {
    setGlobalLoading(false);
    stopLoading('global');
  }, [stopLoading]);

  // Update loading message
  const updateLoadingMessage = useCallback((key = 'default', message) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        message,
      },
    }));
  }, []);

  // Check if any loading is active
  const isAnyLoading = Object.keys(loadingStates).length > 0;

  // Get loading state for a specific key
  const getLoadingState = useCallback((key = 'default') => {
    return loadingStates[key] || { isLoading: false };
  }, [loadingStates]);

  // Clear all loading states
  const clearAllLoading = useCallback(() => {
    Object.keys(timeoutRefs.current).forEach(key => {
      clearTimeout(timeoutRefs.current[key]);
    });
    timeoutRefs.current = {};
    setLoadingStates({});
    setGlobalLoading(false);
  }, []);

  // Async operation wrapper
  const withLoading = useCallback(async (asyncOperation, key = 'default', options = {}) => {
    try {
      startLoading(key, options);
      const result = await asyncOperation();
      return result;
    } catch (error) {
      throw error;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  return {
    // State
    loadingStates,
    globalLoading,
    isAnyLoading,
    
    // Actions
    startLoading,
    stopLoading,
    startGlobalLoading,
    stopGlobalLoading,
    updateLoadingMessage,
    clearAllLoading,
    getLoadingState,
    withLoading,
  };
};

export default useLoading; 