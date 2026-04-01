# ✅ Checklist Projeto RKMMax (Atualizado — 23/10/2025)

## 2026-04-01 — fix(boot): tela branca — process.env → import.meta.env + remoção de resíduos Gemini/Google

### O que foi feito
- Corrigido `src/api/SecretManager.js`: `process.env[name]` → `import.meta.env[name]` em `_getEnvVar()`
- Removido bloco `gemini` completo de `SecretManager.js` (chave, isConfigured, logs, validação, getStatus) — Gemini/Google não existem mais no projeto
- Removidas vars `REACT_APP_GEMINI_API_KEY` / `VITE_GEMINI_API_KEY` — não há mais suporte nem fallback para Gemini/Google
- Corrigido `src/lib/sentry.js`: 4 ocorrências de `process.env.*` → `import.meta.env.*`
- Corrigido `src/lib/analytics.js`: 4 ocorrências de `process.env.*` → `import.meta.env.*`

### Por que quebrou
`process.env` é `undefined` no browser com Vite (sem polyfill). `SecretManager._getEnvVar()` acessava `process.env[name]` → `TypeError` lançado na fase de inicialização do módulo, antes do React montar → tela branca total.

### Causa raiz
`src/api/SecretManager.js` linha 74: `process.env[name]` em contexto de browser Vite.

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/api/SecretManager.js` | `process.env[name]` → `import.meta.env[name]`; remoção completa de resíduos Gemini/Google |
| `src/lib/sentry.js` | 4× `process.env.*` → `import.meta.env.*` |
| `src/lib/analytics.js` | 4× `process.env.*` → `import.meta.env.*` |
| `CHECKLIST.md` | Esta entrada |

### Declaração explícita
**Não há mais suporte, fallback, chave, log, validação nem referência a Gemini/Google nos arquivos `src/api/SecretManager.js`, `src/lib/sentry.js` e `src/lib/analytics.js`.**

### Variáveis de ambiente após a correção

| Var antes | Var depois | Arquivo |
|---|---|---|
| `REACT_APP_SENTRY_DSN` | `VITE_SENTRY_DSN` | `sentry.js` |
| `REACT_APP_VERSION` | `VITE_APP_VERSION` | `sentry.js` |
| `REACT_APP_POSTHOG_KEY` | `VITE_POSTHOG_KEY` | `analytics.js` |
| `REACT_APP_POSTHOG_HOST` | `VITE_POSTHOG_HOST` | `analytics.js` |
| `process.env.NODE_ENV` | `import.meta.env.MODE` | `sentry.js`, `analytics.js` |
| `REACT_APP_GEMINI_API_KEY` / `VITE_GEMINI_API_KEY` | **removidas** | `SecretManager.js` |

### Validação
1. App abre normalmente — sem tela branca ✅
2. SecretManager inicializa sem crash ✅
3. Home, Serginho, Híbrido, Especialistas, Projetos, Study sem regressão ✅
4. Nenhuma referência a Gemini/Google nos 3 arquivos permitidos ✅
5. Sentry e PostHog continuam desabilitados silenciosamente se vars não configuradas ✅
6. Arquitetura, prompts, roteamento, identidade das camadas, backend intocados ✅

### Risco de regressão
Mínimo. As vars `REACT_APP_*` e `process.env.NODE_ENV` nunca funcionaram no browser com Vite — não há regressão funcional real. Sentry e PostHog continuam com comportamento idêntico (desabilitados se var ausente).

### Rollback
```bash
git revert <commit-sha>
# Restaura process.env nos 3 arquivos e o bloco gemini em SecretManager.js
```

---

## 2026-03-22 — docs+prompt: auditoria e descontinuação do repositório kizirian-max-site

### O que foi feito
- Auditoria comparativa entre `kizirianmax/kizirian-max-site` (legado) e `kizirianmax/rkmmax-hibrido` (destino)
- Absorção pontual de ativadores de profundidade no prompt do Serginho (`src/prompts/geniusPrompts.js`)
- Registro formal da descontinuação do repositório `kizirian-max-site`

### Conclusão da auditoria
O `rkmmax-hibrido` superou o `kizirian-max-site` em prompt-base, arquitetura e comportamento do Serginho. O repositório legado não possui dependência estrutural real no sistema atual.

**Classificação do conteúdo legado:**
- A maior parte do conteúdo foi classificada como **regressão**, **cosmético** ou **fora de escopo**
- O único valor absorvível identificado foi um conjunto de **ativadores de profundidade** (hardSignals), integrados como micro-refinamento no prompt do Serginho
- Nenhum código, função, roteamento ou provider do legado foi trazido

### Declaração explícita
**O repositório `kizirian-max-site` está descontinuado e apto para exclusão. Não há dependência estrutural real dele no `rkmmax-hibrido`.**

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/prompts/geniusPrompts.js` | Adicionado bloco "ATIVADORES DE PROFUNDIDADE" no `SERGINHO_GENIUS_PROMPT` |
| `CHECKLIST.md` | Esta entrada de descontinuação |
| `README.md` | Nota curta de governança sobre repositórios legados |

### Validação
1. Prompt do Serginho recebeu ativadores de profundidade ✅
2. CHECKLIST registra descontinuação do `kizirian-max-site` ✅
3. README atualizado com nota de governança mínima ✅
4. Especialistas (`SPECIALIST_GENIUS_PROMPT`) não foram afetados ✅
5. Híbrido (`HYBRID_GENIUS_PROMPT`) não foi afetado ✅
6. Nenhum roteamento, provider ou código legado trazido ✅
7. Escopo permaneceu pequeno (3 arquivos) ✅

### Rollback
```bash
git revert <commit-sha>
```

---

## 2026-03-21 — docs(governance): encerramento formal da fase estrutural dos especialistas + descontinuação do Rkmmax-app

### O que foi feito
- Registrado formalmente o encerramento da fase estrutural dos especialistas no `rkmmax-hibrido`
- Documentada a conclusão das limpezas estruturais, de domínio e residuais
- Registrada a conclusão da verificação de descontinuação do repositório `Rkmmax-app`

