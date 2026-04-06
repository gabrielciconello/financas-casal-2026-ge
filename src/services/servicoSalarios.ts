import { supabaseAdmin } from './supabase.node'
import { registrarAuditoria } from './servicoAuditoria.js'
import {
  Salario,
  CriarSalarioDTO,
  AtualizarSalarioDTO,
  RespostaApi,
  RespostaPaginada,
  ParametrosPaginacao,
} from '../types.js'
import {
  respostaSucesso,
  respostaErro,
  respostaPaginada,
  calcularOffset,
} from '../utils.js'

export async function buscarSalarios(
  params: ParametrosPaginacao & {
    mes?: number
    ano?: number
    tipo?: string
    usuarioId?: string
  }
): Promise<RespostaPaginada<Salario>> {
  const pagina = params.pagina ?? 1
  const limite = params.limite ?? 10
  const offset = calcularOffset(pagina, limite)

  let consulta = supabaseAdmin
    .from('salarios')
    .select('*', { count: 'exact' })
    .order('data_esperada', { ascending: false })
    .range(offset, offset + limite - 1)

  if (params.mes) consulta = consulta.eq('mes', params.mes)
  if (params.ano) consulta = consulta.eq('ano', params.ano)
  if (params.tipo) consulta = consulta.eq('tipo', params.tipo)
  if (params.usuarioId) consulta = consulta.eq('usuario_id', params.usuarioId)

  const { data, error, count } = await consulta

  if (error) return { dados: [], total: 0, pagina, limite, erro: error.message }
  return respostaPaginada(data ?? [], count ?? 0, pagina, limite)
}

export async function buscarSalarioPorId(
  id: string
): Promise<RespostaApi<Salario>> {
  const { data, error } = await supabaseAdmin
    .from('salarios')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return respostaErro(error.message)
  return respostaSucesso(data)
}

export async function criarSalario(
  dados: CriarSalarioDTO,
  usuarioId: string
): Promise<RespostaApi<Salario>> {
  const { data, error } = await supabaseAdmin
    .from('salarios')
    .insert({ ...dados, usuario_id: usuarioId })
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'CRIAR',
    modulo: 'salarios',
    registroId: data.id,
    descricao: `Salário criado: ${dados.descricao} - R$ ${dados.valor_esperado}`,
  })

  return respostaSucesso(data)
}

export async function atualizarSalario(
  id: string,
  dados: AtualizarSalarioDTO,
  usuarioId: string
): Promise<RespostaApi<Salario>> {
  const { data, error } = await supabaseAdmin
    .from('salarios')
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'ATUALIZAR',
    modulo: 'salarios',
    registroId: id,
    descricao: `Salário atualizado: ${id}`,
  })

  return respostaSucesso(data)
}

export async function deletarSalario(
  id: string,
  usuarioId: string
): Promise<RespostaApi<null>> {
  const { error } = await supabaseAdmin
    .from('salarios')
    .delete()
    .eq('id', id)

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'DELETAR',
    modulo: 'salarios',
    registroId: id,
    descricao: `Salário deletado: ${id}`,
  })

  return respostaSucesso(null)
}