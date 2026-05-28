## 2026-05-28 — docs(audit): encerramento documental formal da Fase 7 UI/UX

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(audit): encerrar formalmente a Fase 7 UI/UX após validação Google` |
| **Identificação** | **Fase 7 — Encerramento documental formal (UI/UX pública estratégica + paridade operacional controlada)** |
| **Objetivo** | Registrar de forma auditável o encerramento documental formal da Fase 7 do RKMMAX / Serginho IA, consolidando F7-UX-01 a F7-UX-09 na `main`, com evidência pública acessível em `/startup`, `/demo` e `/demo-autoplay`, preservando integralmente a arquitetura soberana do Serginho (gateway único, sem bypass). |
| **PRs consolidados na base** | PR #503 (F7-UX-08) mergeado em `3712755a249526b9eccf7f53cbb809cdb67c8620`; PR #504 (F7-UX-09) mergeado em `35e5cf58293811c13804ce620615cbcd12dbc11a`. |
| **Arquivos alterados** | `docs/audits/fase7-uiux-encerramento-2026-05-28.md` (novo), `CHECKLIST.md` (prepend de uma única entrada nova no topo, sem truncamento do histórico anterior). |
| **Evidência pública acessível** | `/startup`, `/demo`, `/demo-autoplay`. |
| **Matriz Google for Startups** | Requisitos públicos analisados (Team Information, demonstração pública, apresentação institucional) com evidência acessível nas rotas públicas. **Sem afirmar aprovação, concessão de créditos ou qualquer decisão favorável.** Demo e scores exibidos são exemplos demonstrativos / fixture local, sem geração ao vivo. |
| **Confirmação arquitetural** | Serginho IA mantido como orquestrador soberano e gateway único; Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments em camadas separadas; nenhum bypass criado; nenhuma alteração de comportamento funcional. |
| **Fora do escopo** | P3 / vídeo gravado final, SSR/SEO, Dependabot (#475, #477) e novas evoluções funcionais. |
| **Decisão formal** | ✅ **FASE 7 ENCERRADA DOCUMENTALMENTE.** Site público em condição de aguardar reavaliação da Google, sem garantia de aprovação. |
| **Risco** | Mínimo. Entrega exclusivamente documental, sem alteração de produto ou comportamento. |
| **Rollback** | Rollback documental via `git revert <commit-sha>`, sem efeito em runtime. |
| **Confirmação explícita de ausência de alteração em runtime/camadas** | Nenhuma alteração em código, CSS, testes, rotas, dependências, providers, modelos, prompts, APIs, Auth, Payments, ABNT, Serginho, Híbrido/Construtor, Especialistas, `/startup`, `/demo` ou `/demo-autoplay`. |

## 2026-05-28 — feat(ui): F7-UX-09 publicar experiência relevante do fundador em /startup

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ui): F7-UX-09 publicar experiência relevante do fundador em /startup` |
| **Identificação** | **Fase 7 — UI/UX (F7-UX-09)** |
| **Objetivo** | Publicar em `/startup` uma seção pública, bilíngue e verificável sobre o fundador e sua experiência diretamente relevante na criação e evolução do RKMMAX / Serginho IA, atendendo ao requisito de Team Information com experiência relevante. |
| **Motivação** | Exigência oficial do Google Cloud Startup Support sobre **Team Information** (integrantes principais e experiência relevante) + lacuna A confirmada pela auditoria estrutural Claude Opus 4.7. |
| **Lacuna resolvida** | Ausência de experiência relevante pública do fundador em `/startup`. |
| **Arquivos alterados** | `src/pages/Projects.jsx`, `src/__tests__/public-pages-premium-ui.test.js`, `CHECKLIST.md` |
| **Texto/fatos publicados (PT + EN, citados)** | **PT:** “Roberto Kizirian Max é o fundador do RKMMAX / Serginho IA e lidera a concepção e evolução da plataforma. Sua atuação no projeto inclui a definição da arquitetura em camadas, a evolução do Construtor/Híbrido para geração, validação e revisão de artefatos digitais, e a condução do produto em seu estágio atual de protótipo funcional em desenvolvimento ativo e validação.” **EN:** “Roberto Kizirian Max is the founder of RKMMAX / Serginho IA and leads the conception and evolution of the platform. His work on the project includes defining its layered architecture, evolving the Constructor/Hybrid system for digital artifact generation, validation and review, and guiding the product through its current stage as a functional prototype under active development and validation.” |
| **Confirmação explícita de ausência de overclaim** | Deliberadamente **não** foram afirmados: formação acadêmica; cargos anteriores; empresas anteriores; clientes pagantes; faturamento/receita; investimentos recebidos; aprovação em programas não documentada; parcerias formais; propriedade intelectual registrada; domínio técnico não comprovado; métricas não documentadas; experiência profissional externa não comprovada. |
| **Lacuna B fora deste PR** | A lacuna residual de evidência visual pública mais explícita **permanece fora deste PR** e será avaliada separadamente. Nenhum vídeo, screenshot, iframe ou novo recurso visual foi adicionado aqui. |
| **Validações executadas** | Baseline pré-mudança: `npm run lint` — **PASS** (com warnings pré-existentes fora do escopo), `npm run build` — **PASS**, `npm test -- --runInBand` — **PASS**. Pós-mudança: `npm test -- --runInBand src/__tests__/public-pages-premium-ui.test.js` — **PASS**; `npm run lint` — **PASS** (warnings pré-existentes fora do escopo); `npm run build` — **PASS**; `npm test -- --runInBand` — **PASS**. Verificação manual local em preview (`/startup` e `/demo`, viewport mobile 390x844) — **PASS**. |
| **Risco** | Baixo. Mudança restrita a conteúdo público e teste estático relacionado à página `/startup`, sem alteração de runtime, APIs, autenticação, pagamentos, orquestração ou rotas públicas de demo. |
| **Rollback** | `git revert <commit-sha>` |
| **Confirmação explícita de ausência de alteração em runtime/camadas** | Nenhuma alteração em runtime, providers, modelos, prompts, Auth, Payments, ABNT, Serginho, Híbrido/Construtor, Especialistas, `/demo` ou `/demo-autoplay`. Nenhum bypass do Serginho foi criado. |

