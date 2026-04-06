import React, { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ aberto, titulo, onFechar, children }: {
  aberto: boolean, titulo: string, onFechar: () => void, children: ReactNode
}) {
  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aberto])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border max-h-[95vh] overflow-auto" style={{ background: 'var(--cor-fundo-card)', borderColor: 'var(--cor-borda)', boxShadow: 'var(--sombra-modal)' }}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style={{ borderBottom: '1px solid var(--cor-borda)', background: 'var(--cor-fundo-card)' }}>
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--cor-texto)' }}>{titulo}</h2>
          <button onClick={onFechar} className="btn btn-secundario p-1.5">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}