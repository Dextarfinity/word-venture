<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from "vue";
import { IonPage, IonContent, IonIcon, toastController } from "@ionic/vue";
import { arrowBackOutline } from "ionicons/icons";
import { useRouter } from "vue-router";
import { loadCSV } from "../parseCSV.js";
import QuizPrompt from "../components/QuizPrompt.vue";
import QuizModal from "../components/QuizModal.vue";
import QuizResultsModal from "../components/QuizResultsModal.vue";
import StudentService from "../services/studentService.js";
import { useAuth } from "@/composables/services";
import supabase from "../supabase.js";
import { analyzeStoryWords } from "../services/openai.js";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import LoadingScreen from "../components/LoadingScreen.vue";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { Capacitor } from "@capacitor/core";

// Router instance
const router = useRouter();

// Authentication
const { profile, isAuthenticated, initialize: initAuth } = useAuth();

// Audio system
const { startMusic, stopMusic, playWordFeedback, playClick } = useAudio();

const stories = ref([]);
const words = ref([]);
const isLoading = ref(true);

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

// Task assignment mode
const isTaskMode = ref(false);
const taskInfo = ref(null);

const wordTimer = ref(null); // track timeout per word
const showQuizPrompt = ref(false); // Show quiz prompt modal
const showQuizModal = ref(false); // Show actual quiz modal
const showQuizResults = ref(false); // Show quiz results modal
const quizResults = ref(null); // Store quiz results
const questions = ref([]);
const readingCompleted = ref(false); // Track if reading is completed

// � Story reading session tracking
const sessionId = ref(null); // Reading session ID from database
const storyMiscues = ref([]); // Track all miscues during reading
const totalStoryWords = ref(0); // Total words in the story
const wordsReadCorrectly = ref(0); // Words read correctly
const wordAnalysis = ref(null); // Phonics analysis of story words
const categoryProgress = ref({
  CVC: { total: 0, correct: 0 },
  Blending: { total: 0, correct: 0 },
  "Silent Letter": { total: 0, correct: 0 },
  "Phonics Merger": { total: 0, correct: 0 },
  "Sight Words": { total: 0, correct: 0 },
  Other: { total: 0, correct: 0 },
}); // Track words by category

// �🔹 Track if we're using offline fallback and connectivity
const usingOffline = ref(false);
const isOnline = ref(navigator.onLine);
const connectivityChecked = ref(false);
const speechSystemReady = ref(false);
const activeRecognitionSystem = ref(null); // Track which system is active: 'webspeech' or 'vosk'
let voskRecognizer = null;

// 🔹 Platform detection
const isNativePlatform = Capacitor.isNativePlatform();

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
  // 🎵 Start reading background music
  console.log("🎵 Starting reading background music...");
  startMusic(MUSIC_TYPES.READING, 0.3);

  stories.value = await loadCSV("/csv_offline/stories_qna_clean_titles_3x.csv");
  console.log("📖 Stories:", stories.value);

  words.value = await loadCSV("/csv_offline/updated_words_dataset.csv");
  console.log("📝 Words:", words.value);

  // Check if a specific story was selected from StoriesPage
  const selectedStoryData = sessionStorage.getItem("selectedStory");
  // Check if this is a task assignment (test mode)
  const taskAssignmentData = sessionStorage.getItem("taskAssignment");

  if (taskAssignmentData) {
    try {
      const taskAssignment = JSON.parse(taskAssignmentData);
      console.log("📋 Using task assignment mode:", taskAssignment);

      // Set reactive task mode variables
      isTaskMode.value = true;
      taskInfo.value = {
        title: taskAssignment.title,
        category: taskAssignment.category,
        assignmentId: taskAssignment.assignmentId,
      };

      // Set task mode
      window.taskMode = {
        isTest: true,
        assignmentId: taskAssignment.assignmentId,
        taskId: taskAssignment.taskId,
        title: taskAssignment.title,
        category: taskAssignment.category,
      };

      // Track test start time
      window.testStartTime = Date.now();

      // For comprehensive tests, use provided test content or fallback to random story
      if (taskAssignment.category === "comprehensive") {
        if (taskAssignment.testContent) {
          story.value = JSON.parse(taskAssignment.testContent);
          console.log("📖 Using test content from assignment");
        } else {
          // Fallback to random story for comprehensive test
          console.log(
            "📖 No test content provided, using random story for comprehensive test"
          );
          await fetchStory();
        }
      } else {
        // For other test types, fetch appropriate content
        await fetchStory();
      }

      initializeStoryWords();
      // Clear the stored assignment so it doesn't persist on page refresh
      sessionStorage.removeItem("taskAssignment");
    } catch (error) {
      console.error("❌ Error parsing task assignment:", error);
      fetchStory(); // fallback to random story
    }
  } else if (selectedStoryData) {
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
  isLoading.value = false;
});

