<template>
  <ion-page>
    <ion-content class="miscue-review-content" scroll-y="false" fullscreen>
      <!-- Animated Background -->
      <div class="background-container">
        <div class="floating-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
          <div class="shape shape-4"></div>
        </div>
        <div class="gradient-overlay"></div>
      </div>

      <!-- Header -->
      <div class="header-container">
        <div class="header-content">
          <div class="header-left">
            <button @click="playClick('student'); skipReview()" class="back-button">
              <ion-icon :icon="arrowBackOutline" />
            </button>
            <div class="header-text">
              <h1 class="header-title">Practice Again</h1>
              <p class="header-subtitle">Let's master these challenging words</p>
            </div>
          </div>
          <button @click="playClick('student'); skipReview()" class="skip-button">Skip</button>
        </div>
      </div>

      <!-- Main content -->
      <div class="main-content">
        <!-- Mascot Character -->
        <div class="mascot-container">
          <div class="mascot-glow">
            <img
              :src="getCapybaraExpression()"
              alt="Capybara Buddy"
              class="mascot-image"
              @error="handleImageError"
            />
          </div>
        </div>

        <!-- Progress indicator -->
        <div class="progress-container">
          <div class="progress-header">
            <span class="progress-label">Progress</span>
            <span class="progress-count"
              >{{ currentWordIndex + 1 }}/{{ miscueWords.length }}</span
            >
          </div>
          <div class="progress-bar-container">
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: progressPercentage + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Word Practice Card -->
        <div class="word-card">
          <div class="word-card-header">
            <h2 class="practice-label">Practice this word:</h2>
          </div>

          <div class="word-display">
            {{ currentMiscueWord?.expected_word || "" }}
          </div>

          <button
            @click="playClick('student'); speakWord(currentMiscueWord?.expected_word)"
            class="audio-button"
            :disabled="isSpeaking"
          >
            <ion-icon :icon="volumeHighOutline" />
            <span>{{ isSpeaking ? "Playing..." : "Listen" }}</span>
          </button>

          <!-- Previous attempt info -->
          <div v-if="currentMiscueWord?.actual_reading" class="attempt-info">
            <p class="attempt-label">Original: "{{ currentMiscueWord.actual_reading }}"</p>
            <p class="attempt-detail">
              {{ getErrorTypeMessage(currentMiscueWord.miscue_type) }}
            </p>
          </div>

          <!-- Repetition counter -->
          <div class="repetition-counter">
            <div class="counter-label">
              <ion-icon :icon="refreshOutline" class="counter-icon" />
              <span>Attempts: {{ currentRepetitionCount }}</span>
            </div>
            <div class="counter-description">
              {{
                currentRepetitionCount === 1
                  ? "First practice attempt"
                  : `Practice attempt #${currentRepetitionCount}`
              }}
            </div>
          </div>
        </div>

        <!-- Speech Recognition Interface -->
        <div class="speech-interface">
          <div class="speech-instruction">
            <ion-icon :icon="micOutline" class="instruction-icon" />
            <span>Say the word correctly when you're ready</span>
          </div>

          <div class="microphone-container">
            <button
              @click="playClick('student'); toggleListening()"
              class="microphone-button"
              :class="{
                listening: isListening,
                processing: isProcessing,
              }"
              :disabled="isProcessing"
            >
              <ion-icon :icon="isListening ? stopOutline : micOutline" class="mic-icon" />
              <div class="ripple" v-if="isListening"></div>
            </button>

            <div class="mic-status-container">
              <p class="mic-status" v-if="isListening">🎤 Listening...</p>
              <p class="mic-status" v-else-if="isProcessing">⏳ Processing...</p>
              <p class="mic-status" v-else>Tap to speak</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback Modal -->
      <div v-if="showFeedbackModal" class="feedback-modal-overlay" @click="closeFeedbackModal">
        <div class="feedback-modal" @click.stop>
          <div class="feedback-header" :class="{ correct: lastAttemptCorrect, incorrect: !lastAttemptCorrect }">
            <ion-icon :icon="lastAttemptCorrect ? checkmarkCircleOutline : alertCircleOutline" class="feedback-icon" />
            <h2>{{ lastAttemptCorrect ? 'Great Job!' : 'Almost There!' }}</h2>
          </div>
          
          <div class="feedback-content">
            <div class="word-comparison">
              <div class="comparison-row">
                <span class="label">You said:</span>
                <span class="spoken-word" :class="{ incorrect: !lastAttemptCorrect }">
                  {{ lastSpokenWord || "..." }}
                </span>
              </div>
              <div class="comparison-row">
                <span class="label">Correct word:</span>
                <span class="expected-word">"{{ currentMiscueWord?.expected_word }}"</span>
              </div>
            </div>

            <div v-if="lastAttemptCorrect" class="success-message">
              <p>🎉 Perfect! You got it right!</p>
            </div>
            <div v-else class="try-again-message">
              <p>💪 Don't worry, let's try again!</p>
              <p class="hint">Listen carefully and repeat the word.</p>
            </div>
          </div>

          <button @click="closeFeedbackModal" class="feedback-button" :class="{ correct: lastAttemptCorrect }">
            {{ lastAttemptCorrect ? 'Continue' : 'Try Again' }}
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import {
  arrowBackOutline,
  volumeHighOutline,
  micOutline,
  stopOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  refreshOutline,
} from "ionicons/icons";
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  watchEffect,
  nextTick,
} from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/services";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import supabase from "../supabase.js";

