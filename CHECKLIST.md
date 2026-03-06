# ✅ Checklist Projeto RKMMax (Atualizado — 23/10/2025)

## 2026-03-06 — fix(study-lab): migrar ferramentas de IA para backend Groq-only (sem chaves no frontend)

### O que foi feito
- Criado `api/study-lab.js` — endpoint serverless Groq-only que centraliza todas as chamadas de IA (Resumos, Flashcards, Mapas Mentais, Cronograma, Source-Proof)
- Criado `src/lib/studyLabClient.js` — substitui `StudyLabAI.js`; faz `POST /api/study-lab` sem expor chaves
- Removida dependência de `StudyLabAI.js` (Gemini frontend) em: `Flashcards.jsx`, `GeradorResumos.jsx`, `MapasMentais.jsx`, `SourceProof.jsx`
- `GROQ_API_KEY` já estava configurada na Vercel (Production + Preview) — nenhuma nova variável necessária

### Por quê
- `StudyLabAI.js` usava `REACT_APP_GEMINI_API_KEY` no frontend (exposta no bundle do browser)
- Requisito de segurança: todas as chamadas de IA devem passar pelo backend com chave server-side
- Provedor unificado: Groq (`llama-3.3-70b-versatile`) — sem Gemini, sem chaves no frontend

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `api/study-lab.js` | NOVO — endpoint Groq-only para todas as ferramentas de IA |
| `src/lib/studyLabClient.js` | NOVO — cliente frontend que chama `/api/study-lab` |
| `src/pages/Flashcards.jsx` | `import studyLabAI` → `import studyLabClient`; chamada atualizada |
| `src/pages/GeradorResumos.jsx` | `import studyLabAI` → `import studyLabClient`; chamada atualizada |
| `src/pages/MapasMentais.jsx` | `import studyLabAI` → `import studyLabClient`; chamada atualizada |
| `src/pages/SourceProof.jsx` | `import studyLabAI` → `import studyLabClient`; chamada atualizada |
| `CHECKLIST.md` | Esta entrada |

### ENV VAR necessária
- `GROQ_API_KEY` (Production + Preview) — **já configurada** na Vercel do projeto `rkmmax-hibrido`
- `REACT_APP_GEMINI_API_KEY` **não é mais necessária** (removida do fluxo de IA)

### Validação
- [ ] `POST /api/study-lab` com `{"tool":"resumo","texto":"..."}` retorna `{"success":true,"data":{...}}`
- [ ] `/gerador-resumos` → colar texto → clicar Gerar → resumo aparece sem prompt de chave
- [ ] `/flashcards` → colar texto → gerar → cards aparecem
- [ ] `/mapas-mentais` → colar texto + tema → gerar → mapa aparece
- [ ] `/source-proof` → inserir URLs → analisar → resultado aparece
- [ ] `/cronograma` → preencher → gerar → cronograma aparece (sem IA, 100% local)
- [ ] Nenhuma chave de API visível no bundle (DevTools → Sources)
- [ ] CI verde / Vercel preview ok

### Rollback
```bash
git revert <commit-hash>
```
Ou manualmente: remover `api/study-lab.js` e `src/lib/studyLabClient.js`; restaurar imports de `StudyLabAI.js` nas 4 páginas.

---

## 2026-03-06 — feat(study-lab): Study Lab 100% funcional — 6 ferramentas ativas

### O que foi feito
- Copiadas 5 páginas do `rkmmax-app` para `rkmmax-hibrido`: `Cronograma.jsx`, `Flashcards.jsx`, `GeradorResumos.jsx`, `MapasMentais.jsx`, `SourceProof.jsx`
- Copiado `src/lib/StudyLabAI.js` (serviço de IA Gemini para as ferramentas)
- Registradas 5 novas rotas no `src/App.jsx`: `/cronograma`, `/flashcards`, `/gerador-resumos`, `/mapas-mentais`, `/source-proof`
- Atualizado `src/pages/StudyLab.jsx`: todos os 6 cards agora têm `status: "Disponível"` e `action` funcional

### Por quê
- Study Lab estava mostrando "Em breve" para ferramentas que já existiam no `rkmmax-app`
- Ferramentas precisam estar no `rkmmax-hibrido` (repositório soberano de produção)

### Mapa Ferramenta → Origem → Destino

