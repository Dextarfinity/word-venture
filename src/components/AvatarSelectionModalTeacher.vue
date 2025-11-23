<template>
  <div class="h-full bg-white">
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-400 to-pink-400 px-6 py-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-white">Choose Your Avatar</h2>
        <button
          @click="playClick('teacher'); $emit('close')"
          class="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <ion-icon :icon="closeOutline" class="text-white text-xl"></ion-icon>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Current Selection Preview -->
      <div class="text-center mb-6">
        <div
          class="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-4 border-purple-200 shadow-lg"
        >
          <img
            :src="selectedAvatar || currentAvatar || defaultAvatar"
            alt="Selected Avatar"
            class="w-full h-full object-cover"
          />
        </div>
        <p class="text-gray-600">
          {{ selectedAvatar ? "New Avatar Selected" : "Current Avatar" }}
        </p>
      </div>

      <!-- Avatar Categories -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Choose Category</h3>
        <div class="flex space-x-2 overflow-x-auto pb-2">
          <button
            v-for="category in avatarCategories"
            :key="category.id"
            @click="playClick('teacher'); selectedCategory = category.id"
            :class="[
              'px-4 py-2 rounded-full whitespace-nowrap transition-colors',
              selectedCategory === category.id
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Avatar Grid -->
      <div class="mb-6">
        <h4 class="text-md font-semibold text-gray-800 mb-3">
          {{ avatarCategories.find((c) => c.id === selectedCategory)?.name || "Humans" }}
        </h4>
        <div class="grid grid-cols-4 gap-4">
          <div
            v-for="avatar in currentCategoryAvatars"
            :key="avatar.id"
            @click="playClick('teacher'); selectAvatar(avatar.url)"
            :class="[
              'relative cursor-pointer rounded-2xl overflow-hidden border-3 transition-all hover:scale-105',
              selectedAvatar === avatar.url
                ? 'border-purple-500 shadow-lg'
                : 'border-gray-200 hover:border-purple-300',
            ]"
          >
            <div class="aspect-square">
              <img
                :src="avatar.url"
                :alt="avatar.name"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Selection Indicator -->
            <div
              v-if="selectedAvatar === avatar.url"
              class="absolute inset-0 bg-purple-500/20 flex items-center justify-center"
            >
              <div class="bg-purple-500 rounded-full p-1">
                <ion-icon :icon="checkmarkOutline" class="text-white text-lg"></ion-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Upload Section -->
      <div class="mb-6 p-4 bg-gray-50 rounded-2xl">
        <h4 class="text-md font-semibold text-gray-800 mb-3">Upload Custom Avatar</h4>
        <div class="flex items-center space-x-4">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleFileUpload"
            class="hidden"
          />
          <button
            @click="playClick('teacher'); $refs.fileInput.click()"
            class="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-purple-400 hover:bg-purple-50 transition-colors"
          >
            <ion-icon
              :icon="cloudUploadOutline"
              class="text-2xl text-gray-400 mb-2"
            ></ion-icon>
            <p class="text-sm text-gray-600">Click to upload your photo</p>
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          Supported formats: JPG, PNG, GIF (max 5MB)
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex space-x-3">
        <ion-button
          @click="playClick('teacher'); $emit('close')"
          expand="block"
          fill="outline"
          class="cancel-button flex-1"
        >
          Cancel
        </ion-button>

        <ion-button
          @click="playClick('teacher'); confirmSelection()"
          expand="block"
          class="confirm-button flex-1"
          :disabled="!selectedAvatar"
        >
          Use This Avatar
        </ion-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IonButton, IonIcon } from "@ionic/vue";
import { closeOutline, checkmarkOutline, cloudUploadOutline } from "ionicons/icons";
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useAvatar } from "@/composables/useAvatar";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";

// Props
const props = defineProps({
  currentAvatar: {
    type: String,
    default: "",
  },
});

// Emits
const emit = defineEmits(["close", "avatar-selected"]);

// Use avatar composable for teacher
const { currentAvatar: savedAvatar, setAvatar, getAvatar } = useAvatar('teacher');
const { startMusic, stopMusic, playClick } = useAudio();

// Local state
const selectedCategory = ref("Humans");
const selectedAvatar = ref("");
const defaultAvatar = "@/img/CapyBuddy Assets/Profile/Avatar_Teachers/human.png";

