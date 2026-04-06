// ============================================
// USUÁRIO
// ============================================
export interface Usuario {
  id: string
  email: string
  nome: string
}

// ============================================
// LOG DE AUDITORIA
// ============================================
export type AcaoAuditoria = 'CRIAR' | 'ATUALIZAR' | 'DELETAR'
export type ModuloAuditoria =
  | 'transacoes'
  | 'salarios'
  | 'cartoes'
  | 'compras_cartao'
  | 'gastos_fixos'
  | 'gastos_variaveis'
  | 'metas'
  | 'contribuicoes_metas'
  | 'orcamentos'

export interface LogAuditoria {
  id: string
  usuario_id: string
  usuario_nome: string
  acao: AcaoAuditoria
  modulo: ModuloAuditoria
  registro_id: string
  descricao?: string
  criado_em: string
}

// ============================================
// TRANSAÇÕES
// ============================================
export type TipoTransacao = 'entrada' | 'saida'
export type StatusTransacao = 'efetivado' | 'pendente'
export type TipoRecorrencia = 'mensal' | 'semanal'

export interface Transacao {
  id: string
  usuario_id: string
  usuario_nome: string
  descricao: string
  categoria: string
  tipo: TipoTransacao
  valor: number
  metodo_pagamento?: string
  status: StatusTransacao
  recorrente: boolean
  tipo_recorrencia?: TipoRecorrencia
  observacoes?: string
  data: string
  criado_em: string
  atualizado_em: string
}

export interface CriarTransacaoDTO {
  descricao: string
  categoria: string
  tipo: TipoTransacao
  valor: number
  metodo_pagamento?: string
  status?: StatusTransacao
  recorrente?: boolean
  tipo_recorrencia?: TipoRecorrencia
  observacoes?: string
  data?: string
}

export interface AtualizarTransacaoDTO extends Partial<CriarTransacaoDTO> {}

// ============================================
// SALÁRIOS
// ============================================
export type TipoSalario = 'fixo' | 'variavel'
export type StatusSalario = 'pendente' | 'recebido' | 'parcial'

export interface Salario {
  id: string
  usuario_id: string
  usuario_nome: string
  tipo: TipoSalario
  descricao: string
  valor_esperado: number
  valor_recebido?: number
  status: StatusSalario
  data_esperada: string
  data_recebimento?: string
  mes: number
  ano: number
  observacoes?: string
  criado_em: string
  atualizado_em: string
}

export interface CriarSalarioDTO {
  tipo: TipoSalario
  descricao: string
  valor_esperado: number
  valor_recebido?: number
  status?: StatusSalario
  data_esperada: string
  data_recebimento?: string
  mes: number
  ano: number
  observacoes?: string
}

export interface AtualizarSalarioDTO extends Partial<CriarSalarioDTO> {}

// ============================================
// CARTÕES DE CRÉDITO
// ============================================
export interface Cartao {
  id: string
  usuario_id: string
  usuario_nome: string
  nome: string
  bandeira?: string
  limite: number
  dia_fechamento: number
  dia_vencimento: number
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface CriarCartaoDTO {
  nome: string
  bandeira?: string
  limite: number
  dia_fechamento: number
  dia_vencimento: number
}

export interface AtualizarCartaoDTO extends Partial<CriarCartaoDTO> {}

// ============================================
// COMPRAS NO CARTÃO
// ============================================
export interface CompraCartao {
  id: string
  cartao_id: string
  usuario_id: string
  usuario_nome: string
  descricao: string
  categoria: string
  valor_total: number
  parcelas: number
  parcela_atual: number
  valor_parcela: number
  data_compra: string
  criado_em: string
  atualizado_em: string
}

export interface CriarCompraCartaoDTO {
  cartao_id: string
  descricao: string
  categoria: string
  valor_total: number
  parcelas?: number
  data_compra?: string
}

export interface AtualizarCompraCartaoDTO extends Partial<CriarCompraCartaoDTO> {}

// ============================================
// GASTOS FIXOS
// ============================================
export type StatusGasto = 'pendente' | 'pago'

export interface GastoFixo {
  id: string
  usuario_id: string
  usuario_nome: string
  descricao: string
  categoria: string
  valor: number
  dia_vencimento: number
  status: StatusGasto
  mes: number
  ano: number
  criado_em: string
  atualizado_em: string
}

export interface CriarGastoFixoDTO {
  descricao: string
  categoria: string
  valor: number
  dia_vencimento: number
  status?: StatusGasto
  mes: number
  ano: number
}

export interface AtualizarGastoFixoDTO extends Partial<CriarGastoFixoDTO> {}

// ============================================
// GASTOS VARIÁVEIS
// ============================================
export interface GastoVariavel {
  id: string
  usuario_id: string
  usuario_nome: string
  descricao: string
  categoria: string
  valor_estimado?: number
  valor_real?: number
  mes: number
  ano: number
  criado_em: string
  atualizado_em: string
}

export interface CriarGastoVariavelDTO {
  descricao: string
  categoria: string
  valor_estimado?: number
  valor_real?: number
  mes: number
  ano: number
}

export interface AtualizarGastoVariavelDTO extends Partial<CriarGastoVariavelDTO> {}

// ============================================
// METAS
// ============================================
export interface Meta {
  id: string
  titulo: string
  usuario_nome: string
  valor_alvo: number
  valor_atual: number
  aporte_mensal?: number
  prazo?: string
  concluida: boolean
  criado_em: string
  atualizado_em: string
}

export interface CriarMetaDTO {
  titulo: string
  valor_alvo: number
  aporte_mensal?: number
  prazo?: string
}

export interface AtualizarMetaDTO extends Partial<CriarMetaDTO> {}

// ============================================
// CONTRIBUIÇÕES DE METAS
// ============================================
export interface ContribuicaoMeta {
  id: string
  meta_id: string
  usuario_id: string
  usuario_nome: string
  valor: number
  observacoes?: string
  data: string
  criado_em: string
}

export interface CriarContribuicaoMetaDTO {
  meta_id: string
  valor: number
  observacoes?: string
  data?: string
}

// ============================================
// ORÇAMENTOS
// ============================================
export interface Orcamento {
  id: string
  categoria: string
  valor_limite: number
  mes: number
  ano: number
  criado_em: string
  atualizado_em: string
}

export interface CriarOrcamentoDTO {
  categoria: string
  valor_limite: number
  mes: number
  ano: number
}

export interface AtualizarOrcamentoDTO extends Partial<CriarOrcamentoDTO> {}

// ============================================
// RESPOSTAS DA API
// ============================================
export interface RespostaApi<T> {
  dados: T | null
  erro: string | null
}

export interface RespostaPaginada<T> {
  dados: T[]
  total: number
  pagina: number
  limite: number
  erro: string | null
}

// ============================================
// FILTROS COMUNS
// ============================================
export interface ParametrosPaginacao {
  pagina?: number
  limite?: number
}

export interface ParametrosFiltroData {
  mes?: number
  ano?: number
}