<template>
  <Transition name="modal-fade" appear>
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <Transition name="modal-scale" appear>
        <div v-if="isOpen" class="modal-card" @click.stop>
          <!-- Header with Class Name -->
          <div class="modal-header">
            <div class="class-name-header">
              <span class="class-name-text">{{ className }} - {{ sectionName }}</span>
            </div>
          </div>

          <!-- Search Section -->
          <div class="search-section">
            <div class="search-container">
              <input
                type="text"
                placeholder="SEARCH STUDENTS IN DATABASE"
                class="search-input"
                v-model="searchQuery"
                @input="handleSearchInput"
              />
              <ion-icon :icon="searchOutline" class="search-icon"></ion-icon>
            </div>

            <button class="add-student-btn" @click="playClick('teacher'); showAddStudent()">ADD STUDENT</button>
          </div>

          <!-- Available Students for Adding (shown when add student is clicked) -->
          <Transition name="slide-down">
            <div v-if="showAddStudentSection" class="add-student-section">
              <TransitionGroup name="list-item" tag="div" class="available-students-list">
                <div
                  v-for="student in availableStudents"
                  :key="student.id"
                  class="available-student-item"
                  @click="playClick('teacher'); addStudent(student)"
                >
                  <div class="student-info">
                    <div class="student-avatar">
                      <ion-icon :icon="personOutline" class="avatar-icon"></ion-icon>
                    </div>
                    <span class="student-name">{{ student.name }}</span>
                  </div>
                  <div class="add-circle">
                    <div class="plus-icon">+</div>
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </Transition>

          <!-- Search Results / Suggested Students Section -->
          <div class="suggested-section">
            <div class="section-header">
              <h4 class="suggested-title">{{ searchQuery ? 'SEARCH RESULTS' : 'SUGGESTED' }}</h4>
            </div>

            <!-- Loading indicator for search -->
            <div v-if="isSearching" class="loading-state">
              <div class="loading-spinner"></div>
              <p>Searching students...</p>
            </div>

            <!-- Search results or suggested students -->
            <TransitionGroup 
              v-else-if="displayedSuggestedStudents.length > 0" 
              name="list-item" 
              tag="div" 
              class="suggested-students-list"
            >
              <div
                v-for="student in displayedSuggestedStudents"
                :key="student.id"
                class="suggested-student-item"
                @click="playClick('teacher'); addStudent(student)"
              >
                <div class="student-info">
                  <div class="student-avatar">
                    <ion-icon :icon="personOutline" class="avatar-icon"></ion-icon>
                  </div>
                  <div class="student-details">
                    <span class="student-name">{{ student.name }}</span>
                    <span v-if="searchQuery" class="student-id">ID: {{ student.user_id || 'No ID' }}</span>
                    <span class="student-level">{{ student.level_name }}</span>
                  </div>
                </div>
                <div class="student-selection">
                  <div class="selection-circle">
                    <div class="check-mark">+</div>
                  </div>
                </div>
              </div>
            </TransitionGroup>

            <!-- Empty state -->
            <Transition name="fade">
              <div
                v-if="!isSearching && displayedSuggestedStudents.length === 0"
                class="empty-state"
              >
                <p v-if="searchQuery">
                  No students found matching "{{ searchQuery }}"
                </p>
                <p v-else-if="!searchQuery">Type to search for students in the database</p>
                <p v-else>No students available</p>
              </div>
            </Transition>
          </div>

          <!-- Enrolled Students Section -->
          <div class="enrolled-section">
            <div class="section-header">
              <h3 class="section-title">STUDENTS ENROLLED</h3>
            </div>

            <!-- Loading State -->
            <div v-if="isLoadingEnrolled" class="loading-state">
              <p>Loading enrolled students...</p>
            </div>

            <!-- Students List -->
            <TransitionGroup
              v-else
              name="list-item"
              tag="div"
              class="enrolled-students-list"
            >
              <div
                v-for="student in filteredEnrolledStudents"
                :key="student.id"
                class="enrolled-student-item"
              >
                <div class="student-info">
                  <div class="student-avatar">
                    <ion-icon :icon="personOutline" class="avatar-icon"></ion-icon>
                  </div>
                  <div class="student-details">
                    <span
                      class="student-name"
                      :class="{ 'missing-student-name': student.isMissing }"
                    >
                      {{ student.name }}
                      <span v-if="student.isMissing" class="missing-indicator"
                        >(Profile Missing)</span
                      >
                    </span>
                  </div>
                </div>

                <div class="student-actions">
                  <div class="level-badge">
                    <span class="level-text">{{
                      student.level_name || "NON-READER"
                    }}</span>
                  </div>
                  <button class="delete-btn" @click="playClick('teacher'); removeStudent(student.id)">
                    <ion-icon :icon="trashOutline" class="delete-icon"></ion-icon>
                  </button>
                </div>
              </div>
            </TransitionGroup>

            <!-- Empty state for enrolled students -->
            <Transition name="fade">
              <div
                v-if="!isLoadingEnrolled && filteredEnrolledStudents.length === 0"
                class="empty-state"
              >
                <p v-if="searchQuery">No students found matching "{{ searchQuery }}"</p>
                <p v-else>No students enrolled in this class</p>
              </div>
            </Transition>
          </div>

          <!-- Action Button -->
          <div class="action-button">
            <button class="save-btn" @click="playClick('teacher'); saveChanges()">
              <span class="btn-text">SAVE</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { IonIcon } from "@ionic/vue";
