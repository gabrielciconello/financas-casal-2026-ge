import { IncomingMessage, ServerResponse } from 'http'
import { supabase } from '../services/supabase.node.js'
import type { Usuario } from '../types/index.js'
import { NOMES_USUARIOS, obterNomeUsuario } from '../config/usuarios.js'

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

  const correspondencia = typeof authHeader === 'string'
    ? authHeader.match(/^Bearer\s+(\S+)$/i)
    : null

  if (!correspondencia) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      dados: null,
      erro: 'Token de autenticação não fornecido',
    }))
    return false
  }

  const token = correspondencia[1]
  let data
  let error
  try {
    const resposta = await supabase.auth.getUser(token)
    data = resposta.data
    error = resposta.error
  } catch {
    res.writeHead(503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      dados: null,
      erro: 'Serviço de autenticação temporariamente indisponível',
    }))
    return false
  }

  if (error || !data.user) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      dados: null,
      erro: 'Token inválido ou expirado',
    }))
    return false
  }

  const email = data.user.email?.trim().toLowerCase()
  if (!email || !NOMES_USUARIOS[email]) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      dados: null,
      erro: 'Usuário não autorizado para este sistema',
    }))
    return false
  }

  // O backend usa service role e, portanto, ignora RLS. A allowlist é essencial
  // para impedir que outro usuário do projeto Supabase enxergue os dados do casal.
  req.usuario = {
    id: data.user.id,
    email,
    nome: obterNomeUsuario(email),
  }

  return true
}
