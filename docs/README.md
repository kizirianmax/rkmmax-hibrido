# 📚 Índice de Documentação — RKMMAX Híbrido

> **Versão:** v3.1.0-kizi · **Repositório:** [kizirianmax/rkmmax-hibrido](https://github.com/kizirianmax/rkmmax-hibrido)

Este arquivo é o índice central de toda a documentação do projeto. Use-o para navegar pelos documentos organizados por categoria.

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Arquitetura](#️-arquitetura)
- [Governança](#-governança)
- [Operação / Desenvolvimento](#-operação--desenvolvimento)
- [Produto / Construtor](#-produto--construtor)
- [Histórico](#-histórico)
- [Documentação em /docs](#-documentação-em-docs)
- [Documentação Técnica na Raiz](#-documentação-técnica-na-raiz)

---

## 🚀 Visão Geral

**RKMMAX Híbrido** é um sistema empresarial de agentes de IA com arquitetura híbrida:

- **Frontend:** React 18 + Vite (SPA estática hospedada na Vercel)
- **Backend:** Vercel Serverless Functions (Node.js 22)
- **IA / LLM:** Groq API com cascata de modelos (llama, mixtral, gemma)
- **Banco de dados:** Supabase (PostgreSQL + Auth + Storage)
- **Pagamentos:** Stripe
- **Deploy:** Vercel

### Documentos Principais

| Documento | Descrição |
|-----------|-----------|
| [README.md](../README.md) | Quick start, arquitetura geral, features, stack |
| [HYBRID_SYSTEM_README.md](HYBRID_SYSTEM_README.md) | Detalhes do sistema híbrido |
| [SISTEMA_COMPLETO_RESUMO.md](SISTEMA_COMPLETO_RESUMO.md) | Resumo completo do sistema |
| [auditoria_tecnica_rkmmax_hibrido.md](auditoria_tecnica_rkmmax_hibrido.md) | Auditoria técnica completa |

---

## 🏗️ Arquitetura

O sistema utiliza uma arquitetura de 5 camadas com orquestração multi-agente. O orquestrador principal é o **Serginho** (em `api/lib/serginho-orchestrator.js`).

### Rotas Principais

| Rota | Descrição |
|------|-----------|
| `/` | Página inicial |
| `/serginho` | Chat com orquestrador Serginho |
| `/hybrid` | Chat com agente híbrido |
| `/specialists` | Seleção de especialistas |
| `/abnt` | Editor ABNT |
| `/study` | Ferramentas de estudo |

### Documentos de Arquitetura

| Documento | Descrição |
|-----------|-----------|
| [docs/ARCHITECTURE.md](ARCHITECTURE.md) | Visão arquitetural em 4 camadas |
| [docs/architecture.md](architecture.md) | Arquitetura do sistema (detalhada) |
| [docs/AGENTS.md](AGENTS.md) | Sistema multi-agente e orquestração |
| [docs/ARQUITETURA_AGENTES.md](ARQUITETURA_AGENTES.md) | Arquitetura dos agentes especialistas |
| [docs/API.md](API.md) | Referência completa da API |
| [docs/api.md](api.md) | Documentação da API (complementar) |
| [docs/SPECIALISTS.md](SPECIALISTS.md) | Agentes especialistas |
| [docs/SPECIALISTS_COMPLETE.md](SPECIALISTS_COMPLETE.md) | Especialistas — lista completa |
| [docs/OBSERVABILITY.md](OBSERVABILITY.md) | Observabilidade: Sentry, PostHog, logs |

---

## 📜 Governança

| Documento | Descrição |
|-----------|-----------|
| [SECURITY.md](../SECURITY.md) | Política de segurança, contato, prazos de disclosure responsável |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Guia para contribuições, branches, padrões |
| [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | Código de conduta (Contributor Covenant) |
| [CHECKLIST.md](../CHECKLIST.md) | Protocolo de operações, histórico de PRs, validação e rollback |
| [CHANGELOG.md](../CHANGELOG.md) | Histórico de mudanças (Keep a Changelog) |
| [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) | Diretrizes de desenvolvimento e CI |
| [BRANCH_PROTECTION_GUIDE.md](BRANCH_PROTECTION_GUIDE.md) | Proteção de branches e regras de merge |
| [MAINTENANCE.md](MAINTENANCE.md) | Plano de manutenção e dependências |
| [LICENSE](../LICENSE) | Licença MIT |

### Templates GitHub

| Template | Caminho |
|----------|---------|
| Pull Request | [.github/PULL_REQUEST_TEMPLATE.md](../.github/PULL_REQUEST_TEMPLATE.md) |
| Issue Templates | [.github/ISSUE_TEMPLATE/](../.github/ISSUE_TEMPLATE/) |
| Copilot Instructions | [.github/copilot-instructions.md](../.github/copilot-instructions.md) |
| Dependabot | [.github/dependabot.yml](../.github/dependabot.yml) |

---

## 🛠️ Operação / Desenvolvimento

### Quick Start

```bash
# 1. Clonar e instalar
git clone https://github.com/kizirianmax/rkmmax-hibrido.git
cd rkmmax-hibrido
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Preencher: GROQ_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE_SECRET_KEY

# 3. Rodar em desenvolvimento
npm start          # Frontend em http://localhost:3000
npm test           # Testes (Jest — ~284 testes)

# 4. Build e deploy
npm run build      # Build de produção
vercel deploy      # Deploy para Vercel
```

### Variáveis de Ambiente Principais

| Variável | Descrição |
|----------|-----------|
| `GROQ_API_KEY` | Chave da Groq API (obrigatória para IA) |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave pública do Supabase |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe |
| `GITHUB_INTEGRATION_ENABLED` | Feature flag para integração GitHub (padrão: `false`) |

Consulte [.env.example](../.env.example) para a lista completa.

### Documentos Operacionais

| Documento | Descrição |
|-----------|-----------|
| [DEPLOY.md](DEPLOY.md) | Guia de deploy geral |
| [DEPLOY_VERCEL_FINAL.md](DEPLOY_VERCEL_FINAL.md) | Deploy final na Vercel (passo a passo) |
| [docs/deployment.md](deployment.md) | Guia de deployment detalhado |
| [VARIAVEIS_VERCEL_FINAIS.md](VARIAVEIS_VERCEL_FINAIS.md) | Variáveis de ambiente na Vercel |
| [EXTERNAL_APIS_SETUP.md](EXTERNAL_APIS_SETUP.md) | Configuração de APIs externas |
| [CONFIGURAR_EMAIL_RESEND.md](CONFIGURAR_EMAIL_RESEND.md) | Configuração de e-mail via Resend |
| [CI_CD_SETUP.md](CI_CD_SETUP.md) | Setup de CI/CD |
| [CI_CD_ANALYSIS.md](CI_CD_ANALYSIS.md) | Análise do pipeline CI/CD |
| [TEST_SCRIPTS.md](TEST_SCRIPTS.md) | Scripts de teste e validação |
| [ALERTS_SETUP.md](ALERTS_SETUP.md) | Configuração de alertas |

---

## 🔗 Integração GitHub (Backend)

A integração com o GitHub é gerida exclusivamente no backend (`api/`). O frontend **não** acessa a API do GitHub diretamente.

### Variáveis de Ambiente

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `GITHUB_INTEGRATION_ENABLED` | Não | `false` | Feature flag principal. Defina `true` para ativar. |
| `GITHUB_TOKEN` | Não | — | Personal Access Token (OAuth). Quando ausente com flag ativa, modo é `stub`. |
| `GITHUB_REQUEST_TIMEOUT_MS` | Não | `8000` | Timeout em ms para requisições à API GitHub. |
| `GITHUB_API_BASE_URL` | Não | `https://api.github.com` | URL base da API GitHub (útil para testes). |

### Modos de Operação

| Modo | Condição | Comportamento |
|------|----------|---------------|
| desabilitado | `GITHUB_INTEGRATION_ENABLED=false` (padrão) | Todos os endpoints exceto `/status` retornam 501 `GITHUB_DISABLED` |
| `stub` | Flag ativa, sem `GITHUB_TOKEN` | Retorna dados mock; **nunca** chama a API real |
| `oauth` | Flag ativa, com `GITHUB_TOKEN` | Chama a API real autenticada com token OAuth |

### Endpoints Disponíveis

Todos os endpoints usam `GET /api/github?route=<rota>`.

#### `GET /api/github?route=status`
Sempre retorna `200`. Não é bloqueado pela feature flag.
```bash
curl "https://seu-deploy.vercel.app/api/github?route=status"
# { "enabled": false, "mode": "stub", "message": "..." }
```

#### `GET /api/github?route=repos`
Lista repositórios do usuário autenticado.
```bash
curl "https://seu-deploy.vercel.app/api/github?route=repos"
# Flag off → 501 | stub → 200 mock | oauth → 200 real
```

#### `GET /api/github?route=branches&owner=USER&repo=REPO`
Lista branches de um repositório. Parâmetros `owner` e `repo` são obrigatórios.
```bash
curl "https://seu-deploy.vercel.app/api/github?route=branches&owner=kizirianmax&repo=rkmmax-hibrido"
# Flag off → 501 | sem params → 400 | stub → 200 mock | oauth → 200 real
```

#### `GET /api/github?route=file&owner=USER&repo=REPO&path=PATH[&ref=REF]`
Obtém conteúdo de um arquivo. Parâmetros `owner`, `repo` e `path` são obrigatórios. `ref` é opcional (branch, tag ou commit SHA).
```bash
curl "https://seu-deploy.vercel.app/api/github?route=file&owner=kizirianmax&repo=rkmmax-hibrido&path=README.md&ref=main"
# Flag off → 501 | sem params → 400 | stub → 200 mock | oauth → 200 real
```

### Códigos de Erro

Todos os erros seguem o formato: `{ "error": { "code": "...", "message": "...", "details": "..." } }`

| Código | Status HTTP | Descrição |
|--------|-------------|-----------|
| `GITHUB_DISABLED` | 501 | Feature flag desabilitada |
| `GITHUB_NO_TOKEN` | 401 | Token não configurado (oauth mode) |
| `GITHUB_UNAUTHORIZED` | 401/403 | Token inválido ou sem permissão |
| `GITHUB_NOT_FOUND` | 404 | Recurso não encontrado na API GitHub |
| `GITHUB_TIMEOUT` | 504 | Timeout na requisição à API GitHub |
| `GITHUB_API_ERROR` | 5xx | Erro genérico na API GitHub |
| `MISSING_PARAMS` | 400 | Parâmetros obrigatórios ausentes |
| `METHOD_NOT_ALLOWED` | 405 | Método HTTP inválido (só GET é aceito) |
| `NOT_FOUND` | 404 | Rota desconhecida |
| `INTERNAL_ERROR` | 500 | Erro interno inesperado |

### Arquivos Relevantes

| Arquivo | Descrição |
|---------|-----------|
| `api/github.js` | Handler principal, roteamento e handlers por rota |
| `api/lib/github/githubConfig.js` | Feature flag e leitura segura de variáveis de ambiente |
| `api/lib/github/githubClient.js` | Wrapper HTTP com timeout, retry e `GitHubClientError` |
| `api/lib/github/githubService.js` | Funções de negócio: `listRepos`, `listBranches`, `getFile` |
| `api/lib/github/githubErrors.js` | `formatErrorResponse`, `mapClientError`, `sanitizeMessage` |
| `api/__tests__/github.test.js` | Testes unitários base |
| `api/__tests__/github-hardening.test.js` | Testes de hardening e segurança |

---

## 🏗️ Produto / Construtor

| Documento | Descrição |
|-----------|-----------|
| [docs/PAYMENT_LINKS.md](PAYMENT_LINKS.md) | Links de pagamento Stripe |
| [SISTEMA_HIBRIDO_TODO.md](SISTEMA_HIBRIDO_TODO.md) | Roadmap e tarefas do sistema híbrido |
| [AUTOMATION_SYSTEM_PLAN.md](AUTOMATION_SYSTEM_PLAN.md) | Plano do sistema de automação |
| [HYBRID_SYSTEM_DEPLOYMENT.md](HYBRID_SYSTEM_DEPLOYMENT.md) | Deploy do sistema híbrido |
| [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) | Implementação completa do sistema |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Resumo das implementações |

---

## 📊 Histórico

| Documento | Descrição |
|-----------|-----------|
| [CHANGELOG.md](../CHANGELOG.md) | Histórico completo de mudanças por versão |
| [CHECKLIST.md](../CHECKLIST.md) | Histórico de operações/PRs com validação e rollback |
| [ANALISE_REPOSITORIO_FINAL.md](ANALISE_REPOSITORIO_FINAL.md) | Análise final do repositório |
| [CHANGELOG_CONSOLIDACAO.md](CHANGELOG_CONSOLIDACAO.md) | Consolidação do changelog legado |
| [VALIDACAO_FINAL.md](VALIDACAO_FINAL.md) | Validação final do sistema |

---

## 📁 Documentação em /docs

Todos os arquivos dentro da pasta `docs/`:

| Arquivo | Descrição |
|---------|-----------|
| [docs/README.md](README.md) | Este índice |
| [docs/INDEX.md](INDEX.md) | Mapa rápido (TL;DR) |
| [docs/ARCHITECTURE.md](ARCHITECTURE.md) | Arquitetura em 4 camadas |
| [docs/architecture.md](architecture.md) | Arquitetura detalhada |
| [docs/AGENTS.md](AGENTS.md) | Sistema de agentes |
| [docs/ARQUITETURA_AGENTES.md](ARQUITETURA_AGENTES.md) | Arquitetura dos agentes |
| [docs/API.md](API.md) | Referência da API |
| [docs/api.md](api.md) | Documentação da API |
| [docs/SPECIALISTS.md](SPECIALISTS.md) | Especialistas |
| [docs/SPECIALISTS_COMPLETE.md](SPECIALISTS_COMPLETE.md) | Especialistas (completo) |
| [docs/OBSERVABILITY.md](OBSERVABILITY.md) | Observabilidade |
| [docs/PAYMENT_LINKS.md](PAYMENT_LINKS.md) | Links de pagamento |
| [docs/deployment.md](deployment.md) | Deployment |

---

## 📂 Documentação Técnica na Raiz

Todos os arquivos `.md` na raiz do repositório:

| Arquivo | Descrição |
|---------|-----------|
| [README.md](../README.md) | Readme principal — quick start e overview |
| [SECURITY.md](../SECURITY.md) | Política de segurança |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Guia de contribuição |
| [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | Código de conduta |
| [CHANGELOG.md](../CHANGELOG.md) | Changelog |
| [CHECKLIST.md](../CHECKLIST.md) | Checklist de operações |
| [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) | Diretrizes de desenvolvimento |
| [BRANCH_PROTECTION_GUIDE.md](BRANCH_PROTECTION_GUIDE.md) | Proteção de branches |
| [MAINTENANCE.md](MAINTENANCE.md) | Manutenção |
| [DEPLOY.md](DEPLOY.md) | Deploy geral |
| [DEPLOY_VERCEL_FINAL.md](DEPLOY_VERCEL_FINAL.md) | Deploy Vercel (final) |
| [HYBRID_SYSTEM_README.md](HYBRID_SYSTEM_README.md) | Sistema híbrido readme |
| [HYBRID_SYSTEM_DEPLOYMENT.md](HYBRID_SYSTEM_DEPLOYMENT.md) | Deployment do sistema híbrido |
| [SISTEMA_COMPLETO_RESUMO.md](SISTEMA_COMPLETO_RESUMO.md) | Resumo do sistema |
| [SISTEMA_HIBRIDO_TODO.md](SISTEMA_HIBRIDO_TODO.md) | TODO do sistema híbrido |
| [AUTOMATION_SYSTEM_PLAN.md](AUTOMATION_SYSTEM_PLAN.md) | Plano de automação |
| [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) | Implementação completa |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Resumo de implementação |
| [EXTERNAL_APIS_SETUP.md](EXTERNAL_APIS_SETUP.md) | Setup de APIs externas |
| [CONFIGURAR_EMAIL_RESEND.md](CONFIGURAR_EMAIL_RESEND.md) | Configurar e-mail Resend |
| [CI_CD_SETUP.md](CI_CD_SETUP.md) | Setup CI/CD |
| [CI_CD_ANALYSIS.md](CI_CD_ANALYSIS.md) | Análise CI/CD |
| [TEST_SCRIPTS.md](TEST_SCRIPTS.md) | Scripts de teste |
| [ALERTS_SETUP.md](ALERTS_SETUP.md) | Setup de alertas |
| [VARIAVEIS_VERCEL_FINAIS.md](VARIAVEIS_VERCEL_FINAIS.md) | Variáveis Vercel finais |
| [ANALISE_REPOSITORIO_FINAL.md](ANALISE_REPOSITORIO_FINAL.md) | Análise final do repositório |
| [CHANGELOG_CONSOLIDACAO.md](CHANGELOG_CONSOLIDACAO.md) | Consolidação do changelog |
| [VALIDACAO_FINAL.md](VALIDACAO_FINAL.md) | Validação final |
| [REACT_NATIVE_SETUP.md](REACT_NATIVE_SETUP.md) | Setup React Native |
| [auditoria_tecnica_rkmmax_hibrido.md](auditoria_tecnica_rkmmax_hibrido.md) | Auditoria técnica |
| [TODO_MIGRATE_TESTS.md](TODO_MIGRATE_TESTS.md) | TODO migração de testes |
| [PR_72_SUMMARY.md](PR_72_SUMMARY.md) | Resumo do PR #72 |

---

> **Nota:** Este índice é mantido manualmente. Se adicionar novos arquivos `.md`, lembre de atualizar este índice.
> Rollback: `git revert <commit-sha>`
