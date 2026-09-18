import { supabaseAdmin } from './supabase.node.js'
import { registrarAuditoria } from './servicoAuditoria.js'
import { obterNomeUsuario } from '../config/usuarios.js'
import type {
  SaldoTotal,
  CriarSaldoTotalDTO,
  AtualizarSaldoTotalDTO,
  RespostaApi,
  RespostaPaginada,
} from '../types/index.js'
import { respostaSucesso, respostaErro, respostaPaginada, calcularOffset } from '../utils/index.js'

export async function buscarSaldoTotal(
  pagina = 1,
  limite = 20
): Promise<RespostaPaginada<SaldoTotal>> {
  const offset = calcularOffset(pagina, limite)
  const { data, error, count } = await supabaseAdmin
    .from('saldo_total')
    .select('*', { count: 'exact' })
    .order('data', { ascending: false })
    .order('criado_em', { ascending: false })
    .range(offset, offset + limite - 1)

  if (error) return { dados: [], total: 0, pagina, limite, erro: error.message }
  return respostaPaginada(data ?? [], count ?? 0, pagina, limite)
}

export async function buscarSaldoTotalPorId(id: string): Promise<RespostaApi<SaldoTotal>> {
  const { data, error } = await supabaseAdmin
    .from('saldo_total')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return respostaErro(error.message)
  return respostaSucesso(data)
}

export async function buscarResumoSaldoTotal(): Promise<RespostaApi<{
  saldo_atual: number
  total_aportes: number
  total_retiradas: number
  movimentacoes: number
}>> {
  const { data, error, count } = await supabaseAdmin
    .from('saldo_total')
    .select('valor, tipo', { count: 'exact' })

  if (error) return respostaErro(error.message)

  let totalAportes = 0
  let totalRetiradas = 0
  for (const movimento of data ?? []) {
    if (movimento.tipo === 'aporte') totalAportes += Number(movimento.valor)
    else if (movimento.tipo === 'retirada') totalRetiradas += Number(movimento.valor)
  }

  return respostaSucesso({
    saldo_atual: totalAportes - totalRetiradas,
    total_aportes: totalAportes,
    total_retiradas: totalRetiradas,
    movimentacoes: count ?? data?.length ?? 0,
  })
}

export async function criarSaldoTotal(
  usuarioId: string,
  usuarioEmail: string,
  dto: CriarSaldoTotalDTO
): Promise<RespostaApi<SaldoTotal>> {
  const { data, error } = await supabaseAdmin
    .from('saldo_total')
    .insert({
      ...dto,
      usuario_id: usuarioId,
      usuario_nome: obterNomeUsuario(usuarioEmail),
      data: dto.data ?? new Date().toISOString().slice(0, 10),
    })
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    usuarioEmail,
    acao: 'CRIAR',
    modulo: 'saldo_total',
    registroId: data.id,
    descricao: `Movimentação do saldo criada: ${dto.descricao} - R$ ${dto.valor}`,
  })
  return respostaSucesso(data)
}

export async function atualizarSaldoTotal(
  id: string,
  dto: AtualizarSaldoTotalDTO,
  usuarioId: string,
  usuarioEmail: string
): Promise<RespostaApi<SaldoTotal>> {
  const { data, error } = await supabaseAdmin
    .from('saldo_total')
    .update({ ...dto, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) return respostaErro(error.message)
  if (!data) return { dados: null, erro: null }

  await registrarAuditoria({
    usuarioId,
    usuarioEmail,
    acao: 'ATUALIZAR',
    modulo: 'saldo_total',
    registroId: id,
    descricao: `Movimentação do saldo atualizada: ${id}`,
  })
  return respostaSucesso(data)
}

export async function deletarSaldoTotal(
  id: string,
  usuarioId: string,
  usuarioEmail: string
): Promise<RespostaApi<null>> {
  const { data, error } = await supabaseAdmin
    .from('saldo_total')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) return respostaErro(error.message)
  if (!data) return respostaErro('Registro não encontrado')

  await registrarAuditoria({
    usuarioId,
    usuarioEmail,
    acao: 'DELETAR',
    modulo: 'saldo_total',
    registroId: id,
    descricao: `Movimentação do saldo deletada: ${id}`,
  })
  return respostaSucesso(null)
}
