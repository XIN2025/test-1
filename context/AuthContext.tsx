import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface AuthUser {
  email: string;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstTimeUser: boolean;
  login: (email: string, name: string, isFirstTime?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  markAsReturningUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage helper functions
const storageHelpers = {
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      // Use localStorage for web instead of SecureStore
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Use localStorage for web instead of SecureStore
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } else {
      return await AsyncStorage.getItem(key);
    }
  },

  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      // Use localStorage for web instead of SecureStore
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // Check for existing session on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await storageHelpers.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Check if this is a first-time user
        const firstTimeFlag = await storageHelpers.getItem(`firstTimeUser:${parsedUser.email}`);
        setIsFirstTimeUser(firstTimeFlag === 'true');
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, name: string, isFirstTime: boolean = false) => {
    try {
      const userData = { email, name };
      await storageHelpers.setItem('user', JSON.stringify(userData));
      setUser(userData);

      // Set first-time user flag if specified
      if (isFirstTime) {
        await storageHelpers.setItem(`firstTimeUser:${email}`, 'true');
        setIsFirstTimeUser(true);
      } else {
        // Check existing flag for returning users
        const firstTimeFlag = await storageHelpers.getItem(`firstTimeUser:${email}`);
        setIsFirstTimeUser(firstTimeFlag === 'true');
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await storageHelpers.removeItem('user');
      setUser(null);
      setIsFirstTimeUser(false);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const markAsReturningUser = async () => {
    try {
      if (user) {
        await storageHelpers.removeItem(`firstTimeUser:${user.email}`);
        setIsFirstTimeUser(false);
      }
    } catch (error) {
      console.error('Error marking as returning user:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isFirstTimeUser,
    login,
    logout,
    markAsReturningUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
