<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Loading Screen -->
      <loading-screen :is-loading="isLoading" message="Loading teacher dashboard" />

      <!-- Main Container -->
      <div class="teacher-home-container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-row">
            <!-- Greeting Section -->
            <div class="greeting-section">
              <p class="greeting-text">Hello,</p>
              <h1 class="greeting-name">
                {{ userProfile.full_name || "Mr. Verstappen" }}
              </h1>
            </div>

            <!-- Right Side Actions -->
            <div class="header-actions">
              <!-- Notification Bell -->
              <notification-bell user-type="teacher" />

              <!-- Teacher Avatar -->
              <div
                class="avatar-container"
                @click="
                  playClick('teacher');
                  navigateToProfile();
                "
              >
                <img :src="currentAvatar" alt="Teacher Avatar" class="teacher-avatar" />
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Analytics Section -->
          <div class="analytics-section">
            <h3 class="analytics-title">Analytics</h3>

            <!-- Analytics Cards Grid -->
            <div class="analytics-grid">
              <div class="analytics-card classrooms-card">
                <div class="card-number">{{ teacherStats.activeClassrooms }}</div>
                <div class="card-label">ACTIVE<br />CLASSROOMS</div>
              </div>

              <div class="analytics-card students-card">
                <div class="card-number">{{ teacherStats.totalStudents }}</div>
                <div class="card-label">STUDENTS<br />ASSIGNED</div>
              </div>

              <div class="analytics-card tasks-card">
                <div class="card-number">{{ teacherStats.tasksCreated }}</div>
                <div class="card-label">TASKS<br />CREATED</div>
              </div>

              <div class="analytics-card interacted-card">
                <div class="card-number">{{ teacherStats.interactedTasks }}</div>
                <div class="card-label">INTERACTED<br />TASKS</div>
              </div>
            </div>

            <!-- Analytics Chart -->
            <div class="chart-container">
              <h3 class="chart-title">Overall Statistics</h3>

              <!-- Bar Chart -->
              <div class="bar-chart-container">
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

                <div class="bar-chart">
                  <!-- Classrooms Bar -->
                  <div class="bar-group" style="animation-delay: 0.1s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-green"
                        :style="{
                          height:
                            getBarHeight(teacherStats.activeClassrooms, 'classrooms') +
                            '%',
                        }"
                      >
                        <span class="bar-value">{{ teacherStats.activeClassrooms }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Classrooms</div>
                    <div class="bar-context">Active</div>
                  </div>

                  <!-- Students Bar -->
                  <div class="bar-group" style="animation-delay: 0.2s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-blue"
                        :style="{
                          height:
                            getBarHeight(teacherStats.totalStudents, 'students') + '%',
                        }"
                      >
                        <span class="bar-value">{{ teacherStats.totalStudents }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Students</div>
                    <div class="bar-context">Total</div>
                  </div>

                  <!-- Tasks Created Bar -->
                  <div class="bar-group" style="animation-delay: 0.3s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-orange"
                        :style="{
                          height: getBarHeight(teacherStats.tasksCreated, 'tasks') + '%',
                        }"
                      >
                        <span class="bar-value">{{ teacherStats.tasksCreated }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Tasks</div>
                    <div class="bar-context">Created</div>
                  </div>

                  <!-- Interacted Tasks Bar -->
                  <div class="bar-group" style="animation-delay: 0.4s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-red"
                        :style="{
                          height:
                            getBarHeight(teacherStats.interactedTasks, 'interacted') +
                            '%',
                        }"
                      >
                        <span class="bar-value">{{ teacherStats.interactedTasks }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Interacted</div>
                    <div class="bar-context">Tasks</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Classes Section -->
          <div class="classes-section">
            <div class="section-header">
              <h4 class="section-title">Classes</h4>
            </div>

            <div v-if="recentClasses.length > 0" class="classes-grid">
              <!-- Dynamic Classroom Cards -->
              <div
                v-for="classroom in recentClasses.slice(0, 4)"
                :key="classroom.id"
                class="teacher-class-card"
                @click="
                  playClick('teacher');
                  navigateToTeacherClassDetail(classroom.id);
                "
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
                    <div class="class-name">{{ classroom.name }}</div>
                    <div class="class-details">
                      <span class="student-count"
                        >{{ classroom.student_count || 0 }} students</span
                      >
                      <span class="class-code">Code: {{ classroom.class_code }}</span>
                    </div>
                    <div class="class-status">
                      <span class="status-badge active">Active</span>
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
                <p class="empty-state-text">No classes created yet.</p>
                <p class="empty-state-subtext">
                  Create one now in class page and get started!
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
          <div
            class="nav-item"
            @click="
              playClick('teacher');
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
              playClick('teacher');
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
              playClick('teacher');
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
      </div>
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
import { useAuth, useTeacher } from "@/composables/services";
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
  teacherStats: backendTeacherStats,
  teacherClasses,
  teacherStudents,
  getTeacherStats,
  getTeacherClasses,
  getTeacherStudents,
  isLoading: teacherLoading,
} = useTeacher();

