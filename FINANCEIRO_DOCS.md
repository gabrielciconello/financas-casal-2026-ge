```

```

# 💰 FinançasCasal — Documentação do Projeto

> Assistente financeiro pessoal para dois usuários (casal), com visualização compartilhada, controle completo de finanças e integração com IA.

---

## 📌 Visão Geral

Sistema web responsivo (mobile-first) para gestão financeira de um casal. Ambos os usuários compartilham a mesma visão dos dados, com rastreamento individual de quem registrou cada movimentação via log de auditoria. O projeto é inteiramente gratuito utilizando Vercel e Supabase.

---

## 👥 Usuários e Acesso

- Exatamente **dois usuários** (casal) — cadastrados manualmente, sem tela de registro público
- Autenticação via **Supabase Auth** (e-mail + senha)
- Sessão persistente por usuário
- **Visualização compartilhada**: todos os dados são visíveis para ambos
- **Log de auditoria**: cada ação (criar, editar, excluir) registra qual usuário a realizou, em qual registro e quando
- O log é aplicado em todos os módulos do sistema

---

## 🛠️ Stack Tecnológica

| Camada                   | Tecnologia                   |
| ------------------------ | ---------------------------- |
| Frontend                 | HTML, CSS, TypeScript        |
| Backend / API            | Vercel API Routes (Node.js)  |
| Banco de Dados           | Supabase (PostgreSQL)        |
| Autenticação           | Supabase Auth                |
| Inteligência Artificial | Google Gemini API (gratuito) |
| Deploy                   | Vercel (gratuito)            |
| Versionamento            | GitHub                       |

---

## ☁️ Infraestrutura Gratuita

### Vercel (Free Tier)

- Deploy contínuo via GitHub
- Domínio `.vercel.app` gratuito
- 100 GB de banda/mês
- API Routes serverless com 100h de execução/mês

### Supabase (Free Tier)

- 500 MB de banco PostgreSQL
- 1 GB de armazenamento de arquivos
- 50.000 usuários autenticados
- 2 milhões de requisições de API/mês
- ⚠️ Pausa automática após 7 dias sem uso (impacto mínimo para uso diário)

### Google Gemini API (Free Tier)

- 60 requisições/minuto
- Sem necessidade de cartão de crédito
- Suficiente para uso pessoal do casal

---

## 📦 Módulos do Sistema

---

### 1. 🔐 Autenticação e Usuários

- Login e logout via Supabase Auth
- Dois usuários cadastrados manualmente
- Sessão persistente
- Identificação automática do usuário em todas as ações

---

### 2. 📋 Log Global de Auditoria

- Tabela dedicada no banco: `audit_logs`
- Registra: usuário, ação (criar/editar/excluir), módulo, ID do registro e timestamp
- Aplicado em: movimentações, cartões, gastos fixos, salários e metas
- Interface de visualização com filtros por usuário, módulo e período

---

### 3. 🏠 Dashboard Principal

- Cards de resumo: saldo atual, total de entradas, total de saídas, saldo projetado
- Gráfico de pizza/donut: gastos por categoria
- Gráfico de linha/barra: histórico dos últimos 6 meses (entradas x saídas)
- Indicador de saúde financeira (relação gasto/renda)
- Próximas contas a vencer (próximos 7 dias)
- Alertas visuais: limite de cartão próximo, contas pendentes, salário recebido
- Comparativo mês atual vs mês anterior
- Widget de meta de economia com barra de progresso
- Visão consolidada do casal (padrão)

---

### 4. 💸 Movimentações (Entradas e Saídas)

**Campos:** descrição, categoria, tipo (entrada/saída), valor, data, método de pagamento, status (efetivado/pendente), observações

**Funcionalidades:**

- Usuário responsável registrado automaticamente
- Movimentações recorrentes (repetição automática mensal)
- Divisão de despesa entre os dois usuários (ex: 50/50)
- Lançamento rápido via botão flutuante
- Filtros: período, categoria, tipo, usuário, status
- Busca por descrição
- Paginação com controle de itens por página
- Exportação em CSV
- Log de auditoria em toda alteração

---

### 5. 💰 Controle de Salários

- Salário fixo por usuário: valor base e dia esperado de recebimento
- Salário variável: comissões, freelances, horas extras com descrição da origem
- Status: pendente / recebido / parcialmente recebido
- Histórico mensal: esperado vs recebido
- Gráfico de evolução salarial
- Controle de 13º salário, férias e benefícios
- Log de auditoria em cada recebimento registrado

---

### 6. 💳 Gestão de Cartões de Crédito

- Cadastro de cartões: nome, bandeira, limite total, dia de fechamento, dia de vencimento
- Múltiplos cartões por usuário
- Registro de compras com parcelamento (valor total + número de parcelas)
- Visualização da fatura atual com todas as parcelas ativas
- Indicador de limite disponível vs usado
- Alerta de fatura próxima do vencimento
- Visão de comprometimento futuro (próximos 6 meses)
- Simulador: impacto de parcelamento nos próximos meses
- Log de auditoria em toda movimentação de cartão

