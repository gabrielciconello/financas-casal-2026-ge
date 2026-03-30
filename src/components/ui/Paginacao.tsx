import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  paginaAtual: number
  total: number
  limite: number
  onMudar: (pagina: number) => void
}

export default function Paginacao({ paginaAtual, total, limite, onMudar }: Props) {
  const totalPaginas = Math.ceil(total / limite)
  if (totalPaginas <= 1) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 0',
      borderTop: '1px solid var(--cor-borda)',
      marginTop: '1rem',
    }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--cor-texto-suave)' }}>
        {total} registros — página {paginaAtual} de {totalPaginas}
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn btn-secundario"
          onClick={() => onMudar(paginaAtual - 1)}
          disabled={paginaAtual === 1}
          style={{ padding: '0.375rem 0.625rem', opacity: paginaAtual === 1 ? 0.4 : 1 }}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="btn btn-secundario"
          onClick={() => onMudar(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}
          style={{ padding: '0.375rem 0.625rem', opacity: paginaAtual === totalPaginas ? 0.4 : 1 }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}