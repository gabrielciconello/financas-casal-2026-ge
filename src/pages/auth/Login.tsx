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
    if (erro) { setErro('E-mail ou senha incorretos'); setCarregando(false); return }
    navegar('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #faf5ff 100%)' }}>
      <div className="w-full max-w-sm rounded-2xl border p-8" style={{ background: 'var(--cor-fundo-card)', borderColor: 'var(--cor-borda)', boxShadow: 'var(--sombra-card-hover)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none" style={{ color: 'var(--cor-texto)' }}>
              Finanças Casal
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--cor-texto-suave)' }}>Gestão financeira compartilhada</div>
          </div>
        </div>

        <h1 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--cor-texto)' }}>
          Bem-vindo de volta
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--cor-texto-suave)' }}>Entre com sua conta para continuar</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--cor-texto-secundario)' }}>E-mail</label>
            <input
              className="input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--cor-texto-secundario)' }}>Senha</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {mostrarSenha ? <EyeOff size={16} style={{ color: 'var(--cor-texto-suave)' }} /> : <Eye size={16} style={{ color: 'var(--cor-texto-suave)' }} />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'var(--cor-perigo-suave)', borderColor: 'var(--cor-perigo-borda)', border: '1px solid', color: 'var(--cor-perigo)' }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primario w-full py-2.5 text-base mt-2"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}