// Props
const props = defineProps({
  miscueWords: {
    type: Array,
    required: true,
  },
  sessionId: {
    type: [String, Number],
    required: true,
  },
});

// Emits
const emit = defineEmits(["review-complete", "skip-review"]);

// Router and auth
const router = useRouter();
const { profile } = useAuth();
const { startMusic, stopMusic, playClick, playWordFeedback } = useAudio();

// Debug profile loading
watchEffect(() => {
  console.log("🔍 Profile watch update:", {
    profile: profile.value,
    profileId: profile.value?.id,
    profileType: typeof profile.value,
  });
});

// Reactive state
const currentWordIndex = ref(0);
const isListening = ref(false);
const isGenerating = ref(false);
const isProcessing = ref(false);
const isSpeaking = ref(false);
const correctedWords = ref(new Set());
const skippedWords = ref(new Set());

// Feedback modal state
const showFeedbackModal = ref(false);
const lastAttemptCorrect = ref(false);
const lastSpokenWord = ref('');

// Repetition tracking - maps word index to repetition count
const wordRepetitions = ref(new Map());

// Track pending repetitions that need to be recorded when profile loads
const pendingRepetitions = ref([]);

// Platform detection
const isNativePlatform = Capacitor.isNativePlatform();
let speechSystemReady = ref(false);
const activeRecognitionSystem = ref(null); // Track which system is active: 'native' or 'webspeech'
let audioContext = null;
let scriptProcessor = null;
let mediaStream = null;
let recognizer = null;

// Helper function to get user ID with fallback
const getUserId = async () => {
  // First try to get from profile
  if (profile.value?.id) {
    console.log("📋 Using profile ID:", profile.value.id);
    return profile.value.id;
  }

  // Fallback: get from Supabase auth directly
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error("❌ Error getting user from Supabase auth:", error);
      return null;
    }

    if (user?.id) {
      console.log("📋 Using Supabase auth ID:", user.id);
      return user.id;
    }
  } catch (error) {
    console.error("❌ Failed to get user from Supabase auth:", error);
  }

  console.warn("⚠️ No user ID available from any source");
  return null;
};

// Speech recognition variables
let recognition = null;

// Computed properties
const currentMiscueWord = computed(() => {
  return props.miscueWords[currentWordIndex.value] || null;
});

const progressPercentage = computed(() => {
  if (props.miscueWords.length === 0) return 100;
  return Math.round(((currentWordIndex.value + 1) / props.miscueWords.length) * 100);
});

const currentRepetitionCount = computed(() => {
  return wordRepetitions.value.get(currentWordIndex.value) || 0;
});

