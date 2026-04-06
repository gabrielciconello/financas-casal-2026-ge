import { z } from 'zod'

export const esquemaCriarTransacao = z.object({
  descricao: z
    .string({ required_error: 'Descrição é obrigatória' })
    .min(3, 'Descrição deve ter no mínimo 3 caracteres')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),

  categoria: z
    .string({ required_error: 'Categoria é obrigatória' })
    .min(2, 'Categoria deve ter no mínimo 2 caracteres'),

  tipo: z.enum(['entrada', 'saida'], {
    required_error: 'Tipo é obrigatório',
    invalid_type_error: 'Tipo deve ser entrada ou saida',
  }),

  valor: z.coerce
    .number({ required_error: 'Valor é obrigatório' })
    .positive('Valor deve ser maior que zero'),

  metodo_pagamento: z.string().optional(),

  status: z.enum(['efetivado', 'pendente']).default('efetivado'),

  recorrente: z.boolean().default(false),

  tipo_recorrencia: z.enum(['mensal', 'semanal']).optional(),

  observacoes: z.string().max(500).optional(),

  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
})

export const esquemaAtualizarTransacao = esquemaCriarTransacao.partial()

export type CriarTransacaoInput = z.infer<typeof esquemaCriarTransacao>
export type AtualizarTransacaoInput = z.infer<typeof esquemaAtualizarTransacao>
