# Referência de API — RKMMAX Híbrido

> Escopo: referência canônica ativa da API; `docs/API.md` existe apenas como stub de compatibilidade.

Todas as rotas são funções serverless em `api/`.

## Endpoints ativos

| Endpoint | Método(s) | Arquivo | Observação |
|---|---|---|---|
| `/api/health` | GET | `api/health.js` | Health check |
| `/api/chat` | POST | `api/chat.js` | Chat principal |
| `/api/ai` | POST | `api/ai.js` | Roteamento IA (Serginho/especialistas/híbrido) |
| `/api/transcribe` | POST | `api/transcribe.js` | Atualmente retorna `501 TRANSCRIPTION_NOT_AVAILABLE` |
| `/api/abnt-extract-url` | POST | `api/abnt-extract-url.js` | Extração de conteúdo ABNT |
| `/api/study-lab` | POST | `api/study-lab.js` | Ferramentas de estudo |
| `/api/checkout` | POST | `api/checkout.js` | Checkout Stripe |
| `/api/stripe-webhook` | POST | `api/stripe-webhook.js` | Webhook Stripe |
| `/api/github-oauth` | GET | `api/github-oauth.js` | Callback OAuth GitHub |
| `/api/github` | GET/POST | `api/github.js` | Integração GitHub (backend) |
| `/api/admin` | POST | `api/admin.js` | Operações administrativas |
| `/api/artifact` | POST | `api/artifact.js` | Empacotamento de artefatos |
| `/api/artifact-preview` | POST/PATCH | `api/artifact-preview.js` | Preview, revisão e exportação de artefatos; `executeArtifact` permanece desativado |
| `/api/artifact-ledger` | GET | `api/artifact-ledger.js` | Consulta observacional/read-only do Artifact Ledger por `artifactId` |
| `/api/artifact-provenance` | GET | `api/artifact-provenance.js` | Proveniência observacional/read-only por `artifactId` |
| `/api/artifact-replay` | GET | `api/artifact-replay.js` | Replay observacional/read-only por `artifactId` |
| `/api/artifact-replay-diff` | GET | `api/artifact-replay-diff.js` | Diff/veredito observacional/read-only por `artifactId` |
| `/api/artifact-trace` | GET | `api/artifact-trace.js` | Consulta observacional/read-only por `traceId` |


## Endpoints observacionais de artefatos

Os endpoints abaixo refletem apenas handlers já existentes. Eles não executam artefatos, não criam sandbox real, não restauram versões funcionais, não fazem time-travel funcional e não constituem prova criptográfica completa. O consumo deve permanecer sob a arquitetura em que Serginho IA é o orquestrador soberano e gateway único; estes endpoints são camadas observacionais derivadas do Artifact Ledger.

### `GET /api/artifact-ledger?artifactId=<artifact-id>`

- **Handler:** `api/artifact-ledger.js`.
- **Método:** `GET` apenas; outros métodos retornam `405`.
- **Parâmetro exigido:** `artifactId` em query string; ausência retorna `400` com `code: "missing_artifact_id"`.
- **Autenticação:** exige cabeçalho `Authorization` com token de autenticação validado por `verifyAuth(req)`; falhas retornam `401` ou `503`, conforme o erro de autenticação.
- **Filtro aplicado:** leitura por `artifact_id + user_id` via `readLedgerEvents({ artifactId, userId: user.id })`; não há consulta pública/global entre usuários.
- **Natureza:** observacional/read-only no handler; consulta eventos já registrados no Artifact Ledger e não faz insert/update/delete.
- **Payload seguro:** `{ success, artifactId, events }`, com eventos sanitizados para campos seguros como `ledger_id`, `artifact_id`, `event_type`, `trace_id`, `artifact_checksum`, origem, timestamps, validação/status/resumo do preview e decisão.
- **Payload proibido:** conteúdo bruto do artefato, `zipBase64`, `files`, `content`, `contentPreview`, `user_email`, segredos/tokens e execução/sandbox.
- **Limitações:** pode expor metadados observacionais já persistidos, incluindo `feedback` normalizado pelo ledger; não deve ser tratado como auditoria externa, prova criptográfica completa ou garantia de integridade absoluta.

### `GET /api/artifact-provenance?artifactId=<artifact-id>`

