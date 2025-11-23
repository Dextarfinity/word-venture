<template>
  <div class="notification-bell-container">
    <!-- Bell Button -->
    <button 
      class="notification-bell-button" 
      @click="toggleDropdown"
      :class="{ 'has-unread': hasUnread }"
    >
      <ion-icon :icon="notificationsOutline" class="bell-icon"></ion-icon>
      
      <!-- Unread Badge -->
      <span v-if="unreadCount > 0" class="unread-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>

      <!-- Animated Dot for New Notifications -->
      <span v-if="hasUnread" class="notification-dot"></span>
    </button>

    <!-- Dropdown Menu -->
    <transition name="dropdown">
      <div v-if="isDropdownOpen" class="notification-dropdown">
        <!-- Header -->
        <div class="dropdown-header">
          <h3 class="dropdown-title">Notifications</h3>
          <button 
            v-if="hasUnread" 
            class="mark-all-read-btn"
            @click="handleMarkAllAsRead"
          >
            Mark all as read
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="dropdown-loading">
          <ion-spinner name="circular" class="loading-spinner"></ion-spinner>
          <p>Loading notifications...</p>
        </div>

        <!-- Notifications List -->
        <div v-else-if="notifications.length > 0" class="notifications-list">
          <notification-item
            v-for="notification in displayedNotifications"
            :key="notification.id"
            :notification="notification"
            @click="handleNotificationClick"
            @mark-read="handleMarkAsRead"
            @delete="handleDelete"
          />

          <!-- View All Link -->
          <div v-if="notifications.length > maxDisplay" class="view-all-container">
            <button class="view-all-btn" @click="navigateToNotifications">
              View all {{ notifications.length }} notifications
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="dropdown-empty">
          <ion-icon :icon="notificationsOffOutline" class="empty-icon"></ion-icon>
          <p class="empty-text">No notifications</p>
          <p class="empty-subtext">You're all caught up!</p>
        </div>

        <!-- Footer -->
        <div class="dropdown-footer">
          <button class="footer-btn" @click="navigateToNotifications">
            <ion-icon :icon="listOutline" class="footer-icon"></ion-icon>
            View All Notifications
          </button>
        </div>
      </div>
    </transition>

    <!-- Backdrop -->
    <div 
      v-if="isDropdownOpen" 
      class="dropdown-backdrop"
      @click="closeDropdown"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { IonIcon, IonSpinner } from '@ionic/vue';
import {
  notificationsOutline,
  notificationsOffOutline,
  listOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { useNotifications } from '@/composables/useNotifications';
import NotificationItem from './NotificationItem.vue';

// Props
const props = defineProps({
  maxDisplay: {
    type: Number,
    default: 5,
  },
  userType: {
    type: String,
    default: 'student', // 'student' or 'teacher'
  },
});

// Composables
const router = useRouter();
const {
  notifications,
  unreadCount,
  isLoading,
  hasUnread,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  initialize,
} = useNotifications();

// State
const isDropdownOpen = ref(false);

// Computed
const displayedNotifications = computed(() => {
  return notifications.value.slice(0, props.maxDisplay);
});

// Methods
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const handleNotificationClick = async (notification) => {
  // Mark as read if unread
  if (!notification.is_read) {
    await markAsRead(notification.id);
  }

  // Navigate to related content if action_url exists
  if (notification.action_url) {
    router.push(notification.action_url);
  }

  closeDropdown();
};

const handleMarkAsRead = async (notificationId) => {
  await markAsRead(notificationId);
};

const handleMarkAllAsRead = async () => {
  await markAllAsRead();
};

const handleDelete = async (notificationId) => {
  await deleteNotification(notificationId);
};

const navigateToNotifications = () => {
  closeDropdown();
  const route = props.userType === 'teacher' 
    ? '/teacher/notifications' 
    : '/tabs/notifications';
  router.push(route);
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  const container = event.target.closest('.notification-bell-container');
  if (!container && isDropdownOpen.value) {
    closeDropdown();
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  initialize();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.notification-bell-container {
  position: relative;
  display: inline-block;
}

/* Bell Button */
.notification-bell-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-bell-button:hover {
  background: rgba(0, 0, 0, 0.05);
}

.notification-bell-button.has-unread {
  animation: shake 0.5s ease-in-out;
}

.bell-icon {
  font-size: 24px;
  color: #333;
  transition: color 0.3s ease;
}

.notification-bell-button:hover .bell-icon {
  color: #ff8a50;
}

/* Unread Badge */
.unread-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #dc3545;
  color: white;
  font-family: "Jua", cursive;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Animated Notification Dot */
.notification-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: #dc3545;
  border-radius: 50%;
  border: 2px solid white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
  20%, 40%, 60%, 80% { transform: rotate(10deg); }
}

/* Dropdown */
.notification-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 380px;
  max-height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Dropdown Header */
.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.dropdown-title {
  font-family: "Jua", cursive;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.mark-all-read-btn {
  background: none;
  border: none;
  color: #ff8a50;
  font-family: "Jua", cursive;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.mark-all-read-btn:hover {
  color: #ff6b2c;
  text-decoration: underline;
}

/* Loading State */
.dropdown-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  color: #ff8a50;
  margin-bottom: 12px;
}

.dropdown-loading p {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* Notifications List */
.notifications-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
}

.notifications-list::-webkit-scrollbar {
  width: 6px;
}

.notifications-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.notifications-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.notifications-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* View All Container */
.view-all-container {
  padding: 12px 20px;
  border-top: 1px solid #e9ecef;
  text-align: center;
}

.view-all-btn {
  background: none;
  border: none;
  color: #ff8a50;
  font-family: "Jua", cursive;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: color 0.2s ease;
}

.view-all-btn:hover {
  color: #ff6b2c;
  text-decoration: underline;
}

/* Empty State */
.dropdown-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: #ccc;
  margin-bottom: 16px;
}

.empty-text {
  font-family: "Jua", cursive;
  font-size: 16px;
  font-weight: bold;
  color: #666;
  margin: 0 0 8px 0;
}

.empty-subtext {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #999;
  margin: 0;
}

/* Dropdown Footer */
.dropdown-footer {
  padding: 12px 20px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

.footer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: none;
  border: none;
  color: #333;
  font-family: "Jua", cursive;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.footer-btn:hover {
  background: #e9ecef;
}

.footer-icon {
  font-size: 18px;
}

/* Backdrop */
.dropdown-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: transparent;
}

/* Dropdown Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 480px) {
  .notification-dropdown {
    width: 95vw;
    max-width: 380px;
    right: -10px;
  }
}
</style>
