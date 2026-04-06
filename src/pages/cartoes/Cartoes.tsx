import React, { useState, useEffect, useCallback } from 'react'
import { Plus, CreditCard } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { Cartao, CompraCartao, CriarCartaoDTO, CriarCompraCartaoDTO, AtualizarCompraCartaoDTO } from '../../types'
import { formatarMoeda } from '../../utils'
import Carregando from '../../components/ui/Carregando'
import MensagemErro from '../../components/ui/MensagemErro'
import Paginacao from '../../components/ui/Paginacao'
import Modal from '../../components/ui/Modal'

const CATEGORIAS = [
  'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Moradia',
  'Educação', 'Vestuário', 'Serviços', 'Outros',
]

const BANDEIRAS = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard', 'Outro']

export default function Cartoes() {
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [compras, setCompras] = useState<CompraCartao[]>([])
  const [cartaoSelecionado, setCartaoSelecionado] = useState<Cartao | null>(null)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalCartao, setModalCartao] = useState(false)
  const [modalCompra, setModalCompra] = useState(false)
  const [cartaoEditando, setCartaoEditando] = useState<Cartao | null>(null)
  const [compraEditando, setCompraEditando] = useState<CompraCartao | null>(null)

  const { carregando, erro, requisitar } = useApi()
  const apiForm = useApi()
  const { carregando: carregandoCompras, requisitar: buscarComprasReq } = useApi()

  const [todasCompras, setTodasCompras] = useState<CompraCartao[]>([])

  const buscarCartoes = useCallback(async () => {
    const resultado = await requisitar('/api/cartoes?pagina=1&limite=50')
    if (resultado) setCartoes(resultado.dados ?? [])
  }, [requisitar])

  const buscarTodasCompras = useCallback(async () => {
    const resultadoCompras = await buscarComprasReq('/api/cartoes/compras-cartao?pagina=1&limite=1000')
    if (resultadoCompras) {
      setTodasCompras(resultadoCompras.dados ?? [])
    }
  }, [buscarComprasReq])

  useEffect(() => { buscarCartoes() }, [buscarCartoes])

  useEffect(() => {
    async function fetch() {
      if (!cartaoSelecionado) return
      const params = new URLSearchParams({
        pagina: String(pagina),
        limite: '10',
        cartaoId: cartaoSelecionado.id,
      })
      const resultado = await buscarComprasReq(`/api/cartoes/compras-cartao?${params}`)
      if (resultado) {
        setCompras(resultado.dados ?? [])
        setTotal(resultado.total ?? 0)
      }
    }
    fetch()
  }, [cartaoSelecionado, pagina, buscarComprasReq])

  async function handleSalvarCartao(dados: CriarCartaoDTO) {
    if (cartaoEditando) {
      await apiForm.requisitar(`/api/cartoes/${cartaoEditando.id}`, {
        method: 'PUT', body: dados,
      })
    } else {
      await apiForm.requisitar('/api/cartoes', { method: 'POST', body: dados })
    }
    setModalCartao(false)
    setCartaoEditando(null)
    buscarCartoes()
  }

  async function handleSalvarCompra(dados: CriarCompraCartaoDTO) {
    await apiForm.requisitar('/api/cartoes/compras-cartao', { method: 'POST', body: dados })
    setModalCompra(false)
    setCompraEditando(null)
    setPagina(1)
    buscarCartoes()
  }

  async function handleDeletarCartao(id: string) {
    if (!confirm('Deseja desativar este cartão?')) return
    await requisitar(`/api/cartoes/${id}`, { method: 'DELETE' })
    buscarCartoes()
    if (cartaoSelecionado?.id === id) setCartaoSelecionado(null)
  }

  async function handleDeletarCompra(id: string) {
    if (!confirm('Deseja deletar esta compra?')) return
    await requisitar(`/api/cartoes/compras-cartao/${id}`, { method: 'DELETE' })
    setPagina(1)
    buscarCartoes()
  }

  async function handleAtualizarCompra(id: string, dados: CriarCompraCartaoDTO) {
    await apiForm.requisitar(`/api/cartoes/compras-cartao/${id}`, { method: 'PUT', body: dados })
    setModalCompra(false)
    setCompraEditando(null)
    setPagina(1)
    buscarCartoes()
  }

  const calcularUso = (cartao: Cartao) => {
    const comprasCartao = todasCompras.filter((c) => c.cartao_id === cartao.id)
    let usado = 0
    for (const c of comprasCartao) {
      const parcelasRestantes = c.parcelas - c.parcela_atual + 1
      usado += parcelasRestantes * Number(c.valor_parcela)
    }
    const percentual = (usado / cartao.limite) * 100
    return { usado, percentual: Math.min(percentual, 100) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.625rem', fontWeight: 700, color: 'var(--cor-texto)' }}>Cartões de Crédito</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--cor-texto-suave)', marginTop: '0.25rem' }}>Gerencie seus cartões e compras parceladas</p>
        </div>
        <button className="btn btn-primario" onClick={() => { setCartaoEditando(null); setModalCartao(true) }}>
          <Plus size={16} /> Novo Cartão
        </button>
      </div>

      {carregando && cartoes.length === 0 ? (
        <Carregando texto="Buscando cartões..." />
      ) : erro ? (
        <MensagemErro mensagem={erro} onTentar={buscarCartoes} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '1rem' }}>
          {cartoes.map((cartao) => {
            const { usado, percentual } = calcularUso(cartao)
            const corBarra = percentual >= 90 ? 'var(--cor-perigo)' : percentual >= 70 ? 'var(--cor-aviso)' : 'var(--cor-primaria)'
            const selecionado = cartaoSelecionado?.id === cartao.id

            return (
              <div key={cartao.id} className="card" onClick={() => setCartaoSelecionado(selecionado ? null : cartao)} style={{ cursor: 'pointer', border: selecionado ? '2px solid var(--cor-primaria)' : '1px solid var(--cor-borda)', transition: 'var(--transicao)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: '38px', height: '38px', background: 'var(--cor-primaria-suave)', borderRadius: 'var(--raio-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCard size={20} color="var(--cor-primaria)" />
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--cor-texto)' }}>{cartao.nome}</span>
                      {cartao.bandeira && <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>{cartao.bandeira}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secundario" onClick={(e) => { e.stopPropagation(); setCartaoEditando(cartao); setModalCartao(true) }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Editar</button>
                    <button className="btn" onClick={(e) => { e.stopPropagation(); handleDeletarCartao(cartao.id) }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--cor-perigo)', background: 'transparent' }}>Excluir</button>
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>Limite usado</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: corBarra }}>{percentual.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--cor-fundo)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percentual}%`, background: corBarra, borderRadius: '999px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>Limite Total</div>
                    <div style={{ fontWeight: 600, color: 'var(--cor-texto)' }}>{formatarMoeda(cartao.limite)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>Disponível</div>
                    <div style={{ fontWeight: 600, color: 'var(--cor-sucesso)' }}>{formatarMoeda(cartao.limite - usado)}</div>
                  </div>
                </div>

                <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--cor-borda)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>
                  <span>Fecha dia {cartao.dia_fechamento}</span>
                  <span>Vence dia {cartao.dia_vencimento}</span>
                </div>
              </div>
            )
          })}
          {cartoes.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--cor-texto-suave)', fontSize: '0.875rem' }}>Nenhum cartão cadastrado</div>
          )}
        </div>
      )}

      {cartaoSelecionado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
              Compras - {cartaoSelecionado.nome}
            </h2>
            <button className="btn btn-primario" onClick={() => setModalCompra(true)}>
              <Plus size={16} /> Nova Compra
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {carregandoCompras ? (
              <Carregando texto="Buscando compras..." />
            ) : compras.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--cor-texto-suave)', fontSize: '0.875rem' }}>Nenhuma compra registrada neste cartão</div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 120px 120px 80px', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--cor-borda)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--cor-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Descrição</span><span>Categoria</span><span>Data</span>
                    <span style={{ textAlign: 'right' }}>Total</span>
                    <span style={{ textAlign: 'center' }}>Parcelas</span>
                    <span style={{ textAlign: 'center' }}>Ações</span>
                  </div>

                  {compras.map((c) => {
                    const parcelasValidas = Math.max(1, Number(c.parcelas) || 1)
                    const parcelaAtualValida = Math.max(1, Math.min(Number(c.parcela_atual) || 1, Math.max(1, Number(c.parcelas) || 1)))
                    return (
                    <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 120px 120px 80px', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--cor-borda)', alignItems: 'center' }} className="transition-colors hover:bg-opacity-50">
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto)' }}>{c.descricao}</div>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{c.categoria}</span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)' }}>{new Date(c.data_compra + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 600, textAlign: 'right', color: 'var(--cor-texto)' }}>{formatarMoeda(c.valor_total)}</span>
                      <div style={{ textAlign: 'center' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{parcelaAtualValida}x de {parcelasValidas} - {formatarMoeda(c.valor_parcela)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button className="btn btn-secundario" onClick={() => { setCompraEditando(c); setModalCompra(true) }} style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>Editar</button>
                        <button className="btn" onClick={() => handleDeletarCompra(c.id)} style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', color: 'var(--cor-perigo)', background: 'transparent' }}>Excluir</button>
                      </div>
                    </div>
                    )})}
                </div>

                {/* Mobile */}
                <div className="md:hidden flex flex-col">
                  {compras.map((c) => {
                    const parcelasValidas = Math.max(1, Number(c.parcelas) || 1)
                    const parcelaAtualValida = Math.max(1, Math.min(Number(c.parcela_atual) || 1, parcelasValidas))
                    return (
                    <div key={c.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--cor-borda)' }}>
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cor-texto)' }}>{c.descricao}</div>
                          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{c.categoria}</span>
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cor-texto)' }}>{formatarMoeda(c.valor_total)}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs mb-1.5" style={{ color: 'var(--cor-texto-suave)' }}>
                        <span>{parcelaAtualValida}/{parcelasValidas} x {formatarMoeda(c.valor_parcela)}</span>
                        <span>{new Date(c.data_compra + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex gap-1.5 justify-end">
                        <button className="btn btn-secundario px-2 py-1 text-xs" onClick={() => { setCompraEditando(c); setModalCompra(true) }}>Editar</button>
                        <button className="btn px-2 py-1 text-xs" style={{ color: 'var(--cor-perigo)', background: 'transparent' }} onClick={() => handleDeletarCompra(c.id)}>Excluir</button>
                      </div>
                    </div>
                    )})}
                </div>

                <div style={{ padding: '0 1.25rem' }}>
                  <Paginacao paginaAtual={pagina} total={total} limite={10} onMudar={setPagina} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Modal aberto={modalCartao} titulo={cartaoEditando ? 'Editar Cartão' : 'Novo Cartão'} onFechar={() => { setModalCartao(false); setCartaoEditando(null) }}>
        <FormularioCartao cartao={cartaoEditando} onSalvar={handleSalvarCartao} onCancelar={() => { setModalCartao(false); setCartaoEditando(null) }} carregando={apiForm.carregando} />
      </Modal>

      <Modal aberto={modalCompra} titulo={compraEditando ? 'Editar Compra' : 'Nova Compra'} onFechar={() => { setModalCompra(false); setCompraEditando(null) }}>
        <FormularioCompra cartaoId={cartaoSelecionado?.id ?? ''} compraEditando={compraEditando} onNovo={handleSalvarCompra} onAtualizar={handleAtualizarCompra} onCancelar={() => { setModalCompra(false); setCompraEditando(null) }} carregando={apiForm.carregando} />
      </Modal>
    </div>
  )
}

// FORMULÁRIO CARTÃO
interface FormCartaoProps {
  cartao: Cartao | null
  onSalvar: (dados: CriarCartaoDTO) => void
  onCancelar: () => void
  carregando: boolean
}

function FormularioCartao({ cartao, onSalvar, onCancelar, carregando }: FormCartaoProps) {
  const [form, setForm] = useState<CriarCartaoDTO>({
    nome: cartao?.nome ?? '',
    bandeira: cartao?.bandeira ?? 'Visa',
    limite: cartao?.limite ?? 0,
    dia_fechamento: cartao?.dia_fechamento ?? 1,
    dia_vencimento: cartao?.dia_vencimento ?? 10,
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSalvar(form) }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} autoComplete="off">
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>Nome do Cartão</label>
        <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Nubank, Inter..." required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>Bandeira</label>
          <select className="input" value={form.bandeira} onChange={(e) => setForm({ ...form, bandeira: e.target.value })}>
            {BANDEIRAS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>Limite (R$)</label>
          <input className="input" type="text" inputMode="decimal" value={form.limite} onChange={(e) => { const v = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'); const num = v === '' ? 0 : Number(v) || 0; if (!isNaN(num)) setForm({ ...form, limite: Math.max(0, num) }) }} placeholder="0,00" required />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>Dia de Fechamento</label>
          <input className="input" type="text" inputMode="numeric" value={form.dia_fechamento} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); const val = v === '' ? 1 : Math.max(1, Math.min(31, Number(v))); setForm({ ...form, dia_fechamento: val }) }} placeholder="1" required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>Dia de Vencimento</label>
          <input className="input" type="text" inputMode="numeric" value={form.dia_vencimento} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); const val = v === '' ? 10 : Math.max(1, Math.min(31, Number(v))); setForm({ ...form, dia_vencimento: val }) }} placeholder="10" required />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primario" disabled={carregando}>{carregando ? 'Salvando...' : cartao ? 'Salvar Alterações' : 'Criar Cartão'}</button>
      </div>
    </form>
  )
}

// FORMULÁRIO COMPRA
interface FormCompraProps {
  cartaoId: string
  compraEditando?: CompraCartao | null
  onNovo: (dados: CriarCompraCartaoDTO) => void
  onAtualizar?: (id: string, dados: CriarCompraCartaoDTO) => void
  onCancelar: () => void
  carregando: boolean
}

function FormularioCompra({ cartaoId, compraEditando, onNovo, onAtualizar, onCancelar, carregando }: FormCompraProps) {
  const [form, setForm] = useState<CriarCompraCartaoDTO>(() => {
    if (compraEditando) {
      return {
        cartao_id: compraEditando.cartao_id,
        descricao: compraEditando.descricao,
        categoria: compraEditando.categoria,
        valor_total: compraEditando.valor_total,
        parcelas: compraEditando.parcelas,
        parcela_inicial: compraEditando.parcela_atual,
        data_compra: compraEditando.data_compra,
      }
    }
    return { cartao_id: cartaoId, descricao: '', categoria: 'Alimentação', valor_total: 0, parcelas: 1, parcela_inicial: 1, data_compra: new Date().toISOString().split('T')[0] }
  })

  const handleParcelas = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9]/g, '')
    const parcelas = v === '' ? 1 : Math.max(1, Math.min(48, Number(v)))
    setForm((prev: CriarCompraCartaoDTO) => ({
      ...prev,
      parcelas,
      parcela_inicial: Math.min(prev.parcela_inicial ?? 1, parcelas),
    }))
  }

  const handleParcelaInicial = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9]/g, '')
    const val = v === '' ? 1 : Math.max(1, Math.min(form.parcelas ?? 1, Number(v)))
    setForm((prev: CriarCompraCartaoDTO) => ({ ...prev, parcela_inicial: val }))
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (compraEditando && onAtualizar) { onAtualizar(compraEditando.id, form) } else { onNovo(form) } }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} autoComplete="off">
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>Descrição</label>
        <input className="input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Notebook, Supermercado..." required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>Categoria</label>
          <select className="input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>{CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>Valor Total (R$)</label>
          <input className="input" type="text" inputMode="decimal" value={form.valor_total} onChange={(e) => { const v = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'); const num = v === '' ? 0 : Number(v) || 0; if (!isNaN(num)) setForm({ ...form, valor_total: Math.max(0, num) }) }} placeholder="0,00" required />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>Parcelas</label>
          <input className="input" type="text" inputMode="numeric" autoComplete="off" value={form.parcelas || 1} onChange={handleParcelas} placeholder="1" required />
          {form.valor_total > 0 && form.parcelas && form.parcelas > 1 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginTop: '0.25rem' }}>{form.parcelas}x de {formatarMoeda(form.valor_total / form.parcelas)}</div>
          )}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>Parcela Inicial</label>
          <input className="input" type="text" inputMode="numeric" autoComplete="off" value={form.parcela_inicial || 1} onChange={handleParcelaInicial} placeholder="1" />
          <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginTop: '0.25rem' }}>{form.parcela_inicial && form.parcela_inicial > 1 ? `Já na parcela ${form.parcela_inicial} de ${form.parcelas}` : 'Compra nova (parcela 1)'}</div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto)', marginBottom: '0.375rem' }}>Data da Compra</label>
          <input className="input" type="date" value={form.data_compra} onChange={(e) => setForm({ ...form, data_compra: e.target.value })} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primario" disabled={carregando}>{carregando ? 'Salvando...' : compraEditando ? 'Salvar Alterações' : 'Registrar Compra'}</button>
      </div>
    </form>
  )
}
