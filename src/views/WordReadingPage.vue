<template>
  <ion-page>
    <ion-content class="relative overflow-hidden" scroll-y="false" fullscreen>
      <!-- Loading Screen -->
      <loading-screen :is-loading="isLoading" message="Preparing your lesson" />

      <!-- Background -->
      <div class="absolute inset-0 page-background"></div>

      <!-- Header -->
      <div class="relative z-10 bg-white/90 backdrop-blur-sm shadow-sm">
        <div class="flex items-center justify-between px-6 py-4">
          <!-- Back Button -->
          <button
            @click="
              playClick('student');
              $router.push('/tabs/student-home');
            "
            class="flex items-center text-blue-600 font-semibold"
          >
            <ion-icon :icon="arrowBackOutline" class="mr-2 text-xl"></ion-icon>
          </button>

          <!-- Title -->
          <div class="text-center flex-1">
            <h1
              class="text-xl font-bold text-blue-800"
              style="font-family: 'Jua', cursive"
            >
              {{ getDynamicTitle() }}
            </h1>
            <p class="text-sm text-blue-600">{{ getDynamicSubtitle() }}</p>
          </div>

          <!-- Streak Counter -->
          <div class="text-right">
            <div class="bg-green-400 rounded-full px-3 py-1 flex items-center gap-1">
              <span class="text-white font-bold text-xs">🔥</span>
              <span
                class="text-white font-bold text-sm"
                style="font-family: 'Jua', cursive"
                >{{ userStatsComputed.streak_days || 0 }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <div
        class="relative z-10 flex flex-col items-center justify-center p-6 pt-4 pb-24"
        style="min-height: calc(100vh - 120px)"
      >
        <!-- Capybara Character -->
        <div class="mb-6">
          <img
            :src="getCapybaraExpression()"
            alt="Capybara mascot"
            class="w-24 h-24 object-contain transition-all duration-500 transform"
            :class="{
              'animate-bounce': streak >= 5,
              'animate-pulse': consecutiveErrors >= 2,
              'scale-110': streak >= 3,
            }"
          />
        </div>

        <!-- Word tiles block -->
        <!-- Word Display Card -->
        <div
          class="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8 border-4 border-white/50"
        >
          <div v-if="words.length > 0" class="text-center">
            <!-- Current Word Display -->
            <div class="mb-4">
              <p class="text-sm text-blue-600 font-medium mb-2">Read this word:</p>
              <div class="flex justify-center gap-2">
                <div
                  v-for="(char, i) in getCurrentWord().text"
                  :key="i"
                  :class="[
                    'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border-3 font-bold text-2xl transition-all duration-300',
                    getCurrentWord().status === 'correct'
                      ? 'bg-green-400 border-green-600 text-white animate-bounce'
                      : getCurrentWord().status === 'incorrect'
                      ? 'bg-red-400 border-red-600 text-white animate-shake'
                      : 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100',
                  ]"
                >
                  <span>{{ char }}</span>
                </div>
              </div>
            </div>

            <!-- Word Status Message -->
            <div v-if="getCurrentWord().status" class="mt-4">
              <div v-if="getCurrentWord().status === 'correct'" class="text-green-600">
                <ion-icon :icon="checkmarkCircleOutline" class="text-3xl mb-2"></ion-icon>
                <p class="font-bold" style="font-family: 'Jua', cursive">Great job! 🎉</p>
              </div>
              <div
                v-else-if="getCurrentWord().status === 'incorrect'"
                class="text-red-600"
              >
                <ion-icon :icon="closeCircleOutline" class="text-3xl mb-2"></ion-icon>
                <p class="font-bold" style="font-family: 'Jua', cursive">Try again! 💪</p>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-else class="text-center py-8">
            <ion-spinner name="crescent" class="mb-4"></ion-spinner>
            <p class="text-blue-600">Loading words...</p>
          </div>
        </div>

        <!-- Progress Section -->
        <div class="w-full max-w-sm mb-6">
          <!-- Progress Bar -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-blue-800">Progress</span>
              <span
                class="text-sm font-bold text-blue-600"
                style="font-family: 'Jua', cursive"
                >{{ getCompletedCount() }}/{{ words.length }}</span
              >
            </div>
            <div class="h-3 w-full bg-blue-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500 ease-out"
                :style="{ width: getProgressPercentage() + '%' }"
              ></div>
            </div>
          </div>

          <!-- Word List Preview -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-4">
            <div class="flex justify-center space-x-2">
              <div
                v-for="(word, index) in words.slice(0, 5)"
                :key="index"
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  word.status === 'correct'
                    ? 'bg-green-500 text-white'
                    : word.status === 'incorrect'
                    ? 'bg-red-500 text-white'
                    : index === getCurrentWordIndex()
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-600',
                ]"
              >
                {{ index + 1 }}
              </div>
            </div>
          </div>
        </div>

        <!-- Controls Section -->
        <div class="flex flex-col items-center gap-4">
          <!-- Generation Status -->
          <div
            v-if="isGenerating"
            class="text-center bg-white/90 rounded-2xl p-6 shadow-lg"
          >
            <div
              class="animate-spin inline-block w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full mb-4"
            ></div>
            <p class="text-lg font-bold text-orange-600">🤖 Generating new words...</p>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Sticky Microphone Button -->
    <div v-if="!isGenerating" class="sticky-microphone">
      <button
        @click="
          playClick('student');
          toggleListening();
        "
        class="microphone-button"
        :class="{ listening: isListening }"
      >
        <!-- Microphone Icon -->
        <svg
          v-if="!isListening"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z" />
          <path
            d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"
          />
        </svg>

        <!-- Muted Microphone Icon -->
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3z"
          />
          <path
            d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z"
          />
        </svg>
      </button>

      <!-- Status Text -->
      <p v-if="isListening" class="mic-status">Tap to stop</p>
      <p v-else class="mic-status">Tap to speak</p>
    </div>

    <!-- Reading Exercise Overlay -->
    <ReadingExerciseOverlay
      :isOpen="showReadingOverlay"
      :currentReadingLevel="currentReadingLevel"
      :userStats="userStatsComputed"
      @close="closeReadingOverlay"
      @start-reading="handleStartReading"
    />

    <!-- Word Selection Modal -->
    <WordSelectionModal
      :isOpen="showWordSelection"
      :words="words"
      @close="closeWordSelection"
      @show-readiness-modal="handleShowReadinessModal"
    />

    <!-- Readiness Confirmation Modal -->
    <ReadinessConfirmationModal
      :isOpen="showReadinessModal"
      @close="closeReadinessModal"
      @ready="handleStudentReady"
      @need-practice="handleNeedMorePractice"
    />

    <!-- Miscue Review Modal/Overlay -->
    <div
      v-if="showMiscueReview"
      class="fixed inset-0 z-50 bg-white"
      style="z-index: 9999"
    >
      <MiscueReviewPage
        :miscueWords="sessionMiscues"
        :sessionId="currentSessionId"
        @review-complete="handleMiscueReviewComplete"
        @skip-review="handleSkipMiscueReview"
      />
    </div>

    <!-- Results Modal -->
    <ResultsModal
      :isOpen="showResultsModal"
      :correctWords="correctWordsCount"
      :totalWords="totalWordsAttempted"
      @close="closeResultsModal"
      @okay="handleResultsOkay"
      @try-again="handleResultsTryAgain"
    />

    <!-- Toast Notifications -->
    <ToastNotification />
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  toastController,
} from "@ionic/vue";
import {
  micOutline,
  stopOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from "ionicons/icons";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { Capacitor } from "@capacitor/core";
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth, useStudent } from "@/composables/services";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import supabase from "../supabase.js"; // 👈 keep your supabase.js
import { autoGenerateWords } from "../services/dataManager.js"; // 🤖 Auto-generation
import StudentService from "../services/studentService.js"; // 📊 Database tracking
import Papa from "papaparse"; // 📊 CSV parsing for offline mode
import ReadingExerciseOverlay from "../components/ReadingExerciseOverlay.vue";
import WordSelectionModal from "../components/WordSelectionModal.vue";
import ReadinessConfirmationModal from "../components/ReadinessConfirmationModal.vue";
import ResultsModal from "../components/ResultsModal.vue";
import ToastNotification from "../components/ToastNotification.vue";
import MiscueReviewPage from "./MiscueReviewPage.vue";
import LoadingScreen from "../components/LoadingScreen.vue";

// 🎤 Unified Speech Recognition Event Emitter
class UnifiedSpeechRecognition extends EventTarget {
  constructor() {
    super();
    this.isListening = false;
    this.engine = null; // 'webspeech' | 'vosk' | 'native'
    this.recognition = null;
    this.recognizer = null;
    this.continuous = true; // Enable continuous recognition by default
    this.interimResults = true;
    this.lang = "en-PH";
  }

  // Emit unified events that match Web Speech API
  emitResult(transcript, isFinal = true) {
    const event = new CustomEvent("result", {
      detail: {
        results: [
          {
            0: { transcript, confidence: 0.9 },
            isFinal,
            length: 1,
          },
        ],
        resultIndex: 0,
      },
    });
    this.dispatchEvent(event);
  }

  emitError(error, message = "") {
    const event = new CustomEvent("error", {
      detail: { error, message },
    });
    this.dispatchEvent(event);
  }

  emitStart() {
    this.isListening = true;
    const event = new CustomEvent("start");
    this.dispatchEvent(event);
  }

  emitEnd() {
    this.isListening = false;
    const event = new CustomEvent("end");
    this.dispatchEvent(event);
  }

