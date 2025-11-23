/**
 * Authentication Diagnostics Utility
 * Helper functions for diagnosing and resolving auth issues
 */

import supabase from '../supabase.js'

export class AuthDiagnostics {
  
  /**
   * Test user registration flow
   */
  static async testRegistration(email = 'test@example.com', password = 'testpass123') {
    console.log('🧪 Testing user registration flow...')
    
    try {
      // 1. Test signup
      console.log('Step 1: Testing signup...')
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      })
      
      if (signupError) {
        console.error('❌ Signup failed:', signupError.message)
        return { success: false, step: 'signup', error: signupError.message }
      }
      
      console.log('✅ Signup successful')
      
      // 2. Check if profile was created
      if (signupData.user) {
        console.log('Step 2: Checking profile creation...')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single()
        
        if (profileError) {
          console.error('❌ Profile not found:', profileError.message)
          
          // 3. Attempt to create profile manually
          console.log('Step 3: Attempting to create profile manually...')
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: signupData.user.id,
              email: signupData.user.email,
              first_name: 'Test',
              last_name: 'User',
              role: 'student',
              is_active: true
            }])
            .select()
            .single()
          
          if (createError) {
            console.error('❌ Manual profile creation failed:', createError.message)
            return { success: false, step: 'profile_creation', error: createError.message }
          }
          
          console.log('✅ Profile created manually')
          return { 
            success: true, 
            message: 'Registration completed with manual profile creation',
            user: signupData.user,
            profile: createdProfile
          }
        }
        
        console.log('✅ Profile found automatically')
        return { 
          success: true, 
          message: 'Registration completed successfully',
          user: signupData.user,
          profile: profile
        }
      }
      
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      return { success: false, step: 'unexpected', error: error.message }
    }
  }
  
  /**
   * Check RLS policies status
   */
  static async checkRLSPolicies() {
    console.log('🔍 Checking RLS policies...')
    
    try {
      // Test basic table access
      const { data, error } = await supabase
        .from('profiles')
        .select('count(*)', { count: 'exact' })
      
      if (error) {
        console.error('❌ Cannot access profiles table:', error.message)
        return { 
          success: false, 
          error: error.message,
          suggestion: 'RLS policies may be blocking access. Check fix-rls-policies.sql'
        }
      }
      
      console.log('✅ Profiles table accessible')
      console.log(`📊 Total profiles: ${data.length > 0 ? data[0].count : 0}`)
      
      return { 
        success: true, 
        profileCount: data.length > 0 ? data[0].count : 0
      }
      
    } catch (error) {
      console.error('❌ Error checking RLS policies:', error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Test authentication flow
   */
  static async testAuthFlow(email, password) {
    console.log('🔐 Testing authentication flow...')
    
    try {
      // 1. Test sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (signInError) {
        console.error('❌ Sign in failed:', signInError.message)
        return { success: false, step: 'signin', error: signInError.message }
      }
      
      console.log('✅ Sign in successful')
      
      // 2. Test profile access
      if (signInData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single()
        
        if (profileError) {
          console.error('❌ Cannot access profile:', profileError.message)
          return { 
            success: false, 
            step: 'profile_access', 
            error: profileError.message,
            suggestion: 'Profile may not exist or RLS policies are blocking access'
          }
        }
        
        console.log('✅ Profile access successful')
        console.log('👤 User profile:', {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          active: profile.is_active
        })
        
        return {
          success: true,
          user: signInData.user,
          profile: profile
        }
      }
      
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      return { success: false, step: 'unexpected', error: error.message }
    }
  }
  
  /**
   * Clean up test user (for testing purposes)
   */
  static async cleanupTestUser(email) {
    console.log('🧹 Cleaning up test user...')
    
    try {
      // Note: This requires admin privileges in production
      console.log('⚠️  Test user cleanup requires manual deletion in Supabase Auth panel')
      return { 
        success: true, 
        message: `Please manually delete user ${email} from Supabase Auth panel if needed` 
      }
    } catch (error) {
      console.error('❌ Error during cleanup:', error)
      return { success: false, error: error.message }
    }
  }
}

export default AuthDiagnostics