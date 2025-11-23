import supabase from '../supabase.js'

/**
 * Student Service - Handles all student-related backend operations
 * Based on the normalized database schema for Word Venture
 */

class StudentService {

  // ============================================================================
  // CLASSROOM & ENROLLMENT
  // ============================================================================

  /**
   * Join classroom using class code
   */
  static async joinClassroom(studentId, classCode) {
    try {
      // Find classroom by class code
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select(`
          id,
          name,
          max_students,
          teacher_id,
          profiles:teacher_id (
            full_name,
            email
          )
        `)
        .eq('class_code', classCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (classroomError) throw new Error('Invalid class code')

      // Check if already enrolled
      const { data: existing, error: checkError } = await supabase
        .from('classroom_students')
        .select('id, status')
        .eq('classroom_id', classroom.id)
        .eq('student_id', studentId)
        .single()

      if (existing && existing.status === 'active') {
        throw new Error('Already enrolled in this classroom')
      }

      // Check classroom capacity
      const { count: currentStudents, error: countError } = await supabase
        .from('classroom_students')
        .select('*', { count: 'exact' })
        .eq('classroom_id', classroom.id)
        .eq('status', 'active')

      if (countError) throw countError

      if (currentStudents >= classroom.max_students) {
        throw new Error('Classroom is at maximum capacity')
      }

      // Enroll student
      const { data, error } = await supabase
        .from('classroom_students')
        .upsert({
          classroom_id: classroom.id,
          student_id: studentId,
          status: 'active',
          enrollment_date: new Date().toISOString()
        })
        .select()

      if (error) throw error

      return { 
        success: true, 
        data: {
          enrollment: data,
          classroom
        }
      }
    } catch (error) {
      console.error('Error joining classroom:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get student's enrolled classrooms
   */
  static async getStudentClassrooms(studentId) {
    try {
      // Simple approach: get classroom enrollment first
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('classroom_students')
        .select(`
          id,
          enrollment_date,
          status,
          classroom_id
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .order('enrollment_date', { ascending: false })

      if (enrollmentError) throw enrollmentError

      // Get classroom details 
      const classroomData = []
      for (const enrollment of enrollments) {
        const { data: classroomInfo, error: classroomError } = await supabase
          .from('classrooms')
          .select('id, name, class_code, description, grade_level, subject, teacher_id')
          .eq('id', enrollment.classroom_id)
          .single()

        if (!classroomError && classroomInfo) {
          // Try to get teacher name using a public query or service account
          let teacherName = 'Teacher'
          
          try {
            // Attempt to get teacher info - this might work if RLS allows it
            const { data: teacherData, error: teacherError } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', classroomInfo.teacher_id)
              .eq('user_type', 'teacher') // Add filter for teacher type
              .single()

            if (!teacherError && teacherData) {
              teacherName = teacherData.full_name
            }
          } catch (teacherErr) {
            console.log('Could not fetch teacher name, using fallback')
          }

          classroomData.push({
            ...enrollment,
            classroom: {
              ...classroomInfo,
              teacher: {
                id: classroomInfo.teacher_id,
                full_name: teacherName
              }
            }
          })
        }
      }

      return { success: true, data: classroomData }
    } catch (error) {
      console.error('Error fetching student classrooms:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Leave classroom
   */
  static async leaveClassroom(studentId, classroomId) {
    try {
      const { error } = await supabase
        .from('classroom_students')
        .update({ status: 'inactive' })
        .eq('classroom_id', classroomId)
        .eq('student_id', studentId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error leaving classroom:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // ASSIGNMENTS & TASKS
  // ============================================================================

  /**
   * Get student's assigned tasks
   */
  static async getStudentTasks(studentId, status = null) {
    try {
      console.log('🔍 StudentService: Fetching tasks for student:', studentId);
      
      let query = supabase
        .from('task_assignments')
        .select(`
          id,
          assigned_at,
          due_date,
          task:task_id (
            id,
            title,
            description,
            category,
            subcategory,
            priority,
            max_points,
            instructions,
            test_content,
            test_settings,
            classroom_id,
            classroom:classroom_id (
              id,
              name,
              teacher:teacher_id (
                full_name
              )
            )
          )
        `)
        .eq('user_id', studentId)
        .order('assigned_at', { ascending: false })

      const { data, error } = await query

      console.log('📋 StudentService: Task assignments query result:', { data, error });

      if (error) throw error

      // Fetch progress data separately from student_task_progress table
      const assignmentIds = data?.map(assignment => assignment.id) || [];
      let progressData = [];
      
      if (assignmentIds.length > 0) {
        const { data: progress, error: progressError } = await supabase
          .from('student_task_progress')
          .select('*')
          .in('assignment_id', assignmentIds);

        if (progressError) {
          console.warn('Could not fetch progress data:', progressError);
        } else {
          progressData = progress || [];
        }
      }

      // Merge progress data with assignments
      const tasksWithProgress = (data || []).map(assignment => {
        const progress = progressData.find(p => p.assignment_id === assignment.id);
        return {
          ...assignment,
          student_task_progress: progress ? [{
            id: progress.id,
            status: progress.status,
            score: progress.score,
            time_spent: progress.time_spent,
            attempts: progress.attempts,
            submitted_at: progress.submitted_at,
            feedback: progress.feedback
          }] : []
        };
      });

      // Filter by status if specified
      let filteredData = tasksWithProgress
      if (status) {
        filteredData = tasksWithProgress.filter(assignment => {
          const progress = assignment.student_task_progress[0]
          return progress ? progress.status === status : status === 'assigned'
        })
      }

      console.log('✅ StudentService: Returning', filteredData.length, 'tasks');
      return { success: true, data: filteredData }
    } catch (error) {
      console.error('❌ StudentService: Error fetching student tasks:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Start task (update status to in_progress)
   */
  static async startTask(assignmentId, studentId) {
    try {
      // Verify assignment belongs to student
      const { data: assignment, error: assignmentError } = await supabase
        .from('task_assignments')
        .select('id, task_id')
        .eq('id', assignmentId)
        .eq('user_id', studentId)
        .single()

      if (assignmentError) throw assignmentError

      // Check if progress record exists
      const { data: existingProgress } = await supabase
        .from('student_task_progress')
        .select('id')
        .eq('assignment_id', assignmentId)
        .single()

      let progressData
      if (existingProgress) {
        // Update existing progress
        const { data, error } = await supabase
          .from('student_task_progress')
          .update({
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id)
          .select()
          .single()

        if (error) throw error
        progressData = data
      } else {
        // Create new progress record
        const { data, error } = await supabase
          .from('student_task_progress')
          .insert({
            assignment_id: assignmentId,
            status: 'in_progress'
          })
          .select()
          .single()

        if (error) throw error
        progressData = data
      }

      return { success: true, data: progressData }
    } catch (error) {
      console.error('Error starting task:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Submit task completion
   */
  static async submitTask(assignmentId, studentId, submissionData) {
    try {
      // Verify assignment belongs to student
      const { data: assignment, error: assignmentError } = await supabase
        .from('task_assignments')
        .select('id, task_id')
        .eq('id', assignmentId)
        .eq('user_id', studentId)
        .single()

      if (assignmentError) throw assignmentError

      // Update or create progress record
      const progressUpdate = {
        status: 'completed',
        score: submissionData.score || 0,
        max_score: submissionData.max_score || submissionData.wordsRead || 0,
        time_spent: submissionData.timeSpent || 0,
        attempts: submissionData.attempts || 1,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: existingProgress, error: progressError } = await supabase
        .from('student_task_progress')
        .select('id, attempts')
        .eq('assignment_id', assignmentId)
        .maybeSingle() // Use maybeSingle instead of single to handle no records

      if (progressError) throw progressError

      let progressData
      if (existingProgress) {
        // Update existing - increment attempts
        progressUpdate.attempts = (existingProgress.attempts || 0) + 1
        
        const { data, error } = await supabase
          .from('student_task_progress')
          .update(progressUpdate)
          .eq('id', existingProgress.id)
          .select()
          .single()

        if (error) throw error
        progressData = data
      } else {
        // Create new progress record
        const { data, error } = await supabase
          .from('student_task_progress')
          .insert({
            assignment_id: assignmentId,
            ...progressUpdate
          })
          .select()
          .single()

        if (error) throw error
        progressData = data
      }

      // Save quiz responses if provided
      if (submissionData.quizResponses && submissionData.quizResponses.length > 0) {
        const responses = submissionData.quizResponses.map(response => ({
          assignment_id: assignmentId,
          story_number: response.storyNumber,
          question_number: response.questionNumber,
          user_answer: response.userAnswer,
          points_earned: response.pointsEarned || 0,
          response_time: response.responseTime || 0
        }))

        const { error: responsesError } = await supabase
          .from('quiz_responses')
          .insert(responses)

        if (responsesError) throw responsesError
      }

      // Update user stats
      await this.updateUserStats(studentId, submissionData)

      return { success: true, data: progressData }
    } catch (error) {
      console.error('Error submitting task:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get task details for student
   */
  static async getTaskDetails(assignmentId, studentId) {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select(`
          id,
          assigned_at,
          due_date,
          task:task_id (
            id,
            title,
            description,
            category,
            subcategory,
            priority,
            max_points,
            instructions,
            test_content,
            test_settings
          ),
          student_task_progress (
            id,
            status,
            score,
            time_spent,
            attempts,
            submitted_at,
            feedback
          )
        `)
        .eq('id', assignmentId)
        .eq('user_id', studentId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching task details:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // CONTENT & LEARNING
  // ============================================================================

  /**
   * Get available words for practice
   */
  static async getWords(category = null, difficultyLevel = null, limit = 50) {
    try {
      let query = supabase
        .from('Words')
        .select('*')
        .eq('is_active', true)
        .order('word')
        .limit(limit)

      if (category) {
        query = query.eq('category', category)
      }

      if (difficultyLevel) {
        query = query.eq('difficulty_level', difficultyLevel)
      }

      const { data, error } = await query

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching words:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get available stories for reading
   */
  static async getStories(category = null, difficultyLevel = null, limit = 20) {
    try {
      let query = supabase
        .from('Short_Stories')
        .select('*')
        .eq('is_active', true)
        .order('title')
        .limit(limit)

      if (category) {
        query = query.eq('category', category)
      }

      if (difficultyLevel) {
        query = query.eq('difficulty_level', difficultyLevel)
      }

      const { data, error } = await query

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching stories:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get story with questions
   */
  static async getStoryWithQuestions(storyNumber) {
    try {
      const { data, error } = await supabase
        .from('Short_Stories')
        .select(`
          *,
          Q1, A1, Q2, A2, Q3, A3, Q4, A4, Q5, A5
        `)
        .eq('Number', storyNumber)
        .single()

      if (error) throw error

      // Format questions and answers
      const questions = []
      for (let i = 1; i <= 5; i++) {
        if (data[`Q${i}`] && data[`A${i}`]) {
          questions.push({
            number: i,
            question: data[`Q${i}`],
            answer: data[`A${i}`]
          })
        }
      }

      return { 
        success: true, 
        data: {
          ...data,
          questions
        }
      }
    } catch (error) {
      console.error('Error fetching story with questions:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Record reading session
   */
  static async recordReadingSession(studentId, sessionData) {
    try {
      const { data, error } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: studentId,
          content_type: sessionData.contentType,
          content_id: sessionData.contentId,
          session_duration: sessionData.duration,
          words_read: sessionData.wordsRead,
          accuracy_rate: sessionData.accuracyRate,
          reading_speed: sessionData.readingSpeed
        })
        .select()
        .single()

      if (error) throw error

      // Update user stats
      await this.updateUserStats(studentId, {
        activity: 'reading',
        wordsRead: sessionData.wordsRead,
        timeSpent: sessionData.duration
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error recording reading session:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // PROGRESS & ACHIEVEMENTS
  // ============================================================================

  /**
   * Get student progress summary
   */
  static async getStudentProgress(studentId) {
    try {
      // Validate studentId
      if (!studentId) {
        throw new Error('Student ID is required')
      }

      // Get from progress summary view (with fallback)
      let progressSummary = null
      try {
        const { data, error } = await supabase
          .from('student_progress_summary')
          .select('*')
          .eq('student_id', studentId)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.warn('Progress summary view not available:', error.message)
        } else {
          progressSummary = data
        }
      } catch (viewError) {
        console.warn('Student progress summary view not available, using fallback')
      }

      // Get user stats (create if doesn't exist)
      let userStats = null
      try {
        const { data, error } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', studentId)
          .single()

        if (error && error.code === 'PGRST116') {
          // No stats found, create initial record
          console.log('Creating initial user stats for student:', studentId)
          const { data: newStats, error: createError } = await supabase
            .from('user_stats')
            .insert({
              user_id: studentId,
              current_reading_level: 1,
              streak_days: 0,
              last_activity: new Date().toISOString()
            })
            .select()
            .single()

          if (!createError) {
            userStats = newStats
          } else {
            console.warn('Could not create user stats:', createError.message)
          }
        } else if (error) {
          console.warn('Error fetching user stats:', error.message)
        } else {
          userStats = data
        }
      } catch (statsError) {
        console.warn('User stats table access issue:', statsError.message)
      }

      // Get recent achievements (with fallback)
      let achievements = []
      try {
        const { data, error } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', studentId)
          .order('unlocked_at', { ascending: false })
          .limit(10)

        if (!error) {
          achievements = data || []
        } else {
          console.warn('Could not fetch achievements:', error.message)
        }
      } catch (achievementsError) {
        console.warn('Achievements table access issue:', achievementsError.message)
      }

      // Get recent activity (with fallback)
      let recentActivity = []
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', studentId)
          .order('created_at', { ascending: false })
          .limit(10)

        if (!error) {
          recentActivity = data || []
        } else {
          console.warn('Could not fetch user progress:', error.message)
        }
      } catch (activityError) {
        console.warn('User progress table access issue:', activityError.message)
      }

      return { 
        success: true, 
        data: {
          summary: progressSummary || {
            assigned_tasks: 0,
            completed_tasks: 0,
            current_reading_level: 1,
            streak_days: 0
          },
          stats: userStats || {
            current_reading_level: 1,
            streak_days: 0,
            last_activity: null
          },
          achievements,
          recentActivity
        }
      }
    } catch (error) {
      console.error('Error fetching student progress:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get student statistics for profile display
   */
  static async getStudentProfileStats(userId) {
    try {
      // Validate userId
      if (!userId) {
        throw new Error('User ID is required')
      }

      // Initialize stats
      let wordsRead = 0
      let avgScore = 0
      let storiesRead = 0

      // 1. Get total words read from reading_sessions (note: plural table name)
      try {
        const { data: readingSessions, error: readingError } = await supabase
          .from('reading_sessions')
          .select('words_read')
          .eq('user_id', userId)

        if (!readingError && readingSessions) {
          wordsRead = readingSessions.reduce((total, session) => total + (session.words_read || 0), 0)
        } else if (readingError) {
          console.warn('Could not fetch reading sessions:', readingError.message)
        }
      } catch (error) {
        console.warn('Could not fetch reading sessions:', error.message)
      }

      // 2. Get completed tasks (stories) from user_progress
      try {
        const { data: userProgress, error: progressError } = await supabase
          .from('user_progress')
          .select('id')
          .eq('user_id', userId)
          .eq('completed', true)

        if (!progressError && userProgress) {
          storiesRead = userProgress.length || 0
          console.log(`  📚 Stories/tasks completed: ${storiesRead}`)
        } else if (progressError) {
          console.warn('Could not fetch completed tasks:', progressError.message)
        }
      } catch (error) {
        console.warn('Could not fetch completed tasks:', error.message)
      }

      // 3. Calculate average score as percentage from user_progress
      try {
        const { data: userProgress, error: progressError } = await supabase
          .from('user_progress')
          .select('score, max_score')
          .eq('user_id', userId)
          .not('score', 'is', null)
          .not('max_score', 'is', null)

        if (!progressError && userProgress && userProgress.length > 0) {
          // Filter valid scores with max_score > 0
          const validScores = userProgress.filter(p => p.max_score > 0)
          
          if (validScores.length > 0) {
            // Sum all earned scores vs sum of all possible scores
            const totalEarnedScore = validScores.reduce((sum, p) => sum + p.score, 0)
            const totalPossibleScore = validScores.reduce((sum, p) => sum + p.max_score, 0)
            
            if (totalPossibleScore > 0) {
              avgScore = Math.round((totalEarnedScore / totalPossibleScore) * 100)
            }
          }
        } else if (progressError) {
          console.warn('Could not fetch user progress scores:', progressError.message)
        }
      } catch (error) {
        console.warn('Could not fetch user progress scores:', error.message)
      }

      console.log(`📊 Profile stats for user ${userId}:`, { wordsRead, avgScore, storiesRead })

      return {
        success: true,
        data: {
          wordsRead,
          avgScore,
          storiesRead
        }
      }
    } catch (error) {
      console.error('Error fetching student profile stats:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get month-specific profile stats for a student
   * @param {string} userId - The user ID
   * @param {number} year - The year
   * @param {number} month - The month (1-12)
   * @param {string} filter - 'all' or 'assignments' to filter score calculation
   */
  static async getMonthlyProfileStats(userId, year, month, filter = 'all') {
    try {
      // Validate inputs
      if (!userId) {
        throw new Error('User ID is required')
      }
      if (!year || !month) {
        throw new Error('Year and month are required')
      }

      // Calculate date range for the specified month
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59) // Last day of month

      console.log(`📅 Fetching stats for ${year}-${month} (${startDate.toISOString()} to ${endDate.toISOString()}) - Filter: ${filter}`)

      // Initialize stats
      let wordsRead = 0
      let avgScore = 0
      let storiesRead = 0

      // 1. Get words read for the month from reading_sessions
      try {
        const { data: readingSessions, error: readingError } = await supabase
          .from('reading_sessions')
          .select('words_read, session_date')
          .eq('user_id', userId)
          .gte('session_date', startDate.toISOString())
          .lte('session_date', endDate.toISOString())

        if (!readingError && readingSessions) {
          wordsRead = readingSessions.reduce((total, session) => total + (session.words_read || 0), 0)
          console.log(`  📖 Words read in month: ${wordsRead} (${readingSessions.length} sessions)`)
        } else if (readingError) {
          console.warn('Could not fetch monthly reading sessions:', readingError.message)
        }
      } catch (error) {
        console.warn('Could not fetch monthly reading sessions:', error.message)
      }

      // 2. Get completed tasks for the month from user_progress
      try {
        let query = supabase
          .from('user_progress')
          .select('score, max_score, completed_at, activity_type')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('completed_at', startDate.toISOString())
          .lte('completed_at', endDate.toISOString())
        
        // Apply filter if 'assignments' - exclude self-learning activities
        if (filter === 'assignments') {
          // Assuming 'assignment' or 'teacher_task' activity types are for assignments
          // Adjust these types based on your actual data structure
          query = query.in('activity_type', ['assignment', 'teacher_task', 'story_assignment'])
        }

        const { data: userProgress, error: progressError } = await query

        if (!progressError && userProgress) {
          storiesRead = userProgress.length
          
          // Calculate average score as percentage of max_score for the month
          if (userProgress.length > 0) {
            const validScores = userProgress.filter(p => 
              p.score !== null && 
              p.score !== undefined && 
              p.max_score !== null && 
              p.max_score !== undefined && 
              p.max_score > 0
            )
            
            if (validScores.length > 0) {
              // Sum all earned scores vs sum of all possible scores
              const totalEarnedScore = validScores.reduce((sum, p) => sum + p.score, 0)
              const totalPossibleScore = validScores.reduce((sum, p) => sum + p.max_score, 0)
              
              if (totalPossibleScore > 0) {
                avgScore = Math.round((totalEarnedScore / totalPossibleScore) * 100)
              }
            }
          }
          
          console.log(`  📚 Stories completed in month: ${storiesRead}`)
          console.log(`  📊 Average score in month: ${avgScore}%`)
        } else if (progressError) {
          console.warn('Could not fetch monthly user progress:', progressError.message)
        }
      } catch (error) {
        console.warn('Could not fetch monthly user progress:', error.message)
      }

      const hasData = wordsRead > 0 || avgScore > 0 || storiesRead > 0

      console.log(`📊 Monthly stats for ${year}-${month}:`, { wordsRead, avgScore, storiesRead, hasData })

      return {
        success: true,
        data: {
          wordsRead,
          avgScore,
          storiesRead,
          hasData
        }
      }
    } catch (error) {
      console.error('Error fetching monthly profile stats:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update user statistics
   */
  static async updateUserStats(studentId, activityData) {
    try {
      // Get existing user stats
      const { data: existingStats, error: getError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', studentId)
        .maybeSingle()

      if (getError) throw getError

      const now = new Date().toISOString()
      const statsUpdate = {
        last_activity: now,
        updated_at: now
      }

      // Calculate streak (simplified logic)
      if (existingStats) {
        const lastActivity = new Date(existingStats.last_activity)
        const today = new Date()
        const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          // Consecutive day - increment streak
          statsUpdate.streak_days = (existingStats.streak_days || 0) + 1
        } else if (diffDays > 1) {
          // Streak broken - reset to 1
          statsUpdate.streak_days = 1
        }
        // Same day - keep current streak (don't change streak_days)
        else {
          statsUpdate.streak_days = existingStats.streak_days || 1
        }
      } else {
        // First activity
        statsUpdate.streak_days = 1
        statsUpdate.current_reading_level = 1
      }

      let data, error
      
      if (existingStats) {
        // Update existing record
        const result = await supabase
          .from('user_stats')
          .update(statsUpdate)
          .eq('user_id', studentId)
          .select()
          .single()
        
        data = result.data
        error = result.error
      } else {
        // Create new record
        const result = await supabase
          .from('user_stats')
          .insert({
            user_id: studentId,
            ...statsUpdate
          })
          .select()
          .single()
        
        data = result.data
        error = result.error
      }

      if (error) throw error

      // Record activity in user_progress
      if (activityData.activity) {
        await supabase
          .from('user_progress')
          .insert({
            user_id: studentId,
            activity_type: activityData.activity,
            activity_id: activityData.activityId,
            completed: activityData.completed || true,
            score: activityData.score,
            max_score: activityData.maxScore,
            time_spent: activityData.timeSpent,
            attempts: activityData.attempts || 1,
            completed_at: activityData.completed ? now : null
          })
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error updating user stats:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // NOTIFICATIONS & ANNOUNCEMENTS
  // ============================================================================

  /**
   * Get student notifications
   */
  static async getStudentNotifications(studentId, unreadOnly = false) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', studentId)
        .order('created_at', { ascending: false })

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching student notifications:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get classroom announcements for student
   */
  static async getStudentAnnouncements(studentId, classroomId = null) {
    try {
      console.log('📢 Fetching student announcements:', { studentId, classroomId });
      
      // Get student's classrooms
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('classroom_students')
        .select('classroom_id')
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (enrollmentError) throw enrollmentError;

      const classroomIds = enrollments.map(e => e.classroom_id);

      if (classroomIds.length === 0) {
        return { success: true, data: [] };
      }

      let query = supabase
        .from('announcements')
        .select(`
          *,
          classroom:classroom_id (
            id,
            name,
            teacher:teacher_id (
              id,
              full_name,
              avatar_url
            )
          ),
          announcement_recipients!left (
            user_id,
            is_read,
            read_at
          )
        `)
        .in('classroom_id', classroomIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (classroomId) {
        query = query.eq('classroom_id', classroomId);
      }

      const { data: allAnnouncements, error } = await query;

      if (error) throw error;

      // Filter announcements based on visibility:
      // 1. Class-wide announcements (is_class_wide = true)
      // 2. Selective announcements where student is a recipient
      const filteredAnnouncements = allAnnouncements.filter(announcement => {
        if (announcement.is_class_wide) {
          return true; // Show all class-wide announcements
        } else {
          // Check if student is in recipients list
          return announcement.announcement_recipients.some(recipient => 
            recipient.user_id === studentId
          );
        }
      });

      // Add read status for each announcement
      const announcementsWithReadStatus = filteredAnnouncements.map(announcement => {
        const recipient = announcement.announcement_recipients.find(r => r.user_id === studentId);
        return {
          ...announcement,
          is_read: recipient?.is_read || false,
          read_at: recipient?.read_at || null
        };
      });

      console.log(`✅ Fetched ${announcementsWithReadStatus.length} announcements for student`);
      return { success: true, data: announcementsWithReadStatus };
    } catch (error) {
      console.error('❌ Error fetching student announcements:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark announcement as read for student
   */
  static async markAnnouncementRead(announcementId, studentId) {
    try {
      console.log('👁️ Marking announcement as read:', { announcementId, studentId });
      
      // Check if there's already a recipient record
      const { data: existingRecipient, error: checkError } = await supabase
        .from('announcement_recipients')
        .select('id, is_read')
        .eq('announcement_id', announcementId)
        .eq('user_id', studentId)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no record exists

      if (checkError) {
        console.error('❌ Error checking existing recipient:', checkError);
        // If RLS is blocking, try to create the record directly
        if (checkError.code === '42501' || checkError.message.includes('406') || checkError.message.includes('RLS')) {
          console.log('🔓 RLS blocking query, attempting direct insert...');
        } else {
          throw checkError;
        }
      }

      if (existingRecipient && !checkError) {
        // Update existing record
        console.log('📝 Updating existing recipient record:', existingRecipient.id);
        const { error: updateError } = await supabase
          .from('announcement_recipients')
          .update({
            is_read: true,
            read_at: new Date().toISOString()
          })
          .eq('id', existingRecipient.id);

        if (updateError) {
          console.error('❌ Error updating recipient:', updateError);
          throw updateError;
        }
      } else {
        // Create new recipient record (for class-wide announcements or when query was blocked)
        console.log('➕ Creating new recipient record...');
        const { error: insertError } = await supabase
          .from('announcement_recipients')
          .insert({
            announcement_id: announcementId,
            user_id: studentId,
            is_read: true,
            read_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Error inserting recipient:', insertError);
          // If insert fails, it might mean the record already exists or RLS is blocking
          // Try an upsert approach
          if (insertError.code === '23505') { // Unique constraint violation
            console.log('🔄 Record exists, trying upsert...');
            const { error: upsertError } = await supabase
              .from('announcement_recipients')
              .upsert({
                announcement_id: announcementId,
                user_id: studentId,
                is_read: true,
                read_at: new Date().toISOString()
              });
            
            if (upsertError) throw upsertError;
          } else {
            throw insertError;
          }
        }
      }

      console.log('✅ Announcement marked as read');
      return { success: true };
    } catch (error) {
      console.error('❌ Error marking announcement as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationRead(notificationId, studentId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('recipient_id', studentId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // STUDENT PROFILE
  // ============================================================================

  /**
   * Get student profile with extended information
   */
  static async getStudentProfile(studentId) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .eq('user_type', 'student')
        .single()

      if (profileError) throw profileError

      // Get progress summary
      const progressResult = await this.getStudentProgress(studentId)
      const progress = progressResult.success ? progressResult.data : null

      return {
        success: true,
        data: {
          ...profile,
          progress
        }
      }
    } catch (error) {
      console.error('Error fetching student profile:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update student profile
   */
  static async updateStudentProfile(studentId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .eq('user_type', 'student')
        .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error updating student profile:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // TEST TAKING & PROGRESS TRACKING
  // ============================================================================

  /**
   * Get test content for a specific assignment
   */
  static async getTestContent(assignmentId, studentId) {
    try {
      console.log('🔍 StudentService: Getting test content for assignment:', assignmentId, 'student:', studentId);
      
      // Get assignment with task details
      const { data: assignment, error: assignmentError } = await supabase
        .from('task_assignments')
        .select(`
          id,
          task:task_id (
            id,
            title,
            category,
            subcategory,
            instructions,
            test_content,
            test_settings,
            generation_mode,
            max_points
          ),
          student_task_progress (
            id,
            status,
            attempts,
            score
          )
        `)
        .eq('id', assignmentId)
        .eq('user_id', studentId)
        .single();

      console.log('📋 StudentService: Assignment query result:', { assignment, assignmentError });

      if (assignmentError) throw assignmentError;

      // Check if student's reading level is appropriate for this test
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('current_reading_level')
        .eq('user_id', studentId)
        .single();

      if (statsError) console.warn('Could not fetch user reading level:', statsError);

      const studentLevel = userStats?.current_reading_level || 1;
      const testCategory = assignment.task.category;

      // Validate reading level
      const levelRequirements = {
        'cvc': { min: 1, max: 4 },
        'phonics-merger': { min: 2, max: 4 },
        'blending': { min: 3, max: 4 },
        'silent-words': { min: 4, max: 4 },
        'comprehensive': { min: 1, max: 4 }
      };

      const requirements = levelRequirements[testCategory];
      if (requirements && (studentLevel < requirements.min || studentLevel > requirements.max)) {
        return {
          success: false,
          error: `This test requires reading level ${requirements.min}-${requirements.max}. Your current level is ${studentLevel}.`
        };
      }

      // Generate test questions based on test content
      let testQuestions = [];
      
      if (assignment.task.generation_mode === 'manual' && assignment.task.test_content) {
        testQuestions = this.generateQuestionsFromContent(assignment.task.test_content, testCategory);
      } else {
        // Auto-generate questions based on category and student level
        testQuestions = await this.generateAutoQuestions(testCategory, studentLevel, assignment.task.test_settings);
      }

      return {
        success: true,
        data: {
          assignment,
          testQuestions,
          studentLevel,
          canTakeTest: true
        }
      };
    } catch (error) {
      console.error('Error getting test content:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate questions from manual test content
   */
  static generateQuestionsFromContent(testContent, category) {
    const questions = [];

    switch (category) {
      case 'cvc':
        if (testContent.words && Array.isArray(testContent.words)) {
          testContent.words.forEach((word, index) => {
            questions.push({
              id: index + 1,
              type: 'cvc',
              word: word.trim().toLowerCase(),
              question: `Read the word: ${word.toUpperCase()}`,
              correctAnswer: word.trim().toLowerCase(),
              options: this.generateCVCOptions(word.trim().toLowerCase())
            });
          });
        }
        break;

      case 'phonics-merger':
        if (testContent.sounds && testContent.examples) {
          const sounds = testContent.sounds.split(',').map(s => s.trim());
          const examples = testContent.examples.split(',').map(s => s.trim());
          
          sounds.forEach((sound, index) => {
            const example = examples[index] || examples[0];
            questions.push({
              id: index + 1,
              type: 'phonics',
              sound: sound,
              example: example,
              question: `What sound does "${sound}" make?`,
              correctAnswer: sound,
              audioRequired: true
            });
          });
        }
        break;

      case 'blending':
        if (testContent.segments) {
          const segments = testContent.segments.split(',').map(s => s.trim());
          segments.forEach((segment, index) => {
            questions.push({
              id: index + 1,
              type: 'blending',
              segments: segment.split('-'),
              question: `Blend these sounds together: ${segment}`,
              correctAnswer: segment.replace(/-/g, ''),
              difficulty: testContent.difficulty || 'medium'
            });
          });
        }
        break;

      case 'silent-words':
        if (testContent.words) {
          const words = testContent.words.split(',').map(s => s.trim());
          words.forEach((word, index) => {
            questions.push({
              id: index + 1,
              type: 'silent',
              word: word,
              question: `Read this word silently: ${word}`,
              correctAnswer: word.toLowerCase(),
              type: testContent.type || 'reading'
            });
          });
        }
        break;
    }

    return questions;
  }

  /**
   * Auto-generate questions based on category and level
   */
  static async generateAutoQuestions(category, level, settings) {
    try {
      const questionCount = settings?.questionCount || 10;
      let questions = [];

      switch (category) {
        case 'cvc':
          // Get CVC words from database based on difficulty
          const { data: cvcWords, error: cvcError } = await supabase
            .from('Words')
            .select('word')
            .eq('category', 'cvc')
            .lte('difficulty_level', level)
            .limit(questionCount);

          if (!cvcError && cvcWords) {
            questions = cvcWords.map((item, index) => ({
              id: index + 1,
              type: 'cvc',
              word: item.word.toLowerCase(),
              question: `Read the word: ${item.word.toUpperCase()}`,
              correctAnswer: item.word.toLowerCase(),
              options: this.generateCVCOptions(item.word.toLowerCase())
            }));
          }
          break;

        case 'phonics-merger':
          // Generate phonics questions based on level
          const phonicsBank = {
            2: ['/a/', '/e/', '/i/', '/o/', '/u/'],
            3: ['/ch/', '/sh/', '/th/', '/ph/', '/ck/'],
            4: ['/ight/', '/ough/', '/eigh/', '/augh/']
          };
          
          const sounds = phonicsBank[level] || phonicsBank[2];
          questions = sounds.slice(0, questionCount).map((sound, index) => ({
            id: index + 1,
            type: 'phonics',
            sound: sound,
            question: `What sound does "${sound}" make?`,
            correctAnswer: sound,
            audioRequired: true
          }));
          break;

        default:
          // Fallback to basic questions
          questions = Array.from({ length: questionCount }, (_, index) => ({
            id: index + 1,
            type: 'basic',
            question: `Question ${index + 1}`,
            correctAnswer: 'answer'
          }));
      }

      return questions;
    } catch (error) {
      console.error('Error generating auto questions:', error);
      return [];
    }
  }

  /**
   * Generate multiple choice options for CVC words
   */
  static generateCVCOptions(correctWord) {
    const distractors = ['cat', 'bat', 'rat', 'hat', 'mat', 'sat', 'fat', 'pat'];
    const options = [correctWord];
    
    // Add 3 random distractors that are different from correct answer
    const availableOptions = distractors.filter(word => word !== correctWord);
    while (options.length < 4 && availableOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableOptions.length);
      options.push(availableOptions.splice(randomIndex, 1)[0]);
    }

    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  }

  /**
   * Start a test attempt
   */
  static async startTest(assignmentId, studentId) {
    try {
      // Check if there's already a progress record
      const { data: existingProgress, error: checkError } = await supabase
        .from('student_task_progress')
        .select('*')
        .eq('assignment_id', assignmentId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // Not found error is OK
        throw checkError;
      }

      if (existingProgress) {
        // Update existing progress to in_progress
        const { data, error } = await supabase
          .from('student_task_progress')
          .update({
            status: 'in_progress',
            attempts: (existingProgress.attempts || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } else {
        // Create new progress record
        const { data, error } = await supabase
          .from('student_task_progress')
          .insert({
            assignment_id: assignmentId,
            status: 'in_progress',
            attempts: 1
          })
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      }
    } catch (error) {
      console.error('Error starting test:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit test results - Updated for word-based scoring
   */
  static async submitTest(assignmentId, studentId, testResults) {
    try {
      console.log('📝 StudentService: Submitting test results for assignment:', assignmentId);
      
      const { score, maxScore, timeSpent, answers, accuracy, completedAt } = testResults;

      // First, check if a progress record exists
      const { data: existingProgress, error: checkError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('activity_type', 'assignment')
        .eq('activity_id', assignmentId)
        .eq('user_id', studentId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // Not found error is OK
        throw checkError;
      }

      let progressResult;

      if (existingProgress) {
        // Update existing progress record
        const { data, error } = await supabase
          .from('user_progress')
          .update({
            completed: true,
            score: score,
            max_score: maxScore,
            time_spent: timeSpent,
            completed_at: completedAt || new Date().toISOString()
          })
          .eq('id', existingProgress.id)
          .select()
          .single();

        if (error) throw error;
        progressResult = data;
      } else {
        // Create new progress record
        const { data, error } = await supabase
          .from('user_progress')
          .insert({
            user_id: studentId,
            activity_type: 'assignment',
            activity_id: assignmentId,
            completed: true,
            score: score,
            max_score: maxScore,
            time_spent: timeSpent,
            attempts: 1,
            completed_at: completedAt || new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        progressResult = data;
      }

      console.log('✅ StudentService: Test submitted successfully');
      
      // Get classroom info for navigation
      const { data: assignment } = await supabase
        .from('task_assignments')
        .select(`
          task:teacher_tasks (
            classroom_id
          )
        `)
        .eq('id', assignmentId)
        .single();

      return { 
        success: true, 
        data: {
          ...progressResult,
          classroomId: assignment?.task?.classroom_id
        }
      };
    } catch (error) {
      console.error('❌ StudentService: Error submitting test:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user statistics after test completion
   */

  /**
   * Get total counts of words and stories available in the system
   */
  static async getTotalCounts() {
    try {
      // Get total words count
      const { count: totalWords, error: wordsError } = await supabase
        .from('Words')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (wordsError) {
        console.warn('Could not fetch total words count:', wordsError.message);
      }

      // Get total stories count
      const { count: totalStories, error: storiesError } = await supabase
        .from('Short_Stories')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (storiesError) {
        console.warn('Could not fetch total stories count:', storiesError.message);
      }

      console.log(`📊 Total available: ${totalWords || 0} words, ${totalStories || 0} stories`);

      return {
        success: true,
        data: {
          totalWords: totalWords || 0,
          totalStories: totalStories || 0
        }
      };
    } catch (error) {
      console.error('Error fetching total counts:', error);
      return { 
        success: false, 
        error: error.message,
        data: { totalWords: 0, totalStories: 0 }
      };
    }
  }
}

export { StudentService }
export default StudentService