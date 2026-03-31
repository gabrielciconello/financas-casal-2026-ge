import { useState, useCallback } from 'react'
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
  const { token } = useAuth()
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const requisitar = useCallback(async (
    url: string,
    opcoes: OpcoesRequisicao = {}
  ): Promise<T | null> => {
    setCarregando(true)
    setErro(null)

    try {
      const resposta = await fetch(`${BASE_URL}${url}`, {
        method: opcoes.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
      })

      const json = await resposta.json()

      if (!resposta.ok || json.erro) {
        setErro(json.erro ?? 'Erro desconhecido')
        return null
      }

      setDados(json.dados)
      return json.dados
    } catch {
      setErro('Erro de conexão com o servidor')
      return null
    } finally {
      setCarregando(false)
    }
  }, [token])

  return { dados, erro, carregando, requisitar }
}