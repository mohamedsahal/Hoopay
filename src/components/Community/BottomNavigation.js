import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';

const BottomNavigation = ({ 
  insets, 
  activeTab, 
  onTabPress 
}) => {
  // Use custom theme context with fallback
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in BottomNavigation, using default colors');
    colors = Colors;
    isDarkMode = false;
  }

  return (
    <View style={[
      styles.bottomNavBar, 
      { 
        backgroundColor: colors.surface,
        paddingBottom: insets.bottom || 10
      }
    ]}>
      <TouchableOpacity 
        style={styles.bottomNavItem}
        onPress={() => onTabPress('feed')}
      >
        <View style={[
          styles.bottomNavIcon,
          activeTab === 'feed' && { backgroundColor: colors.primary + '20' }
        ]}>
          <MaterialIcons 
            name="dynamic-feed" 
            size={24} 
            color={activeTab === 'feed' ? colors.primary : colors.textSecondary}
          />
        </View>
        <Text style={[
          styles.bottomNavLabel,
          { color: activeTab === 'feed' ? colors.primary : colors.textSecondary }
        ]}>
          Feed
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.bottomNavItem}
        onPress={() => onTabPress('people')}
      >
        <View style={[
          styles.bottomNavIcon,
          activeTab === 'people' && { backgroundColor: colors.primary + '20' }
        ]}>
          <MaterialIcons 
            name="groups" 
            size={24} 
            color={activeTab === 'people' ? colors.primary : colors.textSecondary}
          />
        </View>
        <Text style={[
          styles.bottomNavLabel,
          { color: activeTab === 'people' ? colors.primary : colors.textSecondary }
        ]}>
          People
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.bottomNavItem}
        onPress={() => onTabPress('create')}
      >
        <View style={[styles.bottomNavCreateButton, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="add" size={28} color="white" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.bottomNavItem}
        onPress={() => onTabPress('profile')}
      >
        <View style={[
          styles.bottomNavIcon,
          activeTab === 'profile' && { backgroundColor: colors.primary + '20' }
        ]}>
          <Ionicons 
            name="person" 
            size={24} 
            color={activeTab === 'profile' ? colors.primary : colors.textSecondary}
          />
        </View>
        <Text style={[
          styles.bottomNavLabel,
          { color: activeTab === 'profile' ? colors.primary : colors.textSecondary }
        ]}>
          Profile
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.bottomNavItem}
        onPress={() => onTabPress('hoopay')}
      >
        <View style={[styles.bottomNavHoopayButton, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="wallet" size={20} color="white" />
        </View>
        <Text style={[
          styles.bottomNavLabel,
          { color: colors.primary }
        ]}>
          Hoopay
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: '#e4e6ea',
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomNavIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  bottomNavCreateButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomNavHoopayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
};

export default BottomNavigation; 