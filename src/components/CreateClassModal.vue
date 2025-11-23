<template>
  <Transition name="modal-fade" appear>
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <Transition name="modal-scale" appear>
        <div v-if="isOpen" class="modal-card" @click.stop>
          <!-- Header with NEW CLASS badge -->
          <div class="modal-header">
            <div class="new-class-badge">
              <span class="badge-text">NEW CLASS</span>
            </div>
          </div>

          <!-- Form Fields -->
          <div class="form-fields">
            <div class="form-field">
              <input
                type="text"
                placeholder="NAME"
                class="form-input"
                v-model="formData.name"
                @input="validateForm"
              />
            </div>

            <div class="form-field">
              <input
                type="text"
                placeholder="SECTION / CLASS CODE"
                class="form-input"
                v-model="formData.section"
                @input="validateForm"
              />
            </div>

            <div class="form-field">
              <input
                type="text"
                placeholder="S.Y"
                class="form-input"
                v-model="formData.schoolYear"
                @input="validateForm"
              />
            </div>
          </div>

          <!-- Add Students Section -->
          <div class="students-section">
            <div class="section-header">
              <h3 class="section-title">ADD STUDENTS</h3>
            </div>

            <!-- Search Bar -->
            <div class="search-container">
              <div class="search-input-wrapper">
                <input
                  type="text"
                  placeholder="SEARCH"
                  class="search-input"
                  v-model="searchQuery"
                  @input="filterStudents"
                />
                <ion-icon :icon="searchOutline" class="search-icon"></ion-icon>
              </div>
            </div>

            <!-- Suggested Students -->
            <div class="suggested-section">
              <div class="section-header">
                <h4 class="suggested-title">SUGGESTED</h4>
              </div>

              <!-- Loading State -->
              <div v-if="isLoadingStudents" class="loading-state">
                <p>Loading students...</p>
              </div>

              <!-- Students List -->
              <TransitionGroup
                v-else
                name="list-item"
                tag="div"
                class="suggested-students-list"
              >
                <div
                  v-for="student in filteredStudents"
                  :key="student.id"
                  class="suggested-student-item"
                  :class="{ selected: isStudentSelected(student.id) }"
                  @click="
                    playClick('teacher');
                    toggleStudent(student);
                  "
                >
                  <div class="student-info">
                    <div class="student-avatar">
                      <img
                        v-if="student.avatar"
                        :src="student.avatar"
                        alt="Student Avatar"
                        class="avatar-img"
                      />
                      <ion-icon
                        v-else
                        :icon="personOutline"
                        class="avatar-icon"
                      ></ion-icon>
                    </div>
                    <span class="student-name">{{
                      student.name || student.full_name || "No Name"
                    }}</span>
                  </div>
                  <div class="student-selection">
                    <div
                      class="selection-circle"
                      :class="{ selected: isStudentSelected(student.id) }"
                    >
                      <div class="check-mark">
                        {{ isStudentSelected(student.id) ? "✓" : "+" }}
                      </div>
                    </div>
                  </div>
                </div>
              </TransitionGroup>

              <!-- Empty state for suggested students -->
              <Transition name="fade">
                <div
                  v-if="!isLoadingStudents && filteredStudents.length === 0"
                  class="empty-state"
                >
                  <p v-if="searchQuery">
                    No suggested students found matching "{{ searchQuery }}"
                  </p>
                  <p v-else>No suggested students available</p>
                </div>
              </Transition>
            </div>

            <!-- Selected Students Counter -->
            <div v-if="selectedStudents.length > 0" class="selected-counter">
              <span class="counter-text"
                >{{ selectedStudents.length }} student(s) selected</span
              >
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button
              class="back-btn"
              @click="
                playClick('teacher');
                closeModal();
              "
            >
              <span class="btn-text">BACK</span>
            </button>
            <button
              class="save-btn"
              @click="
                playClick('teacher');
                saveClass();
              "
              :disabled="isSaveDisabled"
              :class="{ disabled: isSaveDisabled }"
            >
              <span class="btn-text">
                {{ authLoading ? "AUTHENTICATING..." : "SAVE" }}
              </span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { IonIcon } from "@ionic/vue";
