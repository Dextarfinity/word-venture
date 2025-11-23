<template>
  <ion-page>
    <ion-content class="relative overflow-hidden" scroll-y="false" fullscreen>
      <!-- Sky Background -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-blue-100"
      ></div>

      <!-- Floating Clouds -->
      <div class="absolute inset-0">
        <div class="cloud cloud-1"></div>
        <div class="cloud cloud-2"></div>
        <div class="cloud cloud-3"></div>
        <div class="cloud cloud-4"></div>
      </div>

      <!-- Header -->
      <div
        class="relative z-10 flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm"
      >
        <ion-button
          @click="
            playClick('student');
            goBack();
          "
          fill="clear"
          class="text-white"
        >
          <ion-icon :icon="arrowBackOutline"></ion-icon>
        </ion-button>
        <h1 class="text-xl font-bold text-brown-700">Word Reading</h1>
        <div class="w-10"></div>
      </div>

      <!-- Word Selection Screen -->
      <div
        v-if="!wordsSelected"
        class="relative z-10 flex flex-col items-center justify-center min-h-[70vh] p-6"
      >
        <div
          class="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl max-w-md w-full"
        >
          <div class="text-center mb-6">
            <img
              :src="getCapybaraExpression()"
              alt="CapyBuddy"
              class="w-20 h-20 mx-auto mb-4"
              @error="handleImageError"
            />
            <h2 class="text-2xl font-bold text-brown-700 mb-2">Word Practice</h2>
            <p class="text-brown-600">Let's practice reading words together!</p>
          </div>

          <div v-if="isGenerating" class="text-center py-8">
            <ion-spinner name="dots" class="w-12 h-12"></ion-spinner>
            <p class="text-brown-600 mt-4">Preparing your words...</p>
          </div>

          <div v-else>
            <ion-button
              @click="
                playClick('student');
                generateWords();
              "
              expand="block"
              class="generate-button mb-4"
              :disabled="availableWords.length === 0"
            >
              <ion-icon :icon="shuffleOutline"></ion-icon>
              {{
                availableWords.length > 0 ? "Generate Practice Words" : "Loading Words..."
              }}
            </ion-button>

            <div class="text-center">
              <p class="text-sm text-brown-600">
                We'll select 5 words for you to practice!
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Word Practice Screen -->
      <div v-else class="relative z-10 flex flex-col h-full">
        <!-- Practice Header -->
        <div class="bg-white/20 backdrop-blur-sm p-4">
          <div class="flex items-center justify-between mb-2">
            <ion-button
              @click="
                playClick('student');
                backToSelection();
              "
              fill="clear"
              size="small"
            >
              <ion-icon :icon="arrowBackOutline"></ion-icon>
              Back
            </ion-button>
            <div class="text-right">
              <div class="text-sm text-brown-600">Progress</div>
              <div class="text-lg font-bold text-brown-800">
                {{ getProgressPercentage() }}%
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-white/50 rounded-full h-3">
            <div
              class="bg-yellow-400 h-3 rounded-full transition-all duration-300"
              :style="{ width: getProgressPercentage() + '%' }"
            ></div>
          </div>
        </div>

        <!-- Current Word Display -->
        <div class="flex-1 flex flex-col items-center justify-center p-6 pb-32">
          <div v-if="getCurrentWord()" class="text-center max-w-md w-full">
            <!-- CapyBuddy -->
            <div class="mb-6">
              <img
                :src="getCapybaraExpression()"
                alt="CapyBuddy"
                class="w-24 h-24 mx-auto transition-transform duration-300"
                :class="{ 'animate-bounce': isListening }"
                @error="handleImageError"
              />
            </div>

            <!-- Word Display -->
            <div class="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl mb-6">
              <div class="text-center">
                <p class="text-sm text-brown-600 mb-2">Say this word:</p>
                <div
                  class="text-6xl font-bold mb-4 transition-all duration-300"
                  :class="{
                    'text-green-600': getCurrentWord().status === 'correct',
                    'text-red-600': getCurrentWord().status === 'incorrect',
                    'text-brown-800': getCurrentWord().status === null,
                    'animate-pulse': isListening,
                  }"
                >
                  {{ getCurrentWord().text }}
                </div>

                <!-- Word category -->
                <div
                  v-if="getCurrentWord().category"
                  class="text-sm text-brown-500 bg-brown-100 px-3 py-1 rounded-full inline-block"
                >
                  {{ getCurrentWord().category }}
                </div>
              </div>
            </div>

            <!-- Status Messages -->
            <div v-if="isListening" class="text-center mb-4">
              <div class="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm">
                🎤 Listening... Say "{{ getCurrentWord().text }}"
              </div>
            </div>

            <div
              v-else-if="getCurrentWord().status === 'correct'"
              class="text-center mb-4"
            >
              <div class="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm">
                ✅ Great job! Perfect pronunciation!
              </div>
            </div>

            <div
              v-else-if="getCurrentWord().status === 'incorrect'"
              class="text-center mb-4"
            >
              <div class="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm">
                ❌ Try again! You can do it!
              </div>
            </div>
          </div>

          <!-- Completed State -->
          <div v-else class="text-center max-w-md w-full">
            <img
              src="@/img/CapyBuddy Assets/Capybara/capybara (1).png"
              alt="CapyBuddy Happy"
              class="w-32 h-32 mx-auto mb-6"
              @error="handleImageError"
            />

            <div class="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
              <h2 class="text-2xl font-bold text-brown-800 mb-4">🎉 Amazing Work!</h2>
              <p class="text-brown-600 mb-6">
                You completed {{ getCompletedCount() }} out of {{ words.length }} words!
              </p>

              <div class="flex gap-3">
                <ion-button
                  @click="
                    playClick('student');
                    tryAgain();
                  "
                  expand="block"
                  fill="outline"
                  class="try-again-button"
                >
                  <ion-icon :icon="refreshOutline"></ion-icon>
                  Try Again
                </ion-button>
                <ion-button
                  @click="
                    playClick('student');
                    generateWords();
                  "
                  expand="block"
                  class="new-words-button"
                >
                  <ion-icon :icon="shuffleOutline"></ion-icon>
                  New Words
                </ion-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sticky Bottom Controls -->
      <div
        v-if="wordsSelected && getCurrentWord()"
        class="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-white/30 p-4 shadow-lg"
      >
        <div class="flex justify-center gap-4 mb-2">
          <!-- Toggle Microphone Button -->
          <ion-button
            @click="
              playClick('student');
              toggleListening();
            "
            :class="isListening ? 'stop-button' : 'mic-button'"
            size="large"
            :color="isListening ? 'danger' : 'primary'"
            :disabled="!speechSystemReady"
          >
            <ion-icon
              :icon="isListening ? stopOutline : micOutline"
              class="text-xl mr-2"
            ></ion-icon>
            {{
              !speechSystemReady
                ? "⏳ Loading..."
                : isListening
                ? "🛑 Stop Listening"
                : "🎤 Start Speaking"
            }}
          </ion-button>

          <!-- Skip button -->
          <ion-button
            @click="
              playClick('student');
              skipWord();
            "
            fill="outline"
            class="skip-button"
            size="default"
          >
            <ion-icon :icon="playSkipForwardOutline"></ion-icon>
            Skip
          </ion-button>
        </div>

        <!-- Speech System Status -->
        <div v-if="!speechSystemReady" class="text-center">
          <div
            class="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm inline-block"
          >
            <ion-spinner name="dots" class="w-4 h-4 inline mr-2"></ion-spinner>
            Preparing speech recognition...
          </div>
        </div>

        <!-- Instructions -->
        <div v-else-if="!isListening" class="text-center">
          <p class="text-sm text-gray-600">
            👆 Tap the microphone button to start speaking
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { IonPage, IonContent, IonButton, IonIcon, IonSpinner } from "@ionic/vue";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import { useAuth, useStudent } from "@/composables/services";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import supabase from "../supabase.js";
import StudentService from "../services/studentService.js";

