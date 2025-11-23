<template>
  <transition name="loading-fade">
    <div v-if="isLoading" class="loading-screen">
      <div class="loading-content">
        <!-- Capybara Character -->
        <div class="loading-character">
          <img
            src="@/img/CapyBuddy Assets/Home_Student/capybara (1).png"
            alt="Capybara Loading"
            class="capybara-image"
          />
        </div>

        <!-- Loading Text -->
        <div class="loading-text">
          <h2 class="loading-title">{{ loadingMessage }}</h2>
          <p class="loading-subtitle">Please wait...</p>
        </div>

        <!-- Loading Spinner -->
        <div class="loading-spinner">
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
        </div>

        <!-- Progress Bar (optional) -->
        <div v-if="showProgress" class="progress-bar-container">
          <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, computed } from "vue";

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: "Loading",
  },
  showProgress: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Number,
    default: 0,
  },
});

const loadingMessage = computed(() => props.message);
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(10px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

/* Capybara Character */
.loading-character {
  width: 150px;
  height: 150px;
  margin-bottom: 30px;
  animation: floatBounce 2s ease-in-out infinite;
}

.capybara-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
}

@keyframes floatBounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
}

/* Loading Text */
.loading-text {
  margin-bottom: 30px;
}

.loading-title {
  font-family: "Jua", cursive;
  font-size: 28px;
  font-weight: bold;
  color: white;
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  animation: textPulse 2s ease-in-out infinite;
}

.loading-subtitle {
  font-family: "Jua", cursive;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

@keyframes textPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Loading Spinner */
.loading-spinner {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.spinner-circle {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  animation: spinnerBounce 1.4s ease-in-out infinite;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.spinner-circle:nth-child(1) {
  animation-delay: -0.32s;
}

.spinner-circle:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes spinnerBounce {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* Progress Bar */
.progress-bar-container {
  width: 250px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 10px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #66bb6a);
  border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.5);
}

/* Fade Transition */
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.3s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 480px) {
  .loading-character {
    width: 120px;
    height: 120px;
    margin-bottom: 20px;
  }

  .loading-title {
    font-size: 24px;
  }

  .loading-subtitle {
    font-size: 14px;
  }

  .spinner-circle {
    width: 12px;
    height: 12px;
    gap: 8px;
  }

  .progress-bar-container {
    width: 200px;
  }
}

@media (max-width: 360px) {
  .loading-content {
    padding: 30px 20px;
  }

  .loading-character {
    width: 100px;
    height: 100px;
  }

  .loading-title {
    font-size: 20px;
  }

  .progress-bar-container {
    width: 180px;
  }
}
</style>