## 2026-05-27 — feat(ui): F7-UX-08 paridade do seletor de motor de IA entre Serginho IA, Híbrido/Construtor e Especialistas

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ui): F7-UX-08 — AI engine selector parity across Serginho IA, Híbrido/Construtor, and Especialistas` |
| **Identificação** | **Fase 7 — UI/UX (F7-UX-08)** |
| **Objetivo** | Tornar `MANUAL_MODEL_OPTIONS` (de `src/config/modelPriority.js`) a fonte compartilhada única das opções do seletor de motor de IA nas três UIs operacionais (Serginho IA, Híbrido/Construtor e Especialistas), garantindo que a seleção manual seja real e toda execução passe pelo Serginho/orquestrador como gateway único. |
| **Arquivos alterados** | `src/pages/HybridAgentSimple.jsx`, `src/pages/SpecialistChat.jsx`, `src/pages/SpecialistChat.css`, `api/ai.js`, `api/__tests__/specialist-model-selector.test.js`, `CHECKLIST.md` |
| **O que foi alterado** | (1) `HybridAgentSimple.jsx`: removido import de `HYBRID_ENGINE_OPTIONS` (config paralela com labels/ordem diferentes); seletor agora usa `MANUAL_MODEL_OPTIONS` como fonte compartilhada; contrato de `forceProvider` para API preservado sem alteração. (2) `SpecialistChat.jsx`: adicionado state `selectedModel` (padrão `'auto'`); adicionado `<select>` no header do especialista renderizando `MANUAL_MODEL_OPTIONS`; envio de `forceProvider` para `/api/ai` ao selecionar motor diferente de automático; lógica corrigida para resolver `providerName` via `MANUAL_MODEL_OPTIONS.find()` (bug: antes enviava o `id` visual diretamente como `forceProvider`); corrigido erro de sintaxe no template literal do header `Authorization` que bloqueava o build/Preview da Vercel. (3) `SpecialistChat.css`: estilos mínimos para `.specialist-model-selector` / `.specialist-model-select` — compacto, alinhado à direita no header, compatível com mobile. (4) `api/ai.js`: handler do `specialist` atualizado para espelhar o padrão do handler `genius`: cache ignorado quando `forceProvider` presente; `specialistOpts` com `forceProvider` e `noFallback: true` passado para `executeAITask` via orquestrador Serginho; `source: 'specialist-api'` preservado. (5) `api/__tests__/specialist-model-selector.test.js`: 10 novos testes cobrindo `forceProvider` encaminhado pelo orquestrador, cache ignorado com provider forçado, cache usado em automático, soberania do gateway (`source: 'specialist-api'` presente, sem chamada direta a provider). |
| **O que NÃO foi alterado** | Providers disponíveis; modelos disponíveis; prompts de identidade do Serginho ou de especialistas; autenticação/Supabase; pagamentos; rotas públicas (`/startup`, `/demo`, `/demo-autoplay`, `/login`); Home pública; header/menu global; camada ABNT; runtime de orquestração além do roteamento de `forceProvider`; `src/config/modelPriority.js` (lido apenas, não alterado). |
| **Validações executadas** | `npm run lint` — **PASS**; `npm run build` — **PASS**; `npm test -- --runInBand` — **PASS** (7 checks verdes no GitHub, sem conflitos com `main`). Preview da Vercel ativo após correção do erro de sintaxe. |
| **Risco** | Mudança restrita às UIs operacionais (Híbrido/Construtor e Especialistas) e ao handler `specialist` em `api/ai.js`. Sem alteração de lógica de orquestração, providers ou prompts. Risco baixo. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-26 — feat(ui): F7-UX-07 reposicionar página pública do Serginho IA

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ui): F7-UX-07 reposicionar página pública do Serginho IA` |
| **Identificação** | **Fase 7 — UI/UX (F7-UX-07)** |
| **Objetivo** | Reorganizar a página pública `/startup` para apresentação natural do produto **Serginho IA** (marca principal), preservando **RKMMAX INFINITY MATRIX STUDY** como referência institucional secundária. |
| **Arquivos alterados** | `src/pages/Projects.jsx`, `src/pages/Projects.css`, `src/__tests__/public-pages-premium-ui.test.js`, `src/__tests__/demo-showcase-routing.test.js`, `CHECKLIST.md` |
| **O que foi alterado** | (1) Hero reposicionado com título principal **Serginho IA**, subtítulo institucional “Uma solução da RKMMAX INFINITY MATRIX STUDY” e explicação clara de produto com IA + revisão humana + governança. (2) CTA principal da página alterado para `/demo` com texto público (“Ver demonstração pública” / “View public demo”), mantendo `/demo-autoplay` como CTA secundário. (3) Abertura reorganizada para proposta de valor comercial (problema, público-alvo, como funciona) antes do bloco institucional. (4) Seção de capacidades do produto organizada com quatro blocos informativos: planejamento/orquestração, construção de artefatos, especialistas sob coordenação e conformidade ABNT, sem links operacionais para camadas internas. (5) Modelo de negócio digital descrito de forma pública e honesta como plataforma/SaaS em desenvolvimento com protótipo funcional em validação ativa. (6) Seção de fundador/projeto mantida com dados comprovados: Roberto Kizirian Max, Serginho IA, RKMMAX INFINITY MATRIX STUDY e contato `roberto@kizirianmax.site`. (7) Validações externas preservadas como trajetória do projeto; contexto institucional e nuvem movidos para posição secundária. (8) CSS ajustado minimamente para manter cards premium, legibilidade e hierarquia mobile. (9) Testes estáticos atualizados para novo CTA principal `/demo`, presença de marca/institucional e ausência de bypass para camadas internas. (10) Ajuste final de consistência visual/comunicacional no `/startup`: CTA `/demo` com `startup-demo-cta rkm-btn rkm-btn-primary`, CTA `/demo-autoplay` com `startup-demo-cta-secondary rkm-btn rkm-btn-secondary`, seção visível de camadas com badge central **Serginho IA** (PT/EN), texto de **Segurança e Acesso / Security and Access** reescrito para linguagem pública natural e auditoria final de `src/pages/Projects.jsx` confirmando ausência de duplicações reais de propriedades, seções e atributos. |
| **O que NÃO foi alterado** | `src/pages/Home.jsx`/`Home.css`; `/demo`, `/demo-autoplay` e `/login` funcionalmente; header/menu global; rota `/startup`; runtime interno; backend/orquestração do Serginho; Construtor/Híbrido runtime; Especialistas runtime; ABNT runtime; Auth/SaaS/Payments; endpoints/providers/modelos/prompts; dependências. |
| **Validações executadas** | Baseline pré-mudança: `npm run lint` — **PASS** (warnings pré-existentes), `npm run build` — **PASS**, `npm test -- --runInBand` — **PASS**. Pós-mudança: `npm run lint` — **PASS** (warnings pré-existentes), `npm run build` — **PASS**, `npm test -- --runInBand` — **PASS**. Testes direcionados: `npm test -- --runInBand src/__tests__/public-pages-premium-ui.test.js src/__tests__/demo-showcase-routing.test.js` — **PASS**. Validação final dos ajustes de consistência: **PASS**. Verificação manual local com Playwright em desktop e mobile, em Português e English: `/startup` permanece pública (sem redirecionamento para login) e CTA principal abre `/demo` pública. |
| **Risco** | Mudança restrita a conteúdo/hierarquia visual da página pública `/startup` e testes estáticos associados. Sem alteração de lógica de runtime. Risco baixo. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-26 — feat(ui): F7-UX-06 destacar Serginho IA e proposta de valor na Home pública

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ui): F7-UX-06 destacar Serginho IA e proposta de valor na Home pública` |
| **Identificação** | **Fase 7 — UI/UX (F7-UX-06)** |
| **Objetivo** | Reposicionamento público mínimo da Home (`/`) para apresentar o Serginho IA como marca principal e plataforma integrada de IA, com proposta de valor objetiva e quatro capacidades visíveis, atendendo ao feedback externo do Sebrae/Startup SC. |
| **Arquivos alterados** | `src/pages/Home.jsx`, `src/pages/Home.css`, `src/__tests__/public-pages-premium-ui.test.js`, `CHECKLIST.md` |
| **O que foi alterado** | (1) Hero da Home: título principal alterado para **Serginho IA**; eyebrow alterado para "Uma solução da RKMMAX INFINITY MATRIX STUDY"; subtítulo atualizado com proposta de valor concreta (planejar, construir, validar artefatos digitais); texto de público-alvo adicionado; CTA principal "Ver demonstração pública" → `/demo`; CTA secundário "Acessar a plataforma" → `/serginho`. (2) Painéis informativos do `.home-page__content-grid` restaurados com copy de marca consistente: painel principal com título **"Serginho IA"** (era "Serginho"), role "Orquestrador central" (era "Orquestrador") e corpo descrevendo orquestração de planejamento, artefatos, especialistas e validações (substituiu texto genérico "resolver qualquer tarefa"); painel lateral com título **"Sobre o Serginho IA"** (era "Sobre o RKMMAX") e corpo com descrição objetiva da plataforma referenciando a **RKMMAX INFINITY MATRIX STUDY** (substituiu texto com "47 especialistas", "Stripe" e acesso); badge "✨ APP" removido; nenhum CTA operacional adicionado nos painéis. (3) Nova seção de quatro capacidades integradas com cards informativos premium: Planejar com Serginho IA, Construir artefatos digitais, Consultar especialistas, Validar conformidade ABNT. (4) Home.css: novos estilos para `.home-page__audience`, `.home-page__hero-cta`, `.home-page__capabilities`, `.home-page__capabilities-grid`, `.home-page__cap-card`, `.home-page__cap-icon`, `.home-page__cap-title`, `.home-page__cap-body`; responsividade mobile para novos blocos adicionada; todas as cores via tokens `--rkm-*`, sem hard-codes. (5) Testes: três casos de teste cobrindo hierarquia/CTA/capacidades e presença de "Sobre o Serginho IA" e referência institucional nos painéis; guards adicionados contra atalhos diretos para `/hybrid`, `/specialists`, `/abnt` e `/construtor`. |
| **O que NÃO foi alterado** | `Projects.jsx` / `/startup`; `Demo.jsx` / `/demo-autoplay`; `Auth.jsx` / `/login`; Header/menu global; runtime funcional; Serginho backend/orquestração; Construtor/Híbrido runtime; Especialistas runtime; ABNT runtime; Auth/SaaS/Payments; endpoints, providers, modelos ou prompts; rotas existentes. Nenhum acesso operacional direto às camadas Construtor/Híbrido, Especialistas ou ABNT foi criado na Home. |
| **Validações executadas** | `npm run lint` — **PASS**; `npm run build` — **PASS**; `npm test -- --runInBand` — **PASS**. |
| **Risco** | Exclusivamente visual/copy na Home pública. Nenhuma lógica funcional ou camada interna alterada. Risco mínimo. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-26 — feat(ui): F7-UX-05 refinamento premium das páginas públicas principais

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ui): F7-UX-05 refinamento premium das páginas públicas principais` |
| **Identificação** | **Fase 7 — UI/UX (F7-UX-05)** |
| **Páginas refinadas** | `/` (`src/pages/Home.jsx`, `src/pages/Home.css` novo), `/startup` (`src/pages/Projects.jsx`, `src/pages/Projects.css`), `/demo` (`src/pages/Demo.jsx`, `src/pages/Demo.css`) e `/login` (`src/pages/Auth.jsx`, `src/pages/Auth.css` novo). |
| **Componentes/tokens aplicados** | Aplicação progressiva de `.rkm-card`, `.rkm-card-elevated`, `.rkm-btn-primary`, `.rkm-btn-secondary`, `.rkm-btn-ghost`, `.rkm-input` e tokens `--rkm-*` para hero sections, cards, CTAs, inputs, grids, contraste, containers e espaçamento desktop-first. |
| **Arquivos alterados** | `src/pages/Home.jsx`, `src/pages/Home.css` (novo), `src/pages/Projects.jsx`, `src/pages/Projects.css`, `src/pages/Demo.jsx`, `src/pages/Demo.css`, `src/pages/Auth.jsx`, `src/pages/Auth.css` (novo), `src/__tests__/public-pages-premium-ui.test.js` (novo), `CHECKLIST.md` |
| **O que NÃO foi alterado** | Runtime funcional, endpoints, Serginho, Construtor/Híbrido runtime, Especialistas, ABNT, Auth/SaaS/Payments funcionalmente, providers/modelos/prompts, rotas existentes, textos principais de negócio e lógica de Demo. |
| **Validação executada** | `npm run lint` — **PASS** (warnings pré-existentes fora do escopo); `npm run build` — **PASS**; `npm test -- --runInBand` — **PASS**; teste direcionado `src/__tests__/public-pages-premium-ui.test.js` — **PASS**. |
| **Evidências visuais** | Screenshots locais de auditoria: `/tmp/playwright-logs/home-premium.png`, `/tmp/playwright-logs/startup-premium.png`, `/tmp/playwright-logs/demo-premium.png`, `/tmp/playwright-logs/login-premium.png`. URLs fornecidas pelo usuário para eventual uso no PR: `https://github.com/user-attachments/assets/4b0dea11-8450-4506-a677-c09833e02637` e `https://github.com/user-attachments/assets/8b2a8a0d-5195-45e1-b9d9-9909c4141f72`. |
| **Riscos conhecidos** | Ajustes estritamente visuais podem gerar pequenas diferenças de densidade/percepção entre breakpoints, mas sem impacto funcional observado; ambiente local de preview sem variáveis Supabase/Sentry/PostHog apenas exibe warnings informativos já esperados. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-26 — feat(css): F7-UX-04 componentes base premium (botões/cards/inputs/badges)

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(css): F7-UX-04 componentes base premium (botões/cards/inputs/badges)` |
| **Identificação** | **Fase 7 — UI/UX (F7-UX-04)** |
| **Auditoria aplicada** | Mapeamento dos padrões atuais indicou estilos fragmentados de botão/card/input/badge em CSS de páginas/componentes e ausência de classes globais `rkm-*` para esses blocos base. |
| **Componentes base criados** | `.rkm-btn`, `.rkm-btn-primary`, `.rkm-btn-secondary`, `.rkm-btn-ghost`, `.rkm-card`, `.rkm-card-elevated`, `.rkm-input`, `.rkm-badge`, `.rkm-badge-success`, `.rkm-badge-warning`, `.rkm-badge-error` (com retrocompatibilidade de `.rkm-btn-accent`). |
| **Estados cobertos** | Botões: `hover`, `focus-visible`, `active`, `disabled`; Inputs: `hover`, `focus/focus-visible`, `disabled`; Badges: `focus-visible`; foco global acessível preservado. |
| **Tokens aplicados** | Uso consistente de `--rkm-*` para cor, borda, radius, sombra, espaçamento, tipografia e transições (sem hardcode funcional novo). |
| **Arquivos alterados** | `src/index.css`, `CHECKLIST.md` |
| **O que NÃO foi alterado** | Lógica funcional, componentes React, páginas específicas, `Demo.jsx`/`Demo.css`, runtime do Serginho/Construtor/Híbrido, Especialistas, ABNT, Auth/SaaS/Payments, endpoints, providers/modelos/prompts. |
| **Validação executada** | `npm run lint` — **PASS** (0 errors, 256 warnings pré-existentes); `npm run build` — **PASS**; `npm test -- --runInBand` — **PASS** (66 suítes, 2455 testes). |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-26 — feat(ui): F7-UX-03 header, navegação e layout global premium

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ui): F7-UX-03 header, navegação e layout global premium` |
| **Identificação** | **Fase 7 — UI/UX (F7-UX-03)** |
| **Arquivos alterados** | `src/components/Header.jsx`, `src/components/Header.css` (novo), `src/App.jsx`, `src/index.css`, `src/components/Footer.jsx`, `src/components/Footer.css`, `CHECKLIST.md` |
| **Header entregue** | Header desktop-first com altura consistente, sticky, divisória/borda premium, sombra sutil e backdrop; logo, navegação principal e ações separados em áreas visuais claras. |
| **Navegação entregue** | Hierarquia tipográfica refinada, espaçamento entre itens, estados `hover`/`focus`/`active` com tokens e foco visível por teclado (`:focus-visible`) sem alteração de rotas/comportamento funcional. |
| **Layout global entregue** | Estrutura global em `App.jsx` com `app-shell`/`app-main`/`app-main__inner` para gutters e centralização consistentes; novos tokens de layout (`--rkm-layout-gutter`, `--rkm-container-max`) aplicados no escopo permitido. |
| **Footer (integração segura)** | `Footer` integrado ao layout global e refinado visualmente com tokens (`cores`, `tipografia`, `borda`, `sombra`, `espaçamento`) sem alterar conteúdo funcional interno. |
| **Tokens aplicados** | Uso amplo de `--rkm-*` em header/nav/layout/footer, substituindo hardcodes no escopo permitido e preservando responsividade mobile. |
| **O que NÃO foi alterado** | Runtime funcional, endpoints, Serginho, Construtor/Híbrido runtime, Especialistas, ABNT, Auth/SaaS/Payments, providers/modelos/prompts, `Demo.jsx`/`Demo.css`. |
| **Validação executada** | `npm run lint` — **PASS** (0 errors, 256 warnings pré-existentes/gerais); `npm run build` — **PASS**; `npm test -- --runInBand` — **PASS** (66 suítes, 2455 testes). |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-26 — feat(css): F7-UX-02 design tokens globais premium

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(css): F7-UX-02 design tokens globais premium` |
| **Identificação** | **Fase 7 — UI/UX (F7-UX-02)** |
| **O que mudou** | Expansão de `src/index.css` com camada completa de design tokens CSS (`--rkm-*`) cobrindo: cores base, superfícies, texto, acento, bordas, radius, sombras, espaçamento (escala 4px), escala tipográfica, transições, z-index e estados de foco/hover. Variáveis legadas (`--brand`, `--text`, `--bg`) mantidas via alias para retrocompatibilidade. Aliases `--text-100`, `--text-200`, `--accent-400`, `--accent-500` adicionados para corrigir referências sem definição em `src/styles.css`. Classes utilitárias base `.rkm-surface`, `.rkm-surface-elevated`, `.rkm-btn-accent`, `.rkm-text-muted`, `.rkm-text-accent` adicionadas para uso progressivo nas próximas etapas. Regra `:focus-visible` global adicionada para acessibilidade de teclado. |
| **Tokens criados** | `--rkm-bg`, `--rkm-surface`, `--rkm-surface-elevated`, `--rkm-border`, `--rkm-border-focus`, `--rkm-text`, `--rkm-text-muted`, `--rkm-text-subtle`, `--rkm-accent`, `--rkm-accent-dark`, `--rkm-accent-soft`, `--rkm-accent-hover`, `--rkm-blue`, `--rkm-blue-dark`, `--rkm-blue-soft`, `--rkm-success`, `--rkm-warning`, `--rkm-error`, `--rkm-info`, `--rkm-radius-sm/md/lg/xl/full`, `--rkm-shadow-sm/md/lg/accent`, `--rkm-space-1` a `--rkm-space-16`, `--rkm-font-sans`, `--rkm-font-mono`, escala `--rkm-font-size-*`, `--rkm-font-weight-*`, `--rkm-line-height-*`, `--rkm-transition-*`, `--rkm-z-*` |
| **Arquivos alterados** | `src/index.css`, `CHECKLIST.md` |
| **O que NÃO foi alterado** | Serginho, Construtor runtime, Especialistas, ABNT, Auth/SaaS/Payments, providers/modelos/prompts, componentes React, páginas específicas, Demo.jsx/Demo.css, endpoints, App.css, HybridAgent.css, styles.css (lógica). Nenhuma tela foi redesenhada. |
| **Escopo e segurança** | Exclusivamente CSS global declarativo. Nenhuma lógica funcional alterada. |
| **Validação executada** | `npm run lint` — **PASS**; `npm run build` — **PASS**; `npm test -- --runInBand` — **PASS**. |
| **Rollback** | `git revert <commit-sha>` |



| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(audit): complemento sênior da F7-UX-01 (precisão e priorização visual)` |
| **Identificação** | **Fase 7 — UI/UX (F7-UX-01 complemento documental)** |
| **O que mudou** | Refino documental da auditoria `docs/audits/f7-ux-01-auditoria-premium-front-end-2026-05-26.md` com: (1) explicitação objetiva do gap entre maturidade técnica e maturidade visual; (2) critério formal de distinção entre fato verificável e juízo de percepção; (3) matriz impacto x risco para priorização sem alterar runtime; (4) reforço de guardrails de segurança, acessibilidade, consistência e identidade própria sem cópia de terceiros. |
| **Link da auditoria** | [`docs/audits/f7-ux-01-auditoria-premium-front-end-2026-05-26.md`](docs/audits/f7-ux-01-auditoria-premium-front-end-2026-05-26.md) |
| **Escopo e segurança** | PR exclusivamente documental/checklist. Nenhum CSS funcional, componente, endpoint, runtime, Serginho, Construtor runtime, Especialistas, ABNT, Auth/SaaS/Payments ou providers/modelos/prompts foi alterado. |
| **Arquivos alterados** | `docs/audits/f7-ux-01-auditoria-premium-front-end-2026-05-26.md`, `CHECKLIST.md` |
| **Validação executada** | `npm run lint` — **PASS** (0 errors, 258 warnings pré-existentes); `npm run build` — **PASS**; `npm test -- --runInBand` — **PASS** (66 suítes, 2455 testes). |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-26 — docs(audit): F7-UX-01 auditoria premium de interface do front-end

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(audit): F7-UX-01 auditoria premium de interface do front-end` |
| **Identificação** | **Fase 7 — UI/UX (F7-UX-01)** |
| **Escopo** | Auditoria visual premium, honesta e verificável das telas principais (`/`, `/startup`, `/demo`, `/demo-autoplay`, `/serginho`, `/hybrid`, `/specialists`, `/login`) e da navegação/layout global, sem alteração de runtime. |
| **O que mudou** | Criação de `docs/audits/f7-ux-01-auditoria-premium-front-end-2026-05-26.md` com diagnóstico geral, problemas por tela, prioridades P0/P1/P2, recomendações visuais, riscos de regressão, sequência F7-UX-02+ e critérios mensuráveis de sucesso para front-end premium. |
| **Link da auditoria** | [`docs/audits/f7-ux-01-auditoria-premium-front-end-2026-05-26.md`](docs/audits/f7-ux-01-auditoria-premium-front-end-2026-05-26.md) |
| **Escopo e segurança** | PR exclusivamente documental/checklist. Nenhum código funcional, CSS de runtime, componentes, endpoints, providers/modelos/prompts, Serginho, Construtor runtime, Especialistas, ABNT ou Auth/SaaS/Payments foi alterado. |
| **Arquivos alterados** | `docs/audits/f7-ux-01-auditoria-premium-front-end-2026-05-26.md` (novo), `CHECKLIST.md` |
| **Validação executada** | `npm run lint` — **PASS** (0 errors, 258 warnings pré-existentes); `npm run build` — **PASS**; `npm test -- --runInBand` — **PASS** (66 suítes, 2455 testes). |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-26 — docs(audit): encerramento formal da Fase 6 governança/documentação

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(audit): encerramento formal da Fase 6 governança/documentação` |
| **Identificação** | **Fase 6 — Governança/Documentação (auditoria de encerramento)** |
| **O que foi auditado** | `CHECKLIST.md`, `README.md`, `docs/README.md`, `CONTRIBUTING.md`, `.github/CODEOWNERS`, `docs/RELEASE_POLICY.md`, `docs/audits/f6-gov-01-governanca-real-repositorio-2026-05-26.md`, `docs/audits/f6-gov-03-release-baseline-banca-2026-05-26.md` e docs canônicos definidos em F6-DOC-01 (`docs/api.md`, `docs/architecture.md`, com stubs de compatibilidade). |
| **O que mudou** | Criação de `docs/audits/fase6-governanca-documental-encerramento-2026-05-26.md` com decisão explícita sobre encerramento da Fase 6, prontidão para tag/release de baseline, bloqueadores e itens futuros não bloqueantes. |
| **Decisão sobre Fase 6** | ✅ Fase 6 pode ser encerrada documentalmente. |
| **Prontidão para tag/release** | ✅ Pronto para criação manual de tag/release de baseline **desde que** CI esteja verde, `lint/build/test` passem e o owner faça revisão final. (Tag/release não criada neste PR.) |
| **Bloqueadores críticos** | **Nenhum bloqueador documental crítico identificado** antes da banca. |
| **Limitações preservadas (sem overclaim)** | Projeto single-owner; sem revisor externo independente; branch protection dependente de plano/limitação do repo privado; warnings de lint pré-existentes; demo com fixture estática; `executeArtifact` desativado; sem tração comercial relevante ainda. |
| **Escopo e segurança** | PR exclusivamente documental. Nenhum código funcional, runtime, endpoint, rota, provider/modelo/prompt, Serginho, Especialistas, ABNT ou camada Auth/SaaS/Payments foi alterado. |
| **Arquivos alterados** | `docs/audits/fase6-governanca-documental-encerramento-2026-05-26.md` (novo), `CHECKLIST.md` |
| **Validação executada** | `npm run lint` — **PASS** (warnings pré-existentes); `npm run build` — **PASS**; `npm test -- --runInBand` — **PASS**. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-26 — docs(governance): F6-GOV-03 baseline mínimo de release/tag para banca/incubadora

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(governance): F6-GOV-03 baseline mínimo de release/tag para banca/incubadora` |
| **Identificação** | **Fase 6 — Governança Documental (F6-GOV-03)** |
| **Escopo** | Definição documental de baseline mínimo e verificável de release/tag para banca/incubadora, sem criação de automações inexistentes e sem alteração de runtime. |
| **O que mudou** | Criação de `docs/audits/f6-gov-03-release-baseline-banca-2026-05-26.md` com política mínima e honesta para baseline, tagging, release notes, limites explícitos e rollback. |
| **Baseline definido** | Congelar referência verificável pré-banca com validação técnica (`lint`, `build`, `test`), checks de Actions verdes e operação Vercel (Preview/produção). |
| **Política mínima de tagging** | Convenção `vMAJOR.MINOR.PATCH`, exemplo recomendado `v6.0.0`, criação manual de tag por owner único (single-owner). |
| **Política mínima de release** | Fluxo: CI verde → revisão final do owner → squash merge → criação de tag → release notes manuais. |
| **Limites explícitos** | Não afirmar branch protection enterprise inexistente, múltiplos revisores independentes, IA em tempo real na demo, `executeArtifact` habilitado ou automação de release inexistente. |
| **Escopo e segurança** | PR exclusivamente documental. Nenhum código funcional, endpoint, provider/modelo/prompt, runtime, rota ou camada de SaaS/Auth/Payments foi alterado. |
| **Arquivos alterados** | `docs/audits/f6-gov-03-release-baseline-banca-2026-05-26.md` (novo), `CHECKLIST.md` |
| **Validação executada** | `npm run lint` — **PASS** (warnings pré-existentes); `npm run build` — **PASS**; `npm test -- --runInBand` — **PASS**. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-26 — docs(governance): F6-GOV-02 mitigadores mínimos de maturidade operacional

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(governance): F6-GOV-02 mitigadores mínimos de maturidade operacional` |
| **Identificação** | **Fase 6 — Governança Documental (F6-GOV-02)** |
| **Escopo** | Mitigadores mínimos e verificáveis de governança operacional: criação de `.github/CODEOWNERS`; criação de `docs/RELEASE_POLICY.md`; registro de autoria assistida por IA no `CONTRIBUTING.md`; atualização do índice `docs/README.md`. |
| **Mitigadores adicionados** | (1) `CODEOWNERS` mínimo e honesto com owner único (`* @kizirianmax`); (2) política simples de release/tagging semântico com exemplo `v6.0.0`; (3) recomendação explícita de tag antes de demos/bancas; (4) release notes manuais; (5) rollback documental com `git revert` e referência a tags; (6) política de autoria assistida por IA com revisão/merge final do owner e CI verde obrigatório. |
| **Escopo e segurança** | PR exclusivamente documental. Nenhum código funcional, runtime, endpoint, provider/modelo/prompt foi alterado. Serginho, Construtor runtime, Especialistas, ABNT e camada Auth/SaaS/Payments permanecem inalterados. |
| **Arquivos alterados** | `.github/CODEOWNERS` (novo), `docs/RELEASE_POLICY.md` (novo), `CONTRIBUTING.md`, `docs/README.md`, `CHECKLIST.md` |
| **Validação executada** | `npm run lint`, `npm run build`, `npm test -- --runInBand` |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-26 — docs(governance): F6-GOV-01 auditoria de governança real do repositório

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(governance): F6-GOV-01 auditoria de governança real do repositório` |
| **Identificação** | **Fase 6 — Governança Documental (F6-GOV-01)** |
| **Data** | 2026-05-26 |
| **Escopo** | Auditoria de governança real: o que já existe, o que ainda é limitação, riscos para banca/incubadora, mitigadores atuais e recomendados, o que não deve ser prometido. |
| **O que foi auditado** | `CHECKLIST.md`, `README.md`, `docs/DEVELOPMENT_GUIDELINES.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/BRANCH_PROTECTION_GUIDE.md`, `docs/MAINTENANCE.md`, `.github/workflows/test.yml`, `.github/workflows/coverage.yml`, histórico de PRs F4/F5/F6. |
| **O que mudou** | Criação de `docs/audits/f6-gov-01-governanca-real-repositorio-2026-05-26.md` com auditoria honesta e verificável da governança real do repositório. |
| **Governança documentada** | CI ativo (test.yml + coverage.yml); CHECKLIST.md como trilha append-only; política de merge documentada (CI verde obrigatório); SECURITY.md com canal e prazos; guia de branch protection instrucional; CONTRIBUTING.md e templates de PR/issue; histórico de PRs pequenos e reversíveis. |
| **Limitações declaradas** | Single-owner (@kizirianmax único mantenedor real); PRs com autoria assistida por Copilot/agent revisados pelo owner; branch protection de status incerto para repositório privado; ausência de revisor externo independente; MAINTENANCE.md stub; sem CODEOWNERS; sem releases versionados formais. |
| **Status** | ✅ Documentado / sem alteração de runtime |
| **Escopo e segurança** | PR exclusivamente documental. Nenhum código funcional, runtime, rota, componente, endpoint, dependência, provider/modelo/prompt foi alterado. Serginho, Construtor, Especialistas, ABNT, Auth/SaaS/Payments inalterados. Nenhuma regra de branch protection criada ou fingida. Nenhuma revisão externa fingida. |
| **Arquivos alterados** | `docs/audits/f6-gov-01-governanca-real-repositorio-2026-05-26.md` (novo), `CHECKLIST.md` |
| **Link** | [`docs/audits/f6-gov-01-governanca-real-repositorio-2026-05-26.md`](docs/audits/f6-gov-01-governanca-real-repositorio-2026-05-26.md) |
| **Validação executada** | `npm run lint` — **PASS** (0 errors, warnings pré-existentes); `npm run build` — **PASS**; `npm test -- --runInBand` — **PASS**. PR documental — risco funcional zero. |
| **Rollback** | `git revert <commit-sha>` |
| **Declaração de conclusão** | F6-GOV-01 concluído. Auditoria honesta de governança documentada sem overclaim e sem fingir estruturas que não existem. F6-GOV-02 **não** iniciado neste PR. |

## 2026-05-26 — docs(governance): F6-DOC-02 clareza executiva do README para banca/incubadora

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(governance): F6-DOC-02 clareza executiva do README para banca/incubadora` |
| **Identificação** | **Fase 6 — Governança Documental (F6-DOC-02)** |
| **O que foi auditado** | `README.md` após F6-DOC-01 — verificação de leitura executiva em até 5 minutos para avaliadores técnicos, incubadora e banca: (1) o que é RKMMAX / Serginho IA; (2) qual problema resolve; (3) público-alvo inicial (ICP); (4) o que o sistema já faz hoje; (5) o que ainda é limite/futuro; (6) por que a arquitetura é confiável. |
| **O que mudou** | (1) Inclusão de bloco **"Em uma frase"** logo após o parágrafo introdutório do `README.md`, descrevendo proposta de valor, problema endereçado, ICP inicial e diferenciais arquiteturais — sem overclaim e sem prometer IA em tempo real onde a demo é fixture estática; (2) inclusão da seção **"Estado atual do produto"** separando explicitamente `✅ Pronto / verificável`, `🟡 Em estabilização` e `⛔ Futuro / não prometido nesta versão`; (3) inclusão da seção **"Para avaliadores / banca"** com leitura rápida sobre demo pública, baseline técnico reproduzível, garantias arquiteturais e limites conhecidos, com links diretos para `docs/DEMO.md`, checklist operacional F5-03 e governança. |
| **Por que melhora a leitura executiva** | A versão anterior do `README.md` já estava factual e desduplicada (F6-DOC-01), mas faltavam três sinais executivos centrais para banca/incubadora: proposta de valor em uma frase, separação explícita entre o que está pronto vs. em estabilização vs. futuro, e ponto de entrada único para avaliadores (demo + baseline + garantias + limites). As três adições preenchem essas lacunas mantendo postura conservadora: nada é prometido sem evidência verificável no repositório. |
| **Escopo e segurança** | PR exclusivamente documental. Nenhum código funcional, runtime, rota, componente, endpoint, dependência, provider/modelo/prompt foi alterado. Serginho, Construtor, Especialistas, ABNT, Auth/SaaS/Payments inalterados. Nenhum bypass do Serginho. `executeArtifact` permanece desativado. Nenhuma promessa de IA em tempo real em rotas de demo (que seguem operando sobre fixtures estáticas documentadas em `docs/DEMO.md`). |
| **Arquivos alterados** | `README.md`, `CHECKLIST.md` |
| **Validação executada** | `npm run lint` — **PASS** (0 errors, warnings pré-existentes rastreados); `npm run build` — **PASS**; `npm test -- --runInBand` — **PASS**. PR documental — risco funcional zero. |
| **Riscos/limites conhecidos** | Apenas texto/estrutura do `README.md` foi modificado. Nenhum risco funcional. Limites reais e dívidas pré-existentes (warnings de lint, chunk >500 kB, latência Groq variável, fixture estática na demo, `executeArtifact` desativado) foram preservados explicitamente nas novas seções para evitar overclaim. |
| **Rollback** | `git revert <commit-sha>` |
| **Declaração de conclusão** | F6-DOC-02 concluído. README mais legível para avaliadores em até 5 minutos, com proposta de valor, ICP e separação clara entre pronto / em estabilização / futuro. F6-DOC-03 **não** foi iniciado neste PR (escopo respeitado). |

