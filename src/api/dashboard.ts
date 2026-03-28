import { IncomingMessage, ServerResponse } from 'http'
import { verificarAutenticacao, RequisicaoAutenticada } from '../middleware/autenticacao'
import {
  responderSucesso,
  responderErro,
  responderMetodoNaoPermitido,
} from '../utils/responderHttp'
import { buscarDadosDashboard } from '../services/servicoDashboard'
import { mesAnoAtual } from '../utils'

export default async function handlerDashboard(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const autenticado = await verificarAutenticacao(req as RequisicaoAutenticada, res)
  if (!autenticado) return

  if (req.method !== 'GET') return responderMetodoNaoPermitido(res)

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const { mes: mesAtual, ano: anoAtual } = mesAnoAtual()

  const mes = url.searchParams.get('mes')
    ? Number(url.searchParams.get('mes'))
    : mesAtual

  const ano = url.searchParams.get('ano')
    ? Number(url.searchParams.get('ano'))
    : anoAtual

  const resultado = await buscarDadosDashboard(mes, ano)

  if (resultado.erro) return responderErro(res, resultado.erro)
  return responderSucesso(res, resultado.dados)
}