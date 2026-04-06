import { supabaseAdmin } from './supabase.node.js'
import { respostaSucesso, respostaErro } from '../utils/index.js'
import { RespostaApi } from '../types/index.js'

interface ResumoFinanceiro {
  total_entradas: number
  total_saidas: number
  saldo_atual: number
}

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
  itens_detalhados: ItemDetalhado[]
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

// Returns first and last day of month in YYYY-MM-DD
function intervaloMes(mes: number, ano: number): { inicio: string; fim: string } {
  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const fim = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
  return { inicio, fim }
}

export async function buscarDadosDashboard(
  mes: number,
  ano: number,
  usuarioId: string
): Promise<RespostaApi<DadosDashboard>> {
  try {
    const { inicio, fim } = intervaloMes(mes, ano)

    // ==========================================
    // 1. TRANSAÇÕES DO MÊS ATUAL (filtrar por usuário)
    // ==========================================
    const { data: transacoes, error: erroTransacoes } = await supabaseAdmin
      .from('transacoes')
      .select('id, tipo, valor, categoria, descricao, data, status')
      .eq('usuario_id', usuarioId)
      .gte('data', inicio)
      .lte('data', fim)

    if (erroTransacoes) return respostaErro(erroTransacoes.message)

    // ==========================================
    // 2. GASTOS FIXOS DO MÊS (filtrar por usuário)
    // ==========================================
    const { data: gastosFixos, error: erroGastosFixos } = await supabaseAdmin
      .from('gastos_fixos')
      .select('id, valor, status, dia_vencimento, descricao, categoria')
      .eq('usuario_id', usuarioId)
      .eq('mes', mes)
      .eq('ano', ano)

    if (erroGastosFixos) return respostaErro(erroGastosFixos.message)

    // ==========================================
    // 3. SALÁRIOS DO MÊS (filtrar por usuário)
    // ==========================================
    const { data: salarios } = await supabaseAdmin
      .from('salarios')
      .select('id, valor_esperado, valor_recebido, status, descricao, data_esperada, mes',)
      .eq('usuario_id', usuarioId)
      .eq('mes', mes)
      .eq('ano', ano)

    // ==========================================
    // 3a. GASTOS VARIÁVEIS DO MÊS (filtrar por usuário)
    // ==========================================
    const { data: gastosVariaveis } = await supabaseAdmin
      .from('gastos_variaveis')
      .select('id, descricao, valor_real, categoria')
      .eq('usuario_id', usuarioId)
      .eq('mes', mes)
      .eq('ano', ano)

    // ==========================================
    // 4. COMPRAS CARTÃO ATIVAS DO MÊS (parcelas que ainda não foram concluídas)
    // Uma compra do mês X aparece se o mês/ano alvo está dentro do range de parcelas
    // parcelaAtual indica qual parcela caiu no mês da data_compra + (mesAlvo - mesCompra)
    // Buscamos todas as compras do usuário e filtramos quais têm parcela ativa no mês alvo
    // ==========================================
    const { data: todasComprasCartao } = await supabaseAdmin
      .from('compras_cartao')
      .select('id, descricao, categoria, valor_parcela, valor_total, data_compra, parcela_atual, parcelas, status')
      .eq('usuario_id', usuarioId)

    // Filtrar compras cuja parcela correspondente ao mês/ano consultado está ativa
    const comprasMesAlvo = (todasComprasCartao ?? []).filter((c: any) => {
      // Data da compra define o mês inicial
      const dataCompra = new Date(c.data_compra + 'T00:00:00')
      const mesCompra = dataCompra.getMonth() + 1
      const anoCompra = dataCompra.getFullYear()

      // Total de parcelas da compra
      const totalParcelas = Number(c.parcelas || 1)
      // Parcela que já havia passado quando o registro foi criado
      const parcelaBase = Number(c.parcela_atual || 1)

      // Diferença de meses entre a compra e o mês alvo
      let diffMes = (ano - anoCompra) * 12 + (mes - mesCompra)

      // Se diffMes < 0, o mês alvo é anterior à compra -> não aparece
      if (diffMes < 0) return false

      // A parcela que cai no mês alvo é: parcelaInicial + diffMes
      const parcelaAlvo = parcelaBase + diffMes

      // Se a parcela alvo está dentro do range total -> aparece
      return parcelaAlvo >= 1 && parcelaAlvo <= totalParcelas
    }).map((c: any) => {
      const dataCompra = new Date(c.data_compra + 'T00:00:00')
      const mesCompra = dataCompra.getMonth() + 1
      const anoCompra = dataCompra.getFullYear()
      let diffMes = (ano - anoCompra) * 12 + (mes - mesCompra)
      const parcelaBase = Number(c.parcela_atual || 1)
      const parcelaAlvo = parcelaBase + diffMes
      return { ...c, parcela_alvo_no_mes: parcelaAlvo }
    })

    // ==========================================
    // CALCULAR TOTAIS
    // ==========================================
    const totalEntradasTransacoes = transacoes
      ?.filter((t) => t.tipo === 'entrada')
      .reduce((acc, t) => acc + Number(t.valor), 0) ?? 0

    const totalGastosFixos = gastosFixos
      ?.reduce((acc, g) => acc + Number(g.valor), 0) ?? 0

    const totalGastosVariaveis = gastosVariaveis
      ?.reduce((acc: number, g: any) => acc + Number(g.valor_real ?? 0), 0) ?? 0

    const totalComprasCartao = comprasMesAlvo
      ?.reduce((acc: number, c: any) => acc + Number(c.valor_parcela ?? 0), 0) ?? 0

    const totalSaidasTransacoes = transacoes
      ?.filter((t) => t.tipo === 'saida')
      .reduce((acc, t) => acc + Number(t.valor), 0) ?? 0

    const totalSaidas = totalSaidasTransacoes + totalGastosFixos + totalGastosVariaveis + totalComprasCartao
    const totalEntradas = totalEntradasTransacoes

    const saldoAtual = totalEntradas - totalSaidas

    // ==========================================
    // ITENS DETALHADOS (para mostrar no dashboard)
    // ==========================================
    const itensDetalhados: ItemDetalhado[] = []

    // Transações de saída
    for (const t of transacoes ?? []) {
      itensDetalhados.push({
        id: t.id,
        tipo: t.tipo,
        descricao: t.descricao,
        valor: Number(t.valor),
        data: t.data,
        fonte: 'transacao',
        categoria: t.categoria,
        status: t.status,
      })
    }

    // Gastos fixos (todos, como saída)
    for (const g of gastosFixos ?? []) {
      itensDetalhados.push({
        id: g.id,
        tipo: 'saida',
        descricao: g.descricao,
        valor: Number(g.valor),
        data: `${ano}-${String(mes).padStart(2, '0')}-${String(g.dia_vencimento).padStart(2, '0')}`,
        fonte: 'gasto_fixo',
        categoria: g.categoria,
        status: g.status,
      })
    }

    // Salários como entrada
    for (const s of salarios ?? []) {
      const valorBase = s.status === 'recebido'
        ? Number(s.valor_recebido ?? s.valor_esperado)
        : Number(s.valor_esperado)
      itensDetalhados.push({
        id: s.id,
        tipo: 'entrada',
        descricao: s.descricao || `Salário - mês ${mes}/${ano}`,
        valor: valorBase,
        data: s.data_esperada,
        fonte: 'salario',
        categoria: 'Salário',
        status: s.status,
      })
    }

    // Gastos variáveis como saída
    for (const gv of gastosVariaveis ?? []) {
      const val = Number(gv.valor_real ?? 0)
      if (val > 0) {
        itensDetalhados.push({
          id: gv.id,
          tipo: 'saida',
          descricao: gv.descricao || `Gasto Variável - ${gv.categoria}`,
          valor: val,
          data: `${ano}-${String(mes).padStart(2, '0')}-15`,
          fonte: 'gasto_variavel',
          categoria: gv.categoria,
          status: 'pago',
        })
      }
    }

    // Compras cartão como saída (parcelas)
    for (const c of comprasMesAlvo ?? []) {
      itensDetalhados.push({
        id: c.id,
        tipo: 'saida',
        descricao: `${c.descricao} (${c.parcela_alvo_no_mes}/${c.parcelas})`,
        valor: Number(c.valor_parcela ?? 0),
        data: c.data_compra,
        fonte: 'compra_cartao' as const,
        categoria: c.categoria,
        status: c.status ?? 'pendente',
      })
    }

    // Ordenar por data (mais recente primeiro)
    itensDetalhados.sort((a, b) => (b.data > a.data ? 1 : a.data > b.data ? -1 : 0))

    // ==========================================
    // GASTOS POR CATEGORIA (inclui tudo)
    // ==========================================
    const totalPorCategoria: Record<string, number> = {}

    // Transações de saída
    for (const t of transacoes ?? []) {
      if (t.tipo === 'saida') {
        totalPorCategoria[t.categoria] =
          (totalPorCategoria[t.categoria] ?? 0) + Number(t.valor)
      }
    }

    // Gastos fixos
    for (const g of gastosFixos ?? []) {
      totalPorCategoria[g.categoria] =
        (totalPorCategoria[g.categoria] ?? 0) + Number(g.valor)
    }

    // Gastos variáveis (já carregados acima)
    for (const gv of gastosVariaveis ?? []) {
      const val = Number(gv.valor_real ?? 0)
      if (val > 0) {
        totalPorCategoria[gv.categoria] = (totalPorCategoria[gv.categoria] ?? 0) + val
      }
    }

    // Compras cartão
    for (const c of comprasMesAlvo ?? []) {
      const val = Number(c.valor_parcela ?? 0)
      if (val > 0) {
        totalPorCategoria[c.categoria] = (totalPorCategoria[c.categoria] ?? 0) + val
      }
    }

    const gastosPorCategoria: ResumoCategoria[] = Object.entries(totalPorCategoria)
      .map(([categoria, total]) => ({
        categoria,
        total,
        percentual: totalSaidas > 0 ? Number(((total / totalSaidas) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.total - a.total)

    // ==========================================
    // HISTÓRICO DOS ÚLTIMOS 6 MESES
    // ==========================================
    const historico: ResumoMensal[] = []
    for (let i = 5; i >= 0; i--) {
      let mesBusca = mes - i
      let anoBusca = ano
      if (mesBusca <= 0) { mesBusca += 12; anoBusca -= 1 }

      const { inicio: inicioMes, fim: fimMes } = intervaloMes(mesBusca, anoBusca)

      // Transações
      const { data: transMes } = await supabaseAdmin
        .from('transacoes')
        .select('tipo, valor')
        .eq('usuario_id', usuarioId)
        .gte('data', inicioMes)
        .lte('data', fimMes)

      const entradas = transMes?.filter((t) => t.tipo === 'entrada').reduce((acc, t) => acc + Number(t.valor), 0) ?? 0
      const saidasTransacoes = transMes?.filter((t) => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor), 0) ?? 0

      // Gastos fixos do mês
      const { data: gfMes } = await supabaseAdmin
        .from('gastos_fixos')
        .select('valor')
        .eq('usuario_id', usuarioId)
        .eq('mes', mesBusca)
        .eq('ano', anoBusca)
      const totalGF = gfMes?.reduce((acc, g) => acc + Number(g.valor), 0) ?? 0

      // Gastos variáveis
      const { data: gvMes } = await supabaseAdmin
        .from('gastos_variaveis')
        .select('valor_real')
        .eq('usuario_id', usuarioId)
        .eq('mes', mesBusca)
        .eq('ano', anoBusca)
      const totalGV = gvMes?.reduce((acc, g) => acc + Number(g.valor_real ?? 0), 0) ?? 0

      historico.push({
        mes: mesBusca,
        ano: anoBusca,
        total_entradas: entradas,
        total_saidas: saidasTransacoes + totalGF + totalGV,
      })
    }

    // ==========================================
    // PRÓXIMOS VENCIMENTOS (7 DIAS)
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
    // COMPARATIVO MÊS ANTERIOR
    // ==========================================
    let mesAnterior = mes - 1
    let anoAnterior = ano
    if (mesAnterior <= 0) { mesAnterior = 12; anoAnterior -= 1 }

    const { inicio: inicioAnterior, fim: fimAnterior } = intervaloMes(mesAnterior, anoAnterior)

    const { data: transAnterior } = await supabaseAdmin
      .from('transacoes')
      .select('tipo, valor')
      .gte('data', inicioAnterior)
      .lte('data', fimAnterior)

    const entradasAnterior = transAnterior?.filter((t) => t.tipo === 'entrada').reduce((acc, t) => acc + Number(t.valor), 0) ?? 0
    const saidasAnterior = transAnterior?.filter((t) => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor), 0) ?? 0

    // ==========================================
    // SAÚDE FINANCEIRA
    // ==========================================
    const percentualGasto = totalEntradas > 0 ? Number(((totalSaidas / totalEntradas) * 100).toFixed(1)) : 0

    const classificacao =
      percentualGasto <= 50 ? 'otima' :
      percentualGasto <= 70 ? 'boa' :
      percentualGasto <= 90 ? 'atencao' : 'critica'

    const dados: DadosDashboard = {
      resumo: {
        total_entradas: totalEntradas,
        total_saidas: totalSaidas,
        saldo_atual: saldoAtual,
      },
      itens_detalhados: itensDetalhados,
      gastos_por_categoria: gastosPorCategoria,
      historico_mensal: historico,
      proximos_vencimentos: proximosVencimentos,
      comparativo: {
        entradas_mes_atual: entradasAnterior,
        entradas_mes_anterior: entradasAnterior,
        saidas_mes_atual: totalSaidas,
        saidas_mes_anterior: saidasAnterior + (await supabaseAdmin.from('gastos_fixos').select('valor').eq('mes', mesAnterior).eq('ano', anoAnterior).then(r => r.data?.reduce((a, g) => a + Number(g.valor), 0) ?? 0)),
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