| Ferramenta | Origem (repo/arquivo) | Destino (rota) |
|---|---|---|
| 📝 Formatador ABNT/APA | `rkmmax-hibrido/src/pages/Abnt.jsx` | `/abnt` → `https://abnt.kizirianmax.site` (nova aba) |
| 📅 Gerador de Cronogramas | `rkmmax-app/src/pages/Cronograma.jsx` | `/cronograma` |
| 🔍 Source-Proof | `rkmmax-app/src/pages/SourceProof.jsx` | `/source-proof` |
| 📚 Gerador de Resumos | `rkmmax-app/src/pages/GeradorResumos.jsx` | `/gerador-resumos` |
| 🎯 Flashcards Inteligentes | `rkmmax-app/src/pages/Flashcards.jsx` | `/flashcards` |
| 🗺️ Mapas Mentais | `rkmmax-app/src/pages/MapasMentais.jsx` | `/mapas-mentais` |

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/lib/StudyLabAI.js` | NOVO (copiado de rkmmax-app) — serviço de IA Gemini |
| `src/pages/Cronograma.jsx` | NOVO (copiado de rkmmax-app) |
| `src/pages/Flashcards.jsx` | NOVO (copiado de rkmmax-app) |
| `src/pages/GeradorResumos.jsx` | NOVO (copiado de rkmmax-app) |
| `src/pages/MapasMentais.jsx` | NOVO (copiado de rkmmax-app) |
| `src/pages/SourceProof.jsx` | NOVO (copiado de rkmmax-app) |
| `src/App.jsx` | +5 imports + +5 rotas |
| `src/pages/StudyLab.jsx` | 5 cards: `status` → `"Disponível"`, `action` → `navigate(rota)` |
| `CHECKLIST.md` | Esta entrada |

### ENV VAR necessária para ferramentas de IA
- `REACT_APP_GEMINI_API_KEY` ou `REACT_APP_GOOGLE_API_KEY` (Production + Preview) no projeto Vercel `rkmmax-hibrido`
- Sem essa chave, Cronograma funciona (sem IA), mas Flashcards/Resumos/Mapas/SourceProof mostrarão erro de API

### Validação
- [ ] `/study` → todos os 6 cards mostram "Disponível" (nenhum "Em breve")
- [ ] `/study` → card ABNT → `/abnt` → botão abre `https://abnt.kizirianmax.site` em nova aba
- [ ] `/study` → card Cronograma → `/cronograma` → página carrega
- [ ] `/study` → card Source-Proof → `/source-proof` → página carrega
- [ ] `/study` → card Resumos → `/gerador-resumos` → página carrega
- [ ] `/study` → card Flashcards → `/flashcards` → página carrega
- [ ] `/study` → card Mapas Mentais → `/mapas-mentais` → página carrega
- [ ] CI verde / Vercel preview ok

### Rollback
```bash
git revert <commit-hash>
```
Ou manualmente: remover os 6 arquivos copiados, reverter App.jsx e StudyLab.jsx.

---

## 2026-03-06 — feat(abnt): rota interna /abnt + StudyLab apontando para ela (sem iframe)

### O que foi feito
- Criado `src/pages/Abnt.jsx` — página interna com botão "Abrir Formatador" (nova aba)
- Registrada rota `/abnt` no `src/App.jsx`
- Trocado o `action` do card ABNT no `src/pages/StudyLab.jsx` de link externo para `/abnt`
- URL do formatador isolada na constante `ABNT_URL` no topo do `Abnt.jsx` para fácil troca

### Por quê
- Link externo (`formatador-abnt.vercel.app`) abria versão incompleta/inconsistente
- `formatador-abnt-rkmmax.vercel.app` tem SSO + `X-Frame-Options: DENY` — iframe não funciona
- Rota interna mantém acesso controlado dentro do RKMMAX

### Arquivos alterados

| Arquivo | Mudança |
|---------|--------|
| `src/pages/Abnt.jsx` | NOVO — página interna /abnt com botão para abrir formatador em nova aba |
| `src/App.jsx` | +1 import + +1 rota `/abnt` |
| `src/pages/StudyLab.jsx` | Trocado link externo por `navigate("/abnt")` |
| `CHECKLIST.md` | Esta entrada |

### Validação
- [ ] Abrir `/study` → card "📝 Formatador ABNT/APA" → clicar → navega para `/abnt` (sem nova aba)
- [ ] Em `/abnt` → clicar "Abrir Formatador →" → abre `https://abnt.kizirianmax.site` em nova aba
- [ ] Link "← Voltar ao Study Lab" em `/abnt` → volta para `/study`
- [ ] Nenhuma outra tela foi afetada
- [ ] CI verde / Vercel preview ok

### Rollback
```bash
git revert <commit-sha>
```
Ou manualmente: remover `Abnt.jsx`, reverter linha em `App.jsx` (import + rota) e restaurar `StudyLab.jsx` com `window.open("https://formatador-abnt.vercel.app", "_blank")`.

### Para trocar a URL do formatador depois
Editar apenas a constante no topo de `src/pages/Abnt.jsx`:
```js
const ABNT_URL = "https://nova-url-do-formatador.vercel.app";
```

---

## 2026-03-05 — Feature: Rota /regulamento + Footer exclusivo

### O que foi feito
- Criado `src/pages/Regulamento.jsx` portando conteúdo do Rkmmax-app
- Registrada rota `/regulamento` no App.jsx
- Removido `<Footer />` global do App.jsx (footer agora só aparece dentro de /regulamento)
- Adicionado `scrollTo(0,0)` no mount do Regulamento para corrigir scroll

### Justificativa
Footer + normas estavam poluindo todas as telas. Regulamento precisa de uma rota dedicada. Link na Home apontava para 404.

### Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| `src/pages/Regulamento.jsx` | NOVO — página completa com conformidades, normas, políticas e footer |
| `src/App.jsx` | Adicionada rota /regulamento, removido Footer global |
| `CHECKLIST.md` | Esta entrada |

### Validação
- [ ] Abrir Home: campo de escrever NÃO fica escondido/espremido, footer pesado NÃO aparece
- [ ] Clicar "📜 Regulamento do Projeto" na Home → abre /regulamento
- [ ] Regulamento: footer + normas aparecem organizados; navegação não dá "pulo" de scroll
- [ ] Voltar para Home: página no topo, sem salto estranho
- [ ] /privacy, /terms, /refund continuam funcionando

### Rollback
git revert <commit-sha>
Legendas: ✅ feito | ⚠️ pendente | ⏭️ próximo

1) Infra / Vercel
- ✅ Importar repo no Vercel
- ✅ Framework: Create React App
- ✅ Variáveis no Vercel
  - REACT_APP_SUPABASE_URL
  - REACT_APP_SUPABASE_ANON_KEY
  - ✅ GROQ_API_KEY_FREE (tier gratuito)
  - ✅ GROQ_API_KEY_PAID (tier pago - fallback)
  - ⏭️ GEMINI_API_KEY_FREE (tier gratuito)
  - ⏭️ GEMINI_API_KEY_PAID (tier pago - fallback)
  - ⏭️ CLAUDE_API_KEY (sempre pago)
- ✅ Deploy produção (rkmmax-app.vercel.app)
- ⚠️ Conectar domínio custom no Vercel + SSL
- ⚠️ README final (documentar env, fluxo, segurança)

2) Stripe / Planos
- ✅ src/config/plans.json (6 planos BR/US)
- ✅ Payment Link – Premium BR no Subscribe.jsx
- ✅ Checkout BR abre (Stripe TEST)
- ⏭️ Payment Link – Premium US (criar e colar no Subscribe.jsx)
- ⚠️ Webhooks: decidir migração (Vercel) ou manter Netlify
- ⏭️ Fluxo E2E BR (pagamento de teste → retorno /success)

3) Controle de uso / Billing interno
- ✅ netlify/functions/_usage.js
- ✅ netlify/functions/guardAndBill.js (limites diário/mensal) — imports ok
- ✅ netlify/functions/chat.js (seleção de modelo + billing) — imports ok
- ✅ src/lib/planCaps.js unificado (PLAN, LIMITS, FEATURES, capsByPlan) — export default + nomeado
- ⏭️ (se usar) webhook Stripe para marcar Premium automático

4) Utilidades / Outros
- ✅ netlify/functions/cors.js
- ✅ netlify/functions/contact.js
- ✅ netlify/functions/status.js
- ⚠️ README de arquitetura

5) Avatares / UI
- ✅ public/avatars/
- ✅ src/data/avatars.json
- ✅ Integração no UI (Serginho + Especialistas)
- ✅ Avatar 3D do Serginho em toda interface
- ✅ Card de boas-vindas compacto e fixo
- ✅ Interface tipo WhatsApp (campo de texto otimizado)
- ✅ Botão Enviar redesenhado (circular com ícone)
- ⏭️ Revisão final dos 45 avatares

6) Testes / Qualidade
- ✅ ErrorBoundary testado (CrashSwitch e página Debug REMOVIDOS do build)
- ⏭️ Testar PWA (Android/iOS)
- ⏭️ Testar checkout US
- ⚠️ Testar Webhook Stripe em produção
- ⚠️ Revisar CORS e headers de segurança
- ⚠️ Documentar variáveis .env no README

7) Agentes Visíveis
- ✅ 45 agentes conectados (Serginho + 44 especialistas)
- ✅ Descrições configuradas
- ✅ Sistema de visibilidade (Settings)
- ✅ Chat individual para cada especialista
- ⏭️ Conferência visual final (avatares e textos)

8) Abort / Cancellation Pipeline
- ✅ Phase A1: Propagate options.signal to fetch()
- ✅ Phase A2: AbortError as neutral cancellation
- ✅ Phase A3: Deadline/timeoutMs with internal AbortController
- ✅ Phase A3.1: Clean shutdown (no dangling timers/listeners)
- ✅ Phase A3.2: JSDoc documentation for timeoutMs/deadlineMs

9) Agentes Ocultos
- ⚠️ Criar especialistas invisíveis (base/otimização/validação)
- ⚠️ Acesso apenas via Serginho
- ⚠️ Orquestração p/ reduzir custo (menos GPT-5, mais GPT-4 mini + ocultos)

9) Serginho — Núcleo Inteligente
- ⚠️ Aprendizado ilimitado (fontes confiáveis)
- ⚠️ Balanceamento automático
- ⚠️ Delegar tarefas a ocultos
- ⚠️ Evolução contínua (mais agentes ocultos)

