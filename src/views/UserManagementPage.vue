<template>
  <ion-page>
    <ion-content class="ion-no-padding" fullscreen>
      <!-- Main Container -->
      <div class="user-management-container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-row">
            <!-- Back Button -->
            <button class="back-btn" @click="navigateBack">
              <ion-icon :icon="arrowBackOutline" class="back-icon"></ion-icon>
              <span class="back-text">Back</span>
            </button>

            <!-- Title -->
            <h1 class="page-title">Staff</h1>

            <!-- Search Icon -->
            <div class="search-icon-container">
              <ion-icon :icon="searchOutline" class="search-icon"></ion-icon>
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-container">
          <div class="search-bar">
            <ion-icon :icon="searchOutline" class="search-input-icon"></ion-icon>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="SEARCH"
              class="search-input"
              @input="filterUsers"
            />
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Loading State -->
          <div v-if="usersLoading" class="loading-container">
            <div class="spinner"></div>
            <p class="loading-text">Loading users...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="usersError" class="error-container">
            <ion-icon :icon="warningOutline" class="error-icon"></ion-icon>
            <p class="error-text">{{ usersError }}</p>
            <button class="retry-btn" @click="playClick('teacher'); fetchUsers(1, 100)">
              Retry
            </button>
          </div>

          <!-- Empty State -->
          <div v-else-if="users.length === 0" class="empty-container">
            <ion-icon :icon="personCircleOutline" class="empty-icon"></ion-icon>
            <p class="empty-text">No users found</p>
          </div>

          <!-- Users List -->
          <template v-else>
            <!-- Teachers Section -->
            <div v-if="filteredUsers.teachers.length > 0" class="user-section">
            <h3 class="section-title">Teachers</h3>

            <TransitionGroup name="list-item" tag="div" class="user-list">
              <div
                v-for="user in filteredUsers.teachers"
                :key="user.id"
                class="user-item"
              >
                <div class="user-info">
                  <div class="user-avatar">
                    <ion-icon :icon="personCircleOutline" class="avatar-icon"></ion-icon>
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ user.name }}</div>
                  </div>
                </div>
                
                <div class="user-actions">
                  <div class="role-badge teacher-badge">{{ user.role.toUpperCase() }}</div>
                  <button class="action-menu-btn" @click="showUserActions(user)">
                    <ion-icon :icon="ellipsisVerticalOutline" class="menu-icon"></ion-icon>
                  </button>
                </div>
              </div>
            </TransitionGroup>
          </div>

          <!-- Students Section -->
          <div v-if="filteredUsers.students.length > 0" class="user-section">
            <h3 class="section-title">Students</h3>

            <TransitionGroup name="list-item" tag="div" class="user-list">
              <div
                v-for="user in filteredUsers.students"
                :key="user.id"
                class="user-item"
              >
                <div class="user-info">
                  <div class="user-avatar">
                    <ion-icon :icon="personCircleOutline" class="avatar-icon"></ion-icon>
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ user.name }}</div>
                  </div>
                </div>
                
                <div class="user-actions">
                  <div class="role-badge student-badge">{{ user.role.toUpperCase() }}</div>
                  <button class="action-menu-btn" @click="showUserActions(user)">
                    <ion-icon :icon="ellipsisVerticalOutline" class="menu-icon"></ion-icon>
                  </button>
                </div>
              </div>
            </TransitionGroup>
          </div>

          <!-- Admins Section -->
          <div v-if="filteredUsers.admins.length > 0" class="user-section">
            <h3 class="section-title">Admins</h3>

            <TransitionGroup name="list-item" tag="div" class="user-list">
              <div
                v-for="user in filteredUsers.admins"
                :key="user.id"
                class="user-item"
              >
                <div class="user-info">
                  <div class="user-avatar">
                    <ion-icon :icon="personCircleOutline" class="avatar-icon"></ion-icon>
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ user.name }}</div>
                  </div>
                </div>
                
                <div class="user-actions">
                  <div class="role-badge admin-badge">{{ user.role.toUpperCase() }}</div>
                  <button class="action-menu-btn" @click="showUserActions(user)">
                    <ion-icon :icon="ellipsisVerticalOutline" class="menu-icon"></ion-icon>
                  </button>
                </div>
              </div>
            </TransitionGroup>
          </div>
          </template>
        </div>
      </div>

      <!-- User Actions Modal -->
      <Transition name="modal-ease" appear>
        <div v-if="showActionsModal" class="modal-overlay" @click="closeActionsModal">
          <Transition name="modal-slide" appear>
            <div class="actions-modal" @click.stop>
              <div class="modal-header">
                <h3 class="modal-title">Manage User</h3>
                <button class="close-btn" @click="closeActionsModal">
                  <ion-icon :icon="closeOutline" class="close-icon"></ion-icon>
                </button>
              </div>
              
              <div class="modal-content">
                <div class="user-info-display">
                  <div class="user-avatar-large">
                    <ion-icon :icon="personCircleOutline" class="avatar-icon-large"></ion-icon>
                  </div>
                  <div class="user-info-text">
                    <div class="user-name-large">{{ selectedUser?.name }}</div>
                    <div class="current-role">Current Role: {{ selectedUser?.role?.toUpperCase() }}</div>
                  </div>
                </div>

                <div class="action-buttons">
                  <!-- Role Change Section -->
                  <div class="role-section">
                    <h4 class="action-title">Change Role</h4>
                    <div class="role-buttons">
                      <button
                        v-for="role in availableRoles"
                        :key="role"
                        :class="['role-btn', `${role}-role-btn`, { 'current-role-btn': selectedUser?.role === role }]"
                        @click="changeUserRole(role)"
                        :disabled="selectedUser?.role === role"
                      >
                        {{ role.toUpperCase() }}
                      </button>
                    </div>
                  </div>

                  <!-- Danger Zone Section -->
                  <div class="danger-section">
                    <h4 class="action-title danger-title">Danger Zone</h4>
                    
                    <!-- Deactivate User -->
                    <button class="deactivate-user-btn" @click="showRemoveConfirmation">
                      <ion-icon :icon="trashOutline" class="deactivate-icon"></ion-icon>
                      Deactivate User
                    </button>
                    
                    <!-- Delete User (Permanent) -->
                    <button class="delete-user-btn" @click="showDeleteConfirmation">
                      <ion-icon :icon="trashOutline" class="delete-icon"></ion-icon>
                      Delete Permanently
                    </button>
                    
                    <p class="danger-note">⚠️ Deletion is permanent and cannot be undone</p>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>

      <!-- Remove User Confirmation Modal -->
      <Transition name="modal-ease" appear>
        <div v-if="showRemoveModal" class="modal-overlay" @click="cancelRemoveUser">
          <Transition name="modal-slide" appear>
            <div class="confirmation-modal" @click.stop>
              <div class="confirmation-content">
                <div class="confirmation-icon">
                  <ion-icon :icon="warningOutline" class="warning-icon"></ion-icon>
                </div>
                <h3 class="confirmation-title">
                  DEACTIVATE THIS USER?
                </h3>
                <p class="confirmation-subtitle">
                  The user will be deactivated but their data will be preserved. You can reactivate them later.
                </p>
                <div class="confirmation-buttons">
                  <button class="cancel-btn" @click="cancelRemoveUser">CANCEL</button>
                  <button class="confirm-btn" @click="confirmRemoveUser">DEACTIVATE</button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>

      <!-- Delete User Confirmation Modal -->
      <Transition name="modal-ease" appear>
        <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDeleteUser">
          <Transition name="modal-slide" appear>
            <div class="confirmation-modal delete-modal" @click.stop>
              <div class="confirmation-content">
                <div class="confirmation-icon">
                  <ion-icon :icon="warningOutline" class="warning-icon-red"></ion-icon>
                </div>
                <h3 class="confirmation-title danger-text">
                  PERMANENTLY DELETE THIS USER?
                </h3>
                <p class="confirmation-subtitle">
                  <strong>⚠️ WARNING:</strong> This action is <strong>IRREVERSIBLE</strong>. All user data, progress, and records will be permanently deleted.
                </p>
                <div class="user-delete-info">
                  <p><strong>User:</strong> {{ selectedUser?.name }}</p>
                  <p><strong>Email:</strong> {{ selectedUser?.email }}</p>
                  <p><strong>Role:</strong> {{ selectedUser?.role?.toUpperCase() }}</p>
                </div>
                <div class="confirmation-buttons">
                  <button class="cancel-btn" @click="cancelDeleteUser">CANCEL</button>
                  <button class="delete-confirm-btn" @click="confirmDeleteUser">DELETE PERMANENTLY</button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth, useAdminUsers } from '@/composables/services';
