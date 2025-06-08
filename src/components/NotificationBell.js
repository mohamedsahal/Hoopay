import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import notificationService from '../services/notificationService';

const NotificationBell = ({ 
  onPress, 
  size = 24, 
  color = '#333', 
  showCount = true,
  style = {} 
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [animationValue] = useState(new Animated.Value(1));

  useEffect(() => {
    // Initial count fetch
    loadNotificationCount();

    // Listen for notification updates
    const handleNotificationUpdate = (data) => {
      const newCount = data.unreadCount;
      if (newCount > unreadCount) {
        // Animate bell when new notifications arrive
        animateBell();
      }
      setUnreadCount(newCount);
    };

    notificationService.addListener(handleNotificationUpdate);

    // Cleanup listener on unmount
    return () => {
      notificationService.removeListener(handleNotificationUpdate);
    };
  }, [unreadCount]);

  const loadNotificationCount = async () => {
    try {
      const counts = await notificationService.getCounts();
      setUnreadCount(counts.unreadCount);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const animateBell = () => {
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.View style={[
        styles.bellContainer,
        { transform: [{ scale: animationValue }] }
      ]}>
        <Feather 
          name="bell" 
          size={size} 
          color={color} 
        />
        
        {showCount && unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  bellContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default NotificationBell; 