// Audio system
const { startMusic, stopMusic, playClick, playWordFeedback } = useAudio();

// Auth and student services
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const { studentStats, getStudentStats } = useStudent();

import {
  arrowBackOutline,
  micOutline,
  stopOutline,
  shuffleOutline,
  refreshOutline,
  playSkipForwardOutline,
} from "ionicons/icons";
import { useRouter } from "vue-router";

const router = useRouter();

// Reactive state
const words = ref([]);
const availableWords = ref([]); // Pre-loaded words for selection
const isListening = ref(false);
const wordsSelected = ref(false);
const isGenerating = ref(false);
const speechSystemReady = ref(false);
const isWordCooldown = ref(false); // Cooldown state for 2 second pause
const activeRecognitionSystem = ref(null); // Track which system is active: 'native', 'vosk', or 'webspeech'
const isNativePlatform = Capacitor.isNativePlatform();

// Session tracking variables
const sessionStartTime = ref(null);
const sessionWordTimes = ref([]);
const currentWordStartTime = ref(null);
const currentSessionId = ref(null);
const sessionMiscues = ref([]);
const correctWordsCount = ref(0);
const totalWordsAttempted = ref(0);
const streak = ref(0);
const consecutiveErrors = ref(0);

// Phonics progress tracking
const categoryProgress = ref({
  CVC: { total: 0, correct: 0 },
  Blending: { total: 0, correct: 0 },
  "Silent Letter": { total: 0, correct: 0 },
  "Phonics Merger": { total: 0, correct: 0 },
  "Sight Words": { total: 0, correct: 0 },
  Other: { total: 0, correct: 0 },
});

const sessionData = ref({
  totalWords: 0,
  correctWords: 0,
  totalTime: 0,
  averageAccuracy: 0,
  readingSpeed: 0,
});

// Offline speech recognition variables
let audioContext = null;
let scriptProcessor = null;
let mediaStream = null;
let voskRecognizer = null;
let model = null;
let recognition = null; // Web Speech API recognizer

// Navigation
const goBack = () => {
  router.push("/offline-reading-selection");
};

const backToSelection = () => {
  wordsSelected.value = false;
  resetWords();
};

// Word management
const generateWords = async () => {
  isGenerating.value = true;

  try {
    // Use pre-loaded words if available, otherwise load from CSV
    const allWords =
      availableWords.value.length > 0 ? availableWords.value : await loadWordsFromCSV();

    // Select 5 random words
    const selectedWords = [];
    const shuffled = [...allWords].sort(() => 0.5 - Math.random());

    for (let i = 0; i < Math.min(5, shuffled.length); i++) {
      selectedWords.push({
        text: shuffled[i].word || shuffled[i].Word,
        category: shuffled[i].category || shuffled[i].Category || "General",
        status: null,
      });
    }

    words.value = selectedWords;
    wordsSelected.value = true;

    // Reset session tracking for new session
    resetReadingSession();

    // Start session tracking
    await startReadingSession();

    console.log("📝 Generated words:", words.value);
  } catch (error) {
    console.error("❌ Error generating words:", error);
    alert("Could not load words. Please try again.");
  } finally {
    isGenerating.value = false;
  }
};

// Helper function to reset reading session
const resetReadingSession = () => {
  correctWordsCount.value = 0;
  totalWordsAttempted.value = 0;
  streak.value = 0;
  consecutiveErrors.value = 0;

  // Reset session tracking
  sessionStartTime.value = null;
  sessionWordTimes.value = [];
  currentWordStartTime.value = null;
  sessionMiscues.value = []; // Clear miscues for new session

  // Reset category progress tracking
  categoryProgress.value = {
    CVC: { total: 0, correct: 0 },
    Blending: { total: 0, correct: 0 },
    "Silent Letter": { total: 0, correct: 0 },
    "Phonics Merger": { total: 0, correct: 0 },
    "Sight Words": { total: 0, correct: 0 },
    Other: { total: 0, correct: 0 },
  };

  sessionData.value = {
    totalWords: 0,
    correctWords: 0,
    totalTime: 0,
    averageAccuracy: 0,
    readingSpeed: 0,
  };
};

