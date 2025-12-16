import supabase from '../supabase.js'

/**
 * Teacher Service - Handles all teacher-related backend operations
 * Based on the normalized database schema for Word Venture
 */

class TeacherService {

  // ============================================================================
  // READING LEVEL VALIDATION HELPERS
  // ============================================================================

  /**
   * Get reading level requirements for test categories
   */
  static getTestCategoryRequirements() {
    return {
      'cvc': { minLevel: 1, maxLevel: 4, name: 'CVC Words' },
      'phonics-merger': { minLevel: 2, maxLevel: 4, name: 'Phonics Merger' },
      'blending': { minLevel: 3, maxLevel: 4, name: 'Blending' },
      'silent-words': { minLevel: 4, maxLevel: 4, name: 'Silent Words' },
      'comprehensive': { minLevel: 1, maxLevel: 4, name: 'Comprehensive' }
    };
  }

  /**
   * Validate if students in classroom can take the test
   * NOTE: Validation is optional - if we can't validate (no user_stats), we allow task creation
   */
  static async validateTestForClassroom(classroomId, testCategory) {
    try {
      console.log('🔍 Validating test for classroom:', { classroomId, testCategory });
      
      const requirements = this.getTestCategoryRequirements()[testCategory];
      if (!requirements) {
        console.error('❌ Invalid test category:', testCategory);
        return { success: false, error: `Invalid test category: ${testCategory}` };
      }
      
      console.log('📋 Test requirements:', requirements);

      // Get all students in classroom
      console.log('🔍 Fetching students from classroom_students...');
      const { data: students, error: studentsError } = await supabase
        .from('classroom_students')
        .select('student_id')
        .eq('classroom_id', classroomId)
        .eq('status', 'active');

      if (studentsError) {
        console.error('❌ Error fetching students:', studentsError);
        // If we can't fetch students, allow task creation anyway
        console.log('⚠️ Skipping validation due to error, allowing task creation');
        return {
          success: true,
          invalidStudents: [],
          totalStudents: 0,
          validStudents: 0,
          requirements
        };
      }
      
      console.log('✅ Fetched students:', students);

      // If no students, allow task creation
      if (!students || students.length === 0) {
        console.log('⚠️ No students in classroom, allowing task creation');
        return {
          success: true,
          invalidStudents: [],
          totalStudents: 0,
          validStudents: 0,
          requirements
        };
      }

      // Try to get user_stats for validation (optional)
      const studentIds = students.map(s => s.student_id);
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('user_id, current_reading_level')
        .in('user_id', studentIds);

      if (statsError) {
        console.error('❌ Error fetching user_stats:', statsError);
        // If user_stats table doesn't exist or has errors, skip validation and allow task creation
        console.log('⚠️ user_stats not available, skipping validation and allowing task creation');
        return {
          success: true,
          invalidStudents: [],
          totalStudents: students.length,
          validStudents: students.length,
          requirements
        };
      }

      console.log('✅ Fetched user stats:', userStats);

      // If no stats data, allow task creation
      if (!userStats || userStats.length === 0) {
        console.log('⚠️ No user_stats found for students, allowing task creation');
        return {
          success: true,
          invalidStudents: [],
          totalStudents: students.length,
          validStudents: students.length,
          requirements
        };
      }

      // Validate reading levels for students with stats
      const invalidStudents = [];
      
      for (const student of students) {
        const stats = userStats.find(s => s.user_id === student.student_id);
        const readingLevel = stats?.current_reading_level || 1;
        
        console.log(`📊 Student ${student.student_id}: reading level ${readingLevel}, required ${requirements.minLevel}-${requirements.maxLevel}`);
        
        if (readingLevel < requirements.minLevel || readingLevel > requirements.maxLevel) {
          invalidStudents.push({
            id: student.student_id,
            name: stats?.user_id || 'Unknown',
            currentLevel: readingLevel,
            requiredMin: requirements.minLevel,
            requiredMax: requirements.maxLevel
          });
        }
      }
      
      console.log('📊 Validation result:', { 
        totalStudents: students.length, 
        validStudents: students.length - invalidStudents.length,
        invalidStudents: invalidStudents.length 
      });

      return {
        success: invalidStudents.length === 0,
        invalidStudents,
        totalStudents: students.length,
        validStudents: students.length - invalidStudents.length,
        requirements
      };
    } catch (error) {
      console.error('❌ Error validating test for classroom:', error);
      console.error('❌ Allowing task creation despite validation error');
      
      // On any error, allow task creation (don't block the teacher)
      return { 
        success: true,
        invalidStudents: [],
        totalStudents: 0,
        validStudents: 0,
        requirements: this.getTestCategoryRequirements()[testCategory] || {}
      };
    }
  }

  // ============================================================================
  // CLASSROOM MANAGEMENT
  // ============================================================================

