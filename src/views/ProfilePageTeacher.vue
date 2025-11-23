<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
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
              <h1 class="page-title">Profile</h1>
            </div>

            <!-- Settings Button -->
            <div class="settings-button-container">
              <button
                class="settings-button"
                @click="
                  playClick('teacher');
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
                  <img :src="currentAvatar" alt="Teacher Avatar" class="profile-avatar" />
                  <div
                    class="avatar-edit-overlay"
                    @click="
                      playClick('teacher');
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
                  <div class="student-id">221 - 00731</div>
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
                  playClick('teacher');
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

          <!-- Statistics Cards -->
          <div class="stats-container">
            <div class="stat-card stat-green">
              <div class="stat-number">{{ chartData.activeClassrooms }}</div>
              <div class="stat-label">ACTIVE CLASSROOMS</div>
            </div>
            <div class="stat-card stat-blue">
              <div class="stat-number">{{ chartData.totalStudents }}</div>
              <div class="stat-label">STUDENTS</div>
            </div>
            <div class="stat-card stat-orange">
              <div class="stat-number">{{ chartData.tasksCreated }}</div>
              <div class="stat-label">TASKS CREATED</div>
            </div>
            <div class="stat-card stat-coral">
              <div class="stat-number">{{ chartData.interactedTasks }}</div>
              <div class="stat-label">INTERACTED TASKS</div>
            </div>
          </div>

          <!-- Classroom Analytics Section -->
          <div
            v-if="teacherClasses && teacherClasses.length > 0"
            class="classrooms-analytics-section"
          >
            <h3 class="section-title">Classroom Analytics</h3>

            <!-- Classroom Selector Dropdown -->
            <div class="classroom-selector">
              <label class="selector-label">Select Classroom:</label>
              <select
                v-model="selectedClassroomId"
                @change="
                  playClick('teacher');
                  loadMonthlyStatistics();
                "
                class="classroom-dropdown"
              >
                <option value="" disabled>Choose a classroom</option>
                <option
                  v-for="classroom in teacherClasses"
                  :key="classroom.id"
                  :value="classroom.id"
                >
                  {{ classroom.name }} - {{ classroom.class_code }}
                </option>
              </select>
            </div>

            <!-- Excel Export Section -->
            <div v-if="selectedClassroomId" class="export-section">
              <div class="export-controls">
                <label class="selector-label">Export Month:</label>
                <select v-model="selectedExportMonth" class="month-dropdown">
                  <option
                    v-for="month in availableMonths"
                    :key="month.value"
                    :value="month.value"
                  >
                    {{ month.label }}
                  </option>
                </select>
                <button
                  class="export-btn"
                  @click="
                    playClick('teacher');
                    exportMonthlyProgress();
                  "
                  :disabled="isExporting || !selectedClassroomId"
                >
                  <ion-icon :icon="downloadOutline" class="export-icon"></ion-icon>
                  {{ isExporting ? "Exporting..." : "Download Excel" }}
                </button>
              </div>
            </div>

            <!-- Selected Classroom Analytics Card -->
            <div v-if="selectedClassroomId" class="classroom-analytics-card">
              <div class="classroom-header">
                <h4 class="classroom-name">
                  {{ selectedClassroom?.name || "Classroom" }}
                </h4>
                <p class="classroom-code">
                  Code: {{ selectedClassroom?.class_code || "-" }}
                </p>
              </div>

              <!-- Monthly Progress Bar Chart for selected classroom -->
              <div class="chart-container">
                <div class="bar-chart-header">
                  <button
                    class="month-nav-btn"
                    @click="
                      playClick('teacher');
                      previousMonth();
                    "
                    :disabled="isLoadingMonthly"
                  >
                    <ion-icon :icon="chevronBackOutline"></ion-icon>
                  </button>
                  <h3 class="chart-title">{{ currentMonthDisplay }}</h3>
                  <button
                    class="month-nav-btn"
                    @click="
                      playClick('teacher');
                      nextMonth();
                    "
                    :disabled="isCurrentMonth || isLoadingMonthly"
                  >
                    <ion-icon :icon="chevronForwardOutline"></ion-icon>
                  </button>
                </div>

                <!-- Loading State -->
                <div v-if="isLoadingMonthly" class="loading-container">
                  <div class="loading-spinner"></div>
                  <p class="loading-text">Loading analytics...</p>
                </div>

                <div
                  v-else-if="classroomMonthlyData[selectedClassroomId]?.hasData"
                  class="bar-chart-container"
                >
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
                    <!-- Average Accuracy Bar (Blue) -->
                    <div class="bar-group">
                      <div class="bar-wrapper">
                        <div
                          class="bar bar-blue"
                          :style="{
                            height:
                              Math.max(
                                classroomMonthlyData[selectedClassroomId]
                                  ?.averageAccuracy || 0,
                                5
                              ) + '%',
                          }"
                        >
                          <span class="bar-value"
                            >{{
                              classroomMonthlyData[selectedClassroomId]
                                ?.averageAccuracy || 0
                            }}%</span
                          >
                        </div>
                      </div>
                      <div class="bar-label">Average<br />Accuracy</div>
                    </div>

                    <!-- Students Enrolled Bar (Green) -->
                    <div class="bar-group">
                      <div class="bar-wrapper">
                        <div
                          class="bar bar-green"
                          :style="{
                            height:
                              Math.max(
                                Math.min(
                                  classroomMonthlyData[selectedClassroomId]
                                    ?.studentsAdded || 0,
                                  100
                                ),
                                5
                              ) + '%',
                          }"
                        >
                          <span class="bar-value">{{
                            classroomMonthlyData[selectedClassroomId]?.studentsAdded || 0
                          }}</span>
                        </div>
                      </div>
                      <div class="bar-label">Students<br />Enrolled</div>
                    </div>

                    <!-- Tasks Created Bar (Orange) -->
                    <div class="bar-group">
                      <div class="bar-wrapper">
                        <div
                          class="bar bar-orange"
                          :style="{
                            height:
                              Math.max(
                                Math.min(
                                  classroomMonthlyData[selectedClassroomId]
                                    ?.tasksCreated || 0,
                                  100
                                ),
                                5
                              ) + '%',
                          }"
                        >
                          <span class="bar-value">{{
                            classroomMonthlyData[selectedClassroomId]?.tasksCreated || 0
                          }}</span>
                        </div>
                      </div>
                      <div class="bar-label">Tasks<br />Created</div>
                    </div>

                    <!-- Tasks Completed Bar (Purple) -->
                    <div class="bar-group">
                      <div class="bar-wrapper">
                        <div
                          class="bar bar-purple"
                          :style="{
                            height:
                              Math.max(
                                Math.min(
                                  classroomMonthlyData[selectedClassroomId]
                                    ?.studentInteractions || 0,
                                  100
                                ),
                                5
                              ) + '%',
                          }"
                        >
                          <span class="bar-value">{{
                            classroomMonthlyData[selectedClassroomId]
                              ?.studentInteractions || 0
                          }}</span>
                        </div>
                      </div>
                      <div class="bar-label">Tasks<br />Completed</div>
                    </div>
                  </div>
                </div>

                <!-- No Data Message -->
                <div v-else class="no-data-container">
                  <div class="no-data-icon">📊</div>
                  <p class="no-data-text">No data for this month</p>
                  <p class="no-data-subtext">
                    Statistics will appear when activities are recorded
                  </p>
                </div>
              </div>
            </div>

            <!-- Prompt to Select Classroom -->
            <div v-else class="select-classroom-prompt">
              <div class="prompt-icon">👆</div>
              <p class="prompt-text">Select a classroom to view analytics</p>
            </div>
          </div>

          <!-- Empty State for No Classrooms -->
          <div v-else class="no-classrooms-container">
            <div class="no-data-icon">🏫</div>
            <p class="no-data-text">No classrooms created yet</p>
            <p class="no-data-subtext">Create a classroom to view analytics</p>
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
              <h3>EDIT PROFILE - TEACHER</h3>
            </div>
            <div class="edit-modal-content">
              <div class="form-group">
                <label>Full Name</label>
                <input v-model="editForm.fullName" type="text" class="form-input" />
              </div>
              <div class="form-group">
                <label>Teacher ID</label>
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
                    playClick('teacher');
                    closeEditModal();
                  "
                >
                  CANCEL
                </button>
                <button
                  class="save-btn"
                  @click="
                    playClick('teacher');
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
                    playClick('teacher');
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
                    playClick('teacher');
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
  downloadOutline,
} from "ionicons/icons";
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAuth, useTeacher } from "@/composables/services";
import { useAvatar } from "@/composables/useAvatar";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import * as XLSX from "xlsx";
import { supabase } from "@/services/supabase.js";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const router = useRouter();

