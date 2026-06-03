# F12-04 — Contrato de consumo do replay/diff observacional do ciclo de revisão

## 1. Identificação

- **Data:** 2026-06-03
- **Repositório:** `kizirianmax/rkmmax-hibrido`
- **Base:** `main`
- **Tipo:** contrato documental de consumo
- **Fase:** F12-04 / replay-diff observacional

## 2. Estado atual da Fase 12

- **F12-01:** abertura formal documental da Fase 12.
- **F12-02:** endpoint replay read-only do ciclo de revisão.
- **F12-03:** endpoint diff/veredito observacional read-only entre eventos.

## 3. Contrato de consumo

- Replay e diff são estritamente **read-only**.
- Devem ser consumidos apenas como **metadados observacionais**.
- O consumo deve sempre respeitar o vínculo obrigatório **`artifact_id + user_id`**.
- Não devem controlar runtime.
- Não devem alterar decisão de geração, aprovação, rejeição, ZIP, preview ou execução.

## 4. Endpoints já existentes

- `GET /api/artifact-replay?artifactId=<uuid>`
- `GET /api/artifact-replay-diff?artifactId=<uuid>`

## 5. Campos interpretáveis

- `status`
- `eventCount`
- `transitionCount`
- `firstEventAt`
- `lastEventAt`
- `traceIds`
- `checksumChanged`
- `transitions`
- `warnings`
- `limitations`

## 6. Limites obrigatórios

- não é restauração funcional;
- não é time-travel funcional;
- não é histórico Git;
- não é versionamento completo;
- não é prova criptográfica completa;
- não revalida conteúdo atual;
- não substitui auditoria externa;
- não garante SLA, uptime, p95/p99, segurança absoluta, clientes, receita ou tração.

## 7. Payload proibido

- conteúdo bruto;
- `zipBase64`;
- `files`;
- `content`;
- `contentPreview`;
- `user_email`;
- feedback bruto.

## 8. Uso recomendado

- auditoria interna;
- monitoramento observacional;
- diagnóstico de sequência de eventos;
- evidência de governança para banca/incubadora;
- suporte a decisões humanas, sem automação decisória.

## 9. Fora de escopo

- UI;
- certificado exportável;
- consulta por traceId;
- execução sandboxed real;
- reativar executeArtifact;
- geração/ZIP/preview/execução;
- prompts;
- providers/modelos;
- Auth/SaaS/Payments;
- Especialistas;
- ABNT;
- Dependabot.

## 10. Recomendação para próximo passo

- Após F12-04, avaliar se F12-05 deve encerrar formalmente a Fase 12 ou se ainda há necessidade de documentação complementar.
- Não implementar UI/certificado/sandbox nesta janela.

## 11. Rollback

- `git revert <commit-sha>`
