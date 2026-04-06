import React, { useEffect, useCallback, useMemo } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, Calendar } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { formatarMoeda, mesAnoAtual } from '../../utils'
import Carregando from '../../components/ui/Carregando'
import MensagemErro from '../../components/ui/MensagemErro'

const CORES = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2']
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function CardResumo({ titulo, valor, icone: Icone, corIcon, sub }: {
  titulo: string; valor: string; icone: React.ElementType; corIcon: string; sub?: React.ReactNode
}) {
  return (
    <div className="card flex flex-col gap-3 relative overflow-hidden">
      <div className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in srgb, ${corIcon} 12%, transparent)` }}>
        <Icone size={16} style={{ color: corIcon }} />
      </div>
      <span className="text-xs font-medium" style={{ color: 'var(--cor-texto-suave)' }}>{titulo}</span>
      <span className="texto-card" style={{ fontFamily: 'var(--fonte-display)', fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.2 }}>{valor}</span>
      {sub}
    </div>
  )
}

// Suppress React console warnings from Recharts defaultProps
if (import.meta.env.DEV) {
  const originalWarn = console.warn
  const rechartsPattern = /defaultProps/
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && rechartsPattern.test(args[0])) return
    originalWarn.apply(console, args)
  }
}

export default function Dashboard() {
  const { mes, ano } = mesAnoAtual()
  const { dados, erro, carregando, requisitar } = useApi<any>()

  const buscar = useCallback(() => {
    requisitar(`/api/dashboard?mes=${mes}&ano=${ano}`)
  }, [mes, ano, requisitar])

  useEffect(() => { buscar() }, [buscar])

  const variacaoEntradas = useMemo(
    () => dados?.comparativo?.entradas_mes_anterior > 0
      ? ((dados.comparativo.entradas_mes_atual - dados.comparativo.entradas_mes_anterior) / dados.comparativo.entradas_mes_anterior) * 100 : 0,
    [dados?.comparativo?.entradas_mes_anterior, dados?.comparativo?.entradas_mes_atual]
  )

  const variacaoSaidas = useMemo(
    () => dados?.comparativo?.saidas_mes_anterior > 0
      ? ((dados.comparativo.saidas_mes_atual - dados.comparativo.saidas_mes_anterior) / dados.comparativo.saidas_mes_anterior) * 100 : 0,
    [dados?.comparativo?.saidas_mes_anterior, dados?.comparativo?.saidas_mes_atual]
  )

  const corSaude = useMemo(
    () => {
      const cls = dados?.saude_financeira?.classificacao
      if (!cls) return '#16a34a'
      return cls === 'otima' ? '#16a34a' : cls === 'boa' ? '#2563eb' : cls === 'atencao' ? '#d97706' : '#dc2626'
    },
    [dados?.saude_financeira?.classificacao]
  )

  const dadosHistorico = useMemo(() =>
    dados?.historico_mensal?.map((h: any) => ({
      nome: MESES[h.mes - 1],
      entradas: h.total_entradas,
      saidas: h.total_saidas,
    })) ?? [],
    [dados?.historico_mensal]
  )

  if (carregando) return <Carregando texto="Carregando dashboard..." />
  if (erro) return <MensagemErro mensagem={erro} onTentar={buscar} />
  if (!dados) return null

  const { resumo, gastos_por_categoria, historico_mensal,
    proximos_vencimentos, comparativo, saude_financeira } = dados

  return (
    <div className="flex flex-col gap-5">

      {/* Cabeçalho */}
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--cor-texto)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--cor-texto-suave)' }}>
          Visão geral de {MESES[mes - 1]} de {ano}
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CardResumo
          titulo="Entradas"
          valor={formatarMoeda(resumo.total_entradas)}
          icone={Wallet}
          corIcon={corSaude}
          sub={variacaoEntradas !== 0 && (
            <span className="text-xs flex items-center gap-1" style={{ color: variacaoEntradas >= 0 ? 'var(--cor-sucesso)' : 'var(--cor-perigo)' }}>
              {variacaoEntradas >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(variacaoEntradas).toFixed(1)}% vs mês anterior
            </span>
          )}
        />
        <CardResumo
          titulo="Saídas"
          valor={formatarMoeda(resumo.total_saidas)}
          icone={TrendingDown}
          corIcon="var(--cor-perigo)"
          sub={variacaoSaidas !== 0 && (
            <span className="text-xs flex items-center gap-1" style={{ color: variacaoSaidas <= 0 ? 'var(--cor-sucesso)' : 'var(--cor-perigo)' }}>
              {variacaoSaidas >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(variacaoSaidas).toFixed(1)}% vs mês anterior
            </span>
          )}
        />
        <CardResumo
          titulo="Saldo Atual"
          valor={formatarMoeda(resumo.saldo_atual)}
          icone={resumo.saldo_atual >= 0 ? TrendingUp : TrendingDown}
          corIcon={resumo.saldo_atual >= 0 ? 'var(--cor-sucesso)' : 'var(--cor-perigo)'}
        />
        <CardResumo
          titulo="Saldo Projetado"
          valor={formatarMoeda(resumo.saldo_projetado)}
          icone={TrendingUp}
          corIcon="var(--cor-primaria)"
        />
      </div>

      {/* Saúde financeira */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>Saúde Financeira</span>
          <span className="text-xs font-semibold capitalize" style={{ color: corSaude }}>
            {saude_financeira.classificacao} — {saude_financeira.percentual_gasto}%
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--cor-fundo-hover)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(saude_financeira.percentual_gasto, 100)}%`,
              background: corSaude,
            }}
          />
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Histórico */}
        <div className="card">
          <h3 className="font-display font-bold text-base mb-4" style={{ color: 'var(--cor-texto)' }}>
            Histórico de 3 meses
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dadosHistorico}>
              <defs>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
              <XAxis dataKey="nome" tick={{ fontSize: 11, fill: 'var(--cor-texto-suave)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--cor-texto-suave)' }} width={60} />
              <Tooltip
                formatter={(v) => typeof v === 'number' ? formatarMoeda(v) : v}
                contentStyle={{ fontSize: '0.8rem', borderRadius: '8px', background: 'var(--cor-fundo-card)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
              />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              <Area type="monotone" dataKey="entradas" name="Entradas" stroke="#16a34a" fill="url(#gE)" strokeWidth={2} />
              <Area type="monotone" dataKey="saidas" name="Saídas" stroke="#dc2626" fill="url(#gS)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Categorias */}
        <div className="card">
          <h3 className="font-display font-bold text-base mb-4" style={{ color: 'var(--cor-texto)' }}>
            Gastos por categoria
          </h3>
          {gastos_por_categoria.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: 'var(--cor-texto-suave)', opacity: 0.6 }}>
              Nenhum gasto registrado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={gastos_por_categoria} dataKey="total" nameKey="categoria"
                  cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {gastos_por_categoria.map((_: any, i: number) => (
                    <Cell key={i} fill={CORES[i % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => typeof v === 'number' ? formatarMoeda(v) : v}
                  contentStyle={{ fontSize: '0.8rem', borderRadius: '8px', background: 'var(--cor-fundo-card)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Próximos vencimentos */}
      {proximos_vencimentos.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} style={{ color: 'var(--cor-aviso)' }} />
            <h3 className="font-display font-bold text-base" style={{ color: 'var(--cor-texto)' }}>
              Vencimentos nos próximos 7 dias
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {proximos_vencimentos.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ background: 'var(--cor-aviso-suave)', borderColor: 'var(--cor-aviso-borda)' }}>
                <div className="flex items-center gap-2">
                  <Calendar size={14} style={{ color: 'var(--cor-aviso)' }} />
                  <span className="text-sm" style={{ color: 'var(--cor-texto)' }}>{v.descricao}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>Dia {v.dia_vencimento}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--cor-perigo)' }}>{formatarMoeda(v.valor)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}