import { useAudio } from '@/composables/useAudio';
import {
  IonPage,
  IonContent,
  IonIcon,
  toastController,
} from "@ionic/vue";
import {
  arrowBackOutline,
  searchOutline,
  personCircleOutline,
  ellipsisVerticalOutline,
  closeOutline,
  trashOutline,
  warningOutline,
} from "ionicons/icons";

const router = useRouter();

// Use composables for backend integration
const { profile, isAuthenticated, initialize: initAuth } = useAuth();
const { 
  users: backendUsers,
  isLoading: usersLoading,
  error: usersError,
  fetchUsers,
  updateUser,
  deleteUser,
} = useAdminUsers();
const { playClick } = useAudio();

// Reactive data
const searchQuery = ref("");
const showActionsModal = ref(false);
const showRemoveModal = ref(false);
const showDeleteModal = ref(false);
const selectedUser = ref(null);

// Available roles for role changes
const availableRoles = ["admin", "teacher", "student"];

// Users data from backend - transform to expected format
const users = computed(() => {
  if (!backendUsers.value || backendUsers.value.length === 0) {
    return [];
  }
  
  return backendUsers.value.map(user => ({
    id: user.id,
    name: user.full_name || user.email || 'Unknown User',
    email: user.email,
    role: user.user_type || 'student',
    isActive: user.is_active !== false,
  }));
});

