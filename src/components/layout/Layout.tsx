import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth, useTema } from '../../hooks/useContexto'
import {
  LayoutDashboard, ArrowLeftRight, Wallet, CreditCard,
  Receipt, Target, Bot, LogOut, Sun, Moon, Menu, X,
  TrendingUp, ShoppingBag,
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
    fontSize: '0.9rem',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? 'var(--cor-primaria)' : 'var(--cor-texto-suave)',
    background: isActive ? 'var(--cor-primaria-suave)' : 'transparent',
    transition: 'var(--transicao)',
  })

  const conteudoSidebar = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '1rem 0.75rem',
    }}>
      {/* Logo + fechar no mobile */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        padding: '0 0.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'var(--cor-primaria)',
            borderRadius: 'var(--raio-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <TrendingUp size={16} color="#fff" />
          </div>
          <span style={{
            fontFamily: 'var(--fonte-display)',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: 'var(--cor-texto)',
          }}>
            Finanças Casal
          </span>
        </div>
        <button
          onClick={() => setMenuAberto(false)}
          className="btn btn-secundario"
          style={{ padding: '0.375rem', display: menuAberto ? 'flex' : 'none' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Navegação */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
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

      {/* Rodapé */}
      <div style={{
        borderTop: '1px solid var(--cor-borda)',
        paddingTop: '0.875rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
      }}>
        <div style={{
          padding: '0.25rem 0.5rem',
          fontSize: '0.75rem',
          color: 'var(--cor-texto-fraco)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {usuario?.email}
        </div>
        <button onClick={alternarTema} className="btn btn-secundario"
          style={{ width: '100%', justifyContent: 'flex-start', gap: '0.5rem' }}>
          {tema === 'claro' ? <Moon size={15} /> : <Sun size={15} />}
          {tema === 'claro' ? 'Tema Escuro' : 'Tema Claro'}
        </button>
        <button onClick={handleSair} className="btn"
          style={{ width: '100%', justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--cor-perigo)', background: 'transparent' }}>
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>

      {/* SIDEBAR DESKTOP */}
      <aside style={{
        width: '220px',
        height: '100vh',
        background: 'var(--cor-fundo-card)',
        borderRight: '1px solid var(--cor-borda)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }} className="sidebar-desktop">
        {conteudoSidebar}
      </aside>

      {/* SIDEBAR MOBILE — Drawer */}
      {menuAberto && (
        <>
          <div
            onClick={() => setMenuAberto(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 199,
              backdropFilter: 'blur(2px)',
            }}
          />
          <aside style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '260px',
            height: '100vh',
            background: 'var(--cor-fundo-card)',
            borderRight: '1px solid var(--cor-borda)',
            zIndex: 200,
            overflowY: 'auto',
            boxShadow: 'var(--sombra-lg)',
          }}>
            {conteudoSidebar}
          </aside>
        </>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main style={{
        flex: 1,
        minHeight: '100vh',
        background: 'var(--cor-fundo)',
        display: 'flex',
        flexDirection: 'column',
      }} className="main-content">

        {/* HEADER MOBILE */}
        <header className="header-mobile" style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          background: 'var(--cor-fundo-card)',
          borderBottom: '1px solid var(--cor-borda)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          gap: '0.75rem',
        }}>
          <button
            onClick={() => setMenuAberto(true)}
            className="btn btn-secundario"
            style={{ padding: '0.5rem', flexShrink: 0 }}
          >
            <Menu size={20} />
          </button>
          <span style={{
            fontFamily: 'var(--fonte-display)',
            fontWeight: 700,
            fontSize: '1rem',
            color: 'var(--cor-texto)',
            flex: 1,
            textAlign: 'center',
          }}>
            Finanças Casal
          </span>
          <button
            onClick={alternarTema}
            className="btn btn-secundario"
            style={{ padding: '0.5rem', flexShrink: 0 }}
          >
            {tema === 'claro' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        {/* CONTEÚDO DA PÁGINA */}
        <div style={{ padding: '1.25rem 1rem', flex: 1 }} className="pagina-conteudo">
          <Outlet />
        </div>
      </main>

      {/* CSS RESPONSIVO */}
      <style>{`
        @media (min-width: 769px) {
          .sidebar-desktop { display: flex !important; }
          .header-mobile { display: none !important; }
          .main-content { margin-left: 220px; }
        }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .header-mobile { display: flex !important; }
          .main-content { margin-left: 0 !important; }
          .pagina-conteudo { padding: 1rem 0.875rem !important; }
        }
      `}</style>
    </div>
  )
}