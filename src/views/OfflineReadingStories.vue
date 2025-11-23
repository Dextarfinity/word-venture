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
        <h1 class="text-xl font-bold text-brown-700">Story Reading</h1>
        <div class="w-10"></div>
      </div>

      <!-- Story Selection -->
      <div
        v-if="!story"
        class="relative z-10 flex flex-col items-center justify-center min-h-[70vh] p-6"
      >
        <div
          class="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl max-w-md w-full"
        >
          <div class="text-center mb-6">
            <img
              src="@/img/CapyBuddy Assets/Capybara/capybara (1).png"
              alt="CapyBuddy"
              class="w-20 h-20 mx-auto mb-4"
            />
            <h2 class="text-2xl font-bold text-brown-700 mb-2">Choose a Story</h2>
            <p class="text-brown-600">Pick any story to start reading!</p>
          </div>

          <ion-button
            @click="
              playClick('student');
              fetchStory();
            "
            expand="block"
            class="story-select-button mb-4"
            :disabled="stories.length === 0"
          >
            <ion-icon :icon="shuffleOutline"></ion-icon>
            {{ stories.length > 0 ? "Pick Random Story" : "Loading Stories..." }}
          </ion-button>

          <div v-if="stories.length > 3" class="grid grid-cols-1 gap-2">
            <ion-button
              v-for="(storyOption, index) in stories.slice(0, 3)"
              :key="index"
              @click="
                playClick('student');
                selectStory(storyOption);
              "
              fill="outline"
              class="story-option-button"
            >
              {{
                (storyOption.Title || storyOption.title || "Untitled").substring(0, 30)
              }}...
            </ion-button>
          </div>
        </div>
      </div>

      <!-- Story Display -->
      <div v-else class="relative z-10 flex flex-col h-full">
        <!-- Story Header -->
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
                {{ Math.round(progress) }}%
              </div>
            </div>
          </div>

          <h2 class="text-lg font-bold text-brown-800 text-center">
            {{ story.Title || story.title || "Story Time" }}
          </h2>

          <!-- Progress Bar -->
          <div class="w-full bg-white/50 rounded-full h-3 mt-2">
            <div
              class="bg-yellow-400 h-3 rounded-full transition-all duration-300"
              :style="{ width: progress + '%' }"
            ></div>
          </div>
        </div>

        <!-- Story Content -->
        <div
          ref="storyContainer"
          class="flex-1 overflow-y-auto p-6 bg-white/10"
          style="scroll-behavior: smooth"
        >
          <div class="max-w-3xl mx-auto">
            <!-- Current Word Indicator -->
            <div
              v-if="listening && currentWordIndex < storyWords.length"
              class="mb-4 p-3 bg-yellow-200/80 rounded-lg text-center"
            >
              <div class="text-sm text-brown-600 mb-1">Now reading:</div>
              <div class="text-xl font-bold text-brown-800">
                {{ storyWords[currentWordIndex]?.text || "" }}
              </div>
            </div>

            <!-- Story Text -->
            <div
              class="text-lg leading-relaxed text-brown-800 bg-white/80 p-6 rounded-2xl shadow-lg"
            >
              <span
                v-for="(word, index) in storyWords"
                :key="index"
                ref="wordEls"
                :class="[
                  'word inline-block mr-1 px-1 py-0.5 rounded transition-all duration-300',
                  {
                    'bg-green-200 text-green-800': word.status === 'correct',
                    'bg-red-200 text-red-800': word.status === 'incorrect',
                    'karaoke-active ring-2 ring-yellow-400':
                      listening && index === currentWordIndex,
                    'hover:bg-blue-100': word.clean !== null && !listening,
                  },
                ]"
                @click="!listening && word.clean ? (currentWordIndex = index) : null"
              >
                {{ word.text }}
              </span>
            </div>
          </div>
        </div>

        <!-- Loading indicator when speech system not ready -->
        <div v-if="!speechSystemReady" class="bg-white/20 backdrop-blur-sm p-4">
          <div class="text-center">
            <ion-spinner name="dots"></ion-spinner>
            <p class="text-sm text-brown-600 mt-1">Preparing speech recognition...</p>
          </div>
        </div>
      </div>

      <!-- Quiz Components -->
      <QuizPrompt
        :is-open="showQuizPrompt"
        :proficiency="proficiency"
        @take-quiz="handleTakeQuiz"
        @maybe-later="handleMaybeLater"
      />

      <QuizModal
        :is-open="showQuizModal"
        :questions="questions"
        @quiz-completed="handleQuizCompleted"
      />

      <QuizResultsModal
        :is-open="showQuizResults"
        :results="quizResults"
        @continue="handleQuizContinue"
        @retake="handleRetakeQuiz"
      />

      <!-- Congratulations Modal -->
      <div v-if="showCongratulations" class="congratulations-modal">
        <div class="congratulations-content">
          <div class="text-center">
            <img
              src="@/img/CapyBuddy Assets/Capybara/capybara (1).png"
              alt="CapyBuddy"
              class="w-24 h-24 mx-auto mb-4"
            />
            <h2 class="text-3xl font-bold text-green-600 mb-2">🎉 Congratulations! 🎉</h2>
            <p class="text-lg text-brown-700 mb-4">
              You finished reading "{{ story?.Title || story?.title || "the story" }}"!
            </p>
            <div class="mb-6">
              <div class="text-2xl font-bold text-green-600 mb-1">
                {{ proficiency }}% Reading Score
              </div>
              <div class="text-sm text-brown-600">
                {{ progressWords.filter((w) => w.status === "correct").length }} out of
                {{ progressWords.length }} words correct
              </div>
            </div>

            <div class="flex flex-col gap-3">
              <ion-button
                @click="
                  playClick('student');
                  readAnotherStory();
                "
                expand="block"
                class="congratulations-button primary"
              >
                <template v-slot:start>
                  <ion-icon :icon="bookOutline"></ion-icon>
                </template>
                Read Another Story
              </ion-button>

              <ion-button
                @click="
                  playClick('student');
                  goBackToSelection();
                "
                expand="block"
                fill="outline"
                class="congratulations-button secondary"
              >
                <template v-slot:start>
                  <ion-icon :icon="arrowBackOutline"></ion-icon>
                </template>
                Back to Reading Selection
              </ion-button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Sticky Microphone Button -->
    <div v-if="speechSystemReady && story" class="sticky-microphone">
      <button
        @click="
          playClick('student');
          listening ? stopReading() : startReading();
        "
        class="microphone-button"
        :class="{ listening: listening }"
      >
        <!-- Microphone Icon -->
        <svg
          v-if="!listening"
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

        <!-- Stop Icon -->
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"
          />
        </svg>
      </button>

      <!-- Status Text -->
      <p v-if="listening" class="mic-status">Tap to stop</p>
      <p v-else class="mic-status">Tap to start reading</p>
    </div>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from "vue";
