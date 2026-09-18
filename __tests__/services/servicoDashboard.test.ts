jest.mock('../../src/services/supabase.node', () => ({
  supabaseAdmin: { from: jest.fn() },
}))

import { supabaseAdmin } from '../../src/services/supabase.node'
import { buscarDadosDashboard } from '../../src/services/servicoDashboard'

type Resposta = { data: any[] | null; error: { message: string } | null }

function consulta(resposta: Resposta) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  }
  chain.then = (resolve: (valor: Resposta) => unknown) => Promise.resolve(resposta).then(resolve)
  return chain
}

function configurarTabelas(dados: Partial<Record<string, any[]>> = {}) {
  ;(supabaseAdmin.from as jest.Mock).mockImplementation((tabela: string) =>
    consulta({ data: dados[tabela] ?? [], error: null })
  )
}

describe('servicoDashboard', () => {
  beforeEach(() => jest.clearAllMocks())

  test('deve retornar dados completos do dashboard', async () => {
    configurarTabelas({
      transacoes: [
        { id: 't1', tipo: 'entrada', valor: 3000, categoria: 'Salário', descricao: 'Renda', data: '2026-03-05', status: 'efetivado' },
        { id: 't2', tipo: 'saida', valor: 500, categoria: 'Alimentação', descricao: 'Mercado', data: '2026-03-10', status: 'efetivado' },
        { id: 't3', tipo: 'saida', valor: 200, categoria: 'Transporte', descricao: 'Combustível', data: '2026-03-12', status: 'efetivado' },
      ],
    })

    const resultado = await buscarDadosDashboard(3, 2026)

    expect(resultado.erro).toBeNull()
    expect(resultado.dados?.resumo.total_entradas).toBe(3000)
    expect(resultado.dados?.resumo.total_saidas).toBe(700)
    expect(resultado.dados?.resumo.saldo_atual).toBe(2300)
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(6)
  })

  test('deve calcular saúde financeira como ótima quando gasto é menor que 50%', async () => {
    configurarTabelas({
      transacoes: [
        { id: 't1', tipo: 'entrada', valor: 5000, categoria: 'Salário', descricao: 'Renda', data: '2026-03-01', status: 'efetivado' },
        { id: 't2', tipo: 'saida', valor: 1000, categoria: 'Alimentação', descricao: 'Mercado', data: '2026-03-02', status: 'efetivado' },
      ],
    })

    const resultado = await buscarDadosDashboard(3, 2026)

    expect(resultado.dados?.saude_financeira.classificacao).toBe('otima')
    expect(resultado.dados?.saude_financeira.percentual_gasto).toBe(20)
  })

  test('deve retornar erro quando Supabase falha', async () => {
    ;(supabaseAdmin.from as jest.Mock).mockImplementation(() =>
      consulta({ data: null, error: { message: 'Erro de conexão' } })
    )

    const resultado = await buscarDadosDashboard(3, 2026)
    expect(resultado.erro).toBe('Erro de conexão')
  })

  test('deve retornar saldo zero quando não há transações', async () => {
    configurarTabelas()

    const resultado = await buscarDadosDashboard(3, 2026)

    expect(resultado.dados?.resumo.total_entradas).toBe(0)
    expect(resultado.dados?.resumo.total_saidas).toBe(0)
    expect(resultado.dados?.resumo.saldo_atual).toBe(0)
  })
})
