/
<template>
  <transition name="modal-fade" appear>
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center results-backdrop"
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

        <!-- Results Message -->
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
          <p class="text-sm text-gray-600">
            You got <span class="font-bold text-blue-600">{{ correctWords }}</span> out of
            <span class="font-bold text-blue-600">{{ totalWords }}</span> words correct!
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col gap-4">
          <!-- OKAY Button -->
          <button
            @click="playClick('student'); handleOkay()"
            class="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-3xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            style="font-family: 'Jua', cursive; border-radius: 24px"
          >
            OKAY
          </button>

          <!-- TRY AGAIN Button -->
          <button
            @click="playClick('student'); handleTryAgain()"
            class="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-3xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            style="font-family: 'Jua', cursive; border-radius: 24px"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

// Router instance
const router = useRouter();

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  correctWords: {
    type: Number,
    default: 0,
  },
  totalWords: {
    type: Number,
    default: 0,
  },
});

// Emits
const emit = defineEmits(["close", "okay", "try-again"]);

// Reactive state for animation
const showContent = ref(false);

// Computed: Calculate earned stars based on performance
const earnedStars = computed(() => {
  if (props.totalWords === 0) return 0;

  const percentage = (props.correctWords / props.totalWords) * 100;

  if (percentage >= 90) return 5; // 90-100% = 5 stars
  if (percentage >= 80) return 4; // 80-89% = 4 stars
  if (percentage >= 60) return 3; // 60-79% = 3 stars
  if (percentage >= 40) return 2; // 40-59% = 2 stars
  if (percentage >= 20) return 1; // 20-39% = 1 star
  return 0; // 0-19% = 0 stars
});

// Get appropriate capybara image and message based on correct answers count
const getCapybaraData = () => {
  const correctCount = props.correctWords;

  if (correctCount >= 4) {
    // 4 or 5 correct answers - use main capybara.png
    return {
      image: "/img/capybara.png",
      message: "🌟 You're a reading superstar! Amazing work! 🌟",
    };
  } else if (correctCount === 3) {
    // 3 correct answers - use capybara (2).png
    return {
      image: "/img/CapyBuddy%20Assets/Capybara/capybara%20(2).png",
      message: "🎉 Great job! You're getting better every day! 🎉",
    };
  } else if (correctCount >= 1) {
    // 1 or 2 correct answers - use capybara (15).png
    return {
      image: "/img/CapyBuddy%20Assets/Capybara/capybara%20(15).png",
      message: "💪 Keep practicing! You're learning so much! 💪",
    };
  } else {
    // 0 correct answers - use capybara (6).png
    return {
      image: "/img/CapyBuddy%20Assets/Capybara/capybara%20(6).png",
      message: "🤗 That's okay! Every great reader started just like you! 🤗",
    };
  }
};

// Get result title based on performance
const getResultTitle = () => {
  if (earnedStars.value >= 4) {
    return "AWESOME!";
  } else if (earnedStars.value === 3) {
    return "GOOD JOB!";
  } else if (earnedStars.value >= 1) {
    return "KEEP TRYING!";
  } else {
    return "TRY AGAIN!";
  }
};

// Get result message based on performance
const getResultMessage = () => {
  const messages = {
    5: "Perfect! You're a reading superstar! 🌟",
    4: "Excellent work! You're doing great! 🎉",
    3: "Good job! Keep practicing! 👍",
    2: "You're getting better! Don't give up! 💪",
    1: "Keep practicing! You can do it! 🌱",
    0: "Let's try again together! 🤗",
  };

  return messages[earnedStars.value] || "Keep practicing!";
};

// Handle backdrop click
const handleBackdropClick = () => {
  // Optional: Allow closing by clicking backdrop
  // emit("close");
};

// Handle OKAY button click
const handleOkay = () => {
  playClick('student'); // 🎵 Play click sound
  showContent.value = false;
  setTimeout(() => {
    emit("okay");
    emit("close");
    router.push("/tabs/student-home");
  }, 300);
};

// Handle TRY AGAIN button click
const handleTryAgain = () => {
  playClick('student'); // 🎵 Play click sound
  showContent.value = false;
  setTimeout(() => {
    emit("try-again");
    emit("close");
    // Stay on current page (WordReadingPage) - router.push not needed
  }, 300);
};

// Watch for modal open/close to trigger animations
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      // Start menu music when modal opens
      console.log("🎵 Starting menu music for ResultsModal...");
      startMusic(MUSIC_TYPES.MENU, 0.3);
      
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        showContent.value = true;
      }, 100);
    } else {
      showContent.value = false;
      // Stop music when modal closes
      console.log("🔇 Stopping menu music for ResultsModal...");
      stopMusic();
    }
  }
);

// Cleanup on unmount
onBeforeUnmount(() => {
  console.log("🔇 ResultsModal unmounting - stopping music...");
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

.results-backdrop {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: 2000;
}
</style>
