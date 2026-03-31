import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Download } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { Transacao, CriarTransacaoDTO } from '../../types'
import { formatarMoeda, mesAnoAtual } from '../../utils'
import Carregando from '../../components/ui/Carregando'
import MensagemErro from '../../components/ui/MensagemErro'
import Paginacao from '../../components/ui/Paginacao'
import Modal from '../../components/ui/Modal'

const CATEGORIAS = [
  'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Moradia',
  'Educação', 'Vestuário', 'Serviços', 'Salário', 'Freelance',
  'Investimento', 'Outros',
]

const METODOS_PAGAMENTO = ['PIX', 'Débito', 'Crédito', 'Dinheiro', 'TED/DOC']

interface FiltrosState {
  mes: number
  ano: number
  tipo: string
  categoria: string
  status: string
  busca: string
}

export default function Transacoes() {
  const { mes, ano } = mesAnoAtual()
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [transacaoEditando, setTransacaoEditando] = useState<Transacao | null>(null)
  const [filtros, setFiltros] = useState<FiltrosState>({
    mes, ano, tipo: '', categoria: '', status: '', busca: '',
  })

  const { carregando, erro, requisitar } = useApi()
  const apiForm = useApi()

  const buscar = useCallback(async () => {
    const params = new URLSearchParams({
      pagina: String(pagina),
      limite: '10',
      ...(filtros.mes && { mes: String(filtros.mes) }),
      ...(filtros.ano && { ano: String(filtros.ano) }),
      ...(filtros.tipo && { tipo: filtros.tipo }),
      ...(filtros.categoria && { categoria: filtros.categoria }),
      ...(filtros.status && { status: filtros.status }),
    })

    const resultado = await requisitar(`/api/transacoes?${params}`)
    if (resultado) {
      setTransacoes(resultado.dados ?? [])
      setTotal(resultado.total ?? 0)
    }
  }, [pagina, filtros, requisitar])

  useEffect(() => { buscar() }, [buscar])

  async function handleSalvar(dados: CriarTransacaoDTO) {
    if (transacaoEditando) {
      await apiForm.requisitar(`/api/transacoes/${transacaoEditando.id}`, {
        method: 'PUT',
        body: dados,
      })
    } else {
      await apiForm.requisitar('/api/transacoes', {
        method: 'POST',
        body: dados,
      })
    }
    setModalAberto(false)
    setTransacaoEditando(null)
    buscar()
  }

  async function handleDeletar(id: string) {
    if (!confirm('Deseja deletar esta transação?')) return
    await requisitar(`/api/transacoes/${id}`, { method: 'DELETE' })
    buscar()
  }

  function handleEditar(transacao: Transacao) {
    setTransacaoEditando(transacao)
    setModalAberto(true)
  }

  function handleNovaTransacao() {
    setTransacaoEditando(null)
    setModalAberto(true)
  }

  // Exportar CSV
  function exportarCSV() {
    const cabecalho = ['Descrição', 'Categoria', 'Tipo', 'Valor', 'Data', 'Status', 'Método']
    const linhas = transacoes.map((t) => [
      t.descricao, t.categoria, t.tipo,
      t.valor, t.data, t.status,
      t.metodo_pagamento ?? '',
    ])
    const csv = [cabecalho, ...linhas].map((l) => l.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transacoes-${filtros.mes}-${filtros.ano}.csv`
    a.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.625rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
            Transações
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--cor-texto-suave)', marginTop: '0.25rem' }}>
            Entradas e saídas do casal
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secundario" onClick={exportarCSV}>
            <Download size={16} /> Exportar CSV
          </button>
          <button className="btn btn-primario" onClick={handleNovaTransacao}>
            <Plus size={16} /> Nova Transação
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div style={{ flex: '1', minWidth: '180px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cor-texto-suave)', display: 'block', marginBottom: '0.375rem' }}>
            Mês
          </label>
          <select
            className="input"
            value={filtros.mes}
            onChange={(e) => setFiltros({ ...filtros, mes: Number(e.target.value) })}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i, 1).toLocaleString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cor-texto-suave)', display: 'block', marginBottom: '0.375rem' }}>
            Ano
          </label>
          <select
            className="input"
            value={filtros.ano}
            onChange={(e) => setFiltros({ ...filtros, ano: Number(e.target.value) })}
          >
            {[2024, 2025, 2026, 2027].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cor-texto-suave)', display: 'block', marginBottom: '0.375rem' }}>
            Tipo
          </label>
          <select
            className="input"
            value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>

        <div style={{ flex: '1', minWidth: '160px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cor-texto-suave)', display: 'block', marginBottom: '0.375rem' }}>
            Categoria
          </label>
          <select
            className="input"
            value={filtros.categoria}
            onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
          >
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--cor-texto-suave)', display: 'block', marginBottom: '0.375rem' }}>
            Status
          </label>
          <select
            className="input"
            value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="efetivado">Efetivado</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>

        <button
          className="btn btn-secundario"
          onClick={() => { setPagina(1); buscar() }}
          style={{ alignSelf: 'flex-end' }}
        >
          <Filter size={16} /> Filtrar
        </button>
      </div>

      {/* Lista */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {carregando ? (
          <Carregando texto="Buscando transações..." />
        ) : erro ? (
          <MensagemErro mensagem={erro} onTentar={buscar} />
        ) : transacoes.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--cor-texto-suave)', fontSize: '0.875rem' }}>
            Nenhuma transação encontrada
          </div>
        ) : (
          <>
            {/* Header da tabela */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 100px 120px 80px 100px',
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid var(--cor-borda)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--cor-texto-suave)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <span>Descrição</span>
              <span>Categoria</span>
              <span>Data</span>
              <span style={{ textAlign: 'right' }}>Valor</span>
              <span style={{ textAlign: 'center' }}>Status</span>
              <span style={{ textAlign: 'center' }}>Ações</span>
            </div>

            {/* Linhas */}
            {transacoes.map((t) => (
              <div key={t.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 100px 120px 80px 100px',
                padding: '0.875rem 1.25rem',
                borderBottom: '1px solid var(--cor-borda)',
                alignItems: 'center',
                transition: 'var(--transicao)',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cor-fundo-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto)' }}>
                    {t.descricao}
                  </div>
                  {t.metodo_pagamento && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginTop: '2px' }}>
                      {t.metodo_pagamento}
                    </div>
                  )}
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                  {t.categoria}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)' }}>
                  {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
                <span style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  textAlign: 'right',
                  color: t.tipo === 'entrada' ? 'var(--cor-sucesso)' : 'var(--cor-perigo)',
                }}>
                  {t.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(t.valor)}
                </span>
                <div style={{ textAlign: 'center' }}>
                  <span className={`badge ${t.status === 'efetivado' ? 'badge-sucesso' : 'badge-aviso'}`}
                    style={{ fontSize: '0.7rem' }}>
                    {t.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button
                    className="btn btn-secundario"
                    onClick={() => handleEditar(t)}
                    style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn"
                    onClick={() => handleDeletar(t.id)}
                    style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', color: 'var(--cor-perigo)', background: 'transparent' }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}

            {/* Paginação */}
            <div style={{ padding: '0 1.25rem' }}>
              <Paginacao
                paginaAtual={pagina}
                total={total}
                limite={10}
                onMudar={setPagina}
              />
            </div>
          </>
        )}
      </div>

      {/* Modal de criação/edição */}
      <Modal
        aberto={modalAberto}
        titulo={transacaoEditando ? 'Editar Transação' : 'Nova Transação'}
        onFechar={() => { setModalAberto(false); setTransacaoEditando(null) }}
      >
        <FormularioTransacao
          transacao={transacaoEditando}
          onSalvar={handleSalvar}
          onCancelar={() => { setModalAberto(false); setTransacaoEditando(null) }}
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
  transacao: Transacao | null
  onSalvar: (dados: CriarTransacaoDTO) => void
  onCancelar: () => void
  carregando: boolean
}

function FormularioTransacao({ transacao, onSalvar, onCancelar, carregando }: FormProps) {
  const [form, setForm] = useState<CriarTransacaoDTO>({
    descricao: transacao?.descricao ?? '',
    categoria: transacao?.categoria ?? 'Alimentação',
    tipo: transacao?.tipo ?? 'saida',
    valor: transacao?.valor ?? 0,
    metodo_pagamento: transacao?.metodo_pagamento ?? 'PIX',
    status: transacao?.status ?? 'efetivado',
    recorrente: transacao?.recorrente ?? false,
    observacoes: transacao?.observacoes ?? '',
    data: transacao?.data ?? new Date().toISOString().split('T')[0],
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSalvar(form)
  }

  const campo = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
        {label}
      </label>
      {children}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {campo('Descrição',
        <input
          className="input"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          placeholder="Ex: Mercado, Salário..."
          required
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Tipo
          </label>
          <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}>
            <option value="saida">Saída</option>
            <option value="entrada">Entrada</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Valor (R$)
          </label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0.01"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
            required
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Categoria
          </label>
          <select className="input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Método de Pagamento
          </label>
          <select className="input" value={form.metodo_pagamento} onChange={(e) => setForm({ ...form, metodo_pagamento: e.target.value })}>
            {METODOS_PAGAMENTO.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Data
          </label>
          <input
            className="input"
            type="date"
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Status
          </label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
            <option value="efetivado">Efetivado</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      </div>

      {campo('Observações',
        <textarea
          className="input"
          value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          rows={2}
          placeholder="Opcional..."
          style={{ resize: 'vertical' }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          type="checkbox"
          id="recorrente"
          checked={form.recorrente}
          onChange={(e) => setForm({ ...form, recorrente: e.target.checked })}
        />
        <label htmlFor="recorrente" style={{ fontSize: '0.875rem', color: 'var(--cor-texto)' }}>
          Transação recorrente (repetir mensalmente)
        </label>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primario" disabled={carregando}>
          {carregando ? 'Salvando...' : transacao ? 'Salvar Alterações' : 'Criar Transação'}
        </button>
      </div>

    </form>
  )
}