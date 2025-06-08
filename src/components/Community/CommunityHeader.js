import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';

const CommunityHeader = ({ 
  insets, 
  headerOpacity, 
  activeTab, 
  onSearchPress,
  onPeopleSearchPress 
}) => {
  // Use custom theme context with fallback
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in CommunityHeader, using default colors');
    colors = Colors;
    isDarkMode = false;
  }

  const handleSearchPress = () => {
    if (activeTab === 'people') {
      onPeopleSearchPress();
    } else {
      onSearchPress();
    }
  };

  return (
    <Animated.View style={[
      styles.fbHeader, 
      { 
        backgroundColor: colors.surface,
        paddingTop: insets.top || 20,
        opacity: headerOpacity
      }
    ]}>
      <View style={styles.fbHeaderContent}>
        <Text style={[styles.fbLogo, { color: colors.primary }]}>hoopay</Text>
        <View style={styles.fbHeaderIcons}>
          <TouchableOpacity 
            style={[styles.fbIconButton, { backgroundColor: colors.background }]}
            onPress={handleSearchPress}
          >
            <MaterialIcons name="search" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = {
  fbHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fbHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fbLogo: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  fbHeaderIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  fbIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
};

export default CommunityHeader; 