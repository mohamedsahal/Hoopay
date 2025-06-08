import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { CommonActions } from '@react-navigation/native';
import api from '../services/api';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER_DATA: 'userData',
  USER_EMAIL: 'userEmail',
  BIOMETRIC_ENABLED: 'biometricEnabled'
};

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    authToken: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isFromLogout: false, // Track if user is coming from logout
    error: null
  });

  const setAuthState = useCallback((updates) => {
    setState((prevState) => ({
      ...prevState,
      ...updates,
    }));
  }, []);

  const validateToken = useCallback(async (token) => {
    try {
      await api.get('/api/profile');
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return error.response?.status !== 401;
    }
  }, []);

  const clearAuthData = useCallback(async () => {
    try {
      // Use SecureStore to delete auth data
      await Promise.all([
        SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS.TOKEN).catch(() => {}),
        SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS.USER_DATA).catch(() => {}),
        SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS.USER_EMAIL).catch(() => {}),
        SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS.BIOMETRIC_ENABLED).catch(() => {})
      ]);
      
      setAuthState({
        authToken: null,
        user: null,
        isAuthenticated: false,
        error: null
      });
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw new Error('Failed to clear authentication data');
    }
  }, [setAuthState]);

  const checkAuthState = useCallback(async () => {
    try {
      setAuthState({ isLoading: true, error: null });
      
      const token = await SecureStore.getItemAsync(AUTH_STORAGE_KEYS.TOKEN);
      const userDataString = await SecureStore.getItemAsync(AUTH_STORAGE_KEYS.USER_DATA);
      
      // Check if user recently logged out
      const isFromLogoutFlag = await SecureStore.getItemAsync('isFromLogout');
      const wasFromLogout = isFromLogoutFlag === 'true';
      
      // Clear the logout flag after reading it
      if (wasFromLogout) {
        await SecureStore.deleteItemAsync('isFromLogout');
      }
      
      if (!token || !userDataString) {
        await clearAuthData();
        // Set the logout flag if it was detected
        setAuthState({ isFromLogout: wasFromLogout });
        return;
      }

      const isValid = await validateToken(token);
      if (!isValid) {
        await clearAuthData();
        // Set the logout flag if it was detected
        setAuthState({ isFromLogout: wasFromLogout });
        return;
      }

      const userData = JSON.parse(userDataString);
      setAuthState({
        authToken: token,
        user: userData,
        isAuthenticated: true,
        isFromLogout: false // Reset logout flag when successfully authenticated
      });
    } catch (error) {
      console.error('Error checking auth state:', error);
      await clearAuthData();
    } finally {
      setAuthState({ isLoading: false });
    }
  }, [validateToken, clearAuthData, setAuthState]);

  const login = useCallback(async (token, userData) => {
    try {
      setAuthState({ isLoading: true, error: null });

      // Validate inputs
      if (!token || !userData) {
        throw new Error('Invalid login credentials');
      }

      // Store auth data using SecureStore
      await SecureStore.setItemAsync(AUTH_STORAGE_KEYS.TOKEN, token);
      await SecureStore.setItemAsync(AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      
      // Clear logout flag if it exists
      await SecureStore.deleteItemAsync('isFromLogout').catch(() => {});
      
      // Update auth state and reset isFromLogout flag
      setAuthState({
        authToken: token,
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        isFromLogout: false // Reset logout flag when user logs in
      });

      // Update API client with new token
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Login error:', error);
      setAuthState({
        error: error.message || 'Failed to login',
        isLoading: false
      });
      throw error;
    }
  }, [setAuthState]);

  const logout = useCallback(async (navigation) => {
    try {
      setAuthState({ isLoading: true, error: null });
      
      // Set persistent logout flag BEFORE clearing auth data
      await SecureStore.setItemAsync('isFromLogout', 'true');
      
      // Clear auth data from storage and state
      await clearAuthData();
      
      // Remove token from API client
      delete api.defaults.headers.common['Authorization'];

      // Let the ProfileScreen handle the navigation
      if (navigation) {
        console.log('Navigation will be handled by the calling component');
      } else {
        console.warn('No navigation object provided to logout function');
      }
      
      // Set final state with isFromLogout flag
      setAuthState({
        authToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isFromLogout: true, // Set flag to indicate user just logged out
        error: null
      });
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState({
        error: error.message || 'Failed to logout',
        isLoading: false
      });
      throw error;
    }
  }, [clearAuthData, setAuthState]);

  const updateUser = useCallback(async (userData) => {
    try {
      if (!userData) {
        throw new Error('Invalid user data provided');
      }

      // Update user data in SecureStore
      await SecureStore.setItemAsync(AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      
      // Update auth state with new user data
      setAuthState({
        user: userData,
        error: null
      });

      console.log('User data updated successfully in AuthContext');
      return true;
    } catch (error) {
      console.error('Error updating user data:', error);
      setAuthState({
        error: error.message || 'Failed to update user data'
      });
      throw error;
    }
  }, [setAuthState]);

  const refreshUserData = useCallback(async () => {
    try {
      const userDataString = await SecureStore.getItemAsync(AUTH_STORAGE_KEYS.USER_DATA);
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setAuthState({
          user: userData,
          error: null
        });
        console.log('User data refreshed from storage');
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  }, [setAuthState]);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const value = {
    ...state,
    login,
    logout,
    updateUser,
    refreshUserData,
    checkAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 