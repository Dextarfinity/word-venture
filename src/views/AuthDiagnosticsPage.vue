<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Auth Diagnostics</ion-title>
        <template v-slot:end>
          <ion-buttons>
            <ion-button @click="$router.push('/admin')">
              <ion-icon :icon="arrowBack"></ion-icon>
              Back
            </ion-button>
          </ion-buttons>
        </template>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="diagnostics-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Authentication Diagnostics</ion-card-title>
            <ion-card-subtitle>Test and debug authentication issues</ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <!-- RLS Policy Check -->
            <div class="test-section">
              <ion-button
                expand="block"
                @click="checkRLSPolicies"
                :disabled="loading.rls"
              >
                <template v-slot:start>
                  <ion-icon :icon="shield"></ion-icon>
                </template>
                Check RLS Policies
                <template v-slot:end v-if="loading.rls">
                  <ion-spinner name="crescent"></ion-spinner>
                </template>
              </ion-button>

              <div
                v-if="results.rls"
                class="result-box"
                :class="results.rls.success ? 'success' : 'error'"
              >
                <h4>RLS Policy Check Results:</h4>
                <pre>{{ JSON.stringify(results.rls, null, 2) }}</pre>
              </div>
            </div>

            <!-- Test Registration -->
            <div class="test-section">
              <ion-item>
                <ion-input
                  v-model="testEmail"
                  label="Test Email"
                  placeholder="test@example.com"
                  type="email"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-input
                  v-model="testPassword"
                  label="Test Password"
                  placeholder="testpass123"
                  type="password"
                ></ion-input>
              </ion-item>

              <ion-button
                expand="block"
                @click="testRegistration"
                :disabled="loading.registration"
              >
                <template v-slot:start>
                  <ion-icon :icon="personAdd"></ion-icon>
                </template>
                Test Registration
                <template v-slot:end v-if="loading.registration">
                  <ion-spinner name="crescent"></ion-spinner>
                </template>
              </ion-button>

              <div
                v-if="results.registration"
                class="result-box"
                :class="results.registration.success ? 'success' : 'error'"
              >
                <h4>Registration Test Results:</h4>
                <pre>{{ JSON.stringify(results.registration, null, 2) }}</pre>
              </div>
            </div>

            <!-- Test Authentication -->
            <div class="test-section">
              <ion-button
                expand="block"
                @click="testAuthentication"
                :disabled="loading.auth || !testEmail || !testPassword"
              >
                <template v-slot:start>
                  <ion-icon :icon="logIn"></ion-icon>
                </template>
                Test Authentication
                <template v-slot:end v-if="loading.auth">
                  <ion-spinner name="crescent"></ion-spinner>
                </template>
              </ion-button>

              <div
                v-if="results.auth"
                class="result-box"
                :class="results.auth.success ? 'success' : 'error'"
              >
                <h4>Authentication Test Results:</h4>
                <pre>{{ JSON.stringify(results.auth, null, 2) }}</pre>
              </div>
            </div>

            <!-- Cleanup -->
            <div class="test-section">
              <ion-button
                expand="block"
                fill="outline"
                @click="cleanupTestUser"
                :disabled="loading.cleanup || !testEmail"
              >
                <template v-slot:start>
                  <ion-icon :icon="trash"></ion-icon>
                </template>
                Cleanup Test User
                <template v-slot:end v-if="loading.cleanup">
                  <ion-spinner name="crescent"></ion-spinner>
                </template>
              </ion-button>

              <div v-if="results.cleanup" class="result-box info">
                <h4>Cleanup Results:</h4>
                <pre>{{ JSON.stringify(results.cleanup, null, 2) }}</pre>
              </div>
            </div>

            <!-- Instructions -->
            <ion-card class="instructions-card">
              <ion-card-header>
                <ion-card-title>Instructions</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ol>
                  <li>
                    <strong>Check RLS Policies:</strong> Verifies if the database policies
                    are properly set up
                  </li>
                  <li>
                    <strong>Test Registration:</strong> Attempts to create a new user and
                    profile
                  </li>
                  <li>
                    <strong>Test Authentication:</strong> Tests sign-in and profile access
                    for the test user
                  </li>
                  <li>
                    <strong>Cleanup:</strong> Instructions to manually remove the test
                    user
                  </li>
                </ol>

                <p><strong>If tests fail:</strong></p>
                <ul>
                  <li>
                    Run the SQL commands from <code>fix-rls-policies.sql</code> in your
                    Supabase SQL Editor
                  </li>
                  <li>Check the Supabase dashboard for error details</li>
                  <li>
                    Ensure RLS policies allow INSERT and SELECT on the profiles table
                  </li>
                </ul>
              </ion-card-content>
            </ion-card>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from "vue";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonInput,
  IonSpinner,
  IonButtons,
} from "@ionic/vue";
import { shield, personAdd, logIn, trash, arrowBack } from "ionicons/icons";
import AuthDiagnostics from "../utils/authDiagnostics";

// Reactive data
const testEmail = ref("test@example.com");
const testPassword = ref("testpass123");

const loading = ref({
  rls: false,
  registration: false,
  auth: false,
  cleanup: false,
});

const results = ref({
  rls: null,
  registration: null,
  auth: null,
  cleanup: null,
});

// Methods
const checkRLSPolicies = async () => {
  loading.value.rls = true;
  results.value.rls = null;

  try {
    const result = await AuthDiagnostics.checkRLSPolicies();
    results.value.rls = result;
  } catch (error) {
    results.value.rls = { success: false, error: error.message };
  } finally {
    loading.value.rls = false;
  }
};

const testRegistration = async () => {
  loading.value.registration = true;
  results.value.registration = null;

  try {
    const result = await AuthDiagnostics.testRegistration(
      testEmail.value,
      testPassword.value
    );
    results.value.registration = result;
  } catch (error) {
    results.value.registration = { success: false, error: error.message };
  } finally {
    loading.value.registration = false;
  }
};

const testAuthentication = async () => {
  loading.value.auth = true;
  results.value.auth = null;

  try {
    const result = await AuthDiagnostics.testAuthFlow(
      testEmail.value,
      testPassword.value
    );
    results.value.auth = result;
  } catch (error) {
    results.value.auth = { success: false, error: error.message };
  } finally {
    loading.value.auth = false;
  }
};

const cleanupTestUser = async () => {
  loading.value.cleanup = true;
  results.value.cleanup = null;

  try {
    const result = await AuthDiagnostics.cleanupTestUser(testEmail.value);
    results.value.cleanup = result;
  } catch (error) {
    results.value.cleanup = { success: false, error: error.message };
  } finally {
    loading.value.cleanup = false;
  }
};
</script>

<style scoped>
.diagnostics-container {
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin: 20px 0;
  padding: 16px;
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 8px;
}

.result-box {
  margin-top: 12px;
  padding: 12px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 12px;
}

.result-box.success {
  background-color: var(--ion-color-success-tint);
  border: 1px solid var(--ion-color-success);
}

.result-box.error {
  background-color: var(--ion-color-danger-tint);
  border: 1px solid var(--ion-color-danger);
}

.result-box.info {
  background-color: var(--ion-color-primary-tint);
  border: 1px solid var(--ion-color-primary);
}

.result-box h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: bold;
}

.result-box pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.instructions-card {
  margin-top: 24px;
}

.instructions-card ol,
.instructions-card ul {
  padding-left: 20px;
}

.instructions-card li {
  margin: 8px 0;
}

.instructions-card code {
  background-color: var(--ion-color-light);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: "Courier New", monospace;
}
</style>
