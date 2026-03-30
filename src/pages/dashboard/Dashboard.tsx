import React, { useEffect, useCallback } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet,
  AlertTriangle, Calendar, Target
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { formatarMoeda, mesAnoAtual } from '../../utils'
import CardResumo from '../../components/ui/CardResumo'
import Carregando from '../../components/ui/Carregando'
import MensagemErro from '../../components/ui/MensagemErro'

const CORES_GRAFICO = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2']

const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                     'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Dashboard() {
  const { mes, ano } = mesAnoAtual()
  const { dados, erro, carregando, requisitar } = useApi<any>()

  const buscar = useCallback(() => {
    requisitar(`/api/dashboard?mes=${mes}&ano=${ano}`)
  }, [mes, ano, requisitar])

  useEffect(() => { buscar() }, [buscar])

  if (carregando) return <Carregando texto="Carregando dashboard..." />
  if (erro) return <MensagemErro mensagem={erro} onTentar={buscar} />
  if (!dados) return null

  const { resumo, gastos_por_categoria, historico_mensal,
          proximos_vencimentos, comparativo, saude_financeira } = dados

  const variacaoEntradas = comparativo.entradas_mes_anterior > 0
    ? ((comparativo.entradas_mes_atual - comparativo.entradas_mes_anterior)
        / comparativo.entradas_mes_anterior) * 100
    : 0

  const variacaoSaidas = comparativo.saidas_mes_anterior > 0
    ? ((comparativo.saidas_mes_atual - comparativo.saidas_mes_anterior)
        / comparativo.saidas_mes_anterior) * 100
    : 0

  const corSaude =
    saude_financeira.classificacao === 'otima' ? 'var(--cor-sucesso)' :
    saude_financeira.classificacao === 'boa' ? 'var(--cor-primaria)' :
    saude_financeira.classificacao === 'atencao' ? 'var(--cor-aviso)' :
    'var(--cor-perigo)'

  const dadosHistorico = historico_mensal.map((h: any) => ({
    nome: NOMES_MESES[h.mes - 1],
    entradas: h.total_entradas,
    saidas: h.total_saidas,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Cabeçalho */}
      <div>
        <h1 style={{
          fontFamily: 'var(--fonte-display)',
          fontSize: '1.625rem',
          fontWeight: 700,
          color: 'var(--cor-texto)',
        }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--cor-texto-suave)', marginTop: '0.25rem' }}>
          Visão geral de {NOMES_MESES[mes - 1]} {ano}
        </p>
      </div>

      {/* Cards de resumo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
      }}>
        <CardResumo
          titulo="Total de Entradas"
          valor={formatarMoeda(resumo.total_entradas)}
          icone={TrendingUp}
          corIcone="var(--cor-sucesso)"
          variacao={variacaoEntradas}
          descricaoVariacao="vs mês anterior"
        />
        <CardResumo
          titulo="Total de Saídas"
          valor={formatarMoeda(resumo.total_saidas)}
          icone={TrendingDown}
          corIcone="var(--cor-perigo)"
          variacao={variacaoSaidas}
          descricaoVariacao="vs mês anterior"
        />
        <CardResumo
          titulo="Saldo Atual"
          valor={formatarMoeda(resumo.saldo_atual)}
          icone={Wallet}
          corIcone={resumo.saldo_atual >= 0 ? 'var(--cor-sucesso)' : 'var(--cor-perigo)'}
        />
        <CardResumo
          titulo="Saldo Projetado"
          valor={formatarMoeda(resumo.saldo_projetado)}
          icone={Target}
          corIcone="var(--cor-primaria)"
        />
      </div>

      {/* Saúde financeira */}
      <div className="card">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.875rem',
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto)' }}>
            Saúde Financeira
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: corSaude,
            textTransform: 'capitalize',
          }}>
            {saude_financeira.classificacao} — {saude_financeira.percentual_gasto}% gasto
          </span>
        </div>
        <div style={{
          height: '8px',
          background: 'var(--cor-fundo)',
          borderRadius: '999px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(saude_financeira.percentual_gasto, 100)}%`,
            background: corSaude,
            borderRadius: '999px',
            transition: 'width 0.8s ease',
          }} />
        </div>
      </div>

      {/* Gráficos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem',
      }}>

        {/* Histórico mensal */}
        <div className="card">
          <h3 style={{
            fontFamily: 'var(--fonte-display)',
            fontSize: '1rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
            color: 'var(--cor-texto)',
          }}>
            Histórico dos últimos 6 meses
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dadosHistorico}>
              <defs>
                <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
              <XAxis dataKey="nome" tick={{ fontSize: 12, fill: 'var(--cor-texto-suave)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--cor-texto-suave)' }} />
              <Tooltip
                formatter={(valor) => {
                    if (typeof valor !== 'number') return valor
                    return formatarMoeda(valor)
                }}
                contentStyle={{
                    background: 'var(--cor-fundo-card)',
                    border: '1px solid var(--cor-borda)',
                    borderRadius: 'var(--raio-sm)',
                    fontSize: '0.8125rem',
                }}
                />
              <Legend />
              <Area
                type="monotone"
                dataKey="entradas"
                name="Entradas"
                stroke="#16a34a"
                fill="url(#gradEntradas)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="saidas"
                name="Saídas"
                stroke="#dc2626"
                fill="url(#gradSaidas)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gastos por categoria */}
        <div className="card">
          <h3 style={{
            fontFamily: 'var(--fonte-display)',
            fontSize: '1rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
            color: 'var(--cor-texto)',
          }}>
            Gastos por categoria
          </h3>
          {gastos_por_categoria.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '220px',
              color: 'var(--cor-texto-suave)',
              fontSize: '0.875rem',
            }}>
              Nenhum gasto registrado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={gastos_por_categoria}
                  dataKey="total"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {gastos_por_categoria.map((_: any, index: number) => (
                    <Cell
                      key={index}
                      fill={CORES_GRAFICO[index % CORES_GRAFICO.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                formatter={(valor) => {
                    if (typeof valor !== 'number') return valor
                    return formatarMoeda(valor)
                }}
                contentStyle={{
                    background: 'var(--cor-fundo-card)',
                    border: '1px solid var(--cor-borda)',
                    borderRadius: 'var(--raio-sm)',
                    fontSize: '0.8125rem',
                }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Próximos vencimentos */}
      {proximos_vencimentos.length > 0 && (
        <div className="card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}>
            <AlertTriangle size={18} color="var(--cor-aviso)" />
            <h3 style={{
              fontFamily: 'var(--fonte-display)',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--cor-texto)',
            }}>
              Vencimentos nos próximos 7 dias
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {proximos_vencimentos.map((v: any) => (
              <div key={v.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: 'var(--cor-aviso-suave)',
                borderRadius: 'var(--raio-sm)',
                border: '1px solid var(--cor-aviso)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={15} color="var(--cor-aviso)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--cor-texto)' }}>
                    {v.descricao}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--cor-texto-suave)',
                  }}>
                    Dia {v.dia_vencimento}
                  </span>
                  <span style={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--cor-perigo)',
                  }}>
                    {formatarMoeda(v.valor)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}