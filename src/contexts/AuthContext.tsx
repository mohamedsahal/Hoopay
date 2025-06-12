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

// Sanitize user data to ensure it's JSON serializable
const sanitizeUserData = (userData: User | null | undefined): User => {
  try {
    // Handle null or undefined input
    if (!userData || typeof userData !== 'object') {
      console.error('Invalid user data provided to sanitizeUserData:', userData);
      throw new Error('Invalid user data: cannot sanitize null or undefined');
    }

    // Validate essential properties exist
    if (!userData.id || !userData.email) {
      console.error('Missing essential user properties:', userData);
      throw new Error('Invalid user data: missing id or email');
    }

    // Create a clean copy with only serializable data
    const sanitized: User = {
      id: userData.id,
      name: userData.name || '',
      email: userData.email,
      email_verified: userData.email_verified || false,
    };

    // Add other properties that are serializable
    Object.keys(userData).forEach(key => {
      if (key !== 'id' && key !== 'name' && key !== 'email' && key !== 'email_verified') {
        const value = userData[key];
        
        // Only include primitive values and simple objects
        if (value !== null && value !== undefined) {
          const type = typeof value;
          if (type === 'string' || type === 'number' || type === 'boolean') {
            sanitized[key] = value;
          } else if (type === 'object' && !Array.isArray(value)) {
            // For objects, try to serialize them to check if they're valid
            try {
              JSON.stringify(value);
              sanitized[key] = value;
            } catch (e) {
              console.warn(`Skipping non-serializable property: ${key}`);
            }
          } else if (Array.isArray(value)) {
            // For arrays, check if they're serializable
            try {
              JSON.stringify(value);
              sanitized[key] = value;
            } catch (e) {
              console.warn(`Skipping non-serializable array property: ${key}`);
            }
          }
        }
      }
    });

    return sanitized;
  } catch (error) {
    console.error('Error sanitizing user data:', error);
    
    // If we have at least some basic user data, try to create a minimal fallback
    if (userData && userData.id && userData.email) {
      return {
        id: userData.id,
        name: userData.name || '',
        email: userData.email,
        email_verified: userData.email_verified || false,
      };
    }
    
    // If we can't create a fallback, throw the error up
    throw error;
  }
};

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
      // Sanitize user data to ensure it's JSON serializable
      const sanitizedUserData = sanitizeUserData(userData);
      
      await Promise.all([
        SecureStore.setItemAsync('auth_token', newToken),
        SecureStore.setItemAsync('userData', JSON.stringify(sanitizedUserData))
      ]);
      setToken(newToken);
      setUser(sanitizedUserData);
    } catch (error) {
      console.error('Failed to save auth state:', error);
      console.error('User data that failed to serialize:', userData);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const signOut = async () => {
        try {
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('userData');
          
                  // Note: Biometric credentials are preserved during normal logout
        // They will be validated and cleared only if session becomes invalid
        console.log('Logout: Preserving biometric credentials for next login');
          
          // Set flag to indicate user should go to login screen instead of onboarding
          await SecureStore.setItemAsync('skipOnboarding', 'true');
          
          setUser(null);
          setToken(null);
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
        // Sanitize user data to ensure it's JSON serializable
        const sanitizedUserData = sanitizeUserData(userData);
        
        await SecureStore.setItemAsync('userData', JSON.stringify(sanitizedUserData));
        setUser(sanitizedUserData);
      }
    } catch (error) {
      console.error('Failed to update user data:', error);
      console.error('User data that failed to serialize:', userData);
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