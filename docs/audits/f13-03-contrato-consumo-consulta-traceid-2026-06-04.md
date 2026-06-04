# F13-03 — Contrato de consumo da consulta observacional por traceId

## 1. Identificação

- **Data:** 2026-06-04
- **Repositório:** `kizirianmax/rkmmax-hibrido`
- **Base:** `main`
- **Tipo:** contrato documental de consumo
- **Fase:** F13-03 / consulta observacional por `traceId`

## 2. Estado atual da Fase 13

- **F13-01:** abertura formal documental da Fase 13.
- **F13-02:** endpoint read-only de consulta observacional por `traceId`.

## 3. Contrato de consumo

- A consulta por `traceId` é estritamente **observacional/read-only**.
- O consumo deve ocorrer apenas como **metadados de proveniência**.
- O endpoint contemplado é `GET /api/artifact-trace?traceId=<trace-id>`.
- O contrato é subordinado à arquitetura: Serginho IA como gateway único e Artifact Ledger como camada observacional.
- O consumo não pode controlar runtime, decisão, geração, ZIP, preview, execução, prompts, providers/modelos, UI ou orquestração.

## 4. Requisitos obrigatórios de acesso

- Requisição autenticada.
- Filtro obrigatório por **`trace_id + user_id`**.
- Vedação de consulta pública/global por `traceId`.
- Vedação de correlação entre usuários.

## 5. Campos interpretáveis para consumo

- `traceId`
- `status`
- `eventCount`
- `firstEventAt`
- `lastEventAt`
- `artifactIds`
- `hasFeedback`
- `timeline`
- `warnings`
- `limitations`

## 6. Limites sem overclaim

- não é garantia de sucesso operacional;
- não é prova criptográfica completa;
- não é sessão global pública;
- não é rastreamento entre usuários;
- não substitui auditoria externa;
- não altera runtime/decisão;
- não altera geração/ZIP/preview/execução;
- não altera prompts/providers/modelos;
- não altera UI/orquestração;
- não cria bypass ao Serginho IA.

## 7. Payload proibido

- eventos brutos do ledger;
- conteúdo bruto;
- `zipBase64`;
- `files`;
- `content`;
- `contentPreview`;
- `user_email`;
- feedback bruto.

## 8. Uso permitido

- auditoria observacional interna;
- monitoramento de proveniência por `traceId`;
- diagnóstico de sequência temporal de eventos;
- apoio a governança e evidências para revisão humana.

## 9. Fora de escopo desta entrega

- implementação de endpoint adicional;
- migration;
- alteração funcional em `api/` ou `src/`;
- testes, prompts, providers/modelos, UI e orquestração;
- Auth/SaaS/Payments;
- Stripe/Vercel/secrets/workflows;
- Dependabot.

## 10. Rollback

- `git revert <commit-sha>`
