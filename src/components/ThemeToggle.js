import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/Colors';

const ThemeToggle = ({ size = 'medium', showLabel = true, style }) => {
  // Use fallback if theme context is not available
  let isDarkMode, toggleTheme, colors;
  try {
    const theme = useTheme();
    isDarkMode = theme.isDarkMode;
    toggleTheme = theme.toggleTheme;
    colors = theme.colors;
  } catch (error) {
    console.warn('ThemeContext not available in ThemeToggle, using defaults');
    isDarkMode = false;
    toggleTheme = () => {};
    colors = Colors;
  }

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { iconSize: 18, buttonSize: 32 };
      case 'large':
        return { iconSize: 26, buttonSize: 48 };
      default: // medium
        return { iconSize: 22, buttonSize: 40 };
    }
  };

  const { iconSize, buttonSize } = getSizeConfig();

  return (
    <TouchableOpacity
      style={[
        styles.toggleButton,
        {
          width: buttonSize,
          height: buttonSize,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style
      ]}
      onPress={toggleTheme}
      accessibilityLabel={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      accessibilityRole="button"
    >
      <Ionicons
        name={isDarkMode ? 'sunny' : 'moon'}
        size={iconSize}
        color={colors.text}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default ThemeToggle; 