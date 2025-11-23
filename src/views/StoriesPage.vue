<template>
  <ion-page>
    <ion-content class="ion-no-padding" scroll-y="true" fullscreen>
      <!-- Loading Screen -->
      <loading-screen :is-loading="isLoading" message="Loading stories" />

      <!-- Background -->
      <div class="absolute inset-0 page-background"></div>

      <!-- Header -->
      <div class="sticky top-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
        <div class="relative flex items-center justify-between px-6 py-4">
          <!-- Back Button -->
          <button
            @click="playClick('student'); $router.push('/tabs/student-home')"
            class="flex items-center text-orange-600 font-semibold z-10"
          >
            <ion-icon :icon="arrowBackOutline" class="mr-2 text-xl"></ion-icon>
            <span class="text-sm">Back</span>
          </button>

          <!-- Title (Absolutely Centered) -->
          <div
            class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <h1
              class="text-xl font-bold text-gray-800 whitespace-nowrap"
              style="font-family: 'Jua', cursive"
            >
              Reading
            </h1>
          </div>

          <!-- Search Button -->
          <button @click="playClick('student'); toggleSearch()" class="flex items-center text-orange-600 z-10">
            <ion-icon :icon="searchOutline" class="text-xl"></ion-icon>
          </button>
        </div>

        <!-- Search Bar (if active) -->
        <div v-if="showSearchBar" class="px-6 pb-4 bg-white/90 backdrop-blur-sm">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search stories..."
              class="w-full px-4 py-2 pl-10 pr-4 border rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <ion-icon
              :icon="searchOutline"
              class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            ></ion-icon>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20">
        <ion-spinner name="crescent" class="mb-4"></ion-spinner>
        <p class="text-gray-600">Loading stories...</p>
      </div>

      <!-- Connection Status -->
      <div v-if="!isLoading && connectivityChecked" class="relative z-10 px-6 py-2">
        <div
          :class="[
            'text-xs px-3 py-1 rounded-full inline-flex items-center gap-2',
            isOnline ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700',
          ]"
        >
          <div
            :class="['w-2 h-2 rounded-full', isOnline ? 'bg-green-500' : 'bg-orange-500']"
          ></div>
          {{ isOnline ? "Online Mode" : "Offline Mode" }}
        </div>
      </div>

      <!-- Stories Grid -->
      <div
        v-if="!isLoading && filteredStories.length > 0"
        class="relative z-10 p-6 pb-24"
      >
        <div class="grid gap-4">
          <div
            v-for="(story, index) in filteredStories"
            :key="story['Story #'] || index"
            @click="playClick('student'); selectStory(story)"
            :class="[
              'story-card rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative overflow-hidden',
              getStoryCardClass(index),
            ]"
          >
            <!-- Modern Decorative Bubbles -->
            <div class="absolute inset-0 pointer-events-none overflow-hidden z-20">
              <!-- Large organic bubble with gradient -->
              <div
                class="absolute top-0 right-0 w-40 h-32 transform translate-x-16 -translate-y-8 z-30"
                :style="{
                  background:
                    'radial-gradient(ellipse at center, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 70%, transparent 100%)',
                  borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                  transform: 'translate(4rem, -2rem) rotate(15deg)',
                  backdropFilter: 'blur(1px)',
                }"
              ></div>

              <!-- Medium flowing bubble -->
              <div
                class="absolute top-8 right-16 w-24 h-20 z-30"
                :style="{
                  background:
                    'radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 60%, transparent 100%)',
                  borderRadius: '50% 60% 70% 40% / 60% 40% 50% 70%',
                  transform: 'rotate(-20deg)',
                  backdropFilter: 'blur(2px)',
                }"
              ></div>

              <!-- Small organic bubbles cluster -->
              <div
                class="absolute bottom-12 right-12 w-16 h-14 z-30"
                :style="{
                  background:
                    'radial-gradient(ellipse at center, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                  borderRadius: '40% 60% 50% 70% / 70% 50% 60% 40%',
                  transform: 'rotate(45deg)',
                  backdropFilter: 'blur(1px)',
                }"
              ></div>

              <!-- Tiny accent bubbles -->
              <div
                class="absolute top-16 right-8 w-8 h-6 z-30"
                :style="{
                  background:
                    'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.25) 40%, transparent 100%)',
                  borderRadius: '60% 40% 70% 30% / 50% 70% 30% 60%',
                  transform: 'rotate(30deg)',
                  backdropFilter: 'blur(1px)',
                }"
              ></div>

              <div
                class="absolute bottom-20 right-20 w-10 h-8 z-30"
                :style="{
                  background:
                    'radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                  borderRadius: '70% 30% 60% 40% / 40% 60% 70% 30%',
                  transform: 'rotate(-35deg)',
                  backdropFilter: 'blur(1px)',
                }"
              ></div>

              <div
                class="absolute top-24 right-24 w-6 h-5 z-30"
                :style="{
                  background:
                    'radial-gradient(ellipse at center, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.3) 30%, transparent 100%)',
                  borderRadius: '50% 70% 40% 60% / 60% 40% 70% 50%',
                  transform: 'rotate(60deg)',
                  backdropFilter: 'blur(1px)',
                }"
              ></div>
            </div>

            <div class="flex items-center justify-between relative z-40">
              <div class="flex-1">
                <h3
                  class="text-white font-bold text-lg mb-2"
                  style="font-family: 'Jua', cursive"
                >
                  {{ getCleanTitle(story) }}
                </h3>
                <p class="text-white/90 text-sm leading-relaxed">
                  {{ getStoryPreview(story) }}
                </p>
                <div class="mt-4 flex items-center justify-between">
                  <div class="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span class="text-white text-xs font-medium">
                      {{
                        getCompletionPercentage(story) === 0
                          ? "Not Started"
                          : `${getCompletionPercentage(story)}% Complete`
                      }}
                    </span>
                  </div>
                  <div class="h-2 w-full bg-white/20 rounded-full ml-3 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="[
                        getCompletionPercentage(story) === 100
                          ? 'bg-green-400'
                          : 'bg-white/60',
                      ]"
                      :style="{ width: getCompletionPercentage(story) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
              <div class="ml-4">
                <div
                  class="w-16 h-16 backdrop-blur-sm rounded-full flex items-center justify-center relative"
                  :class="[
                    getCompletionPercentage(story) === 100
                      ? 'bg-green-500/30'
                      : getCompletionPercentage(story) > 0
                      ? 'bg-yellow-500/30'
                      : 'bg-white/20',
                  ]"
                >
                  <!-- Checkmark icon for completed stories -->
                  <svg
                    v-if="getCompletionPercentage(story) === 100"
                    xmlns="http://www.w3.org/2000/svg"
                    class="text-white text-2xl"
                    width="32"
                    height="32"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"
                    />
                  </svg>
                  <!-- Book icon for not started or in progress -->
                  <ion-icon
                    v-else
                    :icon="bookOutline"
                    class="text-white text-2xl"
                  ></ion-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!isLoading && filteredStories.length === 0"
        class="flex flex-col items-center justify-center py-20"
      >
        <div
          class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"
        >
          <ion-icon :icon="bookOutline" class="text-gray-400 text-3xl"></ion-icon>
        </div>
        <h3 class="text-gray-600 font-semibold mb-2">No Stories Found</h3>
        <p class="text-gray-500 text-sm text-center px-6">
          {{
            searchQuery
              ? "Try adjusting your search terms"
              : "No stories available for the selected filter"
          }}
        </p>
      </div>

      <!-- Error State -->
      <div v-if="localError" class="flex flex-col items-center justify-center py-20 px-6">
        <div
          class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4"
        >
          <ion-icon :icon="alertCircleOutline" class="text-red-500 text-3xl"></ion-icon>
        </div>
        <h3 class="text-red-600 font-semibold mb-2">Error Loading Stories</h3>
        <p class="text-red-500 text-sm text-center mb-4">{{ localError }}</p>
        <button
          @click="playClick('student'); fetchStories()"
          class="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonIcon, IonSpinner } from "@ionic/vue";
