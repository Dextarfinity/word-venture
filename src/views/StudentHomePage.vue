<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Loading Screen -->
      <loading-screen :is-loading="isLoading" message="Loading your dashboard" />

      <!-- Main Container -->
      <div class="home-container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-row">
            <!-- Greeting (Left Side) -->
            <div class="greeting-section">
              <h1 class="greeting-text">Hello,</h1>
              <h1 class="greeting-name">
                {{
                  userProfile.full_name || userProfile.email?.split("@")[0] || "Student"
                }}
              </h1>
            </div>

            <!-- Right Side Actions -->
            <div class="header-actions">
              <!-- Notification Bell -->
              <notification-bell user-type="student" />

              <!-- Avatar Button -->
              <button class="avatar-button" @click="playClick('student'); navigateToProfile()">
                <img
                  :src="currentAvatar"
                  alt="User Avatar"
                  class="avatar-button-image"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Continue Section -->
          <div class="continue-section">
            <p class="continue-text">Continue</p>
          </div>

          <!-- Featured Activity Card -->
          <div class="featured-card">
            <div class="card-content">
              <div class="card-text">
                <h3 class="card-title">{{ currentReadingLevelInfo.activity }}</h3>
                <div class="stars-container">
                  <span
                    v-for="star in 5"
                    :key="star"
                    class="star"
                    :class="{
                      filled: star <= (studentStats?.current_reading_level || 1),
                      unfilled: star > (studentStats?.current_reading_level || 1),
                    }"
                  >
                    ⭐
                  </span>
                </div>
              </div>
              <div class="card-image">
                <img
                  src="@/img/CapyBuddy Assets/Home_Student/capybara (1).png"
                  alt="Capybara Character"
                  class="capybara-character"
                />
              </div>
            </div>
          </div>

          <!-- READ and STUDY Buttons -->
          <div class="action-buttons">
            <div class="action-card read-card" @click="playClick('student'); navigateToReading()">
              <div class="action-icon">
                <img
                  src="@/img/CapyBuddy Assets/Home_Student/read.png"
                  alt="Read Icon"
                  class="action-icon-image"
                />
              </div>
              <span class="action-label">READ</span>
            </div>

            <div
              class="action-card study-card"
              :class="{ locked: !isStudyUnlocked }"
              @click="playClick('student'); handleStudyClick()"
            >
              <div class="action-icon">
                <img
                  v-if="isStudyUnlocked"
                  src="@/img/CapyBuddy Assets/Home_Student/books.png"
                  alt="Study Icon"
                  class="action-icon-image"
                />
                <div v-else class="lock-icon">🔒</div>
              </div>
              <span class="action-label">{{ isStudyUnlocked ? "study" : "locked" }}</span>
              <div v-if="!isStudyUnlocked" class="unlock-requirement">
                <span class="unlock-text">Reach Independent Level</span>
              </div>
            </div>
          </div>

          <!-- Classes Section -->
          <div class="classes-section">
            <div class="section-header">
              <h4 class="section-title">Classes</h4>
            </div>

            <div v-if="enrolledClassrooms.length > 0" class="classes-grid">
              <!-- Dynamic Classroom Cards -->
              <div
                v-for="(classroom, index) in enrolledClassrooms.slice(0, 4)"
                :key="classroom.id"
                class="class-card"
                :class="getClassCardStyle(index)"
                @click="playClick('student'); navigateToClassDetail(classroom.classroom.id)"
              >
                <div class="class-content">
                  <div class="class-icon-left">
                    <img
                      src="@/img/CapyBuddy Assets/Home_Student/class (1).png"
                      alt="Class Icon"
                      class="class-left-icon"
                    />
                  </div>
                  <div class="class-info">
                    <div class="class-label">{{ classroom.classroom.name }}</div>
                    <div class="class-description">
                      {{ classroom.classroom?.teacher?.full_name || "Teacher" }}
                    </div>
                  </div>
                  <div class="class-icon">
                    <img
                      src="@/img/CapyBuddy Assets/Home_Student/right.png"
                      alt="Arrow Icon"
                      class="icon-image arrow-right"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state-classes">
              <div class="empty-state-content">
                <p class="empty-state-text">No classes joined yet</p>
                <p class="empty-state-subtext">
                  Ask your teacher for a class code to get started!
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Navigation -->
        <div class="bottom-navigation">
          <div class="nav-item active">
            <img
              src="@/img/CapyBuddy Assets/Nav_Icons/home (1).png"
              alt="Home"
              class="nav-icon"
            />
          </div>
          <div class="nav-item" @click="playClick('student'); navigateToClasses()">
            <img
              src="@/img/CapyBuddy Assets/Nav_Icons/class.png"
              alt="Classes"
              class="nav-icon"
            />
          </div>
          <div class="nav-item" @click="playClick('student'); navigateToNotifications()">
            <img
              src="@/img/CapyBuddy Assets/Nav_Icons/bell.png"
              alt="Notifications"
              class="nav-icon"
            />
          </div>
          <div class="nav-item" @click="playClick('student'); navigateToProfile()">
            <img
              src="@/img/CapyBuddy Assets/Nav_Icons/best-friend.png"
              alt="Profile"
              class="nav-icon"
            />
          </div>
        </div>
      </div>

      <!-- Profile Modal -->
      <ion-modal :is-open="isProfileModalOpen" @did-dismiss="closeProfileModal">
        <profile-modal
          :user-profile="userProfile"
          @close="closeProfileModal"
          @profile-updated="handleProfileUpdate"
        />
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonIcon, IonModal } from "@ionic/vue";
import {
  notificationsOutline,
  settingsOutline,
  chevronForwardOutline,
  homeOutline,
  schoolOutline,
  personOutline,
} from "ionicons/icons";
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAuth, useStudent } from "@/composables/services";
import { useAvatar } from "@/composables/useAvatar";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import ProfileModal from "../components/ProfileModal.vue";
import LoadingScreen from "../components/LoadingScreen.vue";
import NotificationBell from "../components/NotificationBell.vue";

