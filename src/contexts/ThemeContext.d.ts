import React from 'react';

export interface ThemeContextType {
  isDarkMode: boolean;
  theme: any;
  colors: any;
  toggleTheme: () => void;
  setTheme: (theme: string) => void;
  resetTheme: () => void;
  isLoading: boolean;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }>;
export const useTheme: () => ThemeContextType; 