import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/Colors';

const TabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  
  // Use fallback colors if theme context is not available
  let themeColors;
  try {
    const { colors } = useTheme();
    themeColors = colors;
  } catch (error) {
    console.warn('ThemeContext not available, using default colors');
    themeColors = Colors;
  }

  return (
    <View style={[styles.outerContainer, { 
      paddingBottom: insets.bottom,
      backgroundColor: themeColors.primary 
    }]}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          // Force replacement of Referral with Community
          let label;
          if (route.name === 'Referral') {
            label = 'Community';
          } else {
            label = options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;
          }

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Home tab has a special styling, it's rendered through the HomeButton component
          if (route.name === 'Home') {
            return (
              <View key={index} style={styles.tabItem}>
                {options.tabBarButton ? options.tabBarButton({ onPress }) : null}
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={styles.tabItemContent}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                  {options.tabBarIcon ? 
                    options.tabBarIcon({
                      color: isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                      size: 22,
                    }) : null
                  }
                </View>
                
                {/* Label */}
                <Text
                  style={[
                    styles.tabLabel,
                    { 
                      color: isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                      opacity: isFocused ? 1 : 0.8
                    }
                  ]}
                >
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    flexDirection: 'row',
    height: 70,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconContainer: {
    height: 32,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 5,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default TabBar; 