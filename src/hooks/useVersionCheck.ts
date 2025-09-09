import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import versionCheckService from '../services/versionCheckService';
import { VERSION_CONFIG } from '../config/versionConfig';

interface VersionCheckState {
  shouldShowUpdateModal: boolean;
  isForceUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  storeUrl: string;
  isLoading: boolean;
  error: string | null;
}

export const useVersionCheck = () => {
  const [state, setState] = useState<VersionCheckState>({
    shouldShowUpdateModal: false,
    isForceUpdate: false,
    currentVersion: '',
    latestVersion: '',
    storeUrl: '',
    isLoading: false,
    error: null,
  });

  const checkForUpdate = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await versionCheckService.checkForUpdate();
      
      setState(prev => ({
        ...prev,
        shouldShowUpdateModal: result.shouldUpdate,
        isForceUpdate: result.isForceUpdate,
        currentVersion: result.currentVersion,
        latestVersion: result.latestVersion,
        storeUrl: result.storeUrl,
        isLoading: false,
      }));

      console.log('✅ Version check completed:', {
        shouldUpdate: result.shouldUpdate,
        isForceUpdate: result.isForceUpdate,
        currentVersion: result.currentVersion,
        latestVersion: result.latestVersion,
      });

    } catch (error) {
      console.error('❌ Version check failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check for updates',
      }));
    }
  }, []);

  const handleSkipUpdate = useCallback(async () => {
    try {
      await versionCheckService.recordSkippedUpdate();
      setState(prev => ({ ...prev, shouldShowUpdateModal: false }));
    } catch (error) {
      console.error('❌ Error recording skipped update:', error);
    }
  }, []);

  const handleUpdateComplete = useCallback(async () => {
    try {
      await versionCheckService.resetSkippedUpdates();
      setState(prev => ({ ...prev, shouldShowUpdateModal: false }));
    } catch (error) {
      console.error('❌ Error resetting skipped updates:', error);
    }
  }, []);

  const dismissModal = useCallback(() => {
    if (!state.isForceUpdate) {
      setState(prev => ({ ...prev, shouldShowUpdateModal: false }));
    }
    // For force updates, modal cannot be dismissed
  }, [state.isForceUpdate]);

  // Check for updates when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Delay the check slightly to avoid interfering with app startup
        setTimeout(() => {
          checkForUpdate();
        }, VERSION_CONFIG.CHECK_DELAY);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial check
    checkForUpdate();

    return () => {
      subscription?.remove();
    };
  }, [checkForUpdate]);

  return {
    ...state,
    checkForUpdate,
    handleSkipUpdate,
    handleUpdateComplete,
    dismissModal,
  };
};
