# F13-01 — Abertura formal da Fase 13 — Consulta observacional por traceId

## 1. Identificação

- **Data:** 2026-06-03
- **Repositório:** `kizirianmax/rkmmax-hibrido`
- **Base:** `main`
- **Tipo:** abertura formal de fase
- **Fase aberta:** Fase 13 / consulta observacional por `traceId`

## 2. Contexto

- Fase 11 encerrada formalmente com Artifact Ledger / proveniência observacional.
- Fase 12 encerrada formalmente com replay/diff observacional do ciclo de revisão.
- Artifact Ledger já possui `traceId` opcional/observacional.
- Replay/diff já existe como leitura derivada do Artifact Ledger.
- Consulta por `traceId` deve ser apenas observacional/read-only.

## 3. Objetivo da Fase 13

- Permitir auditoria por `traceId`.
- Facilitar correlação de eventos observacionais.
- Melhorar rastreabilidade interna.
- Apoiar diagnóstico e governança.
- Não alterar decisões de runtime.

## 4. Limites obrigatórios

- Read-only.
- Autenticado.
- Filtrado por `user_id`.
- Sem conteúdo bruto.
- Sem `zipBase64`.
- Sem `files`.
- Sem `content`.
- Sem `contentPreview`.
- Sem `user_email`.
- Sem feedback bruto.
- Sem consulta pública/global por `traceId`.
- Sem enumeração entre usuários.
- Sem prova criptográfica completa.
- Sem alteração em geração, ZIP, preview, execução, prompts, providers, UI ou orquestração.

## 5. Riscos e mitigação

- **Risco de correlação indevida entre artefatos:** mitigação obrigatória por autenticação, filtro por `user_id`, payload seguro e linguagem observacional.
- **Risco de enumeração de `traceId`:** mitigação obrigatória por autenticação, filtro por `user_id`, ausência de consulta pública/global e respostas sem dados brutos.
- **Risco de overclaim:** mitigação obrigatória por linguagem observacional, limites explícitos e vedação de prova criptográfica completa.

## 6. Plano sugerido da Fase 13

- **F13-01:** abertura documental.
- **F13-02:** endpoint read-only de consulta por `traceId`, se aprovado.
- **F13-03:** contrato formal de resposta/privacidade.
- **F13-04:** encerramento formal da Fase 13.

## 7. Critérios de sucesso

- Filtro obrigatório por `user_id`.
- Retorno apenas de metadados seguros.
- Nenhuma escrita no banco.
- Nenhum bypass ao Serginho.
- Nenhum conteúdo bruto.
- Testes sem Supabase real nas etapas funcionais futuras.
- `CHECKLIST.md` atualizado a cada PR.

## 8. Fora de escopo

- UI.
- Certificado exportável.
- Execução sandboxed real.
- Reativar `executeArtifact`.
- Geração/ZIP/preview/execução.
- Prompts.
- Providers/modelos.
- Auth/SaaS/Payments.
- Especialistas.
- ABNT.
- Dependabot.
- `package.json` / `package-lock.json`.
- Workflows/secrets.

## 9. Rollback

- `git revert <commit-sha>`
