# 💰 Finanças Casal

Sistema de assistente financeiro pessoal para casais, com visualização compartilhada, controle completo de finanças e integração com inteligência artificial.

---

## 🚀 Tecnologias

- **TypeScript** — tipagem estática em todas as camadas
- **Node.js** — ambiente de execução
- **Vercel** — deploy e API Routes serverless
- **Supabase** — banco de dados PostgreSQL e autenticação
- **Zod** — validação de dados
- **Jest** — testes automatizados
- **Google Gemini** — assistente de IA financeira

---

## 📁 Estrutura do Projeto

```
financas-casal/
├── __tests__/                  # Testes automatizados
│   └── validators/
├── src/
│   ├── api/                    # Controllers — rotas HTTP (Vercel API Routes)
│   ├── components/             # Componentes reutilizáveis de UI
│   ├── hooks/                  # Lógica reutilizável
│   ├── middleware/             # Autenticação e interceptadores
│   ├── pages/                  # Páginas da aplicação
│   ├── services/               # Regras de negócio e acesso ao banco
│   ├── styles/                 # Estilos globais
│   ├── types/                  # Tipagens TypeScript
│   ├── utils/                  # Funções auxiliares
│   └── validators/             # Validação de dados com Zod
├── public/                     # Arquivos estáticos
├── .env.local                  # Variáveis de ambiente (não commitar)
├── jest.config.js              # Configuração dos testes
├── tsconfig.json               # Configuração do TypeScript
└── vercel.json                 # Configuração do deploy
```

---

## 🏗️ Arquitetura em Camadas

```
[ Frontend — pages/ + components/ ]
            ↓ requisição HTTP
[ Controllers — api/ ]
            ↓ chama
[ Services — services/ ]
            ↓ acessa
[ Supabase — PostgreSQL ]
```

Cada camada tem responsabilidade única:

- **Controllers** — recebem a requisição HTTP, validam os dados e chamam o serviço correto
- **Services** — contêm as regras de negócio e acessam o banco de dados
- **Validators** — garantem que os dados de entrada são válidos antes de chegar nos serviços
- **Middleware** — verifica autenticação antes de qualquer rota

---

## ⚙️ Configuração do Ambiente

### Pré-requisitos

- Node.js v18 ou superior
- Conta no [Supabase](https://supabase.com)
- Conta no [Vercel](https://vercel.com)
- Chave de API do [Google Gemini](https://aistudio.google.com)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/financas-casal.git

# Entre na pasta
cd financas-casal

# Instale as dependências
npm install
```

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_chave_privada

# Gemini IA
GEMINI_API_KEY=sua_chave_gemini

# App
NODE_ENV=development
```

> ⚠️ Nunca commite o arquivo `.env.local`. Ele já está no `.gitignore`.

---

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Rodar em modo watch
npm run test:watch

# Rodar com cobertura
npm run test:coverage
```

---

## 🗄️ Banco de Dados

O projeto utiliza **PostgreSQL via Supabase** com as seguintes tabelas:

| Tabela | Descrição |
|---|---|
| `logs_auditoria` | Registro de todas as ações do sistema |
| `transacoes` | Entradas e saídas financeiras |
| `salarios` | Salários fixos e variáveis |
| `cartoes` | Cartões de crédito cadastrados |
| `compras_cartao` | Compras e parcelas de cartão |
| `gastos_fixos` | Despesas fixas mensais |
| `gastos_variaveis` | Despesas variáveis com estimado vs real |
| `metas` | Objetivos financeiros |
| `contribuicoes_metas` | Aportes realizados por meta |
| `orcamentos` | Teto de gastos por categoria |

Todas as tabelas possuem **Row Level Security (RLS)** ativado — apenas usuários autenticados têm acesso.

---

## 🔒 Segurança

- Autenticação via **Supabase Auth** com JWT
- **RLS** ativo em todas as tabelas do banco
- Dois clientes Supabase separados: público (frontend) e admin (backend)
- Validação de todos os dados de entrada com **Zod**
- Variáveis de ambiente protegidas e fora do repositório
- Log de auditoria em todas as operações do sistema

---

## 👥 Usuários

O sistema é restrito a **dois usuários** (casal), cadastrados manualmente no Supabase. Não há tela de registro público.

- A visualização dos dados é **compartilhada** entre os dois
- Cada ação registra **qual usuário** a realizou via log de auditoria

---

## 📦 Módulos

- **Dashboard** — visão geral com gráficos e alertas
- **Transações** — entradas e saídas com filtros e paginação
- **Salários** — controle de renda fixa e variável
- **Cartões de Crédito** — faturas, parcelas e limite
- **Gastos Fixos** — contas mensais com calendário de vencimentos
- **Gastos Variáveis** — estimado vs real por categoria
- **Metas** — objetivos financeiros com progresso
- **Relatórios** — exportação CSV por período
- **Assistente IA** — chat financeiro com Google Gemini

---

## 📄 Licença

Projeto pessoal — uso privado.