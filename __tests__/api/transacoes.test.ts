jest.mock('../../src/services/servicoTransacoes', () => ({
  buscarTransacoes: jest.fn(),
  buscarTransacaoPorId: jest.fn(),
  criarTransacao: jest.fn(),
  atualizarTransacao: jest.fn(),
  deletarTransacao: jest.fn(),
}))

jest.mock('../../src/middleware/autenticacao', () => ({
  verificarAutenticacao: jest.fn(),
}))

// Mock do lerBody — elimina a necessidade de simular eventos de stream
jest.mock('../../src/utils/lerBody', () => ({
  lerBody: jest.fn(),
}))

import { EventEmitter } from 'events'
import handlerTransacoes from '../../src/api/transacoes'
import { verificarAutenticacao } from '../../src/middleware/autenticacao'
import { lerBody } from '../../src/utils/lerBody'
import {
  buscarTransacoes,
  buscarTransacaoPorId,
  criarTransacao,
  atualizarTransacao,
  deletarTransacao,
} from '../../src/services/servicoTransacoes'

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

describe('controller - transacoes', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    mockAutenticado()
  })

  // ==========================================
  // GET /api/transacoes
  // ==========================================
  test('GET /api/transacoes deve retornar lista paginada', async () => {
    ;(buscarTransacoes as jest.Mock).mockResolvedValue({
      dados: [{ id: '1', descricao: 'Salário' }],
      total: 1,
      pagina: 1,
      limite: 10,
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/transacoes')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(200)
    expect(buscarTransacoes).toHaveBeenCalled()
  })

  test('GET /api/transacoes deve retornar 400 quando serviço falha', async () => {
    ;(buscarTransacoes as jest.Mock).mockResolvedValue({
      dados: [],
      total: 0,
      pagina: 1,
      limite: 10,
      erro: 'Erro de conexão',
    })

    const req = criarRequisicao('GET', '/api/transacoes')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(400)
    expect(res.getCorpo().erro).toBe('Erro de conexão')
  })

  // ==========================================
  // GET /api/transacoes/:id
  // ==========================================
  test('GET /api/transacoes/:id deve retornar uma transação', async () => {
    ;(buscarTransacaoPorId as jest.Mock).mockResolvedValue({
      dados: { id: '1', descricao: 'Salário' },
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/transacoes/1')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(200)
    expect(res.getCorpo().dados.id).toBe('1')
  })

  test('GET /api/transacoes/:id deve retornar 404 quando não encontrado', async () => {
    ;(buscarTransacaoPorId as jest.Mock).mockResolvedValue({
      dados: null,
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/transacoes/id-inexistente')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(404)
  })

  test('GET /api/transacoes/:id deve retornar 400 quando serviço falha', async () => {
    ;(buscarTransacaoPorId as jest.Mock).mockResolvedValue({
      dados: null,
      erro: 'Erro ao buscar',
    })

    const req = criarRequisicao('GET', '/api/transacoes/1')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(400)
  })

  // ==========================================
  // POST /api/transacoes
  // ==========================================
  test('POST /api/transacoes deve criar transação com dados válidos', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      descricao: 'Freelance',
      categoria: 'Freelance',
      tipo: 'entrada',
      valor: 1500,
    })

    ;(criarTransacao as jest.Mock).mockResolvedValue({
      dados: { id: 'nova-id', descricao: 'Freelance', valor: 1500 },
      erro: null,
    })

    const req = criarRequisicao('POST', '/api/transacoes')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(201)
    expect(res.getCorpo().dados.id).toBe('nova-id')
  })

  test('POST /api/transacoes deve retornar 400 com dados inválidos', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      descricao: '',
      tipo: 'invalido',
      valor: -100,
    })

    const req = criarRequisicao('POST', '/api/transacoes')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(400)
  })

  test('POST /api/transacoes deve retornar 400 quando serviço falha', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      descricao: 'Freelance',
      categoria: 'Freelance',
      tipo: 'entrada',
      valor: 1500,
    })

    ;(criarTransacao as jest.Mock).mockResolvedValue({
      dados: null,
      erro: 'Erro ao criar',
    })

    const req = criarRequisicao('POST', '/api/transacoes')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(400)
  })

  // ==========================================
  // PUT /api/transacoes/:id
  // ==========================================
  test('PUT /api/transacoes/:id deve atualizar transação', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({ valor: 2000 })

    ;(atualizarTransacao as jest.Mock).mockResolvedValue({
      dados: { id: '1', valor: 2000 },
      erro: null,
    })

    const req = criarRequisicao('PUT', '/api/transacoes/1')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(200)
  })

  test('PUT /api/transacoes/:id deve retornar 404 quando não encontrado', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({ valor: 2000 })

    ;(atualizarTransacao as jest.Mock).mockResolvedValue({
      dados: null,
      erro: null,
    })

    const req = criarRequisicao('PUT', '/api/transacoes/id-inexistente')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(404)
  })

  test('PUT /api/transacoes/:id deve retornar 400 quando serviço falha', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({ valor: 2000 })

    ;(atualizarTransacao as jest.Mock).mockResolvedValue({
      dados: null,
      erro: 'Erro ao atualizar',
    })

    const req = criarRequisicao('PUT', '/api/transacoes/1')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(400)
  })

  // ==========================================
  // DELETE /api/transacoes/:id
  // ==========================================
  test('DELETE /api/transacoes/:id deve deletar transação', async () => {
    ;(deletarTransacao as jest.Mock).mockResolvedValue({
      dados: null,
      erro: null,
    })

    const req = criarRequisicao('DELETE', '/api/transacoes/1')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(200)
    expect(res.getCorpo().dados.mensagem).toBe('Transação deletada com sucesso')
  })

  test('DELETE /api/transacoes/:id deve retornar 400 quando serviço falha', async () => {
    ;(deletarTransacao as jest.Mock).mockResolvedValue({
      dados: null,
      erro: 'Erro ao deletar',
    })

    const req = criarRequisicao('DELETE', '/api/transacoes/1')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(400)
  })

  // ==========================================
  // MÉTODO NÃO PERMITIDO
  // ==========================================
  test('deve retornar 405 para método não permitido', async () => {
    const req = criarRequisicao('PATCH', '/api/transacoes')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(res.getStatus()).toBe(405)
  })

  // ==========================================
  // NÃO AUTENTICADO
  // ==========================================
  test('deve retornar 401 quando não autenticado', async () => {
    ;(verificarAutenticacao as jest.Mock).mockResolvedValue(false)

    const req = criarRequisicao('GET', '/api/transacoes')
    const res = criarRespostaFake()

    await handlerTransacoes(req, res)

    expect(buscarTransacoes).not.toHaveBeenCalled()
  })

})