# ✅ Checklist Projeto RKMMax (Atualizado — 23/10/2025)
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


- **Produção:** https://rkmmax-app.vercel.app
- **GitHub:** https://github.com/kizirianmax/Rkmmax-app
- **Último deploy:** 23/10/2025
- **Status:** ✅ Funcionando
- **Bugs críticos:** 0