// Process pending repetitions when profile becomes available
const processPendingRepetitions = async () => {
  const userId = await getUserId();

  console.log("📋 processPendingRepetitions called:", {
    profileId: profile.value?.id,
    userId: userId,
    sessionId: props.sessionId,
    pendingCount: pendingRepetitions.value.length,
  });

  // Check if we have all required data
  if (!userId) {
    console.log("❌ Cannot process pending repetitions - no userId available");
    return;
  }

  if (!props.sessionId) {
    console.log("❌ Cannot process pending repetitions - no sessionId available");
    return;
  }

  if (pendingRepetitions.value.length === 0) {
    console.log("📋 No pending repetitions to process");
    return;
  }

  console.log(`📋 Processing ${pendingRepetitions.value.length} pending repetitions`);

  for (const pending of pendingRepetitions.value) {
    console.log("📝 Processing pending:", pending);
    await recordRepetitionMiscue(
      pending.expectedWord,
      pending.actualReading,
      pending.wasCorrect
    );
  }

  // Clear pending repetitions after processing
  pendingRepetitions.value = [];
  console.log("✅ All pending repetitions processed");
};

// Text-to-speech function
const speakWord = (word) => {
  if (!word) return;

  isSpeaking.value = true;

  // Check if speech synthesis is supported
  if ("speechSynthesis" in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8; // Slightly slower for learning
    utterance.pitch = 1;
    utterance.volume = 1;

    // Handle speech end
    utterance.onend = () => {
      isSpeaking.value = false;
    };

    utterance.onerror = () => {
      isSpeaking.value = false;
    };

    // Try to use a clear English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (voice) =>
        voice.lang.startsWith("en") &&
        (voice.name.includes("Google") || voice.name.includes("Microsoft"))
    );

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this browser");
    isSpeaking.value = false;
  }
};

// Initialize speech recognition
const initSpeechRecognition = () => {
  console.log("🎤 Initializing speech recognition with fallback chain...");

  if (isNativePlatform) {
    console.log("📱 Native platform detected - using Capacitor Speech Recognition");
    initNativeSpeechRecognition();
    if (!speechSystemReady.value) {
      console.log("⚠️ Native speech recognition failed, trying Web Speech API fallback");
      initWebSpeechAPI();
    }
  } else {
    console.log("💻 Web platform detected - using Web Speech API");
    initWebSpeechAPI();
  }
};

// Native speech recognition initialization for mobile
const initNativeSpeechRecognition = () => {
  try {
    console.log("🎤 Initializing native (Capacitor) speech recognition");

    SpeechRecognition.checkPermissions().then(({ speechRecognition }) => {
      if (speechRecognition === 'granted') {
        console.log('✅ Speech recognition permission granted');
        speechSystemReady.value = true;
        activeRecognitionSystem.value = 'native';
      } else {
        console.log('⚠️ Speech recognition permission not granted, will request on use');
      }
    });
  } catch (error) {
    console.warn("⚠️ Native speech recognition initialization failed:", error);
    speechSystemReady.value = false;
  }
};

// Web Speech API initialization
const initWebSpeechAPI = () => {
  try {
    console.log("🎤 Initializing Web Speech API");

    const WebSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!WebSpeechRecognition) {
      console.warn("⚠️ Web Speech API not available in this browser");
      return;
    }

    recognition = new WebSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log("🎤 Heard:", transcript);
      isProcessing.value = true;

      setTimeout(async () => {
        await checkWord(transcript);
        isProcessing.value = false;
      }, 500);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      isListening.value = false;
      isProcessing.value = false;
    };

    recognition.onend = () => {
      isListening.value = false;
      if (isProcessing.value) {
        setTimeout(() => {
          isProcessing.value = false;
        }, 1000);
      }
    };

    speechSystemReady.value = true;
    activeRecognitionSystem.value = 'webspeech';
    console.log("✅ Web Speech API initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Web Speech API:", error);
    speechSystemReady.value = false;
  }
};

