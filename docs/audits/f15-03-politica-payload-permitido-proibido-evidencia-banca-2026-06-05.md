# F15-03 — Política documental de payload permitido/proibido para evidência e banca

## 1. Identificação

- **Data:** 2026-06-05
- **Repositório:** `kizirianmax/rkmmax-hibrido`
- **Base:** `main`
- **Tipo:** política documental de payload permitido/proibido
- **Fase:** F15-03 — política documental de payload permitido/proibido para evidência e banca

## 2. Contexto

- F11 consolidou Artifact Ledger/proveniência como camada observacional.
- F12 consolidou replay/diff observacional em modo read-only.
- F13 consolidou consulta por `traceId` em modo read-only.
- F14 consolidou consumo visual observacional read-only, sem decisão de runtime.
- F15 consolida governança de segurança e privacidade observacional, sem alteração de runtime.
- F15-02 já foi incorporada como matriz documental de risco de segurança e privacidade observacional.

## 3. Objetivo da política

Esta política serve para:

- orientar evidência segura para banca/incubadora;
- evitar exposição de payload bruto;
- evitar overclaim;
- preservar privacidade;
- preservar separação de camadas;
- manter runtime intacto;
- proteger a narrativa do produto.

## 4. Payload permitido

O payload permitido deve ficar restrito a metadados seguros:

- status;
- contagens;
- timestamps;
- `artifactId`;
- `traceId`;
- flags de checksum;
- timeline segura;
- warnings;
- limitations;
- `hasFeedback` booleano sem feedback bruto;
- resumo estrutural seguro, desde que não contenha conteúdo bruto;
- indicadores observacionais sem dados sensíveis.

Payload permitido não significa prova absoluta, execução real ou auditoria externa.

## 5. Payload proibido

É proibido expor, usar em evidência pública ou tratar como payload visual seguro:

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
- logs apresentados como execução funcional real;
- qualquer dado que permita expor conteúdo sensível do usuário;
- qualquer dado que permita inferir indevidamente identidade ou conteúdo privado.

## 6. Evidência segura para banca/incubadora

Pode ser usado como evidência:

- existência de camada de rastreabilidade observacional;
- metadados de proveniência;
- consulta read-only por artefato ou `traceId`;
- painel observacional read-only;
- matriz de risco;
- política de payload;
- documentação de limites;
- revisão humana apoiada por metadados.

Não pode ser usado como evidência:

- promessa de execução real;
- promessa de sandbox real;
- promessa de auditoria externa;
- promessa de prova criptográfica completa;
- promessa de segurança absoluta;
- promessa de SLA;
- promessa de clientes, receita ou tração;
- afirmação de restauração funcional/time-travel funcional.

## 7. Frases permitidas

- “O sistema possui rastreabilidade observacional read-only.”
- “A camada observacional apoia auditoria humana e revisão de artefatos.”
- “Os metadados ajudam a acompanhar proveniência, status e correlação por `traceId`.”
- “A observabilidade não altera runtime nem toma decisão automática.”
- “O consumo visual é limitado a metadados seguros.”

## 8. Frases proibidas

- “O sistema prova criptograficamente todo o histórico.”
- “O sistema executa artefatos em sandbox real.”
- “O replay restaura versões funcionalmente.”
- “O diff é equivalente a histórico Git completo.”
- “A observabilidade garante segurança absoluta.”
- “Temos auditoria externa automática.”
- “Garantimos SLA, clientes, receita ou tração.”
- “O `traceId` é uma prova absoluta.”

## 9. Regras de apresentação

- sempre explicar que é observacional/read-only;
- sempre indicar limites;
- não mostrar payload bruto em prints, demos ou documentação;
- não mostrar dados sensíveis;
- não usar `user_email` como evidência visual;
- não transformar metadado em promessa funcional;
- não misturar camada observacional com runtime;
- não apresentar preview como execução real.

## 10. Relação com F15-02

Esta política deriva da matriz F15-02 e responde às lacunas documentais de:

- exposição de payload bruto;
- feedback bruto;
- `user_email`;
- interpretação errada de `traceId`;
- interpretação errada de replay/diff;
- interpretação errada de preview;
- overclaim para banca/incubadora.

## 11. Limites preservados

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

## 12. Recomendação para F15-04

Se a F15-03 for aprovada, a F15-04 deve revisar a narrativa de banca/incubadora sem overclaim, usando esta política como base.

## 13. Rollback

- `git revert <commit-sha>`
