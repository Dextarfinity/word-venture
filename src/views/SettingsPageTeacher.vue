<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Loading Screen -->
      <loading-screen :is-loading="isLoading" message="Loading settings" />

      <!-- Main Container -->
      <div class="settings-container">
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
              <h1 class="page-title">Settings</h1>
            </div>

            <!-- Empty space for balance -->
            <div class="spacer"></div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Get in Touch Card -->
          <div class="contact-card">
            <div class="contact-header">
              <h3 class="contact-title">GET IN TOUCH WITH US</h3>
            </div>
            <div class="contact-content">
              <p class="contact-question">How can we help?</p>
              <div class="contact-email">
                <span class="email-text">contacthappybuddy@gmail.com</span>
              </div>
            </div>
          </div>

          <!-- Logout Button -->
          <div class="logout-section">
            <button class="logout-btn" @click="playClick('teacher'); handleLogout()">LOG OUT</button>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Toast Notification -->
    <ion-toast
      :is-open="showToast"
      message="We will send you an email for your request. Kindly check it!"
      :duration="7000"
      @did-dismiss="showToast = false"
      color="success"
      position="top"
    ></ion-toast>

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
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import { chevronBackOutline, warningOutline } from "ionicons/icons";
import { useRouter } from "vue-router";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useAuth } from '@/composables/services';
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import LoadingScreen from "../components/LoadingScreen.vue";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const router = useRouter();
const { logout } = useAuth();

// Reactive state
const isLoading = ref(true);
const showToast = ref(false);
const showLogoutModal = ref(false);

// Navigation functions
const goBack = () => {
  router.go(-1);
};

const handleLogout = async () => {
  showLogoutModal.value = true;
};

const cancelLogout = () => {
  showLogoutModal.value = false;
};

const confirmLogout = async () => {
  try {
    console.log('👨‍🏫 Teacher logging out...');
    showLogoutModal.value = false;
    await logout();
    router.push("/login");
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

// Lifecycle
onMounted(() => {
  console.log("🎵 Starting lobby music for SettingsPageTeacher...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);
  isLoading.value = false;
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby music for SettingsPageTeacher...");
  stopMusic();
});
</script>

<style scoped>
.settings-container {
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
  width: 100%;
}

.back-button-container {
  flex-shrink: 0;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #ff8a50;
  font-family: "Jua", cursive;
  transition: all 0.2s ease;
}

.back-button:hover {
  transform: translateX(-2px);
}

.back-icon {
  font-size: 20px;
}

.back-text {
  font-size: 16px;
  font-weight: normal;
}

.page-title-container {
  flex: 1;
  text-align: center;
}

.page-title {
  font-family: "Jua", cursive;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.spacer {
  flex-shrink: 0;
  width: 60px; /* Same width as back button for balance */
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Contact Card */
.contact-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.contact-header {
  background: #88c999;
  padding: 16px 20px;
  text-align: center;
}

.contact-title {
  font-family: "Jua", cursive;
  font-size: 16px;
  font-weight: bold;
  color: white;
  margin: 0;
}

.contact-content {
  padding: 20px;
  text-align: center;
}

.contact-question {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #333;
  margin: 0 0 16px 0;
}

.contact-email {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 12px 16px;
}

.email-text {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #666;
}

/* Logout Section */
.logout-section {
  margin-top: auto;
  padding: 20px 0;
}

.logout-btn {
  width: 100%;
  background: #8b4513;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px 20px;
  font-family: "Jua", cursive;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: #7a3d0f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
}

.logout-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(139, 69, 19, 0.3);
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .card-content {
    gap: 8px;
  }

  .card-title {
    font-size: 14px;
  }

  .card-description {
    font-size: 11px;
  }
}

/* Logout Modal */
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
  font-family: "Jua", cursive;
}

.modal-text {
  font-size: 14px;
  color: #6c757d;
  margin: 0 0 25px 0;
  line-height: 1.5;
  font-family: "Jua", cursive;
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
  font-family: "Jua", cursive;
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
</style>