// Show toast notification
const showToast = async (message, color = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color,
  });
  await toast.present();
};

// Initialize user management data
const initializeUserManagement = async () => {
  try {
    console.log('👥 Initializing user management...');
    
    // Initialize authentication
    await initAuth();
    
    if (isAuthenticated.value && profile.value?.user_type === 'admin') {
      console.log('✅ Admin authenticated, fetching users...');
      
      // Fetch all users from database
      await fetchUsers(1, 100); // Get first 100 users
      
      console.log('👤 Users loaded:', users.value?.length || 0);
    } else {
      console.log('❌ Admin not authenticated, redirecting to login');
      router.push('/login');
    }
  } catch (error) {
    console.error('Error initializing user management:', error);
    await showToast('Failed to load users', 'danger');
  }
};

// Filtered users computed property
const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase();
  
  // Only show active users
  const activeUsers = users.value.filter(user => user.isActive !== false);
  
  const filtered = activeUsers.filter(user => 
    user.name.toLowerCase().includes(query) || 
    user.email?.toLowerCase().includes(query)
  );

  return {
    teachers: filtered.filter(user => user.role === "teacher"),
    students: filtered.filter(user => user.role === "student"),
    admins: filtered.filter(user => user.role === "admin"),
  };
});

// Navigation
const navigateBack = () => {
  playClick('teacher');
  router.push("/admin/profile");
};

// Search functionality
const filterUsers = () => {
  // The computed property automatically handles filtering
};

// User actions
const showUserActions = (user) => {
  playClick('teacher');
  selectedUser.value = user;
  showActionsModal.value = true;
};

const closeActionsModal = () => {
  playClick('teacher');
  showActionsModal.value = false;
  selectedUser.value = null;
};

// Role management
const changeUserRole = async (newRole) => {
  if (!selectedUser.value || selectedUser.value.role === newRole) {
    return;
  }
  
  if (!profile.value?.id) {
    await showToast('Admin ID not available', 'danger');
    return;
  }
  
  try {
    playClick('teacher');
    console.log(`🔄 Changing user ${selectedUser.value.name} role from ${selectedUser.value.role} to ${newRole}`);
    
    const oldRole = selectedUser.value.role;
    
    // Update user role in database
    const result = await updateUser(profile.value.id, selectedUser.value.id, {
      user_type: newRole
    });
    
    if (result.success) {
      console.log('✅ User role updated successfully');
      
      // Refresh the users list
      await fetchUsers(1, 100);
      
      await showToast(`User role changed from ${oldRole} to ${newRole}`, 'success');
      closeActionsModal();
    } else {
      console.error('❌ Failed to update user role:', result.error);
      await showToast(result.error || 'Failed to update user role', 'danger');
    }
  } catch (error) {
    console.error('Error changing user role:', error);
    await showToast('Error updating user role', 'danger');
  }
};

// User removal
const showRemoveConfirmation = () => {
  playClick('teacher');
  showRemoveModal.value = true;
};

const cancelRemoveUser = () => {
  playClick('teacher');
  showRemoveModal.value = false;
};

const confirmRemoveUser = async () => {
  if (!selectedUser.value) return;
  
  if (!profile.value?.id) {
    await showToast('Admin ID not available', 'danger');
    return;
  }
  
  try {
    playClick('teacher');
    console.log(`� Deactivating user: ${selectedUser.value.name}`);
    
    const userName = selectedUser.value.name;
    
    // Deactivate user instead of deleting (set is_active to false)
    const result = await updateUser(profile.value.id, selectedUser.value.id, {
      is_active: false
    });
    
    if (result.success) {
      console.log('✅ User deactivated successfully');
      
      // Refresh the users list
      await fetchUsers(1, 100);
      
      await showToast(`User "${userName}" has been deactivated`, 'success');
      
      // Close modals
      showRemoveModal.value = false;
      closeActionsModal();
    } else {
      console.error('❌ Failed to deactivate user:', result.error);
      await showToast(result.error || 'Failed to deactivate user', 'danger');
    }
  } catch (error) {
    console.error('Error deactivating user:', error);
    await showToast('Error deactivating user', 'danger');
  }
};