import { searchOutline, personOutline } from "ionicons/icons";
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { useAuth, useTeacher } from "@/composables/services";
import TeacherService from "@/services/teacherService";
import supabase from "@/supabase";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  teacherName: {
    type: String,
    default: "Mr. Verstappen",
  },
});

const emit = defineEmits(["close", "save"]);

// Get auth and teacher composables
const {
  profile,
  isAuthenticated,
  isLoading: authLoading,
  initialize: initAuth,
} = useAuth();
const { getTeacherClasses } = useTeacher();
const { startMusic, stopMusic, playClick } = useAudio();

// Form data - mapped to database fields
const formData = ref({
  name: "", // maps to 'name' in classrooms table
  section: "", // maps to 'class_code' in classrooms table
  schoolYear: "", // maps to 'school_year' in classrooms table
});

// Students data
const allStudents = ref([]);
const filteredStudents = ref([]);
const selectedStudents = ref([]);
const searchQuery = ref("");
const isLoadingStudents = ref(false);
const maxSuggestedStudents = 25;

// Form validation
const isFormValid = computed(() => {
  return (
    formData.value.name.trim() !== "" &&
    formData.value.section.trim() !== "" &&
    formData.value.schoolYear.trim() !== ""
  );
});

// Check if save button should be disabled
const isSaveDisabled = computed(() => {
  return !isFormValid.value || authLoading.value || !isAuthenticated.value;
});

// Fetch all students from backend
const fetchAllStudents = async () => {
  try {
    isLoadingStudents.value = true;
    console.log("🔍 Fetching available students for classroom creation...");

    // Try using the TeacherService method first
    const teacherResult = await TeacherService.getAvailableStudents();

    if (teacherResult.success) {
      console.log("✅ Using TeacherService - Students found:", teacherResult.data);

      // TeacherService already returns properly formatted data with 'name' field
      allStudents.value =
        teacherResult.data?.map((student) => {
          const mappedStudent = {
            id: student.id,
            name: student.name || "Unknown Student", // TeacherService returns 'name' field
            email: student.email,
            avatar: student.avatar, // TeacherService returns 'avatar' field
            gradeLevel: student.gradeLevel,
            userType: student.userType,
            isActive: student.isActive,
          };
          console.log("📝 Mapped student:", mappedStudent);
          return mappedStudent;
        }) || [];

      console.log("📊 All mapped students:", allStudents.value);
    } else {
      console.log("⚠️ TeacherService failed, trying direct query...");

      // Fallback to direct query
      const { data: allProfiles, error: allError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, grade_level, user_type, is_active")
        .eq("user_type", "student")
        .order("full_name", { ascending: true });

      console.log("📊 All student profiles from database:", allProfiles);
      console.log("📊 Error (if any):", allError);

      allStudents.value = (allProfiles || []).map((student) => ({
        id: student.id,
        name: student.full_name || "Unknown Student",
        email: student.email,
        avatar: student.avatar_url,
        gradeLevel: student.grade_level,
        userType: student.user_type,
        isActive: student.is_active,
      }));
    }

    console.log(`✅ Final result: ${allStudents.value.length} students loaded`);
    console.log("📋 Sample student data:", allStudents.value[0]);

    // Initially show first 25 students as suggested
    updateFilteredStudents();
    console.log(`📊 Filtered students count: ${filteredStudents.value.length}`);
    console.log("📋 Sample filtered student:", filteredStudents.value[0]);
  } catch (error) {
    console.error("Error fetching students:", error);
    if (window.$toast) {
      window.$toast.error("Failed to load students. Please try again.");
    }
  } finally {
    isLoadingStudents.value = false;
  }
};

// Update filtered students with search and limit
const updateFilteredStudents = () => {
  let filtered = [...allStudents.value];

  // Apply search filter if query exists
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
    );
  }

  // Limit to maxSuggestedStudents for better performance
  filteredStudents.value = filtered.slice(0, maxSuggestedStudents);
};

// Filter students based on search
const filterStudents = () => {
  updateFilteredStudents();
};

// Toggle student selection
const toggleStudent = (student) => {
  playClick("teacher");
  const index = selectedStudents.value.findIndex((s) => s.id === student.id);
  if (index > -1) {
    selectedStudents.value.splice(index, 1);
  } else {
    selectedStudents.value.push(student);
  }
};

// Check if student is selected
const isStudentSelected = (studentId) => {
  return selectedStudents.value.some((student) => student.id === studentId);
};