  emitSpeechStart() {
    const event = new CustomEvent("speechstart");
    this.dispatchEvent(event);
  }

  emitSpeechEnd() {
    const event = new CustomEvent("speechend");
    this.dispatchEvent(event);
  }

  // Set the current engine being used
  setEngine(engineType) {
    this.engine = engineType;
    console.log(`🎤 Speech engine set to: ${engineType}`);
  }

  // Get the current engine
  getEngine() {
    return this.engine;
  }

  // Check if a specific engine is active
  isEngine(engineType) {
    return this.engine === engineType;
  }

  // Enhanced error handling with engine context
  emitEngineError(engineType, error, message = "") {
    console.error(`🎤 ${engineType} Error:`, error, message);
    this.emitError(`${engineType}-error`, `${error}: ${message}`);
  }
}

// ✅ Offline speech recognition variables
let audioContext = null;
let scriptProcessor = null;
let mediaStream = null;
let recognizer = null;
let listening = ref(false);

// 🔹 Platform detection
const isNativePlatform = Capacitor.isNativePlatform();
let speechSystemReady = ref(false);

// 🎤 Unified Speech Recognition Instance
const unifiedSpeech = new UnifiedSpeechRecognition();

// Router instance
const router = useRouter();
const route = useRoute();

// Audio system
const { startMusic, stopMusic, playWordFeedback, playClick } = useAudio();

// Assignment data from query parameters OR sessionStorage
const assignmentData = ref({
  assignmentId: route.query.assignmentId,
  taskTitle: route.query.taskTitle,
  taskType: route.query.taskType,
});

// Function to set task mode based on query parameters or sessionStorage
const setTaskMode = () => {
  // First check sessionStorage for task assignment
  if (checkTaskAssignment()) {
    console.log("📋 Task mode enabled via sessionStorage");
    return;
  }

  // Then check query parameters
  if (route.query.assignmentId || route.query.taskTitle || route.query.taskType) {
    console.log("📋 Task mode enabled via query parameters");
    window.taskMode = {
      isTest: true,
      assignmentId: route.query.assignmentId,
      taskId: route.query.taskId,
      title: route.query.taskTitle,
      category: route.query.taskType,
    };
    return;
  }

  // Default to free reading mode
  console.log("📖 Free reading mode - no task assignment found");
  window.taskMode = {
    isTest: false,
  };
};

// Check for task assignment from sessionStorage (like Tabs6Page)
const checkTaskAssignment = () => {
  const taskAssignmentData = sessionStorage.getItem("taskAssignment");
  if (taskAssignmentData) {
    try {
      const taskAssignment = JSON.parse(taskAssignmentData);
      console.log(
        "📋 WordReadingPage: Using task assignment from sessionStorage:",
        taskAssignment
      );

      // Set assignment data
      assignmentData.value = {
        assignmentId: taskAssignment.assignmentId,
        taskTitle: taskAssignment.title,
        taskType: taskAssignment.category,
      };

      // Set task mode for completion tracking
      window.taskMode = {
        isTest: true,
        assignmentId: taskAssignment.assignmentId,
        taskId: taskAssignment.taskId,
        title: taskAssignment.title,
        category: taskAssignment.category,
      };

      // Clear sessionStorage
      sessionStorage.removeItem("taskAssignment");

      return true;
    } catch (error) {
      console.error("❌ Error parsing task assignment:", error);
    }
  }
  return false;
};

// Auth and Student Data
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const { studentStats, getStudentStats, isLoading: studentLoading } = useStudent();

// Computed properties for dynamic content
const currentReadingLevel = computed(() => {
  return studentStats.value?.current_reading_level || 1;
});

const userStatsComputed = computed(() => {
  return (
    studentStats.value || {
      current_reading_level: 1,
      streak_days: 0,
      last_activity: null,
    }
  );
});

// Dynamic title functions
const getDynamicTitle = () => {
  // If we're in assignment mode, show the task title
  if (assignmentData.value.assignmentId && assignmentData.value.taskTitle) {
    return assignmentData.value.taskTitle;
  }

  // Default level-based titles
  const levelTitleMap = {
    1: "CVC Reading",
    2: "Phonics Practice",
    3: "Blending Exercise",
    4: "Silent Reading",
  };

  return levelTitleMap[currentReadingLevel.value] || "CVC Reading";
};

const getDynamicSubtitle = () => {
  // If we're in assignment mode, show assignment type
  if (assignmentData.value.assignmentId) {
    return `Assignment: ${assignmentData.value.taskType || "Word Reading Test"}`;
  }

  // Default level-based subtitles
  const levelSubtitleMap = {
    1: "Practice Letter Sounds",
    2: "Learn Phonics Patterns",
    3: "Master Word Blending",
    4: "Independent Reading",
  };

  return levelSubtitleMap[currentReadingLevel.value] || "Practice Your Words";
};

// Reactive state
const isLoading = ref(true);
const words = ref([]);
const isListening = ref(false);
const showReadingOverlay = ref(false);
const showWordSelection = ref(false);
const showReadinessModal = ref(false);
const showResultsModal = ref(false);
const showMiscueReview = ref(false);
const sessionMiscues = ref([]);
const correctWordsCount = ref(0);
const totalWordsAttempted = ref(0);

// Phonics progress tracking
const categoryProgress = ref({
  CVC: { total: 0, correct: 0 },
  Blending: { total: 0, correct: 0 },
  "Silent Letter": { total: 0, correct: 0 },
  "Phonics Merger": { total: 0, correct: 0 },
  "Sight Words": { total: 0, correct: 0 },
  Other: { total: 0, correct: 0 },
});

// Session tracking variables
const sessionStartTime = ref(null);
const sessionWordTimes = ref([]); // Track time per word
const currentWordStartTime = ref(null);
const currentSessionId = ref(null); // Track current reading session ID for miscue recording
const sessionData = ref({
  totalWords: 0,
  correctWords: 0,
  totalTime: 0,
  averageAccuracy: 0,
  readingSpeed: 0,
});

const activeRecognitionSystem = ref(null); // Track which system is active: 'native', 'vosk', or 'webspeech'

let recognition = null; // ✅ WebSpeech instance

// ✅ Connection cache to avoid repetitive checks
let connectionCache = {
  status: null,
  timestamp: 0,
  cacheDuration: 10000, // 10 seconds
};

// ✅ Check if user is online (with caching)
const checkConnection = async (forceCheck = false) => {
  const now = Date.now();

  // Return cached result if still valid and not forcing a check
  if (
    !forceCheck &&
    connectionCache.status !== null &&
    now - connectionCache.timestamp < connectionCache.cacheDuration
  ) {
    console.log("🌐 Using cached connection status:", connectionCache.status);
    return connectionCache.status;
  }

  console.log("🌐 Checking internet connectivity...");

  const promises = [
    fetch("https://www.google.com", {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-cache",
      signal: AbortSignal.timeout(3000),
    })
      .then(() => true)
      .catch(() => false),

    fetch("https://www.cloudflare.com", {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-cache",
      signal: AbortSignal.timeout(3000),
    })
      .then(() => true)
      .catch(() => false),
  ];

  const results = await Promise.all(promises);
  console.log("🌐 Network test results:", results);
  console.log("🌐 navigator.onLine:", navigator.onLine);

  const isOnline = results.some((r) => r) && navigator.onLine;
  console.log("🌐 Final decision: Online:", isOnline);

  // Cache the result
  connectionCache.status = isOnline;
  connectionCache.timestamp = now;

  return isOnline;
};

// 📚 Get the phonics category for a given word
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
    "the",
    "is",
    "was",
    "are",
    "were",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "can",
    "may",
    "must",
    "shall",
    "might",
    "ought",
    "am",
    "be",
    "been",
    "being",
    "go",
    "goes",
    "went",
    "come",
    "came",
    "get",
    "got",
    "make",
    "made",
    "take",
    "took",
    "see",
    "saw",
    "know",
    "knew",
    "think",
    "thought",
  ];
  if (sightWords.includes(cleanWord)) {
    return "Sight Words";
  }

  return "Other";
};

// 📊 Save phonics progress to database
const savePhonicsProgress = async (userId) => {
  if (!categoryProgress.value) {
    console.log("⚠️ No category progress available");
    return;
  }

  try {
    console.log("💾 Saving phonics progress to database...");
    console.log("📊 Category progress:", categoryProgress.value);

    // Call the bulk update function we created in SQL
    const { error } = await supabase.rpc("update_phonics_progress_bulk", {
      p_user_id: userId,
      p_cvc_count: categoryProgress.value["CVC"]?.total || 0,
      p_cvc_correct: categoryProgress.value["CVC"]?.correct || 0,
      p_blending_count: categoryProgress.value["Blending"]?.total || 0,
      p_blending_correct: categoryProgress.value["Blending"]?.correct || 0,
      p_silent_count: categoryProgress.value["Silent Letter"]?.total || 0,
      p_silent_correct: categoryProgress.value["Silent Letter"]?.correct || 0,
      p_merger_count: categoryProgress.value["Phonics Merger"]?.total || 0,
      p_merger_correct: categoryProgress.value["Phonics Merger"]?.correct || 0,
      p_sight_count: categoryProgress.value["Sight Words"]?.total || 0,
      p_sight_correct: categoryProgress.value["Sight Words"]?.correct || 0,
      p_other_count: categoryProgress.value["Other"]?.total || 0,
      p_other_correct: categoryProgress.value["Other"]?.correct || 0,
    });

    if (error) {
      console.error("❌ Error saving phonics progress:", error);
    } else {
      console.log("✅ Phonics progress saved successfully!");
    }
  } catch (error) {
    console.error("❌ Error in savePhonicsProgress:", error);
  }
};

