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

const colunaHeaderStyle: React.CSSProperties = {
  fontSize: '0.75rem', fontWeight: 600, color: 'var(--cor-texto-suave)',
  textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.75rem 1.25rem',
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
    <div className="flex flex-col gap-6 w-full">

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.625rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
            Transações
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--cor-texto-suave)', marginTop: '0.25rem' }}>
            Entradas e saídas do casal
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button className="btn btn-secundario" onClick={exportarCSV}>
            <Download size={16} /> Exportar CSV
          </button>
          <button className="btn btn-primario" onClick={handleNovaTransacao}>
            <Plus size={16} /> Nova Transação
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--cor-texto-suave)' }}>
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

        <div className="flex-1 min-w-[100px]">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--cor-texto-suave)' }}>
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

        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--cor-texto-suave)' }}>
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

        <div className="flex-1 min-w-[130px]">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--cor-texto-suave)' }}>
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

        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--cor-texto-suave)' }}>
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
        >
          <Filter size={16} /> Filtrar
        </button>
      </div>

      {/* Lista */}
      <div className="card p-0 overflow-hidden">
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
            {/* Desktop table */}
            <div className="hidden md:block">
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 90px 110px 80px 90px', borderBottom: '1px solid var(--cor-borda)', ...colunaHeaderStyle }}>
                <span>Usuário</span>
                <span>Descrição</span>
                <span>Categoria</span>
                <span>Data</span>
                <span className="text-right">Valor</span>
                <span className="text-center">Status</span>
                <span className="text-center">Ações</span>
              </div>

              {transacoes.map((t) => (
                <div key={t.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '100px 1fr 100px 90px 110px 80px 90px',
                    padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--cor-borda)', alignItems: 'center',
                  }}
                  className="transition-colors hover:bg-opacity-50"
                >
                  <div style={{
                    fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cor-texto)',
                    padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                    background: t.usuario_nome === 'Gabriel' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)',
                    textAlign: 'center',
                  }}>
                    {t.usuario_nome || 'N/A'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto)' }}>{t.descricao}</div>
                    {t.metodo_pagamento && <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>{t.metodo_pagamento}</div>}
                  </div>
                  <span className="badge badge-info">{t.categoria}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>
                    {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, textAlign: 'right' }} className={t.tipo === 'entrada' ? '!text-green-600' : '!text-red-600'}>
                    {t.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(t.valor)}
                  </span>
                  <div className="flex justify-center">
                    <span className={`badge ${t.status === 'efetivado' ? 'badge-sucesso' : 'badge-aviso'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="flex gap-1 justify-center">
                    <button className="btn btn-secundario px-2 py-1 text-xs" onClick={() => handleEditar(t)}>Editar</button>
                    <button className="btn px-2 py-1 text-xs" style={{ color: 'var(--cor-perigo)', background: 'transparent' }} onClick={() => handleDeletar(t.id)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col">
              {transacoes.map((t) => (
                <div key={t.id}
                  style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--cor-borda)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cor-texto)' }}>{t.descricao}</div>
                      {t.metodo_pagamento && <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>{t.metodo_pagamento}</div>}
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 700 }} className={t.tipo === 'entrada' ? '!text-green-600' : '!text-red-600'}>
                      {t.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(t.valor)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--cor-texto-suave)' }}>
                    <span className="badge badge-info">{t.categoria}</span>
                    <span>{new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    <span className={`badge ${t.status === 'efetivado' ? 'badge-sucesso' : 'badge-aviso'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <button className="btn btn-secundario px-2 py-1 text-xs" onClick={() => handleEditar(t)}>Editar</button>
                    <button className="btn px-2 py-1 text-xs" style={{ color: 'var(--cor-perigo)', background: 'transparent' }} onClick={() => handleDeletar(t.id)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4">
              <Paginacao paginaAtual={pagina} total={total} limite={10} onMudar={setPagina} />
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
            type="text"
            inputMode="decimal"
            value={form.valor === 0 ? '' : form.valor}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
              setForm({ ...form, valor: v === '' ? 0 : Math.max(0, Number(v) || 0) })
            }}
            placeholder="0,00"
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
