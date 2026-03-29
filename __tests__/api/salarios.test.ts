jest.mock('../../src/services/servicoSalarios', () => ({
  buscarSalarios: jest.fn(),
  buscarSalarioPorId: jest.fn(),
  criarSalario: jest.fn(),
  atualizarSalario: jest.fn(),
  deletarSalario: jest.fn(),
}))

jest.mock('../../src/middleware/autenticacao', () => ({
  verificarAutenticacao: jest.fn(),
}))

jest.mock('../../src/utils/lerBody', () => ({
  lerBody: jest.fn(),
}))

import { EventEmitter } from 'events'
import handlerSalarios from '../../src/api/salarios'
import { verificarAutenticacao } from '../../src/middleware/autenticacao'
import { lerBody } from '../../src/utils/lerBody'
import {
  buscarSalarios,
  buscarSalarioPorId,
  criarSalario,
  atualizarSalario,
  deletarSalario,
} from '../../src/services/servicoSalarios'

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

describe('controller - salarios', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    mockAutenticado()
  })

  test('GET /api/salarios deve retornar lista paginada', async () => {
    ;(buscarSalarios as jest.Mock).mockResolvedValue({
      dados: [{ id: '1', descricao: 'Salário CLT', tipo: 'fixo' }],
      total: 1,
      pagina: 1,
      limite: 10,
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/salarios')
    const res = criarRespostaFake()

    await handlerSalarios(req, res)

    expect(res.getStatus()).toBe(200)
    expect(buscarSalarios).toHaveBeenCalled()
  })

  test('GET /api/salarios deve retornar 400 quando serviço falha', async () => {
    ;(buscarSalarios as jest.Mock).mockResolvedValue({
      dados: [],
      total: 0,
      pagina: 1,
      limite: 10,
      erro: 'Erro de conexão',
    })

    const req = criarRequisicao('GET', '/api/salarios')
    const res = criarRespostaFake()

    await handlerSalarios(req, res)

    expect(res.getStatus()).toBe(400)
  })

  test('GET /api/salarios/:id deve retornar um salário', async () => {
    ;(buscarSalarioPorId as jest.Mock).mockResolvedValue({
      dados: { id: '1', descricao: 'Salário CLT' },
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/salarios/1')
    const res = criarRespostaFake()

    await handlerSalarios(req, res)

    expect(res.getStatus()).toBe(200)
    expect(res.getCorpo().dados.id).toBe('1')
  })

  test('GET /api/salarios/:id deve retornar 404 quando não encontrado', async () => {
    ;(buscarSalarioPorId as jest.Mock).mockResolvedValue({
      dados: null,
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/salarios/id-inexistente')
    const res = criarRespostaFake()

    await handlerSalarios(req, res)

    expect(res.getStatus()).toBe(404)
  })

  test('POST /api/salarios deve criar salário com dados válidos', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      tipo: 'fixo',
      descricao: 'Salário CLT',
      valor_esperado: 3000,
      data_esperada: '2026-03-05',
      mes: 3,
      ano: 2026,
    })

    ;(criarSalario as jest.Mock).mockResolvedValue({
      dados: { id: 'nova-id', descricao: 'Salário CLT' },
      erro: null,
    })

    const req = criarRequisicao('POST', '/api/salarios')
    const res = criarRespostaFake()

    await handlerSalarios(req, res)

    expect(res.getStatus()).toBe(201)
    expect(res.getCorpo().dados.id).toBe('nova-id')
  })

  test('POST /api/salarios deve retornar 400 com dados inválidos', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      tipo: 'invalido',
      descricao: '',
      valor_esperado: -100,
    })

    const req = criarRequisicao('POST', '/api/salarios')
    const res = criarRespostaFake()

    await handlerSalarios(req, res)

    expect(res.getStatus()).toBe(400)
  })

  test('POST /api/salarios deve retornar 400 quando serviço falha', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      tipo: 'fixo',
      descricao: 'Salário CLT',
      valor_esperado: 3000,
      data_esperada: '2026-03-05',
      mes: 3,
      ano: 2026,
    })

    ;(criarSalario as jest.Mock).mockResolvedValue({
      dados: null,
      erro: 'Erro ao criar',
    })

    const req = criarRequisicao('POST', '/api/salarios')
    const res = criarRespostaFake()

    await handlerSalarios(req, res)

    expect(res.getStatus()).toBe(400)
  })

  test('PUT /api/salarios/:id deve atualizar salário', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      status: 'recebido',
      valor_recebido: 3000,
    })

    ;(atualizarSalario as jest.Mock).mockResolvedValue({
      dados: { id: '1', status: 'recebido' },
      erro: null,
    })

    const req = criarRequisicao('PUT', '/api/salarios/1')
    const res = criarRespostaFake()

    await handlerSalarios(req, res)

    expect(res.getStatus()).toBe(200)
  })

  test('PUT /api/salarios/:id deve retornar 404 quando não encontrado', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({ status: 'recebido' })

    ;(atualizarSalario as jest.Mock).mockResolvedValue({
      dados: null,
      erro: null,
    })

    const req = criarRequisicao('PUT', '/api/salarios/id-inexistente')
    const res = criarRespostaFake()

    await handlerSalarios(req, res)

    expect(res.getStatus()).toBe(404)
  })

  test('DELETE /api/salarios/:id deve deletar salário', async () => {
    ;(deletarSalario as jest.Mock).mockResolvedValue({
      dados: null,
      erro: null,
    })

    const req = criarRequisicao('DELETE', '/api/salarios/1')
    const res = criarRespostaFake()

    await handlerSalarios(req, res)

    expect(res.getStatus()).toBe(200)
    expect(res.getCorpo().dados.mensagem).toBe('Salário deletado com sucesso')
  })

  test('DELETE /api/salarios/:id deve retornar 400 quando serviço falha', async () => {
    ;(deletarSalario as jest.Mock).mockResolvedValue({
      dados: null,
      erro: 'Erro ao deletar',
    })

    const req = criarRequisicao('DELETE', '/api/salarios/1')
    const res = criarRespostaFake()

    await handlerSalarios(req, res)

    expect(res.getStatus()).toBe(400)
  })

  test('deve retornar 405 para método não permitido', async () => {
    const req = criarRequisicao('PATCH', '/api/salarios')
    const res = criarRespostaFake()

    await handlerSalarios(req, res)

    expect(res.getStatus()).toBe(405)
  })

  test('deve retornar 401 quando não autenticado', async () => {
    ;(verificarAutenticacao as jest.Mock).mockResolvedValue(false)

    const req = criarRequisicao('GET', '/api/salarios')
    const res = criarRespostaFake()

    await handlerSalarios(req, res)

    expect(buscarSalarios).not.toHaveBeenCalled()
  })

})