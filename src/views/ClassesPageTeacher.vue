<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Loading Screen -->
      <loading-screen :is-loading="loading" message="Loading classes" />

      <!-- Main Container -->
      <div class="classes-container">
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
              <h1 class="page-title">Active Classrooms</h1>
            </div>

            <!-- Spacer for alignment -->
            <div class="spacer"></div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- New Class Button -->
          <div class="new-class-section">
            <button class="new-class-btn" @click="playClick('teacher'); createNewClass()">
              <span class="plus-icon">+</span>
              NEW CLASS
            </button>
            <button class="refresh-btn" @click="playClick('teacher'); refreshClassrooms()" :disabled="loading">
              <ion-icon :icon="refreshOutline" class="refresh-icon"></ion-icon>
              Refresh
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="loading-section">
            <ion-spinner name="crescent" class="loading-spinner"></ion-spinner>
            <p>Loading your classrooms...</p>
          </div>

          <!-- Classes Grid -->
          <div v-else-if="teacherClasses.length > 0" class="classes-grid">
            <div
              v-for="classroom in teacherClasses"
              :key="classroom.id"
              class="teacher-class-card"
              @click="playClick('teacher'); navigateToClassDetail(classroom.id)"
            >
              <div class="class-content">
                <div class="class-icon-left">
                  <img
                    src="@/img/CapyBuddy Assets/Home_Student/class (1).png"
                    alt="Class Icon"
                    class="class-left-icon"
                  />
                </div>
                <div class="class-info">
                  <div class="class-name">{{ classroom.name }}</div>
                  <div class="class-details">
                    <span class="student-count"
                      >{{ classroom.student_count || 0 }} students</span
                    >
                    <span class="class-code">Code: {{ classroom.class_code }}</span>
                  </div>
                  <div class="class-status">
                    <span class="status-badge active">Active</span>
                  </div>
                </div>
                <div class="class-icon">
                  <img
                    src="@/img/CapyBuddy Assets/Home_Student/right.png"
                    alt="Arrow Icon"
                    class="icon-image arrow-right"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <img
              src="@/img/CapyBuddy Assets/Home_Student/class (1).png"
              alt="No classes"
              class="empty-icon"
            />
            <h3>No Active Classrooms</h3>
            <p>Create your first classroom to get started!</p>

            <!-- Debug Info (for development) -->
            <div class="debug-info" v-if="profile">
              <small style="color: #666; font-size: 12px">
                Debug: Authenticated as {{ profile.full_name }} ({{ profile.user_type }})
                <br />
                Teacher ID: {{ profile.id }}
                <br />
                Classes loaded: {{ teacherClasses?.length || 0 }}
              </small>
            </div>

            <div class="empty-actions">
              <button class="create-first-class-btn" @click="playClick('teacher'); createNewClass()">
                Create Your First Class
              </button>
              <button class="refresh-empty-btn" @click="playClick('teacher'); refreshClassrooms()">
                <ion-icon :icon="refreshOutline" class="refresh-icon-small"></ion-icon>
                Refresh List
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Navigation -->
        <div class="bottom-navigation">
          <div class="nav-item" @click="playClick('teacher'); navigateToTeacherHome()">
            <img
              src="@/img/CapyBuddy Assets/Nav_Icons/home (1).png"
              alt="Home"
              class="nav-icon"
            />
          </div>
          <div class="nav-item active">
            <img
              src="@/img/CapyBuddy Assets/Nav_Icons/class.png"
              alt="Classes"
              class="nav-icon"
            />
          </div>
          <div class="nav-item" @click="playClick('teacher'); navigateToNotifications()">
            <img
              src="@/img/CapyBuddy Assets/Nav_Icons/bell.png"
              alt="Notifications"
              class="nav-icon"
            />
          </div>
          <div class="nav-item" @click="playClick('teacher'); navigateToProfile()">
            <img
              src="@/img/CapyBuddy Assets/Nav_Icons/best-friend.png"
              alt="Profile"
              class="nav-icon"
            />
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Create Class Modal -->
    <CreateClassModal
      :is-open="showCreateModal"
      :teacher-name="teacherDisplayName"
      @close="closeCreateModal"
      @save="handleClassCreated"
    />
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonIcon, IonSpinner } from "@ionic/vue";
import { chevronBackOutline, refreshOutline } from "ionicons/icons";
import { useRouter } from "vue-router";
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import { useAuth, useTeacher } from "@/composables/services";
import CreateClassModal from "@/components/CreateClassModal.vue";
import LoadingScreen from "@/components/LoadingScreen.vue";

const router = useRouter();

// Use composables for backend integration
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const {
  teacherClasses: backendTeacherClasses,
  getTeacherClasses,
  createClass,
  isLoading: teacherLoading,
} = useTeacher();

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const loading = computed(() => teacherLoading.value);
const teacherClasses = computed(() => backendTeacherClasses.value || []);
const showCreateModal = ref(false);

// Teacher display name for modal
const teacherDisplayName = computed(() => {
  return profile.value?.full_name || "Mr. Verstappen";
});