import { IonPage, IonContent, IonButton, IonIcon, IonSpinner } from "@ionic/vue";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

// Audio system
const { startMusic, stopMusic, playClick, playWordFeedback } = useAudio();
import {
  arrowBackOutline,
  micOutline,
  stopOutline,
  shuffleOutline,
  bookOutline,
} from "ionicons/icons";
import { useRouter } from "vue-router";
import { loadCSV } from "../parseCSV.js";
import QuizPrompt from "../components/QuizPrompt.vue";
import QuizModal from "../components/QuizModal.vue";
import QuizResultsModal from "../components/QuizResultsModal.vue";

const router = useRouter();

// Reactive state
const stories = ref([]);
const story = ref(null);
const storyWords = ref([]);
const progressWords = ref([]);
const currentWordIndex = ref(0);
const listening = ref(false);
const proficiency = ref(0);
const wordEls = ref([]);
const storyContainer = ref(null);
const progress = ref(0);

const wordTimer = ref(null);
const showQuizPrompt = ref(false);
const showQuizModal = ref(false);
const showQuizResults = ref(false);
const showCongratulations = ref(false);
const quizResults = ref(null);
const questions = ref([]);
const readingCompleted = ref(false);

const speechSystemReady = ref(false);
const isNativePlatform = Capacitor.isNativePlatform();
let recognizer = null;
let audioContext, scriptProcessor, mediaStream;

