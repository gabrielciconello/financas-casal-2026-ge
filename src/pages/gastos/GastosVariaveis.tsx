import React, { useState, useEffect, useCallback } from 'react'
import { Plus, TrendingUp } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { GastoVariavel, CriarGastoVariavelDTO } from '../../types'
import { formatarMoeda, mesAnoAtual } from '../../utils'
import Carregando from '../../components/ui/Carregando'
import MensagemErro from '../../components/ui/MensagemErro'
import Paginacao from '../../components/ui/Paginacao'
import Modal from '../../components/ui/Modal'

const CATEGORIAS = [
  'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Vestuário',
  'Higiene', 'Combustível', 'Mercado', 'Farmácia', 'Outros',
]

export default function GastosVariaveis() {
  const { mes, ano } = mesAnoAtual()
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [gastos, setGastos] = useState<GastoVariavel[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [gastoEditando, setGastoEditando] = useState<GastoVariavel | null>(null)
  const [filtroMes, setFiltroMes] = useState(mes)
  const [filtroAno, setFiltroAno] = useState(ano)
  const [filtroCategoria, setFiltroCategoria] = useState('')

  const { carregando, erro, requisitar } = useApi()
  const apiForm = useApi()

  const buscar = useCallback(async () => {
    const params = new URLSearchParams({
      pagina: String(pagina),
      limite: '10',
      mes: String(filtroMes),
      ano: String(filtroAno),
      ...(filtroCategoria && { categoria: filtroCategoria }),
    })

    const resultado = await requisitar(`/api/gastos/variaveis?${params}`)
    if (resultado) {
      setGastos(resultado.dados ?? [])
      setTotal(resultado.total ?? 0)
    }
  }, [pagina, filtroMes, filtroAno, filtroCategoria, requisitar])

  useEffect(() => { buscar() }, [buscar])

  async function handleSalvar(dados: CriarGastoVariavelDTO) {
    if (gastoEditando) {
      await apiForm.requisitar(`/api/gastos/variaveis/${gastoEditando.id}`, {
        method: 'PUT', body: dados,
      })
    } else {
      await apiForm.requisitar('/api/gastos/variaveis', {
        method: 'POST', body: dados,
      })
    }
    setModalAberto(false)
    setGastoEditando(null)
    buscar()
  }

  async function handleDeletar(id: string) {
    if (!confirm('Deseja deletar este gasto?')) return
    await requisitar(`/api/gastos/variaveis/${id}`, { method: 'DELETE' })
    buscar()
  }

  // Resumo
  const totalEstimado = gastos.reduce((acc, g) => acc + Number(g.valor_estimado ?? 0), 0)
  const totalReal = gastos.reduce((acc, g) => acc + Number(g.valor_real ?? 0), 0)
  const desvio = totalReal - totalEstimado

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.625rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
            Gastos Variáveis
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--cor-texto-suave)', marginTop: '0.25rem' }}>
            Estimado vs real por categoria
          </p>
        </div>
        <button className="btn btn-primario" onClick={() => { setGastoEditando(null); setModalAberto(true) }}>
          <Plus size={16} /> Novo Gasto
        </button>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '1rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)', marginBottom: '0.5rem' }}>Estimado</div>
          <div style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
            {formatarMoeda(totalEstimado)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)', marginBottom: '0.5rem' }}>Real</div>
          <div style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
            {formatarMoeda(totalReal)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)', marginBottom: '0.5rem' }}>Desvio</div>
          <div style={{
            fontFamily: 'var(--fonte-display)', fontSize: '1.5rem', fontWeight: 700,
            color: desvio > 0 ? 'var(--cor-perigo)' : desvio < 0 ? 'var(--cor-sucesso)' : 'var(--cor-texto)',
            display: 'flex', alignItems: 'center', gap: '0.375rem',
          }}>
            {desvio > 0 && <TrendingUp size={20} />}
            {desvio !== 0 ? (desvio > 0 ? '+' : '') + formatarMoeda(Math.abs(desvio)) : formatarMoeda(0)}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div style={{ flex: '1', minWidth: '160px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cor-texto-suave)', display: 'block', marginBottom: '0.375rem' }}>Mês</label>
          <select className="input" value={filtroMes} onChange={(e) => setFiltroMes(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i, 1).toLocaleString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1', minWidth: '100px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cor-texto-suave)', display: 'block', marginBottom: '0.375rem' }}>Ano</label>
          <select className="input" value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ flex: '1', minWidth: '160px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cor-texto-suave)', display: 'block', marginBottom: '0.375rem' }}>Categoria</label>
          <select className="input" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {carregando ? (
          <Carregando texto="Buscando gastos variáveis..." />
        ) : erro ? (
          <MensagemErro mensagem={erro} onTentar={buscar} />
        ) : gastos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--cor-texto-suave)', fontSize: '0.875rem' }}>
            Nenhum gasto variável encontrado
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block">
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px 130px 130px 100px 100px', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--cor-borda)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--cor-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>Usuário</span><span>Descrição</span><span>Categoria</span>
                <span style={{ textAlign: 'right' }}>Estimado</span>
                <span style={{ textAlign: 'right' }}>Real</span>
                <span style={{ textAlign: 'center' }}>Desvio</span>
                <span style={{ textAlign: 'center' }}>Ações</span>
              </div>

              {gastos.map((g) => {
                const desvioItem = Number(g.valor_real ?? 0) - Number(g.valor_estimado ?? 0)
                return (
                  <div key={g.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px 130px 130px 100px 100px', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--cor-borda)', alignItems: 'center' }} className="transition-colors hover:bg-opacity-50">
                    <div style={{
                      fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cor-texto)',
                      padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                      background: g.usuario_nome === 'Gabriel' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)',
                      textAlign: 'center',
                    }}>
                      {g.usuario_nome || 'N/A'}
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto)' }}>{g.descricao}</span>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{g.categoria}</span>
                    <span style={{ fontSize: '0.875rem', textAlign: 'right', color: 'var(--cor-texto-suave)' }}>{g.valor_estimado ? formatarMoeda(g.valor_estimado) : '—'}</span>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, textAlign: 'right', color: 'var(--cor-texto)' }}>{g.valor_real ? formatarMoeda(g.valor_real) : '—'}</span>
                    <div style={{ textAlign: 'center' }}>
                      {g.valor_estimado && g.valor_real ? (
                        <span className={`badge ${desvioItem > 0 ? 'badge-perigo' : 'badge-sucesso'}`} style={{ fontSize: '0.7rem' }}>
                          {desvioItem > 0 ? '+' : ''}{formatarMoeda(desvioItem)}
                        </span>
                      ) : '—'}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button className="btn btn-secundario" onClick={() => { setGastoEditando(g); setModalAberto(true) }} style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>Editar</button>
                      <button className="btn" onClick={() => handleDeletar(g.id)} style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', color: 'var(--cor-perigo)', background: 'transparent' }}>Excluir</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col">
              {gastos.map((g) => {
                const desvioItem = Number(g.valor_real ?? 0) - Number(g.valor_estimado ?? 0)
                return (
                  <div key={g.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--cor-borda)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cor-texto)' }}>{g.descricao}</div>
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{g.categoria}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--cor-texto-suave)' }}>Real</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cor-texto)' }}>{g.valor_real ? formatarMoeda(g.valor_real) : '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--cor-texto-suave)' }}>
                      {g.valor_estimado && <span>Estimado: {formatarMoeda(g.valor_estimado)}</span>}
                      {g.valor_estimado && g.valor_real && (
                        <span className={`badge ${desvioItem > 0 ? 'badge-perigo' : 'badge-sucesso'}`} style={{ fontSize: '0.65rem' }}>
                          {desvioItem > 0 ? '+' : ''}{formatarMoeda(desvioItem)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5 justify-end mt-1">
                      <button className="btn btn-secundario px-2 py-1 text-xs" onClick={() => { setGastoEditando(g); setModalAberto(true) }}>Editar</button>
                      <button className="btn px-2 py-1 text-xs" style={{ color: 'var(--cor-perigo)', background: 'transparent' }} onClick={() => handleDeletar(g.id)}>Excluir</button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ padding: '0 1.25rem' }}>
              <Paginacao paginaAtual={pagina} total={total} limite={10} onMudar={setPagina} />
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <Modal
        aberto={modalAberto}
        titulo={gastoEditando ? 'Editar Gasto Variável' : 'Novo Gasto Variável'}
        onFechar={() => { setModalAberto(false); setGastoEditando(null) }}
      >
        <FormularioGastoVariavel
          gasto={gastoEditando}
          mesAtual={filtroMes}
          anoAtual={filtroAno}
          onSalvar={handleSalvar}
          onCancelar={() => { setModalAberto(false); setGastoEditando(null) }}
          carregando={apiForm.carregando}
        />
      </Modal>

    </div>
  )
}

