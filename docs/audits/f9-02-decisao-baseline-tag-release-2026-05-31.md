# F9-02 — Decisão explícita sobre baseline/tag/release

## 1) Identificação

- **ID:** `F9-02`
- **Nome:** Decisão explícita sobre baseline/tag/release
- **Data de referência:** `2026-05-31`
- **Tipo:** documental / governança / decisão
- **Repositório auditado:** `kizirianmax/rkmmax-hibrido`
- **Escopo:** decisão documental, sem criação de tag/release e sem implementação funcional

## 2) Veredito

- A Fase 9 já foi aberta documentalmente pelo F9-01.
- Esta tarefa é o Bloco 2 da Fase 9.
- A criação de tag/release NÃO deve ser feita automaticamente nesta tarefa.
- A decisão recomendada é: tag/release condicionada, não imediata.
- O baseline pós-Fase 8/F9-01 está documentado, mas ainda existem pendências que impedem tratar uma tag como maturidade operacional plena.

## 3) Decisão formal sobre tag/release

- Não criar tag agora neste PR.
- Não criar release agora neste PR.
- Recomendar que a tag/release seja condicionada a decisão explícita posterior do owner.
- Nome futuro sugerido apenas como referência, sem criar nada:
  - `v0.9.0-governance-baseline`
  - alternativa: `phase-9-governance-baseline`
- Qualquer tag futura deve ser tratada como baseline documental/técnico, não como certificação comercial, SLA, produção madura ou validação runtime completa.

## 4) Pré-condições mínimas para tag/release futura

- `main` atualizado.
- CI verde no `main`.
- Revisão final do owner.
- CHECKLIST coerente.
- PRs documentais F8 e F9-01/F9-02 mergeados.
- Dependabot #475 e #477 formalmente decididos ou explicitamente adiados.
- Validação visual manual tratada ou explicitamente marcada como pendência conhecida.
- Ausência de overclaim sobre produção, SLA, clientes, receita, uptime ou maturidade comercial.
- Confirmação de que a tag/release não altera runtime e não promete mais do que o documentado.

## 5) O que a tag/release futura NÃO deve significar

- produto comercialmente maduro;
- SLA validado;
- uptime comprovado;
- clientes comprovados;
- receita comprovada;
- telemetria real completa;
- validação runtime ampla;
- providers/modelos testados em produção real nesta tarefa;
- sandbox reativado;
- Auth/SaaS/Payments finalizados;
- início de Fase 9 funcional.

## 6) Relação com Dependabot #475 e #477

- Dependabot #475 (`@stripe/stripe-js`) permanece pendente.
- Dependabot #477 (`archiver`) permanece pendente e deve continuar sendo tratado como risco técnico maior.
- Não resolver #475 ou #477 nesta tarefa.
- Não misturar #475 e #477 com decisão de tag/release.
- Se forem tratados, devem ser PRs isolados, com escopo próprio, validação própria e aprovação explícita do owner.

## 7) Relação com Fase 9

- F9-02 não inicia implementação funcional.
- F9-02 apenas registra decisão de governança.
- Próximo bloco provável após merge de F9-02 será F9-03, mas somente se o owner autorizar.
- F9-03 deve tratar Dependabot de forma isolada e cuidadosa, sem misturar os dois PRs em uma única correção funcional.

## 8) Pendências preservadas

- Dependabot #475.
- Dependabot #477.
- Validação visual manual controlada.
- Observabilidade real.
- Métricas reais.
- Telemetria real.
- Tag/release futura.
- Implementação funcional futura.
- Qualquer evolução de Auth/SaaS/Payments.
- Qualquer alteração em providers/modelos/prompts/registry/fallback.
- Qualquer alteração no Serginho, Híbrido/Construtor, Especialistas ou ABNT.

## 9) Critério de sucesso desta tarefa

- Criar apenas o documento F9-02.
- Atualizar apenas o topo do CHECKLIST.md.
- Não criar tag.
- Não criar release.
- Não alterar código.
- Não iniciar implementação funcional.
- Registrar decisão clara: tag/release condicionada e adiada para decisão explícita posterior.
- Preservar pendências e riscos sem overclaim.

## 10) Declaração de não alteração funcional

Esta tarefa não altera runtime, UI, código, rotas, testes, dependências, workflows, providers/modelos, prompts, registry, fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets, tag/release ou implementação funcional.

## 11) Rollback

`git revert <commit-sha>`
