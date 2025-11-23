<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Main Container -->
      <div class="admin-dashboard-container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-row">
            <!-- Greeting Section -->
            <div class="greeting-section">
              <p class="greeting-text">Hello,</p>
              <h1 class="greeting-name">Admin Glomer</h1>
            </div>

            <!-- Admin Avatar -->
            <div
              class="avatar-container"
              @click="
                playClick('teacher');
                navigateToProfile();
              "
            >
              <img src="@/img/adminicon.png" alt="Admin Avatar" class="admin-avatar" />
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Analytics Section -->
          <div class="analytics-section">
            <h3 class="analytics-title">Analytics</h3>

            <!-- Analytics Cards Grid -->
            <div class="analytics-grid">
              <div class="analytics-card words-card">
                <div class="card-number">{{ adminStats.wordsGenerated }}</div>
                <div class="card-label">WORDS<br />GENERATED</div>
              </div>

              <div class="analytics-card staff-card">
                <div class="card-number">{{ adminStats.totalStaff }}</div>
                <div class="card-label">STAFF</div>
              </div>

              <div class="analytics-card stories-card">
                <div class="card-number">{{ adminStats.storiesGenerated }}</div>
                <div class="card-label">STORIES<br />GENERATED</div>
              </div>

              <div class="analytics-card students-card">
                <div class="card-number">{{ adminStats.totalStudents }}</div>
                <div class="card-label">STUDENTS</div>
              </div>

              <div class="analytics-card classrooms-card">
                <div class="card-number">{{ adminStats.activeClassrooms }}</div>
                <div class="card-label">CLASSROOMS</div>
              </div>

              <div class="analytics-card assignments-card">
                <div class="card-number">{{ adminStats.totalAssignments }}</div>
                <div class="card-label">ASSIGNMENTS</div>
              </div>
            </div>

            <!-- Analytics Bar Chart -->
            <div class="chart-section">
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
                  <!-- Words Generated Bar -->
                  <div class="bar-group" style="animation-delay: 0.1s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-green"
                        :style="{ height: getBarHeight(adminStats.wordsGenerated) + '%' }"
                      >
                        <span class="bar-value">{{ adminStats.wordsGenerated }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Words</div>
                    <div class="bar-context">Generated</div>
                  </div>

                  <!-- Staff Bar -->
                  <div class="bar-group" style="animation-delay: 0.2s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-blue"
                        :style="{ height: getBarHeight(adminStats.totalStaff) + '%' }"
                      >
                        <span class="bar-value">{{ adminStats.totalStaff }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Staff</div>
                    <div class="bar-context">Active</div>
                  </div>

                  <!-- Stories Generated Bar -->
                  <div class="bar-group" style="animation-delay: 0.3s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-orange"
                        :style="{
                          height: getBarHeight(adminStats.storiesGenerated) + '%',
                        }"
                      >
                        <span class="bar-value">{{ adminStats.storiesGenerated }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Stories</div>
                    <div class="bar-context">Generated</div>
                  </div>

                  <!-- Students Bar -->
                  <div class="bar-group" style="animation-delay: 0.4s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-yellow"
                        :style="{ height: getBarHeight(adminStats.totalStudents) + '%' }"
                      >
                        <span class="bar-value">{{ adminStats.totalStudents }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Students</div>
                    <div class="bar-context">Active</div>
                  </div>

                  <!-- Classrooms Bar -->
                  <div class="bar-group" style="animation-delay: 0.5s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-purple"
                        :style="{ height: getBarHeight(adminStats.activeClassrooms) + '%' }"
                      >
                        <span class="bar-value">{{ adminStats.activeClassrooms }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Classrooms</div>
                    <div class="bar-context">Active</div>
                  </div>

                  <!-- Assignments Bar -->
                  <div class="bar-group" style="animation-delay: 0.6s">
                    <div class="bar-wrapper">
                      <div
                        class="bar bar-pink"
                        :style="{ height: getBarHeight(adminStats.totalAssignments) + '%' }"
                      >
                        <span class="bar-value">{{ adminStats.totalAssignments }}</span>
                      </div>
                    </div>
                    <div class="bar-label">Assignments</div>
                    <div class="bar-context">Created</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Incoming Requests Section -->
          <div class="requests-section">
            <h3 class="section-title">Incoming Requests</h3>

            <div class="requests-list">
              <TransitionGroup name="list-item" tag="div" class="requests-container">
                <div
                  v-for="request in incomingRequests"
                  :key="request.id"
                  class="request-item"
                >
                  <div class="request-info">
                    <div class="request-icon">
                      <ion-icon
                        :icon="personCircleOutline"
                        class="person-icon"
                      ></ion-icon>
                    </div>
                    <div class="request-details">
                      <div class="request-name">
                        {{
                          request.requester ? request.requester.full_name : "Unknown User"
                        }}
                      </div>
                      <div class="request-type">
                        {{
                          request.request_type
                            ? request.request_type.replace("_", " ").toUpperCase()
                            : "EDUCATOR REQUEST"
                        }}
                      </div>
                    </div>
                  </div>
                  <div class="request-actions">
                    <button
                      class="action-btn approve-btn"
                      @click="
                        playClick('teacher');
                        handleApproveRequest(request.id);
                      "
                    >
                      APPROVE
                    </button>
                    <button
                      class="action-btn reject-btn"
                      @click="
                        playClick('teacher');
                        handleRejectRequest(request.id);
                      "
                    >
                      REJECT
                    </button>
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </div>

          <!-- Recent Activity Section -->
          <div class="activity-section">
            <h3 class="section-title">Recent Activity</h3>

            <div class="activity-list">
              <TransitionGroup name="list-item" tag="div" class="activity-container">
                <div
                  v-for="activity in recentActivity"
                  :key="activity.id"
                  class="activity-item"
                >
                  <div class="activity-details">
                    <div class="activity-text">{{ activity.description }}</div>
                    <div class="activity-time">{{ activity.time }}</div>
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Details Modal -->
      <Transition name="modal-ease" appear>
        <div v-if="showDetailsModalOpen" class="modal-overlay" @click="closeDetailsModal">
          <Transition name="modal-slide" appear>
            <div class="details-modal" @click.stop>
              <div class="modal-header">
                <h3 class="modal-title">Get in Touch with Us</h3>
                <button
                  class="close-btn"
                  @click="
                    playClick('teacher');
                    closeDetailsModal();
                  "
                >
                  <ion-icon :icon="closeOutline" class="close-icon"></ion-icon>
                </button>
              </div>
              <div class="modal-content">
                <div class="contact-card">
                  <div class="contact-header">
                    <div class="contact-label">How can we help?</div>
                  </div>
                  <div class="contact-info">
                    <div class="email-section">
                      <ion-icon :icon="mailOutline" class="contact-icon"></ion-icon>
                      <span class="contact-text">contact.wordventure@gmail.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import {
  personCircleOutline,
  informationCircleOutline,
  closeOutline,
  mailOutline,
  bugOutline,
} from "ionicons/icons";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth, useAdmin } from "@/composables/services";
import { useAudio } from "@/composables/useAudio";

const router = useRouter();

// Audio system
const { playClick } = useAudio();

// Use composables for backend integration
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const {
  adminStats: backendAdminStats,
  adminRequests: backendAdminRequests,
  adminActivity: backendAdminActivity,
  getAdminStats,
  getAdminRequests,
  getAdminActivity,
  approveRequest,
  rejectRequest,
  isLoading: adminLoading,
} = useAdmin();

// Modal state
const showDetailsModalOpen = ref(false);

// Admin Statistics using composables
const adminStats = computed(
  () =>
    backendAdminStats.value || {
      wordsGenerated: 0,
      totalStaff: 0,
      storiesGenerated: 0,
      totalStudents: 0,
      activeClassrooms: 0,
      totalAssignments: 0,
    }
);

// Incoming Requests using backend data
const incomingRequests = computed(() => backendAdminRequests.value || []);

// Recent Activity using backend data
const recentActivity = computed(() => backendAdminActivity.value || []);

// Get bar height for visualization (0-100 scale)
const getBarHeight = (value) => {
  if (!value || value === 0) return 2; // Minimum height for empty bars

  // Find maximum value for scaling
  const maxValue = Math.max(
    adminStats.value.wordsGenerated,
    adminStats.value.totalStaff,
    adminStats.value.storiesGenerated,
    adminStats.value.totalStudents,
    adminStats.value.activeClassrooms,
    adminStats.value.totalAssignments,
    1 // Prevent division by zero
  );

  // Calculate percentage relative to max value
  const percentage = (value / maxValue) * 100;

  // Ensure minimum visibility and cap at 100%
  return Math.min(Math.max(percentage, 2), 100);
};

// Navigation methods
const navigateToProfile = () => {
  router.push("/admin/profile");
};

const navigateToDebug = () => {
  router.push("/admin/auth-diagnostics");
};

// Request handling methods using composables
const handleApproveRequest = async (requestId) => {
  try {
    if (!profile.value?.id) {
      console.error("❌ Admin ID not available");
      return;
    }

    const result = await approveRequest(requestId, profile.value.id);
    if (result.success) {
      console.log("✅ Request approved successfully");
      // Refresh data
      await getAdminRequests();
      await getAdminActivity();
    } else {
      console.error("❌ Failed to approve request:", result.error);
    }
  } catch (error) {
    console.error("Error approving request:", error);
  }
};

const handleRejectRequest = async (requestId) => {
  try {
    if (!profile.value?.id) {
      console.error("❌ Admin ID not available");
      return;
    }

    const result = await rejectRequest(requestId, profile.value.id);
    if (result.success) {
      console.log("✅ Request rejected successfully");
      // Refresh data
      await getAdminRequests();
      await getAdminActivity();
    } else {
      console.error("❌ Failed to reject request:", result.error);
    }
  } catch (error) {
    console.error("Error rejecting request:", error);
  }
};

// Initialize admin dashboard data
const initializeAdminDashboard = async () => {
  try {
    console.log("🏢 Initializing admin dashboard...");

    // Initialize authentication
    await initAuth();

    if (isAuthenticated.value && profile.value?.user_type === "admin") {
      console.log("✅ Admin authenticated, fetching data...");

      // Fetch admin dashboard data
      await Promise.all([getAdminStats(), getAdminRequests(), getAdminActivity()]);

      console.log("📊 Admin dashboard data loaded:", {
        stats: adminStats.value,
        requests: incomingRequests.value?.length || 0,
        activities: backendAdminActivity.value?.length || 0,
      });
    } else {
      console.log("❌ Admin not authenticated, redirecting to login");
      router.push("/login");
    }
  } catch (error) {
    console.error("Error initializing admin dashboard:", error);
  }
};

// Initialize component
onMounted(async () => {
  await initializeAdminDashboard();
});
</script>

<style scoped>
/* Main Container */
.admin-dashboard-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

/* Header Section */
.header-section {
  margin-bottom: 30px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.greeting-section {
  display: flex;
  flex-direction: column;
}

.greeting-text {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
  font-weight: 400;
}

.greeting-name {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.avatar-container {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease-in-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-container:hover {
  transform: scale(1.05);
}

.admin-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.debug-container {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease-in-out;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  margin-left: 10px;
}

.debug-container:hover {
  transform: scale(1.1);
}

.debug-icon {
  font-size: 20px;
  color: white;
}

/* Info Button */
.info-btn {
  background: transparent;
  border: none;
  color: #2c3e50;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.info-btn:hover {
  background: rgba(44, 62, 80, 0.1);
  transform: scale(1.1);
}

.info-icon {
  font-size: 24px;
}

/* Main Content */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* Analytics Section */
.analytics-section {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.analytics-title {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 20px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.analytics-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 15px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.3s ease-in-out;
}

.analytics-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.words-card {
  border-color: #88c999;
  background: linear-gradient(135deg, #88c999 0%, #a8e6a3 100%);
  color: white;
}

.staff-card {
  border-color: #a8d8ea;
  background: linear-gradient(135deg, #a8d8ea 0%, #bde3f0 100%);
  color: white;
}

.stories-card {
  border-color: #deb887;
  background: linear-gradient(135deg, #deb887 0%, #e6c79a 100%);
  color: white;
}

.students-card {
  border-color: #ffeb9c;
  background: linear-gradient(135deg, #ffeb9c 0%, #fff2b8 100%);
  color: #2c3e50;
}

.classrooms-card {
  border-color: #b19cd9;
  background: linear-gradient(135deg, #b19cd9 0%, #c9b8e8 100%);
  color: white;
}

.assignments-card {
  border-color: #ffb3ba;
  background: linear-gradient(135deg, #ffb3ba 0%, #ffc9ce 100%);
  color: #2c3e50;
}

.card-number {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  line-height: 1.2;
  opacity: 0.9;
}

/* Chart Section */
.chart-section {
  padding: 20px 0;
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
  background: white;
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
  gap: 15px;
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
  max-width: 80px;
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
  font-size: 12px;
  font-weight: bold;
  color: #666;
  text-align: center;
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  white-space: nowrap;
}

.bar-context {
  font-family: "Jua", cursive;
  font-size: 10px;
  color: #999;
  text-align: center;
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
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
  min-height: 5px;
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
    height: 0;
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bar-green {
  background: linear-gradient(to top, #5fb878, #88c999, #a8e6b8);
  box-shadow: 0 4px 12px rgba(95, 184, 120, 0.3);
}

.bar-blue {
  background: linear-gradient(to top, #6eb5d4, #a8d8ea, #c8e8fa);
  box-shadow: 0 4px 12px rgba(110, 181, 212, 0.3);
}

.bar-orange {
  background: linear-gradient(to top, #d4a574, #deb887, #f0d8a7);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.3);
}

.bar-yellow {
  background: linear-gradient(to top, #f4d03f, #ffeb9c, #fff9c4);
  box-shadow: 0 4px 12px rgba(244, 208, 63, 0.3);
}

.bar-purple {
  background: linear-gradient(to top, #9370db, #b19cd9, #d4c4f0);
  box-shadow: 0 4px 12px rgba(147, 112, 219, 0.3);
}

.bar-pink {
  background: linear-gradient(to top, #ff88a5, #ffb3ba, #ffd4d9);
  box-shadow: 0 4px 12px rgba(255, 136, 165, 0.3);
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

.bar-green:hover {
  box-shadow: 0 8px 20px rgba(95, 184, 120, 0.4);
}

.bar-blue:hover {
  box-shadow: 0 8px 20px rgba(110, 181, 212, 0.4);
}

.bar-orange:hover {
  box-shadow: 0 8px 20px rgba(212, 165, 116, 0.4);
}

.bar-yellow:hover {
  box-shadow: 0 8px 20px rgba(244, 208, 63, 0.4);
}

.bar-purple:hover {
  box-shadow: 0 8px 20px rgba(147, 112, 219, 0.4);
}

.bar-pink:hover {
  box-shadow: 0 8px 20px rgba(255, 136, 165, 0.4);
}

/* Requests Section */
.requests-section {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 20px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.requests-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.request-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease-in-out;
}

.request-item:hover {
  background: #e3f2fd;
  border-color: #2196f3;
  transform: translateY(-1px);
}

.request-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.request-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.person-icon {
  font-size: 28px;
  color: #6c757d;
}

.request-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.request-name {
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.request-type {
  font-size: 10px;
  font-weight: 500;
  color: #6c757d;
  text-transform: capitalize;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

.approve-btn {
  background: #28a745;
  color: white;
}

.approve-btn:hover {
  background: #218838;
  transform: scale(1.05);
}

.reject-btn {
  background: #dc3545;
  color: white;
}

.reject-btn:hover {
  background: #c82333;
  transform: scale(1.05);
}

/* Activity Section */
.activity-section {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.activity-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  padding: 12px 15px;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #007bff;
  transition: all 0.3s ease-in-out;
}

.activity-item:hover {
  background: #e3f2fd;
  transform: translateX(3px);
}

.activity-text {
  font-size: 11px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 10px;
  color: #6c757d;
  font-weight: 600;
}

/* Contact Details Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  box-sizing: border-box;
}

.details-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  background: rgba(108, 117, 125, 0.1);
  color: #2c3e50;
  transform: scale(1.1);
}

.close-icon {
  font-size: 20px;
}

.modal-content {
  padding: 25px;
}

.contact-card {
  background: linear-gradient(135deg, #88c999 0%, #a8e6a3 100%);
  border-radius: 15px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 8px 25px rgba(136, 201, 153, 0.3);
}

.contact-header {
  margin-bottom: 15px;
}

.contact-label {
  font-size: 14px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.contact-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
}

.contact-icon {
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.contact-text {
  font-size: 14px;
  font-weight: 500;
  color: white;
  word-break: break-all;
}

/* Modal Animations */
.modal-ease-enter-active {
  transition: all 0.4s ease-out;
}

.modal-ease-leave-active {
  transition: all 0.3s ease-in;
}

.modal-ease-enter-from,
.modal-ease-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.modal-slide-enter-active {
  transition: all 0.5s ease-out;
}

.modal-slide-leave-active {
  transition: all 0.3s ease-in;
}

.modal-slide-enter-from {
  opacity: 0;
  transform: translateY(50px) scale(0.8);
}

.modal-slide-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.9);
}

/* List Animations */
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

/* Responsive Design */
@media (max-width: 768px) {
  .admin-dashboard-container {
    padding: 15px;
  }

  .greeting-name {
    font-size: 24px;
  }

  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .analytics-card {
    padding: 15px;
  }

  .card-number {
    font-size: 28px;
  }

  .chart-container {
    width: 200px;
    height: 200px;
  }

  .pie-chart {
    width: 200px;
    height: 200px;
  }

  .bar-chart {
    padding: 0 20px;
    gap: 8px;
  }

  .bar-group {
    max-width: 60px;
  }

  .bar-label {
    font-size: 10px;
    bottom: -25px;
  }

  .bar-context {
    font-size: 9px;
    bottom: -40px;
  }
}

@media (max-width: 480px) {
  .admin-dashboard-container {
    padding: 10px;
  }

  .analytics-section,
  .requests-section,
  .activity-section {
    padding: 20px;
  }

  .greeting-name {
    font-size: 20px;
  }

  .request-actions {
    flex-direction: column;
    gap: 4px;
  }

  .action-btn {
    padding: 8px 10px;
    font-size: 9px;
  }

  .details-modal {
    max-width: 350px;
  }

  .modal-header {
    padding: 15px 20px;
  }

  .modal-title {
    font-size: 16px;
  }

  .modal-content {
    padding: 20px;
  }

  .contact-text {
    font-size: 12px;
  }
}
</style>
