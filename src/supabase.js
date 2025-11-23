import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kmrhkkmwlmyttvqrmqlu.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttcmhra213bG15dHR2cXJtcWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTA5MTAsImV4cCI6MjA2NjM4NjkxMH0.R0PC_YmzVPm0drRuZTt7Tyj8VEkZUeaGioZb-09xEMo"
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
