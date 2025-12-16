<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Loading Screen -->
      <loading-screen :is-loading="loading" message="Loading classroom settings" />

      <!-- Main Container -->
      <div class="settings-container">
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
              <h1 class="page-title">Classroom Settings</h1>
            </div>

            <!-- Spacer for alignment -->
            <div class="spacer"></div>
          </div>
        </div>

        <!-- Main Content -->
        <div v-if="loading" class="loading-container">
          <div class="loading-text">Loading settings...</div>
        </div>

        <div v-else class="main-content">
          <!-- Classroom Details Card -->
          <div class="classroom-details-card">
            <h3 class="card-title">CLASSROOM INFORMATION</h3>

            <div class="form-fields">
              <div class="form-field">
                <label class="field-label">Classroom Name</label>
                <input
                  type="text"
                  class="form-input"
                  v-model="editedClassroom.name"
                  :disabled="!isEditing"
                  :placeholder="originalClassroom?.name || 'Enter classroom name'"
                />
              </div>

              <div class="form-field">
                <label class="field-label">Class Code</label>
                <input
                  type="text"
                  class="form-input"
                  v-model="editedClassroom.classCode"
                  :disabled="!isEditing"
                  :placeholder="originalClassroom?.class_code || 'Enter class code'"
                />
              </div>

              <div class="form-field">
                <label class="field-label">School Year</label>
                <input
                  type="text"
                  class="form-input"
                  v-model="editedClassroom.schoolYear"
                  :disabled="!isEditing"
                  :placeholder="originalClassroom?.school_year || 'e.g. 2024-2025'"
                />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button
                v-if="!isEditing"
                class="edit-btn"
                @click="
                  playClick('teacher');
                  enableEditing();
                "
              >
                <span class="btn-text">EDIT CLASSROOM</span>
              </button>

              <template v-else>
                <button
                  class="cancel-btn"
                  @click="
                    playClick('teacher');
                    cancelEditing();
                  "
                >
                  <span class="btn-text">CANCEL</span>
                </button>
                <button
                  class="save-btn"
                  @click="
                    playClick('teacher');
                    saveChanges();
                  "
                  :disabled="isSaving"
                >
                  <span class="btn-text">{{
                    isSaving ? "SAVING..." : "SAVE CHANGES"
                  }}</span>
                </button>
              </template>

              <button
                class="delete-btn"
                @click="
                  playClick('teacher');
                  confirmDelete();
                "
                :disabled="isEditing"
              >
                <span class="btn-text">DELETE CLASSROOM</span>
              </button>
            </div>
          </div>

          <!-- Student Performance Analytics Section -->
          <div class="analytics-section">
            <div class="section-header">
              <h3 class="section-title">STUDENT PERFORMANCE ANALYTICS</h3>
            </div>

            <!-- Student Selection Row -->
            <div class="selection-controls">
              <div class="student-selector">
                <label class="selector-label">Select Student:</label>
                <div class="dropdown-wrapper-fix">
                  <select
                    v-model="selectedStudentId"
                    class="student-dropdown-black"
                    @change="
                      playClick('teacher');
                      loadStudentAnalytics();
                    "
                  >
                    <option value="" disabled>Choose a student...</option>
                    <option
                      v-for="student in enrolledStudents"
                      :key="student.id"
                      :value="student.id"
                    >
                      {{ student.name || student.full_name || "Unknown" }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="period-selector">
                <label class="selector-label">Time Period:</label>
                <div class="period-toggle">
                  <button
                    class="period-btn"
                    :class="{ active: timePeriod === 'week' }"
                    @click="
                      playClick('teacher');
                      timePeriod = 'week';
                      loadStudentAnalytics();
                    "
                  >
                    Week
                  </button>
                  <button
                    class="period-btn"
                    :class="{ active: timePeriod === 'month' }"
                    @click="
                      playClick('teacher');
                      timePeriod = 'month';
                      loadStudentAnalytics();
                    "
                  >
                    Month
                  </button>
                </div>
              </div>

              <div class="date-navigation" v-if="selectedStudentId">
                <button
                  class="nav-btn"
                  @click="
                    playClick('teacher');
                    previousPeriod();
                  "
                >
                  <ion-icon :icon="chevronBackOutline"></ion-icon>
                </button>
                <span class="current-period">{{ currentPeriodDisplay }}</span>
                <button
                  class="nav-btn"
                  @click="
                    playClick('teacher');
                    nextPeriod();
                  "
                >
                  <ion-icon :icon="chevronForwardOutline"></ion-icon>
                </button>
              </div>
            </div>

            <!-- Analytics Cards -->
            <div v-if="!selectedStudentId" class="no-selection-message">
              <div class="empty-state-icon">📊</div>
              <h3>No Student Selected</h3>
              <p>
                Please select a student from the dropdown above to view their performance
                analytics
              </p>
            </div>

            <div v-else-if="selectedStudentId" class="analytics-cards-grid">
              <!-- Average Accuracy Card -->
              <div class="analytics-card accuracy-card">
                <div class="card-content">
                  <div class="card-number">{{ studentAnalytics.averageAccuracy }}%</div>
                  <div class="card-label">AVERAGE<br />ACCURACY</div>
                </div>
              </div>

              <!-- Total Miscues Percentage Card -->
              <div class="analytics-card miscues-card">
                <div class="card-content">
                  <div class="card-number">
                    {{ studentAnalytics.totalMiscuesPercentage }}%
                  </div>
                  <div class="card-label">TOTAL MISCUES<br />PERCENTAGE</div>
                </div>
              </div>

              <!-- Total Words Read Card -->
              <div class="analytics-card words-card">
                <div class="card-content">
                  <div class="card-number">{{ studentAnalytics.totalWordsRead }}</div>
                  <div class="card-label">TOTAL WORDS<br />READ</div>
                </div>
              </div>
            </div>

            <!-- Reading Level Promotion Section -->
            <div class="promotion-section" v-if="selectedStudentId">
              <h3 class="section-subtitle">READING LEVEL PROGRESSION</h3>
              
              <div class="level-info-container">
                <div class="current-level-card">
                  <div class="level-badge">📚</div>
                  <div class="level-details">
                    <div class="level-label">Current Level</div>
                    <div class="level-name">{{ studentLevelInfo.levelName }}</div>
                    <div class="level-number">Level {{ studentLevelInfo.currentLevel }}</div>
                  </div>
                </div>

                <div class="progress-arrow">→</div>

                <div class="next-level-card" v-if="studentLevelInfo.nextLevel">
                  <div class="level-badge">🎯</div>
                  <div class="level-details">
                    <div class="level-label">Next Level</div>
                    <div class="level-name">{{ studentLevelInfo.nextLevelName }}</div>
                    <div class="level-number">Level {{ studentLevelInfo.nextLevel }}</div>
                  </div>
                </div>
                <div class="next-level-card max-level" v-else>
                  <div class="level-badge">🏆</div>
                  <div class="level-details">
                    <div class="level-label">Status</div>
                    <div class="level-name">Maximum Level Reached</div>
                  </div>
                </div>
              </div>

              <div class="category-progress" v-if="studentLevelInfo.nextLevel">
                <div class="progress-header">
                  <span class="progress-label">{{ studentLevelInfo.categoryLabel }} Progress</span>
                  <span class="progress-stats">
                    {{ studentLevelInfo.wordsRead }} / {{ studentLevelInfo.wordsRequired }} words
                  </span>
                </div>
                <div class="progress-bar-container">
                  <div 
                    class="progress-bar-fill" 
                    :style="{ width: studentLevelInfo.progressPercentage + '%' }"
                  ></div>
                </div>
                <div class="progress-percentage">{{ studentLevelInfo.progressPercentage }}% Complete</div>
              </div>

              <button 
                class="add-words-btn"
                v-if="studentLevelInfo.nextLevel"
                @click="playClick('teacher'); openAddWordsModal();"
              >
                <span class="btn-text">+ ADD WORDS READ</span>
              </button>
            </div>

            <!-- Bar Chart Visualization -->
            <div class="chart-section" v-if="selectedStudentId">
              <h3 class="chart-title">
                {{ timePeriod === "week" ? "Weekly" : "Monthly" }} Performance Overview
              </h3>

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
                  <!-- Average Accuracy Bar -->
                  <div class="bar-group" style="animation-delay: 0.1s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-blue"
                        :style="{
                          height: Math.max(studentAnalytics.averageAccuracy, 5) + '%',
                        }"
                      >
                        <span class="bar-value"
                          >{{ studentAnalytics.averageAccuracy }}%</span
                        >
                      </div>
                    </div>
                    <div class="bar-label">Avg Accuracy</div>
                  </div>

                  <!-- Miscues Percentage Bar -->
                  <div class="bar-group" style="animation-delay: 0.2s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-red"
                        :style="{
                          height:
                            Math.max(
                              Math.min(studentAnalytics.totalMiscuesPercentage, 100),
                              5
                            ) + '%',
                        }"
                      >
                        <span class="bar-value"
                          >{{ studentAnalytics.totalMiscuesPercentage }}%</span
                        >
                      </div>
                    </div>
                    <div class="bar-label">Miscues %</div>
                  </div>

                  <!-- Total Words Read Bar -->
                  <div class="bar-group" style="animation-delay: 0.3s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-green"
                        :style="{
                          height:
                            Math.max(
                              Math.min(
                                normalizeWordsRead(studentAnalytics.totalWordsRead),
                                100
                              ),
                              5
                            ) + '%',
                        }"
                      >
                        <span class="bar-value">{{
                          studentAnalytics.totalWordsRead
                        }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Words Read</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Delete Classroom Confirmation Modal -->
    <DeleteClassroomModal
      :isOpen="isDeleteModalOpen"
      :classroomName="editedClassroom.name"
      :isDeleting="isDeleting"
      @close="closeDeleteModal"
      @confirm="handleDeleteConfirm"
    />

    <!-- Add Words Modal -->
    <div v-if="isAddWordsModalOpen" class="modal-overlay" @click="closeAddWordsModal">
      <div class="modal-content add-words-modal" @click.stop>
        <div class="modal-header">
          <h3>Add Words Read</h3>
          <button class="close-btn" @click="closeAddWordsModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="student-info-banner">
            <strong>{{ selectedStudentName }}</strong>
            <span class="level-badge-small">{{ studentLevelInfo.levelName }}</span>
          </div>

          <div class="category-info">
            <div class="info-label">Category for Next Level:</div>
            <div class="category-name">{{ studentLevelInfo.categoryLabel }}</div>
            <div class="words-needed">
              Need {{ studentLevelInfo.wordsRequired - studentLevelInfo.wordsRead }} more words to reach {{ studentLevelInfo.nextLevelName }}
            </div>
          </div>

          <div class="form-field">
            <label class="field-label">Words Read to Add</label>
            <input
              type="number"
              class="form-input"
              v-model.number="wordsToAdd"
              min="1"
              placeholder="Enter number of words"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-modal-btn" @click="closeAddWordsModal">
            Cancel
          </button>
          <button 
            class="confirm-modal-btn" 
            @click="confirmAddWords"
            :disabled="isProcessing || !wordsToAdd || wordsToAdd < 1"
          >
            {{ isProcessing ? 'Processing...' : 'Add Words' }}
          </button>
        </div>
      </div>
    </div>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted, computed, nextTick, onBeforeUnmount, watch } from "vue";
