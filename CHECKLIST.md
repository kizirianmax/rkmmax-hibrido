## 2026-05-17 — fix(auth): tornar /startup rota pública institucional

| Item                | Detalhe |
|---------------------|---------|
| **O quê**           | Inclusão de "/startup" em `PUBLIC_ROUTES` (`src/auth/AuthGate.jsx`) |
| **Por quê**         | Rota `/startup` não estava em `PUBLIC_ROUTES` (`src/auth/AuthGate.jsx`). Impedia validação externa sem login. |
| **Arquivos alterados** | `src/auth/AuthGate.jsx`, `CHECKLIST.md` |
| **Validação manual**   | 1. `/startup`, `/demo`, `/demo-autoplay`, `/showcase` abrem sem login em aba anônima.<br>2. `/hybrid`, `/dashboard`, `/agents` continuam privadas. |
| **Rollback**          | Remover apenas `"/startup"` de `PUBLIC_ROUTES`. |

