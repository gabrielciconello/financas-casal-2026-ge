import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useContexto'
import Login from './pages/auth/Login'
import Layout from './components/layout/Layout'
import Dashboard from './pages/dashboard/Dashboard'
import Transacoes from './pages/transacoes/Transacoes'
import Salarios from './pages/salarios/Salarios'
import Cartoes from './pages/cartoes/Cartoes'
import GastosFixos from './pages/gastos/GastosFixos'
import GastosVariaveis from './pages/gastos/GastosVariaveis'
import Metas from './pages/metas/Metas'
import AssistenteIA from './pages/ia/AssistenteIA'

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
  )
}