// Use composables for backend integration
const { profile, isAuthenticated, updateProfile, initialize: initAuth } = useAuth();
const {
  teacherStats: backendTeacherStats,
  teacherClasses,
  getTeacherStats,
  getTeacherClasses,
  getClassroomMonthlyAnalytics,
  isLoading: teacherLoading,
} = useTeacher();

// Chart data for teacher - using backend statistics
const chartData = computed(
  () =>
    backendTeacherStats.value || {
      activeClassrooms: 0,
      totalStudents: 0,
      tasksCreated: 0,
      interactedTasks: 0,
    }
);

// Monthly data and navigation per classroom
const selectedMonth = ref(new Date());
const selectedClassroomId = ref(null);
const classroomMonthlyData = ref({});
const isLoadingMonthly = ref(false);

// Excel export state
const isExporting = ref(false);
const selectedExportMonth = ref("");
const availableMonths = ref([]);

// Computed property for selected classroom details
const selectedClassroom = computed(() => {
  if (!selectedClassroomId.value || !teacherClasses.value) return null;
  return teacherClasses.value.find((c) => c.id === selectedClassroomId.value);
});

// Computed property for current month display
const currentMonthDisplay = computed(() => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[selectedMonth.value.getMonth()]} ${selectedMonth.value.getFullYear()}`;
});

// Check if selected month is current month
const isCurrentMonth = computed(() => {
  const now = new Date();
  return (
    selectedMonth.value.getMonth() === now.getMonth() &&
    selectedMonth.value.getFullYear() === now.getFullYear()
  );
});

// Get bar height for chart with different scales per metric
const getBarHeight = (value, type) => {
  if (!value || value === 0) return 8; // Minimum height for empty bars

  let maxValue;
  let percentage;

  switch (type) {
    case "classrooms":
      maxValue = 5; // Max expected active status (0 or 1, but scale to 5 for visibility)
      percentage = (value / maxValue) * 100;
      break;
    case "students":
      maxValue = 50; // Max expected students per classroom
      percentage = (value / maxValue) * 100;
      break;
    case "tasks":
      maxValue = 30; // Max expected tasks per classroom per month
      percentage = (value / maxValue) * 100;
      break;
    case "interacted":
      maxValue = 30; // Max expected interacted students
      percentage = (value / maxValue) * 100;
      break;
    default:
      percentage = 50;
  }

  // Ensure minimum visibility and cap at 100%
  return Math.min(Math.max(percentage, 8), 100);
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

// Load monthly statistics from database for selected classroom
// Generate list of available months (last 12 months)
const generateAvailableMonths = () => {
  const months = [];
  const currentDate = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    months.push({
      label: monthName,
      value: monthValue,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    });
  }

  availableMonths.value = months;
  // Set current month as default
  if (months.length > 0) {
    selectedExportMonth.value = months[0].value;
  }
};

// Export monthly progress to Excel
const exportMonthlyProgress = async () => {
  try {
    isExporting.value = true;
    console.log("📊 Starting monthly export for classroom:", selectedClassroomId.value);

    if (!selectedClassroomId.value) {
      window.$toast?.error("Please select a classroom first");
      return;
    }

    if (!selectedExportMonth.value) {
      window.$toast?.error("Please select a month to export");
      return;
    }

    // Parse selected month
    const [year, monthStr] = selectedExportMonth.value.split("-");
    const month = parseInt(monthStr);
    const selectedMonthData = availableMonths.value.find(
      (m) => m.value === selectedExportMonth.value
    );

    window.$toast?.info("Generating Excel file...");

    // Get classroom info
    const classroom = teacherClasses.value.find(
      (c) => c.id === selectedClassroomId.value
    );

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
      .eq("classroom_id", selectedClassroomId.value)
      .eq("status", "active");

    if (studentsError) throw studentsError;

    if (!classroomStudents || classroomStudents.length === 0) {
      window.$toast?.warning("No students found in this classroom");
      return;
    }

    const studentUserIds = [...new Set(classroomStudents.map((cs) => cs.profiles.id))];

    // Calculate date range for the selected month
    const startDate = new Date(parseInt(year), month - 1, 1);
    const endDate = new Date(parseInt(year), month, 0, 23, 59, 59);

    // Fetch reading sessions for the selected month
    const { data: readingSessions, error: sessionsError } = await supabase
      .from("reading_sessions")
      .select(
        `
        user_id,
        content_type,
        words_read,
        accuracy_rate,
        total_miscues,
        created_at
      `
      )
      .in("user_id", studentUserIds)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (sessionsError) throw sessionsError;

    // Fetch analytics data (all-time for comparison)
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

    if (analyticsError) throw analyticsError;

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
          monthly_sessions: 0,
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

    // Count monthly sessions from reading_sessions
    readingSessions?.forEach((session) => {
      const key = `${session.user_id}_${session.content_type}`;
      if (studentProgressMap[key]) {
        studentProgressMap[key].monthly_sessions += 1;
      }
    });

    // Convert to export format
    const exportData = Object.values(studentProgressMap).map((record) => ({
      "Student Name": record.student_name,
      "Student ID": record.student_id,
      "Activity Type": record.content_type,
      "Sessions This Month": record.monthly_sessions || 0,
      "Total Sessions (All Time)": record.total_sessions,
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

    exportData.sort((a, b) => {
      const nameCompare = a["Student Name"].localeCompare(b["Student Name"]);
      if (nameCompare !== 0) return nameCompare;
      return a["Activity Type"].localeCompare(b["Activity Type"]);
    });

    if (exportData.length === 0) {
      window.$toast?.warning("No reading activities found for the selected month");
      return;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws["!cols"] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 },
      { wch: 18 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Monthly Progress");

    const filename = `${
      classroom?.name || "Classroom"
    }_${selectedMonthData?.label.replace(" ", "_")}_Progress.xlsx`;
    XLSX.writeFile(wb, filename);

    window.$toast?.success(
      `Exported ${exportData.length} records for ${selectedMonthData?.label}`
    );
  } catch (error) {
    console.error("❌ Export error:", error);
    window.$toast?.error("Failed to export data. Please try again.");
  } finally {
    isExporting.value = false;
  }
};

const loadMonthlyStatistics = async () => {
  try {
    isLoadingMonthly.value = true;
    console.log("📊 Loading monthly statistics for selected classroom...");

    if (!selectedClassroomId.value) {
      console.log("⚠️ No classroom selected");
      classroomMonthlyData.value = {};
      return;
    }

    if (!profile.value?.id) {
      console.log("⚠️ No teacher ID available");
      return;
    }

    const month = selectedMonth.value.getMonth() + 1; // JavaScript months are 0-indexed
    const year = selectedMonth.value.getFullYear();

    // Fetch analytics for the selected classroom only
    const result = await getClassroomMonthlyAnalytics(
      selectedClassroomId.value,
      profile.value.id,
      month,
      year
    );

    if (result) {
      classroomMonthlyData.value = {
        [selectedClassroomId.value]: result,
      };
      console.log("✅ Monthly statistics loaded:", classroomMonthlyData.value);
    } else {
      console.error(
        `Error fetching analytics for classroom ${selectedClassroomId.value}:`,
        result
      );
      classroomMonthlyData.value = {
        [selectedClassroomId.value]: {
          averageAccuracy: 0,
          studentsAdded: 0,
          tasksCreated: 0,
          studentInteractions: 0,
          hasData: false,
        },
      };
    }
  } catch (error) {
    console.error("Error loading monthly statistics:", error);
  } finally {
    isLoadingMonthly.value = false;
  }
};

// Reactive state using composables
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

// Modal states
const isEditModalOpen = ref(false);
const isAvatarModalOpen = ref(false);

// Use avatar composable for teacher
const { currentAvatar, setAvatar, getAvatar } = useAvatar("teacher");

// Avatar data
const humanAvatar = new URL(
  "../img/CapyBuddy Assets/Profile/Avatar_Teachers/human.png",
  import.meta.url
).href;
const manAvatar = new URL(
  "../img/CapyBuddy Assets/Profile/Avatar_Teachers/man.png",
  import.meta.url
).href;
const profileAvatar = new URL(
  "../img/CapyBuddy Assets/Profile/Avatar_Teachers/profile (1).png",
  import.meta.url
).href;
const womanAvatar = new URL(
  "../img/CapyBuddy Assets/Profile/Avatar_Teachers/woman (1).png",
  import.meta.url
).href;

const selectedAvatar = ref(humanAvatar);
const availableAvatars = ref([
  { name: "Human", path: humanAvatar },
  { name: "Man", path: manAvatar },
  { name: "Profile", path: profileAvatar },
  { name: "Woman", path: womanAvatar },
]);

// Edit form data
const editForm = ref({
  fullName: "",
  studentId: "221 - 00731",
  email: "",
});

// Navigation functions
const goBack = () => {
  router.go(-1);
};

const navigateToHome = () => {
  router.push("/teacher/home");
};

const navigateToClasses = () => {
  router.push("/teacher/classes");
};

const navigateToNotifications = () => {
  router.push("/teacher/notifications");
};

const navigateToSettings = () => {
  router.push("/teacher/settings");
};

// Modal functions
const openEditProfileModal = () => {
  editForm.value.fullName = userProfile.value.full_name || "KYLENE ANGELA M. ROCALES";
  editForm.value.email = userProfile.value.email || "rocales.kylene@gmail.com";
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
    console.log("✅ Teacher avatar saved:", selectedAvatar.value);
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
      console.log("✅ Teacher profile updated successfully");
      closeEditModal();
    } else {
      console.error("❌ Failed to update teacher profile:", result.error);
    }
  } catch (error) {
    console.error("Error updating teacher profile:", error);
  }
};

// Initialize teacher profile data
const initializeTeacherProfile = async () => {
  try {
    console.log("👨‍🏫 Initializing teacher profile...");

    // Initialize authentication
    await initAuth();

    if (isAuthenticated.value && profile.value) {
      console.log("✅ Teacher authenticated, fetching data...");

      // Fetch teacher stats and classes
      await Promise.all([
        getTeacherStats(profile.value.id),
        getTeacherClasses(profile.value.id),
      ]);

      // Generate available months for export
      generateAvailableMonths();

      // Set the first classroom as default selection if available
      if (teacherClasses.value && teacherClasses.value.length > 0) {
        selectedClassroomId.value = teacherClasses.value[0].id;
        // Load monthly statistics for the first classroom
        await loadMonthlyStatistics();
      }

      console.log("📊 Teacher profile loaded:", userProfile.value);
    } else {
      console.log("❌ Teacher not authenticated, redirecting to login");
      router.push("/login");
    }
  } catch (error) {
    console.error("Error initializing teacher profile:", error);
  }
};

// Lifecycle
onMounted(async () => {
  console.log("🎵 Starting lobby music for ProfilePageTeacher...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);

  await initializeTeacherProfile();

  // Initialize avatar from localStorage
  const storedAvatar = getAvatar();
  if (storedAvatar) {
    selectedAvatar.value = storedAvatar;
    console.log("🎨 Loaded teacher avatar from localStorage:", storedAvatar);
  }
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby music for ProfilePageTeacher...");
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
  color: #4a90e2;
  font-family: "Jua", cursive;
  transition: all 0.3s ease;
}

.back-button:hover {
  color: #357abd;
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
  color: #4a90e2;
  transition: all 0.3s ease;
}

.settings-button:hover {
  color: #357abd;
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
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border-radius: 16px;
  padding: 6px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
  transition: all 0.3s ease;
}

.profile-card:hover {
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
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
  color: #4a90e2;
  font-weight: normal;
}

/* Statistics Cards */
.stats-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.stat-coral {
  background: #ff7f7f;
  color: #8b0000;
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

/* Classroom Analytics Section */
.classrooms-analytics-section {
  margin-bottom: 20px;
}

.section-title {
  font-family: "Jua", cursive;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 16px 0;
}

/* Classroom Selector Dropdown */
.classroom-selector {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selector-label {
  font-family: "Jua", cursive;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.classroom-dropdown {
  width: 100%;
  padding: 12px 16px;
  font-family: "Jua", cursive;
  font-size: 16px;
  color: #333;
  background: white;
  border: 2px solid #4a90e2;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.classroom-dropdown:hover {
  border-color: #357abd;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
}

.classroom-dropdown:focus {
  outline: none;
  border-color: #357abd;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.classroom-dropdown option {
  padding: 12px;
}

/* Export Section */
.export-section {
  margin: 15px 0 20px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.export-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.month-dropdown {
  width: 100%;
  padding: 10px 14px;
  font-family: "Jua", cursive;
  font-size: 15px;
  color: #333;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.month-dropdown:hover {
  border-color: #667eea;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.2);
}

.month-dropdown:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.export-btn {
  width: 100%;
  padding: 12px 20px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-family: "Jua", cursive;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.export-btn:hover:not(:disabled) {
  background: #f8f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.export-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-icon {
  font-size: 20px;
}

/* Select Classroom Prompt */
.select-classroom-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.prompt-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.prompt-text {
  font-family: "Jua", cursive;
  font-size: 16px;
  color: #666;
  margin: 0;
}

.classroom-analytics-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.classroom-header {
  margin-bottom: 16px;
}

.classroom-name {
  font-family: "Jua", cursive;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 4px 0;
}

.classroom-code {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* Monthly Progress Bar Chart */
.chart-container {
  margin-bottom: 20px;
}

.bar-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.chart-title {
  font-family: "Jua", cursive;
  font-size: 16px;
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
  gap: 12px;
  padding: 0 40px;
  position: relative;
  z-index: 1;
  margin-bottom: 60px;
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
  font-size: 11px;
  font-weight: bold;
  color: #666;
  text-align: center;
  line-height: 1.2;
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
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

.bar-purple {
  background: linear-gradient(to top, #b968c8, #d896e8, #e8b3f8);
  box-shadow: 0 4px 12px rgba(185, 104, 200, 0.3);
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

/* No Data Message */
.no-data-container,
.no-classrooms-container {
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

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4a90e2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-family: "Jua", cursive;
  font-size: 16px;
  color: #666;
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
  background: linear-gradient(135deg, #4a90e2, #357abd);
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
  border-color: #4a90e2;
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
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
  transition: all 0.3s ease;
}

.save-btn:hover {
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
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
  background: linear-gradient(135deg, #4a90e2, #357abd);
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
  border-color: #4a90e2;
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(74, 144, 226, 0.4);
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
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
  border: none;
  border-radius: 8px;
  font-family: "Jua", cursive;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: translateY(0);
}

.save-avatar-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}
</style>
