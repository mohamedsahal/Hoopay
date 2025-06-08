import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';
import DotsLoading from './DotsLoading';

const CommunityDotsLoading = ({ 
  message = 'Loading community...', 
  size = 'large',
  style 
}) => {
  // Use fallback colors if theme context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    colors = Colors;
  }

  const dotSize = size === 'large' ? 12 : size === 'medium' ? 10 : 8;
  const spacing = size === 'large' ? 6 : size === 'medium' ? 5 : 4;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      <DotsLoading 
        size={dotSize} 
        spacing={spacing}
        color={colors.primary}
        animationDuration={500}
      />
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
});

export default CommunityDotsLoading; 