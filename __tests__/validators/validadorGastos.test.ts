import { validar } from '../../src/validators'
import {
  esquemaCriarGastoFixo,
  esquemaAtualizarGastoFixo,
  esquemaCriarGastoVariavel,
} from '../../src/validators/validadorGastos'

describe('validadorGastos', () => {

  describe('esquemaCriarGastoFixo - casos válidos', () => {

    test('deve validar gasto fixo completo', () => {
      const dados = {
        descricao: 'Aluguel',
        categoria: 'Moradia',
        valor: 1200,
        dia_vencimento: 5,
        status: 'pendente',
        mes: 3,
        ano: 2026,
      }

      const resultado = validar(esquemaCriarGastoFixo, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.descricao).toBe('Aluguel')
    })

    test('deve usar status pendente como padrão', () => {
      const dados = {
        descricao: 'Internet',
        categoria: 'Serviços',
        valor: 120,
        dia_vencimento: 10,
        mes: 3,
        ano: 2026,
      }

      const resultado = validar(esquemaCriarGastoFixo, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.status).toBe('pendente')
    })

  })

  describe('esquemaCriarGastoFixo - casos inválidos', () => {

    test('deve rejeitar valor zero', () => {
      const dados = {
        descricao: 'Aluguel',
        categoria: 'Moradia',
        valor: 0,
        dia_vencimento: 5,
        mes: 3,
        ano: 2026,
      }

      const resultado = validar(esquemaCriarGastoFixo, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Valor deve ser maior que zero')
    })

    test('deve rejeitar mês inválido', () => {
      const dados = {
        descricao: 'Aluguel',
        categoria: 'Moradia',
        valor: 1200,
        dia_vencimento: 5,
        mes: 0,
        ano: 2026,
      }

      const resultado = validar(esquemaCriarGastoFixo, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Mês deve ser entre 1 e 12')
    })

    test('deve rejeitar ano inválido', () => {
      const dados = {
        descricao: 'Aluguel',
        categoria: 'Moradia',
        valor: 1200,
        dia_vencimento: 5,
        mes: 3,
        ano: 2010,
      }

      const resultado = validar(esquemaCriarGastoFixo, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Ano inválido')
    })

    test('deve rejeitar dia de vencimento maior que 31', () => {
      const dados = {
        descricao: 'Aluguel',
        categoria: 'Moradia',
        valor: 1200,
        dia_vencimento: 32,
        mes: 3,
        ano: 2026,
      }

      const resultado = validar(esquemaCriarGastoFixo, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Dia deve ser entre 1 e 31')
    })

  })

  describe('esquemaCriarGastoVariavel - casos válidos', () => {

    test('deve validar gasto variável com estimado e real', () => {
      const dados = {
        descricao: 'Mercado',
        categoria: 'Alimentação',
        valor_estimado: 800,
        valor_real: 950,
        mes: 3,
        ano: 2026,
      }

      const resultado = validar(esquemaCriarGastoVariavel, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.valor_real).toBe(950)
    })

    test('deve validar gasto variável sem valores (apenas descrição)', () => {
      const dados = {
        descricao: 'Combustível',
        categoria: 'Transporte',
        mes: 3,
        ano: 2026,
      }

      const resultado = validar(esquemaCriarGastoVariavel, dados)

      expect(resultado.sucesso).toBe(true)
    })

  })

  describe('esquemaCriarGastoVariavel - casos inválidos', () => {

    test('deve rejeitar valor estimado negativo', () => {
      const dados = {
        descricao: 'Mercado',
        categoria: 'Alimentação',
        valor_estimado: -100,
        mes: 3,
        ano: 2026,
      }

      const resultado = validar(esquemaCriarGastoVariavel, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Valor estimado não pode ser negativo')
    })

  })

  describe('esquemaAtualizarGastoFixo - campos parciais', () => {

    test('deve aceitar atualização apenas do status', () => {
      const dados = { status: 'pago' }

      const resultado = validar(esquemaAtualizarGastoFixo, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.status).toBe('pago')
    })

  })

})