# F15-02 — Matriz documental de risco de segurança e privacidade observacional

## 1. Identificação

- **Data:** 2026-06-05
- **Repositório:** `kizirianmax/rkmmax-hibrido`
- **Base:** `main`
- **Tipo:** matriz documental de risco
- **Fase:** F15-02 — matriz de risco de segurança e privacidade observacional

## 2. Contexto

- F11 consolidou Artifact Ledger/proveniência como camada observacional.
- F12 consolidou replay/diff observacional em modo read-only.
- F13 consolidou consulta por `traceId` em modo read-only.
- F14 consolidou consumo visual observacional read-only, sem decisão de runtime.
- F15 consolida governança de segurança e privacidade observacional, sem alteração de runtime.

## 3. Objetivo da matriz

- Mapear riscos de segurança e privacidade das camadas observacionais.
- Preservar payload seguro e metadados mínimos.
- Evitar exposição de payload bruto.
- Evitar overclaim técnico, comercial ou institucional.
- Orientar banca/incubadora com narrativa segura.
- Manter runtime intacto.

## 4. Escala de risco

- **Severidade:** baixa, média, alta.
- **Probabilidade:** baixa, média, alta.
- **Status:** mitigado, parcialmente mitigado, pendente/futuro.
- **Tipo de ação:** documental, governança, técnica futura, fora de escopo.

## 5. Matriz de riscos

| Risco | Camada afetada | Severidade | Probabilidade | Mitigação atual | Lacuna restante | Recomendação futura | Tipo de ação | Status |
|---|---|---:|---:|---|---|---|---|---|
| Exposição de conteúdo bruto | Artifact Ledger, proveniência, replay/diff, traceId, consumo visual | alta | média | Documentação proíbe conteúdo bruto e limita payload a metadados seguros. | Reforçar política canônica para evidência e banca. | F15-03 deve formalizar payload permitido/proibido. | documental/governança | parcialmente mitigado |
| Exposição de feedback bruto | Artifact Ledger, replay/diff, consumo visual | média | média | Contrato atual orienta uso de `hasFeedback` booleano sem feedback bruto. | Garantir narrativa uniforme em todos os materiais. | Registrar regra explícita em política documental futura. | documental/governança | parcialmente mitigado |
| Exposição de `user_email` | Artifact Ledger, proveniência, traceId | alta | baixa | Documentação classifica `user_email` como payload proibido. | Reforçar que identidade direta não deve ser evidência visual segura. | Incluir em checklist de revisão documental futura. | documental | mitigado |
| Exposição de `zipBase64`, `files`, `content` ou `contentPreview` | Híbrido/Construtor, preview, consumo visual | alta | média | Payload bruto e artefatos exportáveis são proibidos em camadas observacionais. | Separar claramente exportação funcional de evidência observacional. | F15-03 deve consolidar exemplos de payload proibido. | documental/governança | parcialmente mitigado |
| Enumeração entre usuários | Ledger, proveniência, replay/diff, traceId | alta | baixa | Documentação exige consulta autenticada e filtrada por usuário, sem consulta pública/global. | Evidência documental ainda depende de contratos existentes. | Futuramente validar tecnicamente controles de isolamento, fora desta F15-02. | técnica futura | parcialmente mitigado |
| Interpretação errada de `traceId` como prova criptográfica | Consulta por `traceId`, banca/incubadora | média | média | Documentação afirma que `traceId` é metadado observacional, não prova criptográfica completa. | Risco de comunicação externa simplificada demais. | Criar frases aprovadas e proibidas em F15-03/F15-04. | documental/governança | parcialmente mitigado |
| Interpretação errada de replay/diff como time-travel funcional | Replay/diff, consumo visual | alta | média | Documentação afirma que replay/diff são read-only e não restauram versões. | Pode haver confusão em demonstrações visuais. | Reforçar disclaimer em materiais de banca/incubadora. | documental/governança | parcialmente mitigado |
| Interpretação errada de preview como execução funcional | Preview, Híbrido/Construtor, consumo visual | alta | média | README e docs registram `executeArtifact` desativado e ausência de sandbox real. | Narrativa pode confundir validação estrutural com execução. | Manter frase padrão: preview é observacional, não execução. | documental/governança | parcialmente mitigado |
| Apresentação de logs como execução real | Artifact Pipeline, consumo visual, banca/incubadora | alta | média | Logs como execução funcional real permanecem payload proibido. | Pode existir ambiguidade entre log técnico e evidência executável. | Documentar diferença entre log observacional e execução real. | documental/governança | parcialmente mitigado |
| Mistura entre observabilidade e decisão de runtime | Todas as camadas observacionais | alta | baixa | F15 define governança observacional sem runtime e sem decisão automática. | Evoluções futuras podem tentar acoplar leitura a decisão. | Exigir fase funcional separada com contrato antes de qualquer acoplamento. | governança | mitigado |
| Bypass ao Serginho | Orquestração, Híbrido/Construtor, providers | alta | baixa | Verdade arquitetural mantém Serginho IA como orquestrador soberano e gateway único. | Risco permanece em futuras integrações se não houver revisão. | Manter bloqueio documental contra bypass em cada fase. | governança | mitigado |
| Overclaim para banca/incubadora | Narrativa institucional | alta | média | F15-01 já proíbe promessas de auditoria externa, prova completa e garantias absolutas. | Materiais externos ainda precisam de política de frases seguras. | F15-04 deve revisar narrativa de banca/incubadora. | documental/governança | parcialmente mitigado |
| Uso de observabilidade como garantia de SLA, segurança absoluta, clientes, receita ou tração | Banca/incubadora, comunicação externa | alta | média | Documentação proíbe prometer SLA, segurança absoluta, clientes, receita ou tração. | Pode haver pressão comercial para extrapolar evidências. | Manter checklist anti-overclaim obrigatório. | documental/governança | parcialmente mitigado |
| Dependabot sendo tratado dentro da fase errada | Governança de escopo | média | baixa | Dependabot está explicitamente fora de escopo da Fase 15/F15-02. | Demandas paralelas podem contaminar PR documental. | Tratar Dependabot apenas em janela técnica separada. | fora de escopo | mitigado |
| Evolução funcional antes de contrato/validação | Runtime, API, UI, migrations | alta | média | F15-02 é exclusivamente documental e não altera runtime. | Risco de iniciar endpoint/UI antes da política de payload. | Só evoluir funcionalmente após contrato, validação e fase própria. | governança/técnica futura | parcialmente mitigado |