- **Handler:** `api/artifact-provenance.js`.
- **Método:** `GET` apenas; outros métodos retornam `405`.
- **Parâmetro exigido:** `artifactId` em query string; ausência retorna `400` com `code: "missing_artifact_id"`.
- **Autenticação:** exige token validado por `verifyAuth(req)`.
- **Filtro aplicado:** leitura por `artifact_id + user_id` via `readLedgerEvents({ artifactId, userId: user.id })`.
- **Natureza:** observacional/read-only; deriva proveniência a partir de eventos existentes.
- **Payload seguro:** `{ success, artifactId, provenance }`, incluindo status, confiança, flags de checksum/traceId, contagem e timestamps de eventos, origem, validação, avisos e limitações.
- **Payload proibido:** eventos brutos, conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email`, segredos/tokens e feedback bruto.
- **Limitações:** a proveniência é veredito observacional derivado do ledger; não revalida o conteúdo atual, não altera runtime/decisão e não é prova criptográfica completa.

### `GET /api/artifact-replay?artifactId=<artifact-id>`

- **Handler:** `api/artifact-replay.js`.
- **Método:** `GET` apenas; outros métodos retornam `405`.
- **Parâmetro exigido:** `artifactId` em query string; ausência retorna `400` com `code: "missing_artifact_id"`.
- **Autenticação:** exige token validado por `verifyAuth(req)`.
- **Filtro aplicado:** leitura por `artifact_id + user_id` via `readLedgerEvents({ artifactId, userId: user.id })`.
- **Natureza:** observacional/read-only; deriva replay a partir de eventos existentes.
- **Payload seguro:** `{ success, artifactId, replay }`, com status, contagem, timestamps, `traceIds`, checksum, timeline segura, avisos e limitações.
- **Payload proibido:** eventos brutos, conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email` e feedback bruto; a timeline expõe apenas `hasFeedback`.
- **Limitações:** replay não restaura artefatos, não é time-travel funcional, não executa código e não altera geração, ZIP, preview, decisão, prompts, providers/modelos, UI ou orquestração.

### `GET /api/artifact-replay-diff?artifactId=<artifact-id>`

- **Handler:** `api/artifact-replay-diff.js`.
- **Método:** `GET` apenas; outros métodos retornam `405`.
- **Parâmetro exigido:** `artifactId` em query string; ausência retorna `400` com `code: "missing_artifact_id"`.
- **Autenticação:** exige token validado por `verifyAuth(req)`.
- **Filtro aplicado:** leitura por `artifact_id + user_id` via `readLedgerEvents({ artifactId, userId: user.id })`.
- **Natureza:** observacional/read-only; deriva diff/veredito a partir de eventos existentes.
- **Payload seguro:** `{ success, artifactId, diff }`, com status, contagens, timestamps, `traceIds`, flags de checksum, transições seguras, avisos e limitações.
- **Payload proibido:** eventos brutos, conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email` e feedback bruto; as transições expõem apenas flags como `hasFeedbackOnToEvent`.
- **Limitações:** diff não restaura artefatos, não revalida conteúdo atual, não representa histórico Git/versionamento completo e não é prova criptográfica completa.

### `GET /api/artifact-trace?traceId=<trace-id>`

- **Handler:** `api/artifact-trace.js`.
- **Método:** `GET` apenas; outros métodos retornam `405`.
- **Parâmetro exigido:** `traceId` em query string; ausência retorna `400` com `code: "missing_trace_id"`.
- **Autenticação:** exige token validado por `verifyAuth(req)`.
- **Filtro aplicado:** leitura por `trace_id + user_id` via `readLedgerEventsByTraceId({ traceId, userId: user.id })`; não há rastreamento global entre usuários.
- **Natureza:** observacional/read-only; deriva consulta por traceId a partir de eventos existentes.
- **Payload seguro:** `{ success, traceId, trace }`, com status, contagens, `artifactIds`, timestamps, flags de checksum, timeline segura, avisos e limitações.
- **Payload proibido:** eventos brutos, conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email` e feedback bruto; a timeline expõe apenas `hasFeedback`.
- **Limitações:** `traceId` é metadado observacional; não é garantia, sessão pública global, prova criptográfica completa, commit Git ou mecanismo de decisão de runtime.

## Garantias de transparência

- `executeArtifact` permanece desativado por decisão arquitetural; não há execução sandboxed real nesta etapa.
- Não há bypass direto frontend → provider.
- Multi-provider (Groq + Gemini) permanece em estabilização sob orquestração do Serginho.
- Replay, diff e consulta por `traceId` são observacionais/read-only e não controlam runtime.

## Referências

- [../README.md](../README.md)
- [architecture.md](architecture.md)
- [deployment.md](deployment.md)
