import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xxxxx.supabase.co'
const supabaseAnonKey = 'your_anon_key_here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check if user is logged in
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Get session token for API calls
export async function getSessionToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}
