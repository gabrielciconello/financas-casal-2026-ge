import { createClient } from '@supabase/supabase-js'

const eBackend = typeof process !== 'undefined' && process.env?.SUPABASE_URL

const supabaseUrl = eBackend
  ? process.env.SUPABASE_URL!
  : (import.meta as any).env.VITE_SUPABASE_URL

const supabaseAnonKey = eBackend
  ? process.env.SUPABASE_ANON_KEY!
  : (import.meta as any).env.VITE_SUPABASE_ANON_KEY

const supabaseServiceKey = eBackend
  ? process.env.SUPABASE_SERVICE_ROLE_KEY!
  : (import.meta as any).env.VITE_SUPABASE_ANON_KEY // frontend usa anon key

// Cliente público — usado no frontend e backend
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin — usado apenas no backend (API Routes)
// No frontend aponta para o mesmo cliente público para evitar múltiplas instâncias
export const supabaseAdmin = eBackend
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase