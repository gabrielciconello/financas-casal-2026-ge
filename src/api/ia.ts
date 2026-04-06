import { IncomingMessage, ServerResponse } from 'http'
import { verificarAutenticacao, RequisicaoAutenticada } from '../middleware/autenticacao.js'
import { lerBody } from '../utils/lerBody.js'
import { aplicarCors } from '../utils/cors.js'
import {
  responderSucesso,
  responderErro,
  responderMetodoNaoPermitido,
} from '../utils/responderHttp.js'
import { mesAnoAtual } from '../utils/index.js'
import {
  perguntarIA,
  gerarResumoMensal,
  categorizarTransacao,
} from '../services/servicoIA.js'
import { supabaseAdmin } from '../services/supabase.node.js'


export default async function handlerIA(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  aplicarCors(res)
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const autenticado = await verificarAutenticacao(req as RequisicaoAutenticada, res)
  if (!autenticado) return

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const partes = url.pathname.split('/').filter(Boolean)
  const acao = partes[2] // chat, resumo, categorizar

  // POST /api/ia/chat — pergunta em linguagem natural
  if (req.method === 'POST' && acao === 'chat') {
    const body = await lerBody<{ pergunta: string; mes?: number; ano?: number }>(req)

    if (!body.pergunta || body.pergunta.trim().length === 0) {
      return responderErro(res, 'Pergunta não pode ser vazia')
    }

    const resultado = await perguntarIA(body.pergunta, body.mes, body.ano)
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado.dados)
  }

  // GET /api/ia/resumo?mes=3&ano=2026 — resumo mensal automático
  if (req.method === 'GET' && acao === 'resumo') {
    const { mes: mesAtual, ano: anoAtual } = mesAnoAtual()
    const mes = url.searchParams.get('mes')
      ? Number(url.searchParams.get('mes'))
      : mesAtual
    const ano = url.searchParams.get('ano')
      ? Number(url.searchParams.get('ano'))
      : anoAtual

    const resultado = await gerarResumoMensal(mes, ano)
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado.dados)
  }

  // POST /api/ia/categorizar — categorização automática
  if (req.method === 'POST' && acao === 'categorizar') {
    const body = await lerBody<{ descricao: string }>(req)

    if (!body.descricao || body.descricao.trim().length === 0) {
      return responderErro(res, 'Descrição não pode ser vazia')
    }

    const resultado = await categorizarTransacao(body.descricao)
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado.dados)
  }

  return responderMetodoNaoPermitido(res)
}