## 2026-05-26 — docs(governance): F6-DOC-01 auditoria de consistência e desduplicação do README/docs

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(governance): F6-DOC-01 auditoria de consistência e desduplicação do README/docs` |
| **Identificação** | **Fase 6 — Governança Documental (F6-DOC-01)** |
| **Escopo** | Auditoria e ajustes mínimos em `README.md`, `docs/README.md`, `docs/API.md`, `docs/api.md`, `docs/ARCHITECTURE.md`, `docs/architecture.md` e registro em `CHECKLIST.md`. |
| **Decisões tomadas** | (1) `docs/api.md` definido como canônico e `docs/API.md` convertido em stub de compatibilidade; (2) `docs/architecture.md` definido como canônico e `docs/ARCHITECTURE.md` convertido em stub de compatibilidade; (3) `docs/README.md` reorganizado em seções únicas (**Visão Geral / Arquitetura / Operação / Governança / Histórico**) sem entradas duplicadas; (4) `README.md` desduplicado em variáveis de ambiente e comandos de testes (seção única de Testing). |
| **Rastreabilidade** | Documentação de auditoria/governança preservada e acessível pelo índice (`docs/audits/`, `CHANGELOG.md`, `CHECKLIST.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `BRANCH_PROTECTION_GUIDE.md`, `MAINTENANCE.md`, `DEVELOPMENT_GUIDELINES.md`). |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-25 — docs(audit): encerramento formal dos itens urgentes da Fase 5 (F5-01, F5-02, F5-03)

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(audit): encerramento formal dos itens urgentes da Fase 5 (F5-01, F5-02, F5-03)` |
| **Identificação** | **Fase 5 — Auditoria de Encerramento dos Urgentes (F5-01, F5-02, F5-03)** |
| **O que foi auditado** | Estado real de F5-01, F5-02 e F5-03 (todos mergeados e registrados em `CHECKLIST.md`). Execução direta dos comandos de baseline: `npm run lint`, `npm run build`, `npm test -- --runInBand`. Avaliação dos 5 critérios de sucesso da Fase 5 definidos em `docs/audits/fase-4-para-fase-5-auditoria-transicao-2026-05-25.md`. |
| **Decisão formal** | ✅ **Itens urgentes F5-01, F5-02 e F5-03 estão formalmente encerrados.** O projeto está pronto para banca/incubadora. |
| **Escopo e segurança** | PR exclusivamente documental. Nenhum código funcional, runtime, rota, componente, endpoint, dependência, provider/modelo/prompt foi alterado. Serginho, Construtor, Especialistas, ABNT, Auth/SaaS/Payments inalterados. |
| **Arquivos alterados** | `docs/audits/f5-urgentes-encerramento-2026-05-25.md` (novo), `CHECKLIST.md` |
| **Validação executada** | `npm run lint` (**PASS** / 258 warnings / 0 errors), `npm run build` (**PASS** / 1030 módulos), `npm test -- --runInBand` (**PASS** / 66 suítes / 2455 testes). |
| **Próximos passos** | F5-04 (governança de sandbox) e F5-05 (métricas não voláteis) são itens **futuros e não bloqueantes** — devem ser tratados após a banca, sem expansão de escopo antes da apresentação. |
| **O que NÃO deve ser feito antes da banca** | Reativar `executeArtifact`; criar bypass do Serginho; alterar providers/modelos/prompts; alterar runtime funcional do Construtor; alterar Especialistas, ABNT, Auth/SaaS/Payments; criar endpoint, dashboard, banco ou analytics externo; implementar F5-04 ou F5-05 agora. |
| **Riscos/limites conhecidos** | 258 warnings de lint (dívida pré-existente, não bloqueante). Chunk >500 kB no build (aviso Vite, pré-existente). Latência Groq variável (rastreada desde Fase 4). Fixture estática na demo (decisão arquitetural). `executeArtifact` desativado (decisão de segurança). |
| **Rollback** | `git revert <commit-sha>` |
| **Declaração de encerramento** | Fase 5 urgente encerrada. Baseline verificado e reproduzível. Projeto pronto para banca/incubadora. |

## 2026-05-25 — docs(governance): F5-03 checklist operacional de demonstração/reprodutibilidade

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(governance): F5-03 checklist operacional de demonstração/reprodutibilidade` |
| **Identificação** | **Fase 5 — F5-03 (governança/documentação: checklist de demo para banca/incubadora)** |
| **O que foi documentado** | Criação de `docs/audits/f5-03-checklist-operacional-demo-2026-05-25.md` com sequência operacional mínima e reproduzível para validar o projeto antes de apresentação: (1) pré-requisitos; (2) sequência técnica — `npm run lint`, `npm run build`, `npm test -- --runInBand`; (3) verificação de rotas públicas (`/demo`, `/demo-autoplay`, `/startup`, `/showcase`); (4) confirmação que `/hybrid` exige autenticação; (5) garantias arquiteturais — demo não promete IA em tempo real, sem bypass do Serginho, `executeArtifact` desativado; (6) roteiro sugerido de apresentação curta (≤ 10 min); (7) limites conhecidos e avisos ao apresentador; (8) confirmação de integridade arquitetural; (9) rollback de emergência. |
| **Por que foi documentado** | F5-03 estava listado como urgente para banca/incubadora na auditoria de transição F4→F5 (`docs/audits/fase-4-para-fase-5-auditoria-transicao-2026-05-25.md`). A Fase 5 exige sequência verificável padronizada para que qualquer avaliador interno possa reproduzir a validação antes de qualquer apresentação sem depender de conhecimento tácito. |
| **Escopo e segurança** | PR exclusivamente documental. Nenhum código funcional, runtime, rota, componente, endpoint, dependência, provider/modelo/prompt foi alterado. Serginho, Construtor, Especialistas, ABNT, Auth/SaaS/Payments inalterados. |
| **Arquivos alterados** | `docs/audits/f5-03-checklist-operacional-demo-2026-05-25.md` (novo), `CHECKLIST.md` |
| **Validação executada** | Baseline pós-F5-02: `npm run lint` (**PASS** / 258 warnings / 0 errors), `npm run build` (**PASS**), `npm test -- --runInBand` (**66 suítes / 2455 testes PASS**). PR documental — risco funcional zero. |
| **Riscos/limites conhecidos** | Documento estático. Nenhum risco funcional. Os limites operacionais documentados (fixture estática na demo, executeArtifact desativado, latência Groq variável) são pré-existentes e rastreados desde a Fase 4. |
| **Rollback** | `git revert <commit-sha>` |
| **Declaração de conclusão** | F5-03 concluído. Checklist operacional de demonstração formalizado e reproduzível. Fase 5 tem agora F5-01, F5-02 e F5-03 completos — baseline pronto para banca/incubadora. |

