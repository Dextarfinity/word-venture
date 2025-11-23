<template>
  <Transition name="modal-fade" appear>
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <Transition name="modal-scale" appear>
        <div v-if="isOpen" class="modal-card" @click.stop>
      <!-- Header with NEW TASK badge -->
      <div class="modal-header">
        <div class="new-task-badge">
          <span class="badge-text">NEW TASK</span>
        </div>
      </div>

      <!-- Category Selection -->
      <div class="category-section">
        <div class="category-label">CATEGORY</div>
        <div class="category-dropdown-container">
          <select v-model="selectedCategory" class="category-dropdown" @change="onCategoryChange">
            <option value="">SELECT---</option>
            <option 
              v-for="category in availableCategories" 
              :key="category.value" 
              :value="category.value"
              :disabled="category.disabled"
            >
              {{ category.label }}{{ category.disabled ? ' (Not available - reading level too low)' : '' }}
            </option>
          </select>
        </div>
        <div v-if="classroomReadingInfo.maxLevel" class="reading-level-info">
          <p class="level-info-text">
            Classroom highest reading level: <strong>{{ getReadingLevelName(classroomReadingInfo.maxLevel) }}</strong>
          </p>
          <p v-if="classroomReadingInfo.minLevel === 1" class="warning-text">
            ⚠️ Warning: Classroom has non-readers. Consider their reading abilities when creating tasks.
          </p>
        </div>
      </div>

      <!-- Task Details Section (shown when category is selected) -->
      <div v-if="selectedCategory" class="task-details-section">
        <div class="form-field">
          <label class="field-label">TASK TITLE</label>
          <input
            type="text"
            placeholder="Enter task title"
            class="form-input"
            v-model="taskData.title"
          />
        </div>

        <div class="form-field">
          <label class="field-label">DUE DATE</label>
          <input
            type="date"
            class="form-input"
            v-model="taskData.dueDate"
          />
        </div>

        <div class="form-field">
          <label class="field-label">PRIORITY</label>
          <select v-model="taskData.priority" class="form-input">
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <div class="form-field">
          <label class="field-label">INSTRUCTIONS</label>
          <textarea
            placeholder="Enter task instructions"
            class="form-textarea"
            v-model="taskData.instructions"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="back-btn" @click="playClick('teacher'); closeModal()">
          <span class="btn-text">BACK</span>
        </button>
        <button
          class="next-btn"
          @click="playClick('teacher'); saveTask()"
          :disabled="!isFormValid || isLoading"
          :class="{ disabled: !isFormValid || isLoading }"
        >
          <span class="btn-text">{{ isLoading ? 'SAVING...' : (selectedCategory ? 'SAVE' : 'NEXT') }}</span>
        </button>
      </div>
        </div>
      </Transition>

      <!-- Test Generation Modal -->
    <TestGenerationModal
      :is-open="showGenerationModal"
      :test-type="selectedCategory"
      :subcategory="selectedCategory"
      :task-data="taskData"
      @close="closeGenerationModal"
      @generate="handleGenerateTest"
      @manual="handleManualTest"
    />

    <!-- Manual Test Creation Modal -->
    <ManualTestCreationModal
      :is-open="showManualTestModal"
      :test-type="selectedCategory"
      :subcategory="selectedCategory"
      :task-data="taskData"
      @close="closeManualTestModal"
      @save="handleManualTestSave"
    />
    </div>
  </Transition>
</template>

<script setup>
import { IonIcon } from "@ionic/vue";
import { 
  documentTextOutline, 
  bookOutline, 
  volumeHighOutline, 
  eyeOffOutline, 
  libraryOutline 
} from "ionicons/icons";
import { ref, computed, watch, onBeforeUnmount } from "vue";
import TestGenerationModal from "@/components/TestGenerationModal.vue";
import ManualTestCreationModal from "@/components/ManualTestCreationModal.vue";
import { TeacherService } from "@/services/teacherService.js";
import { AuthService } from "@/services/authService.js";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  classroomId: {
    type: [String, Number],
    required: true,
  },
  teacherId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["close", "save"]);

// Reactive data
const selectedCategory = ref("");
const showGenerationModal = ref(false);
const showManualTestModal = ref(false);
const isLoading = ref(false);
const currentUser = ref(null);

// Reading level management
const classroomReadingInfo = ref({
  maxLevel: null,
  minLevel: null,
  studentCount: 0
});

const availableCategories = ref([]);

// Watch for modal open/close for audio
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    console.log("🎵 Starting menu music for NewTaskModal...");
    startMusic(MUSIC_TYPES.MENU, 0.3);
  } else {
    console.log("🔇 Stopping menu music for NewTaskModal...");
    stopMusic();
  }
});

