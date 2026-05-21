## 2026-05-20 — fix(frontend): tornar /startup rota institucional pública real

| Item                  | Detalhe |
|-----------------------|---------|
| **Bug real**            | O menu “Startup” apontava para /projects. A rota /startup apenas redirecionava para /projects (não era rota pública institucional real). |
| **Arquivos alterados**  | src/App.jsx, src/components/Header.jsx, CHECKLIST.md |
| **Validação manual**    | - Abrir /startup em aba anônima: deve mostrar página institucional sem login.<br>- O menu “Startup” leva a /startup (não mais /projects).<br>- /startup não faz redirect.<br>- Rotas públicas (/demo, /demo-autoplay, /showcase) continuam funcionando.<br>- Rotas privadas seguem protegidas (/hybrid, /dashboard, /agents). |
| **Rollback**            | Desfazer as edições em App.jsx e Header.jsx, restaurando rota /startup como redirect para /projects e o menu apontando para /projects. |


## 2026-05-21 — fix(routes): tornar /startup rota institucional direta e ajustar Header

| Item                | Detalhe |
|---------------------|---------|
| **O quê**           | Alteração da rota `/startup` para renderizar `<Projects />` diretamente e ajuste do link no `Header.jsx`. |
| **Por quê**         | Evitar redirecionamento desnecessário e garantir que a página institucional abra corretamente em `/startup`. |
| **Arquivos alterados** | `src/App.jsx`, `src/components/Header.jsx`, `CHECKLIST.md` |
| **Validação manual**   | 1. `/startup` abre a página institucional sem login.<br>2. Clicar em "Startup" no menu redireciona para `/startup`. |
| **Rollback**          | Reverter rota `/startup` para `Navigate to="/projects"` e link do Header para `/projects`. |
