<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Main Container -->
      <div class="class-detail-container">
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
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Error State -->
          <div v-if="error" class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Access Error</h3>
            <p>{{ error }}</p>
            <button
              @click="
                playClick('student');
                goBack();
              "
              class="back-btn"
            >
              Go Back
            </button>
          </div>

          <!-- Class Info Card -->
          <div v-else class="class-info-card">
            <div class="class-info-content">
              <div class="class-details">
                <h2 class="class-title">{{ classDetails.name || "CLASS 2" }}</h2>
                <p class="class-section">
                  SECTION: {{ classDetails.class_code || "RM 33" }}
                </p>
                <p class="class-faculty">
                  FACULTY: {{ classDetails.teacher?.full_name || "MAX VERSTAPPEN" }}
                </p>
              </div>
            </div>
          </div>

          <!-- Tasks Section -->
          <div class="tasks-section">
            <div class="section-header">
              <h3 class="section-title">Tasks</h3>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="loading-state">
              <p>Loading tasks...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="tasks.length === 0" class="empty-state">
              <p>No tasks assigned yet</p>
            </div>

            <!-- Tasks List -->
            <div v-else class="tasks-list">
              <div
                v-for="task in tasks"
                :key="task.id"
                class="task-card"
                :class="[
                  getTaskPriorityClass(task),
                  { 'task-disabled': isTaskOverdue(task) && !isTaskCompleted(task) },
                ]"
                @click="
                  isTaskOverdue(task) && !isTaskCompleted(task)
                    ? handleOverdueTaskClick()
                    : (playClick('student'), handleTaskClick(task))
                "
              >
                <div class="task-content">
                  <div class="task-info">
                    <div class="task-number">
                      NO. {{ task.id }} -
                      {{ formatDate(task.due_date || task.task.due_date) }}
                      <span
                        v-if="isTaskOverdue(task) && !isTaskCompleted(task)"
                        class="overdue-label"
                        >OVERDUE</span
                      >
                    </div>
                    <div class="task-title">{{ task.task.title.toUpperCase() }}</div>
                  </div>
                  <div class="task-status">
                    <div v-if="isTaskOverdue(task)" class="notification-dot red"></div>
                    <div class="checkbox-container">
                      <input
                        type="checkbox"
                        class="task-checkbox"
                        :id="`task-${task.id}`"
                        :checked="isTaskCompleted(task)"
                        :disabled="isTaskOverdue(task) && !isTaskCompleted(task)"
                        @change="toggleTaskCompletion(task)"
                      />
                      <label :for="`task-${task.id}`" class="checkbox-label"></label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Announcements Section -->
          <div class="announcements-section">
            <div class="section-header">
              <h3 class="section-title">Announcements</h3>
              <div v-if="hasUnreadAnnouncements" class="notification-dot red"></div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="loading-state">
              <p>Loading announcements...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="announcements.length === 0" class="empty-state">
              <p>No announcements yet</p>
            </div>

            <!-- Announcements List -->
            <div v-else class="announcements-list">
              <div
                v-for="announcement in announcements"
                :key="announcement.id"
                class="announcement-card"
                :class="{ unread: !announcement.is_read }"
                @click="
                  playClick('student');
                  markAnnouncementAsRead(announcement);
                "
              >
                <div class="announcement-header">
                  <div class="teacher-info">
                    <div class="teacher-avatar">
                      <ion-icon :icon="personOutline" class="avatar-icon"></ion-icon>
                    </div>
                    <div class="teacher-details">
                      <span class="teacher-name">{{
                        announcement.classroom?.teacher?.full_name || "TEACHER"
                      }}</span>
                      <span class="announcement-date">{{
                        formatDate(announcement.created_at)
                      }}</span>
                    </div>
                    <div v-if="!announcement.is_read" class="unread-indicator">
                      <div class="notification-dot red"></div>
                    </div>
                  </div>
                </div>
                <div class="announcement-content">
                  <h4 class="announcement-title">{{ announcement.title }}</h4>
                  <p class="announcement-text">{{ announcement.content }}</p>
                  <div
                    class="announcement-priority"
                    v-if="announcement.priority !== 'normal'"
                  >
                    <span
                      class="priority-badge"
                      :class="`priority-${announcement.priority}`"
                    >
                      {{ announcement.priority.toUpperCase() }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import { chevronBackOutline, personOutline } from "ionicons/icons";
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted, onActivated, computed, onBeforeUnmount } from "vue";
import { useAuth } from "@/composables/services";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import { StudentService } from "@/services/studentService.js";

