import type { RespostaApi, RespostaPaginada } from '../types/index.js'

// Monta resposta de sucesso da API
export function respostaSucesso<T>(dados: T): RespostaApi<T> {
  return { dados, erro: null }
}

// Monta resposta de erro da API
export function respostaErro<T>(mensagem: string): RespostaApi<T> {
  return { dados: null, erro: mensagem }
}

// Monta resposta paginada
export function respostaPaginada<T>(
  dados: T[],
  total: number,
  pagina: number,
  limite: number
): RespostaPaginada<T> {
  return { dados, total, pagina, limite, erro: null }
}

// Calcula offset para paginação
export function calcularOffset(pagina: number, limite: number): number {
  return (pagina - 1) * limite
}

// Retorna mês e ano atuais
export function mesAnoAtual(): { mes: number; ano: number } {
  const agora = new Date()
  return {
    mes: agora.getMonth() + 1,
    ano: agora.getFullYear(),
  }
}

// Formata valor para moeda brasileira
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// Valida se um valor é número positivo
export function isValorValido(valor: number): boolean {
  return typeof valor === 'number' && valor > 0
}

// Valida se mês é válido (1-12)
export function isMesValido(mes: number): boolean {
  return Number.isInteger(mes) && mes >= 1 && mes <= 12
}

// Valida se ano é válido
export function isAnoValido(ano: number): boolean {
  const anoAtual = new Date().getFullYear()
  return Number.isInteger(ano) && ano >= 2020 && ano <= anoAtual + 5
}