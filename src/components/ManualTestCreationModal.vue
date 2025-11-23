<template>
  <Transition name="modal-fade" appear>
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <Transition name="modal-scale" appear>
        <div v-if="isOpen" class="modal-card" @click.stop>
      <!-- Header with Test Type badge -->
      <div class="modal-header">
        <div class="test-type-badge">
          <span class="badge-text">{{ testTypeLabel.toUpperCase() }}</span>
        </div>
      </div>

      <!-- Instructions Section -->
      <div class="instructions-section">
        <div class="instruction-text">{{ instructionText }}</div>
      </div>

      <!-- Dynamic Form Fields Based on Test Type -->
      <div class="form-section">
        <!-- CVC Test Fields -->
        <div v-if="testType === 'cvc'" class="cvc-fields">
          <div 
            v-for="(word, index) in cvcWords" 
            :key="index"
            class="form-field"
          >
            <input
              type="text"
              :placeholder="`${index + 1} LETTER WORD`"
              class="form-input"
              v-model="cvcWords[index]"
              maxlength="3"
            />
          </div>
        </div>

        <!-- Phonics Test Fields -->
        <div v-else-if="testType === 'phonics-merger'" class="phonics-fields">
          <div class="form-field">
            <label class="field-label">PHONICS SOUNDS</label>
            <textarea
              placeholder="Enter phonics sounds (e.g., /a/, /b/, /c/)"
              class="form-textarea"
              v-model="phonicsData.sounds"
              rows="3"
            ></textarea>
          </div>
          <div class="form-field">
            <label class="field-label">EXAMPLE WORDS</label>
            <textarea
              placeholder="Enter example words for each sound"
              class="form-textarea"
              v-model="phonicsData.examples"
              rows="3"
            ></textarea>
          </div>
        </div>

        <!-- Blending Test Fields -->
        <div v-else-if="testType === 'blending'" class="blending-fields">
          <div class="form-field">
            <label class="field-label">WORD SEGMENTS</label>
            <textarea
              placeholder="Enter words to blend (e.g., c-a-t, d-o-g)"
              class="form-textarea"
              v-model="blendingData.segments"
              rows="4"
            ></textarea>
          </div>
          <div class="form-field">
            <label class="field-label">DIFFICULTY LEVEL</label>
            <select v-model="blendingData.difficulty" class="form-input">
              <option value="easy">Easy (2-3 sounds)</option>
              <option value="medium">Medium (4-5 sounds)</option>
              <option value="hard">Hard (6+ sounds)</option>
            </select>
          </div>
        </div>

        <!-- Silent Words Test Fields -->
        <div v-else-if="testType === 'silent-words'" class="silent-words-fields">
          <div class="form-field">
            <label class="field-label">SILENT LETTER WORDS</label>
            <textarea
              placeholder="Enter words with silent letters (e.g., knife, write, lamb)"
              class="form-textarea"
              v-model="silentWordsData.words"
              rows="4"
            ></textarea>
          </div>
          <div class="form-field">
            <label class="field-label">SILENT LETTER TYPE</label>
            <select v-model="silentWordsData.type" class="form-input">
              <option value="silent-e">Silent E</option>
              <option value="silent-l">Silent L</option>
              <option value="silent-b">Silent B</option>
              <option value="silent-k">Silent K</option>
              <option value="mixed">Mixed Types</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Additional Settings -->
      <div class="settings-section">
        <div class="form-field">
          <label class="field-label">NUMBER OF QUESTIONS</label>
          <select v-model="testSettings.questionCount" class="form-input">
            <option value="5">5 Questions</option>
            <option value="10">10 Questions</option>
            <option value="15">15 Questions</option>
            <option value="20">20 Questions</option>
          </select>
        </div>

        <div class="form-field">
          <label class="field-label">TIME LIMIT (MINUTES)</label>
          <select v-model="testSettings.timeLimit" class="form-input">
            <option value="5">5 Minutes</option>
            <option value="10">10 Minutes</option>
            <option value="15">15 Minutes</option>
            <option value="20">20 Minutes</option>
            <option value="30">30 Minutes</option>
            <option value="0">No Time Limit</option>
          </select>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="back-btn" @click="playClick('teacher'); closeModal()">
          <span class="btn-text">BACK</span>
        </button>
        <button
          class="save-btn"
          @click="playClick('teacher'); saveTest()"
          :disabled="!isFormValid"
          :class="{ disabled: !isFormValid }"
        >
          <span class="btn-text">SAVE</span>
        </button>
      </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
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

const emit = defineEmits(["close", "save"]);
const { startMusic, stopMusic, playClick } = useAudio();

// Reactive data
const cvcWords = ref(["", "", "", "", ""]);
const phonicsData = ref({
  sounds: "",
  examples: "",
});
const blendingData = ref({
  segments: "",
  difficulty: "easy",
});
const silentWordsData = ref({
  words: "",
  type: "silent-e",
});
const testSettings = ref({
  questionCount: "10",
  timeLimit: "15",
});

// Computed properties
const testTypeLabel = computed(() => {
  const labels = {
    "phonics-merger": "Phonics Test",
    "cvc": "CVC Test",
    "blending": "Blending Test",
    "silent-words": "Silent Words Test",
  };
  return labels[props.testType] || "Test";
});

