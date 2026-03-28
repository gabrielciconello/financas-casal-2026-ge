import { supabaseAdmin } from './supabase'
import { registrarAuditoria } from './servicoAuditoria'
import {
  GastoFixo,
  GastoVariavel,
  CriarGastoFixoDTO,
  AtualizarGastoFixoDTO,
  CriarGastoVariavelDTO,
  AtualizarGastoVariavelDTO,
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

// ============================================
// GASTOS FIXOS
// ============================================
export async function buscarGastosFixos(
  params: ParametrosPaginacao & {
    mes?: number
    ano?: number
    status?: string
    categoria?: string
  }
): Promise<RespostaPaginada<GastoFixo>> {
  const pagina = params.pagina ?? 1
  const limite = params.limite ?? 10
  const offset = calcularOffset(pagina, limite)

  let consulta = supabaseAdmin
    .from('gastos_fixos')
    .select('*', { count: 'exact' })
    .order('dia_vencimento', { ascending: true })
    .range(offset, offset + limite - 1)

  if (params.mes) consulta = consulta.eq('mes', params.mes)
  if (params.ano) consulta = consulta.eq('ano', params.ano)
  if (params.status) consulta = consulta.eq('status', params.status)
  if (params.categoria) consulta = consulta.eq('categoria', params.categoria)

  const { data, error, count } = await consulta

  if (error) return { dados: [], total: 0, pagina, limite, erro: error.message }
  return respostaPaginada(data ?? [], count ?? 0, pagina, limite)
}

export async function buscarGastoFixoPorId(
  id: string
): Promise<RespostaApi<GastoFixo>> {
  const { data, error } = await supabaseAdmin
    .from('gastos_fixos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return respostaErro(error.message)
  return respostaSucesso(data)
}

export async function criarGastoFixo(
  dados: CriarGastoFixoDTO,
  usuarioId: string
): Promise<RespostaApi<GastoFixo>> {
  const { data, error } = await supabaseAdmin
    .from('gastos_fixos')
    .insert({ ...dados, usuario_id: usuarioId })
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'CRIAR',
    modulo: 'gastos_fixos',
    registroId: data.id,
    descricao: `Gasto fixo criado: ${dados.descricao} - R$ ${dados.valor}`,
  })

  return respostaSucesso(data)
}

export async function atualizarGastoFixo(
  id: string,
  dados: AtualizarGastoFixoDTO,
  usuarioId: string
): Promise<RespostaApi<GastoFixo>> {
  const { data, error } = await supabaseAdmin
    .from('gastos_fixos')
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'ATUALIZAR',
    modulo: 'gastos_fixos',
    registroId: id,
    descricao: `Gasto fixo atualizado: ${id}`,
  })

  return respostaSucesso(data)
}

export async function deletarGastoFixo(
  id: string,
  usuarioId: string
): Promise<RespostaApi<null>> {
  const { error } = await supabaseAdmin
    .from('gastos_fixos')
    .delete()
    .eq('id', id)

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'DELETAR',
    modulo: 'gastos_fixos',
    registroId: id,
    descricao: `Gasto fixo deletado: ${id}`,
  })

  return respostaSucesso(null)
}

// ============================================
// GASTOS VARIÁVEIS
// ============================================
export async function buscarGastosVariaveis(
  params: ParametrosPaginacao & {
    mes?: number
    ano?: number
    categoria?: string
  }
): Promise<RespostaPaginada<GastoVariavel>> {
  const pagina = params.pagina ?? 1
  const limite = params.limite ?? 10
  const offset = calcularOffset(pagina, limite)

  let consulta = supabaseAdmin
    .from('gastos_variaveis')
    .select('*', { count: 'exact' })
    .order('criado_em', { ascending: false })
    .range(offset, offset + limite - 1)

  if (params.mes) consulta = consulta.eq('mes', params.mes)
  if (params.ano) consulta = consulta.eq('ano', params.ano)
  if (params.categoria) consulta = consulta.eq('categoria', params.categoria)

  const { data, error, count } = await consulta

  if (error) return { dados: [], total: 0, pagina, limite, erro: error.message }
  return respostaPaginada(data ?? [], count ?? 0, pagina, limite)
}

export async function buscarGastoVariavelPorId(
  id: string
): Promise<RespostaApi<GastoVariavel>> {
  const { data, error } = await supabaseAdmin
    .from('gastos_variaveis')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return respostaErro(error.message)
  return respostaSucesso(data)
}

export async function criarGastoVariavel(
  dados: CriarGastoVariavelDTO,
  usuarioId: string
): Promise<RespostaApi<GastoVariavel>> {
  const { data, error } = await supabaseAdmin
    .from('gastos_variaveis')
    .insert({ ...dados, usuario_id: usuarioId })
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'CRIAR',
    modulo: 'gastos_variaveis',
    registroId: data.id,
    descricao: `Gasto variável criado: ${dados.descricao}`,
  })

  return respostaSucesso(data)
}

export async function atualizarGastoVariavel(
  id: string,
  dados: AtualizarGastoVariavelDTO,
  usuarioId: string
): Promise<RespostaApi<GastoVariavel>> {
  const { data, error } = await supabaseAdmin
    .from('gastos_variaveis')
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'ATUALIZAR',
    modulo: 'gastos_variaveis',
    registroId: id,
    descricao: `Gasto variável atualizado: ${id}`,
  })

  return respostaSucesso(data)
}

export async function deletarGastoVariavel(
  id: string,
  usuarioId: string
): Promise<RespostaApi<null>> {
  const { error } = await supabaseAdmin
    .from('gastos_variaveis')
    .delete()
    .eq('id', id)

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'DELETAR',
    modulo: 'gastos_variaveis',
    registroId: id,
    descricao: `Gasto variável deletado: ${id}`,
  })

  return respostaSucesso(null)
}