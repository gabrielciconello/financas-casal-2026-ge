import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth, useTema } from '../../hooks/useContexto'
import {
  LayoutDashboard, ArrowLeftRight, Wallet, CreditCard,
  Receipt, Target, LogOut, Sun, Moon, Menu, X,
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
]

function SidebarConteudo({ fechar, mostrarFechar, onPreload }: { fechar: () => void, mostrarFechar: boolean, onPreload?: (path: string) => void }) {
  const { usuario, sair } = useAuth()
  const { tema, alternarTema } = useTema()
  const navegar = useNavigate()

  async function handleSair() {
    await sair()
    navegar('/login')
  }

  return (
    <div className="flex flex-col h-full p-3" style={{ color: 'var(--cor-texto)' }}>
      {/* Logo */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-base truncate" style={{ color: 'var(--cor-texto)' }}>
            Finanças Casal
          </span>
        </div>
        {mostrarFechar && (
          <button onClick={fechar} className="btn btn-secundario p-1.5">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5">
        {itensMenu.map(({ caminho, icone: Icone, rotulo }) => (
          <NavLink
            key={caminho}
            to={caminho}
            onClick={fechar}
            onMouseEnter={() => onPreload?.(caminho)}
            onFocus={() => onPreload?.(caminho)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all no-underline ${
                isActive
                  ? 'nav-link-ativo font-semibold'
                  : 'texto-nav hover:bg-opacity-50'
              }`
            }
          >
            <Icone size={16} className="flex-shrink-0" />
            <span className="truncate">{rotulo}</span>
          </NavLink>
        ))}
      </nav>

      {/* Rodapé */}
      <div className="pt-3 flex flex-col gap-1.5 mt-3" style={{ borderTop: '1px solid var(--cor-borda)' }}>
        <p className="texto-nav px-2 truncate text-xs" style={{ fontWeight: 500 }}>{usuario?.nome || usuario?.email?.split('@')[0]}</p>
        <p className="texto-nav px-2 truncate text-xs">{usuario?.email}</p>
        <button onClick={alternarTema} className="btn btn-secundario w-full justify-start gap-2 text-sm">
          {tema === 'claro' ? <Moon size={15} /> : <Sun size={15} />}
          {tema === 'claro' ? 'Tema Escuro' : 'Tema Claro'}
        </button>
        <button onClick={handleSair} className="btn w-full justify-start gap-2 text-sm" style={{ color: 'var(--cor-perigo)', background: 'transparent' }}>
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </div>
  )
}

// Módulos lazy-loaded
const lazyModules: Record<string, (() => Promise<any>)[]> = {
  '/dashboard': [() => import('../../pages/dashboard/Dashboard')],
  '/transacoes': [() => import('../../pages/transacoes/Transacoes')],
  '/salarios': [() => import('../../pages/salarios/Salarios')],
  '/cartoes': [() => import('../../pages/cartoes/Cartoes')],
  '/gastos/fixos': [() => import('../../pages/gastos/GastosFixos')],
  '/gastos/variaveis': [() => import('../../pages/gastos/GastosVariaveis')],
  '/metas': [() => import('../../pages/metas/Metas')],
}

export default function Layout() {
  const { usuario } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)

  // Pre-load lazy modules on hover/focus
  const preloadModule = (path: string) => {
    const modules = lazyModules[path]
    if (modules) modules.forEach(importFn => importFn())
  }

  useEffect(() => {
    // Preload all routes on idle so first navigation is instant
    const requestCallback = (window as any).requestIdleCallback || setTimeout
    const cancelCallback = (window as any).cancelIdleCallback || clearTimeout
    const timer = requestCallback(() => {
      Object.values(lazyModules).forEach(fns => fns.forEach(fn => fn()))
    })
    return () => cancelCallback(timer)
  }, [])

  return (
    <div className="flex min-h-screen bg-pagina" style={{ backgroundColor: 'var(--cor-fundo-pagina)' }}>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-56 flex-col bg-lateral border-r z-50" style={{ background: 'var(--cor-fundo-card)', borderRight: '1px solid var(--cor-borda)' }}>
        <SidebarConteudo fechar={() => {}} mostrarFechar={false} onPreload={preloadModule} />
      </aside>

      {/* SIDEBAR MOBILE — Drawer */}
      {menuAberto && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMenuAberto(false)}
          />
          <aside className="fixed top-0 left-0 h-screen w-64 bg-lateral border-r z-50 md:hidden shadow-xl" style={{ background: 'var(--cor-fundo-card)', borderRight: '1px solid var(--cor-borda)' }}>
            <SidebarConteudo fechar={() => setMenuAberto(false)} mostrarFechar={true} onPreload={preloadModule} />
          </aside>
        </>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col md:ml-56 min-h-screen">

        {/* HEADER MOBILE */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3" style={{ background: 'var(--cor-fundo-card)', borderBottom: '1px solid var(--cor-borda)' }}>
          <button onClick={() => setMenuAberto(true)} className="btn btn-secundario p-2">
            <Menu size={20} />
          </button>
          <span className="font-display font-bold text-base" style={{ color: 'var(--cor-texto)' }}>Finanças Casal</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {usuario?.nome || usuario?.email?.split('@')[0] || ''}
          </span>
        </header>

        {/* CONTEÚDO DA PÁGINA */}
        <main className="flex-1 p-4 md:p-6 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}