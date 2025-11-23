<template>
  <transition name="modal-fade" appear>
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center quiz-results-backdrop"
      @click="handleBackdropClick"
    >
      <transition name="modal-scale" appear>
        <div
          v-if="isOpen"
          class="relative w-11/12 max-w-md mx-auto"
          @click.stop
        >
      <!-- Background Image -->
      <div
        class="absolute inset-0 rounded-3xl"
        style="
          background-image: url('/img/background.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          filter: brightness(0.9);
        "
      ></div>

      <!-- Content Overlay -->
      <div class="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
        <!-- Stars Rating -->
        <div class="flex justify-center mb-6">
          <div
            v-for="star in 5"
            :key="star"
            class="mx-1 transform transition-all duration-300"
            :class="{
              'scale-110 animate-bounce': star <= earnedStars,
            }"
            :style="`animation-delay: ${star * 0.1}s`"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              viewBox="0 0 16 16"
              :class="{
                'text-yellow-400': star <= earnedStars,
                'text-gray-300': star > earnedStars,
              }"
            >
              <path
                d="m3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"
              />
            </svg>
          </div>
        </div>

        <!-- Capybara Character -->
        <div class="flex justify-center mb-6">
          <img
            :src="getCapybaraData().image"
            alt="Capybara celebration"
            class="w-32 h-32 object-contain transform transition-all duration-500"
            :class="{
              'animate-bounce': earnedStars >= 4,
              'animate-pulse': earnedStars <= 2,
            }"
          />
        </div>

        <!-- Quiz Results Message -->
        <div class="text-center mb-8">
          <h2
            class="text-2xl font-bold mb-2"
            style="font-family: 'Jua', cursive"
            :class="{
              'text-green-600': earnedStars >= 4,
              'text-yellow-600': earnedStars === 3,
              'text-orange-600': earnedStars <= 2,
            }"
          >
            {{ getResultTitle() }}
          </h2>
          <p class="text-lg text-gray-700 mb-2" style="font-family: 'Jua', cursive">
            {{ getCapybaraData().message }}
          </p>
          <p class="text-sm text-gray-600 mb-2">
            You got <span class="font-bold text-blue-600">{{ score }}</span> out of
            <span class="font-bold text-blue-600">{{ totalQuestions }}</span> questions correct!
          </p>
          <p class="text-xs text-gray-500">
            Score: <span class="font-bold text-purple-600">{{ percentage }}%</span>
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col gap-4">
          <!-- PRACTICE MISTAKES Button (shown if there are miscues) -->
          <button
            v-if="hasMiscues && miscueCount > 0"
            @click="playClick('student'); handlePracticeMistakes()"
            class="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white font-bold text-lg rounded-3xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            style="font-family: 'Jua', cursive; border-radius: 24px"
          >
            <div class="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
                />
                <path
                  d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"
                />
              </svg>
              <span>PRACTICE MISTAKES ({{ miscueCount }})</span>
            </div>
          </button>

          <!-- CONTINUE Button -->
          <button
            @click="playClick('student'); handleContinue()"
            class="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-3xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            style="font-family: 'Jua', cursive; border-radius: 24px"
          >
            CONTINUE
          </button>

          <!-- RETAKE QUIZ Button -->
          <button
            @click="playClick('student'); handleRetakeQuiz()"
            class="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-3xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            style="font-family: 'Jua', cursive; border-radius: 24px"
          >
            RETAKE QUIZ
          </button>
        </div>
      </div>
    </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

// Router instance
const router = useRouter();
const { startMusic, stopMusic, playClick } = useAudio();

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  score: {
    type: Number,
    default: 0,
  },
  totalQuestions: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  answers: {
    type: Object,
    default: () => ({}),
  },
  hasMiscues: {
    type: Boolean,
    default: false,
  },
  miscueCount: {
    type: Number,
    default: 0,
  },
});

// Emits
const emit = defineEmits(["close", "continue", "retake-quiz", "practice-mistakes"]);

// Reactive state for animation
const showContent = ref(false);

