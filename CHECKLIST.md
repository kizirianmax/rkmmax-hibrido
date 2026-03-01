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

8) Agentes Ocultos
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

## 🚀 Deploy Status

- **Produção:** https://rkmmax-app.vercel.app
- **GitHub:** https://github.com/kizirianmax/Rkmmax-app
- **Último deploy:** 23/10/2025
- **Status:** ✅ Funcionando
- **Bugs críticos:** 0



---

## Protocolo Oficial de Operações no Repositório

> **Tipo:** Governança Estrutural
> **Impacto:** Sistêmico
> **Obrigatoriedade:** Permanente
> **Vigência:** A partir de 2026-03-01

### Motivação

O projeto atingiu um nível de complexidade que exige rastreabilidade completa de todas as operações realizadas. Toda ação — seja de código, configuração, documentação ou infraestrutura — deve ser precedida de leitura do estado atual e seguida de registro formal do que foi feito. Isso evita perda de contexto, retrabalho e decisões conflitantes entre sessões.

---

### Regras Obrigatórias

#### Antes de qualquer ação

- [ ] **Leitura obrigatória do estado atual do repositório** — estrutura de pastas, arquivos críticos, últimos commits
- [ ] **Verificação do `CHECKLIST.md` vigente** — entender o que está feito, pendente e em progresso
- [ ] **Verificação das docs de governança** (`docs/`) — arquitetura, auditoria, deployment, especialistas

#### Após qualquer ação

- [ ] **Atualização obrigatória do `CHECKLIST.md`** — marcar o item como concluído ou atualizar seu status
- [ ] **Registro do que foi feito** — descrição objetiva da operação realizada
- [ ] **Justificativa da ação** — por que foi necessário fazer
- [ ] **Estado resultante** — qual é o estado do sistema após a operação
- [ ] **Impacto arquitetural** — se a operação afetou arquitetura, dependências ou fluxos, documentar em `docs/`

---

### Formato de Registro no Checklist

Toda entrada de operação realizada deve seguir o padrão abaixo:

```
### [DATA] — [TIPO DE OPERAÇÃO]
- **O que foi feito:** descrição objetiva
- **Justificativa:** por que foi necessário
- **Estado resultante:** o que mudou no sistema
- **Impacto arquitetural:** sim/não — se sim, ver docs/[ARQUIVO].md
- **Commit:** hash e mensagem
- **PR:** número e link (se aplicável)
```

---

### Histórico de Operações Registradas

#### 2026-03-01 — Unificação do Orquestrador Serginho

- **O que foi feito:** Migração de `SerginhoContextual v2.0` e `Serginho.js v1` para `api/lib/serginho-orchestrator.js` como único ponto de orquestração
- **Justificativa:** Existiam 3 implementações paralelas e conflitantes do orquestrador, gerando risco de bypass e inconsistência de comportamento
- **Estado resultante:** 1 único orquestrador ativo (`api/lib/serginho-orchestrator.js` v2.1.0), arquivos legados removidos, 331/331 testes passando
- **Impacto arquitetural:** Sim — ver `docs/ARQUITETURA_AGENTES.md`
- **Commit:** `5192887` — `refactor: serginho multi-orch unificado v2.1.0`
- **PR:** Merge direto em main (pré-regra)

#### 2026-03-01 — Correção de Vulnerabilidades de Dependências

- **O que foi feito:** Execução de `npm audit fix` — 5 pacotes atualizados no `package-lock.json`
- **Justificativa:** 7 vulnerabilidades detectadas pelo Dependabot em dependências do `react-scripts`
- **Estado resultante:** Vulnerabilidades corrigíveis resolvidas; 7 restantes requerem migração para Vite
- **Impacto arquitetural:** Não (apenas `package-lock.json`)
- **Commit:** `3024f88` — `fix: corrigidas vulnerabilidades automáticas detectadas`
- **PR:** Merge direto em main

#### 2026-03-01 — Remoção de Código Morto (Warnings de CI)

- **O que foi feito:** Remoção de imports não utilizados, variáveis não utilizadas e 13 `console.log` em 6 arquivos
- **Justificativa:** Warnings quebrando o build no CI
- **Estado resultante:** Build limpo, 331/331 testes passando, zero alterações de lógica
- **Impacto arquitetural:** Não
- **Commit:** `2935a27` — `fix: remove imports, variáveis não usadas e console.logs (CI warnings)`
- **PR:** Merge direto em main

#### 2026-03-01 — Padronização para Deploy na Vercel

- **O que foi feito:** Criação/atualização de `vercel.json` e `.env.example` em todos os repositórios; correção de segurança no `vite.config.js` do `kizi-agent`
- **Justificativa:** Repositórios sem configuração Vercel padronizada
- **Estado resultante:** Todos os projetos prontos para import direto GitHub → Vercel
- **Impacto arquitetural:** Não (apenas configuração de deploy)
- **Commit:** Por repositório (ver histórico de cada repo)
- **PR:** Merge direto em main

#### 2026-03-01 — Auditoria de Variáveis de Ambiente Vercel

- **O que foi feito:** Auditoria completa das variáveis de 5 projetos na Vercel via API REST; varredura por Gemini/Google AI
- **Justificativa:** Limpeza de variáveis obsoletas de provedores de IA descontinuados
- **Estado resultante:** Nenhuma variável Gemini/Google AI encontrada; `ANTHROPIC_API_KEY` mantida (uso ativo confirmado)
- **Impacto arquitetural:** Não
- **Commit:** `bb5d30c` — `docs(governance): adiciona auditoria oficial Vercel env vars (sem Gemini)`
- **PR:** [#107](https://github.com/kizirianmax/rkmmax-hibrido/pull/107)

#### 2026-03-01 — Formalização do Protocolo de Operações

- **O que foi feito:** Adição da seção "Protocolo Oficial de Operações no Repositório" ao `CHECKLIST.md`
- **Justificativa:** Projeto atingiu nível de complexidade que exige rastreabilidade formal de todas as operações
- **Estado resultante:** Protocolo de governança ativo e versionado
- **Impacto arquitetural:** Não (apenas documentação)
- **Commit:** `governance: formaliza protocolo obrigatório de operações`
- **PR:** A ser criado

---

### Próximas Ações Pendentes (Governança)

- [ ] Migração de `react-scripts` para Vite (elimina 7 vulnerabilidades restantes)
- [ ] Configuração de variáveis reais no projeto `rkmmax-hibrido` na Vercel (atualmente apenas placeholders)
- [ ] Remoção de `src/api/ExternalAPIManager.js` (código morto — referencia `ANTHROPIC_API_KEY` mas não é importado)
- [ ] Implementar RLS/Policies no Supabase (`user_profiles`, `trusted_chunks`, `user_actions`)
- [ ] Configurar Redis/Upstash para persistência de cache e circuit breaker entre cold starts