// Get current user (teacher) from auth composable
const user = computed(
  () =>
    profile.value || {
      id: null,
      full_name: "",
      email: "",
      user_type: "teacher",
    }
);

// Fetch teacher's classrooms using composables
const fetchTeacherClassrooms = async () => {
  try {
    console.log("📚 Fetching teacher classes...");

    // Initialize authentication
    await initAuth();

    if (isAuthenticated.value && profile.value) {
      console.log("✅ Teacher authenticated, fetching classes...");
      console.log("👤 Teacher profile:", {
        id: profile.value.id,
        name: profile.value.full_name,
        userType: profile.value.user_type,
      });

      // Fetch teacher classes using composable
      await getTeacherClasses(profile.value.id);

      console.log("📋 Teacher classes loaded:", teacherClasses.value?.length || 0);

      if (teacherClasses.value?.length > 0) {
        console.log("📚 Classes details:", teacherClasses.value);
      } else {
        console.log("ℹ️ No classes found for this teacher");
      }
    } else {
      console.log("❌ Teacher not authenticated, redirecting to login");
      router.push("/login");
    }
  } catch (error) {
    console.error("❌ Error fetching teacher classes:", error);

    if (window.$toast) {
      window.$toast.error("Failed to load classrooms. Please try refreshing the page.");
    }
  }
};

// Manual refresh function
const refreshClassrooms = async () => {
  console.log("🔄 Manual refresh triggered...");
  await fetchTeacherClassrooms();
};

// Navigation functions
const goBack = () => {
  router.push("/teacher/home");
};

const navigateToTeacherHome = () => {
  router.push("/teacher/home");
};

const navigateToClassDetail = (classId) => {
  router.push(`/teacher/classroom/${classId}`);
};

const navigateToNotifications = () => {
  router.push("/teacher/notifications");
};

const navigateToProfile = () => {
  router.push("/teacher/profile");
};

const createNewClass = () => {
  showCreateModal.value = true;
};

// Modal management functions
const closeCreateModal = () => {
  showCreateModal.value = false;
};

const handleClassCreated = async (classData) => {
  try {
    console.log("🎉 New class created:", classData);

    // Close the modal first
    closeCreateModal();

    // Refresh the teacher classes from the backend to get the latest data
    console.log("🔄 Refreshing teacher classes from database...");
    await getTeacherClasses(profile.value.id);

    console.log("✅ Teacher classes refreshed successfully!");
    console.log("📊 Current classes count:", teacherClasses.value?.length || 0);

    // Show success message
    if (window.$toast) {
      window.$toast.success(`Class "${classData.name}" created successfully!`);
    }
  } catch (error) {
    console.error("❌ Error refreshing classes after creation:", error);

    // Show error message
    if (window.$toast) {
      window.$toast.error(
        "Class created but failed to refresh list. Please refresh the page."
      );
    }
  }
};

// Generate a random class code
const generateClassCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Lifecycle
onMounted(async () => {
  console.log("🎵 Starting lobby background music...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);
  
  await fetchTeacherClassrooms();
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby background music...");
  stopMusic();
});
</script>

<style scoped>
.classes-container {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
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
  color: #4a90e2;
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
  width: 60px; /* Same as back button width for balance */
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* New Class Section */
.new-class-section {
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.new-class-btn {
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
  transition: all 0.3s ease;
}

.new-class-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
}

.refresh-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 15px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  width: 16px;
  height: 16px;
}

.plus-icon {
  font-size: 20px;
  font-weight: 700;
}

/* Loading Section */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin-bottom: 20px;
  color: #4a90e2;
}

/* Classes Grid */
.classes-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.teacher-class-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #4a90e2;
}

.teacher-class-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.class-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.class-icon-left {
  flex: 0 0 auto;
}

.class-left-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
}

.class-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.class-name {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.class-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-count,
.class-code {
  font-size: 14px;
  color: #666;
}

.class-status {
  display: flex;
  align-items: center;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #e8f5e8;
  color: #2e7d2e;
}

.class-icon {
  flex: 0 0 auto;
}

.icon-image {
  width: 24px;
  height: 24px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  text-align: center;
}

.empty-icon {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-state h3 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 20px;
}

.empty-state p {
  color: #666;
  margin-bottom: 20px;
  font-size: 16px;
}

.debug-info {
  margin: 10px 0 20px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.empty-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.create-first-class-btn {
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-first-class-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.refresh-empty-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.refresh-empty-btn:hover {
  background: #5a6268;
}

.refresh-icon-small {
  width: 14px;
  height: 14px;
}

/* Bottom Navigation */
.bottom-navigation {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: white;
  padding: 12px 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  border-top: 1px solid #e0e0e0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-item.active {
  background: rgba(74, 144, 226, 0.1);
}

.nav-item:hover {
  background: rgba(74, 144, 226, 0.05);
}

.nav-icon {
  width: 24px;
  height: 24px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-section {
    padding: 15px;
  }

  .main-content {
    padding: 15px;
  }

  .page-title {
    font-size: 20px;
  }

  .teacher-class-card {
    padding: 15px;
  }

  .class-name {
    font-size: 16px;
  }
}
</style>