// Computed: Calculate earned stars based on quiz performance
const earnedStars = computed(() => {
  if (props.totalQuestions === 0) return 0;

  const percentage = props.percentage;

  if (percentage >= 90) return 5; // 90-100% = 5 stars
  if (percentage >= 80) return 4; // 80-89% = 4 stars
  if (percentage >= 60) return 3; // 60-79% = 3 stars
  if (percentage >= 40) return 2; // 40-59% = 2 stars
  if (percentage >= 20) return 1; // 20-39% = 1 star
  return 0; // 0-19% = 0 stars
});

// Get appropriate capybara image and message based on quiz score
const getCapybaraData = () => {
  const score = props.score;
  const percentage = props.percentage;

  if (percentage >= 80) {
    // 80%+ - Excellent performance - use main capybara.png
    return {
      image: "/img/capybara.png",
      message: "🌟 Outstanding! You really understood the story! 🌟",
    };
  } else if (percentage >= 60) {
    // 60-79% - Good performance - use capybara (2).png
    return {
      image: "/img/CapyBuddy%20Assets/Capybara/capybara%20(2).png",
      message: "🎉 Great job! You're a good listener! 🎉",
    };
  } else if (percentage >= 40) {
    // 40-59% - Fair performance - use capybara (15).png
    return {
      image: "/img/CapyBuddy%20Assets/Capybara/capybara%20(15).png",
      message: "💪 Good try! Reading comprehension takes practice! 💪",
    };
  } else {
    // Below 40% - Needs improvement - use capybara (6).png
    return {
      image: "/img/CapyBuddy%20Assets/Capybara/capybara%20(6).png",
      message: "🤗 Let's try again! Remember to listen carefully! 🤗",
    };
  }
};

// Get result title based on quiz performance
const getResultTitle = () => {
  if (earnedStars.value >= 4) {
    return "FANTASTIC!";
  } else if (earnedStars.value === 3) {
    return "WELL DONE!";
  } else if (earnedStars.value >= 1) {
    return "KEEP LEARNING!";
  } else {
    return "TRY AGAIN!";
  }
};

// Handle backdrop click
const handleBackdropClick = () => {
  // Optional: Allow closing by clicking backdrop
  // emit("close");
};

// Handle CONTINUE button click
const handleContinue = () => {
  playClick('student');
  console.log("Quiz Results Modal - Continue clicked");
  showContent.value = false;
  setTimeout(() => {
    emit("continue");
    emit("close");
    // Navigate back to stories or home
    router.push("/tabs/stories");
  }, 300);
};

// Handle RETAKE QUIZ button click
const handleRetakeQuiz = () => {
  playClick('student');
  console.log("Quiz Results Modal - Retake quiz clicked");
  showContent.value = false;
  setTimeout(() => {
    emit("retake-quiz");
    emit("close");
    // Stay on current page - the parent component will handle retaking the quiz
  }, 300);
};

// Handle PRACTICE MISTAKES button click
const handlePracticeMistakes = () => {
  playClick('student');
  console.log("Quiz Results Modal - Practice mistakes clicked");
  showContent.value = false;
  setTimeout(() => {
    emit("practice-mistakes");
    emit("close");
  }, 300);
};

// Watch for modal open/close to trigger animations
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      console.log("Quiz Results Modal opened with:", {
        score: props.score,
        totalQuestions: props.totalQuestions,
        percentage: props.percentage,
        stars: earnedStars.value
      });
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        showContent.value = true;
      }, 100);
    } else {
      showContent.value = false;
    }
  }
);

onMounted(() => {
  console.log("🎵 Starting menu music for QuizResultsModal...");
  startMusic(MUSIC_TYPES.MENU, 0.3);
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping menu music for QuizResultsModal...");
  stopMusic();
});
</script>

<style scoped>
/* Custom animations for stars */
@keyframes star-bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0) scale(1);
  }
  40% {
    transform: translateY(-10px) scale(1.1);
  }
  60% {
    transform: translateY(-5px) scale(1.05);
  }
}

.animate-bounce {
  animation: star-bounce 1s ease-in-out;
}

/* Smooth transitions for all interactive elements */
button {
  transition: all 0.2s ease-in-out;
}

/* Ensure proper z-index layering */
.fixed {
  z-index: 9999;
}

/* Backdrop blur effect */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Star glow effect for earned stars */
.text-yellow-400 {
  filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.5));
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

.quiz-results-backdrop {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: 2000;
}
</style>
