jest.mock('../../src/services/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

import { supabaseAdmin } from '../../src/services/supabase.node'
import { registrarAuditoria } from '../../src/services/servicoAuditoria'

describe('servicoAuditoria', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('deve registrar auditoria com sucesso', async () => {
    const chain = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

    await expect(
      registrarAuditoria({
        usuarioId: 'usuario-123',
        acao: 'CRIAR',
        modulo: 'transacoes',
        registroId: 'registro-123',
        descricao: 'Transação criada',
      })
    ).resolves.toBeUndefined()

    expect(supabaseAdmin.from).toHaveBeenCalledWith('logs_auditoria')
    expect(chain.insert).toHaveBeenCalledWith({
      usuario_id: 'usuario-123',
      acao: 'CRIAR',
      modulo: 'transacoes',
      registro_id: 'registro-123',
      descricao: 'Transação criada',
    })
  })

  test('deve registrar auditoria sem descrição', async () => {
    const chain = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

    await expect(
      registrarAuditoria({
        usuarioId: 'usuario-123',
        acao: 'DELETAR',
        modulo: 'metas',
        registroId: 'registro-456',
      })
    ).resolves.toBeUndefined()
  })

  test('deve logar erro mas não lançar exceção quando Supabase falha', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const chain = {
      insert: jest.fn().mockResolvedValue({ error: { message: 'Erro no banco' } }),
    }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

    await expect(
      registrarAuditoria({
        usuarioId: 'usuario-123',
        acao: 'ATUALIZAR',
        modulo: 'salarios',
        registroId: 'registro-789',
      })
    ).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalledWith('Erro ao registrar auditoria:', 'Erro no banco')
    consoleSpy.mockRestore()
  })

  test('deve funcionar com todas as ações possíveis', async () => {
    const chain = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

    const acoes = ['CRIAR', 'ATUALIZAR', 'DELETAR'] as const

    for (const acao of acoes) {
      await expect(
        registrarAuditoria({
          usuarioId: 'usuario-123',
          acao,
          modulo: 'transacoes',
          registroId: 'registro-123',
        })
      ).resolves.toBeUndefined()
    }
  })

  test('deve funcionar com todos os módulos possíveis', async () => {
    const chain = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)

    const modulos = [
      'transacoes',
      'salarios',
      'cartoes',
      'compras_cartao',
      'gastos_fixos',
      'gastos_variaveis',
      'metas',
      'contribuicoes_metas',
      'orcamentos',
    ] as const

    for (const modulo of modulos) {
      await expect(
        registrarAuditoria({
          usuarioId: 'usuario-123',
          acao: 'CRIAR',
          modulo,
          registroId: 'registro-123',
        })
      ).resolves.toBeUndefined()
    }
  })

})