// Use avatar composable for teacher
const { currentAvatar, getAvatar } = useAvatar("teacher");

// Reactive state using composables
// Reactive state
const isLoading = ref(true);
const userProfile = computed(
  () =>
    profile.value || {
      id: null,
      full_name: "",
      email: "",
      avatar_url: null,
      user_type: "teacher",
    }
);

// Teacher-specific analytics data using composables
const teacherStats = computed(
  () =>
    backendTeacherStats.value || {
      activeClassrooms: 0,
      totalStudents: 0,
      tasksCreated: 0,
      interactedTasks: 0,
    }
);

const isProfileModalOpen = ref(false);

// Computed property for recent classes
const recentClasses = computed(() => {
  return teacherClasses.value || [];
});

// Get bar height for chart with 0-100 fixed scale
const getBarHeight = (value, type) => {
  if (!value || value === 0) return 5; // Minimum height for visibility

  // Use fixed 0-100 scale for consistent visualization
  // Cap at 100% to prevent overflow
  return Math.min(Math.max(value, 5), 100);
};

// Computed properties for analytics chart
const chartCalculations = computed(() => {
  const total =
    teacherStats.value.activeClassrooms +
    teacherStats.value.totalStudents +
    teacherStats.value.tasksCreated +
    teacherStats.value.interactedTasks;

  const classroomsPercent = (teacherStats.value.activeClassrooms / total) * 100;
  const studentsPercent = (teacherStats.value.totalStudents / total) * 100;
  const tasksPercent = (teacherStats.value.tasksCreated / total) * 100;
  const interactedPercent = (teacherStats.value.interactedTasks / total) * 100;

  // Calculate segment angles in degrees
  const classroomsAngle = (classroomsPercent / 100) * 360;
  const studentsAngle = (studentsPercent / 100) * 360;
  const tasksAngle = (tasksPercent / 100) * 360;
  const interactedAngle = (interactedPercent / 100) * 360;

  // Calculate center angles for text positioning (middle of each segment)
  const classroomsCenterAngle = classroomsAngle / 2 - 90; // -90 to adjust for CSS rotation
  const studentsCenterAngle = classroomsAngle + studentsAngle / 2 - 90;
  const tasksCenterAngle = classroomsAngle + studentsAngle + tasksAngle / 2 - 90;
  const interactedCenterAngle =
    classroomsAngle + studentsAngle + tasksAngle + interactedAngle / 2 - 90;

  // Calculate text positions (radius from center)
  const textRadius = 85; // Distance from center for text placement
  const centerX = 120; // Chart center X
  const centerY = 120; // Chart center Y

  return {
    total,
    classroomsPercent,
    studentsPercent,
    tasksPercent,
    interactedPercent,
    // Calculate conic-gradient percentages
    classroomsEnd: classroomsPercent,
    studentsEnd: classroomsPercent + studentsPercent,
    tasksEnd: classroomsPercent + studentsPercent + tasksPercent,
    interactedEnd: 100,
    // Dynamic text positions
    classroomsPosition: {
      left: centerX + Math.cos((classroomsCenterAngle * Math.PI) / 180) * textRadius - 25,
      top: centerY + Math.sin((classroomsCenterAngle * Math.PI) / 180) * textRadius - 15,
    },
    studentsPosition: {
      left: centerX + Math.cos((studentsCenterAngle * Math.PI) / 180) * textRadius - 25,
      top: centerY + Math.sin((studentsCenterAngle * Math.PI) / 180) * textRadius - 15,
    },
    tasksPosition: {
      left: centerX + Math.cos((tasksCenterAngle * Math.PI) / 180) * textRadius - 25,
      top: centerY + Math.sin((tasksCenterAngle * Math.PI) / 180) * textRadius - 15,
    },
    interactedPosition: {
      left: centerX + Math.cos((interactedCenterAngle * Math.PI) / 180) * textRadius - 25,
      top: centerY + Math.sin((interactedCenterAngle * Math.PI) / 180) * textRadius - 15,
    },
  };
});

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

// Navigation functions
const navigateToClasses = () => {
  playClick("teacher"); // 🎵 Play click sound
  router.push("/teacher/classes");
};

const navigateToClassDetail = (classId) => {
  playClick("teacher"); // 🎵 Play click sound
  router.push(`/teacher/classroom/${classId}`);
};