// Form validation
const validateForm = () => {
  // Form validation is handled by the computed property isFormValid
};

// Close modal
const closeModal = () => {
  stopMusic(); // 🔇 Stop menu music

  // Reset form data
  formData.value = {
    name: "",
    section: "",
    schoolYear: "",
  };
  selectedStudents.value = [];
  searchQuery.value = "";
  updateFilteredStudents(); // Reset to show first 25 students

  emit("close");
};

// Save class
const saveClass = async () => {
  playClick("teacher");

  if (!isFormValid.value) {
    console.error("❌ Form validation failed - missing required fields");
    if (window.$toast) {
      window.$toast.error("Please fill in all required fields");
    }
    return;
  }

  // Check if auth is still loading
  if (authLoading.value) {
    console.log("⏳ Authentication still loading, please wait...");
    if (window.$toast) {
      window.$toast.warning("Please wait for authentication to complete");
    }
    return;
  }

  if (!isAuthenticated.value || !profile.value?.id) {
    console.error("❌ No teacher profile found - user not authenticated");
    console.log("🔍 Auth status:", {
      isAuthenticated: isAuthenticated.value,
      profile: profile.value,
    });
    if (window.$toast) {
      window.$toast.error("Authentication error. Please log in again.");
    }
    return;
  }

  try {
    console.log("💾 Creating new classroom...");

    // Prepare classroom data with correct field mapping
    const classroomData = {
      name: formData.value.name.trim(),
      classCode: formData.value.section.trim(), // section maps to class_code
      schoolYear: formData.value.schoolYear.trim(), // schoolYear maps to school_year
      description: `${formData.value.name} - ${formData.value.section}`,
      gradeLevel: null, // Can be added later
      subject: null, // Can be added later
      maxStudents: 50, // Default value
    };

    // Create classroom using TeacherService
    const createResult = await TeacherService.createClassroom(
      profile.value.id,
      classroomData
    );

    if (!createResult.success) {
      throw new Error(createResult.error || "Failed to create classroom");
    }

    console.log("✅ Classroom created successfully:", createResult.data);
    const newClassroom = createResult.data;

    // Add selected students to the classroom if any
    if (selectedStudents.value.length > 0) {
      console.log(`👥 Adding ${selectedStudents.value.length} students to classroom...`);

      const studentIds = selectedStudents.value.map((student) => student.id);
      const addStudentsResult = await TeacherService.addStudentsToClassroom(
        newClassroom.id,
        studentIds,
        profile.value.id
      );

      if (addStudentsResult.success) {
        console.log(
          `✅ Successfully added ${addStudentsResult.addedCount} students to classroom`
        );
      } else {
        console.warn(`⚠️ Failed to add some students: ${addStudentsResult.error}`);
        // Don't fail the entire operation, just warn
        if (window.$toast) {
          window.$toast.warning(
            `Class created, but failed to add some students: ${addStudentsResult.error}`
          );
        }
      }
    }

    // Emit save event with created classroom data
    emit("save", {
      ...newClassroom,
      students: selectedStudents.value,
      studentsAdded: selectedStudents.value.length,
    });

    // Show success toast
    if (window.$toast) {
      const message =
        selectedStudents.value.length > 0
          ? `Class created successfully with ${selectedStudents.value.length} students!`
          : "Class created successfully!";
      window.$toast.success(message);
    }

    // Refresh teacher classes data
    await getTeacherClasses();

    // Close modal after successful save
    closeModal();
  } catch (error) {
    console.error("❌ Error saving class:", error);

    // Show error toast
    if (window.$toast) {
      window.$toast.error(error.message || "Failed to create class. Please try again.");
    }
  }
};

// Watch for modal open/close to fetch students
watch(
  () => props.isOpen,
  async (newValue) => {
    if (newValue) {
      console.log("🔍 Modal opened - initializing auth and fetching data...");

      // Initialize authentication if needed
      if (!isAuthenticated.value) {
        console.log("� Initializing authentication...");
        await initAuth();
      }

      console.log("🔍 Auth status after init:", {
        isAuthenticated: isAuthenticated.value,
        profile: profile.value,
        isLoading: authLoading.value,
      });

      fetchAllStudents();
    }
  }
);