## 6. Payload proibido

Permanece proibido expor ou tratar como evidência visual segura:

- eventos brutos quando proibidos pelo contrato;
- conteúdo bruto;
- `zipBase64`;
- `files`;
- `content`;
- `contentPreview`;
- `user_email`;
- feedback bruto;
- segredos/tokens;
- payload de execução;
- logs apresentados como execução funcional real.

## 7. Payload permitido

O payload observacional permitido deve ficar restrito a metadados seguros:

- status;
- contagens;
- timestamps;
- `artifactId`;
- `traceId`;
- flags de checksum;
- timeline segura;
- warnings;
- limitations;
- `hasFeedback` booleano sem feedback bruto.

## 8. Regras de narrativa para banca/incubadora

Pode dizer:

- há rastreabilidade observacional;
- há metadados de proveniência;
- há camada read-only de apoio à revisão humana.

Não pode dizer:

- que é prova criptográfica completa;
- que é auditoria externa;
- que executa artefatos;
- que restaura versões;
- que há time-travel funcional;
- que há promessa de SLA, segurança absoluta, clientes, receita ou tração.

## 9. Limites preservados

- Sem alteração funcional.
- Sem backend novo.
- Sem endpoint novo.
- Sem migration.
- Sem escrita no banco.
- Sem execução.
- Sem sandbox real.
- Sem alteração de runtime.
- Sem geração.
- Sem ZIP.
- Sem prompts.
- Sem providers/modelos.
- Sem orquestração.
- Sem UI funcional nova.
- Sem bypass ao Serginho.
- Sem Dependabot.

## 10. Recomendações para F15-03

- Se esta matriz F15-02 for aprovada, F15-03 deve ser a política documental de payload permitido/proibido para evidência e banca.
- A F15-03 deve consolidar exemplos seguros de comunicação, evidência visual e limites anti-overclaim.
- Nenhuma evolução funcional deve preceder essa política documental.

## 11. Rollback

- `git revert <commit-sha>`