import { useAuth, useTeacher } from "@/composables/services";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import TeacherService from "@/services/teacherService";
import DeleteClassroomModal from "@/components/DeleteClassroomModal.vue";
import LoadingScreen from "@/components/LoadingScreen.vue";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const router = useRouter();
const route = useRoute();

// Use composables for backend integration
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const { getClassroomMonthlyAnalytics, updateClassroom, deleteClassroom } = useTeacher();

// State
const loading = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const isDeleteModalOpen = ref(false);
const originalClassroom = ref(null);
const editedClassroom = ref({
  name: "",
  classCode: "",
  schoolYear: "",
});

// Student selection and analytics state
const enrolledStudents = ref([]);
const selectedStudentId = ref("");
const timePeriod = ref("month"); // 'week' or 'month'
const selectedMonth = ref(new Date().getMonth() + 1); // 1-12
const selectedYear = ref(new Date().getFullYear());
const selectedWeek = ref(getCurrentWeekNumber());

const studentAnalytics = ref({
  averageAccuracy: 0,
  totalMiscuesPercentage: 0,
  totalWordsRead: 0,
});

// Student level progression state
const studentLevelInfo = ref({
  currentLevel: 1,
  levelName: 'Non-Reader',
  nextLevel: 2,
  nextLevelName: 'Frustration',
  category: 'cvc',
  categoryLabel: 'CVC Words',
  wordsRequired: 150,
  wordsRead: 0,
  progressPercentage: 0
});

