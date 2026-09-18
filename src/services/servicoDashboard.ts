import { supabaseAdmin } from './supabase.node.js'
import { respostaErro, respostaSucesso } from '../utils/index.js'
import type { RespostaApi } from '../types/index.js'

interface ItemDetalhado {
  id: string
  tipo: 'entrada' | 'saida'
  descricao: string
  valor: number
  data: string
  fonte: 'transacao' | 'gasto_fixo' | 'gasto_variavel' | 'salario' | 'compra_cartao'
  categoria: string
  status: string
}

interface DadosDashboard {
  resumo: { total_entradas: number; total_saidas: number; saldo_atual: number; saldo_mensal: number }
  itens_detalhados: ItemDetalhado[]
  gastos_por_categoria: Array<{ categoria: string; total: number; percentual: number }>
  historico_mensal: Array<{ mes: number; ano: number; total_entradas: number; total_saidas: number }>
  proximos_vencimentos: Array<{
    id: string; descricao: string; valor: number; dia_vencimento: number; tipo: 'gasto_fixo' | 'cartao'
  }>
  comparativo: {
    entradas_mes_atual: number; entradas_mes_anterior: number
    saidas_mes_atual: number; saidas_mes_anterior: number
  }
  saude_financeira: {
    percentual_gasto: number
    classificacao: 'otima' | 'boa' | 'atencao' | 'critica'
  }
}

type LinhaTransacao = {
  id: string; tipo: 'entrada' | 'saida'; valor: number | string; categoria: string
  descricao: string; data: string; status: string
}
type LinhaSalario = {
  id: string; valor_esperado: number | string; valor_recebido?: number | string | null
  status: string; descricao: string; data_esperada: string; mes: number; ano: number
}
type LinhaGastoFixo = {
  id: string; valor: number | string; status: string; dia_vencimento: number
  descricao: string; categoria: string; mes: number; ano: number
}
type LinhaGastoVariavel = {
  id: string; descricao: string; valor_real?: number | string | null
  categoria: string; mes: number; ano: number
}
type LinhaCompra = {
  id: string; descricao: string; categoria: string; valor_parcela: number | string
  data_compra: string; parcela_atual?: number | string | null; parcelas?: number | string | null
}

function intervaloMes(mes: number, ano: number): { inicio: string; fim: string } {
  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  const ultimoDia = new Date(ano, mes, 0).getDate()
  return { inicio, fim: `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}` }
}

function deslocarMes(mes: number, ano: number, deslocamento: number): { mes: number; ano: number } {
  const data = new Date(Date.UTC(ano, mes - 1 + deslocamento, 1))
  return { mes: data.getUTCMonth() + 1, ano: data.getUTCFullYear() }
}

function pertenceAoMes(data: string, mes: number, ano: number): boolean {
  return data.slice(0, 7) === `${ano}-${String(mes).padStart(2, '0')}`
}

function valorSalario(salario: LinhaSalario): number {
  if (salario.status === 'recebido' || salario.status === 'parcial') {
    return Number(salario.valor_recebido ?? salario.valor_esperado)
  }
  return Number(salario.valor_esperado)
}

function parcelaNoMes(compra: LinhaCompra, mes: number, ano: number): number | null {
  const [anoCompra, mesCompra] = compra.data_compra.split('-').map(Number)
  if (!anoCompra || !mesCompra) return null
  const diferenca = (ano - anoCompra) * 12 + (mes - mesCompra)
  const parcela = Number(compra.parcela_atual ?? 1) + diferenca
  const totalParcelas = Number(compra.parcelas ?? 1)
  return diferenca >= 0 && parcela >= 1 && parcela <= totalParcelas ? parcela : null
}

function somar<T>(itens: T[], obterValor: (item: T) => number): number {
  return itens.reduce((total, item) => total + obterValor(item), 0)
}

