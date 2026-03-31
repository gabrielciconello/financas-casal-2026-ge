import { supabaseAdmin } from './supabase.node'
import { respostaSucesso, respostaErro } from '../utils'
import { RespostaApi } from '../types'

interface ResumoFinanceiro {
  total_entradas: number
  total_saidas: number
  saldo_atual: number
  saldo_projetado: number
}

interface ResumoCategoria {
  categoria: string
  total: number
  percentual: number
}

interface ResumoMensal {
  mes: number
  ano: number
  total_entradas: number
  total_saidas: number
}

interface AlertaVencimento {
  id: string
  descricao: string
  valor: number
  dia_vencimento: number
  tipo: 'gasto_fixo' | 'cartao'
}

interface DadosDashboard {
  resumo: ResumoFinanceiro
  gastos_por_categoria: ResumoCategoria[]
  historico_mensal: ResumoMensal[]
  proximos_vencimentos: AlertaVencimento[]
  comparativo: {
    entradas_mes_atual: number
    entradas_mes_anterior: number
    saidas_mes_atual: number
    saidas_mes_anterior: number
  }
  saude_financeira: {
    percentual_gasto: number
    classificacao: 'otima' | 'boa' | 'atencao' | 'critica'
  }
}

// Retorna o primeiro e último dia do mês no formato YYYY-MM-DD
function intervaloMes(mes: number, ano: number): { inicio: string; fim: string } {
  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const fim = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
  return { inicio, fim }
}

