import VersionCheck from 'react-native-version-check-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VERSION_CONFIG, isVersionBelowCritical } from '../config/versionConfig';

interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  needsUpdate: boolean;
  isForceUpdate: boolean;
  storeUrl: string;
}

interface VersionCheckResult {
  shouldUpdate: boolean;
  isForceUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  storeUrl: string;
}

class VersionCheckService {
  private static instance: VersionCheckService;
  private readonly STORAGE_KEY = 'version_check_preferences';

  private constructor() {}

  public static getInstance(): VersionCheckService {
    if (!VersionCheckService.instance) {
      VersionCheckService.instance = new VersionCheckService();
    }
    return VersionCheckService.instance;
  }

  /**
   * Check if app needs update
   */
  public async checkForUpdate(): Promise<VersionCheckResult> {
    try {
      if (!VERSION_CONFIG.ENABLED) {
        return {
          shouldUpdate: false,
          isForceUpdate: false,
          currentVersion: VersionCheck.getCurrentVersion(),
          latestVersion: VersionCheck.getCurrentVersion(),
          storeUrl: '',
        };
      }

      if (VERSION_CONFIG.DEBUG) {
        console.log('🔍 Checking for app updates...');
      }
      
      // Get current version
      const currentVersion = VersionCheck.getCurrentVersion();
      if (VERSION_CONFIG.DEBUG) {
        console.log('📱 Current version:', currentVersion);
      }

      // Get latest version from store
      const latestVersion = await VersionCheck.getLatestVersion();
      if (VERSION_CONFIG.DEBUG) {
        console.log('🆕 Latest version:', latestVersion);
      }

      // Check if update is needed
      const needsUpdate = VersionCheck.needUpdate();
      if (VERSION_CONFIG.DEBUG) {
        console.log('🔄 Needs update:', needsUpdate);
      }

      if (!needsUpdate) {
        return {
          shouldUpdate: false,
          isForceUpdate: false,
          currentVersion,
          latestVersion,
          storeUrl: '',
        };
      }

      // Determine if this is a force update
      const isForceUpdate = await this.shouldForceUpdate(currentVersion, latestVersion);
      
      // Get store URL
      const storeUrl = await VersionCheck.getStoreUrl();
      if (VERSION_CONFIG.DEBUG) {
        console.log('🏪 Store URL:', storeUrl);
      }

      return {
        shouldUpdate: true,
        isForceUpdate,
        currentVersion,
        latestVersion,
        storeUrl,
      };

    } catch (error) {
      console.error('❌ Error checking for updates:', error);
      
      // Return safe default - don't force update on error
      return {
        shouldUpdate: false,
        isForceUpdate: false,
        currentVersion: VersionCheck.getCurrentVersion(),
        latestVersion: VersionCheck.getCurrentVersion(),
        storeUrl: '',
      };
    }
  }

  /**
   * Determine if this should be a force update
   */
  private async shouldForceUpdate(currentVersion: string, latestVersion: string): Promise<boolean> {
    try {
      // Parse version numbers (assuming semantic versioning)
      const current = this.parseVersion(currentVersion);
      const latest = this.parseVersion(latestVersion);

      // Check if major version difference is significant
      const majorDifference = latest.major - current.major;
      
      if (majorDifference >= VERSION_CONFIG.FORCE_UPDATE_THRESHOLD) {
        if (VERSION_CONFIG.DEBUG) {
          console.log('🚨 Force update required: Major version difference detected');
        }
        return true;
      }

      // Check user preferences for force updates
      const preferences = await this.getUserPreferences();
      
      // If user has been skipping updates for too long, force update
      if (preferences.skippedUpdates >= VERSION_CONFIG.MAX_SKIPPED_UPDATES) {
        if (VERSION_CONFIG.DEBUG) {
          console.log('🚨 Force update required: Too many skipped updates');
        }
        return true;
      }

      // Check if there are critical security updates
      const hasCriticalUpdate = isVersionBelowCritical(currentVersion);
      
      if (hasCriticalUpdate) {
        if (VERSION_CONFIG.DEBUG) {
          console.log('🚨 Force update required: Critical security update');
        }
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ Error determining force update:', error);
      return false; // Default to optional update on error
    }
  }

  /**
   * Parse version string into components
   */
  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  }


  /**
   * Get user preferences for updates
   */
  private async getUserPreferences(): Promise<{
    skippedUpdates: number;
    lastCheckDate: string;
  }> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Error getting user preferences:', error);
    }

    return {
      skippedUpdates: 0,
      lastCheckDate: new Date().toISOString(),
    };
  }

  /**
   * Save user preferences
   */
  private async saveUserPreferences(preferences: {
    skippedUpdates: number;
    lastCheckDate: string;
  }): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('❌ Error saving user preferences:', error);
    }
  }

  /**
   * Record that user skipped an update
   */
  public async recordSkippedUpdate(): Promise<void> {
    try {
      const preferences = await this.getUserPreferences();
      preferences.skippedUpdates += 1;
      preferences.lastCheckDate = new Date().toISOString();
      await this.saveUserPreferences(preferences);
      console.log('📝 Recorded skipped update');
    } catch (error) {
      console.error('❌ Error recording skipped update:', error);
    }
  }

  /**
   * Reset skipped updates count (when user updates)
   */
  public async resetSkippedUpdates(): Promise<void> {
    try {
      const preferences = await this.getUserPreferences();
      preferences.skippedUpdates = 0;
      preferences.lastCheckDate = new Date().toISOString();
      await this.saveUserPreferences(preferences);
      console.log('🔄 Reset skipped updates count');
    } catch (error) {
      console.error('❌ Error resetting skipped updates:', error);
    }
  }

  /**
   * Get version info for display
   */
  public getVersionInfo(): VersionInfo {
    const currentVersion = VersionCheck.getCurrentVersion();
    return {
      currentVersion,
      latestVersion: currentVersion, // Will be updated when checkForUpdate is called
      needsUpdate: false,
      isForceUpdate: false,
      storeUrl: '',
    };
  }
}

export default VersionCheckService.getInstance();
