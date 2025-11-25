<template>
  <!-- Word Selection Overlay -->
  <transition name="modal-fade" appear>
    <div v-if="isOpen" class="word-selection-overlay" @click="closeOverlay">
      <transition name="modal-scale" appear>
        <div v-if="isOpen" class="overlay-content" @click.stop>
      <!-- Header with background -->
      <div class="header-section">
        <p class="instruction-text">Listen and repeat the Words.</p>
      </div>

      <!-- Word Cards Section -->
      <div class="words-section">
        <div
          v-for="(word, index) in words || []"
          :key="index"
          class="word-row"
          :class="[getWordColor(index), { speaking: isSpeaking }]"
          @click="selectWord(word)"
        >
          <!-- Word Label Section -->
          <div class="word-label-section">
            <span class="word-text">{{ getWordText(word) }}</span>
          </div>

          <!-- Letter tiles section -->
          <div class="letter-tiles-section">
            <div
              v-for="(letter, letterIndex) in getWordText(word).split('')"
              :key="letterIndex"
              class="letter-tile"
            >
              {{ letter }}
            </div>
          </div>

          <!-- Audio button -->
          <div class="audio-button" @click.stop="playClick('student'); playAudio(getWordText(word))">
            <ion-icon :icon="volumeHighOutline" class="audio-icon"></ion-icon>
          </div>
        </div>
      </div>

      <!-- Next Button -->
      <div class="next-section">
        <button class="next-button" @click="playClick('student'); proceedToNext()">NEXT</button>
      </div>
    </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { IonIcon } from "@ionic/vue";
import { volumeHighOutline } from "ionicons/icons";
import { defineProps, defineEmits, ref, watch, onBeforeUnmount } from "vue";
import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

// Props and Emits
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  words: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "show-readiness-modal"]);

// Reactive state for TTS
const isSpeaking = ref(false);

// Word color mapping
const getWordColor = (index) => {
  const colors = ["green", "orange", "orange", "red", "purple"];
  return `word-${colors[index % colors.length]}`;
};

// Watch for modal open/close
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    console.log("🎵 Starting menu music for WordSelectionModal...");
    startMusic(MUSIC_TYPES.MENU, 0.3);
  } else {
    console.log("🔇 Stopping menu music for WordSelectionModal...");
    stopMusic();
  }
});

// Functions
const closeOverlay = () => {
  playClick('student'); // 🎵 Play click sound
  stopMusic(); // 🔇 Stop menu music
  emit("close");
};

const getWordText = (word) => {
  // Handle both string words and object words
  if (typeof word === "string") {
    return word;
  }
  // If it's an object, extract the text property
  return word?.text || word?.word || word?.name || String(word);
};

// Voice loading helper for better compatibility
const loadVoices = () => {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
      // Fallback timeout
      setTimeout(() => {
        resolve(window.speechSynthesis.getVoices());
      }, 1000);
    }
  });
};

// Text-to-Speech functionality for Grade 1 students
const speakWord = async (wordText) => {
  try {
    const isNativePlatform = Capacitor.isNativePlatform();

    if (isNativePlatform) {
      // Use native Capacitor TTS for Android/iOS
      isSpeaking.value = true;
      try {
        await TextToSpeech.speak({
          text: wordText,
          lang: "en-US",
          rate: 0.7, // Slower for Grade 1 students
          pitch: 1.2, // Higher pitch for child-friendly voice
          volume: 1.0,
        });
        console.log("🔊 Native TTS played:", wordText);
      } catch (error) {
        console.error("Native TTS error:", error);
        // Fallback to Web Speech API
        await speakWordWeb(wordText);
      } finally {
        isSpeaking.value = false;
      }
    } else {
      // Use Web Speech API for web browsers
      await speakWordWeb(wordText);
    }
  } catch (error) {
    console.error("Text-to-Speech error:", error);
    isSpeaking.value = false;
  }
};