const isAddWordsModalOpen = ref(false);
const wordsToAdd = ref(null);
const isProcessing = ref(false);

// Get current week number
function getCurrentWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

// Get classroom ID from route params
const classroomId = computed(() => route.params.id);

// Get selected student name
const selectedStudentName = computed(() => {
  const student = enrolledStudents.value.find(s => s.id === selectedStudentId.value);
  return student?.name || student?.full_name || 'Student';
});

// Display current period
const currentPeriodDisplay = computed(() => {
  if (timePeriod.value === "week") {
    return `Week ${selectedWeek.value}, ${selectedYear.value}`;
  } else {
    const monthNames = [
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
    return `${monthNames[selectedMonth.value - 1]} ${selectedYear.value}`;
  }
});

// Normalize words read for chart display (scale to 0-100)
const normalizeWordsRead = (wordsRead) => {
  // You can adjust this scaling factor based on expected reading volumes
  // For example, if 500 words is considered excellent, scale accordingly
  const maxExpectedWords = 500;
  return Math.min((wordsRead / maxExpectedWords) * 100, 100);
};

// Initialize classroom settings
const initializeClassroomSettings = async () => {
  try {
    loading.value = true;
    console.log("⚙️ Initializing classroom settings...");

    await initAuth();

    if (isAuthenticated.value && profile.value?.user_type === "teacher") {
      console.log("✅ Teacher authenticated, fetching classroom data...");

      // Fetch classroom details
      await loadClassroomDetails();

      // Fetch enrolled students
      await loadEnrolledStudents();
    } else {
      console.log("❌ Teacher not authenticated, redirecting to login");
      router.push("/login");
    }
  } catch (error) {
    console.error("Error initializing classroom settings:", error);
  } finally {
    loading.value = false;
  }
};

// Load classroom details
const loadClassroomDetails = async () => {
  try {
    const result = await TeacherService.getClassroomDetails(
      classroomId.value,
      profile.value.id
    );

    if (result.success && result.data) {
      console.log("✅ Classroom details loaded:", result.data);

      // Extract classroom data from the nested structure
      const classroomData = result.data.classroom || result.data;

      originalClassroom.value = classroomData;
      editedClassroom.value = {
        name: classroomData.name || "",
        classCode: classroomData.class_code || "",
        schoolYear: classroomData.school_year || "",
      };

      console.log("📝 Parsed classroom data:", {
        originalClassroom: originalClassroom.value,
        editedClassroom: editedClassroom.value,
      });
    }
  } catch (error) {
    console.error("Error loading classroom details:", error);
  }
};

// Load enrolled students
const loadEnrolledStudents = async () => {
  try {
    console.log("👥 Loading enrolled students...");

    const result = await TeacherService.getClassroomStudents(
      classroomId.value,
      profile.value.id
    );

    if (result.success && result.data) {
      enrolledStudents.value = result.data;
      console.log("✅ Enrolled students loaded:", enrolledStudents.value.length);
      console.log(
        "📋 Student data sample:",
        enrolledStudents.value
          .slice(0, 3)
          .map((s) => ({ id: s.id, name: s.name || s.full_name }))
      );
    } else {
      console.error("❌ Failed to load students:", result.error);
    }
  } catch (error) {
    console.error("❌ Error loading enrolled students:", error);
  }
};

// Load student analytics
const loadStudentAnalytics = async () => {
  if (!selectedStudentId.value) return;

  try {
    console.log(
      `📊 Loading ${timePeriod.value} analytics for student ${selectedStudentId.value}`
    );

    const params = {
      studentId: selectedStudentId.value,
      classroomId: classroomId.value,
      teacherId: profile.value.id,
      period: timePeriod.value,
    };

    if (timePeriod.value === "week") {
      params.week = selectedWeek.value;
      params.year = selectedYear.value;
    } else {
      params.month = selectedMonth.value;
      params.year = selectedYear.value;
    }

    // Call backend service to get student performance data
    const result = await TeacherService.getStudentPerformanceAnalytics(params);

    if (result.success && result.data) {
      studentAnalytics.value = {
        averageAccuracy: result.data.averageAccuracy || 0,
        totalMiscuesPercentage: result.data.totalMiscuesPercentage || 0,
        totalWordsRead: result.data.totalWordsRead || 0,
      };

      console.log("✅ Student analytics loaded:", studentAnalytics.value);
    }

    // Load student level info
    await loadStudentLevelInfo();
  } catch (error) {
    console.error("Error loading student analytics:", error);
  }
};

// Load student level progression info
const loadStudentLevelInfo = async () => {
  if (!selectedStudentId.value) return;

  try {
    const result = await TeacherService.getStudentLevelProgress(selectedStudentId.value);

    if (result.success && result.data) {
      const data = result.data;
      studentLevelInfo.value = {
        currentLevel: data.currentLevel,
        levelName: data.levelName,
        nextLevel: data.nextLevel,
        nextLevelName: data.nextLevelName,
        category: data.category,
        categoryLabel: data.categoryLabel,
        wordsRequired: data.wordsRequired,
        wordsRead: data.wordsRead,
        progressPercentage: data.progressPercentage
      };
    }
  } catch (error) {
    console.error("Error loading student level info:", error);
  }
};

// Modal functions
const openAddWordsModal = () => {
  wordsToAdd.value = null;
  isAddWordsModalOpen.value = true;
};

const closeAddWordsModal = () => {
  isAddWordsModalOpen.value = false;
  wordsToAdd.value = null;
};

const confirmAddWords = async () => {
  if (!wordsToAdd.value || wordsToAdd.value < 1) return;

  try {
    isProcessing.value = true;
    console.log(`📝 Adding ${wordsToAdd.value} words for student ${selectedStudentId.value}`);

    const result = await TeacherService.addWordsAndPromoteStudent({
      studentId: selectedStudentId.value,
      teacherId: profile.value.id,
      category: studentLevelInfo.value.category,
      wordsToAdd: wordsToAdd.value,
      currentLevel: studentLevelInfo.value.currentLevel
    });

    if (result.success) {
      console.log("✅ Words added successfully:", result);

      if (result.promoted) {
        if (window.$toast) {
          window.$toast.success(
            `Congratulations! ${selectedStudentName.value} has been promoted to ${result.newLevelName}!`
          );
        }
      } else {
        if (window.$toast) {
          window.$toast.success(`Added ${wordsToAdd.value} words successfully!`);
        }
      }

      // Reload student level info
      await loadStudentLevelInfo();
      
      closeAddWordsModal();
    } else {
      console.error("❌ Failed to add words:", result.error);
      if (window.$toast) {
        window.$toast.error(result.error || "Failed to add words");
      }
    }
  } catch (error) {
    console.error("❌ Error adding words:", error);
    if (window.$toast) {
      window.$toast.error("An error occurred while adding words");
    }
  } finally {
    isProcessing.value = false;
  }
};

// Period navigation
const previousPeriod = () => {
  if (timePeriod.value === "week") {
    if (selectedWeek.value === 1) {
      selectedWeek.value = 52;
      selectedYear.value--;
    } else {
      selectedWeek.value--;
    }
  } else {
    if (selectedMonth.value === 1) {
      selectedMonth.value = 12;
      selectedYear.value--;
    } else {
      selectedMonth.value--;
    }
  }
  loadStudentAnalytics();
};

const nextPeriod = () => {
  if (timePeriod.value === "week") {
    if (selectedWeek.value === 52) {
      selectedWeek.value = 1;
      selectedYear.value++;
    } else {
      selectedWeek.value++;
    }
  } else {
    if (selectedMonth.value === 12) {
      selectedMonth.value = 1;
      selectedYear.value++;
    } else {
      selectedMonth.value++;
    }
  }
  loadStudentAnalytics();
};

// Display current month (legacy - keeping for compatibility)
const currentMonthDisplay = computed(() => {
  const monthNames = [
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
  return `${monthNames[selectedMonth.value - 1]} ${selectedYear.value}`;
});

// Month navigation (legacy functions - kept for backward compatibility)
const previousMonth = () => {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12;
    selectedYear.value--;
  } else {
    selectedMonth.value--;
  }
  if (timePeriod.value === "month") {
    loadStudentAnalytics();
  }
};

const nextMonth = () => {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1;
    selectedYear.value++;
  } else {
    selectedMonth.value++;
  }
  if (timePeriod.value === "month") {
    loadStudentAnalytics();
  }
};

