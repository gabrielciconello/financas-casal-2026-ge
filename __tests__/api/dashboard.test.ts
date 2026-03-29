jest.mock('../../src/services/servicoDashboard', () => ({
  buscarDadosDashboard: jest.fn(),
}))

jest.mock('../../src/middleware/autenticacao', () => ({
  verificarAutenticacao: jest.fn(),
}))

import { EventEmitter } from 'events'
import handlerDashboard from '../../src/api/dashboard'
import { verificarAutenticacao } from '../../src/middleware/autenticacao'
import { buscarDadosDashboard } from '../../src/services/servicoDashboard'

function criarRequisicaoFake(method: string, url: string) {
  const emitter = new EventEmitter() as any
  emitter.method = method
  emitter.url = url
  emitter.headers = { host: 'localhost:3000' }
  process.nextTick(() => emitter.emit('end'))
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

describe('controller - dashboard', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verificarAutenticacao as jest.Mock).mockImplementation(async (req) => {
      req.usuario = { id: 'usuario-123', email: 'teste@email.com' }
      return true
    })
  })

  test('GET /api/dashboard deve retornar dados do dashboard', async () => {
    ;(buscarDadosDashboard as jest.Mock).mockResolvedValue({
      dados: {
        resumo: { total_entradas: 3000, total_saidas: 700, saldo_atual: 2300 },
        gastos_por_categoria: [],
        historico_mensal: [],
        proximos_vencimentos: [],
        comparativo: {},
        saude_financeira: { percentual_gasto: 23.3, classificacao: 'otima' },
      },
      erro: null,
    })

    const req = criarRequisicaoFake('GET', '/api/dashboard')
    const res = criarRespostaFake()

    await handlerDashboard(req, res)

    expect(res.getStatus()).toBe(200)
    expect(res.getCorpo().dados.resumo.saldo_atual).toBe(2300)
  })

  test('GET /api/dashboard deve aceitar filtros de mês e ano', async () => {
    ;(buscarDadosDashboard as jest.Mock).mockResolvedValue({
      dados: { resumo: { saldo_atual: 1000 } },
      erro: null,
    })

    const req = criarRequisicaoFake('GET', '/api/dashboard?mes=1&ano=2026')
    const res = criarRespostaFake()

    await handlerDashboard(req, res)

    expect(buscarDadosDashboard).toHaveBeenCalledWith(1, 2026)
  })

  test('deve retornar 405 para método POST', async () => {
    const req = criarRequisicaoFake('POST', '/api/dashboard')
    const res = criarRespostaFake()

    await handlerDashboard(req, res)

    expect(res.getStatus()).toBe(405)
  })

  test('deve retornar 400 quando serviço falha', async () => {
    ;(buscarDadosDashboard as jest.Mock).mockResolvedValue({
      dados: null,
      erro: 'Erro ao buscar dados',
    })

    const req = criarRequisicaoFake('GET', '/api/dashboard')
    const res = criarRespostaFake()

    await handlerDashboard(req, res)

    expect(res.getStatus()).toBe(400)
    expect(res.getCorpo().erro).toBe('Erro ao buscar dados')
  })

})