const router = useRouter();

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

// Use composables for backend integration
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const {
  studentStats,
  studentProgress,
  studentAchievements,
  studentClassrooms,
  getStudentStats,
  getStudentProgress,
  getStudentAchievements,
  getStudentClassrooms,
  isLoading: studentLoading,
} = useStudent();

// Use avatar composable
const { currentAvatar, getAvatar } = useAvatar();

// Reactive state
const userProfile = computed(
  () =>
    profile.value || {
      id: null,
      full_name: "",
      email: "",
      avatar_url: null,
      user_type: "student",
    }
);

const userStats = computed(
  () =>
    studentStats.value || {
      level: 1,
      wordsRead: 0,
      streak: 0,
      accuracy: 0,
    }
);

const cvcProgress = computed(() => {
  const progress = studentProgress.value;
  if (!progress || !progress.recentActivity) return 0;
  // Calculate CVC progress from user progress data
  const cvcWords = progress.recentActivity.filter(
    (p) => p.activity_type === "word_reading" && p.completed
  ).length;
  return Math.min((cvcWords / 150) * 100, 100); // 150 CVC words target
});

const sentenceProgress = computed(() => {
  const progress = studentProgress.value;
  if (!progress || !progress.recentActivity) return 0;
  // Calculate sentence/story progress
  const storyProgress = progress.recentActivity.filter(
    (p) => p.activity_type === "story_reading" && p.completed
  ).length;
  return Math.min((storyProgress / 20) * 100, 100); // 20 stories target
});

const recentAchievements = computed(() => {
  if (!studentAchievements.value) return [];
  // Get the 3 most recent achievements
  return studentAchievements.value
    .sort((a, b) => new Date(b.unlocked_at) - new Date(a.unlocked_at))
    .slice(0, 3);
});