---

### 7. 📋 Gastos Fixos e Variáveis

- **Fixos:** aluguel, energia, água, internet — valor, vencimento, categoria, status (pago/pendente)
- **Variáveis:** mercado, combustível, lazer — valor estimado vs real
- Orçamento por categoria: teto mensal com progresso em tempo real
- Calendário de vencimentos do mês
- Análise de tendência por categoria (últimos 3 meses)
- Comparativo estimado vs real com indicador de desvio
- Log de auditoria em toda alteração

---

### 8. 🎯 Metas Financeiras

- Criar meta: nome, valor alvo, prazo e aporte mensal sugerido
- Barra de progresso visual
- Projeção de data de conclusão baseada nos aportes
- Log de contribuições por usuário

---

### 9. 📊 Relatórios

- Relatório mensal e anual por categoria, tipo e usuário
- Comparativo entre períodos
- Exportação em CSV
- *(PDF descartado — limitação do free tier do Vercel)*

---

### 10. 🤖 Assistente IA (Gemini)

- Chat em linguagem natural: *"quanto gastamos esse mês?"*, *"qual nossa maior despesa?"*
- Resumo mensal automático gerado por IA
- Categorização automática de movimentações por descrição
- Sugestões de corte de gastos com base no histórico
- Detecção de anomalias: *"gasto com lazer aumentou 40% esse mês"*
- Previsão de saldo para o fim do mês
- Assistente de metas: quanto guardar por mês para atingir um objetivo

---

## ✅ Funcionalidades Transversais

- Design **mobile-first** e responsivo
- Tema claro / escuro
- Filtros globais por período (mês/ano) afetando todos os módulos
- Paginação em todas as listagens
- Feedback visual em todas as ações (loading, sucesso, erro)
- Autenticação segura com sessão por usuário

---

## ❌ O que foi descartado (limitações do free tier)

| Recurso                         | Motivo                                                   |
| ------------------------------- | -------------------------------------------------------- |
| Notificações push reais       | Requer serviço externo com complexidade desnecessária  |
| Exportação PDF                | Bibliotecas serverless de PDF excedem memória do Vercel |
| Anexo de comprovantes em escala | 1 GB do Supabase se esgota rapidamente com imagens       |
| E-mail de alerta automático    | Serviços gratuitos têm limites muito baixos            |
| IA preditiva complexa           | Modelos robustos são pagos                              |

---

## 🏗️ Arquitetura em Camadas

```
/
├── src/
│   ├── pages/          → Páginas da aplicação
│   ├── components/     → Componentes reutilizáveis de UI
│   ├── services/       → Comunicação com APIs externas (Supabase, Gemini)
│   ├── api/            → API Routes do Vercel (backend serverless)
│   ├── hooks/          → Lógica reutilizável (ex: useAuth, usePagination)
│   ├── types/          → Tipagens TypeScript
│   ├── utils/          → Funções auxiliares
│   └── styles/         → Estilos globais e variáveis CSS
├── public/             → Arquivos estáticos
├── .env.local          → Variáveis de ambiente (nunca commitar)
├── vercel.json         → Configuração do Vercel
└── package.json
```

---

## 🗄️ Principais Tabelas do Banco (Supabase)

| Tabela                 | Descrição                                            |
| ---------------------- | ------------------------------------------------------ |
| `users`              | Usuários autenticados (gerenciado pelo Supabase Auth) |
| `transactions`       | Movimentações de entradas e saídas                  |
| `salaries`           | Salários fixos e variáveis por usuário              |
| `credit_cards`       | Cartões de crédito cadastrados                       |
| `card_purchases`     | Compras e parcelas de cartão                          |
| `fixed_expenses`     | Gastos fixos mensais                                   |
| `variable_expenses`  | Gastos variáveis com estimado vs real                 |
| `goals`              | Metas financeiras                                      |
| `goal_contributions` | Aportes realizados por meta                            |
| `audit_logs`         | Log global de todas as ações do sistema              |

---

## 📚 Alinhamento com Estudos (ADS)

Este projeto foi pensado para ser educativo e alinhado com o que está sendo estudado:

- **API REST**: toda comunicação entre frontend e banco passa por API Routes no Vercel, seguindo princípios REST (verbos HTTP, status codes, separação de responsabilidades)
- **JavaScript / TypeScript**: projeto inteiramente em TypeScript, com tipagens explícitas em todas as camadas
- **Arquitetura em camadas**: separação clara entre apresentação, lógica de negócio e acesso a dados
- **Banco de dados relacional**: PostgreSQL via Supabase com modelagem de tabelas, relacionamentos e queries SQL
- **Autenticação e segurança**: JWT via Supabase Auth, variáveis de ambiente, Row Level Security (RLS)

---

*Documento gerado como referência inicial do projeto. Atualizar conforme o desenvolvimento avança.*
