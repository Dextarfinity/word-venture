<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Background with sky gradient -->
      <div class="selection-page">
        <!-- Background with clouds -->
        <div class="background-image"></div>

        <!-- Animated clouds -->
        <div class="clouds">
          <div class="cloud cloud1"></div>
          <div class="cloud cloud2"></div>
          <div class="cloud cloud3"></div>
          <div class="cloud cloud4"></div>
          <div class="cloud cloud5"></div>
          <div class="cloud cloud6"></div>
        </div>

        <!-- Main Content -->
        <div class="content-container">
          <!-- Back Button -->
          <div class="back-button-container">
            <button
              class="back-button"
              @click="
                playClick('student');
                goBack();
              "
            >
              <ion-icon :icon="chevronBackOutline" class="back-icon"></ion-icon>
              <span class="back-text">Back</span>
            </button>
          </div>

          <!-- Centered Content -->
          <div class="centered-content">
            <!-- CapyBuddy mascot -->
            <div class="mascot-container">
              
              <h1 class="page-title">Choose Your Adventure</h1>
              <img
                src="@/img/CapyBuddy Assets/Capybara/capybara (1).png"
                alt="CapyBuddy Happy"
                class="mascot-image"
              />
            </div>

            <!-- Selection buttons -->
            <div class="selection-buttons">
            <ion-button
              @click="playClick('student'); goToStories()"
              expand="block"
              class="selection-button stories-button"
            >
              <div class="button-content">
                <ion-icon :icon="bookOutline" class="button-icon"></ion-icon>
                <div class="button-text">
                  <h3>Read Stories</h3>
                  <p>Explore exciting tales and adventures</p>
                </div>
              </div>
            </ion-button>

            <ion-button
              @click="playClick('student'); goToWords()"
              expand="block"
              class="selection-button words-button"
            >
              <div class="button-content">
                <ion-icon
                  :icon="chatbubbleEllipsesOutline"
                  class="button-icon"
                ></ion-icon>
                <div class="button-text">
                  <h3>Read Words</h3>
                  <p>Practice pronunciation and spelling</p>
                </div>
              </div>
            </ion-button>
          </div>
          </div>
        </div>
      </div>

      <!-- Welcome Modal -->
      <ion-modal :is-open="showWelcomeModal" @willDismiss="closeWelcomeModal">
        <div class="modal-content">
          <!-- Modal Header -->
          <div class="modal-header">
            <img
              src="@/img/CapyBuddy Assets/Capybara/capybara (14).png"
              alt="CapyBuddy Excited"
              class="modal-mascot"
            />
            <h2 class="modal-title">Welcome to CapyBuddy!</h2>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <div class="welcome-message">
              <p class="greeting">Hello there, young reader! 🌟</p>

              <p class="introduction">
                I'm CapyBuddy, your friendly reading companion! I'm here to help you
                discover the magical world of words and stories.
              </p>

              <div class="features-list">
                <div class="feature-item">
                  <ion-icon :icon="bookOutline" class="feature-icon"></ion-icon>
                  <span>Read amazing stories with beautiful illustrations</span>
                </div>
                <div class="feature-item">
                  <ion-icon :icon="micOutline" class="feature-icon"></ion-icon>
                  <span>Practice speaking words out loud</span>
                </div>
                <div class="feature-item">
                  <ion-icon :icon="starOutline" class="feature-icon"></ion-icon>
                  <span>Learn at your own pace and have fun</span>
                </div>
              </div>

              <p class="encouragement">
                Are you ready to start your reading adventure with me? Let's explore
                together! 🚀
              </p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <ion-button @click="playClick('student'); closeWelcomeModal()" expand="block" class="modal-button">
              <ion-icon :icon="rocketOutline"></ion-icon>
              Let's Start Reading!
            </ion-button>
          </div>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { IonPage, IonContent, IonButton, IonIcon, IonModal } from "@ionic/vue";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();
import {
  chevronBackOutline,
  bookOutline,
  chatbubbleEllipsesOutline,
  micOutline,
  starOutline,
  rocketOutline,
} from "ionicons/icons";
import { useRouter } from "vue-router";

const router = useRouter();
const showWelcomeModal = ref(true);

// Navigation methods
const goBack = () => {
  router.push("/");
};

const goToStories = () => {
  router.push("/offline-reading-stories");
};

const goToWords = () => {
  router.push("/offline-reading-words");
};

// Modal methods
const closeWelcomeModal = () => {
  showWelcomeModal.value = false;
};

// Auto-show welcome modal on mount
onMounted(() => {
  console.log("🎵 Starting lobby music for OfflineReadingSelection...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);
  
  setTimeout(() => {
    showWelcomeModal.value = true;
  }, 300);
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby music for OfflineReadingSelection...");
  stopMusic();
});
</script>

<style scoped>
.selection-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #87ceeb 0%, #b0e0e6 50%, #e0f6ff 100%);
  z-index: 1;
}

/* Cloud animations */
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
  opacity: 0.8;
}

.cloud:before,
.cloud:after {
  content: "";
  position: absolute;
  background: white;
  border-radius: 50px;
}

.cloud1 {
  width: 60px;
  height: 30px;
  top: 10%;
  left: 10%;
  animation: float 25s infinite linear;
}