// Initialize with saved avatar on mount
onMounted(() => {
  console.log("🎵 Starting menu music for AvatarSelectionModalTeacher...");
  startMusic(MUSIC_TYPES.MENU, 0.3);
  
  const stored = getAvatar();
  selectedAvatar.value = stored;
  console.log('🎨 Loaded teacher avatar from storage:', stored);
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping menu music for AvatarSelectionModalTeacher...");
  stopMusic();
});

// Avatar categories and data
const avatarCategories = ref([
  { id: "Humans", name: "Humans" },
  { id: "Capybaras", name: "Capybaras" },
  { id: "Characters", name: "Characters" },
]);

const avatarData = ref({
  Humans: [
    {
      id: "Humans",
      name: "Human",
      url: "@/img/CapyBuddy Assets/Profile/Avatar_Teachers/human.png",
    },
    {
      id: "man",
      name: "Man",
      url: "@/img/CapyBuddy Assets/Profile/Avatar_Teachers/man.png",
    },
    {
      id: "profile",
      name: "Profile",
      url: "@/img/CapyBuddy Assets/Profile/Avatar_Teachers/profile (1).png",
    },
    {
      id: "woman",
      name: "Woman",
      url: "@/img/CapyBuddy Assets/Profile/Avatar_Teachers/woman (1).png",
    },
  ],
  capybaras: [
    {
      id: "capy1",
      name: "Happy Capy",
      url: "@/img/CapyBuddy Assets/Capybara/capybara (1).png",
    },
    {
      id: "capy2",
      name: "Cool Capy",
      url: "@/img/CapyBuddy Assets/Capybara/capybara (2).png",
    },
    {
      id: "capy3",
      name: "Smart Capy",
      url: "@/img/CapyBuddy Assets/Capybara/capybara (3).png",
    },
    {
      id: "capy5",
      name: "Friendly Capy",
      url: "@/img/CapyBuddy Assets/Capybara/capybara (5).png",
    },
    {
      id: "capy6",
      name: "Sleepy Capy",
      url: "@/img/CapyBuddy Assets/Capybara/capybara (6).png",
    },
    {
      id: "capy7",
      name: "Excited Capy",
      url: "@/img/CapyBuddy Assets/Capybara/capybara (7).png",
    },
    {
      id: "capy8",
      name: "Curious Capy",
      url: "@/img/CapyBuddy Assets/Capybara/capybara (8).png",
    },
    {
      id: "capy9",
      name: "Wise Capy",
      url: "@/img/CapyBuddy Assets/Capybara/capybara (9).png",
    },
  ],
  characters: [
    {
      id: "char1",
      name: "Superhero Capy",
      url: "@/img/CapyBuddy Assets/Capybara/capybara (10).png",
    },
    {
      id: "char2",
      name: "Scholar Capy",
      url: "@/img/CapyBuddy Assets/Capybara/capybara (11).png",
    },
    {
      id: "char3",
      name: "Artist Capy",
      url: "@/img/CapyBuddy Assets/Capybara/capybara (12).png",
    },
    {
      id: "char4",
      name: "Explorer Capy",
      url: "@/img/CapyBuddy Assets/Capybara/capybara (13).png",
    },
  ],
});

// Computed
const currentCategoryAvatars = computed(() => {
  return avatarData.value[selectedCategory.value] || [];
});

// Methods
const selectAvatar = (avatarUrl) => {
  playClick('teacher');
  selectedAvatar.value = avatarUrl;
};

const confirmSelection = () => {
  playClick('teacher');
  if (selectedAvatar.value) {
    // Save to localStorage via composable
    setAvatar(selectedAvatar.value);
    console.log('✅ Teacher avatar saved:', selectedAvatar.value);
    
    // Emit to parent component
    emit('avatar-selected', selectedAvatar.value);
    
    // Close modal
    emit('close');
  }
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file");
    return;
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    alert("File size must be less than 5MB");
    return;
  }

  // Create file reader
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageUrl = e.target.result;
    selectedAvatar.value = imageUrl;
  };
  reader.readAsDataURL(file);
};
</script>

<style scoped>
.border-3 {
  border-width: 3px;
}

.aspect-square {
  aspect-ratio: 1 / 1;
}

.cancel-button {
  --border-color: #9ca3af;
  --color: #6b7280;
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 600;
  text-transform: none;
}

.confirm-button {
  --background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  --background-hover: linear-gradient(135deg, #7c3aed, #6d28d9);
  --color: white;
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 600;
  text-transform: none;
}

.confirm-button:disabled {
  --background: #d1d5db;
  --color: #9ca3af;
}

.hover\:scale-105:hover {
  transform: scale(1.05);
}

.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
