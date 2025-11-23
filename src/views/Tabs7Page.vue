<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from "vue";
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import { arrowBackOutline } from "ionicons/icons";
import { useRouter } from "vue-router";
import { loadCSV } from "../parseCSV.js";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import QuizPrompt from "../components/QuizPrompt.vue";
import QuizModal from "../components/QuizModal.vue";
import QuizResultsModal from "../components/QuizResultsModal.vue";

// Router instance
const router = useRouter();

// Audio system
const { startMusic, stopMusic, playClick, playWordFeedback } = useAudio();

const stories = ref([]);
const words = ref([]);

// ✅ Reactive state
const story = ref(null);
const storyWords = ref([]);
const progressWords = ref([]);
const currentWordIndex = ref(0);
const listening = ref(false);
const recognition = ref(null);
const proficiency = ref(0);
const wordEls = ref([]); // for auto-scroll
const storyContainer = ref(null);

const wordTimer = ref(null); // track timeout per word
const showQuizPrompt = ref(false); // Show quiz prompt modal
const showQuizModal = ref(false); // Show actual quiz modal
const showQuizResults = ref(false); // Show quiz results modal
const quizResults = ref(null); // Store quiz results
const questions = ref([]);
const readingCompleted = ref(false); // Track if reading is completed

// 🔹 Track if we're using offline fallback and connectivity
const usingOffline = ref(false);
const isOnline = ref(navigator.onLine);
const connectivityChecked = ref(false);
const speechSystemReady = ref(false);
const activeRecognitionSystem = ref(null); // Track which system is active: 'webspeech' or 'vosk'
let voskRecognizer = null;

// ✅ Check internet connectivity for 5 seconds
const checkConnectivity = async () => {
  console.log("🌐 Checking internet connectivity...");

  return new Promise((resolve) => {
    let resolved = false;

    // More reliable connectivity tests - focus on actual network requests
    const tests = [
      // Test 1: Try to fetch Google's favicon with shorter timeout
      fetch("https://www.google.com/favicon.ico", {
        mode: "no-cors",
        cache: "no-cache",
        signal: AbortSignal.timeout(2000),
      })
        .then(() => true)
        .catch(() => false),

      // Test 2: Try to fetch a different CDN resource
      fetch("https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js", {
        mode: "no-cors",
        cache: "no-cache",
        signal: AbortSignal.timeout(2000),
      })
        .then(() => true)
        .catch(() => false),

      // Test 3: navigator.onLine as backup (less reliable)
      Promise.resolve(navigator.onLine),
    ];

    // Wait for first successful test or timeout after 3 seconds (reduced from 5)
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log("🔴 Connectivity check timed out - assuming offline");
        resolve(false);
      }
    }, 3000);

    // We need ALL network tests to fail to consider offline
    // If ANY network test succeeds, we're online
    Promise.allSettled(tests)
      .then((results) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);

          // Check if any actual network request succeeded (first 2 tests)
          const networkTests = results.slice(0, 2);
          const hasNetworkConnection = networkTests.some(
            (result) => result.status === "fulfilled" && result.value === true
          );

          console.log(
            "🌐 Network test results:",
            networkTests.map((r) => (r.status === "fulfilled" ? r.value : false))
          );
          console.log(
            "🌐 navigator.onLine:",
            results[2].status === "fulfilled" ? results[2].value : false
          );
          console.log("🌐 Final decision: Online:", hasNetworkConnection);

          resolve(hasNetworkConnection);
        }
      })
      .catch(() => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log("🔴 All connectivity tests failed - assuming offline");
          resolve(false);
        }
      });
  });
};

