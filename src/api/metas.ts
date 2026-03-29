import { IncomingMessage, ServerResponse } from 'http'
import { verificarAutenticacao, RequisicaoAutenticada } from '../middleware/autenticacao'
import { lerBody } from '../utils/lerBody'
import {
  responderSucesso,
  responderErro,
  responderNaoEncontrado,
  responderMetodoNaoPermitido,
} from '../utils/responderHttp'
import { validar } from '../validators'
import {
  esquemaCriarMeta,
  esquemaAtualizarMeta,
  esquemaCriarContribuicaoMeta,
} from '../validators/validadorMetas'
import {
  buscarMetas,
  buscarMetaPorId,
  criarMeta,
  atualizarMeta,
  deletarMeta,
  buscarContribuicoes,
  criarContribuicao,
} from '../services/servicoMetas'

export default async function handlerMetas(
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
  const id = segmentos.length >= 3 ? segmentos[2] : null
  const ehContribuicao = segmentos[3] === 'contribuicoes'

  // ==========================================
  // METAS — /api/metas
  // ==========================================
  if (!ehContribuicao) {
    if (req.method === 'GET' && !id) {
      const pagina = Number(url.searchParams.get('pagina')) || 1
      const limite = Number(url.searchParams.get('limite')) || 10

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
      const resultado = await criarMeta(validacao.dados!, usuarioId)
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, resultado.dados, 201)
    }

    if (req.method === 'PUT' && id) {
      const body = await lerBody(req)
      const validacao = validar(esquemaAtualizarMeta, body)
      if (!validacao.sucesso) {
        return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
      }
      const resultado = await atualizarMeta(id, validacao.dados!, usuarioId)
      if (resultado.erro) return responderErro(res, resultado.erro)
      if (!resultado.dados) return responderNaoEncontrado(res)
      return responderSucesso(res, resultado.dados)
    }

    if (req.method === 'DELETE' && id) {
      const resultado = await deletarMeta(id, usuarioId)
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, { mensagem: 'Meta deletada com sucesso' })
    }
  }

  // ==========================================
  // CONTRIBUIÇÕES — /api/metas/:id/contribuicoes
  // ==========================================
  if (ehContribuicao && id) {
    if (req.method === 'GET') {
      const pagina = Number(url.searchParams.get('pagina')) || 1
      const limite = Number(url.searchParams.get('limite')) || 10

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
      const resultado = await criarContribuicao(validacao.dados!, usuarioId)
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, resultado.dados, 201)
    }
  }

  return responderMetodoNaoPermitido(res)
}