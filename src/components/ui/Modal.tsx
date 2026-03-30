import React, { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  aberto: boolean
  titulo: string
  onFechar: () => void
  children: ReactNode
  largura?: string
}

export default function Modal({ aberto, titulo, onFechar, children, largura = '480px' }: Props) {
  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [aberto])

  if (!aberto) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      {/* Overlay */}
      <div
        onClick={onFechar}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Conteúdo */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: largura,
        background: 'var(--cor-fundo-card)',
        borderRadius: 'var(--raio-xl)',
        border: '1px solid var(--cor-borda)',
        boxShadow: 'var(--sombra-lg)',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--cor-borda)',
        }}>
          <h2 style={{
            fontFamily: 'var(--fonte-display)',
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--cor-texto)',
          }}>
            {titulo}
          </h2>
          <button
            onClick={onFechar}
            className="btn btn-secundario"
            style={{ padding: '0.375rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo */}
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}