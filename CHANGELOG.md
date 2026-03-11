# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased] — v3.1.0-kizi

### ✨ Adicionado
- **Serginho GitHub Context Comparison (N8)**: criado `api/lib/serginho/analysis/githubContextComparison.js` com `isComparativeFollowUp(message)` (detecta perguntas comparativas PT-BR e EN via regex: compare, alinhado com, inconsistência entre, divergência entre, combina com, o que difere, same story, etc.), `hasEnoughContextForComparison(githubContext)` (verifica se há contexto atual E anterior — `lastGitHubSummary`/`lastFileSnippet` + `previousGitHubSummary`/`previousFileSnippet`), `buildComparisonPrompt(message, githubContext)` (monta prompt estruturado com Artefato 1 anterior + Artefato 2 atual + instruções anti-alucinação: responder em PT-BR, não inventar dados, apontar alinhamentos E divergências), `getInsufficientComparisonContextMessage()` (mensagem amigável orientando o usuário a carregar dois artefatos); `api/lib/serginho/context/githubConversationContext.js` minimamente estendido com 4 campos `previous*` e shift no início de `updateContextFromToolResult()`; orchestrator minimamente modificado com bloco comparative follow-up ANTES do analítico, guarda `_skipComparisonCheck` anti-loop, reutilização do `formatAnalyticalResponse` do N7, `_meta.comparativeFollowUp = true`; 80 novos testes. Zero dependências novas. Zero breaking changes. Rollback com `git revert`. (este PR)
- **Serginho GitHub Analytical Response Formatter (N7)**: criado `api/lib/serginho/analysis/githubAnalyticalResponseFormatter.js` com `detectAnalyticalSections(rawText)` (extrai estrutura intermediária via heurística regex/padrões PT-BR+EN: summary do primeiro parágrafo significativo não-lista, strengths/risks/nextSteps de bullets via palavras-chave, confidence detectada a partir de sinais de incerteza) e `formatAnalyticalResponse(rawText, options)` (estrutura resposta LLM em blocos Markdown leve com opções `includeStructure` e `maxLength`; nunca inventa seções; fallback para texto original limpo quando nenhuma seção detectada; truncamento seguro com sufixo `[resposta truncada]`); orchestrator modificado minimamente para importar formatter e aplicar pós-processamento no bloco analytical follow-up (N6), marcando `_meta.analyticalFormatted = true`; 55 novos testes. Zero dependências novas. Zero breaking changes. Rollback com `git revert`. (este PR)
- **Serginho GitHub Incremental Analysis (N6)**: criado `api/lib/serginho/analysis/githubContextAnalysis.js` com `isAnalyticalFollowUp(message)` (detecta perguntas analíticas de follow-up em PT-BR e EN via padrões regex, sem LLM), `hasEnoughContextForAnalysis(githubContext)` (verifica se lastGitHubSummary/lastFileSnippet/lastGitHubResultType estão presentes), `buildAnalysisPrompt(message, githubContext)` (monta prompt estruturado com contexto + instruções obrigatórias: responder em PT-BR, não inventar dados, ser conciso), `getInsufficientContextMessage()` (string amigável orientando o usuário); orchestrator modificado minimamente para detectar follow-up analítico antes do bloco GitHub intent, redirecionar ao LLM com prompt estruturado quando há contexto, retornar mensagem amigável imediatamente sem chamar LLM quando não há contexto; guarda `_skipAnalyticalCheck` evita recursão infinita; 89 novos testes. Zero dependências novas. Zero breaking changes. Rollback com `git revert`. (este PR)
- **Serginho GitHub Conversation Context (N5)**: criado `api/lib/serginho/context/githubConversationContext.js` — contexto in-memory por conversa com `createGitHubContext()`, `updateContextFromToolResult()`, `resolveParamsFromContext()` (owner/repo; path NÃO auto-preenchido), `getContextSummary()` (resumo truncado para injeção no LLM), `clearGitHubContext()`; snippets truncados em 2000 chars, summaries em 500 chars; nunca persiste em banco/disco; nunca vaza token/stacktrace/headers; orchestrator modificado minimamente para criar/recuperar contexto via `context.githubContext`, resolver params faltantes antes de chamar tools, atualizar contexto após execução, injetar resumo em `effectiveMessage` para follow-ups LLM, e retornar contexto atualizado em `_meta.githubContext`; 49 novos testes. Zero dependências novas. Zero breaking changes. Rollback com `git revert`. (PR anterior)
- **Serginho GitHub Response Formatter (N4)**: criado `api/lib/serginho/formatters/githubResponseFormatter.js` com formatação inteligente por tipo de operação — `formatReposResponse()` (lista numerada com visibilidade 🔓/🔒, branch default, descrição, top 10), `formatBranchesResponse()` (branches com 🛡️ protegida e repo alvo), `formatFileResponse()` com smart file-type handling para `package.json` (nome/versão/scripts/deps), `*.md` (primeiro parágrafo + seções), `*.json` (estrutura/chaves), `*.js|tsx?` (exports e funções), genérico (primeiras N linhas); `formatErrorResponse()` com mensagens amigáveis para GITHUB_DISABLED, GITHUB_NO_TOKEN, GITHUB_VALIDATION_ERROR, GITHUB_API_ERROR; truncamento seguro com aviso `[conteúdo truncado — mostrando primeiros X caracteres]`; orchestrator modificado minimamente para delegar formatação; 85 novos testes. Zero dependências novas. Zero breaking changes. Rollback com `git revert`. (PR anterior)
- **Serginho GitHub Intent Detection (N3)**: adicionada detecção de intenção GitHub read-only no Serginho Orchestrator — `api/lib/serginho/intent/githubIntent.js` com `detectGitHubIntent(message)` usando keyword/regex matching (sem LLM) para reconhecer pedidos de listar repos/branches e ler arquivos em PT-BR e EN; early-return mínimo no início de `_handleStructured` (antes da análise de complexidade) que chama a tool correspondente via `getToolByName(tool).execute(params)` e retorna resposta formatada; helper `formatGitHubResult()` para texto legível; 38 testes cobrindo todos os cenários. Zero dependências novas. Zero breaking changes. Rollback com `git revert`. (PR anterior)
- **Serginho GitHub Tools (N2)**: criada camada de orquestração de tools GitHub para uso interno do Serginho — `api/lib/serginho/tools/githubTools.js` com três tools estruturadas (`runGitHubListReposTool`, `runGitHubListBranchesTool`, `runGitHubGetFileTool`) que validam parâmetros e verificam a feature flag antes de chamar o gateway, e `api/lib/serginho/tools/index.js` com registry (`GITHUB_TOOLS`, `getToolByName`, `getAllTools`, `isGitHubToolsAvailable`). 54 testes cobrindo todos os cenários (flag off, stub, oauth, validação, sanitização, registry, garantia). Zero dependências novas. Zero breaking changes. (este PR)