// Initialize on mount
onMounted(async () => {
  console.log("🎵 Starting menu music for CreateClassModal...");
  startMusic(MUSIC_TYPES.MENU, 0.3);

  console.log("🚀 CreateClassModal mounted - Initializing authentication...");

  // Always initialize authentication on mount
  await initAuth();

  console.log("🚀 Auth initialized - Status:", {
    isAuthenticated: isAuthenticated.value,
    profile: profile.value,
    isLoading: authLoading.value,
  });

  if (props.isOpen) {
    fetchAllStudents();
  }
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping menu music for CreateClassModal...");
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
  max-width: 420px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 20px;
  gap: 20px;
  box-sizing: border-box;
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.new-class-badge {
  background: #4caf50;
  color: white;
  padding: 12px 30px;
  border-radius: 25px;
  display: inline-block;
}

.badge-text {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Form Fields */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-field {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: #f9f9f9;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #4caf50;
  background: white;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.form-input::placeholder {
  color: #999;
  font-weight: 400;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

/* Students Section */
.students-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-header {
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  color: #2c3e50;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Search Container */
.search-container {
  margin-bottom: 15px;
}

.search-input-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 10px 35px 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 12px;
  background: #f9f9f9;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #4caf50;
  background: white;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.search-input::placeholder {
  color: #999;
  font-weight: 400;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  width: 14px;
  height: 14px;
}

/* Suggested Section */
.suggested-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: 240px;
  min-height: 0;
}

.suggested-title {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Students List */
.suggested-students-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  max-height: 200px;
  padding-right: 5px;
}

.suggested-student-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e8f4fd;
  background: #f8fcff;
}

.suggested-student-item:hover {
  background: #e8f4fd;
  border-color: #17a2b8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.suggested-student-item.selected {
  background: #e8f5e9;
  border-color: #4caf50;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.student-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4a90e2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  font-size: 16px;
  color: white;
}

.student-name {
  font-size: 12px;
  font-weight: 500;
  color: #2c3e50;
  line-height: 1.2;
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  color: #666;
  flex: 1;
}

.loading-state p {
  margin: 0;
  font-size: 12px;
}

.student-selection {
  flex-shrink: 0;
}

.selection-circle {
  width: 20px;
  height: 20px;
  border: 2px solid #17a2b8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: white;
}

.suggested-student-item.selected .selection-circle {
  background: #4caf50;
  border-color: #4caf50;
}

.check-mark {
  color: #17a2b8;
  font-size: 12px;
  font-weight: 700;
}

.suggested-student-item.selected .check-mark {
  color: white;
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  color: #666;
  flex: 1;
}

.empty-state p {
  margin: 0;
  font-size: 12px;
}

/* Selected Counter */
.selected-counter {
  padding: 8px 12px;
  background: #e8f5e9;
  border: 1px solid #4caf50;
  border-radius: 8px;
  text-align: center;
  margin-top: 10px;
}

.counter-text {
  font-size: 12px;
  font-weight: 600;
  color: #2e7d32;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
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
  background: #4caf50;
  color: white;
}

.save-btn:hover:not(.disabled) {
  background: #45a049;
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

  .suggested-students-list {
    max-height: 150px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .modal-card {
    padding: 12px;
    gap: 12px;
  }

  .new-class-badge {
    padding: 10px 25px;
  }

  .badge-text {
    font-size: 12px;
  }
}

/* Animation Styles */

/* Modal Fade Animation - Backdrop only fades */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Modal Scale Animation - Content scales and fades */
.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  transform: scale(0.7) translateY(-50px);
  opacity: 0;
}

/* List Item Animations */
.list-item-enter-active {
  transition: all 0.4s ease-out;
}

.list-item-leave-active {
  transition: all 0.2s ease-in;
}

.list-item-enter-from {
  opacity: 0;
  transform: translateX(-30px) scale(0.9);
}

.list-item-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

.list-item-move {
  transition: transform 0.4s ease-in-out;
}

/* Fade Animation for Empty States */
.fade-enter-active {
  transition: all 0.3s ease-out;
}

.fade-leave-active {
  transition: all 0.2s ease-in;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.98);
}

/* Selection Circle Animation */
.selection-circle {
  transition: all 0.3s ease;
}

.suggested-student-item:hover .selection-circle {
  transform: scale(1.1);
  border-width: 3px;
}

.modal-overlay {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: 2000;
}
</style>