import { searchOutline, addOutline, trashOutline, personOutline } from "ionicons/icons";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useAuth } from "@/composables/services";
import TeacherService from "@/services/teacherService";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  className: {
    type: String,
    default: "CLASS 2",
  },
  sectionName: {
    type: String,
    default: "MV33",
  },
  classId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close", "save", "studentsUpdated"]);

// Get auth composable
const { profile, isAuthenticated, initialize: initAuth } = useAuth();

// Watch for modal open/close for audio
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      console.log("🎵 Starting menu music for ClassroomInfoModal...");
      startMusic(MUSIC_TYPES.MENU, 0.3);
    } else {
      console.log("🔇 Stopping menu music for ClassroomInfoModal...");
      stopMusic();
    }
  }
);

// Reactive data
const searchQuery = ref("");
const showAddStudentSection = ref(false);
const enrolledStudents = ref([]);
const availableStudents = ref([]);
const suggestedStudents = ref([]);
const isLoadingEnrolled = ref(false);
const isLoadingSuggested = ref(false);
const isSearching = ref(false);
const searchResults = ref([]);
const searchTimeout = ref(null);

// Fetch enrolled students from backend
const fetchEnrolledStudents = async () => {
  try {
    isLoadingEnrolled.value = true;
    console.log(
      "🔍 ClassroomInfoModal: Fetching enrolled students for classroom:",
      props.classId
    );
    console.log("🔍 Auth status:", {
      isAuthenticated: isAuthenticated.value,
      profileId: profile.value?.id,
    });

    if (!profile.value?.id) {
      console.warn("⚠️ No teacher profile ID available");
      enrolledStudents.value = [];
      return;
    }

    const result = await TeacherService.getClassroomStudents(
      props.classId,
      profile.value.id
    );

    console.log("📊 TeacherService result:", result);

    if (result.success) {
      console.log("✅ Enrolled students raw data:", result.data);
      console.log("📊 Student count from service:", result.data?.length || 0);

      enrolledStudents.value = result.data || [];

      console.log("📋 Final enrolledStudents array:", enrolledStudents.value);
      console.log("📊 Final count:", enrolledStudents.value.length);
    } else {
      console.warn("⚠️ Failed to fetch enrolled students:", result.error);
      enrolledStudents.value = [];
    }
  } catch (error) {
    console.error("❌ Error fetching enrolled students:", error);
    enrolledStudents.value = [];
  } finally {
    isLoadingEnrolled.value = false;
  }
};

// Fetch available/suggested students from backend
const fetchSuggestedStudents = async () => {
  try {
    isLoadingSuggested.value = true;
    console.log("🔍 Fetching available students...");

    const result = await TeacherService.getAvailableStudents();

    if (result.success) {
      console.log("✅ Available students found:", result.data);

      // Get IDs of currently enrolled students
      const enrolledIds = enrolledStudents.value.map((s) => s.id);

      // Filter out already enrolled students
      const availableStudentsList = result.data.filter(
        (student) => !enrolledIds.includes(student.id)
      );

      // Split available students into suggested (first 10) and available (rest)
      suggestedStudents.value = availableStudentsList.slice(0, 10);
      availableStudents.value = availableStudentsList.slice(10);

      console.log(
        `📊 Found ${suggestedStudents.value.length} suggested and ${availableStudents.value.length} available students`
      );
    } else {
      console.warn("⚠️ Failed to fetch available students:", result.error);
      suggestedStudents.value = [];
      availableStudents.value = [];
    }
  } catch (error) {
    console.error("❌ Error fetching suggested students:", error);
    suggestedStudents.value = [];
    availableStudents.value = [];
  } finally {
    isLoadingSuggested.value = false;
  }
};

