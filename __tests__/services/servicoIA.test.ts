jest.mock('../../src/services/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

jest.mock('../../src/services/gemini', () => ({
  modelo: {
    startChat: jest.fn(),
    generateContent: jest.fn(),
  },
}))

import { supabaseAdmin } from '../../src/services/supabase'
import { modelo } from '../../src/services/gemini'
import {
  perguntarIA,
  gerarResumoMensal,
  categorizarTransacao,
} from '../../src/services/servicoIA'

function criarMockConsulta(data: object) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    head: jest.fn().mockReturnThis(),
  }
  chain.then = (resolve: Function) =>
    Promise.resolve({ data, error: null, count: 0 }).then(resolve as any)
  chain.catch = (reject: Function) =>
    Promise.resolve({ data, error: null }).catch(reject as any)
  return chain
}

function mockContextoVazio() {
  ;(supabaseAdmin.from as jest.Mock).mockImplementation(() =>
    criarMockConsulta([])
  )
}

describe('servicoIA', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('perguntarIA', () => {

    test('deve retornar resposta da IA para pergunta válida', async () => {
      mockContextoVazio()

      const mockChat = {
        sendMessage: jest.fn().mockResolvedValue({
          response: { text: () => 'Você gastou R$ 500 com alimentação este mês.' },
        }),
      }
      ;(modelo.startChat as jest.Mock).mockReturnValue(mockChat)

      const resultado = await perguntarIA('quanto gastei com alimentação?', 3, 2026)

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.resposta).toBe('Você gastou R$ 500 com alimentação este mês.')
    })

    test('deve retornar erro quando IA falha', async () => {
      mockContextoVazio()

      ;(modelo.startChat as jest.Mock).mockReturnValue({
        sendMessage: jest.fn().mockRejectedValue(new Error('Erro de API')),
      })

      const resultado = await perguntarIA('qual meu saldo?')

      expect(resultado.erro).toBe('Erro ao comunicar com a IA')
      expect(resultado.dados).toBeNull()
    })

    test('deve usar mês e ano atuais quando não informados', async () => {
      mockContextoVazio()

      const mockChat = {
        sendMessage: jest.fn().mockResolvedValue({
          response: { text: () => 'Saldo positivo!' },
        }),
      }
      ;(modelo.startChat as jest.Mock).mockReturnValue(mockChat)

      const resultado = await perguntarIA('qual meu saldo?')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.resposta).toBe('Saldo positivo!')
    })

  })

  describe('gerarResumoMensal', () => {

    test('deve gerar resumo mensal com sucesso', async () => {
      mockContextoVazio()

      const mockChat = {
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Resumo de março: mês positivo com saldo de R$ 2.300.',
          },
        }),
      }
      ;(modelo.startChat as jest.Mock).mockReturnValue(mockChat)

      const resultado = await gerarResumoMensal(3, 2026)

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.resposta).toContain('março')
    })

    test('deve retornar erro quando IA falha no resumo', async () => {
      mockContextoVazio()

      ;(modelo.startChat as jest.Mock).mockReturnValue({
        sendMessage: jest.fn().mockRejectedValue(new Error('Timeout')),
      })

      const resultado = await gerarResumoMensal(3, 2026)

      expect(resultado.erro).toBe('Erro ao gerar resumo mensal')
    })

  })

  describe('categorizarTransacao', () => {

    test('deve categorizar iFood como Alimentação', async () => {
      ;(modelo.generateContent as jest.Mock).mockResolvedValue({
        response: { text: () => 'Alimentação' },
      })

      const resultado = await categorizarTransacao('iFood')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.categoria).toBe('Alimentação')
    })

    test('deve categorizar Uber como Transporte', async () => {
      ;(modelo.generateContent as jest.Mock).mockResolvedValue({
        response: { text: () => 'Transporte' },
      })

      const resultado = await categorizarTransacao('Uber')

      expect(resultado.erro).toBeNull()
      expect(resultado.dados?.categoria).toBe('Transporte')
    })

    test('deve retornar erro quando categorização falha', async () => {
      ;(modelo.generateContent as jest.Mock).mockRejectedValue(
        new Error('Erro de API')
      )

      const resultado = await categorizarTransacao('Netflix')

      expect(resultado.erro).toBe('Erro ao categorizar transação')
    })

    test('deve remover espaços extras da categoria retornada', async () => {
      ;(modelo.generateContent as jest.Mock).mockResolvedValue({
        response: { text: () => '  Lazer  ' },
      })

      const resultado = await categorizarTransacao('Cinema')

      expect(resultado.dados?.categoria).toBe('Lazer')
    })

  })

})