10) Fluxo Premium / UX
- ✅ Tela padrão: botão "Falar com Serginho"
- ✅ Básico/Intermediário → só Serginho
- ✅ Premium → botão "Explorar Especialistas"
- ✅ PlanGate ativo (decide Basic/Premium via /api/me-plan + e-mail no localStorage)
- ✅ /success salva e-mail no localStorage (marcação Premium temporária)
- ⏭️ Automatizar marcação Premium pós-compra (webhook Stripe → Supabase/API)

11) Banco de Dados / Supabase
- ✅ pgvector movido de public → extensions
- ✅ Auth reforçada: 8+ chars; lower+UPPER+digits+símbolos; OTP 600s; Secure email change ON
- ✅ Restart Postgres
- ✅ Security Advisor sem Errors
- ⚠️ Avisos ok no Free: Leaked Password Protection (Pro); patches de Postgres (informativo)
- ⏭️ RLS/Policies em user_profiles, trusted_chunks, user_actions/embeddings

12) Integração Vercel ↔ Netlify
- ✅ src/lib/fnClient.js (fallback: /api → /.netlify/functions)
- ⏭️ Passo 2: trocar fetch('/.netlify/functions/...') por callFn('/...')
- (opcional) ⚠️ src/patchNetlifyFetch.js + import em src/index.js
- ✅ Deploys automáticos no Netlify (último: Published; imports ok)

13) Sistema de Fallback Automático (NOVO!)
- ✅ api/chat.js - Fallback FREE → PAGO para Serginho
- ✅ api/specialist-chat.js - Fallback FREE → PAGO para especialistas
- ✅ src/services/apiFallback.js - Serviço centralizado de fallback
- ✅ Contador de uso em memória (resetado diariamente)
- ✅ Logs de uso (tier free vs paid)
- ✅ Resposta inclui estatísticas de uso
- ⏭️ Implementar fallback para Gemini Flash
- ⏭️ Implementar fallback para Claude 3.5
- ⏭️ Dashboard de monitoramento de custos
- ⏭️ Alertas quando atingir 80% do limite FREE

14) Planos e Precificação (NOVO!)
- ✅ Definição de planos:
  * Básico: R$ 25 (200 req/dia, Groq)
  * Intermediário: R$ 50 (500 req/dia, Groq + Voz)
  * Premium: R$ 90 (200 req/dia, 95% Groq + 5% Gemini)
  * Ultra: R$ 199 (400 req/dia, 99% Groq + 1% Claude)
- ✅ Cálculo de margem de lucro (30-75%)
- ✅ Análise de viabilidade financeira
- ⏭️ Implementar limites por plano no backend
- ⏭️ Atualizar página de assinatura com novos planos
- ⏭️ Implementar sistema de créditos/tokens

15) Documentação Técnica
- ✅ docs/ARQUITETURA_AGENTES.md (373 linhas)
- ✅ VARIAVEIS_AMBIENTE_COMPLETO.md (18 variáveis)
- ✅ RELATORIO_FINAL_RKMMAX.md
- ✅ RESUMO_EXECUTIVO_RKMMAX.md
- ⏭️ Documentar sistema de fallback
- ⏭️ Guia de configuração de API keys
- ⏭️ Troubleshooting comum

16) Melhorias de UX/UI
- ✅ Avatar do Serginho consistente em toda interface
- ✅ Card de boas-vindas compacto e fixo (sticky)
- ✅ Campo de texto tipo WhatsApp
- ✅ Botão Enviar circular com ícone
- ✅ Avatars dos especialistas (diminuídos)
- ✅ Botão "Conversar" com gradiente e hover
- ⏭️ Suporte a upload de imagens (GPT-4 Vision)
- ⏭️ Histórico de conversas persistente
- ⏭️ Markdown rendering nas respostas
- ⏭️ Code highlighting

## 📊 Status Geral do Projeto

### ✅ Concluído (80%)
- Infraestrutura básica
- Sistema de agentes (45 especialistas)
- Chat funcional (Serginho + Especialistas)
- Sistema de visibilidade
- Fallback automático FREE → PAGO
- Planos e precificação definidos
- Documentação técnica

### ⏭️ Próximos Passos (15%)
- Implementar limites por plano
- Dashboard de monitoramento
- Gemini e Claude fallback
- Melhorias de UX (markdown, code highlighting)

### ⚠️ Pendente (5%)
- Domínio custom
- Webhooks Stripe
- PWA testing
- Agentes ocultos

## 💰 Estimativa de Custos

### Fase Inicial (0-80 usuários):
- **Custo:** R$ 0/mês (tier FREE)
- **Receita:** R$ 0-4.000/mês
- **Lucro:** 100% da receita

### Crescimento (80-500 usuários):
- **Custo:** R$ 200-1.000/mês (FREE + PAGO)
- **Receita:** R$ 4.000-25.000/mês
- **Lucro:** R$ 3.800-24.000/mês

### Escala (500+ usuários):
- **Custo:** R$ 1.000-3.000/mês
- **Receita:** R$ 25.000-100.000/mês
- **Lucro:** R$ 22.000-97.000/mês