interface FormProps {
  gasto: GastoVariavel | null
  mesAtual: number
  anoAtual: number
  onSalvar: (dados: CriarGastoVariavelDTO) => void
  onCancelar: () => void
  carregando: boolean
}

function FormularioGastoVariavel({ gasto, mesAtual, anoAtual, onSalvar, onCancelar, carregando }: FormProps) {
  const [form, setForm] = useState<CriarGastoVariavelDTO>({
    descricao: gasto?.descricao ?? '',
    categoria: gasto?.categoria ?? 'Alimentação',
    valor_estimado: gasto?.valor_estimado ?? undefined,
    valor_real: gasto?.valor_real ?? undefined,
    mes: gasto?.mes ?? mesAtual,
    ano: gasto?.ano ?? anoAtual,
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSalvar(form) }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
          Descrição
        </label>
        <input className="input" value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          placeholder="Ex: Mercado, Combustível..." required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Categoria
          </label>
          <select className="input" value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Valor Estimado (R$)
          </label>
          <input className="input" type="text" inputMode="decimal"
            value={form.valor_estimado != null && form.valor_estimado > 0 ? form.valor_estimado : ''}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
              if (v === '') {
                setForm({ ...form, valor_estimado: undefined })
              } else {
                const n = Number(v)
                if (!isNaN(n)) setForm({ ...form, valor_estimado: Math.max(0, n) })
              }
            }}
            placeholder="0,00" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Valor Real (R$)
          </label>
          <input className="input" type="text" inputMode="decimal"
            value={form.valor_real != null && form.valor_real > 0 ? form.valor_real : ''}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
              if (v === '') {
                setForm({ ...form, valor_real: undefined })
              } else {
                const n = Number(v)
                if (!isNaN(n)) setForm({ ...form, valor_real: Math.max(0, n) })
              }
            }}
            placeholder="0,00" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Mês
          </label>
          <select className="input" value={form.mes}
            onChange={(e) => setForm({ ...form, mes: Number(e.target.value) })}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i, 1).toLocaleString('pt-BR', { month: 'short' })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Ano
          </label>
          <select className="input" value={form.ano}
            onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })}>
            {[2024, 2025, 2026, 2027].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primario" disabled={carregando}>
          {carregando ? 'Salvando...' : gasto ? 'Salvar Alterações' : 'Criar Gasto'}
        </button>
      </div>
    </form>
  )
}