# F6-GOV-03 — Baseline mínimo de release/tag para banca/incubadora

## 1. Objetivo do baseline

Congelar uma referência verificável do estado do projeto antes de apresentações, bancas e checkpoints com incubadora, com rastreabilidade simples e rollback direto.

## 2. Estado técnico mínimo esperado antes da tag

Antes de criar a tag de baseline, o estado mínimo esperado é:

- `npm run lint`
- `npm run build`
- `npm test -- --runInBand`
- checks verdes no GitHub Actions
- Vercel Preview e produção operacionais

## 3. Convenção de tagging

- Formato de tag: `vMAJOR.MINOR.PATCH`
- Exemplo recomendado para baseline de banca: `v6.0.0`
- Tags são criadas manualmente pelo owner (modelo single-owner)

## 4. Processo mínimo de release

Fluxo operacional mínimo:

1. CI verde
2. revisão final do owner
3. squash merge
4. criar tag
5. publicar release notes manuais

## 5. Conteúdo mínimo das release notes

Cada release deve registrar, no mínimo:

- objetivo da versão
- baseline técnico
- limites conhecidos
- rollback
- PRs relevantes

## 6. O que NÃO afirmar na release

Para evitar overclaim, não afirmar:

- branch protection enterprise inexistente
- múltiplos revisores independentes
- IA em tempo real na demo
- `executeArtifact` habilitado
- automação de release inexistente

## 7. Rollback

Em caso de regressão:

`git revert <commit-sha>`

## 8. Resumo executivo

Projeto operando em modelo single-owner, com baseline verificável por tag/release, trilha de CI/documentação/governança rastreável e mitigadores mínimos de governança já implementados nas fases anteriores.
