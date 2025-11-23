<template>
  <Transition name="modal-fade" appear>
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <Transition name="modal-scale" appear>
        <div v-if="isOpen" class="modal-card" @click.stop>
      <!-- Question Text -->
      <div class="question-section">
        <h3 class="question-text">Generate {{ testTypeLabel }} Test?</h3>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="yes-btn" @click="playClick('teacher'); generateTest()">
          <span class="btn-text">YES</span>
        </button>
        <button class="manual-btn" @click="playClick('teacher'); createManually()">
          <span class="btn-text">NO, I'LL DO IT MANUALLY</span>
        </button>
      </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from "vue";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  testType: {
    type: String,
    required: true,
  },
  subcategory: {
    type: String,
    required: true,
  },
  taskData: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["close", "generate", "manual"]);
const { startMusic, stopMusic, playClick } = useAudio();

// Computed properties
const testTypeLabel = computed(() => {
  const labels = {
    "phonics-merger": "Phonics",
    "cvc": "CVC",
    "blending": "Blending",
    "silent-words": "Silent Words",
  };
  return labels[props.testType] || "Test";
});

// Methods
const closeModal = () => {
  stopMusic(); // 🔇 Stop menu music
  emit("close");
};

const generateTest = () => {
  playClick('teacher');
  
  // Emit generate event with test details
  const generationData = {
    testType: props.testType,
    subcategory: props.subcategory,
    taskData: props.taskData,
    mode: "generate",
  };
  
  console.log("Generating test:", generationData);
  emit("generate", generationData);
  closeModal();
};

const createManually = () => {
  playClick('teacher');
  
  // Emit manual event with test details
  const manualData = {
    testType: props.testType,
    subcategory: props.subcategory,
    taskData: props.taskData,
    mode: "manual",
  };
  
  console.log("Creating test manually:", manualData);
  emit("manual", manualData);
  closeModal();
};

onMounted(() => {
  console.log("🎵 Starting menu music for TestGenerationModal...");
  startMusic(MUSIC_TYPES.MENU, 0.3);
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping menu music for TestGenerationModal...");
  stopMusic();
});
</script>

<style scoped>
/* Modal Overlay - Full Screen Backdrop */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000; /* Higher than other modals */
  padding: 20px;
  box-sizing: border-box;
}

/* Modal Card - Compact Design */
.modal-card {
  background: white;
  border-radius: 15px;
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 25px 20px;
  gap: 25px;
  box-sizing: border-box;
}

/* Question Section */
.question-section {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.question-text {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.3px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.yes-btn,
.manual-btn {
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.yes-btn {
  background: #4caf50;
  color: white;
}

.yes-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.manual-btn {
  background: #ff9800;
  color: white;
}

.manual-btn:hover {
  background: #f57c00;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

.btn-text {
  display: block;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 15px;
  }

  .modal-card {
    max-width: 300px;
    padding: 20px 18px;
    gap: 20px;
  }

  .question-text {
    font-size: 16px;
  }

  .yes-btn,
  .manual-btn {
    padding: 12px 18px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .modal-card {
    max-width: 280px;
    padding: 18px 15px;
    gap: 18px;
  }

  .question-text {
    font-size: 15px;
  }

  .yes-btn,
  .manual-btn {
    padding: 11px 16px;
    font-size: 12px;
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

.modal-overlay {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: 2000;
}
</style>