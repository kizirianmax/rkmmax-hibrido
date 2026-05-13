# Verificação UI/UX / Demo / Mídia avançada — 2026-05-13

> Auditoria estritamente documental. Nenhum arquivo de código foi alterado. Nenhuma camada técnica foi tocada.

## 1. Objetivo

Registrar oficialmente, antes de qualquer implementação, a verificação estrutural realizada em 2026-05-13 sobre o caminho de elevação premium da camada **UI/UX / Demo / Mídia avançada** do `rkmmax-hibrido`, preservando integralmente a arquitetura soberana atual.

## 2. Escopo analisado (somente leitura)

- Estrutura geral do repositório e rotas em `src/App.jsx`.
- Camada de demo: `src/pages/Demo.jsx`, `src/pages/DemoAutoplay.jsx`, `src/data/demoArtifacts.js`.
- Página institucional `/startup` (`src/pages/Projects.jsx`).
- Pipeline do Construtor/Híbrido: listagem de `src/lib/construtor/*` (sem alteração).
- Documentação: `docs/DEMO.md`, `docs/AGENTS.md`, `docs/SPECIALISTS.md`, `docs/auditoria_tecnica_rkmmax_hibrido.md`, `docs/README.md`.
- Governança: `CHECKLIST.md`, `README.md`, `package.json`.

## 3. Verdade arquitetural fixa

- Serginho = orquestrador soberano e gateway central.
- Híbrido/Construtor = geração de artefatos reais.
- Especialistas = especialistas de domínio.
- ABNT = validação/conformidade (100% local, sem IA).
- SaaS/Auth/Pagamentos/Asaas = camada operacional/comercial.
- UI/UX/Demo/Mídia avançada = camada de experiência, apresentação e demonstração.

Nenhuma camada pode assumir papel de outra. Nenhum fluxo pode criar bypass ao Serginho.

## 4. Conclusão principal

O projeto já está estruturalmente acima do nível profissional básico, com:
- arquitetura em 5 camadas claramente nomeada e documentada;
- testes de soberania que bloqueiam bypass ao Serginho;
- demo pública estática (`/demo`, `/demo-autoplay`, `/showcase` → `/demo`);
- autoplay guiado com `STEP_DURATIONS_MS` (~90s) e modos Automático/Manual;
- pipeline real do Construtor (`artifactRunner`, `artifactValidator`, `artifactPreview`, `artifactPackager`);
- governança disciplinada em `CHECKLIST.md`.

A evolução premium deve acontecer **somente** na camada UI/UX/Demo, de forma aditiva, sem mexer em Serginho, Construtor, Especialistas, ABNT, Auth, Pagamentos ou Supabase, e sem introduzir dependências pagas (streaming, Mux, Cloudflare Stream, HLS, framer-motion, lottie, mediasoup, WebRTC).

## 5. Riscos de mistura entre camadas

- **Triplicação histórica do Serginho** já mapeada em `docs/auditoria_tecnica_rkmmax_hibrido.md` (P1, Risco Alto) — não deve ser tocada nesta frente.
- **Tentação de chamar provider direto fora do orchestrator** — já bloqueado pelos testes `a4-gateway-sovereignty.test.js` e `integration.test.js`.
- **Tentação de importar `artifactRunner` na demo pública** — proibido. A demo consome apenas `src/data/demoArtifacts.js` e assets em `/public`.

## 6. Oportunidade de evolução premium (camada UI/UX/Demo)

Direção viável "fora do comum", 100% client-side, sem provider novo e sem custo recorrente:

1. Fixtures estáticas de preview rico em `/public/demo-fixtures/`.
2. Transições CSS suaves + respeito a `prefers-reduced-motion`.
3. Modo avaliador via query string `?mode=jury` com ritmo expandido.
4. Telemetria PostHog dos eventos da demo (apenas com consentimento já existente).
5. TTS opcional via Web Speech API nativa do browser (toggle OFF por padrão, fallback silencioso).
6. Story mode mobile (swipe/tap) reaproveitando `STEP_DURATIONS_MS`.
7. Frames pré-renderizados em WebP, hospedados em `/public`.
8. Compartilhamento via Web Share API nativa.

