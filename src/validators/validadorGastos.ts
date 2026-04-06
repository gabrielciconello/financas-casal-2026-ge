import { z } from 'zod'

// Coerce converte string para number automaticamente
export const esquemaCriarGastoFixo = z.object({
  descricao: z
    .string({ required_error: 'Descrição é obrigatória' })
    .min(3, 'Descrição deve ter no mínimo 3 caracteres')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),

  categoria: z
    .string({ required_error: 'Categoria é obrigatória' })
    .min(2, 'Categoria deve ter no mínimo 2 caracteres'),

  valor: z.coerce
    .number({ required_error: 'Valor é obrigatório' })
    .positive('Valor deve ser maior que zero'),

  dia_vencimento: z.coerce
    .number({ required_error: 'Dia de vencimento é obrigatório' })
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31'),

  status: z.enum(['pendente', 'pago']).default('pendente'),

  mes: z.coerce
    .number({ required_error: 'Mês é obrigatório' })
    .int('Mês deve ser um número inteiro')
    .min(1, 'Mês deve ser entre 1 e 12')
    .max(12, 'Mês deve ser entre 1 e 12'),

  ano: z.coerce
    .number({ required_error: 'Ano é obrigatório' })
    .int('Ano deve ser um número inteiro')
    .min(2020, 'Ano inválido')
    .max(2100, 'Ano inválido'),
})

export const esquemaAtualizarGastoFixo = esquemaCriarGastoFixo.partial()

export const esquemaCriarGastoVariavel = z.object({
  descricao: z
    .string({ required_error: 'Descrição é obrigatória' })
    .min(3, 'Descrição deve ter no mínimo 3 caracteres')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),

  categoria: z
    .string({ required_error: 'Categoria é obrigatória' })
    .min(2, 'Categoria deve ter no mínimo 2 caracteres'),

  valor_estimado: z.coerce
    .number()
    .min(0, 'Valor estimado não pode ser negativo')
    .optional()
    .or(z.literal('')),

  valor_real: z.coerce
    .number()
    .min(0, 'Valor real não pode ser negativo')
    .optional()
    .or(z.literal('')),

  mes: z.coerce
    .number({ required_error: 'Mês é obrigatório' })
    .int('Mês deve ser um número inteiro')
    .min(1, 'Mês deve ser entre 1 e 12')
    .max(12, 'Mês deve ser entre 1 e 12'),

  ano: z.coerce
    .number({ required_error: 'Ano é obrigatório' })
    .int('Ano deve ser um número inteiro')
    .min(2020, 'Ano inválido')
    .max(2100, 'Ano inválido'),
})

export const esquemaAtualizarGastoVariavel = esquemaCriarGastoVariavel.partial()

export type CriarGastoFixoInput = z.infer<typeof esquemaCriarGastoFixo>
export type AtualizarGastoFixoInput = z.infer<typeof esquemaAtualizarGastoFixo>
export type CriarGastoVariavelInput = z.infer<typeof esquemaCriarGastoVariavel>
export type AtualizarGastoVariavelInput = z.infer<typeof esquemaAtualizarGastoVariavel>
