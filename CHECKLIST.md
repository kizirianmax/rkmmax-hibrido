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


## 2026-05-22 — fix(security): remove frontend secret initialization risk

| Item                    | Detalhe |
|-------------------------|---------|
| **Título do PR**        | `fix(security): remove frontend secret initialization risk` |
| **Problema corrigido**  | `SecretManager.js` lia `VITE_GROQ_API_KEY` e `VITE_GITHUB_CLIENT_SECRET` via `import.meta.env` no bundle do navegador. `src/main.jsx` chamava `initializeSecrets()` no boot, ativando essa leitura. Risco preventivo: variáveis `VITE_*` são incorporadas ao bundle público pelo Vite. Verificação manual na Vercel confirmou que essas variáveis **não estavam** configuradas na plataforma, portanto não há vazamento atual comprovado. |
| **Arquivos alterados**  | `src/main.jsx`, `src/api/SecretManager.js`, `src/__tests__/no-frontend-secrets.test.js`, `CHECKLIST.md` |
| **Validação executada** | 1. `npm test` executado — novos testes preventivos passam. 2. Busca final por `VITE_GROQ_API_KEY` e `VITE_GITHUB_CLIENT_SECRET` em `src/` retorna zero resultados. 3. `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` preservadas. 4. Vercel verificada manualmente pelo responsável: variáveis sensíveis de backend **não** possuem prefixo `VITE_`. |
| **Rollback**            | `git revert <commit-sha>` — reverte as 3 alterações de forma atômica. |
| **Observação**          | A restauração histórica completa do `CHECKLIST.md` (entradas anteriores ao baseline) será feita em PR separado de governança. Providers/managers órfãos (`OptimizedAPIManager.js`, `ExternalAPIManager.js`, `src/api/providers/*`) serão tratados em PR posterior conforme Auditoria Mestre Fase 2. |