## Phase A4 — Soberania de Entrada Única (Gateway obrigatório)
- ✅ `api/chat.js` streaming path redirected to Serginho
- ✅ `api/lib/engine-orchestrator.js` deprecated (no longer imported by routes)
- ✅ Anti-bypass tests added (`api/__tests__/a4-gateway-sovereignty.test.js`)
- ✅ All `api/` route handlers use `serginho.handleRequest()` exclusively

## Phase A5.1 — Fail-Fast Enforcement (engine-orchestrator hard-ban)
- ✅ `orchestrateEngines()` now throws immediately: "Deprecated: Use serginho-orchestrator.js as the single AI gateway (Phase A5)."
- ✅ No provider calls can execute through engine-orchestrator.js
- ✅ File retained for import compatibility (no deletion)
- ✅ Test added: `api/__tests__/a4-gateway-sovereignty.test.js` → Test 5


## Phase A5.2 — Hybrid Endpoint Stability Fix
- ✅ `api/hybrid.js` — Added env var guard (GEMINI_API_KEY / GROQ_API_KEY check) before calling betinhoParallel
- ✅ `api/hybrid.js` — Fixed error message matching: Portuguese "todos os providers falharam" from betinhoParallel now correctly maps to 503 (was falling through to generic 500)
- ✅ Root cause: missing env guard + error message language mismatch
- ✅ Rollback: revert these 2 changes in api/hybrid.js
- ✅ Validation: POST /api/hybrid → returns 503 with helpful message when providers are down (not 500)


## Phase A5.3 — Hybrid Groq-only Safe Mode
- ✅ `api/lib/providers-config.js` — Added `getEnabledProviders()`: filters providers by available env vars at runtime
- ✅ `api/lib/providers-config.js` — Added `parseProviderWeights()`: scaffolding for future weighted routing (reads HYBRID_PROVIDER_WEIGHTS env var)
- ✅ `api/lib/serginho-orchestrator.js` — `betinhoParallel()` now uses `getEnabledProviders()` instead of `Object.keys(PROVIDERS)`
- ✅ `api/lib/serginho-orchestrator.js` — Single-provider safe mode: when only 1 provider is enabled, executes directly without Promise.any race
- ✅ `api/hybrid.js` — Updated hint message: "Configure GROQ_API_KEY (Gemini is optional)"
- ✅ Tests added for `getEnabledProviders`, `parseProviderWeights`, and static verification
- ✅ Root cause: `betinhoParallel()` was racing ALL 6 providers regardless of env vars, causing Gemini failures when only Groq is configured
- ✅ Rollback: revert changes in providers-config.js, serginho-orchestrator.js, and hybrid.js
- ✅ Validation: POST /api/hybrid with only GROQ_API_KEY → works without Gemini errors


## Phase A5.4 — Hybrid Weights Routing + 120B Default
- ✅ `api/lib/providers-config.js` — Added `getWeightedProviders()`: deterministic provider selection using HYBRID_PROVIDER_WEIGHTS or defaulting to llama-120b
- ✅ `api/lib/providers-config.js` — `parseProviderWeights()` (from A5.3) now actively consumed by `getWeightedProviders()`
- ✅ `api/lib/serginho-orchestrator.js` — `betinhoParallel()` now uses `getWeightedProviders()` instead of `getEnabledProviders()` directly
- ✅ `api/lib/serginho-orchestrator.js` — Default behavior: single-provider mode with llama-120b (no race, fully deterministic)
- ✅ Tests: `getWeightedProviders()` — no weights → llama-120b; with weights → respects order; ignores disabled; Groq-only never includes Gemini
- ✅ Static test: serginho-orchestrator.js uses getWeightedProviders (a4-gateway-sovereignty.test.js → Test 8)
- **What**: Make `/api/hybrid` 100% deterministic — default to llama-120b, configurable via HYBRID_PROVIDER_WEIGHTS
- **Why**: With only GROQ_API_KEY, betinhoParallel was racing 4 Groq providers (non-deterministic). Now defaults to llama-120b single-mode.
- **Files**: `api/lib/providers-config.js`, `api/lib/serginho-orchestrator.js`, `api/__tests__/providers-config.test.js`, `api/__tests__/a4-gateway-sovereignty.test.js`, `CHECKLIST.md`
- **Validation**: `npm test`; POST /api/hybrid with only GROQ_API_KEY → 200 + uses llama-120b
- **Rollback**: Revert `getWeightedProviders()` in providers-config.js; revert betinhoParallel() to use `getEnabledProviders()` directly; remove tests; remove A5.4 section from CHECKLIST.md


## Phase A5.5 — Hybrid Smoke Test (Groq-only, default 120B)
- ✅ `api/__tests__/hybrid-determinism.test.js` — New smoke test file (4 test suites):
  - Test A: `betinhoParallel` mocked → asserts `forceProvider: 'llama-120b'` + `source: 'single'` + called once
  - Test B: `getWeightedProviders()` returns `['llama-120b']` only (no Gemini) in Groq-only mode
  - Test C: No mandatory Gemini dependency — all enabled providers are Groq; no top-level Gemini key guards
  - Test D: Static check — `betinhoParallel()` body uses `getWeightedProviders()` (not `getEnabledProviders()` directly)
