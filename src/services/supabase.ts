import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente público — usado no frontend (respeita as políticas de segurança RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin — usado apenas nos services do backend (acesso total)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)