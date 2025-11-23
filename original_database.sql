-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Short_Stories (
  Story # bigint,
  Title text,
  Story Text text,
  Q1 text,
  A1 text,
  Q2 text,
  A2 text,
  Q3 text,
  A3 text,
  Q4 text,
  A4 text,
  Q5 text,
  A5 text,
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  estimated_reading_time integer,
  category character varying,
  created_by uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT Short_Stories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.Stories (
  story_name text,
  story_section text,
  question text,
  answer1 text,
  answer2 text,
  local_or_sum text,
  attribute text,
  ex_or_im text,
  ex_or_im2 text
);
CREATE TABLE public.Words (
  word text,
  category text,
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  pronunciation text,
  definition text,
  example_sentence text,
  created_by uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT Words_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.achievement_types (
  id integer NOT NULL DEFAULT nextval('achievement_types_id_seq'::regclass),
  level_name character varying NOT NULL,
  achievement_type character varying NOT NULL UNIQUE,
  achievement_title character varying NOT NULL,
  achievement_description text NOT NULL,
  badge_icon character varying NOT NULL,
  points_required integer NOT NULL,
  words_required integer NOT NULL,
  word_category character varying NOT NULL,
  sort_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievement_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_requests (
  id integer NOT NULL DEFAULT nextval('admin_requests_id_seq'::regclass),
  requester_id uuid,
  request_type character varying NOT NULL,
  request_data jsonb,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])),
  reviewed_by uuid,
  review_notes text,
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  CONSTRAINT admin_requests_pkey PRIMARY KEY (id),
  CONSTRAINT admin_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.profiles(id),
  CONSTRAINT admin_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.announcement_recipients (
  id integer NOT NULL DEFAULT nextval('announcement_recipients_id_seq'::regclass),
  announcement_id integer,
  user_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  CONSTRAINT announcement_recipients_pkey PRIMARY KEY (id),
  CONSTRAINT announcement_recipients_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id),
  CONSTRAINT announcement_recipients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.announcements (
  id integer NOT NULL DEFAULT nextval('announcements_id_seq'::regclass),
  classroom_id integer,
  title character varying NOT NULL,
  content text NOT NULL,
  priority character varying DEFAULT 'normal'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying]::text[])),
  is_class_wide boolean DEFAULT true,
  schedule character varying DEFAULT 'now'::character varying CHECK (schedule::text = ANY (ARRAY['now'::character varying, 'scheduled'::character varying]::text[])),
  scheduled_date timestamp with time zone,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_classroom_id_fkey FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id)
);
CREATE TABLE public.classroom_students (
  id integer NOT NULL DEFAULT nextval('classroom_students_id_seq'::regclass),
  classroom_id integer,
  student_id uuid,
  enrollment_date timestamp with time zone DEFAULT now(),
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'pending'::character varying]::text[])),
  CONSTRAINT classroom_students_pkey PRIMARY KEY (id),
  CONSTRAINT classroom_students_classroom_id_fkey FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id),
  CONSTRAINT classroom_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.classrooms (
  id integer NOT NULL DEFAULT nextval('classrooms_id_seq'::regclass),
  name character varying NOT NULL,
  class_code character varying NOT NULL UNIQUE,
  description text,
  teacher_id uuid NOT NULL,
  grade_level integer,
  subject character varying,
  school_year character varying,
  is_active boolean DEFAULT true,
  max_students integer DEFAULT 50,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT classrooms_pkey PRIMARY KEY (id),
  CONSTRAINT classrooms_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.miscue_summary_by_session (
  id integer NOT NULL DEFAULT nextval('miscue_summary_by_session_id_seq'::regclass),
  reading_session_id integer NOT NULL,
  user_id uuid NOT NULL,
  total_miscues integer DEFAULT 0,
  mispronunciations integer DEFAULT 0,
  omissions integer DEFAULT 0,
  substitutions integer DEFAULT 0,
  insertions integer DEFAULT 0,
  repetitions integer DEFAULT 0,
  transpositions integer DEFAULT 0,
  reversals integer DEFAULT 0,
  self_corrections integer DEFAULT 0,
  meaning_maintained_count integer DEFAULT 0,
  meaning_maintained_percentage numeric DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT miscue_summary_by_session_pkey PRIMARY KEY (id),
  CONSTRAINT miscue_summary_by_session_reading_session_id_fkey FOREIGN KEY (reading_session_id) REFERENCES public.reading_sessions(id),
  CONSTRAINT miscue_summary_by_session_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  recipient_id uuid,
  sender_id uuid,
  type character varying NOT NULL,
  title character varying NOT NULL,
  message text,
  related_id integer,
  related_type character varying,
  priority character varying DEFAULT 'normal'::character varying,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  user_id character varying NOT NULL DEFAULT ''::character varying UNIQUE,
  email character varying NOT NULL,
  full_name character varying,
  user_type character varying NOT NULL DEFAULT 'student'::character varying CHECK (user_type::text = ANY (ARRAY['admin'::character varying, 'teacher'::character varying, 'student'::character varying]::text[])),
  avatar_url text,
  bio text,
  phone_number character varying,
  date_of_birth date,
  grade_level integer,
  teacher_id uuid,
  is_active boolean DEFAULT true,
  notifications_enabled boolean DEFAULT true,
  sound_enabled boolean DEFAULT true,
  dark_mode boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.quiz_responses (
  id integer NOT NULL DEFAULT nextval('quiz_responses_id_seq'::regclass),
  assignment_id integer,
  story_number integer NOT NULL,
  question_number integer NOT NULL CHECK (question_number >= 1 AND question_number <= 5),
  user_answer text NOT NULL,
  points_earned integer DEFAULT 0,
  response_time integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_responses_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_responses_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.task_assignments(id)
);
CREATE TABLE public.reading_levels (
  id integer NOT NULL DEFAULT nextval('reading_levels_id_seq'::regclass),
  level_name character varying NOT NULL UNIQUE,
  level_order integer NOT NULL,
  words_required integer NOT NULL,
  word_category character varying NOT NULL,
  unlock_message text NOT NULL,
  features_unlocked ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  level_image character varying,
  CONSTRAINT reading_levels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reading_miscues (
  id integer NOT NULL DEFAULT nextval('reading_miscues_id_seq'::regclass),
  reading_session_id integer,
  user_id uuid,
  word_position integer NOT NULL,
  expected_word character varying NOT NULL,
  actual_reading character varying,
  miscue_type character varying NOT NULL CHECK (miscue_type::text = ANY (ARRAY['mispronunciation'::character varying, 'omission'::character varying, 'substitution'::character varying, 'insertion'::character varying, 'repetition'::character varying, 'transposition'::character varying, 'reversal'::character varying]::text[])),
  is_self_corrected boolean DEFAULT false,
  meaning_maintained boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  context text,
  CONSTRAINT reading_miscues_pkey PRIMARY KEY (id),
  CONSTRAINT reading_miscues_reading_session_id_fkey FOREIGN KEY (reading_session_id) REFERENCES public.reading_sessions(id),
  CONSTRAINT reading_miscues_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.reading_sessions (
  id integer NOT NULL DEFAULT nextval('reading_sessions_id_seq'::regclass),
  user_id uuid,
  content_type character varying NOT NULL CHECK (content_type::text = ANY (ARRAY['word'::character varying, 'story'::character varying]::text[])),
  content_id integer NOT NULL,
  session_duration integer,
  words_read integer,
  accuracy_rate numeric,
  reading_speed numeric,
  session_date timestamp with time zone DEFAULT now(),
  completion_percentage numeric DEFAULT 0.00,
  total_miscues integer DEFAULT 0,
  CONSTRAINT reading_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT reading_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.story_reading_analytics (
  id integer NOT NULL DEFAULT nextval('story_reading_analytics_id_seq'::regclass),
  session_id integer UNIQUE,
  user_id uuid,
  student_name character varying,
  story_number integer,
  words_read integer DEFAULT 0,
  completion_percentage numeric DEFAULT 0.00,
  accuracy_rate numeric DEFAULT 0.00,
  total_miscues integer DEFAULT 0,
  session_duration integer DEFAULT 0,
  reading_speed numeric DEFAULT 0.00,
  session_date timestamp with time zone DEFAULT now(),
  miscue_count integer DEFAULT 0,
  substitution_count integer DEFAULT 0,
  omission_count integer DEFAULT 0,
  insertion_count integer DEFAULT 0,
  repetition_count integer DEFAULT 0,
  self_corrected_count integer DEFAULT 0,
  teacher_notes text,
  teacher_rating integer CHECK (teacher_rating >= 1 AND teacher_rating <= 5),
  needs_attention boolean DEFAULT false,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT story_reading_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT story_reading_analytics_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.reading_sessions(id),
  CONSTRAINT story_reading_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.student_task_progress (
  id integer NOT NULL DEFAULT nextval('student_task_progress_id_seq'::regclass),
  assignment_id integer,
  status character varying DEFAULT 'assigned'::character varying CHECK (status::text = ANY (ARRAY['assigned'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'overdue'::character varying]::text[])),
  score integer,
  time_spent integer,
  attempts integer DEFAULT 0,
  submitted_at timestamp with time zone,
  feedback text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  max_score integer,
  percentage_score numeric,
  CONSTRAINT student_task_progress_pkey PRIMARY KEY (id),
  CONSTRAINT student_task_progress_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.task_assignments(id)
);
CREATE TABLE public.system_activities (
  id integer NOT NULL DEFAULT nextval('system_activities_id_seq'::regclass),
  user_id uuid,
  activity_type character varying NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_activities_pkey PRIMARY KEY (id),
  CONSTRAINT system_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.task_assignments (
  id integer NOT NULL DEFAULT nextval('task_assignments_id_seq'::regclass),
  task_id integer,
  user_id uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  due_date timestamp with time zone,
  CONSTRAINT task_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT task_assignments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.teacher_tasks(id),
  CONSTRAINT task_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.teacher_tasks (
  id integer NOT NULL DEFAULT nextval('teacher_tasks_id_seq'::regclass),
  teacher_id uuid NOT NULL,
  classroom_id integer,
  title character varying NOT NULL,
  description text,
  category character varying NOT NULL,
  subcategory character varying,
  priority character varying DEFAULT 'medium'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying]::text[])),
  due_date timestamp with time zone,
  instructions text,
  max_points integer DEFAULT 100,
  generation_mode character varying DEFAULT 'manual'::character varying CHECK (generation_mode::text = ANY (ARRAY['manual'::character varying, 'auto_generated'::character varying]::text[])),
  test_content jsonb,
  test_settings jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teacher_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_tasks_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id),
  CONSTRAINT teacher_tasks_classroom_id_fkey FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id)
);
CREATE TABLE public.user_achievements (
  id integer NOT NULL DEFAULT nextval('user_achievements_id_seq'::regclass),
  user_id uuid,
  achievement_type character varying NOT NULL,
  achievement_title character varying NOT NULL,
  achievement_description text,
  badge_icon character varying,
  points_earned integer DEFAULT 0,
  unlocked_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_phonics_progress (
  id integer NOT NULL DEFAULT nextval('user_phonics_progress_id_seq'::regclass),
  user_id uuid UNIQUE,
  cvc_words_read integer DEFAULT 0,
  blending_words_read integer DEFAULT 0,
  silent_letter_words_read integer DEFAULT 0,
  phonics_merger_words_read integer DEFAULT 0,
  sight_words_read integer DEFAULT 0,
  other_words_read integer DEFAULT 0,
  total_words_read integer DEFAULT 0,
  total_correct_words integer DEFAULT 0,
  total_miscues integer DEFAULT 0,
  cvc_accuracy numeric DEFAULT 0,
  blending_accuracy numeric DEFAULT 0,
  silent_letter_accuracy numeric DEFAULT 0,
  phonics_merger_accuracy numeric DEFAULT 0,
  sight_words_accuracy numeric DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_phonics_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_phonics_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_progress (
  id integer NOT NULL DEFAULT nextval('user_progress_id_seq'::regclass),
  user_id uuid,
  activity_type character varying NOT NULL,
  activity_id integer,
  completed boolean DEFAULT false,
  score integer,
  max_score integer,
  time_spent integer,
  attempts integer DEFAULT 1,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_stats (
  id integer NOT NULL DEFAULT nextval('user_stats_id_seq'::regclass),
  user_id uuid UNIQUE,
  current_reading_level integer DEFAULT 1,
  streak_days integer DEFAULT 0,
  last_activity timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_stats_pkey PRIMARY KEY (id),
  CONSTRAINT user_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);