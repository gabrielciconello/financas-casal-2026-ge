import { ZodSchema, ZodError } from 'zod'

interface ResultadoValidacao<T> {
  sucesso: boolean
  dados?: T
  erros?: string[]
}

export function validar<T>(
  esquema: ZodSchema<T>,
  dados: unknown
): ResultadoValidacao<T> {
  try {
    const dadosValidados = esquema.parse(dados)
    return { sucesso: true, dados: dadosValidados }
  } catch (erro) {
    if (erro instanceof ZodError) {
      const erros = erro.errors.map((e) => e.message)
      return { sucesso: false, erros }
    }
    return { sucesso: false, erros: ['Erro de validação desconhecido'] }
  }
}