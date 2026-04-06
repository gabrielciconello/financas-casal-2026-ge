import React, { useState, useEffect, useCallback } from 'react'
import { Plus, TrendingUp, TrendingDown, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { Salario, CriarSalarioDTO } from '../../types'
import { formatarMoeda, mesAnoAtual } from '../../utils'
import Carregando from '../../components/ui/Carregando'
import MensagemErro from '../../components/ui/MensagemErro'
import Paginacao from '../../components/ui/Paginacao'
import Modal from '../../components/ui/Modal'

export default function Salarios() {
  const { mes, ano } = mesAnoAtual()
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [salarios, setSalarios] = useState<Salario[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [salarioEditando, setSalarioEditando] = useState<Salario | null>(null)
  const [filtroMes, setFiltroMes] = useState(mes)
  const [filtroAno, setFiltroAno] = useState(ano)
  const [filtroTipo, setFiltroTipo] = useState('')

  const { carregando, erro, requisitar } = useApi()
  const apiForm = useApi()

  const buscar = useCallback(async () => {
    const params = new URLSearchParams({
      pagina: String(pagina),
      limite: '10',
      mes: String(filtroMes),
      ano: String(filtroAno),
      ...(filtroTipo && { tipo: filtroTipo }),
    })

    const resultado = await requisitar(`/api/salarios?${params}`)
    if (resultado) {
      setSalarios(resultado.dados ?? [])
      setTotal(resultado.total ?? 0)
    }
  }, [pagina, filtroMes, filtroAno, filtroTipo, requisitar])

  useEffect(() => { buscar() }, [buscar])

  async function handleSalvar(dados: CriarSalarioDTO) {
    if (salarioEditando) {
      await apiForm.requisitar(`/api/salarios/${salarioEditando.id}`, {
        method: 'PUT', body: dados,
      })
    } else {
      await apiForm.requisitar('/api/salarios', {
        method: 'POST', body: dados,
      })
    }
    setModalAberto(false)
    setSalarioEditando(null)
    buscar()
  }

  async function handleDeletar(id: string) {
    if (!confirm('Deseja deletar este salário?')) return
    await requisitar(`/api/salarios/${id}`, { method: 'DELETE' })
    buscar()
  }

  // Resumo do mês
  const totalEsperado = salarios.reduce((acc, s) => acc + Number(s.valor_esperado), 0)
  const totalRecebido = salarios.reduce((acc, s) => acc + Number(s.valor_recebido ?? 0), 0)
  const pendentes = salarios.filter((s) => s.status === 'pendente').length

  const iconeStatus = (status: string) => {
    if (status === 'recebido') return <CheckCircle size={16} color="var(--cor-sucesso)" />
    if (status === 'parcial') return <AlertCircle size={16} color="var(--cor-aviso)" />
    return <Clock size={16} color="var(--cor-texto-suave)" />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.625rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
            Salários
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--cor-texto-suave)', marginTop: '0.25rem' }}>
            Controle de renda fixa e variável
          </p>
        </div>
        <button className="btn btn-primario" onClick={() => { setSalarioEditando(null); setModalAberto(true) }}>
          <Plus size={16} /> Novo Salário
        </button>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)', marginBottom: '0.5rem' }}>
            Total Esperado
          </div>
          <div style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
            {formatarMoeda(totalEsperado)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)', marginBottom: '0.5rem' }}>
            Total Recebido
          </div>
          <div style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--cor-sucesso)' }}>
            {formatarMoeda(totalRecebido)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)', marginBottom: '0.5rem' }}>
            Pendentes
          </div>
          <div style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.5rem', fontWeight: 700, color: pendentes > 0 ? 'var(--cor-aviso)' : 'var(--cor-sucesso)' }}>
            {pendentes}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div style={{ flex: '1', minWidth: '160px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cor-texto-suave)', display: 'block', marginBottom: '0.375rem' }}>
            Mês
          </label>
          <select className="input" value={filtroMes} onChange={(e) => setFiltroMes(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i, 1).toLocaleString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1', minWidth: '100px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cor-texto-suave)', display: 'block', marginBottom: '0.375rem' }}>
            Ano
          </label>
          <select className="input" value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cor-texto-suave)', display: 'block', marginBottom: '0.375rem' }}>
            Tipo
          </label>
          <select className="input" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos</option>
            <option value="fixo">Fixo</option>
            <option value="variavel">Variável</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {carregando ? (
          <Carregando texto="Buscando salários..." />
        ) : erro ? (
          <MensagemErro mensagem={erro} onTentar={buscar} />
        ) : salarios.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--cor-texto-suave)', fontSize: '0.875rem' }}>
            Nenhum salário encontrado
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 130px 130px 100px 100px', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--cor-borda)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--cor-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>Descrição</span><span>Tipo</span>
                <span style={{ textAlign: 'right' }}>Esperado</span>
                <span style={{ textAlign: 'right' }}>Recebido</span>
                <span style={{ textAlign: 'center' }}>Status</span>
                <span style={{ textAlign: 'center' }}>Ações</span>
              </div>

              {salarios.map((s) => (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 130px 130px 100px 100px', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--cor-borda)', alignItems: 'center' }} className="transition-colors hover:bg-opacity-50">
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto)' }}>{s.descricao}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginTop: '2px' }}>
                      Previsto: {new Date(s.data_esperada + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <span className={`badge ${s.tipo === 'fixo' ? 'badge-info' : 'badge-aviso'}`} style={{ fontSize: '0.7rem' }}>{s.tipo}</span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, textAlign: 'right', color: 'var(--cor-texto)' }}>{formatarMoeda(s.valor_esperado)}</span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, textAlign: 'right', color: 'var(--cor-sucesso)' }}>{s.valor_recebido ? formatarMoeda(s.valor_recebido) : '—'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                    {iconeStatus(s.status)}
                    <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', textTransform: 'capitalize' }}>{s.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button className="btn btn-secundario" onClick={() => { setSalarioEditando(s); setModalAberto(true) }} style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>Editar</button>
                    <button className="btn" onClick={() => handleDeletar(s.id)} style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', color: 'var(--cor-perigo)', background: 'transparent' }}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col">
              {salarios.map((s) => (
                <div key={s.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--cor-borda)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cor-texto)' }}>{s.descricao}</div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                        <span className={`badge ${s.tipo === 'fixo' ? 'badge-info' : 'badge-aviso'}`} style={{ fontSize: '0.65rem' }}>{s.tipo}</span>
                        <span>{new Date(s.data_esperada + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                        <span className="text-xs" style={{ color: 'var(--cor-texto-suave)', textTransform: 'capitalize' }}>{s.status}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--cor-texto-suave)' }}>Esperado</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cor-texto)' }}>{formatarMoeda(s.valor_esperado)}</div>
                      {s.valor_recebido && (
                        <>
                          <div style={{ fontSize: '0.7rem', color: 'var(--cor-texto-suave)' }}>Recebido</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cor-sucesso)' }}>{formatarMoeda(s.valor_recebido)}</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 justify-end mt-1">
                    <button className="btn btn-secundario px-2 py-1 text-xs" onClick={() => { setSalarioEditando(s); setModalAberto(true) }}>Editar</button>
                    <button className="btn px-2 py-1 text-xs" style={{ color: 'var(--cor-perigo)', background: 'transparent' }} onClick={() => handleDeletar(s.id)}>Excluir</button>
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
        titulo={salarioEditando ? 'Editar Salário' : 'Novo Salário'}
        onFechar={() => { setModalAberto(false); setSalarioEditando(null) }}
      >
        <FormularioSalario
          salario={salarioEditando}
          mesAtual={filtroMes}
          anoAtual={filtroAno}
          onSalvar={handleSalvar}
          onCancelar={() => { setModalAberto(false); setSalarioEditando(null) }}
          carregando={apiForm.carregando}
        />
      </Modal>

    </div>
  )
}

// ============================================
// FORMULÁRIO
// ============================================
interface FormProps {
  salario: Salario | null
  mesAtual: number
  anoAtual: number
  onSalvar: (dados: CriarSalarioDTO) => void
  onCancelar: () => void
  carregando: boolean
}

function FormularioSalario({ salario, mesAtual, anoAtual, onSalvar, onCancelar, carregando }: FormProps) {
  const [form, setForm] = useState<CriarSalarioDTO>({
    tipo: salario?.tipo ?? 'fixo',
    descricao: salario?.descricao ?? '',
    valor_esperado: salario?.valor_esperado ?? 0,
    valor_recebido: salario?.valor_recebido ?? undefined,
    status: salario?.status ?? 'pendente',
    data_esperada: salario?.data_esperada ?? new Date().toISOString().split('T')[0],
    data_recebimento: salario?.data_recebimento ?? undefined,
    mes: salario?.mes ?? mesAtual,
    ano: salario?.ano ?? anoAtual,
    observacoes: salario?.observacoes ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSalvar(form)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Tipo
          </label>
          <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}>
            <option value="fixo">Fixo (CLT, PJ fixo)</option>
            <option value="variavel">Variável (Freelance, Comissão)</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Status
          </label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
            <option value="pendente">Pendente</option>
            <option value="recebido">Recebido</option>
            <option value="parcial">Parcial</option>
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
          Descrição
        </label>
        <input
          className="input"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          placeholder="Ex: Salário CLT, Freelance site..."
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Valor Esperado (R$)
          </label>
          <input
            className="input"
            type="text"
            inputMode="decimal"
            value={form.valor_esperado === 0 ? '' : form.valor_esperado}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
              setForm({ ...form, valor_esperado: v === '' ? 0 : Math.max(0, Number(v) || 0) })
            }}
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Valor Recebido (R$)
          </label>
          <input
            className="input"
            type="text"
            inputMode="decimal"
            value={form.valor_recebido != null && form.valor_recebido > 0 ? form.valor_recebido : ''}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
              if (v === '') {
                setForm({ ...form, valor_recebido: undefined })
              } else {
                const n = Number(v)
                if (!isNaN(n)) setForm({ ...form, valor_recebido: Math.max(0, n) })
              }
            }}
            placeholder="0,00"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Data Esperada
          </label>
          <input
            className="input"
            type="date"
            value={form.data_esperada}
            onChange={(e) => setForm({ ...form, data_esperada: e.target.value })}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Data de Recebimento
          </label>
          <input
            className="input"
            type="date"
            value={form.data_recebimento ?? ''}
            onChange={(e) => setForm({ ...form, data_recebimento: e.target.value || undefined })}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Mês
          </label>
          <select className="input" value={form.mes} onChange={(e) => setForm({ ...form, mes: Number(e.target.value) })}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i, 1).toLocaleString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Ano
          </label>
          <select className="input" value={form.ano} onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })}>
            {[2024, 2025, 2026, 2027].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
          Observações
        </label>
        <textarea
          className="input"
          value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          rows={2}
          placeholder="Opcional..."
          style={{ resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primario" disabled={carregando}>
          {carregando ? 'Salvando...' : salario ? 'Salvar Alterações' : 'Criar Salário'}
        </button>
      </div>

    </form>
  )
}