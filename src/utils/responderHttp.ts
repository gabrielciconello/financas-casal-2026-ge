import { ServerResponse } from 'http'
import type { IncomingMessage } from 'http'

type HandlerHttp = (req: IncomingMessage, res: ServerResponse) => Promise<void>

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
  if (typeof res.setHeader === 'function') {
    res.setHeader('Allow', 'GET, POST, PUT, DELETE, OPTIONS')
  }
  responderErro(res, 'Método não permitido', 405)
}

export function tratarErrosHttp(handler: HandlerHttp): HandlerHttp {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (erro) {
      if (res.writableEnded) return
      const mensagem = erro instanceof Error ? erro.message : ''
      if (mensagem.includes('JSON válido') || mensagem.includes('limite de 64 KB')) {
        responderErro(res, mensagem, mensagem.includes('limite') ? 413 : 400)
        return
      }
      console.error('Erro não tratado na API:', erro)
      responderErro(res, 'Erro interno do servidor', 500)
    }
  }
}
