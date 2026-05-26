# Política de Release e Versionamento

## Objetivo

Definir um processo mínimo, verificável e reversível para versionamento e publicação de releases do repositório.

## Processo atual (real)

- O processo de release é **manual**.
- O repositório é **single-owner** (`@kizirianmax`), que também executa revisão final e publicação.

## Versionamento e tags

- Usar tags semânticas simples no formato `vMAJOR.MINOR.PATCH`.
- Exemplo: `v6.0.0`.
- Recomenda-se criar a tag **antes** de demos, bancas e marcos formais para fixar uma versão de referência.

## Release notes

- As release notes são mantidas manualmente no GitHub Releases.
- Devem resumir, de forma objetiva:
  - o que entrou na versão;
  - limitações conhecidas;
  - instrução de rollback.

## Rollback

- Em caso de regressão, reverter via `git revert <commit-sha>` para manter histórico auditável.
- Manter/referenciar a tag da versão anterior estável para retorno rápido ao estado conhecido.
- Quando necessário, publicar nova tag corretiva após o revert (ex.: `v6.0.1`).