const loadWordsFromCSV = async () => {
  try {
    const response = await fetch("/csv_offline/updated_words_dataset.csv");
    const csvText = await response.text();

    const lines = csvText.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",");

    const wordsData = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length >= 2) {
        const word = values[0]?.replace(/"/g, "").trim();
        const category = values[1]?.replace(/"/g, "").trim();

        // Accept ALL words regardless of length or category - inclusive approach
        if (word && word.length >= 1) {
          wordsData.push({ word, category: category || "general" });
        }
      }
    }

    console.log("📂 Loaded ALL words from CSV (all categories):", wordsData.length);
    return wordsData;
  } catch (error) {
    console.error("❌ Error loading CSV:", error);

    // Enhanced fallback words with diverse categories
    return [
      // CVC words
      { word: "cat", category: "cvc" },
      { word: "dog", category: "cvc" },
      { word: "sun", category: "cvc" },
      { word: "pen", category: "cvc" },
      { word: "run", category: "cvc" },
      { word: "big", category: "cvc" },
      { word: "red", category: "cvc" },
      { word: "top", category: "cvc" },
      // CVCe words
      { word: "cake", category: "cvce" },
      { word: "bike", category: "cvce" },
      { word: "home", category: "cvce" },
      { word: "cute", category: "cvce" },
      { word: "mice", category: "cvce" },
      // CVCC words
      { word: "jump", category: "cvcc" },
      { word: "milk", category: "cvcc" },
      { word: "hand", category: "cvcc" },
      { word: "soft", category: "cvcc" },
      // Sight words
      { word: "the", category: "sight" },
      { word: "and", category: "sight" },
      { word: "you", category: "sight" },
      { word: "are", category: "sight" },
      { word: "see", category: "sight" },
      // Multi-syllable words
      { word: "happy", category: "multisyllable" },
      { word: "water", category: "multisyllable" },
      { word: "flower", category: "multisyllable" },
      { word: "table", category: "multisyllable" },
      // Complex words
      { word: "school", category: "complex" },
      { word: "friend", category: "complex" },
      { word: "mother", category: "complex" },
      { word: "father", category: "complex" },
    ];
  }
};

// Word helpers
const getCurrentWord = () => {
  return words.value.find((w) => w.status === null);
};

const getCurrentWordIndex = () => {
  return words.value.findIndex((w) => w.status === null);
};

const getCompletedCount = () => {
  return words.value.filter((w) => w.status !== null).length;
};

const getProgressPercentage = () => {
  const total = words.value.length;
  const completed = getCompletedCount();
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

const resetWords = () => {
  words.value.forEach((word) => {
    word.status = null;
  });
};

const tryAgain = async () => {
  // Record the current session before starting a new attempt
  await recordReadingSession();
  
  resetWords();
};

const skipWord = () => {
  const currentWord = getCurrentWord();
  if (currentWord) {
    currentWord.status = "skipped";
  }
};

// Levenshtein distance (edit distance) helper
function levenshtein(a, b) {
  const matrix = [];

  // increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Get the phonics category for a given word
const getWordCategory = (word) => {
  if (!word || typeof word !== "string") return "Other";

  const cleanWord = word.toLowerCase().trim();

  // CVC pattern (Consonant-Vowel-Consonant)
  const cvcPattern = /^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/i;
  if (cvcPattern.test(cleanWord)) {
    return "CVC";
  }

  // Blending patterns (consonant blends at start)
  const blendingPattern = /^(bl|cl|fl|gl|pl|sl|br|cr|dr|fr|gr|pr|tr|sc|sk|sm|sn|sp|st|sw|tw)/i;
  if (blendingPattern.test(cleanWord)) {
    return "Blending";
  }

  // Silent letter patterns
  const silentPattern = /^kn|mb$|^wr|gh|^gn|alk$|ould$/i;
  if (silentPattern.test(cleanWord)) {
    return "Silent Letter";
  }

  // Phonics mergers (digraphs)
  const mergerPattern = /ch|sh|th|wh|ph|ng|ck$|qu/i;
  if (mergerPattern.test(cleanWord)) {
    return "Phonics Merger";
  }

  // Sight words
  const sightWords = [
    "the", "is", "was", "are", "were", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "can", "may", "must", "shall", "might",
    "ought", "am", "be", "been", "being", "go", "goes", "went", "come", "came",
    "get", "got", "make", "made", "take", "took", "see", "saw", "know", "knew",
    "think", "thought",
  ];
  if (sightWords.includes(cleanWord)) {
    return "Sight Words";
  }

  return "Other";
};

// CapyBuddy expressions
const getCapybaraExpression = () => {
  const correctCount = words.value.filter((w) => w.status === "correct").length;
  const incorrectCount = words.value.filter((w) => w.status === "incorrect").length;

  // Use properly encoded paths for CapyBuddy assets
  if (isListening.value) {
    return "/img/CapyBuddy Assets/Capybara/capybara (2).png";
  } else if (correctCount > incorrectCount) {
    return "/img/CapyBuddy Assets/Capybara/capybara (10).png";
  } else if (incorrectCount > 0) {
    return "/img/CapyBuddy Assets/Capybara/capybara (3).png";
  } else {
    return "/img/CapyBuddy Assets/Capybara/capybara (1).png";
  }
};

const handleImageError = (event) => {
  console.error("Image failed to load:", event.target.src);
  event.target.src = "/img/capybara.png";
};

// Initialize on mount
onMounted(async () => {
  console.log("🎵 Starting reading music for OfflineReadingWords...");
  startMusic(MUSIC_TYPES.READING, 0.3);

  console.log("📝 Initializing offline word reading...");

  // Initialize user authentication and data
  try {
    await initAuth();
    if (isAuthenticated.value && profile.value) {
      console.log("✅ User authenticated:", profile.value.email);
      await getStudentStats(profile.value.id);
    }
  } catch (error) {
    console.error("Error loading user data:", error);
  }

  // Pre-load words for faster generation
  try {
    const wordsData = await loadWordsFromCSV();
    // Store the loaded words data for faster generation (but don't auto-select yet)
    availableWords.value = wordsData;
    console.log("📚 Pre-loaded words for selection:", wordsData.length);
  } catch (error) {
    console.error("❌ Error pre-loading words:", error);
  }

  // Initialize speech recognition based on platform with fallback chain
  if (isNativePlatform) {
    console.log("📱 Native platform detected - using Capacitor Speech Recognition");
    await initNativeSpeechRecognition();
    if (!speechSystemReady.value) {
      console.log("⚠️ Native speech recognition failed, trying Web Speech API fallback");
      await initWebSpeechAPI();
    }
  } else {
    console.log("💻 Web platform detected - trying multiple speech recognition methods");
    // Try Vosk first, then Web Speech API as fallback
    await initVoskOfflineRecognition();
    if (!speechSystemReady.value) {
      console.log("⚠️ Vosk initialization failed, trying Web Speech API fallback");
      await initWebSpeechAPI();
    }
  }
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping reading music for OfflineReadingWords...");
  stopMusic();
});

// Native speech recognition initialization for mobile
const initNativeSpeechRecognition = async () => {
  try {
    console.log("🎤 Initializing native speech recognition for words");

    // Check if speech recognition is available
    const available = await SpeechRecognition.available();
    if (!available) {
      console.error("❌ Speech recognition not available on this device");
      return;
    }

    // Request permissions
    const { granted } = await SpeechRecognition.requestPermissions();
    if (!granted) {
      console.error("❌ Speech recognition permissions not granted");
      return;
    }

    speechSystemReady.value = true;
    activeRecognitionSystem.value = 'native';
    console.log("✅ Native speech recognition ready (Capacitor)");
  } catch (error) {
    console.error("❌ Native speech recognition initialization failed:", error);
    speechSystemReady.value = false;
  }
};

// Web Speech API fallback with enhanced error handling
const initWebSpeechAPI = async () => {
  try {
    console.log("🎤 Initializing Web Speech API");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("⚠️ Web Speech API not available in this browser");
      return false;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("🎤 Web Speech API listening started");
    };

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      console.log(`🎤 Web Speech result: "${transcript}"`);
      checkWord(transcript);
    };

    recognition.onerror = (event) => {
      console.warn("⚠️ Web Speech API error:", event.error);
      // Don't stop listening on error - let the user try again
      if (event.error === 'network') {
        console.log("📡 Network error - speech recognition may not work offline");
      }
    };

    recognition.onend = () => {
      console.log("🎤 Web Speech API listening ended");
      isListening.value = false;
    };

    console.log("✅ Web Speech API initialized successfully");
    speechSystemReady.value = true;
    activeRecognitionSystem.value = 'webspeech';
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize Web Speech API:", error);
    return false;
  }
};

