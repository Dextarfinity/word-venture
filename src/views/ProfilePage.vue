<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Loading Screen -->
      <loading-screen :is-loading="isLoading" message="Loading profile" />

      <!-- Main Container -->
      <div class="profile-container">
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
              <h1 class="page-title">Profile</h1>
            </div>

            <!-- Settings Button -->
            <div class="settings-button-container">
              <button
                class="settings-button"
                @click="
                  playClick('student');
                  navigateToSettings();
                "
              >
                <img
                  src="@/img/CapyBuddy Assets/Profile/gear.png"
                  alt="Settings"
                  class="settings-icon"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Profile Card -->
          <div class="profile-card">
            <div class="card-inner">
              <div class="profile-content">
                <div class="avatar-container">
                  <img :src="currentAvatar" alt="Student Avatar" class="profile-avatar" />
                  <div
                    class="avatar-edit-overlay"
                    @click="
                      playClick('student');
                      openAvatarModal();
                    "
                  >
                    <img
                      src="@/img/CapyBuddy Assets/Profile/pencil.png"
                      alt="Edit Avatar"
                      class="avatar-edit-icon"
                    />
                  </div>
                </div>
                <div class="profile-details">
                  <div class="student-id">{{ userProfile.user_id || "Loading..." }}</div>
                  <h2 class="profile-name">
                    {{ userProfile.full_name || "KYLENE ANGELA M. ROCALES" }}
                  </h2>
                  <p class="profile-email">
                    {{ userProfile.email || "rocales.kylene@gmail.com" }}
                  </p>
                </div>
              </div>
              <div
                class="edit-button"
                @click="
                  playClick('student');
                  openEditProfileModal();
                "
              >
                <img
                  src="@/img/CapyBuddy Assets/Profile/pencil.png"
                  alt="Edit"
                  class="edit-icon"
                />
              </div>
            </div>
          </div>

          <!-- Level Badge -->
          <div class="level-container">
            <button
              class="level-badge"
              @click="
                playClick('student');
                navigateToAchievements();
              "
            >
              <img
                src="@/img/CapyBuddy Assets/Profile/medal.png"
                alt="Medal"
                class="medal-icon"
              />
              <span class="level-text">{{ currentReadingLevel }}</span>
            </button>
          </div>

          <!-- Statistics Cards -->
          <div class="stats-container">
            <div class="stat-card stat-green">
              <div class="stat-number">{{ chartData.wordsRead }}</div>
              <div class="stat-label">WORDS READ</div>
            </div>
            <div class="stat-card stat-blue">
              <div class="stat-number">{{ chartData.avgScore }}</div>
              <div class="stat-label">AVG SCORE</div>
            </div>
            <div class="stat-card stat-orange">
              <div class="stat-number">{{ chartData.storiesRead }}</div>
              <div class="stat-label">STORIES READ</div>
            </div>
          </div>

          <!-- Monthly Progress Bar Chart -->
          <div class="chart-container">
            <!-- Filter Toggle -->
            <div class="filter-toggle-container">
              <button 
                class="filter-toggle-btn"
                :class="{ active: scoreFilter === 'all' }"
                @click="playClick('student'); scoreFilter = 'all'; loadMonthlyStatistics();"
              >
                All Activities
              </button>
              <button 
                class="filter-toggle-btn"
                :class="{ active: scoreFilter === 'assignments' }"
                @click="playClick('student'); scoreFilter = 'assignments'; loadMonthlyStatistics();"
              >
                Assignments Only
              </button>
            </div>
            
            <div class="bar-chart-header">
              <button class="month-nav-btn" @click="playClick('student'); previousMonth()">
                <ion-icon :icon="chevronBackOutline"></ion-icon>
              </button>
              <h3 class="chart-title">{{ currentMonthDisplay }}</h3>
              <button class="month-nav-btn" @click="playClick('student'); nextMonth()" :disabled="isCurrentMonth">
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
            
            <!-- No Data Message -->
            <div v-if="!monthlyData.hasData" class="no-data-container">
              <div class="no-data-icon">📊</div>
              <p class="no-data-text">No activity recorded for this month</p>
              <p class="no-data-subtext">Start reading to see your progress!</p>
            </div>
            
            <!-- Bar Chart -->
            <div v-else class="bar-chart-container">
              <!-- Grid lines with reference values -->
              <div class="chart-grid">
                <div class="grid-line-wrapper">
                  <span class="grid-label">100</span>
                  <div class="grid-line"></div>
                </div>
                <div class="grid-line-wrapper">
                  <span class="grid-label">75</span>
                  <div class="grid-line"></div>
                </div>
                <div class="grid-line-wrapper">
                  <span class="grid-label">50</span>
                  <div class="grid-line"></div>
                </div>
                <div class="grid-line-wrapper">
                  <span class="grid-label">25</span>
                  <div class="grid-line"></div>
                </div>
                <div class="grid-line-wrapper">
                  <span class="grid-label">0</span>
                  <div class="grid-line grid-line-bottom"></div>
                </div>
              </div>
              
              <div class="bar-chart" :key="`${selectedMonth.getMonth()}-${selectedMonth.getFullYear()}`">
                <!-- Words Read Bar -->
                <div class="bar-group" style="animation-delay: 0.1s">
                  <div class="bar-wrapper">
                    <div 
                      class="bar bar-green"
                      :style="{ height: getBarHeight(monthlyData.wordsRead, 'words') + '%' }"
                    >
                      <span class="bar-value">{{ monthlyData.wordsRead }}</span>
                    </div>
                  </div>
                  <div class="bar-label">Words</div>
                  <div class="bar-context">{{ monthlyData.wordsRead }} / {{ totalCounts.totalWords }}</div>
                </div>
                
                <!-- Average Score Bar -->
                <div class="bar-group" style="animation-delay: 0.2s">
                  <div class="bar-wrapper">
                    <div 
                      class="bar bar-blue"
                      :style="{ height: getBarHeight(monthlyData.avgScore, 'score') + '%' }"
                    >
                      <span class="bar-value">{{ monthlyData.avgScore }}%</span>
                    </div>
                  </div>
                  <div class="bar-label">Performance</div>
                  <div class="bar-context">{{ scoreContextLabel }}</div>
                </div>
                
                <!-- Stories Read Bar -->
                <div class="bar-group" style="animation-delay: 0.3s">
                  <div class="bar-wrapper">
                    <div 
                      class="bar bar-orange"
                      :style="{ height: getBarHeight(monthlyData.storiesRead, 'stories') + '%' }"
                    >
                      <span class="bar-value">{{ monthlyData.storiesRead }}</span>
                    </div>
                  </div>
                  <div class="bar-label">Stories</div>
                  <div class="bar-context">{{ monthlyData.storiesRead }} / {{ totalCounts.totalStories }}</div>
                </div>
              </div>
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
          <div class="nav-item active">
            <img
              src="@/img/CapyBuddy Assets/Nav_Icons/best-friend.png"
              alt="Profile"
              class="nav-icon"
            />
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Edit Profile Modal -->
    <transition name="modal-fade" appear>
      <div v-if="isEditModalOpen" class="modal-backdrop" @click="closeEditModal">
        <transition name="modal-scale" appear>
          <div v-if="isEditModalOpen" class="edit-modal-container" @click.stop>
            <div class="edit-modal-header">
              <h3>EDIT PROFILE - STUDENT</h3>
            </div>
            <div class="edit-modal-content">
              <div class="form-group">
                <label>Full Name</label>
                <input v-model="editForm.fullName" type="text" class="form-input" />
              </div>
              <div class="form-group">
                <label>Student ID</label>
                <input
                  v-model="editForm.studentId"
                  type="text"
                  class="form-input form-input-disabled"
                  disabled
                />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input
                  v-model="editForm.email"
                  type="email"
                  class="form-input form-input-disabled"
                  disabled
                />
              </div>
              <div class="modal-buttons">
                <button
                  class="cancel-btn"
                  @click="
                    playClick('student');
                    closeEditModal();
                  "
                >
                  CANCEL
                </button>
                <button
                  class="save-btn"
                  @click="
                    playClick('student');
                    saveProfile();
                  "
                >
                  SAVE
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Avatar Selection Modal -->
    <transition name="modal-fade" appear>
      <div v-if="isAvatarModalOpen" class="modal-backdrop" @click="closeAvatarModal">
        <transition name="modal-scale" appear>
          <div v-if="isAvatarModalOpen" class="avatar-modal-container" @click.stop>
            <div class="avatar-modal-header">
              <h3>CHOOSE AN AVATAR</h3>
            </div>
            <div class="avatar-modal-content">
              <div class="avatars-grid">
                <div
                  v-for="avatar in availableAvatars"
                  :key="avatar.name"
                  class="avatar-option"
                  :class="{ selected: selectedAvatar === avatar.path }"
                  @click="
                    playClick('student');
                    selectAvatar(avatar.path);
                  "
                >
                  <img :src="avatar.path" :alt="avatar.name" class="avatar-option-img" />
                </div>
              </div>
              <div class="avatar-modal-buttons">
                <button
                  class="save-avatar-btn"
                  @click="
                    playClick('student');
                    saveAvatar();
                  "
                >
                  SAVE
                </button>
              </div>
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
  chevronForwardOutline,
  settingsOutline,
  pencilOutline,
  homeOutline,
  schoolOutline,
  notificationsOutline,
  personOutline,
} from "ionicons/icons";
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAuth, useStudent } from "@/composables/services";
import { useAvatar } from "@/composables/useAvatar";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import LoadingScreen from "../components/LoadingScreen.vue";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const router = useRouter();
const {
  profile,
  isAuthenticated,
  updateProfile,
  logout: authLogout,
  initialize: initAuth,
} = useAuth();
const {
  studentProgress,
  studentStats,
  getStudentStats,
  getStudentProgress,
  getStudentProfileStats,
  getMonthlyProfileStats,
  getTotalCounts,
  error: studentError,
} = useStudent();

