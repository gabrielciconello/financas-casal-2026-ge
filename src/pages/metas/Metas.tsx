import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Target, TrendingUp } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { Meta, CriarMetaDTO, CriarContribuicaoMetaDTO } from '../../types'
import { formatarMoeda } from '../../utils'
import Carregando from '../../components/ui/Carregando'
import MensagemErro from '../../components/ui/MensagemErro'
import Paginacao from '../../components/ui/Paginacao'
import Modal from '../../components/ui/Modal'

export default function Metas() {
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [metas, setMetas] = useState<Meta[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [metaEditando, setMetaEditando] = useState<Meta | null>(null)
  const [modalContribuicao, setModalContribuicao] = useState(false)
  const [metaSelecionada, setMetaSelecionada] = useState<Meta | null>(null)

  const { carregando, erro, requisitar } = useApi()
  const apiForm = useApi()

  const buscar = useCallback(async () => {
    const resultado = await requisitar(
      `/api/metas?pagina=${pagina}&limite=10`
    )
    if (resultado) {
      setMetas(resultado.dados ?? [])
      setTotal(resultado.total ?? 0)
    }
  }, [pagina, requisitar])

  useEffect(() => { buscar() }, [buscar])

  async function handleSalvar(dados: CriarMetaDTO) {
    if (metaEditando) {
      await apiForm.requisitar(`/api/metas/${metaEditando.id}`, {
        method: 'PUT', body: dados,
      })
    } else {
      await apiForm.requisitar('/api/metas', {
        method: 'POST', body: dados,
      })
    }
    setModalAberto(false)
    setMetaEditando(null)
    buscar()
  }

  async function handleDeletar(id: string) {
    if (!confirm('Deseja deletar esta meta?')) return
    await requisitar(`/api/metas/${id}`, { method: 'DELETE' })
    buscar()
  }

  async function handleContribuir(dados: CriarContribuicaoMetaDTO) {
    await apiForm.requisitar(`/api/metas/${metaSelecionada?.id}/contribuicoes`, {
      method: 'POST', body: dados,
    })
    setModalContribuicao(false)
    buscar()
  }

  // Resumo
  const totalAlvo = metas.reduce((acc, m) => acc + m.valor_alvo, 0)
  const totalAtual = metas.reduce((acc, m) => acc + m.valor_atual, 0)
  const metasConcluidas = metas.filter((m) => m.concluida).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.625rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
            Metas Financeiras
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--cor-texto-suave)', marginTop: '0.25rem' }}>
            Objetivos e progresso financeiro
          </p>
        </div>
        <button className="btn btn-primario" onClick={() => { setMetaEditando(null); setModalAberto(true) }}>
          <Plus size={16} /> Nova Meta
        </button>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)', marginBottom: '0.5rem' }}>Total Alvo</div>
          <div style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
            {formatarMoeda(totalAlvo)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)', marginBottom: '0.5rem' }}>Acumulado</div>
          <div style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--cor-sucesso)' }}>
            {formatarMoeda(totalAtual)}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)', marginBottom: '0.5rem' }}>Concluídas</div>
          <div style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.5rem', fontWeight: 700, color: metasConcluidas > 0 ? 'var(--cor-sucesso)' : 'var(--cor-texto-suave)' }}>
            {metasConcluidas}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {carregando ? (
          <Carregando texto="Buscando metas..." />
        ) : erro ? (
          <MensagemErro mensagem={erro} onTentar={buscar} />
        ) : metas.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--cor-texto-suave)', fontSize: '0.875rem' }}>
            Nenhuma meta cadastrada
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px 140px 120px 100px 130px',
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid var(--cor-borda)',
              fontSize: '0.75rem', fontWeight: 600,
              color: 'var(--cor-texto-suave)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              <span>Meta</span>
              <span style={{ textAlign: 'right' }}>Valor Atual</span>
              <span style={{ textAlign: 'right' }}>Valor Alvo</span>
              <span style={{ textAlign: 'center' }}>Progresso</span>
              <span style={{ textAlign: 'center' }}>Status</span>
              <span style={{ textAlign: 'center' }}>Ações</span>
            </div>

            {metas.map((meta) => {
              const percentual = meta.valor_alvo > 0
                ? (meta.valor_atual / meta.valor_alvo) * 100
                : 0
              const corBarra = meta.concluida
                ? 'var(--cor-sucesso)'
                : percentual >= 70
                ? 'var(--cor-primaria)'
                : 'var(--cor-aviso)'

              return (
                <div key={meta.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 140px 120px 100px 130px',
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Target size={15} color="var(--cor-primaria)" />
                        {meta.titulo}
                      </span>
                    </div>
                    {meta.aporte_mensal && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginTop: '2px' }}>
                        Aporte mensal: {formatarMoeda(meta.aporte_mensal)}
                      </div>
                    )}
                  </div>

                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, textAlign: 'right', color: 'var(--cor-sucesso)' }}>
                    {formatarMoeda(meta.valor_atual)}
                  </span>

                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, textAlign: 'right', color: 'var(--cor-texto)' }}>
                    {formatarMoeda(meta.valor_alvo)}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--cor-fundo)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(percentual, 100)}%`,
                        background: corBarra,
                        borderRadius: '999px',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', whiteSpace: 'nowrap' }}>
                      {percentual.toFixed(0)}%
                    </span>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <span className={`badge ${meta.concluida ? 'badge-sucesso' : 'badge-aviso'}`}
                      style={{ fontSize: '0.7rem' }}>
                      {meta.concluida ? 'Concluída' : 'Em andamento'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button
                      className="btn btn-secundario"
                      onClick={() => { setMetaSelecionada(meta); setModalContribuicao(true) }}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                    >
                      <TrendingUp size={12} /> Contribuir
                    </button>
                    <button
                      className="btn btn-secundario"
                      onClick={() => { setMetaEditando(meta); setModalAberto(true) }}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                    >
                      Editar
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleDeletar(meta.id)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: 'var(--cor-perigo)', background: 'transparent' }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )
            })}

            <div style={{ padding: '0 1.25rem' }}>
              <Paginacao paginaAtual={pagina} total={total} limite={10} onMudar={setPagina} />
            </div>
          </>
        )}
      </div>

      {/* Modal Meta */}
      <Modal
        aberto={modalAberto}
        titulo={metaEditando ? 'Editar Meta' : 'Nova Meta'}
        onFechar={() => { setModalAberto(false); setMetaEditando(null) }}
      >
        <FormularioMeta
          meta={metaEditando}
          onSalvar={handleSalvar}
          onCancelar={() => { setModalAberto(false); setMetaEditando(null) }}
          carregando={apiForm.carregando}
        />
      </Modal>

      {/* Modal Contribuição */}
      <Modal
        aberto={modalContribuicao}
        titulo={`Contribuir — ${metaSelecionada?.titulo ?? ''}`}
        onFechar={() => { setModalContribuicao(false); setMetaSelecionada(null) }}
      >
        {metaSelecionada && (
          <FormularioContribuicao
            meta={metaSelecionada}
            onSalvar={handleContribuir}
            onCancelar={() => { setModalContribuicao(false); setMetaSelecionada(null) }}
            carregando={apiForm.carregando}
          />
        )}
      </Modal>

    </div>
  )
}

// ============================================
// FORMULÁRIO META
// ============================================
interface FormMetaProps {
  meta: Meta | null
  onSalvar: (dados: CriarMetaDTO) => void
  onCancelar: () => void
  carregando: boolean
}

function FormularioMeta({ meta, onSalvar, onCancelar, carregando }: FormMetaProps) {
  const [form, setForm] = useState<CriarMetaDTO>({
    titulo: meta?.titulo ?? '',
    valor_alvo: meta?.valor_alvo ?? 0,
    aporte_mensal: meta?.aporte_mensal ?? undefined,
    prazo: meta?.prazo ?? '',
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSalvar(form) }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
          Título da Meta
        </label>
        <input className="input" value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Ex: Viagem, Reserva de emergência..." required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Valor Alvo (R$)
          </label>
          <input className="input" type="number" step="0.01" min="0.01"
            value={form.valor_alvo}
            onChange={(e) => setForm({ ...form, valor_alvo: Number(e.target.value) })}
            required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
            Aporte Mensal (R$)
          </label>
          <input className="input" type="number" step="0.01" min="0"
            value={form.aporte_mensal ?? ''}
            onChange={(e) => setForm({ ...form, aporte_mensal: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Opcional" />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
          Prazo
        </label>
        <input className="input" type="date"
          value={form.prazo ?? ''}
          onChange={(e) => setForm({ ...form, prazo: e.target.value || undefined })}
          placeholder="Opcional" />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primario" disabled={carregando}>
          {carregando ? 'Salvando...' : meta ? 'Salvar Alterações' : 'Criar Meta'}
        </button>
      </div>
    </form>
  )
}

// ============================================
// FORMULÁRIO CONTRIBUIÇÃO
// ============================================
interface FormContribuicaoProps {
  meta: Meta
  onSalvar: (dados: CriarContribuicaoMetaDTO) => void
  onCancelar: () => void
  carregando: boolean
}

function FormularioContribuicao({ meta, onSalvar, onCancelar, carregando }: FormContribuicaoProps) {
  const [form, setForm] = useState<CriarContribuicaoMetaDTO>({
    meta_id: meta.id,
    valor: 0,
    observacoes: '',
    data: new Date().toISOString().split('T')[0],
  })

  const falta = meta.valor_alvo - meta.valor_atual

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSalvar(form) }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div style={{ padding: '0.75rem', background: 'var(--cor-fundo)', borderRadius: 'var(--raio-sm)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginBottom: '0.25rem' }}>
          Progresso atual
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: 'var(--cor-texto)' }}>
            {formatarMoeda(meta.valor_atual)} de {formatarMoeda(meta.valor_alvo)}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--cor-sucesso)' }}>
            Falta: {formatarMoeda(falta > 0 ? falta : 0)}
          </span>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
          Valor da Contribuição (R$)
        </label>
        <input className="input" type="number" step="0.01" min="0.01"
          value={form.valor}
          onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
          required />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
          Data
        </label>
        <input className="input" type="date"
          value={form.data ?? ''}
          onChange={(e) => setForm({ ...form, data: e.target.value })}
          required />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>
          Observações
        </label>
        <textarea className="input"
          value={form.observacoes ?? ''}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          rows={2}
          placeholder="Opcional..."
          style={{ resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primario" disabled={carregando}>
          {carregando ? 'Salvando...' : 'Registrar Contribuição'}
        </button>
      </div>
    </form>
  )
}
