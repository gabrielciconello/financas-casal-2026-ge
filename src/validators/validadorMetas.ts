import { z } from 'zod'

export const esquemaCriarMeta = z.object({
  titulo: z
    .string({ required_error: 'Título é obrigatório' })
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(255, 'Título deve ter no máximo 255 caracteres'),

  valor_alvo: z.coerce
    .number({ required_error: 'Valor alvo é obrigatório' })
    .positive('Valor alvo deve ser maior que zero'),

  aporte_mensal: z.coerce
    .number()
    .min(0, 'Aporte mensal não pode ser negativo')
    .optional()
    .or(z.literal('')),

  prazo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
})

export const esquemaAtualizarMeta = esquemaCriarMeta.partial()

export const esquemaCriarContribuicaoMeta = z.object({
  meta_id: z
    .string({ required_error: 'ID da meta é obrigatório' })
    .uuid('ID da meta inválido'),

  valor: z.coerce
    .number({ required_error: 'Valor é obrigatório' })
    .positive('Valor deve ser maior que zero'),

  observacoes: z.string().max(500).optional(),

  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
})

export type CriarMetaInput = z.infer<typeof esquemaCriarMeta>
export type AtualizarMetaInput = z.infer<typeof esquemaAtualizarMeta>
export type CriarContribuicaoMetaInput = z.infer<typeof esquemaCriarContribuicaoMeta>