const navigateToTeacherClassDetail = (classId) => {
  playClick("teacher"); // 🎵 Play click sound
  router.push(`/teacher/classroom/${classId}`);
};

const navigateToNotifications = () => {
  playClick("teacher"); // 🎵 Play click sound
  router.push("/teacher/notifications");
};

const navigateToProfile = () => {
  playClick("teacher"); // 🎵 Play click sound
  router.push("/teacher/profile");
};

// Data fetching using composables
const fetchAllTeacherData = async () => {
  try {
    isLoading.value = true;
    console.log("📊 Fetching teacher dashboard data...");

    // Initialize authentication
    await initAuth();

    if (isAuthenticated.value && profile.value) {
      console.log(
        "✅ Teacher authenticated, fetching data for teacher ID:",
        profile.value.id
      );

      // Fetch teacher-specific data using composables with teacher ID
      await Promise.all([
        getTeacherStats(profile.value.id),
        getTeacherClasses(profile.value.id),
        getTeacherStudents(profile.value.id),
      ]);

      console.log("📈 Teacher dashboard data loaded:", {
        stats: teacherStats.value,
        classes: teacherClasses.value?.length || 0,
        students: teacherStudents.value?.length || 0,
      });
    } else {
      console.log("❌ Teacher not authenticated, redirecting to login");
      router.push("/login");
    }
  } catch (error) {
    console.error("Error fetching teacher dashboard data:", error);
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  // 🎵 Start lobby background music
  console.log("🎵 Starting lobby background music...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);

  await fetchAllTeacherData();
});

onBeforeUnmount(() => {
  // 🔇 Stop background music when leaving page
  console.log("🔇 Stopping lobby background music...");
  stopMusic();
});
</script>

<style scoped>
.teacher-home-container {
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

.greeting-section {
  flex: 1;
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
  margin: 4px 0 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-container {
  width: 50px;
  height: 50px;
  cursor: pointer;
  flex-shrink: 0;
}

.teacher-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px;
  padding-bottom: 100px; /* Space for bottom nav */
}

/* Analytics Section */
.analytics-section {
  margin-bottom: 32px;
}

.analytics-title {
  font-family: "Jua", cursive;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0 0 20px 0;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
  margin-bottom: 32px;
}

.analytics-card {
  border-radius: 16px;
  padding: 20px 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}

.classrooms-card {
  background: #88c999;
  color: white;
}

.students-card {
  background: #a8d8ea;
  color: white;
}

.tasks-card {
  background: #deb887;
  color: white;
}

.interacted-card {
  background: #ff9999;
  color: white;
}

.card-number {
  font-family: "Jua", cursive;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 4px;
  line-height: 1;
}

.card-label {
  font-family: "Jua", cursive;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  line-height: 1.2;
}

/* Analytics Chart */
.chart-container {
  margin-bottom: 32px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-family: "Jua", cursive;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 20px 0;
  text-align: center;
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
  gap: 12px;
  padding: 0 40px;
  position: relative;
  z-index: 1;
  margin-bottom: 70px;
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 70px;
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
  font-size: 10px;
  font-weight: bold;
  color: #666;
  text-align: center;
  position: absolute;
  bottom: -35px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  white-space: nowrap;
}

.bar-context {
  font-family: "Jua", cursive;
  font-size: 9px;
  color: #999;
  text-align: center;
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  white-space: nowrap;
}

.bar-wrapper {
  width: 100%;
  height: 250px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 100%;
  min-height: 20px;
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

.bar-red {
  background: linear-gradient(to top, #ff6b6b, #ff9999, #ffb3b3);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.bar::before {
  content: "";
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
  font-size: 16px;
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

.bar-red:hover {
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.4);
}

/* Classes Section */
.classes-section {
  margin-bottom: 20px;
}

.section-title {
  font-family: "Jua", cursive;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 16px 0;
}

.classes-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.teacher-class-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #4a90e2;
}

.teacher-class-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.class-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.class-icon-left {
  flex: 0 0 auto;
}

.class-left-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
}

.class-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.class-name {
  font-family: "Jua", cursive;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.class-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-count,
.class-code {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #666;
}

.class-status {
  display: flex;
  align-items: center;
}

.status-badge {
  font-family: "Jua", cursive;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #e8f5e8;
  color: #2e7d2e;
}

.class-icon {
  flex: 0 0 auto;
}

.icon-image {
  width: 24px;
  height: 24px;
}

/* Empty state for classes */
.empty-state-classes {
  padding: 40px 20px;
  text-align: center;
}

.empty-state-content {
  color: #666;
}

.empty-state-text {
  font-family: "Jua", cursive;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.empty-state-subtext {
  font-family: "Jua", cursive;
  font-size: 14px;
  opacity: 0.8;
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
  background: rgba(74, 144, 226, 0.1);
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
