<template>
  <!-- Readiness Confirmation Modal -->
  <transition name="modal-fade" appear>
    <div v-if="isOpen" class="readiness-overlay" @click="closeOverlay">
      <transition name="modal-scale" appear>
        <div v-if="isOpen" class="readiness-content" @click.stop>
      <!-- Background with capybara character -->
      <div class="character-section">
        <img
          src="@/img/CapyBuddy Assets/Capybara/capybara (7).png"
          alt="Capybara"
          class="capybara-character"
        />
      </div>

      <!-- Speech bubble with question -->
      <div class="speech-bubble">
        <p class="question-text">ARE YOU READY TO TAKE THE PRACTICE EXERCISE?</p>
        <div class="bubble-tail"></div>
      </div>

      <!-- Action buttons -->
      <div class="action-buttons">
        <button class="ready-button" @click="playClick('student'); handleReady()">I'M READY!</button>
        <button class="practice-button" @click="playClick('student'); handleNeedPractice()">
          I NEED MORE PRACTICE
        </button>
      </div>

      <!-- Decorative flowers -->
      <div class="flower flower-1">🌼</div>
      <div class="flower flower-2">🌻</div>
      <div class="flower flower-3">🌸</div>
    </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits, watch, onBeforeUnmount } from "vue";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["close", "ready", "need-practice"]);

// Watch for modal open/close
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    console.log("🎵 Starting menu music for ReadinessConfirmationModal...");
    startMusic(MUSIC_TYPES.MENU, 0.3);
  } else {
    console.log("🔇 Stopping menu music for ReadinessConfirmationModal...");
    stopMusic();
  }
});

// Functions
const closeOverlay = () => {
  playClick('student'); // 🎵 Play click sound
  stopMusic(); // 🔇 Stop menu music
  emit("close");
};

const handleReady = () => {
  playClick('student'); // 🎵 Play click sound
  console.log("🎯 Student is ready for the exercise!");
  emit("ready");
};

const handleNeedPractice = () => {
  playClick('student'); // 🎵 Play click sound
  console.log("📚 Student needs more practice");
  emit("need-practice");
};

// Cleanup on unmount
onBeforeUnmount(() => {
  console.log("🔇 ReadinessConfirmationModal unmounting - stopping music...");
  stopMusic();
});
</script>

<style scoped>
.readiness-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: backdropFadeIn 0.3s ease-in-out forwards;
}

.overlay-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
}

.readiness-content {
  position: relative;
  background: url("@/img/background.jpg") center/cover;
  border-radius: 25px;
  width: 90%;
  max-width: 380px;
  min-height: 500px;
  padding: 30px 20px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  border: 3px solid #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.character-section {
  margin-top: 20px;
  margin-bottom: 20px;
}

.capybara-character {
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2));
  animation: float 3s ease-in-out infinite;
}

.speech-bubble {
  position: relative;
  background: #fff;
  border: 3px solid #333;
  border-radius: 20px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  max-width: 280px;
}

.question-text {
  font-family: "Comic Sans MS", cursive, sans-serif;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin: 0;
  line-height: 1.3;
}

.bubble-tail {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 15px solid #fff;
}

.bubble-tail::before {
  content: "";
  position: absolute;
  bottom: 3px;
  left: -18px;
  width: 0;
  height: 0;
  border-left: 18px solid transparent;
  border-right: 18px solid transparent;
  border-top: 18px solid #333;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  max-width: 280px;
  margin-top: 10px;
}

.ready-button {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 15px 25px;
  font-family: "Comic Sans MS", cursive, sans-serif;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 6px 15px rgba(76, 175, 80, 0.3);
  transition: all 0.3s ease;
  text-transform: uppercase;
}

.ready-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.4);
}

.ready-button:active {
  transform: translateY(0);
}

.practice-button {
  background: linear-gradient(135deg, #ffd54f 0%, #ffcc02 100%);
  color: #333;
  border: none;
  border-radius: 25px;
  padding: 15px 25px;
  font-family: "Comic Sans MS", cursive, sans-serif;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 6px 15px rgba(255, 193, 7, 0.3);
  transition: all 0.3s ease;
  text-transform: uppercase;
}

.practice-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 193, 7, 0.4);
}

.practice-button:active {
  transform: translateY(0);
}

/* Decorative flowers */
.flower {
  position: absolute;
  font-size: 20px;
  animation: gentle-sway 4s ease-in-out infinite;
}

.flower-1 {
  top: 50px;
  left: 30px;
  animation-delay: 0s;
}

.flower-2 {
  top: 80px;
  right: 25px;
  animation-delay: 1.5s;
}

.flower-3 {
  bottom: 100px;
  left: 25px;
  animation-delay: 3s;
}

/* Animations */
@keyframes backdropFadeIn {
  from {
    background: rgba(0, 0, 0, 0);
  }
  to {
    background: rgba(0, 0, 0, 0.8);
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

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes gentle-sway {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(2deg);
  }
  75% {
    transform: rotate(-2deg);
  }
}

/* Responsive design */
@media (max-width: 400px) {
  .readiness-content {
    width: 95%;
    padding: 20px 15px;
    min-height: 450px;
  }

  .capybara-character {
    width: 100px;
    height: 100px;
  }

  .question-text {
    font-size: 14px;
  }

  .ready-button,
  .practice-button {
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

.readiness-overlay {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: 2000;
}
</style>
