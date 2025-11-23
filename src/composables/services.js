// Vue 3 Composition API Integration for Word Venture Services
// This file provides reusable composables for integrating backend services with Vue components

import { ref, reactive, computed, onMounted, watch, readonly } from 'vue'
import { 
  AuthService, 
  TeacherService, 
  StudentService, 
  AdminService, 
  initializeServices,
  handleServiceError 
} from '@/services'

// ============================================================================
// AUTHENTICATION COMPOSABLE
// ============================================================================

export function useAuth() {
  const user = ref(null)
  const profile = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(true)
  const error = ref(null)

  // Initialize authentication state
  const initialize = async () => {
    try {
      isLoading.value = true
      const serviceInit = await initializeServices()
      
      isAuthenticated.value = serviceInit.isAuthenticated
      user.value = serviceInit.user
      profile.value = serviceInit.profile
      
      if (serviceInit.error) {
        error.value = serviceInit.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    } finally {
      isLoading.value = false
    }
  }

  // Login function
  const login = async (email, password) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await AuthService.signIn(email, password)
      
      if (result.success) {
        isAuthenticated.value = true
        user.value = result.data.user
        profile.value = result.data.profile
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      error.value = errorInfo.userMessage
      return { success: false, error: errorInfo.userMessage }
    } finally {
      isLoading.value = false
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await AuthService.signOut()
      isAuthenticated.value = false
      user.value = null
      profile.value = null
      error.value = null
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    }
  }

  // Update profile
  const updateProfile = async (updates) => {
    try {
      if (!user.value) throw new Error('No user logged in')
      
      const result = await AuthService.updateProfile(user.value.id, updates)
      
      if (result.success) {
        profile.value = { ...profile.value, ...result.data }
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  // Submit educator request function
  const submitEducatorRequest = async () => {
    try {
      error.value = null
      
      if (!user.value) {
        throw new Error('User not authenticated')
      }

      const result = await AuthService.submitEducatorRequest(user.value.id, {
        request_type: 'become_educator',
        user_profile: profile.value,
        current_role: userType.value
      })

      if (result.success) {
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  // Computed properties
  const userType = computed(() => profile.value?.user_type || null)
  const isTeacher = computed(() => userType.value === 'teacher')
  const isStudent = computed(() => userType.value === 'student')
  const isAdmin = computed(() => userType.value === 'admin')

  return {
    // State
    user: readonly(user),
    profile: readonly(profile),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Computed
    userType,
    isTeacher,
    isStudent,
    isAdmin,
    
    // Methods
    initialize,
    login,
    logout,
    updateProfile,
    submitEducatorRequest
  }
}

// ============================================================================
// TEACHER COMPOSABLES
// ============================================================================

export function useTeacher() {
  const teacherStats = ref(null)
  const teacherClasses = ref([])
  const teacherStudents = ref([])
  const teacherClassroom = ref(null)
  const teacherTasks = ref([])
  const teacherAnnouncements = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Get teacher statistics
  const getTeacherStats = async (teacherId) => {
    try {
      if (!teacherId) return
      
      isLoading.value = true
      error.value = null
      
      const result = await TeacherService.getTeacherDashboard(teacherId)
      
      if (result.success) {
        teacherStats.value = result.data
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    } finally {
      isLoading.value = false
    }
  }

  // Get teacher classes
  const getTeacherClasses = async (teacherId) => {
    try {
      if (!teacherId) return
      
      const result = await TeacherService.getTeacherClassrooms(teacherId)
      
      if (result.success) {
        teacherClasses.value = result.data || []
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    }
  }

  // Get teacher students
  const getTeacherStudents = async (teacherId) => {
    try {
      if (!teacherId) return
      
      const result = await TeacherService.getStudentsProgress(teacherId)
      
      if (result.success) {
        teacherStudents.value = result.data || []
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    }
  }

  // Get specific classroom details
  const getTeacherClassroom = async (classroomId) => {
    try {
      if (!classroomId) return
      
      console.log('🏫 Getting classroom details for ID:', classroomId);
      
      // First check if we have it in the teacherClasses array
      if (teacherClasses.value && teacherClasses.value.length > 0) {
        const classroom = teacherClasses.value.find(c => c.id == classroomId)
        if (classroom) {
          console.log('✅ Found classroom in existing data:', classroom);
          teacherClassroom.value = classroom
          return
        }
      }
      
      // If not found, fetch fresh data from the backend
      console.log('🔍 Classroom not found in cache, fetching from backend...');
      const result = await TeacherService.getTeacherClassrooms(profile.value?.id);
      
      if (result.success) {
        // Update teacherClasses with fresh data
        teacherClasses.value = result.data || [];
        
        // Find the specific classroom
        const classroom = result.data?.find(c => c.id == classroomId);
        if (classroom) {
          console.log('✅ Found classroom after refresh:', classroom);
          teacherClassroom.value = classroom;
        } else {
          console.warn('⚠️ Classroom not found even after refresh');
          teacherClassroom.value = {
            id: classroomId,
            name: "Classroom",
            section: "",
            class_code: "",
            student_count: 0
          };
        }
      } else {
        console.error('❌ Failed to fetch teacher classrooms:', result.error);
        teacherClassroom.value = {
          id: classroomId,
          name: "Classroom",
          section: "",
          class_code: "",
          student_count: 0
        };
      }
    } catch (err) {
      console.error('❌ Error in getTeacherClassroom:', err);
      error.value = handleServiceError(err).userMessage
    }
  }

  // Get tasks for specific classroom
  const getTeacherTasks = async (classroomId, teacherId = null) => {
    try {
      if (!classroomId) return
      
      if (!teacherId) {
        console.error('No teacher ID provided for fetching tasks')
        return
      }
      
      console.log('🔍 Fetching tasks for classroom:', classroomId, 'teacher:', teacherId)
      
      const result = await TeacherService.getTeacherTasks(teacherId, classroomId)
      
      if (result.success) {
        teacherTasks.value = result.data || []
        console.log('✅ Tasks fetched successfully:', result.data?.length || 0, 'tasks')
      } else {
        console.error('❌ Error fetching tasks:', result.error)
        teacherTasks.value = []
      }
    } catch (err) {
      console.error('❌ Exception fetching tasks:', err)
      error.value = handleServiceError(err).userMessage
    }
  }

  // Get announcements for specific classroom
  const getTeacherAnnouncements = async (classroomId, teacherId = null) => {
    try {
      if (!classroomId) return
      
      console.log('📢 Composable: Fetching announcements for classroom:', classroomId);
      
      // Get current teacher ID if not provided
      const currentTeacherId = teacherId || getCurrentUser()?.id;
      if (!currentTeacherId) {
        console.error('❌ No teacher ID available for fetching announcements');
        return;
      }
      
      // Import TeacherService and get announcements
      const { TeacherService } = await import('@/services/teacherService.js');
      const result = await TeacherService.getTeacherAnnouncements(currentTeacherId, classroomId);
      
      if (result.success) {
        teacherAnnouncements.value = result.data || [];
        console.log(`✅ Composable: Loaded ${teacherAnnouncements.value.length} announcements`);
      } else {
        console.error('❌ Failed to fetch announcements:', result.error);
        teacherAnnouncements.value = [];
        error.value = result.error;
      }
    } catch (err) {
      console.error('❌ Error in getTeacherAnnouncements:', err);
      error.value = handleServiceError(err).userMessage;
      teacherAnnouncements.value = [];
    }
  }

  // Create task
  const createTask = async (taskData) => {
    try {
      // TODO: Implement when TeacherService has createTask method
      console.log('Creating task:', taskData)
      return { success: true, data: { id: Date.now(), ...taskData } }
    } catch (err) {
      return { success: false, error: handleServiceError(err).userMessage }
    }
  }

  // Create announcement
  const createAnnouncement = async (announcementData) => {
    try {
      // TODO: Implement when TeacherService has createAnnouncement method
      console.log('Creating announcement:', announcementData)
      return { success: true, data: { id: Date.now(), ...announcementData } }
    } catch (err) {
      return { success: false, error: handleServiceError(err).userMessage }
    }
  }

  // Delete task
  const deleteTask = async (taskId, teacherId) => {
    try {
      if (!taskId || !teacherId) {
        return { success: false, error: 'Task ID and Teacher ID are required' }
      }
      
      console.log('🗑️ Deleting task:', taskId, 'by teacher:', teacherId)
      
      const result = await TeacherService.deleteTask(taskId, teacherId)
      
      if (result.success) {
        console.log('✅ Task deleted successfully')
        return { success: true }
      } else {
        console.error('❌ Error deleting task:', result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('❌ Exception deleting task:', err)
      return { success: false, error: handleServiceError(err).userMessage }
    }
  }

  // Get classroom monthly analytics
  const getClassroomMonthlyAnalytics = async (classroomId, teacherId, month, year) => {
    try {
      if (!classroomId || !teacherId) {
        return { success: false, error: 'Classroom ID and Teacher ID are required' }
      }
      
      console.log('📊 Fetching monthly analytics:', { classroomId, month, year })
      
      const result = await TeacherService.getClassroomMonthlyAnalytics(
        classroomId, 
        teacherId, 
        month, 
        year
      )
      
      if (result.success) {
        console.log('✅ Monthly analytics fetched:', result.data)
        return result.data
      } else {
        console.error('❌ Error fetching monthly analytics:', result.error)
        return null
      }
    } catch (err) {
      console.error('❌ Exception fetching monthly analytics:', err)
      return null
    }
  }

  // Update classroom
  const updateClassroom = async (classroomId, classroomData, teacherId) => {
    try {
      if (!classroomId || !teacherId) {
        return { success: false, error: 'Classroom ID and Teacher ID are required' }
      }
      
      console.log('📝 Updating classroom:', { classroomId, classroomData })
      
      const result = await TeacherService.updateClassroom(
        classroomId,
        classroomData,
        teacherId
      )
      
      if (result.success) {
        console.log('✅ Classroom updated successfully')
        // Refresh classroom data
        await getTeacherClassroom(classroomId)
        return { success: true, data: result.data }
      } else {
        console.error('❌ Error updating classroom:', result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('❌ Exception updating classroom:', err)
      return { success: false, error: handleServiceError(err).userMessage }
    }
  }

  // Delete classroom
  const deleteClassroom = async (classroomId, teacherId) => {
    try {
      if (!classroomId || !teacherId) {
        return { success: false, error: 'Classroom ID and Teacher ID are required' }
      }
      
      console.log('🗑️ Deleting classroom:', classroomId)
      
      const result = await TeacherService.deleteClassroom(classroomId, teacherId)
      
      if (result.success) {
        console.log('✅ Classroom deleted successfully')
        return { success: true }
      } else {
        console.error('❌ Error deleting classroom:', result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('❌ Exception deleting classroom:', err)
      return { success: false, error: handleServiceError(err).userMessage }
    }
  }

  return {
    // State
    teacherStats: readonly(teacherStats),
    teacherClasses: readonly(teacherClasses),
    teacherStudents: readonly(teacherStudents),
    teacherClassroom: readonly(teacherClassroom),
    teacherTasks: readonly(teacherTasks),
    teacherAnnouncements: readonly(teacherAnnouncements),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Methods
    getTeacherStats,
    getTeacherClasses,
    getTeacherStudents,
    getTeacherClassroom,
    getTeacherTasks,
    getTeacherAnnouncements,
    createTask,
    createAnnouncement,
    deleteTask,
    getClassroomMonthlyAnalytics,
    updateClassroom,
    deleteClassroom
  }
}

export function useTeacherClassrooms(teacherId) {
  const classrooms = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchClassrooms = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await TeacherService.getTeacherClassrooms(teacherId.value || teacherId)
      
      if (result.success) {
        classrooms.value = result.data
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    } finally {
      isLoading.value = false
    }
  }

  const createClassroom = async (classroomData) => {
    try {
      const result = await TeacherService.createClassroom(
        teacherId.value || teacherId, 
        classroomData
      )
      
      if (result.success) {
        await fetchClassrooms() // Refresh list
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  const deleteClassroom = async (classroomId) => {
    try {
      // Note: Add deleteClassroom method to TeacherService if needed
      // For now, we can deactivate it
      const result = await TeacherService.updateClassroom(classroomId, teacherId, { is_active: false })
      
      if (result.success) {
        await fetchClassrooms()
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  // Auto-fetch on mount
  onMounted(() => {
    if (teacherId.value || teacherId) {
      fetchClassrooms()
    }
  })

  // Watch for teacher ID changes
  watch(() => teacherId.value || teacherId, (newId) => {
    if (newId) {
      fetchClassrooms()
    }
  })

  return {
    classrooms: readonly(classrooms),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchClassrooms,
    createClassroom,
    deleteClassroom
  }
}

export function useTeacherTasks(teacherId, classroomId = null) {
  const tasks = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchTasks = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await TeacherService.getTeacherTasks(
        teacherId.value || teacherId,
        classroomId?.value || classroomId
      )
      
      if (result.success) {
        tasks.value = result.data
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    } finally {
      isLoading.value = false
    }
  }

  const createTask = async (taskData) => {
    try {
      const result = await TeacherService.createTask(
        teacherId.value || teacherId,
        taskData
      )
      
      if (result.success) {
        await fetchTasks()
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  const updateTask = async (taskId, updates) => {
    try {
      const result = await TeacherService.updateTask(
        taskId,
        teacherId.value || teacherId,
        updates
      )
      
      if (result.success) {
        await fetchTasks()
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  const deleteTask = async (taskId) => {
    try {
      const result = await TeacherService.deleteTask(taskId, teacherId.value || teacherId)
      
      if (result.success) {
        await fetchTasks()
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  onMounted(() => {
    if (teacherId.value || teacherId) {
      fetchTasks()
    }
  })

  return {
    tasks: readonly(tasks),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchTasks,
    createTask,
    updateTask,
    deleteTask
  }
}

export function useTeacherAnalytics(teacherId) {
  const analytics = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const fetchAnalytics = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await TeacherService.getTeacherAnalytics(teacherId.value || teacherId)
      
      if (result.success) {
        analytics.value = result.data
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    if (teacherId.value || teacherId) {
      fetchAnalytics()
    }
  })

  return {
    analytics: readonly(analytics),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchAnalytics
  }
}

// ============================================================================
// STUDENT COMPOSABLES - Updated for authentication fix
// ============================================================================

export function useStudent() {
  const studentStats = ref({})
  const studentProgress = ref({})
  const studentAchievements = ref([])
  const studentNotifications = ref([])
  const studentClassrooms = ref([])
  const studentStories = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const getStudentStats = async (studentId = null) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await StudentService.getStudentProgress(studentId)
      
      if (result.success) {
        studentStats.value = result.data.stats || {}
      } else {
        error.value = result.error
        console.error('Failed to fetch student stats:', result.error)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching student stats:', err)
    } finally {
      isLoading.value = false
    }
  }

  const getStudentProgress = async (studentId = null) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await StudentService.getStudentProgress(studentId)
      
      if (result.success) {
        studentProgress.value = result.data
        studentStats.value = result.data.stats || {}
        studentAchievements.value = result.data.achievements || []
      } else {
        error.value = result.error
        console.error('Failed to fetch student progress:', result.error)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching student progress:', err)
    } finally {
      isLoading.value = false
    }
  }

  const getStudentAchievements = async (studentId = null) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await StudentService.getStudentProgress(studentId)
      
      if (result.success) {
        studentAchievements.value = result.data.achievements || []
      } else {
        error.value = result.error
        console.error('Failed to fetch student achievements:', result.error)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching student achievements:', err)
    } finally {
      isLoading.value = false
    }
  }

  const getStudentNotifications = async (studentId = null, unreadOnly = false) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await StudentService.getStudentNotifications(studentId, unreadOnly)
      
      if (result.success) {
        studentNotifications.value = result.data || []
      } else {
        error.value = result.error
        console.error('Failed to fetch student notifications:', result.error)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching student notifications:', err)
    } finally {
      isLoading.value = false
    }
  }

  const getStudentClassrooms = async (studentId = null) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await StudentService.getStudentClassrooms(studentId)
      
      if (result.success) {
        studentClassrooms.value = result.data || []
      } else {
        error.value = result.error
        console.error('Failed to fetch student classrooms:', result.error)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching student classrooms:', err)
    } finally {
      isLoading.value = false
    }
  }

  const markNotificationRead = async (notificationId, studentId = null) => {
    try {
      const result = await StudentService.markNotificationRead(notificationId, studentId)
      
      if (result.success) {
        // Update the notification in the local state
        const notifications = studentNotifications.value
        const notificationIndex = notifications.findIndex(n => n.id === notificationId)
        if (notificationIndex !== -1) {
          notifications[notificationIndex] = {
            ...notifications[notificationIndex],
            is_read: true,
            read_at: new Date().toISOString()
          }
        }
      } else {
        error.value = result.error
        console.error('Failed to mark notification as read:', result.error)
      }
      
      return result
    } catch (err) {
      error.value = err.message
      console.error('Error marking notification as read:', err)
      return { success: false, error: err.message }
    }
  }

  const getStudentProfileStats = async (userId = null) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await StudentService.getStudentProfileStats(userId)
      
      if (result.success) {
        return result.data
      } else {
        error.value = result.error
        console.error('Failed to fetch student profile stats:', result.error)
        return { wordsRead: 0, avgScore: 0, storiesRead: 0 }
      }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching student profile stats:', err)
      return { wordsRead: 0, avgScore: 0, storiesRead: 0 }
    } finally {
      isLoading.value = false
    }
  }

  const getMonthlyProfileStats = async (userId = null, year, month, filter = 'all') => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await StudentService.getMonthlyProfileStats(userId, year, month, filter)
      
      if (result.success) {
        return result.data
      } else {
        error.value = result.error
        console.error('Failed to fetch monthly profile stats:', result.error)
        return { wordsRead: 0, avgScore: 0, storiesRead: 0, hasData: false }
      }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching monthly profile stats:', err)
      return { wordsRead: 0, avgScore: 0, storiesRead: 0, hasData: false }
    } finally {
      isLoading.value = false
    }
  }

  const getTotalCounts = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await StudentService.getTotalCounts()
      
      if (result.success) {
        return result.data
      } else {
        error.value = result.error
        console.error('Failed to fetch total counts:', result.error)
        return { totalWords: 0, totalStories: 0 }
      }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching total counts:', err)
      return { totalWords: 0, totalStories: 0 }
    } finally {
      isLoading.value = false
    }
  }

  const getStudentStories = async (storiesData = null) => {
    try {
      isLoading.value = true
      error.value = null
      
      if (storiesData) {
        // If stories data is provided, use it directly
        studentStories.value = storiesData
        return { success: true, data: storiesData }
      }
      
      // For now, return an empty array since stories functionality isn't implemented yet
      // This prevents the undefined error
      studentStories.value = []
      
      return { success: true, data: [] }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching student stories:', err)
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  return {
    studentStats: readonly(studentStats),
    studentProgress: readonly(studentProgress),
    studentAchievements: readonly(studentAchievements),
    studentNotifications: readonly(studentNotifications),
    studentClassrooms: readonly(studentClassrooms),
    studentStories: readonly(studentStories),
    isLoading: readonly(isLoading),
    error: readonly(error),
    getStudentStats,
    getStudentProgress,
    getStudentAchievements,
    getStudentNotifications,
    getStudentClassrooms,
    getStudentProfileStats,
    getMonthlyProfileStats,
    getTotalCounts,
    getStudentStories,
    markNotificationRead
  }
}

export function useStudentClassrooms(studentId) {
  const classrooms = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchClassrooms = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await StudentService.getStudentClassrooms(studentId.value || studentId)
      
      if (result.success) {
        classrooms.value = result.data
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    } finally {
      isLoading.value = false
    }
  }

  const joinClassroom = async (classCode) => {
    try {
      const result = await StudentService.joinClassroom(
        studentId.value || studentId,
        classCode
      )
      
      if (result.success) {
        await fetchClassrooms()
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  const leaveClassroom = async (classroomId) => {
    try {
      const result = await StudentService.leaveClassroom(
        studentId.value || studentId,
        classroomId
      )
      
      if (result.success) {
        await fetchClassrooms()
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  onMounted(() => {
    if (studentId.value || studentId) {
      fetchClassrooms()
    }
  })

  return {
    classrooms: readonly(classrooms),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchClassrooms,
    joinClassroom,
    leaveClassroom
  }
}

export function useStudentTasks(studentId, status = null) {
  const tasks = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchTasks = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await StudentService.getStudentTasks(
        studentId.value || studentId,
        status
      )
      
      if (result.success) {
        tasks.value = result.data
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    } finally {
      isLoading.value = false
    }
  }

  const startTask = async (assignmentId) => {
    try {
      const result = await StudentService.startTask(
        assignmentId,
        studentId.value || studentId
      )
      
      if (result.success) {
        await fetchTasks()
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  const submitTask = async (assignmentId, submissionData) => {
    try {
      const result = await StudentService.submitTask(
        assignmentId,
        studentId.value || studentId,
        submissionData
      )
      
      if (result.success) {
        await fetchTasks()
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  // Computed properties for different task statuses
  const pendingTasks = computed(() => 
    tasks.value.filter(task => 
      !task.student_task_progress.length || 
      task.student_task_progress[0].status === 'assigned'
    )
  )

  const inProgressTasks = computed(() =>
    tasks.value.filter(task =>
      task.student_task_progress.length > 0 &&
      task.student_task_progress[0].status === 'in_progress'
    )
  )

  const completedTasks = computed(() =>
    tasks.value.filter(task =>
      task.student_task_progress.length > 0 &&
      task.student_task_progress[0].status === 'completed'
    )
  )

  onMounted(() => {
    if (studentId.value || studentId) {
      fetchTasks()
    }
  })

  return {
    tasks: readonly(tasks),
    pendingTasks,
    inProgressTasks,
    completedTasks,
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchTasks,
    startTask,
    submitTask
  }
}

export function useStudentProgress(studentId) {
  const progress = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const fetchProgress = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await StudentService.getStudentProgress(studentId.value || studentId)
      
      if (result.success) {
        progress.value = result.data
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    if (studentId.value || studentId) {
      fetchProgress()
    }
  })

  return {
    progress: readonly(progress),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchProgress
  }
}

// ============================================================================
// CONTENT COMPOSABLES
// ============================================================================

export function useContent(contentType = 'both') {
  const words = ref([])
  const stories = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchWords = async (category = null, difficultyLevel = null) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await StudentService.getWords(category, difficultyLevel)
      
      if (result.success) {
        words.value = result.data
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    } finally {
      isLoading.value = false
    }
  }

  const fetchStories = async (category = null, difficultyLevel = null) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await StudentService.getStories(category, difficultyLevel)
      
      if (result.success) {
        stories.value = result.data
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    } finally {
      isLoading.value = false
    }
  }

  const fetchContent = async (filters = {}) => {
    if (contentType === 'words' || contentType === 'both') {
      await fetchWords(filters.category, filters.difficultyLevel)
    }
    
    if (contentType === 'stories' || contentType === 'both') {
      await fetchStories(filters.category, filters.difficultyLevel)
    }
  }

  onMounted(() => {
    fetchContent()
  })

  return {
    words: readonly(words),
    stories: readonly(stories),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchWords,
    fetchStories,
    fetchContent
  }
}

// ============================================================================
// ADMIN COMPOSABLES
// ============================================================================

export function useAdmin() {
  const adminStats = ref(null)
  const adminRequests = ref([])
  const adminActivity = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Get admin statistics (using existing getSystemAnalytics method)
  const getAdminStats = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await AdminService.getSystemAnalytics()
      
      if (result.success) {
        // Transform the system analytics data to match expected format
        adminStats.value = {
          wordsGenerated: result.data.systemStats?.totalWords || 0,
          totalStaff: (result.data.userStats?.teacher || 0) + (result.data.userStats?.admin || 0),
          storiesGenerated: result.data.systemStats?.totalStories || 0,
          totalStudents: result.data.userStats?.student || 0,
          activeClassrooms: result.data.systemStats?.activeClassrooms || 0,
          totalAssignments: result.data.systemStats?.totalTasks || 0
        }
        
        // Also store recent activity from the analytics
        adminActivity.value = result.data.recentActivity || []
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    } finally {
      isLoading.value = false
    }
  }

  // Get admin requests (using existing getAdminRequests method)
  const getAdminRequests = async () => {
    try {
      const result = await AdminService.getAdminRequests('pending', 1, 50)
      
      if (result.success) {
        // Store the full request data for dynamic display
        adminRequests.value = result.data.requests || []
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    }
  }

  // Get admin activity (this is now handled by getAdminStats)
  const getAdminActivity = async () => {
    try {
      // Recent activity is fetched as part of getAdminStats
      // This method can be called separately if needed
      const result = await AdminService.getSystemAnalytics()
      
      if (result.success) {
        adminActivity.value = result.data.recentActivity || []
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    }
  }

  // Approve educator request (using reviewAdminRequest with 'approved')
  const approveRequest = async (requestId, adminId = null) => {
    try {
      isLoading.value = true
      error.value = null
      
      if (!adminId) {
        throw new Error('Admin ID is required for request approval')
      }
      
      const result = await AdminService.reviewAdminRequest(adminId, requestId, 'approved', 'Request approved via dashboard')
      
      if (result.success) {
        // Remove the approved request from the list
        adminRequests.value = adminRequests.value.filter(req => req.id !== requestId)
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      error.value = errorInfo.userMessage
      return { success: false, error: errorInfo.userMessage }
    } finally {
      isLoading.value = false
    }
  }

  // Reject educator request (using reviewAdminRequest with 'rejected')
  const rejectRequest = async (requestId, adminId = null) => {
    try {
      isLoading.value = true
      error.value = null
      
      if (!adminId) {
        throw new Error('Admin ID is required for request rejection')
      }
      
      const result = await AdminService.reviewAdminRequest(adminId, requestId, 'rejected', 'Request rejected via dashboard')
      
      if (result.success) {
        // Remove the rejected request from the list
        adminRequests.value = adminRequests.value.filter(req => req.id !== requestId)
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      error.value = errorInfo.userMessage
      return { success: false, error: errorInfo.userMessage }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    adminStats: readonly(adminStats),
    adminRequests: readonly(adminRequests),
    adminActivity: readonly(adminActivity),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Methods
    getAdminStats,
    getAdminRequests,
    getAdminActivity,
    approveRequest,
    rejectRequest
  }
}

export function useAdminUsers() {
  const users = ref([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const isLoading = ref(false)
  const error = ref(null)

  const fetchUsers = async (page = 1, limit = 50, userType = null, searchTerm = null) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await AdminService.getAllUsers(page, limit, userType, searchTerm)
      
      if (result.success) {
        users.value = result.data.users
        totalCount.value = result.data.totalCount
        currentPage.value = result.data.currentPage
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    } finally {
      isLoading.value = false
    }
  }

  const createUser = async (adminId, userData) => {
    try {
      const result = await AdminService.createUser(adminId, userData)
      
      if (result.success) {
        await fetchUsers(currentPage.value)
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  const updateUser = async (adminId, userId, updates) => {
    try {
      const result = await AdminService.updateUser(adminId, userId, updates)
      
      if (result.success) {
        await fetchUsers(currentPage.value)
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  const deleteUser = async (adminId, userId) => {
    try {
      const result = await AdminService.deleteUser(adminId, userId)
      
      if (result.success) {
        await fetchUsers(currentPage.value)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorInfo = handleServiceError(err)
      return { success: false, error: errorInfo.userMessage }
    }
  }

  onMounted(() => {
    fetchUsers()
  })

  return {
    users: readonly(users),
    totalCount: readonly(totalCount),
    currentPage: readonly(currentPage),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  }
}

export function useSystemAnalytics() {
  const analytics = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const fetchAnalytics = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await AdminService.getSystemAnalytics()
      
      if (result.success) {
        analytics.value = result.data
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = handleServiceError(err).userMessage
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    fetchAnalytics()
  })

  return {
    analytics: readonly(analytics),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchAnalytics
  }
}

// ============================================================================
// EXAMPLE USAGE IN VUE COMPONENT
// ============================================================================

/*
// In your Vue component:

<template>
  <div>
    <div v-if="isLoading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <h2>My Classrooms</h2>
      <div v-for="classroom in classrooms" :key="classroom.id">
        {{ classroom.name }} - Students: {{ classroom.student_count }}
      </div>
      
      <button @click="showCreateForm = true">Create New Classroom</button>
      
      <div v-if="showCreateForm">
        <form @submit.prevent="handleCreateClassroom">
          <input v-model="newClassroom.name" placeholder="Classroom Name" required>
          <input v-model="newClassroom.gradeLevel" type="number" placeholder="Grade Level">
          <button type="submit">Create</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth, useTeacherClassrooms } from '@/composables/services'

// Auth composable
const { user, isTeacher } = useAuth()

// Teacher classrooms composable
const { 
  classrooms, 
  isLoading, 
  error, 
  createClassroom 
} = useTeacherClassrooms(user?.id)

// Component state
const showCreateForm = ref(false)
const newClassroom = ref({
  name: '',
  gradeLevel: null
})

// Handlers
const handleCreateClassroom = async () => {
  const result = await createClassroom(newClassroom.value)
  
  if (result.success) {
    showCreateForm.value = false
    newClassroom.value = { name: '', gradeLevel: null }
  } else {
    alert(result.error)
  }
}
</script>
*/