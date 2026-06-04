# F14-03 — Contrato de UI/consumo visual observacional read-only

## 1. Identificação

- **Data:** 2026-06-04
- **Repositório:** `kizirianmax/rkmmax-hibrido`
- **Base:** `main`
- **Tipo:** contrato documental de UI/consumo visual
- **Fase:** F14-03

## 2. Estado atual da Fase 14

- **F14-01:** abertura formal da Fase 14 para consumo visual observacional read-only.
- **F14-02:** documentação canônica dos endpoints observacionais existentes e alinhamento do README.

## 3. Contrato de UI observacional

A futura UI observacional deve:

- consumir apenas metadados seguros;
- ser read-only;
- não escrever no banco;
- não alterar runtime;
- não alterar decisão de aprovação/rejeição;
- não disparar geração;
- não disparar ZIP;
- não disparar execução;
- não chamar providers/modelos;
- não acessar prompts;
- não criar bypass ao Serginho;
- não substituir auditoria humana.

## 4. Endpoints observacionais que poderão ser consumidos futuramente

- `GET /api/artifact-ledger?artifactId=<artifact-id>`
- `GET /api/artifact-provenance?artifactId=<artifact-id>`
- `GET /api/artifact-replay?artifactId=<artifact-id>`
- `GET /api/artifact-replay-diff?artifactId=<artifact-id>`
- `GET /api/artifact-trace?traceId=<trace-id>`

## 5. Campos permitidos para visualização futura

- status;
- contagens;
- timestamps;
- artifactId;
- traceId;
- flags de checksum;
- timeline segura;
- warnings;
- limitations;
- flags booleanas como `hasFeedback`, sem feedback bruto.

## 6. Payload proibido

A futura UI não pode exibir nem solicitar:

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

## 7. Limites sem overclaim

O consumo visual observacional:

- não é prova criptográfica completa;
- não é auditoria externa;
- não é garantia de integridade absoluta;
- não é histórico Git;
- não é versionamento completo;
- não é time-travel funcional;
- não restaura artefatos;
- não executa artefatos;
- não garante SLA, uptime, p95/p99, segurança absoluta, clientes, receita ou tração.

## 8. Regras de UX futuras

A futura UI deve deixar claro para o usuário:

- que os dados são observacionais;
- que não há execução sandboxed real;
- que `executeArtifact` permanece desativado;
- que replay/diff/traceId não alteram decisões;
- que o objetivo é auditoria, rastreabilidade e revisão humana;
- que qualquer ação funcional deve continuar fora dessa camada.

## 9. Fora de escopo desta entrega

- implementação visual;
- criação de painel;
- alteração em `src/`;
- alteração em `api/`;
- endpoint novo;
- migration;
- certificado exportável;
- sandbox real;
- execução;
- Auth/SaaS/Payments;
- Especialistas;
- ABNT;
- Dependabot.

## 10. Recomendação para próximo passo

Após F14-03, avaliar F14-04 como primeiro consumo visual mínimo, mas somente após auditoria e autorização explícita. Não implementar UI nesta etapa.

## 11. Rollback

- `git revert <commit-sha>`
