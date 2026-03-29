jest.mock('../../src/services/servicoCartoes', () => ({
  buscarCartoes: jest.fn(),
  buscarCartaoPorId: jest.fn(),
  criarCartao: jest.fn(),
  atualizarCartao: jest.fn(),
  deletarCartao: jest.fn(),
  buscarComprasCartao: jest.fn(),
  criarCompraCartao: jest.fn(),
  atualizarCompraCartao: jest.fn(),
  deletarCompraCartao: jest.fn(),
}))

jest.mock('../../src/middleware/autenticacao', () => ({
  verificarAutenticacao: jest.fn(),
}))

jest.mock('../../src/utils/lerBody', () => ({
  lerBody: jest.fn(),
}))

import { EventEmitter } from 'events'
import handlerCartoes from '../../src/api/cartoes'
import { verificarAutenticacao } from '../../src/middleware/autenticacao'
import { lerBody } from '../../src/utils/lerBody'
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
} from '../../src/services/servicoCartoes'

function criarRequisicao(method: string, url: string) {
  const emitter = new EventEmitter() as any
  emitter.method = method
  emitter.url = url
  emitter.headers = { host: 'localhost:3000' }
  emitter.usuario = { id: 'usuario-123', email: 'teste@email.com' }
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

function mockAutenticado() {
  ;(verificarAutenticacao as jest.Mock).mockImplementation(async (req: any) => {
    req.usuario = { id: 'usuario-123', email: 'teste@email.com' }
    return true
  })
}

describe('controller - cartoes', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    mockAutenticado()
  })

  test('GET /api/cartoes deve retornar lista paginada', async () => {
    ;(buscarCartoes as jest.Mock).mockResolvedValue({
      dados: [{ id: '1', nome: 'Nubank', limite: 5000 }],
      total: 1,
      pagina: 1,
      limite: 10,
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/cartoes')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)

    expect(res.getStatus()).toBe(200)
    expect(buscarCartoes).toHaveBeenCalled()
  })

  test('GET /api/cartoes deve retornar 400 quando falha', async () => {
    ;(buscarCartoes as jest.Mock).mockResolvedValue({
      dados: [],
      total: 0,
      pagina: 1,
      limite: 10,
      erro: 'Erro de busca',
    })

    const req = criarRequisicao('GET', '/api/cartoes')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)
    expect(res.getStatus()).toBe(400)
  })

  test('GET /api/cartoes/:id deve retornar cartão', async () => {
    ;(buscarCartaoPorId as jest.Mock).mockResolvedValue({
      dados: { id: '1', nome: 'Nubank' },
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/cartoes/1')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)

    expect(res.getStatus()).toBe(200)
    expect(res.getCorpo().dados.id).toBe('1')
  })

  test('GET /api/cartoes/:id deve retornar 404 quando não encontrado', async () => {
    ;(buscarCartaoPorId as jest.Mock).mockResolvedValue({
      dados: null,
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/cartoes/1')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)

    expect(res.getStatus()).toBe(404)
  })

  test('POST /api/cartoes deve criar cartão', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      nome: 'Itau',
      bandeira: 'Visa',
      limite: 3000,
      dia_fechamento: 5,
      dia_vencimento: 15,
    })

    ;(criarCartao as jest.Mock).mockResolvedValue({
      dados: { id: 'nova-id', nome: 'Itau' },
      erro: null,
    })

    const req = criarRequisicao('POST', '/api/cartoes')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)

    expect(res.getStatus()).toBe(201)
    expect(res.getCorpo().dados.id).toBe('nova-id')
  })

  test('POST /api/cartoes deve retornar 400 com dados inválidos', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      nome: 'x',
    })

    const req = criarRequisicao('POST', '/api/cartoes')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)
    expect(res.getStatus()).toBe(400)
  })

  test('PUT /api/cartoes/:id deve atualizar cartão', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({ limite: 4000 })
    ;(atualizarCartao as jest.Mock).mockResolvedValue({ dados: { id: '1', limite: 4000 }, erro: null })

    const req = criarRequisicao('PUT', '/api/cartoes/1')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)
    expect(res.getStatus()).toBe(200)
  })

  test('PUT /api/cartoes/:id deve retornar 404 quando não encontrado', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({ limite: 4000 })
    ;(atualizarCartao as jest.Mock).mockResolvedValue({ dados: null, erro: null })

    const req = criarRequisicao('PUT', '/api/cartoes/1')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)
    expect(res.getStatus()).toBe(404)
  })

  test('DELETE /api/cartoes/:id deve desativar cartão', async () => {
    ;(deletarCartao as jest.Mock).mockResolvedValue({ dados: null, erro: null })

    const req = criarRequisicao('DELETE', '/api/cartoes/1')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)
    expect(res.getStatus()).toBe(200)
  })

  test('GET /api/cartoes/compras-cartao deve retornar compras paginadas', async () => {
    ;(buscarComprasCartao as jest.Mock).mockResolvedValue({
      dados: [{ id: '1', descricao: 'Camiseta', valor_total: 100 }],
      total: 1,
      pagina: 1,
      limite: 10,
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/cartoes/compras-cartao?cartaoId=1')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)
    expect(res.getStatus()).toBe(200)
  })

  test('POST /api/cartoes/compras-cartao deve criar compra e retornar 201', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      cartao_id: '123e4567-e89b-12d3-a456-426614174000',
      descricao: 'Cinema',
      categoria: 'Lazer',
      valor_total: 80,
    })

    ;(criarCompraCartao as jest.Mock).mockResolvedValue({
      dados: { id: 'compra-id', valor_parcela: 80 },
      erro: null,
    })

    const req = criarRequisicao('POST', '/api/cartoes/compras-cartao')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)
    expect(res.getStatus()).toBe(201)
  })

  test('PUT /api/cartoes/compras-cartao/:id deve atualizar compra', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({ valor_total: 90 })
    ;(atualizarCompraCartao as jest.Mock).mockResolvedValue({ dados: { id: '1', valor_total: 90 }, erro: null })

    const req = criarRequisicao('PUT', '/api/cartoes/compras-cartao/1')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)
    expect(res.getStatus()).toBe(200)
  })

  test('DELETE /api/cartoes/compras-cartao/:id deve deletar compra', async () => {
    ;(deletarCompraCartao as jest.Mock).mockResolvedValue({ dados: null, erro: null })

    const req = criarRequisicao('DELETE', '/api/cartoes/compras-cartao/1')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)
    expect(res.getStatus()).toBe(200)
  })

  test('deve retornar 405 para método não permitido', async () => {
    const req = criarRequisicao('PATCH', '/api/cartoes')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)
    expect(res.getStatus()).toBe(405)
  })

  test('deve retornar 401 quando não autenticado', async () => {
    ;(verificarAutenticacao as jest.Mock).mockResolvedValue(false)
    const req = criarRequisicao('GET', '/api/cartoes')
    const res = criarRespostaFake()

    await handlerCartoes(req, res)
    expect(buscarCartoes).not.toHaveBeenCalled()
  })

})