Todos esses itens são **aditivos** e **não exigem dependências novas**.

## 7. Backlog priorizado

### P0 — registro documental (este PR)
- Registrar a verificação no repositório.
- Atualizar o `CHECKLIST.md` apontando para este arquivo.

### P1 — elevação UI/UX sem dependências novas
- PR-1 Fixtures estáticas de preview rico em `/public/demo-fixtures/`.
- PR-2 Skeleton, transições suaves e `prefers-reduced-motion` em `/demo-autoplay`.
- PR-3 Modo avaliador `?mode=jury`.
- PR-4 Instrumentação PostHog respeitando consentimento.

### P2 — mídia avançada client-side
- PR-5 TTS opcional via Web Speech API (toggle OFF).
- Trilha sonora ambiente CC0 com toggle.
- Iframe sandbox de preview de artefato (somente fixture).
- Web Share API.

### P3 — narrativa visual diferenciada
- Story mode mobile.
- Frames pré-renderizados de cada artefato.
- Rota nova `/demo-cinematic`.
- SRT/VTT estáticos sincronizados com TTS.

## 8. Próximos 5 PRs recomendados

Para cada PR: deve ser pequeno, aditivo, com Validação e Rollback claros, e com entrada própria no `CHECKLIST.md`.

1. **PR-1** — `feat(demo): fixtures estáticas de preview rico em /public/demo-fixtures/`.
2. **PR-2** — `feat(demo): skeleton, transições suaves e prefers-reduced-motion em /demo-autoplay`.
3. **PR-3** — `feat(demo): modo avaliador via query ?mode=jury com ritmo expandido`.
4. **PR-4** — `feat(demo): instrumentação de eventos da demo via PostHog respeitando consentimento`.
5. **PR-5** — `feat(demo): TTS opcional via Web Speech API (toggle OFF por padrão)`.

Detalhamento completo (camada alvo, objetivo, arquivos prováveis, risco, validação, rollback, entrada no CHECKLIST.md) deverá ser elaborado no momento da abertura de cada PR.

## 9. O que NÃO fazer agora

- Não tocar em `api/lib/serginho-orchestrator.js`, `src/agents/serginho/*`, `src/api/serginhoOrchestrator.js`.
- Não tocar em `src/lib/construtor/*`.
- Não tocar em Especialistas, ABNT, Auth, Supabase, Stripe, Asaas, pagamentos.
- Não adicionar Mux, Cloudflare Stream, HLS.js, framer-motion, lottie, mediasoup, WebRTC, novos providers de IA.
- Não criar streaming real nem geração ao vivo na demo pública.
- Não introduzir Asaas no código nesta etapa.
- Não consolidar a triplicação Serginho neste ciclo.
- Não refatorar amplamente os arquivos `.md`.
- Não publicar mídia fora de `/public` (sem CDN externo).

## 10. Garantias arquiteturais preservadas

- Serginho permanece orquestrador soberano.
- Demo continua estática e segura.
- Nenhum bypass ao Serginho.
- Nenhuma camada invade outra.
- Testes `a4-gateway-sovereignty` e `integration` permanecem inalterados.
- Nenhuma dependência foi adicionada.
- Nenhuma rota foi alterada.

## 11. Validação desta auditoria

- Apenas dois arquivos alterados: este (criado) e `CHECKLIST.md` (entrada curta adicionada).
- Nenhum arquivo de código tocado.
- Nenhum teste alterado.
- `npm run build` e `npm test -- --runInBand` não precisam ser executados pois nenhum código foi alterado, mas devem permanecer verdes em CI.

## 12. Rollback

`git revert <commit-sha>` — remove apenas este arquivo de auditoria e a entrada correspondente do `CHECKLIST.md`. Nenhum impacto no produto.
