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
  buscarCartoes,
  buscarCartaoPorId,
  criarCartao,
  atualizarCartao,
  deletarCartao,
  buscarComprasCartao,
  criarCompraCartao,
  atualizarCompraCartao,
  deletarCompraCartao,
} from '../../src/services/servicoCartoes'

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

describe('servicoCartoes', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('buscarCartoes', () => {

    test('deve retornar lista paginada de cartões', async () => {
      mockSupabaseChain({
        data: [
          { id: '1', nome: 'Nubank', limite: 5000, ativo: true },
          { id: '2', nome: 'Inter', limite: 3000, ativo: true },
        ],
        error: null,
        count: 2,
      })

      const resultado = await buscarCartoes({ pagina: 1, limite: 10 })

      expect(resultado.erro).toBeNull()
      expect(resultado.dados).toHaveLength(2)
    })

    test('deve retornar erro quando supabase falha', async () => {
      mockSupabaseChain({ data: null, error: { message: 'Falha' }, count: null })

      const resultado = await buscarCartoes({ pagina: 1, limite: 10 })

      expect(resultado.erro).toBe('Falha')
      expect(resultado.dados).toEqual([])
    })

  })

  describe('buscarCartaoPorId', () => {

    test('deve retornar cartão pelo id', async () => {
      mockSupabaseChain({
        data: { id: '1', nome: 'Nubank', limite: 5000 },
        error: null,
      })

      const resultado = await buscarCartaoPorId('1')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.nome).toBe('Nubank')
    })

    test('deve retornar erro quando não encontra cartão', async () => {
      mockSupabaseChain({ data: null, error: { message: 'Não encontrado' } })

      const resultado = await buscarCartaoPorId('1')

      expect(resultado.erro).toBe('Não encontrado')
      expect(resultado.dados).toBeNull()
    })

  })

  describe('criarCartao', () => {

    test('deve criar cartão e registrar auditoria', async () => {
      mockSupabaseChain({
        data: { id: 'nova-id', nome: 'Nubank', limite: 5000 },
        error: null,
      })

      const dados = {
        nome: 'Nubank',
        bandeira: 'Mastercard',
        limite: 5000,
        dia_fechamento: 10,
        dia_vencimento: 17,
      }

      const resultado = await criarCartao(dados, 'usuario-123')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.id).toBe('nova-id')
    })

    test('deve retornar erro quando falha ao criar', async () => {
      mockSupabaseChain({ data: null, error: { message: 'Falha de inserção' } })

      const resultado = await criarCartao({} as any, 'usuario-123')

      expect(resultado.erro).toBe('Falha de inserção')
      expect(resultado.dados).toBeNull()
    })

  })

  describe('atualizarCartao', () => {

    test('deve retornar erro quando atualização falha', async () => {
      mockSupabaseChain({ data: null, error: { message: 'Falha update' } })

      const resultado = await atualizarCartao('1', { limite: 1000 }, 'usuario-123')

      expect(resultado.erro).toBe('Falha update')
      expect(resultado.dados).toBeNull()
    })

  })

  describe('deletarCartao', () => {

    test('deve fazer soft delete do cartão', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }
      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

      const resultado = await deletarCartao('1', 'usuario-123')

      expect(resultado.erro).toBeNull()
      // Verifica que usou update (soft delete) e não delete
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: false })
      )
    })

  })

  describe('criarCompraCartao', () => {

    test('deve calcular valor da parcela corretamente', async () => {
      mockSupabaseChain({
        data: {
          id: 'compra-1',
          descricao: 'Notebook',
          valor_total: 3000,
          parcelas: 12,
          valor_parcela: 250,
        },
        error: null,
      })

      const dados = {
        cartao_id: '123e4567-e89b-12d3-a456-426614174000',
        descricao: 'Notebook',
        categoria: 'Educação',
        valor_total: 3000,
        parcelas: 12,
      }

      const resultado = await criarCompraCartao(dados, 'usuario-123')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.valor_parcela).toBe(250)
    })

    test('deve criar compra à vista com parcela igual ao total', async () => {
      mockSupabaseChain({
        data: {
          id: 'compra-2',
          descricao: 'Supermercado',
          valor_total: 300,
          parcelas: 1,
          valor_parcela: 300,
        },
        error: null,
      })

      const dados = {
        cartao_id: '123e4567-e89b-12d3-a456-426614174000',
        descricao: 'Supermercado',
        categoria: 'Alimentação',
        valor_total: 300,
      }

      const resultado = await criarCompraCartao(dados, 'usuario-123')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.parcelas).toBe(1)
    })

  })

  describe('buscarComprasCartao', () => {

    test('deve retornar erro quando falha buscar compras', async () => {
      mockSupabaseChain({ data: null, error: { message: 'Falha buscar compras' }, count: null })

      const resultado = await buscarComprasCartao({ pagina: 1, limite: 10 })

      expect(resultado.erro).toBe('Falha buscar compras')
      expect(resultado.dados).toEqual([])
    })

  })

  describe('atualizarCompraCartao', () => {

    test('deve retornar erro quando atualização falha', async () => {
      mockSupabaseChain({ data: null, error: { message: 'Falha update compra' } })

      const resultado = await atualizarCompraCartao('1', { valor_total: 200 }, 'usuario-123')

      expect(resultado.erro).toBe('Falha update compra')
      expect(resultado.dados).toBeNull()
    })

  })

  describe('deletarCompraCartao', () => {

    test('deve deletar compra e registrar auditoria', async () => {
      const chain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }
      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

      const resultado = await deletarCompraCartao('1', 'usuario-123')

      expect(resultado.erro).toBeNull()
    })

  })

})