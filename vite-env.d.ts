/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string
  readonly VITE_GEMINI_API_KEY: string
}