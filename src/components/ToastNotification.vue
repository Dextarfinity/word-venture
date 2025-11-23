<template>
  <div class="toast-container">
    <Transition
      v-for="toast in toasts"
      :key="toast.id"
      name="toast"
      appear
    >
      <div
        class="toast-notification"
        :class="[`toast-${toast.type}`]"
      >
        <div class="toast-content">
          <div class="toast-icon">
            <ion-icon 
              :icon="getToastIcon(toast.type)" 
              class="icon"
            ></ion-icon>
          </div>
          <div class="toast-message">
            <div class="toast-title">{{ toast.title }}</div>
            <div v-if="toast.message" class="toast-text">{{ toast.message }}</div>
          </div>
        </div>
        <div class="toast-progress">
          <div 
            class="progress-bar" 
            :style="{ animationDuration: `${toast.duration}ms` }"
          ></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { IonIcon } from "@ionic/vue";
import { 
  checkmarkCircleOutline,
  informationCircleOutline,
  warningOutline,
  closeCircleOutline
} from "ionicons/icons";
import { ref, onMounted, onUnmounted } from "vue";
import { useAudio } from "@/composables/useAudio";

// Toast store (could be replaced with Pinia or Vuex in a larger app)
const toasts = ref([]);
let toastId = 0;

// Initialize audio for toast notifications
const { playWordFeedback } = useAudio();

// Toast service functions
const showToast = (title, message = '', type = 'success', duration = 5000) => {
  const toast = {
    id: ++toastId,
    title,
    message,
    type,
    duration
  };

  // Play correct word sound when toast appears
  playWordFeedback(true);

  toasts.value.push(toast);

  // Auto remove after duration
  setTimeout(() => {
    removeToast(toast.id);
  }, duration);
};

const removeToast = (id) => {
  const index = toasts.value.findIndex(toast => toast.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
  }
};

const getToastIcon = (type) => {
  const icons = {
    success: checkmarkCircleOutline,
    info: informationCircleOutline,
    warning: warningOutline,
    error: closeCircleOutline
  };
  return icons[type] || informationCircleOutline;
};

// Global toast service - expose to window for use in any component
const toastService = {
  success: (title, message = '') => showToast(title, message, 'success'),
  info: (title, message = '') => showToast(title, message, 'info'),
  warning: (title, message = '') => showToast(title, message, 'warning'),
  error: (title, message = '') => showToast(title, message, 'error'),
};

onMounted(() => {
  // Make toast service globally available
  window.$toast = toastService;
});

onUnmounted(() => {
  // Clean up
  if (window.$toast) {
    delete window.$toast;
  }
});

// Also expose for direct import usage
defineExpose({
  showToast,
  success: toastService.success,
  info: toastService.info,
  warning: toastService.warning,
  error: toastService.error,
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10002;
  pointer-events: none;
}

.toast-notification {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  margin-bottom: 12px;
  min-width: 320px;
  max-width: 400px;
  overflow: hidden;
  pointer-events: auto;
  border-left: 4px solid;
}

.toast-success {
  border-left-color: #4caf50;
}

.toast-info {
  border-left-color: #2196f3;
}

.toast-warning {
  border-left-color: #ff9800;
}

.toast-error {
  border-left-color: #f44336;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-success .toast-icon {
  color: #4caf50;
}

.toast-info .toast-icon {
  color: #2196f3;
}

.toast-warning .toast-icon {
  color: #ff9800;
}

.toast-error .toast-icon {
  color: #f44336;
}

.toast-icon .icon {
  width: 20px;
  height: 20px;
}

.toast-message {
  flex: 1;
}

.toast-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
}

.toast-text {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.toast-progress {
  height: 3px;
  background: rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: currentColor;
  width: 100%;
  animation: progress-countdown linear forwards;
}

.toast-success .progress-bar {
  background: #4caf50;
}

.toast-info .progress-bar {
  background: #2196f3;
}

.toast-warning .progress-bar {
  background: #ff9800;
}

.toast-error .progress-bar {
  background: #f44336;
}

@keyframes progress-countdown {
  from {
    transform: translateX(0%);
  }
  to {
    transform: translateX(-100%);
  }
}

/* Toast transition animations */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Responsive design */
@media (max-width: 768px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .toast-notification {
    min-width: auto;
    max-width: none;
  }
}
</style>