import { IncomingMessage, ServerResponse } from 'http'
import { verificarAutenticacao, RequisicaoAutenticada } from '../middleware/autenticacao.js'
import { lerBody } from '../utils/lerBody.js'
import {
  responderSucesso,
  responderErro,
  responderNaoEncontrado,
  responderMetodoNaoPermitido,
  tratarErrosHttp,
} from '../utils/responderHttp.js'
import {
  buscarSaldoTotal,
  buscarSaldoTotalPorId,
  buscarResumoSaldoTotal,
  criarSaldoTotal,
  atualizarSaldoTotal,
  deletarSaldoTotal,
} from '../services/servicoSaldoTotal.js'
import { aplicarCors } from '../utils/cors.js'
import { validar } from '../validators/index.js'
import { esquemaCriarSaldoTotal, esquemaAtualizarSaldoTotal } from '../validators/validadorSaldoTotal.js'
import { normalizarPaginacao } from '../utils/index.js'

async function handlerSaldoTotal(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  aplicarCors(res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const autenticado = await verificarAutenticacao(req as RequisicaoAutenticada, res)
  if (!autenticado) return

  const requisicao = req as RequisicaoAutenticada
  const usuarioId = requisicao.usuario!.id
  const usuarioEmail = requisicao.usuario!.email
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const pathname = url.pathname.replace(/\/$/, '')
  const segmentos = pathname.split('/').filter(Boolean)
  const id = segmentos.length >= 3 ? segmentos[2] : null

  if (req.method === 'GET' && id === 'resumo') {
    const resultado = await buscarResumoSaldoTotal()
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado.dados)
  }

  if (req.method === 'GET' && !id) {
    const { pagina, limite } = normalizarPaginacao(
      url.searchParams.get('pagina'), url.searchParams.get('limite'), 20
    )
    const resultado = await buscarSaldoTotal(pagina, limite)
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado)
  }

  if (req.method === 'GET' && id) {
    const resultado = await buscarSaldoTotalPorId(id)
    if (resultado.erro) return responderErro(res, resultado.erro)
    if (!resultado.dados) return responderNaoEncontrado(res)
    return responderSucesso(res, resultado.dados)
  }

  if (req.method === 'POST' && !id) {
    const body = await lerBody(req)
    const validacao = validar(esquemaCriarSaldoTotal, body)
    if (!validacao.sucesso) {
      return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
    }
    const resultado = await criarSaldoTotal(usuarioId, usuarioEmail, validacao.dados!)
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado.dados, 201)
  }

  if (req.method === 'PUT' && id) {
    const body = await lerBody(req)
    const validacao = validar(esquemaAtualizarSaldoTotal, body)
    if (!validacao.sucesso) {
      return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
    }
    const resultado = await atualizarSaldoTotal(id, validacao.dados!, usuarioId, usuarioEmail)
    if (resultado.erro) return responderErro(res, resultado.erro)
    if (!resultado.dados) return responderNaoEncontrado(res)
    return responderSucesso(res, resultado.dados)
  }

  if (req.method === 'DELETE' && id) {
    const resultado = await deletarSaldoTotal(id, usuarioId, usuarioEmail)
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, { mensagem: 'Registro deletado com sucesso' })
  }

  return responderMetodoNaoPermitido(res)
}

export default tratarErrosHttp(handlerSaldoTotal)