// User deletion (permanent)
const showDeleteConfirmation = () => {
  playClick('teacher');
  showDeleteModal.value = true;
};

const cancelDeleteUser = () => {
  playClick('teacher');
  showDeleteModal.value = false;
};

const confirmDeleteUser = async () => {
  if (!selectedUser.value) return;
  
  if (!profile.value?.id) {
    await showToast('Admin ID not available', 'danger');
    return;
  }
  
  try {
    playClick('teacher');
    console.log(`🗑️ Permanently deleting user: ${selectedUser.value.name}`);
    
    const userName = selectedUser.value.name;
    
    // Permanently delete user from database
    const result = await deleteUser(profile.value.id, selectedUser.value.id);
    
    if (result.success) {
      console.log('✅ User deleted permanently');
      
      // Refresh the users list
      await fetchUsers(1, 100);
      
      await showToast(`User "${userName}" has been permanently deleted`, 'success');
      
      // Close modals
      showDeleteModal.value = false;
      closeActionsModal();
    } else {
      console.error('❌ Failed to delete user:', result.error);
      await showToast(result.error || 'Failed to delete user', 'danger');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    await showToast('Error deleting user', 'danger');
  }
};

onMounted(async () => {
  await initializeUserManagement();
});
</script>

<style scoped>
/* Main Container */
.user-management-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 0;
}

/* Header Section */
.header-section {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

/* Back Button */
.back-btn {
  background: transparent;
  border: none;
  color: #88c999;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease-in-out;
  padding: 8px;
  border-radius: 8px;
}

.back-btn:hover {
  background: rgba(136, 201, 153, 0.1);
  transform: translateX(-2px);
}

.back-icon {
  font-size: 20px;
}

.back-text {
  font-size: 16px;
}

/* Page Title */
.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  text-align: center;
  flex: 1;
}