export async function buscarDadosDashboard(
  mes: number,
  ano: number
): Promise<RespostaApi<DadosDashboard>> {
  try {
    const { inicio, fim } = intervaloMes(mes, ano)

    // ==========================================
    // 1. TRANSAÇÕES DO MÊS ATUAL
    // ==========================================
    const { data: transacoes, error: erroTransacoes } = await supabaseAdmin
      .from('transacoes')
      .select('tipo, valor, categoria')
      .gte('data', inicio)
      .lte('data', fim)

    if (erroTransacoes) return respostaErro(erroTransacoes.message)

    const totalEntradas = transacoes
      ?.filter((t) => t.tipo === 'entrada')
      .reduce((acc, t) => acc + Number(t.valor), 0) ?? 0

    const totalSaidas = transacoes
      ?.filter((t) => t.tipo === 'saida')
      .reduce((acc, t) => acc + Number(t.valor), 0) ?? 0

    // ==========================================
    // 2. GASTOS FIXOS DO MÊS
    // ==========================================
    const { data: gastosFixos } = await supabaseAdmin
      .from('gastos_fixos')
      .select('valor, status')
      .eq('mes', mes)
      .eq('ano', ano)

    const totalGastosFixosPendentes = gastosFixos
      ?.filter((g) => g.status === 'pendente')
      .reduce((acc, g) => acc + Number(g.valor), 0) ?? 0

    const saldoAtual = totalEntradas - totalSaidas
    const saldoProjetado = saldoAtual - totalGastosFixosPendentes

    // ==========================================
    // 3. GASTOS POR CATEGORIA
    // ==========================================
    const totalPorCategoria: Record<string, number> = {}
    transacoes
      ?.filter((t) => t.tipo === 'saida')
      .forEach((t) => {
        totalPorCategoria[t.categoria] =
          (totalPorCategoria[t.categoria] ?? 0) + Number(t.valor)
      })

    const gastosPorCategoria: ResumoCategoria[] = Object.entries(totalPorCategoria)
      .map(([categoria, total]) => ({
        categoria,
        total,
        percentual: totalSaidas > 0
          ? Number(((total / totalSaidas) * 100).toFixed(1))
          : 0,
      }))
      .sort((a, b) => b.total - a.total)

    // ==========================================
    // 4. HISTÓRICO DOS ÚLTIMOS 6 MESES
    // ==========================================
    const historico: ResumoMensal[] = []

    for (let i = 5; i >= 0; i--) {
      let mesBusca = mes - i
      let anoBusca = ano

      if (mesBusca <= 0) {
        mesBusca += 12
        anoBusca -= 1
      }

      const { inicio: inicioMes, fim: fimMes } = intervaloMes(mesBusca, anoBusca)

      const { data: transacoesMes } = await supabaseAdmin
        .from('transacoes')
        .select('tipo, valor')
        .gte('data', inicioMes)
        .lte('data', fimMes)

      const entradas = transacoesMes
        ?.filter((t) => t.tipo === 'entrada')
        .reduce((acc, t) => acc + Number(t.valor), 0) ?? 0

      const saidas = transacoesMes
        ?.filter((t) => t.tipo === 'saida')
        .reduce((acc, t) => acc + Number(t.valor), 0) ?? 0

      historico.push({ mes: mesBusca, ano: anoBusca, total_entradas: entradas, total_saidas: saidas })
    }

    // ==========================================
    // 5. PRÓXIMOS VENCIMENTOS (7 DIAS)
    // ==========================================
    const diaAtual = new Date().getDate()
    const diaLimite = diaAtual + 7

    const { data: gastosVencendo } = await supabaseAdmin
      .from('gastos_fixos')
      .select('id, descricao, valor, dia_vencimento')
      .eq('mes', mes)
      .eq('ano', ano)
      .eq('status', 'pendente')
      .gte('dia_vencimento', diaAtual)
      .lte('dia_vencimento', diaLimite)
      .order('dia_vencimento', { ascending: true })

    const proximosVencimentos: AlertaVencimento[] = (gastosVencendo ?? []).map((g) => ({
      id: g.id,
      descricao: g.descricao,
      valor: Number(g.valor),
      dia_vencimento: g.dia_vencimento,
      tipo: 'gasto_fixo' as const,
    }))

    // ==========================================
    // 6. COMPARATIVO MÊS ANTERIOR
    // ==========================================
    let mesAnterior = mes - 1
    let anoAnterior = ano
    if (mesAnterior <= 0) {
      mesAnterior = 12
      anoAnterior -= 1
    }

    const { inicio: inicioAnterior, fim: fimAnterior } = intervaloMes(mesAnterior, anoAnterior)

    const { data: transacoesAnterior } = await supabaseAdmin
      .from('transacoes')
      .select('tipo, valor')
      .gte('data', inicioAnterior)
      .lte('data', fimAnterior)

    const entradasAnterior = transacoesAnterior
      ?.filter((t) => t.tipo === 'entrada')
      .reduce((acc, t) => acc + Number(t.valor), 0) ?? 0

    const saidasAnterior = transacoesAnterior
      ?.filter((t) => t.tipo === 'saida')
      .reduce((acc, t) => acc + Number(t.valor), 0) ?? 0

    // ==========================================
    // 7. SAÚDE FINANCEIRA
    // ==========================================
    const percentualGasto = totalEntradas > 0
      ? Number(((totalSaidas / totalEntradas) * 100).toFixed(1))
      : 0

    const classificacao =
      percentualGasto <= 50 ? 'otima' :
      percentualGasto <= 70 ? 'boa' :
      percentualGasto <= 90 ? 'atencao' : 'critica'

    const dados: DadosDashboard = {
      resumo: {
        total_entradas: totalEntradas,
        total_saidas: totalSaidas,
        saldo_atual: saldoAtual,
        saldo_projetado: saldoProjetado,
      },
      gastos_por_categoria: gastosPorCategoria,
      historico_mensal: historico,
      proximos_vencimentos: proximosVencimentos,
      comparativo: {
        entradas_mes_atual: totalEntradas,
        entradas_mes_anterior: entradasAnterior,
        saidas_mes_atual: totalSaidas,
        saidas_mes_anterior: saidasAnterior,
      },
      saude_financeira: {
        percentual_gasto: percentualGasto,
        classificacao,
      },
    }

    return respostaSucesso(dados)
  } catch (erro) {
    return respostaErro('Erro ao buscar dados do dashboard')
  }
}