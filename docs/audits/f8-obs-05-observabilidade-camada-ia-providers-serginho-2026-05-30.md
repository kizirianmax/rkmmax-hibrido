# F8-OBS-05 — Observabilidade mínima da camada de IA/providers usados pelo Serginho

**ID:** F8-OBS-05  
**Fase:** 8 — Observabilidade documental mínima  
**Data de referência:** 2026-05-30  
**Tipo:** Documental/observabilidade (sem implementação funcional)  
**Repositório auditado:** `kizirianmax/rkmmax-hibrido` (exclusivo)

---

## 1) Escopo e limites desta entrega

- Entrega **somente documental**.
- Não houve alteração em runtime, UI, rotas, testes, providers/modelos, fallback, prompts, registry, workflows ou dependências.
- Não houve execução de chamada real a modelo que dependa de secret/crédito/custo.
- Não foi usado nenhum outro repositório, serviço externo, Vercel, Supabase ou painel de provider.

---

## 2) Pré-condições obrigatórias (confirmadas antes da escrita)

1. Base branch `main`: **confirmada** (`origin/main` atualizado localmente).
2. PR #511 mergeado em `main`: **confirmado** (`merged: true`, base `main`).
3. PR #512 mergeado em `main`: **confirmado** (`merged: true`, base `main`).
4. PR #513 mergeado em `main`: **confirmado** (`merged: true`, base `main`).
5. PR #514 mergeado em `main`: **confirmado** (`merged: true`, base `main`).
6. PR #515 mergeado em `main`: **confirmado** (`merged: true`, base `main`).
7. Arquivos/camadas relevantes existentes no repositório: **confirmado**:
   - `api/lib/serginho-orchestrator.js`
   - `api/lib/providers-config.js`
   - `api/lib/model-registry.js`
   - `src/utils/intelligentRouter.js`
   - `src/config/modelPriority.js`
   - `api/health.js`
   - `docs/architecture.md` e `docs/api.md`

---

## 3) Mapeamento mínimo da camada IA abaixo do Serginho

## 3.1 Orquestrador soberano (gateway único)

Evidências no repositório:

- `api/lib/serginho-orchestrator.js` define o Serginho como **"ÚNICO ponto de entrada para TODAS as requisições de IA"**.
- `api/ai.js` centraliza execução via `executeAITask(...)` e chama `serginho.handleRequest(...)`.
- `api/__tests__/a4-gateway-sovereignty.test.js` valida ausência de bypass direto para endpoints de provider fora do orquestrador.

Conclusão arquitetural explícita:

- **Serginho não é modelo.**
- **Serginho é o orquestrador soberano/gateway único.**
- **Groq, Gemini e demais modelos são motores de execução abaixo da orquestração.**

## 3.2 Providers/modelos/aliases encontrados

Configuração de providers (fonte principal): `api/lib/providers-config.js`

- Aliases de provider no código:
  - `llama-120b` → `openai/gpt-oss-120b` (type `groq`)
  - `llama-70b` → `llama-3.3-70b-versatile` (type `groq`)
  - `gemini-3-flash` → `gemini-3-flash-preview` (type `google`)
  - `gemini-3.1-pro` → `gemini-3.1-pro-preview` (type `google`)
  - `gemini-pro` → `gemini-2.5-pro` (type `google`)

Prioridade/seleção manual (UI operacional): `src/config/modelPriority.js`

- `AUTO_PRIORITY_ORDER` (alias lógico usado na seleção automática).
- `MANUAL_MODEL_OPTIONS` (inclui `auto` + aliases acima, para seleção manual operacional).

Distinções observadas:

- **Provider físico/infrastructure:** `groq` ou `google`.
- **Alias lógico de roteamento:** ex. `gemini-pro`, `llama-120b`.
- **Modelo físico (ID do provider):** ex. `gemini-2.5-pro`, `openai/gpt-oss-120b`.
- **Tier lógico:** `complex`, `medium`, `fallback` (`providers-config`) e `logicalTier` em `MODEL_METADATA`.

## 3.3 Fallback, prioridade, seleção manual e registry

- Roteamento inicial por análise de complexidade: `src/utils/intelligentRouter.js` (`routeToProvider`).
- Cadeia de fallback explícita: `FALLBACK_CHAIN` + `getNextFallback(...)` em `src/utils/intelligentRouter.js`.
- Execução de fallback no Serginho: `api/lib/serginho-orchestrator.js` (`_handleStructured`), incluindo salto de providers desabilitados por env.
- Seleção manual (`forceProvider`) validada no Serginho; provider desabilitado gera erro explícito (sem fallback silencioso).
- Registry/métricas internas:
  - `api/lib/model-registry.js` (health score, success/failure, timeout, circuit breaker state por modelo)
  - `MetricsTracker` em `api/lib/serginho-orchestrator.js` (requests, uso por provider, tempo médio)