import {
  arrowBackOutline,
  searchOutline,
  bookOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useAudio, MUSIC_TYPES } from "@/composables/useAudio";
import { useRouter } from "vue-router";
import { useAuth, useStudent } from "@/composables/services";
import { loadCSV } from "../parseCSV.js";
import supabase from "../supabase.js";
import LoadingScreen from "../components/LoadingScreen.vue";

const router = useRouter();

// Use composables for backend integration
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const { studentStories, getStudentStories, isLoading: studentLoading } = useStudent();

// Audio system
const { startMusic, stopMusic, playClick } = useAudio();

// Reactive state
const stories = computed(() => studentStories?.value || []);
const isLoading = computed(() => studentLoading?.value || false);
const localError = ref(null);
const showSearchBar = ref(false);
const searchQuery = ref("");

const isOnline = ref(navigator.onLine);
const connectivityChecked = ref(false);
const usingOffline = ref(false);

// Story progress tracking
const storyProgress = ref(new Map()); // Map of story number -> completion percentage

// Computed properties
const filteredStories = computed(() => {
  let filtered = stories.value;

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((story) => {
      const title = (story.Title || story.title || "").toLowerCase();
      const text = (
        story["Story Text"] ||
        story.story_text ||
        story.text ||
        ""
      ).toLowerCase();
      return title.includes(query) || text.includes(query);
    });
  }

  // Filter to show only unique titles (remove duplicates)
  const seenTitles = new Set();
  filtered = filtered.filter((story) => {
    const title = story.Title || story.title;
    if (seenTitles.has(title)) {
      return false; // Skip duplicates
    }
    seenTitles.add(title);
    return true; // Keep first occurrence
  });

  return filtered;
});

