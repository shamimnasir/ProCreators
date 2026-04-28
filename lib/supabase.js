import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if credentials are configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseUrl !== 'https://your-project.supabase.co' && 
         supabaseAnonKey && 
         supabaseAnonKey !== 'your-anon-key-here'
}

// Create a mock client that returns null for all operations when not configured
const createMockClient = () => ({
  from: () => ({
    select: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
  }),
  auth: {
    signIn: () => Promise.resolve({ user: null, session: null, error: { message: 'Supabase not configured' } }),
    signUp: () => Promise.resolve({ user: null, session: null, error: { message: 'Supabase not configured' } }),
    signOut: () => Promise.resolve({ error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      download: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
})

// Only create real client if configured, otherwise use mock
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient()

// Log warning if not configured (only in development)
if (!isSupabaseConfigured() && process.env.NODE_ENV === 'development') {
  console.warn('[Supabase] Not configured - using mock client. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env to enable.')
}