// Initialize Vosk offline recognition (copied from WordReadingPage.vue)
const initVoskOfflineRecognition = async () => {
  // Check if user wants to skip Vosk (for debugging)
  const skipVosk = new URLSearchParams(window.location.search).get('skipVosk') === 'true';
  
  // On Vercel, always use Web Speech API due to double-compression issue with tar.gz
  const isVercel = window.location.hostname === 'word-venture.vercel.app' || 
                   window.location.hostname.includes('vercel.app');
  
  if (skipVosk || isVercel) {
    if (isVercel) {
      console.log("🌐 Vercel deployment detected - using Web Speech API for reliability");
    } else {
      console.log("⏭️ Skipping Vosk (skipVosk=true), using Web Speech API directly");
    }
    await initWebSpeechAPI();
    return;
  }
  
  try {
    console.log("🎤 Initializing Vosk offline recognition");

    // Wait for Vosk library to load with multiple strategies
    let vosk = null;
    let attempts = 0;
    const maxAttempts = 30; // Increased for slower loading on mobile/ionic serve

    while (!vosk && attempts < maxAttempts) {
      attempts++;
      console.log(`⏳ Waiting for Vosk library... (${attempts}/${maxAttempts})`);

      // Try multiple ways to access Vosk - check all possible namespaces
      if (typeof window !== "undefined") {
        if (window.vosk) {
          vosk = window.vosk;
          console.log("✅ Found window.vosk");
          break;
        }

        if (window.Vosk) {
          vosk = window.Vosk;
          console.log("✅ Found window.Vosk");
          break;
        }

        if (window.createModel) {
          vosk = { createModel: window.createModel };
          console.log("✅ Found window.createModel function");
          break;
        }
      }

      if (typeof createModel !== "undefined") {
        vosk = { createModel };
        console.log("✅ Found createModel function");
        break;
      }

      // Wait longer between checks for ionic serve
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!vosk) {
      console.error("❌ Vosk library not loaded after waiting");
      console.log(
        "🔍 Available globals:",
        Object.keys(window).filter((k) => k.toLowerCase().includes("vosk"))
      );
      console.log("🔍 Checking for createModel:", typeof window.createModel);

      // Fallback to Web Speech API even in offline mode
      console.log("🔄 Falling back to Web Speech API for offline mode");
      return;
    }

    console.log("🔍 Vosk object:", vosk);
    console.log("🔍 Vosk methods:", Object.keys(vosk));
    console.log("🔍 Vosk prototype:", Object.getPrototypeOf(vosk));
    console.log("🔍 Global vosk references:");
    console.log("  - window.vosk:", window.vosk);
    console.log("  - window.Vosk:", window.Vosk);
    console.log("  - window.KaldiRecognizer:", window.KaldiRecognizer);
    console.log("  - window.Module:", window.Module);

    // Initialize Vosk with better error handling
    console.log("🔧 Loading Vosk model for word recognition...");

    // Try different model paths - prioritizing English for Vosk offline
    const modelPaths = [
      "/models/vosk-model-small-en-us-0.15.tar.gz", // English primary
    ];

    let modelLoaded = false;
    for (const modelPath of modelPaths) {
      try {
        console.log(`🔄 Trying to load model: ${modelPath}`);
        console.log(`📡 Full URL: ${window.location.origin}${modelPath}`);

        // Try to create model with the global vosk
        let model = null;
        if (vosk.createModel) {
          console.log("🔧 Using vosk.createModel() method");
          model = await vosk.createModel(modelPath);
          console.log("✅ Model created successfully:", model);
        } else if (vosk.Model) {
          console.log("🔧 Using new vosk.Model() constructor");
          model = new vosk.Model(modelPath);
          console.log("✅ Model created successfully:", model);
        } else {
          console.error("❌ No model creation method found in Vosk");
          console.error("Available methods:", Object.keys(vosk));
          continue;
        }

        if (!model) {
          console.log(`⚠️ Failed to create model from: ${modelPath}`);
          continue;
        }

        console.log("🔧 Available vosk methods:", Object.keys(vosk));
        console.log("🔧 Available model methods:", Object.keys(model));

        if (model.worker) {
          console.log("🔧 Model worker:", model.worker);
        }
        if (model.recognizers) {
          console.log("🔧 Model recognizers map:", model.recognizers);
        }

        // Create recognizer
        try {
          console.log("🔧 Using model as recognizer (vosk-browser pattern):", model);
          voskRecognizer = model;

          console.log("🔧 Model methods:", Object.keys(model));
          console.log(
            "🔧 Model prototype methods:",
            Object.getOwnPropertyNames(Object.getPrototypeOf(model))
          );

          // Try different recognizer creation approaches
          if (model.acceptWaveform) {
            console.log("🔧 Direct model usage successful: Model has acceptWaveform");
          } else if (model.KaldiRecognizer) {
            try {
              console.log(
                "🔧 Direct model usage failed:",
                new Error(
                  "Model doesn't have acceptWaveform method - trying KaldiRecognizer constructor"
                )
              );
            } catch (e) {
              console.log("🔧 Direct model usage failed:", e);
            }

            console.log("🔧 Trying new model.KaldiRecognizer(16000)...");
            try {
              voskRecognizer = new model.KaldiRecognizer(16000);
              console.log(
                "✅ Created KaldiRecognizer via new model.KaldiRecognizer(16000):",
                voskRecognizer
              );

              // Skip vocabulary setting for now - it's causing type conversion errors
              // The recognizer will work fine with the full model vocabulary
              console.log(
                "🎤 Using full model vocabulary (vocabulary setting disabled to avoid errors)"
              );
            } catch (e) {
              console.error("❌ Failed to create KaldiRecognizer:", e);
              continue;
            }
          } else {
            console.error("❌ Model doesn't have expected methods");
            continue;
          }

          if (!voskRecognizer) {
            console.log(`⚠️ Failed to create recognizer with model: ${modelPath}`);
            continue;
          }

          console.log(`✅ Vosk model loaded successfully: ${modelPath}`);
          modelLoaded = true;
          break;
        } catch (recognizerError) {
          console.error("❌ Error creating recognizer:", recognizerError);
          continue;
        }
      } catch (modelError) {
        console.error(`❌ Error loading model from ${modelPath}:`, modelError);
        continue;
      }
    }

    if (!modelLoaded || !voskRecognizer) {
      console.warn("⚠️ Failed to load Vosk model, falling back to Web Speech API");
      await initWebSpeechAPI();
      return;
    }

    // Setup microphone
    console.log("🎙️ Requesting microphone access for word recognition...");
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });

      const source = audioContext.createMediaStreamSource(mediaStream);
      scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

      console.log("🔧 Recognizer methods:", Object.keys(voskRecognizer));
      console.log(
        "🔧 Recognizer prototype methods:",
        Object.getOwnPropertyNames(Object.getPrototypeOf(voskRecognizer))
      );

      // Set up event listeners for speech recognition results
      console.log("🎤 Setting up Vosk event listeners...");

      voskRecognizer.addEventListener("result", (event) => {
        try {
          const result = event.detail;
          console.log("🎤 Vosk FINAL result detail:", JSON.stringify(result));

          // Check all possible properties where text might be
          const possibleTexts = [
            result.result?.text, // For vosk-browser: {"result":{"text":"word"}}
            result.text, // Direct text property
            result.partial, // Partial results
            result.hypothesis, // Alternative format
            result.alternatives?.[0]?.transcript, // Web Speech API format
            result.alternatives?.[0]?.text, // Alternative format
          ];

          let transcript = null;

          // Find the first non-empty text
          for (let i = 0; i < possibleTexts.length; i++) {
            const text = possibleTexts[i];
            if (typeof text === "string") {
              const trimmedText = text.trim();
              if (trimmedText.length > 0) {
                transcript = trimmedText;
                console.log(`🎤 Vosk Final Result: "${transcript}"`);
                break;
              }
            }
          }

          if (transcript) {
            // Call word checking function directly
            checkWord(transcript);
          }
          // Skip logging empty final results to reduce console noise
        } catch (error) {
          console.error("🎤 Error processing Vosk result:", error);
        }
      });

      // Set up partial results for interim results (if supported)
      voskRecognizer.addEventListener("partialresult", (event) => {
        try {
          const result = event.detail;
          console.log("🎤 Vosk partial result detail:", JSON.stringify(result));

          // Check all possible properties where text might be
          const possibleTexts = [
            result.result?.partial, // For vosk-browser: {"result":{"partial":"word"}}
            result.partial, // Direct partial property
            result.result?.text, // Sometimes partial comes as text
            result.text, // Direct text property
            result.hypothesis, // Alternative format
            result.alternatives?.[0]?.transcript, // Web Speech API format
            result.alternatives?.[0]?.text, // Alternative format
          ];

          let transcript = null;

          // Find the first non-empty text
          for (let i = 0; i < possibleTexts.length; i++) {
            const text = possibleTexts[i];
            if (typeof text === "string") {
              const trimmedText = text.trim();
              if (trimmedText.length > 0) {
                transcript = trimmedText;
                console.log(`🎤 Vosk Interim Result: "${transcript}"`);
                break;
              }
            }
          }

          // Interim results can be used for UI feedback but not for word checking
          // Skip logging empty partial results to reduce console noise
        } catch (error) {
          console.error("🎤 Error processing Vosk partial result:", error);
        }
      });

      // Add error event listener
      voskRecognizer.addEventListener("error", (event) => {
        console.error("🎤 Vosk error event:", event);
      });

      scriptProcessor.onaudioprocess = (e) => {
        if (!isListening.value || !voskRecognizer) return;

        try {
          const inputBuffer = e.inputBuffer.getChannelData(0);

          // Check if we have audio data
          let hasAudio = false;
          for (let i = 0; i < inputBuffer.length; i++) {
            if (Math.abs(inputBuffer[i]) > 0.01) {
              // Threshold for detecting actual audio
              hasAudio = true;
              break;
            }
          }

          if (hasAudio) {
            // Only log occasionally to avoid spam
            if (Math.random() < 0.01) {
              // 1% chance to log
              console.log("🎤 Processing audio data, buffer length:", inputBuffer.length);
            }

            if (voskRecognizer.acceptWaveform) {
              voskRecognizer.acceptWaveform(e.inputBuffer);
            } else if (voskRecognizer.acceptWaveformFloat) {
              voskRecognizer.acceptWaveformFloat(inputBuffer);
            } else {
              console.warn("🎤 Recognizer has no acceptWaveform method");
            } // Vosk uses event-based results, not synchronous method calls
            // Results are handled by the 'result' and 'partialresult' event listeners above
          }
        } catch (error) {
          console.error("🎤 Error processing audio:", error);
        }
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      console.log("✅ Starting immediate word checking (no buffering delays)");
    } catch (error) {
      throw new Error(`Microphone setup failed: ${error.message}`);
    }

    speechSystemReady.value = true;
    activeRecognitionSystem.value = 'vosk';
    console.log("✅ Vosk offline word recognition ready");
    console.log("🎯 Starting reading with Vosk offline mode");
  } catch (error) {
    console.error("🚫 Vosk word recognition initialization failed:", error);
    console.error("Error details:", error.stack);
    console.log("🔄 Falling back to Web Speech API due to Vosk error");
    await initWebSpeechAPI();
  }
};

