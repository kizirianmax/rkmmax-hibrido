# F14-02 — Documentação canônica dos endpoints observacionais existentes

## 1. Identificação

- **Data:** 2026-06-04
- **Repositório:** `kizirianmax/rkmmax-hibrido`
- **Base:** `main`
- **Tipo:** documentação canônica / alinhamento documental
- **Fase:** F14-02

## 2. Contexto

- **F11 Artifact Ledger/proveniência:** estabeleceu o ledger observacional de proveniência para eventos de preview e decisão.
- **F12 replay/diff:** consolidou replay e diff como camadas observacionais/read-only derivadas do Artifact Ledger.
- **F13 consulta por `traceId`:** adicionou consulta observacional/read-only por `traceId`, filtrada por usuário autenticado.
- **F14 consumo visual observacional read-only:** prepara consumo visual futuro de metadados observacionais, sem decisão de runtime e sem UI funcional nesta etapa.

## 3. Objetivo

- Documentar canonicamente os endpoints observacionais existentes.
- Alinhar o README para evitar ambiguidade sobre execução, preview funcional, sandbox real e time-travel funcional.
- Evitar overclaim sobre garantias, segurança absoluta, SLA, clientes, receita ou tração.

## 4. Endpoints contemplados

Apenas handlers reais existentes foram contemplados:

- `GET /api/artifact-ledger?artifactId=<artifact-id>` — `api/artifact-ledger.js`.
- `GET /api/artifact-provenance?artifactId=<artifact-id>` — `api/artifact-provenance.js`.
- `GET /api/artifact-replay?artifactId=<artifact-id>` — `api/artifact-replay.js`.
- `GET /api/artifact-replay-diff?artifactId=<artifact-id>` — `api/artifact-replay-diff.js`.
- `GET /api/artifact-trace?traceId=<trace-id>` — `api/artifact-trace.js`.

## 5. Limites preservados

- Sem alteração funcional.
- Sem endpoint novo.
- Sem migration.
- Sem UI.
- Sem execução.
- Sem payload bruto.
- Sem bypass ao Serginho.
- Sem alteração de runtime, geração, ZIP, preview funcional, prompts, providers/modelos, orquestração, Especialistas ou ABNT.

## 6. Payload proibido

- Eventos brutos, quando não permitido pelo contrato do endpoint.
- Conteúdo bruto.
- `zipBase64`.
- `files`.
- `content`.
- `contentPreview`.
- `user_email`.
- Feedback bruto.

## 7. Fora de escopo

- Implementação visual.
- Certificado exportável.
- Sandbox real.
- Dependabot.
- Auth/SaaS/Payments.
- Especialistas.
- ABNT.

## 8. Rollback

```bash
git revert <commit-sha>
```
