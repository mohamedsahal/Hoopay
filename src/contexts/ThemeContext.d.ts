import React from 'react';

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  isLoading: boolean;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }>;
export const useTheme: () => ThemeContextType; 