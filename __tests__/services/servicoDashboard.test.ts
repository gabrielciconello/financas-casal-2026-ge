jest.mock('../../src/services/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

import { supabaseAdmin } from '../../src/services/supabase'
import { buscarDadosDashboard } from '../../src/services/servicoDashboard'

function mockFrom(respostas: Record<string, object>) {
  ;(supabaseAdmin.from as jest.Mock).mockImplementation((tabela: string) => {
    const retorno = respostas[tabela] ?? { data: [], error: null, count: 0 }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      mockResolvedValue: jest.fn().mockResolvedValue(retorno),
      then: jest.fn().mockImplementation((cb: Function) => Promise.resolve(cb(retorno))),
      // Para consultas que usam await diretamente
      [Symbol.iterator]: undefined,
      ...{ ...retorno },
    }
  })
}

// Helper que cria mock completo de consulta encadeada resolvendo com valor
function criarMockConsulta(valor: object) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  }
  // Faz a chain ser thenable (aguardável)
  chain.then = (resolve: Function) => Promise.resolve(valor).then(resolve as any)
  chain.catch = (reject: Function) => Promise.resolve(valor).catch(reject as any)
  return chain
}

describe('servicoDashboard', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('deve retornar dados completos do dashboard', async () => {
    let chamada = 0

    ;(supabaseAdmin.from as jest.Mock).mockImplementation(() => {
      chamada++
      const chain = criarMockConsulta({ data: [], error: null, count: 0 })

      // Chamada 1: transacoes do mês atual
      if (chamada === 1) {
        return {
          ...chain,
          then: (resolve: Function) =>
            Promise.resolve({
              data: [
                { tipo: 'entrada', valor: 3000, categoria: 'Salário' },
                { tipo: 'saida', valor: 500, categoria: 'Alimentação' },
                { tipo: 'saida', valor: 200, categoria: 'Transporte' },
              ],
              error: null,
            }).then(resolve as any),
        }
      }

      // Chamada 2: gastos_fixos do mês
      if (chamada === 2) {
        return {
          ...chain,
          then: (resolve: Function) =>
            Promise.resolve({
              data: [{ valor: 1200, status: 'pendente' }],
              error: null,
            }).then(resolve as any),
        }
      }

      // Chamada 3: transacoes saida para categorias
      if (chamada === 3) {
        return {
          ...chain,
          then: (resolve: Function) =>
            Promise.resolve({
              data: [
                { categoria: 'Alimentação', valor: 500 },
                { categoria: 'Transporte', valor: 200 },
              ],
              error: null,
            }).then(resolve as any),
        }
      }

      // Chamadas 4-9: histórico dos últimos 6 meses
      if (chamada >= 4 && chamada <= 9) {
        return {
          ...chain,
          then: (resolve: Function) =>
            Promise.resolve({
              data: [{ tipo: 'entrada', valor: 2500 }],
              error: null,
            }).then(resolve as any),
        }
      }

      // Chamada 10: próximos vencimentos
      if (chamada === 10) {
        return {
          ...chain,
          then: (resolve: Function) =>
            Promise.resolve({
              data: [{ id: '1', descricao: 'Luz', valor: 150, dia_vencimento: 28 }],
              error: null,
            }).then(resolve as any),
        }
      }

      // Chamadas restantes: mês anterior
      return {
        ...chain,
        then: (resolve: Function) =>
          Promise.resolve({ data: [], error: null }).then(resolve as any),
      }
    })

    const resultado = await buscarDadosDashboard(3, 2026)

    expect(resultado.erro).toBeNull()
    expect(resultado.dados).toBeDefined()
    expect(resultado.dados?.resumo.total_entradas).toBe(3000)
    expect(resultado.dados?.resumo.total_saidas).toBe(700)
    expect(resultado.dados?.resumo.saldo_atual).toBe(2300)
  })

  test('deve calcular saúde financeira como ótima quando gasto é menor que 50%', async () => {
    let chamada = 0

    ;(supabaseAdmin.from as jest.Mock).mockImplementation(() => {
      chamada++
      const chain = criarMockConsulta({ data: [], error: null })

      if (chamada === 1) {
        return {
          ...chain,
          then: (resolve: Function) =>
            Promise.resolve({
              data: [
                { tipo: 'entrada', valor: 5000, categoria: 'Salário' },
                { tipo: 'saida', valor: 1000, categoria: 'Alimentação' },
              ],
              error: null,
            }).then(resolve as any),
        }
      }

      return {
        ...chain,
        then: (resolve: Function) =>
          Promise.resolve({ data: [], error: null }).then(resolve as any),
      }
    })

    const resultado = await buscarDadosDashboard(3, 2026)

    expect(resultado.dados?.saude_financeira.classificacao).toBe('otima')
    expect(resultado.dados?.saude_financeira.percentual_gasto).toBe(20)
  })

  test('deve retornar erro quando Supabase falha', async () => {
    ;(supabaseAdmin.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: (resolve: Function) =>
        Promise.resolve({ data: null, error: { message: 'Erro de conexão' } }).then(resolve as any),
    }))

    const resultado = await buscarDadosDashboard(3, 2026)

    expect(resultado.erro).toBeDefined()
  })

  test('deve retornar saldo zero quando não há transações', async () => {
    ;(supabaseAdmin.from as jest.Mock).mockImplementation(() => {
      const chain = criarMockConsulta({ data: [], error: null })
      return {
        ...chain,
        then: (resolve: Function) =>
          Promise.resolve({ data: [], error: null }).then(resolve as any),
      }
    })

    const resultado = await buscarDadosDashboard(3, 2026)

    expect(resultado.dados?.resumo.total_entradas).toBe(0)
    expect(resultado.dados?.resumo.total_saidas).toBe(0)
    expect(resultado.dados?.resumo.saldo_atual).toBe(0)
  })

})