// ✅ Load CSVs once on mount
onMounted(async () => {
  console.log("🎵 Starting reading music for Tabs7Page...");
  startMusic(MUSIC_TYPES.READING, 0.3);

  stories.value = await loadCSV("/csv_offline/stories_qna_clean_titles_3x.csv");
  console.log("📖 Stories:", stories.value);

  words.value = await loadCSV("/csv_offline/updated_words_dataset.csv");
  console.log("📝 Words:", words.value);

  // Check if a specific story was selected from StoriesPage
  const selectedStoryData = sessionStorage.getItem("selectedStory");
  if (selectedStoryData) {
    try {
      const selectedStory = JSON.parse(selectedStoryData);
      console.log("📖 Using selected story from StoriesPage:", selectedStory);
      story.value = selectedStory;
      initializeStoryWords();
      // Clear the stored story so it doesn't persist on page refresh
      sessionStorage.removeItem("selectedStory");
    } catch (error) {
      console.error("❌ Error parsing selected story:", error);
      fetchStory(); // fallback to random story
    }
  } else {
    fetchStory(); // start with a random story
  }

  // Check connectivity first, then initialize speech
  const online = await checkConnectivity();
  isOnline.value = online;
  connectivityChecked.value = true;

  console.log(
    `🌐 Connection status: ${online ? "ONLINE" : "OFFLINE"} - Will use ${
      online ? "Web Speech API" : "Vosk offline"
    } mode`
  );

  await initSpeech();
});

// ✅ Initialize story words from current story
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

  // Reset reading state
  currentWordIndex.value = 0;
  proficiency.value = 0;
  readingCompleted.value = false;
  showQuizPrompt.value = false;
  showQuizModal.value = false;

  console.log(
    `📖 Initialized story: "${
      story.value.Title || story.value.title || "Untitled"
    }" with ${progressWords.value.length} words`
  );
};

// ✅ Fetch a random story
const fetchStory = () => {
  if (stories.value.length === 0) return;

  story.value = stories.value[Math.floor(Math.random() * stories.value.length)];
  initializeStoryWords();
};

// ✅ Fetch Q&A
const fetchQuestions = (storyTitle) => {
  const row = stories.value.find((s) => s.Title === storyTitle);
  if (!row) return;

  const allAnswers = Object.keys(row)
    .filter((k) => /^A[1-5]$/.test(k) && row[k])
    .map((k) => String(row[k]).trim());

  questions.value = Object.keys(row)
    .filter((k) => /^Q[1-5]$/.test(k) && row[k])
    .map((qKey, i) => {
      const correctAnswer = row[`A${i + 1}`] ? String(row[`A${i + 1}`]).trim() : "";
      const cleanTitle = row.Title?.replace(/\s*\d+$/, "") || "";
      const questionText = row[qKey]
        ? String(row[qKey]).replace(/story\s*\d+/i, cleanTitle)
        : "";

      let incorrectPool = allAnswers.filter((ans) => ans !== correctAnswer);
      incorrectPool = incorrectPool.sort(() => 0.5 - Math.random());
      const incorrects = [...new Set(incorrectPool)].slice(0, 3);

      const options = [...incorrects, correctAnswer]
        .filter(Boolean)
        .sort(() => 0.5 - Math.random());

      return { id: i, title: row.Title, question: questionText, correctAnswer, options };
    });
};

// ✅ Progress
const progress = ref(0);
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

// ✅ Auto-scroll
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

let model, recognizer;
let audioContext, processor, stream, resultPollingInterval;

const initSpeech = async () => {
  try {
    // 🔹 Check if we've already determined connectivity status
    if (!connectivityChecked.value) {
      console.log("⏳ Waiting for connectivity check to complete...");
      return;
    }

    // 🔹 Use connectivity status to decide which mode to initialize
    if (isOnline.value && "webkitSpeechRecognition" in window) {
      console.log("🎤 Using Web Speech API (online mode)");
      usingOffline.value = false;

      recognition.value = new webkitSpeechRecognition();
      recognition.value.lang = "tl-PH"; // Filipino/Tagalog Philippines
      recognition.value.continuous = true;
      recognition.value.interimResults = true;

      recognition.value.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript.trim().toLowerCase();
        checkWord(transcript, lastResult.isFinal);
      };

      recognition.value.onend = () => {
        // Only restart if we're still listening and in online mode
        if (
          listening.value &&
          currentWordIndex.value < storyWords.value.length &&
          !usingOffline.value
        ) {
          recognition.value.start();
        }
      };

      recognition.value.onerror = (event) => {
        console.error("🚫 Web Speech API error:", event.error);
        // Only fallback to Vosk if we haven't already switched to offline mode
        if (!usingOffline.value && event.error === "network") {
          console.log("🔄 Network error detected, switching to offline mode");
          initVoskFallback();
        }
      };

      speechSystemReady.value = true;
      activeRecognitionSystem.value = 'webspeech';
      console.log("✅ Web Speech API initialized successfully");
    } else {
      // 🔹 No internet or Web Speech API not available, use Vosk
      console.log(
        `🎤 ${
          !isOnline.value ? "Offline mode detected" : "Web Speech API not available"
        }, using Vosk`
      );
      await initVoskFallback();
    }
  } catch (error) {
    console.error("🚫 Speech recognition initialization failed:", error);
    // Try offline fallback as last resort
    if (!usingOffline.value) {
      console.log("🔄 Attempting offline fallback after initialization error");
      await initVoskFallback();
    }
  }
};

