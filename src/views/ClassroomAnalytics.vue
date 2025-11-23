<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Loading Screen -->
      <loading-screen :is-loading="loading" message="Loading analytics" />

      <!-- Main Container -->
      <div class="analytics-container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-row">
            <!-- Back Button -->
            <div class="back-button-container">
              <button class="back-button" @click="playClick('teacher'); goBack()">
                <ion-icon :icon="chevronBackOutline" class="back-icon"></ion-icon>
                <span class="back-text">Back</span>
              </button>
            </div>
            
            <!-- Page Title -->
            <div class="page-title-container">
              <h1 class="page-title">Analytics</h1>
            </div>
            
            <!-- Spacer for alignment -->
            <div class="spacer"></div>
          </div>
        </div>

        <!-- Main Content -->
        <div v-if="loading" class="loading-container">
          <div class="loading-text">Loading analytics...</div>
        </div>
        
        <div v-else class="main-content">
          <!-- Analytics Cards -->
          <div class="analytics-cards-grid">
            <!-- Total Words Read Card -->
            <div class="analytics-card words-card">
              <div class="card-content">
                <div class="card-number">{{ analyticsData.totalWordsRead }}</div>
                <div class="card-label">WORDS<br>READ</div>
              </div>
            </div>

            <!-- Quizzes Taken Card -->
            <div class="analytics-card quizzes-card">
              <div class="card-content">
                <div class="card-number">{{ analyticsData.totalQuizzes }}</div>
                <div class="card-label">QUIZZES<br>TAKEN</div>
              </div>
            </div>

            <!-- Stories Read Card -->
            <div class="analytics-card stories-card">
              <div class="card-content">
                <div class="card-number">{{ analyticsData.storiesRead }}</div>
                <div class="card-label">STORIES<br>READ</div>
              </div>
            </div>
          </div>

          <!-- Chart Section -->
          <div class="chart-section">
            <div class="chart-container">
              <canvas ref="chartCanvas" class="donut-chart"></canvas>
            </div>
            <!-- Chart Legend -->
            <div class="chart-legend">
              <div 
                v-for="item in chartData" 
                :key="item.label"
                class="legend-item"
              >
                <div 
                  class="legend-color" 
                  :style="{ backgroundColor: item.color }"
                ></div>
                <div class="legend-text">
                  <span class="legend-label">{{ item.label }}</span>
                  <span class="legend-value">{{ item.value }} ({{ item.percentage || Math.round((item.value / (analyticsData.totalWordsRead + analyticsData.totalQuizzes + analyticsData.storiesRead)) * 100) }}%)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Students List Section -->
          <div class="students-section">
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

            <!-- Students List Header -->
            <div class="students-header">
              <h3 class="students-title">STUDENTS ENROLLED</h3>
            </div>

            <!-- Students List -->
            <div class="students-list">
              <div
                v-for="student in filteredStudents"
                :key="student.id"
                class="student-item"
              >
                <div class="student-info">
                  <div class="student-avatar">
                    <img
                      :src="student.avatar || '@/img/CapyBuddy Assets/Class/profile-user.png'"
                      alt="Student"
                      class="avatar-img"
                    />
                  </div>
                  <span class="student-name">{{ student.name }}</span>
                </div>
                <div class="student-status">
                  <span class="status-badge intermediate">{{ student.level || 'INTERMEDIATE' }}</span>
                </div>
                <div class="student-actions">
                  <button class="info-btn" @click="playClick('teacher'); viewStudentDetails(student.id)">
                    <span class="info-icon">i</span>
                  </button>
                </div>
              </div>

              <!-- Empty state for students -->
              <div v-if="filteredStudents.length === 0" class="empty-state">
                <p v-if="searchQuery">No students found matching "{{ searchQuery }}"</p>
                <p v-else>No students enrolled yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import { chevronBackOutline, searchOutline } from "ionicons/icons";
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted, computed, nextTick, onBeforeUnmount } from "vue";
import { useAuth, useTeacher } from '@/composables/services';
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import LoadingScreen from "@/components/LoadingScreen.vue";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const router = useRouter();
const route = useRoute();

