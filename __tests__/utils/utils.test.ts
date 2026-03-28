import {
  respostaSucesso,
  respostaErro,
  respostaPaginada,
  calcularOffset,
  formatarMoeda,
  isValorValido,
  isMesValido,
  isAnoValido,
  mesAnoAtual,
} from '../../src/utils'

describe('utils', () => {

  describe('respostaSucesso', () => {

    test('deve retornar dados e erro nulo', () => {
      const resultado = respostaSucesso({ id: '1', nome: 'Teste' })

      expect(resultado.dados).toEqual({ id: '1', nome: 'Teste' })
      expect(resultado.erro).toBeNull()
    })

    test('deve funcionar com qualquer tipo de dado', () => {
      expect(respostaSucesso(42).dados).toBe(42)
      expect(respostaSucesso(null).dados).toBeNull()
      expect(respostaSucesso([1, 2, 3]).dados).toEqual([1, 2, 3])
    })

  })

  describe('respostaErro', () => {

    test('deve retornar dados nulos e mensagem de erro', () => {
      const resultado = respostaErro('Algo deu errado')

      expect(resultado.dados).toBeNull()
      expect(resultado.erro).toBe('Algo deu errado')
    })

  })

  describe('respostaPaginada', () => {

    test('deve retornar estrutura de paginação correta', () => {
      const dados = [{ id: '1' }, { id: '2' }]
      const resultado = respostaPaginada(dados, 50, 2, 10)

      expect(resultado.dados).toEqual(dados)
      expect(resultado.total).toBe(50)
      expect(resultado.pagina).toBe(2)
      expect(resultado.limite).toBe(10)
      expect(resultado.erro).toBeNull()
    })

  })

  describe('calcularOffset', () => {

    test('deve calcular offset da primeira página', () => {
      expect(calcularOffset(1, 10)).toBe(0)
    })

    test('deve calcular offset da segunda página', () => {
      expect(calcularOffset(2, 10)).toBe(10)
    })

    test('deve calcular offset da terceira página', () => {
      expect(calcularOffset(3, 10)).toBe(20)
    })

    test('deve funcionar com limite diferente', () => {
      expect(calcularOffset(3, 25)).toBe(50)
    })

  })

  describe('formatarMoeda', () => {

    test('deve formatar valor em reais', () => {
      const resultado = formatarMoeda(1500)
      expect(resultado).toContain('1.500')
      expect(resultado).toContain('R$')
    })

    test('deve formatar valor com centavos', () => {
      const resultado = formatarMoeda(99.9)
      expect(resultado).toContain('99')
    })

  })

  describe('isValorValido', () => {

    test('deve aceitar valor positivo', () => {
      expect(isValorValido(100)).toBe(true)
      expect(isValorValido(0.01)).toBe(true)
    })

    test('deve rejeitar zero', () => {
      expect(isValorValido(0)).toBe(false)
    })

    test('deve rejeitar valor negativo', () => {
      expect(isValorValido(-50)).toBe(false)
    })

  })

  describe('isMesValido', () => {

    test('deve aceitar meses de 1 a 12', () => {
      expect(isMesValido(1)).toBe(true)
      expect(isMesValido(6)).toBe(true)
      expect(isMesValido(12)).toBe(true)
    })

    test('deve rejeitar mês zero', () => {
      expect(isMesValido(0)).toBe(false)
    })

    test('deve rejeitar mês 13', () => {
      expect(isMesValido(13)).toBe(false)
    })

  })

  describe('isAnoValido', () => {

    test('deve aceitar ano atual', () => {
      const anoAtual = new Date().getFullYear()
      expect(isAnoValido(anoAtual)).toBe(true)
    })

    test('deve aceitar ano 2020', () => {
      expect(isAnoValido(2020)).toBe(true)
    })

    test('deve rejeitar ano muito antigo', () => {
      expect(isAnoValido(2019)).toBe(false)
    })

    test('deve rejeitar ano muito futuro', () => {
      expect(isAnoValido(2200)).toBe(false)
    })

  })

  describe('mesAnoAtual', () => {

    test('deve retornar mês e ano válidos', () => {
      const { mes, ano } = mesAnoAtual()

      expect(isMesValido(mes)).toBe(true)
      expect(isAnoValido(ano)).toBe(true)
    })

    test('deve retornar o mês atual correto', () => {
      const { mes } = mesAnoAtual()
      const mesEsperado = new Date().getMonth() + 1

      expect(mes).toBe(mesEsperado)
    })

  })

})