// ✅ Initialize story words from current story
const initializeStoryWords = async () => {
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
  totalStoryWords.value = progressWords.value.length;

  // Reset reading state
  currentWordIndex.value = 0;
  proficiency.value = 0;
  readingCompleted.value = false;
  showQuizPrompt.value = false;
  showQuizModal.value = false;
  storyMiscues.value = [];
  wordsReadCorrectly.value = 0;

  // Reset category progress tracking
  categoryProgress.value = {
    CVC: { total: 0, correct: 0 },
    Blending: { total: 0, correct: 0 },
    "Silent Letter": { total: 0, correct: 0 },
    "Phonics Merger": { total: 0, correct: 0 },
    "Sight Words": { total: 0, correct: 0 },
    Other: { total: 0, correct: 0 },
  };

  console.log(
    `📖 Initialized story: "${
      story.value.Title || story.value.title || "Untitled"
    }" with ${progressWords.value.length} words`
  );

  // Analyze story words with OpenAI
  await analyzeStoryWordsAsync();

  // Create a reading session in the database
  await createReadingSession();
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

// � Analyze story words using OpenAI
const analyzeStoryWordsAsync = async () => {
  try {
    if (!story.value) {
      console.warn("No story available for analysis");
      return;
    }

    const storyText =
      story.value["Story Text"] ||
      story.value["StoryText"] ||
      story.value.story_text ||
      story.value.text ||
      "";

    if (!storyText) {
      console.warn("Story text is empty, skipping analysis");
      return;
    }

    console.log("🔍 Starting word analysis for story...");

    // Use rule-based fallback analysis (reliable and fast)
    wordAnalysis.value = await analyzeStoryWords(storyText, false);
    if (wordAnalysis.value) {
      console.log("✅ Word analysis complete:");
      console.log("📊 CVC words:", wordAnalysis.value.counts["CVC"] || 0);
      console.log("📊 Blending words:", wordAnalysis.value.counts["Blending"] || 0);
      console.log(
        "📊 Silent Letter words:",
        wordAnalysis.value.counts["Silent Letter"] || 0
      );
      console.log(
        "📊 Phonics Merger words:",
        wordAnalysis.value.counts["Phonics Merger"] || 0
      );
      console.log("📊 Sight Words:", wordAnalysis.value.counts["Sight Words"] || 0);
      console.log("📊 Other words:", wordAnalysis.value.counts["Other"] || 0);
      console.log("📊 Total words analyzed:", wordAnalysis.value.total_words || 0);
    }
  } catch (error) {
    console.error("❌ Error analyzing story words:", error);
    // Continue without analysis - don't block story loading
  }
};

// 📚 Get the phonics category for a given word
const getWordCategory = (word) => {
  if (!wordAnalysis.value || !wordAnalysis.value.categorized_words) {
    return "Other"; // Default if analysis not available
  }

  const cleanWord = word.toLowerCase().trim();

  // Check each category
  for (const [category, wordsList] of Object.entries(
    wordAnalysis.value.categorized_words
  )) {
    if (Array.isArray(wordsList) && wordsList.includes(cleanWord)) {
      return category;
    }
  }

  return "Other"; // Default if word not found in any category
};

// 📊 Save phonics progress to database
const savePhonicsProgress = async (userId) => {
  if (!wordAnalysis.value || !categoryProgress.value) {
    console.log("⚠️ No word analysis or category progress available");
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

// 🏆 Check and award achievements based on phonics progress
const checkAchievements = async (userId) => {
  try {
    console.log("🏆 Checking achievements for user:", userId);

    // Get user's phonics progress from user_phonics_progress table
    const { data: phonicsProgress, error: progressError } = await supabase
      .from("user_phonics_progress")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (progressError && progressError.code !== "PGRST116") {
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
          console.log(
            `🎉 ACHIEVEMENT UNLOCKED: ${achievement.badge_icon} ${achievement.achievement_title}`
          );
          console.log(`📝 ${achievement.achievement_description}`);
          console.log(`🎁 +${achievement.points_required || 0} points!`);
          
          // Show achievement toast
          await showAchievementToast(achievement);
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
  const overlay = document.createElement('div');
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
      <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">🏆 ${achievement.achievement_title}</div>
      <div style="font-size: 14px; opacity: 0.9;">+${achievement.points_required || 0} points earned!</div>
    </div>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #333; font-size: 18px; cursor: pointer; padding: 4px; opacity: 0.7;">✓</button>
  `;

  // Add to page
  document.body.appendChild(overlay);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.style.animation = 'slideOutUp 0.5s ease-in';
      setTimeout(() => overlay.remove(), 500);
    }
  }, 5000);
  
  // Inject the custom HTML into the toast after it's presented
  const toastElement = await toast.getElement();
  const messageElement = toastElement.querySelector('.toast-message');
  if (messageElement) {
    messageElement.innerHTML = '';
    messageElement.appendChild(container);
  }
};

// �📊 Create a reading session in the database
const createReadingSession = async () => {
  try {
    await initAuth();

    if (!isAuthenticated.value || !profile.value) {
      console.warn("Cannot create reading session: user not authenticated");
      return;
    }

    const storyNumber = story.value["Story #"] || story.value.story_number || 0;

    const { data, error } = await supabase
      .from("reading_sessions")
      .insert({
        user_id: profile.value.id,
        content_type: "story",
        content_id: storyNumber,
        words_read: 0,
        accuracy_rate: 0,
        session_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating reading session:", error);
      return;
    }

    sessionId.value = data.id;
    console.log("✅ Created reading session:", sessionId.value);
  } catch (error) {
    console.error("Failed to create reading session:", error);
  }
};

// 📝 Record a miscue (reading error) with context
const recordMiscue = async (expectedWord, spokenWord) => {
  try {
    if (!sessionId.value || !profile.value) {
      console.warn("Cannot record miscue: session or profile not available");
      return;
    }

    // Get context - a few words before and after the current word
    const contextStart = Math.max(0, currentWordIndex.value - 3);
    const contextEnd = Math.min(storyWords.value.length, currentWordIndex.value + 4);
    const contextWords = storyWords.value
      .slice(contextStart, contextEnd)
      .map((w) => w.text)
      .join("");

    // Determine miscue type
    let miscueType = "substitution"; // default
    if (!spokenWord || spokenWord.trim() === "") {
      miscueType = "omission";
    } else if (spokenWord.toLowerCase() !== expectedWord.toLowerCase()) {
      miscueType = "substitution";
    }

    const miscueData = {
      reading_session_id: sessionId.value,
      user_id: profile.value.id,
      word_position: currentWordIndex.value + 1,
      expected_word: expectedWord,
      actual_reading: spokenWord || "(skipped)",
      miscue_type: miscueType,
      is_self_corrected: false,
      meaning_maintained: false,
      context: contextWords,
    };

    // Store in local array for review
    storyMiscues.value.push({
      ...miscueData,
      context: contextWords,
    });

    // Save to database
    const { error } = await supabase.from("reading_miscues").insert(miscueData);

    if (error) {
      console.error("Error recording miscue:", error);
    } else {
      console.log("✅ Recorded miscue:", expectedWord, "→", spokenWord);
    }
  } catch (error) {
    console.error("Failed to record miscue:", error);
  }
};

// 📊 Update reading session with final statistics
const updateReadingSession = async () => {
  try {
    if (!sessionId.value) {
      console.warn("Cannot update reading session: no session ID");
      return;
    }

    const correctWords = progressWords.value.filter((w) => w.status === "correct").length;
    const totalWords = progressWords.value.length;
    const accuracyRate = totalWords > 0 ? (correctWords / totalWords) * 100 : 0;
    const completionPercentage =
      totalWords > 0 ? (wordsReadCorrectly.value / totalWords) * 100 : 0;

    const { error } = await supabase
      .from("reading_sessions")
      .update({
        words_read: wordsReadCorrectly.value,
        accuracy_rate: accuracyRate.toFixed(2),
        completion_percentage: completionPercentage.toFixed(2),
        total_miscues: storyMiscues.value.length,
        session_duration: Math.floor(
          (Date.now() - (window.testStartTime || Date.now())) / 1000
        ),
      })
      .eq("id", sessionId.value);

    if (error) {
      console.error("Error updating reading session:", error);
    } else {
      console.log("✅ Updated reading session with stats:", {
        wordsRead: wordsReadCorrectly.value,
        totalWords: totalWords,
        accuracyRate: accuracyRate.toFixed(2),
        completionPercentage: completionPercentage.toFixed(2),
        miscues: storyMiscues.value.length,
      });
    }
  } catch (error) {
    console.error("Failed to update reading session:", error);
  }
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
    console.log("🎤 Initializing native speech recognition");

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

// Web Speech API fallback
const initWebSpeechFallback = async () => {
  try {
    console.log("🎤 Initializing Web Speech API");

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("⚠️ Web Speech API not available in this browser");
      return false;
    }

    recognition.value = new SpeechRecognitionAPI();
    recognition.value.lang = "tl-PH"; // Filipino/Tagalog Philippines
    recognition.value.continuous = true;
    recognition.value.interimResults = true;

    recognition.value.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.trim().toLowerCase();
      checkWord(transcript, lastResult.isFinal);
    };

    recognition.value.onend = () => {
      // Only restart if we're still listening
      if (listening.value && currentWordIndex.value < storyWords.value.length) {
        recognition.value.start();
      }
    };

    recognition.value.onerror = (event) => {
      console.warn("⚠️ Web Speech API error:", event.error);
    };

    speechSystemReady.value = true;
    activeRecognitionSystem.value = 'webspeech';
    console.log("✅ Web Speech API initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize Web Speech API:", error);
    return false;
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
const checkWord = async (spokenWord, isFinal = false) => {
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

    // No sound for correct words in story reading

    wordsReadCorrectly.value++;

    // Track word category for phonics progress
    const category = getWordCategory(expected);
    if (categoryProgress.value[category]) {
      categoryProgress.value[category].total++;
      categoryProgress.value[category].correct++;
      console.log(`📚 Tracked ${category} word: "${expected}" (correct)`);
    }

    currentWordIndex.value++;
    startWordTimer();
  } else if (isFinal) {
    console.log(`❌ NO MATCH: "${spoken}" → expected "${expected}"`);
    storyWords.value[currentWordIndex.value].status = "incorrect";

    // 🎵 Play incorrect word sound
    playWordFeedback(false);

    // Track word category for phonics progress (incorrect attempt)
    const category = getWordCategory(expected);
    if (categoryProgress.value[category]) {
      categoryProgress.value[category].total++;
      // Don't increment correct count
      console.log(`📚 Tracked ${category} word: "${expected}" (incorrect)`);
    }

    // Record the miscue with context
    await recordMiscue(expected, spoken);

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

  // Update reading session with final statistics
  await updateReadingSession();

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

const handleQuizCompleted = async (results) => {
  console.log("📊 Quiz completed with results:", results);

  // Calculate words read (story word count)
  const wordsRead = storyWords.value.length;
  const score = results.score || 0; // Use actual number of correct answers, not percentage
  const completionTime = Date.now() - (window.testStartTime || Date.now());

  // Ensure we have a valid start time, if not set it to a reasonable default
  const timeSpentSeconds = Math.max(1, Math.round(completionTime / 1000)); // At least 1 second

  console.log(
    `📖 Words read: ${wordsRead}, Score: ${score} correct answers, Percentage: ${results.percentage}%, Time: ${timeSpentSeconds}s`
  );

  // Store results and show results modal
  quizResults.value = {
    ...results,
    wordsRead,
    score,
  };

  showQuizModal.value = false;
  showQuizResults.value = true;

  // Initialize auth for saving progress
  await initAuth();

  // Save results to database (both test mode and self-learning mode)
  if (isAuthenticated.value && profile.value) {
    try {
      const studentId = profile.value.id;

      // Convert answers object to array format for submission
      const answersArray = [];
      if (results.answers && typeof results.answers === "object") {
        // Convert Proxy object to regular object, then to array
        const answersObj = { ...results.answers };
        Object.keys(answersObj).forEach((questionIndex) => {
          const answer = answersObj[questionIndex];
          answersArray.push({
            storyNumber: 1,
            questionNumber: parseInt(questionIndex) + 1,
            userAnswer: answer.answer || answer.userAnswer || "",
            pointsEarned: answer.correct ? 1 : 0,
            responseTime: answer.responseTime || 0,
          });
        });
      }

      console.log("📝 Converted answers array:", answersArray);

      // If this is a test/assignment mode, use submitTask
      if (window.taskMode?.isTest) {
        console.log("💾 Saving test results to database...");

        // Prepare submission data for StudentService.submitTask
        const submissionData = {
          score: score,
          timeSpent: timeSpentSeconds, // Use validated time
          attempts: 1,
          wordsRead: wordsRead,
          quizResponses: answersArray,
        };

        console.log("📋 Submission data:", submissionData);

        // Submit test results using StudentService.submitTask
        const submitResult = await StudentService.submitTask(
          window.taskMode.assignmentId,
          studentId,
          submissionData
        );

        if (submitResult.success) {
          console.log("✅ Test results saved successfully");
          console.log("📊 Student progress updated with words read:", wordsRead);
        } else {
          console.error("❌ Failed to save test results:", submitResult.error);
        }
      } else {
        // Self-learning mode - save directly to user_progress
        console.log("💾 Saving self-learning story progress to database...");

        const totalQuestions = Object.keys(results.answers || {}).length;
        const maxScore = totalQuestions; // Max score is the number of questions

        // Get the latest activity_id for story reading
        let activityId = 2; // Default for self-learning story reading
        try {
          const { data: latestActivity, error: fetchError } = await supabase
            .from("user_progress")
            .select("activity_id")
            .eq("user_id", studentId)
            .eq("activity_type", "reading")
            .order("activity_id", { ascending: false })
            .limit(1)
            .single();

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

        // Save to user_progress table
        const { error } = await supabase.from("user_progress").insert({
          user_id: studentId,
          activity_type: "reading",
          activity_id: activityId, // Dynamic activity ID
          completed: true,
          score: score, // Number of correct answers
          max_score: maxScore, // Total number of questions
          time_spent: timeSpentSeconds, // Use validated time
          attempts: 1,
          completed_at: new Date().toISOString(),
        });

        if (error) {
          console.error("❌ Error saving self-learning progress:", error);
        } else {
          console.log("✅ Self-learning progress saved successfully");
          console.log(`📊 Activity ID: ${activityId}`);
          console.log(`📊 Score: ${score}/${maxScore} questions correct`);
          console.log(`📖 Words read: ${wordsRead}`);
        }
      }

      // Save phonics progress for both test mode and self-learning mode
      await savePhonicsProgress(studentId);

      // Check for achievements based on phonics progress
      await checkAchievements(studentId);
    } catch (error) {
      console.error("❌ Error saving quiz results:", error);
    }
  }
};

const handleQuizContinue = () => {
  console.log("Quiz results - Continue clicked");
  showQuizResults.value = false;

  // If this was an assignment test, navigate back to source page
  if (window.taskMode?.isTest) {
    console.log("🔙 Navigating back after completing assignment test");

    // Small delay to ensure database updates have completed
    setTimeout(() => {
      // Clear task mode
      window.taskMode = null;

      // Navigate back to previous page (ClassDetailPage or NotificationsPage)
      router.go(-1);
    }, 500); // 500ms delay
  } else {
    // Regular story mode - stay on stories page
    console.log("📖 Staying on stories page after regular reading");
  }
};

const handleRetakeQuiz = () => {
  console.log("Quiz results - Retake quiz clicked");
  showQuizResults.value = false;
  quizResults.value = null;

  // Show quiz modal again
  showQuizModal.value = true;
};

const handlePracticeMistakes = () => {
  console.log("📝 Practice mistakes clicked - navigating to story miscue review");

  // Store miscue data and session info in sessionStorage
  sessionStorage.setItem("storyMiscues", JSON.stringify(storyMiscues.value));
  sessionStorage.setItem("storySessionId", String(sessionId.value));
  sessionStorage.setItem("storyTitle", story.value.Title || story.value.title || "Story");

  // Navigate to story miscue review page
  router.push("/story-miscue-review");
};

onBeforeUnmount(() => {
  // 🔇 Stop background music when leaving page
  console.log("🔇 Stopping reading background music...");
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
      <!-- Loading Screen -->
      <loading-screen :is-loading="isLoading" message="Loading story" />

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
          <!-- Task Assignment Header -->
          <div v-if="isTaskMode" class="w-full max-w-3xl mb-4">
            <div class="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-lg shadow-sm">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span class="text-blue-800 font-semibold text-sm uppercase tracking-wide"
                  >Assignment Mode</span
                >
              </div>
              <h2 class="text-blue-900 font-bold text-lg">{{ taskInfo?.title }}</h2>
              <p class="text-blue-700 text-sm capitalize">
                {{ taskInfo?.category }} Test • Story Automatically Selected
              </p>
            </div>
          </div>

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
          :has-miscues="storyMiscues.length > 0"
          :miscue-count="storyMiscues.length"
          @close="showQuizResults = false"
          @continue="handleQuizContinue"
          @retake-quiz="handleRetakeQuiz"
          @practice-mistakes="handlePracticeMistakes"
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
