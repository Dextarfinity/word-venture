import supabase from '../supabase.js'

/**
 * Admin Service - Handles all administrative backend operations
 * Based on the normalized database schema for Word Venture
 */

class AdminService {

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  /**
   * Get all users with pagination and filtering
   */
  static async getAllUsers(page = 1, limit = 50, userType = null, searchTerm = null) {
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Filter by user type if specified
      if (userType && userType !== 'all') {
        query = query.eq('user_type', userType)
      }

      // Search by name or email
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%`)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return { 
        success: true, 
        data: {
          users: data,
          totalCount: count,
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          hasMore: to < count - 1
        }
      }
    } catch (error) {
      console.error('Error fetching all users:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get user details by ID
   */
  static async getUserDetails(userId) {
    try {
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // Get additional details based on user type
      let additionalData = {}

      if (user.user_type === 'teacher') {
        // Get teacher statistics
        const { data: teacherStats } = await supabase
          .from('teacher_analytics')
          .select('*')
          .eq('teacher_id', userId)
          .single()

        // Get teacher's classrooms
        const { data: classrooms } = await supabase
          .from('classrooms')
          .select('id, name, class_code, student_count:classroom_students(count)')
          .eq('teacher_id', userId)
          .eq('is_active', true)

        additionalData = { 
          stats: teacherStats, 
          classrooms: classrooms || []
        }

      } else if (user.user_type === 'student') {
        // Get student progress
        const { data: studentStats } = await supabase
          .from('student_progress_summary')
          .select('*')
          .eq('student_id', userId)
          .single()

        // Get enrolled classrooms
        const { data: enrollments } = await supabase
          .from('classroom_students')
          .select(`
            enrollment_date,
            status,
            classroom:classroom_id (
              id,
              name,
              class_code,
              teacher:teacher_id (
                full_name
              )
            )
          `)
          .eq('student_id', userId)

        additionalData = { 
          stats: studentStats,
          enrollments: enrollments || []
        }
      }

      return { 
        success: true, 
        data: {
          ...user,
          ...additionalData
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create new user (admin, teacher, or student)
   */
  static async createUser(adminId, userData) {
    try {
      // Note: In a real implementation, you'd typically create the auth user first
      // then create the profile. This assumes the auth user already exists.
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userData.authId, // UUID from auth.users
          email: userData.email,
          full_name: userData.fullName,
          user_type: userData.userType,
          avatar_url: userData.avatarUrl,
          bio: userData.bio,
          phone_number: userData.phoneNumber,
          date_of_birth: userData.dateOfBirth,
          grade_level: userData.gradeLevel, // For students
          teacher_id: userData.teacherId, // For students assigned to teachers
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      // Log admin activity
      await this.logAdminActivity(adminId, 'user_created', {
        created_user_id: data.id,
        user_type: userData.userType,
        description: `Created new ${userData.userType}: ${userData.fullName}`
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error creating user:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(adminId, userId, updates) {
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

      // Log admin activity
      await this.logAdminActivity(adminId, 'user_updated', {
        updated_user_id: userId,
        changes: Object.keys(updates),
        description: `Updated user: ${data.full_name}`
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error updating user:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Deactivate/reactivate user
   */
  static async toggleUserStatus(adminId, userId, isActive) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Log admin activity
      await this.logAdminActivity(adminId, isActive ? 'user_activated' : 'user_deactivated', {
        affected_user_id: userId,
        description: `${isActive ? 'Activated' : 'Deactivated'} user: ${data.full_name}`
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error toggling user status:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Permanently delete a user
   */
  static async deleteUser(adminId, userId) {
    try {
      // First get user info for logging
      const { data: userInfo } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single()

      // Delete the user from profiles table
      // Note: This will cascade delete related records if foreign keys are set up properly
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      // Log admin activity
      await this.logAdminActivity(adminId, 'user_deleted', {
        deleted_user_id: userId,
        user_info: userInfo,
        description: `Permanently deleted user: ${userInfo?.full_name || userInfo?.email || userId}`
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting user:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // CONTENT MANAGEMENT
  // ============================================================================

  /**
   * Get all words with management capabilities
   */
  static async getAllWords(page = 1, limit = 50, category = null, isActive = null) {
    try {
      let query = supabase
        .from('Words')
        .select(`
          *,
          creator:created_by (
            full_name,
            user_id
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      if (isActive !== null) {
        query = query.eq('is_active', isActive)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return { 
        success: true, 
        data: {
          words: data,
          totalCount: count,
          currentPage: page,
          totalPages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching words:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create new word
   */
  static async createWord(adminId, wordData) {
    try {
      const { data, error } = await supabase
        .from('Words')
        .insert({
          word: wordData.word,
          category: wordData.category,
          difficulty_level: wordData.difficultyLevel || 1,
          pronunciation: wordData.pronunciation,
          definition: wordData.definition,
          example_sentence: wordData.exampleSentence,
          created_by: adminId,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      await this.logAdminActivity(adminId, 'word_created', {
        word_id: data.id,
        word: wordData.word,
        description: `Created new word: ${wordData.word}`
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error creating word:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update word
   */
  static async updateWord(adminId, wordId, updates) {
    try {
      const { data, error } = await supabase
        .from('Words')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', wordId)
        .select()
        .single()

      if (error) throw error

      await this.logAdminActivity(adminId, 'word_updated', {
        word_id: wordId,
        word: data.word,
        changes: Object.keys(updates),
        description: `Updated word: ${data.word}`
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error updating word:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Toggle word active status
   */
  static async toggleWordStatus(adminId, wordId, isActive) {
    try {
      const { data, error } = await supabase
        .from('Words')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', wordId)
        .select()
        .single()

      if (error) throw error

      await this.logAdminActivity(adminId, isActive ? 'word_activated' : 'word_deactivated', {
        word_id: wordId,
        word: data.word,
        description: `${isActive ? 'Activated' : 'Deactivated'} word: ${data.word}`
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error toggling word status:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get all stories with management capabilities
   */
  static async getAllStories(page = 1, limit = 20, category = null, isActive = null) {
    try {
      let query = supabase
        .from('Short_Stories')
        .select(`
          *,
          creator:created_by (
            full_name,
            user_id
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      if (isActive !== null) {
        query = query.eq('is_active', isActive)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return { 
        success: true, 
        data: {
          stories: data,
          totalCount: count,
          currentPage: page,
          totalPages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create new story
   */
  static async createStory(adminId, storyData) {
    try {
      const { data, error } = await supabase
        .from('Short_Stories')
        .insert({
          title: storyData.title,
          story: storyData.story,
          category: storyData.category,
          difficulty_level: storyData.difficultyLevel || 1,
          estimated_reading_time: storyData.estimatedReadingTime,
          Q1: storyData.Q1,
          A1: storyData.A1,
          Q2: storyData.Q2,
          A2: storyData.A2,
          Q3: storyData.Q3,
          A3: storyData.A3,
          Q4: storyData.Q4,
          A4: storyData.A4,
          Q5: storyData.Q5,
          A5: storyData.A5,
          created_by: adminId,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      await this.logAdminActivity(adminId, 'story_created', {
        story_id: data.id,
        title: storyData.title,
        description: `Created new story: ${storyData.title}`
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error creating story:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update story
   */
  static async updateStory(adminId, storyId, updates) {
    try {
      const { data, error } = await supabase
        .from('Short_Stories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)
        .select()
        .single()

      if (error) throw error

      await this.logAdminActivity(adminId, 'story_updated', {
        story_id: storyId,
        title: data.title,
        changes: Object.keys(updates),
        description: `Updated story: ${data.title}`
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error updating story:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // CLASSROOM & TASK OVERSIGHT
  // ============================================================================

  /**
   * Get all classrooms across the system
   */
  static async getAllClassrooms(page = 1, limit = 50, teacherId = null, isActive = null) {
    try {
      let query = supabase
        .from('classroom_overview')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (teacherId) {
        query = query.eq('teacher_id', teacherId)
      }

      if (isActive !== null) {
        query = query.eq('is_active', isActive)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return { 
        success: true, 
        data: {
          classrooms: data,
          totalCount: count,
          currentPage: page,
          totalPages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching all classrooms:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get system-wide task overview
   */
  static async getAllTasks(page = 1, limit = 50, teacherId = null, status = null) {
    try {
      let query = supabase
        .from('teacher_tasks')
        .select(`
          *,
          teacher:teacher_id (
            full_name,
            user_id
          ),
          classroom:classroom_id (
            name,
            class_code
          )
        `, { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (teacherId) {
        query = query.eq('teacher_id', teacherId)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return { 
        success: true, 
        data: {
          tasks: data,
          totalCount: count,
          currentPage: page,
          totalPages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching all tasks:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // SYSTEM ANALYTICS & REPORTING
  // ============================================================================

  /**
   * Get comprehensive system analytics
   */
  static async getSystemAnalytics() {
    try {
      // User counts by type
      const { data: userCounts, error: userError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('is_active', true)

      if (userError) throw userError

      const userStats = userCounts.reduce((acc, user) => {
        acc[user.user_type] = (acc[user.user_type] || 0) + 1
        return acc
      }, {})

      // Active classrooms
      const { count: activeClassrooms, error: classroomError } = await supabase
        .from('classrooms')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      if (classroomError) throw classroomError

      // Total tasks created
      const { count: totalTasks, error: taskError } = await supabase
        .from('teacher_tasks')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      if (taskError) throw taskError

      // Content statistics
      const { count: totalWords, error: wordError } = await supabase
        .from('Words')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      if (wordError) throw wordError

      const { count: totalStories, error: storyError } = await supabase
        .from('Short_Stories')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      if (storyError) throw storyError

      // Recent activity
      const { data: recentActivity, error: activityError } = await supabase
        .from('system_activities')
        .select(`
          *,
          user:user_id (
            full_name,
            user_type
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (activityError) throw activityError

      // Growth metrics (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: newUsers, error: newUserError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (newUserError) throw newUserError

      const { count: newClassrooms, error: newClassroomError } = await supabase
        .from('classrooms')
        .select('*', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (newClassroomError) throw newClassroomError

      return { 
        success: true, 
        data: {
          userStats: {
            total: Object.values(userStats).reduce((a, b) => a + b, 0),
            admin: userStats.admin || 0,
            teacher: userStats.teacher || 0,
            student: userStats.student || 0
          },
          systemStats: {
            activeClassrooms,
            totalTasks,
            totalWords,
            totalStories
          },
          // Also expose at top level for easier access
          totalWords,
          totalStories,
          growthMetrics: {
            newUsers,
            newClassrooms
          },
          recentActivity
        }
      }
    } catch (error) {
      console.error('Error fetching system analytics:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get user activity report
   */
  static async getUserActivityReport(startDate, endDate, userType = null) {
    try {
      let query = supabase
        .from('user_progress')
        .select(`
          *,
          user:user_id (
            full_name,
            user_type,
            user_id
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      // Filter by user type if specified
      let filteredData = data
      if (userType) {
        filteredData = data.filter(activity => activity.user.user_type === userType)
      }

      // Group by user and calculate statistics
      const userStats = filteredData.reduce((acc, activity) => {
        const userId = activity.user_id
        if (!acc[userId]) {
          acc[userId] = {
            user: activity.user,
            totalActivities: 0,
            completedActivities: 0,
            totalScore: 0,
            totalTimeSpent: 0
          }
        }
        
        acc[userId].totalActivities++
        if (activity.completed) acc[userId].completedActivities++
        if (activity.score) acc[userId].totalScore += activity.score
        if (activity.time_spent) acc[userId].totalTimeSpent += activity.time_spent
        
        return acc
      }, {})

      return { 
        success: true, 
        data: {
          rawData: filteredData,
          userStats: Object.values(userStats),
          summary: {
            totalActivities: filteredData.length,
            uniqueUsers: Object.keys(userStats).length,
            averageScore: filteredData.filter(a => a.score).reduce((sum, a) => sum + a.score, 0) / filteredData.filter(a => a.score).length || 0
          }
        }
      }
    } catch (error) {
      console.error('Error generating activity report:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // ADMIN REQUESTS & MODERATION
  // ============================================================================

  /**
   * Get pending admin requests
   */
  static async getAdminRequests(status = 'pending', page = 1, limit = 20) {
    try {
      let query = supabase
        .from('admin_requests')
        .select(`
          *,
          requester:requester_id (
            full_name,
            user_id,
            user_type
          ),
          reviewer:reviewed_by (
            full_name,
            user_id
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (status !== 'all') {
        query = query.eq('status', status)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return { 
        success: true, 
        data: {
          requests: data,
          totalCount: count,
          currentPage: page,
          totalPages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching admin requests:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Review admin request
   */
  static async reviewAdminRequest(adminId, requestId, decision, reviewNotes = '') {
    try {
      const { data, error } = await supabase
        .from('admin_requests')
        .update({
          status: decision,
          reviewed_by: adminId,
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select(`
          *,
          requester:requester_id (
            full_name,
            user_id
          )
        `)
        .single()

      if (error) throw error

      await this.logAdminActivity(adminId, 'request_reviewed', {
        request_id: requestId,
        decision,
        requester_id: data.requester_id,
        description: `${decision} request from ${data.requester.full_name}: ${data.request_type}`
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error reviewing admin request:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // SYSTEM MAINTENANCE
  // ============================================================================

  /**
   * Get system health metrics
   */
  static async getSystemHealth() {
    try {
      // Database table sizes and health
      const tables = [
        'profiles', 'classrooms', 'teacher_tasks', 'student_task_progress',
        'Words', 'Short_Stories', 'notifications', 'user_progress'
      ]

      const healthData = {}
      
      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact' })

        if (!error) {
          healthData[table] = { count, status: 'healthy' }
        } else {
          healthData[table] = { count: 0, status: 'error', error: error.message }
        }
      }

      // Check for recent errors in system activities
      const { data: recentErrors, error: errorQuery } = await supabase
        .from('system_activities')
        .select('*')
        .eq('activity_type', 'error')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(10)

      return { 
        success: true, 
        data: {
          tables: healthData,
          recentErrors: recentErrors || [],
          lastCheck: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Error checking system health:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Cleanup inactive data
   */
  static async cleanupInactiveData(adminId, daysOld = 90) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      // Archive old notifications
      const { count: archivedNotifications, error: notifError } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .eq('is_dismissed', true)

      if (notifError) throw notifError

      // Archive old system activities
      const { count: archivedActivities, error: activityError } = await supabase
        .from('system_activities')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (activityError) throw activityError

      await this.logAdminActivity(adminId, 'data_cleanup', {
        cutoff_date: cutoffDate.toISOString(),
        archived_notifications: archivedNotifications,
        archived_activities: archivedActivities,
        description: `Cleaned up data older than ${daysOld} days`
      })

      return { 
        success: true, 
        data: {
          archivedNotifications,
          archivedActivities
        }
      }
    } catch (error) {
      console.error('Error cleaning up data:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // ADMIN PROFILE & SETTINGS
  // ============================================================================

  /**
   * Get admin profile with statistics
   */
  static async getAdminProfile(adminId) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminId)
        .eq('user_type', 'admin')
        .single()

      if (profileError) throw profileError

      // Get admin activity stats
      const { count: activitiesCount, error: activityError } = await supabase
        .from('system_activities')
        .select('*', { count: 'exact' })
        .eq('user_id', adminId)

      if (activityError) throw activityError

      return {
        success: true,
        data: {
          ...profile,
          stats: {
            activitiesLogged: activitiesCount
          }
        }
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update admin profile
   */
  static async updateAdminProfile(adminId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId)
        .eq('user_type', 'admin')
        .select()

      if (error) throw error

      await this.logAdminActivity(adminId, 'profile_updated', {
        changes: Object.keys(updates),
        description: 'Updated admin profile'
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error updating admin profile:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Log admin activity for audit trail
   */
  static async logAdminActivity(adminId, activityType, metadata = {}) {
    try {
      await supabase
        .from('system_activities')
        .insert({
          user_id: adminId,
          activity_type: activityType,
          description: metadata.description || `Admin performed: ${activityType}`,
          metadata: metadata
        })
    } catch (error) {
      console.error('Error logging admin activity:', error)
      // Don't throw - logging failures shouldn't break main operations
    }
  }

  /**
   * Send system notification to users
   */
  static async sendSystemNotification(adminId, recipientIds, notificationData) {
    try {
      const notifications = recipientIds.map(recipientId => ({
        recipient_id: recipientId,
        sender_id: adminId,
        type: notificationData.type || 'system',
        title: notificationData.title,
        message: notificationData.message,
        priority: notificationData.priority || 'normal',
        related_id: notificationData.relatedId,
        related_type: notificationData.relatedType
      }))

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select()

      if (error) throw error

      await this.logAdminActivity(adminId, 'system_notification_sent', {
        recipient_count: recipientIds.length,
        notification_type: notificationData.type,
        title: notificationData.title,
        description: `Sent system notification to ${recipientIds.length} users`
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error sending system notification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Export system data for backup
   */
  static async exportSystemData(adminId, tables = [], format = 'json') {
    try {
      const exportData = {}
      const defaultTables = ['profiles', 'classrooms', 'teacher_tasks', 'Words', 'Short_Stories']
      const tablesToExport = tables.length > 0 ? tables : defaultTables

      for (const table of tablesToExport) {
        const { data, error } = await supabase
          .from(table)
          .select('*')

        if (error) throw error
        exportData[table] = data
      }

      await this.logAdminActivity(adminId, 'data_export', {
        tables: tablesToExport,
        record_count: Object.values(exportData).reduce((sum, tableData) => sum + tableData.length, 0),
        format,
        description: `Exported system data for tables: ${tablesToExport.join(', ')}`
      })

      return { 
        success: true, 
        data: exportData,
        metadata: {
          exportDate: new Date().toISOString(),
          tables: tablesToExport,
          format
        }
      }
    } catch (error) {
      console.error('Error exporting system data:', error)
      return { success: false, error: error.message }
    }
  }

}

export { AdminService }
export default AdminService