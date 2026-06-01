# Validação visual/documental pós-Fase 9 — 2026-06-01

## 1) Identificação

- **Data:** `2026-06-01`
- **Repositório:** `kizirianmax/rkmmax-hibrido`
- **Base auditada:** `main`
- **Tipo:** validação visual/documental pós-Fase 9
- **Escopo:** sem alteração funcional

## 2) Veredito

- Houve tentativa de validação visual automática com Playwright no ambiente local (`http://127.0.0.1:4173`).
- Screenshots foram gerados automaticamente e versionados em `docs/audits/evidence/visual-pos-fase9/`.
- Rotas públicas alvo foram acessadas; `/showcase` redirecionou para `/demo`.
- UIs operacionais (Serginho IA, Híbrido/Construtor e Especialistas) redirecionaram para `/login` sem autenticação.
- Presença visual do seletor de IA nas UIs operacionais permanece **pendente de validação manual pelo owner em sessão autenticada**.
- Este registro **não** comprova maturidade comercial.

## 3) Tabela de rotas públicas

| rota | objetivo | resultado | evidência | observação |
|---|---|---|---|---|
| `/` | Validar carregamento visual da home pública. | carregou | `docs/audits/evidence/visual-pos-fase9/rota-home.png` | Método: Playwright local. |
| `/startup` | Validar página institucional pública. | carregou | `docs/audits/evidence/visual-pos-fase9/rota-startup.png` | Método: Playwright local. |
| `/demo` | Validar vitrine pública de demonstração. | carregou | `docs/audits/evidence/visual-pos-fase9/rota-demo.png` | Método: Playwright local. |
| `/demo-autoplay` | Validar demo guiada pública. | carregou | `docs/audits/evidence/visual-pos-fase9/rota-demo-autoplay.png` | Método: Playwright local. |
| `/showcase` | Validar comportamento da rota pública de vitrine. | redirecionou | `docs/audits/evidence/visual-pos-fase9/rota-showcase.png` | URL final observada: `/demo`. |
| `/login` | Validar tela pública de autenticação. | carregou | `docs/audits/evidence/visual-pos-fase9/rota-login.png` | Método: Playwright local. |

## 4) Tabela de UIs operacionais

| UI | objetivo | resultado | evidência | observação |
|---|---|---|---|---|
| Serginho IA (`/serginho`) | Validar UI operacional e presença do seletor de IA. | redirecionou | `docs/audits/evidence/visual-pos-fase9/ui-serginho-redireciona-login.png` | Redirecionou para `/login`; pendente de validação manual pelo owner autenticado. |
| Híbrido/Construtor (`/hybrid`) | Validar UI operacional e presença do seletor de IA. | redirecionou | `docs/audits/evidence/visual-pos-fase9/ui-hibrido-redireciona-login.png` | Redirecionou para `/login`; pendente de validação manual pelo owner autenticado. |
| Especialistas (`/specialists`) | Validar UI operacional e presença do seletor de IA. | redirecionou | `docs/audits/evidence/visual-pos-fase9/ui-especialistas-redireciona-login.png` | Redirecionou para `/login`; pendente de validação manual pelo owner autenticado. |

## 5) Regra sobre `/startup`

- `/startup` é página institucional pública.
- `/startup` não deve ter seletor de IA.
- A ausência de seletor em `/startup` é comportamento esperado.
- `/startup` não deve ser confundida com UI operacional.

## 6) Limitações

- O domínio público externo (`kizirianmax.site` e `rkmmax-hibrido.vercel.app`) estava bloqueado no navegador do ambiente (`ERR_BLOCKED_BY_CLIENT`); a validação visual foi executada localmente via Vite.
- Parte de recursos externos (ex.: Google Fonts) também apareceu bloqueada no console; isso não impediu as capturas principais.
- UIs operacionais exigiram autenticação (redirecionamento para `/login`); não houve bypass de login.
- Não houve imagem manual do owner nesta tarefa.
- Esta validação não comprova SLA, uptime, p95/p99, clientes, receita, tração ou maturidade comercial.

## 7) Impacto para banca/Top 30 (conservador)

- Com evidência visual automática, a apresentação fica mais forte.
- Mesmo com limitações de ambiente, o registro comprova tentativa controlada e rastreável.
- O projeto deve ser apresentado como protótipo avançado em validação.
- O projeto não deve ser apresentado como produto comercial maduro.

## 8) Declaração de não alteração funcional

Não houve alteração em runtime, UI funcional, código, rotas, testes, dependências, workflows, providers/modelos, prompts, registry, fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets, tag/release ou implementação funcional.

## 9) Rollback

`git revert <commit-sha>`
