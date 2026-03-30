import React from 'react'

interface Props {
  texto?: string
}

export default function Carregando({ texto = 'Carregando...' }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      gap: '1rem',
      color: 'var(--cor-texto-suave)',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid var(--cor-borda)',
        borderTopColor: 'var(--cor-primaria)',
        borderRadius: '50%',
        animation: 'girar 0.8s linear infinite',
      }} />
      <span style={{ fontSize: '0.875rem' }}>{texto}</span>
      <style>{`
        @keyframes girar {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}