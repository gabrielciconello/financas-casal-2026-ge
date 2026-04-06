import React, { useState, useEffect, useCallback } from 'react'
import { Plus, CheckCircle, Clock } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { GastoFixo, CriarGastoFixoDTO } from '../../types'
import { formatarMoeda, mesAnoAtual } from '../../utils'
import Carregando from '../../components/ui/Carregando'
import MensagemErro from '../../components/ui/MensagemErro'
import Paginacao from '../../components/ui/Paginacao'
import Modal from '../../components/ui/Modal'

const CATEGORIAS = [
  'Moradia', 'Energia', 'Água', 'Internet', 'Telefone',
  'Streaming', 'Seguro', 'Escola', 'Academia', 'Outros',
]

export default function GastosFixos() {
  const { mes, ano } = mesAnoAtual()
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [gastos, setGastos] = useState<GastoFixo[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [gastoEditando, setGastoEditando] = useState<GastoFixo | null>(null)
  const [filtroMes, setFiltroMes] = useState(mes)
  const [filtroAno, setFiltroAno] = useState(ano)
  const [filtroStatus, setFiltroStatus] = useState('')

  const { carregando, erro, requisitar } = useApi()
  const apiForm = useApi()

  const buscar = useCallback(async () => {
    const params = new URLSearchParams({
      pagina: String(pagina),
      limite: '10',
      mes: String(filtroMes),
      ano: String(filtroAno),
      ...(filtroStatus && { status: filtroStatus }),
    })

    const resultado = await requisitar(`/api/gastos/fixos?${params}`)
    if (resultado) {
      setGastos(resultado.dados ?? [])
      setTotal(resultado.total ?? 0)
    }
  }, [pagina, filtroMes, filtroAno, filtroStatus, requisitar])

  useEffect(() => { buscar() }, [buscar])

  async function handleSalvar(dados: CriarGastoFixoDTO) {
    if (gastoEditando) {
      await apiForm.requisitar(`/api/gastos/fixos/${gastoEditando.id}`, {
        method: 'PUT', body: dados,
      })
    } else {
      await apiForm.requisitar('/api/gastos/fixos', {
        method: 'POST', body: dados,
      })
    }
    setModalAberto(false)
    setGastoEditando(null)
    buscar()
  }

  async function handleDeletar(id: string) {
    if (!confirm('Deseja deletar este gasto fixo?')) return
    await requisitar(`/api/gastos/fixos/${id}`, { method: 'DELETE' })
    buscar()
  }

  async function handleMarcarPago(gasto: GastoFixo) {
    await requisitar(`/api/gastos/fixos/${gasto.id}`, {
      method: 'PUT',
      body: { status: gasto.status === 'pago' ? 'pendente' : 'pago' },
    })
    buscar()
  }

  // Resumo
  const totalGastos = gastos.reduce((acc, g) => acc + Number(g.valor), 0)
  const totalPago = gastos.filter((g) => g.status === 'pago').reduce((acc, g) => acc + Number(g.valor), 0)
  const totalPendente = totalGastos - totalPago

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fonte-display)', fontSize: 'clamp(1.25rem, 4vw, 1.625rem)', fontWeight: 700, color: 'var(--cor-texto)' }}>Gastos Fixos</h1>
          <p style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', color: 'var(--cor-texto-suave)', marginTop: '0.25rem' }}>Contas mensais recorrentes</p>
        </div>
        <button className="btn btn-primario" onClick={() => { setGastoEditando(null); setModalAberto(true) }}>
          <Plus size={16} /> Novo Gasto Fixo
        </button>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '1rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)', marginBottom: '0.5rem' }}>Total do Mês</div>
          <div style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
            {formatarMoeda(totalGastos)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)', marginBottom: '0.5rem' }}>Pago</div>
          <div style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--cor-sucesso)' }}>
            {formatarMoeda(totalPago)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)', marginBottom: '0.5rem' }}>Pendente</div>
          <div style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.5rem', fontWeight: 700, color: totalPendente > 0 ? 'var(--cor-perigo)' : 'var(--cor-sucesso)' }}>
            {formatarMoeda(totalPendente)}
          </div>
        </div>
      </div>

      {/* Progresso de pagamentos */}
      {gastos.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto)' }}>
              Progresso de pagamentos
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--cor-texto-suave)' }}>
              {gastos.filter((g) => g.status === 'pago').length} de {gastos.length} pagas
            </span>
          </div>
          <div style={{ height: '8px', background: 'var(--cor-fundo-hover)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(gastos.filter((g) => g.status === 'pago').length / gastos.length) * 100}%`,
              background: 'var(--cor-sucesso)',
              borderRadius: '999px',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

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
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cor-texto-suave)', display: 'block', marginBottom: '0.375rem' }}>Status</label>
          <select className="input" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {carregando ? (
          <Carregando texto="Buscando gastos fixos..." />
        ) : erro ? (
          <MensagemErro mensagem={erro} onTentar={buscar} />
        ) : gastos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--cor-texto-suave)', fontSize: '0.875rem' }}>
            Nenhum gasto fixo encontrado
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 120px 100px 120px', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--cor-borda)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--cor-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>Descrição</span><span>Categoria</span>
                <span style={{ textAlign: 'center' }}>Vence</span>
                <span style={{ textAlign: 'right' }}>Valor</span>
                <span style={{ textAlign: 'center' }}>Status</span>
                <span style={{ textAlign: 'center' }}>Ações</span>
              </div>

              {gastos.map((g) => (
                <div key={g.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 120px 100px 120px', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--cor-borda)', alignItems: 'center' }} className="transition-colors hover:bg-opacity-50">
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto)' }}>{g.descricao}</span>
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{g.categoria}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)', textAlign: 'center' }}>Dia {g.dia_vencimento}</span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, textAlign: 'right', color: 'var(--cor-texto)' }}>{formatarMoeda(g.valor)}</span>
                  <div style={{ textAlign: 'center' }}>
                    <button onClick={() => handleMarcarPago(g)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: g.status === 'pago' ? 'var(--cor-sucesso)' : 'var(--cor-texto-suave)', fontSize: '0.75rem', fontWeight: 500 }}>
                      {g.status === 'pago' ? <CheckCircle size={16} /> : <Clock size={16} />}
                      {g.status}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button className="btn btn-secundario" onClick={() => { setGastoEditando(g); setModalAberto(true) }} style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>Editar</button>
                    <button className="btn" onClick={() => handleDeletar(g.id)} style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', color: 'var(--cor-perigo)', background: 'transparent' }}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col">
              {gastos.map((g) => (
                <div key={g.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--cor-borda)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cor-texto)' }}>{g.descricao}</div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{g.categoria}</span>
                        <span>Dia {g.dia_vencimento}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, textAlign: 'right', color: 'var(--cor-texto)' }}>
                      {formatarMoeda(g.valor)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={() => handleMarcarPago(g)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: g.status === 'pago' ? 'var(--cor-sucesso)' : 'var(--cor-texto-suave)', fontSize: '0.8rem', fontWeight: 500 }}>
                      {g.status === 'pago' ? <CheckCircle size={14} /> : <Clock size={14} />}
                      {g.status === 'pago' ? 'Pago' : 'Pendente'}
                    </button>
                    <div className="flex gap-1.5">
                      <button className="btn btn-secundario px-2 py-1 text-xs" onClick={() => { setGastoEditando(g); setModalAberto(true) }}>Editar</button>
                      <button className="btn px-2 py-1 text-xs" style={{ color: 'var(--cor-perigo)', background: 'transparent' }} onClick={() => handleDeletar(g.id)}>Excluir</button>
                    </div>
                  </div>
                </div>
              ))}
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
        titulo={gastoEditando ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}
        onFechar={() => { setModalAberto(false); setGastoEditando(null) }}
      >
        <FormularioGastoFixo
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
  gasto: GastoFixo | null
  mesAtual: number
  anoAtual: number
  onSalvar: (dados: CriarGastoFixoDTO) => void
  onCancelar: () => void
  carregando: boolean
}

