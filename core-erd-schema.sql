-- ============================================================================
-- WORD VENTURE - CORE ERD SCHEMA
-- Simplified schema with essential tables only (< 25 tables)
-- ============================================================================

-- ============================================================================
-- 1. USER MANAGEMENT (3 tables)
-- ============================================================================

-- Profiles - Main user table for all user types
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'teacher', 'student')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Stats - Track reading performance
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_reading_level INTEGER DEFAULT 1,
  total_words_read INTEGER DEFAULT 0,
  total_stories_completed INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User Phonics Progress - Track phonics pattern mastery
CREATE TABLE user_phonics_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cvc_words_read INTEGER DEFAULT 0,
  blending_words_read INTEGER DEFAULT 0,
  silent_letter_words_read INTEGER DEFAULT 0,
  phonics_merger_words_read INTEGER DEFAULT 0,
  sight_words_read INTEGER DEFAULT 0,
  other_words_read INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- 2. CLASSROOM MANAGEMENT (2 tables)
-- ============================================================================

-- Classrooms - Teacher-created classrooms
CREATE TABLE classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  class_code VARCHAR(20) UNIQUE NOT NULL,
  grade_level VARCHAR(50),
  max_students INTEGER DEFAULT 40,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classroom Students - Many-to-many relationship
CREATE TABLE classroom_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
  UNIQUE(classroom_id, student_id)
);

-- ============================================================================
-- 3. CONTENT MANAGEMENT (2 tables)
-- ============================================================================

-- Short Stories - Reading materials
CREATE TABLE short_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  story_text TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  word_count INTEGER,
  reading_level VARCHAR(50),
  category VARCHAR(100),
  image_url TEXT,
  audio_url TEXT,
  -- Embedded questions (Q1-Q5, A1-A5)
  q1 TEXT,
  a1 TEXT,
  q2 TEXT,
  a2 TEXT,
  q3 TEXT,
  a3 TEXT,
  q4 TEXT,
  a4 TEXT,
  q5 TEXT,
  a5 TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Words - Vocabulary for reading practice
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word VARCHAR(255) NOT NULL,
  word_type VARCHAR(50), -- CVC, Blending, Silent Letter, etc.
  phonics_pattern VARCHAR(100),
  difficulty_level INTEGER DEFAULT 1,
  image_url TEXT,
  audio_url TEXT,
  usage_example TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. PROGRESS TRACKING (3 tables)
-- ============================================================================

-- User Progress - General activity progress
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(50), -- 'story', 'word', 'assignment'
  activity_id UUID,
  accuracy_score DECIMAL(5,2),
  completion_time INTEGER, -- seconds
  words_per_minute INTEGER,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading Progress - Detailed story reading tracking
CREATE TABLE reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES short_stories(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accuracy_score DECIMAL(5,2),
  fluency_wpm INTEGER,
  comprehension_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  total_words INTEGER,
  correct_words INTEGER,
  reading_time_seconds INTEGER,
  completed BOOLEAN DEFAULT false
);

-- Miscues - Reading error tracking
CREATE TABLE miscues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES short_stories(id) ON DELETE CASCADE,
  word_position INTEGER,
  expected_word VARCHAR(100),
  spoken_word VARCHAR(100),
  miscue_type VARCHAR(50), -- substitution, omission, insertion, etc.
  phonics_pattern VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. ACHIEVEMENTS (2 tables)
-- ============================================================================

-- Achievement Types - Defines all possible achievements
CREATE TABLE achievement_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_type VARCHAR(100) UNIQUE NOT NULL,
  achievement_title VARCHAR(255) NOT NULL,
  achievement_description TEXT,
  badge_icon TEXT,
  level_name VARCHAR(50),
  word_category VARCHAR(50),
  words_required INTEGER DEFAULT 0,
  points_required INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- User Achievements - Tracks earned achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) REFERENCES achievement_types(achievement_type),
  earned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- ============================================================================
-- 6. TASKS & ASSIGNMENTS (2 tables)
-- ============================================================================

-- Teacher Tasks - Assignments created by teachers
CREATE TABLE teacher_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50), -- 'story', 'word', 'test'
  content_id UUID, -- References story or word set
  test_category VARCHAR(50),
  due_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments - Individual student assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES teacher_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  score DECIMAL(5,2),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- ============================================================================
-- 7. NOTIFICATIONS (2 tables)
-- ============================================================================

-- Announcements - Teacher announcements to classroom
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications - System notifications to users
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50), -- 'achievement', 'task', 'announcement'
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User and Progress indexes
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_reading_progress_student_id ON reading_progress(student_id);

-- Classroom indexes
CREATE INDEX idx_classrooms_teacher_id ON classrooms(teacher_id);
CREATE INDEX idx_classroom_students_classroom_id ON classroom_students(classroom_id);
CREATE INDEX idx_classroom_students_student_id ON classroom_students(student_id);

-- Task indexes
CREATE INDEX idx_teacher_tasks_teacher_id ON teacher_tasks(teacher_id);
CREATE INDEX idx_teacher_tasks_classroom_id ON teacher_tasks(classroom_id);
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_task_id ON assignments(task_id);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_announcements_classroom_id ON announcements(classroom_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_phonics_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE miscues ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Example RLS Policies (simplified)

-- Students can view their own profile
CREATE POLICY "Students can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile during signup
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Teachers can view their classrooms
CREATE POLICY "Teachers can view own classrooms" ON classrooms
  FOR SELECT USING (auth.uid() = teacher_id);

-- Students can view their own progress
CREATE POLICY "Students can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Teachers can view progress of their students
CREATE POLICY "Teachers can view student progress" ON user_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE c.teacher_id = auth.uid()
      AND cs.student_id = user_progress.user_id
    )
  );

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total Core Tables: 18
-- 
-- 1. User Management (3): profiles, user_stats, user_phonics_progress
-- 2. Classroom Management (2): classrooms, classroom_students
-- 3. Content (2): short_stories, words
-- 4. Progress Tracking (3): user_progress, reading_progress, miscues
-- 5. Achievements (2): achievement_types, user_achievements
-- 6. Tasks (2): teacher_tasks, assignments
-- 7. Notifications (2): announcements, notifications
-- 8. Auth (1): auth.users (Supabase built-in)
-- ============================================================================
