# F8-OBS-04 — Avaliação controlada dos PRs Dependabot pendentes (#475 e #477)

**ID:** F8-OBS-04  
**Fase:** 8 — Hardening operacional / observabilidade documental  
**Data de referência:** 2026-05-30  
**Tipo:** Documental/decisão (sem implementação funcional)  
**Repositório auditado:** `kizirianmax/rkmmax-hibrido` (exclusivo)

---

## 1) Escopo e limites desta entrega

- Esta entrega é **somente documental**.
- **Não** houve upgrade de dependência.
- **Não** houve alteração em runtime, UI, código, rotas, testes, workflows, `package.json` ou `package-lock.json`.
- Nenhum PR Dependabot foi mergeado, fechado ou aprovado nesta tarefa.

---

## 2) Pré-condições obrigatórias (confirmadas antes da escrita)

1. Base de integração em `main`: **confirmada** (branch de trabalho está adiantada sobre `origin/main`).
2. PR #511 mergeado em `main`: **confirmado** (`merged: true`, base `main`).
3. PR #512 mergeado em `main`: **confirmado** (`merged: true`, base `main`).
4. PR #513 mergeado em `main`: **confirmado** (`merged: true`, base `main`).
5. PR #514 mergeado em `main`: **confirmado** (`merged: true`, base `main`).
6. PRs Dependabot #475 e #477 existem: **confirmado** (ambos `state: open`).
7. `package.json` e `package-lock.json` existem: **confirmado**.

---

## 3) Evidência de dependências no próprio repositório

### 3.1 `@stripe/stripe-js`

- Em `package.json`: dependência **direta** `"@stripe/stripe-js": "^9.2.0"`.
- Em `package-lock.json`: entrada raiz e resolução em `node_modules/@stripe/stripe-js` com versão `9.2.0`.
- Busca por uso no código (`@stripe/stripe-js`, `loadStripe`): **sem referências de import/uso**.

### 3.2 `archiver`

- Em `package.json`: dependência **direta** `"archiver": "^7.0.1"`.
- Em `package-lock.json`: entrada raiz e resolução em `node_modules/archiver` com versão `7.0.1`.
- Uso direto no código: `src/lib/construtor/artifactPackager.js` (`import archiver from 'archiver';`).
- Camadas que dependem desse empacotamento:
  - `api/artifact.js` (`POST /api/artifact`),
  - `api/artifact-preview.js` (`POST/PATCH /api/artifact-preview` quando aprova/exporta),
  - pipeline do Construtor/Híbrido para ZIP/manifest/logs.

---

## 4) Mapeamento interno de camada (Stripe, Payments, empacotamento)

- Camada Payments/Stripe backend aparece em `api/checkout.js`, `api/stripe-webhook.js`, `api/admin.js` usando pacote `stripe` (server-side).
- Há documentação de pagamentos (`docs/PAYMENT_LINKS.md`) e referências em `README.md`.
- Para `@stripe/stripe-js`, **não foi encontrada integração ativa no frontend** via import no código atual.
- Para `archiver`, há integração ativa e central no pipeline de empacotamento de artefatos (Construtor/Híbrido), com cobertura de testes dedicada nessa área.

---

## 5) Avaliação controlada por PR Dependabot

## PR #475 — `@stripe/stripe-js` 9.2.0 → 9.6.0

- **Tipo de upgrade:** `minor` (9.2 → 9.6).
- **Sensibilidade de camada:** potencialmente sensível por domínio (Payments), porém **sem uso ativo encontrado no código**.
- **Estado do PR:** aberto, `mergeable_state: clean`.
- **Checks observáveis:** runs em branch do PR com `test.yml` e `coverage.yml` concluídos com `success`.
- **Risco de regressão (estimado):** baixo no estado atual (sem uso ativo detectado), mas com risco de divergência de lock/runtime se a dependência voltar a ser usada sem revisão.
- **Urgência:** não há evidência, neste repositório, de urgência crítica para merge imediato.

**Recomendação (owner):** **adiar para PR isolado** de higiene de Payments/dependências, com decisão explícita entre:
1) manter e atualizar com validação dedicada, ou  
2) remover dependência não usada (se confirmado fora desta tarefa, em PR próprio).

**Checks/testes obrigatórios antes de eventual merge futuro:**
- `npm run lint`
- `npm run build`
- `npm test -- --runInBand`
- validação manual mínima de fluxos de Payments/checkout/webhook no ambiente de revisão do owner.

---

## PR #477 — `archiver` 7.0.1 → 8.0.0

- **Tipo de upgrade:** `major` (7.x → 8.0.0).
- **Sensibilidade de camada:** alta (pipeline central de empacotamento/exportação de artefatos do Construtor/Híbrido).
- **Estado do PR:** aberto, `mergeable_state: unstable`.
- **Checks observáveis:** runs `test.yml` e `coverage.yml` em `failure` para a branch Dependabot.
- **Evidência objetiva de regressão:** logs dos jobs falhos registram erro repetido:  
  `SyntaxError: The requested module 'archiver' does not provide an export named 'default'`  
  impactando suites de `artifactPackager`, `artifactValidator`, `artifactPreview` e `artifactRunner`.
- **Risco de regressão (estimado):** alto para empacotamento/exportação.
- **Urgência:** não há evidência de incidente de produção nesta tarefa, mas há bloqueio técnico claro para merge “as-is”.

**Recomendação (owner):** **não aceitar este PR como está**; tratar em **PR próprio** (ou substituir por opção mais segura) com adaptação compatível e validação completa antes de qualquer merge.

**Checks/testes obrigatórios antes de eventual merge futuro:**
- `npm run lint`
- `npm run build`
- `npm test -- --runInBand`
- suites focadas do pipeline de artefato (no mínimo):
  - `src/lib/construtor/__tests__/artifactPackager.test.js`
  - `src/lib/construtor/__tests__/artifactValidator.test.js`
  - `src/lib/construtor/__tests__/artifactPreview.test.js`
  - `src/lib/construtor/__tests__/artifactRunner.test.js`
  - `api/__tests__/artifact-preview.test.js`
  - `api/__tests__/artifact-auth.test.js`
  - `api/__tests__/artifact-pipeline-http-e2e.test.js`

---

## 6) Decisão sugerida consolidada

| PR | Decisão sugerida | Justificativa curta |
|---|---|---|
| #475 (`@stripe/stripe-js` minor) | **Adiar para PR isolado** | Não há uso ativo encontrado; baixo benefício imediato para F8-OBS documental; sem urgência comprovada. |
| #477 (`archiver` major) | **Não aprovar como está; tratar em PR próprio** | Regressão já evidenciada em CI na camada de empacotamento/exportação (erro de import/default export). |

---

## 7) Limitações de coleta nesta tarefa

- A leitura foi restrita ao repositório `kizirianmax/rkmmax-hibrido`.
- A consulta direta de `check-runs` por commit retornou limitação de permissão da integração (`403 Resource not accessible by integration`), então a evidência de checks foi consolidada via listagem de workflow runs da própria branch dos PRs.

---

## 8) Conclusão de escopo Fase 8

A Fase 8 **permanece no escopo documental/observabilidade** nesta entrega (F8-OBS-04), sem implementação funcional e sem upgrade acidental de dependências.

Rollback documental, se necessário: `git revert <commit-sha>`.
