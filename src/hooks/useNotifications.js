import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update state when notification service changes
  useEffect(() => {
    const handleNotificationUpdate = (data) => {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    };

    notificationService.addListener(handleNotificationUpdate);

    // Initial load
    loadNotifications();

    return () => {
      notificationService.removeListener(handleNotificationUpdate);
    };
  }, []);

  const loadNotifications = useCallback(async (page = 1, perPage = 20, onlyUnread = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await notificationService.getNotifications(page, perPage, onlyUnread);
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
      console.error('Error loading notifications:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read');
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      setError(err.message || 'Failed to mark all notifications as read');
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
    } catch (err) {
      setError(err.message || 'Failed to delete notification');
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      await notificationService.refresh();
    } catch (err) {
      setError(err.message || 'Failed to refresh notifications');
      console.error('Error refreshing notifications:', err);
      throw err;
    }
  }, []);

  const getCounts = useCallback(async () => {
    try {
      const counts = await notificationService.getCounts();
      return counts;
    } catch (err) {
      setError(err.message || 'Failed to get notification counts');
      console.error('Error getting notification counts:', err);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    
    // Actions
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    getCounts,
    clearError,
    
    // Utility functions
    getNotificationIcon: notificationService.getNotificationIcon.bind(notificationService),
    getNotificationColor: notificationService.getNotificationColor.bind(notificationService),
  };
}; 