// Web Speech API fallback for browsers
const speakWordWeb = async (wordText) => {
  try {
    // Stop any currently speaking utterances
    window.speechSynthesis.cancel();

    // Create new speech utterance
    const utterance = new SpeechSynthesisUtterance(wordText);

    // Configure speech settings for Grade 1 students
    utterance.rate = 0.7; // Slower rate for young learners
    utterance.pitch = 1.2; // Higher pitch for child-friendly voice
    utterance.volume = 1.0;

    // Load voices properly (async)
    const voices = await loadVoices();

    // Priority order for child-friendly voices
    const childFriendlyVoice =
      voices.find((voice) => {
        const voiceName = voice.name.toLowerCase();
        const voiceLang = voice.lang.toLowerCase();

        // Look for female voices (generally more child-friendly)
        // and voices that sound younger/friendlier
        return (
          voiceLang.includes("en") &&
          (voiceName.includes("female") ||
            voiceName.includes("zira") || // Microsoft Zira (child-friendly)
            voiceName.includes("hazel") || // Microsoft Hazel (UK female)
            voiceName.includes("susan") || // Microsoft Susan (female)
            voiceName.includes("samantha") || // macOS Samantha (female)
            voiceName.includes("karen") || // macOS Karen (female)
            voiceName.includes("tessa") || // macOS Tessa (female)
            voiceName.includes("veena") || // macOS Veena (female)
            voiceName.includes("fiona") || // macOS Fiona (female)
            (voiceName.includes("google") && voiceName.includes("female")) ||
            (voiceName.includes("google") && voiceName.includes("us english 2"))) // Google female voice
        );
      }) ||
      voices.find(
        (voice) =>
          // Fallback to any English female voice
          voice.lang.includes("en") && voice.name.toLowerCase().includes("female")
      ) ||
      voices.find((voice) =>
        // Final fallback to any English voice
        voice.lang.includes("en")
      );

    if (childFriendlyVoice) {
      utterance.voice = childFriendlyVoice;
      console.log("🎯 Using child-friendly voice:", childFriendlyVoice.name);
    } else {
      console.log("ℹ️ Using default system voice for child speech");
    }

    // Add event listeners with child-friendly feedback
    utterance.onstart = () => {
      console.log("🔊 Started speaking:", wordText);
      isSpeaking.value = true;
    };
    utterance.onend = () => {
      console.log("✅ Finished speaking:", wordText);
      isSpeaking.value = false;
    };
    utterance.onerror = (event) => {
      console.error("❌ Speech error:", event.error);
      isSpeaking.value = false;
    };

    // Speak the word
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("Web Speech API error:", error);
    isSpeaking.value = false;
  }
};

const selectWord = (word) => {
  playClick('student');
  const wordText = getWordText(word);
  console.log("Selected word:", wordText);

  // Speak the word when card is clicked
  speakWord(wordText);
};

const playAudio = (word) => {
  playClick('student');
  const wordText = typeof word === "string" ? word : getWordText(word);
  console.log("Playing audio for:", wordText);

  // Speak the word when audio button is clicked
  speakWord(wordText);
};

const proceedToNext = () => {
  console.log("🎯 Next button clicked - showing readiness confirmation");
  emit("show-readiness-modal");
};

// Cleanup on unmount
onBeforeUnmount(() => {
  console.log("🔇 WordSelectionModal unmounting - stopping music...");
  stopMusic();
});
</script>

<style scoped>
.word-selection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1001; /* Higher than the first overlay */
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlayFadeIn 0.3s ease-in-out;
}

.overlay-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  animation: backdropBlur 0.3s ease-in-out;
}

.overlay-content {
  position: relative;
  background: url("@/img/background.jpg") center/cover;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  animation: wordModalSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  border: none;
  padding: 30px 20px 20px;
}

/* Header Section */
.header-section {
  text-align: center;
  margin-bottom: 30px;
  padding-top: 20px;
}