- ✅ No production code changes (test-only + docs)
- ✅ No new dependencies
- **What**: Validate A5.4 determinism end-to-end — smoke test confirming betinhoParallel selects llama-120b in Groq-only mode
- **Why**: A5.4 added the logic; A5.5 adds CI-enforceable proof that the invariant holds
- **Files**: `api/__tests__/hybrid-determinism.test.js`, `CHECKLIST.md`
- **Validation**: `npm test` (all green, including new hybrid-determinism suite)
- **Rollback**: Delete `api/__tests__/hybrid-determinism.test.js`; remove A5.5 section from CHECKLIST.md


## Phase A5.6 — Fallback Uses Provider Names + Skips Disabled Providers
- ✅ `api/lib/serginho-orchestrator.js` — Change A: `providerName: currentProvider` added to successful `attemptedModels.push()`
- ✅ `api/lib/serginho-orchestrator.js` — Change B: `providerName: currentProvider` added to failed `attemptedModels.push()`
- ✅ `api/lib/serginho-orchestrator.js` — Change C: `getNextFallback` now uses `a.providerName` (not `a.modelId`); while-loop skips disabled providers
- ✅ `api/__tests__/hybrid-determinism.test.js` — Test E added: static assertions that `providerName` is in push calls, `getNextFallback` uses `providerName`, and the skip-disabled while-loop is present
- **What**: Fix fallback chain to use provider names instead of model IDs; skip disabled providers in fallback
- **Why**: Provider names and model IDs differ (e.g., `llama-120b` vs `llama-3.3-70b-versatile`); deduplication was broken and disabled providers were attempted
- **Files**: `api/lib/serginho-orchestrator.js`, `api/__tests__/hybrid-determinism.test.js`, `CHECKLIST.md`
- **Validation**: `npm test`; POST /api/hybrid with only GROQ_API_KEY should never attempt Gemini providers
- **Rollback**: Revert the 3 changes in `serginho-orchestrator.js` (remove `providerName` from `attemptedModels`, restore original `getNextFallback` call); remove Test E from `hybrid-determinism.test.js`


## Phase A5.5 — Health endpoint + Hybrid smoke test (incubadora-ready)

**O que:** Adicionado GET /api/health para observabilidade de saúde do sistema + smoke test do hybrid em modo Groq-only.

**Por quê:** Maturidade de produto (incubadora-ready). Sistema precisa de endpoint observável para monitoria e validação determinística do pipeline híbrido.

**Arquivos:**
- `api/health.js` (atualizado) — endpoint de saúde simplificado com campos obrigatórios
- `api/__tests__/health-and-hybrid-smoke.test.js` (novo) — smoke tests
- `CHECKLIST.md` — esta entrada

**Estado resultante:**
- GET /api/health responde 200 com status, commit, providers
- Smoke test garante Groq-only determinístico
- Fallback não tenta providers desabilitados

**Impacto arquitetural:** Não. Adição pura, sem alteração de fluxo existente.

**Validação:**
- `npm test` — todos os testes passam
- `curl GET /api/health` — responde 200 com JSON correto
- Deploy preview verde

**Rollback:**
- Restaurar `api/health.js` para versão anterior
- Remover arquivo de teste `api/__tests__/health-and-hybrid-smoke.test.js`
- Reverter entrada no CHECKLIST.md


- **Produção:** https://rkmmax-app.vercel.app
- **GitHub:** https://github.com/kizirianmax/Rkmmax-app
- **Último deploy:** 23/10/2025
- **Status:** ✅ Funcionando
- **Bugs críticos:** 0

## Protocolo Oficial de Operações no Repositório

> Toda alteração neste repositório deve ser documentada seguindo este protocolo.
> Objetivo: rastreabilidade, governança e reversibilidade de cada operação.

### Template de Registro de Operação

```md
### [DATA] — [TIPO DE OPERAÇÃO]
- **O que foi feito:** descrição objetiva
- **Justificativa:** por que foi necessário
- **Estado resultante:** o que mudou no sistema
- **Impacto arquitetural:** sim/não — se sim, ver docs/[ARQUIVO].md
- **Commit:** hash e mensagem
- **PR:** número e link (se aplicável)
```

### Tipos de Operação
- `Feature` — nova funcionalidade
- `Fix` — correção de bug
- `Refactor` — reestruturação sem mudança funcional
- `Docs` — atualização de documentação
- `Test` — adição/alteração de testes
- `Config` — mudança de configuração (env, CI, deploy)
- `Governance` — mudança no protocolo ou processo

### Histórico de Operações

