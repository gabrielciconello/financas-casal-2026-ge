import { validar } from '../../src/validators'
import {
  esquemaCriarCartao,
  esquemaAtualizarCartao,
  esquemaCriarCompraCartao,
} from '../../src/validators/validadorCartoes'

describe('validadorCartoes', () => {

  describe('esquemaCriarCartao - casos válidos', () => {

    test('deve validar cartão completo', () => {
      const dados = {
        nome: 'Nubank',
        bandeira: 'Mastercard',
        limite: 5000,
        dia_fechamento: 10,
        dia_vencimento: 17,
      }

      const resultado = validar(esquemaCriarCartao, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.nome).toBe('Nubank')
    })

    test('deve validar cartão sem bandeira', () => {
      const dados = {
        nome: 'Inter',
        limite: 2000,
        dia_fechamento: 5,
        dia_vencimento: 12,
      }

      const resultado = validar(esquemaCriarCartao, dados)

      expect(resultado.sucesso).toBe(true)
    })

  })

  describe('esquemaCriarCartao - casos inválidos', () => {

    test('deve rejeitar limite negativo', () => {
      const dados = {
        nome: 'Nubank',
        limite: -100,
        dia_fechamento: 10,
        dia_vencimento: 17,
      }

      const resultado = validar(esquemaCriarCartao, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Limite deve ser maior que zero')
    })

    test('deve rejeitar dia de fechamento inválido', () => {
      const dados = {
        nome: 'Nubank',
        limite: 5000,
        dia_fechamento: 32,
        dia_vencimento: 17,
      }

      const resultado = validar(esquemaCriarCartao, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Dia deve ser entre 1 e 31')
    })

    test('deve rejeitar nome ausente', () => {
      const dados = {
        limite: 5000,
        dia_fechamento: 10,
        dia_vencimento: 17,
      }

      const resultado = validar(esquemaCriarCartao, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Nome é obrigatório')
    })

  })

  describe('esquemaCriarCompraCartao - casos válidos', () => {

    test('deve validar compra à vista', () => {
      const dados = {
        cartao_id: '123e4567-e89b-12d3-a456-426614174000',
        descricao: 'Supermercado',
        categoria: 'Alimentação',
        valor_total: 250,
        parcelas: 1,
      }

      const resultado = validar(esquemaCriarCompraCartao, dados)

      expect(resultado.sucesso).toBe(true)
    })

    test('deve validar compra parcelada', () => {
      const dados = {
        cartao_id: '123e4567-e89b-12d3-a456-426614174000',
        descricao: 'Notebook',
        categoria: 'Educação',
        valor_total: 3000,
        parcelas: 12,
        data_compra: '2026-03-01',
      }

      const resultado = validar(esquemaCriarCompraCartao, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.parcelas).toBe(12)
    })

  })

  describe('esquemaCriarCompraCartao - casos inválidos', () => {

    test('deve rejeitar cartao_id inválido', () => {
      const dados = {
        cartao_id: 'nao-e-um-uuid',
        descricao: 'Supermercado',
        categoria: 'Alimentação',
        valor_total: 250,
      }

      const resultado = validar(esquemaCriarCompraCartao, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('ID do cartão inválido')
    })

    test('deve rejeitar valor total zero', () => {
      const dados = {
        cartao_id: '123e4567-e89b-12d3-a456-426614174000',
        descricao: 'Supermercado',
        categoria: 'Alimentação',
        valor_total: 0,
      }

      const resultado = validar(esquemaCriarCompraCartao, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Valor total deve ser maior que zero')
    })

  })

  describe('esquemaAtualizarCartao - campos parciais', () => {

    test('deve aceitar atualização apenas do limite', () => {
      const dados = { limite: 8000 }

      const resultado = validar(esquemaAtualizarCartao, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.limite).toBe(8000)
    })

  })

})