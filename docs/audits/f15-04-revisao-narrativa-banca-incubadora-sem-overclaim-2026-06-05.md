# F15-04 — Revisão da narrativa de banca/incubadora sem overclaim

## 1. Identificação

- **Data:** 2026-06-05
- **Repositório:** `kizirianmax/rkmmax-hibrido`
- **Base:** `main`
- **Tipo:** revisão documental de narrativa
- **Fase:** F15-04

## 2. Contexto

- F15-01 formalizou a abertura da governança de segurança e privacidade observacional.
- F15-02 consolidou a matriz documental de risco de segurança e privacidade observacional.
- F15-03 consolidou a política documental de payload permitido/proibido para evidência e banca.
- F15-04 revisa a narrativa pública/documental para banca/incubadora sem overclaim.

## 3. Objetivo

Revisar e alinhar a narrativa pública/documental para evitar:

- overclaim técnico;
- overclaim comercial;
- overclaim institucional;
- exposição de payload bruto;
- confusão entre observabilidade e execução;
- confusão entre metadados e prova absoluta.

## 4. Narrativa permitida

Frases/ideias permitidas para banca/incubadora e apresentação institucional:

- “rastreabilidade observacional read-only”;
- “metadados de apoio à revisão humana”;
- “proveniência observacional”;
- “consulta por `traceId` como correlação observacional”;
- “preview observacional/estrutural, sem execução real”;
- “governança de payload permitido/proibido”;
- “camada de apoio à transparência, sem decisão automática de runtime”.

## 5. Narrativa proibida

Frases/ideias proibidas:

- “execução real em sandbox”;
- “time-travel funcional”;
- “restauração funcional de versões”;
- “prova criptográfica completa”;
- “auditoria externa automática”;
- “garantia de segurança absoluta”;
- “garantia de SLA/uptime/p95/p99”;
- “clientes, receita ou tração garantidos”;
- “traceId como prova absoluta”;
- “replay/diff como histórico Git completo”.

## 6. Arquivos revisados

- `README.md`
- `docs/DEMO.md`
- `docs/api.md`
- `docs/audits/f15-01-abertura-formal-governanca-seguranca-privacidade-observacional-2026-06-05.md`
- `docs/audits/f15-02-matriz-risco-seguranca-privacidade-observacional-2026-06-05.md`
- `docs/audits/f15-03-politica-payload-permitido-proibido-evidencia-banca-2026-06-05.md`
- `docs/audits/f14-06-encerramento-formal-fase14-consumo-visual-observacional-2026-06-05.md`
- `CHECKLIST.md`

## 7. Ajustes realizados

- `README.md`: **não alterado** (revisão não encontrou necessidade de correção textual para F15-04).
- `docs/DEMO.md`: **não alterado** (revisão não encontrou necessidade de correção textual para F15-04).
- Frases ajustadas: **não houve ajuste textual** nesses arquivos nesta F15-04, pois a narrativa já está alinhada à política F15-03.

## 8. Payload e privacidade

Permanece confirmado que:

- payload permitido continua restrito a metadados seguros;
- payload bruto permanece proibido;
- `user_email`, conteúdo bruto, feedback bruto, `zipBase64`, `files`, `content`, `contentPreview`, segredos/tokens e payload de execução continuam proibidos como evidência visual pública.

## 9. Limites preservados

Confirmações da F15-04:

- sem alteração funcional;
- sem backend novo;
- sem endpoint novo;
- sem migration;
- sem escrita no banco;
- sem execução;
- sem sandbox real;
- sem alteração de runtime;
- sem geração;
- sem ZIP;
- sem prompts;
- sem providers/modelos;
- sem orquestração;
- sem UI funcional nova;
- sem bypass ao Serginho;
- sem Dependabot.

## 10. Recomendação para F15-05

Se a F15-04 for aprovada, recomenda-se a F15-05 como validação documental da governança observacional da Fase 15.

## 11. Rollback

- `git revert <commit-sha>`
