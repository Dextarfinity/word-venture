import supabase from '../supabase.js'

/**
 * Authentication Service - Handles user authentication, registration, and session management
 * Based on the normalized database schema for Word Venture
 */

export class AuthService {

  // ============================================================================
  // AUTHENTICATION & SESSION MANAGEMENT
  // ============================================================================

  /**
   * Sign up new user
   */
  static async signUp(email, password, userData) {
    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: userData.fullName,
            user_type: userData.userType
          }
        }
      })

      if (authError) throw authError

      // Create profile in our profiles table
      if (authData.user && authData.session) {
        // Set the session first to ensure RLS policies work
        supabase.auth.setSession(authData.session)
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: userData.full_name || userData.fullName || '',
            user_type: userData.user_type || userData.userType || 'student',
            avatar_url: userData.avatar_url || userData.avatarUrl || null,
            bio: userData.bio || null,
            phone_number: userData.phone_number || userData.phoneNumber || null,
            date_of_birth: userData.date_of_birth || userData.dateOfBirth || null,
            grade_level: userData.grade_level || userData.gradeLevel || null, // For students
            teacher_id: userData.teacher_id || userData.teacherId || null, // For students assigned to teachers
            is_active: true,
            notifications_enabled: true,
            sound_enabled: true,
            dark_mode: false
          })
          .select()
          .single()

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // If profile creation fails, still return success for auth but note the error
          console.warn('Profile creation failed but authentication succeeded. User may need to complete profile setup.')
        }

        // Initialize user stats for students
        if ((userData.user_type === 'student' || userData.userType === 'student') && !profileError) {
          const { error: statsError } = await supabase
            .from('user_stats')
            .insert({
              user_id: authData.user.id,
              current_reading_level: 1,
              streak_days: 0
            })
          
          if (statsError) {
            console.error('User stats creation error:', statsError)
          }
        }

        return { 
          success: true, 
          data: {
            user: authData.user,
            profile: profile || null,
            session: authData.session,
            profileError: profileError ? profileError.message : null
          }
        }
      }

      return { success: true, data: authData }
    } catch (error) {
      console.error('Error during sign up:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Sign in user
   */
  static async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      })

      if (error) throw error

      if (data.user) {
        // Get user profile
        let profile = await this.getUserProfile(data.user.id)
        
        // If profile doesn't exist, try to create one
        if (!profile.success) {
          console.log('Profile not found for user, attempting to create...')
          const createResult = await this.createMissingProfile(data.user)
          
          if (createResult.success) {
            profile = await this.getUserProfile(data.user.id)
          }
          
          // If still no profile, return error with helpful message
          if (!profile.success) {
            await this.signOut()
            throw new Error('Unable to access or create user profile. Please contact support.')
          }
        }

        // Check if user is active
        if (!profile.data.is_active) {
          await this.signOut()
          throw new Error('Account is deactivated. Please contact administrator.')
        }

        return { 
          success: true, 
          data: {
            user: data.user,
            profile: profile.data,
            session: data.session
          }
        }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error during sign in:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Sign out user
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error during sign out:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get current user session
   */
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      
      if (session && session.user) {
        // Get user profile
        let profile = await this.getUserProfile(session.user.id)
        
        // If profile doesn't exist, try to create one
        if (!profile.success) {
          console.log('Profile not found for existing session, attempting to create...')
          const createResult = await this.createMissingProfile(session.user)
          
          if (createResult.success) {
            profile = await this.getUserProfile(session.user.id)
          }
        }
        
        return { 
          success: true, 
          data: {
            session,
            user: session.user,
            profile: profile.success ? profile.data : null
          }
        }
      }
      
      return { success: true, data: { session: null, user: null, profile: null } }
    } catch (error) {
      console.error('Error getting current session:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error requesting password reset:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error updating password:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update email
   */
  static async updateEmail(newEmail) {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })
      
      if (error) throw error
      
      // Update email in profile table as well
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ email: newEmail })
          .eq('id', user.id)
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error updating email:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a missing profile for authenticated user
   */
  static async createMissingProfile(user) {
    try {
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: '',
        user_type: 'student', // Default role
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single()

      if (error) throw error

      console.log('Successfully created missing profile for user:', user.id)
      return { success: true, data }
    } catch (error) {
      console.error('Error creating missing profile:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Upload avatar image
   */
  static async uploadAvatar(userId, file) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar.${fileExt}`
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with avatar URL
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (profileError) throw profileError

      return { 
        success: true, 
        data: {
          avatar_url: urlData.publicUrl,
          profile: profile
        }
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Submit educator request to admin
   */
  static async submitEducatorRequest(userId, requestData) {
    try {
      // Try to check if user already has a pending educator request
      // Use maybeSingle() instead of single() to handle no results gracefully
      const { data: existingRequest, error: checkError } = await supabase
        .from('admin_requests')
        .select('id, status')
        .eq('requester_id', userId)
        .eq('request_type', 'become_educator')
        .eq('status', 'pending')
        .maybeSingle()

      // If we can't check (RLS issue), continue anyway
      if (!checkError && existingRequest) {
        return { 
          success: false, 
          error: 'You already have a pending educator request. Please wait for admin review.' 
        }
      }

      // Create new educator request
      const { data: request, error: insertError } = await supabase
        .from('admin_requests')
        .insert({
          requester_id: userId,
          request_type: 'become_educator',
          request_data: requestData,
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Try to create notification for admins (non-critical, don't fail if it errors)
      try {
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_type', 'admin')
          .eq('is_active', true)

        if (admins && admins.length > 0) {
          const notifications = admins.map(admin => ({
            recipient_id: admin.id,
            sender_id: userId,
            type: 'admin_request',
            title: 'New Educator Request',
            message: `${requestData.user_profile?.full_name || 'A user'} has requested to become an educator.`,
            related_id: request.id,
            related_type: 'admin_request',
            priority: 'high'
          }))

          await supabase
            .from('notifications')
            .insert(notifications)
        }
      } catch (notifError) {
        // Log but don't fail the request
        console.warn('Could not create admin notifications:', notifError)
      }

      return { 
        success: true, 
        data: request 
      }
    } catch (error) {
      console.error('Error submitting educator request:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // ROLE-BASED ACCESS CONTROL
  // ============================================================================

  /**
   * Check if user has required role
   */
  static async hasRole(userId, requiredRole) {
    try {
      const profile = await this.getUserProfile(userId)
      if (!profile.success) return false
      
      const userRole = profile.data.user_type
      
      // Role hierarchy: admin > teacher > student
      const roleHierarchy = {
        'student': 1,
        'teacher': 2,
        'admin': 3
      }
      
      return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
    } catch (error) {
      console.error('Error checking user role:', error)
      return false
    }
  }

  /**
   * Check if user can access resource
   */
  static async canAccessResource(userId, resourceType, resourceId = null) {
    try {
      const profile = await this.getUserProfile(userId)
      if (!profile.success) return false
      
      const userRole = profile.data.user_type
      
      // Admin can access everything
      if (userRole === 'admin') return true
      
      switch (resourceType) {
        case 'classroom':
          if (userRole === 'teacher') {
            // Teachers can only access their own classrooms
            if (!resourceId) return true // Can access classroom list
            
            const { data, error } = await supabase
              .from('classrooms')
              .select('teacher_id')
              .eq('id', resourceId)
              .single()
            
            return !error && data.teacher_id === userId
          } else if (userRole === 'student') {
            // Students can only access classrooms they're enrolled in
            if (!resourceId) return true // Can access their classroom list
            
            const { data, error } = await supabase
              .from('classroom_students')
              .select('id')
              .eq('classroom_id', resourceId)
              .eq('student_id', userId)
              .eq('status', 'active')
              .single()
            
            return !error && data
          }
          return false
          
        case 'task':
          if (userRole === 'teacher') {
            // Teachers can access tasks they created
            if (!resourceId) return true
            
            const { data, error } = await supabase
              .from('teacher_tasks')
              .select('teacher_id')
              .eq('id', resourceId)
              .single()
            
            return !error && data.teacher_id === userId
          } else if (userRole === 'student') {
            // Students can access tasks assigned to them
            if (!resourceId) return true
            
            const { data, error } = await supabase
              .from('task_assignments')
              .select('id')
              .eq('task_id', resourceId)
              .eq('user_id', userId)
              .single()
            
            return !error && data
          }
          return false
          
        case 'profile':
          // Users can access their own profile, teachers can access their students', admin can access all
          if (!resourceId) return userId === resourceId
          
          if (userId === resourceId) return true
          
          if (userRole === 'teacher') {
            // Teachers can access profiles of their students
            const { data, error } = await supabase
              .from('classroom_students')
              .select(`
                classroom:classroom_id (
                  teacher_id
                )
              `)
              .eq('student_id', resourceId)
              .eq('status', 'active')
            
            return !error && data.some(enrollment => 
              enrollment.classroom && enrollment.classroom.teacher_id === userId
            )
          }
          
          return false
          
        default:
          return false
      }
    } catch (error) {
      console.error('Error checking resource access:', error)
      return false
    }
  }

  /**
   * Get user permissions
   */
  static async getUserPermissions(userId) {
    try {
      const profile = await this.getUserProfile(userId)
      if (!profile.success) return { success: false, error: 'Profile not found' }
      
      const userRole = profile.data.user_type
      
      const basePermissions = {
        canUpdateOwnProfile: true,
        canViewOwnStats: true,
        canReceiveNotifications: true
      }
      
      const rolePermissions = {
        'student': {
          ...basePermissions,
          canJoinClassrooms: true,
          canViewAssignments: true,
          canSubmitAssignments: true,
          canReadContent: true,
          canViewProgress: true
        },
        'teacher': {
          ...basePermissions,
          canCreateClassrooms: true,
          canManageClassrooms: true,
          canCreateTasks: true,
          canViewStudentProgress: true,
          canCreateAnnouncements: true,
          canGradeAssignments: true,
          canViewAnalytics: true
        },
        'admin': {
          ...basePermissions,
          canManageAllUsers: true,
          canManageAllClassrooms: true,
          canManageContent: true,
          canViewSystemAnalytics: true,
          canModerateContent: true,
          canManageSystemSettings: true,
          canExportData: true,
          canViewAuditLogs: true
        }
      }
      
      return { 
        success: true, 
        data: rolePermissions[userRole] || basePermissions 
      }
    } catch (error) {
      console.error('Error getting user permissions:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // SESSION HELPERS
  // ============================================================================

  /**
   * Set up auth state change listener
   */
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      let profileData = null
      
      if (session && session.user) {
        const profile = await this.getUserProfile(session.user.id)
        profileData = profile.success ? profile.data : null
      }
      
      callback(event, session, profileData)
    })
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    } catch (error) {
      console.error('Error checking authentication:', error)
      return false
    }
  }

  /**
   * Require authentication (for route guards)
   */
  static async requireAuth() {
    const isAuth = await this.isAuthenticated()
    if (!isAuth) {
      throw new Error('Authentication required')
    }
    return true
  }

  /**
   * Require specific role (for route guards)
   */
  static async requireRole(requiredRole) {
    const session = await this.getCurrentSession()
    if (!session.success || !session.data.user) {
      throw new Error('Authentication required')
    }
    
    const hasRequiredRole = await this.hasRole(session.data.user.id, requiredRole)
    if (!hasRequiredRole) {
      throw new Error(`${requiredRole} role required`)
    }
    
    return true
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate secure random password
   */
  static generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  /**
   * Validate email format
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate password strength
   */
  static validatePassword(password) {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*]/.test(password)
    
    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
      errors: [
        ...(password.length < minLength ? [`Password must be at least ${minLength} characters long`] : []),
        ...(!hasUpperCase ? ['Password must contain at least one uppercase letter'] : []),
        ...(!hasLowerCase ? ['Password must contain at least one lowercase letter'] : []),
        ...(!hasNumbers ? ['Password must contain at least one number'] : [])
      ]
    }
  }

  /**
   * Format user display name
   */
  static formatUserDisplayName(profile) {
    if (!profile) return 'Unknown User'
    
    if (profile.full_name) {
      return `${profile.full_name} (${profile.user_id})`
    }
    
    return profile.email || profile.user_id || 'Unknown User'
  }

  /**
   * Get user type display name
   */
  static getUserTypeDisplayName(userType) {
    const displayNames = {
      'admin': 'Administrator',
      'teacher': 'Teacher',
      'student': 'Student'
    }
    
    return displayNames[userType] || userType
  }

  // ============================================================================
  // ADMIN UTILITIES
  // ============================================================================

  /**
   * Fix orphaned auth users by creating missing profiles
   * This is an admin utility to fix users who have auth accounts but no profiles
   */
  static async fixOrphanedUsers() {
    try {
      // This would require admin privileges in a real scenario
      // For now, we'll return a helpful message
      console.log('To fix orphaned users, run the SQL commands from fix-rls-policies.sql in your Supabase SQL Editor')
      
      return { 
        success: true, 
        message: 'Please run the diagnostic and fix commands from fix-rls-policies.sql in Supabase SQL Editor to resolve orphaned users.' 
      }
    } catch (error) {
      console.error('Error checking orphaned users:', error)
      return { success: false, error: error.message }
    }
  }

}

export default AuthService