### 2026-03-01 — Formalização do Protocolo de Operações
- **O que foi feito:** Adicionada seção "Protocolo Oficial de Operações no Repositório" ao CHECKLIST.md
- **Justificativa:** Estabelecer governança e rastreabilidade para todas as operações futuras
- **Estado resultante:** CHECKLIST.md agora inclui template e regras de documentação de operações
- **Impacto arquitetural:** não
- **Commit:** commit desta PR
- **PR:** [#119](https://github.com/kizirianmax/rkmmax-hibrido/pull/119)



---

## Consolidação: rkmmax-hibrido como Repositório Soberano (2026-03-04)

> Esta seção documenta a migração definitiva de `rkmmax-app` → `rkmmax-hibrido` como fonte de verdade.

### Domínio e DNS

| Item | Status | Detalhe |
|---|---|---|
| `kizirianmax.site` → `rkmmax-hibrido` | ✅ Concluído | Primary domain configurado |
| `www.kizirianmax.site` → redirect 308 | ✅ Concluído | Redireciona para `kizirianmax.site` |
| `rkmmax-app` sem domínio principal | ✅ Concluído | Apenas `rkmmax-app.vercel.app` |
| Service Worker v1.5 + kill switch | ✅ Concluído | PR #125 mergeado |

### ENV Vars — Status no Vercel (rkmmax-hibrido)

| Variável | Status | Ação Necessária |
|---|---|---|
| `GROQ_API_KEY` | ✅ Configurada | — |
| `GEMINI_API_KEY` | ⏭️ Pendente | Inserir manualmente |
| `SUPABASE_URL` | ⏭️ Pendente | Inserir manualmente |
| `SUPABASE_SERVICE_ROLE_KEY` | ⏭️ Pendente | Inserir manualmente |
| `REACT_APP_SUPABASE_URL` | ⏭️ Pendente | Copiar do rkmmax-app |
| `REACT_APP_SUPABASE_ANON_KEY` | ⏭️ Pendente | Copiar do rkmmax-app |
| `STRIPE_SECRET_KEY_RKMMAX` | ⏭️ Pendente | Inserir manualmente |
| `STRIPE_WEBHOOK_SECRET` | ⏭️ Pendente | Inserir manualmente |
| `REACT_APP_STRIPE_PAYMENT_LINK_BASIC_BR` | ⏭️ Pendente | Copiar do rkmmax-app |
| `REACT_APP_STRIPE_PAYMENT_LINK_BASIC_US` | ⏭️ Pendente | Copiar do rkmmax-app |
| `REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_BR` | ⏭️ Pendente | Copiar do rkmmax-app |
| `REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_US` | ⏭️ Pendente | Copiar do rkmmax-app |
| `REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_BR` | ⏭️ Pendente | Copiar do rkmmax-app |
| `REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_US` | ⏭️ Pendente | Copiar do rkmmax-app |
| `GITHUB_TOKEN` | ⏭️ Pendente | Copiar do rkmmax-app |
| `GITHUB_REPO` | ⏭️ Pendente | Valor: `kizirianmax/rkmmax-hibrido` |
| `GITHUB_OAUTH_CLIENT_ID` | ⏭️ Pendente | Inserir manualmente |
| `GITHUB_OAUTH_CLIENT_SECRET` | ⏭️ Pendente | Inserir manualmente |
| `GITHUB_OAUTH_REDIRECT_URI` | ⏭️ Pendente | Valor: `https://kizirianmax.site/api/auth/github/callback` |
| `RESEND_API_KEY` | ⏭️ Pendente | Inserir manualmente |
| `FROM_EMAIL` | ⏭️ Pendente | Valor: `noreply@kizirianmax.site` |

### Validação Final (executar após configurar ENV vars + redeploy)

```bash
# 1. Health check
curl -s https://kizirianmax.site/api/health | python3 -m json.tool
# Esperado: groq=true, gemini=true, service=rkmmax-hibrido

# 2. Domínio principal (sem redirect)
curl -sI https://kizirianmax.site/ | head -3
# Esperado: HTTP/2 200

# 3. www redirect
curl -sI https://www.kizirianmax.site/ | head -3
# Esperado: HTTP/2 308 + location: https://kizirianmax.site/
```

### Rollback

Para reverter para `rkmmax-app` como produção:
1. Remover `kizirianmax.site` das configurações de domínio do `rkmmax-hibrido` na Vercel
2. Adicionar `kizirianmax.site` de volta ao `rkmmax-app` na Vercel
3. Fazer redeploy do `rkmmax-app`

### 2026-03-04 — Config: Consolidação de Domínio e ENV Vars
- **O que foi feito:** `.env.example` atualizado com todas as variáveis necessárias; `CHECKLIST.md` atualizado com status de consolidação; domínio `kizirianmax.site` configurado como primary no `rkmmax-hibrido`
- **Justificativa:** Tornar `rkmmax-hibrido` a única fonte de verdade para produção, eliminando dependência do `rkmmax-app`
- **Estado resultante:** `.env.example` documenta 21 variáveis críticas + 9 opcionais; CHECKLIST.md tem status de cada variável
- **Impacto arquitetural:** não — apenas documentação e configuração
- **PR:** #126


## 🎨 Restauração Frontend Novo (Tema Azul Profissional)

**Data:** 2026-03-04  
**O quê:** Portado o visual "novo/evoluído" do Rkmmax-app para rkmmax-hibrido  
**Por quê:** O visual em produção estava com o tema "antigo" multicolorido; o tema azul profissional é mais elegante e coerente

### Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| `src/pages/Home.jsx` | Tema azul profissional: hero dark overlay, CTAs em tons de azul, info card azul, sem banner beta, layout limpo |
| `src/components/Header.jsx` | flexWrap, gap 12, alignItems center no nav |
| `CHECKLIST.md` | Esta documentação |

### Validação
- [ ] Abrir `/` (Home) — tema azul profissional visível (hero escuro com texto branco, CTAs azuis)
- [ ] Navegar `/serginho` — padrão visual mantido
- [ ] Navegar `/hybrid` — funcionalidade mantida

### Rollback
```bash
git revert <commit-sha>
```
Ou restaurar os arquivos antigos do commit anterior.

---

## 16. Fix: Hybrid endpoint enforces openai/gpt-oss-120b (Groq-only, no fallback)

| Item | Detalhe |
|------|---------|
| **O quê** | `/api/hybrid` agora usa EXATAMENTE `openai/gpt-oss-120b` via Groq, sem fallback |
| **Por quê** | Provider `llama-120b` mapeava para `llama-3.3-70b-versatile` (70B errado). `betinhoParallel()` fazia race entre providers mascarando erros |
| **Arquivos** | `api/lib/providers-config.js`, `api/hybrid.js`, `CHECKLIST.md` |
| **Validação** | 1) POST `/api/hybrid` → Vercel Logs deve mostrar `[HYBRID] provider=groq model=openai/gpt-oss-120b groqOnly=true` 2) Resposta 200 deve ter `model.modelId` = `openai/gpt-oss-120b` 3) Se GROQ_API_KEY ausente → 503 |
| **Rollback** | `git revert <commit>` — volta para `betinhoParallel()` com 70B |

