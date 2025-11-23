<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Loading Screen -->
      <loading-screen :is-loading="isLoading" message="Signing in" />

      <!-- Back Button -->
      <div class="back-button-container">
        <button @click="playClick('student'); goBack()" class="back-button">
          <ion-icon :icon="arrowBackOutline" class="back-icon"></ion-icon>
        </button>
      </div>

      <!-- Main Container -->
      <div class="login-container">
        <!-- Capybara at Top -->
        <div class="capybara-section">
          <img
            src="@/img/CapyBuddy Assets/Capybara/capybara (1).png"
            alt="CapyBuddy Mascot"
            class="capybara-image"
          />
        </div>

        <!-- App Title -->
        <div class="title-section">
          <h1 class="app-title">CapyBuddy</h1>
          <p class="app-subtitle">From little sounds to big stories.</p>
        </div>

        <!-- Form Section -->
        <div class="form-section">
          <!-- Email Input -->
          <div class="input-wrapper">
            <ion-input
              v-model="email"
              type="email"
              placeholder="rocales.kylene@gmail.com"
              class="custom-input"
            ></ion-input>
          </div>

          <!-- Password Input -->
          <div class="input-wrapper">
            <ion-input
              v-model="password"
              type="password"
              placeholder="••••••••••••"
              class="custom-input"
            ></ion-input>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <!-- Login Button -->
          <ion-button
            @click="playClick('student'); handleLogin()"
            expand="block"
            class="login-button"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Logging in...</span>
            <span v-else>LOG IN</span>
          </ion-button>

          <!-- Sign Up Link -->
          <div class="signup-link">
            <span class="link-text">Don't have an account yet? </span>
            <button @click="playClick('student'); $router.push('/signup')" class="link-button">Sign Up</button>
          </div>
        </div>
        <!-- Footer -->
        <div class="mt-8 text-center">
          <p class="text-brown-700 text-sm">© 2025 CapyBuddy. All rights reserved.</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonInput, IonButton, IonIcon } from "@ionic/vue";
import { arrowBackOutline } from "ionicons/icons";
import { ref, onMounted, watch, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/services";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import LoadingScreen from "../components/LoadingScreen.vue";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const router = useRouter();
const { login, isLoading, error, isAuthenticated, profile, initialize } = useAuth();

// Form state
const email = ref("");
const password = ref("");
const errorMessage = ref("");

// Login handler with backend integration
const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = "Please enter both email and password";
    return;
  }

  errorMessage.value = "";

  const result = await login(email.value, password.value);

  if (result.success && profile.value) {
    console.log("🎉 Login successful:", profile.value);
    // Redirect based on user type
    switch (profile.value.user_type) {
      case "admin":
        router.push("/admin/dashboard");
        break;
      case "teacher":
        router.push("/teacher/home");
        break;
      case "student":
      default:
        router.push("/student/home");
        break;
    }
  } else {
    errorMessage.value = result.error || error.value || "Login failed";
  }
};

// Go back to splash page
const goBack = () => {
  playClick('student'); // 🎵 Play click sound
  router.push("/splash");
};

// Watch for auth errors
watch(error, (newError) => {
  if (newError) {
    errorMessage.value = newError;
  }
});

// Check if already authenticated on mount
onMounted(async () => {
  console.log("🎵 Starting menu music for LoginPage...");
  startMusic(MUSIC_TYPES.MENU, 0.3);
  
  await initialize();

  if (isAuthenticated.value && profile.value) {
    // Auto-redirect if already logged in
    console.log("🔄 Already authenticated, redirecting...");
    switch (profile.value.user_type) {
      case "admin":
        router.push("/admin/dashboard");
        break;
      case "teacher":
        router.push("/teacher/home");
        break;
      case "student":
      default:
        router.push("/student/home");
        break;
    }
  }
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping menu music for LoginPage...");
  stopMusic();
});
</script>

<style scoped>
.back-button-container {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
}

.back-button {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.back-button:hover {
  background: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.back-icon {
  color: #666;
  font-size: 20px;
}

.login-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.capybara-section {
  margin-bottom: 30px;
}

.capybara-image {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.title-section {
  text-align: center;
  margin-bottom: 40px;
}

.app-title {
  font-family: "Jua", cursive;
  font-size: 28px;
  font-weight: bold;
  color: #8b4513;
  margin-bottom: 8px;
}

.app-subtitle {
  font-family: "Jua", cursive;
  font-size: 14px;
  color: #666;
}

.form-section {
  width: 100%;
  max-width: 320px;
}

.input-wrapper {
  margin-bottom: 16px;
}

.custom-input {
  --background: white;
  --color: #333;
  --placeholder-color: #999;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  --border-radius: 25px;
  border: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: "Jua", cursive;
  height: 50px;
}

.login-button {
  --background: #28a745;
  --background-hover: #218838;
  --color: white;
  --border-radius: 25px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  font-family: "Jua", cursive;
  font-weight: 600;
  font-size: 16px;
  text-transform: none;
  margin-top: 20px;
  margin-bottom: 20px;
  height: 50px;
}

.signup-link {
  text-align: center;
  margin-top: 16px;
}

.link-text {
  color: #666;
  font-family: "Jua", cursive;
  font-size: 14px;
}

.link-button {
  color: #ff8c42;
  font-family: "Jua", cursive;
  font-size: 14px;
  font-weight: 600;
  background: none;
  border: none;
  text-decoration: underline;
  cursor: pointer;
}

.error-message {
  color: #ef4444;
  font-size: 14px;
  text-align: center;
  margin: 10px 0;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  font-family: "Jua", cursive;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
