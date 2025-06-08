import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import notificationService from '../services/notificationService';

const { width } = Dimensions.get('window');

const NotificationToast = ({ onPress, onDismiss }) => {
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Listen for new notifications
    const handleNotificationUpdate = (data) => {
      // Show toast for new notifications
      if (data.notifications && data.notifications.length > 0) {
        const latestNotification = data.notifications[0];
        if (latestNotification && !latestNotification.read) {
          showToast(latestNotification);
        }
      }
    };

    notificationService.addListener(handleNotificationUpdate);

    return () => {
      notificationService.removeListener(handleNotificationUpdate);
    };
  }, []);

  const showToast = (newNotification) => {
    setNotification(newNotification);
    setVisible(true);

    // Animate in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      hideToast();
    }, 4000);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setNotification(null);
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  const handlePress = () => {
    if (onPress && notification) {
      onPress(notification);
    }
    hideToast();
  };

  const handleDismiss = () => {
    hideToast();
  };

  const getIcon = () => {
    if (!notification) return 'bell';
    return notificationService.getNotificationIcon(notification.type);
  };

  const getColor = () => {
    if (!notification) return '#007AFF';
    return notificationService.getNotificationColor(notification);
  };

  if (!visible || !notification) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={[styles.iconContainer, { backgroundColor: getColor() + '20' }]}>
          <Feather name={getIcon()} size={20} color={getColor()} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={16} color="#8E8E93" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toastContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#3C3C43',
    lineHeight: 16,
  },
  dismissButton: {
    padding: 4,
  },
});

export default NotificationToast; 