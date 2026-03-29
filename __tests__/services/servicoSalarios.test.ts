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
  buscarSalarios,
  buscarSalarioPorId,
  criarSalario,
  atualizarSalario,
  deletarSalario,
} from '../../src/services/servicoSalarios'

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

describe('servicoSalarios', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('buscarSalarios', () => {

    test('deve retornar lista paginada de salários', async () => {
      mockSupabaseChain({
        data: [
          { id: '1', descricao: 'Salário CLT', tipo: 'fixo', valor_esperado: 3000 },
          { id: '2', descricao: 'Freelance', tipo: 'variavel', valor_esperado: 1000 },
        ],
        error: null,
        count: 2,
      })

      const resultado = await buscarSalarios({ pagina: 1, limite: 10 })

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

      const resultado = await buscarSalarios({ pagina: 1, limite: 10 })

      expect(resultado.erro).toBe('Erro de conexão')
      expect(resultado.dados).toHaveLength(0)
    })

  })

  describe('buscarSalarioPorId', () => {

    test('deve retornar salário pelo id', async () => {
      mockSupabaseChain({
        data: { id: '1', descricao: 'Salário CLT', valor_esperado: 3000 },
        error: null,
      })

      const resultado = await buscarSalarioPorId('1')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.id).toBe('1')
    })

    test('deve retornar erro quando salário não existe', async () => {
      mockSupabaseChain({
        data: null,
        error: { message: 'Registro não encontrado' },
      })

      const resultado = await buscarSalarioPorId('id-inexistente')

      expect(resultado.erro).toBe('Registro não encontrado')
      expect(resultado.dados).toBeNull()
    })

  })

  describe('criarSalario', () => {

    test('deve criar salário e registrar auditoria', async () => {
      mockSupabaseChain({
        data: {
          id: 'nova-id',
          descricao: 'Salário CLT',
          tipo: 'fixo',
          valor_esperado: 3000,
        },
        error: null,
      })

      const dados = {
        tipo: 'fixo' as const,
        descricao: 'Salário CLT',
        valor_esperado: 3000,
        status: 'pendente' as const,
        data_esperada: '2026-03-05',
        mes: 3,
        ano: 2026,
      }

      const resultado = await criarSalario(dados, 'usuario-123')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.id).toBe('nova-id')
    })

    test('deve retornar erro quando insert falha', async () => {
      mockSupabaseChain({
        data: null,
        error: { message: 'Erro ao inserir' },
      })

      const dados = {
        tipo: 'fixo' as const,
        descricao: 'Salário CLT',
        valor_esperado: 3000,
        status: 'pendente' as const,
        data_esperada: '2026-03-05',
        mes: 3,
        ano: 2026,
      }

      const resultado = await criarSalario(dados, 'usuario-123')

      expect(resultado.erro).toBe('Erro ao inserir')
      expect(resultado.dados).toBeNull()
    })

  })

  describe('atualizarSalario', () => {

    test('deve atualizar salário e registrar auditoria', async () => {
      mockSupabaseChain({
        data: { id: '1', status: 'recebido', valor_recebido: 3000 },
        error: null,
      })

      const resultado = await atualizarSalario(
        '1',
        { status: 'recebido', valor_recebido: 3000 },
        'usuario-123'
      )

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.status).toBe('recebido')
    })

  })

  describe('deletarSalario', () => {

    test('deve deletar salário e registrar auditoria', async () => {
      const chain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }
      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

      const resultado = await deletarSalario('1', 'usuario-123')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados).toBeNull()
    })

    test('deve retornar erro quando delete falha', async () => {
      const chain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Erro ao deletar' } }),
      }
      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

      const resultado = await deletarSalario('1', 'usuario-123')

      expect(resultado.erro).toBe('Erro ao deletar')
    })

  })

})