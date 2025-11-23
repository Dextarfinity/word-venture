<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Loading Screen -->
      <loading-screen :is-loading="isLoading" message="Creating your account" />

      <!-- Back Button -->
      <div class="back-button-container">
        <button @click="playClick('student'); goBack()" class="back-button">
          <ion-icon :icon="arrowBackOutline" class="back-icon"></ion-icon>
        </button>
      </div>
      
      <!-- Main Container -->
      <div class="signup-container">
        <!-- Capybara at Top -->
        <div class="capybara-section">
          <img
            src="@/img/CapyBuddy Assets/Capybara/capybara (2).png"
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
          <!-- Full Name Input -->
          <div class="input-wrapper">
            <ion-input
              v-model="fullName"
              type="text"
              placeholder="Kylene Angela M. Rocales"
              class="custom-input"
            ></ion-input>
          </div>

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
          <div class="input-wrapper password-wrapper">
            <ion-input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••••••"
              class="custom-input"
            ></ion-input>
            <button @click="showPassword = !showPassword" class="password-toggle" type="button">
              <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline" class="eye-icon"></ion-icon>
            </button>
          </div>

          <!-- Confirm Password Input -->
          <div class="input-wrapper password-wrapper">
            <ion-input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="••••••••••••"
              class="custom-input"
            ></ion-input>
            <button @click="showConfirmPassword = !showConfirmPassword" class="password-toggle" type="button">
              <ion-icon :icon="showConfirmPassword ? eyeOffOutline : eyeOutline" class="eye-icon"></ion-icon>
            </button>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <!-- Sign Up Button -->
          <ion-button 
            @click="playClick('student'); handleSignUp()" 
            expand="block" 
            class="signup-button"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Creating Account...</span>
            <span v-else>SIGN UP</span>
          </ion-button>

          <!-- Login Link -->
          <div class="login-link">
            <span class="link-text">Have an account already? </span>
            <button @click="playClick('student'); $router.push('/login')" class="link-button">Log In</button>
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
import { IonPage, IonContent, IonInput, IonButton, IonIcon, toastController } from "@ionic/vue";
import { arrowBackOutline, eyeOutline, eyeOffOutline } from "ionicons/icons";
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { AuthService } from '@/services';
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import LoadingScreen from "../components/LoadingScreen.vue";

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

const router = useRouter();

// Form state
const fullName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const isLoading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const showSuccessToast = async () => {
  const toast = await toastController.create({
    message: 'Sign up succeeded, please confirm your email...',
    duration: 7000,
    position: 'top',
    color: 'success',
    buttons: [
      {
        text: 'Close',
        role: 'cancel',
      }
    ]
  });

  await toast.present();
};

// Sign up handler with backend integration
const handleSignUp = async () => {
  // Validation
  if (!fullName.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Please fill in all fields';
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters long';
    return;
  }

  errorMessage.value = '';
  isLoading.value = true;

  try {
    console.log('🚀 Starting signup process with:', {
      email: email.value,
      full_name: fullName.value,
      user_type: 'student'
    });

    const result = await AuthService.signUp(email.value, password.value, {
      fullName: fullName.value,
      userType: 'student' // Default to student
    });

    console.log('📝 Signup result:', result);

    if (result.success) {
      console.log('🎉 Sign up successful:', result.data);
      
      // Check if profile was created with full_name
      if (result.data.profile && result.data.profile.full_name) {
        console.log('✅ Profile created with full_name:', result.data.profile.full_name);
      } else if (result.data.profileError) {
        console.warn('⚠️ Profile creation had issues:', result.data.profileError);
      }
      
      // Show success toast
      await showSuccessToast();
      
      // Navigate to student home page
      router.push("/student/home");
    } else {
      errorMessage.value = result.error || 'Sign up failed';
    }
  } catch (error) {
    console.error('Sign up error:', error);
    errorMessage.value = 'An unexpected error occurred';
  } finally {
    isLoading.value = false;
  }
};

// Go back to splash page
const goBack = () => {
  playClick('student'); // 🎵 Play click sound
  router.push("/splash");
};

// Lifecycle
onMounted(() => {
  console.log("🎵 Starting menu music for SignUpPage...");
  startMusic(MUSIC_TYPES.MENU, 0.3);
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping menu music for SignUpPage...");
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

.signup-container {
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

.password-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.eye-icon {
  color: #999;
  font-size: 20px;
  transition: color 0.2s ease;
}

.password-toggle:hover .eye-icon {
  color: #666;
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

.signup-button {
  --background: #ff8c42;
  --background-hover: #e8690b;
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

.login-link {
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
</style>
