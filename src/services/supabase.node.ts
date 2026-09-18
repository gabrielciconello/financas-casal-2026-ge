import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})
