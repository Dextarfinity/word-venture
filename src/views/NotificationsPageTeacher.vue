<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <!-- Loading Screen -->
      <loading-screen :is-loading="loading" message="Loading notifications" />

      <!-- Main Container -->
      <div class="notifications-container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-row">
            <!-- Back Button -->
            <div class="back-button-container">
              <button
                class="back-button"
                @click="
                  playClick('teacher');
                  goBack();
                "
              >
                <ion-icon :icon="chevronBackOutline" class="back-icon"></ion-icon>
                <span class="back-text">Back</span>
              </button>
            </div>

            <!-- Page Title -->
            <div class="page-title-container">
              <h1 class="page-title">Notifications</h1>
            </div>

            <!-- Spacer for alignment -->
            <div class="spacer"></div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Loading State -->
          <div v-if="loading" class="loading-section">
            <ion-spinner name="crescent" class="loading-spinner"></ion-spinner>
            <p>Loading notifications...</p>
          </div>

          <!-- Student Activity Notifications -->
          <div v-else-if="studentActivities.length > 0" class="activities-section">
            <div class="section-header">
              <h3 class="section-title">Student Activities</h3>
              <span class="notification-count">{{ unreadCount }}</span>
            </div>

            <div class="activities-list">
              <!-- Dynamic Student Activity Notifications -->
              <div
                v-for="activity in studentActivities"
                :key="activity.id"
                class="activity-notification"
                :class="getActivityClass(activity)"
              >
                <div class="activity-content">
                  <div class="student-avatar">
                    <ion-icon :icon="personOutline" class="avatar-icon"></ion-icon>
                  </div>
                  <div class="activity-info">
                    <div class="activity-header">
                      <span class="student-name">{{ activity.student_name }}</span>
                      <span class="activity-time">{{
                        formatTimeAgo(activity.created_at)
                      }}</span>
                    </div>
                    <div class="activity-description">
                      <span class="activity-action">{{ activity.action }}</span>
                      <span class="activity-target">{{ activity.task_title }}</span>
                    </div>
                    <div v-if="activity.score !== null" class="activity-score">
                      Score: {{ activity.score }}/{{ activity.max_score }} ({{
                        calculatePercentage(activity.score, activity.max_score)
                      }}%)
                    </div>
                    <div class="activity-meta">
                      <span class="classroom-name">{{ activity.classroom_name }}</span>
                    </div>
                  </div>
                  <div v-if="activity.is_new" class="notification-dot blue"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <ion-icon :icon="notificationsOutline" class="empty-icon"></ion-icon>
            <h3>No Recent Activities</h3>
            <p>
              Student activities will appear here when they submit tasks or complete
              assignments.
            </p>
          </div>
        </div>

        <!-- Bottom Navigation -->
        <div class="bottom-navigation">
          <div
            class="nav-item"
            @click="
              playClick('teacher');
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
          <div class="nav-item active">
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
import { IonPage, IonContent, IonIcon, IonSpinner } from "@ionic/vue";
import {
  chevronBackOutline,
  personOutline,
  homeOutline,
  schoolOutline,
  notificationsOutline,
  trophyOutline,
} from "ionicons/icons";
import { useRouter } from "vue-router";
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useAuth } from "@/composables/services";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import supabase from "@/supabase";
import LoadingScreen from "../components/LoadingScreen.vue";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const router = useRouter();

// Use composables for backend integration
const { profile, isAuthenticated, initialize: initAuth } = useAuth();

// Reactive state
const studentActivities = ref([]);
const loading = ref(false);

// Computed properties
const unreadCount = computed(() => {
  return studentActivities.value.filter((a) => a.is_new).length;
});

// Format time ago
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "";

  const now = new Date();
  const activityDate = new Date(timestamp);
  const diffInSeconds = Math.floor((now - activityDate) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return activityDate.toLocaleDateString();
};

// Calculate percentage
const calculatePercentage = (score, maxScore) => {
  if (!maxScore || maxScore === 0) return 0;
  return Math.round((score / maxScore) * 100);
};