## 2026-05-25 — test(governance): F5-02 habilitar execução padrão de testes JSX críticos no Jest

| Item | Detalhe |
|------|---------|
| **Título do PR** | `test(governance): F5-02 habilitar execução padrão de testes JSX críticos no Jest` |
| **Identificação** | **Fase 5 — F5-02 (tooling/testes: cobertura padrão de testes JSX críticos)** |
| **O que foi auditado** | `jest.config.mjs` (padrão de descoberta e transform), `package.json` (scripts de teste), arquivos JSX de teste no repositório (`src/components/FeedbackButton.test.jsx`, `src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx`). |
| **Diagnóstico do baseline** | O runner padrão do Jest não descobria testes JSX porque `testMatch` cobria apenas `*.js`/`__tests__/**/*.js`. Evidência: `npm test -- src/components/FeedbackButton.test.jsx --runInBand` retornava **No tests found** com `testMatch: **/__tests__/**/*.js, **/*.test.js`. |
| **O que mudou** | Ajuste mínimo em `jest.config.mjs` para incluir `*.jsx` no `testMatch`, aplicar `babel-jest` apenas para arquivos `.jsx` e manter `collectCoverageFrom` no baseline `*.js` para preservar estabilidade dos checks de Coverage; adição de pragma `@jest-environment jsdom` nos 2 testes JSX críticos para manter ambiente Node como padrão global; inclusão de `@testing-library/dom` (devDependency estritamente necessária para `@testing-library/react`) e ajustes pontuais de queries ambíguas nos 2 testes JSX para estabilizar execução. |
| **Escopo e segurança** | Alterações restritas a tooling e testes. Nenhum código funcional/runtime foi alterado (Serginho, Construtor runtime, Especialistas, ABNT, Auth/SaaS/Payments, providers/modelos/prompts permanecem inalterados). |
| **Arquivos alterados** | `jest.config.mjs`, `package.json`, `package-lock.json`, `src/components/FeedbackButton.test.jsx`, `src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx`, `CHECKLIST.md` |
| **Validação executada** | Baseline pré-mudança: `npm run lint` (**PASS** com **258 warnings / 0 errors**), `npm run build` (**PASS**), `npm test -- --runInBand` (**64 suites / 2442 testes PASS**). Auditoria direcionada: `npm test -- src/components/FeedbackButton.test.jsx --runInBand` (**No tests found**, confirmando lacuna). Pós-mudança: `npm test -- --runInBand src/components/FeedbackButton.test.jsx src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx` (**2 suites / 13 testes PASS**), `npm run lint` (**PASS** com **258 warnings / 0 errors**), `npm run build` (**PASS**), `npm test -- --runInBand` (**66 suites / 2455 testes PASS**). |
| **Riscos/limites conhecidos** | Transform de Jest foi mantido restrito a `.jsx` para minimizar impacto no baseline ESM atual. Os ajustes em testes foram mínimos e focados apenas em remover ambiguidades de seleção de elementos ao ativar a execução real desses testes no runner padrão. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-25 — chore(governance): F5-01 restaurar execução de lint no baseline com ESLint v10 flat config

