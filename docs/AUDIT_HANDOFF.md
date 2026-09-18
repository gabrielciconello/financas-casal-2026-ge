# Auditoria e handoff

Atualizado em 18/09/2026. Este arquivo registra o estado da varredura para que
uma proxima sessao ou subagente continue sem repetir trabalho.

## Concluido no codigo local

- Dashboard: consultas do Supabase consolidadas e paralelizadas, incluindo
  cartoes, historico e gastos variaveis na visao do casal.
- Front-end: modal com portal, foco preso, Escape, bloqueio de rolagem e clique
  correto no backdrop; CRUD fecha apenas em sucesso; filtros e paginacao
  corrigidos; tratamento de concorrencia e token no `useApi`.
- API: CORS/OPTIONS, limite de corpo de 64 KB, erros HTTP consistentes,
  paginacao limitada a 100 itens e validacao de entrada.
- Seguranca: acesso da aplicacao limitado aos dois e-mails configurados;
  service role usada somente no servidor; cabecalhos de seguranca no Vercel.
- Saldo total: CRUD, auditoria, validacao e leitura compartilhada implementados.
- Qualidade: scripts separados de typecheck/build/test, configuracao Jest
  isolada e documentacao/env de exemplo atualizadas.
- Verificacao local: 22 suites e 220 testes aprovados; typecheck e build de
  producao aprovados na ultima execucao completa.

## Estado externo verificado

- Vercel: projeto `financas-casal-2026-ge` conectado ao repositorio
  `gabrielciconello/financas-casal-2026-ge`, branch de producao `main`.
- Vercel: variaveis Supabase de cliente e servidor existem. A service role e a
  chave Gemini aparecem como Config e devem ser convertidas para Secret.
- Supabase: projeto `financas-casal` (`gklegaiqenedsoyhdxsd`) saudavel e com as
  tabelas/dados ficticios existentes.
- Supabase: integracao GitHub ativa para
  `gabrielciconello/financas-casal-2026-ge`, diretorio `.`, branch de producao
  `main` e deploy de producao habilitado.

## Pendente antes de publicar

1. Enviar o commit de auditoria para `main`. O push dispara deploy de producao
   no Vercel, portanto deve ser confirmado antes.
2. Fazer smoke test autenticado das rotas principais apos o deploy.

## Ultima verificacao

- `npm run check` aprovado em 18/09/2026: 22 suites, 220 testes, typecheck e
  build de producao sem erros.
- Migracao aplicada no banco de producao em 18/09/2026. Consulta de verificacao:
  1 registro em `saldo_total`, 0 nomes invalidos e as quatro politicas RLS
  esperadas presentes.

## Divida tecnica conhecida

- `npm audit --omit=dev` aponta duas vulnerabilidades moderadas no React Router
  6. A correcao automatica exige migracao para React Router 7 (breaking change),
  por isso foi deixada para uma atualizacao dedicada.
- A integracao Vercel do Supabase e opcional: as variaveis corretas ja existem
  no Vercel. Nao instalar sem necessidade, pois ampliaria permissoes.
- Os scripts SQL antigos na raiz foram mantidos por compatibilidade; a migracao
  consolidada em `supabase/migrations` e a fonte preferencial daqui em diante.