// 🎙️ Toggle mic (offline mode only)
const toggleListening = async () => {
  if (isNativePlatform) {
    // Use native speech recognition on mobile
    if (!isListening.value) {
      await startNativeSpeechRecognition();
    } else {
      await stopNativeSpeechRecognition();
    }
  } else {
    // Use Web Speech API or Vosk on web
    if (recognition) {
      // Use Web Speech API fallback
      if (!isListening.value) {
        isListening.value = true;
        recognition.start();
        console.log("🎤 Started Web Speech API listening");
      } else {
        isListening.value = false;
        recognition.stop();
        console.log("🎤 Stopped Web Speech API listening");
      }
    } else if (voskRecognizer) {
      // Use Vosk
      if (!isListening.value) {
        isListening.value = true;
        console.log("🎤 Started Vosk offline listening");
      } else {
        isListening.value = false;
        console.log("🎤 Stopped Vosk offline listening");

        // Try to get final result from Vosk before stopping
        if (voskRecognizer && voskRecognizer.retrieveFinalResult) {
          try {
            const finalResult = voskRecognizer.retrieveFinalResult();
            console.log("🎤 Vosk final result on stop:", finalResult);
            if (finalResult && finalResult.text && finalResult.text.trim()) {
              const transcript = finalResult.text.trim();
              console.log("🎤 Vosk Final Result (on stop):", transcript);
              checkWord(transcript);
            }
          } catch (error) {
            console.error("🎤 Error retrieving final result:", error);
          }
        }
      }
    } else {
      // Neither system is ready, try to initialize
      console.log("🔄 No speech system ready, initializing...");
      await initVoskOfflineRecognition();
    }
  }
};

