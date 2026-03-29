jest.mock('../../src/services/servicoMetas', () => ({
  buscarMetas: jest.fn(),
  buscarMetaPorId: jest.fn(),
  criarMeta: jest.fn(),
  atualizarMeta: jest.fn(),
  deletarMeta: jest.fn(),
  buscarContribuicoes: jest.fn(),
  criarContribuicao: jest.fn(),
}))

jest.mock('../../src/middleware/autenticacao', () => ({
  verificarAutenticacao: jest.fn(),
}))

jest.mock('../../src/utils/lerBody', () => ({
  lerBody: jest.fn(),
}))

import { EventEmitter } from 'events'
import handlerMetas from '../../src/api/metas'
import { verificarAutenticacao } from '../../src/middleware/autenticacao'
import { lerBody } from '../../src/utils/lerBody'
import {
  buscarMetas,
  buscarMetaPorId,
  criarMeta,
  atualizarMeta,
  deletarMeta,
  buscarContribuicoes,
  criarContribuicao,
} from '../../src/services/servicoMetas'

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

describe('controller - metas', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    mockAutenticado()
  })

  test('GET /api/metas deve retornar lista paginada', async () => {
    ;(buscarMetas as jest.Mock).mockResolvedValue({
      dados: [{ id: '1', titulo: 'Viagem', valor_alvo: 15000 }],
      total: 1,
      pagina: 1,
      limite: 10,
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/metas')
    const res = criarRespostaFake()

    await handlerMetas(req, res)

    expect(res.getStatus()).toBe(200)
    expect(buscarMetas).toHaveBeenCalled()
  })

  test('GET /api/metas deve retornar 400 quando serviço falha', async () => {
    ;(buscarMetas as jest.Mock).mockResolvedValue({
      dados: [],
      total: 0,
      pagina: 1,
      limite: 10,
      erro: 'Erro de conexão',
    })

    const req = criarRequisicao('GET', '/api/metas')
    const res = criarRespostaFake()

    await handlerMetas(req, res)

    expect(res.getStatus()).toBe(400)
  })

  test('GET /api/metas/:id deve retornar uma meta', async () => {
    ;(buscarMetaPorId as jest.Mock).mockResolvedValue({
      dados: { id: '1', titulo: 'Viagem' },
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/metas/1')
    const res = criarRespostaFake()

    await handlerMetas(req, res)

    expect(res.getStatus()).toBe(200)
    expect(res.getCorpo().dados.id).toBe('1')
  })

  test('GET /api/metas/:id deve retornar 404 quando não encontrado', async () => {
    ;(buscarMetaPorId as jest.Mock).mockResolvedValue({
      dados: null,
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/metas/id-inexistente')
    const res = criarRespostaFake()

    await handlerMetas(req, res)

    expect(res.getStatus()).toBe(404)
  })

  test('POST /api/metas deve criar meta com dados válidos', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      titulo: 'Viagem para Europa',
      valor_alvo: 15000,
      aporte_mensal: 500,
    })

    ;(criarMeta as jest.Mock).mockResolvedValue({
      dados: { id: 'nova-id', titulo: 'Viagem para Europa' },
      erro: null,
    })

    const req = criarRequisicao('POST', '/api/metas')
    const res = criarRespostaFake()

    await handlerMetas(req, res)

    expect(res.getStatus()).toBe(201)
    expect(res.getCorpo().dados.id).toBe('nova-id')
  })

  test('POST /api/metas deve retornar 400 com dados inválidos', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      titulo: 'Ab',
      valor_alvo: -100,
    })

    const req = criarRequisicao('POST', '/api/metas')
    const res = criarRespostaFake()

    await handlerMetas(req, res)

    expect(res.getStatus()).toBe(400)
  })

  test('PUT /api/metas/:id deve atualizar meta', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({ valor_alvo: 20000 })

    ;(atualizarMeta as jest.Mock).mockResolvedValue({
      dados: { id: '1', valor_alvo: 20000 },
      erro: null,
    })

    const req = criarRequisicao('PUT', '/api/metas/1')
    const res = criarRespostaFake()

    await handlerMetas(req, res)

    expect(res.getStatus()).toBe(200)
  })

  test('PUT /api/metas/:id deve retornar 404 quando não encontrado', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({ valor_alvo: 20000 })

    ;(atualizarMeta as jest.Mock).mockResolvedValue({
      dados: null,
      erro: null,
    })

    const req = criarRequisicao('PUT', '/api/metas/id-inexistente')
    const res = criarRespostaFake()

    await handlerMetas(req, res)

    expect(res.getStatus()).toBe(404)
  })

  test('DELETE /api/metas/:id deve deletar meta', async () => {
    ;(deletarMeta as jest.Mock).mockResolvedValue({
      dados: null,
      erro: null,
    })

    const req = criarRequisicao('DELETE', '/api/metas/1')
    const res = criarRespostaFake()

    await handlerMetas(req, res)

    expect(res.getStatus()).toBe(200)
    expect(res.getCorpo().dados.mensagem).toBe('Meta deletada com sucesso')
  })

  // ==========================================
  // CONTRIBUIÇÕES
  // ==========================================
  test('GET /api/metas/:id/contribuicoes deve retornar contribuições', async () => {
    ;(buscarContribuicoes as jest.Mock).mockResolvedValue({
      dados: [{ id: '1', valor: 500 }],
      total: 1,
      pagina: 1,
      limite: 10,
      erro: null,
    })

    const metaId = '00000000-0000-0000-0000-000000000001'
    const req = criarRequisicao('GET', `/api/metas/${metaId}/contribuicoes`)
    const res = criarRespostaFake()

    await handlerMetas(req, res)

    expect(res.getStatus()).toBe(200)
    expect(buscarContribuicoes).toHaveBeenCalledWith(metaId, expect.any(Object))
  })

  test('POST /api/metas/:id/contribuicoes deve criar contribuição', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      valor: 500,
      observacoes: 'Aporte de março',
    })

    ;(criarContribuicao as jest.Mock).mockResolvedValue({
      dados: { id: 'contrib-1', valor: 500 },
      erro: null,
    })

    const metaId = '00000000-0000-0000-0000-000000000001'
    const req = criarRequisicao('POST', `/api/metas/${metaId}/contribuicoes`)
    const res = criarRespostaFake()

    await handlerMetas(req, res)

    expect(res.getStatus()).toBe(201)
  })

  test('deve retornar 405 para método não permitido', async () => {
    const req = criarRequisicao('PATCH', '/api/metas')
    const res = criarRespostaFake()

    await handlerMetas(req, res)

    expect(res.getStatus()).toBe(405)
  })

  test('deve retornar 401 quando não autenticado', async () => {
    ;(verificarAutenticacao as jest.Mock).mockResolvedValue(false)

    const req = criarRequisicao('GET', '/api/metas')
    const res = criarRespostaFake()

    await handlerMetas(req, res)

    expect(buscarMetas).not.toHaveBeenCalled()
  })

})