const currentReadingLevelInfo = computed(() => {
  const stats = studentStats.value;
  const level = stats?.current_reading_level || 1;

  const levelMap = {
    1: { name: "CVC", activity: "CVC WORDS", category: "cvc" },
    2: { name: "Frustration", activity: "PHONICS", category: "phonics_merger" },
    3: { name: "Instructional", activity: "BLENDING", category: "blending" },
    4: { name: "Independent", activity: "SILENT READING", category: "silent" },
  };

  return levelMap[level] || levelMap[1];
});

const enrolledClassrooms = computed(() => {
  return studentClassrooms.value || [];
});

const isStudyUnlocked = computed(() => {
  const level = studentStats.value?.current_reading_level || 1;
  return level >= 4; // Independent level (4) unlocks story reading
});

const isProfileModalOpen = ref(false);
const isLoading = ref(true);

// Profile modal handlers
const openProfileModal = () => {
  isProfileModalOpen.value = true;
};

const closeProfileModal = () => {
  isProfileModalOpen.value = false;
};

const handleProfileUpdate = (updatedProfile) => {
  userProfile.value = { ...userProfile.value, ...updatedProfile };
  closeProfileModal();
};

// Navigation
const navigateToReading = () => {
  playClick('student'); // 🎵 Play click sound
  router.push("/tabs/tab4"); // Navigate to word selection page
};

const navigateToStories = () => {
  playClick('student'); // 🎵 Play click sound
  if (isStudyUnlocked.value) {
    router.push("/student/stories"); // Navigate to stories selection page
  }
};

const handleStudyClick = () => {
  playClick('student'); // 🎵 Play click sound
  if (isStudyUnlocked.value) {
    navigateToStories();
  } else {
    // Optional: Show a tooltip or message about unlocking requirement
    console.log("Study feature locked. Reach Independent level to unlock.");
  }
};

const navigateToReadingExercise = (type) => {
  playClick('student'); // 🎵 Play click sound
  if (type === "cvc") {
    router.push("/tabs/tab4"); // Word Reading page (WordReadingPage.vue)
  } else if (type === "sentence") {
    router.push("/tabs/tab6"); // Sentence reading page
  }
};

const navigateToClasses = () => {
  playClick('student'); // 🎵 Play click sound
  router.push("/student/classes");
};

const navigateToClassDetail = (classId) => {
  playClick('student'); // 🎵 Play click sound
  router.push(`/student/class-detail/${classId}`);
};

const navigateToNotifications = () => {
  playClick('student'); // 🎵 Play click sound
  router.push("/student/notifications");
};

const navigateToProfile = () => {
  playClick('student'); // 🎵 Play click sound
  router.push("/student/profile");
};

// Helper function to get class card styles
const getClassCardStyle = (index) => {
  const styles = ["class-2", "class-2-blue", "class-3", "class-4"];
  return styles[index % styles.length];
};

