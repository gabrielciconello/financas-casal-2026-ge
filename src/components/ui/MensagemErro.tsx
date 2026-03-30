import React from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  mensagem: string
  onTentar?: () => void
}

export default function MensagemErro({ mensagem, onTentar }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      gap: '1rem',
      textAlign: 'center',
    }}>
      <AlertCircle size={40} color="var(--cor-perigo)" />
      <p style={{ fontSize: '0.875rem', color: 'var(--cor-texto-suave)' }}>
        {mensagem}
      </p>
      {onTentar && (
        <button className="btn btn-secundario" onClick={onTentar}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}