// Toggle microphone
const toggleListening = async () => {
  if (isProcessing.value) {
    console.log("Still processing previous input...");
    return;
  }

  if (!isListening.value) {
    // Start listening
    isListening.value = true;
    
    if (isNativePlatform) {
      // Use native Capacitor Speech Recognition
      try {
        // Check permissions before starting
        const permissionStatus = await SpeechRecognition.checkPermissions();
        console.log("🎤 Permission status:", permissionStatus);

        if (permissionStatus.speechRecognition !== 'granted') {
          console.log("🎤 Requesting speech recognition permissions...");
          const result = await SpeechRecognition.requestPermissions();
          console.log("🎤 Permission request result:", result);
          
          if (!result.granted) {
            console.error("❌ Speech recognition permissions denied");
            alert("Microphone permission is required for speech recognition. Please enable it in your device settings.");
            isListening.value = false;
            return;
          }
        }

        await SpeechRecognition.start({
          language: "en-US",
          maxResults: 1,
          prompt: "Say the word",
          partialResults: false,
          popup: false,
        });

        SpeechRecognition.addListener("partialResults", (data) => {
          console.log("🎤 Partial results:", data.matches);
        });

        SpeechRecognition.addListener("listeningState", (state) => {
          console.log("🎤 Listening state:", state);
          if (!state.listening) {
            isListening.value = false;
          }
        });

        const result = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Timeout"));
          }, 10000);

          SpeechRecognition.addListener("finalResults", (data) => {
            clearTimeout(timeout);
            resolve(data);
          });
        });

        if (result.matches && result.matches.length > 0) {
          const transcript = result.matches[0].trim();
          console.log("🎤 Native heard:", transcript);
          isProcessing.value = true;

          setTimeout(async () => {
            await checkWord(transcript);
            isProcessing.value = false;
          }, 500);
        }

        isListening.value = false;
      } catch (error) {
        console.error("Native speech recognition error:", error);
        alert("Failed to start speech recognition: " + error.message);
        isListening.value = false;
        isProcessing.value = false;
      }
    } else {
      // Use Web Speech API
      if (!recognition) {
        initSpeechRecognition();
      }
      recognition.start();
    }
  } else {
    // Stop listening
    isListening.value = false;
    if (isNativePlatform) {
      await SpeechRecognition.stop();
    } else {
      recognition.stop();
    }
  }
};

// Check spoken word
const checkWord = async (spoken) => {
  const expectedWord = currentMiscueWord.value?.expected_word;
  if (!expectedWord) return;

  console.log(`🔍 Checking: "${spoken}" vs "${expectedWord}"`);

  // Store the spoken word for feedback modal
  lastSpokenWord.value = spoken;

  // Increment repetition count for this word
  const currentIndex = currentWordIndex.value;
  const currentCount = wordRepetitions.value.get(currentIndex) || 0;
  wordRepetitions.value.set(currentIndex, currentCount + 1);

  console.log(`📊 Repetition count for word "${expectedWord}": ${currentCount + 1}`);

  // Simple similarity check (you can use the same logic from WordReadingPage)
  const similarity = calculateSimilarity(
    spoken.toUpperCase(),
    expectedWord.toUpperCase()
  );

  if (similarity >= 0.6) {
    console.log("✅ Word corrected!");
    playWordFeedback(true);
    correctedWords.value.add(currentWordIndex.value);
    lastAttemptCorrect.value = true;

    // Record the successful repetition with immediate attempt
    const userId = await getUserId();
    if (userId && props.sessionId) {
      console.log("⚡ Recording successful repetition immediately");
      await recordRepetitionMiscue(expectedWord, spoken, true);
    } else {
      console.log("⏳ Delaying successful repetition recording");
      pendingRepetitions.value.push({
        expectedWord,
        actualReading: spoken,
        wasCorrect: true,
        wordIndex: currentIndex,
      });
    }

    // Show feedback modal
    showFeedbackModal.value = true;
  } else {
    console.log("❌ Still incorrect, try again");
    playWordFeedback(false);
    lastAttemptCorrect.value = false;

    // Record the failed repetition with immediate attempt
    const userId = await getUserId();
    if (userId && props.sessionId) {
      console.log("⚡ Recording failed repetition immediately");
      await recordRepetitionMiscue(expectedWord, spoken, false);
    } else {
      console.log("⏳ Delaying failed repetition recording");
      pendingRepetitions.value.push({
        expectedWord,
        actualReading: spoken,
        wasCorrect: false,
        wordIndex: currentIndex,
      });
    }

    // Show feedback modal
    showFeedbackModal.value = true;
  }
};

