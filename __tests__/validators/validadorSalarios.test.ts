import { validar } from '../../src/validators'
import { esquemaCriarSalario } from '../../src/validators/validadorSalarios'

describe('validadorSalarios', () => {

  describe('esquemaCriarSalario - casos válidos', () => {

    test('deve validar salário fixo completo', () => {
      const dados = {
        tipo: 'fixo',
        descricao: 'Salário CLT',
        valor_esperado: 3000,
        status: 'pendente',
        data_esperada: '2026-03-05',
        mes: 3,
        ano: 2026,
      }

      const resultado = validar(esquemaCriarSalario, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.tipo).toBe('fixo')
    })

    test('deve validar salário variável com recebimento', () => {
      const dados = {
        tipo: 'variavel',
        descricao: 'Freelance site',
        valor_esperado: 1500,
        valor_recebido: 1500,
        status: 'recebido',
        data_esperada: '2026-03-10',
        data_recebimento: '2026-03-10',
        mes: 3,
        ano: 2026,
      }

      const resultado = validar(esquemaCriarSalario, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.status).toBe('recebido')
    })

  })

  describe('esquemaCriarSalario - casos inválidos', () => {

    test('deve rejeitar valor esperado negativo', () => {
      const dados = {
        tipo: 'fixo',
        descricao: 'Salário CLT',
        valor_esperado: -100,
        data_esperada: '2026-03-05',
        mes: 3,
        ano: 2026,
      }

      const resultado = validar(esquemaCriarSalario, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Valor esperado deve ser maior que zero')
    })

    test('deve rejeitar mês inválido', () => {
      const dados = {
        tipo: 'fixo',
        descricao: 'Salário CLT',
        valor_esperado: 3000,
        data_esperada: '2026-03-05',
        mes: 13,
        ano: 2026,
      }

      const resultado = validar(esquemaCriarSalario, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Mês deve ser entre 1 e 12')
    })

    test('deve rejeitar data em formato errado', () => {
      const dados = {
        tipo: 'fixo',
        descricao: 'Salário CLT',
        valor_esperado: 3000,
        data_esperada: '05/03/2026',
        mes: 3,
        ano: 2026,
      }

      const resultado = validar(esquemaCriarSalario, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Data deve estar no formato YYYY-MM-DD')
    })

  })

})