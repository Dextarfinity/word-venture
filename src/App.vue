<template>
  <ion-app>
    <router-view />
    <ToastNotification />
  </ion-app>
</template>

<script setup>
import { IonApp } from "@ionic/vue";
import ToastNotification from "./components/ToastNotification.vue";
</script>

<style></style>
