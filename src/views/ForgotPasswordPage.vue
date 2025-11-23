<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Background -->
      <div
        class="min-h-screen bg-gradient-to-b from-blue-300 to-purple-400 flex flex-col items-center justify-center px-6"
      >
        <!-- Back Button -->
        <div class="w-full max-w-sm mb-4">
          <button
            @click="playClick('student'); $router.back()"
            class="flex items-center text-blue-900 font-semibold"
          >
            <ion-icon :icon="arrowBackOutline" class="mr-2"></ion-icon>
            Back
          </button>
        </div>

        <!-- Illustration -->
        <div class="w-full max-w-xs mb-6">
          <img
            src="@/img/CapyBuddy Assets/Capybara/capybara (6).png"
            alt="Capybara thinking"
            class="w-full h-auto"
          />
        </div>

        <!-- Title -->
        <div class="text-center mb-6">
          <h1 class="text-3xl font-bold text-blue-900 mb-2">Forgot Password?</h1>
          <p class="text-blue-800">Don't worry, we'll help you reset it!</p>
        </div>

        <!-- Reset Form -->
        <div class="w-full max-w-sm bg-white rounded-3xl p-6 shadow-lg">
          <div v-if="!emailSent">
            <h2 class="text-xl font-bold text-center text-gray-800 mb-4">
              Reset Password
            </h2>
            <p class="text-sm text-gray-600 text-center mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <!-- Email Input -->
            <div class="mb-6">
              <ion-input
                v-model="email"
                type="email"
                placeholder="Enter your email"
                fill="outline"
                class="custom-input"
                :class="{ 'ion-invalid': emailError }"
              ></ion-input>
              <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
            </div>

            <!-- Send Button -->
            <ion-button
              @click="playClick('student'); sendResetEmail()"
              expand="block"
              class="reset-button mb-4"
              :disabled="isLoading"
            >
              <div v-if="isLoading" class="flex items-center">
                <ion-spinner name="crescent" class="mr-2"></ion-spinner>
                Sending...
              </div>
              <span v-else>Send Reset Link</span>
            </ion-button>
          </div>

          <!-- Success State -->
          <div v-else class="text-center py-4">
            <div
              class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <ion-icon
                :icon="checkmarkOutline"
                class="text-green-600 text-2xl"
              ></ion-icon>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">Check Your Email</h3>
            <p class="text-sm text-gray-600 mb-6">
              We've sent a password reset link to <strong>{{ email }}</strong>
            </p>
            <p class="text-xs text-gray-500 mb-4">
              Didn't receive the email? Check your spam folder or try again.
            </p>

            <ion-button
              @click="playClick('student'); resetForm()"
              expand="block"
              fill="outline"
              class="retry-button"
            >
              Try Again
            </ion-button>
          </div>

          <!-- Back to Login -->
          <div class="text-center mt-4">
            <p class="text-gray-600 text-sm">
              Remember your password?
              <button
                @click="playClick('student'); $router.push('/login')"
                class="text-blue-600 font-semibold underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
} from "@ionic/vue";
import { arrowBackOutline, checkmarkOutline } from "ionicons/icons";
import { ref } from "vue";
import { useAuth } from "@/composables/services";

// Form state
const email = ref("");
const isLoading = ref(false);
const { resetPassword } = useAuth();
const emailSent = ref(false);
const emailError = ref("");

// Validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateForm = () => {
  emailError.value = "";

  if (!email.value) {
    emailError.value = "Email is required";
    return false;
  } else if (!validateEmail(email.value)) {
    emailError.value = "Please enter a valid email";
    return false;
  }

  return true;
};

// Send reset email
const sendResetEmail = async () => {
  if (!validateForm()) return;

  isLoading.value = true;

  try {
    console.log("🔄 Sending password reset email...");

    const result = await resetPassword(email.value);

    if (result.success) {
      emailSent.value = true;
      console.log("✅ Password reset email sent successfully");
    } else {
      emailError.value = result.error || "Failed to send reset email";
      console.error("❌ Password reset failed:", result.error);
    }
  } catch (error) {
    console.error("Reset password error:", error);
    emailError.value = "An unexpected error occurred";
  } finally {
    isLoading.value = false;
  }
};

// Reset form
const resetForm = () => {
  emailSent.value = false;
  email.value = "";
  emailError.value = "";
};
</script>

<style scoped>
.custom-input {
  --border-radius: 12px;
  --border-width: 2px;
  --border-color: #e5e7eb;
  --color: #374151;
  --placeholder-color: #9ca3af;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
}

.custom-input.ion-focused {
  --border-color: #3b82f6;
}

.custom-input.ion-invalid {
  --border-color: #ef4444;
}

.reset-button {
  --background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  --background-hover: linear-gradient(135deg, #1d4ed8, #1e40af);
  --color: white;
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 600;
  text-transform: none;
}

.retry-button {
  --border-color: #6b7280;
  --color: #6b7280;
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 600;
  text-transform: none;
}

.reset-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
</style>
