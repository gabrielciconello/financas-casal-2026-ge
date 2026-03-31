import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../services/supabase.browser'
import { Usuario } from '../types'

// ============================================
// CONTEXTO DE AUTENTICAÇÃO
// ============================================
interface ContextoAuth {
  usuario: Usuario | null
  token: string | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<string | null>
  sair: () => Promise<void>
}

const ContextoAuth = createContext<ContextoAuth>({} as ContextoAuth)

// ============================================
// CONTEXTO DE TEMA
// ============================================
interface ContextoTema {
  tema: 'claro' | 'escuro'
  alternarTema: () => void
}

const ContextoTema = createContext<ContextoTema>({} as ContextoTema)

// ============================================
// PROVIDER PRINCIPAL
// ============================================
export function ProvedorContexto({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'claro' | 'escuro'>('claro')

  // Inicializa tema salvo
  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema') as 'claro' | 'escuro' | null
    if (temaSalvo) {
      setTema(temaSalvo)
      document.documentElement.setAttribute('data-tema', temaSalvo === 'escuro' ? 'escuro' : '')
    }
  }, [])

  // Inicializa sessão do Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUsuario({ id: session.user.id, email: session.user.email ?? '' })
        setToken(session.access_token)
      }
      setCarregando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, session) => {
      if (session?.user) {
        setUsuario({ id: session.user.id, email: session.user.email ?? '' })
        setToken(session.access_token)
      } else {
        setUsuario(null)
        setToken(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function entrar(email: string, senha: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) return error.message
    return null
  }

  async function sair(): Promise<void> {
    await supabase.auth.signOut()
  }

  function alternarTema() {
    const novoTema = tema === 'claro' ? 'escuro' : 'claro'
    setTema(novoTema)
    localStorage.setItem('tema', novoTema)
    document.documentElement.setAttribute('data-tema', novoTema === 'escuro' ? 'escuro' : '')
  }

  return (
    <ContextoAuth.Provider value={{ usuario, token, carregando, entrar, sair }}>
      <ContextoTema.Provider value={{ tema, alternarTema }}>
        {children}
      </ContextoTema.Provider>
    </ContextoAuth.Provider>
  )
}

// ============================================
// HOOKS DE ACESSO AOS CONTEXTOS
// ============================================
export function useAuth() {
  return useContext(ContextoAuth)
}

export function useTema() {
  return useContext(ContextoTema)
}