// Get activity class based on status
const getActivityClass = (activity) => {
  if (activity.status === "completed" && activity.score !== null) {
    const percentage = calculatePercentage(activity.score, activity.max_score);
    if (percentage >= 80) return "activity-success";
    if (percentage >= 60) return "activity-warning";
    return "activity-danger";
  }
  if (activity.status === "in_progress") return "activity-progress";
  return "activity-default";
};

// Fetch student activities for teacher
const fetchStudentActivities = async () => {
  try {
    loading.value = true;
    console.log("📊 Fetching student activities for teacher...");

    if (!profile.value?.id) {
      console.error("❌ No teacher profile found");
      return;
    }

    // Get all tasks created by this teacher
    const { data: teacherTasks, error: tasksError } = await supabase
      .from("teacher_tasks")
      .select("id, title, classroom_id")
      .eq("teacher_id", profile.value.id);

    if (tasksError) {
      console.error("❌ Error fetching teacher tasks:", tasksError);
      return;
    }

    if (!teacherTasks || teacherTasks.length === 0) {
      console.log("ℹ️ No tasks found for this teacher");
      studentActivities.value = [];
      return;
    }

    const taskIds = teacherTasks.map((t) => t.id);

    // Get task assignments for these tasks
    const { data: assignments, error: assignmentsError } = await supabase
      .from("task_assignments")
      .select("id, task_id, user_id")
      .in("task_id", taskIds);

    if (assignmentsError) {
      console.error("❌ Error fetching assignments:", assignmentsError);
      return;
    }

    if (!assignments || assignments.length === 0) {
      console.log("ℹ️ No assignments found");
      studentActivities.value = [];
      return;
    }

    const assignmentIds = assignments.map((a) => a.id);

    // Get student progress for these assignments
    const { data: progressData, error: progressError } = await supabase
      .from("student_task_progress")
      .select("*")
      .in("assignment_id", assignmentIds)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (progressError) {
      console.error("❌ Error fetching progress:", progressError);
      return;
    }

    if (!progressData || progressData.length === 0) {
      console.log("ℹ️ No student progress found");
      studentActivities.value = [];
      return;
    }

    // Get student profiles
    const studentIds = [...new Set(assignments.map((a) => a.user_id))];
    const { data: students, error: studentsError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", studentIds);

    if (studentsError) {
      console.error("❌ Error fetching students:", studentsError);
    }

    // Get classroom names
    const classroomIds = [...new Set(teacherTasks.map((t) => t.classroom_id))];
    const { data: classrooms, error: classroomsError } = await supabase
      .from("classrooms")
      .select("id, name")
      .in("id", classroomIds);

    if (classroomsError) {
      console.error("❌ Error fetching classrooms:", classroomsError);
    }

    // Build activities array
    const activities = progressData.map((progress) => {
      const assignment = assignments.find((a) => a.id === progress.assignment_id);
      const task = teacherTasks.find((t) => t.id === assignment?.task_id);
      const student = students?.find((s) => s.id === assignment?.user_id);
      const classroom = classrooms?.find((c) => c.id === task?.classroom_id);

      // Determine action based on status
      let action = "";
      if (progress.status === "completed") {
        action = "completed";
      } else if (progress.status === "in_progress") {
        action = "started";
      } else if (progress.submitted_at) {
        action = "submitted";
      } else {
        action = "viewed";
      }

      // Check if activity is recent (within last 24 hours)
      const isRecent =
        progress.updated_at && new Date() - new Date(progress.updated_at) < 86400000;

      return {
        id: progress.id,
        student_name: student?.full_name || "Unknown Student",
        action: action,
        task_title: task?.title || "Unknown Task",
        classroom_name: classroom?.name || "Unknown Classroom",
        status: progress.status,
        score: progress.score,
        max_score: progress.max_score,
        created_at: progress.updated_at || progress.created_at,
        is_new: isRecent && progress.status === "completed",
      };
    });

    studentActivities.value = activities;
    console.log("✅ Student activities loaded:", activities.length);
  } catch (error) {
    console.error("❌ Error fetching student activities:", error);
  } finally {
    loading.value = false;
  }
};

// Initialize teacher notifications data
const initializeTeacherNotifications = async () => {
  try {
    console.log("📧 Initializing teacher notifications...");

    // Initialize authentication
    await initAuth();

    if (isAuthenticated.value && profile.value?.user_type === "teacher") {
      console.log("✅ Teacher authenticated, fetching student activities...");

      // Fetch student activities
      await fetchStudentActivities();

      console.log("📬 Student activities loaded:", studentActivities.value?.length || 0);
    } else {
      console.log("❌ Teacher not authenticated, redirecting to login");
      router.push("/login");
    }
  } catch (error) {
    console.error("Error initializing teacher notifications:", error);
  }
};

// Navigation functions
const goBack = () => {
  router.go(-1);
};

const navigateToHome = () => {
  router.push("/teacher/home");
};

// Lifecycle
onMounted(async () => {
  console.log("🎵 Starting lobby music for NotificationsPageTeacher...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);

  await initializeTeacherNotifications();
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby music for NotificationsPageTeacher...");
  stopMusic();
});

const navigateToClasses = () => {
  playClick("teacher"); // 🎵 Play click sound
  router.push("/teacher/classes");
};

const navigateToProfile = () => {
  playClick("teacher"); // 🎵 Play click sound
  router.push("/teacher/profile");
};
</script>

<style scoped>
.notifications-container {
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
  color: #4a90e2;
  font-family: "Jua", cursive;
  transition: all 0.3s ease;
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
  width: 60px;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px;
  padding-bottom: 80px; /* Space for sticky navbar */
}

/* Loading Section */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin-bottom: 20px;
  color: #4a90e2;
}

/* Activities Section */
.activities-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-title {
  font-family: "Jua", cursive;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
  flex: 1;
}

.notification-count {
  font-family: "Jua", cursive;
  font-size: 12px;
  font-weight: bold;
  background: #dc3545;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-notification {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #e0e0e0;
  transition: all 0.3s ease;
}

.activity-notification:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* Activity Status Colors */
.activity-success {
  border-left-color: #4caf50;
}

.activity-warning {
  border-left-color: #ff9800;
}

.activity-danger {
  border-left-color: #f44336;
}

.activity-progress {
  border-left-color: #2196f3;
}

.activity-default {
  border-left-color: #9e9e9e;
}

.activity-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
}