// ✅ Initialize speech recognition with 3-tier fallback chain
const initSpeech = async () => {
  console.log("🎤 Initializing speech recognition with fallback chain...");

  if (isNativePlatform) {
    console.log("📱 Native platform detected - using Capacitor Speech Recognition");
    await initNativeSpeechRecognition();
    if (!speechSystemReady.value) {
      console.log("⚠️ Native speech recognition failed, trying Web Speech API fallback");
      await initWebSpeechFallback();
    }
  } else {
    console.log("💻 Web platform detected - trying Web Speech API");
    await initWebSpeechFallback();
  }

  if (!speechSystemReady.value) {
    console.error("❌ All speech recognition methods failed!");
  }
};

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
    activeRecognitionSystem.value = "native";
    console.log("✅ Native speech recognition ready (Capacitor)");
  } catch (error) {
    console.error("❌ Native speech recognition initialization failed:", error);
    speechSystemReady.value = false;
  }
};

// ✅ Initialize Vosk offline recognition (copied from Tabs6Page.vue)
const initVoskFallback = async () => {
  console.log("🎤 Initializing Vosk offline recognition");

  // Wait for Vosk library to load with multiple strategies
  let vosk = null;
  let attempts = 0;
  const maxAttempts = 20; // Increased attempts

  while (!vosk && attempts < maxAttempts) {
    attempts++;
    console.log(`⏳ Waiting for Vosk library... (${attempts}/${maxAttempts})`);

    // Try multiple ways to access Vosk
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

    if (typeof createModel !== "undefined") {
      vosk = { createModel };
      console.log("✅ Found createModel function");
      break;
    }

    // Wait longer for each attempt
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
    await initWebSpeechFallback();
    return;
  }

  console.log("Vosk object:", vosk);
  console.log("Vosk methods:", Object.keys(vosk));

  // Initialize Vosk with better error handling
  console.log("🔧 Loading Vosk model...");

  // Try different model paths - prioritizing English for Vosk offline
  const modelPaths = [
    "/models/vosk-model-small-en-us-0.15.tar.gz", // English primary
  ];

  let modelLoaded = false;
  for (const modelPath of modelPaths) {
    try {
      console.log(`🔍 Trying to load model from: ${modelPath}`);

      // Try to create model with the global vosk
      let model = null;
      if (vosk.createModel) {
        model = await vosk.createModel(modelPath);
      } else if (vosk.Model) {
        model = new vosk.Model(modelPath);
      } else {
        console.error("❌ No model creation method found in Vosk");
        continue;
      }

      if (!model) {
        console.log(`⚠️ Failed to create model from: ${modelPath}`);
        continue;
      }

      console.log("Model created:", model);
      console.log("Model methods:", Object.keys(model));
      console.log(
        "Model prototype methods:",
        Object.getOwnPropertyNames(Object.getPrototypeOf(model))
      );

      // Store model globally for debugging
      console.log("Model saved to window.debugModel for debugging");
      window.debugModel = model;

      // Create recognizer
      try {
        console.log("Creating recognizer with model:", model);
        console.log("Model worker:", model.worker);
        console.log("Model recognizers map:", model.recognizers);

        // Try different recognizer creation approaches
        if (model.acceptWaveform) {
          console.log("✅ Using model as recognizer (direct pattern):", model);
          recognizer = model;
        } else if (model.KaldiRecognizer) {
          console.log("✅ Using model as recognizer (vosk-browser pattern):", model);
          recognizer = model;

          console.log("Model methods:", Object.keys(model));
          console.log(
            "Model prototype methods:",
            Object.getOwnPropertyNames(Object.getPrototypeOf(model))
          );

          try {
            // This might fail - that's okay
            console.log(
              "Direct model usage failed:",
              new Error("Model doesn't have acceptWaveform method")
            );
          } catch (e) {
            console.log("Direct model usage failed:", e);
          }

          console.log("Trying new model.KaldiRecognizer() with sample rate only...");
          try {
            recognizer = new model.KaldiRecognizer(16000);
            console.log(
              "✅ Created KaldiRecognizer via new model.KaldiRecognizer(16000):",
              recognizer
            );

            // Set engine type
            unifiedSpeech.setEngine("vosk");

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

        if (!recognizer) {
          console.log(`⚠️ Failed to create recognizer with model: ${modelPath}`);
          continue;
        }

        console.log("Recognizer created:", recognizer);
        modelLoaded = true;

        console.log(
          `✅ Successfully initialized recognizer with model from: ${modelPath}`
        );
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

  if (!modelLoaded || !recognizer) {
    console.error("❌ Failed to load any Vosk model or create recognizer");
    return;
  }

  // Setup microphone
  console.log("🎙️ Requesting microphone access...");
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

    console.log("Recognizer methods:", Object.keys(recognizer));
    console.log(
      "Recognizer prototype methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(recognizer))
    );

    // Set up event listeners for speech recognition results
    console.log("🎤 Setting up Vosk event listeners...");

    recognizer.addEventListener("result", (event) => {
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
          // Emit unified result event
          unifiedSpeech.emitResult(transcript, true);

          // For continuous listening, don't auto-stop
          // Let the user control start/stop via toggleListening
          if (!unifiedSpeech.continuous) {
            // Auto-reset listening state like Web Speech API (single recognition)
            listening.value = false;
            isListening.value = false;
            unifiedSpeech.emitEnd();
          }
        }
        // Skip logging empty final results to reduce console noise
      } catch (error) {
        console.error("🎤 Error processing Vosk result:", error);
        unifiedSpeech.emitEngineError("Vosk", "result-processing", error.message);
      }
    });

    // Set up partial results for interim results (if supported)
    recognizer.addEventListener("partialresult", (event) => {
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

        if (transcript) {
          // Emit interim result
          unifiedSpeech.emitResult(transcript, false);
        }
        // Skip logging empty partial results to reduce console noise
      } catch (error) {
        console.error("🎤 Error processing Vosk partial result:", error);
        unifiedSpeech.emitEngineError("Vosk", "partial-result-processing", error.message);
      }
    });

    // Add error event listener
    recognizer.addEventListener("error", (event) => {
      console.error("🎤 Vosk error event:", event);
      unifiedSpeech.emitEngineError(
        "Vosk",
        "recognition-error",
        event.detail || "Unknown error"
      );
    });

    scriptProcessor.onaudioprocess = (e) => {
      if (!listening.value || !recognizer) return;

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

          if (recognizer.acceptWaveform) {
            recognizer.acceptWaveform(e.inputBuffer);
          } else if (recognizer.acceptWaveformFloat) {
            recognizer.acceptWaveformFloat(inputBuffer);
          } else {
            console.warn("🎤 Recognizer has no acceptWaveform method");
          }

          // Vosk uses event-based results, not synchronous method calls
          // Results are handled by the 'result' and 'partialresult' event listeners above
        }
      } catch (error) {
        console.error("🎤 Error processing audio:", error);
      }
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    // Mark Vosk as ready
    speechSystemReady.value = true;
    activeRecognitionSystem.value = "vosk";
    console.log("✅ Vosk offline recognition ready");
    console.log("✅ Starting immediate word checking (no buffering delays)");
  } catch (error) {
    console.error("❌ Error setting up Vosk microphone:", error);
    unifiedSpeech.emitEngineError("Vosk", "microphone-setup", error.message);
    speechSystemReady.value = false;
  }

  console.log("🎯 Starting reading with Vosk offline mode");
};

// Fallback to Web Speech API when Vosk fails
const initWebSpeechFallback = async () => {
  try {
    console.log("🎤 Initializing Web Speech API fallback");

    const WebSpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!WebSpeechRecognition) {
      console.error("❌ Web Speech API not available");
      return;
    }

    if (!recognition) {
      recognition = new WebSpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true; // Enable interim results for better responsiveness
      recognition.continuous = false;

      recognition.onstart = () => {
        console.log("🎤 Web Speech Started");
      };

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript.toLowerCase().trim();
          const isFinal = result.isFinal;

          console.log(`🎤 Web Speech [${isFinal ? "FINAL" : "INTERIM"}]:`, transcript);

          // Only process final results
          if (isFinal) {
            checkWord(transcript, true);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("⚠️ Web Speech Error:", event.error);
        isListening.value = false;
      };

      recognition.onend = () => {
        console.log("🎤 Web Speech Ended");
        // Auto-restart if still listening (for continuous recognition)
        if (isListening.value) {
          setTimeout(() => {
            if (isListening.value) {
              recognition.start();
            }
          }, 100);
        }
      };
    }

    console.log("✅ Web Speech API fallback initialized");
    speechSystemReady.value = true;
    activeRecognitionSystem.value = "webspeech";
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize Web Speech API:", error);
    speechSystemReady.value = false;
    return false;
  }
};

