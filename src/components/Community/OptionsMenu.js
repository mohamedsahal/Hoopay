import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Pressable,
  Animated,
  Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Colors from '../../constants/Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const OptionsMenu = ({ 
  visible, 
  onClose, 
  options = [], 
  triggerRef = null,
  anchorPosition = null 
}) => {
  // Use fallback colors and theme if context is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    console.warn('ThemeContext not available in OptionsMenu, using default colors');
    colors = Colors;
  }

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleOptionPress = (option) => {
    onClose();
    if (option.onPress) {
      // Small delay to allow close animation
      setTimeout(() => option.onPress(), 100);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.menuContainer,
            {
              backgroundColor: colors.surface || '#FFFFFF',
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              // Position the menu based on anchor position if provided
              ...(anchorPosition && {
                position: 'absolute',
                top: Math.min(anchorPosition.y + 10, screenHeight - (options.length * 50 + 40)),
                right: Math.max(15, screenWidth - anchorPosition.x - 150),
              })
            }
          ]}
        >
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === options.length - 1 && styles.lastMenuItem,
                option.destructive && styles.destructiveMenuItem
              ]}
              onPress={() => handleOptionPress(option)}
              activeOpacity={0.7}
            >
              {option.icon && (
                <MaterialIcons 
                  name={option.icon} 
                  size={20} 
                  color={option.destructive ? '#ff4444' : colors.text} 
                  style={styles.menuItemIcon}
                />
              )}
              <Text
                style={[
                  styles.menuItemText,
                  { color: option.destructive ? '#ff4444' : colors.text }
                ]}
              >
                {option.title}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const ThreeDotsMenu = ({ 
  options = [], 
  size = 20, 
  color = '#666',
  style = {},
  currentUser = null,
  itemOwner = null,
  showOnlyForOwner = true
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState(null);
  const [triggerLayout, setTriggerLayout] = useState(null);

  // Only show menu if user owns the content (when showOnlyForOwner is true)
  if (showOnlyForOwner && (!currentUser || !itemOwner || currentUser.id !== itemOwner.id)) {
    return null;
  }

  const handlePress = (event) => {
    // Get the position of the trigger button
    event.currentTarget.measure((x, y, width, height, pageX, pageY) => {
      setAnchorPosition({
        x: pageX,
        y: pageY + height,
        width,
        height
      });
      setMenuVisible(true);
    });
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.dotsButton, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <MaterialIcons name="more-vert" size={size} color={color} />
      </TouchableOpacity>

      <OptionsMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        options={options}
        anchorPosition={anchorPosition}
      />
    </>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 160,
    maxWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  destructiveMenuItem: {
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  dotsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export { OptionsMenu, ThreeDotsMenu };
export default ThreeDotsMenu; 