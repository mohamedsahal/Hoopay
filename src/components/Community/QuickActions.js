import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';

const QuickActions = ({ onCreatePost, onFindFriends, onDiscover }) => {
  // Use custom theme context with fallback
  let colors, isDarkMode;
  try {
    const theme = useTheme();
    colors = theme.colors;
    isDarkMode = theme.isDarkMode;
  } catch (error) {
    console.warn('ThemeContext not available in QuickActions, using default colors');
    colors = Colors;
    isDarkMode = false;
  }

  return (
    <View style={[styles.quickActionsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      
      {/* Primary Action - Create Post */}
      <TouchableOpacity 
        style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
        onPress={onCreatePost}
        activeOpacity={0.8}
      >
        <View style={styles.primaryActionIcon}>
          <MaterialIcons name="add" size={26} color="white" />
        </View>
        <View style={styles.primaryActionContent}>
          <Text style={styles.primaryActionText}>Create Post</Text>
          <Text style={styles.primaryActionSubtext}>Share what's on your mind</Text>
        </View>
        <MaterialIcons name="arrow-forward" size={20} color="white" style={styles.primaryActionArrow} />
      </TouchableOpacity>
      
      {/* Secondary Actions */}
      <View style={styles.secondaryActionsContainer}>
        <TouchableOpacity 
          style={[
            styles.secondaryActionButton, 
            { 
              backgroundColor: isDarkMode ? colors.background : colors.surface, 
              borderColor: colors.border 
            }
          ]}
          onPress={onFindFriends}
          activeOpacity={0.8}
        >
          <View style={[styles.secondaryActionIcon, { backgroundColor: colors.primary + '15' }]}>
            <MaterialIcons name="person-add" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.secondaryActionText, { color: colors.text }]}>Find Friends</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.secondaryActionButton, 
            { 
              backgroundColor: isDarkMode ? colors.background : colors.surface, 
              borderColor: colors.border 
            }
          ]}
          onPress={onDiscover}
          activeOpacity={0.8}
        >
          <View style={[styles.secondaryActionIcon, { backgroundColor: colors.primary + '15' }]}>
            <MaterialIcons name="explore" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.secondaryActionText, { color: colors.text }]}>Discover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = {
  quickActionsCard: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'left',
  },
  
  // Primary Action Styles
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  primaryActionContent: {
    flex: 1,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  primaryActionSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  primaryActionArrow: {
    opacity: 0.8,
  },
  
  // Secondary Actions Styles
  secondaryActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
};

export default QuickActions; 