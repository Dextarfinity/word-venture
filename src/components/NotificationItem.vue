<template>
  <div 
    class="notification-item"
    :class="[
      { 'unread': !notification.is_read },
      `priority-${notification.priority}`,
      `type-${getTypeClass(notification.type)}`
    ]"
  >
    <!-- Left: Icon/Avatar -->
    <div class="notification-icon">
      <div class="icon-wrapper" :style="{ background: getIconColor(notification.type) }">
        <ion-icon :icon="getIcon(notification.type)" class="type-icon"></ion-icon>
      </div>
      <div v-if="!notification.is_read" class="unread-indicator"></div>
    </div>

    <!-- Center: Content -->
    <div class="notification-content" @click="handleClick">
      <div class="notification-header">
        <h4 class="notification-title">{{ notification.title }}</h4>
        <span class="notification-time">{{ formatTimeAgo(notification.created_at) }}</span>
      </div>
      
      <p class="notification-message">{{ notification.message }}</p>

      <!-- Additional Info (for specific types) -->
      <div v-if="notification.metadata" class="notification-metadata">
        <span v-if="notification.metadata.score !== undefined" class="meta-badge score-badge">
          Score: {{ notification.metadata.score }}/{{ notification.metadata.max_score }}
          ({{ notification.metadata.percentage }}%)
        </span>
      </div>

      <!-- Sender Info -->
      <div v-if="notification.sender" class="notification-sender">
        <ion-icon :icon="personCircleOutline" class="sender-icon"></ion-icon>
        <span class="sender-name">{{ notification.sender.full_name || notification.sender.email }}</span>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="notification-actions">
      <!-- Mark as Read/Unread -->
      <button
        v-if="!notification.is_read"
        class="action-btn mark-read-btn"
        @click.stop="$emit('mark-read', notification.id)"
        title="Mark as read"
      >
        <ion-icon :icon="checkmarkCircleOutline" class="action-icon"></ion-icon>
      </button>

      <!-- Delete -->
      <button
        class="action-btn delete-btn"
        @click.stop="handleDelete"
        title="Delete"
      >
        <ion-icon :icon="trashOutline" class="action-icon"></ion-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { IonIcon } from '@ionic/vue';
import {
  checkmarkCircleOutline,
  trashOutline,
  personCircleOutline,
  documentTextOutline,
  megaphoneOutline,
  trophyOutline,
  informationCircleOutline,
  schoolOutline,
  alertCircleOutline,
  checkmarkDoneOutline,
  addCircleOutline,
} from 'ionicons/icons';

// Props
const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
});

// Emits
const emit = defineEmits(['click', 'mark-read', 'delete']);

// Methods
const handleClick = () => {
  emit('click', props.notification);
};

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this notification?')) {
    emit('delete', props.notification.id);
  }
};

const getIcon = (type) => {
  const iconMap = {
    task_assigned: addCircleOutline,
    task_submitted: documentTextOutline,
    task_completed: checkmarkDoneOutline,
    task_graded: schoolOutline,
    announcement: megaphoneOutline,
    achievement_unlocked: trophyOutline,
    classroom_joined: schoolOutline,
    reminder: alertCircleOutline,
    system: informationCircleOutline,
    grade_posted: schoolOutline,
  };

  return iconMap[type] || informationCircleOutline;
};

const getIconColor = (type) => {
  const colorMap = {
    task_assigned: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    task_submitted: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    task_completed: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    task_graded: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    announcement: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    achievement_unlocked: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    classroom_joined: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    reminder: 'linear-gradient(135deg, #ffc3a0 0%, #ffafbd 100%)',
    system: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    grade_posted: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  };

  return colorMap[type] || 'linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 100%)';
};

const getTypeClass = (type) => {
  return type.replace(/_/g, '-');
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';

  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};
</script>

<style scoped>
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  transition: all 0.2s ease;
  position: relative;
}

.notification-item:hover {
  background: #f8f9fa;
}

.notification-item.unread {
  background: #f0f7ff;
}

.notification-item.unread:hover {
  background: #e3f2fd;
}

/* Priority Indicators */
.notification-item.priority-urgent {
  border-left: 4px solid #dc3545;
}

.notification-item.priority-high {
  border-left: 4px solid #ffc107;
}

/* Left: Icon */
.notification-icon {
  position: relative;
  flex-shrink: 0;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.type-icon {
  font-size: 20px;
  color: white;
}

.unread-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: #dc3545;
  border: 2px solid white;
  border-radius: 50%;
  animation: pulse-indicator 2s infinite;
}

@keyframes pulse-indicator {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Center: Content */
.notification-content {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.notification-title {
  font-family: "Jua", cursive;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-item.unread .notification-title {
  color: #0066cc;
}

.notification-time {
  font-family: "Jua", cursive;
  font-size: 11px;
  color: #999;
  flex-shrink: 0;
}

.notification-message {
  font-family: "Jua", cursive;
  font-size: 13px;
  color: #666;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-metadata {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.meta-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #e9ecef;
  border-radius: 12px;
  font-family: "Jua", cursive;
  font-size: 11px;
  color: #495057;
}

.score-badge {
  background: #d4edda;
  color: #155724;
}

.notification-sender {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.sender-icon {
  font-size: 16px;
  color: #6c757d;
}

.sender-name {
  font-family: "Jua", cursive;
  font-size: 12px;
  color: #6c757d;
}

/* Right: Actions */
.notification-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.notification-item:hover .notification-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.action-icon {
  font-size: 18px;
  color: #6c757d;
}

.mark-read-btn:hover .action-icon {
  color: #28a745;
}

.delete-btn:hover .action-icon {
  color: #dc3545;
}

/* Last Item */
.notification-item:last-child {
  border-bottom: none;
}
</style>
