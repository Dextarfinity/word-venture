<template>
  <div class="test-taking-container">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading test...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Cannot Take Test</h3>
      <p>{{ error }}</p>
      <button @click="playClick('student'); $emit('close')" class="close-btn">Close</button>
    </div>

    <!-- Test Instructions -->
    <div v-else-if="!testStarted && testData" class="test-instructions">
      <div class="test-header">
        <h2>{{ testData.assignment.task.title }}</h2>
        <div class="test-info">
          <span class="test-category">{{
            getCategoryLabel(testData.assignment.task.category)
          }}</span>
          <span class="reading-level"
            >Your Level: {{ getReadingLevelName(testData.studentLevel) }}</span
          >
        </div>
      </div>

      <div class="instructions-content">
        <h3>Instructions:</h3>
        <p>{{ testData.assignment.task.instructions }}</p>

        <div class="test-details">
          <div class="detail-item">
            <strong>Questions:</strong> {{ testData.testQuestions.length }}
          </div>
          <div
            class="detail-item"
            v-if="testData.assignment.task.test_settings?.timeLimit"
          >
            <strong>Time Limit:</strong>
            {{ testData.assignment.task.test_settings.timeLimit }} minutes
          </div>
          <div class="detail-item">
            <strong>Max Points:</strong> {{ testData.assignment.task.max_points }}
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="playClick('student'); $emit('close')" class="cancel-btn">Cancel</button>
        <button @click="playClick('student'); startTest()" class="start-btn" :disabled="isStarting">
          {{ isStarting ? "Starting..." : "Start Test" }}
        </button>
      </div>
    </div>

    <!-- Test Questions -->
    <div v-else-if="testStarted && testData" class="test-questions">
      <div class="test-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width: `${(currentQuestionIndex / testData.testQuestions.length) * 100}%`,
            }"
          ></div>
        </div>
        <span class="progress-text">
          Question {{ currentQuestionIndex + 1 }} of {{ testData.testQuestions.length }}
        </span>
        <div class="timer" v-if="timeRemaining">⏰ {{ formatTime(timeRemaining) }}</div>
      </div>

      <div class="question-container" v-if="currentQuestion">
        <div class="question-content">
          <h3>{{ currentQuestion.question }}</h3>

          <!-- CVC Word Question -->
          <div v-if="currentQuestion.type === 'cvc'" class="cvc-question">
            <div class="word-display">{{ currentQuestion.word.toUpperCase() }}</div>
            <div class="options-grid">
              <button
                v-for="option in currentQuestion.options"
                :key="option"
                @click="playClick('student'); selectAnswer(option)"
                class="option-btn"
                :class="{ selected: selectedAnswer === option }"
              >
                {{ option.toUpperCase() }}
              </button>
            </div>
          </div>

          <!-- Phonics Question -->
          <div v-else-if="currentQuestion.type === 'phonics'" class="phonics-question">
            <div class="sound-display">{{ currentQuestion.sound }}</div>
            <button @click="playClick('student'); playSound()" class="play-sound-btn">🔊 Play Sound</button>
            <textarea
              v-model="selectedAnswer"
              placeholder="Type what you hear..."
              class="text-input"
              rows="2"
            ></textarea>
          </div>

          <!-- Blending Question -->
          <div v-else-if="currentQuestion.type === 'blending'" class="blending-question">
            <div class="segments-display">
              <span
                v-for="segment in currentQuestion.segments"
                :key="segment"
                class="segment"
              >
                {{ segment }}
              </span>
            </div>
            <input
              v-model="selectedAnswer"
              placeholder="Type the blended word..."
              class="text-input"
              type="text"
            />
          </div>

          <!-- Silent Words Question -->
          <div v-else-if="currentQuestion.type === 'silent'" class="silent-question">
            <div class="word-display silent">{{ currentQuestion.word }}</div>
            <p class="silent-instruction">Read this word silently, then type it below:</p>
            <input
              v-model="selectedAnswer"
              placeholder="Type the word..."
              class="text-input"
              type="text"
            />
          </div>

          <!-- Generic Question -->
          <div v-else class="generic-question">
            <input
              v-model="selectedAnswer"
              placeholder="Your answer..."
              class="text-input"
              type="text"
            />
          </div>
        </div>

        <div class="question-actions">
          <button
            @click="playClick('student'); previousQuestion()"
            class="nav-btn"
            :disabled="currentQuestionIndex === 0"
          >
            Previous
          </button>
          <button
            @click="playClick('student'); nextQuestion()"
            class="nav-btn primary"
            :disabled="!selectedAnswer"
          >
            {{
              currentQuestionIndex === testData.testQuestions.length - 1
                ? "Finish"
                : "Next"
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Test Completion -->
    <div v-else-if="testCompleted" class="test-completed">
      <div class="completion-icon">✅</div>
      <h2>Test Completed!</h2>
      <div class="results-summary">
        <div class="score-display">
          <span class="score">{{ finalScore }}%</span>
          <span class="score-label">Final Score</span>
        </div>
        <div class="stats">
          <div class="stat-item">
            <strong>Correct Answers:</strong> {{ correctAnswers }}/{{ totalQuestions }}
          </div>
          <div class="stat-item">
            <strong>Time Spent:</strong> {{ formatTime(timeSpent) }}
          </div>
        </div>
      </div>
      <button @click="playClick('student'); $emit('close')" class="close-btn">Close</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { StudentService } from "@/services/studentService.js";
import { useAuth } from "@/composables/services.js";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

const props = defineProps({
  assignmentId: {
    type: [String, Number],
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "completed"]);

// Use composables for authentication and routing
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const router = useRouter();
const { startMusic, stopMusic, playClick } = useAudio();

// Reactive data
const isLoading = ref(true);
const error = ref(null);
const testData = ref(null);
const testStarted = ref(false);
const testCompleted = ref(false);
const isStarting = ref(false);
const currentQuestionIndex = ref(0);
const selectedAnswer = ref("");
const answers = ref([]);
const startTime = ref(null);
const timeSpent = ref(0);
const timeRemaining = ref(null);
const timer = ref(null);

// Computed properties
const currentQuestion = computed(() => {
  if (!testData.value?.testQuestions) return null;
  return testData.value.testQuestions[currentQuestionIndex.value];
});

const finalScore = computed(() => {
  if (!answers.value.length) return 0;
  const correct = answers.value.filter((a) => a.isCorrect).length;
  return Math.round((correct / answers.value.length) * 100);
});

const correctAnswers = computed(() => {
  return answers.value.filter((a) => a.isCorrect).length;
});

const totalQuestions = computed(() => {
  return answers.value.length;
});

// Methods
const loadTestContent = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    // Ensure authentication is initialized
    await initAuth();

    // Check if user is authenticated
    if (!isAuthenticated.value || !profile.value) {
      throw new Error("You must be logged in to take tests");
    }

    console.log(
      "🔍 StudentTestTaking: Loading test content for assignment:",
      props.assignmentId,
      "student:",
      profile.value.id
    );

    // Load test content
    const result = await StudentService.getTestContent(
      props.assignmentId,
      profile.value.id
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    testData.value = result.data;
    console.log("✅ StudentTestTaking: Test content loaded successfully");
  } catch (err) {
    console.error("Error loading test content:", err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const startTest = async () => {
  try {
    isStarting.value = true;
    playClick('student');

    console.log("🚀 Starting test, navigating to WordReadingPage...");

    // Close the modal first
    emit("close");

    // Navigate to word reading page with assignment data
    await router.push({
      path: "/tabs/tab4",
      query: {
        assignmentId: props.assignmentId,
        taskTitle: testData.value.assignment.task.title,
        taskType: testData.value.assignment.task.task_type,
      },
    });
  } catch (err) {
    console.error("Error starting test:", err);
    error.value = err.message;
  } finally {
    isStarting.value = false;
  }
};

const startTimer = () => {
  timer.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;
    } else {
      // Time's up, auto-submit
      submitTest();
    }
  }, 1000);
};

const selectAnswer = (answer) => {
  playClick('student');
  selectedAnswer.value = answer;
};

const nextQuestion = () => {
  playClick('student');
  
  // Save current answer
  if (selectedAnswer.value) {
    const isCorrect = checkAnswer(currentQuestion.value, selectedAnswer.value);
    answers.value[currentQuestionIndex.value] = {
      questionId: currentQuestion.value.id,
      answer: selectedAnswer.value,
      isCorrect: isCorrect,
      timeSpent: 0, // Can be implemented if needed
    };
  }

  if (currentQuestionIndex.value < testData.value.testQuestions.length - 1) {
    currentQuestionIndex.value++;
    selectedAnswer.value = answers.value[currentQuestionIndex.value]?.answer || "";
  } else {
    // Last question, submit test
    submitTest();
  }
};

const previousQuestion = () => {
  playClick('student');
  
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
    selectedAnswer.value = answers.value[currentQuestionIndex.value]?.answer || "";
  }
};

const checkAnswer = (question, answer) => {
  if (!question || !answer) return false;

  const correctAnswer = question.correctAnswer?.toLowerCase() || "";
  const userAnswer = answer.toLowerCase();

  return userAnswer === correctAnswer;
};

const submitTest = async () => {
  try {
    if (timer.value) {
      clearInterval(timer.value);
    }

    timeSpent.value = Math.floor((Date.now() - startTime.value) / 1000);

    const testResults = {
      score: finalScore.value,
      timeSpent: timeSpent.value,
      answers: answers.value,
      category: testData.value.assignment.task.category,
    };

    const result = await StudentService.submitTest(
      props.assignmentId,
      profile.value.id,
      testResults
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    testCompleted.value = true;
    emit("completed", {
      score: finalScore.value,
      timeSpent: timeSpent.value,
      correctAnswers: correctAnswers.value,
      totalQuestions: totalQuestions.value,
    });
  } catch (err) {
    console.error("Error submitting test:", err);
    error.value = err.message;
  }
};

const playSound = () => {
  playClick('student');
  
  // Implement text-to-speech for phonics
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(currentQuestion.value.sound);
    utterance.rate = 0.7;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

const getReadingLevelName = (level) => {
  const levels = {
    1: "Non-Reader",
    2: "Frustration",
    3: "Instructional",
    4: "Independent",
  };
  return levels[level] || `Level ${level}`;
};

// Watchers
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      loadTestContent();
    } else {
      // Reset state when modal closes
      testStarted.value = false;
      testCompleted.value = false;
      currentQuestionIndex.value = 0;
      selectedAnswer.value = "";
      answers.value = [];
      error.value = null;
      if (timer.value) {
        clearInterval(timer.value);
      }
    }
  }
);

