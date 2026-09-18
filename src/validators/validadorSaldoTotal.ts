import { z } from 'zod'

function dataValida(valor: string): boolean {
  const [ano, mes, dia] = valor.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  return data.getUTCFullYear() === ano && data.getUTCMonth() + 1 === mes && data.getUTCDate() === dia
}

const camposSaldoTotal = {
  descricao: z.string({ required_error: 'Descrição é obrigatória' })
    .trim().min(3, 'Descrição deve ter no mínimo 3 caracteres').max(255),
  valor: z.coerce.number({ required_error: 'Valor é obrigatório' })
    .finite('Valor inválido').positive('Valor deve ser maior que zero'),
  tipo: z.enum(['aporte', 'retirada'], {
    required_error: 'Tipo é obrigatório',
    invalid_type_error: 'Tipo deve ser aporte ou retirada',
  }),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine(dataValida, 'Data inválida').optional(),
}

export const esquemaCriarSaldoTotal = z.object(camposSaldoTotal)
export const esquemaAtualizarSaldoTotal = esquemaCriarSaldoTotal.partial()
  .refine((dados) => Object.keys(dados).length > 0, 'Informe ao menos um campo para atualizar')
