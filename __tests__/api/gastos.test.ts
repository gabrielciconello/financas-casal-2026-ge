jest.mock('../../src/services/servicoGastos', () => ({
  buscarGastosFixos: jest.fn(),
  buscarGastoFixoPorId: jest.fn(),
  criarGastoFixo: jest.fn(),
  atualizarGastoFixo: jest.fn(),
  deletarGastoFixo: jest.fn(),
  buscarGastosVariaveis: jest.fn(),
  buscarGastoVariavelPorId: jest.fn(),
  criarGastoVariavel: jest.fn(),
  atualizarGastoVariavel: jest.fn(),
  deletarGastoVariavel: jest.fn(),
}))

jest.mock('../../src/middleware/autenticacao', () => ({
  verificarAutenticacao: jest.fn(),
}))

jest.mock('../../src/utils/lerBody', () => ({
  lerBody: jest.fn(),
}))

import { EventEmitter } from 'events'
import handlerGastos from '../../src/api/gastos'
import { verificarAutenticacao } from '../../src/middleware/autenticacao'
import { lerBody } from '../../src/utils/lerBody'
import {
  buscarGastosFixos,
  buscarGastoFixoPorId,
  criarGastoFixo,
  atualizarGastoFixo,
  deletarGastoFixo,
  buscarGastosVariaveis,
  buscarGastoVariavelPorId,
  criarGastoVariavel,
  atualizarGastoVariavel,
  deletarGastoVariavel,
} from '../../src/services/servicoGastos'

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

