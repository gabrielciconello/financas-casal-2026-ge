# Finanças Casal

Aplicação privada de controle financeiro compartilhado para duas pessoas. O frontend é uma SPA React/Vite, as rotas de API são funções Node.js na Vercel e os dados/autenticação ficam no Supabase (PostgreSQL + Auth).

## Estado atual

Implementado:

- login com Supabase Auth, sem cadastro público;
- dashboard mensal com resumo, categorias, histórico e vencimentos;
- CRUD de transações, salários, cartões/compras, gastos fixos e variáveis;
- metas com contribuições;
- movimentações de saldo total;
- exportação CSV da tela de transações;
- tema claro/escuro e layout responsivo;
- auditoria das operações dos módulos principais no backend.

Ainda não implementado: tela de auditoria, orçamento por categoria, relatórios dedicados e assistente de IA. Esses itens constam como ideias de evolução em `FINANCEIRO_DOCS.md`, não como funcionalidades disponíveis.

## Stack

- React 18, React Router e TypeScript
- Vite 5 e Tailwind CSS 4
- Supabase JS 2 (Auth + PostgreSQL)
- funções serverless Node.js na Vercel
- Zod para validação e Jest para testes

## Estrutura

```text
src/
  api/          handlers serverless da Vercel
  components/   componentes reutilizáveis
  config/       configuração dos dois usuários
  hooks/        autenticação, tema e acesso à API
  middleware/   validação do JWT do Supabase
  pages/        telas e rotas da SPA
  services/     regras de negócio e acesso ao Supabase
  styles/       estilos globais
  types/        contratos TypeScript
  utils/        utilitários HTTP e de domínio
  validators/   esquemas de entrada
__tests__/      testes unitários e de handlers
```

## Configuração local

Requisitos: Node.js 20 ou superior, npm e um projeto Supabase já criado.

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Preencha `.env.local`:

| Variável | Onde é usada | Sensível |
|---|---|---|
| `VITE_SUPABASE_URL` | navegador | não |
| `VITE_SUPABASE_ANON_KEY` | navegador | não; ainda assim, depende de RLS correto |
| `SUPABASE_URL` | funções serverless | não |
| `SUPABASE_ANON_KEY` | validação de sessão no servidor | não |
| `SUPABASE_SERVICE_ROLE_KEY` | acesso administrativo no servidor | **sim** |
| `DEV_API_PROXY_TARGET` | proxy local opcional; usa o deploy padrão se ausente | não |

Nunca use o prefixo `VITE_` na service role: variáveis `VITE_*` são incorporadas ao bundle e ficam públicas. O arquivo `.env.local` está ignorado pelo Git.

Durante o desenvolvimento, `/api/*` é enviado ao deploy indicado em `DEV_API_PROXY_TARGET`. Portanto, mudanças em handlers só ficam disponíveis localmente depois de um deploy/preview, a menos que se use `vercel dev` em outro fluxo.

## Vercel

O projeto precisa estar vinculado ao repositório correto no painel da Vercel. Configure as cinco variáveis do Supabase para Production, Preview e Development. Depois de alterá-las, faça um novo deploy; deployments existentes não recebem variáveis retroativamente.

`vercel.json` contém:

- build do frontend para `dist`;
- build dos handlers em `src/api`;
- mapeamento das rotas aninhadas;
- fallback da SPA para `index.html`;
- cache imutável de um ano apenas para assets versionados em `/assets/*`;
- headers básicos contra MIME sniffing, framing e vazamento de referrer.

## Supabase e banco

As funções usam `SUPABASE_SERVICE_ROLE_KEY` e, por isso, podem ignorar RLS. Toda rota deve permanecer protegida pelo middleware de autenticação; a service role nunca pode ir para o frontend.

Scripts SQL versionados:

- `add_usuario_nome.sql`: adiciona/preenche `usuario_nome` sem armazenar e-mails pessoais na migração;
- `saldo_total_table.sql`: cria a tabela e políticas idempotentes do módulo de saldo total.

Antes de executar uma migração em produção, faça backup e revise o SQL no editor do Supabase. As demais tabelas já devem existir no projeto remoto; este repositório não contém hoje uma migração integral capaz de recriar todo o schema do zero.

## Validação

```bash
npm run typecheck       # frontend, API e configuração Vite
npm test                # testes em execução serial
npm run test:coverage
npm run build           # typecheck + bundle de produção
npm run check           # validação completa
```

O frontend usa importação dinâmica por rota. React, gráficos e ícones são separados em chunks para que páginas sem gráficos não precisem baixar o Recharts antes de serem abertas.

## Segurança e regras de acesso

- o sistema é privado e os dois usuários são criados manualmente no Supabase Auth;
- os dados financeiros dos módulos principais são compartilhados pelo casal;
- ações de criação, alteração e exclusão devem registrar o autor;
- o JWT é validado em cada handler antes do uso da service role;
- não commite `.env`, tokens, chaves ou dumps com dados reais.

Projeto pessoal, sem licença para redistribuição.
