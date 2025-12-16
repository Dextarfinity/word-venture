<template>
  <ion-app>
    <router-view />
    <ToastNotification />
  </ion-app>
</template>

<script setup>
import { IonApp } from "@ionic/vue";
import ToastNotification from "./components/ToastNotification.vue";
import { onMounted, onUnmounted } from "vue";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar } from "@capacitor/status-bar";
import { stopBackgroundMusic, pauseBackgroundMusic, resumeBackgroundMusic } from "@/composables/useAudio";

onMounted(() => {
  // Set app to fullscreen on native platforms
  if (Capacitor.isNativePlatform()) {
    // Hide status bar for immersive fullscreen
    StatusBar.hide().catch(err => console.log('Status bar hide:', err));
    
    // Handle app state changes
    CapacitorApp.addListener('pause', () => {
      console.log('🔇 App paused - stopping music');
      stopBackgroundMusic();
    });

    CapacitorApp.addListener('resume', () => {
      console.log('🎵 App resumed - music can be restarted by components');
      // Music will be restarted by individual components when they mount
    });
  }
});

onUnmounted(() => {
  // Cleanup listeners
  if (Capacitor.isNativePlatform()) {
    CapacitorApp.removeAllListeners();
  }
});
</script>

<style>
/* Fullscreen styling for the app */
ion-app {
  --ion-safe-area-top: 0;
  --ion-safe-area-bottom: 0;
  --ion-safe-area-left: 0;
  --ion-safe-area-right: 0;
}

/* Force dropdown select visibility globally */
select {
  color: #000000 !important;
  background-color: #ffffff !important;
}

select option {
  color: #000000 !important;
  background-color: #ffffff !important;
}
</style>
