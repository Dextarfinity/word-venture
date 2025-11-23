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
              <button class="back-button" @click="playClick('student'); goBack()">
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
          <div v-if="loading" class="loading-state">
            <ion-spinner name="circular" color="primary"></ion-spinner>
            <p>Loading notifications...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <p class="error-message">{{ error }}</p>
            <button @click="playClick('student'); initializeNotifications()" class="retry-button">Retry</button>
          </div>

          <!-- Content when not loading -->
          <div v-else>
            <!-- Tasks Section -->
            <div class="tasks-section">
              <div class="section-header">
                <h3 class="section-title">Tasks</h3>
              </div>

              <!-- Tasks List -->
              <div v-if="tasks.length > 0" class="tasks-list">
                <!-- Dynamic Task Cards -->
                <div
                  v-for="task in tasks"
                  :key="task.id"
                  :class="`task-notification ${getTaskClass(task.priority)}`"
                  @click="playClick('student'); handleTaskClick(task)"
                  style="cursor: pointer;"
                >
                  <div class="task-content">
                    <div class="task-info">
                      <div class="task-sender">{{ task.sender || "TEACHER" }} POSTED</div>
                      <div class="task-title">{{ task.title || "TASK" }}</div>
                      <div class="task-type">{{ getTaskTypeLabel(task.category) }}</div>
                    </div>
                    <div class="task-status">
                      <div v-if="task.isNew" class="notification-dot red"></div>
                      <div class="task-date">{{ formatDate(task.created_at) }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State for Tasks -->
              <div v-else class="empty-state">
                <h3>No Tasks Yet</h3>
                <p>
                  You don't have any tasks assigned yet. Your teacher will post tasks here
                  when available.
                </p>
              </div>
            </div>

            <!-- Announcements Section -->
            <div class="announcements-section">
              <div class="section-header">
                <h3 class="section-title">Announcements</h3>
                <div v-if="hasUnreadAnnouncements" class="notification-dot red"></div>
              </div>

              <!-- Announcements List -->
              <div v-if="announcements.length > 0" class="announcements-list">
                <!-- Dynamic Announcement Cards -->
                <div
                  v-for="announcement in announcements"
                  :key="announcement.id"
                  class="announcement-notification"
                >
                  <div class="announcement-header">
                    <div class="teacher-info">
                      <div class="teacher-avatar">
                        <ion-icon :icon="personOutline" class="avatar-icon"></ion-icon>
                      </div>
                      <div class="teacher-details">
                        <span class="teacher-name">{{
                          announcement.teacher_name || "TEACHER"
                        }}</span>
                        <span class="announcement-date">{{
                          formatDate(announcement.created_at)
                        }}</span>
                      </div>
                    </div>
                    <div v-if="announcement.isNew" class="notification-dot red"></div>
                  </div>
                  <div class="announcement-content">
                    <p class="announcement-text">
                      {{ announcement.content || announcement.message }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Empty State for Announcements -->
              <div v-else class="empty-state">
                <h3>No Announcements Yet</h3>
                <p>
                  You don't have any announcements yet. Your teacher will post
                  announcements here when available.
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
          <div class="nav-item" @click="playClick('student'); navigateToClasses()">
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
  personOutline,
  homeOutline,
  schoolOutline,
  notificationsOutline,
  trophyOutline,
} from "ionicons/icons";
import { useRouter } from "vue-router";
import { ref, onMounted, onActivated, computed, onBeforeUnmount } from "vue";
import { useAuth, useStudent } from "@/composables/services";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import LoadingScreen from "../components/LoadingScreen.vue";
import StudentService from "@/services/studentService";

const router = useRouter();

// Use composables for backend integration
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const {
  studentNotifications,
  getStudentNotifications,
  isLoading: studentLoading,
} = useStudent();

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

// Reactive state
const tasks = ref([]);
const announcements = ref([]);
const loading = ref(false);
const error = ref(null);

// Fetch tasks and announcements separately
const fetchTasks = async (studentId) => {
  try {
    console.log("📋 Fetching student tasks...");
    const result = await StudentService.getStudentTasks(studentId);
    if (result.success) {
      // Filter out completed tasks and map the remaining ones
      tasks.value = result.data
        .filter((assignment) => {
          // Only show tasks that are not completed
          const isCompleted = assignment.student_task_progress?.length > 0 && 
                            assignment.student_task_progress[0]?.status === "completed";
          return !isCompleted;
        })
        .map((assignment) => ({
          id: assignment.id,
          assignmentId: assignment.id,
          title: assignment.task?.title || "Task Assignment",
          sender: assignment.task?.teacher_name || "TEACHER",
          priority: assignment.task?.priority || "regular",
          category: assignment.task?.category || "comprehensive",
          testContent: assignment.task?.test_content,
          created_at: assignment.assigned_at || assignment.created_at,
          isNew:
            !assignment.student_task_progress?.length ||
            assignment.student_task_progress[0]?.status === "not_started",
        }));
      console.log("✅ Tasks loaded (excluding completed):", tasks.value.length);
    } else {
      console.error("❌ Error fetching tasks:", result.error);
    }
  } catch (err) {
    console.error("❌ Error fetching tasks:", err);
  }
};

const fetchAnnouncements = async (studentId) => {
  try {
    console.log("📢 Fetching student announcements...");
    const result = await StudentService.getStudentAnnouncements(studentId);
    if (result.success) {
      announcements.value = result.data.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        teacher_name: announcement.teacher_name || "TEACHER",
        created_at: announcement.created_at,
        isNew: !announcement.is_read || !announcement.read_at,
      }));
      console.log("✅ Announcements loaded:", announcements.value.length);
    } else {
      console.error("❌ Error fetching announcements:", result.error);
    }
  } catch (err) {
    console.error("❌ Error fetching announcements:", err);
  }
};

