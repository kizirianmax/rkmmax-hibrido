# F15-01 — Abertura formal da Fase 15 — Governança de segurança e privacidade observacional

## 1. Identificação

- **Data:** 2026-06-05
- **Repositório:** `kizirianmax/rkmmax-hibrido`
- **Base:** `main`
- **Tipo:** abertura formal de fase
- **Fase aberta:** Fase 15 / governança de segurança e privacidade observacional

## 2. Contexto

- Fase 11 consolidou o Artifact Ledger como camada observacional de proveniência.
- Fase 12 consolidou replay/diff observacional em modo read-only.
- Fase 13 consolidou consulta observacional por `traceId` em modo read-only.
- Fase 14 consolidou consumo visual observacional read-only, sem decisão de runtime.
- A auditoria pós-Fase 14 recomendou a Fase 15 — governança de segurança/privacidade observacional — como próxima frente segura.

## 3. Objetivo da Fase 15

- Consolidar governança de segurança e privacidade da camada observacional.
- Reduzir risco de exposição de payload bruto.
- Reforçar limites de consumo observacional.
- Registrar limites anti-overclaim.
- Preparar evidências seguras para banca/incubadora.
- Preservar runtime intacto.
- Preservar o Serginho IA como orquestrador soberano e gateway único.

## 4. Escopo da Fase 15

- Governança de privacidade observacional.
- Política de payload permitido/proibido.
- Limites de exposição.
- Matriz de risco observacional.
- Recomendações para banca/incubadora sem overclaim.
- Revisão documental de segurança.
- Critérios para futuras fases funcionais sem misturar camadas.

## 5. Limites obrigatórios

- Sem alteração funcional nesta F15-01.
- Sem backend novo.
- Sem endpoint novo.
- Sem migration.
- Sem escrita no banco.
- Sem execução.
- Sem sandbox real.
- Sem alteração de runtime.
- Sem alteração de decisão de aprovação/rejeição.
- Sem geração.
- Sem ZIP.
- Sem prompts.
- Sem providers/modelos.
- Sem orquestração.
- Sem UI funcional nova.
- Sem bypass ao Serginho.
- Sem Dependabot.

## 6. Payload proibido a preservar

- Eventos brutos quando proibidos pelo contrato.
- Conteúdo bruto.
- `zipBase64`.
- `files`.
- `content`.
- `contentPreview`.
- `user_email`.
- Feedback bruto.
- Segredos/tokens.
- Payload de execução.
- Logs apresentados como execução funcional real.

## 7. Payload permitido em camadas observacionais

- Metadados seguros.
- Status.
- Contagens.
- Timestamps.
- `artifactId`.
- `traceId`.
- Flags de checksum.
- Timeline segura.
- Warnings.
- Limitations.
- `hasFeedback` booleano sem feedback bruto.

## 8. Limites sem overclaim

- Observabilidade não é prova criptográfica completa.
- Não é auditoria externa.
- Não é garantia de integridade absoluta.
- Não é histórico Git.
- Não é versionamento completo.
- Não é time-travel funcional.
- Não restaura artefatos.
- Não executa artefatos.
- Não garante SLA, uptime, p95/p99, segurança absoluta, clientes, receita ou tração.

## 9. Plano sugerido da Fase 15

- **F15-01:** abertura formal da fase.
- **F15-02:** matriz de risco de segurança/privacidade observacional.
- **F15-03:** política documental de payload permitido/proibido para evidência e banca.
- **F15-04:** revisão de narrativa de banca/incubadora sem overclaim.
- **F15-05:** validação documental da governança observacional.
- **F15-06:** encerramento formal da Fase 15.

## 10. Critérios de sucesso

- `CHECKLIST.md` atualizado a cada PR.
- Nenhum payload bruto exposto.
- Nenhuma alteração indevida em runtime.
- Nenhuma mistura de camadas.
- Nenhuma promessa funcional falsa.
- Dependabot mantido fora de escopo.
- Documentação útil para banca/incubadora sem overclaim.

## 11. Fora de escopo

- Implementação funcional.
- UI nova.
- Endpoint novo.
- Migration.
- Sandbox real.
- Certificado exportável.
- Execução.
- Auth/SaaS/Payments.
- Especialistas.
- ABNT.
- Dependabot.
- Mudanças em `package.json`/`package-lock.json`.

## 12. Recomendação

- Após F15-01, executar F15-02 como matriz documental de risco de segurança/privacidade observacional.
- Não iniciar funcionalidade nova antes da matriz de risco.
- Manter runtime intacto.

## 13. Rollback

- `git revert <commit-sha>`
