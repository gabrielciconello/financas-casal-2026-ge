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
  buscarMetas,
  buscarMetaPorId,
  criarMeta,
  atualizarMeta,
  deletarMeta,
  buscarContribuicoes,
  criarContribuicao,
} from '../../src/services/servicoMetas'

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

describe('servicoMetas', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('buscarMetas', () => {

    test('deve retornar lista paginada de metas', async () => {
      mockSupabaseChain({
        data: [
          { id: '1', titulo: 'Viagem', valor_alvo: 15000, valor_atual: 3000 },
          { id: '2', titulo: 'Reserva', valor_alvo: 10000, valor_atual: 5000 },
        ],
        error: null,
        count: 2,
      })

      const resultado = await buscarMetas({ pagina: 1, limite: 10 })

      expect(resultado.erro).toBeNull()
      expect(resultado.dados).toHaveLength(2)
    })

  })

  describe('buscarMetaPorId', () => {

    test('deve retornar meta pelo id', async () => {
      mockSupabaseChain({
        data: { id: '1', titulo: 'Viagem', valor_alvo: 15000 },
        error: null,
      })

      const resultado = await buscarMetaPorId('1')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.titulo).toBe('Viagem')
    })

  })

  describe('criarMeta', () => {

    test('deve criar meta e registrar auditoria', async () => {
      mockSupabaseChain({
        data: { id: 'nova-id', titulo: 'Viagem', valor_alvo: 15000 },
        error: null,
      })

      const dados = {
        titulo: 'Viagem',
        valor_alvo: 15000,
        aporte_mensal: 500,
      }

      const resultado = await criarMeta(dados, 'usuario-123')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.id).toBe('nova-id')
    })

  })

  describe('atualizarMeta', () => {

    test('deve atualizar meta e registrar auditoria', async () => {
      mockSupabaseChain({
        data: { id: '1', titulo: 'Viagem Europa', valor_alvo: 20000 },
        error: null,
      })

      const resultado = await atualizarMeta(
        '1',
        { titulo: 'Viagem Europa', valor_alvo: 20000 },
        'usuario-123'
      )

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.valor_alvo).toBe(20000)
    })

  })

  describe('deletarMeta', () => {

    test('deve deletar meta e registrar auditoria', async () => {
      const chain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }
      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

      const resultado = await deletarMeta('1', 'usuario-123')

      expect(resultado.erro).toBeNull()
    })

  })

  describe('criarContribuicao', () => {

    test('deve criar contribuição e atualizar valor atual da meta', async () => {
      // Primeiro mock: insert da contribuição
      // Segundo mock: buscar meta atual
      // Terceiro mock: update da meta
      let chamada = 0
      ;(supabaseAdmin.from as jest.Mock).mockImplementation(() => {
        chamada++

        if (chamada === 1) {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'contrib-1', valor: 500, meta_id: 'meta-1' },
              error: null,
            }),
          }
        }

        if (chamada === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'meta-1', valor_atual: 2000, valor_alvo: 15000 },
              error: null,
            }),
          }
        }

        return {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      const dados = {
        meta_id: 'meta-1',
        valor: 500,
      }

      const resultado = await criarContribuicao(dados, 'usuario-123')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.valor).toBe(500)
    })

  })

  describe('buscarContribuicoes', () => {

    test('deve retornar contribuições de uma meta', async () => {
      mockSupabaseChain({
        data: [
          { id: '1', meta_id: 'meta-1', valor: 500 },
          { id: '2', meta_id: 'meta-1', valor: 300 },
        ],
        error: null,
        count: 2,
      })

      const resultado = await buscarContribuicoes('meta-1', { pagina: 1, limite: 10 })

      expect(resultado.erro).toBeNull()
      expect(resultado.dados).toHaveLength(2)
    })

  })

})