// Methods
const toggleSearch = () => {
  showSearchBar.value = !showSearchBar.value;
  if (!showSearchBar.value) {
    searchQuery.value = "";
  }
};

const getStoryCardClass = (index) => {
  // Cycle through different gradient colors with opacity - matches template
  const colors = [
    "bg-gradient-to-br from-pink-500/80 to-purple-600/80",
    "bg-gradient-to-br from-blue-500/80 to-cyan-600/80",
    "bg-gradient-to-br from-green-500/80 to-teal-600/80",
    "bg-gradient-to-br from-orange-500/80 to-red-600/80",
    "bg-gradient-to-br from-indigo-500/80 to-purple-600/80",
    "bg-gradient-to-br from-teal-500/80 to-blue-600/80",
  ];
  return colors[index % colors.length];
};

const getStoryPreview = (story) => {
  const text =
    story["Story Text"] || story.story_text || story.text || "No preview available.";
  const sentences = text.split(".").filter((sentence) => sentence.trim().length > 0);
  const firstSentence = sentences[0]?.trim() || text.substring(0, 100);
  return firstSentence.length > 80
    ? firstSentence.substring(0, 80) + "..."
    : firstSentence + ".";
};

const getCompletionPercentage = (story) => {
  // Get actual completion percentage from user's reading analytics
  const storyNumber = story["Story #"] || story.story_number;

  if (!storyNumber) {
    return 0;
  }

  // Get the stored progress for this story
  const progress = storyProgress.value.get(storyNumber);

  if (progress !== undefined) {
    return Math.round(progress);
  }

  // Default to 0% if not read yet
  return 0;
};

const getCleanTitle = (story) => {
  const title = story.Title || story.title || "Untitled Story";
  // Remove numbers at the end of the title (e.g., "The Boy's Journey 1" -> "The Boy's Journey")
  return title.replace(/\s+\d+$/, "").trim() || title;
};

const selectStory = (story) => {
  console.log("📖 Selected story:", story);

  // Store the selected story and navigate to the reading page
  sessionStorage.setItem("selectedStory", JSON.stringify(story));

  // Navigate to Tabs6Page (sentence reading page) with the selected story
  router.push("/tabs/tab6");
};

// Fetch user's story reading progress from analytics table
const fetchUserProgress = async () => {
  try {
    // Ensure user is authenticated
    await initAuth();

    if (!profile.value?.id) {
      console.log("📊 No profile available, skipping progress fetch");
      return;
    }

    console.log("📊 Fetching story progress for user:", profile.value.id);

    // Fetch user's story reading analytics
    const { data, error } = await supabase
      .from("story_reading_analytics")
      .select("story_number, completion_percentage")
      .eq("user_id", profile.value.id);

    if (error) {
      console.error("❌ Error fetching story progress:", error);
      return;
    }

    if (data && data.length > 0) {
      console.log(`✅ Loaded progress for ${data.length} stories`);

      // Store progress in Map for quick lookup
      const progressMap = new Map();
      data.forEach((record) => {
        progressMap.set(record.story_number, record.completion_percentage || 0);
      });

      storyProgress.value = progressMap;
      console.log("📊 Story progress map:", Object.fromEntries(progressMap));
    } else {
      console.log("📊 No story progress found for user");
    }
  } catch (err) {
    console.error("❌ Error in fetchUserProgress:", err);
  }
};

// Check internet connectivity
const checkConnectivity = async () => {
  console.log("🌐 Checking internet connectivity...");

  return new Promise((resolve) => {
    let resolved = false;

    const tests = [
      fetch("https://www.google.com/favicon.ico", {
        mode: "no-cors",
        cache: "no-cache",
        signal: AbortSignal.timeout(2000),
      })
        .then(() => true)
        .catch(() => false),

      fetch("https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js", {
        mode: "no-cors",
        cache: "no-cache",
        signal: AbortSignal.timeout(2000),
      })
        .then(() => true)
        .catch(() => false),

      Promise.resolve(navigator.onLine),
    ];

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log("🔴 Connectivity check timed out - assuming offline");
        resolve(false);
      }
    }, 3000);

    Promise.allSettled(tests)
      .then((results) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);

          const networkTests = results.slice(0, 2);
          const hasNetworkConnection = networkTests.some(
            (result) => result.status === "fulfilled" && result.value === true
          );

          console.log(
            "🌐 Network test results:",
            networkTests.map((r) => (r.status === "fulfilled" ? r.value : false))
          );
          console.log(
            "🌐 navigator.onLine:",
            results[2].status === "fulfilled" ? results[2].value : false
          );
          console.log("🌐 Final decision: Online:", hasNetworkConnection);

          resolve(hasNetworkConnection);
        }
      })
      .catch(() => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log("🔴 Connectivity test failed - assuming offline");
          resolve(false);
        }
      });
  });
};

