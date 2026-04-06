import { IncomingMessage, ServerResponse } from 'http'
import { verificarAutenticacao, RequisicaoAutenticada } from '../middleware/autenticacao.js'
import { lerBody } from '../utils/lerBody.js'
import { aplicarCors } from '../utils/cors.js'
import {
  responderSucesso, responderErro,
  responderNaoEncontrado, responderMetodoNaoPermitido,
} from '../utils/responderHttp.js'
import { validar } from '../validators/index.js'
import { esquemaCriarGastoFixo, esquemaAtualizarGastoFixo } from '../validators/validadorGastos.js'
import {
  buscarGastosFixos, buscarGastoFixoPorId,
  criarGastoFixo, atualizarGastoFixo, deletarGastoFixo,
} from '../services/servicoGastos.js'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  aplicarCors(res)
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const autenticado = await verificarAutenticacao(req as RequisicaoAutenticada, res)
  if (!autenticado) return

  const requisicao = req as RequisicaoAutenticada
  const usuarioId = requisicao.usuario!.id
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const segmentos = url.pathname.split('/').filter(Boolean)
  const id = segmentos.length >= 4 ? segmentos[segmentos.length - 1] : null

  if (req.method === 'GET' && !id) {
    const pagina = Number(url.searchParams.get('pagina')) || 1
    const limite = Number(url.searchParams.get('limite')) || 10
    const mes = url.searchParams.get('mes') ? Number(url.searchParams.get('mes')) : undefined
    const ano = url.searchParams.get('ano') ? Number(url.searchParams.get('ano')) : undefined
    const status = url.searchParams.get('status') ?? undefined
    const categoria = url.searchParams.get('categoria') ?? undefined

    const resultado = await buscarGastosFixos({ pagina, limite, mes, ano, status, categoria })
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado)
  }

  if (req.method === 'GET' && id) {
    const resultado = await buscarGastoFixoPorId(id)
    if (resultado.erro) return responderErro(res, resultado.erro)
    if (!resultado.dados) return responderNaoEncontrado(res)
    return responderSucesso(res, resultado.dados)
  }

  if (req.method === 'POST' && !id) {
    const body = await lerBody(req)
    const validacao = validar(esquemaCriarGastoFixo, body)
    if (!validacao.sucesso) return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
    const resultado = await criarGastoFixo(validacao.dados!, usuarioId)
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado.dados, 201)
  }

  if (req.method === 'PUT' && id) {
    const body = await lerBody(req)
    const validacao = validar(esquemaAtualizarGastoFixo, body)
    if (!validacao.sucesso) return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
    const resultado = await atualizarGastoFixo(id, validacao.dados!, usuarioId)
    if (resultado.erro) return responderErro(res, resultado.erro)
    if (!resultado.dados) return responderNaoEncontrado(res)
    return responderSucesso(res, resultado.dados)
  }

  if (req.method === 'DELETE' && id) {
    const resultado = await deletarGastoFixo(id, usuarioId)
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, { mensagem: 'Gasto fixo deletado com sucesso' })
  }

  return responderMetodoNaoPermitido(res)
}