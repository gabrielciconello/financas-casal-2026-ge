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
import { validar } from '../validators/index.js'
import {
  esquemaCriarMeta,
  esquemaAtualizarMeta,
  esquemaCriarContribuicaoMeta,
} from '../validators/validadorMetas.js'
import {
  buscarMetas,
  buscarMetaPorId,
  criarMeta,
  atualizarMeta,
  deletarMeta,
  buscarContribuicoes,
  criarContribuicao,
} from '../services/servicoMetas.js'
import { supabaseAdmin } from '../services/supabase.node.js'
import { aplicarCors } from '../utils/cors.js'
import { normalizarPaginacao } from '../utils/index.js'


async function handlerMetas(
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
  const partes = url.pathname.split('/').filter(Boolean)

  const pathname = url.pathname.replace(/\/$/, '')
  const segmentos = pathname.split('/').filter(Boolean)
  const id = segmentos.length >= 3 ? segmentos[2] : null
  const ehContribuicao = segmentos[3] === 'contribuicoes'

  // ==========================================
  // METAS — /api/metas
  // ==========================================
  if (!ehContribuicao) {
    if (req.method === 'GET' && !id) {
      const { pagina, limite } = normalizarPaginacao(
        url.searchParams.get('pagina'), url.searchParams.get('limite')
      )

      const resultado = await buscarMetas({ pagina, limite })
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, resultado)
    }

    if (req.method === 'GET' && id) {
      const resultado = await buscarMetaPorId(id)
      if (resultado.erro) return responderErro(res, resultado.erro)
      if (!resultado.dados) return responderNaoEncontrado(res)
      return responderSucesso(res, resultado.dados)
    }

    if (req.method === 'POST' && !id) {
      const body = await lerBody(req)
      const validacao = validar(esquemaCriarMeta, body)
      if (!validacao.sucesso) {
        return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
      }
      const resultado = await criarMeta(validacao.dados!, usuarioId, usuarioEmail)
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, resultado.dados, 201)
    }

    if (req.method === 'PUT' && id) {
      const body = await lerBody(req)
      const validacao = validar(esquemaAtualizarMeta, body)
      if (!validacao.sucesso) {
        return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
      }
      const resultado = await atualizarMeta(id, validacao.dados!, usuarioId, usuarioEmail)
      if (resultado.erro) return responderErro(res, resultado.erro)
      if (!resultado.dados) return responderNaoEncontrado(res)
      return responderSucesso(res, resultado.dados)
    }

    if (req.method === 'DELETE' && id) {
      const resultado = await deletarMeta(id, usuarioId, usuarioEmail)
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, { mensagem: 'Meta deletada com sucesso' })
    }
  }

  // ==========================================
  // CONTRIBUIÇÕES — /api/metas/:id/contribuicoes
  // ==========================================
  if (ehContribuicao && id) {
    if (req.method === 'GET') {
      const { pagina, limite } = normalizarPaginacao(
        url.searchParams.get('pagina'), url.searchParams.get('limite')
      )

      const resultado = await buscarContribuicoes(id, { pagina, limite })
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, resultado)
    }

    if (req.method === 'POST') {
      const body = await lerBody(req)
      const validacao = validar(esquemaCriarContribuicaoMeta, {
        ...body,
        meta_id: id,
      })
      if (!validacao.sucesso) {
        return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
      }
      const resultado = await criarContribuicao(validacao.dados!, usuarioId, usuarioEmail)
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, resultado.dados, 201)
    }
  }

  return responderMetodoNaoPermitido(res)
}

export default tratarErrosHttp(handlerMetas)
