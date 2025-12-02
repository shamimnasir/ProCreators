import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check if credentials are configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseUrl !== 'https://your-project.supabase.co' && 
         supabaseAnonKey && supabaseAnonKey !== 'your-anon-key-here'
}