// Lifecycle
onMounted(() => {
  console.log("🎵 Starting menu music for StudentTestTaking...");
  startMusic(MUSIC_TYPES.MENU, 0.3);
  
  if (props.isOpen) {
    loadTestContent();
  }
});

onUnmounted(() => {
  console.log("🔇 Stopping menu music for StudentTestTaking...");
  stopMusic();
  
  if (timer.value) {
    clearInterval(timer.value);
  }
});
</script>

<style scoped>
.test-taking-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* Loading and Error States */
.loading-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
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

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

/* Test Instructions */
.test-instructions {
  padding: 20px;
}

.test-header {
  margin-bottom: 20px;
  text-align: center;
}

.test-header h2 {
  margin: 0 0 10px;
  color: #2c3e50;
}

.test-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.test-category,
.reading-level {
  background: #e8f5e8;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  color: #2c7a2c;
}

.instructions-content {
  margin: 20px 0;
}

.test-details {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
}

.detail-item {
  margin-bottom: 8px;
}

/* Test Progress */
.test-progress {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s ease;
}

.timer {
  color: #ff5722;
  font-weight: bold;
}

/* Question Styles */
.question-container {
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  margin-bottom: 20px;
}

.question-content h3 {
  margin-bottom: 20px;
  font-size: 18px;
  color: #2c3e50;
  text-align: center;
}