### Por quê
A fase estrutural dos especialistas foi concluída com os PRs #202–#231 (2026-03-20 a 2026-03-21). O trabalho incluiu:
- Eliminação de sobreposição de domínio entre especialistas (#202)
- Elevação comportamental e calibração de systemPrompts (#207, #208, #209)
- Ancoragem de prompts por domínio (#217)
- Remoção de código legado morto (HybridAgent.jsx — #216, engine-orchestrator legacy — #225)
- Consolidação do fluxo de execução dos especialistas (#225)
- Contenção de domínio e redirecionamento de escopo (#226)
- Remoção de resíduos Gemini/OpenAI do backend (#227) e frontend (#229)
- Limpeza de documentação e alinhamento Groq-only (#228, #230, #231)

### Estado consolidado — fase estrutural concluída ✅

| Componente | PR(s) | Estado |
|---|---|---|
| Eliminação de sobreposição de domínio entre especialistas | #202 | ✅ merged 2026-03-20 |
| Logging mínimo de uso de especialistas | #203 | ✅ merged 2026-03-20 |
| Elevação comportamental de 10 especialistas sub-especificados | #207 | ✅ merged 2026-03-20 |
| Calibração de systemPrompts — Fase 3A (synth, sec, data, orac, focus) | #208 | ✅ merged 2026-03-20 |
| Calibração de 23 especialistas sub-especificados — Fase 3B | #209 | ✅ merged 2026-03-20 |
| Consolidação do fluxo de execução + remoção engine-orchestrator legacy | #225 | ✅ merged 2026-03-21 |
| Contenção de domínio + redirecionamento de escopo | #226 | ✅ merged 2026-03-21 |
| Remoção resíduos Gemini/OpenAI do backend | #227 | ✅ merged 2026-03-21 |
| Remoção resíduos non-Groq do frontend | #229 | ✅ merged 2026-03-21 |
| Limpeza de docs + alinhamento Groq-only | #228, #230, #231 | ✅ merged 2026-03-21 |
| Remoção HybridAgent.jsx legado | #216 | ✅ merged 2026-03-21 |
| Ancoragem de SPECIALIST_GENIUS_PROMPT por domínio | #217 | ✅ merged 2026-03-21 |

### Declaração explícita
**Não há pendência estrutural real para concluir a fase dos especialistas no `rkmmax-hibrido`.**

---

### Verificação de descontinuação do repositório Rkmmax-app

**Conclusão: O repositório `Rkmmax-app` pode ser oficialmente considerado descontinuado e apto para exclusão.**

**Justificativa:**
1. **Absorção funcional concluída** — Registrada formalmente em 2026-03-15 (PR #195). Todos os fluxos críticos de planos migrados.
2. **Absorção estrutural dos especialistas concluída** — Registrada nesta entrada (PRs #202–#231). Todos os systemPrompts calibrados, domínios contidos, código legado removido.
3. **Não há dependência de código real** — O `rkmmax-hibrido` é 100% autossuficiente. Nenhum `import`, `require`, ou chamada de API depende do `Rkmmax-app`.
4. **Referências residuais identificadas** — Existem referências cosméticas ao nome `Rkmmax-app` ou `rkmmax-app.vercel.app` em:
   - `src/services/emailService.js` (URLs de template de email)
   - `src/pages/Help.jsx` (link para GitHub Issues)
   - `api/stripe-webhook.js` (URLs de template de email)
   - Documentação legada: `DEPLOY.md`, `HYBRID_SYSTEM_DEPLOYMENT.md`, `ALERTS_SETUP.md`, `CONFIGURAR_EMAIL_RESEND.md`, `ANALISE_REPOSITORIO_FINAL.md`, `VALIDACAO_FINAL.md`, `VARIAVEIS_VERCEL_FINAIS.md`

   **Estas são referências de texto/URL, não dependências de código. Podem ser atualizadas em um PR cosmético futuro independente, sem urgência e sem impacto funcional.**

5. **Produção apontada para `rkmmax-hibrido`** — O domínio `kizirianmax.site` já aponta para `rkmmax-hibrido` desde 2026-03-04.

> A absorção estrutural do `Rkmmax-app` → `rkmmax-hibrido` foi concluída. Não há pendência estrutural real restante. O repositório `Rkmmax-app` pode ser tratado como **descontinuado / apto para exclusão**. Referências cosméticas residuais (URLs em templates de email e docs legados) podem ser limpas em um PR cosmético futuro, sem urgência.

### Pendências remanescentes — classificadas como COSMÉTICO / BAIXA PRIORIDADE

| Categoria | Item | Urgência |
|---|---|---|
| Cosmético / URLs | Atualizar URLs `rkmmax-app.vercel.app` em templates de email (`emailService.js`, `stripe-webhook.js`) | Baixa |
| Cosmético / Links | Atualizar link GitHub Issues em `Help.jsx` de `Rkmmax-app` para `rkmmax-hibrido` | Baixa |
| Cosmético / Docs | Atualizar referências ao `Rkmmax-app` em docs legados (DEPLOY.md, etc.) | Baixa — podem ser deletados |

---

### Verificação de descontinuação do repositório antigo dos especialistas

> **Nota:** Este item é distinto do `Rkmmax-app`. O repositório antigo dos especialistas refere-se a qualquer repositório ou conjunto de arquivos de especialistas que existia antes da consolidação estrutural no `rkmmax-hibrido`.

**Conclusão: Não há repositório separado de especialistas com dependência real. O `rkmmax-hibrido` é a única fonte de verdade.**

**Justificativa:**
1. **Não há dependência de código externo** — Todos os especialistas estão definidos em `src/config/specialists.js` e `src/config/specialistPrompts.js` dentro do próprio `rkmmax-hibrido`. Nenhum `import`, `require`, ou chamada de API aponta para repositório externo.
2. **Absorção estrutural concluída** — Os systemPrompts, domínios e fluxos de execução dos especialistas foram consolidados neste repositório nos PRs #202–#231. Não há absorção pendente.
3. **Não há repositório separado ativo** — A fase estrutural dos especialistas foi executada inteiramente dentro do `rkmmax-hibrido`. Não existe um "repositório antigo dos especialistas" autônomo com dependência funcional.

> O repositório antigo dos especialistas **não representa uma dependência real** e pode ser tratado como **descontinuado / apto para exclusão**, caso exista. Toda a lógica estrutural dos especialistas está consolidada no `rkmmax-hibrido`.

### Validação
1. `CHECKLIST.md` registra explicitamente o encerramento da fase estrutural dos especialistas ✅
2. `CHECKLIST.md` registra a conclusão da verificação de descontinuação do `Rkmmax-app` ✅
3. `CHECKLIST.md` registra separadamente o status do repositório antigo dos especialistas ✅
4. Pendências residuais classificadas como cosméticas / baixa prioridade ✅
5. Nenhum arquivo de código foi alterado ✅
6. O registro segue o padrão de governança do projeto ✅

### Rollback
```bash
git revert <commit-sha>
# Remove apenas a entrada de encerramento do CHECKLIST.md
```

---

## 2026-03-15 — docs(absorption): encerramento formal da fase funcional de absorção do Rkmmax-app

### O que foi feito
- Registrado formalmente o encerramento da fase funcional de absorção do `Rkmmax-app` → `rkmmax-hibrido`
- Documentado o estado consolidado dos 5 fluxos críticos de plano
- Classificadas as pendências remanescentes como operacionais / infra / validação final (não são pendências de código)

### Por quê
A absorção funcional foi concluída com o merge do PR #195 (2026-03-15). Todos os elos da cadeia crítica de planos estão corrigidos e em produção no `main`. Este registro fecha formalmente a fase de migração de código e declara o início da fase de operação/validação.

### Estado consolidado — fase funcional concluída ✅

| Componente | PR | Estado |
|---|---|---|
| `src/lib/planCaps.js` — 5 planos oficiais, `mid` removido | #188 | ✅ merged 2026-03-12 |
| `src/config/fairUse.js` — remove `free`, adiciona `ultra`/`dev`, fallback `basic` | #190 | ✅ merged 2026-03-13 |
| `api/admin.js` `handleMePlan()` — plano real via `PLAN_TIERS` | #191 | ✅ merged 2026-03-14 |
| `src/config/fairUse.js` + `src/pages/Specialists.jsx` — gating real via `usePlan()` | #193 | ✅ merged 2026-03-15 |
| `api/_utils/plans.js` `PRICE_IDS` + `tierOf()` + `api/admin.js` `handlePrices()` com `ultra` | #194 | ✅ merged 2026-03-15 |
| `src/hooks/usePlan.js` — lê `j.userPlan` (campo real) | #195 | ✅ merged 2026-03-15 |
| `src/pages/SpecialistChat.jsx` — markdown, voz, UX | #186–#187 | ✅ merged 2026-03-12 |
| `src/config/specialists.js` — avatars `law` e `home` | #185 | ✅ merged 2026-03-11 |
| Serginho N5–N13 — GitHub context + análise incremental | #174–#184 | ✅ merged 2026-03-11 |

### Declaração explícita
**Não há pendência de código funcional para concluir a absorção do `Rkmmax-app`.**

### Pendências remanescentes — classificadas como OPERACIONAL / INFRA / VALIDAÇÃO

| Categoria | Item | Urgência |
|---|---|---|
| **Infra / Vercel** | Configurar env vars `R_ULTRA`, `R_ULTRA_US`, `R_DEV` | Alta se `ultra`/`dev` estiverem ativos |
| **Infra / Supabase** | Confirmar existência da coluna `plan` na tabela `subscriptions` | Média |
| **Smoke test** | Validar end-to-end: usuário `basic` → recebe `basic`; `ultra` → recebe `ultra` | Alta |
| **Descontinuação** | Iniciar processo controlado de descontinuação do repositório `Rkmmax-app` | Baixa — planejamento |
| **Webhook Stripe** | `ultra`/`dev` — feature nova, não pendência de absorção | Roadmap |

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `CHECKLIST.md` | Esta entrada de encerramento |
| `CHANGELOG.md` | Entrada de fechamento da fase de absorção funcional |

### Validação
1. `CHECKLIST.md` declara explicitamente que a fase funcional de absorção foi concluída ✅
2. Pendências remanescentes estão classificadas como operacionais / infra / validação ✅
3. Nenhum arquivo de código foi alterado ✅
4. O registro segue o padrão de governança do projeto ✅

### Rollback
```bash
git revert <commit-sha>
# Remove apenas a entrada de encerramento do CHECKLIST.md e a entrada do CHANGELOG.md
```

---

## 2026-03-15 — fix(usePlan): corrigir leitura do campo userPlan na resposta de /api/me-plan

### O que foi feito
- Corrigido `src/hooks/usePlan.js`: campo lido na resposta da API alterado de `j.plan` para `j.userPlan`
- Mantido fallback `|| "basic"` como proteção legítima para respostas sem plano

### Por quê
- `handleMePlan()` em `api/admin.js` retorna `{ userPlan: "..." }` — não `{ plan: "..." }`
- `j.plan` era sempre `undefined`, então `usePlan()` caía **sempre** no fallback `"basic"`, mascarando o plano real do usuário
- Isso fazia o gating de especialistas (`Specialists.jsx`) e os limites de `fairUse.js` operarem sempre com `"basic"`, independentemente do plano real

### Arquivo alterado

| Arquivo | Mudança |
|---|---|
| `src/hooks/usePlan.js` | `j.plan` → `j.userPlan` (L37) |
| `CHECKLIST.md` | Esta entrada |

### Validação
1. Campo lido antes: `j.plan` → sempre `undefined` → fallback `"basic"` ✅ identificado
2. Campo lido agora: `j.userPlan` → valor real retornado pela API ✅
3. `usePlan()` passa a receber o plano real da API ✅
4. Fallback `"basic"` permanece apenas para respostas sem `userPlan` (usuário sem assinatura) ✅
5. `api/admin.js` não tocado ✅
6. `npm run build` → sem erros ✅

### Rollback
```bash
git revert <commit-sha>
# Restaura j.plan em src/hooks/usePlan.js
```

## 2026-03-15 — fix(plans): add ultra pricing output and complete PRICE_IDS map

### O que foi feito
- Adicionado `ultra` ao array `tiers` e ao objeto `labels` (BR/US) em `handlePrices()` de `api/admin.js`
- Adicionado `ultra` a `TIER_ALIASES` em `api/admin.js`
- Completado `PRICE_IDS` em `api/_utils/plans.js` com `ultra_br: process.env.R_ULTRA`, `ultra_us: process.env.R_ULTRA_US`, `dev: process.env.R_DEV`
- Corrigido `tierOf()` em `api/_utils/plans.js` para reconhecer `ultra` e `dev` explicitamente

### Por quê
- `handlePrices()` só listava 3 tiers (basic/intermediate/premium) — `ultra` existia no Stripe e no `plans.json` mas nunca era exposto pela API
- `PRICE_IDS` não mapeava `R_ULTRA`, `R_ULTRA_US`, `R_DEV` — `getPlanByKey('ultra_br')` sempre retornava `price_id: null`
- `tierOf()` classificava `ultra` como `"premium"` (fallback genérico) — incorreto para auditoria e billing

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `api/admin.js` | `handlePrices()`: `ultra` em `TIER_ALIASES`, `tiers`, `labels` BR e US |
| `api/_utils/plans.js` | `PRICE_IDS` + `tierOf()` cobrindo `ultra` e `dev` |
| `CHECKLIST.md` | Esta entrada |

### Validação
1. `GET /api/admin?action=prices&region=BR` → resposta inclui `ultra` nos `planos` ✅
2. `GET /api/admin?action=prices&region=US` → resposta inclui `ultra` nos `planos` ✅
3. `getPlanByKey('ultra_br').price_id` → `process.env.R_ULTRA` (não null) ✅
4. `getPlanByKey('ultra_us').price_id` → `process.env.R_ULTRA_US` (não null) ✅
5. `tierOf('ultra_br')` → `'ultra'` ✅
6. `tierOf('dev')` → `'dev'` ✅
7. `handleMePlan()` não tocado ✅
8. `handleSendEmail()` não tocado ✅
9. `npm run build` → sem erros ✅

### Variáveis de ambiente novas necessárias (Vercel)
- `R_ULTRA` — Stripe Price ID do plano Ultra BR
- `R_ULTRA_US` — Stripe Price ID do plano Ultra US
- `R_DEV` — Stripe Price ID do plano Dev (ou string de controle interno)

### O que NÃO entra neste PR
- `handleMePlan()` para `ultra`/`dev` — PR futuro
- `dev` em `handlePrices()` — produto interno, não exposto no pricing público
- `plans.json` — não alterado; já contém `ultra_br`/`ultra_us`
- Stripe webhook para `ultra`/`dev` — PR futuro

### Rollback
```bash
git revert <commit-sha>
# Restaura tiers=["basic","intermediate","premium"] em handlePrices()
# Restaura PRICE_IDS sem R_ULTRA/R_ULTRA_US/R_DEV
```

---

## 2026-03-15 — fix(plans): align fairUse and Specialists gating with official paid plans

### O que foi feito
- Removido plano `free` de `src/config/fairUse.js` — produto é 100% pago; `free` não existe nos planos oficiais
- Adicionados planos `ultra` e `dev` em `src/config/fairUse.js` — sem limite de mensagens/tokens (`messagesPerDay: 0`, `messagesPerMonth: 0`)
- Fallback de plano desconhecido alterado de `plans.free` para `plans.basic` em todos os helpers: `checkLimit()`, `canUseSpecialist()`, `getAIModel()`, `estimateMessageCost()`
- `checkLimit()` ajustado para retornar "sem limite" quando `messagesPerDay === 0` — evita cálculo incorreto para `ultra`/`dev`
- Substituído `const userPlan = 'premium'` hardcoded em `src/pages/Specialists.jsx` por `const { plan: userPlan } = usePlan()` — gating real de especialistas agora usa o plano real do usuário
- Adicionado import de `usePlan` em `Specialists.jsx`

### Por quê
- P1 da absorção final: `fairUse.js` tinha `free` (legado) e não cobria `ultra`/`dev`; qualquer usuário com plano desconhecido caía em `free`, recebendo acesso a apenas 3 especialistas
- P2 da absorção final: `Specialists.jsx` usava `'premium'` hardcoded, desativando silenciosamente o gating por plano — todos os usuários viam todos os especialistas independentemente do plano real
- `usePlan()` já existia e já lia `/api/me-plan` corretamente — só faltava conectar

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/config/fairUse.js` | Remove `free`; adiciona `ultra` e `dev`; fallback → `plans.basic`; `checkLimit` suporta limite 0 |
| `src/pages/Specialists.jsx` | `userPlan` hardcoded → `usePlan()`; import adicionado |
| `CHECKLIST.md` | Esta entrada |

### Planos finais em fairUse.js
`basic`, `intermediate`, `premium`, `ultra`, `dev` — 5 planos pagos oficiais ✅

### Validação
1. `Object.keys(plans)` em `fairUse.js` → `['basic', 'intermediate', 'premium', 'ultra', 'dev']`
2. `plans.free` → `undefined` ✅
3. `checkLimit('ultra', { messagesToday: 9999 })` → `{ canSendMessage: true }` ✅
4. `checkLimit('dev', { messagesToday: 9999 })` → `{ canSendMessage: true }` ✅
5. `checkLimit('unknown_plan', { messagesToday: 0 })` → fallback para `basic`, não para `free` ✅
6. `canUseSpecialist('basic', 'law')` → `true` (specialists: "all") ✅
7. `Specialists.jsx` usa `usePlan()` como fonte de plano ✅
8. `userPlan = 'premium'` hardcoded removido ✅
9. `npm run build` → sem erros ✅

### Riscos
- Baixo: usuários com plano desconhecido/nulo antes caíam em `free` (3 especialistas). Agora caem em `basic` (todos especialistas, limites mais conservadores de tokens/dia). Comportamento mais correto e coerente com produto pago.
- Se `usePlan()` retornar `"basic"` enquanto carrega (estado inicial), `Specialists.jsx` pode temporariamente mostrar todos os especialistas antes de re-renderizar com o plano real — aceitável, sem regressão visual.

### O que NÃO entra neste PR
- `api/admin.js` `handleMePlan()` — corrigido em PR anterior
- `src/lib/planCaps.js` — não tocado
- `api/_utils/plans.js` — PR futuro: `R_ULTRA`, `R_ULTRA_US`, `R_DEV`
- `api/admin.js` `handlePrices` sem ultra — PR futuro

### Rollback
```bash
git revert <commit-sha>
# Restaura free em fairUse.js e userPlan = 'premium' em Specialists.jsx
```

## 2026-03-14 — fix(admin): handleMePlan retorna plano real para todos os 5 planos oficiais (P3)

### O que foi feito
- Eliminado `userPlan: "premium"` hardcoded em `handleMePlan()` — bug que retornava premium para qualquer assinatura ativa
- Adicionado mapeamento `PLAN_TIERS` que resolve `stripe_price_id` → tier canônico via variáveis de ambiente (`R_BASIC`, `R_INTER`, `R_PREMIUM`, `R_BASIC_US`, `R_INTER_US`, `R_PREMIUM_US`, `R_ULTRA`, `R_ULTRA_US`, `R_DEV`)
- Adicionado suporte ao campo `plan` da tabela `subscriptions` — prioridade 1 para `ultra` e `dev` (planos internos sem price_id Stripe)
- Adicionado `plan_source` no retorno para diagnóstico (`supabase_plan_column` | `price_id_map` | `fallback`)
- Preservado `FALLBACK_PLAN = "basic"` para assinaturas ativas com plano não reconhecível

### Por quê
- P3 da absorção final do RKMmax-app: `handleMePlan()` nunca discriminava entre planos — todos os assinantes ativos recebiam `premium`
- Com `basic`/`intermediate` recebendo `premium`, o PlanGate e `fairUse.js` não podiam aplicar limites corretos
- `ultra` e `dev` eram completamente ignorados

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `api/admin.js` | Constante `PLAN_TIERS` + `VALID_PLANS`; SELECT inclui coluna `plan`; retorno resolve plano real com prioridade: coluna `plan` > price_id map > fallback |
| `CHECKLIST.md` | Esta entrada |

### Validação
1. Usuário com `stripe_price_id` = `$R_BASIC` ativo → `userPlan: "basic"`
2. Usuário com `stripe_price_id` = `$R_INTER` ativo → `userPlan: "intermediate"`
3. Usuário com `stripe_price_id` = `$R_PREMIUM` ativo → `userPlan: "premium"`
4. Usuário com coluna `plan = "ultra"` e assinatura ativa → `userPlan: "ultra"`
5. Usuário com coluna `plan = "dev"` e assinatura ativa → `userPlan: "dev"`
6. Usuário sem assinatura → `userPlan: "basic"`, `reason: "no_subscription"`
7. Assinatura inativa → `userPlan: "basic"`, `reason: "inactive"`
8. `npm run build` → sem erros
9. Nenhum outro fluxo (PlanGate, guardAndBill, fairUse) alterado

### Cenários que passam a funcionar corretamente
- Usuário `basic`: recebia `premium`, agora recebe `basic` → PlanGate e fairUse aplicam limites corretos
- Usuário `intermediate`: recebia `premium`, agora recebe `intermediate`
- Usuário `ultra`: era ignorado (caía no fallback `basic`), agora resolvido via coluna `plan`
- Usuário `dev`: era ignorado, agora resolvido via coluna `plan` ou `R_DEV` env

### Riscos
- **Baixo**: Usuários `basic`/`intermediate` que antes recebiam `premium` passarão a receber seus planos reais — pode ser percebido como downgrade de funcionalidade se PlanGate estiver ativo no front. Esperado e correto.
- Se ENV `R_BASIC`/`R_INTER`/`R_PREMIUM` não estiverem configuradas e `plan` column não existir → cai no fallback `basic` (comportamento conservador, sem crash).

### O que NÃO entra neste PR
- `src/config/fairUse.js` — concluído em PR anterior
- `src/lib/planCaps.js` — não tocado
- `api/_utils/guardAndBill.js` — não tocado

### Rollback
```bash
git revert <commit-sha>
# Restaura handleMePlan com userPlan: "premium" hardcoded
```

## 2026-03-13 — fix(fairUse): alinhar planos com planCaps.js — remover `free`, adicionar `ultra` e `dev`

### O que foi feito
- Removido plano `free` de `src/config/fairUse.js` — plano inexistente no produto (produto é 100% pago)
- Adicionado plano `ultra` em `src/config/fairUse.js` — sem limite de mensagens (`messagesPerDay: 0`), feature `compliance: true`
- Adicionado plano `dev` em `src/config/fairUse.js` — sem limite de mensagens, uso interno
- Corrigido fallback em `checkLimit`: `plans.free` → `plans.basic`
- Ajustada lógica de `checkLimit` para tratar `messagesPerDay === 0` como ilimitado (`Infinity`), retornando `null` nesses campos para não enganar consumidores

### Por quê
- `planCaps.js` (fonte canônica) já possui os 5 planos oficiais; `fairUse.js` estava desalinhado
- `free` nunca existiu como plano real — qualquer lookup por plano desconhecido caía nele silenciosamente via fallback, mascarando bugs
- `ultra` e `dev` sem entrada em `fairUse.js` causariam `checkLimit` retornando limites do `basic` — bloqueando indevidamente usuários desses planos

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/config/fairUse.js` | Removido `free`; adicionados `ultra` e `dev`; corrigido fallback; lógica `Infinity` para planos sem limite |
| `CHECKLIST.md` | Esta entrada |

### Validação
1. `Object.keys(plans)` → `['basic', 'intermediate', 'premium', 'ultra', 'dev']` — sem `free`
2. `checkLimit('ultra', {messagesToday:99999})` → `canSendMessage: true`, `dailyRemaining: null`, `dailyLimit: null`
3. `checkLimit('dev', {messagesToday:99999})` → `canSendMessage: true`, `dailyRemaining: null`, `dailyLimit: null`
4. `checkLimit('unknown_plan', {messagesToday:0})` → fallback para `basic`, `dailyLimit: 100`
5. `checkLimit('basic', {messagesToday:101})` → `canSendMessage: false`
6. `npm run build` → sem erros
7. `src/pages/Specialists.jsx` sem regressão — `canUseSpecialist` continua funcionando

### O que NÃO entra neste PR
- `src/config/fairUse.js` price/currency para `ultra`/`dev` — valores orientativos, sem impacto em billing real (billing canônico é `planCaps.js`)
- `api/admin.js` `handleMePlan()` — PR futuro
- `src/pages/Specialists.jsx` mock `userPlan: 'premium'` — PR futuro

### Rollback
```bash
git revert <commit-sha>
# Restaura fairUse.js com free + sem ultra/dev
```

## 2026-03-12 — fix(planCaps): align billing caps with official paid plans

### O que foi feito
- Atualizado `PLAN` em `src/lib/planCaps.js`: adicionados `INTERMEDIATE`, `ULTRA`, `DEV`; removido `MID` (legado)
- Atualizado `LIMITS` para cobrir os 5 planos oficiais: `basic`, `intermediate`, `premium`, `ultra`, `dev`
- Atualizado `MODEL_BY_PLAN`, `FEATURES` e `PLAN_LABEL` para cobrir os 5 planos oficiais
- Atualizado `capsByPlan` para cobrir os 5 planos oficiais — elimina o `throw` de `guardAndBill` para `intermediate`, `ultra` e `dev`
- `ultra` e `dev` configurados com `limit_tokens_per_day: 0` (sem limite, conforme `hard_limit: false` em `api/_utils/plans.json`)
- `mid` removido de todas as estruturas — chave legada, nunca foi exposta ao usuário final
- `free` continua ausente — coerente com a decisão estratégica de produto apenas pago

### Por quê
- Auditoria de `api/_utils/guardAndBill.js` confirmou dívida arquitetural: `ensureCaps(plan)` faz `throw Error("Plano inválido: ...")` para qualquer chave ausente em `capsByPlan`
- Com o estado anterior, qualquer usuário com plano `intermediate`, `ultra` ou `dev` seria bloqueado completamente caso o billing fosse ativado
- `mid` era legado sem consumo real no produto

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/lib/planCaps.js` | `PLAN`, `LIMITS`, `MODEL_BY_PLAN`, `FEATURES`, `PLAN_LABEL`, `capsByPlan` alinhados aos 5 planos oficiais; `mid` removido |
| `CHECKLIST.md` | Esta entrada |

### Validação
1. `Object.keys(capsByPlan)` → `['basic', 'intermediate', 'premium', 'ultra', 'dev']`
2. `guardAndBill({ user: {id:'x'}, plan: 'intermediate', promptSize: 100 })` → sem throw
3. `guardAndBill({ user: {id:'x'}, plan: 'ultra', promptSize: 100 })` → sem throw (sem limite)
4. `guardAndBill({ user: {id:'x'}, plan: 'dev', promptSize: 100 })` → sem throw (sem limite)
5. `guardAndBill({ user: {id:'x'}, plan: 'mid', promptSize: 100 })` → throw `"Plano inválido: mid"` ✅ correto
6. `guardAndBill({ user: {id:'x'}, plan: 'free', promptSize: 100 })` → throw `"Plano inválido: free"` ✅ correto
7. `npm test` → todos os testes passando (nenhum teste referencia `PLAN.MID` ou `"mid"` diretamente)
8. `npx vite build` → sem erros

### O que NÃO entra neste PR
- `src/config/fairUse.js` — PR futuro: remover `free`, adicionar `ultra`/`dev`
- `api/admin.js` `handleMePlan()` — PR futuro: retornar plano real do Supabase para todos os planos
- `api/_utils/guardAndBill.js` — lógica sã, corrigida indiretamente por este PR
- Serginho Orchestrator — não tocado

### Rollback
```bash
git revert <commit-sha>
# Restaura src/lib/planCaps.js ao estado anterior (basic/mid/premium)
```


## 2026-03-12 — fix(specialist-chat): restore voice button + revert transcribe.js for sovereignty compliance

### O que foi feito
- Revertido `api/transcribe.js` para o estado original (roteamento via `serginho.handleRequest` com `forceProvider`) — a implementação anterior com chamada direta a `api.groq.com` violava a regra de soberania de gateway (`a4-gateway-sovereignty.test.js` Test 2)
- Mantido botão de voz `🎤` em `src/pages/SpecialistChat.jsx` com `handleVoiceInput`, `isRecording` state e `mediaRecorderRef` — frontend correto e sem violações
- Mantido CSS `.mic-button` e `.mic-button.recording` em `src/pages/SpecialistChat.css`
- Contrato externo de `/api/transcribe` não alterado: continua aceitando `multipart/form-data`, continua retornando `{ success, transcript, text }`

### Por quê
- `SpecialistChat` era o único chat sem botão de voz no híbrido
- A implementação anterior (`api/transcribe.js` com fetch direto para Groq Whisper) violava dois conjuntos de testes:
  - `a4-gateway-sovereignty.test.js` Test 2: somente `serginho-orchestrator.js` pode chamar providers AI diretamente
  - `integration.test.js`: múltiplas asserções requerem `serginho.handleRequest`, `forceProvider`, circuit breaker patterns e docs enterprise
- **Groq Whisper não pode ser chamado de `api/transcribe.js` diretamente** sem violar a soberania. A única forma de usá-lo sem bypass seria estender o Serginho Orchestrator com suporte a STT — o que está fora do escopo deste PR

### Decisão arquitetural
O `serginho-orchestrator.js` é o único ponto soberano autorizado a chamar `api.groq.com` diretamente (conforme `EXCLUDED_FROM_ENDPOINT_SCAN` em `a4-gateway-sovereignty.test.js`). O `api/transcribe.js` deve passar pelo gateway via `serginho.handleRequest`. Suporte nativo a Groq Whisper no orquestrador é melhoria futura.

### Validação
1. Abrir `/specialists/:id` → botão `🎤` visível ao lado do botão de envio
2. Clicar `🎤` → solicitar permissão de microfone → gravar → clicar `⏹` → texto transcrito aparece no input
3. `Serginho.jsx` e `HybridAgentSimple.jsx` sem regressão (não tocados)
4. `npm run build` → sem erros
5. `a4-gateway-sovereignty.test.js` → 5/5 testes passando
6. `integration.test.js` → 17/17 testes passando

### O que NÃO entra neste PR
- Groq Whisper direto — incompatível com a arquitetura de soberania atual
- Imagem/visão — PR futuro
- Serginho Orchestrator — não tocado
- Outros pages — não tocados

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `api/transcribe.js` | **Revertido** para estado pré-PR (Serginho Orchestrator via `handleRequest`) |
| `src/pages/SpecialistChat.jsx` | Botão `🎤` + `handleVoiceInput` + `isRecording` state |
| `src/pages/SpecialistChat.css` | `.mic-button` + `.mic-button.recording` + `@keyframes pulse-recording` |
| `CHECKLIST.md` | Esta entrada |

### Rollback
```bash
git revert <commit-sha>
```


- Upload de imagem/visão — PR futuro após validar `/api/vision`
- `MarkdownMessage` do legado — não absorvido pois depende de `react-markdown`/`remark-gfm`/`react-syntax-highlighter`, ausentes no `package.json` do híbrido

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/SpecialistChat.jsx` | `SimpleMarkdown` + `removeThinking` + `useEffect` mount |
| `CHECKLIST.md` | Esta entrada |

### Validação
1. Abrir chat de qualquer especialista → enviar mensagem que gere lista ou negrito → aparecer formatado
2. Nenhuma feature existente do híbrido regredida (emoji fallback, textarea, botões, CSS)
3. Nenhuma dependência nova adicionada ao `package.json`
4. Build: `npx vite build` → sem erros

### Rollback
```bash
git revert <commit-sha>
```

## 2026-03-11 — fix(specialists): restore missing avatar fields for law and home

### O que foi feito
- Adicionado campo `avatar: '/avatars/law.png'` ao especialista `law` em `src/config/specialists.js`
- Adicionado campo `avatar: '/avatars/home.png'` ao especialista `home` em `src/config/specialists.js`

### Por quê
Auditoria comparativa entre `Rkmmax-app` e `rkmmax-hibrido` identificou que `law` e `home` eram os únicos 2 de 44 especialistas sem o campo `avatar` no híbrido. Qualquer componente que renderize `specialist.avatar` receberá `undefined` para esses dois, causando fallback visual inconsistente.

### Campo `useGeniusPrompt` — auditado e descartado
O campo `useGeniusPrompt: true` presente no `Rkmmax-app` foi auditado: não existe nenhuma ocorrência de consumo desse campo em todo o `rkmmax-hibrido`. O híbrido aplica genius prompts incondicionalmente via `api/ai.js` para todos os especialistas. Adicionar o campo seria metadado morto — não foi incluído neste PR.

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/config/specialists.js` | `law.avatar` e `home.avatar` adicionados |
| `CHECKLIST.md` | Esta entrada |

### Validação
1. `law` e `home` agora têm `avatar` consistente com os outros 42 especialistas
2. Nenhum outro especialista foi tocado
3. Nenhuma lógica de prompt alterada
4. Nenhum campo `useGeniusPrompt` adicionado

### Rollback
```bash
git revert <commit-sha>
```

## 2026-03-11 — feat(serginho): dependências de execução sobre contexto GitHub carregado (N13)

### O que foi feito
- Criado `api/lib/serginho/analysis/githubExecutionDependencies.js` — helper de dependências de execução com: `isExecutionDependenciesFollowUp(message)` (detecta perguntas de dependências/bloqueios/pré-requisitos/paralelismo em PT-BR e EN por regex), `hasEnoughContextForExecutionDependencies(githubContext)` (verifica contexto — inclui campos anteriores), `buildExecutionDependenciesPrompt(message, githubContext)` (monta prompt estruturado com contexto + instruções para identificar dependências, bloqueios, pré-requisitos, paralelismo, ordem e risco de inversão), `formatExecutionDependenciesResponse(rawText, options)` (pós-processa resposta LLM: header, footer, truncamento seguro, redação de tokens), `getInsufficientExecutionDependenciesContextMessage()` (mensagem amigável)
- Modificado minimamente `api/lib/serginho-orchestrator.js`: import do novo helper; bloco N13 adicionado ANTES do bloco N12, com guarda `_skipExecutionDependenciesCheck` anti-loop; todas as guardas passadas na recursão
- Criado `api/__tests__/serginho-github-execution-dependencies.test.js` — testes completos

### Por quê
- N12 (PR #183) adicionou critérios de aceite, mas o Serginho não tinha fluxo especializado para perguntas de dependências/bloqueios entre itens — "o que depende do quê?", "blockers", "pode rodar em paralelo?"
- Com contexto GitHub carregado (N5), o Serginho pode usar o LLM para identificar dependências estruturais sem re-fetch

### Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| `api/lib/serginho/analysis/githubExecutionDependencies.js` | NOVO — helper N13 |
| `api/lib/serginho-orchestrator.js` | MODIFICADO MINIMAMENTE — import + bloco N13 |
| `api/__tests__/serginho-github-execution-dependencies.test.js` | NOVO — testes |
| `CHECKLIST.md` | Esta entrada |
| `CHANGELOG.md` | Entrada em `[Unreleased]` |

### Validação
1. `NODE_OPTIONS='--experimental-vm-modules' npx jest --no-coverage` → todos os testes passando (1521 testes)
2. Nenhum arquivo em `src/` alterado
3. Zero dependências novas
4. Fluxos N5/N6/N7/N8/N9/N10/N11/N12 intactos

### Rollback
```bash
git revert <commit-sha>
```

## 2026-03-11 — feat(serginho): critérios de aceite sobre contexto GitHub carregado (N12)

### O que foi feito
- Criado `api/lib/serginho/analysis/githubAcceptanceCriteria.js` — helper de critérios de aceite com: `isAcceptanceCriteriaFollowUp(message)` (detecta perguntas de validação/aceite/definição de pronto em PT-BR e EN por regex), `hasEnoughContextForAcceptanceCriteria(githubContext)` (verifica se há ao menos um campo de contexto disponível — incluindo contexto anterior), `buildAcceptanceCriteriaPrompt(message, githubContext)` (monta prompt estruturado com contexto atual, contexto anterior se disponível, pergunta e instruções para propor critérios com Condição de pronto / Evidência esperada / Risco se não validar), `formatAcceptanceCriteriaResponse(rawText, options)` (pós-processa resposta LLM: adiciona cabeçalho `## Critérios de aceite sugeridos`, rodapé, truncamento seguro, redação de tokens, indicador de contexto parcial), `getInsufficientAcceptanceCriteriaContextMessage()` (mensagem amigável quando contexto insuficiente)
- Modificado minimamente `api/lib/serginho-orchestrator.js`: import do novo helper; bloco acceptance criteria follow-up adicionado ANTES do bloco N11 (execution checklist), com guarda `_skipAcceptanceCriteriaCheck` anti-loop; todas as guardas passadas na recursão; `_meta.acceptanceCriteriaFollowUp = true` e `_meta.acceptanceCriteriaFormatted = true` na resposta
- Criado `api/__tests__/serginho-github-acceptance-criteria.test.js` — testes cobrindo todos os cenários de critérios de aceite e não-regressão de N6/N7/N8/N9/N10/N11

### Por quê
- N11 (PR #182) adicionou checklist executável, mas o Serginho não conseguia propor critérios objetivos de validação — perguntas como "como eu valido isso?" ou "quais são os critérios de aceite?" não tinham fluxo especializado
- Com contexto GitHub carregado (N5), o Serginho tem material para propor critérios verificáveis com condição de pronto, evidência esperada e risco se não validar

### Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| `api/lib/serginho/analysis/githubAcceptanceCriteria.js` | NOVO — helper de critérios de aceite |
| `api/lib/serginho-orchestrator.js` | MODIFICADO MINIMAMENTE — import + bloco acceptance criteria |
| `api/__tests__/serginho-github-acceptance-criteria.test.js` | NOVO — testes completos |
| `CHECKLIST.md` | Esta entrada |
| `CHANGELOG.md` | Entrada em `[Unreleased]` |

### Validação
1. `NODE_OPTIONS='--experimental-vm-modules' ./node_modules/.bin/jest --no-coverage` → todos os testes passando (incluindo os novos de N12)
2. Nenhum arquivo em `src/` alterado
3. Zero dependências novas
4. Fluxos N5/N6/N7/N8/N9/N10/N11 intactos

### Rollback
```bash
git revert <commit-sha>
```

## 2026-03-11 — feat(serginho): checklist executável sobre contexto GitHub carregado (N11)

### O que foi feito
- Criado `api/lib/serginho/analysis/githubExecutionChecklist.js` — helper de checklist executável com: `isExecutionChecklistFollowUp(message)` (detecta perguntas de checklist/tarefas/lista executável em PT-BR e EN por regex), `hasEnoughContextForChecklist(githubContext)` (verifica se há ao menos um campo de contexto disponível), `buildChecklistPrompt(message, githubContext)` (monta prompt estruturado com contexto atual, contexto anterior se disponível, pergunta e instruções de checklist com prioridade/dependência/critério de conclusão), `formatChecklistResponse(rawText, options)` (pós-processa resposta LLM: adiciona cabeçalho `## Checklist sugerido`, rodapé, truncamento seguro, redação de tokens, indicador de contexto parcial), `getInsufficientChecklistContextMessage()` (mensagem amigável quando contexto insuficiente)
- Modificado minimamente `api/lib/serginho-orchestrator.js`: import do novo helper; bloco checklist follow-up adicionado ANTES do bloco N10 (action plan), com guarda `_skipExecutionChecklistCheck` anti-loop; todas as guardas passadas na recursão; `_meta.executionChecklistFollowUp = true` e `_meta.executionChecklistFormatted = true` na resposta
- Criado `api/__tests__/serginho-github-execution-checklist.test.js` — testes cobrindo todos os cenários de checklist e não-regressão de N6/N7/N8/N9/N10

### Por quê
- N10 (PR #181) adicionou plano de ação sequencial, mas o Serginho não conseguia gerar um checklist executável de curto prazo — perguntas como "me dê um checklist" ou "quebra isso em tarefas" não tinham fluxo especializado
- Com contexto GitHub carregado (N5), o Serginho tem material para propor itens práticos e executáveis com prioridade, dependência e critério de conclusão

### Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| `api/lib/serginho/analysis/githubExecutionChecklist.js` | NOVO — helper de checklist executável |
| `api/lib/serginho-orchestrator.js` | MODIFICADO MINIMAMENTE — import + bloco checklist |
| `api/__tests__/serginho-github-execution-checklist.test.js` | NOVO — testes completos |
| `CHECKLIST.md` | Esta entrada |
| `CHANGELOG.md` | Entrada em `[Unreleased]` |

### Validação
1. `NODE_OPTIONS='--experimental-vm-modules' ./node_modules/.bin/jest --no-coverage` → todos os testes passando (incluindo os novos de N11)
2. Nenhum arquivo em `src/` alterado
3. Zero dependências novas
4. Fluxos N5/N6/N7/N8/N9/N10 intactos

### Rollback
```bash
git revert <commit-sha>
```

## 2026-03-11 — feat(serginho): plano de ação sobre contexto GitHub carregado (N10)

### O que foi feito
- Criado `api/lib/serginho/analysis/githubActionPlan.js` — helper de plano de ação sequencial com: `isActionPlanFollowUp(message)` (detecta perguntas de plano/roadmap/sequência em PT-BR e EN por regex), `hasEnoughContextForActionPlan(githubContext)` (verifica se há ao menos um campo de contexto disponível), `buildActionPlanPrompt(message, githubContext)` (monta prompt estruturado com contexto atual, contexto anterior se disponível, pergunta e instruções de sequenciamento + prioridade/impacto/esforço/risco), `formatActionPlanResponse(rawText, options)` (pós-processa resposta LLM: adiciona cabeçalho, rodapé, truncamento seguro, redação de tokens, indicador de contexto parcial), `getInsufficientActionPlanContextMessage()` (mensagem amigável quando contexto insuficiente)
- Modificado minimamente `api/lib/serginho-orchestrator.js`: import do novo helper; bloco action plan follow-up adicionado ANTES do bloco N9 (recommendation), com guarda `_skipActionPlanCheck` anti-loop; todas as guardas passadas na recursão; `_meta.actionPlanFollowUp = true` e `_meta.actionPlanFormatted = true` na resposta
- Criado `api/__tests__/serginho-github-action-plan.test.js` — testes cobrindo todos os cenários de plano de ação e não-regressão de N6/N7/N8/N9

### Por quê
- N9 (PR #180) adicionou recomendações priorizadas, mas o Serginho não conseguia montar um plano sequencial ordenado — perguntas como "me dê um plano de ação" ou "qual a sequência ideal?" não tinham fluxo especializado
- Com contexto GitHub carregado (N5), o Serginho tem material para propor um mini-roadmap, mas precisava de um prompt especializado em sequenciamento com prioridade/impacto/esforço/risco

### Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| `api/lib/serginho/analysis/githubActionPlan.js` | NOVO — helper de plano de ação sequencial |
| `api/lib/serginho-orchestrator.js` | MODIFICADO MINIMAMENTE — import + bloco action plan |
| `api/__tests__/serginho-github-action-plan.test.js` | NOVO — 100 testes completos |
| `CHECKLIST.md` | Esta entrada |
| `CHANGELOG.md` | Entrada em `[Unreleased]` |

### Validação
1. `NODE_OPTIONS='--experimental-vm-modules' ./node_modules/.bin/jest --no-coverage` → 1130 testes passando (100 novos)
2. Nenhum arquivo em `src/` alterado
3. Zero dependências novas
4. Fluxos N5/N6/N7/N8/N9 intactos

### Rollback
```bash
git revert <commit-sha>
```

## 2026-03-11 — feat(serginho): recomendações acionáveis sobre contexto GitHub carregado (N9)

### O que foi feito
- Criado `api/lib/serginho/analysis/githubActionRecommendations.js` — helper de recomendações com: `isActionRecommendationFollowUp(message)` (detecta perguntas de recomendação/priorização/próximos passos em PT-BR e EN por regex), `hasEnoughContextForRecommendations(githubContext)` (verifica se há ao menos um campo de contexto disponível), `buildRecommendationPrompt(message, githubContext)` (monta prompt estruturado com contexto atual, contexto anterior se disponível, pergunta e instruções de priorização PT-BR + anti-alucinação), `formatRecommendationResponse(rawText, options)` (pós-processa resposta LLM: adiciona cabeçalho, rodapé, truncamento seguro, redação de tokens), `getInsufficientRecommendationContextMessage()` (mensagem amigável quando contexto insuficiente)
- Modificado minimamente `api/lib/serginho-orchestrator.js`: import do novo helper; bloco recommendation follow-up adicionado ANTES dos blocos N8 e N6, com guarda `_skipRecommendationCheck` anti-loop; todas as guardas (`_skipRecommendationCheck`, `_skipComparisonCheck`, `_skipAnalyticalCheck`) passadas na recursão para evitar cascata; `_meta.recommendationFollowUp = true` e `_meta.recommendationFormatted = true` na resposta
- Criado `api/__tests__/serginho-github-recommendations.test.js` — 76 testes cobrindo todos os cenários de recomendação e não-regressão de N6/N7/N8

### Por quê
- N8 (PR #179) adicionou comparação, mas o Serginho não conseguia sugerir ações práticas priorizadas — perguntas como "o que eu deveria fazer primeiro?" não tinham fluxo especializado, caíam no analítico genérico
- Com contexto GitHub carregado (N5), o Serginho tem material suficiente para recomendar próximos passos, mas precisava de um prompt especializado orientado a ação

### Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| `api/lib/serginho/analysis/githubActionRecommendations.js` | NOVO — helper de recomendações acionáveis |
| `api/lib/serginho-orchestrator.js` | MODIFICADO MINIMAMENTE — import + bloco recommendation follow-up |
| `api/__tests__/serginho-github-recommendations.test.js` | NOVO — 76 testes completos |
| `CHECKLIST.md` | Esta entrada |
| `CHANGELOG.md` | Entrada em `[Unreleased]` |

### Validação
1. `NODE_OPTIONS='--experimental-vm-modules' ./node_modules/.bin/jest --no-coverage` → 1030 testes passando (76 novos)
2. Nenhum arquivo em `src/` alterado
3. Zero dependências novas
4. Fluxos N5/N6/N7/N8 intactos

### Rollback
```bash
git revert <commit-sha>
```

## 2026-03-11 — feat(serginho): comparação entre contextos GitHub carregados (N8)

### O que foi feito
- Criado `api/lib/serginho/analysis/githubContextComparison.js` — helper de comparação com: `isComparativeFollowUp(message)` (detecta perguntas comparativas PT-BR e EN por regex), `hasEnoughContextForComparison(githubContext)` (verifica se há contexto atual E anterior para comparar), `buildComparisonPrompt(message, githubContext)` (monta prompt estruturado com Artefato 1 + Artefato 2 + instruções anti-alucinação), `getInsufficientComparisonContextMessage()` (mensagem amigável quando contexto insuficiente)
- Modificado minimamente `api/lib/serginho/context/githubConversationContext.js`: adicionados 4 campos `previous*` em `createGitHubContext()`; shift de `last*` para `previous*` no início de `updateContextFromToolResult()`; limpeza de `previous*` em `clearGitHubContext()`; zero impacto em N5/N6/N7
- Modificado minimamente `api/lib/serginho-orchestrator.js`: import do novo helper; bloco comparative follow-up adicionado ANTES do bloco analytical (N6), com guarda `_skipComparisonCheck` anti-loop; reutiliza `formatAnalyticalResponse` do N7; `_meta.comparativeFollowUp = true` na resposta
- Criado `api/__tests__/serginho-github-comparison.test.js` — 80 testes cobrindo todos os cenários comparativos, shift de contexto, integração no orchestrator e não-regressão

### Por quê
- N7 (PR #178) adicionou formatação analítica, mas o Serginho não conseguia comparar dois artefatos já vistos na conversa — perguntas como "compare isso com o README" caíam no fluxo analítico genérico sem estrutura comparativa
- O contexto por conversa (N5) já guardava o artefato atual; esta etapa adiciona o anterior com mínima extensão reversível

### Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| `api/lib/serginho/analysis/githubContextComparison.js` | NOVO — helper de comparação entre contextos |
| `api/lib/serginho/context/githubConversationContext.js` | MODIFICADO MINIMAMENTE — 4 campos previous* + shift em updateContextFromToolResult + clear |
| `api/lib/serginho-orchestrator.js` | MODIFICADO MINIMAMENTE — import + bloco comparative follow-up |
| `api/__tests__/serginho-github-comparison.test.js` | NOVO — 80 testes completos |
| `CHECKLIST.md` | Esta entrada |
| `CHANGELOG.md` | Entrada em `[Unreleased]` |

### Validação
1. `NODE_OPTIONS='--experimental-vm-modules' jest --no-coverage` → 954 testes passando (80 novos)
2. Nenhum arquivo em `src/` alterado
3. Zero dependências novas
4. Fluxos N5/N6/N7 intactos

### Rollback
```bash
git revert <commit-sha>
```

## 2026-03-11 — feat(serginho): formatação analítica acionável sobre contexto GitHub (N7)

### O que foi feito
- Criado `api/lib/serginho/analysis/githubAnalyticalResponseFormatter.js` — pós-processador de respostas analíticas com: `detectAnalyticalSections(rawText)` (heurística por regex/padrões PT-BR+EN para extrair summary, strengths, risks, nextSteps, confidence), `formatAnalyticalResponse(rawText, options)` (estrutura resposta LLM em blocos Markdown leve com `includeStructure` e `maxLength`; nunca inventa conteúdo; fallback para texto original se nenhuma seção detectada)
- Modificado minimamente `api/lib/serginho-orchestrator.js`: import do novo formatter; pós-processamento aplicado após obter resposta analítica do LLM no bloco analytical follow-up (N6); `_meta.analyticalFormatted = true` na resposta pós-processada; zero impacto no fluxo normal não-analítico
- Criado `api/__tests__/serginho-github-analytical-formatter.test.js` — 55 testes cobrindo detectAnalyticalSections (summary, strengths, risks, nextSteps, confidence, edge cases), formatAnalyticalResponse (com/sem estrutura, truncamento, segurança, fallback), integração no orchestrator e não-regressão

### Por quê
- N6 (PR #177) criou análise incremental, mas a resposta do LLM era entregue como texto livre sem estrutura — difícil de consumir
- Esta etapa adiciona estruturação leve e acionável sem alterar a lógica de roteamento nem o fluxo de contexto

### Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| `api/lib/serginho/analysis/githubAnalyticalResponseFormatter.js` | NOVO — pós-processador de respostas analíticas |
| `api/lib/serginho-orchestrator.js` | MODIFICADO MINIMAMENTE — import + pós-processamento no bloco analytical |
| `api/__tests__/serginho-github-analytical-formatter.test.js` | NOVO — 55 testes completos |
| `CHECKLIST.md` | Esta entrada |
| `CHANGELOG.md` | Entrada em `[Unreleased]` |

### Validação
1. `NODE_OPTIONS='--experimental-vm-modules' npx jest --no-coverage` → todos os 874 testes passando
2. Nenhum arquivo em `src/` alterado
3. Zero dependências novas
4. Fluxo normal do Serginho (prompts não-GitHub e não-analíticos) intacto

### Rollback
```bash
git revert <commit-sha>
```

## 2026-03-11 — feat(serginho): análise incremental sobre contexto GitHub carregado (N6)

### O que foi feito
- Criado `api/lib/serginho/analysis/githubContextAnalysis.js` — helper de análise incremental com: `isAnalyticalFollowUp(message)` (detecta perguntas analíticas de follow-up em PT-BR e EN), `hasEnoughContextForAnalysis(githubContext)` (verifica se há contexto suficiente para análise), `buildAnalysisPrompt(message, githubContext)` (monta prompt estruturado com contexto + instruções obrigatórias), `getInsufficientContextMessage()` (mensagem amigável quando contexto insuficiente)
- Modificado minimamente `api/lib/serginho-orchestrator.js`: import do novo helper; bloco analytical follow-up adicionado ANTES do bloco GitHub intent, com guarda `_skipAnalyticalCheck` para evitar recursão; contexto propagado em `_meta.githubContext`; sem LLM chamado quando contexto insuficiente
- Criado `api/__tests__/serginho-github-incremental-analysis.test.js` — 89 testes cobrindo todos os cenários de análise incremental, integração, e verificação de não-regressão

### Por quê
- PR anterior criou contexto de conversa GitHub temporário, mas o Serginho não tinha capacidade de detectar perguntas analíticas de follow-up e usar o contexto para responder sem re-fetch
- Sem esta etapa, perguntas como "o que você conclui desse projeto?" após ler um package.json resultariam em resposta genérica ou re-fetch desnecessário

### Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| `api/lib/serginho/analysis/githubContextAnalysis.js` | NOVO — helper de análise incremental |
| `api/lib/serginho-orchestrator.js` | MODIFICADO MINIMAMENTE — import + bloco analytical follow-up |
| `api/__tests__/serginho-github-incremental-analysis.test.js` | NOVO — 89 testes |
| `CHECKLIST.md` | Esta entrada |
| `CHANGELOG.md` | Entrada em `[Unreleased]` |

### Validação
1. `npm test -- --no-coverage` → todos os testes passando
2. Nenhum arquivo em `src/` alterado
3. Zero dependências novas
4. Fluxo normal do Serginho (prompts não-GitHub) intacto

### Rollback
```bash
git revert <commit-sha>
```

## 2026-03-10 — feat(serginho): contexto de conversa GitHub temporário (N5)

### O que foi feito
- Criado `api/lib/serginho/context/githubConversationContext.js` — módulo de contexto in-memory por conversa com: `createGitHubContext()` (contexto limpo, não-singleton), `updateContextFromToolResult(ctx, toolName, params, result)` (atualiza após tool call de repos/branches/file), `resolveParamsFromContext(ctx, params)` (preenche owner/repo faltantes do contexto; path NÃO é auto-preenchido), `getContextSummary(ctx)` (retorna resumo truncado e seguro para injeção no LLM), `clearGitHubContext(ctx)` (reseta todos os campos); snippets truncados em 2000 chars, summaries em 500 chars; nunca vaza token, stacktrace ou headers; sem persistência em banco ou disco
- Modificado minimamente `api/lib/serginho-orchestrator.js`: import do módulo de contexto; criação/recuperação de `githubCtx` a partir de `context.githubContext` no início de `_handleStructured`; uso de `resolveParamsFromContext` para preencher params faltantes antes de chamar tools GitHub; `_computeMissingParams` helper para recalcular missing após resolução; `updateContextFromToolResult` chamado após execução de tool; `githubContext: githubCtx` incluído em `_meta` de todas as respostas GitHub; `getContextSummary` injetado como prefixo em `effectiveMessage` para chamadas LLM de acompanhamento; zero impacto no fluxo normal (sem contexto GitHub, effectiveMessage === message)
- Criado `api/__tests__/serginho-github-context.test.js` — 49 testes cobrindo: criação limpa, não-singleton; update por tipo (repos/branches/file); resolução de params (preenchimento e não-preenchimento de path); getContextSummary (null sem tipo, com summary, com snippet, truncamento); clearGitHubContext; segurança (sem token leak, snippet ≤2000, summary ≤500); fluxo normal preservado; integração orchestrator (githubContext em _meta, resolução de missing por contexto, pedido de dados faltantes); sem regressão em intent/formatter/gateway/tools

### Por quê
- PR #173 adicionou formatação contextual, mas o Serginho não tinha memória de conversa — perguntas de acompanhamento ("o que você conclui?", "resuma esse arquivo") requeriam re-fetch ou falha
- Regra estrutural: NADA executa fora do Serginho; o contexto é propagado via `context.githubContext` / `_meta.githubContext` sem quebrar a cadeia intent → tools → gateway → service

### Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| `api/lib/serginho/context/githubConversationContext.js` | NOVO — módulo de contexto de conversa |
| `api/lib/serginho-orchestrator.js` | MODIFICADO MINIMAMENTE — import + criação/uso de contexto + _computeMissingParams + effectiveMessage |
| `api/__tests__/serginho-github-context.test.js` | NOVO — 49 testes |
| `CHECKLIST.md` | Esta entrada |
| `CHANGELOG.md` | Entrada em `[Unreleased]` |

### Validação
1. `NODE_OPTIONS='--experimental-vm-modules' ./node_modules/.bin/jest --no-coverage` → 730 testes passando (681 existentes + 49 novos)
2. Nenhum arquivo em `src/` alterado
3. Nenhum endpoint público `/api/github` alterado
4. Zero dependências novas
5. Fluxo normal do Serginho (prompts não-GitHub) intacto

### Rollback
```bash
git revert <sha-deste-commit>
# Remove githubConversationContext.js, desfaz import e mudanças mínimas no orchestrator, remove test file
```


### O que foi feito
- Criado `api/lib/serginho/formatters/githubResponseFormatter.js` — módulo de formatação inteligente com: `formatReposResponse()` (lista com count, numeração, visibilidade 🔓/🔒, branch default, descrição), `formatBranchesResponse()` (lista com indicador 🛡️ de proteção, repo alvo), `formatFileResponse()` com **smart file-type handling**: `package.json` (nome, versão, scripts, deps, devDeps), `*.md`/`README.md` (primeiro parágrafo, seções detectadas), `*.json` (estrutura/chaves), `*.js|*.jsx|*.ts|*.tsx` (exports e funções detectados), arquivos genéricos (primeiras N linhas); truncamento seguro com aviso `[conteúdo truncado — mostrando primeiros X caracteres]`; `formatErrorResponse()` para GITHUB_DISABLED, GITHUB_NO_TOKEN, GITHUB_VALIDATION_ERROR, GITHUB_API_ERROR com mensagens amigáveis sem vazar código técnico; `formatGitHubToolResult()` como entrada principal
- Modificado minimamente `api/lib/serginho-orchestrator.js`: import do novo formatter; `formatGitHubResult()` agora delega para `formatGitHubToolResult(toolName, data, context)`; erro da tool formatado com `formatErrorResponse()`; context de `githubIntent.params` (owner/repo/path) passado para o formatter; removida constante `MAX_FILE_CONTENT_LENGTH` redundante; zero impacto no fluxo normal não-GitHub
- Criado `api/__tests__/serginho-github-formatter.test.js` — 85 testes cobrindo: repos (count, visibilidade, branch, descrição, top 10, vazio), branches (protected indicator, repo label, count, vazio), arquivo (decode base64, truncamento, sem conteúdo), package.json smart (nome, versão, scripts, deps, devDeps, JSON inválido), README.md (parágrafo, seções), *.json (estrutura), JS/TS (exports, funções), truncamento seguro, formatErrorResponse (todos os códigos), formatGitHubToolResult (dispatch), modo stub, resultados vazios sem crash, segurança (sem token/stacktrace), integração com orchestrator (sem regressão no fluxo normal)

### Por quê
- PR #172 adicionou detecção de intenção GitHub e formatação básica inline no orchestrator — agora a formatação foi extraída para módulo dedicado e enriquecida com lógica contextual por tipo de arquivo
- Respostas mais úteis e legíveis para o usuário final sem alterar a cadeia de chamadas (intent → tools → gateway → service)

### Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| `api/lib/serginho/formatters/githubResponseFormatter.js` | NOVO — formatador inteligente |
| `api/lib/serginho-orchestrator.js` | MODIFICADO MINIMAMENTE — import + delegação para formatter + context passado |
| `api/__tests__/serginho-github-formatter.test.js` | NOVO — 85 testes |
| `CHECKLIST.md` | Esta entrada |
| `CHANGELOG.md` | Entrada em `[Unreleased]` |

### Validação
1. `NODE_OPTIONS='--experimental-vm-modules' ./node_modules/.bin/jest --no-coverage` → 681 testes passando (596 existentes + 85 novos)
2. Nenhum arquivo em `src/` alterado
3. Nenhum endpoint público `/api/github` alterado
4. Nenhuma dependência nova
5. Fluxo normal do Serginho (prompts não-GitHub) intacto — verificado via teste de integração

### Rollback
```bash
git revert <sha-deste-commit>
# Remove githubResponseFormatter.js, desfaz o import e delegação no orchestrator, remove o test file
```

## 2026-03-10 — feat(serginho): detecção de intenção GitHub read-only no orchestrator

### O que foi feito
- Criado `api/lib/serginho/intent/githubIntent.js` — detector leve de intenção GitHub por keyword/regex matching (sem LLM), detecta: `github_list_repos`, `github_list_branches`, `github_get_file` em PT-BR e EN; extrai `owner`, `repo`, `path`; retorna `missing[]` quando parâmetros faltam; retorna `null` para mensagens não-GitHub
- Adicionado early-return no início de `_handleStructured` em `api/lib/serginho-orchestrator.js` (ANTES da análise de complexidade) — quando intenção GitHub é detectada, chama a tool correspondente via `getToolByName(tool).execute(params)` e retorna resposta estruturada; se `null`, fluxo normal continua inalterado
- Adicionada função helper `formatGitHubResult(toolName, data)` no orchestrator — formata resultado de repos/branches/arquivo em texto legível (com emoji, listas, conteúdo base64 decodificado)
- Criado `api/__tests__/serginho-github-intent.test.js` — 38 testes cobrindo: todos os padrões PT/EN, extração de parâmetros, mensagens ambíguas → null, parâmetros faltando → missing[], flag off, stub mode, oauth sem token, integração com orchestrator, fluxo normal preservado, garantia de camadas

### Por quê
- PR #170 criou o gateway GitHub, PR #171 criou a tool layer — agora o Serginho precisa detectar intenções simples de GitHub e usar as tools sem depender de uma chamada LLM extra
- Regra estrutural: NADA executa fora do Serginho — o early-return garante que as tools GitHub são consumidas pelo orchestrator principal

### Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| `api/lib/serginho/intent/githubIntent.js` | NOVO — detector de intenção GitHub |
| `api/lib/serginho-orchestrator.js` | MODIFICADO MINIMAMENTE — import + early-return + helper |
| `api/__tests__/serginho-github-intent.test.js` | NOVO — 38 testes |
| `CHECKLIST.md` | Esta entrada |
| `CHANGELOG.md` | Entrada em `[Unreleased]` |

### Validação
1. `NODE_OPTIONS='--experimental-vm-modules' ./node_modules/.bin/jest serginho-github --no-coverage` → 134 testes passando (96 existentes + 38 novos)
2. Nenhum arquivo em `src/` alterado
3. Nenhum endpoint público `/api/github` alterado
4. Nenhuma dependência nova
5. Nenhum LLM extra chamado para detecção de intenção

### Rollback
```bash
git revert <sha-deste-commit>
# Remove githubIntent.js, desfaz as 3 alterações no orchestrator, remove o test file
```

## 2026-03-06 — feat(abnt): portar ABNT completo do rkmmax-app para rkmmax-hibrido

### O que foi feito
- Substituído `src/pages/Abnt.jsx` (que abria `abnt.kizirianmax.site` em nova aba) pelo editor ABNT completo portado do `rkmmax-app`
- Criados 4 componentes em `src/components/abnt/`:
  - `CitationGenerator.jsx` — gerador de citações ABNT (livro, artigo, site, tese) 100% local
  - `URLImporter.jsx` — importa metadados de URL via `POST /api/abnt-extract-url`
  - `DocumentExporter.jsx` — exporta Word/HTML/PDF via print, 100% local
  - `ReferenceLibrary.jsx` — biblioteca de referências com `localStorage`, 100% local
- Criado `api/abnt-extract-url.js` — scraping HTTP de metadados (sem IA, sem chaves)
- Editor com 4 abas: Capa, Resumo, Conteúdo, Referências — todos os campos clicáveis e editáveis
- Sidebar com 4 ferramentas: Citações, URL, Biblioteca, Exportar
- Nenhuma chave de API exposta no frontend
- Nenhuma chamada de IA no ABNT (tudo local ou scraping)
- Nenhuma dependência nova adicionada ao `package.json`

### Por quê
- Antes: `/abnt` abria `abnt.kizirianmax.site` em nova aba (UX ruim, requeria login separado)
- Agora: editor completo integrado diretamente em `kizirianmax.site/abnt`
- Campos editáveis, abas funcionais, exportação local — sem dependência de deploy externo

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/Abnt.jsx` | SUBSTITUÍDO — editor completo com 4 abas e sidebar |
| `src/components/abnt/CitationGenerator.jsx` | NOVO — gerador de citações ABNT local |
| `src/components/abnt/URLImporter.jsx` | NOVO — importação de metadados via backend |
| `src/components/abnt/DocumentExporter.jsx` | NOVO — exportação Word/HTML/PDF local |
| `src/components/abnt/ReferenceLibrary.jsx` | NOVO — biblioteca localStorage |
| `api/abnt-extract-url.js` | NOVO — scraping HTTP de metadados de URL |
| `CHECKLIST.md` | Esta entrada |

### ENV VAR necessária
- Nenhuma nova variável de ambiente necessária

### Validação
1. `kizirianmax.site/study` → card "Formatador ABNT/APA" clica e navega para `/abnt`
2. `/abnt` exibe editor com 4 abas (Capa, Resumo, Conteúdo, Referências) — todos os campos clicáveis
3. Sidebar: Citações gera referência ABNT, URL importa metadados, Biblioteca salva, Exportar baixa `.doc`
4. Build: `npx vite build` → `✓ built in ~6s` sem erros
5. A4 Gateway Sovereignty: nenhum arquivo novo faz fetch a `api.groq.com`, `api.openai.com`, etc.

### Rollback
```bash
git revert <sha-deste-commit>
# Restaura Abnt.jsx que abria abnt.kizirianmax.site em nova aba
# Remove src/components/abnt/ e api/abnt-extract-url.js
```

---

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
> **Note (PASSO 4):** `api/hybrid.js` was removed in PASSO 4 (PR #254). The Construtor now routes exclusively through `/api/ai` with `agentType: "hybrid"`. Entries below are historical record only.
- ✅ `api/hybrid.js` — Added env var guard (GEMINI_API_KEY / GROQ_API_KEY check) before calling betinhoParallel
- ✅ `api/hybrid.js` — Fixed error message matching: Portuguese "todos os providers falharam" from betinhoParallel now correctly maps to 503 (was falling through to generic 500)
- ✅ Root cause: missing env guard + error message language mismatch
- ✅ Rollback: revert these 2 changes in api/hybrid.js
- ✅ Validation: POST /api/hybrid → returns 503 with helpful message when providers are down (not 500)


## Phase A5.3 — Hybrid Groq-only Safe Mode *(historical — api/hybrid.js removed in PASSO 4)*
- ✅ `api/lib/providers-config.js` — Added `getEnabledProviders()`: filters providers by available env vars at runtime
- ✅ `api/lib/providers-config.js` — Added `parseProviderWeights()`: scaffolding for future weighted routing (reads HYBRID_PROVIDER_WEIGHTS env var)
- ✅ `api/lib/serginho-orchestrator.js` — `betinhoParallel()` now uses `getEnabledProviders()` instead of `Object.keys(PROVIDERS)`
- ✅ `api/lib/serginho-orchestrator.js` — Single-provider safe mode: when only 1 provider is enabled, executes directly without Promise.any race
- ✅ `api/hybrid.js` — Updated hint message: "Configure GROQ_API_KEY (Gemini is optional)"
- ✅ Tests added for `getEnabledProviders`, `parseProviderWeights`, and static verification
- ✅ Root cause: `betinhoParallel()` was racing ALL 6 providers regardless of env vars, causing Gemini failures when only Groq is configured
- ✅ Rollback: revert changes in providers-config.js, serginho-orchestrator.js, and hybrid.js
- ✅ Validation: POST /api/hybrid with only GROQ_API_KEY → works without Gemini errors


## Phase A5.4 — Hybrid Weights Routing + 120B Default *(historical — api/hybrid.js removed in PASSO 4)*
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

## 16. Fix: Hybrid endpoint enforces openai/gpt-oss-120b (Groq-only, no fallback) *(historical — api/hybrid.js removed in PASSO 4)*

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

---

## feat(github): base de integração do Construtor (flag + service + endpoints mínimos)

**Data:** 2026-03-10  
**Issue:** #165  
**PR:** feat(github): base de integração do Construtor (flag + service + endpoints mínimos)

### O que mudou / Por quê

Adicionada a base de integração GitHub para o produto Construtor, com arquitetura limpa, feature flag obrigatória e sem quebrar produção existente.

**Por quê:** O Construtor precisa integrar com repositórios GitHub (listar repos, branches, arquivos) para permitir edição assistida por IA. Esta PR cria a fundação segura antes de implementar o fluxo de autenticação completo (GitHub App).

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `api/lib/github/githubConfig.js` | Feature flag + leitura segura de env (sem expor tokens) |
| `api/lib/github/githubClient.js` | Wrapper HTTP com timeout, retry linear, erro padronizado |
| `api/lib/github/githubService.js` | listRepos, listBranches, getFile (reais); putFile/createPR (stubs NOT_IMPLEMENTED) |
| `api/lib/github/githubTypes.js` | JSDoc/types para padronizar retornos |
| `api/github.js` | Endpoints: GET /api/github/status e GET /api/github/repos |
| `api/__tests__/github.test.js` | Testes unitários (flag, status, repos, stubs) |
| `.env.example` | Documentadas 3 novas variáveis de integração GitHub |
| `vercel.json` | Rewrites para /api/github/status e /api/github/repos |
| `CHECKLIST.md` | Esta entrada |

### Endpoints criados

| Endpoint | Método | Comportamento |
|----------|--------|---------------|
| `/api/github/status` | GET | Sempre 200; retorna `{ enabled, mode, message }` |
| `/api/github/repos` | GET | 501 se flag false; 200 (mock) se stub; 200 (real) se oauth com token |

### Feature flag

```bash
# Padrão — integração DESABILITADA (seguro para produção)
GITHUB_INTEGRATION_ENABLED=false

# Para habilitar em modo stub (sem credenciais reais):
GITHUB_INTEGRATION_ENABLED=true

# Para habilitar em modo oauth (com token real):
GITHUB_INTEGRATION_ENABLED=true
GITHUB_TOKEN=ghp_seutoken
```

### Como testar localmente

```bash
# 1. Iniciar servidor de desenvolvimento (Vercel CLI ou vite proxy)
npm start   # ou: vercel dev

# 2. Com flag false (padrão):
curl http://localhost:3000/api/github/status
# → 200: { "enabled": false, "mode": "stub", "message": "..." }

curl http://localhost:3000/api/github/repos
# → 501: { "error": "...", "message": "...GITHUB_INTEGRATION_ENABLED=true..." }

# 3. Com flag true e sem token (modo stub):
GITHUB_INTEGRATION_ENABLED=true vercel dev
curl http://localhost:3000/api/github/repos
# → 200: { "repos": [...mock...], "mode": "stub" }

# 4. Rodar testes unitários:
npm test -- --testPathPattern=github
```

### Rollback

```bash
git revert <commit-sha>
```

Ou remover manualmente: `api/github.js`, `api/lib/github/`, `api/__tests__/github.test.js` + reverter `vercel.json` e `.env.example`.

### TODOs futuros (GitHub App)

1. **Fluxo de instalação GitHub App** — rota `/api/github/install` que redireciona para GitHub App install URL
2. **Callback de instalação** — `/api/github/app-callback` recebe `installation_id` após instalação
3. **Storage do installation_id** — persistir em Supabase (tabela `github_installations` com user_id + installation_id)
4. **Geração de token por instalação** — JWT assinado com `GITHUB_APP_PRIVATE_KEY` → exchange por access token temporário (60 min)

### Impacto em produção

- **Zero breaking changes**: flag false por padrão — endpoints novos não afetam nada existente
- **Sem dependências novas**: usa `fetch` nativo do Node.js 22
- **Sem alterações em UI** ou outros endpoints existentes

---

## 2026-03-10 — fix(serginho): eliminar degrau no mobile (app-like, isolado)

**PR:** #163

| Item | Detalhe |
|------|---------|
| **O quê** | Corrigido layout app-like no `/serginho`: `position: fixed; inset: 0` no container raiz, cadeia flex correta (header/footer com `flex-shrink: 0`, messages com `min-height: 0; overflow-y: auto`), scroll-lock no `body`/`html` via `useEffect` no mount/unmount |
| **Por quê** | Em mobile, a página `/serginho` "subia um degrau" ao focar o textarea — o body inteiro scrollava. O padrão `position: fixed; inset: 0` elimina esse comportamento travando o container no viewport |
| **Arquivos** | `src/pages/Serginho.css`, `src/pages/Serginho.jsx`, `CHECKLIST.md` |
| **Validação** | 1) Abrir `/serginho` em 360×740 e 390×844 → focar textarea → digitar → enviar → receber resposta → ZERO pulo/degrau 2) Somente `.messages-container` rola 3) Desktop: visual idêntico |
| **Rollback** | `git revert <commit-sha>` — restaura layout anterior do Serginho |

---

## 2026-03-10 — fix(hybrid): esconder topo no mobile e priorizar conversa

**PR:** #164

| Item | Detalhe |
|------|---------|
| **O quê** | Em mobile (`max-width: 640px`), o header do `/hybrid` (bloco com "RKMMAX Híbrido", "Modo", "Sistema", chips de status) é ocultado via `display: none` — o espaço liberado é 100% ocupado pela área de mensagens |
| **Por quê** | No mobile, o header ocupa espaço valioso da tela dificultando a conversa. A ocultação é CSS-only, reversível, e não afeta desktop |
| **Arquivos** | `src/styles/HybridAgent.css`, `CHECKLIST.md` |
| **Validação** | 1) Mobile: abrir `/hybrid` → confirmar sem topo → só chat+input → sem degrau 2) Desktop: topo continua aparecendo igual |
| **Rollback** | `git revert <commit-sha>` — restaura exibição do header em mobile |

---

## 2026-03-10 — feat(github): base de integração do Construtor (flag + service + endpoints mínimos)

**PR:** #166

| Item | Detalhe |
|------|---------|
| **O quê** | Adicionada fundação de integração GitHub para o Construtor: feature flag `GITHUB_INTEGRATION_ENABLED`, cliente HTTP com retry, serviço com `listRepos`/`listBranches`/`getFile` reais e stubs `putFile`/`createPR`, endpoints `GET /api/github/status` e `GET /api/github/repos` |
| **Por quê** | O Construtor precisa integrar com repositórios GitHub para edição assistida por IA. Esta PR cria a fundação segura antes do fluxo de autenticação completo (GitHub App) |
| **Arquivos** | `api/lib/github/`, `api/github.js`, `api/__tests__/github.test.js`, `.env.example`, `vercel.json`, `CHECKLIST.md` |
| **Validação** | 1) `curl /api/github/status` → 200 2) Com flag false: `curl /api/github/repos` → 501 3) Com flag true: 200 com mock 4) `npm test -- --testPathPattern=github` → todos passam |
| **Rollback** | `git revert <commit-sha>` — remove endpoints e arquivos de integração GitHub |

---

## 2026-03-10 — chore(governance): finalizar governança (SECURITY + CHECKLIST + copilot-instructions + CHANGELOG)

**PR:** #167 (este PR)

| Item | Detalhe |
|------|---------|
| **O quê** | Governança finalizada: `SECURITY.md` expandido com política real de divulgação responsável, `CHECKLIST.md` atualizado com PRs #163/#164/#166, `.github/copilot-instructions.md` criado com instruções para o Copilot Agent, `CHANGELOG.md` atualizado com entradas recentes |
| **Por quê** | O `SECURITY.md` era o template genérico do GitHub (versões fictícias 5.x). O `CHECKLIST.md` não registrava os PRs recentes. Não havia instruções para orientar o Copilot no repositório |
| **Arquivos** | `SECURITY.md`, `CHECKLIST.md`, `.github/copilot-instructions.md`, `CHANGELOG.md` |
| **Validação** | 1) `SECURITY.md` contém contato, prazos e escopo reais 2) `CHECKLIST.md` lista PRs #163, #164, #166, #167 3) `.github/copilot-instructions.md` existe com instruções completas 4) `CHANGELOG.md` tem entrada `[Unreleased]` com mudanças recentes |
| **Rollback** | `git revert <commit-sha>` — reverte todos os arquivos de governança ao estado anterior |

---

## 2026-03-10 — chore(docs): criar índice de documentação (docs index)

**PR:** #168

| Item | Detalhe |
|------|---------|
| **O quê** | Criado índice de documentação centralizado: `docs/README.md` (índice completo com seções — Visão Geral, Arquitetura, Governança, Operação/Dev, Produto, Histórico — linkando todos os 40+ arquivos Markdown) e `docs/INDEX.md` (mapa rápido / TL;DR). Adicionada seção "📚 Documentação" no `README.md` da raiz com link para o índice |
| **Por quê** | O repositório tem 40+ arquivos `.md` sem um ponto de entrada centralizado para navegação. O índice permite navegar facilmente sem mover/deletar arquivos |
| **Arquivos** | `docs/README.md` (novo), `docs/INDEX.md` (novo), `README.md` (seção adicionada), `CHECKLIST.md`, `CHANGELOG.md` |
| **Validação** | 1) Abrir `docs/README.md` e verificar que todos os links apontam para arquivos existentes 2) Abrir `docs/INDEX.md` e verificar links rápidos 3) Verificar seção "📚 Documentação" no `README.md` da raiz 4) CI não deve quebrar (mudanças apenas em `.md`) |
| **Rollback** | `git revert <commit-sha>` — remove os arquivos `docs/README.md` e `docs/INDEX.md` e reverte as alterações no `README.md`, `CHECKLIST.md` e `CHANGELOG.md` |

---

## 2026-03-10 — chore(github): hardening da base GitHub (read-only + guardas + testes)

**PR:** este PR

| Item | Detalhe |
|------|---------|
| **O quê** | Hardening da integração GitHub backend: formato de erro padronizado `{ error: { code, message, details? } }`, novos endpoints `?route=branches` e `?route=file` (read-only), validação de input (400), stub data para branches e file, `api/lib/github/githubErrors.js` com helpers `formatErrorResponse`/`mapClientError`/`sanitizeMessage`, 50 novos testes de hardening, documentação em `docs/README.md` |
| **Por quê** | A base GitHub (PR #166) tinha formato de erro inconsistente, sem endpoints branches/file, sem validação de input e sem cobertura de testes de segurança. Necessário para evoluir para "Construtor N2" sem dívida técnica |
| **Arquivos** | `api/github.js`, `api/lib/github/githubErrors.js` (novo), `api/__tests__/github.test.js` (atualizado), `api/__tests__/github-hardening.test.js` (novo), `docs/README.md`, `CHANGELOG.md`, `CHECKLIST.md` |
| **Validação** | 1) `npm test -- --testPathPattern=github` → 66 testes passam 2) Flag false: `?route=status` → 200, `?route=repos` → 501 com `error.code=GITHUB_DISABLED` 3) Flag true stub: `?route=repos` → 200 mock, `?route=branches` sem params → 400 `MISSING_PARAMS`, `?route=branches&owner=u&repo=r` → 200 stub, `?route=file&owner=u&repo=r&path=f` → 200 stub 4) Nenhum endpoint retorna token/segredo na resposta |
| **Rollback** | `git revert <commit-sha>` — remove `githubErrors.js`, reverte `github.js` para versão anterior, remove `github-hardening.test.js`, reverte seção de docs |

---

## 2026-03-10 — feat(serginho): gateway GitHub read-only (backend, behind flag)

**PR:** este PR

| Item | Detalhe |
|------|---------|
| **O quê** | Criado `api/lib/serginho/githubGateway.js` — gateway interno que torna o Serginho o único ponto de entrada para a integração GitHub no backend. Funções: `serginhoListRepos()`, `serginhoListBranches({ owner, repo })`, `serginhoGetFile({ owner, repo, path, ref })`. Retorno padronizado `{ success: true, data }` / `{ success: false, error: { code, message, details? } }` |
| **Por quê** | Regra do projeto: NADA executa fora do Serginho. A integração GitHub (PR #166 + #169) existe como endpoints HTTP, mas o Serginho precisava de uma camada interna para chamar esses serviços diretamente no backend, sem depender de HTTP |
| **Arquivos** | `api/lib/serginho/githubGateway.js` (novo), `api/__tests__/serginho-github-gateway.test.js` (novo), `CHECKLIST.md`, `CHANGELOG.md` |
| **Validação** | 1) `npm test -- --testPathPattern=serginho-github-gateway` → 42 testes passam 2) Flag false: `serginhoListRepos()` retorna `{ success: false, error: { code: 'GITHUB_DISABLED' } }` 3) Stub: `serginhoListRepos()` retorna `{ success: true, data: { repos: [...], mode: 'stub' } }` sem chamar `fetch` 4) OAuth: `serginhoListBranches/serginhoGetFile` chamam `githubService` corretamente 5) Validação: owner/repo/path ausentes retornam `GITHUB_VALIDATION_ERROR` 6) Nenhuma resposta vaza token ou stacktrace |
| **Rollback** | `git revert <commit-sha>` — remove `api/lib/serginho/githubGateway.js` e `api/__tests__/serginho-github-gateway.test.js`, reverte `CHECKLIST.md` e `CHANGELOG.md` |
| **Impacto** | Zero breaking changes — nenhum endpoint existente alterado, nenhuma UI tocada, nenhuma dependência nova. A flag `GITHUB_INTEGRATION_ENABLED=false` por padrão garante que nada muda em produção |

### Códigos de erro do gateway

| Código | Quando |
|--------|--------|
| `GITHUB_DISABLED` | `GITHUB_INTEGRATION_ENABLED` está `false`/ausente |
| `GITHUB_NO_TOKEN` | Modo `oauth` ativo mas `GITHUB_TOKEN` não configurado |
| `GITHUB_VALIDATION_ERROR` | Parâmetros obrigatórios `owner`/`repo`/`path` ausentes |
| `GITHUB_API_ERROR` | Erro na chamada à API real do GitHub (capturado e sanitizado) |

### TODOs futuros (Serginho N2 → N3)

1. ~~**Serginho chamar o gateway** — adicionar detecção de intenção no orquestrador para chamar `serginhoListRepos`/`serginhoListBranches`/`serginhoGetFile` quando o usuário pedir info sobre repos~~ ✅ **concluído** — tools orchestration layer criada (este PR)
2. **Detecção de intenção** — integrar o tools registry no `serginho-orchestrator.js` para detecção automática de intenção GitHub (próximo PR)
3. **Contexto de repositório** — injetar conteúdo de arquivo no prompt do Serginho para assistência de código contextual
4. **Escrita (N3)** — quando GitHub App estiver implementado, adicionar `serginhoWriteFile`/`serginhoCreatePR` ao gateway

---

## 2026-03-21 — chore(legacy): Fase 4 — remover HybridAgent.jsx comprovadamente morto

**PR:** este PR

| Item | Detalhe |
|------|---------|
| **O quê** | Removido `src/pages/HybridAgent.jsx` — componente legado da versão v2.0.0 do sistema híbrido, comprovadamente morto: não importado em `App.jsx` (que usa exclusivamente `HybridAgentSimple`) nem referenciado em nenhum arquivo ativo. |
| **Por quê** | Fase 4 da limpeza de legado: o arquivo mantinha código obsoleto (chamava `https://kizirianmax.site/api/chat` hardcoded, tinha seleção direta de especialistas — padrão já removido na Fase 3) e poderia confundir desenvolvedores sobre qual componente é o ativo em `/hybrid`. |
| **Arquivos** | `src/pages/HybridAgent.jsx` (removido), `CHECKLIST.md`, `CHANGELOG.md` |
| **Validação** | 1) `App.jsx` não importa nem referencia `HybridAgent` 2) Rota `/hybrid` e `/agent` continuam apontando para `HybridAgentSimple` sem alteração 3) `src/styles/HybridAgent.css` mantido (ainda usado por `HybridAgentSimple.jsx`) |
| **Rollback** | `git revert <commit-sha>` — restaura `src/pages/HybridAgent.jsx`, reverte `CHECKLIST.md` e `CHANGELOG.md` |
| **Impacto** | Zero breaking changes — componente não estava montado em nenhuma rota ativa. CSS compartilhado mantido intacto. |

---

## 2026-03-10 — feat(serginho): GitHub read-only tools orchestration layer (backend only)

**PR:** este PR

| Item | Detalhe |
|------|---------|
| **O quê** | Criada camada de orquestração de tools GitHub para uso interno do Serginho. Módulo `api/lib/serginho/tools/githubTools.js` expõe três tools estruturadas (`github_list_repos`, `github_list_branches`, `github_get_file`) com validação de parâmetros e verificação de feature flag ANTES de chamar o gateway. Módulo `api/lib/serginho/tools/index.js` implementa o registry com `GITHUB_TOOLS`, `getToolByName()`, `getAllTools()` e `isGitHubToolsAvailable()`. |
| **Por quê** | Serginho N2: criar a camada de tools que o orchestrator poderá consumir na próxima iteração (detecção de intenção). Regra do projeto: NADA executa fora do Serginho. As tools chamam APENAS o gateway interno — nunca `githubService` diretamente. |
| **Arquivos** | `api/lib/serginho/tools/githubTools.js` (novo), `api/lib/serginho/tools/index.js` (novo), `api/__tests__/serginho-github-tools.test.js` (novo), `CHECKLIST.md`, `CHANGELOG.md` |
| **Validação** | 1) `npm test -- --testPathPattern=serginho-github-tools` → 54 testes passam 2) Validação de parâmetros ocorre ANTES de chamar o gateway 3) Flag off: tools retornam `GITHUB_DISABLED` sem chamar o gateway 4) Stub: tools repassam dados stub do gateway 5) Registry: `getToolByName('github_list_repos')` retorna descritor correto 6) `isGitHubToolsAvailable()` reflete o estado da feature flag |
| **Rollback** | `git revert <commit-sha>` — remove `api/lib/serginho/tools/githubTools.js`, `api/lib/serginho/tools/index.js` e `api/__tests__/serginho-github-tools.test.js`, reverte `CHECKLIST.md` e `CHANGELOG.md` |
| **Impacto** | Zero breaking changes — nenhum endpoint existente alterado, nenhuma UI tocada, nenhuma dependência nova. Nenhum código existente foi modificado. A flag `GITHUB_INTEGRATION_ENABLED=false` por padrão garante que nada muda em produção. |

### Códigos de erro das tools

| Código | Quando |
|--------|--------|
| `GITHUB_DISABLED` | `GITHUB_INTEGRATION_ENABLED` está `false`/ausente (verificado pela tool antes de chamar o gateway) |
| `GITHUB_VALIDATION_ERROR` | Parâmetros obrigatórios `owner`/`repo`/`path` ausentes (verificado pela tool antes de chamar o gateway) |
| `GITHUB_NO_TOKEN` | Modo `oauth` ativo mas `GITHUB_TOKEN` não configurado (repassado do gateway) |
| `GITHUB_API_ERROR` | Erro na chamada à API real do GitHub (repassado do gateway, sem stacktrace) |
