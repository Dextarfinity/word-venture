<template>
  <transition name="modal-fade" appear>
    <div v-if="isVisible" class="quiz-prompt-overlay" @click="handleMaybeLater">
      <transition name="modal-scale" appear>
        <div v-if="isVisible" class="quiz-prompt-modal" @click.stop>
      <!-- Story Title -->
      <div class="story-header">
        <h1 class="story-title">{{ storyTitle }}</h1>
        <div class="story-subtitle">{{ storySubtitle }}</div>
      </div>

      <!-- Story Content -->
      <div class="story-content-container">
        <div class="story-text-block">
          <p class="story-text">
            {{ storyText }}
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="playClick('student'); handleTakeQuiz()" class="take-quiz-button">
          TAKE THE QUIZ
        </button>
        <button @click="playClick('student'); handleMaybeLater()" class="maybe-later-button">
          MAYBE LATER
        </button>
      </div>
    </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

// Props
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  story: {
    type: Object,
    required: true
  }
});

// Emits
const emit = defineEmits(['take-quiz', 'maybe-later']);

// Audio - This is a student modal
const { startMusic, stopMusic, playClick } = useAudio();

// Computed properties
const storyTitle = computed(() => {
  const title = props.story?.Title || props.story?.title || 'Story';
  // Remove trailing numbers from title
  return title.replace(/\s+\d+$/, '').trim().toUpperCase();
});

const storySubtitle = computed(() => {
  return 'Story per Key';
});

const storyText = computed(() => {
  const text = props.story?.['Story Text'] || props.story?.story_text || props.story?.text || '';
  // Split into paragraphs for better formatting
  return text;
});

// Methods
const handleTakeQuiz = () => {
  playClick('student');
  emit('take-quiz');
};

const handleMaybeLater = () => {
  playClick('student');
  emit('maybe-later');
};

// Lifecycle hooks
onMounted(() => {
  console.log("🎵 Starting menu music for QuizPrompt...");
  startMusic(MUSIC_TYPES.MENU, 0.3);
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping menu music for QuizPrompt...");
  stopMusic();
});
</script>

<style scoped>
.quiz-prompt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.quiz-prompt-modal {
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  border-radius: 1rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.story-header {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  padding: 2rem 1.5rem 1.5rem;
  text-align: center;
  position: relative;
}

.story-title {
  font-family: 'Jua', cursive;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.5px;
}

.story-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 500;
}

.story-content-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.story-text-block {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.story-text {
  font-size: 0.875rem;
  line-height: 1.7;
  color: #374151;
  margin: 0;
  text-align: justify;
  white-space: pre-line;
}

.action-buttons {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
}

.take-quiz-button {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  border: none;
  border-radius: 2rem;
  padding: 1rem 2rem;
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(5, 150, 105, 0.3);
  text-transform: uppercase;
}

.take-quiz-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(5, 150, 105, 0.4);
}

.take-quiz-button:active {
  transform: translateY(-1px);
}

.maybe-later-button {
  background: rgba(255, 255, 255, 0.9);
  color: #6b7280;
  border: 2px solid #d1d5db;
  border-radius: 2rem;
  padding: 1rem 2rem;
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
}

.maybe-later-button:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #9ca3af;
  color: #4b5563;
  transform: translateY(-2px);
}

.maybe-later-button:active {
  transform: translateY(0);
}

/* Responsive design */
@media (max-width: 640px) {
  .quiz-prompt-modal {
    margin: 0.5rem;
    max-height: 95vh;
  }
  
  .story-header {
    padding: 1.5rem 1rem 1rem;
  }
  
  .story-title {
    font-size: 1.25rem;
  }
  
  .story-content-container {
    padding: 1rem;
  }
  
  .story-text-block {
    padding: 1rem;
  }
  
  .action-buttons {
    padding: 1rem;
  }
}

/* Animation for modal entrance */
@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.quiz-prompt-modal {
  animation: modalEnter 0.3s ease-out;
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

.quiz-prompt-overlay {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: 2000;
}
</style>