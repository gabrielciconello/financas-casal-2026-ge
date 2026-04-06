import { supabaseAdmin } from './supabase.node.js'
import { registrarAuditoria } from './servicoAuditoria.js'
import {
  Meta,
  ContribuicaoMeta,
  CriarMetaDTO,
  AtualizarMetaDTO,
  CriarContribuicaoMetaDTO,
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

export async function buscarMetas(
  params: ParametrosPaginacao
): Promise<RespostaPaginada<Meta>> {
  const pagina = params.pagina ?? 1
  const limite = params.limite ?? 10
  const offset = calcularOffset(pagina, limite)

  const { data, error, count } = await supabaseAdmin
    .from('metas')
    .select('*', { count: 'exact' })
    .order('criado_em', { ascending: false })
    .range(offset, offset + limite - 1)

  if (error) return { dados: [], total: 0, pagina, limite, erro: error.message }
  return respostaPaginada(data ?? [], count ?? 0, pagina, limite)
}

export async function buscarMetaPorId(
  id: string
): Promise<RespostaApi<Meta>> {
  const { data, error } = await supabaseAdmin
    .from('metas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return respostaErro(error.message)
  return respostaSucesso(data)
}

export async function criarMeta(
  dados: CriarMetaDTO,
  usuarioId: string
): Promise<RespostaApi<Meta>> {
  const { data, error } = await supabaseAdmin
    .from('metas')
    .insert(dados)
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'CRIAR',
    modulo: 'metas',
    registroId: data.id,
    descricao: `Meta criada: ${dados.titulo} - R$ ${dados.valor_alvo}`,
  })

  return respostaSucesso(data)
}

export async function atualizarMeta(
  id: string,
  dados: AtualizarMetaDTO,
  usuarioId: string
): Promise<RespostaApi<Meta>> {
  const { data, error } = await supabaseAdmin
    .from('metas')
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'ATUALIZAR',
    modulo: 'metas',
    registroId: id,
    descricao: `Meta atualizada: ${id}`,
  })

  return respostaSucesso(data)
}

export async function deletarMeta(
  id: string,
  usuarioId: string
): Promise<RespostaApi<null>> {
  const { error } = await supabaseAdmin
    .from('metas')
    .delete()
    .eq('id', id)

  if (error) return respostaErro(error.message)

  await registrarAuditoria({
    usuarioId,
    acao: 'DELETAR',
    modulo: 'metas',
    registroId: id,
    descricao: `Meta deletada: ${id}`,
  })

  return respostaSucesso(null)
}

// ============================================
// CONTRIBUIÇÕES
// ============================================
export async function buscarContribuicoes(
  metaId: string,
  params: ParametrosPaginacao
): Promise<RespostaPaginada<ContribuicaoMeta>> {
  const pagina = params.pagina ?? 1
  const limite = params.limite ?? 10
  const offset = calcularOffset(pagina, limite)

  const { data, error, count } = await supabaseAdmin
    .from('contribuicoes_metas')
    .select('*', { count: 'exact' })
    .eq('meta_id', metaId)
    .order('data', { ascending: false })
    .range(offset, offset + limite - 1)

  if (error) return { dados: [], total: 0, pagina, limite, erro: error.message }
  return respostaPaginada(data ?? [], count ?? 0, pagina, limite)
}

export async function criarContribuicao(
  dados: CriarContribuicaoMetaDTO,
  usuarioId: string
): Promise<RespostaApi<ContribuicaoMeta>> {
  const { data, error } = await supabaseAdmin
    .from('contribuicoes_metas')
    .insert({ ...dados, usuario_id: usuarioId })
    .select()
    .single()

  if (error) return respostaErro(error.message)

  // Atualiza o valor atual da meta
  const meta = await buscarMetaPorId(dados.meta_id)
  if (meta.dados) {
    const novoValor = meta.dados.valor_atual + dados.valor
    const concluida = novoValor >= meta.dados.valor_alvo

    await supabaseAdmin
      .from('metas')
      .update({
        valor_atual: novoValor,
        concluida,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', dados.meta_id)
  }

  await registrarAuditoria({
    usuarioId,
    acao: 'CRIAR',
    modulo: 'contribuicoes_metas',
    registroId: data.id,
    descricao: `Contribuição de R$ ${dados.valor} na meta ${dados.meta_id}`,
  })

  return respostaSucesso(data)
}