### 📝 Documentação
- **Docs:** adicionado índice de documentação (`docs/README.md`, `docs/INDEX.md`) com todos os 40+ arquivos Markdown organizados por categoria (PR #168)

### 🔒 Segurança
- **`SECURITY.md`** expandido: substituído o template genérico do GitHub por política de segurança real com contato, prazos de resposta, escopo de vulnerabilidades e política de divulgação responsável (PR #167)

### 📝 Documentação / Governança
- **`CHECKLIST.md`** atualizado: PRs #163, #164, #166 registrados no histórico de operações; seção de validação e rollback adicionada (PR #167)
- **`.github/copilot-instructions.md`** criado: instruções completas para o Copilot Agent sobre arquitetura, stack, padrões de código, convenções de commit, segurança e idioma (PR #167)
- **`CHANGELOG.md`** atualizado: entradas para PRs #163, #164, #166, #167 adicionadas (PR #167)

### 🐛 Corrigido
- **`/serginho` mobile**: eliminado o "degrau" (jump) ao focar o textarea — layout app-like com `position: fixed; inset: 0`, cadeia flex correta e scroll-lock no `body`/`html` via `useEffect` (PR #163)
- **`/hybrid` mobile**: header ocultado em mobile (`max-width: 640px`) para priorizar área de conversa — 100% da tela disponível para chat+input (PR #164)

### ✨ Adicionado
- **Integração GitHub (Construtor)**: base de integração com feature flag `GITHUB_INTEGRATION_ENABLED`, cliente HTTP com retry, endpoints `GET /api/github/status` e `GET /api/github/repos` (PR #166)
- **GitHub backend hardening**: padronização de erros (`{ error: { code, message, details? } }`), endpoints `?route=branches` e `?route=file` (read-only), input validation (400), stub data, `githubErrors.js` com `formatErrorResponse`/`mapClientError`/`sanitizeMessage`, 50 novos testes de hardening em `github-hardening.test.js`, documentação em `docs/README.md` (PR #169)
- **Serginho GitHub Gateway**: criado `api/lib/serginho/githubGateway.js` — gateway interno que torna o Serginho o único ponto de entrada para integração GitHub no backend. Funções `serginhoListRepos()`, `serginhoListBranches({ owner, repo })`, `serginhoGetFile({ owner, repo, path, ref })` com retorno padronizado `{ success, data|error }` e 42 testes cobrindo todos os cenários (flag off, stub, oauth sem/com token, validação, erros de API) (este PR)

---

## [1.0.0] - 2025-10-15

### 🎉 Lançamento Inicial

Esta é a primeira versão estável do RKMMax, resultado de uma auditoria completa e elevação ao estado-da-arte.

### ✨ Adicionado

#### Observabilidade e Feedback
- **Sentry** integrado para rastreamento de erros e performance
- **PostHog** integrado para analytics e tracking de eventos
- Sistema de **feedback in-app** com botão flutuante
- Criação automática de **GitHub Issues** a partir do feedback
- Página **Status & Ajuda** (`/help` e `/status`)
- Captura automática de contexto em erros (URL, user agent, stack trace)

#### Automação e CI/CD
- **GitHub Actions** para CI/CD (lint, build, testes)
- **Renovate** configurado para atualização automática de dependências
- **ESLint + Prettier** padronizados com scripts npm
- Templates de **Pull Request** e **Issues**
- Testes básicos com **React Testing Library**
- Script de análise de bundle (`npm run analyze`)

#### Segurança
- Headers de segurança completos (CSP, HSTS, X-Frame-Options, etc.)
- **Content Security Policy** configurada para Stripe, Supabase, Sentry e PostHog
- **Strict-Transport-Security** com preload
- Verificação de assinatura em webhooks Stripe
- Sanitização de inputs

#### Performance
- Bundle otimizado (195.91 kB gzipped)
- Lazy loading preparado para rotas
- Cache headers otimizados para assets estáticos
- Componente de loading para Suspense

#### Infraestrutura
- **vercel.json** configurado com SPA fallback
- **Webhook Stripe** migrado para Vercel (`/api/stripe-webhook`)
- **.vercelignore** para ignorar arquivos Netlify
- **.gitignore** atualizado com padrões completos
- **manifest.json** melhorado para PWA

#### Documentação
- README completo com instruções de setup, deploy e troubleshooting
- Documentação de variáveis de ambiente
- Estrutura do projeto documentada
- Guia de contribuição com Conventional Commits

### 🔧 Modificado

#### Correções de Build
- Todos os imports relativos agora usam **extensões explícitas** (`.jsx`, `.js`)
- Resolvidos conflitos de ESLint
- Build sem warnings

#### Código
- TODOs removidos ou convertidos em issues rastreáveis
- `console.log` desnecessários removidos
- Variáveis não utilizadas corrigidas
- ErrorBoundary integrado com Sentry e PostHog

#### Configuração
- Payment Links agora usam variáveis de ambiente (`REACT_APP_LINK_PREMIUM_US`)
- Suporte para região BR e US
- Node.js 18.x definido em `package.json`

### 🗑️ Removido

- Pasta `netlify/` arquivada como `netlify.backup/`
- Dependências do Netlify removidas do deploy
- TODOs e FIXMEs do código

### 🔒 Segurança

- 9 vulnerabilidades npm identificadas (3 moderate, 6 high)
  - Relacionadas a dependências transitivas do `react-scripts`
  - Não afetam produção (apenas dev dependencies)
  - Monitoradas via Renovate para atualizações

### 📊 Métricas

#### Bundle Size
- **Main JS:** 195.91 kB (gzipped)
- **Main CSS:** 509 B (gzipped)
- **Total:** ~196 kB

#### Build
- **Tempo de build:** ~15-20s
- **Warnings:** 0
- **Errors:** 0

### 🎯 Próximos Passos (Roadmap)

#### Alta Prioridade
1. Conectar domínio custom na Vercel
2. Configurar Payment Link Premium US no Stripe
3. Testar fluxo E2E de pagamento
4. Implementar RLS policies no Supabase
5. Configurar webhook Stripe em produção

#### Média Prioridade
6. Criar agentes invisíveis (base/otimização/validação)
7. Implementar Serginho - Núcleo Inteligente
8. Testar PWA em Android/iOS
9. Lighthouse audit e otimizações
10. Testes E2E com Playwright

#### Baixa Prioridade
11. Migrar de CRA para Vite (futuro)
12. Implementar feature flags com PostHog
13. Dashboard de analytics interno
14. Sistema de notificações

---

## Como Ler Este Changelog

- **Adicionado** para novas funcionalidades
- **Modificado** para mudanças em funcionalidades existentes
- **Descontinuado** para funcionalidades que serão removidas
- **Removido** para funcionalidades removidas
- **Corrigido** para correções de bugs
- **Segurança** para vulnerabilidades corrigidas

