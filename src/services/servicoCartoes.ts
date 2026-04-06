import { supabaseAdmin } from './supabase.node.js'
import { registrarAuditoria } from './servicoAuditoria.js'
import { obterNomeUsuario } from '../config/usuarios.js'
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
  usuarioId: string,
  usuarioEmail: string
): Promise<RespostaApi<Cartao>> {
  const usuarioNome = obterNomeUsuario(usuarioEmail)
  const { data, error } = await supabaseAdmin
    .from('cartoes')
    .insert({ ...dados, usuario_id: usuarioId, usuario_nome: usuarioNome })
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioEmail,
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
  usuarioId: string,
  usuarioEmail: string
): Promise<RespostaApi<Cartao>> {
  const { data, error } = await supabaseAdmin
    .from('cartoes')
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioEmail,
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
  usuarioId: string,
  usuarioEmail: string
): Promise<RespostaApi<null>> {
  // Soft delete — apenas desativa o cartão
  const { error } = await supabaseAdmin
    .from('cartoes')
    .update({ ativo: false, atualizado_em: new Date().toISOString() })
    .eq('id', id)

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioEmail,
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
  usuarioId: string,
  usuarioEmail: string
): Promise<RespostaApi<CompraCartao>> {
  const usuarioNome = obterNomeUsuario(usuarioEmail)
  const parcelas = Math.max(1, dados.parcelas ?? 1)
  const parcelaInicial = Math.max(1, dados.parcela_inicial ?? 1)
  const valorParcela = Number((dados.valor_total / parcelas).toFixed(2))

  const { data, error } = await supabaseAdmin
    .from('compras_cartao')
    .insert({
      cartao_id: dados.cartao_id,
      descricao: dados.descricao,
      categoria: dados.categoria,
      valor_total: dados.valor_total,
      data_compra: dados.data_compra ?? new Date().toISOString().split('T')[0],
      usuario_id: usuarioId,
      usuario_nome: usuarioNome,
      parcelas,
      parcela_atual: parcelaInicial,
      valor_parcela: valorParcela,
    })
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioEmail,
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
  usuarioId: string,
  usuarioEmail: string
): Promise<RespostaApi<CompraCartao>> {
  // Normalize fields - coerce empty numeric strings to undefined
  const normalized = { ...dados } as Record<string, any>

  // Remove parcelas_inicial before sending to DB - it's not a column
  const { parcela_inicial, ...dadosLimpos } = normalized

  const dbUpdate: Record<string, any> = { ...dadosLimpos, atualizado_em: new Date().toISOString() }

  // Garantir que parcelas nunca seja 0 ou inválido
  if (normalized.parcelas !== undefined) {
    const parsed = typeof normalized.parcelas === 'number' ? normalized.parcelas : parseInt(normalized.parcelas, 10)
    if (!isNaN(parsed) && parsed >= 1) {
      dbUpdate.parcelas = parsed
    } else {
      delete dbUpdate.parcelas
    }
  }

  // Recalcular valor_parcela se parcelas ou valor_total mudaram
  if (dbUpdate.valor_total !== undefined || dbUpdate.parcelas !== undefined) {
    // Buscar dados atuais para recalcular
    const { data: atual } = await supabaseAdmin
      .from('compras_cartao')
      .select('valor_total, parcelas')
      .eq('id', id)
      .single()

    const valorTotal = dbUpdate.valor_total !== undefined ? dbUpdate.valor_total : atual?.valor_total
    const totalParcelas = dbUpdate.parcelas !== undefined ? dbUpdate.parcelas : atual?.parcelas

    if (valorTotal != null && totalParcelas >= 1) {
      dbUpdate.valor_parcela = Number((valorTotal / totalParcelas).toFixed(2))
    }
  }

  // Map parcela_inicial to parcela_atual if provided and valid
  if (parcela_inicial) {
    const parsed = typeof parcela_inicial === 'number' ? parcela_inicial : parseInt(parcela_inicial, 10)
    if (!isNaN(parsed) && parsed >= 1) {
      dbUpdate.parcela_atual = parsed
    }
  }

  const { data, error } = await supabaseAdmin
    .from('compras_cartao')
    .update(dbUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioEmail,
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
  usuarioId: string,
  usuarioEmail: string
): Promise<RespostaApi<null>> {
  const { error } = await supabaseAdmin
    .from('compras_cartao')
    .delete()
    .eq('id', id)

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioEmail,
    usuarioId,
    acao: 'DELETAR',
    modulo: 'compras_cartao',
    registroId: id,
    descricao: `Compra deletada: ${id}`,
  })

  return respostaSucesso(null)
}