// ✅ Check spoken word against current word (advanced version from WordReadingPage)
const checkWord = (spokenText) => {
  console.log("🔍 === checkWord function called ===");
  console.log("🎤 Spoken word:", spokenText);
  console.log("📚 Available words:", words.value);

  const target = words.value.find((w) => w.status === null);
  console.log("🎯 Target word found:", target);

  if (!target) {
    console.log("❌ No words left to check");
    return; // no words left
  }

  // Start word timer if not already started
  if (!currentWordStartTime.value) {
    startWordTimer();
  }

  // Increment total words attempted
  totalWordsAttempted.value++;

  // Get current word position in the list
  const wordPosition = words.value.findIndex((w) => w === target) + 1;

  // Calculate similarity (Levenshtein)
  const distance = levenshtein(spokenText.toUpperCase(), target.text.toUpperCase());
  const maxLen = Math.max(spokenText.length, target.text.length);
  const similarity = 1 - distance / maxLen;

  console.log(`📊 Similarity calculation:`);
  console.log(`   Input: "${spokenText.toUpperCase()}" vs Target: "${target.text.toUpperCase()}"`);
  console.log(
    `   Distance: ${distance}, Max Length: ${maxLen}, Similarity: ${similarity}`
  );

  if (similarity >= 0.6) {
    console.log("✅ Word matched! Marking as correct");
    target.status = "correct";
    
    // 🎵 Play correct word sound
    playWordFeedback(true);
    
    streak.value++; // Increase streak
    consecutiveErrors.value = 0; // Reset consecutive errors
    correctWordsCount.value++; // Track correct words for results

    // Track word category for phonics progress
    const category = getWordCategory(target.text);
    if (categoryProgress.value[category]) {
      categoryProgress.value[category].total++;
      categoryProgress.value[category].correct++;
    }

    // End word timer with success
    endWordTimer(true);

    // Stop listening immediately
    stopListening();

    console.log(`🔥 Streak increased to: ${streak.value}`);
    console.log(`✅ Category progress for "${category}":`, categoryProgress.value[category]);
  } else {
    console.log("❌ Word not matched. Marking as incorrect");
    target.status = "incorrect";
    
    // 🎵 Play incorrect word sound
    playWordFeedback(false);
    
    consecutiveErrors.value++; // Increase consecutive errors

    // Track word category for phonics progress (incorrect attempt)
    const category = getWordCategory(target.text);
    if (categoryProgress.value[category]) {
      categoryProgress.value[category].total++;
    }

    // 📝 Record the miscue for detailed analytics
    const miscueType = determineMiscueType(target.text, spokenText);
    recordMiscue(target.text, spokenText, wordPosition, miscueType);

    // End word timer with failure
    endWordTimer(false);

    // Start cooldown to prevent rapid successive checks, then stop listening
    isWordCooldown.value = true;
    setTimeout(() => {
      target.status = null;
      isWordCooldown.value = false;
      stopListening();
    }, 2000);

    console.log(`😞 Consecutive errors: ${consecutiveErrors.value}`);
    console.log(`❌ Category progress for "${category}":`, categoryProgress.value[category]);
  }

  console.log("🔍 === checkWord function end ===");
};

// Determine the type of miscue based on expected vs actual reading
const determineMiscueType = (expected, actual) => {
  if (!actual || actual.trim() === "") {
    return "omission"; // Student skipped the word
  }

  if (actual.length > expected.length * 1.5) {
    return "insertion"; // Student added extra words/sounds
  }

  if (actual.toLowerCase() !== expected.toLowerCase()) {
    // Check if it's a substitution (completely different word) or mispronunciation
    const similarity = 1 - levenshtein(actual.toLowerCase(), expected.toLowerCase()) / Math.max(actual.length, expected.length);
    if (similarity < 0.3) {
      return "substitution"; // Completely different word
    } else {
      return "mispronunciation"; // Similar but not quite right
    }
  }

  return "mispronunciation"; // Default fallback
};

