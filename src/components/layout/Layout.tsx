import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth, useTema } from '../../hooks/useContexto'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  Receipt,
  Target,
  Bot,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react'

const itensMenu = [
  { caminho: '/dashboard', icone: LayoutDashboard, rotulo: 'Dashboard' },
  { caminho: '/transacoes', icone: ArrowLeftRight, rotulo: 'Transações' },
  { caminho: '/salarios', icone: Wallet, rotulo: 'Salários' },
  { caminho: '/cartoes', icone: CreditCard, rotulo: 'Cartões' },
  { caminho: '/gastos/fixos', icone: Receipt, rotulo: 'Gastos Fixos' },
  { caminho: '/gastos/variaveis', icone: ShoppingBag, rotulo: 'Gastos Variáveis' },
  { caminho: '/metas', icone: Target, rotulo: 'Metas' },
  { caminho: '/ia', icone: Bot, rotulo: 'Assistente IA' },
]

export default function Layout() {
  const { usuario, sair } = useAuth()
  const { tema, alternarTema } = useTema()
  const navegar = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  async function handleSair() {
    await sair()
    navegar('/login')
  }

  const estiloNavLink = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.625rem 0.875rem',
    borderRadius: 'var(--raio-sm)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? 'var(--cor-primaria)' : 'var(--cor-texto-suave)',
    background: isActive ? 'var(--cor-primaria-suave)' : 'transparent',
    transition: 'var(--transicao)',
  })

  const sidebar = (
    <aside style={{
      width: '240px',
      height: '100vh',
      background: 'var(--cor-fundo-card)',
      borderRight: '1px solid var(--cor-borda)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0.875rem',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
      transition: 'transform 0.3s ease',
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0 0.5rem',
        marginBottom: '1.75rem',
      }}>
        <div style={{
          width: '34px',
          height: '34px',
          background: 'var(--cor-primaria)',
          borderRadius: 'var(--raio-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <TrendingUp size={18} color="#fff" />
        </div>
        <span style={{
          fontFamily: 'var(--fonte-display)',
          fontWeight: 700,
          fontSize: '1rem',
          color: 'var(--cor-texto)',
        }}>
          Finanças Casal
        </span>
      </div>

      {/* Navegação */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {itensMenu.map(({ caminho, icone: Icone, rotulo }) => (
          <NavLink
            key={caminho}
            to={caminho}
            style={estiloNavLink}
            onClick={() => setMenuAberto(false)}
          >
            <Icone size={17} />
            {rotulo}
          </NavLink>
        ))}
      </nav>

      {/* Rodapé da sidebar */}
      <div style={{
        borderTop: '1px solid var(--cor-borda)',
        paddingTop: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>

        {/* Usuário */}
        <div style={{
          padding: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--cor-texto-suave)',
        }}>
          {usuario?.email}
        </div>

        {/* Alternar tema */}
        <button
          onClick={alternarTema}
          className="btn btn-secundario"
          style={{ width: '100%', justifyContent: 'flex-start' }}
        >
          {tema === 'claro' ? <Moon size={16} /> : <Sun size={16} />}
          {tema === 'claro' ? 'Tema Escuro' : 'Tema Claro'}
        </button>

        {/* Sair */}
        <button
          onClick={handleSair}
          className="btn"
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            color: 'var(--cor-perigo)',
            background: 'transparent',
          }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar desktop */}
      <div className="sidebar-desktop" style={{ display: 'none' }}>
        {sidebar}
      </div>

      {/* Sidebar mobile — overlay */}
      {menuAberto && (
        <>
          <div
            onClick={() => setMenuAberto(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 99,
            }}
          />
          {sidebar}
        </>
      )}

      {/* Conteúdo principal */}
      <main style={{
        flex: 1,
        marginLeft: '240px',
        minHeight: '100vh',
        background: 'var(--cor-fundo)',
      }}>

        {/* Header mobile */}
        <header style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          background: 'var(--cor-fundo-card)',
          borderBottom: '1px solid var(--cor-borda)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }} className="header-mobile">
          <button
            onClick={() => setMenuAberto(true)}
            className="btn btn-secundario"
            style={{ padding: '0.5rem' }}
          >
            <Menu size={20} />
          </button>
          <span style={{
            fontFamily: 'var(--fonte-display)',
            fontWeight: 700,
            fontSize: '1rem',
          }}>
            Finanças Casal
          </span>
          <button
            onClick={alternarTema}
            className="btn btn-secundario"
            style={{ padding: '0.5rem' }}
          >
            {tema === 'claro' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        {/* Página atual */}
        <div style={{ padding: '1.5rem' }}>
          <Outlet />
        </div>

      </main>

      {/* CSS responsivo */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .header-mobile { display: flex !important; }
          main { margin-left: 0 !important; }
        }
        @media (min-width: 769px) {
          .sidebar-desktop { display: block !important; }
          .header-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}