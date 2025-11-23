<template>
  <Transition name="modal-fade" appear>
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <Transition name="modal-scale" appear>
        <div v-if="isOpen" class="modal-card" @click.stop>
          <!-- Header with NEW ANNOUNCEMENT badge -->
          <div class="modal-header">
            <div class="new-announcement-badge">
              <span class="badge-text">NEW ANNOUNCEMENT</span>
            </div>
          </div>

          <!-- Form Section -->
          <div class="form-section">
            <!-- Title Field -->
            <div class="form-field">
              <label class="field-label">TITLE</label>
              <input
                type="text"
                placeholder="Enter announcement title"
                class="form-input"
                v-model="announcementData.title"
              />
            </div>

            <!-- Content Field -->
            <div class="form-field">
              <label class="field-label">WRITE</label>
              <textarea
                placeholder="Write your announcement here..."
                class="form-textarea"
                v-model="announcementData.content"
                rows="6"
              ></textarea>
            </div>

            <!-- Priority Field -->
            <div class="form-field">
              <label class="field-label">PRIORITY</label>
              <select v-model="announcementData.priority" class="form-input">
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <!-- Visibility Field -->
            <div class="form-field">
              <label class="field-label">VISIBILITY</label>
              <select v-model="announcementData.visibility" class="form-input">
                <option value="all">All Students</option>
                <option value="selected">Selected Students</option>
              </select>
            </div>

            <!-- Student Selection (shown when visibility is 'selected') -->
            <div
              v-if="announcementData.visibility === 'selected'"
              class="student-selection-section"
            >
              <div class="section-header">
                <h4 class="section-title">SELECT STUDENTS</h4>
              </div>

              <div class="students-list">
                <div
                  v-for="student in availableStudents"
                  :key="student.id"
                  class="student-item"
                  @click="playClick('teacher'); toggleStudent(student)"
                >
                  <div class="student-info">
                    <div class="student-avatar">
                      <img
                        :src="
                          student.avatar ||
                          '@/img/CapyBuddy Assets/Class/profile-user.png'
                        "
                        alt="Student"
                        class="avatar-img"
                      />
                    </div>
                    <span class="student-name">{{ student.name }}</span>
                  </div>
                  <div class="student-selection">
                    <div
                      class="selection-circle"
                      :class="{ selected: isStudentSelected(student.id) }"
                    >
                      <div v-if="isStudentSelected(student.id)" class="check-mark">✓</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Schedule Field -->
            <div class="form-field">
              <label class="field-label">SCHEDULE</label>
              <div class="schedule-options">
                <label class="radio-option">
                  <input
                    type="radio"
                    value="now"
                    v-model="announcementData.schedule"
                    class="radio-input"
                  />
                  <span class="radio-label">Post Now</span>
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    value="later"
                    v-model="announcementData.schedule"
                    class="radio-input"
                  />
                  <span class="radio-label">Schedule Later</span>
                </label>
              </div>
            </div>

            <!-- Date Time Field (shown when schedule is 'later') -->
            <div v-if="announcementData.schedule === 'later'" class="datetime-fields">
              <div class="form-field">
                <label class="field-label">DATE</label>
                <input
                  type="date"
                  class="form-input"
                  v-model="announcementData.scheduledDate"
                />
              </div>
              <div class="form-field">
                <label class="field-label">TIME</label>
                <input
                  type="time"
                  class="form-input"
                  v-model="announcementData.scheduledTime"
                />
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button class="back-btn" @click="playClick('teacher'); closeModal()">
              <span class="btn-text">BACK</span>
            </button>
            <button
              class="save-btn"
              @click="playClick('teacher'); saveAnnouncement()"
              :disabled="!isFormValid"
              :class="{ disabled: !isFormValid }"
            >
              <span class="btn-text">SAVE</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { TeacherService } from "@/services/teacherService.js";
import { useAuth } from "@/composables/services";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  classId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close", "save"]);

// Use auth composable to get teacher ID
const { profile, isAuthenticated, initialize: initAuth } = useAuth();

// Reactive data
const announcementData = ref({
  title: "",
  content: "",
  priority: "normal",
  visibility: "all",
  schedule: "now",
  scheduledDate: "",
  scheduledTime: "",
});

const availableStudents = ref([]);
const selectedStudents = ref([]);
const loading = ref(false);

