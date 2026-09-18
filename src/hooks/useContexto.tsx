import React, { createContext, useCallback, useContext, useMemo, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../services/supabase.browser'
import { Usuario } from '../types'
import { obterNomeUsuario } from '../config/usuarios'

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
  const [tema, setTema] = useState<'claro' | 'escuro'>(() => {
    const temaSalvo = localStorage.getItem('tema')
    if (temaSalvo === 'claro' || temaSalvo === 'escuro') return temaSalvo
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
  })

  // Inicializa tema salvo
  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema === 'escuro' ? 'escuro' : '')
  }, [tema])

  // Inicializa sessão do Supabase
  useEffect(() => {
    let ativo = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ativo) return
      if (session?.user) {
        const email = session.user.email ?? ''
        setUsuario({ id: session.user.id, email, nome: obterNomeUsuario(email) })
        setToken(session.access_token)
      }
      setCarregando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, session) => {
      if (session?.user) {
        const email = session.user.email ?? ''
        setUsuario({ id: session.user.id, email, nome: obterNomeUsuario(email) })
        setToken(session.access_token)
      } else {
        setUsuario(null)
        setToken(null)
      }
    })

    return () => {
      ativo = false
      subscription.unsubscribe()
    }
  }, [])

  const entrar = useCallback(async (email: string, senha: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) return error.message
    return null
  }, [])

  const sair = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut()
  }, [])

  const alternarTema = useCallback(() => {
    setTema(temaAtual => {
      const novoTema = temaAtual === 'claro' ? 'escuro' : 'claro'
      localStorage.setItem('tema', novoTema)
      return novoTema
    })
  }, [])

  const valorAuth = useMemo(
    () => ({ usuario, token, carregando, entrar, sair }),
    [usuario, token, carregando, entrar, sair]
  )
  const valorTema = useMemo(() => ({ tema, alternarTema }), [tema, alternarTema])

  return (
    <ContextoAuth.Provider value={valorAuth}>
      <ContextoTema.Provider value={valorTema}>
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