// Navigation
const goBack = () => {
  router.push("/offline-reading-selection");
};

const backToSelection = () => {
  story.value = null;
  resetReadingState();
};

// Initialize on mount
onMounted(async () => {
  console.log("🎵 Starting reading music for OfflineReadingStories...");
  startMusic(MUSIC_TYPES.READING, 0.3);

  console.log("📖 Loading stories for offline reading...");
  stories.value = await loadCSV("/csv_offline/stories_qna_clean_titles_3x.csv");
  console.log("📖 Stories loaded:", stories.value.length);

  // Initialize speech recognition based on platform
  if (isNativePlatform) {
    console.log("📱 Mobile platform detected - using native speech recognition");
    await initNativeSpeechRecognition();
  } else {
    console.log("💻 Web platform detected - using Vosk offline recognition");
    await initVoskOfflineRecognition();
  }
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping reading music for OfflineReadingStories...");
  stopMusic();
});

// Initialize story words
const initializeStoryWords = () => {
  if (!story.value) return;

  const text =
    story.value["Story Text"] ||
    story.value["StoryText"] ||
    story.value.story_text ||
    story.value.text ||
    "";
  storyWords.value = text
    .split(/(\s+|[.,!?;:"'()])/g)
    .filter((w) => w.trim() !== "")
    .map((w) => {
      const cleanWord = w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      return cleanWord
        ? { text: w, clean: cleanWord, status: null }
        : { text: w, clean: null, status: "skip" };
    });

  progressWords.value = storyWords.value.filter((w) => w.clean !== null);
  resetReadingState();

  console.log(
    `📖 Initialized story: "${
      story.value.Title || story.value.title || "Untitled"
    }" with ${progressWords.value.length} words`
  );
};

// Reset reading state
const resetReadingState = () => {
  currentWordIndex.value = 0;
  proficiency.value = 0;
  progress.value = 0;
  readingCompleted.value = false;
  showQuizPrompt.value = false;
  showQuizModal.value = false;
  showCongratulations.value = false;
};

// Story selection
const fetchStory = () => {
  if (stories.value.length === 0) return;
  story.value = stories.value[Math.floor(Math.random() * stories.value.length)];
  initializeStoryWords();
};

const selectStory = (selectedStory) => {
  story.value = selectedStory;
  initializeStoryWords();
};

// Progress tracking
watch(
  () => storyWords.value.map((w) => w.status),
  () => {
    const total = progressWords.value.length;
    const done = progressWords.value.filter(
      (w) => w.status === "correct" || w.status === "incorrect"
    ).length;
    progress.value = total > 0 ? (done / total) * 100 : 0;
  },
  { deep: true }
);

// Auto-scroll to current word
const autoScrollToCurrent = () => {
  nextTick(() => {
    const container = storyContainer.value;
    const el = wordEls.value[currentWordIndex.value];
    if (!container || !el) return;
    const targetTop = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  });
};

watch(currentWordIndex, () => autoScrollToCurrent());

// Native speech recognition for mobile
const initNativeSpeechRecognition = async () => {
  try {
    console.log("🎤 Initializing native speech recognition for mobile");

    // Check if speech recognition is available
    const available = await SpeechRecognition.available();
    if (!available) {
      console.error("❌ Speech recognition not available on this device");
      alert("Speech recognition is not available on this device.");
      return;
    }

    // Request permissions
    const { granted } = await SpeechRecognition.requestPermissions();
    if (!granted) {
      console.error("❌ Microphone permission denied");
      alert("Microphone permission is required for reading practice.");
      return;
    }

    console.log("✅ Native speech recognition ready");
    speechSystemReady.value = true;
  } catch (error) {
    console.error("❌ Failed to initialize native speech recognition:", error);
    alert("Failed to initialize voice recognition. " + error.message);
  }
};

// Vosk offline speech recognition initialization
const initVoskOfflineRecognition = async () => {
  try {
    console.log("🎤 Initializing Vosk offline recognition for stories");

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
      throw new Error("Vosk library not available");
    }

    console.log("Vosk object:", vosk);
    console.log("Vosk methods:", Object.keys(vosk));

    // Initialize Vosk with better error handling
    console.log("🔧 Loading Vosk model...");

    // Try different model paths
    const modelPaths = [
      "/models/vosk-model-small-en-us-0.15",
      "/models/vosk-model-tl-ph-generic-0.6",
    ];

    let modelLoaded = false;
    let model = null;

    for (const modelPath of modelPaths) {
      try {
        console.log(`� Trying to load model from: ${modelPath}`);

        // Try to create model with the global vosk
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

        // Create recognizer
        try {
          console.log("Creating recognizer with model:", model);

          // Try different recognizer creation approaches
          if (model.acceptWaveform) {
            console.log("✅ Using model as recognizer (direct pattern):", model);
            recognizer = model;
          } else if (model.KaldiRecognizer) {
            console.log("✅ Using model as recognizer (vosk-browser pattern):", model);
            recognizer = model;

            try {
              console.log("Trying new model.KaldiRecognizer() with sample rate only...");
              recognizer = new model.KaldiRecognizer(16000);
              console.log(
                "✅ Created KaldiRecognizer via new model.KaldiRecognizer(16000):",
                recognizer
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
      throw new Error("Failed to load any Vosk model or create recognizer");
    }

    // Setup microphone
    console.log("🎙️ Requesting microphone access...");
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

    // Set up event listeners for speech recognition results
    console.log("🎤 Setting up Vosk event listeners...");

    recognizer.addEventListener("result", (event) => {
      try {
        const result = event.detail;
        console.log("🎤 Vosk FINAL result detail:", JSON.stringify(result));

        // Check all possible properties where text might be
        const possibleTexts = [
          result.result?.text,
          result.text,
          result.partial,
          result.hypothesis,
          result.alternatives?.[0]?.transcript,
          result.alternatives?.[0]?.text,
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
          checkWord(transcript, true);
        }
      } catch (error) {
        console.error("🎤 Error processing Vosk result:", error);
      }
    });

    // Set up partial results for interim results (if supported)
    recognizer.addEventListener("partialresult", (event) => {
      try {
        const result = event.detail;
        console.log("🎤 Vosk partial result detail:", JSON.stringify(result));

        // Check all possible properties where text might be
        const possibleTexts = [
          result.result?.partial,
          result.partial,
          result.result?.text,
          result.text,
          result.hypothesis,
          result.alternatives?.[0]?.transcript,
          result.alternatives?.[0]?.text,
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
          // Emit interim result for UI feedback
          checkWord(transcript, false);
        }
      } catch (error) {
        console.error("🎤 Error processing Vosk partial result:", error);
      }
    });

    // Add error event listener
    recognizer.addEventListener("error", (event) => {
      console.error("🎤 Vosk error event:", event);
    });

    scriptProcessor.onaudioprocess = (e) => {
      if (!listening.value || !recognizer) return;

      try {
        const inputBuffer = e.inputBuffer.getChannelData(0);

        // Check if we have audio data
        let hasAudio = false;
        for (let i = 0; i < inputBuffer.length; i++) {
          if (Math.abs(inputBuffer[i]) > 0.01) {
            hasAudio = true;
            break;
          }
        }

        if (hasAudio) {
          // Only log occasionally to avoid spam
          if (Math.random() < 0.01) {
            console.log("🎤 Processing audio data, buffer length:", inputBuffer.length);
          }

          if (recognizer.acceptWaveform) {
            recognizer.acceptWaveform(e.inputBuffer);
          } else if (recognizer.acceptWaveformFloat) {
            recognizer.acceptWaveformFloat(inputBuffer);
          } else {
            console.warn("🎤 Recognizer has no acceptWaveform method");
          }
        }
      } catch (error) {
        console.error("🎤 Error processing audio:", error);
      }
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    console.log("✅ Starting immediate word checking (no buffering delays)");
    speechSystemReady.value = true;
    console.log("✅ Vosk offline word recognition ready");
    console.log("🎯 Starting reading with Vosk offline mode");
  } catch (error) {
    console.error("🚫 Vosk word recognition initialization failed:", error);
    console.error("Error details:", error.stack);
    speechSystemReady.value = false;

    // Show user-friendly error
    alert(
      "Voice recognition is not available. You can still read the stories by clicking on words or using the navigation."
    );
  }
};

// Reading controls
const startReading = async () => {
  if (!speechSystemReady.value) {
    console.log("⏳ Speech system not ready");
    return;
  }

  listening.value = true;
  currentWordIndex.value = 0;

  // Reset all word statuses
  storyWords.value.forEach((w) => {
    if (w.clean !== null) w.status = null;
  });

  if (isNativePlatform) {
    console.log("🎯 Starting reading with native speech recognition");
    await startNativeSpeechRecognition();
  } else {
    console.log("🎯 Starting offline reading with Vosk");
  }

  nextTick(() => autoScrollToCurrent());
  startWordTimer();
};

const stopReading = async () => {
  listening.value = false;
  clearTimeout(wordTimer.value);

  if (isNativePlatform) {
    await stopNativeSpeechRecognition();
  }

  console.log("🛑 Reading stopped");
  calculateProficiency();

  // Show congratulations if story is completed
  const totalWords = progressWords.value.length;
  const completedWords = progressWords.value.filter(
    (w) => w.status === "correct" || w.status === "incorrect"
  ).length;

  if (completedWords >= totalWords * 0.8) {
    // 80% completion threshold
    setTimeout(() => {
      showCongratulations.value = true;
    }, 1000); // Small delay for better UX
  }
};

// Word timer
const startWordTimer = () => {
  clearTimeout(wordTimer.value);

  // 8 seconds timeout for offline mode (more forgiving)
  wordTimer.value = setTimeout(() => {
    if (
      currentWordIndex.value < storyWords.value.length &&
      storyWords.value[currentWordIndex.value].status === null
    ) {
      console.log(`⏰ Word timeout: ${storyWords.value[currentWordIndex.value].text}`);
      storyWords.value[currentWordIndex.value].status = "incorrect";
      moveToNextWord();
    }
  }, 8000);
};

const moveToNextWord = () => {
  currentWordIndex.value++;

  // Skip to next valid word
  while (
    currentWordIndex.value < storyWords.value.length &&
    storyWords.value[currentWordIndex.value].clean === null
  ) {
    currentWordIndex.value++;
  }

  if (currentWordIndex.value >= storyWords.value.length) {
    stopReading();
  } else {
    startWordTimer();
  }
};

watch(currentWordIndex, () => {
  autoScrollToCurrent();
});

// Word checking
const checkWord = (spokenWord, isFinal = false) => {
  if (!spokenWord || !spokenWord.trim()) return;

  const spoken = spokenWord
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim();

  // Skip to current valid word
  while (
    currentWordIndex.value < storyWords.value.length &&
    storyWords.value[currentWordIndex.value].clean === null
  ) {
    currentWordIndex.value++;
  }

  if (currentWordIndex.value >= storyWords.value.length) {
    stopReading();
    return;
  }

  const expected = storyWords.value[currentWordIndex.value].clean;
  let isMatch = false;

  // Check for word match with flexibility for young readers
  const words = spoken.split(/\s+/).filter((w) => w.length > 0);

  for (const word of words) {
    if (checkWordSimilarity(word, expected, 0.4)) {
      isMatch = true;
      break;
    }
  }

  if (isMatch) {
    console.log(`✅ MATCH: "${spoken}" → "${expected}"`);
    storyWords.value[currentWordIndex.value].status = "correct";
    clearTimeout(wordTimer.value);
    moveToNextWord();
  } else if (isFinal) {
    console.log(`❌ NO MATCH: "${spoken}" → expected "${expected}"`);
    // Don't mark as incorrect immediately, give another chance
  }
};

// Word similarity checking
const checkWordSimilarity = (spoken, expected, threshold = 0.4) => {
  if (spoken === expected) return true;
  if (spoken.length < 2 || expected.length < 2) return false;

  // Calculate similarity
  const minLength = Math.min(spoken.length, expected.length);
  const maxLength = Math.max(spoken.length, expected.length);
  let commonChars = 0;

  for (let i = 0; i < minLength; i++) {
    if (spoken[i] === expected[i]) {
      commonChars++;
    }
  }

  const similarity = commonChars / maxLength;

  // Also check if spoken contains expected or vice versa
  const containsMatch =
    spoken.includes(expected.substring(0, Math.ceil(expected.length * 0.5))) ||
    expected.includes(spoken.substring(0, Math.ceil(spoken.length * 0.5)));

  const finalSimilarity = Math.max(similarity, containsMatch ? 0.5 : 0);

  console.log(
    `Word similarity: "${spoken}" vs "${expected}" = ${(finalSimilarity * 100).toFixed(
      1
    )}%`
  );

  return finalSimilarity >= threshold;
};

// Quiz functionality
const fetchQuestions = (storyTitle) => {
  const row = stories.value.find((s) => s.Title === storyTitle);
  if (!row) return;

  questions.value = Object.keys(row)
    .filter((k) => /^Q[1-5]$/.test(k) && row[k])
    .map((qKey, i) => {
      const correctAnswer = row[`A${i + 1}`] ? String(row[`A${i + 1}`]).trim() : "";

      // Generate options (simplified for offline mode)
      const options = [correctAnswer];

      // Add some basic wrong options
      const wrongOptions = ["Yes", "No", "Maybe", "Never", "Always", "Sometimes"];
      wrongOptions.forEach((option) => {
        if (options.length < 4 && option !== correctAnswer) {
          options.push(option);
        }
      });

      // Shuffle options
      const shuffledOptions = options.sort(() => Math.random() - 0.5);

      return {
        id: i,
        title: row.Title,
        question: row[qKey],
        correctAnswer,
        options: shuffledOptions,
      };
    });
};

const calculateProficiency = () => {
  const total = progressWords.value.length;
  const correct = progressWords.value.filter((w) => w.status === "correct").length;
  proficiency.value = Math.round((correct / total) * 100);

  readingCompleted.value = true;
  fetchQuestions(story.value["Title"]);
  showQuizPrompt.value = true;
};

// Quiz handlers
const handleTakeQuiz = () => {
  showQuizPrompt.value = false;
  showQuizModal.value = true;
};

const handleMaybeLater = () => {
  showQuizPrompt.value = false;
};

const handleQuizCompleted = (results) => {
  quizResults.value = results;
  showQuizModal.value = false;
  showQuizResults.value = true;
};

const handleQuizContinue = () => {
  showQuizResults.value = false;
  backToSelection();
};

const handleRetakeQuiz = () => {
  showQuizResults.value = false;
  showQuizModal.value = true;
};

// Congratulations handlers
const readAnotherStory = () => {
  showCongratulations.value = false;
  fetchStory(); // Get a new random story
};

const goBackToSelection = () => {
  showCongratulations.value = false;
  router.push("/offline-reading-selection");
};

// Native speech recognition functions for mobile
const startNativeSpeechRecognition = async () => {
  try {
    console.log("🎤 Starting native speech recognition...");

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

    await SpeechRecognition.start({
      language: "en-US",
      maxResults: 1,
      prompt: "Say the word on screen",
      partialResults: true,
      popup: false,
    });

    // Listen for results
    SpeechRecognition.addListener("partialResults", (data) => {
      if (data.matches && data.matches.length > 0) {
        const spokenText = data.matches[0];
        console.log("🎤 Partial result:", spokenText);
        checkWord(spokenText, false);
      }
    });

    SpeechRecognition.addListener("finalResults", (data) => {
      if (data.matches && data.matches.length > 0) {
        const spokenText = data.matches[0];
        console.log("🎤 Final result:", spokenText);
        checkWord(spokenText, true);
      }
    });
  } catch (error) {
    console.error("❌ Error starting native speech recognition:", error);
    alert("Failed to start speech recognition: " + error.message);
  }
};

const stopNativeSpeechRecognition = async () => {
  try {
    await SpeechRecognition.stop();
    SpeechRecognition.removeAllListeners();
    console.log("🛑 Native speech recognition stopped");
  } catch (error) {
    console.error("❌ Error stopping native speech recognition:", error);
  }
};

// Cleanup
onBeforeUnmount(async () => {
  // Cleanup native speech recognition if on mobile
  if (isNativePlatform) {
    await stopNativeSpeechRecognition();
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

  listening.value = false;
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

.karaoke-active {
  background: linear-gradient(to right, #fbbf24 0%, #f59e0b 100%);
  color: #92400e;
  font-weight: bold;
  transform: scale(1.05);
}

.word {
  cursor: pointer;
  scroll-margin: 48px;
}

.story-select-button {
  --background: linear-gradient(135deg, #ab47bc, #9c27b0);
  --background-hover: linear-gradient(135deg, #9c27b0, #8e24aa);
  --color: white;
  --border-radius: 15px;
  --padding-top: 15px;
  --padding-bottom: 15px;
  font-weight: 600;
  font-family: "Jua", cursive;
}

.story-option-button {
  --border-color: #ab47bc;
  --color: #ab47bc;
  --border-radius: 12px;
  --padding-top: 10px;
  --padding-bottom: 10px;
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

.submit-button {
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
.bg-white\/20 {
  background-color: rgba(255, 255, 255, 0.2);
}
.bg-white\/10 {
  background-color: rgba(255, 255, 255, 0.1);
}
.bg-white\/80 {
  background-color: rgba(255, 255, 255, 0.8);
}
.bg-white\/90 {
  background-color: rgba(255, 255, 255, 0.9);
}
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Sticky Microphone Styles */
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
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #66bb6a, #4caf50);
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(102, 187, 106, 0.4);
  transition: all 0.3s ease;
}

.microphone-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(102, 187, 106, 0.5);
}

.microphone-button.listening {
  background: linear-gradient(135deg, #ffa726, #ff8a50);
  box-shadow: 0 4px 20px rgba(255, 167, 38, 0.4);
  animation: pulse-listening 2s infinite;
}

.microphone-button.listening:hover {
  box-shadow: 0 6px 25px rgba(255, 167, 38, 0.5);
}

.mic-status {
  font-size: 12px;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px 12px;
  border-radius: 12px;
  margin: 0;
  text-align: center;
  font-weight: 500;
  backdrop-filter: blur(4px);
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

/* Congratulations Modal Styles */
.congratulations-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.congratulations-content {
  background: white;
  border-radius: 20px;
  padding: 30px 20px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: congratulations-appear 0.5s ease-out;
}

.congratulations-button.primary {
  --background: linear-gradient(135deg, #66bb6a, #4caf50);
  --background-hover: linear-gradient(135deg, #4caf50, #388e3c);
  --color: white;
  --border-radius: 15px;
  --padding-top: 15px;
  --padding-bottom: 15px;
  font-weight: 600;
  font-family: "Jua", cursive;
}

.congratulations-button.secondary {
  --border-color: #6b7280;
  --color: #6b7280;
  --border-radius: 15px;
  --padding-top: 15px;
  --padding-bottom: 15px;
  font-weight: 600;
  font-family: "Jua", cursive;
}

@keyframes congratulations-appear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
