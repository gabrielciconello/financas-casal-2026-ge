jest.mock('../../src/services/servicoIA', () => ({
  perguntarIA: jest.fn(),
  gerarResumoMensal: jest.fn(),
  categorizarTransacao: jest.fn(),
}))

jest.mock('../../src/middleware/autenticacao', () => ({
  verificarAutenticacao: jest.fn(),
}))

jest.mock('../../src/utils/lerBody', () => ({
  lerBody: jest.fn(),
}))

import { EventEmitter } from 'events'
import handlerIA from '../../src/api/ia'
import { verificarAutenticacao } from '../../src/middleware/autenticacao'
import { lerBody } from '../../src/utils/lerBody'
import {
  perguntarIA,
  gerarResumoMensal,
  categorizarTransacao,
} from '../../src/services/servicoIA'

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

describe('controller - ia', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    mockAutenticado()
  })

  test('POST /api/ia/chat deve retornar resposta da IA', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      pergunta: 'quanto gastei esse mês?',
    })

    ;(perguntarIA as jest.Mock).mockResolvedValue({
      dados: { resposta: 'Você gastou R$ 700,00 esse mês.' },
      erro: null,
    })

    const req = criarRequisicao('POST', '/api/ia/chat')
    const res = criarRespostaFake()

    await handlerIA(req, res)

    expect(res.getStatus()).toBe(200)
    expect(res.getCorpo().dados.resposta).toContain('R$ 700')
  })

  test('POST /api/ia/chat deve retornar 400 com pergunta vazia', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({ pergunta: '' })

    const req = criarRequisicao('POST', '/api/ia/chat')
    const res = criarRespostaFake()

    await handlerIA(req, res)

    expect(res.getStatus()).toBe(400)
    expect(res.getCorpo().erro).toBe('Pergunta não pode ser vazia')
  })

  test('POST /api/ia/chat deve retornar 400 quando IA falha', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({
      pergunta: 'qual meu saldo?',
    })

    ;(perguntarIA as jest.Mock).mockResolvedValue({
      dados: null,
      erro: 'Erro ao comunicar com a IA',
    })

    const req = criarRequisicao('POST', '/api/ia/chat')
    const res = criarRespostaFake()

    await handlerIA(req, res)

    expect(res.getStatus()).toBe(400)
  })

  test('GET /api/ia/resumo deve retornar resumo mensal', async () => {
    ;(gerarResumoMensal as jest.Mock).mockResolvedValue({
      dados: { resposta: 'Março foi um mês positivo com saldo de R$ 2.300.' },
      erro: null,
    })

    const req = criarRequisicao('GET', '/api/ia/resumo?mes=3&ano=2026')
    const res = criarRespostaFake()

    await handlerIA(req, res)

    expect(res.getStatus()).toBe(200)
    expect(gerarResumoMensal).toHaveBeenCalledWith(3, 2026)
  })

  test('GET /api/ia/resumo deve retornar 400 quando IA falha', async () => {
    ;(gerarResumoMensal as jest.Mock).mockResolvedValue({
      dados: null,
      erro: 'Erro ao gerar resumo',
    })

    const req = criarRequisicao('GET', '/api/ia/resumo')
    const res = criarRespostaFake()

    await handlerIA(req, res)

    expect(res.getStatus()).toBe(400)
  })

  test('POST /api/ia/categorizar deve categorizar transação', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({ descricao: 'iFood' })

    ;(categorizarTransacao as jest.Mock).mockResolvedValue({
      dados: { categoria: 'Alimentação' },
      erro: null,
    })

    const req = criarRequisicao('POST', '/api/ia/categorizar')
    const res = criarRespostaFake()

    await handlerIA(req, res)

    expect(res.getStatus()).toBe(200)
    expect(res.getCorpo().dados.categoria).toBe('Alimentação')
  })

  test('POST /api/ia/categorizar deve retornar 400 com descrição vazia', async () => {
    ;(lerBody as jest.Mock).mockResolvedValue({ descricao: '' })

    const req = criarRequisicao('POST', '/api/ia/categorizar')
    const res = criarRespostaFake()

    await handlerIA(req, res)

    expect(res.getStatus()).toBe(400)
    expect(res.getCorpo().erro).toBe('Descrição não pode ser vazia')
  })

  test('deve retornar 405 para método não permitido', async () => {
    const req = criarRequisicao('DELETE', '/api/ia/chat')
    const res = criarRespostaFake()

    await handlerIA(req, res)

    expect(res.getStatus()).toBe(405)
  })

  test('deve retornar 401 quando não autenticado', async () => {
    ;(verificarAutenticacao as jest.Mock).mockResolvedValue(false)

    const req = criarRequisicao('POST', '/api/ia/chat')
    const res = criarRespostaFake()

    await handlerIA(req, res)

    expect(perguntarIA).not.toHaveBeenCalled()
  })

})