const router = useRouter();
const route = useRoute();

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

// Use composables for authentication
const { profile, isAuthenticated, initialize: initAuth } = useAuth();

// Reactive state
const classId = computed(() => route.params.id);
const classDetails = ref({});
const tasks = ref([]);
const announcements = ref([]);
const loading = ref(true);
const error = ref(null);

// Computed properties
const hasUnreadAnnouncements = computed(() => {
  return announcements.value.some((a) => !a.is_read);
});

// Mark announcement as read when clicked
const markAnnouncementAsRead = async (announcement) => {
  if (!announcement.is_read) {
    try {
      console.log("👁️ Marking announcement as read:", announcement.id);
      const result = await StudentService.markAnnouncementRead(
        announcement.id,
        profile.value.id
      );

      if (result.success) {
        // Update local state
        announcement.is_read = true;
        announcement.read_at = new Date().toISOString();
        console.log("✅ Announcement marked as read");
      } else {
        console.error("❌ Failed to mark announcement as read:", result.error);
      }
    } catch (error) {
      console.error("❌ Error marking announcement as read:", error);
    }
  }
};

// Initialize class data
const initializeClassDetails = async () => {
  try {
    console.log("📚 Initializing class details for class ID:", classId.value);
    loading.value = true;
    error.value = null;

    await initAuth();

    if (isAuthenticated.value && profile.value) {
      console.log("✅ Student authenticated, fetching class data...");

      // Get classroom details
      console.log("🏫 Fetching classroom details for student ID:", profile.value.id);
      const classroomResult = await StudentService.getStudentClassrooms(profile.value.id);
      console.log("📋 Student classrooms result:", classroomResult);

      if (classroomResult.success) {
        console.log(
          "📚 All enrolled classrooms:",
          classroomResult.data.map((c) => ({
            id: c.classroom.id,
            name: c.classroom.name,
            enrollment_id: c.id,
          }))
        );

        const classroom = classroomResult.data.find(
          (c) => c.classroom.id == classId.value
        );

        if (classroom) {
          console.log("✅ Found matching classroom:", classroom);
          classDetails.value = {
            ...classroom.classroom,
            teacher: classroom.classroom.teacher,
          };
        } else {
          console.log("❌ No matching classroom found for ID:", classId.value);
          console.log(
            "🔍 Student is enrolled in classrooms:",
            classroomResult.data.map((c) => c.classroom.id)
          );

          // Check if student has any enrollments
          if (classroomResult.data.length > 0) {
            const firstClassroom = classroomResult.data[0];
            console.log(
              "🔄 Redirecting to first enrolled classroom:",
              firstClassroom.classroom.id
            );
            router.replace(`/student/class-detail/${firstClassroom.classroom.id}`);
            return; // Exit early to prevent further processing
          } else {
            console.log("⚠️ Student is not enrolled in any classrooms");
            error.value =
              "You are not enrolled in any classrooms. Please contact your teacher.";
            loading.value = false;
            return;
          }
        }
      } else {
        console.error("❌ Error fetching classrooms:", classroomResult.error);
        error.value = "Failed to load classroom information.";
        loading.value = false;
        return;
      }

      // Get tasks for this classroom
      console.log("🔍 Fetching tasks for student:", profile.value.id);
      const tasksResult = await StudentService.getStudentTasks(profile.value.id);
      if (tasksResult.success) {
        console.log("📋 All student tasks:", tasksResult.data);
        // Filter tasks for this specific classroom
        tasks.value = tasksResult.data.filter(
          (task) => task.task.classroom_id == classId.value
        );
        console.log("📋 Filtered tasks for classroom", classId.value, ":", tasks.value);
      } else {
        console.error("❌ Error fetching tasks:", tasksResult.error);
      }

      // Get announcements for this classroom
      console.log("📢 Fetching announcements for classroom:", classId.value);
      const announcementsResult = await StudentService.getStudentAnnouncements(
        profile.value.id,
        classId.value
      );
      if (announcementsResult.success) {
        announcements.value = announcementsResult.data || [];
        console.log(`📢 Found ${announcements.value.length} announcements`);
      } else {
        console.error("❌ Error fetching announcements:", announcementsResult.error);
      }

      console.log("📋 Class data loaded:", {
        class: classDetails.value,
        tasks: tasks.value?.length || 0,
        announcements: announcements.value?.length || 0,
      });
    } else {
      console.log("❌ Student not authenticated, redirecting to login");
      router.push("/login");
    }
  } catch (err) {
    console.error("Error initializing class details:", err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Task management methods
const getTaskPriorityClass = (task) => {
  const priority = task.task.priority || "medium";
  switch (priority) {
    case "high":
      return "task-urgent"; // Orange/Red for high priority
    case "medium":
      return "task-important"; // Green for medium priority
    case "low":
    default:
      return "task-regular"; // White for low priority
  }
};

const isTaskCompleted = (task) => {
  return task.student_task_progress?.[0]?.status === "completed";
};

const isTaskOverdue = (task) => {
  const dueDate = task.due_date || task.task.due_date;
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  return due < now && !isTaskCompleted(task);
};

const handleOverdueTaskClick = () => {
  playClick("student"); // 🎵 Play click sound
  alert(
    "This task is overdue and can no longer be submitted. Please contact your teacher if you need an extension."
  );
};

const handleTaskClick = (task) => {
  playClick("student"); // 🎵 Play click sound
  console.log("🎯 Task clicked:", task);

  // Check if task is overdue and not completed
  if (isTaskOverdue(task) && !isTaskCompleted(task)) {
    console.log("⏰ Task is overdue, cannot access");
    handleOverdueTaskClick();
    return;
  }

  if (isTaskCompleted(task)) {
    console.log("✅ Task already completed, showing results...");
    // TODO: Show task results or details
    return;
  }

  console.log("📝 Starting task assignment:", task);

  const taskType = task.task.category || "comprehensive";
  console.log("📋 Task type:", taskType);
  console.log("📋 Task object:", task.task);

  // Route based on task type
  if (
    ["cvc", "phonics-merger", "blending", "silent-words"].includes(taskType.toLowerCase())
  ) {
    // Word-based tests go to WordReadingPage
    console.log("🔤 Routing to WordReadingPage for word-based test:", taskType);

    const taskAssignmentData = {
      assignmentId: task.id,
      taskId: task.task.id,
      title: task.task.title,
      category: taskType.toLowerCase(),
      testContent: task.task.test_content || null,
    };

    // Store assignment data for WordReadingPage using query parameters
    const queryParams = {
      assignmentId: task.id,
      taskTitle: task.task.title || task.title,
      taskType: taskType.toLowerCase(),
      source: "class-detail",
    };

    // Navigate to WordReadingPage with query parameters
    router.push({
      path: "/tabs/tab4",
      query: queryParams,
    });
  } else if (taskType.toLowerCase() === "comprehensive") {
    // Comprehensive tests go to Tabs6Page
    console.log("📚 Routing to Tabs6Page for comprehensive test");

    const taskAssignmentData = {
      assignmentId: task.id,
      taskId: task.task.id,
      title: task.task.title,
      category: "comprehensive",
      testContent: task.task.test_content || null,
    };

    // Store assignment data for Tabs6Page
    sessionStorage.setItem("taskAssignment", JSON.stringify(taskAssignmentData));

    // Navigate to Tabs6Page
    router.push("/tabs/tab6");
  } else {
    // Default fallback to comprehensive test
    console.log("⚠️ Unknown task type, defaulting to comprehensive test:", taskType);

    const taskAssignmentData = {
      assignmentId: task.id,
      taskId: task.task.id,
      title: task.task.title,
      category: "comprehensive",
      testContent: task.task.test_content || null,
    };

    sessionStorage.setItem("taskAssignment", JSON.stringify(taskAssignmentData));
    router.push("/tabs/tab6");
  }
};

const toggleTaskCompletion = async (task) => {
  try {
    console.log("🔄 Toggling task completion for task:", task.id);

    // Check current status
    const isCompleted = isTaskCompleted(task);

    if (!isCompleted) {
      // Mark as completed
      const submissionData = {
        score: 100, // Default score
        timeSpent: 0,
        attempts: 1,
      };

      const result = await StudentService.submitTask(
        task.id,
        profile.value.id,
        submissionData
      );

      if (result.success) {
        console.log("✅ Task marked as completed");
        // Refresh tasks to show updated status
        await initializeClassDetails();
      } else {
        console.error("❌ Error completing task:", result.error);
      }
    }
  } catch (error) {
    console.error("❌ Error toggling task completion:", error);
  }
};

// Utility methods
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

// Navigation functions
const goBack = () => {
  router.go(-1);
};

// Lifecycle
onMounted(async () => {
  console.log("🎵 Starting lobby background music...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);

  await initializeClassDetails();
});

// Refresh data when page becomes active (returning from test)
onActivated(async () => {
  console.log("🔄 Page activated, refreshing task data...");
  await initializeClassDetails();
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby background music...");
  stopMusic();
});
</script>

<style scoped>
.class-detail-container {
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

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px;
}

/* Class Info Card */
.class-info-card {
  background: linear-gradient(135deg, #42a5f5, #478ed1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.class-info-content {
  color: white;
}

.class-title {
  font-family: "Jua", cursive;
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.class-section,
.class-faculty {
  font-family: "Jua", cursive;
  font-size: 14px;
  margin: 4px 0;
  opacity: 0.9;
}

/* Tasks Section */
.tasks-section {
  margin-bottom: 32px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 20px;
  color: #666;
  font-family: "Jua", cursive;
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

.task-card {
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.task-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Task Priority Colors */
.task-urgent {
  background: linear-gradient(135deg, #ffa726, #ff8a50);
  border-left-color: #ff6b35;
}

.task-important {
  background: linear-gradient(135deg, #66bb6a, #4caf50);
  border-left-color: #388e3c;
}

.task-regular {
  background: white;
  border-left-color: #e0e0e0;
}

/* Text colors for different task types */
.task-urgent .task-title,
.task-urgent .task-number {
  color: white;
}

.task-important .task-title,
.task-important .task-number {
  color: white;
}

.task-regular .task-title {
  color: #333;
}

.task-regular .task-number {
  color: #666;
}

.task-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-info {
  flex: 1;
}

.task-number {
  font-family: "Jua", cursive;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.task-title {
  font-family: "Jua", cursive;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.task-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.notification-dot.red {
  background-color: #dc3545;
}

.checkbox-container {
  position: relative;
}

.task-checkbox {
  width: 20px;
  height: 20px;
  margin: 0;
  cursor: pointer;
}

.checkbox-label {
  cursor: pointer;
}

/* Disabled Task State */
.task-card.task-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(40%);
  position: relative;
}

.task-card.task-disabled:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-card.task-disabled::after {
  content: "🔒";
  position: absolute;
  top: 50%;
  right: 60px;
  transform: translateY(-50%);
  font-size: 20px;
  opacity: 0.7;
}

.overdue-label {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: rgba(220, 53, 69, 0.9);
  color: white;
  font-size: 10px;
  font-weight: bold;
  border-radius: 4px;
  text-transform: uppercase;
}

.task-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
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

.announcement-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #42a5f5;
  cursor: pointer;
  transition: all 0.3s ease;
}

.announcement-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.announcement-card.unread {
  border-left-color: #ff9800;
  background: linear-gradient(to right, #fff8f0, white);
}

.announcement-header {
  margin-bottom: 12px;
}

.teacher-info {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
}

.teacher-avatar {
  width: 32px;
  height: 32px;
  background: #42a5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon {
  font-size: 18px;
  color: white;
}

.teacher-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
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

.unread-indicator {
  flex-shrink: 0;
}

.announcement-content {
  padding-left: 44px;
}

.announcement-title {
  font-family: "Jua", cursive;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
}

.announcement-text {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  margin: 0;
}

.announcement-priority {
  margin-top: 8px;
}

.priority-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.priority-badge.priority-high {
  background: #ffebee;
  color: #c62828;
}

.priority-badge.priority-urgent {
  background: #fce4ec;
  color: #ad1457;
}

/* Error State */
.error-state {
  background: white;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #dc3545;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-state h3 {
  font-family: "Jua", cursive;
  font-size: 20px;
  color: #dc3545;
  margin: 0 0 12px 0;
}

.error-state p {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #666;
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.back-btn {
  background: #42a5f5;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-family: "Jua", cursive;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.back-btn:hover {
  background: #1976d2;
}
</style>