// Check for unread announcements
const hasUnreadAnnouncements = computed(() => {
  return announcements.value.some((announcement) => announcement.isNew);
});

// Helper functions
const getTaskClass = (priority) => {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return "task-urgent";
    case "important":
    case "high":
      return "task-important";
    default:
      return "task-regular";
  }
};

const getTaskTypeLabel = (category) => {
  const labels = {
    'comprehensive': 'Comprehensive Reading Test',
    'word_reading': 'Word Reading Test',
    'phonics': 'Phonics Test',
    'vocabulary': 'Vocabulary Test'
  };
  return labels[category] || 'Reading Assignment';
};

const handleTaskClick = async (task) => {
  console.log('📋 Task clicked:', task);
  
  try {
    const taskType = task.category || 'comprehensive';
    console.log('📋 Task type:', taskType);
    
    // Route based on task type
    if (['cvc', 'phonics_merger', 'blending', 'silent'].includes(taskType.toLowerCase())) {
      // Word-based tests go to WordReadingPage
      console.log('🔤 Routing to WordReadingPage for word-based test:', taskType);
      
      // Show confirmation modal
      const confirmed = confirm(`Ready to take the ${task.title}?\n\nThis is a ${taskType.replace('_', ' ')} test that will include:\n• Word recognition\n• Reading practice\n• Performance tracking\n\nClick OK to start the test.`);
      
      if (confirmed) {
        // Navigate to WordReadingPage with query parameters
        const queryParams = {
          assignmentId: task.assignmentId,
          taskTitle: task.title,
          taskType: taskType.toLowerCase(),
          source: 'notifications'
        };
        
        console.log('🎯 Navigating to word reading test page with query params:', queryParams);
        router.push({
          path: '/tabs/tab4',
          query: queryParams
        });
      }
      
    } else if (taskType.toLowerCase() === 'comprehensive') {
      // Comprehensive tests go to Tabs6Page
      console.log('📚 Routing to Tabs6Page for comprehensive test');
      
      // Show confirmation modal
      const confirmed = confirm(`Ready to take the ${task.title}?\n\nThis is a comprehensive reading test that will include:\n• Story reading\n• Comprehension questions\n• Performance tracking\n\nClick OK to start the test.`);
      
      if (confirmed) {
        // Store task data for Tabs6Page
        sessionStorage.setItem('taskAssignment', JSON.stringify({
          assignmentId: task.assignmentId,
          taskId: task.id,
          title: task.title,
          category: 'comprehensive',
          testContent: task.testContent,
          isTest: true
        }));
        
        // Navigate to Tabs6Page for comprehensive test
        console.log('🎯 Navigating to comprehensive test page...');
        router.push('/tabs/tab6');
      }
      
    } else {
      // Default fallback to comprehensive test
      console.log('⚠️ Unknown task type, defaulting to comprehensive test:', taskType);
      
      const confirmed = confirm(`Ready to take the ${task.title}?\n\nThis test will include:\n• Story reading\n• Comprehension questions\n• Performance tracking\n\nClick OK to start the test.`);
      
      if (confirmed) {
        sessionStorage.setItem('taskAssignment', JSON.stringify({
          assignmentId: task.assignmentId,
          taskId: task.id,
          title: task.title,
          category: 'comprehensive',
          testContent: task.testContent,
          isTest: true
        }));
        
        router.push('/tabs/tabs6');
      }
    }
  } catch (error) {
    console.error('❌ Error handling task click:', error);
    alert('Error starting test. Please try again.');
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return dateString;
  }
};

