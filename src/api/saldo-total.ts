import { IncomingMessage, ServerResponse } from 'http'
import { verificarAutenticacao, RequisicaoAutenticada } from '../middleware/autenticacao.js'
import { lerBody } from '../utils/lerBody.js'
import {
  responderSucesso,
  responderErro,
  responderNaoEncontrado,
  responderMetodoNaoPermitido,
} from '../utils/responderHttp.js'
import {
  buscarSaldoTotal,
  buscarResumoSaldoTotal,
  criarSaldoTotal,
  atualizarSaldoTotal,
  deletarSaldoTotal,
} from '../services/servicoSaldoTotal.js'

export default async function handlerSaldoTotal(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const autenticado = await verificarAutenticacao(req as RequisicaoAutenticada, res)
  if (!autenticado) return

  const requisicao = req as RequisicaoAutenticada
  const usuarioId = requisicao.usuario!.id
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const pathname = url.pathname.replace(/\/$/, '')
  const segmentos = pathname.split('/').filter(Boolean)
  const id = segmentos.length >= 3 ? segmentos[2] : null

  if (req.method === 'GET' && id === 'resumo') {
    const resultado = await buscarResumoSaldoTotal(usuarioId)
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado.dados)
  }

  if (req.method === 'GET' && !id) {
    const pagina = Number(url.searchParams.get('pagina')) || 1
    const limite = Number(url.searchParams.get('limite')) || 20
    const resultado = await buscarSaldoTotal(usuarioId, pagina, limite)
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado)
  }

  if (req.method === 'GET' && id) {
    const resultado = await buscarSaldoTotal(usuarioId, 1, 1)
    if (resultado.erro) return responderErro(res, resultado.erro)
    const item = resultado.dados.find((d) => d.id === id)
    if (!item) return responderNaoEncontrado(res)
    return responderSucesso(res, item)
  }

  if (req.method === 'POST' && !id) {
    const body = await lerBody(req)
    if (!body.descricao || body.valor == null || !body.tipo) {
      return responderErro(res, 'Dados inválidos: descricao, valor e tipo são obrigatórios')
    }
    if (!['aporte', 'retirada'].includes(body.tipo)) {
      return responderErro(res, 'Tipo deve ser "aporte" ou "retirada"')
    }
    const resultado = await criarSaldoTotal(usuarioId, {
      descricao: body.descricao,
      valor: Number(body.valor),
      tipo: body.tipo,
      data: body.data,
    })
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado.dados, 201)
  }

  if (req.method === 'PUT' && id) {
    const body = await lerBody(req)
    const dto: any = {}
    if (body.descricao) dto.descricao = body.descricao
    if (body.valor !== undefined) dto.valor = Number(body.valor)
    if (body.tipo) dto.tipo = body.tipo
    if (body.data) dto.data = body.data
    const resultado = await atualizarSaldoTotal(usuarioId, id, dto)
    if (resultado.erro) return responderErro(res, resultado.erro)
    if (!resultado.dados) return responderNaoEncontrado(res)
    return responderSucesso(res, resultado.dados)
  }

  if (req.method === 'DELETE' && id) {
    const resultado = await deletarSaldoTotal(usuarioId, id)
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, { mensagem: 'Registro deletado com sucesso' })
  }

  return responderMetodoNaoPermitido(res)
}