// Data fetching using composables
const fetchAllData = async () => {
  try {
    isLoading.value = true;
    console.log("📊 Fetching student dashboard data...");

    // Initialize authentication
    await initAuth();

    if (isAuthenticated.value && profile.value) {
      console.log("✅ User authenticated, fetching student data...");

      const studentId = profile.value.id;
      console.log("👤 Student ID:", studentId);

      // Fetch student-specific data using composables
      await Promise.all([
        getStudentStats(studentId),
        getStudentProgress(studentId),
        getStudentAchievements(studentId),
        getStudentClassrooms(studentId),
      ]);

      console.log("📈 Student dashboard data loaded:", {
        stats: userStats.value,
        cvcProgress: cvcProgress.value,
        sentenceProgress: sentenceProgress.value,
        achievements: studentAchievements.value?.length || 0,
        recentAchievements: recentAchievements.value.length,
        classrooms: enrolledClassrooms.value.length,
      });
    } else {
      console.log("❌ User not authenticated, redirecting to login");
      router.push("/login");
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  // 🎵 Start lobby background music
  console.log("🎵 Starting lobby background music...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);

  await fetchAllData();
});

onBeforeUnmount(() => {
  // 🔇 Stop background music when leaving page
  console.log("🔇 Stopping lobby background music...");
  stopMusic();
});
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

/* Header Section */
.header-section {
  background: white;
  padding: 20px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* Greeting Section */
.greeting-section {
  text-align: left;
  flex-grow: 1;
}

.greeting-text {
  font-family: "Jua", cursive;
  font-size: 16px;
  color: #666;
  margin: 0;
  font-weight: normal;
}

.greeting-name {
  font-family: "Jua", cursive;
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 4px 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-button {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-button-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.greeting-subtitle {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px;
}

/* Continue Section */
.continue-section {
  margin-bottom: 15px;
}

.continue-text {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #666;
  margin: 0;
  font-weight: normal;
}

/* Featured Card */
.featured-card {
  background-image: url("@/img/background.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
}

.featured-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  z-index: 1;
}

.card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 2;
}

.card-text {
  flex: 1;
}

.card-title {
  font-family: "Jua", cursive;
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.stars-container {
  display: flex;
  gap: 4px;
}

.star {
  font-size: 16px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.star.filled {
  color: #ffd700;
}

.star.unfilled {
  color: rgba(255, 215, 0, 0.3);
}

.card-image {
  width: 80px;
  height: 80px;
}

.capybara-character {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Action Buttons (READ and STUDY) */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.action-card {
  background: #e8f5e8;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease;
  min-height: 100px;
}

.action-card:hover {
  transform: translateY(-2px);
}

.read-card {
  background: #e8f5e8;
}

.study-card {
  background: #f4e4c9;
  position: relative;
}

.study-card.locked {
  background: #e0e0e0;
  opacity: 0.6;
  cursor: not-allowed;
}

.study-card.locked:hover {
  transform: none;
}

.lock-icon {
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.unlock-requirement {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  text-align: center;
}

.unlock-text {
  font-family: "Jua", cursive;
  font-size: 10px;
  color: #666;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 6px;
  border-radius: 8px;
  display: inline-block;
}

.action-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.action-label {
  font-family: "Jua", cursive;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  text-transform: uppercase;
}

/* Classes Section */
.classes-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}

.section-title {
  font-family: "Jua", cursive;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.section-subtitle {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #666;
  margin: 0;
}

.classes-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.class-card {
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 100%;
}

.class-card:hover {
  transform: translateY(-2px);
}

.class-2 {
  background: linear-gradient(135deg, #ffa726, #ff8a50);
}

.class-2-blue {
  background: linear-gradient(135deg, #42a5f5, #478ed1);
}

.class-3 {
  background: linear-gradient(135deg, #66bb6a, #4caf50);
}

.class-4 {
  background: linear-gradient(135deg, #ab47bc, #9c27b0);
}

/* Empty State for Classes */
.empty-state-classes {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
  padding: 20px;
}

.empty-state-content {
  text-align: center;
  opacity: 0.6;
}

.empty-state-icon {
  width: 48px;
  height: 48px;
  opacity: 0.5;
  margin-bottom: 12px;
}

.empty-state-text {
  font-family: "Jua", cursive;
  font-size: 16px;
  color: #666;
  margin: 0 0 4px 0;
  font-weight: bold;
}

.empty-state-subtext {
  font-family: "Jua", cursive;
  font-size: 12px;
  color: #999;
  margin: 0;
}

.class-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.class-icon-left {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

.class-left-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.class-info {
  flex: 1;
  margin-left: 12px;
  margin-right: 12px;
}

.class-label {
  font-family: "Jua", cursive;
  font-size: 14px;
  font-weight: bold;
  color: white;
  margin-bottom: 4px;
}

.class-description {
  font-family: "Jua", cursive;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.class-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.icon-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.arrow-right {
  width: 24px;
  height: 24px;
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

.nav-item.active {
  background: #28a745;
}

.nav-item.active .nav-icon {
  opacity: 1;
}

.nav-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.nav-item:hover .nav-icon {
  opacity: 1;
}
</style>
