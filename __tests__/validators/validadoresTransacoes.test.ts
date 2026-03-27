import { validar } from '../../src/validators'
import { esquemaCriarTransacao, esquemaAtualizarTransacao } from '../../src/validators/validadorTransacoes'

describe('validadorTransacoes', () => {

  // ==========================================
  // TESTES DE SUCESSO
  // ==========================================
  describe('esquemaCriarTransacao - casos válidos', () => {

    test('deve validar uma transação completa corretamente', () => {
      const dados = {
        descricao: 'Salário do mês',
        categoria: 'Salário',
        tipo: 'entrada',
        valor: 3000,
        metodo_pagamento: 'PIX',
        status: 'efetivado',
        recorrente: true,
        tipo_recorrencia: 'mensal',
        observacoes: 'Salário referente a março',
        data: '2026-03-01',
      }

      const resultado = validar(esquemaCriarTransacao, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados).toBeDefined()
      expect(resultado.erros).toBeUndefined()
    })

    test('deve validar uma transação mínima (apenas campos obrigatórios)', () => {
      const dados = {
        descricao: 'Mercado',
        categoria: 'Alimentação',
        tipo: 'saida',
        valor: 150.50,
      }

      const resultado = validar(esquemaCriarTransacao, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.status).toBe('efetivado') // valor default
      expect(resultado.dados?.recorrente).toBe(false)   // valor default
    })

  })

  // ==========================================
  // TESTES DE FALHA — DESCRIÇÃO
  // ==========================================
  describe('esquemaCriarTransacao - descrição inválida', () => {

    test('deve rejeitar descrição vazia', () => {
      const dados = {
        descricao: '',
        categoria: 'Alimentação',
        tipo: 'saida',
        valor: 100,
      }

      const resultado = validar(esquemaCriarTransacao, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Descrição deve ter no mínimo 3 caracteres')
    })

    test('deve rejeitar descrição ausente', () => {
      const dados = {
        categoria: 'Alimentação',
        tipo: 'saida',
        valor: 100,
      }

      const resultado = validar(esquemaCriarTransacao, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Descrição é obrigatória')
    })

  })

  // ==========================================
  // TESTES DE FALHA — VALOR
  // ==========================================
  describe('esquemaCriarTransacao - valor inválido', () => {

    test('deve rejeitar valor zero', () => {
      const dados = {
        descricao: 'Mercado',
        categoria: 'Alimentação',
        tipo: 'saida',
        valor: 0,
      }

      const resultado = validar(esquemaCriarTransacao, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Valor deve ser maior que zero')
    })

    test('deve rejeitar valor negativo', () => {
      const dados = {
        descricao: 'Mercado',
        categoria: 'Alimentação',
        tipo: 'saida',
        valor: -100,
      }

      const resultado = validar(esquemaCriarTransacao, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Valor deve ser maior que zero')
    })

    test('deve rejeitar valor ausente', () => {
      const dados = {
        descricao: 'Mercado',
        categoria: 'Alimentação',
        tipo: 'saida',
      }

      const resultado = validar(esquemaCriarTransacao, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Valor é obrigatório')
    })

  })

  // ==========================================
  // TESTES DE FALHA — TIPO
  // ==========================================
  describe('esquemaCriarTransacao - tipo inválido', () => {

  test('deve rejeitar tipo inválido', () => {
    const dados = {
      descricao: 'Mercado',
      categoria: 'Alimentação',
      tipo: 'invalido',
      valor: 100,
    }

    const resultado = validar(esquemaCriarTransacao, dados)

    expect(resultado.sucesso).toBe(false)
    expect(resultado.erros?.[0]).toContain("Expected 'entrada' | 'saida'")
  })

  test('deve rejeitar tipo ausente', () => {
    const dados = {
      descricao: 'Mercado',
      categoria: 'Alimentação',
      valor: 100,
    }

    const resultado = validar(esquemaCriarTransacao, dados)

    expect(resultado.sucesso).toBe(false)
    expect(resultado.erros).toBeDefined()
    expect(resultado.erros!.length).toBeGreaterThan(0)
  })

})

  // ==========================================
  // TESTES DE FALHA — DATA
  // ==========================================
  describe('esquemaCriarTransacao - data inválida', () => {

    test('deve rejeitar data em formato errado', () => {
      const dados = {
        descricao: 'Mercado',
        categoria: 'Alimentação',
        tipo: 'saida',
        valor: 100,
        data: '27/03/2026', // formato errado
      }

      const resultado = validar(esquemaCriarTransacao, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Data deve estar no formato YYYY-MM-DD')
    })

  })

  // ==========================================
  // TESTES — ATUALIZAR (PARTIAL)
  // ==========================================
  describe('esquemaAtualizarTransacao - campos parciais', () => {

    test('deve aceitar atualização apenas do valor', () => {
      const dados = { valor: 500 }

      const resultado = validar(esquemaAtualizarTransacao, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.valor).toBe(500)
    })

    test('deve aceitar atualização apenas do status', () => {
      const dados = { status: 'pendente' }

      const resultado = validar(esquemaAtualizarTransacao, dados)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.dados?.status).toBe('pendente')
    })

    test('deve rejeitar valor negativo mesmo em atualização', () => {
      const dados = { valor: -50 }

      const resultado = validar(esquemaAtualizarTransacao, dados)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.erros).toContain('Valor deve ser maior que zero')
    })

  })

})