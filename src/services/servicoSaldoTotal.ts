import { supabaseAdmin } from './supabase.node.js'
import { obterNomeUsuario } from '../config/usuarios.js'
import {
  SaldoTotal,
  CriarSaldoTotalDTO,
  AtualizarSaldoTotalDTO,
  RespostaApi,
  RespostaPaginada,
} from '../types/index.js'
import {
  respostaSucesso,
  respostaErro,
  respostaPaginada,
  calcularOffset,
} from '../utils/index.js'

export async function buscarSaldoTotal(
  usuarioId: string,
  pagina: number = 1,
  limite: number = 20
): Promise<RespostaPaginada<SaldoTotal>> {
  const offset = calcularOffset(pagina, limite)

  const { data, error, count } = await supabaseAdmin
    .from('saldo_total')
    .select('*', { count: 'exact' })
    .eq('usuario_id', usuarioId)
    .order('data', { ascending: false })
    .range(offset, offset + limite - 1)

  if (error) return respostaErro(error.message)
  return respostaPaginada(data ?? [], count ?? 0, pagina, limite)
}

export async function buscarResumoSaldoTotal(
  usuarioId: string
): Promise<RespostaApi<{ saldo_atual: number; total_aportes: number; total_retiradas: number; movimentacoes: number }>> {
  const { data, error } = await supabaseAdmin
    .from('saldo_total')
    .select('valor, tipo')
    .eq('usuario_id', usuarioId)

  if (error) return respostaErro(error.message)

  let totalAportes = 0
  let totalRetiradas = 0
  for (const m of data ?? []) {
    if (m.tipo === 'aporte') totalAportes += Number(m.valor)
    else totalRetiradas += Number(m.valor)
  }

  return respostaSucesso({
    saldo_atual: totalAportes - totalRetiradas,
    total_aportes: totalAportes,
    total_retiradas: totalRetiradas,
    movimentacoes: data?.length ?? 0,
  })
}

export async function criarSaldoTotal(
  usuarioId: string,
  dto: CriarSaldoTotalDTO
): Promise<RespostaApi<SaldoTotal>> {
  const nomeUsuario = obterNomeUsuario(usuarioId)
  const hoje = new Date().toISOString().split('T')[0]

  const { data, error } = await supabaseAdmin
    .from('saldo_total')
    .insert({
      usuario_id: usuarioId,
      usuario_nome: nomeUsuario,
      descricao: dto.descricao,
      valor: dto.valor,
      tipo: dto.tipo,
      data: dto.data ?? hoje,
    })
    .select()
    .single()

  if (error) return respostaErro(error.message)
  return respostaSucesso(data)
}

export async function atualizarSaldoTotal(
  usuarioId: string,
  id: string,
  dto: AtualizarSaldoTotalDTO
): Promise<RespostaApi<SaldoTotal>> {
  const atualizar: Record<string, any> = {}
  if (dto.descricao) atualizar.descricao = dto.descricao
  if (dto.valor !== undefined) atualizar.valor = dto.valor
  if (dto.tipo) atualizar.tipo = dto.tipo
  if (dto.data) atualizar.data = dto.data
  atualizar.atualizado_em = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('saldo_total')
    .update(atualizar)
    .eq('id', id)
    .eq('usuario_id', usuarioId)
    .select()
    .single()

  if (error) return respostaErro(error.message)
  return respostaSucesso(data)
}

export async function deletarSaldoTotal(
  usuarioId: string,
  id: string
): Promise<RespostaApi<void>> {
  const { error } = await supabaseAdmin
    .from('saldo_total')
    .delete()
    .eq('id', id)
    .eq('usuario_id', usuarioId)

  if (error) return respostaErro(error.message)
  return respostaSucesso(undefined)
}