// Legacy monthly analytics (keeping for backward compatibility)
const monthlyAnalytics = ref({
  averageAccuracy: 0,
  studentsAdded: 0,
  tasksCreated: 0,
  studentInteractions: 0,
});

// Editing functions
const enableEditing = () => {
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  // Reset to original values
  editedClassroom.value = {
    name: originalClassroom.value.name || "",
    classCode: originalClassroom.value.class_code || "",
    schoolYear: originalClassroom.value.school_year || "",
  };
};

const saveChanges = async () => {
  try {
    isSaving.value = true;
    console.log("💾 Saving classroom changes...");

    const result = await updateClassroom(
      classroomId.value,
      {
        name: editedClassroom.value.name,
        classCode: editedClassroom.value.classCode,
        schoolYear: editedClassroom.value.schoolYear,
      },
      profile.value.id
    );

    if (result.success) {
      console.log("✅ Classroom updated successfully");

      // Update original classroom data
      originalClassroom.value = {
        ...originalClassroom.value,
        name: editedClassroom.value.name,
        class_code: editedClassroom.value.classCode,
        school_year: editedClassroom.value.schoolYear,
      };

      isEditing.value = false;

      if (window.$toast) {
        window.$toast.success("Classroom updated successfully!");
      }
    } else {
      console.error("❌ Failed to update classroom:", result.error);
      if (window.$toast) {
        window.$toast.error(result.error || "Failed to update classroom");
      }
    }
  } catch (error) {
    console.error("❌ Error saving changes:", error);
    if (window.$toast) {
      window.$toast.error("An error occurred while saving changes");
    }
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = () => {
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
};

const handleDeleteConfirm = async () => {
  try {
    isDeleting.value = true;
    console.log("🗑️ Deleting classroom...");

    const result = await deleteClassroom(classroomId.value, profile.value.id);

    if (result.success) {
      console.log("✅ Classroom deleted successfully");

      if (window.$toast) {
        window.$toast.success("Classroom deleted successfully");
      }

      // Close modal and navigate back to classes list
      isDeleteModalOpen.value = false;
      router.push("/teacher/classes");
    } else {
      console.error("❌ Failed to delete classroom:", result.error);
      if (window.$toast) {
        window.$toast.error(result.error || "Failed to delete classroom");
      }
      isDeleting.value = false;
    }
  } catch (error) {
    console.error("❌ Error deleting classroom:", error);
    if (window.$toast) {
      window.$toast.error("An error occurred while deleting classroom");
    }
    isDeleting.value = false;
  }
};

// Navigation
const goBack = () => {
  router.push(`/teacher/classroom/${classroomId.value}`);
};

// Lifecycle
onMounted(async () => {
  console.log("🎵 Starting lobby music for ClassroomSettings...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);

  await initializeClassroomSettings();
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby music for ClassroomSettings...");
  stopMusic();
});
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

/* Loading State */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

.loading-text {
  color: #666;
  font-size: 16px;
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
  color: #2c3e50;
  font-size: 24px;
  font-weight: 700;
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

/* Classroom Details Card */
.classroom-details-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin: 0 0 25px 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

/* Form Fields */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  background: #fafafa;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus:not(:disabled) {
  border-color: #4a9eff;
  background: white;
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
}

.form-input:disabled {
  background: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.edit-btn,
.save-btn,
.cancel-btn,
.delete-btn {
  flex: 1;
  min-width: 150px;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.edit-btn {
  background: linear-gradient(135deg, #4a9eff 0%, #357abd 100%);
  color: white;
}

.edit-btn:hover {
  background: linear-gradient(135deg, #357abd 0%, #2a5f8f 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 158, 255, 0.3);
}

.save-btn {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.cancel-btn:hover {
  background: #7f8c8d;
  transform: translateY(-1px);
}

.delete-btn {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Analytics Section */
.analytics-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Reading Level Promotion Section */
.promotion-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-subtitle {
  margin: 0 0 25px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

.level-info-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.current-level-card,
.next-level-card {
  flex: 1;
  min-width: 200px;
  max-width: 280px;
  padding: 25px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.current-level-card {
  background: linear-gradient(135deg, #4a9eff 0%, #357abd 100%);
  color: white;
}

.next-level-card {
  background: linear-gradient(135deg, #66bb6a 0%, #4caf50 100%);
  color: white;
}

.next-level-card.max-level {
  background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%);
}

.level-badge {
  font-size: 48px;
  margin-bottom: 15px;
}

.level-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.level-name {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 5px;
}

.level-number {
  font-size: 14px;
  opacity: 0.9;
}

.progress-arrow {
  font-size: 36px;
  color: #666;
  font-weight: bold;
}

.category-progress {
  margin-bottom: 25px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 14px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
}

.progress-stats {
  font-size: 14px;
  font-weight: 600;
  color: #4a9eff;
}

.progress-bar-container {
  width: 100%;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a9eff 0%, #66bb6a 100%);
  transition: width 0.5s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  color: white;
  font-weight: 600;
  font-size: 12px;
}

.progress-percentage {
  text-align: center;
  font-size: 13px;
  color: #666;
  font-weight: 600;
}

.add-words-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #ff9800 0%, #ff6f00 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.add-words-btn:hover {
  background: linear-gradient(135deg, #ff6f00 0%, #e65100 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 2px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: #999;
  cursor: pointer;
  transition: color 0.3s ease;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 25px;
}

.student-info-banner {
  background: linear-gradient(135deg, #4a9eff 0%, #357abd 100%);
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.level-badge-small {
  background: rgba(255, 255, 255, 0.3);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.category-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}

.info-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.category-name {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 10px;
}

.words-needed {
  font-size: 14px;
  color: #ff9800;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 25px;
  border-top: 2px solid #f0f0f0;
}

.cancel-modal-btn,
.confirm-modal-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cancel-modal-btn {
  background: #e0e0e0;
  color: #666;
}

.cancel-modal-btn:hover {
  background: #d0d0d0;
}

.confirm-modal-btn {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
}

.confirm-modal-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.confirm-modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 15px;
}

.section-title {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Selection Controls */
.selection-controls {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.student-selector,
.period-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.selector-label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-wrapper-fix {
  position: relative;
  width: 100%;
}

.student-dropdown-black {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  font-family: "Jua", cursive;
  background-color: #ffffff;
  color: #000000;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
}

.student-dropdown-black:hover {
  border-color: #4a9eff;
}

.student-dropdown-black:focus {
  border-color: #4a9eff;
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
}

.student-dropdown-black option {
  color: #000000;
  background-color: #ffffff;
  padding: 10px;
  font-size: 15px;
  font-family: "Jua", cursive;
}

.student-dropdown-black option:disabled {
  color: #999999;
}

.student-dropdown:hover {
  border-color: #4a9eff;
}

.student-dropdown:focus {
  border-color: #4a9eff;
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
}

.period-toggle {
  display: flex;
  gap: 8px;
}

.period-btn {
  flex: 1;
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.period-btn:hover {
  border-color: #4a9eff;
  color: #4a9eff;
}

.period-btn.active {
  background: linear-gradient(135deg, #4a9eff 0%, #357abd 100%);
  border-color: #4a9eff;
  color: white;
}

.date-navigation {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-period {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  min-width: 150px;
  text-align: center;
}

/* No Selection Message */
.no-selection-message {
  text-align: center;
  padding: 60px 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #ddd;
  margin: 20px 0;
}

.empty-state-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.no-selection-message h3 {
  color: #555;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.no-selection-message p {
  color: #888;
  font-size: 15px;
  margin: 0;
  line-height: 1.5;
}

/* Month Navigation */
.month-navigation {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nav-btn {
  background: #f0f0f0;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: #4a9eff;
  color: white;
  transform: scale(1.1);
}

.nav-btn ion-icon {
  font-size: 18px;
}

.current-month {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  min-width: 150px;
  text-align: center;
}

/* Analytics Cards */
.analytics-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 30px;
}

.analytics-card {
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.accuracy-card {
  background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
}

.miscues-card {
  background: linear-gradient(135deg, #ef5350 0%, #e53935 100%);
}

.words-card {
  background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%);
}

/* Legacy card styles (keeping for backward compatibility) */
.students-card {
  background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%);
}

.tasks-card {
  background: linear-gradient(135deg, #ffb74d 0%, #ff9800 100%);
}

.interactions-card {
  background: linear-gradient(135deg, #ba68c8 0%, #9c27b0 100%);
}

.card-content {
  color: white;
}

.card-number {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1;
}

.card-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

/* Chart Section */
.chart-section {
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
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
  background: #fafafa;
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

.bar-wrapper {
  width: 100%;
  height: 250px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 100%;
  min-height: 12px;
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
    height: 0 !important;
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bar-blue {
  background: linear-gradient(to top, #6eb5d4, #a8d8ea, #c8e8fa);
  box-shadow: 0 4px 12px rgba(110, 181, 212, 0.3);
}

.bar-red {
  background: linear-gradient(to top, #ef5350, #e57373, #ef9a9a);
  box-shadow: 0 4px 12px rgba(239, 83, 80, 0.3);
}

.bar-green {
  background: linear-gradient(to top, #5fb878, #88c999, #a8e6b8);
  box-shadow: 0 4px 12px rgba(95, 184, 120, 0.3);
}

/* Legacy bar colors (keeping for backward compatibility) */
.bar-orange {
  background: linear-gradient(to top, #d4a574, #deb887, #f0d8a7);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.3);
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

.bar-blue:hover {
  box-shadow: 0 8px 20px rgba(110, 181, 212, 0.4);
}

.bar-red:hover {
  box-shadow: 0 8px 20px rgba(239, 83, 80, 0.4);
}

.bar-green:hover {
  box-shadow: 0 8px 20px rgba(95, 184, 120, 0.4);
}

/* Legacy bar hover effects */
.bar-orange:hover {
  box-shadow: 0 8px 20px rgba(212, 165, 116, 0.4);
}

.bar-purple:hover {
  box-shadow: 0 8px 20px rgba(185, 104, 200, 0.4);
}

.bar-chart {
  max-width: 100%;
  height: auto;
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .classroom-details-card,
  .analytics-section {
    padding: 20px;
  }

  .analytics-cards-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .selection-controls {
    flex-direction: column;
    gap: 15px;
  }

  .student-selector,
  .period-selector,
  .date-navigation {
    width: 100%;
    min-width: auto;
  }

  .period-toggle {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }

  .edit-btn,
  .save-btn,
  .cancel-btn,
  .delete-btn {
    width: 100%;
    min-width: auto;
  }

  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .month-navigation {
    width: 100%;
    justify-content: center;
  }

  .page-title {
    font-size: 20px;
  }

  .card-number {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .analytics-cards-grid {
    grid-template-columns: 1fr;
  }

  .bar-chart {
    width: 100%;
    height: 250px;
  }

  .period-btn {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>