| Item | Detalhe |
|------|---------|
| **Título do PR** | `chore(governance): F5-01 restaurar execução de lint no baseline com ESLint v10 flat config` |
| **Identificação** | **Fase 5 — F5-01 (tooling/governança: lint executável no baseline)** |
| **Causa da falha no baseline** | `npm run lint` falhava no estado atual com **ESLint v10.2.1** por ausência de `eslint.config.(js|mjs|cjs)`. O repositório tinha apenas `.eslintrc.json` (formato legado). |
| **O que mudou** | Adicionado `eslint.config.mjs` em formato flat com migração mínima da intenção do `.eslintrc.json`: plugins `react`/`react-hooks`, regras existentes (`no-console`, `no-unused-vars`, `react/prop-types`, `react/react-in-jsx-scope`, hooks), `react` settings, `eslint-config-prettier`; `ecmaVersion` ajustado para `latest` para evitar falsos erros de parsing em sintaxe já usada no baseline; plugin `import` incluído para compatibilidade com usos legados de `import/first`. |
| **Escopo e segurança** | Mudança estritamente de tooling/lint. Nenhum código funcional, runtime, rota, provider/model/prompt, Serginho, Construtor runtime, Especialistas, ABNT, Auth/SaaS/Payments foi alterado. |
| **Arquivos alterados** | `eslint.config.mjs` (novo), `CHECKLIST.md` |
| **Validação executada** | Baseline pré-mudança: `npm run lint` (**FAIL**: ausência de `eslint.config.*`), `npm run build` (**PASS**), `npm test -- --runInBand` (**64 suites / 2442 testes PASS**). Pós-mudança F5-01: `npm run lint` (**EXECUTA / exit 0**, com dívida existente: **258 warnings, 0 errors**), `npm run build` (**PASS**), `npm test -- --runInBand` (**64 suites / 2442 testes PASS**). |
| **Dívida técnica controlada** | Permanecem warnings legados de lint no baseline (principalmente `no-unused-vars` e `no-console`) sem correção em massa neste PR, por decisão explícita de escopo mínimo em F5-01. |
| **Riscos/limites conhecidos** | O comando de lint foi restaurado para execução e detecção de problemas. A redução da dívida de warnings fica para fases futuras, sem impacto no runtime funcional. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-25 — docs(audit): auditoria de transição Fase 4 para decisão formal de Fase 5

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(audit): auditoria de transição Fase 4 para decisão formal de Fase 5` |
| **Identificação** | **Transição F4 → F5 (governança/auditoria documental)** |
| **O que foi auditado** | `CHECKLIST.md`, `docs/audits/fase-3-inicial-encerramento-hibrido-construtor-2026-05-24.md`, `docs/audits/fase4-demo-showcase-final-audit-2026-05-25.md`, `docs/audits/f4-08-final-visual-audit-demo-2026-05-25.md`, `docs/audits/P4-artifactRunner-audit.md`. |
| **Decisão formal** | **Existe Fase 5.** Nome recomendado: **Fase 5 — Confiabilidade de Banca e Prontidão Operacional (sem expansão funcional)**. |
| **Objetivo principal da F5** | Elevar a confiabilidade verificável do baseline para banca/incubadora, priorizando qualidade de validação (lint/testes), evidência operacional e hardening documental sem alterar runtime funcional. |
| **Urgente para banca/incubadora** | **F5-01:** restaurar lint executável no baseline (migração para `eslint.config.*` mantendo regras atuais); **F5-02:** habilitar execução de testes `*.test.jsx` no setup atual para cobrir renderização crítica já existente; **F5-03:** consolidar checklist operacional de demonstração/reprodutibilidade (build+test+rotas públicas). |
| **Melhoria futura (não bloqueante)** | **F5-04:** trilha de sandbox real/opt-in do runner (somente especificação e critérios de segurança, sem reativar execução); **F5-05:** estratégia de persistência não sensível para métricas de ciclo (se houver decisão de produto). |
| **Não deve ser feito agora** | Não reativar `executeArtifact`; não criar bypass do Serginho; não alterar providers/modelos/prompts; não mexer em Auth/SaaS/Payments/Especialistas/ABNT; não criar endpoint/dashboard/banco/analytics externo. |
| **Documento criado** | `docs/audits/fase-4-para-fase-5-auditoria-transicao-2026-05-25.md` |
| **Arquivos alterados** | `docs/audits/fase-4-para-fase-5-auditoria-transicao-2026-05-25.md` (novo), `CHECKLIST.md` |
| **Validação executada** | Baseline local e pós-mudança documental: `npm run build` (**PASS**), `npm test -- --runInBand` (**64 suites / 2442 testes PASS**); `npm run lint` com falha pré-existente de configuração (ESLint v10 sem `eslint.config.*`). |
| **Riscos/limites conhecidos** | PR exclusivamente documental; risco funcional zero. A principal lacuna operacional continua sendo lint indisponível e cobertura JSX fora do padrão atual do runner. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-25 — docs(audit): auditoria documental final robusta da Fase 4 demo/showcase

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(audit): auditoria documental final robusta da Fase 4 demo/showcase` |
| **Identificação** | **Fase 4 — Encerramento formal (auditoria consolidada F4-01 → F4-08)** |
| **O que mudou** | Criação de `docs/audits/fase4-demo-showcase-final-audit-2026-05-25.md` com auditoria documental premium e verificável da Fase 4: visão geral, lista F4-01→F4-08, objetivos atingidos, garantias arquiteturais preservadas, evidências operacionais, estado final da demo pública (`/demo`, `/demo-autoplay`, `/showcase`), UX/readability audit, anti-fake-AI/transparência, governança preservada, limites conhecidos e readiness para incubadora/banca/investidor. |
| **Segurança/escopo** | Alteração exclusivamente documental. Nenhum runtime, componente funcional, endpoint, dependência ou arquivo de código foi alterado. Escopo restrito a `docs/audits/` e `CHECKLIST.md`. Serginho, Construtor, Especialistas, ABNT e SaaS/Auth/Payments inalterados. |
| **Arquivos alterados** | `docs/audits/fase4-demo-showcase-final-audit-2026-05-25.md` (novo), `CHECKLIST.md` |
| **Validação executada** | Revalidação pós-auditoria: `npm run build` (**PASS**), `npm test -- --runInBand` (**64 suites / 2442 testes PASS**). |
| **Riscos/limites conhecidos** | Documento estático/documental. Risco zero funcional. |
| **Rollback** | `git revert <commit-sha>` |
| **Declaração de encerramento** | Fase 4 formalmente encerrada e documentada. Vitrine pública pronta para banca/incubadora/investidor. |

## 2026-05-25 — style(demo): F4-08 auditoria visual final da demo

| Item | Detalhe |
|------|---------|
| **Título do PR** | `style(demo): F4-08 auditoria visual final da demo` |
| **Identificação** | **Fase 4 — F4-08 (auditoria visual final da demo/showcase para banca/incubadora)** |
| **O que foi auditado** | Hero, CTA autoplay, notice badge, section titles, grid de cards, badges do header do card, título/descrição/parágrafos do card, rastreabilidade, hint, footer/actions, botões "Ver exemplo"/"Ver estrutura", listas, previews estáticos, footer da página — em mobile (320px, 375px, 480px) e desktop (720px, 1024px+). |
| **O que mudou** | Correção mínima em `src/pages/Demo.css`: adicionado `margin: 8px 0 0` ao `.demo-card__hint`. O reset global (`* { margin: 0; padding: 0; }` em `src/index.css`) zerava o margin padrão do `<p>`, fazendo o texto de disclaimer aparecer sem espaçamento acima — inconsistente com todos os demais parágrafos do card (`.demo-card__problem`, `.demo-card__stack`, `.demo-card__score`), que todos têm `margin: 8px 0 0` explícito. |
| **Documento de auditoria** | `docs/audits/f4-08-final-visual-audit-demo-2026-05-25.md` |
| **Segurança/escopo** | Alteração exclusivamente visual/CSS da demo/showcase estática. Nenhum runtime alterado. Sem novas dependências. Serginho, Construtor, Especialistas, Auth, SaaS, Payments, ABNT inalterados. |
| **Arquivos alterados** | `src/pages/Demo.css`, `docs/audits/f4-08-final-visual-audit-demo-2026-05-25.md`, `CHECKLIST.md` |
| **Validação executada** | `npm run build` (**PASS**), `npm test -- --runInBand` (**PASS**). |
| **Riscos/limites conhecidos** | Mudança é de apresentação pura. Risco zero funcional. |
| **Rollback** | `git revert <commit-sha>` |
| **Declaração de encerramento** | F4-08 concluído. `/demo` auditada visualmente. Correção mínima aplicada. Vitrine pronta para banca/incubadora. |

## 2026-05-25 — style(demo): F4-07 auditoria visual mobile da demo

| Item | Detalhe |
|------|---------|
| **Título do PR** | `style(demo): F4-07 auditoria visual mobile da demo` |
| **Identificação** | **Fase 4 — F4-07 (auditoria e correção visual mobile da demo/showcase)** |
| **O que mudou** | Correções visuais mobile em `src/pages/Demo.css`: (1) CTA autoplay — `min-height` corrigido de 42px para 44px (touch target mínimo) e `padding` horizontal aumentado; (2) Header dos cards — adicionado `flex-wrap: wrap` e `align-items: flex-start` para badges não overflowarem em telas estreitas; (3) Media query `max-width: 480px` adicionada com: hero padding reduzido (28/24px → 20/16px), CTA autoplay com `width: 100%` em mobile, `.demo-page__notice` com `word-break: break-word` e `overflow-wrap` para URLs longas, card padding reduzido (20px → 16px), botões de ação empilhados verticalmente com `min-height: 44px` e `width: 100%`, footer da página com padding reduzido e links em bloco para toque fácil. |
| **Segurança/escopo** | Alteração exclusivamente visual/CSS da demo/showcase estática. Nenhum runtime alterado. Sem novas dependências. Sem analytics externo. Serginho, Construtor, Especialistas, Auth, SaaS, Payments, ABNT inalterados. |
| **Arquivos alterados** | `src/pages/Demo.css`, `CHECKLIST.md` |
| **Validação executada** | `npm run build` (**PASS**), `npm test -- --runInBand` (**PASS**). |
| **Riscos/limites conhecidos** | Mudanças são de apresentação pura; CSS mobile testado em viewports 320px–768px. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-25 — style(demo): F4-06 refinamento premium discreto da vitrine

