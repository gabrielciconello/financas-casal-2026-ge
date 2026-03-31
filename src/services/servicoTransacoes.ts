import { supabaseAdmin } from './supabase.node'
import { registrarAuditoria } from './servicoAuditoria'
import {
  Transacao,
  CriarTransacaoDTO,
  AtualizarTransacaoDTO,
  RespostaApi,
  RespostaPaginada,
  ParametrosPaginacao,
} from '../types'
import {
  respostaSucesso,
  respostaErro,
  respostaPaginada,
  calcularOffset,
} from '../utils'

// Buscar todas as transações com paginação e filtros
export async function buscarTransacoes(
  params: ParametrosPaginacao & {
    mes?: number
    ano?: number
    tipo?: string
    categoria?: string
    status?: string
    usuarioId?: string
  }
): Promise<RespostaPaginada<Transacao>> {
  const pagina = params.pagina ?? 1
  const limite = params.limite ?? 10
  const offset = calcularOffset(pagina, limite)

  let consulta = supabaseAdmin
    .from('transacoes')
    .select('*', { count: 'exact' })
    .order('data', { ascending: false })
    .range(offset, offset + limite - 1)

  if (params.mes) consulta = consulta.eq('mes', params.mes)
  if (params.ano) consulta = consulta.eq('ano', params.ano)
  if (params.tipo) consulta = consulta.eq('tipo', params.tipo)
  if (params.categoria) consulta = consulta.eq('categoria', params.categoria)
  if (params.status) consulta = consulta.eq('status', params.status)
  if (params.usuarioId) consulta = consulta.eq('usuario_id', params.usuarioId)

  const { data, error, count } = await consulta

  if (error) return { dados: [], total: 0, pagina, limite, erro: error.message }

  return respostaPaginada(data ?? [], count ?? 0, pagina, limite)
}

// Buscar uma transação por ID
export async function buscarTransacaoPorId(
  id: string
): Promise<RespostaApi<Transacao>> {
  const { data, error } = await supabaseAdmin
    .from('transacoes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return respostaErro(error.message)
  return respostaSucesso(data)
}

// Criar transação
export async function criarTransacao(
  dados: CriarTransacaoDTO,
  usuarioId: string
): Promise<RespostaApi<Transacao>> {
  const { data, error } = await supabaseAdmin
    .from('transacoes')
    .insert({ ...dados, usuario_id: usuarioId })
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'CRIAR',
    modulo: 'transacoes',
    registroId: data.id,
    descricao: `Transação criada: ${dados.descricao} - R$ ${dados.valor}`,
  })

  return respostaSucesso(data)
}

// Atualizar transação
export async function atualizarTransacao(
  id: string,
  dados: AtualizarTransacaoDTO,
  usuarioId: string
): Promise<RespostaApi<Transacao>> {
  const { data, error } = await supabaseAdmin
    .from('transacoes')
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'ATUALIZAR',
    modulo: 'transacoes',
    registroId: id,
    descricao: `Transação atualizada: ${id}`,
  })

  return respostaSucesso(data)
}

// Deletar transação
export async function deletarTransacao(
  id: string,
  usuarioId: string
): Promise<RespostaApi<null>> {
  const { error } = await supabaseAdmin
    .from('transacoes')
    .delete()
    .eq('id', id)

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'DELETAR',
    modulo: 'transacoes',
    registroId: id,
    descricao: `Transação deletada: ${id}`,
  })

  return respostaSucesso(null)
}