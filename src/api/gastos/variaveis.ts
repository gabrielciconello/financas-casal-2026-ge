import { IncomingMessage, ServerResponse } from 'http'
import { verificarAutenticacao, RequisicaoAutenticada } from '../../middleware/autenticacao'
import { lerBody } from '../../utils/lerBody'
import {
  responderSucesso,
  responderErro,
  responderNaoEncontrado,
  responderMetodoNaoPermitido,
} from '../../utils/responderHttp'
import { validar } from '../../validators'
import {
  esquemaCriarGastoVariavel,
  esquemaAtualizarGastoVariavel,
} from '../../validators/validadorGastos'
import {
  buscarGastosVariaveis,
  buscarGastoVariavelPorId,
  criarGastoVariavel,
  atualizarGastoVariavel,
  deletarGastoVariavel,
} from '../../services/servicoGastos'

export default async function handlerGastosVariaveis(
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
  // segmentos: ['api','gastos','variaveis', id?]
  const id = segmentos.length >= 4 ? segmentos[segmentos.length - 1] : null

  // ==========================================
  // GET /api/gastos/variaveis (lista)
  // ==========================================
  if (req.method === 'GET' && !id) {
    const pagina = Number(url.searchParams.get('pagina')) || 1
    const limite = Number(url.searchParams.get('limite')) || 10
    const mes = url.searchParams.get('mes') ? Number(url.searchParams.get('mes')) : undefined
    const ano = url.searchParams.get('ano') ? Number(url.searchParams.get('ano')) : undefined
    const categoria = url.searchParams.get('categoria') ?? undefined

    const resultado = await buscarGastosVariaveis({ pagina, limite, mes, ano, categoria })
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado)
  }

  // ==========================================
  // GET /api/gastos/variaveis/:id
  // ==========================================
  if (req.method === 'GET' && id) {
    const resultado = await buscarGastoVariavelPorId(id)
    if (resultado.erro) return responderErro(res, resultado.erro)
    if (!resultado.dados) return responderNaoEncontrado(res)
    return responderSucesso(res, resultado.dados)
  }

  // ==========================================
  // POST /api/gastos/variaveis
  // ==========================================
  if (req.method === 'POST' && !id) {
    const body = await lerBody(req)
    const validacao = validar(esquemaCriarGastoVariavel, body)
    if (!validacao.sucesso) {
      return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
    }
    const resultado = await criarGastoVariavel(validacao.dados!, usuarioId)
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, resultado.dados, 201)
  }

  // ==========================================
  // PUT /api/gastos/variaveis/:id
  // ==========================================
  if (req.method === 'PUT' && id) {
    const body = await lerBody(req)
    const validacao = validar(esquemaAtualizarGastoVariavel, body)
    if (!validacao.sucesso) {
      return responderErro(res, validacao.erros?.join(', ') ?? 'Dados inválidos')
    }
    const resultado = await atualizarGastoVariavel(id, validacao.dados!, usuarioId)
    if (resultado.erro) return responderErro(res, resultado.erro)
    if (!resultado.dados) return responderNaoEncontrado(res)
    return responderSucesso(res, resultado.dados)
  }

  // ==========================================
  // DELETE /api/gastos/variaveis/:id
  // ==========================================
  if (req.method === 'DELETE' && id) {
    const resultado = await deletarGastoVariavel(id, usuarioId)
    if (resultado.erro) return responderErro(res, resultado.erro)
    return responderSucesso(res, { mensagem: 'Gasto variável deletado com sucesso' })
  }

  return responderMetodoNaoPermitido(res)
}
