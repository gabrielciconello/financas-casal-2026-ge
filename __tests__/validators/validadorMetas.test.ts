import { validar } from '../../src/validators'
import {
  esquemaCriarMeta,
  esquemaAtualizarMeta,
  esquemaCriarContribuicaoMeta,
} from '../../src/validators/validadorMetas'

describe('validadorMetas', () => {

  describe('esquemaCriarMeta - casos válidos', () => {

    test('deve validar meta completa', () => {
      const dados = {
        titulo: 'Viagem para Europa',
        valor_alvo: 15000,
        aporte_mensal: 500,
        prazo: '2027-12-01',
      }

      const resultado = validar(esquemaCriarMeta, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.titulo).toBe('Viagem para Europa')
    })

    test('deve validar meta apenas com campos obrigatórios', () => {
      const dados = {
        titulo: 'Reserva de emergência',
        valor_alvo: 10000,
      }

      const resultado = validar(esquemaCriarMeta, dados)

      expect(resultado.sucesso).toBe(true)
    })

  })

  describe('esquemaCriarMeta - casos inválidos', () => {

    test('deve rejeitar valor alvo zero', () => {
      const dados = {
        titulo: 'Viagem',
        valor_alvo: 0,
      }

      const resultado = validar(esquemaCriarMeta, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Valor alvo deve ser maior que zero')
    })

    test('deve rejeitar título muito curto', () => {
      const dados = {
        titulo: 'Ab',
        valor_alvo: 5000,
      }

      const resultado = validar(esquemaCriarMeta, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Título deve ter no mínimo 3 caracteres')
    })

    test('deve rejeitar prazo em formato errado', () => {
      const dados = {
        titulo: 'Viagem',
        valor_alvo: 5000,
        prazo: '01/12/2027',
      }

      const resultado = validar(esquemaCriarMeta, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Data deve estar no formato YYYY-MM-DD')
    })

    test('deve rejeitar aporte mensal negativo', () => {
      const dados = {
        titulo: 'Viagem',
        valor_alvo: 5000,
        aporte_mensal: -100,
      }

      const resultado = validar(esquemaCriarMeta, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Aporte mensal não pode ser negativo')
    })

  })

  describe('esquemaCriarContribuicaoMeta - casos válidos', () => {

    test('deve validar contribuição completa', () => {
      const dados = {
        meta_id: '123e4567-e89b-12d3-a456-426614174000',
        valor: 500,
        observacoes: 'Aporte de março',
        data: '2026-03-01',
      }

      const resultado = validar(esquemaCriarContribuicaoMeta, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.valor).toBe(500)
    })

  })

  describe('esquemaCriarContribuicaoMeta - casos inválidos', () => {

    test('deve rejeitar meta_id inválido', () => {
      const dados = {
        meta_id: 'nao-e-uuid',
        valor: 500,
      }

      const resultado = validar(esquemaCriarContribuicaoMeta, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('ID da meta inválido')
    })

    test('deve rejeitar valor zero na contribuição', () => {
      const dados = {
        meta_id: '123e4567-e89b-12d3-a456-426614174000',
        valor: 0,
      }

      const resultado = validar(esquemaCriarContribuicaoMeta, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Valor deve ser maior que zero')
    })

  })

  describe('esquemaAtualizarMeta - campos parciais', () => {

    test('deve aceitar atualização apenas do valor alvo', () => {
      const dados = { valor_alvo: 20000 }

      const resultado = validar(esquemaAtualizarMeta, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.valor_alvo).toBe(20000)
    })

  })

})