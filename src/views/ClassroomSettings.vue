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

          <!-- Monthly Analytics Section -->
          <div class="analytics-section">
            <div class="section-header">
              <h3 class="section-title">MONTHLY ANALYTICS</h3>
              <div class="month-navigation">
                <button
                  class="nav-btn"
                  @click="
                    playClick('teacher');
                    previousMonth();
                  "
                >
                  <ion-icon :icon="chevronBackOutline"></ion-icon>
                </button>
                <span class="current-month">{{ currentMonthDisplay }}</span>
                <button
                  class="nav-btn"
                  @click="
                    playClick('teacher');
                    nextMonth();
                  "
                >
                  <ion-icon :icon="chevronForwardOutline"></ion-icon>
                </button>
              </div>
            </div>

            <!-- Analytics Cards -->
            <div class="analytics-cards-grid">
              <!-- Average Accuracy Card -->
              <div class="analytics-card accuracy-card">
                <div class="card-content">
                  <div class="card-number">{{ monthlyAnalytics.averageAccuracy }}%</div>
                  <div class="card-label">AVERAGE<br />ACCURACY</div>
                </div>
              </div>

              <!-- Students Added Card -->
              <div class="analytics-card students-card">
                <div class="card-content">
                  <div class="card-number">{{ monthlyAnalytics.studentsAdded }}</div>
                  <div class="card-label">STUDENTS<br />ENROLLED</div>
                </div>
              </div>

              <!-- Tasks Created Card -->
              <div class="analytics-card tasks-card">
                <div class="card-content">
                  <div class="card-number">{{ monthlyAnalytics.tasksCreated }}</div>
                  <div class="card-label">TASKS<br />CREATED</div>
                </div>
              </div>

              <!-- Student Interactions Card -->
              <div class="analytics-card interactions-card">
                <div class="card-content">
                  <div class="card-number">
                    {{ monthlyAnalytics.studentInteractions }}
                  </div>
                  <div class="card-label">TASKS<br />COMPLETED</div>
                </div>
              </div>
            </div>

            <!-- Bar Chart Visualization -->
            <div class="chart-section">
              <h3 class="chart-title">Monthly Overview</h3>

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
                  <!-- Accuracy Bar -->
                  <div class="bar-group" style="animation-delay: 0.1s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-blue"
                        :style="{
                          height: Math.max(monthlyAnalytics.averageAccuracy, 5) + '%',
                        }"
                      >
                        <span class="bar-value"
                          >{{ monthlyAnalytics.averageAccuracy }}%</span
                        >
                      </div>
                    </div>
                    <div class="bar-label">Accuracy</div>
                  </div>

                  <!-- Enrolled Bar -->
                  <div class="bar-group" style="animation-delay: 0.2s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-green"
                        :style="{
                          height:
                            Math.max(Math.min(monthlyAnalytics.studentsAdded, 100), 5) +
                            '%',
                        }"
                      >
                        <span class="bar-value">{{
                          monthlyAnalytics.studentsAdded
                        }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Enrolled</div>
                  </div>

                  <!-- Tasks Bar -->
                  <div class="bar-group" style="animation-delay: 0.3s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-orange"
                        :style="{
                          height:
                            Math.max(Math.min(monthlyAnalytics.tasksCreated, 100), 5) +
                            '%',
                        }"
                      >
                        <span class="bar-value">{{ monthlyAnalytics.tasksCreated }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Tasks</div>
                  </div>

                  <!-- Completed Bar -->
                  <div class="bar-group" style="animation-delay: 0.4s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-purple"
                        :style="{
                          height:
                            Math.max(
                              Math.min(monthlyAnalytics.studentInteractions, 100),
                              5
                            ) + '%',
                        }"
                      >
                        <span class="bar-value">{{
                          monthlyAnalytics.studentInteractions
                        }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Completed</div>
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

// Monthly analytics state
const selectedMonth = ref(new Date().getMonth() + 1); // 1-12
const selectedYear = ref(new Date().getFullYear());
const monthlyAnalytics = ref({
  averageAccuracy: 0,
  studentsAdded: 0,
  tasksCreated: 0,
  studentInteractions: 0,
});

// Get classroom ID from route params
const classroomId = computed(() => route.params.id);

// Display current month
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

      // Fetch monthly analytics
      await loadMonthlyAnalytics();
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

// Load monthly analytics
const loadMonthlyAnalytics = async () => {
  try {
    console.log(`📊 Loading analytics for ${selectedMonth.value}/${selectedYear.value}`);

    const result = await getClassroomMonthlyAnalytics(
      classroomId.value,
      profile.value.id,
      selectedMonth.value,
      selectedYear.value
    );

    if (result) {
      monthlyAnalytics.value = {
        averageAccuracy: result.averageAccuracy || 0,
        studentsAdded: result.studentsAdded || 0,
        tasksCreated: result.tasksCreated || 0,
        studentInteractions: result.studentInteractions || 0,
      };

      console.log("✅ Monthly analytics loaded:", monthlyAnalytics.value);
    }
  } catch (error) {
    console.error("Error loading monthly analytics:", error);
  }
};

// Month navigation
const previousMonth = () => {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12;
    selectedYear.value--;
  } else {
    selectedMonth.value--;
  }
  loadMonthlyAnalytics();
};

const nextMonth = () => {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1;
    selectedYear.value++;
  } else {
    selectedMonth.value++;
  }
  loadMonthlyAnalytics();
};

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
  grid-template-columns: repeat(4, 1fr);
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

.bar-green {
  background: linear-gradient(to top, #5fb878, #88c999, #a8e6b8);
  box-shadow: 0 4px 12px rgba(95, 184, 120, 0.3);
}

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

.bar-green:hover {
  box-shadow: 0 8px 20px rgba(95, 184, 120, 0.4);
}

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
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
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
}
</style>
