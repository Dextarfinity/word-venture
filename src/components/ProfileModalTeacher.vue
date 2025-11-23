<template>
  <div class="h-full bg-white">
    <!-- Header -->
    <div class="bg-gradient-to-r from-orange-400 to-yellow-400 px-6 py-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-white">Profile Settings</h2>
        <button
          @click="
            playClick('teacher');
            $emit('close');
          "
          class="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <ion-icon :icon="closeOutline" class="text-white text-xl"></ion-icon>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Profile Picture Section -->
      <div class="text-center mb-6">
        <div class="relative inline-block">
          <div
            class="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 border-4 border-orange-200"
          >
            <img
              :src="
                localProfile.avatar_url ||
                '@/img/CapyBuddy Assets/Profile/Avatar_Student/bear.png'
              "
              alt="Profile"
              class="w-full h-full object-cover"
            />
          </div>
          <button
            @click="
              playClick('teacher');
              openAvatarModal();
            "
            class="absolute -bottom-1 right-1/2 transform translate-x-6 bg-orange-500 rounded-full p-2 shadow-lg hover:bg-orange-600 transition-colors"
          >
            <ion-icon :icon="cameraOutline" class="text-white text-sm"></ion-icon>
          </button>
        </div>
        <h3 class="text-xl font-bold text-gray-800">{{ localProfile.full_name }}</h3>
        <p class="text-gray-600 capitalize">{{ localProfile.user_type }}</p>
      </div>

      <!-- Profile Form -->
      <div class="space-y-6">
        <!-- Full Name -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Full Name
          </label>
          <ion-input
            v-model="localProfile.full_name"
            type="text"
            fill="outline"
            placeholder="Enter your full name"
            class="custom-input"
            :class="{ 'ion-invalid': errors.full_name }"
          ></ion-input>
          <p v-if="errors.full_name" class="text-red-500 text-sm mt-1">
            {{ errors.full_name }}
          </p>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Email Address
          </label>
          <ion-input
            v-model="localProfile.email"
            type="email"
            fill="outline"
            placeholder="Enter your email"
            class="custom-input"
            :class="{ 'ion-invalid': errors.email }"
          ></ion-input>
          <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
        </div>

        <!-- Bio/About -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2"> About Me </label>
          <ion-textarea
            v-model="localProfile.bio"
            fill="outline"
            placeholder="Tell us about yourself..."
            :rows="3"
            class="custom-input"
          ></ion-textarea>
        </div>

        <!-- Preferences Section -->
        <div class="border-t pt-6">
          <h4 class="text-lg font-semibold text-gray-800 mb-4">Preferences</h4>

          <!-- Notifications -->
          <div class="flex items-center justify-between py-3">
            <div>
              <p class="font-medium text-gray-800">Push Notifications</p>
              <p class="text-sm text-gray-600">Receive learning reminders</p>
            </div>
            <ion-toggle
              v-model="localProfile.notifications_enabled"
              color="warning"
            ></ion-toggle>
          </div>

          <!-- Sound Effects -->
          <div class="flex items-center justify-between py-3">
            <div>
              <p class="font-medium text-gray-800">Sound Effects</p>
              <p class="text-sm text-gray-600">Play sounds during activities</p>
            </div>
            <ion-toggle v-model="localProfile.sound_enabled" color="warning"></ion-toggle>
          </div>

          <!-- Dark Mode -->
          <div class="flex items-center justify-between py-3">
            <div>
              <p class="font-medium text-gray-800">Dark Mode</p>
              <p class="text-sm text-gray-600">Use dark theme</p>
            </div>
            <ion-toggle v-model="localProfile.dark_mode" color="warning"></ion-toggle>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3 pt-6">
          <ion-button
            @click="
              playClick('teacher');
              saveProfile();
            "
            expand="block"
            class="save-button"
            :disabled="isSaving"
          >
            <div v-if="isSaving" class="flex items-center">
              <ion-spinner name="crescent" class="mr-2"></ion-spinner>
              Saving...
            </div>
            <span v-else>Save Changes</span>
          </ion-button>

          <ion-button
            @click="
              playClick('teacher');
              changePassword();
            "
            expand="block"
            fill="outline"
            class="change-password-button"
          >
            Change Password
          </ion-button>

          <ion-button
            @click="
              playClick('teacher');
              signOut();
            "
            expand="block"
            fill="clear"
            class="signout-button"
          >
            Sign Out
          </ion-button>
        </div>
      </div>
    </div>

    <!-- Avatar Selection Modal -->
    <ion-modal :is-open="isAvatarModalOpen" @did-dismiss="closeAvatarModal">
      <avatar-selection-modal
        :current-avatar="localProfile.avatar_url"
        @avatar-selected="handleAvatarSelection"
        @close="closeAvatarModal"
      />
    </ion-modal>
  </div>