const taskData = ref({
  title: "",
  dueDate: "",
  priority: "medium",
  instructions: "",
  generationMode: "manual",
  testContent: null,
  testSettings: null,
});

// Computed properties
const isFormValid = computed(() => {
  if (!selectedCategory.value || isLoading.value) return false;
  return (
    taskData.value.title.trim() !== "" &&
    taskData.value.dueDate !== "" &&
    taskData.value.instructions.trim() !== ""
  );
});

// Methods
// Helper functions for reading levels
const getReadingLevelName = (level) => {
  const levelMap = {
    1: 'Non-Reader',
    2: 'Frustration', 
    3: 'Instructional',
    4: 'Independent'
  };
  return levelMap[level] || 'Non-Reader';
};

const getTestRequirements = () => {
  return {
    'cvc': { requiredLevel: 2, name: 'CVC Test' },
    'phonics-merger': { requiredLevel: 2, name: 'Phonics Merger Test' },
    'blending': { requiredLevel: 3, name: 'Blending Test' },
    'silent-words': { requiredLevel: 4, name: 'Silent Words Test' },
    'comprehensive': { requiredLevel: 4, name: 'Comprehensive Test' }
  };
};

const onCategoryChange = () => {
  resetTaskData();
  
  // Set default task title based on category selection
  const categoryLabels = {
    "phonics-merger": "Phonics Merger Test",
    "cvc": "CVC Test", 
    "blending": "Blending Test",
    "silent-words": "Silent Words Test",
    "comprehensive": "Comprehensive Test"
  };
  
  if (selectedCategory.value) {
    taskData.value.title = categoryLabels[selectedCategory.value] || "Test";
    
    // Show generation modal for non-comprehensive tests
    if (selectedCategory.value !== "comprehensive") {
      showGenerationModal.value = true;
    }
  }
};

const resetTaskData = () => {
  taskData.value = {
    title: "",
    dueDate: "",
    priority: "medium",
    instructions: "",
    generationMode: "manual",
    testContent: null,
    testSettings: null,
  };
};

const closeModal = () => {
  playClick('teacher'); // 🎵 Play click sound
  stopMusic(); // 🔇 Stop menu music
  
  // Reset all form data
  selectedCategory.value = "";
  showGenerationModal.value = false;
  showManualTestModal.value = false;
  resetTaskData();
  
  emit("close");
};

const closeGenerationModal = () => {
  showGenerationModal.value = false;
};

const handleGenerateTest = (generationData) => {
  console.log("Generating test:", generationData);
  // Here you would typically call an API to generate the test
  // For now, we'll just proceed to show the task details form
  showGenerationModal.value = false;
  
  // Add generation mode to task data
  taskData.value.generationMode = "auto_generated";
  taskData.value.testContent = {
    type: generationData.testType,
    subcategory: generationData.subcategory,
    generated: true,
    timestamp: new Date().toISOString()
  };
  taskData.value.instructions = `Auto-generated ${generationData.subcategory} test questions will be created.`;
};

const handleManualTest = (manualData) => {
  console.log("Opening manual test creation:", manualData);
  // Close generation modal and show manual test creation modal
  showGenerationModal.value = false;
  showManualTestModal.value = true;
};

const closeManualTestModal = () => {
  showManualTestModal.value = false;
};

const handleManualTestSave = (testData) => {
  console.log("Manual test saved:", testData);
  
  // Update task data with the manual test content
  taskData.value.generationMode = "manual";
  taskData.value.testContent = testData.content || {};
  taskData.value.testSettings = testData.settings || {};
  
  // Create descriptive instructions based on test content
  const contentKeys = Object.keys(testData.content || {});
  const itemCount = contentKeys.length;
  const testTypeLabel = testData.testTypeLabel || getCategoryLabel(selectedCategory.value);
  
  taskData.value.instructions = `Manual ${testTypeLabel}: ${itemCount} items configured`;
  
  // Close the manual test modal - task details will now be visible
  showManualTestModal.value = false;
};

