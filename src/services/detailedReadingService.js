// detailedReadingService.js
// Service for handling detailed reading analytics based on formal assessment

import supabase from '../supabase.js'

export class DetailedReadingService {
  
  // =============================================================================
  // 1. READING SESSION MANAGEMENT
  // =============================================================================

  /**
   * Create a new detailed reading session
   * @param {Object} sessionData - Comprehensive session data
   */
  async createDetailedReadingSession(sessionData) {
    try {
      const {
        user_id,
        assignment_id,
        content_type,
        content_id,
        passage_title,
        reading_level,
        set_identifier,
        total_words_in_passage,
        total_reading_time,
        words_read,
        accuracy_rate,
        comprehension_score,
        total_miscues,
        word_reading_score
      } = sessionData

      // Calculate reading rate
      const reading_rate = total_reading_time > 0 ? 
        Math.round((words_read / (total_reading_time / 60)) * 100) / 100 : 0

      // Determine comprehension level
      const comprehension_level = this.determineComprehensionLevel(comprehension_score)

      const { data, error } = await supabase
        .from('reading_sessions')
        .insert({
          user_id,
          assignment_id,
          content_type,
          content_id,
          passage_title,
          reading_level,
          set_identifier,
          session_duration: total_reading_time,
          total_reading_time,
          total_words_in_passage,
          words_read,
          accuracy_rate,
          reading_rate,
          comprehension_score,
          comprehension_level,
          total_miscues,
          word_reading_score,
          session_date: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating detailed reading session:', error)
      throw error
    }
  }

  /**
   * Update reading session with final metrics
   */
  async updateReadingSessionMetrics(sessionId, metrics) {
    try {
      const { data, error } = await supabase
        .from('reading_sessions')
        .update({
          total_reading_time: metrics.total_reading_time,
          reading_rate: metrics.reading_rate,
          comprehension_score: metrics.comprehension_score,
          comprehension_level: this.determineComprehensionLevel(metrics.comprehension_score),
          total_miscues: metrics.total_miscues,
          word_reading_score: metrics.word_reading_score
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating reading session metrics:', error)
      throw error
    }
  }

  // =============================================================================
  // 2. MISCUE ANALYSIS
  // =============================================================================

  /**
   * Record a reading miscue
   * @param {Object} miscueData - Detailed miscue information
   */
  async recordMiscue(miscueData) {
    try {
      const {
        reading_session_id,
        user_id,
        word_position,
        expected_word,
        actual_reading,
        miscue_type,
        is_self_corrected = false,
        meaning_maintained = true
      } = miscueData

      const { data, error } = await supabase
        .from('reading_miscues')
        .insert({
          reading_session_id,
          user_id,
          word_position,
          expected_word,
          actual_reading,
          miscue_type,
          is_self_corrected,
          meaning_maintained
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error recording miscue:', error)
      throw error
    }
  }

  /**
   * Get miscue analysis for a reading session
   */
  async getMiscueAnalysis(reading_session_id) {
    try {
      const { data, error } = await supabase
        .from('reading_miscues')
        .select('*')
        .eq('reading_session_id', reading_session_id)
        .order('word_position')

      if (error) throw error

      // Organize miscues by type
      const miscueAnalysis = {
        total_miscues: data.length,
        mispronunciation: data.filter(m => m.miscue_type === 'mispronunciation').length,
        omission: data.filter(m => m.miscue_type === 'omission').length,
        substitution: data.filter(m => m.miscue_type === 'substitution').length,
        insertion: data.filter(m => m.miscue_type === 'insertion').length,
        repetition: data.filter(m => m.miscue_type === 'repetition').length,
        transposition: data.filter(m => m.miscue_type === 'transposition').length,
        reversal: data.filter(m => m.miscue_type === 'reversal').length,
        self_corrections: data.filter(m => m.is_self_corrected).length,
        meaning_maintained: data.filter(m => m.meaning_maintained).length,
        detailed_miscues: data
      }

      return miscueAnalysis
    } catch (error) {
      console.error('Error getting miscue analysis:', error)
      throw error
    }
  }

  // =============================================================================
  // 3. WORD-LEVEL TRACKING
  // =============================================================================

  /**
   * Record individual word reading attempt
   */
  async recordWordAttempt(wordData) {
    try {
      const {
        reading_session_id,
        user_id,
        word_text,
        word_position,
        attempt_number = 1,
        is_correct,
        reading_time_ms,
        confidence_level = 3,
        audio_file_path = null
      } = wordData

      const { data, error } = await supabase
        .from('word_reading_attempts')
        .insert({
          reading_session_id,
          user_id,
          word_text,
          word_position,
          attempt_number,
          is_correct,
          reading_time_ms,
          confidence_level,
          audio_file_path
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error recording word attempt:', error)
      throw error
    }
  }

  /**
   * Get word-level performance for a session
   */
  async getWordLevelPerformance(reading_session_id) {
    try {
      const { data, error } = await supabase
        .from('word_reading_attempts')
        .select('*')
        .eq('reading_session_id', reading_session_id)
        .order('word_position')

      if (error) throw error

      const performance = {
        total_words: data.length,
        correct_words: data.filter(w => w.is_correct).length,
        accuracy_percentage: data.length > 0 ? 
          Math.round((data.filter(w => w.is_correct).length / data.length) * 100) : 0,
        average_reading_time: data.length > 0 ? 
          data.reduce((sum, w) => sum + (w.reading_time_ms || 0), 0) / data.length : 0,
        word_details: data
      }

      return performance
    } catch (error) {
      console.error('Error getting word-level performance:', error)
      throw error
    }
  }

  // =============================================================================
  // 4. COMPREHENSIVE ASSESSMENTS
  // =============================================================================

  /**
   * Create a formal reading assessment record
   */
  async createReadingAssessment(assessmentData) {
    try {
      const {
        user_id,
        assignment_id,
        assessment_type,
        assessment_level,
        passage_or_wordlist,
        total_time_seconds,
        total_items,
        correct_items,
        reading_rate_wpm = null,
        teacher_notes = null
      } = assessmentData

      const accuracy_percentage = total_items > 0 ? 
        Math.round((correct_items / total_items) * 10000) / 100 : 0

      const comprehension_level = this.determineComprehensionLevel(accuracy_percentage)

      const { data, error } = await supabase
        .from('reading_assessments')
        .insert({
          user_id,
          assignment_id,
          assessment_type,
          assessment_level,
          passage_or_wordlist,
          total_time_seconds,
          total_items,
          correct_items,
          accuracy_percentage,
          reading_rate_wpm,
          comprehension_level,
          teacher_notes
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating reading assessment:', error)
      throw error
    }
  }

  // =============================================================================
  // 5. ANALYTICS AND REPORTING
  // =============================================================================

  /**
   * Get comprehensive student reading performance
   */
  async getStudentReadingPerformance(user_id, timeframe = '30 days') {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - (timeframe === '30 days' ? 30 : 7))

      const { data, error } = await supabase
        .from('student_reading_performance')
        .select('*')
        .eq('user_id', user_id)
        .gte('session_date', cutoffDate.toISOString())
        .order('session_date', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting student performance:', error)
      throw error
    }
  }

  /**
   * Get classroom reading analytics
   */
  async getClassroomReadingAnalytics(classroom_id) {
    try {
      const { data, error } = await supabase
        .from('classroom_reading_analytics')
        .select('*')
        .eq('classroom_id', classroom_id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting classroom analytics:', error)
      throw error
    }
  }

  /**
   * Get progress tracking data for charts
   */
  async getProgressTrackingData(user_id, metric = 'reading_rate') {
    try {
      const { data, error } = await supabase
        .from('reading_sessions')
        .select(`
          session_date,
          ${metric},
          reading_level,
          accuracy_rate,
          comprehension_score
        `)
        .eq('user_id', user_id)
        .order('session_date')
        .limit(30)

      if (error) throw error

      // Format data for charts
      const chartData = data.map(session => ({
        date: session.session_date,
        value: session[metric],
        level: session.reading_level,
        accuracy: session.accuracy_rate,
        comprehension: session.comprehension_score
      }))

      return chartData
    } catch (error) {
      console.error('Error getting progress tracking data:', error)
      throw error
    }
  }

  // =============================================================================
  // 6. UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Determine comprehension level based on accuracy percentage
   */
  determineComprehensionLevel(accuracy_percentage) {
    if (accuracy_percentage >= 95) return 'Independent'
    if (accuracy_percentage >= 90) return 'Instructional'
    if (accuracy_percentage >= 75) return 'Frustration'
    return 'Non-Reader'
  }

  /**
   * Calculate reading rate (WPM)
   */
  calculateReadingRate(words_count, time_seconds) {
    if (!time_seconds || time_seconds === 0) return 0
    return Math.round((words_count / (time_seconds / 60)) * 100) / 100
  }

  /**
   * Format miscue analysis for teacher reports
   */
  formatMiscueReport(miscueAnalysis) {
    const { 
      total_miscues, 
      mispronunciation, 
      omission, 
      substitution, 
      insertion, 
      repetition, 
      transposition, 
      reversal,
      self_corrections 
    } = miscueAnalysis

    return {
      summary: `Total Miscues: ${total_miscues}, Self-Corrections: ${self_corrections}`,
      breakdown: {
        'Maling Bigkas (Mispronunciation)': mispronunciation,
        'Pagkakaltas (Omission)': omission,
        'Pagpapalit (Substitution)': substitution,
        'Pagsisingit (Insertion)': insertion,
        'Pag-uulit (Repetition)': repetition,
        'Pagpapalit ng lugar (Transposition)': transposition,
        'Paglilipat (Reversal)': reversal
      },
      self_correction_rate: total_miscues > 0 ? 
        Math.round((self_corrections / total_miscues) * 100) : 0
    }
  }

  /**
   * Generate assessment summary report
   */
  generateAssessmentSummary(sessionData, miscueAnalysis, wordPerformance) {
    return {
      student_info: {
        reading_level: sessionData.reading_level,
        passage_title: sessionData.passage_title,
        assessment_date: sessionData.session_date
      },
      timing: {
        total_time: `${Math.floor(sessionData.total_reading_time / 60)}:${(sessionData.total_reading_time % 60).toString().padStart(2, '0')}`,
        reading_rate: `${sessionData.reading_rate} WPM`,
        total_words: sessionData.total_words_in_passage
      },
      accuracy: {
        word_reading_score: `${sessionData.word_reading_score}%`,
        comprehension_score: `${sessionData.comprehension_score}%`,
        overall_level: sessionData.comprehension_level
      },
      miscue_analysis: this.formatMiscueReport(miscueAnalysis),
      recommendations: this.generateRecommendations(sessionData, miscueAnalysis)
    }
  }

  /**
   * Generate teaching recommendations based on assessment
   */
  generateRecommendations(sessionData, miscueAnalysis) {
    const recommendations = []

    // Reading rate recommendations
    if (sessionData.reading_rate < 60) {
      recommendations.push("Focus on fluency building exercises")
    }

    // Accuracy recommendations
    if (sessionData.word_reading_score < 90) {
      recommendations.push("Practice sight word recognition")
    }

    // Miscue-specific recommendations
    if (miscueAnalysis.mispronunciation > 3) {
      recommendations.push("Work on phonetic decoding skills")
    }
    if (miscueAnalysis.omission > 2) {
      recommendations.push("Practice careful reading with finger tracking")
    }
    if (miscueAnalysis.substitution > 2) {
      recommendations.push("Focus on context clues and meaning")
    }

    // Comprehension recommendations
    if (sessionData.comprehension_score < 75) {
      recommendations.push("Practice comprehension strategies")
    }

    return recommendations
  }
}

// Export singleton instance
export const detailedReadingService = new DetailedReadingService()
export default detailedReadingService