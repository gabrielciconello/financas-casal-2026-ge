# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when operating in this repository.

---

## Finanças Casal — Project Overview

Casual finance management app for a couple (Gabriel & Emely), built with **React + Vite + TypeScript**, **Supabase** (PostgreSQL + Auth), deployed on **Vercel**.

---

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (port 3000, API proxied to Vercel) |
| Production build | `npm run build` (includes all type checks) |
| Preview build | `npm run preview` |
| Type check | `npm run typecheck` |
| Tests | `npm test` / `npm run test:watch` / `npm run test:coverage` |
| Full validation | `npm run check` |

### Environment Variables

The project uses Supabase. Both browser and Node clients expect:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (serverless functions only)
- `DEV_API_PROXY_TARGET` (optional local `/api` proxy target)

> **Note**: `src/services/supabase.browser.ts` uses `import.meta.env.*` and is for the frontend; `src/services/supabase.node.ts` uses `process.env.*` and is for API handlers. Never prefix the service-role key with `VITE_`.

---

## Architecture

### Stack
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS v4, Recharts, lucide-react icons
- **Backend**: Serverless API functions via Vercel (Node.js handlers mapped in `vercel.json`)
- **Database/Auth**: Supabase (PostgreSQL + Supabase Auth)

### Directory Structure

```
src/
  api/          — Vercel serverless function handlers (one per resource)
  services/     — Business logic / Supabase queries (split .browser.ts / .node.ts)
  pages/        — Route-level page components (Dashboard, Transacoes, Salarios, etc.)
  components/   — Shared UI components (Layout, Modal, Paginacao, etc.)
  hooks/        — React hooks (auth/theme context, generic useApi)
  middleware/   — Auth middleware for API (Bearer token validation via Supabase getUser)
  types/        — TypeScript interfaces for all domain models
  utils/        — Helpers (formatarMoeda, mesAnoAtual, HTTP responders)
  validators/   — Zod-style validation schemas per resource
  config/       — User email-to-name mapping (usuarios.ts)
```

### API Routing

All API routes are under `/api/*`. Vercel maps them via `vercel.json`:
- `/api/gastos/fixos` -> `src/api/gastos-fixos.ts`
- `/api/gastos/variaveis` -> `src/api/gastos-variaveis.ts`
- `/api/cartoes/compras-cartao` and `/api/cartoes` -> `src/api/cartoes.ts`
- `/api/salarios` -> `src/api/salarios.ts`
- `/api/metas` -> `src/api/metas.ts`
- `/api/transacoes` -> `src/api/transacoes.ts`
- `/api/dashboard` -> `src/api/dashboard.ts`
- `/api/saldo-total` and `/api/saldo-total/:id` -> `src/api/saldo-total.ts`
- `/api/saldo-total/resumo` -> `src/api/saldo-total.ts`
- Catch-all: `/api/(.*)` -> `src/api/$1.ts`

All endpoints require Supabase auth Bearer token (validated in `src/middleware/autenticacao.ts`).

### Pages / Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/dashboard` | Dashboard.tsx | Financial overview with month/year filter, charts, summary cards |
| `/transacoes` | Transacoes.tsx | Transaction CRUD with filters |
| `/salarios` | Salarios.tsx | Salary management per month/year |
| `/cartoes` | Cartoes.tsx | Credit card and installment purchase management |
| `/gastos/fixos` | GastosFixos.tsx | Fixed expenses per month |
| `/gastos/variaveis` | GastosVariaveis.tsx | Variable expenses per month |
| `/metas` | Metas.tsx | Financial goals with contributions |
| `/saldo-total` | SaldoTotal.tsx | Total couple balance tracking (aportes + retiradas) |

### Key Patterns

- **`useApi()` hook**: Generic fetch hook at `src/hooks/useApi.ts` — returns `{ dados, erro, carregando, requisitar }`. Attaches Bearer token automatically.
- **Auth**: `src/hooks/useContexto.tsx` provides `useAuth()` (usuario, token, login, logout) and `useTema()` (theme state).
- **Dashboard calculation**: `src/services/servicoDashboard.ts` computes `totalEntradas` (transactions tipo=entrada + salarios) and `totalSaidas` (transactions tipo=saida + gastos_fixos + gastos_variaveis + parcelas). The dashboard service supports `?mes=` and `?ano=` query params.
- **User identification**: Each table stores `usuario_id` and `usuario_nome`. The name mapping is in `src/config/usuarios.ts`. New tables should follow this pattern.
- **API handlers pattern**: CRUD handlers follow: authenticate -> check method -> call service -> return JSON. Services return `RespostaApi<T>` or `RespostaPaginada<T>` wrappers.

### Database

New tables require a reviewed SQL migration. `add_usuario_nome.sql` and `saldo_total_table.sql` are idempotent migration scripts, but their application status must be checked in the target Supabase project before execution.

### Build / Vite Config

- `@tailwindcss/vite` plugin for Tailwind v4
- Production build splits chunks: `react-vendor`, `charts` (recharts), `icons` (lucide-react)
- Dev server proxies all `/api/*` to `DEV_API_PROXY_TARGET` or the default Vercel deployment (so local handler edits are not picked up until deployed)
- Hashed `/assets/*` responses receive one-year immutable caching in Vercel