function FormularioGastoFixo({ gasto, mesAtual, anoAtual, onSalvar, onCancelar, carregando }: FormProps) {
  const [form, setForm] = useState<CriarGastoFixoDTO>({
    descricao: gasto?.descricao ?? '',
    categoria: gasto?.categoria ?? 'Moradia',
    valor: gasto?.valor ?? 0,
    dia_vencimento: gasto?.dia_vencimento ?? 1,
    status: gasto?.status ?? 'pendente',
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
          placeholder="Ex: Aluguel, Energia..." required />
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
            Valor (R$)
          </label>
          <input className="input" type="text" inputMode="decimal"
            value={form.valor === 0 ? '' : form.valor}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
              setForm({ ...form, valor: v === '' ? 0 : Math.max(0, Number(v) || 0) })
            }}
            placeholder="0,00" required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Dia Vencimento
          </label>
          <input className="input" type="number" min="1" max="31"
            value={form.dia_vencimento}
            onChange={(e) => setForm({ ...form, dia_vencimento: Number(e.target.value) })}
            required />
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

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
          Status
        </label>
        <select className="input" value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primario" disabled={carregando}>
          {carregando ? 'Salvando...' : gasto ? 'Salvar Alterações' : 'Criar Gasto Fixo'}
        </button>
      </div>
    </form>
  )
}