// 🎤 Setup unified speech recognition event listeners
const setupUnifiedSpeechListeners = () => {
  console.log("🎤 Setting up unified speech event listeners");

  // Result event (both interim and final)
  unifiedSpeech.addEventListener("result", (event) => {
    console.log("🎤 Unified Speech Event Received:", event);
    const result = event.detail.results[0];
    const transcript = result[0].transcript.trim();
    const isFinal = result.isFinal;

    console.log(`🎤 Unified Result [${isFinal ? "FINAL" : "INTERIM"}]:`, transcript);

    if (isFinal) {
      // Only process final results for word checking
      console.log("🎯 Calling checkWord with:", transcript);
      checkWord(transcript);
    } else {
      // Update UI with interim results (optional)
      console.log("🔄 Interim result:", transcript);
    }
  });

  // Error event
  unifiedSpeech.addEventListener("error", (event) => {
    const { error, message } = event.detail;
    console.error("🎤 Unified Speech Error:", error, message);

    // Reset listening state on error
    isListening.value = false;
    listening.value = false;
  });

  // Start event
  unifiedSpeech.addEventListener("start", () => {
    console.log("🎤 Unified Speech Started");
    isListening.value = true;
  });

  // End event
  unifiedSpeech.addEventListener("end", () => {
    console.log("🎤 Unified Speech Ended");
    isListening.value = false;
    listening.value = false;
  });

  // Speech start/end events (optional)
  unifiedSpeech.addEventListener("speechstart", () => {
    console.log("🎤 Speech detected");
  });

  unifiedSpeech.addEventListener("speechend", () => {
    console.log("🎤 Speech ended");
  });
};

// Fetch words - simple: online (Supabase) or offline (CSV)
const fetchWords = async () => {
  // Check if we have assignment data - if so, load words from assignment
  if (assignmentData.value.assignmentId) {
    console.log("📝 Loading words from assignment:", assignmentData.value.assignmentId);
    await loadWordsFromAssignment();
    return;
  }

  // Default behavior for regular practice mode
  const isOnline = await checkConnection(true); // Force fresh check for initial load

  // Determine word category based on reading level
  const levelCategoryMap = {
    1: "CVC",
    2: "Phonics Merger",
    3: "Blending",
    4: "Silent Letter",
  };

  const targetCategory = levelCategoryMap[currentReadingLevel.value] || "CVC";
  console.log(
    `🎯 Fetching words for level ${currentReadingLevel.value}, category: ${targetCategory}`
  );

  if (isOnline) {
    // Online mode - use Supabase
    console.log("📊 Online: Fetching words from Supabase");
    console.log("🔍 Looking for category:", targetCategory);

    const { data, error } = await supabase
      .from("Words")
      .select("word, category")
      .eq("category", targetCategory);

    if (error) {
      console.error("❌ Supabase fetch error:", error);
      console.log("⚠️ Supabase failed, falling back to offline CSV");
      await loadWordsFromCSV();
      return;
    }

    console.log(`✅ Raw Supabase response: ${data?.length || 0} words found`);
    if (data && data.length > 0) {
      console.log("📄 Sample words:", data.slice(0, 3));
    }

    if (!data || data.length === 0) {
      console.warn(`⚠️ No words found for category "${targetCategory}" in database`);
      console.log("🔄 Falling back to CSV...");
      await loadWordsFromCSV();
      return;
    }

    const shuffled = data.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    words.value = selected.map((w) => ({
      text: w.word.toUpperCase(),
      status: null,
    }));

    console.log(
      "✅ Loaded words from Supabase:",
      words.value.map((w) => w.text)
    );
  } else {
    // Offline mode - use CSV file
    console.log("📂 Offline: Loading words from CSV file");
    await loadWordsFromCSV();
  }
};

// Load words from assignment test content
const loadWordsFromAssignment = async () => {
  try {
    console.log("📝 Fetching assignment test content...");

    if (!isAuthenticated.value || !profile.value) {
      console.error("❌ User not authenticated");
      return;
    }

    const result = await StudentService.getTestContent(
      assignmentData.value.assignmentId,
      profile.value.id
    );

    if (!result.success) {
      console.error("❌ Failed to load assignment:", result.error);
      // Fall back to regular word loading
      await fetchWordsDefault();
      return;
    }

    const testContent = result.data.assignment.task.test_content;
    const taskCategory = result.data.assignment.task.category; // Get the actual task category
    console.log("📝 Test content:", testContent);
    console.log("📝 Task category:", taskCategory);

    // Parse words from test content
    let wordList = [];

    if (typeof testContent === "string") {
      // If test_content is a comma-separated string
      wordList = testContent.split(",").map((word) => word.trim().toUpperCase());
    } else if (Array.isArray(testContent)) {
      // If test_content is already an array
      wordList = testContent.map((word) => word.toString().trim().toUpperCase());
    } else if (testContent?.words && Array.isArray(testContent.words)) {
      // If test_content is an object with words property
      wordList = testContent.words.map((word) => word.toString().trim().toUpperCase());
    } else if (testContent?.segments && typeof testContent.segments === "string") {
      // For Blending tests with segments
      wordList = testContent.segments.split(",").map((word) => word.trim().toUpperCase());
    } else if (testContent?.examples && typeof testContent.examples === "string") {
      // For Phonics Merger tests with examples
      wordList = testContent.examples.split(",").map((word) => word.trim().toUpperCase());
    } else {
      // If no words found in test content, generate based on task category
      console.log("📝 No words in test content, generating based on task category...");

      const wordCount = 5; // Always generate 5 words

      // Map task category to database category
      const categoryMap = {
        cvc: "CVC",
        blending: "Blending",
        "silent-words": "Silent Letter",
        "phonics-merger": "Phonics Merger",
      };

      const dbCategory = categoryMap[taskCategory] || "CVC";
      console.log(`🎯 Generating ${wordCount} words for category: ${dbCategory}`);

      // Generate words based on category
      const generatedWords = await generateWordsForCategory(dbCategory, wordCount);
      wordList = generatedWords;
    }

    // Filter out empty words and create word objects
    words.value = wordList
      .filter((word) => word && word.length > 0)
      .map((word) => ({
        text: word,
        status: null,
      }));

    console.log(
      `✅ Loaded ${words.value.length} words from assignment:`,
      words.value.map((w) => w.text)
    );

    // Store the max score based on number of words
    sessionData.value.totalWords = words.value.length;
  } catch (error) {
    console.error("❌ Error loading assignment words:", error);
    // Fall back to regular word loading
    await fetchWordsDefault();
  }
};

// Generate words for a specific category
const generateWordsForCategory = async (category, count = 5) => {
  console.log(`🎯 Generating ${count} words for category: ${category}`);

  try {
    // Try to fetch from database first
    const isOnline = await checkConnection(true);

    if (isOnline) {
      console.log("📊 Online: Fetching words from Supabase for category:", category);
      const { data, error } = await supabase
        .from("Words")
        .select("word, category")
        .eq("category", category)
        .limit(count);

      if (!error && data && data.length > 0) {
        const words = data.map((w) => w.word.toUpperCase());
        console.log(`✅ Generated ${words.length} words from database:`, words);
        return words;
      }
    }

    // Fallback to predefined word lists based on category
    const wordLists = {
      CVC: ["CAT", "DOG", "BAT", "HAT", "SUN", "BED", "PEN", "CUP", "RUG", "MAP"],
      "Phonics Merger": [
        "SHIP",
        "CHAT",
        "WHEN",
        "THAT",
        "WITH",
        "SHOP",
        "CHIN",
        "CHOP",
        "THIN",
        "WHIP",
      ],
      Blending: [
        "BLEND",
        "STAMP",
        "CLOUD",
        "PLANT",
        "TRUST",
        "SPEND",
        "GRAND",
        "STAND",
        "SMART",
        "START",
      ],
      "Silent Letter": [
        "LAMB",
        "KNEE",
        "WRITE",
        "THUMB",
        "KNIFE",
        "CLIMB",
        "WRIST",
        "COMB",
        "DEBT",
        "KNOW",
      ],
    };

    const availableWords = wordLists[category] || wordLists["CVC"];
    const selectedWords = availableWords.slice(0, count);

    console.log(
      `✅ Generated ${selectedWords.length} words from fallback list:`,
      selectedWords
    );
    return selectedWords;
  } catch (error) {
    console.error("❌ Error generating words:", error);
    // Ultimate fallback
    return ["CAT", "DOG", "BAT", "HAT", "SUN"].slice(0, count);
  }
};

// Default word fetching (extracted from original fetchWords)
const fetchWordsDefault = async () => {
  const isOnline = await checkConnection(true);

  const levelCategoryMap = {
    1: "CVC",
    2: "Phonics Merger",
    3: "Blending",
    4: "Silent Letter",
  };

  const targetCategory = levelCategoryMap[currentReadingLevel.value] || "CVC";

  if (isOnline) {
    console.log("📊 Online: Fetching words from Supabase");
    const { data, error } = await supabase
      .from("Words")
      .select("word, category")
      .eq("category", targetCategory);

    if (error) {
      console.error("Supabase fetch error:", error);
      await loadWordsFromCSV();
      return;
    }

    const shuffled = data.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    words.value = selected.map((w) => ({
      text: w.word.toUpperCase(),
      status: null,
    }));
  } else {
    await loadWordsFromCSV();
  }
};