</template>

<script setup>
import {
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonToggle,
  IonSpinner,
  IonModal,
} from "@ionic/vue";
import { closeOutline, cameraOutline } from "ionicons/icons";
import { ref, reactive, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import supabase from "../supabase.js";
import AvatarSelectionModal from "./AvatarSelectionModal.vue";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

const router = useRouter();
const { startMusic, stopMusic, playClick } = useAudio();

// Props
const props = defineProps({
  userProfile: {
    type: Object,
    default: () => ({
      id: null,
      full_name: "",
      email: "",
      avatar_url: null,
      bio: "",
      user_type: "student",
      notifications_enabled: true,
      sound_enabled: true,
      dark_mode: false,
    }),
  },
});

// Emits
const emit = defineEmits(["close", "profile-updated"]);

// Local state
const localProfile = ref({ ...props.userProfile });
const isSaving = ref(false);
const isAvatarModalOpen = ref(false);

// Form validation
const errors = reactive({
  full_name: "",
  email: "",
});

// Watch for prop changes
watch(
  () => props.userProfile,
  (newProfile) => {
    localProfile.value = { ...newProfile };
  },
  { deep: true }
);

onMounted(() => {
  console.log("🎵 Starting menu music for ProfileModalTeacher...");
  startMusic(MUSIC_TYPES.MENU, 0.3);
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping menu music for ProfileModalTeacher...");
  stopMusic();
});

// Validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateForm = () => {
  errors.full_name = "";
  errors.email = "";

  let isValid = true;

  if (!localProfile.value.full_name?.trim()) {
    errors.full_name = "Full name is required";
    isValid = false;
  }

  if (!localProfile.value.email?.trim()) {
    errors.email = "Email is required";
    isValid = false;
  } else if (!validateEmail(localProfile.value.email)) {
    errors.email = "Please enter a valid email";
    isValid = false;
  }

  return isValid;
};

// Avatar modal handlers
const openAvatarModal = () => {
  isAvatarModalOpen.value = true;
};

const closeAvatarModal = () => {
  isAvatarModalOpen.value = false;
};

const handleAvatarSelection = (avatarUrl) => {
  localProfile.value.avatar_url = avatarUrl;
  closeAvatarModal();
};

// Profile actions
const saveProfile = async () => {
  playClick("teacher");

  if (!validateForm()) return;

  isSaving.value = true;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Update profile in database
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: localProfile.value.full_name,
        email: localProfile.value.email,
        bio: localProfile.value.bio,
        avatar_url: localProfile.value.avatar_url,
        notifications_enabled: localProfile.value.notifications_enabled,
        sound_enabled: localProfile.value.sound_enabled,
        dark_mode: localProfile.value.dark_mode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    // Update email in auth if changed
    if (localProfile.value.email !== props.userProfile.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: localProfile.value.email,
      });

      if (emailError) {
        console.error("Email update error:", emailError);
        // Continue anyway, profile was updated
      }
    }

    emit("profile-updated", localProfile.value);
    alert("Profile updated successfully!");
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("Failed to update profile. Please try again.");
  } finally {
    isSaving.value = false;
  }
};

const changePassword = () => {
  // Navigate to change password page or show modal
  router.push("/change-password");
  emit("close");
};

const signOut = async () => {
  const confirmed = confirm("Are you sure you want to sign out?");

  if (confirmed) {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      emit("close");
    } catch (error) {
      console.error("Sign out error:", error);
      alert("Failed to sign out. Please try again.");
    }
  }
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
  --border-color: #f97316;
}

.custom-input.ion-invalid {
  --border-color: #ef4444;
}

.save-button {
  --background: linear-gradient(135deg, #f97316, #ea580c);
  --background-hover: linear-gradient(135deg, #ea580c, #dc2626);
  --color: white;
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 600;
  text-transform: none;
}

.change-password-button {
  --border-color: #f97316;
  --color: #f97316;
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 600;
  text-transform: none;
}

.signout-button {
  --color: #ef4444;
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 600;
  text-transform: none;
}

ion-toggle {
  --track-color-checked: #f97316;
  --handle-color-checked: #ffffff;
}
</style>
