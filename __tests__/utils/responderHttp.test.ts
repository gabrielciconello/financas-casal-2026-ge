import { ServerResponse } from 'http'
import {
  responderSucesso,
  responderErro,
  responderNaoAutorizado,
  responderNaoEncontrado,
  responderMetodoNaoPermitido,
} from '../../src/utils/responderHttp'

// Simula um ServerResponse
function criarRespostaFake() {
  const cabecalhos: Record<string, string> = {}
  let statusCode = 0
  let corpo = ''

  const res = {
    writeHead: (status: number, headers: Record<string, string>) => {
      statusCode = status
      Object.assign(cabecalhos, headers)
    },
    end: (data: string) => {
      corpo = data
    },
    getStatus: () => statusCode,
    getCorpo: () => JSON.parse(corpo),
    getCabecalhos: () => cabecalhos,
  }

  return res as any
}

describe('responderHttp', () => {

  describe('responderSucesso', () => {

    test('deve responder com status 200 e dados', () => {
      const res = criarRespostaFake()
      responderSucesso(res, { id: '1', nome: 'Teste' })

      expect(res.getStatus()).toBe(200)
      expect(res.getCorpo().dados).toEqual({ id: '1', nome: 'Teste' })
      expect(res.getCorpo().erro).toBeNull()
    })

    test('deve responder com status 201 quando especificado', () => {
      const res = criarRespostaFake()
      responderSucesso(res, { id: '1' }, 201)

      expect(res.getStatus()).toBe(201)
    })

    test('deve incluir Content-Type application/json', () => {
      const res = criarRespostaFake()
      responderSucesso(res, {})

      expect(res.getCabecalhos()['Content-Type']).toBe('application/json')
    })

  })

  describe('responderErro', () => {

    test('deve responder com status 400 e mensagem de erro', () => {
      const res = criarRespostaFake()
      responderErro(res, 'Dados inválidos')

      expect(res.getStatus()).toBe(400)
      expect(res.getCorpo().erro).toBe('Dados inválidos')
      expect(res.getCorpo().dados).toBeNull()
    })

    test('deve responder com status customizado', () => {
      const res = criarRespostaFake()
      responderErro(res, 'Erro interno', 500)

      expect(res.getStatus()).toBe(500)
    })

  })

  describe('responderNaoAutorizado', () => {

    test('deve responder com status 401', () => {
      const res = criarRespostaFake()
      responderNaoAutorizado(res)

      expect(res.getStatus()).toBe(401)
      expect(res.getCorpo().erro).toBe('Não autorizado')
    })

  })

  describe('responderNaoEncontrado', () => {

    test('deve responder com status 404', () => {
      const res = criarRespostaFake()
      responderNaoEncontrado(res)

      expect(res.getStatus()).toBe(404)
      expect(res.getCorpo().erro).toBe('Registro não encontrado')
    })

  })

  describe('responderMetodoNaoPermitido', () => {

    test('deve responder com status 405', () => {
      const res = criarRespostaFake()
      responderMetodoNaoPermitido(res)

      expect(res.getStatus()).toBe(405)
      expect(res.getCorpo().erro).toBe('Método não permitido')
    })

  })

})