// Record a miscue (reading error) in the database
const recordMiscue = async (
  expectedWord,
  actualReading,
  wordPosition,
  miscueType = "mispronunciation"
) => {
  try {
    if (!profile.value?.id || !currentSessionId.value) {
      console.log("⚠️ Cannot record miscue - no user or session ID");
      return;
    }

    console.log(`📝 Recording miscue: "${actualReading}" instead of "${expectedWord}"`);

    // Store miscue in session array for review
    const miscueData = {
      user_id: profile.value.id,
      session_id: currentSessionId.value,
      expected_word: expectedWord,
      actual_reading: actualReading,
      miscue_type: miscueType,
      word_position: wordPosition,
      timestamp: new Date().toISOString(),
    };

    sessionMiscues.value.push(miscueData);

    const { error } = await supabase.from("reading_miscues").insert(miscueData);

    if (error) {
      console.error("Error recording miscue:", error);
    } else {
      console.log("✅ Miscue recorded successfully");
    }
  } catch (error) {
    console.error("❌ Error in recordMiscue:", error);
  }
};

// Track when a word reading attempt starts
const startWordTimer = () => {
  currentWordStartTime.value = Date.now();
};

// Track when a word reading attempt ends
const endWordTimer = (wasCorrect = false) => {
  if (currentWordStartTime.value) {
    const timeSpent = Date.now() - currentWordStartTime.value;
    sessionWordTimes.value.push({
      timeSpent,
      wasCorrect,
      timestamp: Date.now(),
    });
    currentWordStartTime.value = null;
  }
};

// Calculate session statistics
const calculateSessionStats = () => {
  const endTime = Date.now();
  const totalSessionTime = sessionStartTime.value
    ? (endTime - sessionStartTime.value) / 1000
    : 0; // in seconds

  const totalWords = totalWordsAttempted.value;
  const correctWords = correctWordsCount.value;
  const accuracy = totalWords > 0 ? (correctWords / totalWords) * 100 : 0;

  // Calculate reading speed (words per minute)
  const readingSpeed = totalSessionTime > 0 ? totalWords / (totalSessionTime / 60) : 0;

  sessionData.value = {
    totalWords,
    correctWords,
    totalTime: Math.round(totalSessionTime),
    averageAccuracy: Math.round(accuracy * 100) / 100,
    readingSpeed: Math.round(readingSpeed * 100) / 100,
  };

  console.log("📊 Session Stats:", sessionData.value);
  return sessionData.value;
};

// Start tracking a reading session
const startReadingSession = async () => {
  console.log("📊 Starting reading session tracking");

  try {
    if (!profile.value?.id) {
      console.log("⚠️ No user profile, skipping session creation");
      return;
    }

    // Create reading session in database
    const sessionDataToInsert = {
      user_id: profile.value.id,
      start_time: new Date().toISOString(),
      session_type: "offline_word_reading",
    };

    console.log("📝 Creating reading session in database...");
    const { data, error } = await supabase
      .from("reading_sessions")
      .insert(sessionDataToInsert)
      .select();

    if (error) {
      console.error("Error creating reading session:", error);
    } else {
      currentSessionId.value = data?.[0]?.id;
      console.log("✅ Session created with ID:", currentSessionId.value);
    }
  } catch (error) {
    console.error("❌ Error in startReadingSession:", error);
    // Fallback to string ID
    currentSessionId.value = `session_${Date.now()}`;
  }

  sessionStartTime.value = Date.now();
  sessionWordTimes.value = [];
  sessionData.value.totalWords = words.value.length;
};

// Record reading session to database
const recordReadingSession = async () => {
  if (!profile.value?.id) {
    console.warn("No user profile found, skipping session recording");
    return;
  }

  try {
    const stats = calculateSessionStats();

    // Record the completed reading session
    const sessionDataToUpdate = {
      end_time: new Date().toISOString(),
      words_read: stats.totalWords,
      correct_words: stats.correctWords,
      accuracy_percentage: stats.averageAccuracy,
      reading_speed_wpm: stats.readingSpeed,
      total_time_seconds: stats.totalTime,
    };

    console.log("📝 Updating reading session:", sessionDataToUpdate);

    if (currentSessionId.value && !currentSessionId.value.startsWith('session_')) {
      const { error } = await supabase
        .from("reading_sessions")
        .update(sessionDataToUpdate)
        .eq("id", currentSessionId.value);

      if (error) {
        console.error("Error updating reading session:", error);
      } else {
        console.log("✅ Reading session recorded successfully");
      }
    }

    // Update user progress
    await updateUserProgress(stats);
  } catch (error) {
    console.error("❌ Error recording reading session:", error);
  }
};

// Update user progress in database
const updateUserProgress = async (stats) => {
  if (!profile.value?.id) return;

  try {
    const progressData = {
      words_read: stats.totalWords,
      correct_words: stats.correctWords,
      accuracy_percentage: stats.averageAccuracy,
      reading_speed_wpm: stats.readingSpeed,
    };

    console.log("📊 Updating user progress:", progressData);

    const result = await StudentService.updateUserStats(profile.value.id, progressData);

    if (result.success) {
      console.log("✅ User progress updated successfully");
      await getStudentStats(profile.value.id);
    } else {
      console.error("Error updating user progress:", result.error);
    }
  } catch (error) {
    console.error("❌ Error updating user progress:", error);
  }
};

// Native speech recognition functions for mobile
const startNativeSpeechRecognition = async () => {
  try {
    console.log("🎤 Starting native speech recognition");

    // Check permissions before starting
    const permissionStatus = await SpeechRecognition.checkPermissions();
    console.log("🎤 Permission status:", permissionStatus);

    if (permissionStatus.speechRecognition !== "granted") {
      console.log("🎤 Requesting speech recognition permissions...");
      const result = await SpeechRecognition.requestPermissions();
      console.log("🎤 Permission request result:", result);

      if (!result.granted) {
        console.error("❌ Speech recognition permissions denied");
        alert(
          "Microphone permission is required for speech recognition. Please enable it in your device settings."
        );
        return;
      }
    }

    isListening.value = true;

    await SpeechRecognition.start({
      language: "en-US",
      maxResults: 1,
      prompt: "Say the word",
      partialResults: true,
      popup: false,
    });

    // Listen for partial results
    SpeechRecognition.addListener("partialResults", (data) => {
      if (data.matches && data.matches.length > 0) {
        const transcript = data.matches[0];
        console.log("🎤 Native Partial Result:", transcript);
        checkWord(transcript, false);
      }
    });

    // Listen for final results
    SpeechRecognition.addListener("finalResults", (data) => {
      if (data.matches && data.matches.length > 0) {
        const transcript = data.matches[0];
        console.log("🎤 Native Final Result:", transcript);
        checkWord(transcript, true);
      }
    });
  } catch (error) {
    console.error("❌ Error starting native speech recognition:", error);
    alert("Failed to start speech recognition: " + error.message);
    isListening.value = false;
  }
};

