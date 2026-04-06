import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Paginacao({ paginaAtual, total, limite, onMudar }: {
  paginaAtual: number, total: number, limite: number, onMudar: (p: number) => void
}) {
  const totalPaginas = Math.ceil(total / limite)
  if (totalPaginas <= 1) return null

  return (
    <div className="flex items-center justify-between py-3 mt-2" style={{ borderTop: '1px solid var(--cor-borda)' }}>
      <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
        {total} registros — página {paginaAtual} de {totalPaginas}
      </span>
      <div className="flex gap-1.5">
        <button className="btn btn-secundario p-1.5"
          onClick={() => onMudar(paginaAtual - 1)}
          disabled={paginaAtual === 1}>
          <ChevronLeft size={16} />
        </button>
        <button className="btn btn-secundario p-1.5"
          onClick={() => onMudar(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}