// Fetch classroom students' reading levels
const fetchClassroomReadingLevels = async () => {
  if (!props.classroomId) {
    console.warn('No classroom ID provided');
    setDefaultCategories();
    return;
  }

  try {
    console.log('🔍 Fetching reading levels for classroom:', props.classroomId);
    
    const students = await TeacherService.getClassroomStudents(props.classroomId, getTeacherId());
    
    if (students.success && students.data.length > 0) {
      // Get all reading levels
      const readingLevels = students.data.map(student => 
        student.current_reading_level || 1
      );
      
      const maxLevel = Math.max(...readingLevels);
      const minLevel = Math.min(...readingLevels);
      
      classroomReadingInfo.value = {
        maxLevel,
        minLevel,
        studentCount: students.data.length
      };
      
      console.log('📊 Classroom reading levels:', {
        maxLevel,
        minLevel,
        studentCount: students.data.length,
        levels: readingLevels
      });
      
      updateAvailableCategories(maxLevel);
    } else {
      console.warn('No students found in classroom');
      setDefaultCategories();
    }
  } catch (error) {
    console.error('Error fetching classroom reading levels:', error);
    setDefaultCategories();
  }
};

// Update available categories based on highest reading level
const updateAvailableCategories = (maxLevel) => {
  const categories = [];
  
  // Add categories based on highest reading level in classroom
  if (maxLevel >= 2) {
    categories.push(
      { value: 'cvc', label: 'CVC Test', disabled: false },
      { value: 'phonics-merger', label: 'Phonics Merger Test', disabled: false }
    );
  }
  
  if (maxLevel >= 3) {
    categories.push(
      { value: 'blending', label: 'Blending Test', disabled: false }
    );
  }
  
  if (maxLevel >= 4) {
    categories.push(
      { value: 'silent-words', label: 'Silent Words Test', disabled: false },
      { value: 'comprehensive', label: 'Comprehensive Test', disabled: false }
    );
  }
  
  // Add disabled options to show what's not available
  if (maxLevel < 2) {
    categories.push(
      { value: 'cvc', label: 'CVC Test', disabled: true },
      { value: 'phonics-merger', label: 'Phonics Merger Test', disabled: true },
      { value: 'blending', label: 'Blending Test', disabled: true },
      { value: 'silent-words', label: 'Silent Words Test', disabled: true },
      { value: 'comprehensive', label: 'Comprehensive Test', disabled: true }
    );
  } else if (maxLevel < 3) {
    categories.push(
      { value: 'blending', label: 'Blending Test', disabled: true },
      { value: 'silent-words', label: 'Silent Words Test', disabled: true },
      { value: 'comprehensive', label: 'Comprehensive Test', disabled: true }
    );
  } else if (maxLevel < 4) {
    categories.push(
      { value: 'silent-words', label: 'Silent Words Test', disabled: true },
      { value: 'comprehensive', label: 'Comprehensive Test', disabled: true }
    );
  }
  
  availableCategories.value = categories;
  console.log('📋 Available categories updated:', categories);
};

// Set default categories when no reading level data is available
const setDefaultCategories = () => {
  availableCategories.value = [
    { value: 'cvc', label: 'CVC Test', disabled: false },
    { value: 'phonics-merger', label: 'Phonics Merger Test', disabled: false },
    { value: 'blending', label: 'Blending Test', disabled: false },
    { value: 'silent-words', label: 'Silent Words Test', disabled: false },
    { value: 'comprehensive', label: 'Comprehensive Test', disabled: false }
  ];
};

// Helper to get teacher ID
const getTeacherId = () => {
  return props.teacherId || currentUser.value?.id;
};

const saveTask = async () => {
  playClick('teacher');
  
  if (!isFormValid.value) {
    return;
  }

  isLoading.value = true;

  try {
    // Validate required props
    if (!props.classroomId) {
      throw new Error('Classroom ID is required to create a task');
    }
    
    console.log('🔍 NewTaskModal: Checking teacher ID...', { 
      propsTeacherId: props.teacherId,
      currentUserValue: currentUser.value?.id 
    });
    
    let teacherId = props.teacherId;
    if (!teacherId) {
      console.log('⚠️ NewTaskModal: No teacherId prop, attempting to get from session...');
      const session = await AuthService.getCurrentSession();
      if (!session?.user) {
        console.error('❌ NewTaskModal: No authenticated user found in session');
        throw new Error('No authenticated user found. Please log in again.');
      }
      teacherId = session.user.id;
      console.log('✅ NewTaskModal: Got teacher ID from session:', teacherId);
    } else {
      console.log('✅ NewTaskModal: Using teacher ID from props:', teacherId);
    }

    // Prepare task data according to database schema
    const newTaskData = {
      title: taskData.value.title.trim(),
      description: taskData.value.instructions.trim(),
      category: selectedCategory.value,
      subcategory: selectedCategory.value, // Using same value for now
      priority: taskData.value.priority,
      dueDate: taskData.value.dueDate ? new Date(taskData.value.dueDate).toISOString() : null,
      instructions: taskData.value.instructions.trim(),
      maxPoints: 100, // Default value
      generationMode: taskData.value.generationMode || 'manual',
      testContent: taskData.value.testContent,
      testSettings: taskData.value.testSettings,
      classroomId: props.classroomId,
      assignToAll: true, // Default to assign to all students in classroom
    };

    console.log('Creating task with data:', newTaskData);
    console.log('📦 TeacherService object:', TeacherService);
    console.log('📦 TeacherService.createTask function:', TeacherService.createTask);
    console.log('🚀 About to call TeacherService.createTask...');

    // Call TeacherService to create task
    const result = await TeacherService.createTask(teacherId, newTaskData);
    
    console.log('🎯 Returned from TeacherService.createTask');
    
    console.log('📊 TeacherService.createTask result:', result);
    console.log('📊 Result success:', result.success);
    console.log('📊 Result error:', result.error);
    console.log('📊 Result data:', result.data);

    if (result.success) {
      console.log('✅ Task created successfully:', result.data);
      
      // Emit save event with created task data
      emit('save', result.data);
      
      // Show success toast
      if (window.$toast) {
        window.$toast.success('Task Created!', `${taskData.value.title} has been successfully created.`);
      }
      
      // Close modal after successful save
      closeModal();
    } else {
      console.error('❌ Task creation failed with error:', result.error);
      throw new Error(result.error || 'Failed to create task');
    }
  } catch (error) {
    console.error('Error saving task:', error);
    // Show error toast
    if (window.$toast) {
      window.$toast.error('Task Creation Failed', error.message || 'Please try again.');
    }
  } finally {
    isLoading.value = false;
  }
};