// Initialize data
const initializeData = async () => {
  if (!props.classId) {
    console.warn("No class ID provided");
    return;
  }

  if (!isAuthenticated.value) {
    console.warn("User not authenticated, waiting...");
    // Try to wait a bit for authentication to complete
    setTimeout(() => {
      if (isAuthenticated.value) {
        initializeData();
      }
    }, 1000);
    return;
  }

  console.log("🚀 Initializing ClassroomInfoModal data for class:", props.classId);
  await fetchEnrolledStudents();
  await fetchSuggestedStudents();
};

// Computed properties
const filteredEnrolledStudents = computed(() => {
  if (!searchQuery.value.trim()) {
    return enrolledStudents.value;
  }

  return enrolledStudents.value.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const displayedSuggestedStudents = computed(() => {
  return searchQuery.value.trim() ? searchResults.value : suggestedStudents.value;
});

// Database search methods
const performDatabaseSearch = async (query) => {
  if (!query.trim()) {
    searchResults.value = [];
    return;
  }

  try {
    isSearching.value = true;
    console.log('🔍 Searching database for:', query);

    // Search students in database using TeacherService
    const result = await TeacherService.searchStudents(query);

    if (result.success) {
      // Filter out already enrolled students
      const enrolledIds = enrolledStudents.value.map((s) => s.id);
      const availableResults = result.data.filter(
        (student) => !enrolledIds.includes(student.id)
      );
      
      searchResults.value = availableResults;
      console.log(`✅ Found ${availableResults.length} students matching "${query}"`);
    } else {
      console.warn('⚠️ Search failed:', result.error);
      searchResults.value = [];
    }
  } catch (error) {
    console.error('❌ Error searching students:', error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
};

const handleSearchInput = () => {
  // Clear existing timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // Debounce search to avoid too many database calls
  searchTimeout.value = setTimeout(() => {
    performDatabaseSearch(searchQuery.value);
  }, 500);
};

const filterStudents = () => {
  // Legacy method - now handled by handleSearchInput
};

const showAddStudent = () => {
  showAddStudentSection.value = !showAddStudentSection.value;
};

const addStudent = async (student) => {
  try {
    console.log("👥 Adding student to classroom:", student);

    // Add student to classroom using TeacherService
    const result = await TeacherService.addStudentsToClassroom(
      props.classId,
      [student.id],
      profile.value?.id
    );

    if (result.success) {
      // Add student to local enrolled list with reading level
      const newStudent = {
        ...student,
        classId: props.classId,
        status: "active",
        enrollment_date: new Date().toISOString(),
      };

      enrolledStudents.value.push(newStudent);

      // Remove from suggested/available students
      suggestedStudents.value = suggestedStudents.value.filter(
        (s) => s.id !== student.id
      );
      availableStudents.value = availableStudents.value.filter(
        (s) => s.id !== student.id
      );

      // Hide add student section
      showAddStudentSection.value = false;

      // Show success toast
      if (window.$toast) {
        window.$toast.success(`${student.name} added to class successfully!`);
      }

      console.log("✅ Student added successfully:", newStudent);
    } else {
      console.error("❌ Failed to add student:", result.error);
      if (window.$toast) {
        window.$toast.error(`Failed to add ${student.name}: ${result.error}`);
      }
    }
  } catch (error) {
    console.error("❌ Error adding student:", error);
    if (window.$toast) {
      window.$toast.error(`Error adding ${student.name}: ${error.message}`);
    }
  }
};

const addSuggestedStudent = async (student) => {
  try {
    console.log("👥 Adding suggested student to classroom:", student);

    // Add student to classroom using TeacherService
    const result = await TeacherService.addStudentsToClassroom(
      props.classId,
      [student.id],
      profile.value?.id
    );

    if (result.success) {
      // Add student to local enrolled list with reading level
      const newStudent = {
        ...student,
        classId: props.classId,
        status: "active",
        enrollment_date: new Date().toISOString(),
      };

      enrolledStudents.value.push(newStudent);

      // Remove from suggested students
      suggestedStudents.value = suggestedStudents.value.filter(
        (s) => s.id !== student.id
      );

      // Show success toast
      if (window.$toast) {
        window.$toast.success(`${student.name} added to class successfully!`);
      }

      console.log("✅ Suggested student added successfully:", newStudent);
    } else {
      console.error("❌ Failed to add suggested student:", result.error);
      if (window.$toast) {
        window.$toast.error(`Failed to add ${student.name}: ${result.error}`);
      }
    }
  } catch (error) {
    console.error("❌ Error adding suggested student:", error);
    if (window.$toast) {
      window.$toast.error(`Error adding ${student.name}: ${error.message}`);
    }
  }
};

const removeStudent = async (studentId) => {
  try {
    console.log("🗑️ Removing student from classroom:", studentId);

    if (!profile.value?.id) {
      console.warn("⚠️ No teacher profile ID available");
      return;
    }

    // Find the student to remove
    const studentToRemove = enrolledStudents.value.find((s) => s.id === studentId);

    if (!studentToRemove) {
      console.warn("Student not found in enrolled list");
      return;
    }

    // Remove student from classroom using TeacherService backend
    const result = await TeacherService.removeStudentFromClass(
      props.classId,
      studentToRemove.student_id || studentToRemove.id,
      profile.value.id
    );

    if (result.success) {
      console.log("✅ Student removed from database successfully");

      // Remove from enrolled students locally
      enrolledStudents.value = enrolledStudents.value.filter((s) => s.id !== studentId);

      // Add back to suggested students (if they have a valid profile)
      if (
        !studentToRemove.hasProfileIssue &&
        studentToRemove.name !== "Missing Profile"
      ) {
        // Check if student is not already in suggested list
        const isAlreadySuggested = suggestedStudents.value.some(
          (s) => s.id === (studentToRemove.student_id || studentToRemove.id)
        );

        if (!isAlreadySuggested && suggestedStudents.value.length < 10) {
          suggestedStudents.value.unshift({
            id: studentToRemove.student_id || studentToRemove.id,
            name: studentToRemove.name,
            email: studentToRemove.email,
            avatar: studentToRemove.avatar,
            gradeLevel: studentToRemove.gradeLevel,
            current_reading_level: studentToRemove.current_reading_level,
            level_name: studentToRemove.level_name,
            userType: studentToRemove.userType,
            isActive: studentToRemove.isActive,
          });
        }
      }

      // Emit update to parent
      emit("studentsUpdated", {
        enrolled: enrolledStudents.value,
        suggested: suggestedStudents.value,
      });

      // Show success toast
      if (window.$toast) {
        window.$toast.success(`${studentToRemove.name} removed from class successfully!`);
      }

      console.log("✅ Student removed successfully:", studentToRemove);
    } else {
      console.warn("⚠️ Failed to remove student from database:", result.error);
      alert(`Failed to remove student: ${result.error}`);
    }
  } catch (error) {
    console.error("❌ Error removing student:", error);
    alert(`Error removing student: ${error.message}`);
  }
};

const closeModal = () => {
  // Stop music when closing modal
  console.log("🔇 Stopping music on closeModal...");
  stopMusic();

  // Reset states
  searchQuery.value = "";
  showAddStudentSection.value = false;

  emit("close");
};

const saveChanges = () => {
  const classData = {
    classId: props.classId,
    enrolledStudents: enrolledStudents.value,
    totalStudents: enrolledStudents.value.length,
  };

  try {
    console.log("Saving class data:", classData);

    // Emit save event with updated data
    emit("save", classData);
    emit("studentsUpdated", enrolledStudents.value);

    // Close modal after successful save
    closeModal();
  } catch (error) {
    console.error("Error saving class data:", error);
  }
};

// Watch for modal open/close to initialize data
watch(
  () => props.isOpen,
  async (newValue) => {
    if (newValue) {
      console.log("🔓 ClassroomInfoModal opened, initializing auth and data...");
      // Ensure authentication is initialized
      if (!isAuthenticated.value) {
        await initAuth();
      }
      await initializeData();
    }
  }
);

// Initialize on mount if modal is already open
onMounted(async () => {
  console.log("🚀 ClassroomInfoModal mounted");
  if (!isAuthenticated.value) {
    await initAuth();
  }
  if (props.isOpen) {
    await initializeData();
  }
});

// Cleanup on unmount
onBeforeUnmount(() => {
  console.log("🔇 ClassroomInfoModal unmounting - stopping music...");
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
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  box-sizing: border-box;
}

/* Modal Card - Compact Design */
.modal-card {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 450px;
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

.class-name-header {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 12px 20px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.class-name-text {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  letter-spacing: 0.5px;
}

/* Search Section */
.search-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-container {
  flex: 1;
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

.add-student-btn {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.add-student-btn:hover {
  background: #138496;
  transform: translateY(-1px);
}

/* Add Student Section */
.add-student-section {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 10px;
}

.available-students-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.available-student-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  background: #fafafa;
}

.available-student-item:hover {
  background: #e8f5e8;
  border-color: #4caf50;
}

.add-circle {
  width: 24px;
  height: 24px;
  border: 2px solid #4caf50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  flex-shrink: 0;
}

.plus-icon {
  color: #4caf50;
  font-size: 14px;
  font-weight: 700;
}

/* Suggested Students Section */
.suggested-section {
  display: flex;
  flex-direction: column;
  max-height: 180px;
}

.suggested-title {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.suggested-students-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  max-height: 150px;
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

.selection-circle .check-mark {
  color: #17a2b8;
  font-size: 12px;
  font-weight: 700;
}

/* Enrolled Section */
.enrolled-section {
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

/* Students List */
.enrolled-students-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  padding-right: 5px;
}

.enrolled-student-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  background: #fafafa;
  transition: all 0.3s ease;
}

.enrolled-student-item:hover {
  background: #f0f0f0;
  border-color: #ddd;
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

.student-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-email {
  font-size: 10px;
  color: #666;
  font-weight: 400;
}

.student-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.level-badge {
  background: #ffc107;
  color: #212529;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.level-text {
  display: block;
}

.delete-btn {
  background: transparent;
  border: none;
  padding: 6px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  background: #fee;
}

.delete-icon {
  color: #dc3545;
  width: 16px;
  height: 16px;
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  text-align: center;
  color: #666;
  flex: 1;
}

.empty-state p {
  margin: 0;
  font-size: 12px;
}

/* Action Button */
.action-button {
  display: flex;
  justify-content: center;
  margin-top: 10px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.save-btn {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 12px 40px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 120px;
}

.save-btn:hover {
  background: #138496;
  transform: translateY(-1px);
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

  .search-section {
    flex-direction: column;
    gap: 8px;
  }

  .add-student-btn {
    width: 100%;
  }

  .enrolled-students-list {
    max-height: 200px;
  }

  .suggested-section {
    max-height: 120px;
  }

  .suggested-students-list {
    max-height: 100px;
  }
}

@media (max-width: 480px) {
  .modal-card {
    padding: 12px;
    gap: 12px;
  }

  .class-name-text {
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

/* Slide Down Animation for Add Student Section */
.slide-down-enter-active {
  transition: all 0.4s ease-out;
  transform-origin: top;
}

.slide-down-leave-active {
  transition: all 0.2s ease-in;
  transform-origin: top;
}

.slide-down-enter-from {
  opacity: 0;
  transform: scaleY(0) translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: scaleY(0) translateY(-5px);
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

/* Ease Animation for Empty States */
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

/* Enhanced Hover Animations */
.available-student-item,
.suggested-student-item,
.enrolled-student-item {
  transform: translateY(0);
  transition: all 0.3s ease-in-out;
}

.available-student-item:hover,
.suggested-student-item:hover,
.enrolled-student-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Button Animations */
.add-student-btn,
.save-btn {
  transition: all 0.3s ease-in-out;
}

.add-student-btn:hover,
.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.add-student-btn:active,
.save-btn:active {
  transform: translateY(0);
  transition: all 0.1s ease;
}

/* Delete Button Animation */
.delete-btn {
  transition: all 0.2s ease;
}

.delete-btn:hover {
  transform: scale(1.1);
}

/* Add Circle Animation */
.add-circle,
.selection-circle {
  transition: all 0.3s ease;
}

.available-student-item:hover .add-circle,
.suggested-student-item:hover .selection-circle {
  transform: scale(1.1);
  border-width: 3px;
}

/* Stagger Animation for Lists */
.list-item-enter-active {
  transition-delay: calc(var(--i, 0) * 0.05s);
}

/* Search Loading State */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #4f9eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Student Details for Search Results */
.student-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-id {
  font-size: 11px;
  color: #666;
  font-style: italic;
}

.student-level {
  font-size: 10px;
  color: #4f9eff;
  font-weight: 500;
}
</style>
