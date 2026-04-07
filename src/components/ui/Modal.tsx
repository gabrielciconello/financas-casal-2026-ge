import React, { ReactNode, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

export default function Modal({ aberto, titulo, onFechar, children }: {
  aberto: boolean, titulo: string, onFechar: () => void, children: ReactNode
}) {
  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aberto])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onFechar()
  }, [onFechar])

  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={handleBackdropClick}
      style={{ touchAction: 'none' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Modal content */}
      <div
        className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border max-h-[95vh] overflow-auto"
        style={{
          background: 'var(--cor-fundo-card)',
          borderColor: 'var(--cor-borda)',
          boxShadow: 'var(--sombra-modal)',
          touchAction: 'auto',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style={{ borderBottom: '1px solid var(--cor-borda)', background: 'var(--cor-fundo-card)' }}>
          <h2 className="font-display font-bold text-base sm:text-lg max-w-[calc(100%-48px)] truncate" style={{ color: 'var(--cor-texto)' }}>{titulo}</h2>
          <button
            onClick={onFechar}
            className="btn btn-secundary p-2 flex-shrink-0"
            style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}
