# F12-01 — Abertura formal da Fase 12 — Replay/diff observacional do ciclo de revisão

## 1. Identificação

- **Data:** 2026-06-03
- **Repositório:** `kizirianmax/rkmmax-hibrido`
- **Base:** `main`
- **Tipo:** abertura formal de fase
- **Fase aberta:** Fase 12 — Replay/diff observacional do ciclo de revisão

## 2. Contexto

- Fase 11 encerrada formalmente (PR #552).
- O Artifact Ledger já possui escrita append-only/fail-silent, leitura autenticada com filtro `artifact_id + user_id`, `traceId` opcional e veredito read-only de proveniência.
- A Fase 12 deve derivar leitura/replay do ledger sem alterar runtime.

## 3. Objetivo da Fase 12

- Reconstruir de forma observacional a linha do tempo do ciclo de revisão.
- Permitir visão de sequência **gerar → revisar → ajustar → aprovar/rejeitar**.
- Preparar base para diff/veredito de ciclo sem armazenar payload bruto.

## 4. Limites obrigatórios

- read-only;
- sem conteúdo bruto;
- sem `zipBase64`;
- sem arquivos brutos;
- sem `contentPreview`;
- sem restauração funcional de artefatos;
- sem time-travel funcional;
- sem promessa de prova criptográfica completa;
- sem alteração em geração, ZIP, preview, execução, prompts, providers, UI ou orquestração.

## 5. Riscos e controle conservador

- Risco de overclaim (confundir replay com restauração funcional): mitigado por contrato explícito de camada observacional/read-only.
- Risco de expansão de escopo para runtime: mitigado por vedação formal de mudanças em geração/execução/orquestração.
- Risco de exposição indevida de dados: mitigado por resposta somente com metadados seguros, sem conteúdo bruto.

## 6. Plano sugerido da Fase 12

- **F12-01:** abertura documental (este PR).
- **F12-02:** endpoint replay read-only derivado do Artifact Ledger.
- **F12-03:** veredito/diff observacional entre eventos.
- **F12-04:** contrato formal de replay/diff.
- **F12-05:** encerramento formal da Fase 12.

## 7. Critérios de sucesso

- filtro obrigatório por `artifact_id + user_id`;
- resposta segura (somente metadados, sem `user_email`, sem conteúdo bruto);
- sem escrita no banco;
- sem alteração funcional;
- sem bypass ao Serginho;
- testes sem Supabase real nas etapas funcionais futuras;
- `CHECKLIST.md` atualizado a cada PR.

## 8. Fora de escopo

- execução sandboxed real;
- reativar `executeArtifact`;
- certificado exportável;
- consulta por `traceId`;
- UI;
- Auth/SaaS/Payments;
- Especialistas;
- ABNT;
- Dependabot;
- `package.json` / `package-lock.json`;
- workflows/secrets.

## 9. Rollback

- `git revert <commit-sha>`