// Close feedback modal and move to next word if correct
const closeFeedbackModal = () => {
  showFeedbackModal.value = false;
  
  if (lastAttemptCorrect.value) {
    // Move to next word automatically if correct
    setTimeout(() => {
      if (currentWordIndex.value < props.miscueWords.length - 1) {
        nextWord();
      } else {
        finishReview();
      }
    }, 300);
  }
};

// Calculate word similarity (Levenshtein distance)
const calculateSimilarity = (a, b) => {
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - distance / maxLen;
};

// Levenshtein distance function
function levenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Record repetition miscue
const recordRepetitionMiscue = async (expectedWord, actualReading, wasCorrect) => {
  try {
    // Get user ID with fallback
    const userId = await getUserId();

    // Debug logging
    console.log("🔍 Attempting to record repetition miscue with:", {
      userId: userId,
      profileId: profile.value?.id,
      sessionId: props.sessionId,
      expectedWord,
      actualReading,
      wasCorrect,
    });

    if (!userId) {
      console.warn("Cannot record repetition miscue: no user ID available");
      return;
    }

    if (!props.sessionId) {
      console.warn("Cannot record repetition miscue: session ID is missing");
      console.log("Props sessionId:", props.sessionId);
      return;
    }

    // Get current repetition count for this word
    const currentCount = wordRepetitions.value.get(currentWordIndex.value) || 1;

    console.log(
      `📝 Recording repetition miscue #${currentCount}: "${actualReading}" for "${expectedWord}" - ${
        wasCorrect ? "Correct" : "Incorrect"
      }`
    );

    const { error } = await supabase.from("reading_miscues").insert({
      reading_session_id: props.sessionId,
      user_id: userId,
      word_position: currentWordIndex.value + 1,
      expected_word: expectedWord,
      actual_reading: actualReading,
      miscue_type: "repetition",
      is_self_corrected: wasCorrect,
      meaning_maintained: wasCorrect,
    });

    if (error) {
      console.error("Error recording repetition miscue:", error);
    } else {
      console.log(`✅ Repetition miscue attempt recorded successfully`);
    }
  } catch (error) {
    console.error("❌ Error in recordRepetitionMiscue:", error);
  }
};

// Navigation methods
const nextWord = () => {
  if (currentWordIndex.value < props.miscueWords.length - 1) {
    currentWordIndex.value++;
    // Initialize repetition count for the new word and record the automatic first repetition
    initializeWordRepetition();
  }
};

const previousWord = () => {
  if (currentWordIndex.value > 0) {
    currentWordIndex.value--;
  }
};

// Initialize repetition tracking for a word when it's first encountered
const initializeWordRepetition = async () => {
  const currentIndex = currentWordIndex.value;
  const expectedWord = currentMiscueWord.value?.expected_word;

  if (!expectedWord) return;

  // If this word hasn't been tracked yet, initialize it with 1 repetition
  if (!wordRepetitions.value.has(currentIndex)) {
    wordRepetitions.value.set(currentIndex, 1);

    console.log(
      `🎯 First encounter with word "${expectedWord}" - automatically counting as repetition #1`
    );

    // Try to record immediately with getUserId fallback
    const userId = await getUserId();
    if (userId && props.sessionId) {
      console.log("⚡ Recording initial repetition immediately");
      await recordRepetitionMiscue(
        expectedWord,
        currentMiscueWord.value?.spoken_word || expectedWord,
        false
      );
    } else {
      console.log(
        "⏳ Delaying database recording until profile and session are available"
      );
      // Store for later recording when profile becomes available
      pendingRepetitions.value.push({
        expectedWord,
        actualReading: currentMiscueWord.value?.spoken_word || expectedWord,
        wasCorrect: false,
        wordIndex: currentIndex,
      });
    }
  }
};