.instruction-text {
  font-family: "Jua", cursive;
  font-size: 16px;
  color: #2c3e50;
  margin: 0;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

/* Words Section */
.words-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
}

.word-row {
  display: flex;
  align-items: center;
  border-radius: 15px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  gap: 12px;
}

.word-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.word-row.speaking {
  animation: speakingPulse 1s ease-in-out infinite;
  transform: scale(1.02);
}

@keyframes speakingPulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }
}

.word-row.speaking {
  animation: speakingPulse 1s ease-in-out infinite;
  transform: scale(1.02);
}

@keyframes speakingPulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }
}

/* Word Label Section */
.word-label-section {
  min-width: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.word-text {
  font-family: "Jua", cursive;
  font-size: 16px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

/* Word Colors */
.word-green {
  background: linear-gradient(135deg, #4caf50, #66bb6a);
}

.word-orange {
  background: linear-gradient(135deg, #ff9800, #ffb74d);
}

.word-red {
  background: linear-gradient(135deg, #f44336, #ef5350);
}

.word-purple {
  background: linear-gradient(135deg, #9c27b0, #ba68c8);
}

/* Letter Tiles Section */
.letter-tiles-section {
  display: flex;
  gap: 4px;
  flex: 1;
  align-items: center;
}

.letter-tile {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Jua", cursive;
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

/* Audio Button */
.audio-button {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.audio-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.audio-icon {
  color: white;
  font-size: 20px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

/* Next Button */
.next-section {
  text-align: center;
  padding-top: 10px;
}

.next-button {
  width: 100%;
  background: linear-gradient(135deg, #ff9800, #ffb74d);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 16px 20px;
  font-family: "Jua", cursive;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.next-button:hover {
  background: linear-gradient(135deg, #f57c00, #ff9800);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 152, 0, 0.5);
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .overlay-content {
    width: 95%;
    max-width: 95%;
    margin: 10px;
    padding: 20px 12px 12px;
    max-height: 85vh;
  }

  .header-section {
    margin-bottom: 20px;
    padding-top: 10px;
  }

  .instruction-text {
    font-size: 14px;
  }

  .words-section {
    gap: 10px;
    margin-bottom: 20px;
  }

  .word-row {
    padding: 8px 10px;
    gap: 8px;
  }

  .word-label-section {
    min-width: 45px;
  }

  .word-text {
    font-size: 12px;
  }

  .letter-tiles-section {
    gap: 3px;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .letter-tiles-section::-webkit-scrollbar {
    display: none;
  }

  .letter-tile {
    width: 32px;
    height: 32px;
    font-size: 14px;
    min-width: 32px;
  }

  .audio-button {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }

  .audio-icon {
    font-size: 16px;
  }

  .next-button {
    padding: 14px 16px;
    font-size: 14px;
  }
}

@media (max-width: 380px) {
  .overlay-content {
    padding: 15px 10px 10px;
  }

  .word-label-section {
    min-width: 40px;
  }

  .word-text {
    font-size: 11px;
  }

  .letter-tile {
    width: 28px;
    height: 28px;
    font-size: 12px;
    min-width: 28px;
  }

  .audio-button {
    width: 28px;
    height: 28px;
    min-width: 28px;
  }

  .audio-icon {
    font-size: 14px;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .overlay-content {
    max-width: 450px;
  }
}

@media (min-height: 700px) {
  .overlay-content {
    max-height: 80vh;
  }
}

@media (max-height: 600px) {
  .overlay-content {
    max-height: 95vh;
    padding: 15px 15px 10px;
  }

  .header-section {
    margin-bottom: 15px;
    padding-top: 5px;
  }

  .words-section {
    gap: 8px;
    margin-bottom: 15px;
  }

  .word-row {
    padding: 6px 10px;
  }
}

/* Animations */
@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes backdropBlur {
  from {
    background: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0px);
  }
  to {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(6px);
  }
}

@keyframes wordModalSlideIn {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-30px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
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

.word-selection-overlay {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: 2000;
}
</style>
