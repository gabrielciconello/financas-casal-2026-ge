import { supabaseAdmin } from './supabase.node.js'
import { AcaoAuditoria, ModuloAuditoria } from '../types/index.js'

interface RegistrarAuditoriaParams {
  usuarioId: string
  usuarioEmail: string
  acao: AcaoAuditoria
  modulo: ModuloAuditoria
  registroId: string
  descricao?: string
}

export async function registrarAuditoria({
  usuarioId,
  usuarioEmail,
  acao,
  modulo,
  registroId,
  descricao,
}: RegistrarAuditoriaParams): Promise<void> {
  const { obterNomeUsuario } = await import('../config/usuarios.js')
  const usuarioNome = obterNomeUsuario(usuarioEmail)

  const { error } = await supabaseAdmin
    .from('logs_auditoria')
    .insert({
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
      acao,
      modulo,
      registro_id: registroId,
      descricao,
    })

  if (error) {
    console.error('Erro ao registrar auditoria:', error.message)
  }
}