// Load words from CSV file (offline mode)
const loadWordsFromCSV = async () => {
  console.log("📂 Using offline CSV data for words");

  try {
    console.log("📥 Loading words from CSV...");
    const response = await fetch("/csv_offline/updated_words_dataset.csv");
    const csvText = await response.text();
    console.log("📝 Loaded", csvText.split("\n").length - 1, "words from CSV");

    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    // Determine target category based on reading level
    const levelCategoryMap = {
      1: "CVC",
      2: "Phonics Merger",
      3: "Blending",
      4: "Silent Letter",
    };

    const targetCategory = levelCategoryMap[currentReadingLevel.value] || "CVC";

    const filteredWords = result.data.filter((w) => w.category === targetCategory);
    console.log(
      "🔍 Found",
      filteredWords.length,
      `${targetCategory} words in offline data`
    );

    // Fallback to CVC if no words found for the target category
    if (filteredWords.length === 0) {
      console.warn(`⚠️ No ${targetCategory} words found, falling back to CVC`);
      const fallbackWords = result.data.filter((w) => w.category === "CVC");
      const shuffled = fallbackWords.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 5);

      words.value = selected.map((w) => ({
        text: w.word.toUpperCase(),
        status: null,
      }));
    } else {
      const shuffled = filteredWords.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 5);

      words.value = selected.map((w) => ({
        text: w.word.toUpperCase(),
        status: null,
      }));
    }

    console.log(
      "✅ Loaded words from CSV:",
      words.value.map((w) => w.text)
    );
  } catch (error) {
    console.error("❌ Error loading CSV:", error);
    // Fallback to hardcoded words if CSV fails
    const fallbackMap = {
      1: [
        { text: "CAT", status: null },
        { text: "DOG", status: null },
        { text: "BAT", status: null },
        { text: "HAT", status: null },
        { text: "SUN", status: null },
      ],
      2: [
        { text: "SHIP", status: null },
        { text: "CHAIN", status: null },
        { text: "THINK", status: null },
        { text: "PHONE", status: null },
        { text: "GRAPH", status: null },
      ],
      3: [
        { text: "BLEND", status: null },
        { text: "SMART", status: null },
        { text: "FRESH", status: null },
        { text: "GRACE", status: null },
        { text: "BRIGHT", status: null },
      ],
      4: [
        { text: "SILENT", status: null },
        { text: "BRIDGE", status: null },
        { text: "KNIGHT", status: null },
        { text: "DESIGN", status: null },
        { text: "THOUGHT", status: null },
      ],
    };

    words.value = fallbackMap[currentReadingLevel.value] || fallbackMap[1];
    console.log("⚠️ Using fallback words for level", currentReadingLevel.value);
  }
};