// Fetch stories from both online and offline sources
const fetchStories = async () => {
  console.log("📖 Starting to fetch stories...");
  // Note: We can't set isLoading directly since it's computed from studentLoading
  // The composable's getStudentStories function should handle loading state
  localError.value = null;

  try {
    // Check connectivity
    const online = await checkConnectivity();
    isOnline.value = online;
    connectivityChecked.value = true;

    console.log(`🌐 Connection status: ${online ? "ONLINE" : "OFFLINE"}`);

    let allStories = [];

    if (online) {
      // Try to fetch from Supabase first
      console.log("📊 Online: Fetching stories from Supabase...");
      try {
        const { data: supabaseStories, error: supabaseError } = await supabase
          .from("Short_Stories")
          .select("*")
          .order('"Story #"', { ascending: true });

        if (supabaseError) {
          console.warn("⚠️ Supabase fetch error:", supabaseError);
        } else {
          console.log(`✅ Loaded ${supabaseStories?.length || 0} stories from Supabase`);
          if (supabaseStories && supabaseStories.length > 0) {
            console.log("📊 Sample Supabase story structure:", supabaseStories[0]);
          }
          allStories = supabaseStories || [];
        }
      } catch (supabaseErr) {
        console.warn("⚠️ Supabase request failed:", supabaseErr);
      }
    }

    // Always load CSV data as backup/additional source
    console.log("📂 Loading stories from CSV file...");
    try {
      const csvStories = await loadCSV("/csv_offline/stories_qna_clean_titles_3x.csv");
      console.log(`✅ Loaded ${csvStories?.length || 0} stories from CSV`);
      if (csvStories && csvStories.length > 0) {
        console.log("📂 Sample CSV story structure:", csvStories[0]);
      }

      // Merge CSV stories with Supabase stories (allow multiple copies of same title)
      if (csvStories && csvStories.length > 0) {
        // If we have Supabase stories, only add CSV stories if Supabase is empty
        // If we're offline, use all CSV stories including duplicates
        if (allStories.length === 0) {
          allStories = [...csvStories];
        } else {
          // We have Supabase data, so CSV is just backup - don't merge to avoid true duplicates
          console.log("📊 Using Supabase stories, CSV loaded as backup");
        }

        if (!online) {
          usingOffline.value = true;
        }
      }
    } catch (csvError) {
      console.error("❌ Error loading CSV stories:", csvError);
      if (allStories.length === 0) {
        throw new Error("Failed to load stories from both online and offline sources");
      }
    }

    if (allStories.length === 0) {
      throw new Error("No stories available");
    }

    await getStudentStories(allStories);
    console.log(`📖 Total stories loaded: ${stories.value.length}`);

    // Fetch user's reading progress after loading stories
    await fetchUserProgress();

    // Debug: Count stories by title to see duplicates
    const titleCounts = {};
    stories.value.forEach((story) => {
      const title = story.Title || story.title;
      titleCounts[title] = (titleCounts[title] || 0) + 1;
    });
    console.log("📊 Stories by title:", titleCounts);
  } catch (err) {
    console.error("❌ Error fetching stories:", err);
    localError.value = err.message || "Failed to load stories";
  }
};

// Lifecycle
onMounted(async () => {
  console.log("🎵 Starting lobby background music...");
  startMusic(MUSIC_TYPES.LOBBY, 0.3);
  
  await fetchStories();
});

onBeforeUnmount(() => {
  console.log("🔇 Stopping lobby background music...");
  stopMusic();
});
</script>

<style scoped>
/* Custom background */
.page-background {
  background: linear-gradient(135deg, #ebf3f6 0%, #c8f1ff 100%);
  min-height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;
}

/* Backdrop blur support */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Sticky header positioning */
.sticky {
  position: sticky;
}

/* Ensure header has proper z-index and positioning */
.z-50 {
  z-index: 50;
}

/* Bubble z-index classes */
.z-20 {
  z-index: 20;
}

.z-30 {
  z-index: 30;
}

.z-40 {
  z-index: 40;
}

/* Story card animations - matches template */
.story-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.story-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

/* Smooth transitions */
.transition-all {
  transition: all 0.3s ease-in-out;
}

/* Custom scrollbar */
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Enhanced hover effects */
.hover\:scale-105:hover {
  transform: scale(1.05);
}

.hover\:scale-\[1\.02\]:hover {
  transform: scale(1.02);
}

/* Loading animations */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Button focus states */
button:focus {
  outline: none;
}

button:focus-visible {
  outline: 2px solid #f97316;
  outline-offset: 2px;
}

/* Input focus states */
input:focus {
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}
</style>
