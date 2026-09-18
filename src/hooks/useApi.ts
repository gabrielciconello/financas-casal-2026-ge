import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase.browser'
import { useAuth } from './useContexto'

interface OpcoesRequisicao {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: object
}

interface ResultadoApi<T> {
  dados: T | null
  erro: string | null
  carregando: boolean
  requisitar: (url: string, opcoes?: OpcoesRequisicao) => Promise<T | null>
}

// Vite usa import.meta.env, Node usa process.env
const BASE_URL = ''

export function useApi<T = any>(): ResultadoApi<T> {
  const { token: tokenContexto } = useAuth()
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const montadoRef = useRef(true)
  const requisicoesAtivasRef = useRef(0)
  const ultimaRequisicaoRef = useRef(0)

  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
    }
  }, [])

  async function obterToken(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getSession()
      return data.session?.access_token ?? null
    } catch {
      return null
    }
  }

  const requisitar = useCallback(async (
    url: string,
    opcoes: OpcoesRequisicao = {}
  ): Promise<T | null> => {
    const idRequisicao = ++ultimaRequisicaoRef.current
    requisicoesAtivasRef.current += 1
    if (montadoRef.current) {
      setCarregando(true)
      setErro(null)
    }

    const token = tokenContexto ?? await obterToken()

    if (!token) {
      if (montadoRef.current && idRequisicao === ultimaRequisicaoRef.current) {
        setErro('Sua sessão expirou. Entre novamente para continuar.')
      }
      requisicoesAtivasRef.current -= 1
      if (montadoRef.current && requisicoesAtivasRef.current === 0) setCarregando(false)
      return null
    }

    try {
      const resposta = await fetch(`${BASE_URL}${url}`, {
        method: opcoes.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
      })

      const texto = await resposta.text()
      let json: any = {}

      if (texto) {
        try {
          json = JSON.parse(texto)
        } catch {
          throw new Error('Resposta inválida do servidor')
        }
      }

      if (!resposta.ok || json.erro) {
        if (montadoRef.current && idRequisicao === ultimaRequisicaoRef.current) {
          setErro(json.erro ?? `Não foi possível concluir a solicitação (${resposta.status})`)
        }
        return null
      }

      const resultado = (json.dados ?? null) as T | null
      if (montadoRef.current && idRequisicao === ultimaRequisicaoRef.current) {
        setDados(resultado)
      }
      return resultado
    } catch (causa) {
      if (montadoRef.current && idRequisicao === ultimaRequisicaoRef.current) {
        setErro(causa instanceof Error && causa.message === 'Resposta inválida do servidor'
          ? causa.message
          : 'Erro de conexão com o servidor')
      }
      return null
    } finally {
      requisicoesAtivasRef.current = Math.max(0, requisicoesAtivasRef.current - 1)
      if (montadoRef.current && requisicoesAtivasRef.current === 0) setCarregando(false)
    }
  }, [tokenContexto])

  return { dados, erro, carregando, requisitar }
}
