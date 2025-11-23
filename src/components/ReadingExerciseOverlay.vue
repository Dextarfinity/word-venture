<template>
  <!-- Reading Exercise Overlay -->
  <div v-if="isOpen" class="reading-exercise-overlay">
    <div class="overlay-backdrop" @click="playClick('student'); closeOverlay()"></div>

    <div class="overlay-content">
      <!-- Header Section -->
      <div class="exercise-header">
        <div class="level-badge">
          <span class="level-text"
            >LEVEL {{ levelInfo.levelNumber }}: {{ levelInfo.levelName }}</span
          >
        </div>
        <div class="practice-badge">
          <span class="practice-text">{{ levelInfo.practiceText }}</span>
        </div>
        <div class="activity-title">
          <h1 class="activity-name">{{ levelInfo.activityName }}</h1>
        </div>
        <div class="level-description">
          <p class="description-text">{{ levelInfo.description }}</p>
        </div>
      </div>

      <!-- Character Card with Background Image -->
      <div class="character-scene">
        <div class="scene-background">
          <!-- Background Image -->
          <img
            src="@/img/background.jpg"
            alt="Nature Background"
            class="background-image"
          />

          <!-- Capybara Character -->
          <div class="character-container">
            <img :src="capybaraImage" alt="Capybara Character" class="capybara-image" />
          </div>
        </div>
      </div>

      <!-- Start Button -->
      <div class="start-section">
        <button class="start-button" @click="playClick('student'); startReading()">START</button>
        <p class="instruction-text">{{ levelInfo.instruction }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from "vue";
import supabase from "../supabase.js";
import Papa from "papaparse";
import { useAudio } from "@/composables/useAudio";

// Audio system
const { playClick } = useAudio();

// Props and Emits
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  currentReadingLevel: {
    type: Number,
    default: 1,
  },
  userStats: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["close", "start-reading"]);

// Dynamic content based on reading level
const levelInfo = computed(() => {
  const level = props.currentReadingLevel || 1;

  const levelMap = {
    1: {
      levelName: "NON-READER",
      levelNumber: 1,
      activityName: "CVC WORDS",
      practiceText: "LETTER SOUNDS PRACTICE",
      instruction: "Listen and repeat the letter sounds.",
      category: "cvc",
      description: "Practice basic letter sounds and simple words",
    },
    2: {
      levelName: "FRUSTRATION",
      levelNumber: 2,
      activityName: "PHONICS MERGER",
      practiceText: "PHONICS PRACTICE",
      instruction: "Listen and repeat the phonics patterns.",
      category: "phonics_merger",
      description: "Learn to blend letter sounds together",
    },
    3: {
      levelName: "INSTRUCTIONAL",
      levelNumber: 3,
      activityName: "BLENDING",
      practiceText: "BLENDING PRACTICE",
      instruction: "Listen and repeat the blended words.",
      category: "blending",
      description: "Master smooth word blending techniques",
    },
    4: {
      levelName: "INDEPENDENT",
      levelNumber: 4,
      activityName: "SILENT READING",
      practiceText: "READING PRACTICE",
      instruction: "Read the words silently and aloud.",
      category: "silent",
      description: "Practice independent reading skills",
    },
  };

  return levelMap[level] || levelMap[1];
});

const capybaraImage = computed(() => {
  // Different capybara images based on level for variety
  const imageMap = {
    1: "capybara (1).png",
    2: "capybara (2).png",
    3: "capybara (3).png",
    4: "capybara (5).png",
  };

  const imageName = imageMap[props.currentReadingLevel] || imageMap[1];

  try {
    return new URL(`../img/CapyBuddy Assets/Capybara/${imageName}`, import.meta.url).href;
  } catch (error) {
    console.error("Error loading capybara image:", error);
    // Fallback to a working image path
    return "/img/CapyBuddy Assets/Capybara/capybara (1).png";
  }
});

// Modal functions
const closeOverlay = () => {
  emit("close");
};

const startReading = () => {
  // Just start the reading exercise - word fetching will happen in the next page
  emit("start-reading");
};
</script>

<style scoped>
.reading-exercise-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: exerciseOverlayFadeIn 0.4s ease-out;
}

.overlay-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  animation: exerciseBackdropFadeIn 0.4s ease-out;
}

.overlay-content {
  position: relative;
  background: white;
  border-radius: 20px;
  width: 85%;
  max-width: 350px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: none;
  animation: exerciseContentSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Header Section */
.exercise-header {
  background: white;
  padding: 20px;
  text-align: center;
  border-radius: 18px 18px 0 0;
  border-bottom: 1px solid #e9ecef;
}

.level-badge {
  margin-bottom: 8px;
}

.level-text {
  font-family: "Jua", cursive;
  font-size: 12px;
  color: #6c757d;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.practice-badge {
  margin-bottom: 12px;
}

.practice-text {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #8b4513;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.activity-title {
  margin-bottom: 8px;
}

.activity-name {
  font-family: "Jua", cursive;
  font-size: 32px;
  font-weight: bold;
  color: #28a745;
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.level-description {
  margin-top: 8px;
}

.description-text {
  font-family: "Jua", cursive;
  font-size: 12px;
  color: #6c757d;
  margin: 0;
  line-height: 1.3;
  font-style: italic;
}

/* Character Scene */
.character-scene {
  padding: 20px;
  height: 250px;
  position: relative;
  overflow: hidden;
}

.scene-background {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  border: 2px solid #ddd;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 18px;
}

/* Character */
.character-container {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.capybara-image {
  width: 90px;
  height: 90px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

/* Start Section */
.start-section {
  text-align: center;
  padding: 20px;
  border-top: 1px solid #e9ecef;
  background: white;
  border-radius: 0 0 18px 18px;
}

.start-button {
  width: 100%;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 16px 20px;
  font-family: "Jua", cursive;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.start-button:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

.start-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.instruction-text {
  font-family: "Jua", cursive;
  font-size: 12px;
  color: #6c757d;
  margin: 0;
  letter-spacing: 0.5px;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .overlay-content {
    width: 95%;
    margin: 10px;
  }

  .character-scene {
    height: 240px;
  }

  .capybara-image {
    width: 70px;
    height: 70px;
  }

  .activity-name {
    font-size: 28px;
  }
}

/* Animations */
@keyframes exerciseOverlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes exerciseBackdropFadeIn {
  from {
    background: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0px);
  }
  to {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }
}

@keyframes exerciseContentSlideIn {
  0% {
    opacity: 0;
    transform: scale(0.85) translateY(-40px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
