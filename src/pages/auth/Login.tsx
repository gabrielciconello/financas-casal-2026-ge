import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useContexto'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'

export default function Login() {
  const { entrar } = useAuth()
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    const erro = await entrar(email, senha)

    if (erro) {
      setErro('E-mail ou senha incorretos')
      setCarregando(false)
      return
    }

    navegar('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cor-fundo)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>

      {/* Card de login */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--cor-fundo-card)',
        border: '1px solid var(--cor-borda)',
        borderRadius: 'var(--raio-xl)',
        padding: '2.5rem',
        boxShadow: 'var(--sombra-lg)',
      }}>

        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            background: 'var(--cor-primaria)',
            borderRadius: 'var(--raio-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <TrendingUp size={22} color="#fff" />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--fonte-display)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--cor-texto)',
              lineHeight: 1,
            }}>
              Finanças Casal
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--cor-texto-suave)',
              marginTop: '2px',
            }}>
              Gestão financeira compartilhada
            </div>
          </div>
        </div>

        {/* Título */}
        <h1 style={{
          fontFamily: 'var(--fonte-display)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--cor-texto)',
          marginBottom: '0.5rem',
        }}>
          Bem-vindo de volta
        </h1>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--cor-texto-suave)',
          marginBottom: '1.75rem',
        }}>
          Entre com sua conta para continuar
        </p>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>

          {/* E-mail */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--cor-texto)',
              marginBottom: '0.375rem',
            }}>
              E-mail
            </label>
            <input
              className="input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Senha */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--cor-texto)',
              marginBottom: '0.375rem',
            }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--cor-texto-suave)',
                  display: 'flex',
                  padding: 0,
                }}
              >
                {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div style={{
              background: 'var(--cor-perigo-suave)',
              border: '1px solid var(--cor-perigo)',
              borderRadius: 'var(--raio-sm)',
              padding: '0.625rem 0.875rem',
              marginBottom: '1rem',
              fontSize: '0.8125rem',
              color: 'var(--cor-perigo)',
            }}>
              {erro}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            className="btn btn-primario"
            disabled={carregando}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.75rem',
              fontSize: '0.9375rem',
              opacity: carregando ? 0.7 : 1,
            }}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

        </form>
      </div>
    </div>
  )
}