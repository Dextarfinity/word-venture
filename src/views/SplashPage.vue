<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Sky background with clouds -->
      <div class="landing-page">
        <!-- Background image -->
        <div class="background-image"></div>

        <!-- Cloud decorations using CSS -->
        <div class="clouds">
          <div class="cloud cloud1"></div>
          <div class="cloud cloud2"></div>
          <div class="cloud cloud3"></div>
          <div class="cloud cloud4"></div>
          <div class="cloud cloud5"></div>
          <div class="cloud cloud6"></div>
          <div class="cloud cloud7"></div>
          <div class="cloud cloud8"></div>
        </div>

        <!-- Content Container -->
        <div class="content-container">
          <!-- Capybara Character -->
          <div class="capybara-container">
            <img
              src="@/img/CapyBuddy Assets/Splash/capybara.png"
              alt="CapyBuddy Mascot"
              class="capybara-image"
            />
          </div>

          <!-- App Title and Tagline -->
          <div class="title-section">
            <h1 class="app-title">CapyBuddy</h1>
            <p class="app-tagline">From little sounds to big stories.</p>
          </div>

          <!-- Action Buttons -->
          <div class="button-section">
            <ion-button
              @click="
                playClick('student');
                goToLogin();
              "
              expand="block"
              class="action-button login-button"
            >
              LOG IN
            </ion-button>

            <ion-button
              @click="
                playClick('student');
                goToSignUp();
              "
              expand="block"
              class="action-button signup-button"
            >
              SIGN UP
            </ion-button>

            <ion-button
              @click="
                playClick('student');
                continueAsGuest();
              "
              expand="block"
              class="action-button guest-button"
            >
              SIGN IN AS GUEST
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonButton } from "@ionic/vue";
import { useRouter } from "vue-router";
import { onMounted, onBeforeUnmount } from "vue";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const router = useRouter();

// Lifecycle
onMounted(() => {
  console.log("🎵 Starting lobby music for SplashPage...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby music for SplashPage...");
  stopMusic();
});

const goToLogin = () => {
  playClick("student"); // 🎵 Play click sound
  router.push("/login");
};

const goToSignUp = () => {
  playClick("student"); // 🎵 Play click sound
  router.push("/signup");
};

const continueAsGuest = () => {
  playClick("student"); // 🎵 Play click sound
  // Navigate to offline reading selection for guest users
  router.push("/offline-reading-selection");
};
</script>

<style scoped>
.landing-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #87ceeb 0%, #b0e0e6 100%);
  z-index: 1;
}

.clouds {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
}

.cloud {
  position: absolute;
  background: white;
  border-radius: 50px;
  opacity: 0.9;
}

.cloud:before,
.cloud:after {
  content: "";
  position: absolute;
  background: white;
  border-radius: 50px;
}

.cloud1 {
  width: 80px;
  height: 40px;
  top: 15%;
  left: 10%;
  animation: float 20s infinite linear;
}

.cloud1:before {
  width: 50px;
  height: 50px;
  top: -25px;
  left: 10px;
}

.cloud1:after {
  width: 60px;
  height: 40px;
  top: -15px;
  right: 10px;
}

.cloud2 {
  width: 60px;
  height: 30px;
  top: 25%;
  right: 15%;
  animation: float 25s infinite linear reverse;
}

.cloud2:before {
  width: 40px;
  height: 40px;
  top: -20px;
  left: 5px;
}

.cloud2:after {
  width: 50px;
  height: 30px;
  top: -10px;
  right: 5px;
}

.cloud3 {
  width: 40px;
  height: 20px;
  top: 35%;
  left: 5%;
  animation: float 30s infinite linear;
}

.cloud4 {
  width: 50px;
  height: 25px;
  top: 45%;
  right: 20%;
  animation: float 22s infinite linear reverse;
}

.cloud5 {
  width: 70px;
  height: 35px;
  bottom: 35%;
  left: 15%;
  animation: float 18s infinite linear;
}

.cloud6 {
  width: 45px;
  height: 22px;
  bottom: 45%;
  right: 10%;
  animation: float 28s infinite linear reverse;
}

.cloud7 {
  width: 35px;
  height: 18px;
  bottom: 25%;
  left: 8%;
  animation: float 24s infinite linear;
}

.cloud8 {
  width: 55px;
  height: 28px;
  bottom: 55%;
  right: 25%;
  animation: float 26s infinite linear reverse;
}

@keyframes float {
  0% {
    transform: translateX(-20px);
  }
  100% {
    transform: translateX(20px);
  }
}

.content-container {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  max-width: 350px;
  width: 100%;
}

.capybara-container {
  margin-bottom: 30px;
}

.capybara-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

.title-section {
  text-align: center;
  margin-bottom: 40px;
}

.app-title {
  font-size: 32px;
  font-weight: bold;
  color: #8b4513;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: "Jua", cursive;
}

.app-tagline {
  font-size: 16px;
  color: #a0522d;
  font-weight: 500;
  font-family: "Jua", cursive;
}

.button-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-button {
  --border-radius: 25px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  font-weight: 600;
  font-size: 16px;
  text-transform: none;
  height: 50px;
  font-family: "Jua", cursive;
}

.login-button {
  --background: #28a745;
  --background-hover: #218838;
  --color: white;
}

.signup-button {
  --background: #fd7e14;
  --background-hover: #e8690b;
  --color: white;
}

.guest-button {
  --background: #6c757d;
  --background-hover: #545b62;
  --color: white;
}
</style>
