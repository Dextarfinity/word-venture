/**
 * ============================================
 * NOTIFICATION COMPOSABLE
 * ============================================
 * Vue 3 composable for real-time notifications
 * Provides reactive state and methods for notification management
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import notificationService from '@/services/notificationService';
import { useAuth } from './services';

export function useNotifications() {
  // State
  const notifications = ref([]);
  const unreadCount = ref(0);
  const isLoading = ref(false);
  const error = ref(null);
  const subscription = ref(null);

  // Auth
  const { profile } = useAuth();

  // Computed
  const hasUnread = computed(() => unreadCount.value > 0);

  const unreadNotifications = computed(() => {
    return notifications.value.filter((n) => !n.is_read);
  });

  const readNotifications = computed(() => {
    return notifications.value.filter((n) => n.is_read);
  });

  const groupedNotifications = computed(() => {
    const grouped = {
      tasks: [],
      announcements: [],
      achievements: [],
      system: [],
      other: [],
    };

    notifications.value.forEach((notification) => {
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

    return grouped;
  });

  // Methods
  const fetchNotifications = async (options = {}) => {
    if (!profile.value?.id) {
      console.warn('⚠️ No user profile available');
      return { success: false, error: 'No user profile' };
    }

    try {
      isLoading.value = true;
      error.value = null;

      const result = await notificationService.getNotifications(
        profile.value.id,
        options
      );

      if (result.success) {
        notifications.value = result.data;
      } else {
        error.value = result.error;
      }

      return result;
    } catch (err) {
      console.error('❌ Error fetching notifications:', err);
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      isLoading.value = false;
    }
  };

  const fetchUnreadCount = async () => {
    if (!profile.value?.id) return;

    try {
      const result = await notificationService.getUnreadCount(profile.value.id);
      if (result.success) {
        unreadCount.value = result.count;
      }
    } catch (err) {
      console.error('❌ Error fetching unread count:', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const result = await notificationService.markAsRead(notificationId);

      if (result.success) {
        // Update local state
        const notification = notifications.value.find(
          (n) => n.id === notificationId
        );
        if (notification) {
          notification.is_read = true;
          notification.read_at = new Date().toISOString();
        }

        // Update unread count
        await fetchUnreadCount();
      }

      return result;
    } catch (err) {
      console.error('❌ Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  };

  const markAllAsRead = async () => {
    if (!profile.value?.id) return;

    try {
      const result = await notificationService.markAllAsRead(profile.value.id);

      if (result.success) {
        // Update local state
        notifications.value.forEach((notification) => {
          notification.is_read = true;
          notification.read_at = new Date().toISOString();
        });

        unreadCount.value = 0;
      }

      return result;
    } catch (err) {
      console.error('❌ Error marking all as read:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const result = await notificationService.deleteNotification(notificationId);

      if (result.success) {
        // Remove from local state
        notifications.value = notifications.value.filter(
          (n) => n.id !== notificationId
        );

        // Update unread count if it was unread
        await fetchUnreadCount();
      }

      return result;
    } catch (err) {
      console.error('❌ Error deleting notification:', err);
      return { success: false, error: err.message };
    }
  };

  const dismissNotification = async (notificationId) => {
    try {
      const result = await notificationService.dismissNotification(notificationId);

      if (result.success) {
        // Update local state
        const notification = notifications.value.find(
          (n) => n.id === notificationId
        );
        if (notification) {
          notification.is_dismissed = true;
        }
      }

      return result;
    } catch (err) {
      console.error('❌ Error dismissing notification:', err);
      return { success: false, error: err.message };
    }
  };

  const handleRealtimeUpdate = (payload) => {
    console.log('🔔 Real-time notification update:', payload);

    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        // Add new notification to the list
        notifications.value.unshift(newRecord);
        unreadCount.value++;
        break;

      case 'UPDATE':
        // Update existing notification
        const updateIndex = notifications.value.findIndex(
          (n) => n.id === newRecord.id
        );
        if (updateIndex !== -1) {
          notifications.value[updateIndex] = newRecord;
        }
        // Recalculate unread count
        fetchUnreadCount();
        break;

      case 'DELETE':
        // Remove notification from list
        notifications.value = notifications.value.filter(
          (n) => n.id !== oldRecord.id
        );
        // Recalculate unread count
        fetchUnreadCount();
        break;
    }
  };

  const subscribeToRealtime = () => {
    if (!profile.value?.id) {
      console.warn('⚠️ No user profile for realtime subscription');
      return;
    }

    console.log('🔔 Subscribing to real-time notifications...');

    subscription.value = notificationService.subscribeToNotifications(
      profile.value.id,
      handleRealtimeUpdate
    );
  };

  const unsubscribeFromRealtime = async () => {
    if (subscription.value) {
      console.log('🔕 Unsubscribing from real-time notifications...');
      subscription.value.unsubscribe();
      subscription.value = null;
    }
  };

  const initialize = async () => {
    if (!profile.value?.id) {
      console.warn('⚠️ Cannot initialize notifications without user profile');
      return;
    }

    console.log('🔔 Initializing notification system...');

    // Fetch initial data
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);

    // Subscribe to real-time updates
    subscribeToRealtime();

    console.log('✅ Notification system initialized');
  };

  const refresh = async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  };

  // Lifecycle hooks
  onMounted(() => {
    if (profile.value?.id) {
      initialize();
    }
  });

  onBeforeUnmount(() => {
    unsubscribeFromRealtime();
  });

  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    error,

    // Computed
    hasUnread,
    unreadNotifications,
    readNotifications,
    groupedNotifications,

    // Methods
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    dismissNotification,
    subscribeToRealtime,
    unsubscribeFromRealtime,
    initialize,
    refresh,
  };
}