const stopNativeSpeechRecognition = async () => {
  try {
    await SpeechRecognition.stop();
    SpeechRecognition.removeAllListeners();
    isListening.value = false;
    console.log("🛑 Stopped native speech recognition");
  } catch (error) {
    console.error("❌ Error stopping native speech recognition:", error);
  }
};

// Stop listening for word recognition (does NOT stop background music)
const stopListening = async () => {
  try {
    if (isNativePlatform) {
      // Stop native recognition
      if (isListening.value) {
        await stopNativeSpeechRecognition();
      }
    } else {
      // Stop Web Speech API or Vosk
      if (recognition && recognition.stop) {
        isListening.value = false;
        recognition.stop();
        console.log("🛑 Web Speech API stopped");
      }
      
      // Stop Vosk listening
      if (voskRecognizer) {
        isListening.value = false;
        console.log("🛑 Vosk listening stopped");
      }
    }
    console.log("🎤 Speech recognition stopped (music continues playing)");
  } catch (error) {
    console.error("❌ Error stopping speech recognition:", error);
  }
};

// Cleanup
onBeforeUnmount(() => {
  // Stop native speech if running
  if (isNativePlatform && isListening.value) {
    stopNativeSpeechRecognition();
  }

  if (scriptProcessor) {
    scriptProcessor.disconnect();
  }

  if (audioContext && audioContext.state !== "closed") {
    audioContext.close();
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
  }
});
</script>

<style scoped>
/* Cloud animations */
.cloud {
  position: absolute;
  background: white;
  border-radius: 50px;
  opacity: 0.7;
}

.cloud:before,
.cloud:after {
  content: "";
  position: absolute;
  background: white;
  border-radius: 50px;
}

.cloud-1 {
  width: 80px;
  height: 40px;
  top: 10%;
  left: 10%;
  animation: float 20s infinite linear;
}

.cloud-1:before {
  width: 50px;
  height: 50px;
  top: -25px;
  left: 10px;
}

.cloud-1:after {
  width: 60px;
  height: 40px;
  top: -15px;
  right: 10px;
}

.cloud-2 {
  width: 60px;
  height: 30px;
  top: 25%;
  right: 15%;
  animation: float 25s infinite linear reverse;
}

.cloud-2:before {
  width: 40px;
  height: 40px;
  top: -20px;
  left: 5px;
}

.cloud-2:after {
  width: 50px;
  height: 30px;
  top: -10px;
  right: 5px;
}

.cloud-3 {
  width: 40px;
  height: 20px;
  bottom: 30%;
  left: 5%;
  animation: float 30s infinite linear;
}

.cloud-4 {
  width: 70px;
  height: 35px;
  bottom: 40%;
  right: 10%;
  animation: float 18s infinite linear reverse;
}

@keyframes float {
  0% {
    transform: translateX(-20px);
  }
  100% {
    transform: translateX(20px);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}

.animate-pulse {
  animation: pulse 1.5s infinite;
}

/* Button styles */
.generate-button {
  --background: linear-gradient(135deg, #ab47bc, #9c27b0);
  --background-hover: linear-gradient(135deg, #9c27b0, #8e24aa);
  --color: white;
  --border-radius: 15px;
  --padding-top: 15px;
  --padding-bottom: 15px;
  font-weight: 600;
  font-family: "Jua", cursive;
}

.mic-button {
  --background: linear-gradient(135deg, #66bb6a, #4caf50);
  --background-hover: linear-gradient(135deg, #4caf50, #388e3c);
  --color: white;
  --border-radius: 25px;
  --padding-start: 25px;
  --padding-end: 25px;
  --padding-top: 15px;
  --padding-bottom: 15px;
  font-weight: 600;
  font-family: "Jua", cursive;
}

.stop-button {
  --background: linear-gradient(135deg, #ffa726, #ff8a50);
  --background-hover: linear-gradient(135deg, #ff9800, #ff6f00);
  --color: white;
  --border-radius: 25px;
  --padding-start: 25px;
  --padding-end: 25px;
  --padding-top: 15px;
  --padding-bottom: 15px;
  font-weight: 600;
  font-family: "Jua", cursive;
}

.skip-button {
  --border-color: #ab47bc;
  --color: #ab47bc;
  --border-radius: 25px;
  --padding-start: 20px;
  --padding-end: 20px;
  --padding-top: 15px;
  --padding-bottom: 15px;
  font-family: "Jua", cursive;
}

.try-again-button {
  --border-color: #f59e0b;
  --color: #f59e0b;
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-family: "Jua", cursive;
}

.new-words-button {
  --background: linear-gradient(135deg, #42a5f5, #478ed1);
  --background-hover: linear-gradient(135deg, #2196f3, #1976d2);
  --color: white;
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-family: "Jua", cursive;
}

/* Tailwind-like utilities */
.text-brown-700 {
  color: #8b4513;
}
.text-brown-800 {
  color: #7c2d12;
}
.text-brown-600 {
  color: #a0522d;
}
.text-brown-500 {
  color: #a16207;
}
.bg-brown-100 {
  background-color: #fef3c7;
}
.bg-white\/20 {
  background-color: rgba(255, 255, 255, 0.2);
}
.bg-white\/90 {
  background-color: rgba(255, 255, 255, 0.9);
}
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}
.text-green-600 {
  color: #4caf50;
}
.text-red-600 {
  color: #ffa726;
}
.bg-blue-100 {
  background-color: #dbeafe;
}
.text-blue-800 {
  color: #1e40af;
}
.bg-green-100 {
  background-color: #dcfce7;
}
.text-green-800 {
  color: #166534;
}
.bg-red-100 {
  background-color: #fee2e2;
}
.text-red-800 {
  color: #991b1b;
}
</style>
