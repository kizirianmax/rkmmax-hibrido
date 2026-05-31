# F8-BL-02 — Decisão formal sobre tag/release e próxima trilha pós-baseline

## 1) Identificação

- **ID:** `F8-BL-02`
- **Nome:** Decisão formal sobre tag/release e próxima trilha pós-baseline
- **Data de referência:** `2026-05-30`
- **Tipo:** documental / decisão pós-baseline
- **Repositório auditado:** `kizirianmax/rkmmax-hibrido` (exclusivamente)
- **Escopo:** sem implementação funcional, sem início de Fase 9, sem criação de tag/release

## 2) Veredito da decisão

- baseline pós-Fase 8 registrado;
- Fase 8 encerrada documentalmente;
- Fase 9 ainda não iniciada;
- tag/release ainda não criada nesta tarefa.

## 3) Decisão recomendada sobre tag/release

- **Recomendação:** tag/release **condicionada e adiada** para etapa explícita do owner.
- Esta tarefa **não cria** tag/release.
- Nome sugerido apenas como referência futura (sem criar nada): `v0.8.0-baseline` (alternativa: `phase-8-baseline`).

### Pré-condições mínimas para tag/release futura

- CI verde no `main`;
- revisão final do owner;
- `CHECKLIST.md` coerente com a trilha documental;
- Dependabot #475 e #477 formalmente adiados ou decididos;
- sem overclaim de produção/SLA/clientes/receita;
- tag tratada como baseline documental/técnico, não como certificação comercial.

## 4) Decisão recomendada sobre Fase 9

- Fase 9 **não é iniciada** nesta tarefa.
- Recomenda-se início da Fase 9 somente após auditoria específica de escopo.
- Se aprovada futuramente, limitar a Fase 9 a no máximo **6 blocos**.
- Nesta etapa não há definição de implementação concreta, apenas condição de entrada.

## 5) Pendências preservadas

- Dependabot #475 (`@stripe/stripe-js`);
- Dependabot #477 (`archiver`);
- validação visual manual pelo owner quando aplicável;
- tag/release;
- métricas reais de produção;
- telemetria real;
- qualquer runtime/implementação funcional.

## 6) Riscos

- criar release/tag cedo demais;
- iniciar Fase 9 sem escopo fechado;
- aceitar `archiver` #477 sem adaptação;
- tratar `@stripe/stripe-js` #475 fora de PR isolado;
- confundir baseline documental com produto pronto;
- overclaim externo.

## 7) Recomendação final (objetiva)

- **Próximo movimento recomendado:** auditoria específica da Fase 9 antes de qualquer tag/release, mantendo implementação funcional adiada.
- Dependabot #477 e #475 devem seguir apenas em PRs técnicos isolados, se aprovados pelo owner.

## 8) Observações de divergência (documentação vs código)

- Não foi identificada divergência documental-código no escopo desta tarefa de leitura.
- Caso o owner identifique divergência posterior, tratar como risco em trilha documental/técnica dedicada (sem correção funcional nesta tarefa).

## 9) Confirmação de não alteração funcional

Esta tarefa não altera:

- runtime;
- UI;
- código (`src/`, `api/`);
- testes;
- dependências;
- workflows;
- providers/modelos;
- prompts;
- model registry;
- fallback;
- Serginho;
- Híbrido/Construtor;
- Especialistas;
- ABNT;
- Auth/SaaS/Payments;
- Vercel/Supabase/Stripe/secrets;
- tag/release;
- Fase 9.

## 10) Rollback

`git revert <commit-sha>`
