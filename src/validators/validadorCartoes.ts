import { z } from 'zod'

export const esquemaCriarCartao = z.object({
  nome: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  bandeira: z.string().optional(),

  limite: z.coerce
    .number({ required_error: 'Limite é obrigatório' })
    .min(0, 'Limite não pode ser negativo'),

  dia_fechamento: z.coerce
    .number({ required_error: 'Dia de fechamento é obrigatório' })
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31'),

  dia_vencimento: z.coerce
    .number({ required_error: 'Dia de vencimento é obrigatório' })
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31'),
})

export const esquemaAtualizarCartao = esquemaCriarCartao.partial()

export const esquemaCriarCompraCartao = z.object({
  cartao_id: z
    .string({ required_error: 'ID do cartão é obrigatório' })
    .uuid('ID do cartão inválido'),

  descricao: z
    .string({ required_error: 'Descrição é obrigatória' })
    .min(3, 'Descrição deve ter no mínimo 3 caracteres')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),

  categoria: z
    .string({ required_error: 'Categoria é obrigatória' })
    .min(2, 'Categoria deve ter no mínimo 2 caracteres'),

  valor_total: z.coerce
    .number({ required_error: 'Valor total é obrigatório' })
    .positive('Valor total deve ser maior que zero'),

  parcelas: z.coerce
    .number()
    .int('Parcelas deve ser um número inteiro')
    .min(1, 'Número de parcelas deve ser no mínimo 1')
    .default(1),

  parcela_inicial: z.coerce
    .number()
    .int('Parcela inicial deve ser um número inteiro')
    .min(1, 'Parcela inicial deve ser no mínimo 1')
    .optional(),

  data_compra: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
})

export const esquemaAtualizarCompraCartao = esquemaCriarCompraCartao.omit({ data_compra: true }).extend({
  data_compra: z.string().optional(),
}).partial()

export type CriarCartaoInput = z.infer<typeof esquemaCriarCartao>
export type AtualizarCartaoInput = z.infer<typeof esquemaAtualizarCartao>
export type CriarCompraCartaoInput = z.infer<typeof esquemaCriarCompraCartao>
export type AtualizarCompraCartaoInput = z.infer<typeof esquemaAtualizarCompraCartao>
