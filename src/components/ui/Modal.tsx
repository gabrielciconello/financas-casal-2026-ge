import React, { ReactNode, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({ aberto, titulo, onFechar, children }: {
  aberto: boolean, titulo: string, onFechar: () => void, children: ReactNode
}) {
  const tituloId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onFecharRef = useRef(onFechar)

  useEffect(() => {
    onFecharRef.current = onFechar
  }, [onFechar])

  useEffect(() => {
    if (!aberto) return

    const overflowAnterior = document.body.style.overflow
    const focoAnterior = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    document.body.style.overflow = 'hidden'

    const dialog = dialogRef.current
    const elementosFocaveis = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    ) ?? [])

    elementosFocaveis()[0]?.focus()

    function handleKeyDown(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        onFecharRef.current()
        return
      }

      if (evento.key !== 'Tab') return
      const focaveis = elementosFocaveis()
      if (focaveis.length === 0) {
        evento.preventDefault()
        dialog?.focus()
        return
      }

      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = overflowAnterior
      focoAnterior?.focus()
    }
  }, [aberto])

  if (!aberto) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 cursor-pointer"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onFechar}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className="relative flex w-full max-w-lg flex-col rounded-t-2xl border sm:rounded-2xl"
        style={{
          background: 'var(--cor-fundo-card)',
          borderColor: 'var(--cor-borda)',
          boxShadow: 'var(--sombra-modal)',
          maxHeight: 'min(95dvh, 760px)',
        }}
      >
        <div className="flex flex-shrink-0 items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--cor-borda)' }}>
          <h2 id={tituloId} className="font-display font-bold text-base sm:text-lg max-w-[calc(100%-48px)] truncate" style={{ color: 'var(--cor-texto)' }}>{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            className="btn btn-secundario p-2 flex-shrink-0"
            style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label={`Fechar ${titulo}`}
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