/* CVC Questions */
.word-display {
  font-size: 48px;
  font-weight: bold;
  text-align: center;
  margin: 20px 0;
  color: #4caf50;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  max-width: 400px;
  margin: 0 auto;
}

.option-btn {
  padding: 16px 24px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 8px;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-btn:hover {
  border-color: #4caf50;
  background: #f0f8f0;
}

.option-btn.selected {
  border-color: #4caf50;
  background: #4caf50;
  color: white;
}

/* Phonics Questions */
.sound-display {
  font-size: 36px;
  text-align: center;
  margin: 20px 0;
  color: #ff9800;
  font-weight: bold;
}

.play-sound-btn {
  display: block;
  margin: 16px auto;
  padding: 12px 24px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

/* Blending Questions */
.segments-display {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 20px 0;
}

.segment {
  padding: 8px 16px;
  background: #e3f2fd;
  border: 2px solid #2196f3;
  border-radius: 8px;
  font-size: 20px;
  font-weight: bold;
  color: #2196f3;
}

/* Silent Words */
.word-display.silent {
  color: #9c27b0;
}

.silent-instruction {
  text-align: center;
  color: #666;
  font-style: italic;
  margin: 16px 0;
}

/* Input Styles */
.text-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  margin: 16px 0;
  text-align: center;
}

.text-input:focus {
  outline: none;
  border-color: #4caf50;
}

/* Action Buttons */
.action-buttons,
.question-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.cancel-btn,
.close-btn,
.nav-btn {
  padding: 12px 24px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-btn,
.nav-btn.primary {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.start-btn:hover,
.nav-btn.primary:hover {
  background: #45a049;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Test Completion */
.test-completed {
  text-align: center;
  padding: 40px 20px;
}

.completion-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.results-summary {
  margin: 30px 0;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.score {
  font-size: 48px;
  font-weight: bold;
  color: #4caf50;
}

.score-label {
  font-size: 16px;
  color: #666;
}

.stats {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.stat-item {
  margin-bottom: 8px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .test-taking-container {
    padding: 16px;
    margin: 16px;
  }

  .options-grid {
    grid-template-columns: 1fr;
  }

  .word-display {
    font-size: 36px;
  }

  .sound-display {
    font-size: 28px;
  }

  .test-progress {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
