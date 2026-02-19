import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hvoluoroogvbupaudcdw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2b2x1b3Jvb2d2YnVwYXVkY2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDk4OTYsImV4cCI6MjA4NzA4NTg5Nn0.yXrnbT-N6Ffya_o51npzwb5_0AxIxF2vYHdMeDPT0NE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