// Use composables for backend integration with null checks
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const teacherComposable = useTeacher();

// Safely extract properties from useTeacher composable
const { 
  classroomAnalytics = ref(null), 
  classroomStudents = ref([]),
  getClassroomAnalytics,
  getClassroomStudents,
  isLoading: teacherLoading = ref(false)
} = teacherComposable || {};

// Reactive data from backend with safe defaults
const analyticsData = computed(() => {
  const studentsData = students.value || [];
  
  if (studentsData.length === 0) {
    return {
      totalWordsRead: 0,
      totalQuizzes: 0,
      storiesRead: 0
    };
  }
  
  // Calculate total words read by all students
  const totalWordsRead = studentsData.reduce((total, student) => {
    // Sum up words_read from student stats or reading sessions
    const wordsRead = student.total_words_read || student.words_read || 0;
    return total + wordsRead;
  }, 0);
  
  // Calculate total quizzes taken (from quiz responses or test completions)
  const totalQuizzes = studentsData.reduce((total, student) => {
    // Count quiz attempts or story test completions
    const quizzes = student.quiz_attempts || student.story_tests_taken || 0;
    return total + quizzes;
  }, 0);
  
  // Calculate stories read (from reading sessions)
  const storiesRead = studentsData.reduce((total, student) => {
    // Count unique stories read by each student
    const stories = student.stories_read || student.reading_sessions || 0;
    return total + stories;
  }, 0);
  
  return {
    totalWordsRead,
    totalQuizzes,
    storiesRead
  };
});

const students = computed(() => {
  if (!classroomStudents || !classroomStudents.value) {
    return [];
  }
  return classroomStudents.value;
});
const filteredStudents = ref([]);
const searchQuery = ref('');
const chartCanvas = ref(null);
const loading = computed(() => teacherLoading && teacherLoading.value ? teacherLoading.value : false);

// Get classroom ID from route params
const classroomId = computed(() => route.params.id);

// Chart data for donut chart - computed from analytics data
const chartData = computed(() => {
  const analytics = analyticsData.value;
  const total = analytics.totalWordsRead + analytics.totalQuizzes + analytics.storiesRead;
  
  if (total === 0) {
    // Return empty state when no data
    return [
      { label: 'No Data', value: 1, color: '#E0E0E0' }
    ];
  }
  
  return [
    { 
      label: 'Words Read', 
      value: analytics.totalWordsRead, 
      color: '#81C784',
      percentage: Math.round((analytics.totalWordsRead / total) * 100)
    },
    { 
      label: 'Quizzes Taken', 
      value: analytics.totalQuizzes, 
      color: '#4FC3F7',
      percentage: Math.round((analytics.totalQuizzes / total) * 100)
    },
    { 
      label: 'Stories Read', 
      value: analytics.storiesRead, 
      color: '#FFB74D',
      percentage: Math.round((analytics.storiesRead / total) * 100)
    }
  ].filter(item => item.value > 0); // Only show segments with data
});

// Initialize classroom analytics data
const initializeClassroomAnalytics = async () => {
  try {
    console.log('📊 Initializing classroom analytics...');
    
    await initAuth();
    
    if (isAuthenticated.value && profile.value?.user_type === 'teacher') {
      console.log('✅ Teacher authenticated, fetching analytics data...');
      
      // Fetch detailed student data with reading statistics
      await fetchDetailedStudentData();
      
      // Initialize filtered students
      filteredStudents.value = [...students.value];
      
      console.log('📈 Analytics data loaded:', {
        analytics: analyticsData.value,
        students: students.value?.length || 0
      });
      
      // Recreate chart with new data
      await nextTick();
      if (chartCanvas.value) {
        createDonutChart();
      }
    } else {
      console.log('❌ Teacher not authenticated, redirecting to login');
      router.push('/login');
    }
  } catch (error) {
    console.error('Error initializing classroom analytics:', error);
  }
};