// Initialize notifications data
const initializeNotifications = async () => {
  try {
    console.log("📧 Initializing student notifications...");
    loading.value = true;

    // Initialize authentication
    await initAuth();

    if (isAuthenticated.value && profile.value) {
      console.log("✅ Student authenticated, fetching notifications...");

      const studentId = profile.value.id;
      console.log("👤 Student ID:", studentId);

      // Fetch both tasks and announcements in parallel
      await Promise.all([fetchTasks(studentId), fetchAnnouncements(studentId)]);

      console.log(
        "📬 All notifications loaded - Tasks:",
        tasks.value.length,
        "Announcements:",
        announcements.value.length
      );
    } else {
      console.log("❌ Student not authenticated, redirecting to login");
      router.push("/login");
    }
  } catch (error) {
    console.error("❌ Error initializing notifications:", error);
    error.value = error.message || "Failed to load notifications";
  } finally {
    loading.value = false;
  }
};

// Navigation functions
const goBack = () => {
  router.go(-1);
};

const navigateToHome = () => {
  router.push("/student/home");
};

const navigateToClasses = () => {
  router.push("/student/classes");
};

const navigateToProfile = () => {
  router.push("/student/profile");
};

// Lifecycle
onMounted(async () => {
  console.log("🎵 Starting lobby background music...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);
  
  await initializeNotifications();
});

// Refresh data when page becomes active (returning from test)
onActivated(async () => {
  console.log("🔄 Notifications page activated, refreshing data...");
  await initializeNotifications();
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby background music...");
  stopMusic();
});
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
  width: 60px;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px;
  padding-bottom: 80px; /* Space for sticky navbar */
}

/* Tasks Section */
.tasks-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  align-items: center;
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

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-notification {
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Task Priority Colors */
.task-urgent {
  background: linear-gradient(135deg, #ffa726, #ff8a50);
}

.task-important {
  background: linear-gradient(135deg, #66bb6a, #4caf50);
}

.task-regular {
  background: white;
}

.task-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-info {
  flex: 1;
}

.task-sender {
  font-family: "Jua", cursive;
  font-size: 10px;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.task-title {
  font-family: "Jua", cursive;
  font-size: 14px;
  font-weight: bold;
}

.task-type {
  font-family: "Jua", cursive;
  font-size: 11px;
  margin-top: 2px;
  opacity: 0.8;
}

.task-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-direction: column;
}

.task-date {
  font-family: "Jua", cursive;
  font-size: 12px;
}

/* Text colors for different task types */
.task-urgent .task-title,
.task-urgent .task-sender,
.task-urgent .task-date {
  color: white;
}

.task-important .task-title,
.task-important .task-sender,
.task-important .task-date {
  color: white;
}

.task-regular .task-title {
  color: #333;
}

.task-regular .task-sender,
.task-regular .task-date {
  color: #666;
}

.notification-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.notification-dot.red {
  background-color: #dc3545;
}

/* Announcements Section */
.announcements-section {
  margin-bottom: 20px;
}

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.announcement-notification {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #42a5f5;
}

.announcement-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.teacher-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.teacher-avatar {
  width: 32px;
  height: 32px;
  background: #42a5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 18px;
  color: white;
}

.teacher-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.teacher-name {
  font-family: "Jua", cursive;
  font-size: 14px;
  font-weight: bold;
  color: #42a5f5;
}

.announcement-date {
  font-family: "Jua", cursive;
  font-size: 12px;
  color: #666;
}

.announcement-content {
  padding-left: 44px;
}

.announcement-text {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-state h3 {
  font-family: "Jua", cursive;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}

.empty-state p {
  font-family: "Jua", cursive;
  font-size: 14px;
  line-height: 1.4;
  color: #666;
  margin: 0;
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-state p {
  font-family: "Jua", cursive;
  font-size: 16px;
  color: #666;
  margin-top: 16px;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.error-message {
  font-family: "Jua", cursive;
  font-size: 16px;
  color: #dc3545;
  margin-bottom: 16px;
}

.retry-button {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-family: "Jua", cursive;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retry-button:hover {
  background: #218838;
}
</style>
