<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Loading Screen -->
      <loading-screen :is-loading="loading" message="Loading classroom" />

      <!-- Main Container -->
      <div class="classroom-container">
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
              <h1 class="page-title">CLASS - STUDENT</h1>
            </div>

            <!-- Spacer for alignment -->
            <div class="spacer"></div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Class Info Card -->
          <div class="class-info-card">
            <div class="class-info-content">
              <div class="class-details">
                <h2 class="class-title">{{ classroom.name || "CLASS 2" }}</h2>
                <p class="class-section">
                  SECTION: {{ classroom.class_code || classroom.section || "MV33" }}
                </p>
                <p class="class-students">
                  {{ classroom.student_count || 0 }} Students Enrolled
                </p>
              </div>
              <div class="action-buttons-container">
                <button
                  class="info-btn"
                  @click="
                    playClick('teacher');
                    showClassInfo();
                  "
                  title="Classroom Information"
                >
                  <ion-icon :icon="informationCircleOutline" class="info-icon"></ion-icon>
                </button>
                <button
                  class="analytics-btn"
                  @click="
                    playClick('teacher');
                    showSettings();
                  "
                >
                  <span class="analytics-text">CLASSROOM SETTINGS</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Export Progress Button -->
          <div class="export-section">
            <button
              class="export-btn"
              @click="
                playClick('teacher');
                exportClassProgress();
              "
              :disabled="loading"
            >
              <ion-icon :icon="downloadOutline" class="export-icon"></ion-icon>
              Export Class Progress
            </button>
          </div>

          <!-- Tasks Section -->
          <div class="tasks-section">
            <div class="section-header">
              <div class="section-title-container">
                <h3 class="section-title">Tasks</h3>
              </div>
              <button
                class="new-task-btn"
                @click="
                  playClick('teacher');
                  createNewTask();
                "
              >
                <span class="plus-icon">+</span>
                NEW TASK
              </button>
            </div>

            <div class="tasks-list">
              <!-- Task Items -->
              <div
                v-for="task in tasks"
                :key="task.id"
                class="task-card"
                :class="getTaskClass(task.priority)"
                @click="
                  playClick('teacher');
                  editTask(task);
                "
              >
                <div class="task-content">
                  <div class="task-info">
                    <div class="task-number">
                      {{ formatDate(task.due_date || task.created_at) }}
                    </div>
                    <div class="task-title">{{ task.title }}</div>
                  </div>
                  <div class="task-actions">
                    <div class="notification-dot" :class="task.priority"></div>
                    <button
                      class="delete-task-btn"
                      @click.stop="handleDeleteTask(task)"
                      title="Delete Task"
                    >
                      <IonIcon :icon="trashOutline" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Empty state for tasks -->
              <div v-if="tasks.length === 0" class="empty-state">
                <p>No tasks created yet</p>
                <button
                  class="create-first-task-btn"
                  @click="
                    playClick('teacher');
                    createNewTask();
                  "
                >
                  Create Your First Task
                </button>
              </div>
            </div>
          </div>

          <!-- Announcements Section -->
          <div class="announcements-section">
            <div class="section-header">
              <div class="section-title-container">
                <h3 class="section-title">Announcements</h3>
              </div>
              <button
                class="new-announcement-btn"
                @click="
                  playClick('teacher');
                  createNewAnnouncement();
                "
              >
                <span class="plus-icon">+</span>
                NEW ANNOUNCEMENT
              </button>
            </div>

            <div class="announcements-list">
              <!-- Announcement Items -->
              <div
                v-for="announcement in announcements"
                :key="announcement.id"
                class="announcement-card"
                :class="{
                  'priority-urgent': announcement.priority === 'urgent',
                  'priority-high': announcement.priority === 'high',
                }"
                @click="
                  playClick('teacher');
                  editAnnouncement(announcement);
                "
              >
                <div class="announcement-content">
                  <div class="announcement-header">
                    <div class="teacher-info">
                      <div class="teacher-avatar">
                        <ion-icon :icon="personOutline" class="avatar-icon"></ion-icon>
                      </div>
                      <div class="teacher-details">
                        <span class="teacher-name">{{
                          announcement.classroom?.teacher?.full_name || "Teacher"
                        }}</span>
                        <span class="announcement-date">
                          {{ formatDate(announcement.created_at) }}
                        </span>
                      </div>
                    </div>
                    <div class="announcement-actions">
                      <div
                        class="priority-indicator"
                        v-if="announcement.priority !== 'normal'"
                      >
                        <span
                          class="priority-badge"
                          :class="`priority-${announcement.priority}`"
                        >
                          {{ announcement.priority.toUpperCase() }}
                        </span>
                      </div>
                      <button
                        class="delete-btn"
                        @click.stop="deleteAnnouncement(announcement.id)"
                      >
                        <ion-icon :icon="trashOutline" class="delete-icon"></ion-icon>
                      </button>
                    </div>
                  </div>
                  <div class="announcement-body">
                    <h4 class="announcement-title">{{ announcement.title }}</h4>
                    <p class="announcement-text">{{ announcement.content }}</p>
                    <div class="announcement-meta">
                      <span
                        class="schedule-info"
                        v-if="announcement.schedule === 'scheduled'"
                      >
                        📅 Scheduled for: {{ formatDate(announcement.scheduled_date) }}
                      </span>
                      <span class="visibility-info">
                        👥
                        {{
                          announcement.is_class_wide
                            ? "All Students"
                            : "Selected Students"
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty state for announcements -->
              <div v-if="announcements.length === 0" class="empty-state">
                <p>No announcements yet</p>
                <button
                  class="create-first-announcement-btn"
                  @click="
                    playClick('teacher');
                    createNewAnnouncement();
                  "
                >
                  Create Your First Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Classroom Info Modal -->
    <ClassroomInfoModal
      :is-open="showClassInfoModal"
      :class-name="classroom.name || 'CLASS 2'"
      :section-name="classroom.section || 'MV33'"
      :class-id="classroomId"
      @close="closeClassInfoModal"
      @save="handleClassInfoSave"
      @students-updated="handleStudentsUpdated"
    />

    <!-- New Task Modal -->
    <NewTaskModal
      :is-open="showNewTaskModal"
      :classroom-id="classroomId"
      :teacher-id="profile?.id"
      @close="closeNewTaskModal"
      @save="handleTaskSave"
    />

    <!-- New Announcement Modal -->
    <NewAnnouncementModal
      :is-open="showNewAnnouncementModal"
      :class-id="classroomId"
      @close="closeNewAnnouncementModal"
      @save="handleAnnouncementSave"
    />
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import {
  chevronBackOutline,
  trashOutline,
  informationCircleOutline,
  downloadOutline,
  personOutline,
} from "ionicons/icons";
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useAuth, useTeacher } from "@/composables/services";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import TeacherService from "@/services/teacherService";
import ClassroomInfoModal from "@/components/ClassroomInfoModal.vue";
import NewTaskModal from "@/components/NewTaskModal.vue";
import NewAnnouncementModal from "@/components/NewAnnouncementModal.vue";
import supabase from "@/supabase";
import * as XLSX from "xlsx";
import LoadingScreen from "@/components/LoadingScreen.vue";

const router = useRouter();
const route = useRoute();

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

// Use composables for backend integration
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const {
  teacherClassroom,
  teacherTasks,
  teacherAnnouncements,
  getTeacherClasses,
  getTeacherClassroom,
  getTeacherTasks,
  getTeacherAnnouncements,
  createTask,
  createAnnouncement,
  deleteTask,
  isLoading: teacherLoading,
} = useTeacher();

// Reactive data from backend
const classroom = computed(() => {
  const classroomData = teacherClassroom.value;
  if (!classroomData) {
    return {
      name: "CLASS 2",
      section: "MV33",
      class_code: "MV33",
      student_count: 0,
    };
  }

  return {
    ...classroomData,
    section: classroomData.class_code || classroomData.section || "MV33",
  };
});
const tasks = computed(() => teacherTasks.value || []);
const announcements = computed(() => teacherAnnouncements.value || []);
const loading = computed(() => teacherLoading.value);

// Modal states
const showClassInfoModal = ref(false);
const showNewTaskModal = ref(false);
const showNewAnnouncementModal = ref(false);

// Get classroom ID from route params
const classroomId = computed(() => route.params.id);

// Initialize classroom data from backend
const initializeClassroomData = async () => {
  try {
    console.log("🏫 Initializing classroom data...");

    await initAuth();

    if (isAuthenticated.value && profile.value?.user_type === "teacher") {
      console.log("✅ Teacher authenticated, fetching classroom data...");

      // First get all teacher classes to populate the classes list
      await getTeacherClasses(profile.value.id);

      // Get specific classroom data with student count (this now uses the same logic as ClassesPageTeacher)
      await getTeacherClassroom(classroomId.value);

      // Then get tasks and announcements
      await Promise.all([
        getTeacherTasks(classroomId.value, profile.value.id),
        getTeacherAnnouncements(classroomId.value, profile.value.id),
      ]);

      console.log("📚 Classroom data loaded:", {
        classroom: classroom.value,
        tasks: tasks.value?.length || 0,
        announcements: announcements.value?.length || 0,
      });
    } else {
      console.log("❌ Teacher not authenticated, redirecting to login");
      router.push("/login");
    }
  } catch (error) {
    console.error("Error initializing classroom data:", error);
  }
};

// Student interaction functions
const viewStudentProgress = (student) => {
  console.log("Viewing progress for student:", student);
  // Navigate to student progress page
  router.push({
    path: `/teacher/student-progress/${student.id}`,
    query: { classroom: classroomId.value },
  });
};

// Reading level styling functions
const getLevelClass = (levelName) => {
  const level = levelName?.toLowerCase() || "non-reader";
  return {
    "level-non-reader": level.includes("non-reader"),
    "level-frustration": level.includes("frustration"),
    "level-instructional": level.includes("instructional"),
    "level-independent": level.includes("independent"),
  };
};

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return "No date set";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getTaskClass = (priority) => {
  return {
    "task-urgent": priority === "urgent",
    "task-normal": priority === "normal",
  };
};

// Navigation functions
const goBack = () => {
  router.push("/teacher/classes");
};

const showSettings = () => {
  // Navigate to classroom settings page
  router.push(`/teacher/classroom-settings/${classroomId.value}`);
};

const showClassInfo = () => {
  showClassInfoModal.value = true;
};

const closeClassInfoModal = () => {
  showClassInfoModal.value = false;
};

const handleClassInfoSave = (classData) => {
  console.log("Class info saved:", classData);
  // Update classroom data
  classroom.value.studentCount = classData.totalStudents;
};

const handleStudentsUpdated = async (students) => {
  console.log("Students updated:", students);
  // Note: Student display removed from this page
};

// Task management functions
const createNewTask = () => {
  console.log("🎯 ClassroomTeacher: Opening new task modal...", {
    profileId: profile.value?.id,
    classroomId: classroomId.value,
    isAuthenticated: isAuthenticated.value,
  });
  showNewTaskModal.value = true;
};

const closeNewTaskModal = () => {
  showNewTaskModal.value = false;
};

const handleTaskSave = async (taskData) => {
  console.log("Task saved:", taskData);

  // Refresh tasks list to include the newly created task
  try {
    await getTeacherTasks(classroomId.value, profile.value.id);
    console.log("✅ Tasks refreshed after creation");
  } catch (error) {
    console.error("❌ Error refreshing tasks:", error);
  }

  // Close the modal
  showNewTaskModal.value = false;
};

const editTask = (task) => {
  // TODO: Create task editing route
  console.log("Edit task:", task);
};

const handleDeleteTask = async (task) => {
  // Confirm deletion
  const confirmDelete = window.confirm(
    `Are you sure you want to delete "${task.title}"? This action cannot be undone.`
  );

  if (!confirmDelete) return;

  try {
    console.log("🗑️ Deleting task:", task.id);

    const result = await deleteTask(task.id, profile.value.id);

    if (result.success) {
      console.log("✅ Task deleted successfully");

      // Refresh tasks list
      await getTeacherTasks(classroomId.value, profile.value.id);

      // Show success message if toast is available
      if (window.$toast) {
        window.$toast.success(
          "Task Deleted",
          `"${task.title}" has been deleted successfully.`
        );
      }
    } else {
      console.error("❌ Error deleting task:", result.error);
      if (window.$toast) {
        window.$toast.error(
          "Delete Failed",
          result.error || "Failed to delete task. Please try again."
        );
      }
    }
  } catch (error) {
    console.error("❌ Exception deleting task:", error);
    if (window.$toast) {
      window.$toast.error(
        "Delete Failed",
        "An unexpected error occurred. Please try again."
      );
    }
  }
};

// Announcement management functions
const createNewAnnouncement = () => {
  showNewAnnouncementModal.value = true;
};

const closeNewAnnouncementModal = () => {
  showNewAnnouncementModal.value = false;
};

const handleAnnouncementSave = async (announcementData) => {
  console.log("🎉 Announcement saved:", announcementData);

  try {
    // Refresh announcements from backend to get the latest data
    console.log("🔄 Refreshing announcements from database...");
    await getTeacherAnnouncements(classroomId.value, profile.value.id);

    console.log("✅ Announcements refreshed successfully!");
    console.log("📊 Current announcements count:", announcements.value?.length || 0);

    // Show success message
    if (window.$toast) {
      window.$toast.success(
        `Announcement "${announcementData.title}" created successfully!`
      );
    }
  } catch (error) {
    console.error("❌ Error refreshing announcements after creation:", error);

    // Show error message
    if (window.$toast) {
      window.$toast.error(
        "Announcement created but failed to refresh list. Please refresh the page."
      );
    }
  }
};

const editAnnouncement = (announcement) => {
  // TODO: Create announcement editing route
  console.log("Edit announcement:", announcement);
};

const deleteAnnouncement = async (announcementId) => {
  if (confirm("Are you sure you want to delete this announcement?")) {
    try {
      console.log("🗑️ Deleting announcement:", announcementId);

      // Import TeacherService for deletion
      const { TeacherService } = await import("@/services/teacherService.js");
      const result = await TeacherService.deleteAnnouncement(
        announcementId,
        profile.value.id
      );

      if (result.success) {
        console.log("✅ Announcement deleted successfully");

        // Refresh announcements list
        await getTeacherAnnouncements(classroomId.value, profile.value.id);

        // Show success message
        if (window.$toast) {
          window.$toast.success("Announcement deleted successfully!");
        }
      } else {
        console.error("❌ Error deleting announcement:", result.error);
        if (window.$toast) {
          window.$toast.error(
            "Delete Failed",
            result.error || "Failed to delete announcement. Please try again."
          );
        }
      }
    } catch (error) {
      console.error("❌ Exception deleting announcement:", error);
      if (window.$toast) {
        window.$toast.error(
          "Delete Failed",
          "An unexpected error occurred. Please try again."
        );
      }
    }
  }
};

// Export class progress to Excel
const exportClassProgress = async () => {
  try {
    console.log("📊 Starting export of classroom progress for class:", classroomId.value);

    if (!classroomId.value) {
      console.error("❌ No classroom ID found");
      if (window.$toast) {
        window.$toast.error("Unable to export: Classroom not found");
      }
      return;
    }

    // Show loading toast
    if (window.$toast) {
      window.$toast.info("Generating Excel file...");
    }

    // Get all students in this classroom
    const { data: classroomStudents, error: studentsError } = await supabase
      .from("classroom_students")
      .select(
        `
        student_id,
        profiles!inner(
          id,
          full_name,
          user_id
        )
      `
      )
      .eq("classroom_id", classroomId.value)
      .eq("status", "active");

    if (studentsError) {
      console.error("❌ Error fetching students:", studentsError);
      throw studentsError;
    }

    console.log("👥 Found students:", classroomStudents?.length || 0);

    if (!classroomStudents || classroomStudents.length === 0) {
      if (window.$toast) {
        window.$toast.warning("No students found in this classroom");
      }
      return;
    }

    // Get unique student UUIDs from profiles.id (this is the actual UUID)
    const studentUserIds = [...new Set(classroomStudents.map((cs) => cs.profiles.id))];
    console.log("📝 Unique students:", studentUserIds.length);
    console.log("🔍 Student UUIDs to query:", studentUserIds);

    // Fetch analytics data for all students in this classroom
    const { data: analyticsData, error: analyticsError } = await supabase
      .from("student_reading_analytics")
      .select(
        `
        user_id,
        content_type,
        words_read,
        accuracy_percentage,
        total_miscues,
        mispronunciation_miscues,
        substitution_miscues,
        omission_miscues,
        insertion_miscues,
        repetition_miscues,
        self_correction_miscues,
        reversal_miscues,
        transposition_miscues,
        cvc_words_read,
        blending_words_read,
        silent_letter_words_read,
        phonics_merger_words_read,
        sight_words_read,
        other_words_read,
        student_name,
        student_id_number
      `
      )
      .in("user_id", studentUserIds);

    if (analyticsError) {
      console.error("❌ Error fetching analytics:", analyticsError);
      throw analyticsError;
    }

    console.log("📊 Analytics data fetched:", analyticsData?.length || 0, "sessions");

    // Group data by student and content_type
    const studentProgressMap = {};

    analyticsData?.forEach((session) => {
      const key = `${session.user_id}_${session.content_type}`;

      if (!studentProgressMap[key]) {
        studentProgressMap[key] = {
          student_name: session.student_name,
          student_id: session.student_id_number,
          content_type:
            session.content_type === "word" ? "Word Reading" : "Story Reading",
          total_words_read: 0,
          total_sessions: 0,
          total_miscues: 0,
          mispronunciation_miscues: 0,
          substitution_miscues: 0,
          omission_miscues: 0,
          insertion_miscues: 0,
          repetition_miscues: 0,
          self_correction_miscues: 0,
          reversal_miscues: 0,
          transposition_miscues: 0,
          cvc_words_read: 0,
          blending_words_read: 0,
          silent_letter_words_read: 0,
          phonics_merger_words_read: 0,
          sight_words_read: 0,
          other_words_read: 0,
          total_accuracy: 0,
          accuracy_count: 0,
        };
      }

      // Aggregate the data
      const record = studentProgressMap[key];
      record.total_words_read += session.words_read || 0;
      record.total_sessions += 1;
      record.total_miscues += session.total_miscues || 0;
      record.mispronunciation_miscues += session.mispronunciation_miscues || 0;
      record.substitution_miscues += session.substitution_miscues || 0;
      record.omission_miscues += session.omission_miscues || 0;
      record.insertion_miscues += session.insertion_miscues || 0;
      record.repetition_miscues += session.repetition_miscues || 0;
      record.self_correction_miscues += session.self_correction_miscues || 0;
      record.reversal_miscues += session.reversal_miscues || 0;
      record.transposition_miscues += session.transposition_miscues || 0;
      record.cvc_words_read += session.cvc_words_read || 0;
      record.blending_words_read += session.blending_words_read || 0;
      record.silent_letter_words_read += session.silent_letter_words_read || 0;
      record.phonics_merger_words_read += session.phonics_merger_words_read || 0;
      record.sight_words_read += session.sight_words_read || 0;
      record.other_words_read += session.other_words_read || 0;

      if (session.accuracy_percentage) {
        record.total_accuracy += session.accuracy_percentage;
        record.accuracy_count += 1;
      }
    });

    // Convert to array and calculate averages
    const exportData = Object.values(studentProgressMap).map((record) => ({
      "Student Name": record.student_name,
      "Student ID": record.student_id,
      "Activity Type": record.content_type,
      "Total Sessions": record.total_sessions,
      "Total Words Read": record.total_words_read,
      "Average Accuracy (%)":
        record.accuracy_count > 0
          ? (record.total_accuracy / record.accuracy_count).toFixed(2)
          : "0.00",
      "Total Miscues": record.total_miscues,
      Mispronunciation: record.mispronunciation_miscues,
      Substitution: record.substitution_miscues,
      Omission: record.omission_miscues,
      Insertion: record.insertion_miscues,
      Repetition: record.repetition_miscues,
      "Self Correction": record.self_correction_miscues,
      Reversal: record.reversal_miscues,
      Transposition: record.transposition_miscues,
      "CVC Words": record.cvc_words_read,
      "Blending Words": record.blending_words_read,
      "Silent Letter Words": record.silent_letter_words_read,
      "Phonics Merger Words": record.phonics_merger_words_read,
      "Sight Words": record.sight_words_read,
      "Other Words": record.other_words_read,
    }));

    // Sort by student name, then by content type
    exportData.sort((a, b) => {
      const nameCompare = a["Student Name"].localeCompare(b["Student Name"]);
      if (nameCompare !== 0) return nameCompare;
      return a["Activity Type"].localeCompare(b["Activity Type"]);
    });

    console.log("📋 Export data prepared:", exportData.length, "rows");

    if (exportData.length === 0) {
      if (window.$toast) {
        window.$toast.warning(
          `No reading activities completed yet. Students in this classroom need to complete word reading or story reading exercises first.`
        );
      }
      return;
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 25 }, // Student Name
      { wch: 15 }, // Student ID
      { wch: 15 }, // Activity Type
      { wch: 12 }, // Total Sessions
      { wch: 15 }, // Total Words Read
      { wch: 18 }, // Average Accuracy
      { wch: 12 }, // Total Miscues
      { wch: 15 }, // Mispronunciation
      { wch: 12 }, // Substitution
      { wch: 10 }, // Omission
      { wch: 10 }, // Insertion
      { wch: 10 }, // Repetition
      { wch: 15 }, // Self Correction
      { wch: 10 }, // Reversal
      { wch: 15 }, // Transposition
      { wch: 12 }, // CVC Words
      { wch: 15 }, // Blending Words
      { wch: 18 }, // Silent Letter Words
      { wch: 18 }, // Phonics Merger Words
      { wch: 12 }, // Sight Words
      { wch: 12 }, // Other Words
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Class Progress");

    // Generate filename with classroom name and timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const className = classroom.value.name || "Classroom";
    const filename = `${className}_Progress_${timestamp}.xlsx`;

    // Write and download file
    XLSX.writeFile(wb, filename);

    console.log("✅ Excel file generated successfully:", filename);

    if (window.$toast) {
      window.$toast.success(
        `Class progress exported successfully! (${exportData.length} records)`
      );
    }
  } catch (error) {
    console.error("❌ Error exporting class progress:", error);
    if (window.$toast) {
      window.$toast.error("Failed to export progress. Please try again.");
    }
  }
};

// Lifecycle
onMounted(async () => {
  // 🎵 Start lobby background music
  console.log("🎵 Starting lobby background music...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);

  await initializeClassroomData();
});

onBeforeUnmount(() => {
  // 🔇 Stop background music when leaving page
  console.log("🔇 Stopping lobby background music...");
  stopMusic();
});
</script>

<style scoped>
.classroom-container {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

/* Header Section */
.header-section {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-button-container {
  flex: 0 0 auto;
}

.back-button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: #ff8c00;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 0;
}

.back-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.back-text {
  font-weight: 500;
}

.page-title-container {
  flex: 1;
  text-align: center;
}

.page-title {
  margin: 0;
  color: #666;
  font-size: 14px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.spacer {
  flex: 0 0 auto;
  width: 60px;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* Class Info Card */
.class-info-card {
  background: linear-gradient(135deg, #4a9eff 0%, #00a8cc 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(74, 158, 255, 0.3);
}

.class-info-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-details {
  color: white;
}

.class-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.class-section {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

.action-buttons-container {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.info-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.info-icon {
  width: 18px;
  height: 18px;
}

.analytics-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.analytics-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* Section Headers */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title-container {
  flex: 1;
}

.section-title {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 700;
}

/* Task Section */
.tasks-section {
  margin-bottom: 40px;
}

/* Students Section */
.students-section {
  margin-bottom: 40px;
}

.class-students {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
}

/* Export Section */
.export-section {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.export-btn {
  background: linear-gradient(135deg, #28a745 0%, #20863a 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.export-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #20863a 0%, #1a6d30 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #6c757d;
  box-shadow: none;
}

.export-icon {
  width: 16px;
  height: 16px;
}

/* Students Grid */
.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.student-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #4a9eff;
}

.student-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #e0e0e0;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.student-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.student-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.2;
}

.student-email {
  font-size: 12px;
  color: #666;
  font-weight: 400;
}

.student-status {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-block;
  margin-top: 2px;
}

.student-status.status-active {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.student-status.status-inactive {
  background: rgba(158, 158, 158, 0.1);
  color: #9e9e9e;
}

.student-status.status-pending {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.student-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.progress-indicator {
  background: #f5f5f5;
  border-radius: 20px;
  padding: 6px 12px;
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #4a9eff;
}

/* Loading State for Students */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: #666;
}

.loading-state p {
  margin: 0;
  font-size: 14px;
}

.add-first-student-btn {
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-first-student-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.new-task-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.new-task-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.plus-icon {
  font-size: 16px;
  font-weight: 700;
}

/* Task Cards */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-card.task-urgent {
  border-left: 4px solid #ff6b35;
}

.task-card.task-normal {
  border-left: 4px solid #95a5a6;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.task-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-info {
  flex: 1;
}

.task-number {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.task-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.notification-dot.urgent {
  background: #ff6b35;
}

.notification-dot.normal {
  background: #95a5a6;
}

.notification-dot.red {
  background: #e74c3c;
}

.delete-task-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #ff6b6b;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.delete-task-btn:hover {
  background: #ff5252;
  transform: scale(1.05);
}

.delete-task-btn:active {
  transform: scale(0.95);
}

.delete-task-btn ion-icon {
  font-size: 16px;
}

/* Announcements Section */
.announcements-section {
  margin-bottom: 40px;
}

.new-announcement-btn {
  background: #4a9eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.new-announcement-btn:hover {
  background: #357abd;
  transform: translateY(-1px);
}

/* Announcement Cards */
.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.announcement-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #4a9eff;
}

.announcement-card.priority-high {
  border-left-color: #ff9800;
}

.announcement-card.priority-urgent {
  border-left-color: #f44336;
}

.announcement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.announcement-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.teacher-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.teacher-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4a90e2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon {
  font-size: 16px;
  color: white;
}

.teacher-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.teacher-name {
  font-size: 13px;
  font-weight: 600;
  color: #4a9eff;
  margin: 0;
}

.announcement-date {
  font-size: 11px;
  color: #666;
}

.announcement-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority-indicator {
  display: flex;
  align-items: center;
}

.priority-badge {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.priority-badge.priority-high {
  background: #fff3e0;
  color: #f57c00;
}

.priority-badge.priority-urgent {
  background: #ffebee;
  color: #d32f2f;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.delete-btn:hover {
  background: rgba(231, 76, 60, 0.1);
}

.delete-icon {
  width: 16px;
  height: 16px;
  color: #e74c3c;
}

.announcement-body {
  padding-left: 40px;
}

.announcement-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.announcement-text {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.announcement-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #888;
}

.schedule-info,
.visibility-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Empty States */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.empty-state p {
  margin-bottom: 20px;
  font-size: 16px;
}

.create-first-task-btn,
.create-first-announcement-btn {
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-first-task-btn:hover,
.create-first-announcement-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .class-info-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .announcement-header {
    flex-wrap: wrap;
  }

  .class-title {
    font-size: 20px;
  }

  .students-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .student-card {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .students-grid {
    gap: 8px;
  }

  .student-info {
    gap: 8px;
  }

  .student-avatar {
    width: 32px;
    height: 32px;
  }

  .student-name {
    font-size: 13px;
  }

  .student-email {
    font-size: 11px;
  }
}

/* Reading Level Styling */
.student-level {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.level-non-reader {
  color: #6c757d;
}

.level-frustration {
  color: #dc3545;
}

.level-instructional {
  color: #fd7e14;
}

.level-independent {
  color: #28a745;
}

.level-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.level-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  min-width: 60px;
}

.badge-non-reader {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.badge-frustration {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.badge-instructional {
  background: #ffeaa7;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.badge-independent {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
</style>
