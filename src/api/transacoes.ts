import { IncomingMessage, ServerResponse } from 'http'
import { verificarAutenticacao, RequisicaoAutenticada } from '../middleware/autenticacao'
import { lerBody } from '../utils/lerBody'
import { responderSucesso, responderErro, responderNaoEncontrado, responderMetodoNaoPermitido } from '../utils/responderHttp'
import { validar } from '../validators'
import { esquemaCriarTransacao, esquemaAtualizarTransacao } from '../validators/validadorTransacoes'
import {
  buscarTransacoes,
  buscarTransacaoPorId,
  criarTransacao,
  atualizarTransacao,
  deletarTransacao,
} from '../services/servicoTransacoes'

export default async function handlerTransacoes(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  // Verifica autenticação em todas as rotas
  const autenticado = await verificarAutenticacao(req as RequisicaoAutenticada, res)
  if (!autenticado) return

  const requisicao = req as RequisicaoAutenticada
  const usuarioId = requisicao.usuario!.id
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const partes = url.pathname.split('/').filter(Boolean)
  const id = partes[1] ?? null // /api/transacoes/:id

  // GET /api/transacoes — lista com filtros e paginação
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

  // GET /api/transacoes/:id — busca uma transação
  if (req.method === 'GET' && id) {
    const resultado = await buscarTransacaoPorId(id)

    if (resultado.erro) return responderErro(res, resultado.erro)
    if (!resultado.dados) return responderNaoEncontrado(res)
    return responderSucesso(res, resultado.dados)
  }

  // POST /api/transacoes — cria uma transação
  if (req.method === 'POST' && !id) {
    const body = await lerBody(req)
    const validacao = validar(esquemaCriarTransacao, body)

    if (!validacao.sucesso) {
      return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
    }

    const resultado = await criarTransacao(validacao.dados!, usuarioId)

    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado.dados, 201)
  }

  // PUT /api/transacoes/:id — atualiza uma transação
  if (req.method === 'PUT' && id) {
    const body = await lerBody(req)
    const validacao = validar(esquemaAtualizarTransacao, body)

    if (!validacao.sucesso) {
      return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
    }

    const resultado = await atualizarTransacao(id, validacao.dados!, usuarioId)

    if (resultado.erro) return responderErro(res, resultado.erro)
    if (!resultado.dados) return responderNaoEncontrado(res)
    return responderSucesso(res, resultado.dados)
  }

  // DELETE /api/transacoes/:id — deleta uma transação
  if (req.method === 'DELETE' && id) {
    const resultado = await deletarTransacao(id, usuarioId)

    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, { mensagem: 'Transação deletada com sucesso' })
  }

  // Método não permitido
  return responderMetodoNaoPermitido(res)
}