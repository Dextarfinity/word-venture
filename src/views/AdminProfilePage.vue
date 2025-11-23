<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Main Container -->
      <div class="admin-profile-container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-row">
            <!-- Back Button -->
            <button class="back-btn" @click="playClick('teacher'); navigateBack()">
              <ion-icon :icon="arrowBackOutline" class="back-icon"></ion-icon>
              <span class="back-text">Back</span>
            </button>

            <!-- Title -->
            <h1 class="page-title">Profile</h1>

            <!-- Spacer for layout balance -->
            <div style="width: 40px;"></div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Profile Card -->
          <div class="profile-card">
            <div class="profile-info">
              <!-- Avatar Section -->
              <div class="avatar-section">
                <div class="avatar-container">
                  <img
                    src="@/img/adminicon.png"
                    alt="Admin Avatar"
                    class="profile-avatar"
                  />
                </div>
              </div>

              <!-- Profile Details -->
              <div class="profile-details">
                <div class="admin-name">{{ adminProfile.name }}</div>
                <div class="admin-email">{{ adminProfile.email }}</div>
                <div class="admin-role">{{ adminProfile.role }}</div>
              </div>
            </div>
          </div>

          <!-- Recent Activity Section -->
          <div class="activity-section">
            <h3 class="section-title">Recent Activity</h3>

            <!-- Loading State -->
            <div v-if="adminLoading" class="loading-state">
              <div class="spinner"></div>
              <p class="loading-text">Loading activity...</p>
            </div>

            <!-- Activity List -->
            <div v-else-if="recentActivity.length > 0" class="activity-list">
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

            <!-- Empty State -->
            <Transition v-else name="fade">
              <div v-if="recentActivity.length === 0" class="empty-state">
                <div class="empty-icon">
                  <ion-icon
                    :icon="documentTextOutline"
                    class="empty-activity-icon"
                  ></ion-icon>
                </div>
                <p class="empty-text">No recent activity</p>
              </div>
            </Transition>
          </div>

          <!-- Action Buttons -->
          <div class="action-section">
            <button class="action-button logout-btn" @click="playClick('teacher'); showLogoutConfirmation()">
              <ion-icon :icon="logOutOutline" class="action-icon"></ion-icon>
              <span class="action-text">Logout</span>
            </button>

            <button
              class="action-button manage-users-btn"
              @click="playClick('teacher'); navigateToUserManagement()"
            >
              <ion-icon :icon="peopleOutline" class="action-icon"></ion-icon>
              <span class="action-text">Manage Users</span>
            </button>
          </div>
        </div>

        <!-- Logout Confirmation Modal -->
        <Transition name="modal-fade" appear>
          <div v-if="showLogoutModal" class="modal-overlay" @click="playClick('teacher'); cancelLogout()">
            <Transition name="modal-scale" appear>
              <div class="logout-modal" @click.stop>
                <div class="modal-icon-container">
                  <ion-icon :icon="warningOutline" class="warning-icon"></ion-icon>
                </div>
                <h3 class="modal-title">Confirm Logout</h3>
                <p class="modal-text">Are you sure you want to logout?</p>
                <div class="modal-actions">
                  <button class="modal-btn cancel-btn" @click="playClick('teacher'); cancelLogout()">
                    CANCEL
                  </button>
                  <button class="modal-btn confirm-btn" @click="playClick('teacher'); confirmLogout()">
                    LOGOUT
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </Transition>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup>
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import {
  arrowBackOutline,
  logOutOutline,
  peopleOutline,
  documentTextOutline,
  warningOutline,
} from "ionicons/icons";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth, useAdmin } from "@/composables/services";
import { useAudio } from "@/composables/useAudio";

const router = useRouter();
const { profile, logout, initialize: initAuth } = useAuth();
const { 
  adminActivity: backendAdminActivity,
  getAdminActivity,
  isLoading: adminLoading 
} = useAdmin();
const { playClick } = useAudio();

// Modal state
const showLogoutModal = ref(false);

// Admin Profile Data from backend
const adminProfile = computed(() => ({
  name: profile.value?.full_name?.toUpperCase() || "ADMIN USER",
  email: profile.value?.email || "admin@wordventure.com",
  role: profile.value?.user_type === 'admin' ? "System Administrator" : "Administrator",
}));