const skipCurrentWord = () => {
  skippedWords.value.add(currentWordIndex.value);

  if (currentWordIndex.value < props.miscueWords.length - 1) {
    nextWord();
  } else {
    finishReview();
  }
};

const finishReview = async () => {
  console.log("📊 Review completed:", {
    totalWords: props.miscueWords.length,
    correctedWords: correctedWords.value.size,
    skippedWords: skippedWords.value.size,
  });

  // Process any remaining pending repetitions before finishing
  if (pendingRepetitions.value.length > 0) {
    console.log("🔄 Processing remaining pending repetitions before finish");

    // Try to get user ID one more time before finishing
    const userId = await getUserId();
    if (userId && props.sessionId) {
      await processPendingRepetitions();
    } else {
      console.warn(
        "⚠️ Still unable to process pending repetitions on finish - user may need to log in again"
      );
      // Note: In a production app, you might want to store these in localStorage for retry later
    }
  }

  emit("review-complete", {
    correctedWords: Array.from(correctedWords.value),
    skippedWords: Array.from(skippedWords.value),
  });
};

const skipReview = () => {
  emit("skip-review");
};

// Format miscue type for display
const getErrorTypeMessage = (type) => {
  const typeMap = {
    mispronunciation: "Mispronunciation - try to sound it out carefully",
    omission: "Word was skipped - don't skip any words",
    substitution: "Different word was said - read exactly what's written",
    insertion: "Extra sounds were added - stick to the written word",
    repetition: "Word was repeated - read it once clearly",
    transposition: "Letters were mixed up - check the letter order",
    reversal: "Letters or word was reversed - read left to right",
  };
  return typeMap[type] || "Try to read more carefully";
};

const formatMiscueType = (type) => {
  const typeMap = {
    mispronunciation: "Mispronunciation",
    omission: "Omission (skipped)",
    substitution: "Substitution (different word)",
    insertion: "Insertion (extra sounds)",
    repetition: "Repetition",
    transposition: "Letter order mixed up",
    reversal: "Letter/word reversal",
  };
  return typeMap[type] || type;
};

// Get Capybara expression
const getCapybaraExpression = () => {
  try {
    // Encouraging expression for practice
    return new URL("../img/CapyBuddy Assets/Capybara/capybara (2).png", import.meta.url)
      .href;
  } catch (error) {
    console.error("Error loading capybara image:", error);
    return new URL("../img/capybara.png", import.meta.url).href;
  }
};

// Handle image loading errors
const handleImageError = (event) => {
  console.error("Image failed to load:", event.target.src);
  event.target.src = "/img/capybara.png";
};

// Lifecycle
onMounted(async () => {
  console.log("🎵 Starting reading music for MiscueReviewPage...");
  startMusic(MUSIC_TYPES.READING, 0.3);
  
  initSpeechRecognition();

  // Initialize the first word's repetition count
  await initializeWordRepetition();

  // Load voices for text-to-speech
  if ("speechSynthesis" in window) {
    // Wait for voices to load
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log("🔊 Text-to-speech voices loaded:", voices.length);
      }
    };

    // Voices might load asynchronously
    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices();
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    }
  }

  // Try to process any pending repetitions immediately
  nextTick(async () => {
    console.log("⚡ Immediate processing check in onMounted");
    await processPendingRepetitions();
  });
});

// Watch for profile changes to process pending repetitions
watch(
  [() => profile.value?.id, () => props.sessionId, () => pendingRepetitions.value.length],
  async ([profileId, sessionId, pendingCount]) => {
    console.log("🔍 Watch triggered:", {
      profileId,
      sessionId,
      pendingCount,
    });

    // Only process if we have both profile ID and session ID, and there are pending repetitions
    if (profileId && sessionId && pendingCount > 0) {
      console.log("👤 Profile and session now available, processing pending repetitions");
      await processPendingRepetitions();
    }
  },
  { immediate: true }
);