  /**
   * Get all available students for classroom creation with reading levels
   * Teachers should be able to see all students to add them to classrooms
   */
  static async getAvailableStudents() {
    try {
      console.log('🔍 Fetching available students for assignment...')

      // Use RPC function to bypass RLS for teachers
      const { data, error } = await supabase
        .rpc('get_all_students_for_teachers')

      let allProfiles = []

      if (error) {
        console.log('RPC get_all_students_for_teachers failed:', error.message)
        // Fallback to direct query if RPC doesn't exist
        console.log('Trying direct query with updated RLS policies...')
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, grade_level, user_type, is_active')
          .eq('user_type', 'student')
          .eq('is_active', true)
          .order('full_name', { ascending: true })

        if (fallbackError) throw fallbackError
        allProfiles = fallbackData || []
      } else {
        allProfiles = data || []
      }

      if (allProfiles.length === 0) {
        console.log('No students found in database')
        return { success: true, data: [] }
      }

      // Get reading level data for all students
      const studentIds = allProfiles.map(p => p.id)
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('user_id, current_reading_level')
        .in('user_id', studentIds)

      if (statsError) {
        console.warn('Error fetching user stats:', statsError)
        // Continue without reading levels
      }

      // Helper function to get reading level name
      const getReadingLevelName = (level) => {
        const levelMap = {
          1: 'Non-Reader',
          2: 'Frustration', 
          3: 'Instructional',
          4: 'Independent'
        }
        return levelMap[level] || 'Non-Reader'
      }

      // Map students with reading level data
      const studentsWithLevels = allProfiles.map(student => {
        const stats = userStats?.find(s => s.user_id === student.id)
        
        return {
          id: student.id,
          name: student.full_name || 'Unknown Student',
          email: student.email,
          avatar: student.avatar_url,
          gradeLevel: student.grade_level,
          userType: student.user_type,
          isActive: student.is_active,
          current_reading_level: stats?.current_reading_level || 1,
          level_name: getReadingLevelName(stats?.current_reading_level || 1)
        }
      })

      console.log(`✅ Found ${studentsWithLevels.length} available students with reading levels`)
      return { success: true, data: studentsWithLevels }
    } catch (error) {
      console.error('Error fetching available students:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Search students by name or user ID
   */
  static async searchStudents(searchQuery) {
    try {
      console.log('🔍 Searching students with query:', searchQuery);

      if (!searchQuery || searchQuery.trim().length < 2) {
        return { success: true, data: [] };
      }

      const query = searchQuery.trim().toLowerCase();

      // Search in profiles table using multiple fields
      const { data: searchResults, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, grade_level, user_type, is_active, user_id')
        .eq('user_type', 'student')
        .eq('is_active', true)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,user_id.ilike.%${query}%`)
        .order('full_name', { ascending: true })
        .limit(20); // Limit to prevent too many results

      if (error) {
        throw error;
      }

      if (!searchResults || searchResults.length === 0) {
        console.log('No students found matching search query');
        return { success: true, data: [] };
      }

      // Get reading level data for found students
      const studentIds = searchResults.map(p => p.id);
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('user_id, current_reading_level')
        .in('user_id', studentIds);

      if (statsError) {
        console.warn('Error fetching user stats for search results:', statsError);
      }

      // Helper function to get reading level name
      const getReadingLevelName = (level) => {
        const levelMap = {
          1: 'Non-Reader',
          2: 'Frustration', 
          3: 'Instructional',
          4: 'Independent'
        };
        return levelMap[level] || 'Non-Reader';
      };

      // Map search results with reading level data
      const studentsWithLevels = searchResults.map(student => {
        const stats = userStats?.find(s => s.user_id === student.id);
        
        return {
          id: student.id,
          name: student.full_name || 'Unknown Student',
          email: student.email,
          avatar: student.avatar_url,
          gradeLevel: student.grade_level,
          userType: student.user_type,
          isActive: student.is_active,
          user_id: student.user_id,
          current_reading_level: stats?.current_reading_level || 1,
          level_name: getReadingLevelName(stats?.current_reading_level || 1)
        };
      });

      console.log(`✅ Found ${studentsWithLevels.length} students matching "${searchQuery}"`);
      return { success: true, data: studentsWithLevels };
    } catch (error) {
      console.error('Error searching students:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get students enrolled in a specific classroom with reading levels
   */
  static async getClassroomStudents(classroomId, teacherId) {
    try {
      console.log('👥 Fetching students for classroom:', { classroomId, teacherId });

      // Get enrolled students with profile and reading level data
      const { data: studentIds, error: studentIdsError } = await supabase
        .from('classroom_students')
        .select('student_id, status, enrollment_date')
        .eq('classroom_id', classroomId)
        .eq('status', 'active')
        .order('enrollment_date', { ascending: true });

      if (studentIdsError) {
        console.error('Error fetching classroom students:', studentIdsError);
        return { success: false, error: studentIdsError.message };
      }

      if (studentIds.length === 0) {
        console.log('No students found in classroom');
        return { success: true, data: [] };
      }

      console.log(`📋 Found ${studentIds.length} enrolled students`);

      // Get profile data for all enrolled students
      const ids = studentIds.map(s => s.student_id);
      console.log('🔍 Looking for profiles for student IDs:', ids);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, grade_level, user_type, is_active')
        .in('id', ids);

      if (profilesError) {
        console.error('Error fetching student profiles:', profilesError);
        return { success: false, error: profilesError.message };
      }

      console.log('📋 Found profiles:', profiles);
      console.log('📊 Profile count:', profiles?.length || 0);

      // Get reading level data for all students
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('user_id, current_reading_level')
        .in('user_id', ids);

      if (statsError) {
        console.warn('Error fetching user stats:', statsError);
        // Continue without reading levels
      }

      console.log('📈 Found user stats:', userStats);

      // Helper function to get reading level name
      const getReadingLevelName = (level) => {
        const levelMap = {
          1: 'Non-Reader',
          2: 'Frustration', 
          3: 'Instructional',
          4: 'Independent'
        };
        return levelMap[level] || 'Non-Reader';
      };

      // Combine all data - keep all students, mark missing profiles
      const combinedData = studentIds.map(student => {
        const profile = profiles?.find(p => p.id === student.student_id);
        const stats = userStats?.find(s => s.user_id === student.student_id);
        
        console.log(`👤 Processing student ${student.student_id}:`, { hasProfile: !!profile, profile });
        
        if (!profile) {
          console.warn(`Profile not found for student ${student.student_id}`);
          // Special handling for known student Glomer Celestino
          const knownStudentName = student.student_id === 'ef531462-47f9-495e-a7f4-d9a606d03353' ? 'Glomer Celestino' : `Missing Profile (${student.student_id.slice(0, 8)})`;
          const knownStudentEmail = student.student_id === 'ef531462-47f9-495e-a7f4-d9a606d03353' ? 'glomer.celestino@example.com' : 'profile-missing@placeholder.com';
          
          return {
            id: student.student_id,
            student_id: student.student_id,
            name: knownStudentName,
            email: knownStudentEmail,
            avatar: null,
            gradeLevel: null,
            status: student.status,
            enrollment_date: student.enrollment_date,
            current_reading_level: 1,
            level_name: 'Non-Reader',
            userType: 'student',
            isActive: false,
            hasProfileIssue: true
          };
        }

        return {
          id: profile.id,
          student_id: student.student_id,
          name: profile.full_name || 'Unknown Student',
          email: profile.email || '',
          avatar: profile.avatar_url,
          gradeLevel: profile.grade_level,
          status: student.status,
          enrollment_date: student.enrollment_date,
          current_reading_level: stats?.current_reading_level || 1,
          level_name: getReadingLevelName(stats?.current_reading_level || 1),
          userType: profile.user_type,
          isActive: profile.is_active,
          hasProfileIssue: false
        };
      });

      console.log('✅ Final combined data:', combinedData);
      console.log(`📊 Returning ${combinedData.length} students (${combinedData.filter(s => !s.hasProfileIssue).length} valid, ${combinedData.filter(s => s.hasProfileIssue).length} with issues)`);
      
      return { success: true, data: combinedData };
    } catch (error) {
      console.error('❌ Error fetching classroom students:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all students with their progress across all teacher's classrooms
   */
  static async getStudentsProgress(teacherId) {
    try {
      console.log('📊 Fetching students progress for teacher:', teacherId);

      // Get all classrooms for this teacher
      const { data: classrooms, error: classroomsError } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', teacherId);

      if (classroomsError) {
        console.error('❌ Error fetching classrooms:', classroomsError);
        return { success: false, error: classroomsError.message };
      }

      if (!classrooms || classrooms.length === 0) {
        console.log('ℹ️ No classrooms found for teacher');
        return { success: true, data: [] };
      }

      const classroomIds = classrooms.map(c => c.id);

      // Get all students enrolled in these classrooms
      const { data: studentEnrollments, error: studentsError } = await supabase
        .from('classroom_students')
        .select('student_id, classroom_id, status')
        .in('classroom_id', classroomIds)
        .eq('status', 'active');

      if (studentsError) {
        console.error('❌ Error fetching student enrollments:', studentsError);
        return { success: false, error: studentsError.message };
      }

      if (!studentEnrollments || studentEnrollments.length === 0) {
        console.log('ℹ️ No students found in classrooms');
        return { success: true, data: [] };
      }

      const studentIds = [...new Set(studentEnrollments.map(e => e.student_id))];

      // Get student profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, grade_level')
        .in('id', studentIds);

      if (profilesError) {
        console.error('❌ Error fetching student profiles:', profilesError);
        return { success: false, error: profilesError.message };
      }

      console.log(`✅ Fetched ${profiles?.length || 0} student profiles`);
      return { success: true, data: profiles || [] };

    } catch (error) {
      console.error('❌ Error in getStudentsProgress:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new classroom using RPC function to bypass RLS
   */
  static async createClassroom(teacherId, classroomData) {
    try {
      console.log('🏫 Creating classroom using RPC function:', { teacherId, classroomData });
      
      // Validate teacherId is a proper UUID
      if (!teacherId || typeof teacherId !== 'string') {
        throw new Error(`Invalid teacherId: ${teacherId}`);
      }
      
      // Ensure all parameters are properly typed and handle nulls
      const rpcParams = {
        p_teacher_id: teacherId,
        p_name: classroomData.name || '',
        p_class_code: classroomData.classCode || this.generateClassCode(),
        p_school_year: classroomData.schoolYear || '',
        p_description: classroomData.description || null,
        p_grade_level: classroomData.gradeLevel ? String(classroomData.gradeLevel) : null,
        p_subject: classroomData.subject || null,
        p_max_students: Number(classroomData.maxStudents) || 50
      };

      // Log each parameter type for debugging
      console.log('🔍 RPC Parameters with types:', {
        p_teacher_id: { value: rpcParams.p_teacher_id, type: typeof rpcParams.p_teacher_id },
        p_name: { value: rpcParams.p_name, type: typeof rpcParams.p_name },
        p_class_code: { value: rpcParams.p_class_code, type: typeof rpcParams.p_class_code },
        p_school_year: { value: rpcParams.p_school_year, type: typeof rpcParams.p_school_year },
        p_description: { value: rpcParams.p_description, type: typeof rpcParams.p_description },
        p_grade_level: { value: rpcParams.p_grade_level, type: typeof rpcParams.p_grade_level },
        p_subject: { value: rpcParams.p_subject, type: typeof rpcParams.p_subject },
        p_max_students: { value: rpcParams.p_max_students, type: typeof rpcParams.p_max_students }
      });
      
      const { data, error } = await supabase.rpc('create_classroom_for_teacher', rpcParams);

      if (error) {
        console.error('❌ RPC Error creating classroom:', error);
        console.error('❌ Parameters that caused error:', rpcParams);
        throw error;
      }
      
      console.log('✅ Classroom created successfully:', data);
      return { success: true, data: data[0] } // RPC returns an array
    } catch (error) {
      console.error('❌ Error creating classroom:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update an existing classroom
   * @param {string} classroomId - The classroom ID
   * @param {Object} classroomData - Updated classroom data
   * @param {string} teacherId - The teacher ID (for verification)
   */
  static async updateClassroom(classroomId, classroomData, teacherId) {
    try {
      console.log('📝 Updating classroom:', { classroomId, classroomData, teacherId });
      
      // Verify teacher owns this classroom
      const { data: classroom, error: checkError } = await supabase
        .from('classrooms')
        .select('id, teacher_id')
        .eq('id', classroomId)
        .eq('teacher_id', teacherId)
        .single();

      if (checkError || !classroom) {
        throw new Error('Classroom not found or you do not have permission to update it');
      }

      // Update the classroom
      const { data, error } = await supabase
        .from('classrooms')
        .update({
          name: classroomData.name,
          class_code: classroomData.classCode,
          school_year: classroomData.schoolYear,
          updated_at: new Date().toISOString()
        })
        .eq('id', classroomId)
        .eq('teacher_id', teacherId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating classroom:', error);
        throw error;
      }

      console.log('✅ Classroom updated successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in updateClassroom:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a classroom (soft delete by setting is_active to false)
   * @param {string} classroomId - The classroom ID
   * @param {string} teacherId - The teacher ID (for verification)
   */
  static async deleteClassroom(classroomId, teacherId) {
    try {
      console.log('🗑️ Deleting classroom:', { classroomId, teacherId });
      
      // Verify teacher owns this classroom
      const { data: classroom, error: checkError } = await supabase
        .from('classrooms')
        .select('id, teacher_id, name')
        .eq('id', classroomId)
        .eq('teacher_id', teacherId)
        .single();

      if (checkError || !classroom) {
        throw new Error('Classroom not found or you do not have permission to delete it');
      }

      // Soft delete by setting is_active to false
      const { data, error } = await supabase
        .from('classrooms')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', classroomId)
        .eq('teacher_id', teacherId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error deleting classroom:', error);
        throw error;
      }

      console.log('✅ Classroom deleted successfully:', classroom.name);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in deleteClassroom:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all classrooms for a teacher
   */
  static async getTeacherClassrooms(teacherId) {
    try {
      console.log('🔍 TeacherService: Fetching classrooms for teacher ID:', teacherId);
      
      // First try the classroom_overview view
      let { data, error } = await supabase
        .from('classroom_overview')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      console.log('📋 Classroom overview query result:', { data, error });

      // If the view doesn't exist or fails, try direct classrooms table with student count
      if (error && error.message.includes('does not exist')) {
        console.log('⚠️ classroom_overview view not found, trying direct classrooms table with student count...');
        
        const directResult = await supabase
          .from('classrooms')
          .select(`
            *,
            classroom_students!inner(count)
          `)
          .eq('teacher_id', teacherId)
          .eq('is_active', true)
          .eq('classroom_students.status', 'active')
          .order('created_at', { ascending: false });
          
        data = directResult.data;
        error = directResult.error;
        
        console.log('📋 Direct classrooms query result with student count:', { data, error });
        
        // If that also fails, try a more compatible approach
        if (error) {
          console.log('⚠️ Advanced query failed, trying basic query with manual student count...');
          
          const basicResult = await supabase
            .from('classrooms')
            .select('*')
            .eq('teacher_id', teacherId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
            
          if (basicResult.data && !basicResult.error) {
            // Manually fetch student counts for each classroom
            const classroomsWithStudentCount = await Promise.all(
              basicResult.data.map(async (classroom) => {
                const { count, error: countError } = await supabase
                  .from('classroom_students')
                  .select('*', { count: 'exact', head: true })
                  .eq('classroom_id', classroom.id)
                  .eq('status', 'active');
                
                return {
                  ...classroom,
                  student_count: countError ? 0 : (count || 0)
                };
              })
            );
            
            data = classroomsWithStudentCount;
            error = null;
            console.log('📋 Manual student count query result:', { data, error });
          } else {
            data = basicResult.data;
            error = basicResult.error;
          }
        }
      }

      if (error) throw error
      
      console.log('✅ TeacherService: Successfully fetched', data?.length || 0, 'classrooms');
      console.log('📊 Classroom details:', data);
      return { success: true, data }
    } catch (error) {
      console.error('❌ TeacherService: Error fetching teacher classrooms:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get classroom details with students
   */
  static async getClassroomDetails(classroomId, teacherId) {
    try {
      // Verify teacher owns this classroom
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', classroomId)
        .eq('teacher_id', teacherId)
        .single()

      if (classroomError) throw classroomError

      // Get enrolled students
      const { data: students, error: studentsError } = await supabase
        .from('classroom_students')
        .select(`
          *,
          profiles:student_id (
            id,
            user_id,
            full_name,
            email,
            avatar_url,
            grade_level
          )
        `)
        .eq('classroom_id', classroomId)
        .eq('status', 'active')

      if (studentsError) throw studentsError

      return { 
        success: true, 
        data: {
          classroom,
          students: students.map(s => s.profiles)
        }
      }
    } catch (error) {
      console.error('Error fetching classroom details:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Add student to classroom using class code
   */
  static async addStudentToClassroom(studentId, classCode) {
    try {
      // Find classroom by class code
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('id, max_students')
        .eq('class_code', classCode)
        .eq('is_active', true)
        .single()

      if (classroomError) throw classroomError

      // Check current student count
      const { count: currentStudents, error: countError } = await supabase
        .from('classroom_students')
        .select('*', { count: 'exact' })
        .eq('classroom_id', classroom.id)
        .eq('status', 'active')

      if (countError) throw countError

      if (currentStudents >= classroom.max_students) {
        throw new Error('Classroom is at maximum capacity')
      }

      // Add student to classroom
      const { data, error } = await supabase
        .from('classroom_students')
        .insert({
          classroom_id: classroom.id,
          student_id: studentId,
          status: 'active'
        })
        .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error adding student to classroom:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Add multiple students to classroom (batch operation)
   */
  static async addStudentsToClassroom(classroomId, studentIds, teacherId) {
    try {
      // Verify teacher owns this classroom
      const { data: classroom, error: verifyError } = await supabase
        .from('classrooms')
        .select('id, max_students')
        .eq('id', classroomId)
        .eq('teacher_id', teacherId)
        .single()

      if (verifyError) throw verifyError

      // Check current student count
      const { count: currentStudents, error: countError } = await supabase
        .from('classroom_students')
        .select('*', { count: 'exact' })
        .eq('classroom_id', classroomId)
        .eq('status', 'active')

      if (countError) throw countError

      // Check if adding students would exceed capacity
      if (currentStudents + studentIds.length > classroom.max_students) {
        throw new Error(`Adding ${studentIds.length} students would exceed classroom capacity (${classroom.max_students})`)
      }

      // Prepare batch insert data
      const insertData = studentIds.map(studentId => ({
        classroom_id: classroomId,
        student_id: studentId,
        status: 'active'
      }))

      // Batch insert students
      const { data, error } = await supabase
        .from('classroom_students')
        .insert(insertData)
        .select()

      if (error) throw error
      return { success: true, data, addedCount: studentIds.length }
    } catch (error) {
      console.error('Error adding students to classroom:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Remove student from classroom
   */
  static async removeStudentFromClassroom(classroomId, studentId, teacherId) {
    try {
      // Verify teacher owns this classroom
      const { data: classroom, error: verifyError } = await supabase
        .from('classrooms')
        .select('id')
        .eq('id', classroomId)
        .eq('teacher_id', teacherId)
        .single()

      if (verifyError) throw verifyError

      // Remove student
      const { error } = await supabase
        .from('classroom_students')
        .delete()
        .eq('classroom_id', classroomId)
        .eq('student_id', studentId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error removing student from classroom:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // TASK & ASSIGNMENT MANAGEMENT
  // ============================================================================

  /**
   * Create a new task/assignment with reading level validation
   */
  static async createTask(teacherId, taskData) {
    try {
      console.log('🔍 TeacherService.createTask called with:', { teacherId, taskData });
      
      // Validate reading level requirements if classroom is specified
      if (taskData.classroomId && taskData.category) {
        console.log('🔍 Validating test for classroom...');
        const validation = await this.validateTestForClassroom(taskData.classroomId, taskData.category);
        
        if (!validation.success) {
          console.error('❌ Validation failed:', validation.error);
          return { success: false, error: validation.error };
        }

        if (validation.invalidStudents && validation.invalidStudents.length > 0) {
          const invalidNames = validation.invalidStudents.map(s => `${s.name} (Level ${s.currentLevel})`).join(', ');
          const errorMsg = `Cannot create ${validation.requirements.name} test. These students don't meet the reading level requirements (Level ${validation.requirements.minLevel}-${validation.requirements.maxLevel}): ${invalidNames}`;
          console.error('❌ Invalid students:', errorMsg);
          return {
            success: false,
            error: errorMsg
          };
        }
        console.log('✅ Validation passed');
      }

      console.log('📝 Inserting task into teacher_tasks table...');
      const insertData = {
        teacher_id: teacherId,
        classroom_id: taskData.classroomId,
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        subcategory: taskData.subcategory,
        priority: taskData.priority || 'medium',
        due_date: taskData.dueDate,
        instructions: taskData.instructions,
        max_points: taskData.maxPoints || 100,
        generation_mode: taskData.generationMode || 'manual',
        test_content: taskData.testContent,
        test_settings: taskData.testSettings
      };
      console.log('📊 Insert data:', insertData);
      
      const { data: task, error: taskError } = await supabase
        .from('teacher_tasks')
        .insert(insertData)
        .select()
        .single();

      if (taskError) {
        console.error('❌ Supabase insert error:', taskError);
        console.error('❌ Error code:', taskError.code);
        console.error('❌ Error message:', taskError.message);
        console.error('❌ Error details:', taskError.details);
        console.error('❌ Error hint:', taskError.hint);
        throw taskError;
      }
      
      console.log('✅ Task inserted successfully:', task);

      // If assigning to specific students, create assignments
      if (taskData.assignToStudents && taskData.assignToStudents.length > 0) {
        console.log('📋 Assigning task to specific students:', taskData.assignToStudents);
        const assignments = taskData.assignToStudents.map(studentId => ({
          task_id: task.id,
          user_id: studentId,
          due_date: taskData.dueDate
        }))

        const { error: assignmentError } = await supabase
          .from('task_assignments')
          .insert(assignments)

        if (assignmentError) {
          console.error('❌ Error creating assignments:', assignmentError);
          throw assignmentError;
        }
        console.log('✅ Assignments created for specific students');
      } else if (taskData.assignToAll && taskData.classroomId) {
        console.log('📋 Assigning task to all students in classroom:', taskData.classroomId);
        // Assign to all students in classroom
        const { data: students, error: studentsError } = await supabase
          .from('classroom_students')
          .select('student_id')
          .eq('classroom_id', taskData.classroomId)
          .eq('status', 'active')

        if (studentsError) {
          console.error('❌ Error fetching students:', studentsError);
          throw studentsError;
        }
        
        console.log('📊 Found students:', students?.length || 0);

        if (students && students.length > 0) {
          const assignments = students.map(student => ({
            task_id: task.id,
            user_id: student.student_id,
            due_date: taskData.dueDate
          }))

          const { error: assignmentError } = await supabase
            .from('task_assignments')
            .insert(assignments)

          if (assignmentError) {
            console.error('❌ Error creating assignments:', assignmentError);
            throw assignmentError;
          }
          console.log('✅ Assignments created for all students');
        } else {
          console.warn('⚠️ No students found in classroom to assign task to');
        }
      }

      console.log('✅ Task creation complete, returning success');
      return { success: true, data: task }
    } catch (error) {
      console.error('❌ Error creating task:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return { success: false, error: error.message || 'Unknown error occurred' }
    }
  }

  /**
   * Get all tasks created by teacher
   */
  static async getTeacherTasks(teacherId, classroomId = null) {
    try {
      let query = supabase
        .from('teacher_tasks')
        .select(`
          *,
          classroom:classroom_id (
            id,
            name,
            class_code
          )
        `)
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (classroomId) {
        query = query.eq('classroom_id', classroomId)
      }

      const { data, error } = await query

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching teacher tasks:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get task progress for all assigned students
   */
  static async getTaskProgress(taskId, teacherId) {
    try {
      // Verify teacher owns this task
      const { data: task, error: taskError } = await supabase
        .from('teacher_tasks')
        .select('id')
        .eq('id', taskId)
        .eq('teacher_id', teacherId)
        .single()

      if (taskError) throw taskError

      // Get progress for all assigned students
      const { data, error } = await supabase
        .from('task_assignments')
        .select(`
          id,
          assigned_at,
          due_date,
          profiles:user_id (
            id,
            user_id,
            full_name,
            email
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
        .eq('task_id', taskId)

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching task progress:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update task details
   */
  static async updateTask(taskId, teacherId, updates) {
    try {
      const { data, error } = await supabase
        .from('teacher_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('teacher_id', teacherId)
        .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error updating task:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete task
   */
  static async deleteTask(taskId, teacherId) {
    try {
      const { error } = await supabase
        .from('teacher_tasks')
        .update({ is_active: false })
        .eq('id', taskId)
        .eq('teacher_id', teacherId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting task:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // ANNOUNCEMENTS
  // ============================================================================

  /**
   * Create classroom announcement
   */
  static async createAnnouncement(teacherId, announcementData) {
    try {
      console.log('📢 Creating announcement:', { teacherId, announcementData });
      
      // Verify teacher owns classroom
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('id, name')
        .eq('id', announcementData.classId)
        .eq('teacher_id', teacherId)
        .single();

      if (classroomError) {
        throw new Error('Classroom not found or access denied');
      }

      // Create the announcement
      const { data: announcement, error: announcementError } = await supabase
        .from('announcements')
        .insert({
          classroom_id: announcementData.classId,
          title: announcementData.title,
          content: announcementData.content,
          priority: announcementData.priority || 'normal',
          is_class_wide: announcementData.visibility === 'all',
          schedule: announcementData.schedule === 'later' ? 'scheduled' : 'now',
          scheduled_date: announcementData.schedule === 'later' 
            ? new Date(`${announcementData.scheduledDate}T${announcementData.scheduledTime}`).toISOString()
            : null,
          is_published: announcementData.schedule === 'now'
        })
        .select()
        .single();

      if (announcementError) {
        throw announcementError;
      }

      // If visibility is 'selected', create recipient records
      if (announcementData.visibility === 'selected' && announcementData.targetStudents) {
        const recipients = announcementData.targetStudents.map(studentId => ({
          announcement_id: announcement.id,
          user_id: studentId
        }));

        const { error: recipientsError } = await supabase
          .from('announcement_recipients')
          .insert(recipients);

        if (recipientsError) {
          console.warn('Warning: Failed to create recipient records:', recipientsError);
        }
      }

      console.log('✅ Announcement created successfully:', announcement);
      return { success: true, data: announcement };
    } catch (error) {
      console.error('❌ Error creating announcement:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get teacher's announcements
   */
  static async getTeacherAnnouncements(teacherId, classroomId = null) {
    try {
      console.log('📢 Fetching teacher announcements:', { teacherId, classroomId });
      
      let query = supabase
        .from('announcements')
        .select(`
          *,
          classroom:classroom_id (
            id,
            name,
            class_code,
            teacher:teacher_id (
              id,
              full_name,
              avatar_url
            )
          ),
          announcement_recipients (
            user_id,
            is_read,
            read_at
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by classroom if specified
      if (classroomId) {
        // Verify teacher owns the classroom first
        const { data: classroom, error: classroomError } = await supabase
          .from('classrooms')
          .select('id')
          .eq('id', classroomId)
          .eq('teacher_id', teacherId)
          .single();

        if (classroomError) {
          throw new Error('Classroom not found or access denied');
        }

        query = query.eq('classroom_id', classroomId);
      } else {
        // Get all announcements for teacher's classrooms
        const { data: classrooms, error: classroomsError } = await supabase
          .from('classrooms')
          .select('id')
          .eq('teacher_id', teacherId)
          .eq('is_active', true);

        if (classroomsError) {
          throw classroomsError;
        }

        const classroomIds = classrooms.map(c => c.id);
        if (classroomIds.length > 0) {
          query = query.in('classroom_id', classroomIds);
        } else {
          // Teacher has no classrooms, return empty array
          return { success: true, data: [] };
        }
      }

      const { data: announcements, error } = await query;

      if (error) {
        throw error;
      }

      console.log(`✅ Fetched ${announcements?.length || 0} announcements`);
      return { success: true, data: announcements || [] };
    } catch (error) {
      console.error('❌ Error fetching teacher announcements:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete announcement
   */
  static async deleteAnnouncement(announcementId, teacherId) {
    try {
      console.log('🗑️ Deleting announcement:', { announcementId, teacherId });
      
      // Verify teacher owns the announcement through classroom ownership
      const { data: announcement, error: verifyError } = await supabase
        .from('announcements')
        .select(`
          id,
          classroom:classroom_id (
            id,
            teacher_id
          )
        `)
        .eq('id', announcementId)
        .single();

      if (verifyError || !announcement) {
        throw new Error('Announcement not found');
      }

      if (announcement.classroom.teacher_id !== teacherId) {
        throw new Error('Access denied: You can only delete your own announcements');
      }

      // Delete the announcement (cascade will handle recipients)
      const { error: deleteError } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (deleteError) {
        throw deleteError;
      }

      console.log('✅ Announcement deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting announcement:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  /**
   * Get teacher dashboard statistics
   * Returns: activeClassrooms, totalStudents, tasksCreated, interactedTasks
   */
  static async getTeacherDashboard(teacherId) {
    try {
      console.log('📊 Fetching teacher dashboard stats for teacher:', teacherId);

      // 1. Count all classrooms created by this teacher (including inactive)
      const { data: allClassrooms, error: classroomsError } = await supabase
        .from('classrooms')
        .select('id, is_active')
        .eq('teacher_id', teacherId);

      if (classroomsError) {
        console.error('❌ Error fetching classrooms:', classroomsError);
        throw classroomsError;
      }

      console.log('📚 All classrooms:', allClassrooms);

      // Filter active classrooms (handle NULL as true)
      const activeClassrooms = allClassrooms ? 
        allClassrooms.filter(c => c.is_active === true || c.is_active === null) : [];
      
      const classroomsCount = activeClassrooms.length;

      // 2. Count total students in all of teacher's classrooms
      let totalStudents = 0;
      if (activeClassrooms.length > 0) {
        const classroomIds = activeClassrooms.map(c => c.id);
        
        console.log('🔍 Counting students in classroom IDs:', classroomIds);
        
        const { data: studentRecords, error: studentsError } = await supabase
          .from('classroom_students')
          .select('student_id, status')
          .in('classroom_id', classroomIds);

        if (studentsError) {
          console.error('❌ Error counting students:', studentsError);
        } else {
          console.log('👥 All student records:', studentRecords);
          // Filter active students (handle NULL as active)
          totalStudents = studentRecords ? 
            studentRecords.filter(s => s.status === 'active' || s.status === null).length : 0;
        }
      }

      // 3. Count all tasks created by this teacher
      const { data: allTasks, error: tasksError } = await supabase
        .from('teacher_tasks')
        .select('id, is_active')
        .eq('teacher_id', teacherId);

      if (tasksError) {
        console.error('❌ Error counting tasks:', tasksError);
      }

      console.log('📝 All tasks:', allTasks);

      // Filter active tasks (handle NULL as true)
      const activeTasks = allTasks ? 
        allTasks.filter(t => t.is_active === true || t.is_active === null) : [];
      
      const tasksCount = activeTasks.length;

      // 4. Count unique students who interacted with the teacher's tasks
      let interactedStudents = 0;
      if (activeTasks.length > 0) {
        const taskIds = activeTasks.map(t => t.id);

        console.log('🔍 Checking interactions for task IDs:', taskIds);

        // First, get task assignments for these tasks
        const { data: assignments, error: assignmentsError } = await supabase
          .from('task_assignments')
          .select('id, user_id, task_id')
          .in('task_id', taskIds);

        if (assignmentsError) {
          console.error('❌ Error fetching task_assignments:', assignmentsError);
        } else if (assignments && assignments.length > 0) {
          console.log('📋 Task assignments found:', assignments.length);
          
          const assignmentIds = assignments.map(a => a.id);

          // Check student_task_progress using assignment_id
          const { data: progressRecords, error: progressError } = await supabase
            .from('student_task_progress')
            .select('assignment_id')
            .in('assignment_id', assignmentIds);

          if (progressError) {
            console.error('❌ Error fetching student_task_progress:', progressError);
          } else if (progressRecords && progressRecords.length > 0) {
            console.log('📊 Progress records found:', progressRecords.length);
            
            // Get unique user_ids from assignments that have progress
            const assignmentIdsWithProgress = new Set(progressRecords.map(r => r.assignment_id));
            const uniqueStudents = new Set(
              assignments
                .filter(a => assignmentIdsWithProgress.has(a.id))
                .map(a => a.user_id)
            );
            interactedStudents = uniqueStudents.size;
          }
        }

        // Fallback: try user_progress table
        if (interactedStudents === 0) {
          const { data: userProgressRecords, error: userProgressError } = await supabase
            .from('user_progress')
            .select('user_id, activity_id')
            .in('activity_id', taskIds)
            .in('activity_type', ['assignment', 'teacher_task', 'story_assignment']);

          if (userProgressError) {
            console.error('❌ Error fetching user_progress:', userProgressError);
          } else if (userProgressRecords) {
            console.log('📊 User progress records:', userProgressRecords);
            const uniqueStudents = new Set(userProgressRecords.map(r => r.user_id));
            interactedStudents = uniqueStudents.size;
          }
        }
      }

      const dashboardStats = {
        activeClassrooms: classroomsCount,
        totalStudents: totalStudents,
        tasksCreated: tasksCount,
        interactedTasks: interactedStudents
      };

      console.log('✅ Teacher dashboard stats fetched:', dashboardStats);

      return {
        success: true,
        data: dashboardStats
      };

    } catch (error) {
      console.error('❌ Error fetching teacher dashboard:', error);
      return {
        success: false,
        error: error.message,
        data: {
          activeClassrooms: 0,
          totalStudents: 0,
          tasksCreated: 0,
          interactedTasks: 0
        }
      };
    }
  }

  /**
   * Get teacher analytics dashboard data
   */
  static async getTeacherAnalytics(teacherId) {
    try {
      // Use the analytics view from schema
      const { data: analytics, error: analyticsError } = await supabase
        .from('teacher_analytics')
        .select('*')
        .eq('teacher_id', teacherId)
        .single()

      if (analyticsError) throw analyticsError

      // Get recent activity
      const { data: recentTasks, error: tasksError } = await supabase
        .from('teacher_tasks')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (tasksError) throw tasksError

      return { 
        success: true, 
        data: {
          analytics,
          recentTasks
        }
      }
    } catch (error) {
      console.error('Error fetching teacher analytics:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get detailed classroom analytics
   */
  static async getClassroomAnalytics(classroomId, teacherId) {
    try {
      // Verify teacher owns classroom
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', classroomId)
        .eq('teacher_id', teacherId)
        .single()

      if (classroomError) throw classroomError

      // Get student progress summary
      const { data: studentProgress, error: progressError } = await supabase
        .from('student_progress_summary')
        .select(`
          *,
          classroom_students!inner (
            classroom_id
          )
        `)
        .eq('classroom_students.classroom_id', classroomId)

      if (progressError) throw progressError

      // Get task completion rates
      const { data: taskStats, error: taskStatsError } = await supabase
        .from('teacher_tasks')
        .select(`
          id,
          title,
          created_at,
          task_assignments (
            id,
            student_task_progress (
              status
            )
          )
        `)
        .eq('classroom_id', classroomId)
        .eq('teacher_id', teacherId)

      if (taskStatsError) throw taskStatsError

      return { 
        success: true, 
        data: {
          classroom,
          studentProgress,
          taskStats
        }
      }
    } catch (error) {
      console.error('Error fetching classroom analytics:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get classroom monthly analytics for a specific month
   * @param {string} classroomId - The classroom ID
   * @param {string} teacherId - The teacher ID (for verification)
   * @param {number} month - Month (1-12)
   * @param {number} year - Year (e.g., 2025)
   */
  static async getClassroomMonthlyAnalytics(classroomId, teacherId, month, year) {
    try {
      console.log('📊 Fetching monthly analytics for classroom:', { classroomId, month, year });

      // Verify teacher owns classroom
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('id, name, class_code')
        .eq('id', classroomId)
        .eq('teacher_id', teacherId)
        .single();

      if (classroomError) throw classroomError;

      // Calculate date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      console.log('📅 Date range:', { startDate, endDate });

      // 1. Calculate average reading accuracy/mastery for students in this classroom
      // Get all students enrolled in the classroom
      const { data: enrolledStudents, error: enrolledError } = await supabase
        .from('classroom_students')
        .select('student_id')
        .eq('classroom_id', classroomId)
        .eq('status', 'active');

      if (enrolledError) {
        console.error('❌ Error fetching enrolled students:', enrolledError);
      }

      let averageAccuracy = 0;
      if (enrolledStudents && enrolledStudents.length > 0) {
        const studentIds = enrolledStudents.map(s => s.student_id);
        
        // Get reading sessions with accuracy data for these students
        const { data: readingSessions, error: sessionsError } = await supabase
          .from('reading_sessions')
          .select('user_id, accuracy_rate')
          .in('user_id', studentIds)
          .not('accuracy_rate', 'is', null)
          .gte('accuracy_rate', 0);

        if (!sessionsError && readingSessions && readingSessions.length > 0) {
          const totalAccuracy = readingSessions.reduce((sum, session) => sum + (session.accuracy_rate || 0), 0);
          averageAccuracy = Math.round(totalAccuracy / readingSessions.length);
          console.log('📈 Average reading accuracy:', averageAccuracy, '%');
        } else {
          console.log('📊 No reading sessions found for accuracy calculation');
        }
      }

      // 2. Count students enrolled in this classroom during this month (based on enrollment_date)
      const { data: studentsEnrolled, error: studentsError } = await supabase
        .from('classroom_students')
        .select('student_id, status, enrollment_date')
        .eq('classroom_id', classroomId)
        .gte('enrollment_date', startDate.toISOString())
        .lte('enrollment_date', endDate.toISOString());

      if (studentsError) {
        console.error('❌ Error fetching students enrolled:', studentsError);
      }

      const totalStudentsEnrolled = studentsEnrolled ? studentsEnrolled.filter(s => 
        s.status === 'active' || s.status === null
      ).length : 0;

      console.log('👥 Students enrolled in this month:', totalStudentsEnrolled);

      // 3. Count tasks created in this month for this classroom
      const { data: tasks, error: tasksError } = await supabase
        .from('teacher_tasks')
        .select('id, created_at')
        .eq('classroom_id', classroomId)
        .eq('teacher_id', teacherId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (tasksError) {
        console.error('❌ Error fetching tasks:', tasksError);
      }

      const tasksCreated = tasks ? tasks.length : 0;

      // 4. Count students who COMPLETED tasks in this classroom
      // Get all tasks for this classroom (not just this month's tasks)
      const { data: allClassroomTasks, error: allTasksError } = await supabase
        .from('teacher_tasks')
        .select('id')
        .eq('classroom_id', classroomId)
        .eq('teacher_id', teacherId);

      let studentsCompletedTasks = 0;
      
      if (!allTasksError && allClassroomTasks && allClassroomTasks.length > 0) {
        const taskIds = allClassroomTasks.map(t => t.id);

        // Get task assignments for all classroom tasks
        const { data: assignments, error: assignmentsError } = await supabase
          .from('task_assignments')
          .select('id, user_id, task_id')
          .in('task_id', taskIds);

        if (!assignmentsError && assignments && assignments.length > 0) {
          const assignmentIds = assignments.map(a => a.id);

          // Get completed progress records (status = 'completed' or 'submitted')
          const { data: completedProgress, error: progressError } = await supabase
            .from('student_task_progress')
            .select('assignment_id, status, submitted_at')
            .in('assignment_id', assignmentIds)
            .in('status', ['completed', 'submitted'])
            .gte('submitted_at', startDate.toISOString())
            .lte('submitted_at', endDate.toISOString());

          if (!progressError && completedProgress && completedProgress.length > 0) {
            // Count unique students who completed tasks in this month
            const assignmentIdsCompleted = new Set(completedProgress.map(r => r.assignment_id));
            const uniqueStudentsCompleted = new Set(
              assignments
                .filter(a => assignmentIdsCompleted.has(a.id))
                .map(a => a.user_id)
            );
            studentsCompletedTasks = uniqueStudentsCompleted.size;
            console.log('✅ Students who completed tasks:', studentsCompletedTasks);
          }
        }
      }

      const monthlyStats = {
        classroomId,
        classroomName: classroom.name,
        classroomCode: classroom.class_code,
        month,
        year,
        averageAccuracy: averageAccuracy, // New: Average reading accuracy/mastery percentage
        studentsAdded: totalStudentsEnrolled, // Students enrolled during this month
        tasksCreated: tasksCreated, // Tasks created during this month
        studentInteractions: studentsCompletedTasks, // Students who completed tasks during this month
        hasData: tasksCreated > 0 || studentsCompletedTasks > 0 || totalStudentsEnrolled > 0
      };

      console.log('✅ Monthly stats for classroom:', monthlyStats);

      return {
        success: true,
        data: monthlyStats
      };

    } catch (error) {
      console.error('❌ Error fetching classroom monthly analytics:', error);
      return {
        success: false,
        error: error.message,
        data: {
          classroomId,
          averageAccuracy: 0,
          studentsAdded: 0,
          tasksCreated: 0,
          studentInteractions: 0,
          hasData: false
        }
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate unique class code
   */
  static generateClassCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Get teacher profile with statistics
   */
  static async getTeacherProfile(teacherId) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', teacherId)
        .eq('user_type', 'teacher')
        .single()

      if (profileError) throw profileError

      // Get basic stats
      const { data: stats, error: statsError } = await supabase
        .from('teacher_analytics')
        .select('*')
        .eq('teacher_id', teacherId)
        .single()

      if (statsError) {
        // If no stats exist, return profile with zero stats
        return {
          success: true,
          data: {
            ...profile,
            stats: {
              active_classrooms: 0,
              total_students: 0,
              tasks_created: 0,
              interacted_tasks: 0
            }
          }
        }
      }

      return {
        success: true,
        data: {
          ...profile,
          stats
        }
      }
    } catch (error) {
      console.error('Error fetching teacher profile:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update teacher profile
   */
  static async updateTeacherProfile(teacherId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacherId)
        .eq('user_type', 'teacher')
        .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error updating teacher profile:', error)
      return { success: false, error: error.message }
    }
  }

  // Remove student from classroom (keeps student profile, removes enrollment)
  static async removeStudentFromClass(classroomId, studentId, teacherId) {
    try {
      console.log('🗑️ Removing student from classroom:', { classroomId, studentId, teacherId });
      
      // Verify the teacher owns this classroom
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('id, teacher_id')
        .eq('id', classroomId)
        .eq('teacher_id', teacherId)
        .single();

      if (classroomError || !classroom) {
        console.error('Classroom not found or access denied:', classroomError);
        return { success: false, error: 'Classroom not found or access denied' };
      }

      // Remove the enrollment record
      const { error: removeError } = await supabase
        .from('classroom_students')
        .delete()
        .eq('classroom_id', classroomId)
        .eq('student_id', studentId);

      if (removeError) {
        console.error('Error removing student from classroom:', removeError);
        return { success: false, error: removeError.message };
      }

      console.log('✅ Student successfully removed from classroom');
      return { success: true, message: 'Student removed from classroom successfully' };
    } catch (error) {
      console.error('Error removing student from classroom:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get words by category for test creation
   * Maps frontend category names to database category values from Words table
   * @param {string} category - The category (cvc, blending, silent-words, phonics-merger)
   * @param {number} limit - Maximum number of words to fetch (default 50)
   */
  static async getWordsByCategory(category, limit = 50) {
    try {
      console.log('📚 Fetching words for category:', { category, limit });

      // Map frontend category names to database category values (from CSV and Words table)
      const categoryMap = {
        'cvc': 'CVC',
        'blending': 'Blending',
        'silent-words': 'Silent Letter',
        'silent-letter': 'Silent Letter',
        'phonics-merger': 'Phonics Merger',
        'phonics_merger': 'Phonics Merger'
      };

      // Get the correct category value from the database
      const dbCategory = categoryMap[category.toLowerCase()] || category;
      console.log(`🔍 Querying Words table for category: "${dbCategory}"`);

      // Query the Words table filtered by category
      const { data: words, error } = await supabase
        .from('Words')
        .select('word, category, difficulty_level, pronunciation, definition, example_sentence')
        .eq('category', dbCategory)
        .eq('is_active', true)
        .order('difficulty_level', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching words:', error);
        throw error;
      }

      console.log(`✅ Fetched ${words?.length || 0} ${dbCategory} words`);
      return { success: true, data: words || [] };
    } catch (error) {
      console.error('❌ Error in getWordsByCategory:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get randomized words from a specific category
   * @param {string} category - Test category (e.g., 'cvc', 'blending')
   * @param {number} count - Number of words to return (randomized)
   * @returns {Object} {success: boolean, data: Word[]}
   */
  static async getRandomizedWordsByCategory(category, count = 10) {
    try {
      console.log('🎲 Fetching randomized words for category:', { category, count });

      // Map frontend category names to database category values
      const categoryMap = {
        'cvc': 'CVC',
        'blending': 'Blending',
        'silent-words': 'Silent Letter',
        'silent-letter': 'Silent Letter',
        'phonics-merger': 'Phonics Merger',
        'phonics_merger': 'Phonics Merger'
      };

      const dbCategory = categoryMap[category.toLowerCase()] || category;
      console.log(`🔍 Querying Words table for randomized ${dbCategory} words`);

      // Fetch more words than needed (to ensure we have enough even after randomization)
      const fetchLimit = Math.max(count * 3, 100);

      const { data: words, error } = await supabase
        .from('Words')
        .select('word, category, difficulty_level, pronunciation, definition, example_sentence')
        .eq('category', dbCategory)
        .eq('is_active', true)
        .limit(fetchLimit);

      if (error) {
        console.error('❌ Error fetching words:', error);
        throw error;
      }

      if (!words || words.length === 0) {
        console.warn(`⚠️ No words found for category: ${dbCategory}`);
        return { success: true, data: [] };
      }

      // Shuffle the array using Fisher-Yates algorithm
      const shuffled = [...words];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Return only the requested count
      const randomized = shuffled.slice(0, count);
      console.log(`✅ Fetched ${randomized.length} randomized ${dbCategory} words`);
      return { success: true, data: randomized };
    } catch (error) {
      console.error('❌ Error in getRandomizedWordsByCategory:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all available word categories from the Words table
   */
  static async getAllWordCategories() {
    try {
      console.log('📚 Fetching all available word categories...');

      const { data: words, error } = await supabase
        .from('Words')
        .select('category')
        .eq('is_active', true)
        .not('category', 'is', null);

      if (error) {
        console.error('❌ Error fetching categories:', error);
        throw error;
      }

      // Get unique categories
      const uniqueCategories = [...new Set(words?.map(w => w.category) || [])];
      console.log(`✅ Found ${uniqueCategories.length} unique categories:`, uniqueCategories);

      return { success: true, data: uniqueCategories };
    } catch (error) {
      console.error('❌ Error in getAllWordCategories:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get student's current reading level progress
   * @param {string} studentId - Student's user ID
   */
  static async getStudentLevelProgress(studentId) {
    try {
      console.log('📊 Fetching student level progress for:', studentId);

      // Get current reading level
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('current_reading_level')
        .eq('user_id', studentId)
        .single();

      if (statsError) {
        console.error('❌ Error fetching user stats:', statsError);
        return { success: false, error: statsError.message };
      }

      const currentLevel = userStats?.current_reading_level || 1;

      // Get phonics progress
      const { data: phonicsProgress, error: phonicsError } = await supabase
        .from('user_phonics_progress')
        .select('*')
        .eq('user_id', studentId)
        .single();

      if (phonicsError && phonicsError.code !== 'PGRST116') {
        console.error('❌ Error fetching phonics progress:', phonicsError);
      }

      // Level requirements mapping
      const levelRequirements = {
        1: { name: 'Non-Reader', category: 'cvc', categoryLabel: 'CVC Words', wordsRequired: 150, nextLevel: 2, nextName: 'Frustration' },
        2: { name: 'Frustration', category: 'phonics_merger', categoryLabel: 'Phonics Merger', wordsRequired: 150, nextLevel: 3, nextName: 'Instructional' },
        3: { name: 'Instructional', category: 'blending', categoryLabel: 'Blending', wordsRequired: 300, nextLevel: 4, nextName: 'Independent' },
        4: { name: 'Independent', category: 'silent', categoryLabel: 'Silent Words', wordsRequired: 300, nextLevel: null, nextName: null }
      };

      const currentLevelInfo = levelRequirements[currentLevel];
      
      // Get words read for current category
      const categoryFieldMap = {
        'cvc': 'cvc_words_read',
        'phonics_merger': 'phonics_merger_words_read',
        'blending': 'blending_words_read',
        'silent': 'silent_letter_words_read'
      };

      const categoryField = categoryFieldMap[currentLevelInfo.category];
      const wordsRead = phonicsProgress?.[categoryField] || 0;
      const progressPercentage = currentLevelInfo.wordsRequired > 0 
        ? Math.min(Math.round((wordsRead / currentLevelInfo.wordsRequired) * 100), 100)
        : 0;

      const levelProgress = {
        currentLevel,
        levelName: currentLevelInfo.name,
        nextLevel: currentLevelInfo.nextLevel,
        nextLevelName: currentLevelInfo.nextName,
        category: currentLevelInfo.category,
        categoryLabel: currentLevelInfo.categoryLabel,
        wordsRequired: currentLevelInfo.wordsRequired,
        wordsRead,
        progressPercentage
      };

      console.log('✅ Level progress:', levelProgress);

      return { success: true, data: levelProgress };
    } catch (error) {
      console.error('❌ Error in getStudentLevelProgress:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add words read for a category and promote student if requirements are met
   * @param {Object} params - Parameters
   * @param {string} params.studentId - Student's user ID
   * @param {string} params.teacherId - Teacher's user ID
   * @param {string} params.category - Category to add words for
   * @param {number} params.wordsToAdd - Number of words to add
   * @param {number} params.currentLevel - Student's current reading level
   */
  static async addWordsAndPromoteStudent(params) {
    try {
      const { studentId, teacherId, category, wordsToAdd, currentLevel } = params;
      
      console.log('📝 Adding words and checking promotion:', params);

      // Get current phonics progress
      const { data: phonicsProgress, error: progressError } = await supabase
        .from('user_phonics_progress')
        .select('*')
        .eq('user_id', studentId)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        console.error('❌ Error fetching phonics progress:', progressError);
        return { success: false, error: progressError.message };
      }

      // Category field mapping
      const categoryFieldMap = {
        'cvc': 'cvc_words_read',
        'phonics_merger': 'phonics_merger_words_read',
        'blending': 'blending_words_read',
        'silent': 'silent_letter_words_read'
      };

      const categoryField = categoryFieldMap[category];
      const currentWordsRead = phonicsProgress?.[categoryField] || 0;
      const newWordsRead = currentWordsRead + wordsToAdd;

      // Update phonics progress
      const updateData = {
        [categoryField]: newWordsRead
      };

      let upsertError;
      if (phonicsProgress) {
        const { error } = await supabase
          .from('user_phonics_progress')
          .update(updateData)
          .eq('user_id', studentId);
        upsertError = error;
      } else {
        const { error } = await supabase
          .from('user_phonics_progress')
          .insert({
            user_id: studentId,
            ...updateData
          });
        upsertError = error;
      }

      if (upsertError) {
        console.error('❌ Error updating phonics progress:', upsertError);
        return { success: false, error: upsertError.message };
      }

      // Check if promotion is needed
      const levelRequirements = {
        1: { wordsRequired: 150, nextLevel: 2, nextName: 'Frustration' },
        2: { wordsRequired: 150, nextLevel: 3, nextName: 'Instructional' },
        3: { wordsRequired: 300, nextLevel: 4, nextName: 'Independent' },
        4: { wordsRequired: 300, nextLevel: null, nextName: null }
      };

      const requirements = levelRequirements[currentLevel];
      let promoted = false;
      let newLevel = currentLevel;
      let newLevelName = null;

      if (requirements && newWordsRead >= requirements.wordsRequired && requirements.nextLevel) {
        // Promote student
        const { error: levelError } = await supabase
          .from('user_stats')
          .update({ 
            current_reading_level: requirements.nextLevel,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', studentId);

        if (levelError) {
          console.error('❌ Error promoting student:', levelError);
        } else {
          promoted = true;
          newLevel = requirements.nextLevel;
          newLevelName = requirements.nextName;
          console.log(`🎉 Student promoted to level ${newLevel}: ${newLevelName}`);
        }
      }

      return { 
        success: true, 
        promoted, 
        newLevel,
        newLevelName,
        wordsRead: newWordsRead
      };
    } catch (error) {
      console.error('❌ Error in addWordsAndPromoteStudent:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get individual student performance analytics for a specific time period
   * @param {Object} params - Parameters object
   * @param {string} params.studentId - Student's user ID
   * @param {string} params.classroomId - Classroom ID
   * @param {string} params.teacherId - Teacher's user ID
   * @param {string} params.period - Time period ('week' or 'month')
   * @param {number} params.week - Week number (if period is 'week')
   * @param {number} params.month - Month number 1-12 (if period is 'month')
   * @param {number} params.year - Year
   */
  static async getStudentPerformanceAnalytics(params) {
    try {
      const { studentId, classroomId, teacherId, period, week, month, year } = params;
      
      console.log('📊 Fetching student performance analytics:', params);

      // Verify student belongs to this classroom
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('classroom_students')
        .select('id')
        .eq('classroom_id', classroomId)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .single();

      if (enrollmentError || !enrollment) {
        console.error('❌ Student not enrolled in classroom:', enrollmentError);
        return { success: false, error: 'Student not found in classroom' };
      }

      // Calculate date range
      let startDate, endDate;
      
      if (period === 'week') {
        // Calculate start and end of the week
        const firstDayOfYear = new Date(year, 0, 1);
        const daysOffset = (week - 1) * 7;
        startDate = new Date(firstDayOfYear);
        startDate.setDate(firstDayOfYear.getDate() + daysOffset);
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      } else {
        // Month-based range
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0); // Last day of the month
      }

      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      console.log('📅 Date range:', { startDate: startDateStr, endDate: endDateStr });

      // First, get all task assignments for this student in the classroom
      const { data: assignments, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select(`
          id,
          task_id,
          assigned_at,
          due_date,
          teacher_tasks!inner (
            id,
            classroom_id
          )
        `)
        .eq('user_id', studentId)
        .eq('teacher_tasks.classroom_id', classroomId);

      if (assignmentsError) {
        console.error('❌ Error fetching task assignments:', assignmentsError);
        return { success: false, error: assignmentsError.message };
      }

      console.log(`✅ Found ${assignments?.length || 0} task assignments`);

      if (!assignments || assignments.length === 0) {
        // No data for this period
        return {
          success: true,
          data: {
            averageAccuracy: 0,
            totalMiscuesPercentage: 0,
            totalWordsRead: 0,
            period,
            startDate: startDateStr,
            endDate: endDateStr,
            attemptCount: 0
          }
        };
      }

      // Get assignment IDs to fetch progress data
      const assignmentIds = assignments.map(a => a.id);

      // Fetch student_task_progress for these assignments within the date range
      const { data: progressData, error: progressError } = await supabase
        .from('student_task_progress')
        .select('*')
        .in('assignment_id', assignmentIds)
        .eq('status', 'completed')
        .gte('submitted_at', startDateStr)
        .lte('submitted_at', endDateStr);

      if (progressError) {
        console.warn('⚠️ Error fetching progress data:', progressError);
      }

      console.log(`✅ Found ${progressData?.length || 0} completed progress records in date range`);

      if (!progressData || progressData.length === 0) {
        // No completed tasks in this period
        return {
          success: true,
          data: {
            averageAccuracy: 0,
            totalMiscuesPercentage: 0,
            totalWordsRead: 0,
            period,
            startDate: startDateStr,
            endDate: endDateStr,
            attemptCount: 0
          }
        };
      }

      // Calculate analytics from progress data
      let totalScore = 0;
      let totalWordsRead = 0;
      let attemptCount = progressData.length;

      progressData.forEach(progress => {
        // Calculate accuracy from percentage_score or score/max_score
        if (progress.percentage_score !== null && progress.percentage_score !== undefined) {
          totalScore += progress.percentage_score;
        } else if (progress.score !== null && progress.max_score && progress.max_score > 0) {
          totalScore += (progress.score / progress.max_score) * 100;
        }
      });

      // Get task IDs to fetch word counts from stories
      const taskIds = [...new Set(assignments.map(a => a.task_id))];
      
      // Fetch teacher_tasks to get content_id (story references)
      const { data: tasks, error: tasksError } = await supabase
        .from('teacher_tasks')
        .select('id, category, subcategory')
        .in('id', taskIds);

      if (!tasksError && tasks) {
        // For story-based tasks, try to get word counts
        const storyTaskIds = tasks
          .filter(t => t.category === 'story' || t.subcategory?.includes('story'))
          .map(t => t.id);

        if (storyTaskIds.length > 0) {
          // Get story IDs from task assignments
          const { data: storyAssignments } = await supabase
            .from('teacher_tasks')
            .select('id, subcategory')
            .in('id', storyTaskIds);

          // For each completed task, try to estimate words read
          // If we have story data, use actual word count
          // Otherwise use an estimate based on task type
          const completedTaskIds = progressData.map(p => 
            assignments.find(a => a.id === p.assignment_id)?.task_id
          ).filter(Boolean);

          // Use a reasonable estimate: average story has ~200 words
          // For word tasks: ~50 words, for tests: ~100 words
          completedTaskIds.forEach(taskId => {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
              if (task.category === 'story') {
                totalWordsRead += 200; // Average story length
              } else if (task.category === 'word' || task.category === 'vocabulary') {
                totalWordsRead += 50; // Word practice
              } else if (task.category === 'test' || task.category === 'quiz') {
                totalWordsRead += 100; // Test reading
              } else {
                totalWordsRead += 150; // Default estimate
              }
            }
          });
        } else {
          // No story tasks, estimate based on completed tasks
          totalWordsRead = attemptCount * 150; // Conservative estimate per task
        }
      } else {
        // Fallback: estimate based on number of completed tasks
        totalWordsRead = attemptCount * 150;
      }

      console.log(`📖 Estimated words read: ${totalWordsRead} for ${attemptCount} completed tasks`);

      // Calculate averages and percentages
      const averageAccuracy = attemptCount > 0 
        ? Math.round(totalScore / attemptCount) 
        : 0;

      // Calculate miscues percentage
      // Since we don't have miscues data in current schema, estimate from accuracy
      const totalMiscuesPercentage = averageAccuracy > 0
        ? Math.round(100 - averageAccuracy)
        : 0;

      const analytics = {
        averageAccuracy,
        totalMiscuesPercentage: Math.min(totalMiscuesPercentage, 100), // Cap at 100%
        totalWordsRead,
        period,
        startDate: startDateStr,
        endDate: endDateStr,
        attemptCount
      };

      console.log('✅ Student analytics calculated:', analytics);

      return { success: true, data: analytics };
    } catch (error) {
      console.error('❌ Error in getStudentPerformanceAnalytics:', error);
      return { success: false, error: error.message };
    }
  }

}

export { TeacherService }
export default TeacherService