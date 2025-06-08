import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import notificationService from '../services/notificationService';

const NotificationItem = ({ 
  notification, 
  onPress, 
  onDelete,
  showDeleteButton = true,
  style = {} 
}) => {
  
  const handleMarkAsRead = async () => {
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    if (onPress) {
      onPress(notification);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.deleteNotification(notification.id);
              if (onDelete) {
                onDelete(notification.id);
              }
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const getIcon = () => {
    return notificationService.getNotificationIcon(notification.type);
  };

  const getColor = () => {
    return notificationService.getNotificationColor(notification);
  };

  const formatTime = (createdAt) => {
    try {
      return notification.created_at_human || 'Just now';
    } catch (error) {
      return 'Just now';
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        !notification.read && styles.unreadContainer,
        style
      ]}
      onPress={handleMarkAsRead}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: getColor() + '20' }]}>
          <Feather 
            name={getIcon()} 
            size={20} 
            color={getColor()} 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            !notification.read && styles.unreadText
          ]}>
            {notification.title}
          </Text>
          
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
          
          <Text style={styles.timestamp}>
            {formatTime(notification.created_at)}
          </Text>
        </View>

        {showDeleteButton && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={16} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
      
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  unreadContainer: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
});

export default NotificationItem; 