// Helper functions for new UI
const getCurrentWord = () => {
  return (
    words.value.find((w) => w.status === null) ||
    words.value[0] || { text: "", status: null }
  );
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

// Add streak and error tracking reactive variables
const streak = ref(0); // Local session streak counter
const consecutiveErrors = ref(0);

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

// Overlay handler functions
const openReadingOverlay = () => {
  showReadingOverlay.value = true;
};

const closeReadingOverlay = () => {
  showReadingOverlay.value = false;

  // Check if all modals are closed and play reading music
  checkAndPlayReading();
};

const handleStartReading = async () => {
  console.log("🎯 Starting reading exercise with words:", words.value);

  // Reset performance tracking for new session
  resetReadingSession();

  // Start session tracking
  await startReadingSession();

  closeReadingOverlay();
  showWordSelection.value = true; // Show the word selection overlay
};

const closeWordSelection = () => {
  showWordSelection.value = false;

  // Check if all modals are closed and play reading music
  checkAndPlayReading();
};

// New modal flow handlers
const handleShowReadinessModal = () => {
  console.log("🎯 Showing readiness confirmation modal");
  showWordSelection.value = false; // Hide word selection
  showReadinessModal.value = true; // Show readiness modal
};

const closeReadinessModal = () => {
  showReadinessModal.value = false;

  // Check if all modals are closed and play reading music
  checkAndPlayReading();
};

const handleStudentReady = () => {
  console.log("✅ Student is ready - closing modal and staying on WordReadingPage");

  // Store words in sessionStorage for potential future use
  sessionStorage.setItem("selectedWords", JSON.stringify(words.value));
  console.log("💾 Words stored in sessionStorage");

  // Just close the modal and stay on the current page
  closeReadinessModal();
  console.log("🔄 Modal closed, staying on WordReadingPage");

  // Check if all modals are closed and play reading music
  checkAndPlayReading();
};

const handleNeedMorePractice = () => {
  console.log("📚 Student needs more practice - reopening word selection");
  closeReadinessModal();
  showWordSelection.value = true; // Show word selection again
};

// Results Modal handlers
const closeResultsModal = () => {
  showResultsModal.value = false;

  // Check if all modals are closed and play reading music
  checkAndPlayReading();

  // Handle task completion navigation
  if (window.taskMode && window.testCompleted) {
    console.log("📝 Task completed, navigating back with delay for database sync...");

    setTimeout(() => {
      const completionData = window.completionData || {};
      const source = assignmentData.value.source;

      if (source === "notifications") {
        console.log("🔄 Returning to notifications page...");
        router.push("/tabs/student-notifications");
      } else if (completionData.classroomId) {
        console.log(`🔄 Returning to class detail page: ${completionData.classroomId}`);
        router.push(`/student/class-detail/${completionData.classroomId}`);
      } else {
        console.log("🔄 Returning to classes page...");
        router.push("/student/classes");
      }

      // Clean up completion tracking
      window.testCompleted = false;
      window.completionData = null;
    }, 1000); // 1 second delay for database sync
  }
};

const handleResultsOkay = async () => {
  console.log("✅ Results acknowledged");

  // Check for achievements after session completion
  try {
    console.log("🏆 Checking for achievements after session...");
    if (profile.value?.id) {
      await checkAchievements(profile.value.id);
    }
  } catch (error) {
    console.error("❌ Error checking achievements:", error);
  }

  // If this is a task assignment, handle completion navigation
  if (window.taskMode && window.testCompleted) {
    closeResultsModal(); // This will trigger navigation
    return;
  }

  // Otherwise, proceed with normal word generation flow
  console.log("📚 Proceeding to generate new words for practice mode");
  closeResultsModal();

  // Show generating state and auto-generate new words
  if (!isGenerating.value) {
    isGenerating.value = true;

    try {
      const success = await autoGenerateWords();
      if (success) {
        console.log("✅ New words generated and CSV updated!");

        // Reset session for new words
        resetReadingSession();

        // Auto-reload with new words after a delay
        setTimeout(() => {
          fetchWords(); // Reload with new words from Supabase
          setTimeout(() => {
            openReadingOverlay(); // Start new reading session
          }, 500);
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Auto-generation failed:", error);
      // If auto-generation fails, just reset and restart with current words
      resetWordsStatus();
      openReadingOverlay();
    } finally {
      isGenerating.value = false;
    }
  }
};

const handleResultsTryAgain = () => {
  console.log("🔄 Student wants to try again");

  // If this is a task assignment, we shouldn't allow retries after completion
  if (window.taskMode && window.testCompleted) {
    console.log("📝 Task already completed, navigating back instead of retrying");
    closeResultsModal(); // This will trigger navigation
    return;
  }

  closeResultsModal();
  // Reset the words status and restart
  resetWordsStatus();
  openReadingOverlay();
};

// Miscue Review handlers
const handleMiscueReviewComplete = (reviewData) => {
  console.log("📊 Miscue review completed:", reviewData);
  showMiscueReview.value = false;

  // Show results modal after review
  console.log(
    `📊 Final Score: ${correctWordsCount.value}/${totalWordsAttempted.value} words correct`
  );
  showResultsModal.value = true;

  // Check if all modals are closed and play reading music
  checkAndPlayReading();
};

const handleSkipMiscueReview = () => {
  console.log("⏭️ Skipping miscue review");
  showMiscueReview.value = false;

  // Show results modal directly
  console.log(
    `📊 Final Score: ${correctWordsCount.value}/${totalWordsAttempted.value} words correct`
  );
  showResultsModal.value = true;

  // Check if all modals are closed and play reading music
  checkAndPlayReading();
};

// Helper function to check if all modals are closed and play reading music
const checkAndPlayReading = () => {
  // Check if all modals are closed
  const allModalsClosed =
    !showReadingOverlay.value &&
    !showWordSelection.value &&
    !showReadinessModal.value &&
    !showResultsModal.value &&
    !showMiscueReview.value;

  if (allModalsClosed) {
    console.log("🎵 All modals closed - playing reading music");
    startMusic(MUSIC_TYPES.READING, 0.3);
  }
};

// Helper function to reset reading session
const resetReadingSession = () => {
  correctWordsCount.value = 0;
  totalWordsAttempted.value = 0;
  streak.value = 0;
  consecutiveErrors.value = 0;
  progress.value = 0;

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

// ============================================================================
// SESSION TRACKING & DATABASE FUNCTIONS
// ============================================================================

/**
 * Start tracking a reading session
 */
const startReadingSession = async () => {
  console.log("📊 Starting reading session tracking");

  try {
    if (!profile.value?.id) {
      console.warn("Cannot create reading session: missing user ID");
      return;
    }

    // Create reading session in database
    const sessionData = {
      user_id: profile.value.id,
      content_type: "word",
      content_id: currentReadingLevel.value,
      words_read: words.value.length,
      accuracy_rate: 0, // Will be updated at session end
      reading_speed: 0, // Will be updated at session end
      session_duration: 0, // Will be updated at session end
    };

    console.log("📝 Creating reading session in database...");
    const { data, error } = await supabase
      .from("reading_sessions")
      .insert(sessionData)
      .select("id")
      .single();

    if (error) {
      console.error("Error creating reading session:", error);
      // Fallback to string ID for miscue tracking
      currentSessionId.value =
        "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    } else {
      currentSessionId.value = data.id;
      console.log("✅ Reading session created with ID:", currentSessionId.value);
    }
  } catch (error) {
    console.error("❌ Error in startReadingSession:", error);
    // Fallback to string ID
    currentSessionId.value =
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  sessionStartTime.value = Date.now();
  sessionWordTimes.value = [];
  sessionData.value.totalWords = words.value.length;
};

/**
 * Track when a word reading attempt starts
 */
const startWordTimer = () => {
  currentWordStartTime.value = Date.now();
};

/**
 * Track when a word reading attempt ends
 */
const endWordTimer = (wasCorrect = false) => {
  if (currentWordStartTime.value) {
    const timeSpent = Date.now() - currentWordStartTime.value;
    sessionWordTimes.value.push({
      timeSpent,
      correct: wasCorrect,
      timestamp: Date.now(),
    });
    currentWordStartTime.value = null;
  }
};

/**
 * Calculate session statistics
 */
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

/**
 * Record reading session to database
 */
const recordReadingSession = async () => {
  if (!profile.value?.id) {
    console.warn("No user profile found, skipping session recording");
    return;
  }

  try {
    const stats = calculateSessionStats();

    // Check if this is an assignment test
    if (assignmentData.value.assignmentId) {
      console.log("📝 Submitting assignment test results...");
      await submitAssignmentTest(stats);
    } else {
      // Update the existing reading session with final stats
      if (typeof currentSessionId.value === "number") {
        console.log("📊 Updating reading session:", currentSessionId.value);

        const { error } = await supabase
          .from("reading_sessions")
          .update({
            session_duration: stats.totalTime,
            words_read: stats.totalWords,
            accuracy_rate: stats.averageAccuracy,
            reading_speed: stats.readingSpeed,
          })
          .eq("id", currentSessionId.value);

        if (error) {
          console.error("❌ Failed to update reading session:", error);
        } else {
          console.log("✅ Reading session updated successfully");
        }
      } else {
        console.warn("⚠️ Session ID is not a number, falling back to StudentService");
        // Fallback to original method if session ID is not a proper integer
        const sessionRecord = {
          contentType: "word",
          contentId: currentReadingLevel.value,
          duration: stats.totalTime,
          wordsRead: stats.totalWords,
          accuracyRate: stats.averageAccuracy,
          readingSpeed: stats.readingSpeed,
        };

        const result = await StudentService.recordReadingSession(
          profile.value.id,
          sessionRecord
        );

        if (result.success) {
          console.log("✅ Reading session recorded successfully");
        } else {
          console.error("❌ Failed to record reading session:", result.error);
        }
      }

      // Update user progress
      await updateUserProgress(stats);

      // Check for achievements - pass userId instead of stats
      if (profile.value?.id) {
        await checkAchievements(profile.value.id);
      }
    }
  } catch (error) {
    console.error("❌ Error recording reading session:", error);
  }
};

// Submit assignment test results
const submitAssignmentTest = async (stats) => {
  try {
    const totalWords = words.value.length;
    const correctWords = correctWordsCount.value;

    const submissionData = {
      score: correctWords, // Number of correct words
      max_score: totalWords, // Total number of words (for percentage calculation)
      timeSpent: Math.round(stats.totalTime), // Time in seconds
      attempts: 1,
      wordsRead: totalWords,
      // Note: quizResponses removed - word reading tests don't have quiz questions
      // quiz_responses table is for story comprehension questions only
    };

    console.log("📝 Submitting test results:", submissionData);

    const result = await StudentService.submitTask(
      assignmentData.value.assignmentId,
      profile.value.id,
      submissionData
    );

    if (result.success) {
      console.log("✅ Assignment test submitted successfully");
      // Store completion status for navigation handling
      window.testCompleted = true;
      window.completionData = {
        classroomId: result.data.classroomId,
        score: correctWords,
        totalWords: totalWords,
      };
    } else {
      console.error("❌ Failed to submit test:", result.error);

      // Handle schema-related errors gracefully
      if (result.error && result.error.includes("max_score")) {
        console.log("⚠️ Database schema issue detected, but test was completed");
        // Store completion status even with schema issues
        window.testCompleted = true;
        window.completionData = {
          classroomId: null,
          score: correctWords,
          totalWords: totalWords,
          schemaIssue: true,
        };
      } else {
        console.error("Failed to submit test results");
        window.testCompleted = false;
      }
    }
  } catch (error) {
    console.error("❌ Error submitting assignment test:", error);
    // Set completion status even on error so user can exit
    window.testCompleted = true;
    window.completionData = {
      classroomId: null,
      score: correctWordsCount.value,
      totalWords: words.value.length,
      error: true,
    };
  }
};

/**
 * Update user progress in database
 */
const updateUserProgress = async (stats) => {
  if (!profile.value?.id) return;

  try {
    // Determine activity_id based on mode
    let activityId = 1; // Default for self-learning word reading

    // If this is a teacher-assigned task, use the assignment ID
    if (window.taskMode?.isTest && window.taskMode?.assignmentId) {
      activityId = window.taskMode.assignmentId;
      console.log(`📋 Using teacher assignment ID: ${activityId}`);
    } else {
      // Self-learning mode - get next available activity_id
      try {
        const { data: latestActivity, error: fetchError } = await supabase
          .from("user_progress")
          .select("activity_id")
          .eq("user_id", profile.value.id)
          .eq("activity_type", "word_reading")
          .order("activity_id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!fetchError && latestActivity) {
          // Use next available activity_id
          activityId = latestActivity.activity_id + 1;
          console.log(`📊 Using next available activity_id: ${activityId}`);
        } else {
          console.log(`📊 Using default activity_id: ${activityId}`);
        }
      } catch (err) {
        console.log(
          `📊 Using default activity_id: ${activityId} (error fetching latest)`
        );
      }
    }

    const progressData = {
      activity: "word_reading",
      activityId: activityId, // Dynamic activity ID
      completed: stats.averageAccuracy >= 60, // Consider 60% as completed
      score: stats.correctWords,
      maxScore: stats.totalWords,
      timeSpent: stats.totalTime,
      attempts: 1,
      wordsRead: stats.totalWords,
    };

    console.log("📊 Updating user progress:", progressData);

    const result = await StudentService.updateUserStats(profile.value.id, progressData);

    if (result.success) {
      console.log("✅ User progress updated successfully");

      // Refresh student stats
      await getStudentStats(profile.value.id);
    } else {
      console.error("❌ Failed to update user progress:", result.error);
    }
  } catch (error) {
    console.error("❌ Error updating user progress:", error);
  }
};

/**
 * Check and award achievements based on phonics progress
 */
const checkAchievements = async (userId) => {
  if (!userId) {
    console.warn("No userId provided to checkAchievements");
    return;
  }

  try {
    console.log("🏆 Checking achievements for user:", userId);

    // Get user's phonics progress from user_phonics_progress table
    const { data: phonicsProgress, error: progressError } = await supabase
      .from("user_phonics_progress")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (progressError) {
      console.error("Error fetching phonics progress:", progressError);
      return;
    }

    if (!phonicsProgress) {
      console.log("📊 No phonics progress found yet for this user");
      return;
    }

    console.log("📊 User phonics progress:", phonicsProgress);

    // Get all achievement definitions from achievement_types table
    const { data: achievementTypes, error: typesError } = await supabase
      .from("achievement_types")
      .select("*")
      .order("level_name", { ascending: true })
      .order("sort_order", { ascending: true });

    if (typesError) {
      console.error("Error fetching achievement types:", typesError);
      return;
    }

    console.log("🎯 Achievement types loaded:", achievementTypes?.length || 0);

    // Get user's existing achievements
    const { data: existingAchievements, error: achievementsError } = await supabase
      .from("user_achievements")
      .select("achievement_type")
      .eq("user_id", userId);

    if (achievementsError) {
      console.error("Error fetching user achievements:", achievementsError);
      return;
    }

    const earnedAchievementTypes = new Set(
      existingAchievements?.map((a) => a.achievement_type) || []
    );
    console.log("🎖️ Already earned achievements:", earnedAchievementTypes.size);

    // Map database columns to achievement categories
    const categoryMapping = {
      cvc: phonicsProgress.cvc_words_read || 0,
      blending: phonicsProgress.blending_words_read || 0,
      silent_letter: phonicsProgress.silent_letter_words_read || 0,
      silent: phonicsProgress.silent_letter_words_read || 0, // Alias for silent_letter
      phonics_merger: phonicsProgress.phonics_merger_words_read || 0,
      sight_words: phonicsProgress.sight_words_read || 0,
      other: phonicsProgress.other_words_read || 0,
    };

    console.log("📊 Word counts by category:", categoryMapping);

    // Check each achievement
    for (const achievement of achievementTypes) {
      // Skip if already earned
      if (earnedAchievementTypes.has(achievement.achievement_type)) {
        continue;
      }

      let qualified = false;
      const category = achievement.word_category?.toLowerCase();
      const requiredWords = achievement.words_required || 0;

      console.log(
        `🔍 Checking achievement: ${achievement.achievement_title} (Category: ${category}, Required: ${requiredWords})`
      );

      // Check if user meets the requirement
      if (category && categoryMapping[category] !== undefined) {
        const userCount = categoryMapping[category];
        qualified = userCount >= requiredWords;

        console.log(
          `  User has ${userCount} ${category} words, needs ${requiredWords}: ${
            qualified ? "✅ QUALIFIED" : "❌ Not yet"
          }`
        );
      } else {
        console.log(`  ⚠️ Unknown category: ${category}`);
      }

      // Award the achievement if qualified
      if (qualified) {
        console.log(`🎉 Awarding achievement: ${achievement.achievement_title}`);

        const { error: insertError } = await supabase.from("user_achievements").insert({
          user_id: userId,
          achievement_type: achievement.achievement_type,
          achievement_title: achievement.achievement_title,
          achievement_description: achievement.achievement_description,
          badge_icon: achievement.badge_icon,
          points_earned: achievement.points_required || 0,
          unlocked_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error(
            `❌ Error awarding achievement ${achievement.achievement_title}:`,
            insertError
          );
        } else {
          console.log(`✅ Achievement awarded: ${achievement.achievement_title}`);
          // Show toast notification
          showAchievementToast(achievement);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error checking achievements:", error);
  }
};

/**
 * Show achievement toast notification with badge image
 */
const showAchievementToast = async (achievement) => {
  // Log to console
  console.log(`🎉 ACHIEVEMENT UNLOCKED: ${achievement.achievement_title}`);
  console.log(`📝 ${achievement.achievement_description}`);
  console.log(`🎁 +${achievement.points_required || 0} points!`);

  // Map database badge_icon names to actual file names (matching AchievementsPage logic)
  const iconMapping = {
    "first-steps.png": "First Steps.png",
    "getting-started.png": "Getting Started.png",
    "word-explorer.png": "Word Explorer.png",
    "reading-rookie.png": "Reading Rookie.png",
    "cvc-champion.png": "CVC Champion.png",
    "perfect-reader.png": "Perfect Reader.png",
    "precision-master.png": "Precision Master.png",
    "flawless-flow.png": "Flawless Flow.png",
    "accuracy-ace.png": "Accuracy Ace.png",
    "error-free.png": "Error-Free Expert.png",
    "quick-learner.png": "Quick Learner.png",
    "speedy-reader.png": "Speedy Reader.png",
    "lightning-fast.png": "Lightning Fast.png",
    "racing-reader.png": "Racing Reader.png",
    "speed-demon.png": "Speed Demon.png",
    "daily-dedication.png": "Daily Dedication.png",
    "weekly-warrior.png": "Weekly Warrior.png",
    "word-collector.png": "Word Collector.png",
    "halfway-hero.png": "Halfway Hero.png",
    "graduation-cap.png": "Frustration Bound.png",
  };

  let iconFileName = achievement.badge_icon || achievement.achievement_title;

  // Remove .png if it exists and convert to lowercase for mapping
  const baseFileName = iconFileName.toLowerCase().replace(".png", "");
  const mappedFileName = iconMapping[baseFileName + ".png"] || iconMapping[iconFileName];

  if (mappedFileName) {
    iconFileName = mappedFileName;
  } else {
    // If no mapping found, try to convert kebab-case to Title Case
    iconFileName =
      (achievement.badge_icon || achievement.achievement_title)
        .replace(".png", "")
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") + ".png";
  }

  // Construct badge image path (encode spaces in folder names)
  const badgeImagePath = `/img/CapyBuddy%20Assets/Achievement%20Badges/${iconFileName}`;

  // Create custom achievement notification overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    background: white;
    border: 2px solid black;
    color: #333;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 320px;
    max-width: 400px;
    animation: slideInDown 0.5s ease-out;
  `;

  overlay.innerHTML = `
    <img src="${badgeImagePath}" alt="${achievement.achievement_title}" 
         style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover; flex-shrink: 0; border: 2px solid #333;" />
    <div style="flex: 1;">
      <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">🏆 ${
        achievement.achievement_title
      }</div>
      <div style="font-size: 14px; opacity: 0.9;">+${
        achievement.points_required || 0
      } points earned!</div>
    </div>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #333; font-size: 18px; cursor: pointer; padding: 4px; opacity: 0.7;">✓</button>
  `;

  // Add to page
  document.body.appendChild(overlay);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.style.animation = "slideOutUp 0.5s ease-in";
      setTimeout(() => overlay.remove(), 500);
    }
  }, 5000);

  // Inject the custom HTML into the toast after it's presented
  const toastElement = await toast.getElement();
  const messageElement = toastElement.querySelector(".toast-message");
  if (messageElement) {
    messageElement.innerHTML = "";
    messageElement.appendChild(container);
  }
};

// ============================================================================
// EXISTING HELPER FUNCTIONS (Updated)
// ============================================================================

// Helper function to reset words status for retry
const resetWordsStatus = () => {
  words.value.forEach((word) => {
    word.status = null;
  });
  resetReadingSession();
};

// 🎙️ Toggle mic (supports both online and offline)
const toggleListening = async () => {
  console.log("🎤 toggleListening called, current system:", activeRecognitionSystem.value);

  if (!speechSystemReady.value) {
    console.log("⏳ Speech system not ready yet, please wait...");
    return;
  }

  // Use native speech recognition if available
  if (activeRecognitionSystem.value === "native") {
    if (!isListening.value) {
      isListening.value = true;
      console.log("🎤 Starting native speech recognition loop...");
      startNativeSpeechListening();
    } else {
      isListening.value = false;
      console.log("🎤 Stopping native speech recognition...");
      await SpeechRecognition.stop();
    }
    return;
  }

  // Web Speech API fallback
  if (activeRecognitionSystem.value === "webspeech") {
    if (!recognition) {
      console.error("❌ Web Speech API not initialized");
      return;
    }

    if (!isListening.value) {
      isListening.value = true;
      console.log("🎤 Starting Web Speech API...");
      recognition.start();
    } else {
      isListening.value = false;
      console.log("🎤 Stopping Web Speech API...");
      recognition.stop();
    }
    return;
  }

  console.error("❌ No active recognition system available");
};

// Start native speech recognition loop for Android/iOS
const startNativeSpeechListening = async () => {
  const listenLoop = async () => {
    if (!isListening.value) {
      console.log("🎤 Listen loop stopped");
      return;
    }

    try {
      console.log("🎤 Starting native recognition...");
      const result = await SpeechRecognition.start({
        language: 'en-US',
        maxResults: 5,
        prompt: 'Speak the word...',
        popup: false,
        partialResults: false,
      });

      console.log("🎤 Native recognition result:", result);
      console.log("🎤 Result type:", typeof result, "Keys:", Object.keys(result || {}));

      // Handle different possible result structures from Capacitor plugin
      let transcript = null;
      if (result && result.matches && result.matches.length > 0) {
        transcript = result.matches[0];
      } else if (result && result.value && result.value.length > 0) {
        transcript = result.value[0];
      } else if (typeof result === 'string') {
        transcript = result;
      }

      if (transcript) {
        transcript = transcript.toLowerCase().trim();
        console.log("🎤 Native speech recognized:", transcript);
        await checkWord(transcript, true); // true = final result
      } else {
        console.log("⚠️ No matches in result:", result);
      }

      // Continue listening if still active
      if (isListening.value) {
        setTimeout(listenLoop, 100);
      }
    } catch (error) {
      console.error("🎤 Native recognition error:", error);
      if (isListening.value) {
        // Retry after a short delay
        setTimeout(listenLoop, 500);
      }
    }
  };

  listenLoop();
};

// ✅ Reactive state
const progress = ref(0); // start empty
const isGenerating = ref(false); // Track auto-generation state

// ✅ Function to update progress
const updateProgress = async () => {
  const total = words.value.length;
  const correctCount = words.value.filter((w) => w.status === "correct").length;
  progress.value = (correctCount / total) * 100; // e.g., 1/5 = 20%

  // Check if all words have been attempted (correct or incorrect)
  const attemptedCount = words.value.filter((w) => w.status !== null).length;

  if (attemptedCount === total && !showResultsModal.value && !showMiscueReview.value) {
    console.log("🎉 All words completed! Recording session...");

    // Stop any ongoing speech recognition
    if (isListening.value) {
      if (recognition) {
        recognition.stop();
      }
      isListening.value = false;
    }

    // Record the reading session to database
    await recordReadingSession();

    // Save phonics progress to database
    if (profile.value?.id) {
      await savePhonicsProgress(profile.value.id);
    }

    // Check if there are miscues to review
    if (sessionMiscues.value.length > 0) {
      console.log(
        `📝 Found ${sessionMiscues.value.length} miscues, showing review page...`
      );
      showMiscueReview.value = true;
    } else {
      // No miscues, show results directly
      console.log("✅ No miscues found, showing results modal...");
      console.log(
        `📊 Final Score: ${correctWordsCount.value}/${totalWordsAttempted.value} words correct`
      );
      showResultsModal.value = true;
    }
  }
};

// Get capybara expression based on streak and errors
const getCapybaraExpression = () => {
  try {
    // If there are consecutive errors, show sad expressions
    if (consecutiveErrors.value >= 3) {
      return new URL(
        "../img/CapyBuddy Assets/Capybara/capybara (16).png",
        import.meta.url
      ).href; // Very sad
    } else if (consecutiveErrors.value === 2) {
      return new URL(
        "../img/CapyBuddy Assets/Capybara/capybara (17).png",
        import.meta.url
      ).href; // Sad
    } else if (consecutiveErrors.value === 1) {
      return new URL(
        "../img/CapyBuddy Assets/Capybara/capybara (15).png",
        import.meta.url
      ).href; // Disappointed
    }

    // Happy expressions based on streak
    if (streak.value >= 10) {
      return new URL(
        "../img/CapyBuddy Assets/Capybara/capybara (10).png",
        import.meta.url
      ).href; // Super excited
    } else if (streak.value >= 8) {
      return new URL(
        "../img/CapyBuddy Assets/Capybara/capybara (13).png",
        import.meta.url
      ).href; // Very happy
    } else if (streak.value >= 6) {
      return new URL(
        "../img/CapyBuddy Assets/Capybara/capybara (12).png",
        import.meta.url
      ).href; // Happy
    } else if (streak.value >= 4) {
      return new URL(
        "../img/CapyBuddy Assets/Capybara/capybara (11).png",
        import.meta.url
      ).href; // Pleased
    } else if (streak.value >= 2) {
      return new URL("../img/CapyBuddy Assets/Capybara/capybara (2).png", import.meta.url)
        .href; // Smiling
    } else {
      return new URL("../img/CapyBuddy Assets/Capybara/capybara (1).png", import.meta.url)
        .href; // Default neutral
    }
  } catch (error) {
    console.error("Error loading capybara image:", error);
    // Fallback to the main capybara image
    return new URL("../img/capybara.png", import.meta.url).href;
  }
};

// Handle image loading errors
const handleImageError = (event) => {
  console.error("Image failed to load:", event.target.src);
  // Fallback to a default image
  event.target.src = "/img/capybara.png";
};
/**
 * Record a miscue (reading error) in the database
 */
const recordMiscue = async (
  expectedWord,
  actualReading,
  wordPosition,
  miscueType = "mispronunciation"
) => {
  try {
    if (!profile.value?.id || !currentSessionId.value) {
      console.warn("Cannot record miscue: missing user ID or session ID");
      return;
    }

    console.log(`📝 Recording miscue: "${actualReading}" instead of "${expectedWord}"`);

    // Store miscue in session array for review
    const miscueData = {
      reading_session_id: currentSessionId.value,
      user_id: profile.value.id,
      word_position: wordPosition,
      expected_word: expectedWord,
      actual_reading: actualReading,
      miscue_type: miscueType,
      is_self_corrected: false,
      meaning_maintained: determineMeaningMaintained(expectedWord, actualReading),
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

/**
 * Determine the type of miscue based on expected vs actual reading
 */
const determineMiscueType = (expected, actual) => {
  if (!actual || actual.trim() === "") {
    return "omission"; // Student skipped the word
  }

  if (actual.length > expected.length * 1.5) {
    return "insertion"; // Student added extra words/sounds
  }

  if (actual.toLowerCase() !== expected.toLowerCase()) {
    // Check if it's a substitution (completely different word) or mispronunciation
    const similarity =
      1 -
      levenshtein(actual.toLowerCase(), expected.toLowerCase()) /
        Math.max(actual.length, expected.length);

    if (similarity < 0.3) {
      return "substitution"; // Completely different word
    } else {
      return "mispronunciation"; // Similar but mispronounced
    }
  }

  return "mispronunciation"; // Default fallback
};

/**
 * Determine if the miscue maintains meaning
 */
const determineMeaningMaintained = (expected, actual) => {
  // Simple heuristic: if words are very similar or synonyms, meaning might be maintained
  const similarity =
    1 -
    levenshtein(actual.toLowerCase(), expected.toLowerCase()) /
      Math.max(actual.length, expected.length);

  // If similarity is high (minor mispronunciation), meaning is likely maintained
  return similarity > 0.7;
};

// ✅ Check spoken word against current word
const checkWord = (spoken) => {
  console.log("🔍 === checkWord function called ===");
  console.log("🎤 Spoken word:", spoken);
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

  // similarity (Levenshtein)
  const distance = levenshtein(spoken.toUpperCase(), target.text);
  const maxLen = Math.max(spoken.length, target.text.length);
  const similarity = 1 - distance / maxLen;

  console.log(`📊 Similarity calculation:`);
  console.log(`   Input: "${spoken.toUpperCase()}" vs Target: "${target.text}"`);
  console.log(
    `   Distance: ${distance}, Max Length: ${maxLen}, Similarity: ${similarity}`
  );

  if (similarity >= 0.6) {
    console.log("✅ Word matched! Marking as correct");
    target.status = "correct"; // green

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
      console.log(`📚 Tracked ${category} word: "${target.text}" (correct)`);
    }

    // End word timer with success
    endWordTimer(true);

    console.log(`🔥 Streak increased to: ${streak.value}`);
    console.log(
      `✅ Correct words: ${correctWordsCount.value}/${totalWordsAttempted.value}`
    );
  } else {
    console.log("❌ Word not matched. Marking as incorrect");
    target.status = "incorrect"; // red

    // 🎵 Play incorrect word sound
    playWordFeedback(false);

    consecutiveErrors.value++; // Increase consecutive errors

    // Track word category for phonics progress (incorrect attempt)
    const category = getWordCategory(target.text);
    if (categoryProgress.value[category]) {
      categoryProgress.value[category].total++;
      // Don't increment correct count
      console.log(`📚 Tracked ${category} word: "${target.text}" (incorrect)`);
    }

    // 📝 Record the miscue for detailed analytics
    const miscueType = determineMiscueType(target.text, spoken);
    recordMiscue(target.text, spoken, wordPosition, miscueType);

    // End word timer with failure
    endWordTimer(false);

    console.log(`😞 Consecutive errors: ${consecutiveErrors.value}`);
    console.log(
      `✅ Correct words: ${correctWordsCount.value}/${totalWordsAttempted.value}`
    );
  }

  updateProgress(); // ✅ refresh progress bar
  console.log("🔍 === checkWord function end ===");
};

// Lifecycle
onMounted(async () => {
  isLoading.value = true;
  // 🎵 Start reading background music
  console.log("🎵 Starting reading background music...");
  startMusic(MUSIC_TYPES.READING, 0.3);

  // Set task mode based on query parameters
  setTaskMode();

  // Initialize user authentication and data
  try {
    await initAuth();
    if (isAuthenticated.value && profile.value) {
      await getStudentStats(profile.value.id);
      console.log("📊 Student stats loaded:", studentStats.value);
    }
  } catch (error) {
    console.error("Error loading user data:", error);
  }

  // Setup unified speech event listeners
  setupUnifiedSpeechListeners();

  await fetchWords();
  await initSpeech(); // Initialize speech recognition on mount

  // Auto-open reading exercise overlay when page loads
  setTimeout(() => {
    openReadingOverlay();
    isLoading.value = false;
  }, 500); // Small delay to ensure page is fully loaded
});

onBeforeUnmount(() => {
  // 🔇 Stop background music when leaving page
  console.log("🔇 Stopping reading background music...");
  stopMusic();

  // Cleanup Web Speech API
  if (recognition) {
    recognition.stop();
    recognition = null;
  }

  // Cleanup Vosk offline recognition
  if (scriptProcessor) {
    scriptProcessor.disconnect();
    scriptProcessor = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  // Cleanup Capacitor
  SpeechRecognition.removeAllListeners();

  listening.value = false;
});
</script>

<style scoped>
/* Custom animations */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.border-3 {
  border-width: 3px;
}

/* Backdrop blur support */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Enhanced hover effects */
.hover\:scale-105:hover {
  transform: scale(1.05);
}

.transition-all {
  transition: all 0.3s ease-in-out;
}

/* Listening animation */
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}

/* Pulse animation for microphone */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.animate-pulse {
  animation: pulse 1.5s infinite;
}

/* Progress bar animation */
.ease-out {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

/* Custom background */
.page-background {
  background-image: url("@/img/background.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.6;
}

/* Microphone Toggle Styles */
.mic-switch {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #4caf50;
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
}

.mic-on,
.mic-off {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease-in-out;
}

.mic-on {
  z-index: 4;
}

.mic-off {
  position: absolute;
  inset: 0;
  z-index: 5;
  opacity: 0;
}

.mic-switch:hover {
  background-color: rgba(76, 175, 80, 0.8);
  transform: scale(1.05);
}

#micCheckbox {
  display: none;
}

#micCheckbox:checked + .mic-switch {
  background-color: #f44336;
  box-shadow: 0 8px 25px rgba(244, 67, 54, 0.3);
}

#micCheckbox:checked + .mic-switch .mic-off {
  opacity: 1;
}

#micCheckbox:checked + .mic-switch:hover {
  background-color: rgba(244, 67, 54, 0.8);
}

.mic-switch:active {
  transform: scale(1.2);
}

/* Clean Sticky Microphone */
.sticky-microphone {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.microphone-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(76, 175, 80, 0.4);
  transition: all 0.3s ease;
}

.microphone-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(76, 175, 80, 0.5);
}

.microphone-button.listening {
  background-color: #f44336;
  box-shadow: 0 4px 20px rgba(244, 67, 54, 0.4);
  animation: pulse-listening 2s infinite;
}

.microphone-button.listening:hover {
  box-shadow: 0 6px 25px rgba(244, 67, 54, 0.5);
}

.mic-status {
  font-size: 12px;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px 8px;
  border-radius: 8px;
  margin: 0;
  text-align: center;
}

@keyframes pulse-listening {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Achievement Toast Styling */
.achievement-toast {
  --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --color: #ffffff;
  font-family: "Jua", cursive;
  --min-height: 90px;
}

.achievement-toast::part(message) {
  font-size: 14px;
  line-height: 1.4;
  color: #ffffff;
  opacity: 0.95;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.achievement-toast::part(header) {
  font-size: 18px;
  font-weight: bold;
  padding-bottom: 8px;
  color: #ffffff;
}

.achievement-toast::part(button) {
  color: #ffffff;
  font-weight: 600;
}

/* Achievement notification animations */
@keyframes slideInDown {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes slideOutUp {
  from {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
}
</style>