// Fetch detailed student data with reading statistics
const fetchDetailedStudentData = async () => {
  try {
    if (getClassroomStudents) {
      // Get basic student data
      await getClassroomStudents(classroomId.value);
      
      // Enhance with reading statistics
      const enhancedStudents = await Promise.all(
        students.value.map(async (student) => {
          try {
            // Fetch reading sessions for word count
            const readingSessions = await fetchStudentReadingSessions(student.id);
            const quizResponses = await fetchStudentQuizResponses(student.id);
            
            return {
              ...student,
              total_words_read: readingSessions.totalWords || 0,
              quiz_attempts: quizResponses.totalQuizzes || 0,
              stories_read: readingSessions.storiesCount || 0
            };
          } catch (error) {
            console.warn(`Failed to fetch stats for student ${student.id}:`, error);
            return {
              ...student,
              total_words_read: 0,
              quiz_attempts: 0,
              stories_read: 0
            };
          }
        })
      );
      
      // Update the students data with enhanced statistics
      if (classroomStudents && classroomStudents.value) {
        classroomStudents.value = enhancedStudents;
      }
    }
  } catch (error) {
    console.error('Error fetching detailed student data:', error);
  }
};

// Fetch student reading sessions data
const fetchStudentReadingSessions = async (studentId) => {
  try {
    // Import supabase for direct database queries
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    // Get reading sessions for this student
    const { data: readingSessions, error } = await supabase
      .from('reading_sessions')
      .select('words_read, content_type')
      .eq('user_id', studentId);
    
    if (error) {
      console.warn(`Error fetching reading sessions for student ${studentId}:`, error);
      return { totalWords: 0, storiesCount: 0 };
    }
    
    const totalWords = readingSessions?.reduce((total, session) => 
      total + (session.words_read || 0), 0) || 0;
    
    const storiesCount = readingSessions?.filter(session => 
      session.content_type === 'story').length || 0;
    
    return { totalWords, storiesCount };
  } catch (error) {
    console.error(`Error in fetchStudentReadingSessions for ${studentId}:`, error);
    return { totalWords: 0, storiesCount: 0 };
  }
};

// Fetch student quiz responses data
const fetchStudentQuizResponses = async (studentId) => {
  try {
    // Import supabase for direct database queries
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    // Get quiz responses by checking both quiz_responses and student_task_progress
    const { data: quizResponses, error: quizError } = await supabase
      .from('quiz_responses')
      .select('id, assignment_id')
      .eq('user_id', studentId);
    
    const { data: taskProgress, error: taskError } = await supabase
      .from('student_task_progress')
      .select('id, assignment_id')
      .eq('user_id', studentId)
      .eq('status', 'completed');
    
    if (quizError && taskError) {
      console.warn(`Error fetching quiz data for student ${studentId}:`, { quizError, taskError });
      return { totalQuizzes: 0 };
    }
    
    // Count unique quiz attempts (from both sources)
    const quizIds = new Set();
    
    if (quizResponses) {
      quizResponses.forEach(response => {
        if (response.assignment_id) quizIds.add(response.assignment_id);
      });
    }
    
    if (taskProgress) {
      taskProgress.forEach(progress => {
        if (progress.assignment_id) quizIds.add(progress.assignment_id);
      });
    }
    
    return { totalQuizzes: quizIds.size };
  } catch (error) {
    console.error(`Error in fetchStudentQuizResponses for ${studentId}:`, error);
    return { totalQuizzes: 0 };
  }
};

