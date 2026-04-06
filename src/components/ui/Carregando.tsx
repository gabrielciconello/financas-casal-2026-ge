import React from 'react'

export default function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--cor-fundo-hover)', borderTopColor: 'var(--cor-primaria)' }}>
        <span className="sr-only">{texto}</span>
      </div>
      <span className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>{texto}</span>
    </div>
  )
}