// Recent Activity Data from backend
const recentActivity = computed(() => backendAdminActivity.value || []);

// Navigation methods
const navigateBack = () => {
  router.push("/admin/dashboard");
};

const navigateToUserManagement = () => {
  router.push("/admin/users");
};

// Logout functionality
const showLogoutConfirmation = () => {
  showLogoutModal.value = true;
};

const cancelLogout = () => {
  showLogoutModal.value = false;
};

const confirmLogout = async () => {
  try {
    showLogoutModal.value = false;

    console.log("🚪 Logging out admin...");

    // Call the actual logout function from useAuth
    const result = await logout();

    if (result.success) {
      console.log("✅ Logout successful");
      
      // Redirect to login page
      router.push("/login");
    } else {
      console.error("❌ Logout failed:", result.error);
    }
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// Initialize component
onMounted(async () => {
  try {
    console.log("🔧 Initializing Admin Profile Page...");

    // Initialize authentication
    await initAuth();

    if (profile.value) {
      console.log("✅ Admin profile loaded:", profile.value);
      
      // Fetch recent activity
      await getAdminActivity();
      
      console.log("📊 Recent activity loaded:", recentActivity.value?.length || 0, "items");
    } else {
      console.log("❌ Admin not authenticated, redirecting to login");
      router.push("/login");
    }
  } catch (error) {
    console.error("Error initializing admin profile:", error);
  }
});
</script>

<style scoped>
/* Main Container */
.admin-profile-container {
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
  padding: 0 5px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: #2c3e50;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  padding: 8px;
  border-radius: 8px;
}

.back-btn:hover {
  background: rgba(44, 62, 80, 0.1);
  transform: translateX(-2px);
}

.back-icon {
  font-size: 20px;
}

.back-text {
  font-size: 16px;
  font-weight: 500;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Main Content */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* Profile Card */
.profile-card {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.avatar-container {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 4px solid white;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-details {
  flex: 1;
}

.admin-name {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.admin-email {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
  font-weight: 500;
}

.admin-role {
  font-size: 12px;
  color: #007bff;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(0, 123, 255, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
}

/* Activity Section */
.activity-section {
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

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 15px;
}

.empty-activity-icon {
  font-size: 48px;
  color: #dee2e6;
}

.empty-text {
  font-size: 14px;
  color: #6c757d;
  margin: 0;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: #6c757d;
  margin: 0;
}

/* Action Section */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 15px;
  background: white;
  border: 2px solid transparent;
  border-radius: 15px;
  padding: 18px 20px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.logout-btn {
  border-color: #dc3545;
  color: #dc3545;
}

.logout-btn:hover {
  background: #dc3545;
  color: white;
}

.manage-users-btn {
  border-color: #28a745;
  color: #28a745;
}

.manage-users-btn:hover {
  background: #28a745;
  color: white;
}

.action-icon {
  font-size: 24px;
}

.action-text {
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Modal Styles */
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

.logout-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 350px;
  padding: 25px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.modal-icon-container {
  margin-bottom: 20px;
}

.warning-icon {
  font-size: 64px;
  color: #ffc107;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 15px 0;
}

.modal-text {
  font-size: 14px;
  color: #6c757d;
  margin: 0 0 25px 0;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.modal-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.confirm-btn {
  background: #dc3545;
  color: white;
}

.confirm-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
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

.modal-scale-enter-active {
  transition: all 0.5s ease-out;
}

.modal-scale-leave-active {
  transition: all 0.3s ease-in;
}

.modal-scale-enter-from {
  opacity: 0;
  transform: translateY(50px) scale(0.8);
}

.modal-scale-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.9);
}

/* Existing modal animations for other modals */
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

/* Fade Animation */
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

/* Responsive Design */
@media (max-width: 768px) {
  .admin-profile-container {
    padding: 15px;
  }

  .page-title {
    font-size: 20px;
  }

  .profile-info {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }

  .admin-name {
    font-size: 18px;
  }

  .action-button {
    padding: 15px 18px;
  }
}

@media (max-width: 480px) {
  .admin-profile-container {
    padding: 10px;
  }

  .profile-card,
  .activity-section {
    padding: 20px;
  }

  .header-row {
    padding: 0;
  }

  .back-text {
    display: none;
  }

  .avatar-container {
    width: 70px;
    height: 70px;
  }

  .action-text {
    font-size: 14px;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
