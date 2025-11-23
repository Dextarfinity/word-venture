/**
 * Service Index - Central exports for all Word Venture backend services
 * 
 * This file provides a single point of import for all backend services
 * in the Word Venture application.
 */

// Import Supabase client
import supabase from '../supabase.js'

// Import services for local use and re-export
import AuthServiceClass from './authService.js'
import { TeacherService } from './teacherService.js'
import { StudentService } from './studentService.js'
import { AdminService } from './adminService.js'

// Re-export for external use
export { AuthServiceClass as AuthService }
export { TeacherService }
export { StudentService }  
export { AdminService }

// Create references for internal use
const AuthService = AuthServiceClass

// Legacy/Additional Services - using named imports
import * as dataManager from './dataManager.js'
import * as openaiService from './openai.js'

export { dataManager, openaiService }

// Service Factory for role-based service access
export class ServiceFactory {
  
  /**
   * Get appropriate service based on user role
   */
  static getServiceForRole(userType) {
    const services = {
      'teacher': TeacherService,
      'student': StudentService,
      'admin': AdminService
    }
    
    return services[userType] || null
  }

  /**
   * Get all available services for a user role
   */
  static getAvailableServices(userType) {
    const baseServices = {
      auth: AuthService
    }

    const roleServices = {
      'student': {
        ...baseServices,
        student: StudentService
      },
      'teacher': {
        ...baseServices,
        teacher: TeacherService,
        student: StudentService // Teachers can access student data for their students
      },
      'admin': {
        ...baseServices,
        admin: AdminService,
        teacher: TeacherService,
        student: StudentService
      }
    }

    return roleServices[userType] || baseServices
  }
}

// Utility function to initialize services with authentication check
export async function initializeServices() {
  try {
    // Check authentication status
    const session = await AuthService.getCurrentSession()
    
    if (!session.success || !session.data.session) {
      return {
        isAuthenticated: false,
        user: null,
        profile: null,
        services: { auth: AuthService }
      }
    }

    // Get user profile and determine available services
    const userType = session.data.profile?.user_type
    const availableServices = ServiceFactory.getAvailableServices(userType)

    return {
      isAuthenticated: true,
      user: session.data.user,
      profile: session.data.profile,
      services: availableServices,
      userType: userType
    }
  } catch (error) {
    console.error('Error initializing services:', error)
    return {
      isAuthenticated: false,
      user: null,
      profile: null,
      services: { auth: AuthService },
      error: error.message
    }
  }
}

// Quick access functions for common operations
export const quickAccess = {
  
  // Authentication
  async login(email, password) {
    return await AuthService.signIn(email, password)
  },

  async logout() {
    return await AuthService.signOut()
  },

  async getCurrentUser() {
    return await AuthService.getCurrentSession()
  },

  // Student Operations
  async joinClassroom(studentId, classCode) {
    return await StudentService.joinClassroom(studentId, classCode)
  },

  async getStudentTasks(studentId) {
    return await StudentService.getStudentTasks(studentId)
  },

  async submitTask(assignmentId, studentId, submissionData) {
    return await StudentService.submitTask(assignmentId, studentId, submissionData)
  },

  // Teacher Operations
  async createClassroom(teacherId, classroomData) {
    return await TeacherService.createClassroom(teacherId, classroomData)
  },

  async createTask(teacherId, taskData) {
    return await TeacherService.createTask(teacherId, taskData)
  },

  async getClassroomAnalytics(classroomId, teacherId) {
    return await TeacherService.getClassroomAnalytics(classroomId, teacherId)
  },

  // Admin Operations
  async getAllUsers(page, limit, userType) {
    return await AdminService.getAllUsers(page, limit, userType)
  },

  async getSystemAnalytics() {
    return await AdminService.getSystemAnalytics()
  },

  // Content Operations
  async getWords(category, difficultyLevel) {
    return await StudentService.getWords(category, difficultyLevel)
  },

  async getStories(category, difficultyLevel) {
    return await StudentService.getStories(category, difficultyLevel)
  }
}

// Error handler for service operations
export function handleServiceError(error) {
  console.error('Service Error:', error)
  
  // Common error patterns and user-friendly messages
  const errorMessages = {
    'JWT expired': 'Your session has expired. Please log in again.',
    'Invalid JWT': 'Authentication error. Please log in again.',
    'Row Level Security': 'You do not have permission to access this resource.',
    'duplicate key value': 'This item already exists.',
    'foreign key constraint': 'Cannot complete operation due to related data.',
    'not found': 'The requested item was not found.',
    'network': 'Network error. Please check your internet connection.',
  }

  for (const [pattern, message] of Object.entries(errorMessages)) {
    if (error.message && error.message.toLowerCase().includes(pattern.toLowerCase())) {
      return {
        userMessage: message,
        originalError: error.message,
        code: pattern.replace(/\s+/g, '_').toLowerCase()
      }
    }
  }

  return {
    userMessage: 'An unexpected error occurred. Please try again.',
    originalError: error.message || error,
    code: 'unknown_error'
  }
}

// Service health check
export async function checkServiceHealth() {
  const healthStatus = {
    auth: false,
    database: false,
    timestamp: new Date().toISOString()
  }

  try {
    // Check auth service
    const authCheck = await AuthService.getCurrentSession()
    healthStatus.auth = authCheck.success

    // Check database connectivity with a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    healthStatus.database = !error

    return {
      success: true,
      data: healthStatus,
      allHealthy: healthStatus.auth && healthStatus.database
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: healthStatus
    }
  }
}

export default {
  AuthService,
  TeacherService,
  StudentService,
  AdminService,
  ServiceFactory,
  initializeServices,
  quickAccess,
  handleServiceError,
  checkServiceHealth
}