## Phase A5.7 — Disable Gemini When No Google Key (Minimal Guard)

**O que:** Added runtime guard to prevent Gemini providers from being selected or forced when `GOOGLE_API_KEY` is absent.

**Por quê:** Although `getEnabledProviders()` already filters Gemini, two code paths could still attempt Gemini: (1) `forceProvider` in `_handleStructured()` bypassed the enabled check, and (2) `api/transcribe.js` hardcoded `forceProvider: 'gemini-2.0-flash'`.

**Arquivos:**
- `api/lib/serginho-orchestrator.js` — Added guard in `_handleStructured()`: if `forceProvider` is not in enabled list, falls back to auto-routed provider with warning log
- `api/transcribe.js` — Added `getEnabledProviders()` check before forcing gemini-2.0-flash; omits `forceProvider` if Gemini is disabled
- `CHECKLIST.md` — This entry

**Estado resultante:**
- With `GOOGLE_API_KEY` absent, ALL routes (`/api/chat`, `/api/specialist-chat`, `/api/hybrid`, `/api/transcribe`, `/api/ai`) use only Groq providers
- `forceProvider` for disabled providers produces a warning log + graceful fallback (no crash)
- No providers removed from `PROVIDERS` object (guard-only)
- Existing tests continue to pass

**Impacto arquitetural:** Não. Guard-only, no new dependencies, no routing logic changes.

**Validação:**
- `npm test` — all tests pass
- With `GOOGLE_API_KEY` empty: Vercel Logs show only groq providers; no `gemini-*` selection
- `POST /api/transcribe` with no Google key → falls back to Groq auto-route (no crash)
- `POST /api/hybrid` → unchanged (already forces llama-120b)

**Rollback:**
- Revert the guard in `serginho-orchestrator.js` (remove the `if (options.forceProvider && !enabledProvidersList.includes(...))` block)
- Revert `transcribe.js` to hardcode `forceProvider: 'gemini-2.0-flash'`
- Remove A5.7 section from `CHECKLIST.md`

## Fix: Serginho markdown rendering (formatação "tudo grudado")

| Item | Detalhe |
|------|---------|
| **O quê** | Aplicou renderização de markdown simples nas mensagens do agente em `/serginho`, usando o mesmo padrão `SimpleMarkdown` já existente em `/hybrid` |
| **Por quê** | Respostas do Serginho apareciam "tudo junto" sem parágrafos, quebras de linha, negrito ou code — diferente do `/hybrid` onde já estava resolvido |
| **Arquivos** | `src/pages/Serginho.jsx` (adicionou `SimpleMarkdown` local + usou no render), `src/pages/Serginho.css` (estilos para `<p>`, `<code>`, `<strong>` dentro de `.message-bubble`), `CHECKLIST.md` |
| **Validação** | 1) Abrir `/serginho`, perguntar algo que gere lista/títulos → aparece com parágrafos e quebras 2) Input/scroll/chat não quebram 3) Mensagens do usuário continuam como texto simples |
| **Rollback** | `git revert <commit>` — remove SimpleMarkdown e CSS, volta ao `{msg.content}` raw |
