<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Loading Screen -->
      <loading-screen :is-loading="loading" message="Loading your classes" />

      <!-- Main Container -->
      <div class="classes-container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-row">
            <!-- Back Button -->
            <div class="back-button-container">
              <button class="back-button" @click="playClick('student'); goBack()">
                <ion-icon :icon="chevronBackOutline" class="back-icon"></ion-icon>
                <span class="back-text">Back</span>
              </button>
            </div>

            <!-- Page Title -->
            <div class="page-title-container">
              <h1 class="page-title">Classes</h1>
            </div>

            <!-- Spacer for alignment -->
            <div class="spacer"></div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Loading State -->
          <div v-if="loading" class="loading-container">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Loading your classes...</p>
          </div>

          <!-- Classes Grid -->
          <div v-else class="classes-grid">
            <!-- Dynamic Class Cards -->
            <div
              v-for="(classItem, index) in classes"
              :key="classItem.id"
              class="class-card"
              :class="getClassCardStyle(index)"
              @click="playClick('student'); navigateToClassDetail(classItem.classroom.id)"
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
                  <div class="class-label">{{ classItem.classroom.name }}</div>
                  <div class="class-description">
                    {{ classItem.classroom?.teacher?.full_name || "Teacher" }}
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

            <!-- Empty State -->
            <div v-if="!loading && classes.length === 0" class="empty-state-classes">
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
          <div class="nav-item" @click="playClick('student'); navigateToHome()">
            <img
              src="@/img/CapyBuddy Assets/Nav_Icons/home (1).png"
              alt="Home"
              class="nav-icon"
            />
          </div>
          <div class="nav-item active">
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
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonIcon, IonSpinner } from "@ionic/vue";
import {
  chevronBackOutline,
  homeOutline,
  schoolOutline,
  notificationsOutline,
  trophyOutline,
} from "ionicons/icons";
import { useRouter } from "vue-router";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useAuth } from "@/composables/services";
import { useStudent } from "@/composables/services";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import LoadingScreen from "../components/LoadingScreen.vue";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const router = useRouter();
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const {
  studentClassrooms,
  getStudentClassrooms,
  isLoading: studentLoading,
} = useStudent();

// Reactive data
const classes = ref([]);
const loading = ref(true);

// Initialize component
const initializeClassesPage = async () => {
  try {
    console.log("📚 Initializing classes page...");

    // Initialize authentication first
    await initAuth();

    if (!isAuthenticated.value || !profile.value) {
      console.error("User not authenticated");
      router.push("/login");
      return;
    }

    console.log("✅ User authenticated, fetching classes...");
    console.log("👤 Student ID:", profile.value.id);

    loading.value = true;
    await getStudentClassrooms(profile.value.id);
    classes.value = studentClassrooms.value;

    console.log("📋 Classes loaded:", classes.value.length);
  } catch (error) {
    console.error("Error loading classes:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  console.log("🎵 Starting lobby music for ClassesPage...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);
  
  initializeClassesPage();
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby music for ClassesPage...");
  stopMusic();
});

// Navigation functions
const goBack = () => {
  router.go(-1);
};

const navigateToHome = () => {
  router.push("/student/home");
};

const navigateToClassDetail = (classId) => {
  router.push(`/student/class-detail/${classId}`);
};

const navigateToNotifications = () => {
  router.push("/student/notifications");
};

const navigateToProfile = () => {
  router.push("/student/profile");
};

// Helper function to get class card styles (same as StudentHomePage)
const getClassCardStyle = (index) => {
  const styles = ["class-2", "class-2-blue", "class-3", "class-4"];
  return styles[index % styles.length];
};
</script>

<style scoped>
.classes-container {
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

.spacer {
  flex-shrink: 0;
  width: 60px; /* Same width as back button to center title */
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px;
  padding-bottom: 80px; /* Space for sticky navbar */
}

/* Classes Grid */
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

/* Empty State for Classes */
.empty-state-classes {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
  padding: 20px;
  grid-column: 1 / -1; /* Span full width in grid */
}

.empty-state-content {
  text-align: center;
  opacity: 0.6;
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
