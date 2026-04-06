import React from 'react'
import { AlertCircle } from 'lucide-react'

export default function MensagemErro({ mensagem, onTentar }: { mensagem: string, onTentar?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--cor-perigo-suave)' }}>
        <AlertCircle size={24} style={{ color: 'var(--cor-perigo)' }} />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--cor-texto-suave)' }}>{mensagem}</p>
      {onTentar && (
        <button className="btn btn-secundario" onClick={onTentar}>Tentar novamente</button>
      )}
    </div>
  )
}