const instructionText = computed(() => {
  const instructions = {
    "cvc": "ADD FIVE (5) THREE-LETTER WORDS",
    "phonics-merger": "ADD PHONICS SOUNDS AND EXAMPLES",
    "blending": "ADD WORDS FOR BLENDING PRACTICE",
    "silent-words": "ADD WORDS WITH SILENT LETTERS",
  };
  return instructions[props.testType] || "ADD TEST CONTENT";
});

const isFormValid = computed(() => {
  switch (props.testType) {
    case "cvc":
      return cvcWords.value.some(word => word.trim() !== "");
    case "phonics-merger":
      return phonicsData.value.sounds.trim() !== "" && phonicsData.value.examples.trim() !== "";
    case "blending":
      return blendingData.value.segments.trim() !== "";
    case "silent-words":
      return silentWordsData.value.words.trim() !== "";
    default:
      return false;
  }
});

// Methods
const resetForm = () => {
  cvcWords.value = ["", "", "", "", ""];
  phonicsData.value = {
    sounds: "",
    examples: "",
  };
  blendingData.value = {
    segments: "",
    difficulty: "easy",
  };
  silentWordsData.value = {
    words: "",
    type: "silent-e",
  };
  testSettings.value = {
    questionCount: "10",
    timeLimit: "15",
  };
};

const closeModal = () => {
  stopMusic(); // 🔇 Stop menu music
  resetForm();
  emit("close");
};

const saveTest = () => {
  playClick('teacher');
  
  if (!isFormValid.value) {
    return;
  }

  const testContent = {};

  // Prepare test content based on type
  switch (props.testType) {
    case "cvc":
      testContent.words = cvcWords.value.filter(word => word.trim() !== "");
      break;
    case "phonics-merger":
      testContent.sounds = phonicsData.value.sounds.trim();
      testContent.examples = phonicsData.value.examples.trim();
      break;
    case "blending":
      testContent.segments = blendingData.value.segments.trim();
      testContent.difficulty = blendingData.value.difficulty;
      break;
    case "silent-words":
      testContent.words = silentWordsData.value.words.trim();
      testContent.type = silentWordsData.value.type;
      break;
  }

  const manualTest = {
    id: Date.now(),
    testType: props.testType,
    subcategory: props.subcategory,
    testTypeLabel: testTypeLabel.value,
    content: testContent,
    settings: {
      questionCount: parseInt(testSettings.value.questionCount),
      timeLimit: parseInt(testSettings.value.timeLimit),
    },
    taskData: props.taskData,
    creationMode: "manual",
    createdAt: new Date().toISOString(),
  };

  try {
    console.log("Saving manual test:", manualTest);
    
    // Emit save event with test data
    emit("save", manualTest);
    
    // Show success toast
    if (window.$toast) {
      window.$toast.success(`${testTypeLabel.value} test created successfully!`);
    }
    
    // Close modal after successful save
    closeModal();
  } catch (error) {
    console.error("Error saving manual test:", error);
    
    // Show error toast
    if (window.$toast) {
      window.$toast.error("Failed to create test. Please try again.");
    }
  }
};

// Watch for modal open/close to reset state
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      resetForm();
    }
  }
);

onMounted(() => {
  console.log("🎵 Starting menu music for ManualTestCreationModal...");
  startMusic(MUSIC_TYPES.MENU, 0.3);
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping menu music for ManualTestCreationModal...");
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
  z-index: 10001; /* Higher than TestGenerationModal */
  padding: 20px;
  box-sizing: border-box;
}

/* Modal Card - Compact Design */
.modal-card {
  background: white;
  border-radius: 15px;
  width: 100%;
  max-width: 420px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 20px;
  gap: 18px;
  box-sizing: border-box;
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: center;
  margin-bottom: 5px;
}

.test-type-badge {
  background: #4caf50;
  color: white;
  padding: 10px 20px;
  border-radius: 25px;
  display: inline-block;
}

.badge-text {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Instructions Section */
.instructions-section {
  text-align: center;
  padding: 8px;
}

.instruction-text {
  font-size: 12px;
  font-weight: 700;
  color: #2c3e50;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.3;
}

/* Form Section */
.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 5px;
}

.cvc-fields,
.phonics-fields,
.blending-fields,
.silent-words-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 10px;
  font-weight: 700;
  color: #2c3e50;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  background: #f9f9f9;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #4caf50;
  background: white;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 70px;
  font-family: inherit;
}

/* CVC Specific Styling */
.cvc-fields .form-input {
  text-align: center;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 1px;
}

.cvc-fields .form-input::placeholder {
  color: #999;
  font-weight: 400;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

/* Settings Section */
.settings-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 5px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.back-btn,
.save-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.back-btn {
  background: #95a5a6;
  color: white;
}

.back-btn:hover {
  background: #7f8c8d;
  transform: translateY(-1px);
}

.save-btn {
  background: #4caf50;
  color: white;
}

.save-btn:hover:not(.disabled) {
  background: #45a049;
  transform: translateY(-1px);
}

.save-btn.disabled {
  background: #cccccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-text {
  display: block;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-card {
    max-width: 100%;
    max-height: 90vh;
    padding: 15px;
    gap: 15px;
  }

  .settings-section {
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .modal-card {
    padding: 12px;
    gap: 12px;
  }

  .badge-text {
    font-size: 12px;
  }

  .instruction-text {
    font-size: 11px;
  }

  .form-input,
  .form-textarea {
    padding: 9px 12px;
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