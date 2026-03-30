import React from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  titulo: string
  valor: string
  icone: LucideIcon
  corIcone?: string
  variacao?: number
  descricaoVariacao?: string
}

export default function CardResumo({
  titulo,
  valor,
  icone: Icone,
  corIcone = 'var(--cor-primaria)',
  variacao,
  descricaoVariacao,
}: Props) {
  const positivo = variacao !== undefined && variacao >= 0

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cor-texto-suave)' }}>
          {titulo}
        </span>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--raio-sm)',
          background: `${corIcone}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icone size={18} color={corIcone} />
        </div>
      </div>

      <div>
        <div style={{
          fontFamily: 'var(--fonte-display)',
          fontSize: '1.625rem',
          fontWeight: 700,
          color: 'var(--cor-texto)',
          lineHeight: 1,
        }}>
          {valor}
        </div>

        {variacao !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: positivo ? 'var(--cor-sucesso)' : 'var(--cor-perigo)',
          }}>
            {positivo
              ? <TrendingUp size={13} />
              : <TrendingDown size={13} />
            }
            <span>{Math.abs(variacao).toFixed(1)}% {descricaoVariacao}</span>
          </div>
        )}
      </div>
    </div>
  )
}