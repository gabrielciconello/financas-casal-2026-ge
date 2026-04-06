import React, { useState } from 'react'
import { Send, Sparkles, Loader2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { mesAnoAtual } from '../../utils'

interface Mensagem {
  id: string
  remetente: 'usuario' | 'ia'
  texto: string
  timestamp: Date
}

export default function AssistenteIA() {
  const { mes, ano } = mesAnoAtual()
  const [input, setInput] = useState('')
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [resumo, setResumo] = useState<string | null>(null)

  const { carregando, requisitar } = useApi()
  const apiResumo = useApi()

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || carregando) return

    const pergunta = input.trim()
    setInput('')

    setMensagens((prev) => [
      ...prev,
      { id: crypto.randomUUID(), remetente: 'usuario', texto: pergunta, timestamp: new Date() },
    ])

    const resultado = await requisitar('/api/ia/chat', {
      method: 'POST',
      body: { pergunta, mes, ano },
    })

    if (resultado?.resposta) {
      setMensagens((prev) => [
        ...prev,
        { id: crypto.randomUUID(), remetente: 'ia', texto: resultado.resposta, timestamp: new Date() },
      ])
    }
  }

  async function handleBuscarResumo() {
    const resultado = await apiResumo.requisitar(`/api/ia/resumo?mes=${mes}&ano=${ano}`)
    if (resultado?.resposta) {
      setResumo(resultado.resposta)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontFamily: 'var(--fonte-display)', fontSize: '1.625rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
          Assistente IA
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--cor-texto-suave)', marginTop: '0.25rem' }}>
          Tire dúvidas sobre suas finanças com inteligência artificial
        </p>
      </div>

      {/* Resumo mensal */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--cor-primaria)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cor-texto)' }}>
              Resumo Mensal
            </span>
          </div>
          <button className="btn btn-secundario" onClick={handleBuscarResumo} disabled={apiResumo.carregando}>
            {apiResumo.carregando ? 'Gerando...' : 'Gerar Resumo'}
          </button>
        </div>
        {resumo && (
          <div style={{
            padding: '1rem',
            background: 'var(--cor-fundo)',
            borderRadius: 'var(--raio-sm)',
            fontSize: '0.875rem',
            color: 'var(--cor-texto)',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {resumo}
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
        {/* Mensagens */}
        <div style={{
          flex: 1,
          maxHeight: '500px',
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {mensagens.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              textAlign: 'center',
              color: 'var(--cor-texto-suave)',
              fontSize: '0.875rem',
            }}>
              <div>
                <Sparkles size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                <p>Faça perguntas sobre suas finanças</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Ex: "Quanto gastamos com alimentação este mês?"
                </p>
              </div>
            </div>
          ) : (
            mensagens.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.remetente === 'usuario' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '0.75rem 1rem',
                  borderRadius: msg.remetente === 'usuario'
                    ? 'var(--raio-md) var(--raio-md) var(--raio-sm) var(--raio-md)'
                    : 'var(--raio-md) var(--raio-md) var(--raio-md) var(--raio-sm)',
                  background: msg.remetente === 'usuario'
                    ? 'var(--cor-primaria)'
                    : 'var(--cor-fundo)',
                  color: msg.remetente === 'usuario'
                    ? '#fff'
                    : 'var(--cor-texto)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.texto}
                <div style={{
                  fontSize: '0.625rem',
                  marginTop: '0.375rem',
                  opacity: 0.6,
                  textAlign: 'right',
                }}>
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}

          {carregando && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              color: 'var(--cor-texto-suave)',
            }}>
              <Loader2 size={16} className="spin" />
              Pensando...
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleEnviar}
          style={{
            display: 'flex',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--cor-borda)',
          }}
        >
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte algo sobre suas finanças..."
            style={{ flex: 1 }}
            disabled={carregando}
          />
          <button
            type="submit"
            className="btn btn-primario"
            disabled={carregando || !input.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>

    </div>
  )
}
