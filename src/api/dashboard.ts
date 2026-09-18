import { IncomingMessage, ServerResponse } from 'http'
import { verificarAutenticacao, RequisicaoAutenticada } from '../middleware/autenticacao.js'
import {
  responderSucesso,
  responderErro,
  responderMetodoNaoPermitido,
  tratarErrosHttp,
} from '../utils/responderHttp.js'
import { buscarDadosDashboard } from '../services/servicoDashboard.js'
import { isAnoValido, isMesValido, mesAnoAtual } from '../utils/index.js'
import { aplicarCors } from '../utils/cors.js'

async function handlerDashboard(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  aplicarCors(res)

  // Responde requisições OPTIONS (preflight do CORS)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const autenticado = await verificarAutenticacao(req as RequisicaoAutenticada, res)
  if (!autenticado) return

  const requisicao = req as RequisicaoAutenticada
  const usuarioId = requisicao.usuario!.id

  if (req.method !== 'GET') return responderMetodoNaoPermitido(res)

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const { mes: mesAtual, ano: anoAtual } = mesAnoAtual()

  const mes = url.searchParams.get('mes')
    ? Number(url.searchParams.get('mes'))
    : mesAtual

  const ano = url.searchParams.get('ano')
    ? Number(url.searchParams.get('ano'))
    : anoAtual

  if (!isMesValido(mes) || !isAnoValido(ano)) {
    return responderErro(res, 'Mês ou ano inválido')
  }

  const resultado = await buscarDadosDashboard(mes, ano, usuarioId)

  if (resultado.erro) return responderErro(res, resultado.erro)
  return responderSucesso(res, resultado.dados)
}

export default tratarErrosHttp(handlerDashboard)
