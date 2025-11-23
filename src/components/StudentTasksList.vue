<template>
  <div class="student-tasks-container">
    <!-- Header -->
    <div class="tasks-header">
      <h2>My Tasks</h2>
      <div class="filter-tabs">
        <button
          v-for="status in statusFilters"
          :key="status.key"
          @click="playClick('student'); selectedStatus = status.key"
          class="filter-tab"
          :class="{ active: selectedStatus === status.key }"
        >
          {{ status.label }}
          <span class="count" v-if="getTaskCount(status.key)">{{
            getTaskCount(status.key)
          }}</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading your tasks...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="playClick('student'); loadTasks()" class="retry-btn">Try Again</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTasks.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <h3>{{ getEmptyMessage() }}</h3>
      <p>{{ getEmptyDescription() }}</p>
    </div>

    <!-- Tasks List -->
    <div v-else class="tasks-list">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="task-card"
        :class="getTaskCardClass(task)"
        @click="playClick('student'); handleTaskClick(task)"
      >
        <div class="task-header">
          <div class="task-title">
            <h3>{{ task.task.title }}</h3>
            <span class="task-category">{{ getCategoryLabel(task.task.category) }}</span>
          </div>
          <div class="task-status">
            <span class="status-badge" :class="getStatusClass(task)">
              {{ getStatusLabel(task) }}
            </span>
          </div>
        </div>

        <div class="task-details">
          <p class="task-description">
            {{ task.task.description || task.task.instructions }}
          </p>

          <div class="task-meta">
            <div class="meta-item" v-if="task.due_date">
              <span class="meta-label">Due:</span>
              <span class="meta-value" :class="{ overdue: isOverdue(task.due_date) }">
                {{ formatDate(task.due_date) }}
              </span>
            </div>
            <div class="meta-item" v-if="task.task.max_points">
              <span class="meta-label">Points:</span>
              <span class="meta-value">{{ task.task.max_points }}</span>
            </div>
            <div class="meta-item" v-if="getTaskProgress(task)">
              <span class="meta-label">Score:</span>
              <span class="meta-value score"
                >{{ getTaskProgress(task).score || 0 }}%</span
              >
            </div>
            <div class="meta-item" v-if="getTaskProgress(task)?.attempts">
              <span class="meta-label">Attempts:</span>
              <span class="meta-value">{{ getTaskProgress(task).attempts }}</span>
            </div>
          </div>

          <!-- Reading Level Compatibility -->
          <div class="level-compatibility" v-if="!isLevelCompatible(task)">
            <span class="incompatible-warning">
              ⚠️ This test requires reading level
              {{ getLevelRequirement(task.task.category) }}. Your current level is
              {{ currentReadingLevel }}.
            </span>
          </div>
        </div>

        <div class="task-actions">
          <button
            v-if="canTakeTest(task)"
            @click.stop="startTest(task)"
            class="action-btn primary"
            :disabled="isStartingTest"
          >
            {{ getActionButtonText(task) }}
          </button>
          <button
            v-else-if="!isLevelCompatible(task)"
            class="action-btn disabled"
            disabled
          >
            Level Required: {{ getLevelRequirement(task.task.category) }}
          </button>
          <button
            v-else-if="getTaskProgress(task)?.status === 'completed'"
            @click.stop="viewResults(task)"
            class="action-btn secondary"
          >
            View Results
          </button>
        </div>
      </div>
    </div>

    <!-- Test Taking Modal -->
    <Teleport to="body">
      <transition name="modal-fade" appear>
        <div v-if="showTestModal" class="modal-overlay" @click="closeTestModal">
          <transition name="modal-scale" appear>
            <div v-if="showTestModal" class="modal-container" @click.stop>
          <StudentTestTaking
            :assignment-id="selectedTask?.id"
            :is-open="showTestModal"
            @close="closeTestModal"
            @completed="handleTestCompleted"
          />
        </div>
          </transition>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { StudentService } from "@/services/studentService.js";
import { AuthService } from "@/services/authService.js";
import StudentTestTaking from "@/components/StudentTestTaking.vue";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

