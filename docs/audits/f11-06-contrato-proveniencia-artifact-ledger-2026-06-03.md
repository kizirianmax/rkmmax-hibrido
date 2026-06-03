# F11-06 — Contrato documental de proveniência do Artifact Ledger

## 1) Identificação

- **Data:** 2026-06-03
- **Repositório:** `kizirianmax/rkmmax-hibrido`
- **Base:** `main`
- **Tipo:** contrato documental de proveniência

## 2) Estado atual da Fase 11

- **F11-02:** Artifact Ledger write-only / append-only / fail-silent.
- **F11-03:** endpoint read-only autenticado por `artifactId + userId`.
- **F11-04:** `traceId` opcional/observacional no Artifact Ledger.
- **F11-05:** endpoint/veredito read-only de proveniência derivado do ledger.

## 3) Contrato do Artifact Ledger

- Escrita **append-only**.
- Leitura **autenticada**.
- Filtro obrigatório por **`artifact_id + user_id`**.
- `traceId` opcional.
- Veredito derivado do histórico registrado.
- Sem conteúdo bruto.
- Sem `zipBase64`.
- Sem arquivos brutos.
- Sem `contentPreview`.

## 4) Contrato do veredito de proveniência

- **Status possíveis:** `approved`, `rejected`, `decision_pending`, `incomplete_history`, `no_events`, `unknown`.
- **Campos:** `confidence`, `generated`, `decision`, `hasChecksum`, `hasTraceId`, `traceId`, `eventCount`, `firstEventAt`, `lastEventAt`, `checksum`, `originModel`, `originPromptId`, `validation`, `warnings`, `limitations`.

## 5) Limites obrigatórios

- O veredito é **observacional**.
- Checksum registrado **não revalida** o conteúdo atual.
- `traceId` é metadado de correlação, não garantia.
- Não é prova criptográfica completa.
- Não substitui auditoria externa.
- Não garante SLA, uptime, p95/p99, segurança absoluta, clientes, receita ou tração.
- Não altera runtime.

## 6) Critérios mínimos para futuro certificado exportável

- Deve ser read-only.
- Deve derivar do Artifact Ledger.
- Deve manter filtro por usuário.
- Não deve incluir conteúdo bruto.
- Não deve incluir `zipBase64`.
- Não deve incluir arquivos brutos.
- Deve conter limitações explícitas.
- Deve ser opcional.
- Não deve alterar geração/ZIP/preview/decisão.
- Não deve ser acoplado ao runtime.
- Deve ser reversível.

## 7) Opções futuras a decidir depois

- Endpoint separado de certificado.
- Certificado anexável ao ZIP.
- Ambos.
- Adiar certificado exportável.
- Consulta por `traceId`.
- Execução sandboxed real em fase futura separada.

## 8) Recomendação conservadora

- Não anexar certificado ao ZIP ainda.
- Não implementar consulta por `traceId` ainda.
- Não iniciar execução sandboxed ainda.
- Usar esta F11-06 como base contratual para a próxima decisão.

## 9) Dependabot

- Permanece fora de escopo nesta F11-06.

## 10) Rollback

- `git revert <commit-sha>`
