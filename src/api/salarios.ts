import { IncomingMessage, ServerResponse } from 'http'
import { verificarAutenticacao, RequisicaoAutenticada } from '../middleware/autenticacao'
import { lerBody } from '../utils/lerBody'
import { responderSucesso, responderErro, responderNaoEncontrado, responderMetodoNaoPermitido } from '../utils/responderHttp'
import { validar } from '../validators'
import { esquemaCriarSalario, esquemaAtualizarSalario } from '../validators/validadorSalarios'
import {
  buscarSalarios,
  buscarSalarioPorId,
  criarSalario,
  atualizarSalario,
  deletarSalario,
} from '../services/servicoSalarios'
import { supabaseAdmin } from '../services/supabase.node'

export default async function handlerSalarios(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const autenticado = await verificarAutenticacao(req as RequisicaoAutenticada, res)
  if (!autenticado) return

  const requisicao = req as RequisicaoAutenticada
  const usuarioId = requisicao.usuario!.id
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const partes = url.pathname.split('/').filter(Boolean)
  const pathname = url.pathname.replace(/\/$/, '')
  const segmentos = pathname.split('/').filter(Boolean)
  const id = segmentos.length >= 3 ? segmentos[segmentos.length - 1] : null

  if (req.method === 'GET' && !id) {
    const pagina = Number(url.searchParams.get('pagina')) || 1
    const limite = Number(url.searchParams.get('limite')) || 10
    const mes = url.searchParams.get('mes') ? Number(url.searchParams.get('mes')) : undefined
    const ano = url.searchParams.get('ano') ? Number(url.searchParams.get('ano')) : undefined
    const tipo = url.searchParams.get('tipo') ?? undefined

    const resultado = await buscarSalarios({ pagina, limite, mes, ano, tipo })

    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado)
  }

  if (req.method === 'GET' && id) {
    const resultado = await buscarSalarioPorId(id)

    if (resultado.erro) return responderErro(res, resultado.erro)
    if (!resultado.dados) return responderNaoEncontrado(res)
    return responderSucesso(res, resultado.dados)
  }

  if (req.method === 'POST' && !id) {
    const body = await lerBody(req)
    const validacao = validar(esquemaCriarSalario, body)

    if (!validacao.sucesso) {
      return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
    }

    const resultado = await criarSalario(validacao.dados!, usuarioId)

    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado.dados, 201)
  }

  if (req.method === 'PUT' && id) {
    const body = await lerBody(req)
    const validacao = validar(esquemaAtualizarSalario, body)

    if (!validacao.sucesso) {
      return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
    }

    const resultado = await atualizarSalario(id, validacao.dados!, usuarioId)

    if (resultado.erro) return responderErro(res, resultado.erro)
    if (!resultado.dados) return responderNaoEncontrado(res)
    return responderSucesso(res, resultado.dados)
  }

  if (req.method === 'DELETE' && id) {
    const resultado = await deletarSalario(id, usuarioId)

    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, { mensagem: 'Salário deletado com sucesso' })
  }

  return responderMetodoNaoPermitido(res)
}