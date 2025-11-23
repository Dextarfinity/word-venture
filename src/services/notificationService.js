/**
 * ============================================
 * REAL-TIME NOTIFICATION SERVICE
 * ============================================
 * Manages notifications with Supabase Realtime
 * Provides real-time updates for both students and teachers
 */

import supabase from '@/supabase';

class NotificationService {
  constructor() {
    this.realtimeChannel = null;
    this.listeners = new Set();
  }

  /**
   * Subscribe to real-time notification updates
   * @param {string} userId - The user ID to subscribe for
   * @param {Function} callback - Callback function when notifications change
   * @returns {Object} Subscription object with unsubscribe method
   */
  subscribeToNotifications(userId, callback) {
    console.log('🔔 Subscribing to real-time notifications for user:', userId);

    // Create a unique channel for this user's notifications
    const channelName = `notifications:${userId}`;

    // Remove existing subscription if any
    if (this.realtimeChannel) {
      console.log('🔄 Removing existing notification subscription');
      this.unsubscribe();
    }

    // Create new channel
    this.realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 Notification change received:', payload);

          // Execute callback with the payload
          if (callback && typeof callback === 'function') {
            callback(payload);
          }

          // Notify all registered listeners
          this.listeners.forEach((listener) => {
            try {
              listener(payload);
            } catch (error) {
              console.error('❌ Error in notification listener:', error);
            }
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Notification subscription status:', status);
      });

    // Return unsubscribe function
    return {
      unsubscribe: () => this.unsubscribe(),
    };
  }

  /**
   * Add a listener for notification changes
   * @param {Function} callback - Callback function
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Unsubscribe from real-time notifications
   */
  async unsubscribe() {
    if (this.realtimeChannel) {
      console.log('🔕 Unsubscribing from notifications');
      await supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  /**
   * Get all notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, offset, unreadOnly)
   * @returns {Promise<Object>} Result with notifications data
   */
  async getNotifications(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, unreadOnly = false } = options;

      let query = supabase
        .from('notifications')
        .select(
          `
          *,
          sender:profiles!sender_id(id, full_name, email)
        `
        )
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching notifications:', error);
        return { success: false, error };
      }

      console.log('✅ Notifications fetched:', data?.length || 0);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Error in getNotifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread notification count
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result with count
   */
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error fetching unread count:', error);
        return { success: false, error, count: 0 };
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('❌ Error in getUnreadCount:', error);
      return { success: false, error: error.message, count: 0 };
    }
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Result object
   */
  async markAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select();

      if (error) {
        console.error('❌ Error marking notification as read:', error);
        return { success: false, error };
      }

      console.log('✅ Notification marked as read:', notificationId);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in markAsRead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result object
   */
  async markAllAsRead(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error marking all notifications as read:', error);
        return { success: false, error };
      }

      console.log('✅ All notifications marked as read');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in markAllAsRead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete/dismiss a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Result object
   */
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Error deleting notification:', error);
        return { success: false, error };
      }

      console.log('✅ Notification deleted:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error in deleteNotification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dismiss a notification (soft delete)
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Result object
   */
  async dismissNotification(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_dismissed: true })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Error dismissing notification:', error);
        return { success: false, error };
      }

      console.log('✅ Notification dismissed:', notificationId);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in dismissNotification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Result object
   */
  async createNotification(notificationData) {
    try {
      const {
        recipientId,
        senderId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        priority = 'normal',
        actionUrl,
        metadata,
      } = notificationData;

      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            recipient_id: recipientId,
            sender_id: senderId,
            type,
            title,
            message,
            related_id: relatedId,
            related_type: relatedType,
            priority,
            action_url: actionUrl,
            metadata,
          },
        ])
        .select();

      if (error) {
        console.error('❌ Error creating notification:', error);
        return { success: false, error };
      }

      console.log('✅ Notification created:', data[0]);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('❌ Error in createNotification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notifications grouped by type
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result with grouped notifications
   */
  async getGroupedNotifications(userId) {
    try {
      const result = await this.getNotifications(userId);

      if (!result.success) {
        return result;
      }

      const grouped = {
        tasks: [],
        announcements: [],
        achievements: [],
        system: [],
        other: [],
      };

      result.data.forEach((notification) => {
        const type = notification.type.toLowerCase();

        if (type.includes('task')) {
          grouped.tasks.push(notification);
        } else if (type.includes('announcement')) {
          grouped.announcements.push(notification);
        } else if (type.includes('achievement')) {
          grouped.achievements.push(notification);
        } else if (type.includes('system')) {
          grouped.system.push(notification);
        } else {
          grouped.other.push(notification);
        }
      });

      return { success: true, data: grouped };
    } catch (error) {
      console.error('❌ Error in getGroupedNotifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notification statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result with statistics
   */
  async getNotificationStats(userId) {
    try {
      const [allResult, unreadResult] = await Promise.all([
        this.getNotifications(userId),
        this.getUnreadCount(userId),
      ]);

      if (!allResult.success || !unreadResult.success) {
        return { success: false, error: 'Failed to fetch notification stats' };
      }

      const stats = {
        total: allResult.data.length,
        unread: unreadResult.count,
        read: allResult.data.filter((n) => n.is_read).length,
        byType: {},
        byPriority: {},
      };

      // Count by type
      allResult.data.forEach((notification) => {
        const type = notification.type;
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        const priority = notification.priority;
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
      });

      return { success: true, data: stats };
    } catch (error) {
      console.error('❌ Error in getNotificationStats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a test notification (for development/testing)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result object
   */
  async sendTestNotification(userId) {
    return this.createNotification({
      recipientId: userId,
      senderId: null,
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification from the real-time notification system!',
      priority: 'normal',
      actionUrl: '/tabs/notifications',
    });
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
