import { IncomingMessage, ServerResponse } from 'http'
import { supabase } from '../services/supabase.node.js'
import type { Usuario } from '../types/index.js'

// Extende o IncomingMessage para carregar o usuário autenticado
export interface RequisicaoAutenticada extends IncomingMessage {
  usuario?: Usuario
  body?: any
}

export async function verificarAutenticacao(
  req: RequisicaoAutenticada,
  res: ServerResponse
): Promise<boolean> {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      dados: null,
      erro: 'Token de autenticação não fornecido',
    }))
    return false
  }

  const token = authHeader.split(' ')[1]

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      dados: null,
      erro: 'Token inválido ou expirado',
    }))
    return false
  }

  // Injeta o usuário autenticado na requisição
  req.usuario = {
    id: data.user.id,
    email: data.user.email ?? '',
  }

  return true
}