// Watch for modal open/close for audio
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    console.log("🎵 Starting menu music for NewAnnouncementModal...");
    startMusic(MUSIC_TYPES.MENU, 0.3);
  } else {
    console.log("🔇 Stopping menu music for NewAnnouncementModal...");
    stopMusic();
  }
});

// Load students when modal opens
const loadStudents = async () => {
  try {
    loading.value = true;
    console.log("📚 Loading students for classroom:", props.classId);

    // Initialize auth first
    await initAuth();

    if (!isAuthenticated.value || !profile.value) {
      console.error("❌ Teacher not authenticated");
      initializeMockData();
      return;
    }

    console.log("👤 Authenticated teacher:", {
      id: profile.value.id,
      name: profile.value.full_name,
      type: profile.value.user_type,
    });

    // Get students in this classroom
    const result = await TeacherService.getClassroomStudents(
      props.classId,
      profile.value.id
    );

    if (result.success) {
      availableStudents.value = result.data
        .filter((student) => !student.hasProfileIssue) // Only include students with valid profiles
        .map((student) => ({
          id: student.studentProfile?.id || student.student_id,
          name:
            student.studentProfile?.full_name || student.full_name || "Unknown Student",
          avatar: student.studentProfile?.avatar_url || null,
        }));
      console.log("✅ Loaded students:", availableStudents.value);
    } else {
      console.error("❌ Failed to load students:", result.error);
      // Fallback to mock data for development
      initializeMockData();
    }
  } catch (error) {
    console.error("❌ Error loading students:", error);
    initializeMockData();
  } finally {
    loading.value = false;
  }
};

// Mock data for students (fallback)
const initializeMockData = () => {
  availableStudents.value = [
    {
      id: 1,
      name: "KYLENE ANGELA M. ROCALES",
      avatar: null,
    },
    {
      id: 2,
      name: "JOSE MARIA DELA CRUZ",
      avatar: null,
    },
    {
      id: 3,
      name: "SOFIA ELENA MARTINEZ",
      avatar: null,
    },
    {
      id: 4,
      name: "GABRIEL ANTONIO REYES",
      avatar: null,
    },
    {
      id: 5,
      name: "ISABELLA MARIE SANTOS",
      avatar: null,
    },
  ];
};

// Computed properties
const isFormValid = computed(() => {
  const basic =
    announcementData.value.title.trim() !== "" &&
    announcementData.value.content.trim() !== "";

  if (announcementData.value.schedule === "later") {
    return (
      basic &&
      announcementData.value.scheduledDate !== "" &&
      announcementData.value.scheduledTime !== ""
    );
  }

  if (announcementData.value.visibility === "selected") {
    return basic && selectedStudents.value.length > 0;
  }

  return basic;
});

// Methods
const toggleStudent = (student) => {
  const index = selectedStudents.value.findIndex((s) => s.id === student.id);
  if (index > -1) {
    selectedStudents.value.splice(index, 1);
  } else {
    selectedStudents.value.push(student);
  }
};

const isStudentSelected = (studentId) => {
  return selectedStudents.value.some((student) => student.id === studentId);
};

const resetForm = () => {
  announcementData.value = {
    title: "",
    content: "",
    priority: "normal",
    visibility: "all",
    schedule: "now",
    scheduledDate: "",
    scheduledTime: "",
  };
  selectedStudents.value = [];
};

const closeModal = () => {
  playClick('teacher'); // 🎵 Play click sound
  stopMusic(); // 🔇 Stop menu music
  resetForm();
  emit("close");
};