onBeforeUnmount(async () => {
  console.log("🔇 Stopping reading music for MiscueReviewPage...");
  stopMusic();
  
  // Cleanup speech recognition
  if (isNativePlatform) {
    try {
      await SpeechRecognition.stop();
      SpeechRecognition.removeAllListeners();
    } catch (error) {
      console.error("Error cleaning up native speech recognition:", error);
    }
  } else if (recognition) {
    recognition.stop();
    recognition = null;
  }

  // Cleanup text-to-speech
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  isListening.value = false;
});
</script>

<style scoped>
/* === CORE LAYOUT === */
.miscue-review-content {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #48bb78;
  --error-color: #f56565;
  --text-primary: #2d3748;
  --text-secondary: #4a5568;
  --bg-overlay: rgba(255, 255, 255, 0.95);
  height: 100vh;
  overflow: hidden;
}

/* === ANIMATED BACKGROUND === */
.background-container {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 20%;
  animation-delay: 2s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  bottom: 30%;
  left: 10%;
  animation-delay: 4s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  top: 10%;
  right: 40%;
  animation-delay: 1s;
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    45deg,
    rgba(102, 126, 234, 0.8) 0%,
    rgba(118, 75, 162, 0.8) 100%
  );
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(5deg);
  }
  66% {
    transform: translateY(10px) rotate(-5deg);
  }
}

/* === HEADER === */
.header-container {
  position: relative;
  z-index: 10;
  background: var(--bg-overlay);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  max-width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.1);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--primary-color);
}

.back-button:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: scale(1.05);
}

.header-text {
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.header-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  margin-top: 0.25rem;
}

.skip-button {
  padding: 0.5rem 1rem;
  background: none;
  border: 2px solid var(--primary-color);
  border-radius: 20px;
  color: var(--primary-color);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.skip-button:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
}

/* === MAIN CONTENT === */
.main-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem;
  min-height: calc(100vh - 80px);
  gap: 1.5rem;
}

/* === MASCOT === */
.mascot-container {
  position: relative;
}

.mascot-glow {
  position: relative;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  padding: 1rem;
  animation: gentle-pulse 3s ease-in-out infinite;
}

.mascot-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
  transition: transform 0.3s ease;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.2));
}