| Item | Detalhe |
|------|---------|
| **Título do PR** | `style(demo): F4-06 refinamento premium discreto da vitrine` |
| **Identificação** | **Fase 4 — F4-06 (microdetalhes visuais premium da demo/showcase)** |
| **O que mudou** | Refinamentos visuais discretos em `src/pages/Demo.css`: (1) Hero — padding aumentado, border mais visível, `box-shadow` base adicionada; (2) Seção — espaçamento aumentado, títulos com `border-left` accent de 3px para hierarquia visual; (3) Cards — `padding` de 16 → 20px, `border-radius` 14 → 16px, `box-shadow` base sutil, hover com lift de 3px e sombra mais profunda; (4) Header do card — separador `border-bottom` para delimitar badges do conteúdo; (5) Badges (`type`, `status`, `structure-badge`) — font-size unificado em 0.72rem, `padding` consistente 4px 10px, borda semi-transparente nos três; (6) Corpo do card — `font-weight: 700` no título, `line-height` levemente aumentada, labels (`strong`) em cor mais clara que o valor para hierarquia; (7) Footer do card — separador `border-top`, `margin-top` aumentado; (8) Botões de ação — gradiente sutil, `border-radius` 10px, `box-shadow` de foco no hover; (9) Preview cards — `padding` 14 → 18px, `border-radius` 12 → 14px, `box-shadow` base; (10) Footer da página — `padding` e `border-radius` levemente aumentados, cor do texto ajustada para hierarquia. |
| **Segurança/escopo** | Alteração exclusivamente visual/CSS da demo/showcase estática. Nenhum runtime alterado. Sem novas dependências. Sem analytics externo. Serginho, Construtor, Especialistas, ABNT e SaaS/Auth/Payments não foram tocados. |
| **Arquivos alterados** | `src/pages/Demo.css`, `CHECKLIST.md` |
| **Validação executada** | `npm run build` (**PASS**), `npm test -- --runInBand` (**PASS**). |
| **Riscos/limites conhecidos** | Mudanças são de apresentação pura; o único risco é divergência visual em dispositivos muito antigos sem suporte a `radial-gradient` (já presente antes). Sem risco funcional. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-24 — feat(demo): F4-05 indicador visual mínimo de estrutura validada

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(demo): F4-05 indicador visual mínimo de estrutura validada` |
| **Identificação** | **Fase 4 — F4-05 (validação estrutural pública mínima da demo/showcase)** |
| **O que mudou** | Inclusão de indicador visual discreto "Estrutura validada" nos cards da vitrine (`/demo`) com base em `traceability.structuralStatus` já existente; agrupamento visual mínimo de status no header do card para manter leitura limpa; teste estático da demo atualizado para exigir a presença do novo indicador. |
| **Segurança/escopo** | Alteração apenas de apresentação estática da demo/showcase, sem runtime novo, sem cálculo em tempo real, sem analytics externo, sem endpoint/banco/persistência. Serginho, Construtor runtime, Especialistas, ABNT e SaaS/Auth/Payments não foram alterados. |
| **Arquivos alterados** | `src/pages/Demo.jsx`, `src/pages/Demo.css`, `src/__tests__/demo-showcase-routing.test.js`, `CHECKLIST.md` |
| **Validação executada** | Baseline pré-mudança: `npm run lint` (falha pré-existente de configuração ESLint v10 sem `eslint.config.*`), `npm run build` (**PASS**), `npm test -- --runInBand` (**PASS**). Pós-mudança: teste direcionado `npm test -- --runInBand src/__tests__/demo-showcase-routing.test.js` (**PASS**); validação final `npm run build` (**PASS**) e `npm test -- --runInBand` (**PASS**). |
| **Riscos/limites conhecidos** | O selo é intencionalmente simples e documental (baseado em fixture local já rastreável), sem representar validação dinâmica em tempo de navegação. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-24 — docs(demo): F4-04 rastreabilidade mínima dos artefatos demonstrativos

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(demo): F4-04 rastreabilidade mínima dos artefatos demonstrativos` |
| **Identificação** | **Fase 4 — F4-04 (refinamento benchmark/demo com saídas rastreáveis)** |
| **O que mudou** | Auditoria da fonte demo confirmada em `src/data/demoArtifacts.js`; inclusão de metadados `traceability` por artefato (`artifactType`, `structuralStatus`, `origin`, `isDemonstrativeExample`, `pipelineReference`); ajustes mínimos em `src/pages/Demo.jsx` para exibir rastreabilidade e reforçar que é fixture estática; documentação `docs/DEMO.md` atualizada com seção "Pipeline rastreável da demo (F4-04)"; teste estático `src/__tests__/demo-showcase-routing.test.js` atualizado para exigir os novos campos. |
| **Segurança/escopo** | Sem alteração no runtime funcional do Construtor/Híbrido, sem chamadas externas, sem endpoint novo, sem banco/persistência remota e sem promessas de IA em tempo real para dados estáticos. Serginho, Especialistas, ABNT e SaaS/Auth/Payments não foram alterados. |
| **Arquivos alterados** | `src/data/demoArtifacts.js`, `src/pages/Demo.jsx`, `docs/DEMO.md`, `src/__tests__/demo-showcase-routing.test.js`, `CHECKLIST.md` |
| **Validação executada** | Baseline pré-mudança: `npm run lint` (falha pré-existente: ESLint v10 sem `eslint.config.*`), `npm run build` (**PASS**), `npm test -- --runInBand` (**64 suites / 2442 testes PASS**). Pós-mudança: teste direcionado `npm test -- --runInBand src/__tests__/demo-showcase-routing.test.js src/__tests__/DemoAutoplay.test.js` (**PASS**); validação final `npm test -- --runInBand` (**PASS**). |
| **Riscos/limites conhecidos** | Metadados de demo são estáticos por design e representam rastreabilidade documental/fixture local, não telemetry nem execução real do pipeline em tempo de navegação da vitrine pública. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-24 — feat(construtor): F4-03 métricas mínimas do ciclo de revisão humana

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): F4-03 métricas mínimas do ciclo de revisão humana` |
| **Identificação** | **Fase 4 — F4-03 (métricas mínimas do ciclo de revisão)** |
| **O que mudou** | Adicionado utilitário `src/lib/construtor/reviewCycleMetrics.js` com `buildReviewCycleMetrics()` que computa: `revisionCount`, `humanDecisionCount`, `finalStatus` (approved/rejected/pending), `cycleElapsedMs` e `timestamp`. `HybridAgentSimple.jsx` rastreia `cycleStartedAt` (definido no primeiro evento do ciclo via `addReviewEvent`) e deriva `reviewCycleMetrics` via `useMemo`, passando-as ao `ArtifactPreviewPanel`. O painel exibe bloco "📊 Métricas do ciclo" na seção de histórico de revisão quando o histórico está ativo. CSS mínimo adicionado em `HybridAgent.css`. |
| **Segurança/escopo** | Sem chamadas externas, sem banco/persistência remota, sem dashboard, sem conteúdo sensível do artefato nas métricas — apenas contadores, timestamps e status. Execução automática permanece desativada. Serginho continua orquestrador soberano. |
| **Reutilização F3-03** | `reviewHistory` (array de eventos existente desde F3-03) é a fonte de dados das métricas; `cycleStartedAt` complementa o ciclo com rastreio de tempo sem persistência adicional. |
| **Arquivos alterados** | `src/lib/construtor/reviewCycleMetrics.js` (novo), `src/lib/construtor/__tests__/reviewCycleMetrics.test.js` (novo), `src/pages/HybridAgentSimple.jsx`, `src/components/construtor/ArtifactPreviewPanel.jsx`, `src/styles/HybridAgent.css`, `CHECKLIST.md` |
| **Validação executada** | 1. Testes direcionados: `npm test -- --testPathPatterns=reviewCycleMetrics --no-coverage` (**9/9 PASS**). 2. Suíte completa: `npm test -- --no-coverage --runInBand` (**64 suites / 2442 testes PASS**). |
| **Riscos/limites conhecidos** | Métricas são voláteis (memória React, não persistidas): `cycleStartedAt` é zerado ao recarregar a página ou encerrar o ciclo, portanto `cycleElapsedMs` não sobrevive a recarregamentos. `cycleElapsedMs` é aproximado (baseado em `Date.now()`, sem precisão de evento). Sem impacto funcional no pipeline de artefatos. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-24 — feat(hybrid): adicionar observabilidade mínima local do pipeline de artefatos (F4-02)

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(hybrid): adicionar observabilidade mínima local do pipeline de artefatos (F4-02)` |
| **Identificação** | **Fase 4 — F4-02 (observabilidade mínima do pipeline de artefatos)** |
| **O que mudou** | Adicionado utilitário local `src/lib/construtor/artifactMetrics.js` para métricas estruturadas mínimas; `packageArtifact()` agora anexa `metrics.packaging` (duração, quantidade de arquivos, tamanho aproximado do ZIP, timestamp); `generatePreview()` agora anexa `summary.pipelineMetrics` com `packaging` + `preview` e preserva status de execução desativada via `reason` quando disponível. |
| **Segurança/escopo** | Sem chamadas externas, sem dashboard, sem banco/persistência remota e sem conteúdo sensível completo do artefato nas métricas. Execução automática permanece desativada (`execution-disabled-by-security-policy`). |
| **Arquivos alterados** | `src/lib/construtor/artifactMetrics.js`, `src/lib/construtor/artifactPackager.js`, `src/lib/construtor/artifactPreview.js`, `src/lib/construtor/__tests__/artifactMetrics.test.js`, `src/lib/construtor/__tests__/artifactPreview.test.js`, `CHECKLIST.md` |
| **Validação executada** | 1. Baseline: `npm run lint` (falha pré-existente de configuração ESLint v10 sem `eslint.config.*`), `npm run build` (**PASS**), `npm test -- --runInBand` (**PASS**). 2. Testes direcionados pós-mudança: `NODE_OPTIONS='--experimental-vm-modules' npx jest src/lib/construtor/__tests__/artifactMetrics.test.js src/lib/construtor/__tests__/artifactPreview.test.js src/lib/construtor/__tests__/artifactPackager.test.js --runInBand` (**PASS**). 3. Validação final pós-mudança: `npm run build` (**PASS**) e `npm test -- --runInBand` (**PASS**). |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-24 — test(hybrid): adicionar F4-01 E2E HTTP real mínimo do pipeline de artefatos

