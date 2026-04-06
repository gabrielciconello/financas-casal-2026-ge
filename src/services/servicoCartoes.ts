import { supabaseAdmin } from './supabase.node.js'
import { registrarAuditoria } from './servicoAuditoria.js'
import {
  Cartao,
  CompraCartao,
  CriarCartaoDTO,
  AtualizarCartaoDTO,
  CriarCompraCartaoDTO,
  AtualizarCompraCartaoDTO,
  RespostaApi,
  RespostaPaginada,
  ParametrosPaginacao,
} from '../types/index.js'
import {
  respostaSucesso,
  respostaErro,
  respostaPaginada,
  calcularOffset,
} from '../utils/index.js'

// ============================================
// CARTÕES
// ============================================
export async function buscarCartoes(
  params: ParametrosPaginacao
): Promise<RespostaPaginada<Cartao>> {
  const pagina = params.pagina ?? 1
  const limite = params.limite ?? 10
  const offset = calcularOffset(pagina, limite)

  const { data, error, count } = await supabaseAdmin
    .from('cartoes')
    .select('*', { count: 'exact' })
    .eq('ativo', true)
    .order('criado_em', { ascending: false })
    .range(offset, offset + limite - 1)

  if (error) return { dados: [], total: 0, pagina, limite, erro: error.message }
  return respostaPaginada(data ?? [], count ?? 0, pagina, limite)
}

export async function buscarCartaoPorId(
  id: string
): Promise<RespostaApi<Cartao>> {
  const { data, error } = await supabaseAdmin
    .from('cartoes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return respostaErro(error.message)
  return respostaSucesso(data)
}

export async function criarCartao(
  dados: CriarCartaoDTO,
  usuarioId: string
): Promise<RespostaApi<Cartao>> {
  const { data, error } = await supabaseAdmin
    .from('cartoes')
    .insert({ ...dados, usuario_id: usuarioId })
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'CRIAR',
    modulo: 'cartoes',
    registroId: data.id,
    descricao: `Cartão criado: ${dados.nome} - Limite R$ ${dados.limite}`,
  })

  return respostaSucesso(data)
}

export async function atualizarCartao(
  id: string,
  dados: AtualizarCartaoDTO,
  usuarioId: string
): Promise<RespostaApi<Cartao>> {
  const { data, error } = await supabaseAdmin
    .from('cartoes')
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'ATUALIZAR',
    modulo: 'cartoes',
    registroId: id,
    descricao: `Cartão atualizado: ${id}`,
  })

  return respostaSucesso(data)
}

export async function deletarCartao(
  id: string,
  usuarioId: string
): Promise<RespostaApi<null>> {
  // Soft delete — apenas desativa o cartão
  const { error } = await supabaseAdmin
    .from('cartoes')
    .update({ ativo: false, atualizado_em: new Date().toISOString() })
    .eq('id', id)

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'DELETAR',
    modulo: 'cartoes',
    registroId: id,
    descricao: `Cartão desativado: ${id}`,
  })

  return respostaSucesso(null)
}

// ============================================
// COMPRAS DO CARTÃO
// ============================================
export async function buscarComprasCartao(
  params: ParametrosPaginacao & {
    cartaoId?: string
    mes?: number
    ano?: number
  }
): Promise<RespostaPaginada<CompraCartao>> {
  const pagina = params.pagina ?? 1
  const limite = params.limite ?? 10
  const offset = calcularOffset(pagina, limite)

  let consulta = supabaseAdmin
    .from('compras_cartao')
    .select('*', { count: 'exact' })
    .order('data_compra', { ascending: false })
    .range(offset, offset + limite - 1)

  if (params.cartaoId) consulta = consulta.eq('cartao_id', params.cartaoId)

  const { data, error, count } = await consulta

  if (error) return { dados: [], total: 0, pagina, limite, erro: error.message }
  return respostaPaginada(data ?? [], count ?? 0, pagina, limite)
}

export async function criarCompraCartao(
  dados: CriarCompraCartaoDTO,
  usuarioId: string
): Promise<RespostaApi<CompraCartao>> {
  const parcelas = dados.parcelas ?? 1
  const valorParcela = Number((dados.valor_total / parcelas).toFixed(2))

  const { data, error } = await supabaseAdmin
    .from('compras_cartao')
    .insert({
      ...dados,
      usuario_id: usuarioId,
      parcelas,
      parcela_atual: 1,
      valor_parcela: valorParcela,
    })
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'CRIAR',
    modulo: 'compras_cartao',
    registroId: data.id,
    descricao: `Compra criada: ${dados.descricao} - R$ ${dados.valor_total} em ${parcelas}x`,
  })

  return respostaSucesso(data)
}

export async function atualizarCompraCartao(
  id: string,
  dados: AtualizarCompraCartaoDTO,
  usuarioId: string
): Promise<RespostaApi<CompraCartao>> {
  const { data, error } = await supabaseAdmin
    .from('compras_cartao')
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'ATUALIZAR',
    modulo: 'compras_cartao',
    registroId: id,
    descricao: `Compra atualizada: ${id}`,
  })

  return respostaSucesso(data)
}

export async function deletarCompraCartao(
  id: string,
  usuarioId: string
): Promise<RespostaApi<null>> {
  const { error } = await supabaseAdmin
    .from('compras_cartao')
    .delete()
    .eq('id', id)

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'DELETAR',
    modulo: 'compras_cartao',
    registroId: id,
    descricao: `Compra deletada: ${id}`,
  })

  return respostaSucesso(null)
}