@keyframes gentle-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* === PROGRESS === */
.progress-container {
  width: 100%;
  max-width: 400px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.progress-count {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.progress-bar-container {
  width: 100%;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
  box-shadow: 0 2px 8px rgba(72, 187, 120, 0.4);
}

/* === WORD CARD === */
.word-card {
  background: var(--bg-overlay);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 1px 0px rgba(255, 255, 255, 0.8) inset;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  transition: all 0.3s ease;
}

.word-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.word-card-header {
  margin-bottom: 1.5rem;
}

.practice-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

.word-display {
  font-size: 3.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 1.5rem 0;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  line-height: 1;
}

.audio-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    var(--secondary-color) 100%
  );
  color: white;
  border: none;
  border-radius: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.audio-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.audio-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.attempt-info {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(244, 101, 101, 0.1);
  border-left: 4px solid var(--error-color);
  border-radius: 8px;
  text-align: left;
}

.attempt-label {
  font-size: 0.875rem;
  color: var(--error-color);
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.attempt-detail {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

/* === REPETITION COUNTER === */
.repetition-counter {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  text-align: center;
}

.counter-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.counter-icon {
  font-size: 1rem;
  color: var(--primary-color);
}

.counter-description {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-style: italic;
}

/* === SPEECH INTERFACE === */
.speech-interface {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.speech-instruction {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.instruction-icon {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
}

.microphone-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.microphone-button {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--success-color) 0%, #38a169 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(72, 187, 120, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.microphone-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 12px 35px rgba(72, 187, 120, 0.5), 0 0 0 6px rgba(255, 255, 255, 0.15);
}

.microphone-button.listening {
  background: linear-gradient(135deg, var(--error-color) 0%, #e53e3e 100%);
  animation: pulse-mic 2s infinite;
  box-shadow: 0 8px 25px rgba(245, 101, 101, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.1);
}

.microphone-button.processing {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  animation: processing 1.5s linear infinite;
}

.mic-icon {
  font-size: 2rem;
  z-index: 2;
}

.ripple {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  animation: ripple-effect 2s infinite;
}

.mic-status-container {
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-status {
  font-size: 0.875rem;
  color: white;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  margin: 0;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 500;
}

/* === ANIMATIONS === */
@keyframes pulse-mic {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes processing {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes ripple-effect {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* === RESPONSIVE DESIGN === */
@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
  }

  .header-title {
    font-size: 1.125rem;
  }

  .header-subtitle {
    font-size: 0.75rem;
  }

  .main-content {
    padding: 1.5rem 1rem;
    gap: 1.25rem;
  }

  .word-card {
    padding: 1.5rem;
  }

  .word-display {
    font-size: 2.5rem;
  }

  .mascot-image {
    width: 100px;
    height: 100px;
  }

  .microphone-button {
    width: 70px;
    height: 70px;
  }

  .mic-icon {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .header-left {
    gap: 0.75rem;
  }

  .back-button {
    width: 40px;
    height: 40px;
  }

  .word-display {
    font-size: 2rem;
  }

  .word-card {
    padding: 1.25rem;
  }

  .mascot-image {
    width: 80px;
    height: 80px;
  }

  .microphone-button {
    width: 60px;
    height: 60px;
  }

  .mic-icon {
    font-size: 1.5rem;
  }

  .progress-container {
    max-width: 300px;
  }
}

/* === ACCESSIBILITY === */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* === HIGH CONTRAST MODE === */
@media (prefers-contrast: high) {
  .word-card {
    border: 2px solid var(--text-primary);
  }

  .microphone-button {
    border: 2px solid white;
  }

  .back-button {
    border: 1px solid var(--primary-color);
  }
}

/* === FEEDBACK MODAL === */
.feedback-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.feedback-modal {
  background: white;
  border-radius: 24px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: modalSlideUp 0.3s ease-out;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.feedback-header {
  padding: 2rem;
  text-align: center;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.feedback-header.correct {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.feedback-header.incorrect {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
}

.feedback-icon {
  font-size: 3rem;
  animation: iconPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes iconPop {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.feedback-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}

.feedback-content {
  padding: 2rem;
}

.word-comparison {
  background: #f7fafc;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.comparison-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
}

.comparison-row:not(:last-child) {
  border-bottom: 2px solid #e2e8f0;
}

.comparison-row .label {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 600;
}

.spoken-word,
.expected-word {
  font-size: 1.25rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: white;
}

.spoken-word.incorrect {
  color: #dd6b20;
  background: #fef5e7;
}

.expected-word {
  color: #38a169;
  background: #f0fdf4;
}

.success-message,
.try-again-message {
  text-align: center;
}

.success-message p {
  font-size: 1.125rem;
  color: #38a169;
  font-weight: 600;
  margin: 0;
}

.try-again-message p {
  font-size: 1rem;
  color: #4a5568;
  margin: 0.25rem 0;
}

.try-again-message .hint {
  font-size: 0.875rem;
  color: #718096;
  font-style: italic;
}

.feedback-button {
  width: 100%;
  padding: 1rem;
  border: none;
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.feedback-button.correct {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.feedback-button:not(.correct) {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
}

.feedback-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.feedback-button:active {
  transform: translateY(0);
}

@media (max-width: 480px) {
  .feedback-modal {
    margin: 1rem;
  }

  .feedback-header {
    padding: 1.5rem;
  }

  .feedback-header h2 {
    font-size: 1.5rem;
  }

  .feedback-icon {
    font-size: 2.5rem;
  }

  .feedback-content {
    padding: 1.5rem;
  }

  .spoken-word,
  .expected-word {
    font-size: 1rem;
  }
}
</style>
