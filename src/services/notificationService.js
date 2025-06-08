import api from './api';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.listeners = [];
  }

  // Add listener for notification updates
  addListener(listener) {
    this.listeners.push(listener);
  }

  // Remove listener
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener({
          notifications: this.notifications,
          unreadCount: this.unreadCount
        });
      }
    });
  }

  // Get notifications from API
  async getNotifications(page = 1, perPage = 20, onlyUnread = false) {
    try {
      const response = await api.get('/mobile/notifications/', {
        params: {
          page,
          per_page: perPage,
          only_unread: onlyUnread
        }
      });

      if (response.data.success) {
        // If it's the first page, replace the notifications array
        if (page === 1) {
          this.notifications = response.data.data.notifications;
        } else {
          // Otherwise, append to existing notifications
          this.notifications = [...this.notifications, ...response.data.data.notifications];
        }
        
        this.unreadCount = response.data.data.unread_count;
        this.notifyListeners();
        
        return {
          notifications: response.data.data.notifications,
          unreadCount: response.data.data.unread_count,
          totalCount: response.data.data.total_count,
          hasMore: response.data.data.has_more,
          currentPage: response.data.data.current_page
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get notification counts only
  async getCounts() {
    try {
      const response = await api.get('/mobile/notifications/counts');

      if (response.data.success) {
        this.unreadCount = response.data.data.unread_count;
        this.notifyListeners();
        
        return {
          unreadCount: response.data.data.unread_count,
          totalCount: response.data.data.total_count
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch notification counts');
      }
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await api.post(`/mobile/notifications/${notificationId}/mark-read`);

      if (response.data.success) {
        // Update local state
        this.notifications = this.notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        );
        
        this.unreadCount = response.data.data.unread_count;
        this.notifyListeners();
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await api.post('/mobile/notifications/mark-all-read');

      if (response.data.success) {
        // Update local state
        this.notifications = this.notifications.map(notification => 
          ({ ...notification, read: true })
        );
        
        this.unreadCount = 0;
        this.notifyListeners();
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/mobile/notifications/${notificationId}`);

      if (response.data.success) {
        // Update local state
        this.notifications = this.notifications.filter(
          notification => notification.id !== notificationId
        );
        
        this.unreadCount = response.data.data.unread_count;
        this.notifyListeners();
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get notification icon based on type
  getNotificationIcon(type) {
    switch (type) {
      case 'transaction':
        return 'credit-card';
      case 'withdrawal':
        return 'trending-up';
      case 'referral':
        return 'users';
      default:
        return 'bell';
    }
  }

  // Get notification color based on type and status
  getNotificationColor(notification) {
    if (!notification.read) {
      return '#007AFF'; // Blue for unread
    }

    switch (notification.type) {
      case 'transaction':
        if (notification.data?.status === 'completed') {
          return '#34C759'; // Green for successful
        } else if (notification.data?.status === 'failed') {
          return '#FF3B30'; // Red for failed
        }
        return '#FF9500'; // Orange for pending
      case 'withdrawal':
        return notification.title?.includes('Rejected') ? '#FF3B30' : '#34C759';
      case 'referral':
        return '#34C759'; // Green for commission
      default:
        return '#8E8E93'; // Gray for general
    }
  }

  // Clear all local data
  clear() {
    this.notifications = [];
    this.unreadCount = 0;
    this.notifyListeners();
  }

  // Refresh notifications (fetch latest)
  async refresh() {
    try {
      return await this.getNotifications(1, 20);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      throw error;
    }
  }

  // Add a new notification locally (for real-time updates)
  addNotification(notification) {
    this.notifications.unshift(notification);
    if (!notification.read) {
      this.unreadCount += 1;
    }
    this.notifyListeners();
  }

  // Update notification locally
  updateNotification(notificationId, updates) {
    this.notifications = this.notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, ...updates }
        : notification
    );
    this.notifyListeners();
  }
}

// Export singleton instance
export default new NotificationService(); 