const initVoskFallback = async () => {
  try {
    console.log("🎤 Initializing Vosk offline recognition");
    usingOffline.value = true;

    // Wait for Vosk to be available on window object
    let attempts = 0;
    const maxAttempts = 10;
    while (!window.vosk && attempts < maxAttempts) {
      console.log(`⏳ Waiting for Vosk library... (${attempts + 1}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    // Check if Vosk library is available
    const vosk = window.vosk || window.Vosk;
    console.log("Vosk object:", vosk);
    console.log("Vosk methods:", Object.getOwnPropertyNames(vosk));
    if (!vosk || typeof vosk !== "object") {
      throw new Error("Vosk library not loaded on window object");
    }

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
        if (vosk.createModel) {
          model = await vosk.createModel(modelPath);
        } else if (vosk.Model) {
          model = new vosk.Model(modelPath);
        } else {
          throw new Error("No valid Model constructor found in vosk library");
        }

        console.log("Model created:", model);
        console.log("Model methods:", Object.getOwnPropertyNames(model));
        console.log(
          "Model prototype methods:",
          Object.getOwnPropertyNames(Object.getPrototypeOf(model))
        );

        // Save model to window for debugging
        window.debugModel = model;
        console.log("Model saved to window.debugModel for debugging");

        // Wait for model to be ready if it's a promise
        if (model && typeof model.then === "function") {
          model = await model;
        }

        // Ensure model is ready before creating recognizer
        if (model._ready === false) {
          console.log("Waiting for model to be ready...");
          await model.ready();
        }

        // Create recognizer using the correct vosk-browser API
        try {
          console.log("Creating recognizer with model:", model);
          console.log("Model worker:", model.worker);
          console.log("Model recognizers map:", model.recognizers);

          // vosk-browser 0.0.8 uses a worker-based approach
          // The model itself IS the recognizer in vosk-browser
          recognizer = model;
          console.log("✅ Using model as recognizer (vosk-browser pattern):", recognizer);

          // Test if the model has the required methods
          if (typeof recognizer.acceptWaveform !== "function") {
            console.log("Model methods:", Object.getOwnPropertyNames(recognizer));
            console.log(
              "Model prototype methods:",
              Object.getOwnPropertyNames(Object.getPrototypeOf(recognizer))
            );
            throw new Error("Model doesn't have acceptWaveform method");
          }
        } catch (recognizerError) {
          console.warn("Direct model usage failed:", recognizerError);

          // Fallback: try the correct vosk-browser API - new model.KaldiRecognizer()
          try {
            console.log("Trying new model.KaldiRecognizer() with sample rate only...");
            recognizer = new model.KaldiRecognizer(16000);
            console.log(
              "✅ Created KaldiRecognizer via new model.KaldiRecognizer(16000):",
              recognizer
            );
          } catch (modelKaldiError) {
            console.warn("new model.KaldiRecognizer(16000) failed:", modelKaldiError);

            // Try with different parameter format
            try {
              console.log("Trying new model.KaldiRecognizer() with sample rate only...");
              recognizer = new model.KaldiRecognizer(16000);
              console.log(
                "✅ Created KaldiRecognizer via new model.KaldiRecognizer(16000):",
                recognizer
              );
            } catch (sampleRateError) {
              console.warn("new model.KaldiRecognizer(16000) failed:", sampleRateError);

              // Try without parameters
              try {
                console.log("Trying new model.KaldiRecognizer() without parameters...");
                recognizer = new model.KaldiRecognizer();
                console.log(
                  "✅ Created KaldiRecognizer via new model.KaldiRecognizer():",
                  recognizer
                );
              } catch (noParamsError) {
                console.warn(
                  "new model.KaldiRecognizer() no params failed:",
                  noParamsError
                );
                throw new Error("All recognizer creation methods failed");
              }
            }
          }
        }

        console.log("Recognizer created:", recognizer);

        modelLoaded = true;
        console.log(
          `✅ Successfully initialized recognizer with model from: ${modelPath}`
        );
        break;
      } catch (modelError) {
        console.warn(`❌ Failed to load model from ${modelPath}:`, modelError);
        console.warn("Error details:", modelError.message, modelError.stack);
      }
    }

    if (!modelLoaded) {
      throw new Error(
        "No Vosk model could be loaded. Please check the model files and vosk-browser installation."
      );
    }

    // Connect microphone
    console.log("🎙️ Requesting microphone access...");
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);

    // Use smaller buffer for more responsive word detection (like Web Speech API)
    processor = audioContext.createScriptProcessor(2048, 1, 1);
    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      if (!listening.value || !recognizer) return;

      try {
        // Debug recognizer methods on first call
        if (!recognizer._debuggedMethods) {
          console.log("Recognizer methods:", Object.getOwnPropertyNames(recognizer));
          console.log(
            "Recognizer prototype methods:",
            Object.getOwnPropertyNames(Object.getPrototypeOf(recognizer))
          );
          recognizer._debuggedMethods = true;
        }

        // Audio processing with debugging
        if (recognizer.acceptWaveform) {
          // Standard vosk-browser API - pass the audio buffer directly
          recognizer.acceptWaveform(e.inputBuffer);
          if (!recognizer._audioProcessingLogged) {
            console.log("🎤 Audio processing: using acceptWaveform with AudioBuffer");
            recognizer._audioProcessingLogged = true;
          }
        } else if (recognizer.AcceptWaveform) {
          // Alternative API format - convert to Int16Array
          const input = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            int16[i] = Math.max(-1, Math.min(1, input[i])) * 32767;
          }
          recognizer.AcceptWaveform(int16);
          if (!recognizer._audioProcessingLogged) {
            console.log("🎤 Audio processing: using AcceptWaveform with Int16Array");
            recognizer._audioProcessingLogged = true;
          }
        } else {
          if (!recognizer._audioMethodError) {
            console.error("❌ No audio processing method available on recognizer");
            recognizer._audioMethodError = true;
          }
        }
      } catch (voskError) {
        console.error("Vosk processing error:", voskError);
      }
    };

    console.log("✅ Vosk offline recognition ready");
    speechSystemReady.value = true;
    activeRecognitionSystem.value = 'vosk';

    // Set up simple event listeners (like Web Speech API)
    // Set up modern vosk-browser event listeners with detailed debugging
    recognizer.addEventListener("result", (event) => {
      console.log("🎯 Vosk FINAL result event:", event);
      console.log("🎯 Event detail:", event.detail);
      console.log("🎯 Event detail.result:", event.detail?.result);
      console.log("🎯 All detail keys:", Object.keys(event.detail || {}));

      // Try multiple possible result locations
      let resultText = null;
      if (event.detail?.result?.text) {
        resultText = event.detail.result.text;
      } else if (event.detail?.text) {
        resultText = event.detail.text;
      } else if (event.detail?.result) {
        console.log("🎯 Full result object:", event.detail.result);
        console.log("🎯 Result object keys:", Object.keys(event.detail.result || {}));
      }

      if (resultText && resultText.trim()) {
        console.log("🎯 Vosk FINAL result text:", resultText);
        checkWord(resultText.trim(), true);
      } else {
        console.log("❌ No text found in final result event");
      }
    });

    recognizer.addEventListener("partialresult", (event) => {
      const partialText = event.detail?.result?.partial;
      if (partialText && partialText.trim().length > 0) {
        console.log("🔄 Vosk PARTIAL result:", partialText);
        checkWord(partialText.trim(), false);
      } else {
        console.log("🔄 Vosk empty partial result (silence or no speech detected)");
      }
    });

    // Add manual result polling as backup (some vosk-browser versions need this)
    resultPollingInterval = setInterval(() => {
      if (!listening.value || !recognizer) {
        clearInterval(resultPollingInterval);
        return;
      }

      try {
        // Try to retrieve results manually
        if (recognizer.retrieveFinalResult) {
          const result = recognizer.retrieveFinalResult();
          if (result && result.text && result.text.trim().length > 0) {
            console.log("🎯 Manually retrieved final result:", result.text);
            checkWord(result.text.trim(), true);
          }
        }
      } catch (e) {
        // Ignore polling errors
      }
    }, 500); // Poll every 500ms

    console.log("✅ Added manual result polling as backup");
  } catch (error) {
    console.error("🚫 Vosk initialization failed:", error);
    console.error("Error stack:", error.stack);
    usingOffline.value = false;

    // Show helpful error message to user
    alert(
      `Offline speech recognition failed: ${error.message}\n\nPlease:\n1. Check your microphone permissions\n2. Ensure you have internet connection for online mode\n3. Make sure Vosk model is properly extracted in /public/models/`
    );
  }
};

// ✅ Reading controls
const startReading = () => {
  if (!speechSystemReady.value) {
    console.log("⏳ Speech system not ready yet, please wait...");
    return;
  }

  listening.value = true;
  currentWordIndex.value = 0;
  storyWords.value.forEach((w) => {
    if (w.clean !== null) w.status = null;
  });

  console.log("🎯 Starting immediate word checking (no buffering delays)");

  nextTick(() => autoScrollToCurrent());

  // Show user which mode is active
  const mode = usingOffline.value ? "Vosk offline" : "Web Speech API online";
  console.log(`🎯 Starting reading with ${mode} mode`);

  if (!usingOffline.value && recognition.value) {
    recognition.value.start();
  }
};

const stopReading = () => {
  listening.value = false;
  if (!usingOffline.value && recognition.value) recognition.value.stop();
  clearTimeout(wordTimer.value);
  console.log("🛑 Reading stopped");
  calculateProficiency();
};

// ✅ Word timer - responsive timing for all modes
const startWordTimer = () => {
  clearTimeout(wordTimer.value);

  // More responsive timing: 6 seconds for offline, 4 seconds for online
  const timeout = usingOffline.value ? 6000 : 4000;

  wordTimer.value = setTimeout(() => {
    if (
      currentWordIndex.value < storyWords.value.length &&
      storyWords.value[currentWordIndex.value].status === null
    ) {
      storyWords.value[currentWordIndex.value].status = "incorrect";
      currentWordIndex.value++;
    }
  }, timeout);
};

watch(currentWordIndex, () => {
  autoScrollToCurrent();
  startWordTimer();
});

// ✅ Enhanced word checking with better individual word processing
const checkWord = (spokenWord, isFinal = false) => {
  if (!spokenWord || !spokenWord.trim()) return;

  // Clean and normalize the spoken word
  const spoken = spokenWord
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim();

  // Skip to current valid word
  while (
    currentWordIndex.value < storyWords.value.length &&
    storyWords.value[currentWordIndex.value].clean === null
  )
    currentWordIndex.value++;

  if (currentWordIndex.value >= storyWords.value.length) {
    stopReading();
    return;
  }

  const expected = storyWords.value[currentWordIndex.value].clean;

  // For better individual word processing, treat spoken input as single word first
  let isMatch = false;
  let matchedWord = "";

  // Strategy 1: Direct single word match (most common case)
  if (!isMatch && spoken.indexOf(" ") === -1) {
    // Single word input - direct match
    const similarity = checkWordSimilarity(spoken, expected, 0.3);
    if (similarity) {
      isMatch = true;
      matchedWord = spoken;
      console.log(`✅ Single word match: "${spoken}" → "${expected}"`);
    }
  }

  // Strategy 2: If input contains spaces, split and check each word
  if (!isMatch && spoken.indexOf(" ") !== -1) {
    const words = spoken.split(/\s+/).filter((w) => w.length > 0);
    console.log(
      `🔍 Multi-word input detected: [${words.join(", ")}] for expected "${expected}"`
    );

    // Check each word individually
    words.forEach((word) => {
      if (!isMatch && word.length > 0) {
        const similarity = checkWordSimilarity(word, expected, 0.3);
        if (similarity) {
          isMatch = true;
          matchedWord = word;
          console.log(
            `✅ Individual word match: "${word}" from [${words.join(
              ", "
            )}] → "${expected}"`
          );
        }
      }
    });
  }

  // Strategy 3: Phonetic matching for difficult words (final results only)
  if (!isMatch && isFinal && usingOffline.value) {
    // Try phonetic matching on the whole spoken word first
    const phoneticMatch = checkPhoneticSimilarity(spoken, expected);
    if (phoneticMatch) {
      isMatch = true;
      matchedWord = spoken;
      console.log(`✅ Phonetic match: "${spoken}" → "${expected}"`);
    }
  }

  // Immediate action on match
  if (isMatch) {
    console.log(
      `✅ WORD RECOGNIZED: "${matchedWord}" → "${expected}" (${
        isFinal ? "final" : "partial"
      })`
    );
    storyWords.value[currentWordIndex.value].status = "correct";
    currentWordIndex.value++;
    startWordTimer();
  } else if (isFinal) {
    console.log(`❌ NO MATCH: "${spoken}" → expected "${expected}"`);
    storyWords.value[currentWordIndex.value].status = "incorrect";
    currentWordIndex.value++;
    startWordTimer();
  }

  // Skip to next valid word
  while (
    currentWordIndex.value < storyWords.value.length &&
    storyWords.value[currentWordIndex.value].clean === null
  )
    currentWordIndex.value++;

  if (currentWordIndex.value >= storyWords.value.length) stopReading();
};

// Helper function for word similarity matching
const checkWordSimilarity = (spoken, expected, threshold = 0.3) => {
  // If exact match, always accept
  if (spoken === expected) return true;

  // If too short or empty, reject
  if (spoken.length < 2 || expected.length < 2) return false;

  // Calculate similarity using multiple methods for grade 1 students

  // 1. Check if spoken word contains most of the expected word (50% of characters)
  const minLength = Math.min(spoken.length, expected.length);
  const maxLength = Math.max(spoken.length, expected.length);
  let commonChars = 0;

  for (let i = 0; i < minLength; i++) {
    if (spoken[i] === expected[i]) {
      commonChars++;
    }
  }

  const prefixSimilarity = commonChars / maxLength;

  // 2. Check for partial matches (spoken word is contained in expected or vice versa)
  const containsSimilarity =
    spoken.includes(expected.substring(0, Math.ceil(expected.length * 0.5))) ||
    expected.includes(spoken.substring(0, Math.ceil(spoken.length * 0.5)))
      ? 0.6
      : 0;

  // 3. Length similarity (for very short words)
  const lengthSimilarity =
    1 -
    Math.abs(spoken.length - expected.length) / Math.max(spoken.length, expected.length);

  // 4. Simple character overlap
  const spokenChars = new Set(spoken);
  const expectedChars = new Set(expected);
  const intersection = new Set([...spokenChars].filter((x) => expectedChars.has(x)));
  const union = new Set([...spokenChars, ...expectedChars]);
  const overlapSimilarity = intersection.size / union.size;

  // Combine similarities with weights favoring prefix matching for early readers
  const finalSimilarity =
    prefixSimilarity * 0.4 +
    containsSimilarity * 0.3 +
    lengthSimilarity * 0.15 +
    overlapSimilarity * 0.15;

  console.log(
    `Word matching: "${spoken}" vs "${expected}" = ${(finalSimilarity * 100).toFixed(
      1
    )}% (threshold: ${threshold * 100}%)`
  );

  return finalSimilarity >= threshold;
};

// 🔄 Enhanced phonetic similarity for common Vosk/Filipino mispronunciations
const checkPhoneticSimilarity = (spoken, expected) => {
  if (!spoken || !expected) return false;

  // Common Filipino/English phonetic substitutions that Vosk might make
  const phoneticRules = {
    // Vowel variations
    a: ["e", "i"],
    e: ["a", "i"],
    i: ["e", "a"],
    o: ["u"],
    u: ["o"],

    // Consonant variations common in Filipino English
    p: ["b"],
    b: ["p"],
    t: ["d"],
    d: ["t"],
    k: ["g"],
    g: ["k"],
    f: ["p"],
    v: ["b"],

    // Common Vosk recognition issues
    th: ["d", "t"],
    sh: ["s"],
    ch: ["s", "ts"],
    ng: ["n"],
  };

  // Create phonetic variations of the expected word
  const variations = [expected];

  // Generate simple phonetic alternatives
  for (const [original, replacements] of Object.entries(phoneticRules)) {
    const currentVariations = [...variations];
    currentVariations.forEach((variant) => {
      replacements.forEach((replacement) => {
        const newVariant = variant.replace(new RegExp(original, "g"), replacement);
        if (newVariant !== variant) {
          variations.push(newVariant);
        }
      });
    });
  }

  // Check if spoken word matches any phonetic variation
  return variations.some((variant) => {
    const similarity = checkWordSimilarity(spoken, variant, 0.25); // Lower threshold for phonetic
    return similarity;
  });
};

// ✅ Proficiency calculation and completion
const calculateProficiency = async () => {
  const total = progressWords.value.length;
  const correct = progressWords.value.filter((w) => w.status === "correct").length;
  proficiency.value = Math.round((correct / total) * 100);

  // Mark reading as completed and show quiz prompt
  readingCompleted.value = true;
  fetchQuestions(story.value["Title"]);
  showQuizPrompt.value = true;
};

// ✅ Quiz handling methods
const handleTakeQuiz = () => {
  showQuizPrompt.value = false;
  showQuizModal.value = true;
};

const handleMaybeLater = () => {
  showQuizPrompt.value = false;
  // Could add navigation back to stories page or other actions
  console.log("User chose to skip the quiz");
};

const handleQuizCompleted = (results) => {
  console.log("Quiz completed with results:", results);

  // Store results and show results modal
  quizResults.value = results;
  showQuizModal.value = false;
  showQuizResults.value = true;

  // Could save results to database here in the future
};

const handleQuizContinue = () => {
  console.log("Quiz results - Continue clicked");
  showQuizResults.value = false;
  // Navigate to stories page or home will be handled by the modal itself
};

const handleRetakeQuiz = () => {
  console.log("Quiz results - Retake quiz clicked");
  showQuizResults.value = false;
  quizResults.value = null;

  // Show quiz modal again
  showQuizModal.value = true;
};

onBeforeUnmount(() => {
  console.log("🔇 Stopping reading music for Tabs7Page...");
  stopMusic();

  if (recognition.value) recognition.value.stop();

  // Clean up result polling
  if (resultPollingInterval) {
    clearInterval(resultPollingInterval);
    resultPollingInterval = null;
  }

  // Clean up Vosk resources
  if (processor) {
    processor.disconnect();
    processor = null;
  }
  if (audioContext && audioContext.state !== "closed") {
    audioContext.close();
  }
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
});
</script>

<template>
  <ion-page>
    <ion-content class="relative overflow-hidden" scroll-y="false" fullscreen>
      <div class="absolute inset-0">
        <img
          src="@/img/TransparentBackground.png"
          alt="Background"
          class="w-full h-full object-cover"
        />
      </div>

      <!-- Back Button - Top Left Corner -->
      <div class="absolute top-4 left-4 z-20">
        <button
          @click="playClick('student'); router.push('/tabs/stories')"
          class="flex items-center text-orange-600 font-semibold backdrop-blur-sm px-3 py-2 rounded-full shadow-lg transition-all duration-200"
        >
          <ion-icon :icon="arrowBackOutline" class="mr-2 text-xl"></ion-icon>
          <span class="text-sm">Back</span>
        </button>
      </div>

      <div class="relative z-10 flex flex-col items-center min-h-screen p-6 pt-12">
        <!-- ✅ Story Reading -->
        <template v-if="story && !readingCompleted">
          <div class="flex justify-center w-full">
            <h1
              class="text-2xl font-bold text-indigo-900 mb-6 uppercase tracking-wide text-center"
            >
              {{ story.Title.replace(/\s*\d+$/, "") }}
            </h1>
          </div>

          <div
            ref="storyContainer"
            class="flex-1 w-full max-w-3xl bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-xl overflow-y-auto leading-relaxed text-lg text-gray-800 sm:max-h-[60vh] max-h-[70vh]"
          >
            <p
              class="flex flex-wrap gap-1 justify-center items-center text-center h-full"
            >
              <span
                v-for="(word, index) in storyWords"
                :key="index"
                :ref="(el) => (wordEls[index] = el)"
                :class="[
                  'px-1 py-0.5 rounded-md transition-colors duration-300 word',
                  word.status === 'correct'
                    ? 'text-green-600 font-bold'
                    : word.status === 'incorrect'
                    ? 'text-red-600 font-bold'
                    : index < currentWordIndex
                    ? 'text-gray-400 opacity-70'
                    : index === currentWordIndex
                    ? 'karaoke-active'
                    : 'text-gray-800',
                ]"
              >
                {{ word.text }}
              </span>
            </p>
          </div>

          <!-- Progress + Mic -->
          <div class="w-full max-w-md mt-6">
            <div class="h-3 w-full bg-gray-300 rounded-full overflow-hidden flex mb-4">
              <div
                v-for="(w, i) in progressWords"
                :key="i"
                class="h-full transition-all duration-500"
                :style="{ width: 100 / progressWords.length + '%' }"
                :class="{
                  'bg-green-600': w.status === 'correct',
                  'bg-red-500': w.status === 'incorrect',
                  'bg-gray-400': w.status === null,
                }"
              ></div>
            </div>

            <!-- ✅ Speech Mode Status Indicator -->
            <div class="flex justify-center mb-4">
              <div
                v-if="!connectivityChecked"
                class="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-blue-800 text-sm"
              >
                <div
                  class="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
                ></div>
                <span>Checking connection...</span>
              </div>
              <div
                v-else-if="!speechSystemReady"
                class="flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full text-yellow-800 text-sm"
              >
                <div class="animate-pulse w-4 h-4 bg-yellow-600 rounded-full"></div>
                <span>Preparing speech system...</span>
              </div>
              <div
                v-else
                class="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                :class="
                  usingOffline
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-green-100 text-green-800'
                "
              >
                <div
                  class="w-2 h-2 rounded-full"
                  :class="usingOffline ? 'bg-orange-600' : 'bg-green-600'"
                ></div>
                <span>{{ usingOffline ? "🔄 Offline Mode" : "🌐 Online Mode" }}</span>
              </div>
            </div>

            <div class="flex justify-center">
              <button
                @click="playClick('student'); startReading()"
                class="mic-button bg-green-700 hover:bg-green-800 transition shadow-lg flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 rounded-full"
                v-if="!listening"
              >
                <span class="text-white text-lg sm:text-xl"> Start </span>
              </button>
            </div>
          </div>
        </template>

        <!-- Quiz Prompt Modal -->
        <QuizPrompt
          :is-visible="showQuizPrompt"
          :story="story || {}"
          @take-quiz="handleTakeQuiz"
          @maybe-later="handleMaybeLater"
        />

        <!-- Quiz Modal -->
        <QuizModal
          :is-open="showQuizModal"
          :story="story || {}"
          :questions="questions"
          @close="showQuizModal = false"
          @quiz-completed="handleQuizCompleted"
        />

        <!-- Quiz Results Modal -->
        <QuizResultsModal
          :is-open="showQuizResults"
          :score="quizResults?.score || 0"
          :total-questions="quizResults?.totalQuestions || 0"
          :percentage="quizResults?.percentage || 0"
          :answers="quizResults?.answers || {}"
          @close="showQuizResults = false"
          @continue="handleQuizContinue"
          @retake-quiz="handleRetakeQuiz"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.karaoke-active {
  background: linear-gradient(to left, #facc15 50%, transparent 50%);
  background-size: 200% 100%;
  background-position: right bottom;
  color: #111827;
  font-weight: bold;
  animation: karaokeHighlight 5s linear infinite; /* ⏳ match 5s */
  box-shadow: 0 0 12px rgba(250, 204, 21, 0.7);
}

@keyframes karaokeHighlight {
  0% {
    background-position: right bottom;
  }
  100% {
    background-position: left bottom;
  }
}

.mic-button {
  width: 20vh;
  height: 6vh;
  border-radius: 50px;
}

.submit-button {
  width: 30vh;
  height: 7vh;
  border-radius: 50px;
}

.word {
  scroll-margin: 48px;
}
* {
  scroll-behavior: smooth;
}
</style>
