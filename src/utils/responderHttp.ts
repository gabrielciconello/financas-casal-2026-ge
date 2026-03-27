import { ServerResponse } from 'http'

export function responderJson(
  res: ServerResponse,
  status: number,
  dados: unknown
): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(dados))
}

export function responderSucesso(
  res: ServerResponse,
  dados: unknown,
  status = 200
): void {
  responderJson(res, status, { dados, erro: null })
}

export function responderErro(
  res: ServerResponse,
  mensagem: string,
  status = 400
): void {
  responderJson(res, status, { dados: null, erro: mensagem })
}

export function responderNaoAutorizado(res: ServerResponse): void {
  responderErro(res, 'Não autorizado', 401)
}

export function responderNaoEncontrado(res: ServerResponse): void {
  responderErro(res, 'Registro não encontrado', 404)
}

export function responderMetodoNaoPermitido(res: ServerResponse): void {
  responderErro(res, 'Método não permitido', 405)
}