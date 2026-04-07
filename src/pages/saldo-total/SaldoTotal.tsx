import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Edit2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { formatarMoeda } from '../../utils'
import Carregando from '../../components/ui/Carregando'
import MensagemErro from '../../components/ui/MensagemErro'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useContexto'

export default function SaldoTotal() {
  const { usuario, carregando: carregandoAuth } = useAuth()
  const { dados, erro, carregando, requisitar } = useApi<any>()
  const { dados: movs, carregando: carregandoMovs, requisitar: buscarMovs } = useApi<any>()
  const apiCrud = useApi()
  const apiDelete = useApi()
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [form, setForm] = useState({ descricao: '', valor: '', tipo: 'aporte' as 'aporte' | 'retirada' })

  const buscarTudo = useCallback(() => {
    requisitar('/api/saldo-total/resumo')
    buscarMovs('/api/saldo-total?limite=50')
  }, [requisitar, buscarMovs])

  useEffect(() => { if (usuario) buscarTudo() }, [buscarTudo, usuario])

  function abrirModal(mov?: any) {
    if (mov) {
      setEditando(mov)
      setForm({ descricao: mov.descricao, valor: String(mov.valor), tipo: mov.tipo })
    } else {
      setEditando(null)
      setForm({ descricao: '', valor: '', tipo: 'aporte' })
    }
    setModalAberto(true)
  }

  async function salvarMov() {
    if (!form.descricao || !form.valor) return
    if (editando) {
      await apiCrud.requisitar(`/api/saldo-total/${editando.id}`, {
        method: 'PUT',
        body: form,
      })
    } else {
      await apiCrud.requisitar('/api/saldo-total', {
        method: 'POST',
        body: form,
      })
    }
    setModalAberto(false)
    buscarTudo()
  }

  async function deletarMov(id: string) {
    if (!confirm('Deseja excluir este registro?')) return
    await apiDelete.requisitar(`/api/saldo-total/${id}`, { method: 'DELETE' })
    buscarTudo()
  }

  if (carregandoAuth || carregando) return <Carregando texto="Carregando saldo total..." />
  if (erro) return <MensagemErro mensagem={erro} onTentar={buscarTudo} />
  if (!dados) return null

  return (
    <div className="flex flex-col gap-5 w-full max-w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-2xl" style={{ color: 'var(--cor-texto)' }}>Saldo Total</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--cor-texto-suave)' }}>
            Dinheiro disponivel do casal — acompanhe e registre movimentacoes
          </p>
        </div>
        <button onClick={() => abrirModal()} className="btn btn-primario text-sm flex items-center gap-2 whitespace-nowrap flex-shrink-0">
          <Plus size={16} />
          Nova
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex flex-col gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--cor-texto-suave)' }}>Saldo Atual</span>
          <span className="texto-card font-bold text-2xl" style={{ color: dados.saldo_atual >= 0 ? 'var(--cor-sucesso)' : 'var(--cor-perigo)' }}>
            {formatarMoeda(dados.saldo_atual)}
          </span>
        </div>
        <div className="card flex flex-col gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--cor-texto-suave)' }}>Total Aportes</span>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} style={{ color: 'var(--cor-sucesso)' }} />
            <span className="texto-card font-bold text-lg" style={{ color: 'var(--cor-sucesso)' }}>
              {formatarMoeda(dados.total_aportes)}
            </span>
          </div>
        </div>
        <div className="card flex flex-col gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--cor-texto-suave)' }}>Total Retiradas</span>
          <div className="flex items-center gap-2">
            <TrendingDown size={16} style={{ color: 'var(--cor-perigo)' }} />
            <span className="texto-card font-bold text-lg" style={{ color: 'var(--cor-perigo)' }}>
              {formatarMoeda(dados.total_retiradas)}
            </span>
          </div>
        </div>
      </div>

      {/* Historico */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <h3 className="font-display font-bold text-base px-5 pt-4 pb-3" style={{ color: 'var(--cor-texto)' }}>
          Historico de Movimentacoes
        </h3>
        {carregandoMovs ? (
          <Carregando texto="Carregando..." />
        ) : !movs?.dados || movs.dados.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--cor-texto-suave)', fontSize: '0.875rem' }}>
            Nenhuma movimentacao registrada
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              {movs.dados.map((item: any) => (
                <div key={item.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 110px 120px',
                  padding: '0.75rem 1.25rem',
                  borderBottom: '1px solid var(--cor-borda)',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <div className="flex items-center gap-2">
                    {item.tipo === 'aporte'
                      ? <TrendingUp size={16} style={{ color: 'var(--cor-sucesso)' }} />
                      : <TrendingDown size={16} style={{ color: 'var(--cor-perigo)' }} />
                    }
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto)' }}>{item.descricao}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--cor-texto-suave)' }}>{item.data}</div>
                    </div>
                  </div>
                  <span className="badge" style={{
                    background: item.tipo === 'aporte' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                    color: item.tipo === 'aporte' ? 'var(--cor-sucesso)' : 'var(--cor-perigo)',
                    fontSize: '0.7rem', fontWeight: 600, textAlign: 'center',
                  }}>
                    {item.tipo === 'aporte' ? 'Aporte' : 'Retirada'}
                  </span>
                  <span style={{
                    fontSize: '0.875rem', fontWeight: 700, textAlign: 'right',
                    color: item.tipo === 'aporte' ? 'var(--cor-sucesso)' : 'var(--cor-perigo)',
                  }}>
                    {item.tipo === 'aporte' ? '+' : '-'}{formatarMoeda(item.valor)}
                  </span>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => abrirModal(item)} className="p-1.5 rounded-lg transition-colors hover:bg-opacity-10 hover:bg-current" style={{ color: 'var(--cor-texto-suave)' }} title="Editar">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deletarMov(item.id)} className="p-1.5 rounded-lg transition-colors hover:bg-opacity-10 hover:bg-current" style={{ color: 'var(--cor-perigo)' }} title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col">
              {movs.dados.map((item: any) => (
                <div key={item.id} style={{
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid var(--cor-borda)',
                }}>
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {item.tipo === 'aporte'
                        ? <TrendingUp size={16} style={{ color: 'var(--cor-sucesso)', flexShrink: 0 }} />
                        : <TrendingDown size={16} style={{ color: 'var(--cor-perigo)', flexShrink: 0 }} />
                      }
                      <div className="min-w-0">
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{item.descricao}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--cor-texto-suave)' }}>{item.data}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.875rem', fontWeight: 700, flexShrink: 0,
                      color: item.tipo === 'aporte' ? 'var(--cor-sucesso)' : 'var(--cor-perigo)',
                    }}>
                      {item.tipo === 'aporte' ? '+' : '-'}{formatarMoeda(item.valor)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="badge" style={{
                      background: item.tipo === 'aporte' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                      color: item.tipo === 'aporte' ? 'var(--cor-sucesso)' : 'var(--cor-perigo)',
                      fontSize: '0.7rem', fontWeight: 600,
                    }}>
                      {item.tipo === 'aporte' ? 'Aporte' : 'Retirada'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => abrirModal(item)} className="p-1.5 rounded-lg transition-colors hover:bg-opacity-10 hover:bg-current" style={{ color: 'var(--cor-texto-suave)' }} title="Editar">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deletarMov(item.id)} className="p-1.5 rounded-lg transition-colors hover:bg-opacity-10 hover:bg-current" style={{ color: 'var(--cor-perigo)' }} title="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <Modal aberto={modalAberto} fechar={() => setModalAberto(false)} titulo={editando ? 'Editar Movimentacao' : 'Nova Movimentacao'}>
        <form onSubmit={(e) => { e.preventDefault(); salvarMov() }} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--cor-texto-suave)' }}>Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as 'aporte' | 'retirada' })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--cor-fundo-input)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
            >
              <option value="aporte">Aporte (adicionar dinheiro)</option>
              <option value="retirada">Retirada (retirar dinheiro)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--cor-texto-suave)' }}>Descricao</label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Ex: Saldo inicial, transferencia..."
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--cor-fundo-input)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--cor-texto-suave)' }}>Valor (R$)</label>
            <input
              type="number"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--cor-fundo-input)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setModalAberto(false)} className="btn btn-secundario flex-1 text-sm">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario flex-1 text-sm" disabled={apiCrud.carregando}>
              {apiCrud.carregando ? 'Salvando...' : editando ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