const props = defineProps({
  refreshTrigger: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["testCompleted"]);
const { startMusic, stopMusic, playClick } = useAudio();

// Reactive data
const tasks = ref([]);
const isLoading = ref(true);
const error = ref(null);
const selectedStatus = ref("all");
const currentUser = ref(null);
const currentReadingLevel = ref(1);
const showTestModal = ref(false);
const selectedTask = ref(null);
const isStartingTest = ref(false);

// Status filters
const statusFilters = [
  { key: "all", label: "All Tasks" },
  { key: "assigned", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
];

// Reading level requirements
const levelRequirements = {
  cvc: "1-4",
  "phonics-merger": "2-4",
  blending: "3-4",
  "silent-words": "4",
  comprehensive: "1-4",
};

// Computed properties
const filteredTasks = computed(() => {
  if (selectedStatus.value === "all") return tasks.value;

  return tasks.value.filter((task) => {
    const progress = getTaskProgress(task);
    const status = progress?.status || "assigned";

    if (selectedStatus.value === "overdue") {
      return isOverdue(task.due_date) && status !== "completed";
    }

    return status === selectedStatus.value;
  });
});

// Methods
const loadTasks = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    // Get current user
    const session = await AuthService.getCurrentSession();
    if (!session?.user) {
      throw new Error("You must be logged in to view tasks");
    }
    currentUser.value = session.user;

    // Get user's reading level
    const profile = await AuthService.getUserProfile(session.user.id);
    if (profile.success && profile.data.user_stats?.[0]) {
      currentReadingLevel.value = profile.data.user_stats[0].current_reading_level || 1;
    }

    // Load student tasks
    const result = await StudentService.getStudentTasks(session.user.id);

    if (!result.success) {
      throw new Error(result.error);
    }

    tasks.value = result.data || [];
  } catch (err) {
    console.error("Error loading tasks:", err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const getTaskCount = (status) => {
  if (status === "all") return tasks.value.length;

  return tasks.value.filter((task) => {
    const progress = getTaskProgress(task);
    const taskStatus = progress?.status || "assigned";

    if (status === "overdue") {
      return isOverdue(task.due_date) && taskStatus !== "completed";
    }

    return taskStatus === status;
  }).length;
};

const getTaskProgress = (task) => {
  return task.student_task_progress?.[0] || null;
};

const getStatusLabel = (task) => {
  const progress = getTaskProgress(task);
  const status = progress?.status || "assigned";

  if (isOverdue(task.due_date) && status !== "completed") {
    return "Overdue";
  }

  const labels = {
    assigned: "To Do",
    in_progress: "In Progress",
    completed: "Completed",
  };

  return labels[status] || status;
};

const getStatusClass = (task) => {
  const progress = getTaskProgress(task);
  const status = progress?.status || "assigned";

  if (isOverdue(task.due_date) && status !== "completed") {
    return "overdue";
  }

  return status.replace("_", "-");
};

const getTaskCardClass = (task) => {
  const classes = [];

  if (!isLevelCompatible(task)) {
    classes.push("level-incompatible");
  }

  if (isOverdue(task.due_date) && getTaskProgress(task)?.status !== "completed") {
    classes.push("overdue");
  }

  return classes.join(" ");
};

const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

const isLevelCompatible = (task) => {
  const category = task.task.category;
  const requirements = {
    cvc: { min: 1, max: 4 },
    "phonics-merger": { min: 2, max: 4 },
    blending: { min: 3, max: 4 },
    "silent-words": { min: 4, max: 4 },
    comprehensive: { min: 1, max: 4 },
  };

  const req = requirements[category];
  if (!req) return true;

  return currentReadingLevel.value >= req.min && currentReadingLevel.value <= req.max;
};

const getLevelRequirement = (category) => {
  return levelRequirements[category] || "1-4";
};

const canTakeTest = (task) => {
  const progress = getTaskProgress(task);
  return isLevelCompatible(task) && (!progress || progress.status !== "completed");
};

const getActionButtonText = (task) => {
  const progress = getTaskProgress(task);

  if (!progress || progress.status === "assigned") {
    return "Start Test";
  } else if (progress.status === "in_progress") {
    return "Continue Test";
  }

  return "Retake Test";
};

const handleTaskClick = (task) => {
  if (canTakeTest(task)) {
    startTest(task);
  }
};

const startTest = async (task) => {
  try {
    playClick('student');
    isStartingTest.value = true;
    selectedTask.value = task;
    showTestModal.value = true;
  } catch (err) {
    console.error("Error starting test:", err);
    if (window.$toast) {
      window.$toast.error("Failed to start test", err.message);
    }
  } finally {
    isStartingTest.value = false;
  }
};

const closeTestModal = () => {
  showTestModal.value = false;
  selectedTask.value = null;
};

const handleTestCompleted = (results) => {
  console.log("Test completed:", results);

  if (window.$toast) {
    window.$toast.success(
      "Test Completed!",
      `You scored ${results.score}% with ${results.correctAnswers}/${results.totalQuestions} correct answers.`
    );
  }

  // Refresh tasks to show updated status
  loadTasks();

  // Emit to parent component
  emit("testCompleted", results);

  closeTestModal();
};

const viewResults = (task) => {
  playClick('student');
  const progress = getTaskProgress(task);

  if (window.$toast) {
    window.$toast.info(
      "Test Results",
      `Score: ${progress.score || 0}% | Attempts: ${progress.attempts || 1}`
    );
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const getCategoryLabel = (category) => {
  const labels = {
    cvc: "CVC Words",
    "phonics-merger": "Phonics Merger",
    blending: "Blending",
    "silent-words": "Silent Words",
    comprehensive: "Comprehensive",
  };
  return labels[category] || category;
};

const getEmptyMessage = () => {
  const messages = {
    all: "No tasks assigned yet",
    assigned: "No pending tasks",
    in_progress: "No tests in progress",
    completed: "No completed tasks",
    overdue: "No overdue tasks",
  };
  return messages[selectedStatus.value] || "No tasks found";
};

const getEmptyDescription = () => {
  const descriptions = {
    all: "Your teacher hasn't assigned any tasks yet. Check back later!",
    assigned: "Great job! You've started all your assigned tasks.",
    in_progress: "No tests are currently in progress.",
    completed: "Complete some tasks to see your results here.",
    overdue: "You're all caught up! No overdue tasks.",
  };
  return descriptions[selectedStatus.value] || "Tasks will appear here when available.";
};

// Watchers
watch(
  () => props.refreshTrigger,
  () => {
    loadTasks();
  }
);

// Lifecycle
onMounted(() => {
  console.log("🎵 Starting menu music for StudentTasksList...");
  startMusic(MUSIC_TYPES.MENU, 0.3);
  loadTasks();
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping menu music for StudentTasksList...");
  stopMusic();
});
</script>

<style scoped>
.student-tasks-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.tasks-header {
  margin-bottom: 30px;
}

.tasks-header h2 {
  margin: 0 0 20px;
  color: #2c3e50;
  font-size: 28px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.filter-tab:hover {
  border-color: #4caf50;
  background: #f0f8f0;
}

.filter-tab.active {
  border-color: #4caf50;
  background: #4caf50;
  color: white;
}

.count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.filter-tab.active .count {
  background: rgba(255, 255, 255, 0.3);
}

/* Loading and Error States */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-icon,
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 10px 20px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
}

/* Tasks List */
.tasks-list {
  display: grid;
  gap: 20px;
}

.task-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.task-card:hover {
  border-color: #4caf50;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.task-card.level-incompatible {
  border-color: #ff9800;
  background: #fff8e1;
}

.task-card.overdue {
  border-color: #f44336;
  background: #ffebee;
}

/* Task Header */
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.task-title h3 {
  margin: 0 0 4px;
  color: #2c3e50;
  font-size: 18px;
}

.task-category {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.assigned {
  background: #e3f2fd;
  color: #1976d2;
}

.status-badge.in-progress {
  background: #fff3e0;
  color: #f57c00;
}

.status-badge.completed {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-badge.overdue {
  background: #ffebee;
  color: #c62828;
}

/* Task Details */
.task-details {
  margin-bottom: 16px;
}

.task-description {
  color: #666;
  margin: 0 0 12px;
  line-height: 1.5;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.meta-label {
  color: #666;
  font-weight: 500;
}

.meta-value {
  color: #2c3e50;
  font-weight: 600;
}

.meta-value.overdue {
  color: #f44336;
}

.meta-value.score {
  color: #4caf50;
}

/* Level Compatibility Warning */
.level-compatibility {
  margin-top: 12px;
}

.incompatible-warning {
  background: #fff3e0;
  color: #f57c00;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  display: block;
}

/* Task Actions */
.task-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.primary {
  background: #4caf50;
  color: white;
}

.action-btn.primary:hover {
  background: #45a049;
}

.action-btn.secondary {
  background: #2196f3;
  color: white;
}

.action-btn.secondary:hover {
  background: #1976d2;
}

.action-btn.disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
}

/* Modal */
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

.modal-container {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

/* Responsive Design */
@media (max-width: 768px) {
  .student-tasks-container {
    padding: 16px;
  }

  .task-header {
    flex-direction: column;
    gap: 12px;
  }

  .task-meta {
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    font-size: 12px;
    padding: 6px 12px;
  }

  .filter-tabs {
    flex-direction: column;
  }

  .filter-tab {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .tasks-header h2 {
    font-size: 24px;
  }

  .task-card {
    padding: 16px;
  }

  .task-title h3 {
    font-size: 16px;
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
</style>