.cloud1:before {
  width: 40px;
  height: 40px;
  top: -20px;
  left: 8px;
}

.cloud1:after {
  width: 50px;
  height: 30px;
  top: -10px;
  right: 8px;
}

.cloud2 {
  width: 80px;
  height: 40px;
  top: 20%;
  right: 15%;
  animation: float 20s infinite linear reverse;
}

.cloud2:before {
  width: 50px;
  height: 50px;
  top: -25px;
  left: 15px;
}

.cloud2:after {
  width: 60px;
  height: 40px;
  top: -15px;
  right: 15px;
}

.cloud3 {
  width: 40px;
  height: 20px;
  bottom: 30%;
  left: 20%;
  animation: float 30s infinite linear;
}

.cloud4 {
  width: 70px;
  height: 35px;
  bottom: 40%;
  right: 10%;
  animation: float 18s infinite linear reverse;
}

.cloud5 {
  width: 50px;
  height: 25px;
  top: 35%;
  left: 5%;
  animation: float 22s infinite linear;
}

.cloud6 {
  width: 45px;
  height: 22px;
  bottom: 60%;
  right: 25%;
  animation: float 28s infinite linear reverse;
}

@keyframes float {
  0% {
    transform: translateX(-30px);
  }
  100% {
    transform: translateX(30px);
  }
}

.content-container {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
}

.back-button-container {
  flex-shrink: 0;
  position: absolute;
  left: 20px;
  top: 60px;
  z-index: 10;
}

.centered-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
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
}

.back-icon {
  font-size: 20px;
}

.back-text {
  font-size: 16px;
  font-weight: normal;
}

.mascot-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #8b4513;
  text-align: left;
  margin: 0;
  font-family: "Jua", cursive;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  line-height: 1.2;
}

.mascot-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.selection-buttons {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 40px;
}

.selection-button {
  --border-radius: 20px;
  --padding-top: 0;
  --padding-bottom: 0;
  height: 100px;
  font-family: "Jua", cursive;
}

.stories-button {
  --background: linear-gradient(135deg, #ffa726, #ff8a50);
  --background-hover: linear-gradient(135deg, #ff9800, #ff6f00);
  --color: white;
}

.words-button {
  --background: linear-gradient(135deg, #66bb6a, #4caf50);
  --background-hover: linear-gradient(135deg, #4caf50, #388e3c);
  --color: white;
}

.button-content {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  width: 100%;
}

.button-icon {
  font-size: 32px;
  margin-right: 15px;
  flex-shrink: 0;
}

.button-text {
  text-align: left;
}

.button-text h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: bold;
}

.button-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.3;
}

/* Modal Styles */
.modal-content {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #fff8e1 0%, #fffde7 100%);
}

.modal-header {
  text-align: center;
  padding: 30px 20px 20px;
  background: linear-gradient(135deg, #ffe082, #ffcc02);
}

.modal-mascot {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin: 0 auto 15px;
  display: block;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.modal-title {
  font-size: 24px;
  font-weight: bold;
  color: #8b4513;
  margin: 0;
  font-family: "Jua", cursive;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.modal-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.welcome-message {
  text-align: center;
}

.greeting {
  font-size: 20px;
  font-weight: bold;
  color: #8b4513;
  margin-bottom: 15px;
  font-family: "Jua", cursive;
}

.introduction {
  font-size: 16px;
  color: #5d4037;
  line-height: 1.5;
  margin-bottom: 20px;
  font-family: "Jua", cursive;
}

.features-list {
  margin: 25px 0;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  font-family: "Jua", cursive;
}

.feature-icon {
  font-size: 24px;
  color: #ffa726;
  margin-right: 15px;
  flex-shrink: 0;
}

.feature-item span {
  color: #5d4037;
  font-size: 14px;
  line-height: 1.4;
}

.encouragement {
  font-size: 16px;
  color: #8b4513;
  font-weight: 500;
  line-height: 1.5;
  margin-top: 20px;
  font-family: "Jua", cursive;
}

.modal-footer {
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
}

.modal-button {
  --background: linear-gradient(135deg, #4caf50, #8bc34a);
  --background-hover: linear-gradient(135deg, #45a049, #7cb342);
  --color: white;
  --border-radius: 25px;
  --padding-top: 15px;
  --padding-bottom: 15px;
  font-weight: 600;
  font-size: 16px;
  font-family: "Jua", cursive;
  height: 55px;
}

/* Responsive adjustments */
@media (max-height: 700px) {
  .header-section {
    margin-bottom: 30px;
  }

  .mascot-container {
    margin-bottom: 30px;
  }

  .mascot-image {
    width: 100px;
    height: 100px;
  }
}

@media (max-height: 600px) {
  .header-section {
    margin-bottom: 20px;
  }

  .mascot-container {
    margin-bottom: 20px;
  }

  .mascot-image {
    width: 90px;
    height: 90px;
  }

  .modal-header {
    padding: 20px 20px 15px;
  }

  .modal-mascot {
    width: 60px;
    height: 60px;
  }

  .modal-title {
    font-size: 20px;
  }

  .greeting {
    font-size: 18px;
  }
}
</style>
