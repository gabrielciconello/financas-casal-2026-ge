import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useContexto'

const Login = lazy(() => import('./pages/auth/Login'))
const Layout = lazy(() => import('./components/layout/Layout'))
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const Transacoes = lazy(() => import('./pages/transacoes/Transacoes'))
const Salarios = lazy(() => import('./pages/salarios/Salarios'))
const Cartoes = lazy(() => import('./pages/cartoes/Cartoes'))
const GastosFixos = lazy(() => import('./pages/gastos/GastosFixos'))
const GastosVariaveis = lazy(() => import('./pages/gastos/GastosVariaveis'))
const Metas = lazy(() => import('./pages/metas/Metas'))
const AssistenteIA = lazy(() => import('./pages/ia/AssistenteIA'))

// Rota protegida — redireciona para login se não autenticado
function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'var(--fonte-corpo)',
        color: 'var(--cor-texto-suave)',
      }}>
        Carregando...
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontFamily: 'var(--fonte-corpo)',
        color: 'var(--cor-texto-suave)', backgroundColor: 'var(--cor-fundo-pagina)',
      }}>
        Carregando...
      </div>
    }>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transacoes" element={<Transacoes />} />
          <Route path="salarios" element={<Salarios />} />
          <Route path="cartoes" element={<Cartoes />} />
          <Route path="gastos/fixos" element={<GastosFixos />} />
          <Route path="gastos/variaveis" element={<GastosVariaveis />} />
          <Route path="metas" element={<Metas />} />
          <Route path="ia" element={<AssistenteIA />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}