## 3.4 Endpoint de health/status

- Endpoint identificado: `GET /api/health` (`api/health.js`).
- Retorna estrutura com: `status`, `service`, `version`, `environment`, `timestamp`, `commit`, `models`, `primaryProvider`.
- Health testado no repositório em `api/__tests__/health-and-hybrid-smoke.test.js`.

---

## 4) Manual/checklist de observabilidade mínima (owner)

## 4.1 Saúde básica (sem secrets)

1. Consultar `GET /api/health`.
2. Confirmar `status: "ok"` e presença de `timestamp`, `commit`, `models`, `primaryProvider`.
3. Verificar se `models[]` reflete providers habilitados no ambiente (dependente de API keys).

## 4.2 Latência percebida (sem inventar métricas)

1. Medir apenas latência percebida de ponta a ponta em chamadas operacionais via UI (`Serginho`, `Híbrido`, `Especialistas`).
2. Em incidentes, comparar tempo de resposta entre tentativas sucessivas no mesmo contexto.
3. Não declarar SLA/uptime/percentis sem telemetria real de produção.

## 4.3 Falhas por provider/modelo

Sinais objetivos em mensagens/erros já previstos no código:

- Ausência de chave: `GROQ_API_KEY environment variable is required`.
- Ausência de chave Gemini: erro de provider indisponível ao forçar (`Provider "gemini-pro" is not available ...`).
- Erro Groq: `Groq API error: ...`.
- Erro Gemini: `Gemini API error: ...`.
- Exaustão de fallback: `All providers failed. Tried: ...`.

## 4.4 Fallback

1. Em erro de provider primário, verificar transição para próximo alias da cadeia (`FALLBACK_CHAIN`).
2. Confirmar se houve `fallbackLevel > 0` nos metadados retornados pelo Serginho quando aplicável.
3. Diferenciar fallback automático de seleção manual (`forceProvider`) com `noFallback`.

## 4.5 Diferenciar falha de provider vs falha do Serginho

- **Provável falha de provider/modelo:** erro explícito de API key/provider endpoint/modelo.
- **Provável falha de orquestração Serginho:** falha antes/depois da chamada de provider (roteamento, circuito, montagem de resposta, validação de opção), sem erro típico do endpoint do provider.

## 4.6 Sinais de degradação operacional

- Aumento perceptível de tempo de resposta.
- Crescimento de fallback recorrente.
- Mais erros de indisponibilidade por provider.
- Circuit breaker abrindo com frequência (observável apenas com logs internos/snapshot runtime).

## 4.7 O que é observável publicamente vs não observável

Observável sem acesso privilegiado:

- `GET /api/health`.
- Comportamento percebido nas UIs operacionais.
- Estrutura de fallback/roteamento documentada no código.

Não observável sem logs/secrets/ambiente externo:

- Taxa real de erro por provider em produção.
- Latência estatística real por provider (p95/p99).
- Estado histórico de circuit breaker em produção.
- Custos reais por token/chamada por provider.

---

## 5) Testes/evidências já documentados no repositório

- F8-OBS-02 (PR #513) registrou evidência nominal dos testes críticos:
  - `api/__tests__/model-priority.test.js`
  - `api/__tests__/specialist-model-selector.test.js`
- Testes de soberania do gateway: `api/__tests__/a4-gateway-sovereignty.test.js`.
- Testes de health/fallback: `api/__tests__/health-and-hybrid-smoke.test.js`.

---

## 6) Riscos e observações (sem correção funcional nesta tarefa)

1. Em `api/health.js`, o bloco `providers` expõe explicitamente `groq`, enquanto `models` é montado via providers habilitados (incluindo Google quando aplicável). Isso pode gerar leitura parcial da saúde por provider.
2. `model-registry` registra modelos adicionais legados (`llama-3.1-70b-versatile`, `mixtral-8x7b-32768`) não presentes no `PROVIDERS` atual; observar coerência entre registry e configuração ativa.
3. A documentação histórica do repositório menciona multi-provider em estabilização; qualquer divergência entre documentação e comportamento real deve ser tratada em tarefa própria (fora deste escopo documental).

---

## 7) Limitações honestas desta auditoria

- Não foram feitas chamadas reais a modelos que demandem secret/crédito/custo.
- Não houve acesso a Vercel, Supabase, logs externos, painéis de provider ou secrets.
- Não foram inventadas métricas de latência, uptime, SLA ou status operacional externo.
- Não foi assumido provider ativo sem evidência no repositório.

---

## 8) Conclusão

A observabilidade mínima documental da camada IA foi mapeada **preservando a autoridade do Serginho como orquestrador soberano** e mantendo providers/modelos (Groq, Gemini e outros aliases) como camada de execução abaixo da orquestração, sem implementação funcional.

Rollback documental, se necessário: `git revert <commit-sha>`.