/** Consolida os dados dos dois integrantes; `usuarioId` existe apenas por compatibilidade. */
export async function buscarDadosDashboard(
  mes: number,
  ano: number,
  _usuarioId?: string
): Promise<RespostaApi<DadosDashboard>> {
  try {
    const primeiroMes = deslocarMes(mes, ano, -5)
    const { inicio: inicioHistorico } = intervaloMes(primeiroMes.mes, primeiroMes.ano)
    const { fim: fimAtual } = intervaloMes(mes, ano)

    // Antes eram mais de 30 round-trips sequenciais; agora são seis consultas paralelas.
    const respostas = await Promise.all([
      supabaseAdmin.from('transacoes')
        .select('id, tipo, valor, categoria, descricao, data, status')
        .gte('data', inicioHistorico).lte('data', fimAtual),
      supabaseAdmin.from('salarios')
        .select('id, valor_esperado, valor_recebido, status, descricao, data_esperada, mes, ano')
        .gte('ano', primeiroMes.ano).lte('ano', ano),
      supabaseAdmin.from('gastos_fixos')
        .select('id, valor, status, dia_vencimento, descricao, categoria, mes, ano')
        .gte('ano', primeiroMes.ano).lte('ano', ano),
      supabaseAdmin.from('gastos_variaveis')
        .select('id, descricao, valor_real, categoria, mes, ano')
        .gte('ano', primeiroMes.ano).lte('ano', ano),
      supabaseAdmin.from('compras_cartao')
        .select('id, descricao, categoria, valor_parcela, data_compra, parcela_atual, parcelas')
        .lte('data_compra', fimAtual),
      supabaseAdmin.from('saldo_total').select('valor, tipo'),
    ])

    const falha = respostas.find((resposta) => resposta.error)
    if (falha?.error) return respostaErro(falha.error.message)

    const transacoes = (respostas[0].data ?? []) as LinhaTransacao[]
    const salarios = (respostas[1].data ?? []) as LinhaSalario[]
    const gastosFixos = (respostas[2].data ?? []) as LinhaGastoFixo[]
    const gastosVariaveis = (respostas[3].data ?? []) as LinhaGastoVariavel[]
    const compras = (respostas[4].data ?? []) as LinhaCompra[]

    const obterDadosMes = (mesAlvo: number, anoAlvo: number) => {
      const transacoesMes = transacoes.filter((item) => pertenceAoMes(item.data, mesAlvo, anoAlvo))
      const salariosMes = salarios.filter((item) => item.mes === mesAlvo && item.ano === anoAlvo)
      const fixosMes = gastosFixos.filter((item) => item.mes === mesAlvo && item.ano === anoAlvo)
      const variaveisMes = gastosVariaveis.filter((item) => item.mes === mesAlvo && item.ano === anoAlvo)
      const comprasMes = compras
        .map((compra) => ({ compra, parcela: parcelaNoMes(compra, mesAlvo, anoAlvo) }))
        .filter((item): item is { compra: LinhaCompra; parcela: number } => item.parcela !== null)
      const entradas =
        somar(transacoesMes.filter((item) => item.tipo === 'entrada'), (item) => Number(item.valor)) +
        somar(salariosMes, valorSalario)
      const saidas =
        somar(transacoesMes.filter((item) => item.tipo === 'saida'), (item) => Number(item.valor)) +
        somar(fixosMes, (item) => Number(item.valor)) +
        somar(variaveisMes, (item) => Number(item.valor_real ?? 0)) +
        somar(comprasMes, (item) => Number(item.compra.valor_parcela ?? 0))
      return { transacoesMes, salariosMes, fixosMes, variaveisMes, comprasMes, entradas, saidas }
    }

    const atual = obterDadosMes(mes, ano)
    const anteriorRef = deslocarMes(mes, ano, -1)
    const anterior = obterDadosMes(anteriorRef.mes, anteriorRef.ano)
    const saldoMensal = atual.entradas - atual.saidas
    const saldoCumulativo = somar(respostas[5].data ?? [], (movimento: any) =>
      movimento.tipo === 'aporte' ? Number(movimento.valor) : -Number(movimento.valor)
    )

    const itensDetalhados: ItemDetalhado[] = [
      ...atual.transacoesMes.map((item) => ({
        id: item.id, tipo: item.tipo, descricao: item.descricao, valor: Number(item.valor),
        data: item.data, fonte: 'transacao' as const, categoria: item.categoria, status: item.status,
      })),
      ...atual.fixosMes.map((item) => ({
        id: item.id, tipo: 'saida' as const, descricao: item.descricao, valor: Number(item.valor),
        data: `${ano}-${String(mes).padStart(2, '0')}-${String(item.dia_vencimento).padStart(2, '0')}`,
        fonte: 'gasto_fixo' as const, categoria: item.categoria, status: item.status,
      })),
      ...atual.salariosMes.map((item) => ({
        id: item.id, tipo: 'entrada' as const, descricao: item.descricao, valor: valorSalario(item),
        data: item.data_esperada, fonte: 'salario' as const, categoria: 'Salário', status: item.status,
      })),
      ...atual.variaveisMes.filter((item) => Number(item.valor_real ?? 0) > 0).map((item) => ({
        id: item.id, tipo: 'saida' as const, descricao: item.descricao, valor: Number(item.valor_real),
        data: `${ano}-${String(mes).padStart(2, '0')}-15`, fonte: 'gasto_variavel' as const,
        categoria: item.categoria, status: 'pago',
      })),
      ...atual.comprasMes.map(({ compra, parcela }) => ({
        id: compra.id, tipo: 'saida' as const,
        descricao: `${compra.descricao} (${parcela}/${Number(compra.parcelas ?? 1)})`,
        valor: Number(compra.valor_parcela), data: compra.data_compra, fonte: 'compra_cartao' as const,
        categoria: compra.categoria, status: 'pendente',
      })),
    ].sort((a, b) => b.data.localeCompare(a.data))

    const totalPorCategoria: Record<string, number> = {}
    const adicionarCategoria = (categoria: string, valor: number) => {
      totalPorCategoria[categoria] = (totalPorCategoria[categoria] ?? 0) + valor
    }
    atual.transacoesMes.filter((item) => item.tipo === 'saida')
      .forEach((item) => adicionarCategoria(item.categoria, Number(item.valor)))
    atual.fixosMes.forEach((item) => adicionarCategoria(item.categoria, Number(item.valor)))
    atual.variaveisMes.forEach((item) => adicionarCategoria(item.categoria, Number(item.valor_real ?? 0)))
    atual.comprasMes.forEach(({ compra }) => adicionarCategoria(compra.categoria, Number(compra.valor_parcela)))

    const gastosPorCategoria = Object.entries(totalPorCategoria)
      .filter(([, total]) => total > 0)
      .map(([categoria, total]) => ({
        categoria, total,
        percentual: atual.saidas > 0 ? Number(((total / atual.saidas) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.total - a.total)

    const historico = Array.from({ length: 6 }, (_, indice) => {
      const referencia = deslocarMes(mes, ano, indice - 5)
      const dados = obterDadosMes(referencia.mes, referencia.ano)
      return { mes: referencia.mes, ano: referencia.ano, total_entradas: dados.entradas, total_saidas: dados.saidas }
    })

    const agora = new Date()
    const ehMesAtual = agora.getMonth() + 1 === mes && agora.getFullYear() === ano
    const diaAtual = agora.getDate()
    const ultimoDia = new Date(ano, mes, 0).getDate()
    const proximosVencimentos = ehMesAtual
      ? atual.fixosMes.filter((item) =>
          item.status === 'pendente' && item.dia_vencimento >= diaAtual &&
          item.dia_vencimento <= Math.min(ultimoDia, diaAtual + 7)
        ).sort((a, b) => a.dia_vencimento - b.dia_vencimento).map((item) => ({
          id: item.id, descricao: item.descricao, valor: Number(item.valor),
          dia_vencimento: item.dia_vencimento, tipo: 'gasto_fixo' as const,
        }))
      : []

    const percentualGasto = atual.entradas > 0
      ? Number(((atual.saidas / atual.entradas) * 100).toFixed(1))
      : atual.saidas > 0 ? 100 : 0
    const classificacao: DadosDashboard['saude_financeira']['classificacao'] =
      percentualGasto <= 50 ? 'otima' : percentualGasto <= 70 ? 'boa' :
      percentualGasto <= 90 ? 'atencao' : 'critica'

    return respostaSucesso({
      resumo: {
        total_entradas: atual.entradas, total_saidas: atual.saidas,
        saldo_atual: saldoCumulativo + saldoMensal, saldo_mensal: saldoMensal,
      },
      itens_detalhados: itensDetalhados,
      gastos_por_categoria: gastosPorCategoria,
      historico_mensal: historico,
      proximos_vencimentos: proximosVencimentos,
      comparativo: {
        entradas_mes_atual: atual.entradas, entradas_mes_anterior: anterior.entradas,
        saidas_mes_atual: atual.saidas, saidas_mes_anterior: anterior.saidas,
      },
      saude_financeira: { percentual_gasto: percentualGasto, classificacao },
    })
  } catch {
    return respostaErro('Erro ao buscar dados do dashboard')
  }
}