// Chart creation function
const createDonutChart = () => {
  nextTick(() => {
    if (!chartCanvas.value) return;

    const canvas = chartCanvas.value;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 20;
    const innerRadius = outerRadius * 0.6;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate total value
    const total = chartData.value.reduce((sum, item) => sum + item.value, 0);

    let currentAngle = -Math.PI / 2; // Start from top

    // Draw segments
    chartData.value.forEach((segment) => {
      const segmentAngle = (segment.value / total) * 2 * Math.PI;

      // Draw segment
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + segmentAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + segmentAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      // Draw label with percentage
      const labelAngle = currentAngle + segmentAngle / 2;
      const labelRadius = outerRadius + 30;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;

      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(segment.label, labelX, labelY);
      ctx.fillText((segment.percentage || Math.round((segment.value / total) * 100)) + '%', labelX, labelY + 12);

      currentAngle += segmentAngle;
    });
  });
};

// Filter students based on search query
const filterStudents = () => {
  if (!searchQuery.value.trim()) {
    filteredStudents.value = [...students.value];
  } else {
    const query = searchQuery.value.toLowerCase();
    filteredStudents.value = students.value.filter(student =>
      student.name.toLowerCase().includes(query)
    );
  }
};

// Navigation functions
const goBack = () => {
  router.push(`/teacher/classroom/${classroomId.value}`);
};

const viewStudentDetails = (studentId) => {
  // TODO: Create student details route
  console.log('View student details:', studentId);
};

// Lifecycle
onMounted(async () => {
  console.log("🎵 Starting lobby music for ClassroomAnalytics...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);
  
  await initializeClassroomAnalytics();
  
  // Set canvas size and create chart
  nextTick(() => {
    if (chartCanvas.value) {
      chartCanvas.value.width = 280;
      chartCanvas.value.height = 280;
      createDonutChart();
    }
  });
  // fetchStudents();
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby music for ClassroomAnalytics...");
  stopMusic();
});
</script>

<style scoped>
.analytics-container {
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

.words-card {
  background: linear-gradient(135deg, #81C784 0%, #66BB6A 100%);
}

.quizzes-card {
  background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
}

.stories-card {
  background: linear-gradient(135deg, #FFB74D 0%, #FF9800 100%);
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
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 30px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.donut-chart {
  max-width: 100%;
  height: auto;
}

/* Chart Legend */
.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 200px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.legend-label {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.legend-value {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* Students Section */
.students-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Search Bar */
.search-container {
  margin-bottom: 20px;
}

.search-input-wrapper {
  position: relative;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 14px;
  background: #f8f9fa;
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #4FC3F7;
  background: white;
  box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.1);
}

.search-input::placeholder {
  color: #999;
  font-weight: 500;
}

.search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  width: 18px;
  height: 18px;
}

/* Students Header */
.students-header {
  margin-bottom: 20px;
}

.students-title {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Students List */
.students-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.student-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.student-item:hover {
  background: #f8f9fa;
  border-color: #e0e0e0;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #f0f0f0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.student-name {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

.student-status {
  flex: 0 0 auto;
  margin-right: 15px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.intermediate {
  background: #FFF3E0;
  color: #FF8F00;
}

.student-actions {
  flex: 0 0 auto;
}

.info-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f0f0;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.info-btn:hover {
  background: #4FC3F7;
  color: white;
}

.info-icon {
  font-size: 12px;
  font-weight: 700;
  font-style: italic;
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .analytics-cards-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .card-number {
    font-size: 28px;
  }

  .chart-section {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .chart-legend {
    min-width: auto;
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .legend-item {
    min-width: 140px;
  }

  .student-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .student-status,
  .student-actions {
    margin-right: 0;
  }
}

@media (max-width: 480px) {
  .analytics-cards-grid {
    grid-template-columns: 1fr;
  }

  .students-section {
    padding: 15px;
  }

  .chart-section {
    padding: 15px;
  }

  .donut-chart {
    width: 250px;
    height: 250px;
  }

  .chart-legend {
    flex-direction: column;
    gap: 12px;
  }
}
</style>