# Instruções para o Copilot Agent — rkmmax-hibrido

## Arquitetura

Este é um **monorepo híbrido**:

- `/src` — Frontend React (Vite), servido como SPA estática na Vercel
- `/api` — Backend Vercel Serverless Functions (Node.js 22)
- `/public` — Assets estáticos
- `/docs` — Documentação técnica

## Orquestrador de IA

O agente principal é o **Serginho**, implementado em:

- `api/lib/serginho-orchestrator.js` — orquestrador backend (cascata de modelos Groq)
- `src/agents/serginho/` — componentes React da interface do Serginho
- `src/pages/Serginho.jsx` e `src/pages/Serginho.css` — página `/serginho`

Serginho coordena todos os demais especialistas e é o ponto de entrada principal para IA.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, Vite, React Router |
| Backend | Vercel Serverless Functions (Node.js 22) |
| IA / LLM | Groq API (modelos em cascata: llama, mixtral, gemma) |
| Banco de dados | Supabase (PostgreSQL + Auth + Storage) |
| Pagamentos | Stripe |
| Deploy | Vercel |

## Padrões de Código

- **ES6+**: use `const`/`let`, arrow functions, destructuring, template literals
- **Componentes funcionais**: sempre use hooks (`useState`, `useEffect`, `useCallback`, `useMemo`)
- **Nomes descritivos**: variáveis e funções em inglês, comentários em português quando necessário
- **CSS**: BEM-like para nomes de classes; sem CSS-in-JS; arquivos `.css` por componente/página
- **Sem `var`**, sem `class` components, sem jQuery

## Convenções de Commit

Seguimos **Conventional Commits**:

```
feat: nova funcionalidade
fix: correção de bug
chore: tarefa de manutenção (build, dependências, governança)
docs: documentação
style: formatação sem mudança de lógica
refactor: refatoração sem nova funcionalidade
test: adição ou correção de testes
perf: melhoria de performance
```

Exemplos:
- `feat(serginho): adicionar suporte a streaming de respostas`
- `fix(hybrid): corrigir scroll no mobile`
- `chore(governance): atualizar SECURITY.md`

## Testes

- Framework: **Jest** + React Testing Library
- Comando: `npm test`
- Rodar sempre antes de submeter um PR
- Testes unitários de serverless ficam em `api/__tests__/`
- Testes de componentes ficam em `src/__tests__/` ou junto ao componente

## Segurança

- **Nunca** expor API keys no frontend (`src/`)
- **Nunca** commitar `.env` ou arquivos com segredos
- Todas as chamadas a APIs externas (Groq, Supabase, Stripe) devem passar pelo backend (`/api`)
- Sempre validar e sanitizar input nos endpoints serverless
- Variáveis de ambiente ficam na Vercel Dashboard e no `.env.local` (nunca no repositório)

## Pull Requests

- **Mudanças pequenas e reversíveis** — um PR por assunto/funcionalidade
- Descrever o que muda e por quê no corpo do PR
- Incluir passo a passo de validação
- Incluir instrução de rollback: `git revert <commit-sha>`
- Registrar no `CHECKLIST.md` e no `CHANGELOG.md`
- Não quebrar rotas existentes (`/`, `/serginho`, `/hybrid`, `/specialists`)

## Idioma

- **Documentação** (`.md`, comentários): português (PT-BR)
- **Código** (variáveis, funções, classes): inglês
- **Commits**: inglês (corpo pode ser PT-BR se necessário)

## Rotas Principais

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `Home.jsx` | Página inicial |
| `/serginho` | `Serginho.jsx` | Chat com orquestrador Serginho |
| `/hybrid` | `HybridAgentSimple.jsx` | Chat com agente híbrido |
| `/specialists` | `Specialists.jsx` | Seleção de especialistas |
| `/abnt` | `Abnt.jsx` | Editor ABNT |
| `/study` | `StudyLab.jsx` | Ferramentas de estudo |

## Variáveis de Ambiente Principais

```
GROQ_API_KEY           # Chave da Groq API (obrigatória para IA)
SUPABASE_URL           # URL do projeto Supabase
SUPABASE_ANON_KEY      # Chave pública do Supabase
STRIPE_SECRET_KEY      # Chave secreta do Stripe
GITHUB_INTEGRATION_ENABLED  # Feature flag para integração GitHub (false por padrão)
```

Consulte `.env.example` para a lista completa.

## O que NÃO Fazer

- Não alterar CSS global (`src/index.css`) sem necessidade — prefer CSS por componente
- Não adicionar dependências sem justificativa clara
- Não fazer upgrades de dependências sem avaliar breaking changes
- Não expor dados de outros usuários entre sessões
- Não remover ou renomear rotas existentes sem migração
