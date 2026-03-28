import { EventEmitter } from 'events'
import { verificarAutenticacao } from '../../src/middleware/autenticacao'

// Mock do Supabase
jest.mock('../../src/services/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
  supabaseAdmin: {},
}))

import { supabase } from '../../src/services/supabase'

function criarRequisicaoFake(headers: Record<string, string> = {}) {
  const emitter = new EventEmitter() as any
  emitter.headers = headers
  return emitter
}

function criarRespostaFake() {
  let statusCode = 0
  let corpo = ''

  return {
    writeHead: (status: number) => { statusCode = status },
    end: (data: string) => { corpo = data },
    getStatus: () => statusCode,
    getCorpo: () => JSON.parse(corpo),
  } as any
}

describe('middleware - verificarAutenticacao', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('deve retornar false e 401 quando não há token', async () => {
    const req = criarRequisicaoFake()
    const res = criarRespostaFake()

    const resultado = await verificarAutenticacao(req, res)

    expect(resultado).toBe(false)
    expect(res.getStatus()).toBe(401)
    expect(res.getCorpo().erro).toBe('Token de autenticação não fornecido')
  })

  test('deve retornar false e 401 quando token não começa com Bearer', async () => {
    const req = criarRequisicaoFake({ authorization: 'Basic token123' })
    const res = criarRespostaFake()

    const resultado = await verificarAutenticacao(req, res)

    expect(resultado).toBe(false)
    expect(res.getStatus()).toBe(401)
  })

  test('deve retornar false e 401 quando token é inválido', async () => {
    const req = criarRequisicaoFake({ authorization: 'Bearer token_invalido' })
    const res = criarRespostaFake()

    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Token inválido' },
    })

    const resultado = await verificarAutenticacao(req, res)

    expect(resultado).toBe(false)
    expect(res.getStatus()).toBe(401)
    expect(res.getCorpo().erro).toBe('Token inválido ou expirado')
  })

  test('deve retornar true e injetar usuário quando token é válido', async () => {
    const req = criarRequisicaoFake({ authorization: 'Bearer token_valido' })
    const res = criarRespostaFake()

    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'usuario-123',
          email: 'usuario@email.com',
        },
      },
      error: null,
    })

    const resultado = await verificarAutenticacao(req, res)

    expect(resultado).toBe(true)
    expect(req.usuario).toEqual({
      id: 'usuario-123',
      email: 'usuario@email.com',
    })
  })

})