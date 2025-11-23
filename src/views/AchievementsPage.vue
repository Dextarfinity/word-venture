<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Main Container -->
      <div class="achievements-container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-row">
            <!-- Back Button -->
            <div class="back-button-container">
              <button
                class="back-button"
                @click="
                  playClick('student');
                  goBack();
                "
              >
                <ion-icon :icon="chevronBackOutline" class="back-icon"></ion-icon>
                <span class="back-text">Back</span>
              </button>
            </div>

            <!-- Page Title -->
            <div class="page-title-container">
              <h1 class="page-title">Achievements</h1>
            </div>

            <!-- Progress Info -->
            <div class="progress-info-container">
              <div class="current-level">{{ currentLevel }}</div>
            </div>
          </div>
        </div>

        <!-- Level Progress Section -->
        <div class="level-progress-section">
          <div class="level-card" :class="currentLevel.toLowerCase().replace('-', '')">
            <div class="level-info">
              <img
                :src="getLevelIcon(currentLevel)"
                :alt="currentLevel"
                class="level-icon"
              />
              <div class="level-details">
                <h2 class="level-name">{{ currentLevel }}</h2>
                <p class="level-description">{{ getLevelDescription(currentLevel) }}</p>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="progress-container">
              <div class="progress-stats">
                <span class="progress-text">
                  {{ currentProgress.wordsRead }} / {{ currentProgress.wordsRequired }}
                  {{ currentProgress.category }} words
                </span>
                <span class="progress-percentage">{{ progressPercentage }}%</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: progressPercentage + '%' }"
                ></div>
              </div>
              <div v-if="nextLevel" class="next-level-info">
                <span>Next: {{ nextLevel }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Level Tabs -->
        <div class="level-tabs">
          <button
            v-for="level in readingLevels"
            :key="level.name"
            class="level-tab"
            :class="{
              active: selectedTab === level.name,
              locked: !isLevelUnlocked(level.name),
              completed: isLevelCompleted(level.name),
            }"
            @click="
              playClick('student');
              selectLevel(level.name);
            "
            :disabled="!isLevelUnlocked(level.name)"
          >
            <img :src="getLevelTabIcon(level.name)" :alt="level.name" class="tab-icon" />
            <span class="tab-text">{{ level.name }}</span>
            <div v-if="!isLevelUnlocked(level.name)" class="lock-overlay">
              <ion-icon :icon="lockClosedOutline" class="lock-icon"></ion-icon>
            </div>
          </button>
        </div>

        <!-- Achievements Grid -->
        <div class="achievements-content">
          <div class="achievements-header">
            <h3 class="section-title">{{ selectedTab }} Achievements</h3>
            <div class="achievement-stats">
              <span class="unlocked-count">
                {{ getUnlockedCount(selectedTab) }} /
                {{ getTotalCount(selectedTab) }} Unlocked
              </span>
            </div>
          </div>

          <div class="achievements-grid">
            <div
              v-for="achievement in getFilteredAchievements(selectedTab)"
              :key="achievement.id"
              class="achievement-card"
              :class="{
                unlocked: isAchievementUnlocked(achievement),
                locked: !isAchievementUnlocked(achievement),
              }"
              @click="
                playClick('student');
                showAchievementDetail(achievement);
              "
            >
              <div class="achievement-icon-container">
                <img
                  :src="getAchievementIcon(achievement)"
                  :alt="achievement.name"
                  class="achievement-icon"
                />
                <div v-if="!isAchievementUnlocked(achievement)" class="lock-overlay">
                  <ion-icon :icon="lockClosedOutline" class="achievement-lock"></ion-icon>
                </div>
                <div v-if="isAchievementUnlocked(achievement)" class="unlock-badge">
                  <ion-icon
                    :icon="checkmarkCircleOutline"
                    class="unlock-check"
                  ></ion-icon>
                </div>
              </div>

              <div class="achievement-info">
                <h4 class="achievement-title">{{ achievement.name }}</h4>
                <p class="achievement-description">
                  {{ achievement.description }}
                </p>
                <div class="achievement-progress">
                  <span class="points-text">{{ achievement.points_earned }} points</span>
                  <span class="words-text">{{ achievement.words_required }} words</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="getFilteredAchievements(selectedTab).length === 0"
            class="empty-state"
          >
            <h3>No achievements yet!</h3>
            <p>
              Start reading {{ selectedTab.toLowerCase() }} words to unlock achievements.
            </p>
          </div>
        </div>
      </div>

      <!-- Bottom Navigation -->
      <div class="bottom-navigation">
        <div
          class="nav-item"
          @click="
            playClick('student');
            navigateToHome();
          "
        >
          <img
            src="@/img/CapyBuddy Assets/Nav_Icons/home (1).png"
            alt="Home"
            class="nav-icon"
          />
        </div>
        <div
          class="nav-item"
          @click="
            playClick('student');
            navigateToClasses();
          "
        >
          <img
            src="@/img/CapyBuddy Assets/Nav_Icons/class.png"
            alt="Classes"
            class="nav-icon"
          />
        </div>
        <div
          class="nav-item"
          @click="
            playClick('student');
            navigateToNotifications();
          "
        >
          <img
            src="@/img/CapyBuddy Assets/Nav_Icons/bell.png"
            alt="Notifications"
            class="nav-icon"
          />
        </div>
        <div
          class="nav-item"
          @click="
            playClick('student');
            navigateToProfile();
          "
        >
          <img
            src="@/img/CapyBuddy Assets/Nav_Icons/best-friend.png"
            alt="Profile"
            class="nav-icon"
          />
        </div>
      </div>
    </ion-content>

    <!-- Achievement Detail Modal -->
    <transition name="modal-fade" appear>
      <div
        v-if="selectedAchievement"
        class="modal-backdrop"
        @click="closeAchievementDetail"
      >
        <transition name="modal-scale" appear>
          <div v-if="selectedAchievement" class="achievement-modal" @click.stop>
            <div class="modal-header">
              <img
                :src="getAchievementIcon(selectedAchievement)"
                :alt="selectedAchievement.name"
                class="modal-achievement-icon"
              />
              <h3 class="modal-title">{{ selectedAchievement.name }}</h3>
            </div>

            <div class="modal-content">
              <p class="modal-description">
                {{ selectedAchievement.description }}
              </p>

              <div class="modal-stats">
                <div class="stat-item">
                  <span class="stat-label">Points Required:</span>
                  <span class="stat-value">{{ selectedAchievement.points_earned }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Words Required:</span>
                  <span class="stat-value">{{ selectedAchievement.words_required }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Category:</span>
                  <span class="stat-value">{{ selectedAchievement.word_category }}</span>
                </div>
              </div>

              <div class="modal-progress">
                <div class="progress-label">
                  Your Progress: {{ getUserProgress(selectedAchievement) }} /
                  {{ selectedAchievement.words_required }}
                </div>
                <div class="modal-progress-bar">
                  <div
                    class="modal-progress-fill"
                    :style="{
                      width: getUserProgressPercentage(selectedAchievement) + '%',
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button
                class="close-modal-btn"
                @click="
                  playClick('student');
                  closeAchievementDetail();
                "
              >
                Close
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import {
  chevronBackOutline,
  lockClosedOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAuth, useStudent } from "@/composables/services";
import supabase from "@/supabase.js";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const router = useRouter();

// Use composables for backend integration
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const {
  studentAchievements: backendStudentAchievements,
  studentProgress,
  getStudentAchievements,
  getStudentProgress,
  isLoading: studentLoading,
} = useStudent();

// Reactive state
const achievements = ref([]);
const earnedAchievements = ref([]); // Local ref for user's earned achievements
const userAchievements = computed(() => earnedAchievements.value || []);
const phonicsProgress = ref({}); // Local ref for phonics progress data
const userProgress = computed(() => phonicsProgress.value || {});
const currentLevel = ref("Non-Reader");
const selectedTab = ref("Non-Reader");
const selectedAchievement = ref(null);

// Reading levels configuration
const readingLevels = ref([
  {
    name: "Non-Reader",
    wordsRequired: 150,
    category: "cvc",
    description: "Master CVC words to begin your reading journey",
  },
  {
    name: "Frustration",
    wordsRequired: 150,
    category: "phonics_merger",
    description: "Conquer phonics patterns to improve your skills",
  },
  {
    name: "Instructional",
    wordsRequired: 300,
    category: "blending",
    description: "Perfect blending techniques for smooth reading",
  },
  {
    name: "Independent",
    wordsRequired: 300,
    category: "silent",
    description: "Master silent reading to unlock story comprehension",
  },
]);

// Current progress computation
const currentProgress = computed(() => {
  const level = readingLevels.value.find((l) => l.name === currentLevel.value);
  if (!level) return { wordsRead: 0, wordsRequired: 150, category: "cvc" };

  const wordsRead = userProgress.value[level.category] || 0;
  return {
    wordsRead: Math.min(wordsRead, level.wordsRequired),
    wordsRequired: level.wordsRequired,
    category: level.category,
  };
});

const progressPercentage = computed(() => {
  const { wordsRead, wordsRequired } = currentProgress.value;
  return Math.round((wordsRead / wordsRequired) * 100);
});

const nextLevel = computed(() => {
  const currentIndex = readingLevels.value.findIndex(
    (l) => l.name === currentLevel.value
  );
  if (currentIndex < readingLevels.value.length - 1) {
    return readingLevels.value[currentIndex + 1].name;
  }
  return null;
});

// Navigation functions
const goBack = () => {
  router.push("/tabs/profile");
};

const navigateToHome = () => {
  router.push("/tabs/student-home");
};

const navigateToClasses = () => {
  router.push("/tabs/classes");
};

const navigateToNotifications = () => {
  router.push("/tabs/notifications");
};

const navigateToProfile = () => {
  router.push("/tabs/profile");
};

// Level management
const selectLevel = (levelName) => {
  if (isLevelUnlocked(levelName)) {
    selectedTab.value = levelName;
  }
};

const isLevelUnlocked = (levelName) => {
  const levelIndex = readingLevels.value.findIndex((l) => l.name === levelName);

  // First level (Non-Reader) is always unlocked
  if (levelIndex === 0) return true;

  // Check if all previous levels have been completed
  for (let i = 0; i < levelIndex; i++) {
    const prevLevel = readingLevels.value[i];
    const wordsRead = userProgress.value[prevLevel.category] || 0;

    // If any previous level is not completed, this level is locked
    if (wordsRead < prevLevel.wordsRequired) {
      return false;
    }
  }

  // All previous levels are completed, unlock this level
  return true;
};

const isLevelCompleted = (levelName) => {
  const level = readingLevels.value.find((l) => l.name === levelName);
  if (!level) return false;

  const wordsRead = userProgress.value[level.category] || 0;
  return wordsRead >= level.wordsRequired;
};

// Achievement functions
const getFilteredAchievements = (levelName) => {
  return achievements.value.filter((a) => a.level_name === levelName);
};

const getUnlockedCount = (levelName) => {
  const levelAchievements = getFilteredAchievements(levelName);
  return levelAchievements.filter((a) => isAchievementUnlocked(a)).length;
};

const getTotalCount = (levelName) => {
  return getFilteredAchievements(levelName).length;
};

const isAchievementUnlocked = (achievement) => {
  // Check if the user has actually earned this achievement by looking for achievement title match
  const hasEarnedAchievement = userAchievements.value?.some(
    (ua) => ua.achievement_title === achievement.name
  );

  // Debug logging for the first few achievements
  if (achievement.id <= 5) {
    console.log(`🔎 Checking achievement ${achievement.id} (${achievement.name}):`, {
      hasEarnedAchievement,
      userAchievementsLength: userAchievements.value?.length,
      achievementName: achievement.name,
      userAchievementTitles: userAchievements.value?.map((ua) => ua.achievement_title),
    });
  }

  return hasEarnedAchievement;
};

const getUserProgress = (achievement) => {
  let progress = 0;

  if (Array.isArray(userProgress.value)) {
    // If userProgress is an array, count completed activities
    progress = userProgress.value.filter(
      (progress) =>
        progress.activity_type === "word_reading" &&
        progress.completed &&
        progress.word_category === achievement.word_category
    ).length;
  } else if (userProgress.value && typeof userProgress.value === "object") {
    // If userProgress is an object with category counts
    progress = userProgress.value[achievement.word_category] || 0;
  }

  // Cap at words_required for display (user can't have more than 100% progress shown)
  return Math.min(progress, achievement.words_required);
};

const getUserProgressPercentage = (achievement) => {
  const progress = getUserProgress(achievement);
  return Math.min(Math.round((progress / achievement.words_required) * 100), 100);
};

const showAchievementDetail = (achievement) => {
  selectedAchievement.value = achievement;
};

const closeAchievementDetail = () => {
  selectedAchievement.value = null;
};

// Handle image loading errors with fallback
const handleImageError = (event) => {
  console.error("Achievement image failed to load:", event.target.src);
  console.error("Failed element:", event.target);
  // Set fallback image
  try {
    event.target.src = new URL(
      "@/img/CapyBuddy Assets/Achievement Badges/Getting Started.png",
      import.meta.url
    ).href;
  } catch {
    event.target.src = "/img/CapyBuddy Assets/Achievement Badges/Getting Started.png";
  }
};

// Icon and description functions
const getLevelIcon = (levelName) => {
  const iconMap = {
    "Non-Reader": "../img/CapyBuddy Assets/Achievement Badges/Non-Reader.png",
    Frustration: "../img/CapyBuddy Assets/Achievement Badges/Frustration.png",
    Instructional: "../img/CapyBuddy Assets/Achievement Badges/Instructional.png",
    Independent: "../img/CapyBuddy Assets/Achievement Badges/Independent.png",
  };

  // Try Vite's asset resolution first, fallback to simple path
  try {
    const iconPath = iconMap[levelName];
    if (iconPath) {
      return new URL(iconPath, import.meta.url).href;
    }
  } catch (error) {
    console.warn("Error loading level icon with Vite, using fallback:", error);
  }

  // Fallback paths
  const fallbackMap = {
    "Non-Reader": "/img/CapyBuddy Assets/Achievement Badges/Non-Reader.png",
    Frustration: "/img/CapyBuddy Assets/Achievement Badges/Frustration.png",
    Instructional: "/img/CapyBuddy Assets/Achievement Badges/Instructional.png",
    Independent: "/img/CapyBuddy Assets/Achievement Badges/Independent.png",
  };
  return (
    fallbackMap[levelName] ||
    "/img/CapyBuddy Assets/Achievement Badges/Getting Started.png"
  );
};

const getLevelTabIcon = (levelName) => {
  const iconMap = {
    "Non-Reader": "../img/CapyBuddy Assets/Achievement Badges/Non-Reader.png",
    Frustration: "../img/CapyBuddy Assets/Achievement Badges/Frustration.png",
    Instructional: "../img/CapyBuddy Assets/Achievement Badges/Instructional.png",
    Independent: "../img/CapyBuddy Assets/Achievement Badges/Independent.png",
  };

  // Try Vite's asset resolution first, fallback to simple path
  try {
    const iconPath = iconMap[levelName];
    if (iconPath) {
      return new URL(iconPath, import.meta.url).href;
    }
  } catch (error) {
    console.warn("Error loading level tab icon with Vite, using fallback:", error);
  }

  // Fallback paths
  const fallbackMap = {
    "Non-Reader": "/img/CapyBuddy Assets/Achievement Badges/Non-Reader.png",
    Frustration: "/img/CapyBuddy Assets/Achievement Badges/Frustration.png",
    Instructional: "/img/CapyBuddy Assets/Achievement Badges/Instructional.png",
    Independent: "/img/CapyBuddy Assets/Achievement Badges/Independent.png",
  };
  return (
    fallbackMap[levelName] ||
    "/img/CapyBuddy Assets/Achievement Badges/Getting Started.png"
  );
};

const getLevelDescription = (levelName) => {
  const level = readingLevels.value.find((l) => l.name === levelName);
  return level ? level.description : "";
};

const getAchievementIcon = (achievement) => {
  if (!achievement || !achievement.badge_icon) {
    console.warn("⚠️ Achievement missing badge_icon:", achievement);
    // Import the default image dynamically
    try {
      return new URL(
        "../img/CapyBuddy Assets/Achievement Badges/Getting Started.png",
        import.meta.url
      ).href;
    } catch {
      return "/img/CapyBuddy Assets/Achievement Badges/Getting Started.png";
    }
  }

  try {
    // Map database badge_icon names to actual file names
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

    let iconFileName = achievement.badge_icon;

    // Remove .png if it exists and convert to lowercase for mapping
    const baseFileName = iconFileName.toLowerCase().replace(".png", "");
    const mappedFileName =
      iconMapping[baseFileName + ".png"] || iconMapping[iconFileName];

    if (mappedFileName) {
      iconFileName = mappedFileName;
    } else {
      // If no mapping found, try to convert kebab-case to Title Case
      iconFileName =
        achievement.badge_icon
          .replace(".png", "")
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ") + ".png";
    }

    // Try Vite's asset resolution first, fallback to simple path
    try {
      const imagePath = new URL(
        `../img/CapyBuddy Assets/Achievement Badges/${iconFileName}`,
        import.meta.url
      ).href;
      console.log(
        `🏆 Loading achievement icon: ${achievement.badge_icon} -> ${iconFileName} (${imagePath})`
      );
      return imagePath;
    } catch (urlError) {
      // Fallback for development server
      const fallbackPath = `/img/CapyBuddy Assets/Achievement Badges/${iconFileName}`;
      console.log(
        `🏆 Fallback loading achievement icon: ${achievement.badge_icon} -> ${iconFileName} (${fallbackPath})`
      );
      return fallbackPath;
    }
  } catch (error) {
    console.error("Error loading achievement icon:", error, "Achievement:", achievement);
    try {
      return new URL(
        "../img/CapyBuddy Assets/Achievement Badges/Getting Started.png",
        import.meta.url
      ).href;
    } catch {
      return "/img/CapyBuddy Assets/Achievement Badges/Getting Started.png";
    }
  }
};

// Function to check and update reading level based on progress
const checkAndUpdateReadingLevel = async () => {
  if (!profile.value?.id) return;

  try {
    console.log("🔍 Checking if user should level up...");

    // Determine what the user's level should be based on their progress
    let newLevelIndex = 0; // Start at Non-Reader

    // Check each level's completion status
    for (let i = 0; i < readingLevels.value.length; i++) {
      const level = readingLevels.value[i];
      const wordsRead = userProgress.value[level.category] || 0;

      console.log(
        `📊 Level ${level.name}: ${wordsRead}/${level.wordsRequired} ${level.category} words`
      );

      // If this level is completed, user should be at least at the next level
      if (wordsRead >= level.wordsRequired && i < readingLevels.value.length - 1) {
        newLevelIndex = i + 1;
        console.log(
          `✅ ${level.name} completed! User should be at level ${newLevelIndex + 1}`
        );
      } else {
        // User hasn't completed this level, so they should be at this level
        break;
      }
    }

    const newLevelName = readingLevels.value[newLevelIndex].name;
    const newLevelNumber = newLevelIndex + 1; // Database uses 1-4, not 0-3

    console.log(`🎯 User should be at: ${newLevelName} (level ${newLevelNumber})`);
    console.log(`📍 User is currently at: ${currentLevel.value}`);

    // Only update if the calculated level is different from current level
    if (newLevelName !== currentLevel.value) {
      console.log(
        `📈 Updating reading level from ${currentLevel.value} to ${newLevelName}...`
      );

      // Update user_stats in database
      const { error: updateError } = await supabase
        .from("user_stats")
        .update({
          current_reading_level: newLevelNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.value.id);

      if (updateError) {
        console.error("❌ Error updating reading level:", updateError);
      } else {
        // Update local state
        currentLevel.value = newLevelName;
        selectedTab.value = newLevelName;
        console.log(`🎉 Reading level updated to ${newLevelName}!`);

        // Show congratulations toast
        if (window.$toast) {
          window.$toast.success(
            `🎉 Congratulations! You've reached ${newLevelName} level!`
          );
        }
      }
    } else {
      console.log("✓ Reading level is already up to date");
    }
  } catch (error) {
    console.error("❌ Error checking/updating reading level:", error);
  }
};

// Function to fetch all available achievement types
// Data fetching functions using composables
const fetchAllAchievementData = async () => {
  try {
    console.log("🏆 Fetching all achievement data...");

    // Initialize authentication
    await initAuth();

    if (isAuthenticated.value && profile.value) {
      console.log("✅ User authenticated, fetching achievement data...");
      console.log("👤 Profile data:", profile.value);

      // Fetch user's earned achievements from user_achievements table
      const {
        data: userAchievementsData,
        error: achievementsError,
      } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", profile.value.id)
        .order("unlocked_at", { ascending: false });

      if (achievementsError) {
        console.error("Error fetching user achievements:", achievementsError);
      } else {
        // Set the user achievements to local ref
        earnedAchievements.value = userAchievementsData || [];
        console.log("🏆 User achievements loaded:", userAchievementsData?.length || 0);
        console.log("🏆 Earned achievements data:", earnedAchievements.value);
      }

      // Fetch all achievement types from the achievement_types table (150 achievements)
      const { data: achievementTypesData, error: typesError } = await supabase
        .from("achievement_types")
        .select("*")
        .order("level_name", { ascending: true })
        .order("sort_order", { ascending: true });

      if (typesError) {
        console.error("Error fetching achievement types:", typesError);
        return;
      }

      // Transform achievement_types data to match the expected format
      const allAchievements = (achievementTypesData || []).map((achievement) => ({
        id: achievement.id,
        name: achievement.achievement_title,
        description: achievement.achievement_description,
        badge_icon: achievement.badge_icon,
        level_name: achievement.level_name,
        word_category: achievement.word_category,
        words_required: achievement.words_required,
        points_earned: achievement.points_required,
      }));

      // Set all possible achievements (150 total from database)
      achievements.value = allAchievements;
      console.log("🎯 All achievement types loaded:", allAchievements?.length || 0);

      // Fetch user_phonics_progress for actual words read per category
      const { data: phonicsProgressData, error: phonicsError } = await supabase
        .from("user_phonics_progress")
        .select("*")
        .eq("user_id", profile.value.id)
        .maybeSingle();

      if (phonicsError) {
        console.error("Error fetching phonics progress:", phonicsError);
      } else if (phonicsProgressData) {
        // Update local phonicsProgress ref with actual phonics data
        phonicsProgress.value = {
          cvc: phonicsProgressData.cvc_words_read || 0,
          blending: phonicsProgressData.blending_words_read || 0,
          phonics_merger: phonicsProgressData.phonics_merger_words_read || 0,
          silent: phonicsProgressData.silent_letter_words_read || 0,
          sight_words: phonicsProgressData.sight_words_read || 0,
          other: phonicsProgressData.other_words_read || 0,
        };
        console.log("📊 Phonics progress loaded:", phonicsProgress.value);
      } else {
        console.log("📊 No phonics progress found, using defaults");
        phonicsProgress.value = {
          cvc: 0,
          blending: 0,
          phonics_merger: 0,
          silent: 0,
          sight_words: 0,
          other: 0,
        };
      }

      // Fetch user_stats to get current reading level
      const { data: userStatsData, error: statsError } = await supabase
        .from("user_stats")
        .select("current_reading_level")
        .eq("user_id", profile.value.id)
        .maybeSingle();

      if (statsError) {
        console.error("Error fetching user stats:", statsError);
      } else if (userStatsData) {
        // Map integer reading level to level name
        const levelMap = {
          1: "Non-Reader",
          2: "Frustration",
          3: "Instructional",
          4: "Independent",
        };
        currentLevel.value =
          levelMap[userStatsData.current_reading_level] || "Non-Reader";
        selectedTab.value = currentLevel.value;
        console.log("📈 Current reading level:", currentLevel.value);

        // Check if user should level up based on progress
        await checkAndUpdateReadingLevel();
      } else {
        currentLevel.value = "Non-Reader";
        selectedTab.value = currentLevel.value;
        console.log("📈 No stats found, defaulting to Non-Reader");

        // Check if user should level up based on progress
        await checkAndUpdateReadingLevel();
      }

      console.log("🎯 Achievement data loaded:", {
        totalAchievements: achievements.value?.length || 0,
        userAchievements: userAchievements.value?.length || 0,
        currentLevel: currentLevel.value,
        progressData: phonicsProgress.value,
      });

      // Debug: Log the actual userAchievements data structure
      console.log("🔍 User achievements details:", userAchievements.value);
      console.log(
        "🔍 Sample achievement titles from userAchievements:",
        userAchievements.value?.map((ua) => ua.achievement_title)
      );
      console.log(
        "🔍 Sample total achievement names:",
        achievements.value?.slice(0, 5).map((a) => ({
          id: a.id,
          name: a.name,
        }))
      );
    } else {
      console.log("❌ User not authenticated, redirecting to login");
      router.push("/login");
    }
  } catch (error) {
    console.error("Error fetching achievement data:", error);
  }
};

// Lifecycle
onMounted(async () => {
  console.log("🎵 Starting lobby music for AchievementsPage...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);

  await fetchAllAchievementData();
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby music for AchievementsPage...");
  stopMusic();
});
</script>

<style scoped>
.achievements-container {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px; /* Space for bottom navigation */
}

/* Header Section */
.header-section {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-button-container {
  flex-shrink: 0;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #ff8a50;
  font-family: "Jua", cursive;
}

.back-icon {
  font-size: 20px;
}

.back-text {
  font-size: 16px;
}

.page-title-container {
  flex: 1;
  text-align: center;
}

.page-title {
  font-family: "Jua", cursive;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.progress-info-container {
  flex-shrink: 0;
}

.current-level {
  font-family: "Jua", cursive;
  font-size: 12px;
  color: #666;
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 12px;
}

/* Level Progress Section */
.level-progress-section {
  padding: 20px;
}

.level-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.level-card.nonreader {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: #8b4513;
}

.level-card.frustration {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  color: #8b0000;
}

.level-card.instructional {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #2d5016;
}

.level-card.independent {
  background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%);
  color: #4a4a4a;
}

.level-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.level-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px;
}

.level-details h2 {
  font-family: "Jua", cursive;
  font-size: 24px;
  margin: 0 0 8px 0;
}

.level-description {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.progress-container {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: bold;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s ease;
}

.next-level-info {
  text-align: center;
  font-size: 12px;
  opacity: 0.8;
}

/* Level Tabs */
.level-tabs {
  display: flex;
  background: white;
  padding: 0;
  margin: 0 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.level-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  font-family: "Jua", cursive;
}

.level-tab.active {
  background: #e3f2fd;
  color: #1976d2;
}

.level-tab.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.level-tab.completed {
  background: #e8f5e8;
  color: #2e7d32;
}

.tab-icon {
  width: 32px;
  height: 32px;
}

.tab-text {
  font-size: 10px;
  text-align: center;
  line-height: 1.2;
}

.lock-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  padding: 8px;
}

.lock-icon {
  color: white;
  font-size: 16px;
}

/* Achievements Content */
.achievements-content {
  flex: 1;
  padding: 20px;
}

.achievements-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-family: "Jua", cursive;
  font-size: 18px;
  color: #333;
  margin: 0;
}

.achievement-stats {
  font-size: 12px;
  color: #666;
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 12px;
}

/* Achievements Grid */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.achievement-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  gap: 12px;
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.achievement-card.unlocked {
  border-left: 4px solid #4caf50;
}

.achievement-card.locked {
  opacity: 0.6;
  border-left: 4px solid #ccc;
}

.achievement-icon-container {
  position: relative;
  flex-shrink: 0;
}

.achievement-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
}

.achievement-lock {
  color: #666;
  font-size: 20px;
}

.unlock-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #4caf50;
  border-radius: 50%;
  padding: 2px;
}

.unlock-check {
  color: white;
  font-size: 16px;
}

.achievement-info {
  flex: 1;
}

.achievement-title {
  font-family: "Jua", cursive;
  font-size: 14px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #333;
}

.achievement-description {
  font-size: 12px;
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.achievement-progress {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.points-text {
  color: #ff8a50;
  font-weight: bold;
}

.words-text {
  color: #666;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state h3 {
  font-family: "Jua", cursive;
  margin: 0 0 8px 0;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* Achievement Detail Modal */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.achievement-modal {
  background: white;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 16px 16px 0 0;
  text-align: center;
}

.modal-achievement-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px;
  margin-bottom: 12px;
}

.modal-title {
  font-family: "Jua", cursive;
  font-size: 18px;
  margin: 0;
}

.modal-content {
  padding: 20px;
}

.modal-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.modal-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  font-weight: bold;
  color: #333;
}

.stat-value {
  color: #ff8a50;
  font-weight: bold;
}

.modal-progress {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
}

.progress-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.modal-progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.modal-progress-fill {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s ease;
}

.modal-footer {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #e9ecef;
}

.close-modal-btn {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: "Jua", cursive;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.close-modal-btn:hover {
  background: #5a6fd8;
}

/* Bottom Navigation */
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e9ecef;
  padding: 12px 20px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.nav-item:hover {
  background: #f8f9fa;
}

.nav-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.nav-item:hover .nav-icon {
  opacity: 1;
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

/* Responsive Design */
@media (max-width: 768px) {
  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .level-tabs {
    margin: 0 10px;
  }

  .tab-text {
    font-size: 9px;
  }

  .achievements-content {
    padding: 10px;
  }
}
</style>
