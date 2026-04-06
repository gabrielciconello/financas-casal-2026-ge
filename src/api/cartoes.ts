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
  esquemaCriarCartao,
  esquemaAtualizarCartao,
  esquemaCriarCompraCartao,
  esquemaAtualizarCompraCartao,
} from '../validators/validadorCartoes.js'
import {
  buscarCartoes,
  buscarCartaoPorId,
  criarCartao,
  atualizarCartao,
  deletarCartao,
  buscarComprasCartao,
  criarCompraCartao,
  atualizarCompraCartao,
  deletarCompraCartao,
} from '../services/servicoCartoes.js'
import { supabaseAdmin } from '../services/supabase.node.js'

export default async function handlerCartoes(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const autenticado = await verificarAutenticacao(req as RequisicaoAutenticada, res)
  if (!autenticado) return

  const requisicao = req as RequisicaoAutenticada
  const usuarioId = requisicao.usuario!.id
  const usuarioEmail = requisicao.usuario!.email
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const partes = url.pathname.split('/').filter(Boolean)

  // Rotas de compras: /api/compras-cartao ou /api/compras-cartao/:id
  const pathname = url.pathname.replace(/\/$/, '')
  const segmentos = pathname.split('/').filter(Boolean)
  const ehCompra = segmentos[2] === 'compras-cartao'
  const id = segmentos.length >= 4 ? segmentos[segmentos.length - 1] : null

  // ==========================================
  // ROTAS DE CARTÕES — /api/cartoes
  // ==========================================
  if (!ehCompra) {
    const cartaoId = partes[2] ?? null

    if (req.method === 'GET' && !cartaoId) {
      const pagina = Number(url.searchParams.get('pagina')) || 1
      const limite = Number(url.searchParams.get('limite')) || 10

      const resultado = await buscarCartoes({ pagina, limite })
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, resultado)
    }

    if (req.method === 'GET' && cartaoId) {
      const resultado = await buscarCartaoPorId(cartaoId)
      if (resultado.erro) return responderErro(res, resultado.erro)
      if (!resultado.dados) return responderNaoEncontrado(res)
      return responderSucesso(res, resultado.dados)
    }

    if (req.method === 'POST' && !cartaoId) {
      const body = await lerBody(req)
      const validacao = validar(esquemaCriarCartao, body)
      if (!validacao.sucesso) {
        return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
      }
      const resultado = await criarCartao(validacao.dados!, usuarioId, usuarioEmail)
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, resultado.dados, 201)
    }

    if (req.method === 'PUT' && cartaoId) {
      const body = await lerBody(req)
      const validacao = validar(esquemaAtualizarCartao, body)
      if (!validacao.sucesso) {
        return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
      }
      const resultado = await atualizarCartao(cartaoId, validacao.dados!, usuarioId, usuarioEmail)
      if (resultado.erro) return responderErro(res, resultado.erro)
      if (!resultado.dados) return responderNaoEncontrado(res)
      return responderSucesso(res, resultado.dados)
    }

    if (req.method === 'DELETE' && cartaoId) {
      const resultado = await deletarCartao(cartaoId, usuarioId, usuarioEmail)
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, { mensagem: 'Cartão desativado com sucesso' })
    }
  }

  // ==========================================
  // ROTAS DE COMPRAS — /api/cartoes/compras-cartao
  // ==========================================
  if (ehCompra) {
    if (req.method === 'GET' && !id) {
      const pagina = Number(url.searchParams.get('pagina')) || 1
      const limite = Number(url.searchParams.get('limite')) || 10
      const cartaoId = url.searchParams.get('cartaoId') ?? undefined
      const mes = url.searchParams.get('mes') ? Number(url.searchParams.get('mes')) : undefined
      const ano = url.searchParams.get('ano') ? Number(url.searchParams.get('ano')) : undefined

      const resultado = await buscarComprasCartao({ pagina, limite, cartaoId, mes, ano })
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, resultado)
    }

    if (req.method === 'POST' && !id) {
      const body = await lerBody(req)
      const validacao = validar(esquemaCriarCompraCartao, body)
      if (!validacao.sucesso) {
        return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
      }
      const resultado = await criarCompraCartao(validacao.dados!, usuarioId, usuarioEmail)
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, resultado.dados, 201)
    }

    if (req.method === 'PUT' && id) {
      const body = await lerBody(req)
      const validacao = validar(esquemaAtualizarCompraCartao, body)
      if (!validacao.sucesso) {
        return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
      }
      const resultado = await atualizarCompraCartao(id, validacao.dados!, usuarioId, usuarioEmail)
      if (resultado.erro) return responderErro(res, resultado.erro)
      if (!resultado.dados) return responderNaoEncontrado(res)
      return responderSucesso(res, resultado.dados)
    }

    if (req.method === 'DELETE' && id) {
      const resultado = await deletarCompraCartao(id, usuarioId, usuarioEmail)
      if (resultado.erro) return responderErro(res, resultado.erro)
      return responderSucesso(res, { mensagem: 'Compra deletada com sucesso' })
    }
  }

  return responderMetodoNaoPermitido(res)
}