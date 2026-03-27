import { z } from 'zod'

export const esquemaCriarSalario = z.object({
  tipo: z.enum(['fixo', 'variavel'], {
    required_error: 'Tipo é obrigatório',
    invalid_type_error: 'Tipo deve ser fixo ou variavel',
  }),

  descricao: z
    .string({ required_error: 'Descrição é obrigatória' })
    .min(3, 'Descrição deve ter no mínimo 3 caracteres')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),

  valor_esperado: z
    .number({ required_error: 'Valor esperado é obrigatório' })
    .positive('Valor esperado deve ser maior que zero'),

  valor_recebido: z
    .number()
    .min(0, 'Valor recebido não pode ser negativo')
    .optional(),

  status: z.enum(['pendente', 'recebido', 'parcial']).default('pendente'),

  data_esperada: z
    .string({ required_error: 'Data esperada é obrigatória' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),

  data_recebimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),

  mes: z
    .number({ required_error: 'Mês é obrigatório' })
    .int()
    .min(1, 'Mês deve ser entre 1 e 12')
    .max(12, 'Mês deve ser entre 1 e 12'),

  ano: z
    .number({ required_error: 'Ano é obrigatório' })
    .int()
    .min(2020, 'Ano inválido')
    .max(2100, 'Ano inválido'),

  observacoes: z.string().max(500).optional(),
})

export const esquemaAtualizarSalario = esquemaCriarSalario.partial()

export type CriarSalarioInput = z.infer<typeof esquemaCriarSalario>
export type AtualizarSalarioInput = z.infer<typeof esquemaAtualizarSalario>