const getCategoryLabel = (categoryValue) => {
  const labels = {
    "phonics-merger": "Phonics Merger Test",
    "cvc": "CVC Test",
    "blending": "Blending Test",
    "silent-words": "Silent Words Test",
    "comprehensive": "Comprehensive Test",
  };
  return labels[categoryValue] || categoryValue;
};



// Method to initialize user data
const initializeUserData = async () => {
  try {
    if (!props.teacherId) {
      const session = await AuthService.getCurrentSession();
      if (session?.user) {
        currentUser.value = session.user;
      }
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }
};

// Watch for modal open/close to reset state
watch(
  () => props.isOpen,
  async (newValue) => {
    if (newValue) {
      console.log('🎯 NewTaskModal: Modal opened with props:', {
        classroomId: props.classroomId,
        teacherId: props.teacherId,
        isOpen: props.isOpen
      });
      
      // Reset form when modal opens
      selectedCategory.value = "";
      showGenerationModal.value = false;
      showManualTestModal.value = false;
      resetTaskData();
      
      // Fetch classroom reading levels to determine available test types
      await fetchClassroomReadingLevels();
      
      // Initialize user data
      await initializeUserData();
    }
  }
);

// Cleanup on unmount
onBeforeUnmount(() => {
  console.log("🔇 NewTaskModal unmounting - stopping music...");
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
  max-width: 480px;
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
  margin-bottom: 5px;
}

.new-task-badge {
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

/* Category Section */
.category-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-label {
  font-size: 12px;
  font-weight: 700;
  color: #2c3e50;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category-dropdown-container {
  position: relative;
}

.category-dropdown {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: #f9f9f9;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
  cursor: pointer;
}

.category-dropdown:focus {
  border-color: #4caf50;
  background: white;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.category-dropdown option:disabled {
  color: #999;
  background-color: #f5f5f5;
}

/* Reading Level Info */
.reading-level-info {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.level-info-text {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.warning-text {
  margin: 0;
  font-size: 13px;
  color: #ff9800;
  font-weight: 500;
}

/* Subcategory Section */
.subcategory-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subcategory-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.subcategory-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.subcategory-item:hover {
  border-color: #4caf50;
  background: #f0f8f0;
}

.subcategory-item.selected {
  border-color: #4caf50;
  background: #e8f5e8;
}

.subcategory-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #4caf50;
  border-radius: 8px;
  flex-shrink: 0;
}

.subcategory-icon .icon {
  color: white;
  width: 18px;
  height: 18px;
}

.subcategory-text {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

/* Task Details Section */
.task-details-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 300px;
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
  border-color: #4caf50;
  background: white;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 70px;
  font-family: inherit;
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
.next-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
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

.next-btn {
  background: #4caf50;
  color: white;
}

.next-btn:hover:not(.disabled) {
  background: #45a049;
  transform: translateY(-1px);
}

.next-btn.disabled {
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

  .subcategory-items {
    max-height: 150px;
  }

  .task-details-section {
    max-height: 200px;
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

  .subcategory-item {
    padding: 10px 12px;
  }

  .subcategory-icon {
    width: 28px;
    height: 28px;
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