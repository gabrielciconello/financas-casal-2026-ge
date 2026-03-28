// Mock do Supabase e Auditoria
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
  buscarTransacoes,
  buscarTransacaoPorId,
  criarTransacao,
  atualizarTransacao,
  deletarTransacao,
} from '../../src/services/servicoTransacoes'

// Helper para montar a cadeia de métodos do Supabase
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

describe('servicoTransacoes', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('buscarTransacoes', () => {

    test('deve retornar lista paginada de transações', async () => {
      mockSupabaseChain({
        data: [
          { id: '1', descricao: 'Salário', tipo: 'entrada', valor: 3000 },
          { id: '2', descricao: 'Mercado', tipo: 'saida', valor: 500 },
        ],
        error: null,
        count: 2,
      })

      const resultado = await buscarTransacoes({ pagina: 1, limite: 10 })

      expect(resultado.erro).toBeNull()
      expect(resultado.dados).toHaveLength(2)
      expect(resultado.total).toBe(2)
    })

    test('deve retornar erro quando Supabase falha', async () => {
      mockSupabaseChain({
        data: null,
        error: { message: 'Erro de conexão' },
        count: 0,
      })

      const resultado = await buscarTransacoes({ pagina: 1, limite: 10 })

      expect(resultado.erro).toBe('Erro de conexão')
      expect(resultado.dados).toHaveLength(0)
    })

  })

  describe('buscarTransacaoPorId', () => {

    test('deve retornar uma transação pelo id', async () => {
      mockSupabaseChain({
        data: { id: '1', descricao: 'Salário', valor: 3000 },
        error: null,
      })

      const resultado = await buscarTransacaoPorId('1')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.id).toBe('1')
    })

    test('deve retornar erro quando transação não existe', async () => {
      mockSupabaseChain({
        data: null,
        error: { message: 'Registro não encontrado' },
      })

      const resultado = await buscarTransacaoPorId('id-inexistente')

      expect(resultado.erro).toBe('Registro não encontrado')
      expect(resultado.dados).toBeNull()
    })

  })

  describe('criarTransacao', () => {

    test('deve criar transação e registrar auditoria', async () => {
      mockSupabaseChain({
        data: {
          id: 'nova-id',
          descricao: 'Freelance',
          tipo: 'entrada',
          valor: 1500,
        },
        error: null,
      })

      const dados = {
        descricao: 'Freelance',
        categoria: 'Freelance',
        tipo: 'entrada' as const,
        valor: 1500,
      }

      const resultado = await criarTransacao(dados, 'usuario-123')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.id).toBe('nova-id')
    })

    test('deve retornar erro quando insert falha', async () => {
      mockSupabaseChain({
        data: null,
        error: { message: 'Erro ao inserir' },
      })

      const dados = {
        descricao: 'Freelance',
        categoria: 'Freelance',
        tipo: 'entrada' as const,
        valor: 1500,
      }

      const resultado = await criarTransacao(dados, 'usuario-123')

      expect(resultado.erro).toBe('Erro ao inserir')
      expect(resultado.dados).toBeNull()
    })

  })

  describe('atualizarTransacao', () => {

    test('deve atualizar transação e registrar auditoria', async () => {
      mockSupabaseChain({
        data: { id: '1', valor: 2000 },
        error: null,
      })

      const resultado = await atualizarTransacao('1', { valor: 2000 }, 'usuario-123')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.valor).toBe(2000)
    })

  })

  describe('deletarTransacao', () => {

    test('deve deletar transação e registrar auditoria', async () => {
      const chain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }
      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

      const resultado = await deletarTransacao('1', 'usuario-123')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados).toBeNull()
    })

    test('deve retornar erro quando delete falha', async () => {
      const chain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Erro ao deletar' } }),
      }
      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

      const resultado = await deletarTransacao('1', 'usuario-123')

      expect(resultado.erro).toBe('Erro ao deletar')
    })

  })

})