import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Paginacao({ paginaAtual, total, limite, onMudar }: {
  paginaAtual: number, total: number, limite: number, onMudar: (p: number) => void
}) {
  const totalPaginas = limite > 0 ? Math.ceil(total / limite) : 0
  if (totalPaginas <= 1) return null

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3 py-3 mt-2" style={{ borderTop: '1px solid var(--cor-borda)' }}>
      <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
        {total} registros — página {paginaAtual} de {totalPaginas}
      </span>
      <div className="flex gap-1.5">
        <button className="btn btn-secundario p-1.5"
          onClick={() => onMudar(Math.max(1, paginaAtual - 1))}
          disabled={paginaAtual <= 1}
          aria-label="Página anterior">
          <ChevronLeft size={16} />
        </button>
        <button className="btn btn-secundario p-1.5"
          onClick={() => onMudar(Math.min(totalPaginas, paginaAtual + 1))}
          disabled={paginaAtual >= totalPaginas}
          aria-label="Próxima página">
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  )
}