const saveAnnouncement = async () => {
  playClick('teacher');
  
  if (!isFormValid.value) {
    return;
  }

  try {
    loading.value = true;
    console.log("💾 Saving announcement...", announcementData.value);

    // Initialize auth first
    await initAuth();

    if (!isAuthenticated.value || !profile.value) {
      console.error("❌ Teacher not authenticated");
      if (window.$toast) {
        window.$toast.error("Please log in to create announcements.");
      }
      return;
    }

    console.log("👤 Teacher ID:", profile.value.id);

    const announcementPayload = {
      classId: props.classId,
      title: announcementData.value.title.trim(),
      content: announcementData.value.content.trim(),
      priority: announcementData.value.priority,
      visibility: announcementData.value.visibility,
      targetStudents:
        announcementData.value.visibility === "selected"
          ? selectedStudents.value.map((s) => s.id)
          : null,
      schedule: announcementData.value.schedule,
      scheduledDate:
        announcementData.value.schedule === "later"
          ? announcementData.value.scheduledDate
          : null,
      scheduledTime:
        announcementData.value.schedule === "later"
          ? announcementData.value.scheduledTime
          : null,
    };

    console.log("📤 Announcement payload:", announcementPayload);

    // Create announcement using TeacherService with proper teacher ID
    const result = await TeacherService.createAnnouncement(
      profile.value.id,
      announcementPayload
    );

    if (result.success) {
      console.log("✅ Announcement created successfully:", result.data);

      // Emit save event with announcement data
      emit("save", {
        ...result.data,
        authorName: profile.value.full_name || "Teacher",
      });

      // Show success toast
      if (window.$toast) {
        window.$toast.success("Announcement created successfully!");
      }

      // Close modal after successful save
      closeModal();
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("❌ Error saving announcement:", error);

    // Show error toast
    if (window.$toast) {
      window.$toast.error("Failed to create announcement. Please try again.");
    }
  } finally {
    loading.value = false;
  }
};

// Watch for modal open/close to reset state
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      loadStudents();
      resetForm();
    }
  }
);

// Initialize on mount
onMounted(() => {
  if (props.isOpen) {
    loadStudents();
  }
});

// Cleanup on unmount
onBeforeUnmount(() => {
  console.log("🔇 NewAnnouncementModal unmounting - stopping music...");
  stopMusic();
});
</script>

<style scoped>
/* Modal Overlay - Full Screen Backdrop */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  box-sizing: border-box;
}

/* Modal Card - Compact Design */
.modal-card {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 20px;
  gap: 18px;
  box-sizing: border-box;
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: center;
  margin-bottom: 5px;
}

.new-announcement-badge {
  background: #17a2b8;
  color: white;
  padding: 12px 20px;
  border-radius: 25px;
  display: inline-block;
}

.badge-text {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Form Section */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  overflow-y: auto;
  padding-right: 5px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 11px;
  font-weight: 700;
  color: #2c3e50;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  background: #f9f9f9;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #17a2b8;
  background: white;
  box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

/* Schedule Options */
.schedule-options {
  display: flex;
  gap: 20px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-input {
  margin: 0;
  accent-color: #17a2b8;
}

.radio-label {
  font-size: 13px;
  color: #2c3e50;
  cursor: pointer;
}

/* DateTime Fields */
.datetime-fields {
  display: flex;
  gap: 12px;
}

.datetime-fields .form-field {
  flex: 1;
}

/* Student Selection Section */
.student-selection-section {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
  background: #f8f9fa;
}

.section-header {
  margin-bottom: 10px;
}

.section-title {
  margin: 0;
  color: #2c3e50;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.students-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
}

.student-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  background: white;
}

.student-item:hover {
  background: #e8f4fd;
  border-color: #17a2b8;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.student-avatar {
  width: 28px;
  height: 28px;
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

.student-name {
  font-size: 11px;
  font-weight: 500;
  color: #2c3e50;
  line-height: 1.2;
}

.student-selection {
  flex-shrink: 0;
}

.selection-circle {
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: white;
}

.selection-circle.selected {
  background: #17a2b8;
  border-color: #17a2b8;
}

.check-mark {
  color: white;
  font-size: 10px;
  font-weight: 700;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.back-btn,
.save-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.back-btn {
  background: #95a5a6;
  color: white;
}

.back-btn:hover {
  background: #7f8c8d;
  transform: translateY(-1px);
}

.save-btn {
  background: #17a2b8;
  color: white;
}

.save-btn:hover:not(.disabled) {
  background: #138496;
  transform: translateY(-1px);
}

.save-btn.disabled {
  background: #cccccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-text {
  display: block;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-card {
    max-width: 100%;
    max-height: 90vh;
    padding: 15px;
    gap: 15px;
  }

  .datetime-fields {
    flex-direction: column;
    gap: 8px;
  }

  .schedule-options {
    flex-direction: column;
    gap: 10px;
  }

  .students-list {
    max-height: 120px;
  }
}

@media (max-width: 480px) {
  .modal-card {
    padding: 12px;
    gap: 12px;
  }

  .badge-text {
    font-size: 12px;
  }
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

.modal-overlay {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: 2000;
}
</style>
