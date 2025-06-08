import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: number;
  name: string;
  email: string;
  email_verified: boolean;
  [key: string]: any; // For other user properties
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isFromLogout: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  saveToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  checkAuthState: () => Promise<boolean>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async (): Promise<void> => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        SecureStore.getItemAsync('auth_token'),
        SecureStore.getItemAsync('userData')
      ]);

      if (storedToken) {
        setToken(storedToken);
      }
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, userData: User): Promise<void> => {
    try {
      await Promise.all([
        SecureStore.setItemAsync('auth_token', newToken),
        SecureStore.setItemAsync('userData', JSON.stringify(userData))
      ]);
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('Failed to save auth state:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const signOut = async () => {
        try {
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('userData');
          
          // Set flag to indicate user should go to login screen instead of onboarding
          await SecureStore.setItemAsync('skipOnboarding', 'true');
          
          setUser(null);
        } catch (error) {
          console.error('Logout error:', error);
        }
      };
      await signOut();
    } catch (error) {
      console.error('Failed to clear auth state:', error);
      throw error;
    }
  };

  const saveToken = async (newToken: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync('auth_token', newToken);
      setToken(newToken);
    } catch (error) {
      console.error('Failed to save auth token:', error);
      throw error;
    }
  };

  const clearToken = async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      setToken(null);
    } catch (error) {
      console.error('Failed to clear auth token:', error);
      throw error;
    }
  };

  // Update user data without changing authentication state
  const updateUser = async (userData: User): Promise<void> => {
    try {
      if (userData) {
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to update user data:', error);
      throw error;
    }
  };

  // Check authentication state (for refresh operations)
  const checkAuthState = async (): Promise<boolean> => {
    try {
      const storedToken = await SecureStore.getItemAsync('auth_token');
      if (!storedToken) {
        return false;
      }
      
      // We have a token, set it in state if it's not already there
      if (!token) {
        setToken(storedToken);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to check auth state:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    isFromLogout: false,
    login,
    logout,
    saveToken,
    clearToken,
    updateUser,
    checkAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 