// Chart data - will be updated with real database values
const chartData = ref({
  wordsRead: 0,
  avgScore: 0,
  storiesRead: 0,
});

// Score filter: 'all' or 'assignments'
const scoreFilter = ref('all');

// Monthly data and navigation
const selectedMonth = ref(new Date());
const monthlyData = ref({
  wordsRead: 0,
  avgScore: 0,
  storiesRead: 0,
  hasData: false,
});

// Total counts from database
const totalCounts = ref({
  totalWords: 0,
  totalStories: 0,
});

// Computed property for current month display
const currentMonthDisplay = computed(() => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[selectedMonth.value.getMonth()]} ${selectedMonth.value.getFullYear()}`;
});

// Check if selected month is current month
const isCurrentMonth = computed(() => {
  const now = new Date();
  return selectedMonth.value.getMonth() === now.getMonth() && 
         selectedMonth.value.getFullYear() === now.getFullYear();
});

// Computed property for score context label based on filter
const scoreContextLabel = computed(() => {
  return scoreFilter.value === 'all' ? 'All Activities' : 'Assignments Only';
});

// Get maximum value for bar height scaling with different scales per metric
const getBarHeight = (value, type) => {
  if (!value || value === 0) return 2; // Minimum height for empty bars (very small)
  
  let maxValue;
  let percentage;
  
  switch(type) {
    case 'words':
      // Words: compare to total available words in database
      maxValue = totalCounts.value.totalWords || 100;
      percentage = (value / maxValue) * 100;
      break;
    case 'score':
      // Score: already a percentage (0-100)
      percentage = value;
      break;
    case 'stories':
      // Stories: compare to total available stories in database
      maxValue = totalCounts.value.totalStories || 20;
      percentage = (value / maxValue) * 100;
      break;
    default:
      percentage = 50;
  }
  
  // Ensure very small minimum for visibility and cap at 100%
  return Math.min(Math.max(percentage, 2), 100);
};

// Navigate to previous month
const previousMonth = () => {
  const newDate = new Date(selectedMonth.value);
  newDate.setMonth(newDate.getMonth() - 1);
  selectedMonth.value = newDate;
  loadMonthlyStatistics();
};

// Navigate to next month
const nextMonth = () => {
  if (!isCurrentMonth.value) {
    const newDate = new Date(selectedMonth.value);
    newDate.setMonth(newDate.getMonth() + 1);
    selectedMonth.value = newDate;
    loadMonthlyStatistics();
  }
};

// Load monthly statistics from database
const loadMonthlyStatistics = async () => {
  try {
    if (!profile.value?.id) {
      console.log("No user ID available for monthly statistics");
      return;
    }

    const year = selectedMonth.value.getFullYear();
    const month = selectedMonth.value.getMonth() + 1; // JavaScript months are 0-indexed

    console.log(`Loading statistics for ${currentMonthDisplay.value} with filter: ${scoreFilter.value}...`);

    // Fetch month-specific statistics from database with filter
    const stats = await getMonthlyProfileStats(profile.value.id, year, month, scoreFilter.value);

    if (stats) {
      monthlyData.value = {
        wordsRead: stats.wordsRead || 0,
        avgScore: stats.avgScore || 0,
        storiesRead: stats.storiesRead || 0,
        hasData: stats.hasData || false,
      };
      console.log("✅ Monthly statistics loaded:", monthlyData.value);
    } else {
      monthlyData.value = {
        wordsRead: 0,
        avgScore: 0,
        storiesRead: 0,
        hasData: false,
      };
    }
  } catch (error) {
    console.error("Error loading monthly statistics:", error);
    monthlyData.value = {
      wordsRead: 0,
      avgScore: 0,
      storiesRead: 0,
      hasData: false,
    };
  }
};

// Check if statistics have any data
const hasStatistics = computed(() => {
  return (
    chartData.value.wordsRead > 0 ||
    chartData.value.avgScore > 0 ||
    chartData.value.storiesRead > 0
  );
});

// Reactive state using composables
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

// Computed property for reading level based on studentStats
const currentReadingLevel = computed(() => {
  const level = studentStats.value?.current_reading_level || 1;

  const levelMap = {
    1: "NON-READER",
    2: "FRUSTRATION",
    3: "INSTRUCTIONAL",
    4: "INDEPENDENT",
  };

  return levelMap[level] || "NON-READER";
});

// Modal states
const isLoading = ref(true);
const isEditModalOpen = ref(false);
const isAvatarModalOpen = ref(false);

// Use avatar composable
const { currentAvatar, setAvatar, getAvatar } = useAvatar();

// Avatar data
const bearAvatar = new URL(
  "../img/CapyBuddy Assets/Profile/Avatar_Student/bear.png",
  import.meta.url
).href;
const catAvatar = new URL(
  "../img/CapyBuddy Assets/Profile/Avatar_Student/cat.png",
  import.meta.url
).href;
const chickenAvatar = new URL(
  "../img/CapyBuddy Assets/Profile/Avatar_Student/chicken.png",
  import.meta.url
).href;
const rabbitAvatar = new URL(
  "../img/CapyBuddy Assets/Profile/Avatar_Student/rabbit.png",
  import.meta.url
).href;

const selectedAvatar = ref(bearAvatar);
const availableAvatars = ref([
  { name: "Bear", path: bearAvatar },
  { name: "Cat", path: catAvatar },
  { name: "Chicken", path: chickenAvatar },
  { name: "Rabbit", path: rabbitAvatar },
]);

// Edit form data
const editForm = ref({
  fullName: "",
  studentId: "",
  email: "",
});

// Navigation functions
const goBack = () => {
  router.go(-1);
};

const navigateToHome = () => {
  router.push("/student/student-home");
};

const navigateToClasses = () => {
  router.push("/student/classes");
};

const navigateToNotifications = () => {
  router.push("/student/notifications");
};

const navigateToSettings = () => {
  router.push("/student/settings");
};

const logout = async () => {
  try {
    console.log("Logging out...");
    const result = await authLogout();
    if (result.success) {
      router.push("/login");
    } else {
      console.error("Logout failed:", result.error);
    }
  } catch (error) {
    console.error("Logout error:", error);
  }
};

const navigateToAchievements = () => {
  router.push("/student/achievements");
};

// Modal functions
const openEditProfileModal = () => {
  editForm.value.fullName = userProfile.value.full_name || "KYLENE ANGELA M. ROCALES";
  editForm.value.email = userProfile.value.email || "rocales.kylene@gmail.com";
  editForm.value.studentId = userProfile.value.user_id || "";
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
};

const openAvatarModal = () => {
  isAvatarModalOpen.value = true;
};

const closeAvatarModal = () => {
  isAvatarModalOpen.value = false;
};

const selectAvatar = (avatarPath) => {
  selectedAvatar.value = avatarPath;
};

const saveAvatar = () => {
  // Save to localStorage via composable
  if (selectedAvatar.value) {
    setAvatar(selectedAvatar.value);
    console.log("✅ Avatar saved:", selectedAvatar.value);
  }
  closeAvatarModal();
};

const saveProfile = async () => {
  try {
    const result = await updateProfile({
      full_name: editForm.value.fullName,
      email: editForm.value.email,
    });

    if (result.success) {
      console.log("✅ Profile updated successfully");
      closeEditModal();
    } else {
      console.error("❌ Failed to update profile:", result.error);
      // You could show an error message here
    }
  } catch (error) {
    console.error("Error updating profile:", error);
  }
};

// Function to load total counts from database
const loadTotalCounts = async () => {
  try {
    console.log("Loading total counts from database...");
    const counts = await getTotalCounts();
    
    if (counts) {
      totalCounts.value = {
        totalWords: counts.totalWords || 0,
        totalStories: counts.totalStories || 0,
      };
      console.log("✅ Total counts loaded:", totalCounts.value);
    }
  } catch (error) {
    console.error("Error loading total counts:", error);
  }
};

// Function to load real statistics from database
const loadProfileStatistics = async () => {
  try {
    if (!profile.value?.id) {
      console.log("No user ID available for statistics");
      return;
    }

    console.log("Loading profile statistics for user:", profile.value.id);

    // Fetch real statistics from database using UUID id (not user_id)
    const stats = await getStudentProfileStats(profile.value.id);

    if (stats) {
      chartData.value = {
        wordsRead: stats.wordsRead || 0,
        avgScore: stats.avgScore || 0,
        storiesRead: stats.storiesRead || 0,
      };
      
      // Load monthly statistics for current month
      await loadMonthlyStatistics();
      
      console.log("✅ Profile statistics loaded:", chartData.value);
    } else {
      console.warn("⚠️ No statistics returned, using defaults");
    }
  } catch (error) {
    console.error("Error loading profile statistics:", error);
  }
};

// Lifecycle
onMounted(async () => {
  console.log("🎵 Starting lobby music for ProfilePage...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);

  try {
    console.log("🔧 Initializing profile page...");

    // Initialize authentication
    await initAuth();

    if (isAuthenticated.value && profile.value) {
      console.log("✅ User authenticated, profile loaded");
      console.log("👤 User profile:", profile.value);

      // Only update reading level and load statistics if we have a valid profile with id
      if (profile.value.id) {
        await Promise.all([
          getStudentStats(profile.value.id),
          getStudentProgress(profile.value.id),
          loadTotalCounts(),
          loadProfileStatistics(),
        ]);
        console.log("📊 Student stats loaded:", studentStats.value);
        console.log("📊 Current reading level:", currentReadingLevel.value);
      } else {
        console.warn("⚠️ Profile loaded but no id found");
      }
    } else {
      console.log("❌ User not authenticated, redirecting to login");
      router.push("/login");
    }
  } catch (error) {
    console.error("Error initializing profile:", error);
    // Don't redirect on error, user might still be loading
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby music for ProfilePage...");
  stopMusic();
});
</script>

<style scoped>
.profile-container {
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
  font-weight: normal;
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

.settings-button-container {
  flex-shrink: 0;
}

.settings-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #ff8a50;
}

.settings-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px;
  padding-bottom: 80px; /* Space for sticky navbar */
}

/* Profile Card */
.profile-card {
  background: linear-gradient(135deg, #ffa726, #ff8a50);
  border-radius: 16px;
  padding: 6px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.card-inner {
  background: white;
  border-radius: 12px;
  padding: 16px;
  position: relative;
  min-height: 80px;
}

.profile-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-right: 40px; /* Space for edit button */
}

.avatar-container {
  flex-shrink: 0;
  position: relative;
}

.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-edit-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 8px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  opacity: 0;
}

.avatar-container:hover .avatar-edit-overlay {
  opacity: 1;
}

.avatar-edit-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.profile-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-id {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #999;
  font-weight: normal;
  order: 1;
}

.edit-button {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.edit-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.profile-name {
  font-family: "Jua", cursive;
  font-size: 14px;
  font-weight: bold;
  margin: 0 0 4px 0;
  color: #333;
}

.profile-email {
  font-family: "Jua", cursive;
  font-size: 14px;
  margin: 0;
  color: #ff8a50;
  font-weight: normal;
}

/* Level Badge */
.level-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.level-badge {
  background: #ffd700;
  border-radius: 25px;
  padding: 10px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.level-badge:hover {
  background: #ffed4a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.medal-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.level-text {
  font-family: "Jua", cursive;
  font-size: 16px;
  font-weight: bold;
  color: #8b4513;
  margin: 0;
}

/* Statistics Cards */
.stats-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 32px;
}

.stat-card {
  border-radius: 16px;
  padding: 20px 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-green {
  background: #88c999;
  color: #2d5016;
}

.stat-blue {
  background: #a8d8ea;
  color: #1e3a8a;
}

.stat-orange {
  background: #deb887;
  color: #8b4513;
}

.stat-number {
  font-family: "Jua", cursive;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-family: "Jua", cursive;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Monthly Progress Bar Chart */
.chart-container {
  margin-bottom: 20px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-toggle-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  padding: 4px;
  background: #f8f9fa;
  border-radius: 10px;
}

.filter-toggle-btn {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.filter-toggle-btn:hover {
  color: #495057;
}

.filter-toggle-btn.active {
  background: white;
  color: #4CAF50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-weight: bold;
}

.bar-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.chart-title {
  font-family: "Jua", cursive;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
  text-align: center;
  flex: 1;
}

.month-nav-btn {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #333;
}

.month-nav-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #dee2e6;
  transform: scale(1.05);
}

.month-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.month-nav-btn ion-icon {
  font-size: 20px;
}

.bar-chart-container {
  padding: 20px 0;
  position: relative;
}

.chart-grid {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
  z-index: 0;
}

.grid-line-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.grid-label {
  position: absolute;
  left: 5px;
  font-family: "Jua", cursive;
  font-size: 11px;
  color: #999;
  font-weight: normal;
  background: white;
  padding: 0 4px;
  z-index: 1;
}

.grid-line {
  width: 100%;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin-left: 35px;
}

.grid-line-bottom {
  background: rgba(0, 0, 0, 0.15);
  height: 2px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 250px;
  gap: 20px;
  padding: 0 40px;
  position: relative;
  z-index: 1;
  margin-bottom: 60px; /* Space for labels below */
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90px;
  animation: slideUp 0.6s ease-out backwards;
  position: relative;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bar-label {
  font-family: "Jua", cursive;
  font-size: 13px;
  font-weight: bold;
  color: #666;
  text-align: center;
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  white-space: nowrap;
}

.bar-context {
  font-family: "Jua", cursive;
  font-size: 11px;
  color: #999;
  text-align: center;
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
}

.bar-wrapper {
  width: 100%;
  height: 250px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 80%;
  min-height: 5px;
  border-radius: 12px 12px 4px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: barGrow 1s ease-out;
}

@keyframes barGrow {
  from {
    height: 0;
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bar-green {
  background: linear-gradient(to top, #5fb878, #88c999, #a8e6b8);
  box-shadow: 0 4px 12px rgba(95, 184, 120, 0.3);
}

.bar-blue {
  background: linear-gradient(to top, #6eb5d4, #a8d8ea, #c8e8fa);
  box-shadow: 0 4px 12px rgba(110, 181, 212, 0.3);
}

.bar-orange {
  background: linear-gradient(to top, #d4a574, #deb887, #f0d8a7);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.3);
}

.bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
  border-radius: 12px 12px 0 0;
  pointer-events: none;
}

.bar-value {
  font-family: "Jua", cursive;
  font-size: 18px;
  font-weight: bold;
  color: #2d3748;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.9);
  position: relative;
  z-index: 1;
  animation: fadeIn 1.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bar:hover {
  transform: translateY(-8px) scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.bar-green:hover {
  box-shadow: 0 8px 20px rgba(95, 184, 120, 0.4);
}

.bar-blue:hover {
  box-shadow: 0 8px 20px rgba(110, 181, 212, 0.4);
}

.bar-orange:hover {
  box-shadow: 0 8px 20px rgba(212, 165, 116, 0.4);
}

/* No Data Message */
.no-data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.no-data-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-data-text {
  font-family: "Jua", cursive;
  font-size: 18px;
  font-weight: bold;
  color: #666;
  margin: 0 0 8px 0;
}

.no-data-subtext {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #999;
  margin: 0;
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

/* Modal Backdrop */
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
  backdrop-filter: blur(2px);
}

/* Edit Profile Modal */
.edit-modal-container {
  background: white;
  border-radius: 16px;
  margin: 20px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.edit-modal-header {
  background: #8b5fbf;
  color: white;
  padding: 16px;
  border-radius: 16px 16px 0 0;
  text-align: center;
}

.edit-modal-header h3 {
  font-family: "Jua", cursive;
  font-size: 18px;
  margin: 0;
  font-weight: bold;
}

.edit-modal-content {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #333;
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-family: "Jua", cursive;
  font-size: 16px;
  background: #f8f9fa;
}

.form-input:focus {
  outline: none;
  border-color: #8b5fbf;
  background: white;
}

.form-input-disabled {
  background: #d3d3d3 !important;
  cursor: not-allowed;
  color: #666;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.cancel-btn,
.save-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-family: "Jua", cursive;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  min-width: 80px;
}

.cancel-btn {
  background: #e9ecef;
  color: #666;
}

.save-btn {
  background: #8b5fbf;
  color: white;
}

/* Avatar Modal */
.avatar-modal-container {
  background: white;
  border-radius: 16px;
  margin: 20px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.avatar-modal-header {
  background: #8b5fbf;
  color: white;
  padding: 16px;
  border-radius: 16px 16px 0 0;
  text-align: center;
}

.avatar-modal-header h3 {
  font-family: "Jua", cursive;
  font-size: 18px;
  margin: 0;
  font-weight: bold;
}

.avatar-modal-content {
  padding: 24px;
}

.avatars-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.avatar-option {
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: avatarFadeIn 0.5s ease-out forwards;
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.avatar-option:nth-child(1) {
  animation-delay: 0.1s;
}
.avatar-option:nth-child(2) {
  animation-delay: 0.2s;
}
.avatar-option:nth-child(3) {
  animation-delay: 0.3s;
}
.avatar-option:nth-child(4) {
  animation-delay: 0.4s;
}

@keyframes avatarFadeIn {
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.avatar-option.selected {
  border-color: #8b5fbf;
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(139, 95, 191, 0.4);
}

.avatar-option:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.avatar-option-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-modal-buttons {
  display: flex;
  justify-content: center;
}

.save-avatar-btn {
  padding: 12px 32px;
  background: #8b5fbf;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: "Jua", cursive;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  transform: translateY(0);
}

.save-avatar-btn:hover {
  background: #7a4fb3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 95, 191, 0.3);
}
</style>