describe('controller - gastos', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    mockAutenticado()
  })

  // ==========================================
  // GASTOS FIXOS
  // ==========================================
  describe('gastos fixos', () => {

    test('GET /api/gastos/fixos deve retornar lista paginada', async () => {
      ;(buscarGastosFixos as jest.Mock).mockResolvedValue({
        dados: [{ id: '1', descricao: 'Aluguel', valor: 1200 }],
        total: 1,
        pagina: 1,
        limite: 10,
        erro: null,
      })

      const req = criarRequisicao('GET', '/api/gastos/fixos')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(200)
      expect(buscarGastosFixos).toHaveBeenCalled()
    })

    test('GET /api/gastos/fixos deve retornar 400 quando serviço falha', async () => {
      ;(buscarGastosFixos as jest.Mock).mockResolvedValue({
        dados: [],
        total: 0,
        pagina: 1,
        limite: 10,
        erro: 'Erro de conexão',
      })

      const req = criarRequisicao('GET', '/api/gastos/fixos')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(400)
    })

    test('GET /api/gastos/fixos/:id deve retornar um gasto fixo', async () => {
      ;(buscarGastoFixoPorId as jest.Mock).mockResolvedValue({
        dados: { id: '1', descricao: 'Aluguel' },
        erro: null,
      })

      const req = criarRequisicao('GET', '/api/gastos/fixos/1')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(200)
      expect(res.getCorpo().dados.id).toBe('1')
    })

    test('GET /api/gastos/fixos/:id deve retornar 404 quando não encontrado', async () => {
      ;(buscarGastoFixoPorId as jest.Mock).mockResolvedValue({
        dados: null,
        erro: null,
      })

      const req = criarRequisicao('GET', '/api/gastos/fixos/id-inexistente')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(404)
    })

    test('POST /api/gastos/fixos deve criar gasto fixo com dados válidos', async () => {
      ;(lerBody as jest.Mock).mockResolvedValue({
        descricao: 'Aluguel',
        categoria: 'Moradia',
        valor: 1200,
        dia_vencimento: 5,
        mes: 3,
        ano: 2026,
      })

      ;(criarGastoFixo as jest.Mock).mockResolvedValue({
        dados: { id: 'nova-id', descricao: 'Aluguel' },
        erro: null,
      })

      const req = criarRequisicao('POST', '/api/gastos/fixos')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(201)
      expect(res.getCorpo().dados.id).toBe('nova-id')
    })

    test('POST /api/gastos/fixos deve retornar 400 com dados inválidos', async () => {
      ;(lerBody as jest.Mock).mockResolvedValue({
        descricao: '',
        valor: -100,
      })

      const req = criarRequisicao('POST', '/api/gastos/fixos')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(400)
    })

    test('PUT /api/gastos/fixos/:id deve atualizar gasto fixo', async () => {
      ;(lerBody as jest.Mock).mockResolvedValue({ status: 'pago' })

      ;(atualizarGastoFixo as jest.Mock).mockResolvedValue({
        dados: { id: '1', status: 'pago' },
        erro: null,
      })

      const req = criarRequisicao('PUT', '/api/gastos/fixos/1')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(200)
    })

    test('PUT /api/gastos/fixos/:id deve retornar 404 quando não encontrado', async () => {
      ;(lerBody as jest.Mock).mockResolvedValue({ status: 'pago' })

      ;(atualizarGastoFixo as jest.Mock).mockResolvedValue({
        dados: null,
        erro: null,
      })

      const req = criarRequisicao('PUT', '/api/gastos/fixos/id-inexistente')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(404)
    })

    test('DELETE /api/gastos/fixos/:id deve deletar gasto fixo', async () => {
      ;(deletarGastoFixo as jest.Mock).mockResolvedValue({
        dados: null,
        erro: null,
      })

      const req = criarRequisicao('DELETE', '/api/gastos/fixos/1')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(200)
      expect(res.getCorpo().dados.mensagem).toBe('Gasto fixo deletado com sucesso')
    })

  })

  // ==========================================
  // GASTOS VARIÁVEIS
  // ==========================================
  describe('gastos variáveis', () => {

    test('GET /api/gastos/variaveis deve retornar lista paginada', async () => {
      ;(buscarGastosVariaveis as jest.Mock).mockResolvedValue({
        dados: [{ id: '1', descricao: 'Mercado', valor_real: 950 }],
        total: 1,
        pagina: 1,
        limite: 10,
        erro: null,
      })

      const req = criarRequisicao('GET', '/api/gastos/variaveis')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(200)
      expect(buscarGastosVariaveis).toHaveBeenCalled()
    })

    test('GET /api/gastos/variaveis/:id deve retornar um gasto variável', async () => {
      ;(buscarGastoVariavelPorId as jest.Mock).mockResolvedValue({
        dados: { id: '1', descricao: 'Mercado' },
        erro: null,
      })

      const req = criarRequisicao('GET', '/api/gastos/variaveis/1')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(200)
    })

    test('GET /api/gastos/variaveis/:id deve retornar 404 quando não encontrado', async () => {
      ;(buscarGastoVariavelPorId as jest.Mock).mockResolvedValue({
        dados: null,
        erro: null,
      })

      const req = criarRequisicao('GET', '/api/gastos/variaveis/id-inexistente')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(404)
    })

    test('POST /api/gastos/variaveis deve criar gasto variável', async () => {
      ;(lerBody as jest.Mock).mockResolvedValue({
        descricao: 'Mercado',
        categoria: 'Alimentação',
        valor_estimado: 800,
        mes: 3,
        ano: 2026,
      })

      ;(criarGastoVariavel as jest.Mock).mockResolvedValue({
        dados: { id: 'nova-id', descricao: 'Mercado' },
        erro: null,
      })

      const req = criarRequisicao('POST', '/api/gastos/variaveis')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(201)
    })

    test('PUT /api/gastos/variaveis/:id deve atualizar gasto variável', async () => {
      ;(lerBody as jest.Mock).mockResolvedValue({ valor_real: 950 })

      ;(atualizarGastoVariavel as jest.Mock).mockResolvedValue({
        dados: { id: '1', valor_real: 950 },
        erro: null,
      })

      const req = criarRequisicao('PUT', '/api/gastos/variaveis/1')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(200)
    })

    test('DELETE /api/gastos/variaveis/:id deve deletar gasto variável', async () => {
      ;(deletarGastoVariavel as jest.Mock).mockResolvedValue({
        dados: null,
        erro: null,
      })

      const req = criarRequisicao('DELETE', '/api/gastos/variaveis/1')
      const res = criarRespostaFake()

      await handlerGastos(req, res)

      expect(res.getStatus()).toBe(200)
      expect(res.getCorpo().dados.mensagem).toBe('Gasto variável deletado com sucesso')
    })

  })

  // ==========================================
  // GERAL
  // ==========================================
  test('deve retornar 405 para método não permitido', async () => {
    const req = criarRequisicao('PATCH', '/api/gastos/fixos')
    const res = criarRespostaFake()

    await handlerGastos(req, res)

    expect(res.getStatus()).toBe(405)
  })

  test('deve retornar 401 quando não autenticado', async () => {
    ;(verificarAutenticacao as jest.Mock).mockResolvedValue(false)

    const req = criarRequisicao('GET', '/api/gastos/fixos')
    const res = criarRespostaFake()

    await handlerGastos(req, res)

    expect(buscarGastosFixos).not.toHaveBeenCalled()
  })

})