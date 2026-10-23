import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** False when the Supabase variables are missing; the site then runs in guest-only mode. */
export const isSupabaseConfigured = Boolean(url && anonKey)

// Supabase Auth keeps the session (access + refresh token) in localStorage and refreshes it
// automatically. Passwords are never stored by VerifyIT.
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null
