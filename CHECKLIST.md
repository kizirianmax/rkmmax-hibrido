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
