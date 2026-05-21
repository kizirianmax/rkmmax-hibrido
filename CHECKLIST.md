## 2026-05-17 — fix(auth): tornar /startup rota pública institucional

| Item                | Detalhe |
|---------------------|---------|
| **O quê**           | Inclusão de "/startup" em `PUBLIC_ROUTES` (`src/auth/AuthGate.jsx`) |
| **Por quê**         | Rota `/startup` não estava em `PUBLIC_ROUTES` (`src/auth/AuthGate.jsx`). Impedia validação externa sem login. |
| **Arquivos alterados** | `src/auth/AuthGate.jsx`, `CHECKLIST.md` |
| **Validação manual**   | 1. `/startup`, `/demo`, `/demo-autoplay`, `/showcase` abrem sem login em aba anônima.<br>2. `/hybrid`, `/dashboard`, `/agents` continuam privadas. |
| **Rollback**          | Remover apenas `"/startup"` de `PUBLIC_ROUTES`. |


## 2026-05-21 — fix(routes): tornar /startup rota institucional direta e ajustar Header

| Item                | Detalhe |
|---------------------|---------|
| **O quê**           | Alteração da rota `/startup` para renderizar `<Projects />` diretamente e ajuste do link no `Header.jsx`. |
| **Por quê**         | Evitar redirecionamento desnecessário e garantir que a página institucional abra corretamente em `/startup`. |
| **Arquivos alterados** | `src/App.jsx`, `src/components/Header.jsx`, `CHECKLIST.md` |
| **Validação manual**   | 1. `/startup` abre a página institucional sem login.<br>2. Clicar em "Startup" no menu redireciona para `/startup`. |
| **Rollback**          | Reverter rota `/startup` para `Navigate to="/projects"` e link do Header para `/projects`. |
