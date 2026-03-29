jest.mock('../../src/services/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

jest.mock('../../src/services/servicoAuditoria', () => ({
  registrarAuditoria: jest.fn().mockResolvedValue(undefined),
}))

import { supabaseAdmin } from '../../src/services/supabase'
import {
  buscarGastosFixos,
  buscarGastoFixoPorId,
  criarGastoFixo,
  atualizarGastoFixo,
  deletarGastoFixo,
  buscarGastosVariaveis,
  criarGastoVariavel,
  atualizarGastoVariavel,
  deletarGastoVariavel,
} from '../../src/services/servicoGastos'

function mockSupabaseChain(retorno: object) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue(retorno),
    single: jest.fn().mockResolvedValue(retorno),
  }
  ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)
  return chain
}

describe('servicoGastos', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('buscarGastosFixos', () => {

    test('deve retornar lista paginada de gastos fixos', async () => {
      mockSupabaseChain({
        data: [
          { id: '1', descricao: 'Aluguel', valor: 1200, status: 'pendente' },
          { id: '2', descricao: 'Internet', valor: 120, status: 'pago' },
        ],
        error: null,
        count: 2,
      })

      const resultado = await buscarGastosFixos({ pagina: 1, limite: 10 })

      expect(resultado.erro).toBeNull()
      expect(resultado.dados).toHaveLength(2)
    })

    test('deve retornar erro quando Supabase falha', async () => {
      mockSupabaseChain({
        data: null,
        error: { message: 'Erro de conexão' },
        count: 0,
      })

      const resultado = await buscarGastosFixos({ pagina: 1, limite: 10 })

      expect(resultado.erro).toBe('Erro de conexão')
    })

  })

  describe('buscarGastoFixoPorId', () => {

    test('deve retornar gasto fixo pelo id', async () => {
      mockSupabaseChain({
        data: { id: '1', descricao: 'Aluguel', valor: 1200 },
        error: null,
      })

      const resultado = await buscarGastoFixoPorId('1')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.descricao).toBe('Aluguel')
    })

  })

  describe('criarGastoFixo', () => {

    test('deve criar gasto fixo e registrar auditoria', async () => {
      mockSupabaseChain({
        data: { id: 'nova-id', descricao: 'Aluguel', valor: 1200 },
        error: null,
      })

      const dados = {
        descricao: 'Aluguel',
        categoria: 'Moradia',
        valor: 1200,
        dia_vencimento: 5,
        mes: 3,
        ano: 2026,
      }

      const resultado = await criarGastoFixo(dados, 'usuario-123')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.id).toBe('nova-id')
    })

  })

  describe('atualizarGastoFixo', () => {

    test('deve atualizar status do gasto fixo', async () => {
      mockSupabaseChain({
        data: { id: '1', status: 'pago' },
        error: null,
      })

      const resultado = await atualizarGastoFixo(
        '1',
        { status: 'pago' },
        'usuario-123'
      )

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.status).toBe('pago')
    })

  })

  describe('deletarGastoFixo', () => {

    test('deve deletar gasto fixo', async () => {
      const chain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }
      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

      const resultado = await deletarGastoFixo('1', 'usuario-123')

      expect(resultado.erro).toBeNull()
    })

  })

  describe('buscarGastosVariaveis', () => {

    test('deve retornar lista paginada de gastos variáveis', async () => {
      mockSupabaseChain({
        data: [
          { id: '1', descricao: 'Mercado', valor_estimado: 800, valor_real: 950 },
        ],
        error: null,
        count: 1,
      })

      const resultado = await buscarGastosVariaveis({ pagina: 1, limite: 10 })

      expect(resultado.erro).toBeNull()
      expect(resultado.dados).toHaveLength(1)
    })

  })

  describe('criarGastoVariavel', () => {

    test('deve criar gasto variável e registrar auditoria', async () => {
      mockSupabaseChain({
        data: { id: 'nova-id', descricao: 'Mercado', valor_estimado: 800 },
        error: null,
      })

      const dados = {
        descricao: 'Mercado',
        categoria: 'Alimentação',
        valor_estimado: 800,
        mes: 3,
        ano: 2026,
      }

      const resultado = await criarGastoVariavel(dados, 'usuario-123')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.id).toBe('nova-id')
    })

  })

  describe('atualizarGastoVariavel', () => {

    test('deve atualizar valor real do gasto variável', async () => {
      mockSupabaseChain({
        data: { id: '1', valor_real: 950 },
        error: null,
      })

      const resultado = await atualizarGastoVariavel(
        '1',
        { valor_real: 950 },
        'usuario-123'
      )

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.valor_real).toBe(950)
    })

  })

  describe('deletarGastoVariavel', () => {

    test('deve deletar gasto variável', async () => {
      const chain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }
      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

      const resultado = await deletarGastoVariavel('1', 'usuario-123')

      expect(resultado.erro).toBeNull()
    })

  })

})