/* Search Icon Container */
.search-icon-container {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-icon {
  font-size: 24px;
  color: #6c757d;
}

/* Search Container */
.search-container {
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.search-bar {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 45px;
  border: 1px solid #dee2e6;
  border-radius: 25px;
  background: #f8f9fa;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  outline: none;
  transition: all 0.3s ease-in-out;
}

.search-input:focus {
  border-color: #88c999;
  background: white;
  box-shadow: 0 0 0 3px rgba(136, 201, 153, 0.1);
}

.search-input::placeholder {
  color: #adb5bd;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.search-input-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #adb5bd;
}

/* Main Content */
.main-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #88c999;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  color: #6c757d;
  font-weight: 500;
  margin: 0;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.error-icon {
  font-size: 64px;
  color: #dc3545;
  margin-bottom: 20px;
}

.error-text {
  font-size: 16px;
  color: #dc3545;
  font-weight: 500;
  margin: 0 0 20px 0;
}

.retry-btn {
  padding: 12px 24px;
  background: #88c999;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

.retry-btn:hover {
  background: #7ab88a;
  transform: translateY(-1px);
}

/* Empty State */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: #dee2e6;
  margin-bottom: 20px;
}

.empty-text {
  font-size: 16px;
  color: #6c757d;
  font-weight: 500;
  margin: 0;
}

/* User Section */
.user-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 15px;
  padding-left: 5px;
}

/* User List */
.user-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-item {
  background: white;
  border-radius: 12px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
  border-left: 4px solid transparent;
}

.user-item:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* User Info */
.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 40px;
  color: #6c757d;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

/* User Actions */
.user-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.teacher-badge {
  background: #d1ecf1;
  color: #0c5460;
}

.student-badge {
  background: #fff3cd;
  color: #856404;
}

.admin-badge {
  background: #d4edda;
  color: #155724;
}

.action-menu-btn {
  background: transparent;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.action-menu-btn:hover {
  background: rgba(108, 117, 125, 0.1);
  color: #2c3e50;
}

.menu-icon {
  font-size: 18px;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  box-sizing: border-box;
}

/* Actions Modal */
.actions-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  background: rgba(108, 117, 125, 0.1);
  color: #2c3e50;
  transform: scale(1.1);
}

.close-icon {
  font-size: 20px;
}

.modal-content {
  padding: 25px;
}

/* User Info Display */
.user-info-display {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 15px;
  margin-bottom: 25px;
}

.user-avatar-large {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon-large {
  font-size: 60px;
  color: #6c757d;
}

.user-info-text {
  flex: 1;
}

.user-name-large {
  font-size: 16px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 5px;
}

.current-role {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.action-title {
  font-size: 14px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 15px;
}

.danger-title {
  color: #dc3545;
}

/* Role Section */
.role-section {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 15px;
  border: 1px solid #e9ecef;
}

.role-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.role-btn {
  padding: 8px 16px;
  border: 2px solid #dee2e6;
  border-radius: 20px;
  background: white;
  color: #495057;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  letter-spacing: 0.5px;
}

.role-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.admin-role-btn {
  border-color: #88c999;
  color: #155724;
}

.admin-role-btn:hover:not(:disabled) {
  background: #88c999;
  color: white;
}

.teacher-role-btn {
  border-color: #17a2b8;
  color: #0c5460;
}

.teacher-role-btn:hover:not(:disabled) {
  background: #17a2b8;
  color: white;
}

.student-role-btn {
  border-color: #ffc107;
  color: #856404;
}

.student-role-btn:hover:not(:disabled) {
  background: #ffc107;
  color: #212529;
}

.current-role-btn {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e9ecef;
}

/* Danger Section */
.danger-section {
  padding: 20px;
  background: #fff5f5;
  border-radius: 15px;
  border: 1px solid #fed7d7;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.danger-note {
  font-size: 11px;
  color: #dc3545;
  text-align: center;
  margin: 8px 0 0 0;
  font-weight: 600;
}

.deactivate-user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: #ffc107;
  color: #212529;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  width: 100%;
  justify-content: center;
}

.deactivate-user-btn:hover {
  background: #e0a800;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.deactivate-icon {
  font-size: 16px;
}

.delete-user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  width: 100%;
  justify-content: center;
}

.delete-user-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.delete-icon {
  font-size: 16px;
}

/* Confirmation Modal */
.confirmation-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.delete-modal {
  max-width: 450px;
  border: 3px solid #dc3545;
}

.confirmation-content {
  padding: 30px 25px;
  text-align: center;
}

.confirmation-icon {
  margin-bottom: 20px;
}

.warning-icon {
  font-size: 48px;
  color: #ffc107;
}

.warning-icon-red {
  font-size: 64px;
  color: #dc3545;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.confirmation-title {
  font-size: 16px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 15px;
  line-height: 1.4;
}

.danger-text {
  color: #dc3545;
}

.confirmation-subtitle {
  font-size: 13px;
  color: #6c757d;
  margin-bottom: 20px;
  line-height: 1.5;
}

.user-delete-info {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  text-align: left;
}

.user-delete-info p {
  margin: 8px 0;
  font-size: 13px;
  color: #495057;
}

.user-delete-info strong {
  color: #2c3e50;
}

.confirmation-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.cancel-btn {
  padding: 12px 24px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

.cancel-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.confirm-btn {
  padding: 12px 24px;
  background: #88c999;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

.confirm-btn:hover {
  background: #7ab88a;
  transform: translateY(-1px);
}

.delete-confirm-btn {
  padding: 12px 24px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  text-transform: uppercase;
}

.delete-confirm-btn:hover {
  background: #bd2130;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 53, 69, 0.4);
}

/* List Item Animations */
.list-item-enter-active {
  transition: all 0.4s ease-out;
}

.list-item-leave-active {
  transition: all 0.3s ease-in;
}

.list-item-enter-from {
  opacity: 0;
  transform: translateX(-20px) scale(0.9);
}

.list-item-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.9);
}

.list-item-move {
  transition: transform 0.4s ease-out;
}

/* Modal Animations */
.modal-ease-enter-active {
  transition: all 0.3s ease-out;
}

.modal-ease-leave-active {
  transition: all 0.2s ease-in;
}

.modal-ease-enter-from {
  opacity: 0;
}

.modal-ease-leave-to {
  opacity: 0;
}

.modal-slide-enter-active {
  transition: all 0.3s ease-out;
}

.modal-slide-leave-active {
  transition: all 0.2s ease-in;
}

.modal-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.modal-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* Responsive Design */
@media (max-width: 768px) {
  .user-management-container {
    padding: 0;
  }

  .header-section {
    padding: 15px;
  }

  .search-container {
    padding: 10px 15px;
  }

  .main-content {
    padding: 15px;
  }

  .user-item {
    padding: 12px 15px;
  }

  .modal-overlay {
    padding: 15px;
  }

  .actions-modal {
    max-width: 100%;
  }

  .role-buttons {
    flex-direction: column;
  }

  .role-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>