| Item | Detalhe |
|------|---------|
| **Título do PR** | `test(hybrid): adicionar F4-01 E2E HTTP real mínimo do pipeline de artefatos` |
| **Identificação** | **Fase 4 — F4-01 (teste E2E HTTP real do pipeline)** |
| **O que mudou** | Novo teste `api/__tests__/artifact-pipeline-http-e2e.test.js` com servidor HTTP local real para validar o fluxo `POST /api/artifact` → `POST /api/artifact-preview` → `PATCH /api/artifact-preview`; novo fixture determinístico `api/__fixtures__/artifact-pipeline.fixture.js`. |
| **Garantias de segurança/escopo** | O teste bloqueia qualquer `fetch` externo (aceita apenas `localhost/127.0.0.1`), valida que `executeArtifact` não é chamado e confirma `execution.reason = execution-disabled-by-security-policy` no preview. Nenhum runtime funcional foi alterado. |
| **Arquivos alterados** | `api/__tests__/artifact-pipeline-http-e2e.test.js`, `api/__fixtures__/artifact-pipeline.fixture.js`, `CHECKLIST.md` |
| **Validação executada** | 1. Baseline pré-mudança: `npm test` (**PASS**). 2. Teste direcionado: `NODE_OPTIONS='--experimental-vm-modules' npx jest api/__tests__/artifact-pipeline-http-e2e.test.js --runInBand` (**PASS**). 3. Validação final: `npm test` (**PASS**). |
| **Limites conhecidos** | Escopo propositalmente mínimo: cobre pipeline HTTP local e contrato principal de resposta; não realiza chamadas reais de provider/IA e não altera a contenção de execução automática. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-24 — docs(audit): encerrar formalmente a Fase 3 inicial do Híbrido/Construtor

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(audit): encerrar formalmente a Fase 3 inicial do Híbrido/Construtor` |
| **Status** | **Fase 3 inicial concluída** |
| **HEAD auditado** | `56af64941238897b85a495194a5931666aab334a` |
| **PRs consolidados** | **#464**, **#466**, **#467**, **#468** |
| **Documento criado** | `docs/audits/fase-3-inicial-encerramento-hibrido-construtor-2026-05-24.md` |
| **Riscos residuais deferidos** | ESLint v10 sem `eslint.config.*`; teste renderizado JSX não viável no setup atual de Jest (`*.test.jsx` fora do padrão executado); sandbox real do runner segue como trilha futura não implementada. |
| **Próxima fase recomendada** | **Fase 4 — Qualidade avançada/Operacionalização** |
| **Confirmação de escopo** | Nenhum runtime foi alterado neste PR; alteração exclusivamente documental/governança. |
| **Rollback** | `git revert <commit-sha>` |

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
| **Observação**          | A restauração histórica completa do `CHECKLIST.md` (entradas anteriores ao baseline) será feita em PR separado de governança. Providers/managers órfãos (`OptimizedAPIManager.js`, `ExternalAPIManager.js`, `src/api/providers/*`) serão tratados em PR posterior da rodada corretiva da Auditoria Mestre Fase 1, antes do início da Fase 2. |


## 2026-05-22 — chore(ai): remove orphan frontend provider clients

| Item                                 | Detalhe |
|--------------------------------------|---------|
| **Título do PR**                     | `chore(ai): remove orphan frontend provider clients` |
| **Achado corrigido**                 | **F1-01** — código frontend órfão com providers diretos (Groq/OpenAI/Anthropic) em `src/api/`, removido na rodada corretiva da Auditoria Mestre Fase 1 (antes da Fase 2). |
| **Arquivos removidos**               | `src/api/providers/groq.js`, `src/api/providers/llama.js`, `src/api/ExternalAPIManager.js`, `src/api/OptimizedAPIManager.js`, `src/api/providers/__tests__/groq.test.js`, `src/api/providers/__tests__/llama.test.js` |
| **Contraprova de orfandade**         | Busca global por imports/requires/reexports e referências por caminho/símbolo (`GroqProvider`, `LlamaProvider`, `ExternalAPIManager`, `OptimizedAPIManager`) não encontrou consumidores em fluxo runtime ativo (`src/main.jsx`, `src/App.jsx`, páginas, componentes, hooks e `src/api/`). Consumidores identificados eram apenas os próprios testes removidos e documentação histórica. |
| **Validação executada**              | 1. Baseline pré-mudança: `npm test` (**59 suites / 2379 testes**) e `npm run build` OK. 2. Pós-remoção: `npm test` (**57 suites / 2353 testes**) e `npm run build` OK. 3. Busca final em `src/` por `api.groq.com`, `api.openai.com`, `api.anthropic.com`, `ExternalAPIManager`, `OptimizedAPIManager`, `GroqProvider`, `LlamaProvider`: **0 ocorrências**. |
| **Impacto em testes**                | Redução de **2 suites** e **26 testes**, compatível com a remoção exclusiva dos testes dedicados a código órfão apagado. |
| **Rollback**                         | `git revert <commit-sha>` para restaurar atomicamente os seis arquivos removidos e esta entrada no checklist. |
| **Observação**                       | O teste preventivo amplo para impedir reintrodução de provider direto em `src/` será tratado no **próximo PR** da rodada corretiva da Fase 1. Backend soberano do Serginho em `api/` não foi alterado. |

## 2026-05-22 — test(ai): enforce frontend gateway sovereignty

| Item | Detalhe |
|------|---------|
| **Título do PR** | `test(ai): enforce frontend gateway sovereignty` |
| **Objetivo** | Impedir reintrodução de bypass direto a providers de IA no frontend, preservando o Serginho como gateway soberano de chamadas reais de IA. |
| **Relação com F1-01 / PR #452** | Complementa o achado **F1-01** já corrigido no PR #452 (remoção de providers/managers órfãos no frontend), adicionando proteção automatizada de regressão em `src/`. |
| **Arquivo de teste alterado** | `api/__tests__/a4-gateway-sovereignty.test.js` |
| **Padrões protegidos** | Endpoints externos diretos (`api.groq.com`, `api.openai.com`, `api.anthropic.com`, `generativelanguage.googleapis.com`) e imports/requires diretos de SDKs (`openai`, `@google/generative-ai`, `@anthropic-ai/sdk`, `groq-sdk`) em código frontend `src/` (`.js`, `.jsx`, `.mjs`, `.ts`, `.tsx`). |
| **Validações executadas** | 1. Contraprova prévia em `src/` para endpoints/SDKs proibidos: **0 ocorrências**. 2. Teste direcionado: `NODE_OPTIONS='--experimental-vm-modules' npx jest api/__tests__/a4-gateway-sovereignty.test.js` (**PASS**). 3. `npm test` (**PASS**). 4. `npm run build` (**PASS**). |
| **Rollback** | `git revert <commit-sha>` para desfazer atomicamente o ajuste do teste e este registro append-only no checklist. |
| **Observação de fase** | Este PR conclui a proteção automatizada associada à remoção dos providers/managers frontend órfãos (PR #452), ainda dentro da rodada corretiva da Auditoria Mestre Fase 1. |

## 2026-05-22 — fix(ui): disable unavailable voice and vision actions

| Item | Detalhe |
|------|---------|
| **Título do PR** | `fix(ui): disable unavailable voice and vision actions` |
| **Achados corrigidos** | **F1-06** e **F1-15** — ações de voz/transcrição e imagem/visão expostas em interfaces ativas foram removidas temporariamente da UI. |
| **Interfaces corrigidas** | `src/pages/HybridAgentSimple.jsx` (remoção temporária de voz e imagem), `src/pages/SpecialistChat.jsx` (remoção temporária de voz). `src/pages/Serginho.jsx` foi validada e permanece com controles multimodais desativados. |
| **Confirmação de escopo** | Nenhuma transcrição real e nenhuma visão real foram implementadas neste PR. Nenhuma alteração foi feita no core do Construtor, lógica dos Especialistas, orquestrador ou providers/backend. |
| **Validação executada** | 1. Baseline pré-mudança: `npm test` (**PASS**) e `npm run build` (**PASS**). 2. Pós-mudança: `npm test` (**PASS**) e `npm run build` (**PASS**). 3. Busca final nas páginas corrigidas (`HybridAgentSimple.jsx` e `SpecialistChat.jsx`) por `/api/transcribe` e `/api/vision`: **0 referências acionáveis**. |
| **Rollback** | `git revert <commit-sha>` para desfazer atomicamente as mudanças em `HybridAgentSimple.jsx`, `SpecialistChat.jsx`, testes e este registro append-only. |
| **Observação** | O endpoint `/api/transcribe` será tratado no próximo PR da rodada corretiva da Fase 1; a documentação pública será alinhada em PR posterior. |

## 2026-05-22 — fix(api): return controlled unavailable response for transcription

| Item | Detalhe |
|------|---------|
| **Título do PR** | `fix(api): return controlled unavailable response for transcription` |
| **Achado corrigido** | **F1-06** — endpoint de transcrição não realizava transcrição real e continha referência legada a `gemini-2.0-flash`. |
| **Arquivo runtime alterado** | `api/transcribe.js` |
| **Testes criados/ajustados** | `api/__tests__/transcribe-unavailable.test.js` (novo), `api/__tests__/integration.test.js` (ajustes estritamente relacionados ao endpoint de transcrição) |
| **Confirmação de implementação** | Nenhuma transcrição real foi implementada neste PR; a rota `/api/transcribe` retorna indisponibilidade controlada com status `501` e código estável `TRANSCRIPTION_NOT_AVAILABLE`. |
| **Confirmação de soberania backend** | Nenhum provider foi adicionado/alterado e nenhum backend soberano foi alterado (`api/lib/serginho-orchestrator.js` e configuração de providers permanecem inalterados). |
| **Validação executada** | 1. Baseline pré-mudança: `npm test` (**PASS**) e `npm run build` (**PASS**). 2. Testes direcionados pós-mudança: `NODE_OPTIONS='--experimental-vm-modules' npx jest api/__tests__/transcribe-unavailable.test.js api/__tests__/integration.test.js --runInBand` (**PASS**). 3. Validação final pós-mudança: `npm test` (**PASS**) e `npm run build` (**PASS**). |
| **Rollback** | `git revert <commit-sha>` |
| **Observação** | A implementação real de voz/transcrição ficará para evolução futura separada, preservando o Serginho como autoridade arquitetural para chamadas reais de IA. |

## 2026-05-22 — chore(audit): close Phase 1 provider and documentation alignment

| Item | Detalhe |
|------|---------|
| **Título do PR** | `chore(audit): close Phase 1 provider and documentation alignment` |
| **Contexto** | PR #6 e FINAL da rodada corretiva da Auditoria Mestre Fase 1. Encerra os achados pendentes e registra o baseline auditável para início da Fase 2. |
| **Achados tratados** | **F1-07** (`GEMINI_API_KEY` ausente do validate-env.js), **F1-05** (dependências SDK órfãs `openai` e `@google/generative-ai` removidas após contraprova), **F1-03** (documentação legada com modelo `gemini-2.0-flash-exp`/`gemini-2.0-flash` atualizada), **F1-04 documental** (auditoria técnica anotada para refletir que arquivos legados do Serginho foram removidos e único orquestrador ativo é `api/lib/serginho-orchestrator.js`), **F1-06/F1-15 documental** (voz/transcrição e visão/multimodal marcados como temporariamente indisponíveis em `docs/api.md`). |
| **Arquivos alterados** | `api/lib/validate-env.js`, `package.json`, `package-lock.json`, `docs/api.md`, `docs/API.md`, `docs/EXTERNAL_APIS_SETUP.md`, `docs/auditoria_tecnica_rkmmax_hibrido.md`, `CHECKLIST.md` |
| **Contraprova de dependências (F1-05)** | Busca global por imports/requires de SDK (`from 'openai'`, `from '@google/generative-ai'`, `require('openai')`, `require('@google/generative-ai')`) em todo o repositório (`src/`, `api/`, scripts, testes, benchmark): **0 ocorrências de import real de SDK**. Referências a `openai` são exclusivamente: (a) nome de modelo na string `'openai/gpt-oss-120b'` (Groq API), (b) URL de endpoint Groq (`api.groq.com/openai/v1/`), (c) padrões de detecção em testes de soberania. O provider Groq usa `fetch` direto; o provider Gemini usa `fetch` direto. Nenhum SDK de terceiro é necessário. Dependências removidas com segurança. |
| **Validações executadas** | 1. `npm test` (**PASS**). 2. `npm run build` (**PASS**). 3. Confirmado que `api/lib/serginho-orchestrator.js`, `api/lib/providers-config.js`, `api/lib/model-registry.js`, `api/transcribe.js`, Construtor, Especialistas, ABNT, Auth e pagamentos não foram alterados. 4. Confirmado que nenhuma referência runtime a `gemini-2.0-flash` foi reintroduzida. |
| **Rollback** | `git revert <commit-sha>` para desfazer atomicamente todas as alterações deste PR. |
| **Consolidação da rodada corretiva** | PRs concluídos: **#451** (`fix(security): remove frontend secret initialization risk`), **#452** (`chore(ai): remove orphan frontend provider clients`), **#453** (`test(ai): enforce frontend gateway sovereignty`), **#454** (`fix(ui): remove unavailable voice and vision controls`), **#455** (`fix(api): return controlled unavailable response for transcription`), **#456** (este PR). |
| **Declaração de encerramento da Fase 1** | Após o merge deste PR e checks verdes, a Auditoria Mestre **Fase 1** fica tecnicamente encerrada. Os achados prioritários F1-01, F1-03, F1-04, F1-05, F1-06, F1-07 e F1-15 foram tratados. A Fase 2 pode ser iniciada a partir deste baseline. |
| **Observação de configuração externa** | Ajustes externos de configuração GitHub (description do repositório, branch protection) não geram alteração de código neste PR e não fazem parte do escopo desta rodada corretiva. |

## 2026-05-22 — fix(security): contain artifact preview unauthenticated execution risk

| Item | Detalhe |
|------|---------|
| **Título do PR** | `fix(security): contain artifact preview unauthenticated execution risk` |
| **Identificação** | Fase 2 — Contenção P0 (PR 2.1-A) |
| **Achados tratados** | **F2-01** (endpoints `/api/artifact` e `/api/artifact-preview` sem autenticação e com CORS amplo) e **contenção imediata de F2-03** (execução automática de JavaScript no `POST /api/artifact-preview` via `executeArtifact()` sem sandbox real). |
| **Endpoints protegidos** | `POST /api/artifact` e `POST/PATCH /api/artifact-preview` agora exigem JWT Supabase via `verifyAuth` (mesmo padrão de `api/ai.js`) e usam CORS restrito via `applyCorsRestricted` (substitui `Access-Control-Allow-Origin: *`). Preflight `OPTIONS` continua funcional via helper compartilhado. |
| **Execução automática neutralizada** | A invocação automática de `executeArtifact()` no `POST /api/artifact-preview` foi removida nesta contenção. O preview agora preserva `packageArtifact()`, `validateArtifact()` e `generatePreview()`, e injeta um `executionResult` explícito com `reason: 'execution-disabled-by-security-policy'` para manter o contrato de resposta sem fingir execução. `applyDecision()` no `PATCH` e a entrega de `zipBase64` na aprovação foram preservadas. O módulo `src/lib/construtor/artifactRunner.js` não foi alterado nem removido. |
| **Arquivos alterados** | `api/artifact.js`, `api/artifact-preview.js`, `src/pages/HybridAgentSimple.jsx` (envio do header `Authorization: Bearer <token>` nas chamadas POST e PATCH de artifact-preview), `api/__tests__/artifact-preview.test.js` (mock de `verifyAuth` + asserção de que `executeArtifact` NÃO é chamado), `api/__tests__/artifact-auth.test.js` (novo — cobertura de auth para ambos os endpoints), `CHECKLIST.md`. |
| **Validação executada** | 1. `NODE_OPTIONS='--experimental-vm-modules' npx jest api/__tests__/artifact-preview.test.js api/__tests__/artifact-auth.test.js --runInBand` → **24 tests passed**. 2. `npm test` → **60 suites / 2374 tests passed**. 3. `npm run build` → **PASS**. 4. Confirmado que `api/lib/serginho-orchestrator.js`, `api/ai.js`, providers, model registry, Especialistas, ABNT, Auth/SaaS/Pagamentos, dashboards e `src/lib/construtor/artifactRunner.js` não foram alterados. |
| **Rollback** | `git revert <commit-sha>` — reverte atomicamente este PR. |
| **Observação de fase** | Sanitização de nomes/entries contra path traversal (**F2-02**) será tratada no próximo PR corretivo da Fase 2. A reativação segura da execução de artefatos depende de sandbox real e gatilho explícito opt-in, que serão tratados em PR futuro separado. |

## 2026-05-23 — fix(security): reject unsafe artifact paths before packaging and extraction

| Item | Detalhe |
|------|---------|
| **Título do PR** | `fix(security): reject unsafe artifact paths before packaging and extraction` |
| **Identificação** | Fase 2 — Correção F2-02 |
| **Achado corrigido** | **F2-02** — path traversal e caminhos inseguros em nomes multi-file e ZIP entries. Nomes extraídos de artefatos multi-file (`--- FILE: nome ---`) e entries de ZIP não possuíam validação estrutural, permitindo potencial escrita fora do diretório alvo. |
| **Arquivos alterados** | `src/lib/construtor/artifactNormalizer.js` (nova função `validateArtifactFileName`, chamada em `parseMultiFileContent`), `src/lib/construtor/artifactRunner.js` (nova função `validateZipEntries` exportada, chamada em `extractToTempDir` com captura de erro controlada), `src/lib/construtor/__tests__/artifactPackager.test.js` (novos testes de Barreira 1), `src/lib/construtor/__tests__/artifactRunner.test.js` (novos testes de Barreira 2), `CHECKLIST.md`. Nota: reexport de `validateArtifactFileName` em `artifactPackager.js` foi removido (nenhum consumidor runtime; testes importam diretamente de `artifactNormalizer.js`). |
| **Barreiras implementadas** | **Barreira 1** (`artifactNormalizer.js`): `validateArtifactFileName()` rejeita com erro claro: nomes vazios, byte nulo (`\0`), caminhos absolutos Unix (`/tmp/evil.js`), caminho absoluto Windows com backslash simples (`\tmp\evil.js`), drive letters Windows (`C:\`, `C:/`), caminhos UNC (`\\server\share`, `//server/share`), segmentos `..` com `/` ou `\` ou mistos (`src/..\`, `src\../`). **Barreira 2** (`artifactRunner.js`): `validateZipEntries()` aplica as mesmas verificações em toda entry antes de qualquer `extractAllTo`; também verifica via `path.resolve` + `path.sep` que o caminho resolvido permanece dentro do `destDir` (sem falso positivo de prefixo semelhante); em caso de entry insegura, o tmpDir criado é removido e `executeArtifact` retorna `{ executed: false, reason: 'unsafe-zip-entry' }` sem extrair nada. |
| **Caminhos inseguros rejeitados** | `../evil.js`, `src/../../evil.js`, `..\evil.js`, `src\..\evil.js`, `src/..\evil.js`, `src\../evil.js`, `/tmp/evil.js`, `\tmp\evil.js`, `C:\temp\evil.js`, `C:/temp/evil.js`, `\\server\share\evil.js`, `//server/share/evil.js`, caminhos com byte nulo. |
| **Caminhos legítimos com subpastas aceitos** | `index.html`, `script.js`, `src/App.jsx`, `src/components/Button.jsx`, `public/index.html`. |
| **Testes executados** | `NODE_OPTIONS='--experimental-vm-modules' npx jest src/lib/construtor/__tests__/artifactPackager.test.js src/lib/construtor/__tests__/artifactRunner.test.js --runInBand` → **160 tests passed** (138 anteriores + 22 novos de sentinela). `npm test` → **60 suites / 2420 tests passed**. `npm run build` → **PASS**. |
| **Necessidade de alterar artifactPackager.js** | Reexport de `validateArtifactFileName` **removido** — não havia consumidor runtime. Testes importam diretamente de `artifactNormalizer.js`. |
| **Execução automática** | Confirmado: `api/artifact-preview.js` não invoca `executeArtifact()` automaticamente. Contenção do PR #457 intacta. |
| **Runtimes fora do pipeline de artefatos** | Nenhum alterado. `api/lib/serginho-orchestrator.js`, `api/ai.js`, providers, model registry, Especialistas, ABNT, Auth, SaaS, pagamentos, dashboards, voz e visão não foram modificados. |
| **Rollback** | `git revert <commit-sha>` — reverte atomicamente este PR. |
| **Observação** | Sandbox real do runner (`executeArtifact` com isolamento de processo adequado, VM ou container) continua fora deste PR e será tratado separadamente, antes de qualquer reativação de execução opt-in. A função `validateZipEntries` é exportada para permitir testes diretos sem depender de ZIPs reais com entries maliciosas (que adm-zip normaliza no `addFile`). |

## 2026-05-23 — fix(hybrid): remove unsupported Manual/Otimizado credit claims (F2-04)

| Item | Detalhe |
|------|---------|
| **Título do PR** | `fix(hybrid): remove unsupported Manual/Otimizado credit claims (F2-04)` |
| **Identificação** | Fase 2 — correção F2-04 |
| **Problema corrigido** | A interface do Construtor exibia modos `Manual`/`Otimizado` com promessa de créditos diferentes (`1` vs `0.5`) sem implementação real de comportamento ou cobrança no backend. |
| **Arquivos alterados** | `src/pages/HybridAgentSimple.jsx`, `src/__tests__/multimodal-controls-disabled.test.js`, `CHECKLIST.md` |
| **Contraprova obrigatória** | Confirmado por leitura que `mode` era apenas UI/local no frontend: `HybridAgentSimple.jsx` enviava `mode: mode.toUpperCase()`, mas `api/ai.js` não lê/consome `mode` no payload (desestrutura apenas `type`, `messages`, `agentType`, `specialistId`, `forceProvider`) e `api/_utils/guardAndBill.js` não possui lógica de cobrança por `mode`. |
| **Segurança Fase 2 preservada** | Confirmado por leitura que `api/artifact.js` e `api/artifact-preview.js` seguem com `verifyAuth` + `applyCorsRestricted`; `POST /api/artifact-preview` continua sem `executeArtifact()` automático; barreiras de path traversal (`validateArtifactFileName` e `validateZipEntries`) permanecem intactas. |
| **Validações executadas** | 1. Baseline pré-mudança: `npm test` (**60 suites / 2420 testes PASS**) e `npm run build` (**PASS**). 2. Pós-mudança: testes direcionados de UI e segurança/auth/preview (`src/__tests__/multimodal-controls-disabled.test.js`, `api/__tests__/artifact-preview.test.js`, `api/__tests__/artifact-auth.test.js`) em execução isolada (**PASS**). 3. Validação final: `npm test` (**PASS**) e `npm run build` (**PASS**). |
| **Rollback** | `git revert <commit-sha>` |
| **Observação** | Implementação real de modos com diferenciação comportamental e/ou cobrança (se desejada) ficará para PR futuro separado, com regra formal de produto, billing e backend. |

## 2026-05-23 — docs(audit): encerrar formalmente a Fase 2 do Híbrido/Construtor

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(audit): encerrar formalmente a Fase 2 do Híbrido/Construtor` |
| **Identificação** | PR FINAL de encerramento documental da Auditoria Mestre Fase 2 (Híbrido / Construtor / Pipeline de Artefatos). |
| **HEAD auditado** | `aa7d0ec2e113f22fe8a4f70ea4617dc375e3dd69` |
| **PRs corretivos consolidados** | **#457**, **#458** e **#459**. |
| **Decisão da contraprova final** | `FASE 2 APROVADA PARA PR FINAL DE ENCERRAMENTO DOCUMENTAL` |
| **Arquivo documental criado** | `docs/audits/fase-2-encerramento-hibrido-construtor-2026-05-23.md` |
| **Confirmação de escopo** | Nenhum runtime foi alterado neste PR; alteração exclusivamente documental/governança. |
| **Riscos residuais deferidos** | **F2-06**, **F2-07**, **F2-09** e sandbox/execução opt-in futura em trilha separada e rastreável. |
| **Status explícito** | **Fase 2 concluída**. |
| **Próxima fase recomendada** | **Fase 3 de qualidade/estabilização**. |
| **Validação executada** | `npm test` e `npm run build`. |
| **Rollback** | `git revert <commit-sha>` |
| **Declaração de encerramento técnico** | Após merge deste PR e checks verdes, a Auditoria Mestre Fase 2 fica formalmente encerrada no baseline auditado. |

## 2026-05-24 — docs(governance): abrir Fase 3 do Híbrido/Construtor (qualidade/estabilização)

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(governance): abrir Fase 3 do Híbrido/Construtor (qualidade/estabilização)` |
| **Escopo do PR** | Documental mínimo, sem alterações funcionais. |
| **Fase aberta** | **Fase 3 — Qualidade/Estabilização** |
| **Prioridade 1** | **F3-01:** teste E2E mínimo do pipeline do Construtor |
| **Prioridade 2** | **F3-02:** UX/validação de aprovação com artefato/ZIP explícito |
| **Prioridade 3** | **F3-03:** persistência local/mínima do ciclo de revisão |
| **Prioridade 4** | **F3-04:** trilha futura de sandbox real do runner, sem reativar execução agora |
| **Critério de sucesso da fase** | Prioridades F3-01 a F3-04 registradas, execução por PRs pequenos e reversíveis, sem violar a arquitetura fixa (Serginho soberano, sem bypass). |
| **Validação executada** | `npm test` e `npm run build` (baseline desta abertura). |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-24 — test(construtor): adicionar F3-01 E2E mínimo do pipeline

| Item | Detalhe |
|------|---------|
| **Título do PR** | `test(construtor): adicionar F3-01 E2E mínimo do pipeline` |
| **Identificação** | Fase 3 — Prioridade **F3-01** (qualidade/estabilização do Híbrido/Construtor). |
| **O que mudou** | Extensão cirúrgica de `src/lib/construtor/__tests__/artifactPreview.test.js` com 1 teste E2E mínimo/determinístico cobrindo `packageArtifact()` → `validateArtifact()` → `generatePreview()`, incluindo verificação de manifest/checksum, validação e preview/filesSummary. |
| **Sem dependência externa de IA** | O teste roda só com libs locais do Construtor; adicionada asserção explícita de que `global.fetch` não é chamado durante o fluxo. |
| **Execução automática preservada desativada** | Confirmado por testes da API (`api/__tests__/artifact-preview.test.js`) que `executeArtifact()` continua **não** invocado automaticamente no preview. Nenhuma alteração em runtime reativou execução. |
| **Arquivos alterados** | `src/lib/construtor/__tests__/artifactPreview.test.js`, `CHECKLIST.md` |
| **Validação executada** | Teste direcionado do Construtor + suíte relacionada de preview/auth da API + `npm test` para regressão geral (detalhes no PR). |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-24 — fix(construtor): F3-02 indicador explícito de artefato/ZIP na aprovação

| Item | Detalhe |
|------|---------|
| **Título do PR** | `fix(construtor): F3-02 indicador explícito de artefato/ZIP na aprovação` |
| **Identificação** | Fase 3 — Prioridade **F3-02** (UX de aprovação com artefato/ZIP explícito). |
| **O que mudou** | No `ArtifactPreviewPanel`, em estado `pending`, foi adicionado indicador visual explícito `Status do artefato/ZIP` com dois estados: `ready` (válido e pronto para exportar após aprovação) e `review` (pendências/necessidade de revisão). |
| **Origem dos dados** | Status derivado exclusivamente de dados já existentes do preview (`summary.validation` e `summary.filesSummary/files`), sem lógica de backend nova. |
| **Teste mínimo alternativo** | Teste renderizado do painel não foi viável no setup atual de Jest (padrão do projeto não executa `*.test.jsx` e não transpila import JSX do componente no `testMatch` ativo). Em vez de ampliar escopo de infraestrutura de testes, foi adicionado teste mínimo determinístico em `src/lib/construtor/__tests__/artifactPreview.test.js` cobrindo os dados que alimentam o indicador visual (`summary.validation` + `summary.filesSummary`) para estados "pronto" vs "revisar". |
| **Restrições arquiteturais** | Sem reativar `executeArtifact`, sem bypass do Serginho, sem alteração em providers/modelos/prompts/Auth/Payments/Especialistas/ABNT. |
| **Arquivos alterados** | `src/components/construtor/ArtifactPreviewPanel.jsx`, `src/styles/HybridAgent.css`, `src/lib/construtor/__tests__/artifactPreview.test.js`, `CHECKLIST.md` |
| **Validação executada** | `npm test -- --runInBand` (baseline e pós-ajuste), além de teste direcionado do painel. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-24 — fix(construtor): F3-03 persistência local mínima do ciclo de revisão

| Item | Detalhe |
|------|---------|
| **Título do PR** | `fix(construtor): F3-03 persistência local mínima do ciclo de revisão` |
| **Identificação** | Fase 3 — Prioridade **F3-03** (persistência local mínima/segura do ciclo atual). |
| **O que mudou** | Extração da persistência do ciclo de revisão para `reviewCycleStorage` com schema mínimo (`lastAdjustment`, `decision`, `messageKey`, `updatedAt`), validação defensiva (JSON inválido, schema incompatível, ausência de `window/sessionStorage`, TTL, limite de tamanho) e restauração apenas quando compatível com o artefato atual. |
| **Limpeza controlada** | O estado local do ciclo agora é limpo ao encerrar ciclo manualmente, iniciar novo artefato e em decisões terminais (`approved`/`rejected`), sem apagar histórico geral fora da chave dedicada. |
| **Cobertura de testes** | Novo teste unitário `src/lib/construtor/__tests__/reviewCycleStorage.test.js` cobrindo persistência, restauração compatível, expiração, corrupção de JSON, ausência de `window`, limpeza explícita e proteção contra payload excessivo. |
| **Restrições arquiteturais** | Sem backend novo, sem chamadas externas, sem alteração em Serginho/providers/modelos/prompts/Auth/SaaS/Payments/Especialistas/ABNT. |
| **Arquivos alterados** | `src/pages/HybridAgentSimple.jsx`, `src/lib/construtor/reviewCycleStorage.js`, `src/lib/construtor/__tests__/reviewCycleStorage.test.js`, `CHECKLIST.md` |
| **Validação executada** | `npm test -- --runInBand src/lib/construtor/__tests__/reviewCycleStorage.test.js`, `npm test -- --runInBand`, `npm run build`. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-24 — docs(governance): F3-04 trilha futura de sandbox real (executeArtifact segue desativado)

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(governance): registrar F3-04 de sandbox real sem reativar execução` |
| **Identificação** | Fase 3 — Prioridade **F3-04** (trilha futura de segurança para runner). |
| **Auditoria de presença de `executeArtifact`** | Presente em `src/lib/construtor/artifactRunner.js` (implementação), `src/lib/construtor/__tests__/artifactRunner.test.js` (cobertura da função), e em testes da API com mock/asserção de não uso automático: `api/__tests__/artifact-preview.test.js` e `api/__tests__/artifact-auth.test.js`. |
| **Onde NÃO pode ser chamado automaticamente** | `POST /api/artifact-preview` permanece em modo de inspeção (`api/artifact-preview.js`), com `executionResult` fixo `execution-disabled-by-security-policy` e sem import/invocação de `executeArtifact()`. Não há ativação automática em preview/revisão/exportação. |
| **Teste existente de não execução automática** | Mantido e referenciado sem duplicação: `api/__tests__/artifact-preview.test.js` (`NÃO deve invocar executeArtifact() ao gerar preview`) e `api/__tests__/artifact-auth.test.js` (`POST autenticado NÃO invoca executeArtifact`). |
| **Requisitos mínimos obrigatórios para futura reativação segura (sandbox real)** | (1) isolamento forte de processo/ambiente; (2) timeout rígido; (3) limite de CPU/memória; (4) bloqueio/controle de rede; (5) diretório temporário seguro com limpeza garantida; (6) validação de ZIP/path traversal antes de extrair/executar; (7) allowlist explícita de comandos/runtime quando aplicável; (8) logs auditáveis e plano de rollback; (9) execução somente **opt-in** e nunca automática no preview. |
| **Restrições preservadas neste PR** | Não implementa sandbox real, não reativa execução, não cria endpoint novo, não altera UX funcional, não altera Serginho/Providers/Auth/SaaS/Especialistas/ABNT. |
| **Arquivos alterados** | `CHECKLIST.md`, `docs/audits/P4-artifactRunner-audit.md` |
| **Validação executada** | Baseline local: `npm run build` e `npm test -- --runInBand` verdes; `npm run lint` falha por configuração do projeto (ESLint v10 sem `eslint.config.*`), sem relação com este PR documental. |
| **Rollback** | `git revert <commit-sha>` |
