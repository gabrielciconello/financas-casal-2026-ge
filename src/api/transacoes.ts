import { IncomingMessage, ServerResponse } from 'http'
import { verificarAutenticacao, RequisicaoAutenticada } from '../middleware/autenticacao.js'
import { lerBody } from '../utils/lerBody.js'
import {
  responderSucesso,
  responderErro,
  responderNaoEncontrado,
  responderMetodoNaoPermitido,
} from '../utils/responderHttp.js'
import { validar } from '../validators/index.js'
import {
  esquemaCriarTransacao,
  esquemaAtualizarTransacao,
} from '../validators/validadorTransacoes.js'
import {
  buscarTransacoes,
  buscarTransacaoPorId,
  criarTransacao,
  atualizarTransacao,
  deletarTransacao,
} from '../services/servicoTransacoes.js'
import { supabaseAdmin } from '../services/supabase.node.js'

export default async function handlerTransacoes(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const autenticado = await verificarAutenticacao(req as RequisicaoAutenticada, res)
  if (!autenticado) return

  const requisicao = req as RequisicaoAutenticada
  const usuarioId = requisicao.usuario!.id
  const usuarioEmail = requisicao.usuario!.email
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)

  // Extrai o ID corretamente ignorando o segmento 'transacoes'
  const pathname = url.pathname.replace(/\/$/, '')
  const segmentos = pathname.split('/').filter(Boolean)
  // segmentos[0] = 'api', segmentos[1] = 'transacoes', segmentos[2] = ':id'
  const id = segmentos.length >= 3 ? segmentos[segmentos.length - 1] : null

  // GET /api/transacoes
  if (req.method === 'GET' && !id) {
    const pagina = Number(url.searchParams.get('pagina')) || 1
    const limite = Number(url.searchParams.get('limite')) || 10
    const mes = url.searchParams.get('mes') ? Number(url.searchParams.get('mes')) : undefined
    const ano = url.searchParams.get('ano') ? Number(url.searchParams.get('ano')) : undefined
    const tipo = url.searchParams.get('tipo') ?? undefined
    const categoria = url.searchParams.get('categoria') ?? undefined
    const status = url.searchParams.get('status') ?? undefined

    const resultado = await buscarTransacoes({ pagina, limite, mes, ano, tipo, categoria, status })

    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado)
  }

  // GET /api/transacoes/:id
  if (req.method === 'GET' && id) {
    const resultado = await buscarTransacaoPorId(id)

    if (resultado.erro) return responderErro(res, resultado.erro)
    if (!resultado.dados) return responderNaoEncontrado(res)
    return responderSucesso(res, resultado.dados)
  }

  // POST /api/transacoes
  if (req.method === 'POST' && !id) {
    const body = await lerBody(req)
    const validacao = validar(esquemaCriarTransacao, body)

    if (!validacao.sucesso) {
      return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
    }

    const resultado = await criarTransacao(validacao.dados!, usuarioId, usuarioEmail)

    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado.dados, 201)
  }

  // PUT /api/transacoes/:id
  if (req.method === 'PUT' && id) {
    const body = await lerBody(req)
    const validacao = validar(esquemaAtualizarTransacao, body)

    if (!validacao.sucesso) {
      return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
    }

    const resultado = await atualizarTransacao(id, validacao.dados!, usuarioId, usuarioEmail)

    if (resultado.erro) return responderErro(res, resultado.erro)
    if (!resultado.dados) return responderNaoEncontrado(res)
    return responderSucesso(res, resultado.dados)
  }

  // DELETE /api/transacoes/:id
  if (req.method === 'DELETE' && id) {
    const resultado = await deletarTransacao(id, usuarioId, usuarioEmail)

    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, { mensagem: 'Transação deletada com sucesso' })
  }

  return responderMetodoNaoPermitido(res)
}