.student-avatar {
  width: 40px;
  height: 40px;
  background: #4a90e2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon {
  font-size: 20px;
  color: white;
}

.activity-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.student-name {
  font-family: "Jua", cursive;
  font-size: 14px;
  font-weight: bold;
  color: #2c3e50;
}

.activity-time {
  font-family: "Jua", cursive;
  font-size: 11px;
  color: #999;
}

.activity-description {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-family: "Jua", cursive;
  font-size: 13px;
  color: #666;
}

.activity-action {
  font-weight: 600;
  color: #4a90e2;
}

.activity-target {
  font-weight: 500;
  color: #333;
}

.activity-score {
  font-family: "Jua", cursive;
  font-size: 13px;
  padding: 6px 10px;
  background: #f5f5f5;
  border-radius: 8px;
  display: inline-block;
  width: fit-content;
}

.activity-success .activity-score {
  background: #e8f5e9;
  color: #2e7d32;
}

.activity-warning .activity-score {
  background: #fff3e0;
  color: #f57c00;
}

.activity-danger .activity-score {
  background: #ffebee;
  color: #c62828;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.classroom-name {
  font-family: "Jua", cursive;
  font-size: 11px;
  color: #999;
  padding: 3px 8px;
  background: #f5f5f5;
  border-radius: 6px;
}

.notification-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: absolute;
  top: 0;
  right: 0;
}

.notification-dot.blue {
  background-color: #2196f3;
  box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.2);
}

.notification-dot.red {
  background-color: #dc3545;
  box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.2);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: #ccc;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-family: "Jua", cursive;
  font-size: 18px;
  color: #666;
  margin-bottom: 8px;
}

.empty-state p {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #999;
  max-width: 300px;
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
