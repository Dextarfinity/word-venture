<template>
  <!-- Modal with proper transitions -->
  <transition name="modal-fade" appear>
    <div v-if="isOpen" class="qa-modal-overlay" @click="closeModal">
      <transition name="modal-scale" appear>
        <div v-if="isOpen" class="qa-modal" @click.stop>
      <!-- Header -->
      <div class="qa-header">
        <button @click="playClick('student'); closeModal()" class="close-button">
          <ion-icon :icon="closeOutline" class="text-xl"></ion-icon>
        </button>
        <h1 class="qa-title">{{ storyTitle }}</h1>
        <div class="score-key">Score per Key</div>
      </div>

      <!-- Story Text -->
      <div class="story-content">
        <p class="story-text">
          {{ storyText }}
        </p>
      </div>

      <!-- Questions Section -->
      <div class="questions-container">
        <div
          v-for="(question, index) in questions"
          :key="index"
          class="question-block"
        >
          <p class="question-text">
            {{ question.question }}
          </p>

          <div class="options-grid">
            <label
              v-for="(option, optIndex) in question.options"
              :key="optIndex"
              class="option-label"
              :class="{ 
                'selected': userAnswers[question.id] === option,
                'correct': showResults && option === question.correctAnswer,
                'incorrect': showResults && userAnswers[question.id] === option && option !== question.correctAnswer
              }"
            >
              <input
                type="radio"
                :name="'question-' + question.id"
                :value="option"
                v-model="userAnswers[question.id]"
                :disabled="showResults"
                class="hidden"
              />
              <span class="option-text">{{ option }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons" v-if="!showResults">
        <button @click="playClick('student'); submitQuiz()" class="submit-button">
          SUBMIT QUIZ
        </button>
      </div>

      <!-- Results Section -->
      <div class="results-section" v-if="showResults">
        <div class="score-display">
          <h3>Your Score: {{ score }}/{{ questions.length }}</h3>
          <p class="score-percentage">{{ Math.round((score / questions.length) * 100) }}%</p>
        </div>
        <button @click="playClick('student'); closeModal()" class="done-button">
          DONE
        </button>
      </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { IonIcon } from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  story: {
    type: Object,
    required: true
  },
  questions: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['close', 'quiz-completed']);

// Audio
const { startMusic, stopMusic, playClick } = useAudio();

// Reactive state
const userAnswers = ref({});
const showResults = ref(false);
const score = ref(0);

// Computed properties
const storyTitle = computed(() => {
  const title = props.story?.Title || props.story?.title || 'Story';
  // Remove trailing numbers from title
  return title.replace(/\s+\d+$/, '').trim();
});

const storyText = computed(() => {
  return props.story?.['Story Text'] || props.story?.story_text || props.story?.text || '';
});

// Methods
const closeModal = () => {
  stopMusic(); // 🔇 Stop menu music
  emit('close');
};

const submitQuiz = () => {
  playClick('student');
  
  // Calculate score
  let correctCount = 0;
  props.questions.forEach(question => {
    if (userAnswers.value[question.id] === question.correctAnswer) {
      correctCount++;
    }
  });
  
  score.value = correctCount;
  showResults.value = true;
  
  // Emit completion event with results
  emit('quiz-completed', {
    score: correctCount,
    totalQuestions: props.questions.length,
    percentage: Math.round((correctCount / props.questions.length) * 100),
    answers: userAnswers.value
  });
};

// Watch for modal open/close to reset state
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    // Reset state when modal opens
    userAnswers.value = {};
    showResults.value = false;
    score.value = 0;
  }
});

onMounted(() => {
  console.log("🎵 Starting menu music for QuizModal...");
  startMusic(MUSIC_TYPES.MENU, 0.3);
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping menu music for QuizModal...");
  stopMusic();
});
</script>

<style scoped>
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

.qa-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
  padding: 1rem;
}

.qa-modal {
  background: linear-gradient(135deg, #f0f4f8 0%, #d6e7f0 100%);
  border-radius: 1rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.qa-header {
  position: relative;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
}

.close-button {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.qa-title {
  font-family: 'Jua', cursive;
  font-size: 1.25rem;
  font-weight: bold;
  color: #1e40af;
  margin: 0;
}

.score-key {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.story-content {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.story-text {
  font-size: 0.875rem;
  line-height: 1.6;
  color: #374151;
  margin: 0;
}

.questions-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
}

.question-block {
  margin-bottom: 1.5rem;
}

.question-text {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.options-grid {
  display: grid;
  gap: 0.5rem;
}

.option-label {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.6);
  border: 2px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-label:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: #3b82f6;
}

.option-label.selected {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.option-label.correct {
  background: rgba(34, 197, 94, 0.2);
  border-color: #22c55e;
}

.option-label.incorrect {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}

.option-text {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
}

.action-buttons {
  padding: 1.5rem;
  text-align: center;
}

.submit-button {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 2rem;
  padding: 0.875rem 2rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.results-section {
  padding: 1.5rem;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.score-display {
  margin-bottom: 1rem;
}

.score-display h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e40af;
  margin: 0 0 0.25rem 0;
}

.score-percentage {
  font-size: 2rem;
  font-weight: 800;
  color: #059669;
  margin: 0;
}

.done-button {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  border: none;
  border-radius: 2rem;
  padding: 0.875rem 2rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
}

.done-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(5, 150, 105, 0.4);
}

/* Responsive design */
@media (max-width: 640px) {
  .qa-modal {
    margin: 0.5rem;
    max-height: 95vh;
  }
  
  .qa-header {
    padding: 1rem;
  }
  
  .story-content,
  .questions-container,
  .action-buttons,
  .results-section {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>