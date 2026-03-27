import { supabaseAdmin } from './supabase'
import { AcaoAuditoria, ModuloAuditoria } from '../types'

interface RegistrarAuditoriaParams {
  usuarioId: string
  acao: AcaoAuditoria
  modulo: ModuloAuditoria
  registroId: string
  descricao?: string
}

export async function registrarAuditoria({
  usuarioId,
  acao,
  modulo,
  registroId,
  descricao,
}: RegistrarAuditoriaParams): Promise<void> {
  const { error } = await supabaseAdmin
    .from('logs_auditoria')
    .insert({
      usuario_id: usuarioId,
      acao,
      modulo,
      registro_id: registroId,
      descricao,
    })

  if (error) {
    console.error('Erro ao registrar auditoria:', error.message)
  }
}