<template>
  <!-- Delete Classroom Confirmation Modal -->
  <transition name="modal-fade" appear>
    <div v-if="isOpen" class="delete-overlay" @click="closeOverlay">
      <transition name="modal-scale" appear>
        <div v-if="isOpen" class="delete-content" @click.stop>
          <!-- Warning Icon -->
          <div class="icon-section">
            <div class="warning-icon">
              <span class="icon-text">⚠️</span>
            </div>
          </div>

          <!-- Warning Message -->
          <div class="message-bubble">
            <h3 class="warning-title">Delete Classroom?</h3>
            <p class="warning-text">
              Are you sure you want to delete <strong>"{{ classroomName }}"</strong>?
            </p>
            <p class="warning-subtext">
              This action cannot be undone and will remove all associated data.
            </p>
          </div>

          <!-- Action buttons -->
          <div class="action-buttons">
            <button class="cancel-button" @click="handleCancel()">
              Cancel
            </button>
            <button class="delete-button" @click="handleDelete()" :disabled="isDeleting">
              {{ isDeleting ? 'Deleting...' : 'Delete Classroom' }}
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  classroomName: {
    type: String,
    default: "",
  },
  isDeleting: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["close", "confirm"]);

// Functions
const closeOverlay = () => {
  emit("close");
};

const handleCancel = () => {
  emit("close");
};

const handleDelete = () => {
  emit("confirm");
};
</script>

<style scoped>
.delete-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: backdropFadeIn 0.3s ease-in-out forwards;
}

.delete-content {
  position: relative;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border-radius: 25px;
  width: 90%;
  max-width: 400px;
  padding: 40px 30px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  border: 3px solid #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;
  animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.icon-section {
  display: flex;
  justify-content: center;
  align-items: center;
}

.warning-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff9999 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

.icon-text {
  font-size: 50px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.message-bubble {
  text-align: center;
  width: 100%;
}

.warning-title {
  font-family: "Jua", cursive;
  font-size: 24px;
  font-weight: bold;
  color: #e74c3c;
  margin: 0 0 15px 0;
}

.warning-text {
  font-family: "Jua", cursive;
  font-size: 16px;
  color: #333;
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.warning-text strong {
  color: #e74c3c;
  font-weight: bold;
}

.warning-subtext {
  font-family: "Jua", cursive;
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.action-buttons {
  display: flex;
  gap: 15px;
  width: 100%;
}

.cancel-button {
  flex: 1;
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  color: white;
  border: none;
  border-radius: 15px;
  padding: 15px 20px;
  font-family: "Jua", cursive;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 6px 15px rgba(149, 165, 166, 0.3);
  transition: all 0.3s ease;
  text-transform: uppercase;
}

.cancel-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(149, 165, 166, 0.4);
}

.cancel-button:active {
  transform: translateY(0);
}

.delete-button {
  flex: 1;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  border-radius: 15px;
  padding: 15px 20px;
  font-family: "Jua", cursive;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 6px 15px rgba(231, 76, 60, 0.3);
  transition: all 0.3s ease;
  text-transform: uppercase;
}

.delete-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(231, 76, 60, 0.4);
}

.delete-button:active:not(:disabled) {
  transform: translateY(0);
}

.delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Animations */
@keyframes backdropFadeIn {
  from {
    background: rgba(0, 0, 0, 0);
  }
  to {
    background: rgba(0, 0, 0, 0.6);
  }
}

@keyframes modalSlideIn {
  0% {
    opacity: 0;
    transform: scale(0.7) translateY(50px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 12px 30px rgba(255, 107, 107, 0.5);
  }
}

/* Responsive design */
@media (max-width: 400px) {
  .delete-content {
    width: 95%;
    padding: 30px 20px;
  }

  .warning-icon {
    width: 80px;
    height: 80px;
  }

  .icon-text {
    font-size: 40px;
  }

  .warning-title {
    font-size: 20px;
  }

  .warning-text {
    font-size: 14px;
  }

  .warning-subtext {
    font-size: 12px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .cancel-button,
  .delete-button {
    font-size: 14px;
    padding: 12px 20px;
  }
}

/* Modal Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  transform: scale(0.7) translateY(-50px);
  opacity: 0;
}
</style>
