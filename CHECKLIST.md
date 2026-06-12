## 2026-06-12 — docs(ops): runbook de aplicação e verificação de migrations Supabase

| Item | Detalhe |
|------|---------|
| **Escopo** | Criação do runbook operacional `docs/ops/runbook-migrations-supabase.md` para verificação/aplicação manual de migrations Supabase. |
| **Confirmação documental** | Registrado que **não há pipeline automático** de migrations Supabase neste projeto (GitHub/Vercel não aplicam migrations de banco). |
| **Execução SQL** | Nenhum SQL foi executado nesta entrega. |
| **Supabase/Banco/RLS real** | Nenhum Supabase/banco/RLS real foi alterado. |
| **Migrations** | Nenhuma migration nova foi criada. |
| **Invariantes de runtime/escopo** | Nenhum runtime alterado; sem alterações em `api/`, frontend, providers, Serginho, Dependabot, `package.json` ou lockfile. |
| **Invariantes de segurança operacional** | WebContainer e `executeArtifact` continuam desativados; conteúdo real e prompts continuam não persistidos. |
| **Validação** | `npm run lint`; `npm run build`; `npm test -- --runInBand`. |
| **Rollback** | `git revert <commit-sha>`. |

---

## 2026-06-12 — fix(security): adicionar policy RLS SELECT por dono no artifact_ledger

| Item | Detalhe |
|------|---------|
| **Base** | `origin/main` pós-auditoria de RLS do `artifact_ledger`. |
| **Objetivo** | Adicionar defesa em profundidade com policy de leitura por dono no `artifact_ledger`, sem alterar runtime e preservando o fluxo atual via `service_role`. |
| **Migration criada** | `supabase/migrations/20260612_add_artifact_ledger_select_owner_policy.sql`. |
| **Policy adicionada** | `artifact_ledger_select_owner` com `FOR SELECT`, `TO authenticated` e `USING (user_id = (auth.uid())::text)`. |
| **Escopo de permissão** | Apenas `SELECT`; nenhuma policy de `INSERT`, `UPDATE` ou `DELETE` foi adicionada. |
| **Estrutura de dados** | Sem criação/alteração de tabela e sem mudança de tipo da coluna `user_id` (permanece `TEXT`). |
| **Escopo de código** | Sem alterações em `api/`, frontend, providers, Serginho, Dependabot, `package.json` ou lockfile; sem mudança de runtime. |
| **Invariantes preservadas** | WebContainer permanece desativado; `executeArtifact` permanece desativado; conteúdo real e prompts continuam não persistidos. |
| **Rollback SQL** | `DROP POLICY IF EXISTS artifact_ledger_select_owner ON public.artifact_ledger;` |
| **Validação** | `npm run lint`; `npm run build`; `npm test -- --runInBand`. |

---

## 2026-06-12 — docs(persistencia): base documental da FASE 1.5 para artefatos duráveis

| Item | Detalhe |
|------|---------|
| **Base** | `origin/main` pós-auditoria de persistência durável do Construtor/Híbrido. |
| **Objetivo** | Formalizar, sem implementação runtime, o contrato documental da FASE 1.5 para persistência durável de artefatos (ADR + política de retenção/LGPD). |
| **Arquivos alterados** | `docs/adr/ADR-persistencia-duravel-artefatos.md`; `docs/legal/politica-retencao-artefatos.md`; `CHECKLIST.md`; `CHANGELOG.md`. |
| **Escopo aplicado** | Entrega exclusivamente documental/contratual: modelo mínimo futuro (`artifact_project`/`artifact_version`), regras de minimização/privacidade, decisão de RLS como pré-requisito da FASE 2 e critérios de aceite futuros. |
| **Invariantes preservadas** | Sem criação de tabela/migration; sem alteração de Supabase/RLS efetiva; sem alteração em `api/`; sem alteração funcional de frontend; sem alteração de providers (Gemini/Groq) ou Serginho; sem alteração em Dependabot, `package.json` ou lockfile. |
| **Restrições mantidas** | WebContainer permanece desativado; `executeArtifact` permanece desativado; prompts não são persistidos por padrão; nenhum conteúdo real de artefato foi persistido nesta fase. |
| **Validação** | `npm run lint`; `npm run build`; `npm test -- --runInBand`. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-12 — feat(construtor): exportar ZIP com edições locais no ArtifactPreviewPanel

| Item | Detalhe |
|------|---------|
| **Base** | `origin/main` pós-#614 e pós-#616. |
| **Objetivo** | Fazer o download de ZIP refletir edições locais do painel de revisão, sem execução de artefato, sem alterar pipeline de IA e com comportamento fail-closed para artefatos não totalmente reproduzíveis em texto. |
| **Arquivos alterados** | `src/components/construtor/ArtifactPreviewPanel.jsx`; `src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx`; `src/lib/construtor/clientZipBuilder.jsx`; `src/lib/construtor/__tests__/clientZipBuilder.test.js`; `CHECKLIST.md`. |
| **Escopo aplicado** | Novo builder client-side puro (ZIP STORE + CRC-32, determinístico, sem dependências) para arquivos textuais; `handleDownload` preserva fluxo original sem edição local e, com edição local reproduzível, gera ZIP local com conteúdo efetivo por arquivo; em caso de arquivo sem conteúdo textual completo, mantém download original com aviso explícito; em erro de empacotamento, exibe aviso e não baixa ZIP potencialmente incorreto. |
| **Invariantes preservadas** | WebContainer continua desativado; `executeArtifact` segue disabled; nenhuma alteração em `api/`; Serginho/Groq/Gemini inalterados; sem alteração em providers, Dependabot, `package.json` ou lockfile; sem execução/interpretação de HTML/JS do artefato. |
| **Validação** | Baseline pré-mudança: `npm run lint`, `npm run build`, `npm test -- --runInBand`; direcionados: `npm test -- --runInBand src/lib/construtor/__tests__/clientZipBuilder.test.js src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx`; pós-mudança: `npm run lint`, `npm run build`, `npm test -- --runInBand`. |
| **Limitações conhecidas** | Quando houver qualquer arquivo sem conteúdo textual completo no `summary.fileContents`, a exportação com edições locais não é gerada (fail-closed) e o painel mantém o download do ZIP original; `manifest.json`/checksum continuam refletindo a geração original. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-12 — docs(legal): corrigir duplicidade e referências oficiais no PR #616

| Item | Detalhe |
|------|---------|
| **Base** | Branch do PR #616 em revisão final. |
| **Objetivo** | Remover redação antiga/duplicada em `Privacy.jsx`, revisar consistência gramatical/lista em `Terms.jsx` e atualizar links oficiais de Gemini/Groq para referências mais específicas. |
| **Arquivos alterados** | `src/pages/Privacy.jsx`; `src/pages/Terms.jsx`; `CHECKLIST.md`. |
| **Ajustes aplicados** | Reescrita do parágrafo de processamento por terceiros em `Privacy.jsx` para eliminar a formulação antiga; manutenção explícita de Serginho como gateway único e Gemini/Groq conforme configuração técnica; reforço textual em `Terms.jsx` da distinção entre assinatura SaaS RKMMAX e tier técnico do provider; atualização de referências para `ai.google.dev/gemini-api/terms`, `ai.google.dev/terms`, `groq.com/terms-of-use/` e `console.groq.com/docs/your-data`; validação de lista sem item quebrado/repetido. |
| **Invariantes preservadas** | Mudança exclusivamente documental; sem alterações em `api/`, lógica de providers, variáveis de ambiente, dependências, Dependabot, WebContainer ou `executeArtifact`. Gemini e Groq permanecem permitidos/configuráveis sob gateway único do Serginho. |
| **Validação** | `npm run build`; `npm test -- --runInBand src/pages`; `npm test -- --runInBand`. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-12 — docs(legal): alinhar privacidade e termos ao modelo SaaS pago e uso de providers

| Item | Detalhe |
|------|---------|
| **Base** | `origin/main` pós-#614. |
| **Objetivo** | Atualizar exclusivamente textos públicos de `Privacy.jsx` e `Terms.jsx` para refletir serviço SaaS pago recorrente, ausência de plano gratuito ao usuário final e uso de providers terceiros sob orquestração do Serginho. |
| **Arquivos alterados** | `src/pages/Privacy.jsx`; `src/pages/Terms.jsx`; `CHECKLIST.md`. |
| **Ajustes aplicados** | Inclusão explícita de que RKMMAX é SaaS pago por assinatura/recorrência sem plano gratuito para usuário final; reforço de que Google Gemini e Groq são providers terceiros configuráveis sob gateway único do Serginho; detalhamento de que dados enviados podem incluir prompt, contexto necessário, histórico relevante e conteúdo fornecido; distinção de que pagamento ao RKMMAX não implica tier técnico específico do provider; reforço de verificação operacional real (billing, data controls, opções como ZDR) antes de produção com usuários reais/dados sensíveis; manutenção da linguagem honesta sem garantia absoluta sobre terceiros. |
| **Invariantes preservadas** | Mudança apenas documental/textual; sem alterações em `api/`, orquestrador, lógica de providers/fallback, variáveis de ambiente, dependências, lockfiles ou arquitetura. Gemini e Groq permanecem permitidos sob orquestração do Serginho. |
| **Validação** | `npm run build`; `npm test -- --runInBand` (após ajustes textuais). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-12 — feat(construtor): adicionar preview visual estático gated sem execução

| Item | Detalhe |
|------|---------|
| **Base** | `origin/main` pós-#613 (`a4f0b65`). |
| **Objetivo** | Implementar preview visual estático pequeno/controlado/reversível no Construtor/Híbrido, somente para artefatos `previewable-static`, com dupla trava (classificador + sanitizador puro) e fail-closed. |
| **Relação com #609/#610/#613** | #609 definiu ADR/taxonomia; #610 segue como classificador de capacidade (não sanitizador); #613 manteve UI diagnóstica gated. Este passo adiciona renderização estática sanitizada com gate próprio. |
| **Flag usada** | Gate exclusivo: `?constructorStaticPreview=1` (default OFF, rollback independente, sem reuso de `?constructorTelemetry=1`). |
| **Arquivos alterados** | `src/lib/construtor/constructorStaticPreviewSanitizer.js`; `src/lib/construtor/__tests__/constructorStaticPreviewSanitizer.test.js`; `src/components/construtor/StaticArtifactPreview.jsx`; `src/components/construtor/__tests__/StaticArtifactPreview.test.jsx`; `src/components/construtor/ArtifactPreviewPanel.jsx`; `src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx`; `src/styles/HybridAgent.css`; `CHECKLIST.md`. |
| **Estratégia de sanitização** | Sanitizador puro sem side effects: rejeita entrada inválida e srcdoc > 256KB; remove `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<base>`, `<meta http-equiv=\"refresh\">`; remove `on*`; bloqueia `javascript:`, `data:text/html`, `data:image/svg+xml`, `http(s)://` e `//` em atributos/CSS; injeta CSP defensiva. |
| **Renderização** | Componente `StaticArtifactPreview` usa `iframe` com `sandbox=\"\"`, `srcDoc`, `referrerPolicy=\"no-referrer\"`, `loading=\"lazy\"`; sem `allow-scripts`, sem `allow-same-origin`, sem `src` remoto. |
| **Elegibilidade efetiva** | Renderiza somente quando TODAS: `?constructorStaticPreview=1`; capability `previewable-static`; `index.html` string não vazia; sanitizador retorna `ok: true`; HTML final sanitizado sem tokens proibidos. Qualquer falha => não renderiza (fail-closed). |
| **Invariantes preservadas** | WebContainer permanece desativado; `executeArtifact` server-side segue `disabled`; sem bypass ao Serginho; sem alterações em `api/`, contratos/readers/parser/normalizer/empacotador/allowlist/classifier; `conteudo-com-acesso-dinamico` não foi relaxado; sem alterações em `robots.txt`, `Privacy.jsx`, `Terms.jsx`, `package.json`, lockfiles ou dependências. |
| **Testes** | Direcionados: `npm test -- --runInBand src/lib/construtor/__tests__/constructorStaticPreviewSanitizer.test.js` e `npm test -- --runInBand src/components/construtor/__tests__/StaticArtifactPreview.test.jsx`; integração gate no painel em `ArtifactPreviewPanel.test.jsx`; depois suíte completa + build. |
| **Rollback** | `git revert <commit-sha>` |
| **Próximo passo recomendado** | Coleta visual/manual desktop+mobile com `?constructorStaticPreview=1`; validar ganho de demo/pitch; depois auditar termos oficiais Google Gemini/Groq; depois avaliar sanitização de prompts antes do provider. |

---

## 2026-06-12 — feat(construtor): exibir capacidade do artefato em modo diagnóstico

| Item | Detalhe |
|------|---------|
| **Base** | `origin/main` pós-#612. |
| **Objetivo** | Exibir na UI do Construtor/Híbrido a capacidade do artefato apenas em modo diagnóstico gated, de forma informativa/read-only/verdict-only. |
| **Relação com #609/#610/#611/#612** | #609 definiu ADR/taxonomia; #610 criou o classificador puro; #611/#612 cobriram robots/privacy/terms e não foram tocados neste PR. |
| **Arquivos alterados** | `src/lib/construtor/constructorArtifactCapabilityLabels.js`; `src/lib/construtor/__tests__/constructorArtifactCapabilityLabels.test.js`; `src/components/construtor/ArtifactPreviewPanel.jsx`; `src/styles/HybridAgent.css`; `CHECKLIST.md`. |
| **Comportamento** | Com gate ativo, `ArtifactPreviewPanel` mostra seção “Capacidade do artefato” com label, caption e disclaimer; sem gate, UI permanece igual. Exibição não mostra reasons/flags/payload/conteúdo sensível. |
| **Flag diagnóstica** | Reuso do gate já existente por querystring: `?constructorTelemetry=1`. |
| **Invariantes preservadas** | Sem alterações em `api/`, contratos, readers, parser/normalizer/empacotador, allowlist, WebContainer, `executeArtifact`, iframe/preview visual/execução JS, fluxo ZIP, fluxo de aprovação/ajuste/rejeição, `robots.txt`, `Privacy.jsx`, `Terms.jsx`. `conteudo-com-acesso-dinamico` não foi relaxado. |
| **Testes** | `npm test -- --runInBand src/lib/construtor/__tests__/constructorArtifactCapabilityLabels.test.js`; `npm test -- --runInBand`; `npm run build`. |
| **Rollback** | `git revert <commit-sha>` |
| **Próximo passo recomendado** | Coleta visual/manual em mobile e desktop com a flag ativa, sem ativar execução, antes de decidir eventual exposição fora do modo diagnóstico. |

---

## 2026-06-12 — docs(privacidade): revisão final de consistência para saída de Draft (#612)

| Item | Detalhe |
|------|---------|
| **Base** | Branch do PR #612 após revisão documental inicial. |
| **Objetivo** | Ajuste final de linguagem e consistência estrutural em Privacidade/Termos antes de Ready for review. |
| **Arquivos alterados** | `src/pages/Privacy.jsx`; `src/pages/Terms.jsx`; `CHECKLIST.md`. |
| **Ajustes aplicados** | Qualificação da linguagem operacional em `Privacy.jsx` (sem frases amplas genéricas), inclusão de referência textual aos termos oficiais de Google Gemini e Groq em `Privacy.jsx` e `Terms.jsx`, e validação de ausência de títulos/números/datas duplicados nos dois arquivos. |
| **Declarações preservadas** | RKMMAX não treina modelos próprios com dados do usuário; uso/retenção por terceiros depende dos termos oficiais dos provedores; não há promessa absoluta de não-treinamento por terceiros; orientação para evitar dados sensíveis desnecessários; canal `suporte@kizirianmax.site`. |
| **Invariantes preservadas** | PR permanece exclusivamente documental; sem alterações em `api/`, orquestrador, providers-config, ModelArmor, `robots.txt`, WebContainer, `executeArtifact`, `package.json`, lockfiles ou dependências do projeto. |
| **Validação** | `npm run build`; `npm test -- --runInBand`. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-12 — docs(privacidade): declarar uso de provedores de IA terceiros e limites de retenção

| Item | Detalhe |
|------|---------|
| **Base** | `origin/main` pós-#611 (merge `f373d5a`). |
| **Objetivo** | Atualizar exclusivamente a documentação de privacidade/termos para transparência sobre provedores de IA terceiros, processamento de prompts/histórico/conteúdo e limites de não-treino/retenção. |
| **Arquivos alterados** | `src/pages/Privacy.jsx`; `src/pages/Terms.jsx`; `CHECKLIST.md`. |
| **Contexto da auditoria** | Providers reais identificados no fluxo: Google Gemini e Groq; risco principal em prompts, histórico e conteúdo/artefatos enviados via API; `ModelArmor` existe no frontend (`src/security/ModelArmor.js`), mas está fora do fluxo real backend antes do provider. |
| **O que foi declarado** | Uso de provedores terceiros (Google Gemini e Groq); prompts/mensagens/histórico necessário e conteúdo do Construtor/Híbrido/Especialistas podem ser processados para inferência; RKMMAX não treina modelos próprios com dados do usuário; uso/retenção por terceiros depende dos termos oficiais deles; recomendação para não inserir dados sensíveis desnecessários; reforço de direitos LGPD/GDPR com canal `suporte@kizirianmax.site`. |
| **O que NÃO foi prometido** | Não foi prometida garantia absoluta de não-treinamento por terceiros; não foi prometida retenção zero; não foi prometida proteção técnica inexistente; `robots.txt` não foi tratado como proteção de prompts privados. |
| **Invariantes preservadas** | Sem alterações em `api/`, orquestrador (`serginho-orchestrator.js`), `providers-config.js`, `ModelArmor`, `robots.txt`, WebContainer, `executeArtifact`, `package.json`, lockfiles ou dependências; Serginho permanece gateway soberano. |
| **Rollback** | `git revert <commit-sha>` restaura atomicamente os textos anteriores e esta entrada. |
| **Próximo passo recomendado** | Após este PR, executar auditoria manual dos termos oficiais vigentes dos providers (Google Gemini AI Studio / Gemini API e Groq) e, depois, abrir PR técnico separado para: sanitização antes do envio ao provider; redução de logs sensíveis; avaliação de religar ModelArmor no fluxo real; avaliação futura de Vertex AI ou tier com compromisso de não-treinamento, se necessário. |

---

## 2026-06-11 — feat(construtor): adicionar classificador verdict-only de capacidade de artefatos

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): adicionar classificador verdict-only de capacidade de artefatos` |
| **Base** | `origin/main` pós-#609. |
| **Objetivo** | Criar camada pura, read-only e verdict-only para classificar capacidade de artefatos (`exportable`, `previewable-static`, `executable-client`, `blocked`), sem alterar comportamento runtime atual. |
| **Relação com ADR #609** | Implementa o próximo passo recomendado pela ADR: classificação informativa separada da execução, sem relaxar contratos/allowlists e sem ativar WebContainer. |
| **Arquivos alterados** | `src/lib/construtor/constructorArtifactCapabilityClassifier.js`; `src/lib/construtor/__tests__/constructorArtifactCapabilityClassifier.test.js`; `CHECKLIST.md`. |
| **Comportamento** | Novo classificador puro recebe mapa seguro `path -> content` (com `entrypoint`/`validation` opcionais), ignora metadados internos (`README.md`, `manifest.json`, `logs/*`) como sinal primário, aplica regras conservadoras de bloqueio (path perigoso incluindo `C:/...`, rede/import externo, `eval`/`Function`, acesso dinâmico evasivo e `script` inline em HTML) e retorna apenas veredito serializável (`capability`, `reasons`, `flags`) sem payload bruto. |
| **Invariantes preservadas** | Sem alterações em `api/`, UI, readers, contratos, parser/normalizer/packager, allowlists, `conteudo-com-acesso-dinamico`, WebContainer e `executeArtifact` (continua `disabled`). A classificação não permite execução. |
| **Testes** | Direcionado: `npm test -- --runInBand src/lib/construtor/__tests__/constructorArtifactCapabilityClassifier.test.js`; completo: `npm test -- --runInBand`; build: `npm run build`. |
| **Rollback** | `git revert <commit-sha>` |
| **Próximo passo recomendado** | Fazer auditoria/revisão para eventual exibição futura da classificação na UI em PR pequeno e separado, sem ativar execução. |

---

## 2026-06-11 — docs(arquitetura): ADR sobre conteudo-com-acesso-dinamico e taxonomia de artefatos

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(arquitetura): ADR sobre conteudo-com-acesso-dinamico e taxonomia de artefatos` |
| **Base** | `origin/main` pós-#608 (`205f239e507941d8d528482b155fe5168d0dc3e9`). |
| **Natureza da entrega** | PR estritamente documental. Sem implementação de código. Sem alteração de contratos. Sem relaxar bloqueios. Sem ativar execução. |
| **Diagnóstico** | `conteudo-com-acesso-dinamico` nasce em `src/lib/construtor/webcontainerArtifactContract.js` (`FORBIDDEN_CONTENT_PATTERNS`, `jsOnly: true`, aplicado via `validateArtifactContent` em `.js`), bloqueando `globalThis`, `window`, `self`, `document`, `navigator`, `location`, acesso dinâmico por colchetes, `eval(` e `Function(`. O contrato estático client-side (`src/lib/construtor/constructorStaticClientArtifactContract.js`) reutiliza a mesma validação; o reader (`src/lib/construtor/constructorApprovedPreviewDiagnosticReader.js`) roteia HTML/CSS/JS para `stage: "static-contract"`, então casos com DOM ficam `unavailable`. |
| **Decisão** | Não relaxar contrato nem bloqueio. Registrar decisão arquitetural futura de separar classificação de artefatos antes de qualquer execução. |
| **Taxonomia adotada** | `exportable`, `previewable-static`, `executable-client`, `blocked` (documental; sem implementação neste PR). |
| **Invariantes preservadas** | Serginho segue gateway soberano; Híbrido/Construtor segue geração de artefatos; ZIP exportável não implica executável; preview estrutural não implica execução; diagnóstico verdict-only não executa; WebContainer permanece desativado; `executeArtifact` server-side permanece `disabled`; sem bypass; sem relaxar contratos/allowlists. |
| **Escopo** | Restrito a documentação: criação da ADR em `docs/adr/` e atualização do `CHECKLIST.md`. Nenhuma alteração em `src/`, `api/`, parser, reader, empacotador, contratos, allowlist, dependências ou lockfiles. |
| **Arquivos alterados** | `docs/adr/ADR-conteudo-com-acesso-dinamico-e-taxonomia-artefatos.md`; `CHECKLIST.md`. |
| **Próximo passo recomendado** | Abrir PR separado para desenhar camada pura de classificação verdict-only (`exportable`, `previewable-static`, `executable-client`, `blocked`), sem execução, sem WebContainer, sem relaxar contratos. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-11 — docs(construtor): registrar coleta runtime real pós-#607 (verdict-only)

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(construtor): registrar coleta runtime real pós-#607 (verdict-only)` |
| **Base** | `origin/main` pós-#607 (`4ae33cb9e856c68992c4c6f6188cc32ba537b3ee`, merge do PR #607 `fix(construtor): aceitar bloco FILE único explícito no empacotamento`). |
| **Objetivo** | Registrar documentalmente a coleta runtime real **manual** pós-#607 via `?constructorTelemetry=1`, em navegador real autenticado, com 10 amostras **verdict-only**, para confirmar se o #607 corrigiu a Causa B (single-file explícito `index.js`/`index.html` preso em `content.md` e reason `multifile-body-vazio`). |
| **Natureza da entrega** | Documentação/auditoria apenas. Sem implementação de código. Sem ativar WebContainer. Sem reativar `executeArtifact` server-side. Sem payload bruto. Sem expandir allowlist. Sem alterar reader/contratos/parser/empacotador. |
| **URL de coleta** | `https://kizirianmax.site/hybrid?constructorTelemetry=1` |
| **Ambiente de coleta** | Navegador real autenticado; modo verdict-only; payload bruto não registrado; execução não executada; WebContainer desativado; `executeArtifact` server-side `disabled`. |
| **Resultado consolidado (verdict-only)** | `total=10`, `eligible=7`, `unavailable=3`; `byReason={"entrypoint-nao-permitido":3}`; `byStatus={"constructor-approved-preview-diagnostic-reader: eligible":7,"constructor-approved-preview-diagnostic-reader: unavailable":3}`. |
| **Amostras válidas (resumo verdict-only, sem conteúdo bruto)** | (1) eligible — `index.js` único explícito virou arquivo real (não `content.md`, sem `multifile-body-vazio`); GPT-OSS 120B (Complex)/Groq 120B. (2) eligible — `index.html` único explícito virou arquivo real; GPT-OSS 120B. (3) eligible — `index.js` + `lib/helpers.js`, multi-file JS sem regressão; GPT-OSS 120B. (4) eligible — `index.html` + `styles.css`, sem regressão; GPT-OSS 120B. (5) eligible — `index.html` + `style.css`; GPT-OSS 120B. (6) eligible — `index.html` + `assets/main.css` + `assets/main.js` (JS só com `console.log`); GPT-OSS 120B. (7) eligible — `index.html` + `styles.css` + `script.js` (JS sem DOM); GPT-OSS 120B. (8) unavailable/`entrypoint-nao-permitido` — texto comum sem marcador FILE; `content.md` genérico não promovido; Llama 3.3 70B/fallback. (9) unavailable/`entrypoint-nao-permitido` — texto livre mencionando marcador FILE de forma descritiva; não virou arquivo real; Llama 3.3 70B/fallback. (10) unavailable/`entrypoint-nao-permitido` — heurística markdown `### index.js` única não promovida; Llama 3.3 70B/fallback. Metadados internos (`README.md`/`manifest.json`/`logs/*`) seguem visíveis no preview/ZIP, mas filtrados do diagnóstico verdict-only (Causa A/#605 intacta). |
| **Tentativa descartada (não entra no total oficial)** | Amostra 9 — tentativa 1: modelo Llama 3.3 70B/fallback desobedeceu ao prompt e transformou exemplo textual em `index.js` real; efeito visual no painel elevou `eligible` indevidamente para 8; decisão: descartada da consolidação oficial. A coleta da Amostra 9 foi repetida e a versão válida retornou `unavailable`/`entrypoint-nao-permitido`. |
| **Comparação com #606 (pós-#605)** | **#606:** `total=10`, `eligible=7`, `unavailable=3`, `byReason={"multifile-body-vazio":2,"conteudo-com-acesso-dinamico":1}`. **Pós-#607:** `total=10`, `eligible=7`, `unavailable=3`, `byReason={"entrypoint-nao-permitido":3}`. Mudança principal: `multifile-body-vazio` caiu de **2 para 0**; `arquivo-fora-da-allowlist` permaneceu **0**; `content.md` genérico continuou não promovido; heurística `###/####` única continuou não promovida; single-file explícito `index.js` e `index.html` passaram a virar arquivo real. |
| **Conclusão (Causa B corrigida)** | O #607 **corrigiu a Causa B** em navegador real: `index.js` único explícito e `index.html` único explícito passaram a virar arquivo real; `multifile-body-vazio` caiu de 2 para 0; `arquivo-fora-da-allowlist` permaneceu 0 (Causa A/#605 mantida); `content.md` genérico continuou não promovido; heurística markdown `###/####` única continuou não promovida. Os 3 `unavailable` restantes são **esperados e por contrato** (`entrypoint-nao-permitido`), referentes a entradas que não deveriam virar artefato executável (texto puro, marcador descritivo em texto livre e heurística markdown única). |
| **Invariantes preservadas** | WebContainer permanece desativado; `executeArtifact` server-side permanece `disabled`; sem payload bruto; sem bypass ao Serginho; sem alteração em `src/`, `api/`, contratos, reader, parser, empacotador, allowlist ou dependências. |
| **Arquivos alterados** | `CHECKLIST.md`. |
| **Próximo passo recomendado** | Abrir auditoria/decisão arquitetural **separada** sobre `conteudo-com-acesso-dinamico` e o futuro **preview executável client-side** (WebContainer), mantendo `executeArtifact` server-side `disabled` e sem relaxar contratos/allowlists sem evidência. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-11 — fix(construtor): aceitar bloco FILE único explícito no empacotamento

| Item | Detalhe |
|------|---------|
| **Título do PR** | `fix(construtor): aceitar bloco FILE único explícito no empacotamento` |
| **Base** | `origin/main` pós-#606 (estado atual local: `ca79368f6c3f7dd7de61277919fbe5f3445c6e4b`). |
| **Objetivo** | Corrigir a Causa B no empacotamento para que bloco único explícito `--- FILE: <name> ---` válido (no início efetivo) seja tratado como arquivo real, sem promover `content.md` genérico. |
| **Resumo da Causa B** | Antes, `parseMultiFileContent` exigia `MIN_MULTI_FILE_COUNT = 2` para o formato explícito. Assim, payload com único `--- FILE: index.js ---` ou `--- FILE: index.html ---` podia cair no fallback e virar `content.md`, gerando `multifile-body-vazio` no diagnóstico. |
| **Arquivos alterados** | `src/lib/construtor/artifactNormalizer.js`; `src/lib/construtor/__tests__/artifactPackager.test.js`; `CHECKLIST.md`. |
| **Comportamento antes/depois** | **Antes:** bloco explícito único podia cair em `content.md` por causa de `MIN_MULTI_FILE_COUNT = 2`. **Depois:** bloco explícito único no início efetivo + nome válido + body não vazio vira arquivo real no empacotamento (`index.js`/`index.html` etc). Texto livre continua `content.md`; marcador no meio de texto livre não promove; heurística única `###/####` continua bloqueada. |
| **Confirmações de invariantes** | Causa A (#605) não reaberta; metadados internos continuam tratados como antes. WebContainer permanece desativado. `executeArtifact` server-side permanece `disabled`. Sem mudanças em `api/`, reader diagnóstico, contratos/allowlist globais, dependências ou lockfiles. |
| **Testes executados** | Baseline pré-mudança: `npm run lint`, `npm test -- --runInBand`, `npm run build`. Pós-mudança direcionado: `npm test -- --runInBand src/lib/construtor/__tests__/artifactPackager.test.js src/lib/construtor/__tests__/constructorInternalMetadataFileFilter.test.js src/lib/construtor/__tests__/constructorApprovedPreviewDiagnosticReader.test.js src/lib/construtor/__tests__/webcontainerSpikeEvidence.test.js`. Pós-mudança completo: `npm test -- --runInBand`; `npm run build`. |
| **Riscos** | Baixo: mudança cirúrgica no parser explícito `--- FILE: ---`, com hardening de início efetivo para evitar falso positivo em texto livre e sem relaxar heurística alternativa `###/####`. |
| **Rollback** | `git revert <commit-sha>` |
| **Próximo passo recomendado** | Monitorar telemetria verdict-only para confirmar queda de `multifile-body-vazio` em casos de arquivo explícito único e manter bloqueios atuais para `content.md` genérico e heurística `###/####` de arquivo único. |

---

## 2026-06-11 — docs(construtor): registrar coleta runtime real pós-#605 (verdict-only)

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(construtor): registrar coleta runtime real pós-#605 (verdict-only)` |
| **Base** | `origin/main` pós-#605 (`04d92e0809251d5a734a2c6b01b7c7c1d28886b9`, merge do PR #605 `fix(construtor): filtrar metadados internos no snapshot diagnóstico verdict-only`). |
| **Objetivo** | Registrar documentalmente a coleta runtime real **manual** pós-#605 via `?constructorTelemetry=1`, em navegador real autenticado, com 10 amostras **verdict-only**, para verificar se a Causa A foi corrigida. |
| **Natureza da entrega** | Documentação/auditoria apenas. Sem implementação de código. Sem ativar WebContainer. Sem reativar `executeArtifact` server-side. Sem payload bruto. Sem expandir allowlist. |
| **URL de coleta** | `https://kizirianmax.site/hybrid?constructorTelemetry=1` |
| **Resultado consolidado (verdict-only)** | `total=10`, `eligible=7`, `unavailable=3`; `byReason={"multifile-body-vazio":2,"conteudo-com-acesso-dinamico":1}`; `byStatus={"constructor-approved-preview-diagnostic-reader: eligible":7,"constructor-approved-preview-diagnostic-reader: unavailable":3}`. |
| **Amostras (resumo verdict-only, sem conteúdo bruto)** | (1) eligible — landing page Serginho IA `index.html`/`styles.css`/`script.js`; metadados internos ainda visíveis no preview/ZIP, filtrados corretamente no diagnóstico; (2) eligible — landing HTML/CSS pura do RKMMAX `index.html`/`styles.css`; metadados internos filtrados; (3) eligible — estático `index.html`/`assets/main.css`/`assets/main.js`; metadados internos filtrados; (4) eligible — JS puro `index.js`/`lib/helpers.js`; metadados internos filtrados; (5) unavailable / `multifile-body-vazio` — `index.js` único preso em `content.md` com marcador textual `--- FILE: index.js ---`; (6) unavailable / `multifile-body-vazio` — `index.html` único preso em `content.md` com marcador textual `--- FILE: index.html ---`; (7) eligible — estático com botão visual sem JavaScript `index.html`/`style.css`; metadados internos filtrados; (8) unavailable / `conteudo-com-acesso-dinamico` — página estática RKMMAX `index.html`/`styles.css`/`script.js` (tentativa anterior teve API error 502 e foi descartada; esta foi a tentativa válida); (9) eligible — client-side `index.html`/`assets/app.css`/`assets/app.js`; metadados internos filtrados; (10) eligible — projeto mínimo JavaScript sem dependências `index.js`/`lib/helpers.js`; metadados internos filtrados. |
| **Comparação com #604 (pós-#602)** | **#604:** `total=10`, `eligible=0`, `unavailable=10`, `byReason={"entrypoint-nao-permitido":1,"conteudo-com-acesso-dinamico":2,"arquivo-fora-da-allowlist":4,"multifile-body-vazio":3}`. **Pós-#605:** `total=10`, `eligible=7`, `unavailable=3`, `byReason={"multifile-body-vazio":2,"conteudo-com-acesso-dinamico":1}`. **Deltas:** `eligible` 0→7; `unavailable` 10→3; `arquivo-fora-da-allowlist` 4→0; `entrypoint-nao-permitido` 1→0; `multifile-body-vazio` 3→2; `conteudo-com-acesso-dinamico` 2→1. |
| **Conclusão (Causa A corrigida)** | O #605 **corrigiu a Causa A**: metadados internos observacionais do empacotador (`README.md`, `manifest.json`, `logs/generation.log`, `logs/structure.log`, `logs/*`) deixaram de contaminar o snapshot diagnóstico verdict-only. Antes do #605 eram julgados como arquivos executáveis e geravam `arquivo-fora-da-allowlist`; depois do #605 continuam visíveis no preview/ZIP, mas não entram mais no diagnóstico verdict-only. **Evidência:** `arquivo-fora-da-allowlist` 4→0 e `eligible` 0→7, com várias amostras contendo `README.md`/`manifest.json`/`logs/*` visíveis no preview ficando `eligible`. |
| **Razões restantes (Causa B + DOM dinâmico)** | `multifile-body-vazio`: 2 — arquivos únicos `index.js`/`index.html` presos em `content.md` com marcador textual `--- FILE: ---`. `conteudo-com-acesso-dinamico`: 1 — JS com acesso dinâmico ao DOM. |
| **Observação sobre reset do painel** | Durante a coleta a página foi recarregada/retomada e o acumulador visual do painel reiniciou em determinado momento; a consolidação final foi feita manualmente a partir das 10 amostras válidas registradas, descartando apenas a tentativa com API error 502 (não gerou artefato e não mediu o diagnóstico verdict-only). |
| **Confirmações de escopo** | Não altera `src/`; não altera `api/`; não ativa WebContainer; não reativa `executeArtifact`; não expande allowlist; não altera reader/contratos/parser/empacotador; não mexe em dependências; sem payload bruto; sem código completo dos artefatos; sem refactor. |
| **Arquivos alterados** | `CHECKLIST.md`. |
| **Próximo passo recomendado** | Abrir auditoria técnica **separada** para a **Causa B**: arquivos únicos `index.js`/`index.html` presos em `content.md`; marcadores `--- FILE: ---` aparecendo dentro de `content.md`; provável relação com parser/normalizer/`MIN_MULTI_FILE_COUNT`. E, separadamente, observar o caso remanescente de `conteudo-com-acesso-dinamico`. Não corrigir nada disso neste PR documental. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-10 — fix(construtor): filtrar metadados internos no snapshot diagnóstico verdict-only (Causa A)

| Item | Detalhe |
|------|---------|
| **Título do PR** | `fix(construtor): filtrar metadados internos no snapshot diagnóstico verdict-only (Causa A)` |
| **Base** | `origin/main = 321a1f1677721b95455e014aba3cc4d3d21f4c62` (main pós-#604). |
| **Objetivo** | Remover apenas metadados internos observacionais (`README.md`, `manifest.json`, `logs/*`) no caminho diagnóstico verdict-only, antes da inferência de entrypoint e antes da leitura do snapshot in-memory. |
| **Arquivos alterados** | `src/lib/construtor/constructorInternalMetadataFileFilter.js`; `src/lib/construtor/__tests__/constructorInternalMetadataFileFilter.test.js`; `src/lib/construtor/constructorRealPreviewDiagnosticObservation.js`; `src/lib/construtor/__tests__/constructorRealPreviewDiagnosticObservation.test.js`; `CHECKLIST.md`. |
| **Comportamento antes/depois** | Antes: `summary.fileContents` com metadados internos contaminava o snapshot do reader e podia reprovar por `arquivo-fora-da-allowlist`. Depois: esses metadados são filtrados somente no fluxo verdict-only observacional; ZIP/preview público continuam contendo metadados. `content.md` com marcador textual continua `unavailable`. |
| **Riscos** | Baixo: filtro fixo e conservador, aplicado somente no observador verdict-only. Sem relaxar contrato/allowlist, sem tocar parser de `content.md` (`MIN_MULTI_FILE_COUNT` fora de escopo), sem mudanças em `api/`, WebContainer ou `executeArtifact`. |
| **Rollback** | `git revert <commit-sha>` |
| **Próximo passo recomendado** | Tratar a Causa B em PR separado: ajuste seguro para o aprisionamento em `content.md` ligado a `MIN_MULTI_FILE_COUNT`, sem heurística frágil e sem relaxar contratos. |

---

## 2026-06-10 — docs(construtor): registrar coleta runtime real pós-#602 (verdict-only, 10 amostras, 0 eligible / 10 unavailable)

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(construtor): registrar coleta runtime real pós-#602 (verdict-only)` |
| **Base** | `origin/main = 30b7c2dea67e6e0087341d49585f10938fad8399` (`docs(construtor): registrar auditoria verdict-only pós-#602 com lacuna explícita de telemetria runtime real`, PR #603). |
| **Objetivo** | Registrar documentalmente a coleta runtime real **manual** pós-#602 via `?constructorTelemetry=1`, com 10 amostras **verdict-only**. |
| **Natureza da entrega** | Documentação/auditoria apenas. Sem implementação de código. Sem ativar WebContainer. Sem reativar `executeArtifact` server-side. Sem payload bruto. Sem expandir allowlist. |
| **Resultado consolidado (verdict-only)** | `total=10`, `eligible=0`, `unavailable=10`; `byReason={"entrypoint-nao-permitido":1,"conteudo-com-acesso-dinamico":2,"arquivo-fora-da-allowlist":4,"multifile-body-vazio":3}`; `byStatus={"constructor-approved-preview-diagnostic-reader: unavailable":10}`. |
| **Amostras (resumo verdict-only, sem conteúdo bruto)** | (1) unavailable / `entrypoint-nao-permitido` — artefato virou `content.md` com "Sem resposta"; (2) unavailable / `conteudo-com-acesso-dinamico` — HTML/CSS/JS, JS com `document`/`getElementById`/`addEventListener`; (3) unavailable / `arquivo-fora-da-allowlist` — HTML/CSS/JS simples + `README.md`/`manifest.json`/logs extras; (4) unavailable / `multifile-body-vazio` — `index.html` preso em `content.md` com marcador textual; (5) unavailable / `multifile-body-vazio` — `index.js` puro preso em `content.md`; (6) unavailable / `multifile-body-vazio` — `index.js` puro repetido preso em `content.md`; (7) unavailable / `conteudo-com-acesso-dinamico` — HTML/CSS/JS com acesso dinâmico ao DOM; (8) unavailable / `arquivo-fora-da-allowlist` — HTML/CSS puro (sem JS) + `README.md`/`manifest.json`/logs extras; (9) unavailable / `arquivo-fora-da-allowlist` — `index.js` + `lib/helpers.js` corretos + `README.md`/`manifest.json`/logs extras; (10) unavailable / `arquivo-fora-da-allowlist` — `index.html` + `assets/main.css` + `assets/main.js` corretos + `README.md`/`manifest.json`/logs extras. |
| **Comparação com baseline #600** | **#600 (antes do #602, runtime real manual):** `0 eligible / 10 unavailable`, `byReason={"entrypoint-nao-permitido":6,"dependencias-externas-nao-permitidas":1,"multifile-body-vazio":1,"arquivo-fora-da-allowlist":2}`. **Pós-#602 (runtime real):** `0 eligible / 10 unavailable`, **mesmo total, distribuição de razões diferente**: `entrypoint-nao-permitido` 6→1; `arquivo-fora-da-allowlist` 2→4; `multifile-body-vazio` 1→3; surgimento de `conteudo-com-acesso-dinamico` 0→2; `dependencias-externas-nao-permitidas` 1→0. |
| **Conclusão honesta** | O #602 melhorou a caracterização determinística, mas a coleta runtime real pós-#602 **ainda não produziu nenhum `eligible`**. Hipótese principal: o empacotamento real do Construtor adiciona metadados internos seguros (`README.md`, `manifest.json`, logs) ou prende arquivos em `content.md`, causando bloqueios por `arquivo-fora-da-allowlist`, `multifile-body-vazio`, `conteudo-com-acesso-dinamico` e `entrypoint-nao-permitido`. |
| **Próximo passo recomendado** | Auditoria técnica específica para decidir como tratar arquivos internos seguros do Construtor (ex.: `README.md`/`manifest.json`/logs) e o aprisionamento em `content.md`, **sem relaxar o contrato de execução** e **sem expandir allowlist** neste PR. |
| **Confirmações de escopo** | Não altera `src/`; não altera `api/`; não ativa WebContainer; não reativa `executeArtifact`; não expande allowlist; não altera reader/contratos/parser/empacotamento; não mexe em dependências; não registra payload bruto; não inclui código completo dos artefatos; sem refactor. |
| **Arquivos alterados** | `CHECKLIST.md`. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-10 — docs(construtor): auditoria pós-#602 (coleta diagnóstica verdict-only sem runtime real no CI)

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(construtor): registrar auditoria verdict-only pós-#602 com lacuna explícita de telemetria runtime real` |
| **Base pós-#602 (referência fixa)** | `origin/main = efedd5a1a4180dac28551881a78798a63d5ab3bb` (`feat(construtor): contrato dedicado de elegibilidade diagnóstica para artefatos estáticos client-side`, PR #602). |
| **Objetivo da etapa** | Confirmar, com evidência disponível no ambiente atual, se a trilha estática dedicada (`stage: "static-contract"`) melhora a elegibilidade no diagnóstico verdict-only do Construtor. |
| **Natureza da entrega** | Auditoria/medição + documentação. Sem implementação funcional, sem ativar WebContainer, sem reativar `executeArtifact` server-side, sem payload bruto. |
| **Inspeção de caminhos reais** | Reader: `src/lib/construtor/constructorApprovedPreviewDiagnosticReader.js`; contrato estático: `src/lib/construtor/constructorStaticClientArtifactContract.js`; gate de telemetria: `src/lib/construtor/constructorTelemetryDiagnosticGate.js`; wiring/UI gated: `src/pages/HybridAgentSimple.jsx`. |
| **Evidência possível neste ambiente (caracterização determinística)** | Testes existentes executados: `src/lib/construtor/__tests__/constructorApprovedPreviewDiagnosticReader.test.js` e `src/lib/construtor/__tests__/constructorStaticClientArtifactContract.test.js` (32/32 verde). Casos mínimos verificados (verdict-only): (1) `index.html + styles.css/style.css + script.js` ⇒ `eligible`, `stage: "static-contract"`; (2) `content.md` (incluindo marcador textual de arquivo) ⇒ `unavailable` (`arquivo-fora-da-allowlist`); (3) Express/dependência externa ⇒ `unavailable` (`dependencias-externas-nao-permitidas`); (4) `index.js` puro ⇒ `eligible`; (5) `index.js + lib/helpers.js` ⇒ `eligible`. |
| **Telemetria runtime real via `?constructorTelemetry=1`** | **Não coletada neste CI/sandbox headless**. Motivo: esta coleta depende de fluxo DEV real no navegador, sessão assistida/autenticada e geração real via Serginho/providers; isso não foi reproduzível de forma confiável neste ambiente sem fabricar dados. |
| **Consolidação (apenas do que foi de fato verificado)** | **Caracterização determinística (5 casos):** `total=5`, `eligible=3`, `unavailable=2`; `byReason={"arquivo-fora-da-allowlist":1,"dependencias-externas-nao-permitidas":1}`; `byStatus={"constructor-approved-preview-diagnostic-reader: eligible":3,"constructor-approved-preview-diagnostic-reader: unavailable":2}`; `byStage={"static-contract":1,"builder":4}`. |
| **Flags de segurança/invariantes (verdict-only)** | Mantidas nos resultados observados/testados: `rawPayloadAccessed: false`, `apiUsed: false`, `storageUsed: false`, `executeArtifactServerSide: "disabled"`. |
| **Comparação explícita com a baseline do PR #600** | **#600 (runtime real manual histórico):** `0 eligible / 10 unavailable`, `byReason={"entrypoint-nao-permitido":6,"dependencias-externas-nao-permitidas":1,"multifile-body-vazio":1,"arquivo-fora-da-allowlist":2}`. **Pós-#602 nesta PR/CI:** evidência determinística positiva para estáticos (`stage: "static-contract"`), mas **sem qualquer nova amostragem runtime real via \`?constructorTelemetry=1\` (incluindo lote de 10 casos)**. |
| **Conclusão objetiva** | Há sinal técnico consistente de melhoria na elegibilidade de estáticos na caracterização determinística; porém isso **não equivale** à coleta runtime real do #600. Portanto, ainda **falta evidência runtime real assistida** antes de concluir suficiência para avançar com expansão controlada de allowlist. |
| **Próximo passo recomendado** | Executar coleta manual assistida em DEV real com `?constructorTelemetry=1` (10+ amostras reais), registrar somente verdict-only e então reavaliar expansão controlada de allowlist com base em evidência runtime. |
| **Confirmações de escopo** | Não altera `api/`; não ativa WebContainer; não reativa `executeArtifact`; não relaxa `webcontainerArtifactContract.js`; não expande allowlist; não altera lógica funcional do reader; sem bypass ao Serginho; sem payload bruto em doc/telemetria. |
| **Arquivos alterados** | `CHECKLIST.md`. |
| **Validações executadas** | Baseline: `npm test -- --runInBand` (96 suites / 2913 testes, verde) e `npm run build` (verde). Evidência direcionada: `npm test -- --runInBand src/lib/construtor/__tests__/constructorApprovedPreviewDiagnosticReader.test.js src/lib/construtor/__tests__/constructorStaticClientArtifactContract.test.js` (verde). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-10 — feat(construtor): contrato dedicado de elegibilidade diagnóstica para artefatos estáticos client-side (PR #602)

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): contrato dedicado de elegibilidade diagnóstica para artefatos estáticos client-side (PR #602)` |
| **Base confirmada pós-#601** | `origin/main = 73b2ebdb31e967ee7c1368381205700b6d92b7ca` (`test(construtor): caracterizar contrato de entrypoint/allowlist no reader (PR #601)`). |
| **Objetivo** | Tornar elegíveis, no diagnóstico verdict-only, artefatos estáticos client-side seguros (`index.html`/CSS/JS) sem executar nada e sem relaxar o contrato compartilhado do WebContainer. |
| **Decisão arquitetural** | Criar contrato dedicado estático (`constructorStaticClientArtifactContract.js`) e fazer o reader tentar a trilha estática quando `entrypoint` é `index.html`; para demais casos, manter fallback integral na cadeia compartilhada existente. |
| **Arquivos alterados** | `src/lib/construtor/constructorStaticClientArtifactContract.js`; `src/lib/construtor/constructorApprovedPreviewDiagnosticReader.js`; `src/lib/construtor/__tests__/constructorStaticClientArtifactContract.test.js`; `src/lib/construtor/__tests__/constructorApprovedPreviewDiagnosticReader.test.js`; `src/lib/construtor/__tests__/constructorInMemoryPreviewSnapshotAdapter.test.js`; `src/lib/construtor/__tests__/constructorRealPreviewDiagnosticObservation.test.js`; `CHECKLIST.md`. |
| **Contrato estático criado/ajustado** | Novo contrato estrito com allowlist dedicada (`index.html`, `styles.css`, `style.css`, `script.js`, `assets/*.css`, `assets/*.js`), `index.html` obrigatório, bloqueio de caminhos perigosos/dotfiles/lockfiles e validação de conteúdo reaproveitando `validateArtifactContent` (incluindo padrões proibidos de rede/segredos). |
| **Testes adicionados/ajustados** | Novo arquivo `constructorStaticClientArtifactContract.test.js` (casos de aceite/bloqueio) e atualização do reader para cobrir casos A–I: estáticos elegíveis, JS legado preservado, Express bloqueado, caminho perigoso/dotfile bloqueados e `content.md` permanecendo `unavailable`. |
| **Comportamento antes/depois** | Antes: HTML/CSS/JS estático caía em `unavailable` (`entrypoint-nao-permitido`). Depois: estático seguro com `index.html` passa em `eligible` (`stage: static-contract`); `index.js` e `index.js + lib/helpers.js` continuam `eligible`; dependências externas e arquivos fora de contrato continuam bloqueados. |
| **Validações executadas** | Direcionados: `npm test -- --runInBand src/lib/construtor/__tests__/constructorStaticClientArtifactContract.test.js src/lib/construtor/__tests__/constructorApprovedPreviewDiagnosticReader.test.js src/lib/construtor/__tests__/constructorInMemoryPreviewSnapshotAdapter.test.js src/lib/construtor/__tests__/constructorRealPreviewDiagnosticObservation.test.js` (verde). Finais: `git diff --name-only origin/main...HEAD` (somente 7 arquivos de escopo), `git diff --check origin/main...HEAD` (ok), `npm test` (96 suites / 2913 testes, verde), `npm run build` (verde). |
| **Riscos** | Baixo a moderado: nova trilha estática no reader pode alterar stage/razão de alguns cenários com `entrypoint=index.html`; mitigado por testes dedicados e fallback preservado para trilha `index.js`. |
| **Rollback** | `git revert <commit-sha>` |
| **Próximo passo recomendado** | Em PR futuro, avaliar expansão controlada da allowlist estática (ex.: mais assets) somente com novos testes e sem tocar contrato compartilhado do WebContainer. |

---

## 2026-06-10 — test(construtor): caracterizar contrato/reader/allowlist de entrypoint no diagnóstico do PR #601

| Item | Detalhe |
|------|---------|
| **Título do PR** | `test(construtor): caracterizar contrato/reader/allowlist de entrypoint no diagnóstico do PR #601` |
| **Base confirmada pós-#600** | `origin/main = ea4f47e2fd68fd2192b3461a91a3f7c0b2c4ad32` (`docs(construtor): registrar coleta real da telemetria verdict-only via ?constructorTelemetry=1 (#600)`). |
| **Objetivo** | Auditar o reader/cadeia de contrato e ajustar minimamente com testes de caracterização dos casos reais A–E sem criar execução real. |
| **Causa técnica identificada** | `entrypoint-nao-permitido` vem de `approvedConstructorArtifactContract.js` (entrypoint fixo `index.js`); `arquivo-fora-da-allowlist` e `dependencias-externas-nao-permitidas` vêm de `webcontainerArtifactContract.js`; `multifile-body-vazio` vem de `constructorMultiFileContentParser.js`. |
| **Decisão de escopo** | Sem correção especulativa de allowlist/entrypoint compartilhados com WebContainer neste PR; mantida somente caracterização no reader (`verdict-only`). |
| **Arquivos alterados** | `src/lib/construtor/__tests__/constructorApprovedPreviewDiagnosticReader.test.js`; `CHECKLIST.md`. |
| **Testes adicionados/ajustados** | Novos testes de caracterização PR #601 no reader para casos A–E: HTML/CSS/JS (`entrypoint-nao-permitido`), JS puro (`eligible`), JS+`lib/helpers.js` (`eligible`), Express com dependência externa (`dependencias-externas-nao-permitidas`), conteúdo preso em `content.md` (`arquivo-fora-da-allowlist`). |
| **Comportamento antes/depois** | Antes: cadeia já retornava `unavailable` para HTML/CSS/JS e `eligible` para shape `index.js` allowlistado. Depois: comportamento permanece igual, agora com cobertura explícita A–E e diagnóstico documentado. |
| **Validações executadas** | `git diff --name-only origin/main...HEAD`; `git diff --check origin/main...HEAD`; `npm test`; `npm run build`. |
| **Riscos** | Baixo: alteração somente em testes/documentação. Risco residual é arquitetural (suporte formal a artefato estático HTML/CSS/JS exige decisão separada do contrato compartilhado). |
| **Rollback** | `git revert <commit-sha>` |
| **Próximo passo recomendado** | Definir arquiteturalmente um contrato dedicado para artefatos estáticos client-side (sem relaxar globalmente o contrato compartilhado do WebContainer) e depois implementar em PR próprio. |

---

## 2026-06-09 — docs(construtor): registrar coleta real da telemetria verdict-only via ?constructorTelemetry=1

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(construtor): registrar coleta real da telemetria verdict-only via ?constructorTelemetry=1` |
| **Base confirmada pós-#599** | `origin/main = 029013449d9d9f652d2f1c3806c7a3404f8766e5`. |
| **Objetivo** | Registrar números reais da telemetria verdict-only do Construtor coletados manualmente via #599. |
| **Número de amostras reais** | 10. |
| **Resultado final** | 0 `eligible` / 10 `unavailable` (0% / 100%). |
| **byReason final** | `{"entrypoint-nao-permitido":6,"dependencias-externas-nao-permitidas":1,"multifile-body-vazio":1,"arquivo-fora-da-allowlist":2}` |
| **byStatus final** | `{"constructor-approved-preview-diagnostic-reader:unavailable":10}` |
| **Conclusão** | Coleta real confirmou 0% `eligible` e 100% `unavailable`; motivo dominante `entrypoint-nao-permitido`; o Construtor gera artefatos completos e ZIP válido, mas o diagnóstico ainda classifica tudo como não executável; isso bloqueia WebContainer real por enquanto. |
| **Próximo passo recomendado** | Auditoria/correção mínima do contrato/reader/allowlist de entrypoint (provável #601 deve investigar por que artefatos com `index.html`, `index.js` e `lib/helpers.js` continuam `unavailable`). Não seguir para WebContainer, UI pública ou handoff ainda. |
| **Confirmações de escopo** | PR exclusivamente documental; não altera `src/`; não altera `api/`; não cria API/storage/execução/UI; não toca WebContainer/handoff/`mountTree`; não altera prompt/geração; contratos #581–#599 preservados; sem payload bruto registrado; Dependabot fora de escopo; `executeArtifact` server-side permanece desativado. |
| **Arquivos alterados** | `docs/telemetria-construtor-amostragem-dev.md`; `CHECKLIST.md`. |
| **Validações** | `git diff --name-only origin/main...HEAD` (deve listar exatamente os 2 arquivos); `git diff --check origin/main...HEAD` (ok); `npm test` (verde); `npm run build` (verde). |
| **Rollback** | `git revert <commit-sha>` (não executar agora; apenas registrar). |

---

## 2026-06-09 — feat(construtor): visualização diagnóstica controlada da telemetria verdict-only via URL

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): visualização diagnóstica controlada da telemetria verdict-only via URL` |
| **Base confirmada pós-#598** | `origin/main = 713d4d55249ebea693c9c254485db32bff9c58cf`. |
| **Objetivo** | Exibir diagnóstico técnico verdict-only da telemetria real do Construtor (`total`, `eligible`, `unavailable`, `byReason`, `byStatus`) somente para coleta assistida quando habilitado explicitamente por URL. |
| **Gate obrigatório por URL** | Visualização habilitada apenas com `?constructorTelemetry=1` (ou `&constructorTelemetry=1`); sem o parâmetro a UI permanece inalterada. |
| **Confirmações de escopo** | Oculto por padrão; mostra apenas telemetria verdict-only; não expõe payload bruto; não cria API; não usa storage; não reativa execução; não usa WebContainer; não cria handoff; não gera `mountTree`; não altera geração/prompt; contratos #581–#598 preservados. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/constructorTelemetryDiagnosticGate.js`; `src/lib/construtor/__tests__/constructorTelemetryDiagnosticGate.test.js`; `src/pages/HybridAgentSimple.jsx`. |
| **Validações executadas** | `npm test` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok — exatamente os 4 arquivos permitidos). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-09 — docs(construtor): runbook de coleta orientada da telemetria verdict-only em DEV

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(construtor): runbook de coleta orientada da telemetria verdict-only em DEV` |
| **Base confirmada pós-#597** | `origin/main = 6f6f74ba24a44f09c4e03aee90c2f3ba7c1de2c2`. |
| **Objetivo** | Definir runbook para coletar amostras reais da telemetria DEV verdict-only do Construtor e orientar decisão do #599 com evidência. |
| **Natureza da entrega** | Medição/documentação apenas. |
| **Confirmações de escopo** | Não altera código de produção; não cria UI; não cria API; não cria storage; não executa WebContainer; não cria handoff; não gera `mountTree`; não mexe em geração/prompt; Dependabot fora de escopo. |
| **Coleta real neste ambiente** | Não executada; documento preparado para execução manual/assistida. |
| **Arquivos alterados** | `docs/telemetria-construtor-amostragem-dev.md`; `CHECKLIST.md`. |
| **Validações executadas** | `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok — exatamente os 2 arquivos permitidos); `npm test` (ok); `npm run build` (ok). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-09 — feat(construtor): expor telemetria verdict-only do diagnóstico real apenas em desenvolvimento

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): expor telemetria verdict-only do diagnóstico real apenas em desenvolvimento` |
| **Base confirmada pós-#596** | `origin/main = 841c4179c9e36190472bd789c2bb7557cffda85a`. |
| **Objetivo** | Expor, somente em modo desenvolvimento, o snapshot da telemetria verdict-only do diagnóstico real via `console.debug`, sem alterar comportamento público. |
| **Relatório técnico (somente DEV)** | Em `import.meta.env.DEV`, após registrar o diagnóstico real no fluxo de preview, gera linha técnica segura com totais e agregados (`total`, `eligible`, `unavailable`, `byReason`, `byStatus`). |
| **Fonte de dados permitida** | Apenas `snapshot()` da telemetria interna em memória (#596), mantendo formato verdict-only. |
| **Confirmações de segurança/escopo** | Sem UI pública; sem API nova; sem storage; sem execução; sem WebContainer; sem handoff; sem `mountTree`; sem payload bruto; `executeArtifact` server-side permanece desativado; contratos #581–#596 preservados. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/constructorRealPreviewDiagnosticTelemetryDevReport.js`; `src/lib/construtor/__tests__/constructorRealPreviewDiagnosticTelemetryDevReport.test.js`; `src/pages/HybridAgentSimple.jsx`. |
| **Validações executadas** | `npm test` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok — exatamente os 4 arquivos permitidos). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-09 — feat(construtor): telemetria interna verdict-only da taxa eligible/unavailable do diagnóstico real

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): telemetria interna verdict-only da taxa eligible/unavailable do diagnóstico real` |
| **Base confirmada pós-#595** | `origin/main = 2b3a1ef0d3daf39ae837cb47103f919c6c8a2b69`. |
| **Objetivo** | Agregar, em memória e sem alterar comportamento visível, os verdicts reais (`eligible`/`unavailable`) já produzidos no fluxo observacional do Construtor para medir total, distribuição por verdict, por `reason` e por `status`. |
| **Telemetria interna (in-memory)** | Novo agregador puro com `record(verdictResult)` e `snapshot()` contando somente `verdict`, `reason` e `status` permitidos, sem retenção de payload bruto. |
| **Wiring mínimo em runtime** | `src/pages/HybridAgentSimple.jsx`: no `try/catch` existente do sucesso de `handleGeneratePreview`, após observar e armazenar em `realPreviewDiagnosticsRef`, registra o resultado na telemetria (`realPreviewDiagnosticsTelemetryRef.current.record(...)`) sem renderização adicional. |
| **Confirmações** | Sem UI nova; sem API nova; sem storage novo; sem execução real; sem WebContainer/handoff/`mountTree`; sem uso de payload bruto (`rawContent`, `fileContents`, `contentPreview`, `zipBase64`, `agentMessage`, `artifact`, `files`) no agregado; contratos #581–#595 preservados; `executeArtifact` server-side permanece `disabled`; sem bypass ao Serginho. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/constructorRealPreviewDiagnosticTelemetry.js`; `src/lib/construtor/__tests__/constructorRealPreviewDiagnosticTelemetry.test.js`; `src/pages/HybridAgentSimple.jsx`. |
| **Validações executadas** | `npm test` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok — exatamente os 4 arquivos permitidos). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-09 — feat(construtor): wiring observacional read-only do diagnóstico real no fluxo do Construtor

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): wiring observacional read-only do diagnóstico real no fluxo do Construtor` |
| **Base confirmada pós-#594** | `origin/main = 2a1c0ad97002ae41b6041e9b6cc16f390e969d1b`. |
| **Objetivo** | Conectar o diagnóstico verdict-only ao fluxo real de preview (`POST /api/artifact-preview`) usando somente `preview.summary.fileContents`, `preview.summary.id`, `preview.summary.version` e `entrypoint` inferido apenas por `fileContents`, sem UI e sem execução. |
| **Ponto de wiring em runtime** | `src/pages/HybridAgentSimple.jsx`: no sucesso de `handleGeneratePreview` (`data.success && data.preview`), a observação roda dentro de `try/catch` (falha observacional não quebra preview), chama `observeConstructorRealPreviewDiagnostic(data.preview)` e armazena o resultado em `realPreviewDiagnosticsRef` (somente observacional local, sem renderização). |
| **Retorno do diagnóstico** | Permanece verdict-only via adaptador #594 (`eligible/unavailable`), sem expor payload bruto. |
| **Confirmações** | Sem UI nova; sem execução real; sem API nova; sem storage novo; sem uso de `preview.summary.files`, `preview.summary.entrypoint`, `contentPreview`, `zipBase64`, `agentMessage.content`, `delivery` ou payload bruto para o diagnóstico; contratos #581–#594 intactos; `executeArtifact` server-side permanece `disabled`; sem bypass ao Serginho; Dependabot fora de escopo. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/constructorRealPreviewDiagnosticObservation.js`; `src/lib/construtor/__tests__/constructorRealPreviewDiagnosticObservation.test.js`; `src/pages/HybridAgentSimple.jsx`. |
| **Validações executadas** | `npm test` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-09 — feat(construtor): adaptador puro de preview em memória para snapshot read-only

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): adaptador puro de preview em memória para snapshot read-only` |
| **Base confirmada pós-#593** | `origin/main = 147e2fc7887b2a457babc0cf7463fcf1589036ed`. |
| **Objetivo** | Adaptador puro que reserializa `fileContents` em memória → `rawContent` multi-file e delega ao leitor #593, retornando diagnóstico verdict-only. |
| **Por que é preparação estrutural** | Fecha a ponte entre preview real em memória e o leitor verdict-only sem wiring/UI; com a fonte real atual, diagnósticos seguem majoritariamente `unavailable`. |
| **Retorno** | Verdict-only, sem expor payload bruto (`rawContent`/`fileContents`/`artifact`/`files`/`contentPreview`/`zipBase64`/`agentMessage`). |
| **Confirmações** | Não usa `agentMessage.content`, `contentPreview`, `zipBase64`; sem UI; sem `api/`; sem `HybridAgentSimple.jsx`; sem alterar contratos #581–#593; sem handoff #582; sem WebContainer; sem `mountTree`; sem `fetch`/`/api/`/`sessionStorage`/`localStorage`; `executeArtifact` server-side permanece `disabled`; sem bypass ao Serginho; Dependabot fora de escopo. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/constructorInMemoryPreviewSnapshotAdapter.js`; `src/lib/construtor/__tests__/constructorInMemoryPreviewSnapshotAdapter.test.js`. |
| **Validações executadas** | `npm test` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok — exatamente 3 arquivos). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-09 — feat(construtor): leitor puro read-only de diagnóstico de preview aprovado

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): leitor puro read-only de diagnóstico de preview aprovado` |
| **Base confirmada pós-#592** | `origin/main = 07e8d3493f88f0c32dc96e39d7caa38e8a4d1d6a` (`feat(construtor): derivador puro de diagnóstico parser→builder (#592)`). |
| **Objetivo** | Criar leitor puro read-only que consome o derivador #592 e retorna diagnóstico verdict-only (`eligible`/`unavailable`) a partir de snapshot explícito. |
| **Por que é preparação estrutural** | Define a fronteira segura de consumo antes de qualquer UI/wiring; com a fonte real atual, diagnósticos seguem majoritariamente `unavailable`. |
| **Retorno** | Verdict-only, sem expor payload bruto (`rawContent`/`artifact`/`files`). |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/constructorApprovedPreviewDiagnosticReader.js`; `src/lib/construtor/__tests__/constructorApprovedPreviewDiagnosticReader.test.js`. |
| **Confirmações** | Sem UI; sem `api/`; sem `HybridAgentSimple.jsx`; sem alterar contratos #581–#592; sem handoff #582; sem WebContainer; sem `mountTree`; sem `fetch`/`/api/`/`sessionStorage`/`localStorage`/`zipBase64`/`contentPreview`; `executeArtifact` server-side permanece `disabled`; sem bypass ao Serginho; Dependabot fora de escopo. |
| **Validações executadas** | `npm test` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok — exatamente 3 arquivos). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-08 — feat(construtor): derivador puro de diagnóstico parser→builder

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): derivador puro de diagnóstico parser→builder` |
| **Base confirmada pós-#591** | `origin/main = 0ec292e784afd70db88c34f435f813f5521449a4` (`docs(apresentação): corrigir badge de CI do README para workflow real test.yml (#591)`). |
| **Objetivo** | Compor `#590 → #589` em um derivador puro de diagnóstico `eligible/unavailable`, sem UI e sem execução. |
| **Por que é preparação estrutural** | Fecha a lacuna de composição parser→builder sem avanço funcional visível; com fonte real atual, diagnósticos seguem majoritariamente `unavailable`. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/constructorMultiFileApprovedPreviewDerivation.js`; `src/lib/construtor/__tests__/constructorMultiFileApprovedPreviewDerivation.test.js`. |
| **Confirmações** | Sem UI; sem `api/`; sem `HybridAgentSimple.jsx`; sem alterar contratos #581–#590; sem handoff #582; sem WebContainer; sem `mountTree`; sem `fetch`/`/api/`/`sessionStorage`/`localStorage`/`zipBase64`/`contentPreview`; `executeArtifact` server-side permanece `disabled`; sem bypass ao Serginho; Dependabot fora de escopo. |
| **Validações executadas** | `npm test` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok — exatamente 3 arquivos). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-08 — feat(construtor): extrair parser puro de conteúdo multi-file para files estruturados

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): extrair parser puro de conteúdo multi-file para files estruturados` |
| **Base confirmada pós-#589** | `origin/main = 119748836bf02bde90380317fe401ed67a1e19ad` (`feat(construtor): add pure structured-files → previewSummary builder gated by selector #586 (#589)`). |
| **Objetivo do PR** | Extrair parser puro/testável de texto multi-file do Construtor para `files: [{ name, body }]`, sem wiring no fluxo real. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/constructorMultiFileContentParser.js`; `src/lib/construtor/__tests__/constructorMultiFileContentParser.test.js`. |
| **Confirmação de `HybridAgentSimple.jsx`** | `src/pages/HybridAgentSimple.jsx` **não foi alterado**. |
| **Confirmação de `api/`** | Nenhum arquivo em `api/` foi tocado. |
| **Confirmação de execução real** | Sem execução real nova; `executeArtifact` server-side permanece desativado (`executeArtifactServerSide: "disabled"`). |
| **Builder/selector/handoff em runtime** | Parser não chama builder #589, selector #586 nem handoff #582 em runtime; downstream é provado apenas em testes. |
| **Rótulo/status do parser** | `status` permanece `constructor-multifile-parser: parsed` (somente parse estrutural) e `sourceType` foi ajustado para `constructor-multifile-structured-content-source`, sem sugerir aprovação/elegibilidade final. |
| **Confirmação de `mountTree`** | Parser não gera `mountTree` e não chama `mountTree`. |
| **Shape documental downstream** | `content.md`/`index.html` continuam `unavailable` downstream no builder (reason: `arquivo-fora-da-allowlist`). |
| **Shape allowlistado downstream** | Shape futuro `index.js` + `lib/sum.js` parseado pode chegar a `eligible` downstream no builder #589. |
| **Decisão de diretório de testes** | Teste criado em `src/lib/construtor/__tests__/` (convenção real descoberta pelo Jest), sem criar pasta `tests/`. |
| **Validações executadas** | `npm test` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok — exatamente 3 arquivos permitidos). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-08 — feat(construtor): builder puro de arquivos estruturados para previewSummary client-safe

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): builder puro de arquivos estruturados para previewSummary client-safe` |
| **Objetivo do PR** | Criar builder puro/testável `files[] -> previewSummary` e delegar elegibilidade final ao selector #586, sem execução real. |
| **Base confirmada pós-#588** | `origin/main = 933987bbebc029134534c2704a59ed77a9df96b8` (`docs(spike): registrar no CHECKLIST a incorporação do CAMINHO B controlado do PR #587 (#588)`). |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/constructorApprovedPreviewSummaryBuilder.js`; `src/lib/construtor/__tests__/constructorApprovedPreviewSummaryBuilder.test.js`. |
| **Confirmação de builder puro** | Função recebe input explícito, transforma `files[]` em `fileContents` e delega gate ao selector #586. |
| **Confirmação de `HybridAgentSimple.jsx`** | `src/pages/HybridAgentSimple.jsx` **não foi alterado**. |
| **Confirmação de `api/`/backend** | Nenhum arquivo em `api/` alterado; sem endpoint, migration ou alteração de backend. |
| **Confirmação de storage/API/WebContainer/handoff** | Não chama `fetch`/`/api/`; não acessa `sessionStorage`/`localStorage`; não chama `WebContainer.boot`; não chama `approvedConstructorArtifactHandoff` nem `prepareApprovedConstructorArtifactForWebContainer`. |
| **Confirmação de execução real** | Não chama `executeArtifact`; `executeArtifact` server-side permanece desativado (`executeArtifactServerSide: "disabled"`). |
| **Confirmação de `mountTree`** | Não gera `mountTree` no retorno e não executa `mountTree`. |
| **Estado do shape documental atual** | Continua `unavailable` (`content.md`/`index.html` fora da allowlist oficial). |
| **Estado do shape futuro allowlistado** | Pode retornar `eligible` para shape client-safe allowlistado (`index.js` + `lib/*.js`) após gate do selector #586. |
| **Validações executadas** | `npm test` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-08 — docs(spike): registrar incorporação do CAMINHO B controlado no WebContainer spike (#587)

| Item | Detalhe |
|------|---------|
| **Título do PR** | `CAMINHO B: bridge de fixture aprovado controlado com runtime confiável para execução client-side auditável no WebContainer spike` |
| **PR relacionado** | #587 |
| **Base confirmada** | `origin/main = 93937a41dcafeaed7255a8e8c4a8d7399ff440e0` (`CAMINHO B: bridge de fixture aprovado controlado com runtime confiável para execução client-side auditável no WebContainer spike (#587)`). |
| **Objetivo do PR #587** | Demonstrar execução client-side auditável no WebContainer spike usando fonte aprovada controlada por fixture, passando pela cadeia `#586 → #585 → #584 → #583 → #581 → #582`. |
| **Natureza** | Avanço funcional real dentro do spike, ainda com fixture controlado (não é apenas preparação estrutural). |
| **Confirmação de fonte controlada** | Execução usa `controlled-approved-fixture`; **não** é artefato real aprovado do Construtor. |
| **Confirmação de `HybridAgentSimple.jsx`** | `src/pages/HybridAgentSimple.jsx` **não foi alterado** no #587. |
| **Confirmação de `api/`** | Nenhum arquivo em `api/` foi tocado e não há chamada `/api/` no novo caminho. |
| **Confirmação de backend/endpoint/migration** | Sem endpoint novo, sem migration e sem alteração de backend. |
| **Confirmação de `executeArtifact`** | `executeArtifact` server-side permanece desativado (`executeArtifactServerSide: "disabled"`). |
| **Confirmação de hardening do runner** | `webcontainerSpikeRunner.js` foi endurecido para aceitar apenas `approvedRuntimeInput` confiável (marcado por Symbol interno da bridge controlada); entradas arbitrárias de `mountTree`/`entrypoint` são ignoradas, com fallback preservado para `CONTROLLED_ARTIFACT_SANITIZED`. |
| **Confirmação de status público seguro** | Status público não expõe `mountTree`, source code bruto nem payload sensível (`content`, `contentPreview`, `zipBase64`, `user_email`, secrets, tokens). |
| **Cadeia preservada** | `previewSummary controlado → selector #586 → snapshot #585 → mapper #584 → source gate #583 → contrato #581 → handoff #582 → mountTree sanitizado → WebContainer client-side`. |
| **Validações pós-merge observadas** | Test &amp; Coverage `success`; Coverage/`test` `success`; Vercel `success`; status combinado do commit `success`. |
| **Ressalva corrigida por este PR** | `CHECKLIST.md` não havia sido incorporado no merge do #587; este PR documental registra oficialmente o #587 para rastreabilidade. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-08 — feat(construtor): adicionar selector puro de preview aprovado para snapshot client-safe

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): adicionar selector puro de preview aprovado para snapshot client-safe` |
| **Objetivo do PR** | Adicionar selector puro/testável que recebe `previewSummary + decision`, monta input mínimo seguro e delega elegibilidade final ao helper #585, sem execução real. |
| **Base confirmada** | `origin/main = f8a60ec3c9747d28513a91c9e986202f23d859e3` (`feat(construtor): add client-safe in-memory approved artifact snapshot helper (#585)`). |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/constructorApprovedArtifactPreviewSelector.js`; `src/lib/construtor/__tests__/constructorApprovedArtifactPreviewSelector.test.js`. |
| **Confirmação de escopo** | Selector recebe argumentos explícitos (`previewSummary`, `decision`), não lê storage/global state e não chama API/backend/UI/runner. |
| **Confirmação de execução real** | Não há execução real; selector só valida estrutura mínima e delega para `buildConstructorApprovedArtifactMemorySnapshot` (#585). |
| **Confirmação de handoff #582 e mountTree** | Não importa/chama `approvedConstructorArtifactHandoff` e não gera `mountTree`. |
| **Confirmação de `api/` e backend** | Nenhum arquivo em `api/` alterado; sem endpoint, migration ou alteração de backend. |
| **Confirmação de `executeArtifact`** | `executeArtifact` server-side permanece desativado (`executeArtifactServerSide: "disabled"`). |
| **Confirmação de arquivos proibidos** | Sem alteração em `HybridAgentSimple.jsx`, `package.json`, `package-lock.json`, `vercel.json` e demais arquivos fora do escopo permitido. |
| **Estado do shape real atual** | Preview documental atual continua `unavailable` (ex.: `content.md`/`index.html` fora da allowlist). |
| **Estado do shape futuro** | Preview futuro allowlistado (`index.js` + `lib/*.js`) pode retornar `eligible` após delegação ao #585. |
| **Validações executadas** | `npm test` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-07 — feat(construtor): criar elo inicial de snapshot client-safe em memória

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): criar elo inicial de snapshot client-safe em memória` |
| **Objetivo do PR** | Criar helper puro/testável que recebe dados explícitos do Construtor, monta snapshot client-safe em memória e delega elegibilidade ao mapper #584 (gate #583 + contrato #581), sem execução real. |
| **Base confirmada** | `origin/main = 640cee1fe2cda1c4f3a6011a6e0688a276236f81` (`Map constructor in-memory snapshot to client-safe approved artifact source via #583 gate (#584)`). |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/constructorApprovedArtifactMemorySnapshot.js`; `src/lib/construtor/__tests__/constructorApprovedArtifactMemorySnapshot.test.js`. |
| **Confirmação de execução real** | Não há execução real; helper apenas valida/transforma em memória e delega ao mapper #584. |
| **Confirmação de handoff #582** | Não importa nem chama `approvedConstructorArtifactHandoff`. |
| **Confirmação de `mountTree`** | Não gera `mountTree` e não chama `mountTree`. |
| **Confirmação de `api/`** | Nenhum arquivo em `api/` foi alterado e não há chamada `/api/`. |
| **Confirmação de backend/migration/endpoint** | Sem alteração de backend; nenhum endpoint novo; nenhuma migration. |
| **Confirmação de `executeArtifact`** | `executeArtifact` server-side permanece desativado (`executeArtifactServerSide: "disabled"`). |
| **Integração com Construtor real** | `src/pages/HybridAgentSimple.jsx` **não foi alterado**; o fluxo real atual ainda depende de `sessionStorage`/`localStorage`/`/api/artifact-preview`/`agentMessage.content`/`zipBase64`, portanto permanece **NÃO ELEGÍVEL** (status efetivo: `unavailable`). |
| **Validações executadas** | `npm test -- --watch=false src/lib/construtor/__tests__/constructorApprovedArtifactMemorySnapshot.test.js` (ok); `npm test -- --watch=false` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-07 — feat(construtor): mapear snapshot em memória para source client-safe elegível

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): mapear snapshot em memória para source client-safe elegível` |
| **Objetivo do PR** | Criar mapper puro/testável que recebe snapshot explícito em memória do Construtor, delega elegibilidade ao gate oficial #583 e retorna status público seguro sem execução real. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/constructorApprovedArtifactSourceMapper.js`; `src/lib/construtor/__tests__/constructorApprovedArtifactSourceMapper.test.js`. |
| **Investigação do estado real do Construtor** | Em `src/pages/HybridAgentSimple.jsx`, o fluxo atual ainda depende de `sessionStorage`, `localStorage`, `/api/artifact-preview`, `agentMessage.content` e `zipBase64`; portanto permanece **NÃO ELEGÍVEL** como fonte client-safe real neste momento. |
| **Conclusão honesta** | Este PR entrega somente a camada pura de mapeamento para um snapshot client-safe futuro/seguro; **não há execução real** neste PR. |
| **Reuso obrigatório do #583** | Mapper delega decisão final para `buildApprovedConstructorArtifactFromSource` (`approvedConstructorArtifactSource.js`), preservando #583 como gate oficial e #581 como contrato final. |
| **Regras de elegibilidade cobertas** | Exige contrato aprovado (`id`, `version`, `approval.status=approved`, `entrypoint=index.js`, `files` plain object e paths allowlistados); rejeita payload bruto/sensível, storage/API/backend/`executeArtifact` e `agentMessage.content`. |
| **Confirmações de segurança e escopo** | Sem leitura de storage, sem `/api/`, sem handoff #582, sem `mountTree`, sem `WebContainer.boot`, sem `executeArtifact`; `executeArtifact` server-side permanece desativado; sem backend/endpoint/migration. |
| **Validações executadas** | `npm test -- --runInBand src/lib/construtor/__tests__/constructorApprovedArtifactSourceMapper.test.js` (ok); `npm test -- --runInBand` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-07 — feat(construtor): mapear fonte oficial client-safe de approved artifact

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): mapear fonte oficial client-safe de approved artifact` |
| **Objetivo do PR** | Criar helper puro/testável para inspecionar fonte de `Approved Constructor Artifact` no Construtor/Híbrido e marcar elegibilidade client-safe sem execução real. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/approvedConstructorArtifactSource.js`; `src/lib/construtor/__tests__/approvedConstructorArtifactSource.test.js`. |
| **Investigação client-safe oficial (8.5)** | No fluxo atual, a única trilha de preview real no Construtor usa `sessionStorage`, `agentMessage.content` e entrega com `zipBase64` em `HybridAgentSimple.jsx`; portanto **não elegível** como fonte oficial client-safe de approved artifact neste PR. |
| **Regras de elegibilidade aplicadas** | Exige objeto plain com `id`, `version`, `approval.status === approved`, `entrypoint === index.js`, `files` plain e allowlist oficial via contrato #581/#576; rejeita campos sensíveis e dependências de storage/API/backend/`executeArtifact`. |
| **Confirmação de contrato #581** | Helper reutiliza `validateApprovedConstructorArtifact` como verdade final e retorna artifact apenas quando `validateApprovedConstructorArtifact(...).ok === true`. |
| **Confirmação de ausência de execução real** | Não chama handoff, não gera `mountTree`, não chama `WebContainer.boot`, não chama `executeArtifact` e não altera runner/UI. |
| **Confirmação de `api/` e backend** | Nenhum arquivo em `api/` alterado; sem endpoint, migration ou backend novo. |
| **Validações executadas** | `npm test -- --watch=false src/lib/construtor/__tests__/approvedConstructorArtifactSource.test.js` (ok); `npm test -- --watch=false` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-07 — feat(construtor): preparar handoff client-safe de approved artifact para WebContainer

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): preparar handoff client-safe de approved artifact para WebContainer` |
| **Objetivo do PR** | Criar camada pura e testável de handoff client-safe (`contrato -> adapter -> sanitize -> mountTree`) para `Approved Constructor Artifact`, sem execução real neste PR. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/approvedConstructorArtifactHandoff.js`; `src/lib/construtor/__tests__/approvedConstructorArtifactHandoff.test.js`. |
| **Confirmação de handoff client-safe** | Fluxo implementado apenas com contrato #581 + adapter existente + sanitização existente, retornando status seguro e `mountTree` sanitizado. |
| **Confirmação de ausência de execução real** | Não há execução automática de artefato real, não há leitura de fonte real no client e não há boot de WebContainer neste handoff. |
| **Confirmação de `api/`** | Nenhum arquivo em `api/` foi alterado. |
| **Confirmação de `executeArtifact`** | `executeArtifact` server-side permanece desativado. |
| **Confirmação de storage/API/backend** | Sem `sessionStorage`, sem `localStorage`, sem chamada `/api/`, sem endpoint, sem migration e sem alteração de backend. |
| **Validações executadas** | `npm test -- --watch=false src/lib/construtor/__tests__/approvedConstructorArtifactHandoff.test.js` (ok); `npm test -- --watch=false` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-07 — feat(construtor): definir contrato client-safe de approved artifact

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): definir contrato client-safe de approved artifact` |
| **Objetivo do PR** | Definir contrato intermediário puro e testável para `Approved Constructor Artifact` client-safe, sem conectar execução real neste PR. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/approvedConstructorArtifactContract.js`; `src/lib/construtor/__tests__/approvedConstructorArtifactContract.test.js`. |
| **Confirmação de escopo client-side** | Mudança restrita à camada de contrato client-safe no Construtor/Híbrido; sem backend, sem endpoint e sem migration. |
| **Confirmação de ausência de execução real** | Contrato definido, mas fonte real de artifact aprovado continua indisponível no client e não é executada neste PR. |
| **Confirmação de `api/`** | Nenhum arquivo em `api/` foi alterado. |
| **Confirmação de `executeArtifact`** | `executeArtifact` server-side permanece desativado. |
| **Confirmação da preparação contratual** | PR prepara validação/normalização/status seguros para futuro approved artifact antes de adapter/sanitize/WebContainer. |
| **Validações executadas** | `npm test -- --watch=false src/lib/construtor/__tests__/approvedConstructorArtifactContract.test.js` (ok); `npm test -- --watch=false` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok); `git diff --name-only origin/main...HEAD` (ok). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-06 — feat(spike): preparar bridge segura (CAMINHO B) para artefato aprovado em `/webcontainer-spike`

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(spike): preparar bridge segura (CAMINHO B) para artefato aprovado em /webcontainer-spike` |
| **Objetivo do PR** | Preparar estrutura honesta e reversível de bridge para artefato aprovado do Construtor sem integração insegura, mantendo execução atual por fixture controlado. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/webcontainerSpikeEvidence.js`; `src/lib/construtor/__tests__/webcontainerSpikeEvidence.test.js`; `src/lib/construtor/__tests__/webcontainerConstructorArtifactAdapter.test.js`; `src/pages/WebContainerSpike.jsx`; `src/pages/__tests__/WebContainerSpike.test.jsx`. |
| **Confirmação de escopo client-side** | `/webcontainer-spike` continua client-side, sem boot automático e com execução apenas por clique explícito. |
| **Confirmação de ausência de api/backend/migration** | Nenhuma alteração em `api/`; nenhum endpoint novo; nenhuma migration; nenhum backend alterado. |
| **Confirmação de `executeArtifact`** | `executeArtifact` server-side permanece desativado. |
| **Caminho escolhido** | **CAMINHO B**: `approved-constructor-artifact: unavailable` por ausência de fonte client-side aprovada segura sem API/payload bruto. |
| **Confirmação de payload real/sensível** | UI e helper exibem apenas metadados seguros; sem `content`, `contentPreview`, `zipBase64`, `user_email`, secrets ou tokens. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-06 — feat(construtor): conectar candidate controlado ao contrato sanitizado WebContainer

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): conectar candidate controlado ao contrato sanitizado WebContainer` |
| **Objetivo do PR** | Criar ponte mínima e testável entre um candidate controlado do Construtor e o contrato sanitizado WebContainer, mantendo execução 100% client-side, manual e lazy. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/webcontainerConstructorArtifactAdapter.js`; `src/lib/construtor/webcontainerArtifactFixture.js`; `src/lib/construtor/__tests__/webcontainerConstructorArtifactAdapter.test.js`; `src/lib/construtor/__tests__/webcontainerArtifactContract.test.js`; `src/lib/construtor/__tests__/webcontainerSpikeRunner.test.js`. |
| **Confirmação de escopo client-side** | Runner permanece client-side com import dinâmico/lazy de `@webcontainer/api`, sem boot automático e com execução manual. |
| **Confirmação de ausência de api/backend/migration** | Nenhuma alteração em `api/`; nenhum endpoint novo; nenhuma migration; nenhum backend alterado. |
| **Confirmação de `executeArtifact`** | `executeArtifact` server-side permanece desativado e fora deste fluxo. |
| **Confirmação de candidate controlado** | Adapter puro converte objeto controlado (`id`, `version`, `entrypoint`, `manifest`, `files`) para candidate plano allowlistado antes da sanitização. |
| **Confirmação de payload real/sensível** | Sem payload real de usuário e com rejeição conservadora para `content`, `contentPreview`, `zipBase64`, `user_email` e campos sensíveis (`token/secret/...`). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-06 — feat(construtor): adicionar contrato sanitizado para artefato WebContainer

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): adicionar contrato sanitizado para artefato WebContainer` |
| **Objetivo do PR** | Criar camada incremental, pequena e reversível de contrato sanitizado entre artefatos do Construtor/Híbrido e WebContainer client-side, ainda usando fixture fixo/controlado. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/webcontainerArtifactContract.js`; `src/lib/construtor/webcontainerArtifactFixture.js`; `src/lib/construtor/webcontainerSpikeRunner.js`; `src/lib/construtor/__tests__/webcontainerArtifactContract.test.js`; `src/lib/construtor/__tests__/webcontainerSpikeRunner.test.js`. |
| **Contrato sanitizado criado** | Novo módulo puro valida candidato, aplica allowlist, rejeita caminhos/conteúdos proibidos e normaliza para a árvore aceita por `webcontainer.mount`. |
| **Allowlist aplicada** | Permitidos apenas `package.json`, `artifact-manifest.json`, `index.js` e arquivos `lib/*.js`. |
| **Payload proibido** | Rejeita traversal/absoluto/backslash, dotfiles, lockfiles, scripts de instalação, dependências externas, URLs/rede, tokens/secrets, `user_email`, `zipBase64`, `contentPreview`, payload bruto e comandos de shell. |
| **Confirmação de backend/API/endpoint/migration** | Nenhum arquivo em `api/` alterado; nenhum backend novo, endpoint novo ou migration criada. |
| **Confirmação de execução server-side** | Sem execução server-side; `executeArtifact` permanece desativado e o runner continua 100% client-side via WebContainer no navegador. |
| **Confirmação de payload real** | Fixture permanece fixo/controlado, sem dados reais de usuário e sem integração com geração real do Híbrido neste PR. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-06 — feat(construtor): executar artefato controlado via WebContainer client-side

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): executar artefato controlado via WebContainer client-side` |
| **Objetivo do PR** | Evoluir o spike pós-PR #574 para executar, no navegador, um artefato mínimo controlado multi-arquivo do Construtor/Híbrido via WebContainer, mantendo escopo experimental e reversível. |
| **Arquivos alterados** | `CHECKLIST.md`; `src/lib/construtor/webcontainerArtifactFixture.js`; `src/lib/construtor/webcontainerSpikeRunner.js`; `src/lib/construtor/__tests__/webcontainerSpikeRunner.test.js`; `src/pages/WebContainerSpike.jsx`; `src/pages/__tests__/WebContainerSpike.test.jsx`. |
| **Confirmação de escopo** | Entrega permanece spike experimental, não demo final de produção. Execução 100% client-side no WebContainer do navegador. |
| **Confirmação sobre `executeArtifact` e `api/`** | `executeArtifact` server-side permanece desativado e nenhum arquivo em `api/` foi alterado. |
| **Confirmação de backend/API/endpoint/migration** | Nenhum backend novo, nenhum endpoint novo e nenhuma migration criada. |
| **Confirmação de artefato controlado** | Fixture fixo multi-arquivo com `package.json`, `index.js`, `artifact-manifest.json` e `lib/sum.js`; sem dependências externas, sem rede, sem secrets e sem payload real de usuário. |
| **Confirmação de payload e dados de usuário** | Sem payload bruto, sem `user_email`, sem arquivos reais, sem `content`, sem `contentPreview`, sem `zipBase64` e sem dados reais de usuário. |
| **Confirmação de acionamento manual/lazy** | WebContainer roda apenas após clique explícito na rota `/webcontainer-spike`; import de `@webcontainer/api` permanece dinâmico/lazy via `await import(...)`. |
| **Confirmação de teardown** | `teardown()` permanece chamado no bloco `finally` do runner. |
| **Confirmação de ausência de `/api/`** | O fixture e a página não chamam `/api/...`; testes verificam ausência de chamadas a `/api/` no fluxo da página. |
| **Confirmação de COOP/COEP** | Sem COOP/COEP global novo; permanece a configuração isolada do spike herdada do PR #574. |
| **Validações executadas** | Baseline: `npm test -- --runInBand` (ok), `npm run build` (ok). Targeted: `npm test -- --runInBand src/lib/construtor/__tests__/webcontainerSpikeRunner.test.js src/pages/__tests__/WebContainerSpike.test.jsx` (ok). Final: `npm test`, `npm run build`, `git diff --check origin/main...HEAD` e `git diff --name-only origin/main...HEAD`. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-06 — feat(construtor): spike WebContainers para demo viva client-side

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): spike WebContainers para demo viva client-side` |
| **Objetivo do PR** | Validar, com spike funcional mínimo e reversível, a viabilidade de boot client-side de WebContainers no RKMMAX sem execução server-side. |
| **Arquivos alterados** | `CHECKLIST.md`; `package.json`; `package-lock.json`; `src/App.jsx`; `src/auth/AuthGate.jsx`; `src/lib/construtor/webcontainerSpikeRunner.js`; `src/lib/construtor/__tests__/webcontainerSpikeRunner.test.js`; `src/pages/WebContainerSpike.jsx`; `src/pages/WebContainerSpike.css`; `src/pages/__tests__/WebContainerSpike.test.jsx`; `vercel.json`. |
| **Confirmação de escopo** | Entrega é spike funcional técnico mínimo; não é a demo final de produção. |
| **Confirmação sobre `executeArtifact` e `api/`** | `executeArtifact` server-side permanece desativado e nenhum arquivo em `api/` foi alterado. |
| **Confirmação de backend/API/endpoint/migration** | Nenhum backend novo, nenhum endpoint novo e nenhuma migration criada. |
| **Confirmação de payload e dados de usuário** | Sem payload bruto, sem envio para backend e sem uso de conteúdo real de usuário. |
| **Confirmação de acionamento manual** | WebContainers roda apenas por clique explícito do usuário, com import dinâmico (`await import('@webcontainer/api')`) no helper. |
| **Correção de rota pública no Preview** | `AuthGate` passou a incluir `/webcontainer-spike` em `PUBLIC_ROUTES`, evitando redirecionamento para `/login` e permitindo hard-load direto da página experimental sem autenticação. |
| **COOP/COEP isolado no spike** | COOP/COEP aplicado apenas em `/webcontainer-spike` com `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: credentialless`; regra global `/(.*)` mantida intacta. `credentialless` foi escolhido para reduzir risco de quebra de recursos externos em relação a `require-corp`. |
| **Nota SPA + isolamento** | Como a app usa rewrite SPA catch-all para `index.html`, o isolamento por rota pode depender de navegação direta/hard-load; o spike detecta e reporta isso de forma explícita sem fingir sucesso. |
| **Licenciamento WebContainers** | Uso aqui é POC/spike técnico, não uso comercial em produção; eventual exigência de licença comercial StackBlitz fica como pendência humana antes de produção. |
| **Validações executadas** | `npm install --legacy-peer-deps` (ok); `npm install --legacy-peer-deps @webcontainer/api` (ok); `npm test` (ok); `npm run build` (ok); `git diff --check origin/main...HEAD` (ok, sem erros de whitespace); `git diff --name-only origin/main...HEAD` (executado). |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-05 — docs(observability): F15-06 encerrar formalmente a Fase 15

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(observability): F15-06 encerrar formalmente a Fase 15` |
| **Objetivo F15-06** | Registrar formalmente o encerramento da Fase 15, consolidando F15-01 a F15-05 como trilha documental completa de governança de segurança e privacidade observacional, sem alteração funcional. |
| **Documento criado** | `docs/audits/f15-06-encerramento-formal-fase15-governanca-observacional-2026-06-05.md` |
| **Confirmação de encerramento formal da Fase 15** | Fase 15 encerrada formalmente no escopo documental de governança de segurança e privacidade observacional. |
| **Consolidação F15-01 a F15-05** | Consolidado: abertura formal, matriz documental de risco, política de payload permitido/proibido, revisão narrativa sem overclaim e validação documental da governança observacional. |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a `CHECKLIST.md` e ao documento de auditoria F15-06, sem implementação funcional. |
| **Confirmação de ausência de alteração funcional** | Sem alteração funcional; sem runtime novo, sem execução, sem sandbox real e sem decisão funcional automática. |
| **Confirmação de ausência de backend/API/migration** | Sem backend novo, sem endpoint novo, sem alteração em `api/` e sem migration em `supabase/migrations/`. |
| **Confirmação de ausência de UI funcional nova** | Não houve UI funcional nova; entrega restrita ao encerramento documental F15-06. |
| **Confirmação de payload permitido/proibido preservado** | Permitidos apenas metadados seguros (`status`, contagens, timestamps, `artifactId`, `traceId`, checksum flags, timeline segura, warnings, limitations, `hasFeedback` booleano e resumo estrutural seguro); proibidos payload bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email`, feedback bruto, segredos/tokens e payload de execução. |
| **Confirmação de limites sem overclaim** | Sem promessa de execução real, sandbox real, restauração funcional, time-travel funcional, prova criptográfica completa, auditoria externa, SLA, segurança absoluta, clientes, receita ou tração. |
| **Confirmação de camadas preservadas** | Serginho IA permanece orquestrador soberano/gateway único; Híbrido/Construtor permanece na camada de geração/preview/revisão/aprovação/ajuste/artefatos; Artifact Ledger, replay/diff e consulta por `traceId` permanecem observacionais/read-only; consumo visual observacional permanece leitura/visualização sem decisão de runtime; sem mistura de camadas. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo neste encerramento formal F15-06. |
| **Recomendação de auditoria de transição pós-Fase 15** | Realizar auditoria de transição pós-Fase 15 antes de qualquer nova fase para decidir entre evidência/demonstração para banca/incubadora, certificado/exportação observacional em fase própria, segurança técnica futura, janela técnica de dependências/Dependabot ou outra frente apontada na auditoria. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-05 — docs(observability): F15-05 validar governança observacional da Fase 15

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(observability): F15-05 validar governança observacional da Fase 15` |
| **Objetivo F15-05** | Validar documentalmente a governança observacional da Fase 15, confirmando coerência F15-01 a F15-04, payload seguro, privacidade, anti-overclaim, separação de camadas e runtime intacto. |
| **Documento criado** | `docs/audits/f15-05-validacao-documental-governanca-observacional-2026-06-05.md` |
| **Confirmação de validação documental da governança observacional** | F15-05 registra validação documental da governança observacional da Fase 15 sem implementar funcionalidade. |
| **Confirmação de coerência F15-01 a F15-04** | F15-01, F15-02, F15-03 e F15-04 permanecem coerentes quanto a segurança, privacidade, payload permitido/proibido, narrativa segura, anti-overclaim, separação de camadas, runtime intacto e Serginho IA como orquestrador soberano/gateway único. |
| **Confirmação de payload permitido** | Permitidos apenas metadados seguros: status, contagens, timestamps, `artifactId`, `traceId`, flags de checksum, timeline segura, warnings, limitations, `hasFeedback` booleano sem feedback bruto, resumo estrutural seguro sem conteúdo bruto e indicadores observacionais sem dados sensíveis. |
| **Confirmação de payload proibido** | Proibidos: eventos brutos quando vedados pelo contrato, conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email`, feedback bruto, segredos/tokens, payload de execução, logs como execução funcional real, dados sensíveis e dados que permitam inferir indevidamente identidade ou conteúdo privado. |
| **Confirmação de anti-overclaim** | Observabilidade permanece read-only e não promete execução real, sandbox real, restauração funcional, time-travel funcional, prova criptográfica completa, auditoria externa, SLA, segurança absoluta, clientes, receita ou tração. |
| **Confirmação de ausência de alteração funcional** | Sem alteração funcional; entrega exclusivamente documental. |
| **Confirmação de ausência de backend/API/migration** | Sem backend novo, sem endpoint novo, sem alteração em `api/` e sem migration em `supabase/migrations/`. |
| **Confirmação de ausência de UI funcional nova** | Não houve UI funcional nova; entrega restrita à validação documental F15-05. |
| **Confirmação de ausência de bypass ao Serginho** | Serginho IA permanece orquestrador soberano e gateway único; nenhum bypass foi introduzido. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo na F15-05. |
| **Recomendação para F15-06** | Executar F15-06 como encerramento formal da Fase 15. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-05 — docs(observability): F15-04 revisar narrativa de banca e incubadora sem overclaim

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(observability): F15-04 revisar narrativa de banca e incubadora sem overclaim` |
| **Objetivo F15-04** | Revisar e alinhar a narrativa documental de banca/incubadora, demo e apresentação institucional para evitar overclaim técnico, comercial e institucional, preservando observabilidade como camada read-only. |
| **Documento criado** | `docs/audits/f15-04-revisao-narrativa-banca-incubadora-sem-overclaim-2026-06-05.md` |
| **Arquivos revisados** | `README.md`, `docs/DEMO.md`, `docs/api.md`, `docs/audits/f15-01-abertura-formal-governanca-seguranca-privacidade-observacional-2026-06-05.md`, `docs/audits/f15-02-matriz-risco-seguranca-privacidade-observacional-2026-06-05.md`, `docs/audits/f15-03-politica-payload-permitido-proibido-evidencia-banca-2026-06-05.md`, `docs/audits/f14-06-encerramento-formal-fase14-consumo-visual-observacional-2026-06-05.md`, `CHECKLIST.md`. |
| **Arquivos alterados** | `CHECKLIST.md`; `docs/audits/f15-04-revisao-narrativa-banca-incubadora-sem-overclaim-2026-06-05.md`. |
| **Confirmação de revisão narrativa** | Revisão narrativa F15-04 concluída para banca/incubadora, demo e comunicação institucional, sem introdução de promessas funcionais indevidas. |
| **Confirmação de narrativa permitida/proibida** | Formalizadas narrativas permitidas (rastreabilidade observacional read-only, metadados de apoio à revisão humana, proveniência observacional, `traceId` como correlação observacional) e narrativas proibidas (execução/sandbox real, restauração/time-travel funcional, prova criptográfica completa, auditoria externa, garantias comerciais/institucionais). |
| **Confirmação de ausência de alteração funcional** | Sem alteração funcional; entrega exclusivamente documental. |
| **Confirmação de ausência de backend/API/migration** | Sem backend novo, sem endpoint novo, sem alteração em `api/`, sem migration em `supabase/migrations/`. |
| **Confirmação de ausência de UI funcional nova** | Não houve UI funcional nova; revisão restrita à narrativa documental. |
| **Confirmação de ausência de payload bruto** | Mantida política de não exposição de payload bruto (`content`, `contentPreview`, `files`, `zipBase64`, `user_email`, feedback bruto, segredos/tokens e payload de execução). |
| **Confirmação de limites sem overclaim** | Mantido: observabilidade como metadados/read-only sem promessa de execução real, sandbox real, restauração funcional, time-travel funcional, prova criptográfica completa, auditoria externa, SLA, segurança absoluta, clientes, receita ou tração. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo na F15-04. |
| **Recomendação para F15-05** | Se F15-04 for aprovada, executar F15-05 como validação documental da governança observacional da Fase 15. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-05 — docs(observability): F15-03 política de payload permitido e proibido para evidência e banca

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(observability): F15-03 política de payload permitido e proibido para evidência e banca` |
| **Objetivo F15-03** | Criar política documental de payload permitido/proibido para evidência segura em documentação, demonstração, banca/incubadora e revisão humana, sem alteração funcional. |
| **Documento criado** | `docs/audits/f15-03-politica-payload-permitido-proibido-evidencia-banca-2026-06-05.md` |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a `CHECKLIST.md` e ao documento de auditoria F15-03. |
| **Confirmação de política de payload permitido/proibido criada** | Política F15-03 criada com regras de payload, evidência, frases permitidas/proibidas e limites de apresentação para banca/incubadora. |
| **Confirmação de payload permitido** | Permitidos apenas metadados seguros: status, contagens, timestamps, `artifactId`, `traceId`, flags de checksum, timeline segura, warnings, limitations, `hasFeedback` booleano, resumo estrutural seguro e indicadores observacionais sem dados sensíveis. |
| **Confirmação de payload proibido** | Proibidos: eventos brutos quando vedados pelo contrato, conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email`, feedback bruto, segredos/tokens, payload de execução, logs como execução funcional real e dados sensíveis/identificáveis indevidos. |
| **Confirmação de evidência segura para banca/incubadora** | Evidência restrita a rastreabilidade observacional, metadados de proveniência, consulta read-only por artefato/`traceId`, painel observacional, matriz de risco, política de payload, documentação de limites e revisão humana apoiada por metadados. |
| **Confirmação de frases permitidas/proibidas** | Frases seguras e frases proibidas formalizadas para prevenir overclaim técnico, institucional e comercial. |
| **Confirmação de ausência de alteração funcional** | Sem alterações em código, runtime, geração, ZIP, preview funcional, execução, prompts, providers/modelos, orquestração, Auth/SaaS/Payments, Especialistas ou ABNT. |
| **Confirmação de ausência de backend/API/migration** | Sem backend novo, sem endpoint novo, sem alteração em `api/` e sem migration em `supabase/migrations/`. |
| **Confirmação de ausência de UI funcional nova** | Não houve nova UI funcional; entrega restrita à política documental F15-03. |
| **Confirmação de limites sem overclaim** | Observabilidade permanece read-only e não representa prova criptográfica completa, auditoria externa, execução real, sandbox real, restauração funcional, segurança absoluta, SLA, clientes, receita ou tração. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo nesta política documental. |
| **Recomendação para F15-04** | Se F15-03 for aprovada, executar F15-04 para revisar a narrativa de banca/incubadora sem overclaim com base nesta política. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-05 — docs(observability): F15-02 matriz de risco de segurança e privacidade observacional

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(observability): F15-02 matriz de risco de segurança e privacidade observacional` |
| **Objetivo F15-02** | Criar matriz documental de risco de segurança e privacidade observacional para governar exposição de dados, payload bruto, limites de camada e anti-overclaim, sem alteração funcional. |
| **Documento criado** | `docs/audits/f15-02-matriz-risco-seguranca-privacidade-observacional-2026-06-05.md` |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a `CHECKLIST.md` e ao documento de auditoria F15-02. |
| **Confirmação de matriz de risco criada** | Matriz criada cobrindo Artifact Ledger, proveniência, replay/diff, consulta por `traceId` e consumo visual observacional read-only. |
| **Confirmação de ausência de alteração funcional** | Sem alterações em código, runtime, geração, ZIP, preview funcional, execução, prompts, providers/modelos, orquestração, Auth/SaaS/Payments, Especialistas ou ABNT. |
| **Confirmação de ausência de backend/API/migration** | Sem backend novo, sem endpoint novo, sem alteração em `api/` e sem migration em `supabase/migrations/`. |
| **Confirmação de ausência de UI funcional nova** | Não houve nova UI funcional; entrega restrita à matriz documental de risco. |
| **Confirmação de payload proibido** | Proibidos: eventos brutos quando vedados pelo contrato, conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email`, feedback bruto, segredos/tokens, payload de execução e logs como execução funcional real. |
| **Confirmação de payload permitido** | Permitido apenas como metadados seguros: status, contagens, timestamps, `artifactId`, `traceId`, flags de checksum, timeline segura, warnings, limitations e `hasFeedback` booleano sem feedback bruto. |
| **Confirmação de limites sem overclaim** | Observabilidade pode ser apresentada como rastreabilidade/metadados/read-only de apoio à revisão humana, sem promessa de prova criptográfica completa, auditoria externa, execução, restauração, time-travel funcional, SLA, segurança absoluta, clientes, receita ou tração. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo nesta matriz documental. |
| **Recomendação para F15-03** | Executar F15-03 como política documental de payload permitido/proibido para evidência e banca, se a matriz F15-02 for aprovada. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-05 — docs(observability): F15-01 abrir fase de governança de segurança e privacidade observacional

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(observability): F15-01 abrir fase de governança de segurança e privacidade observacional` |
| **Objetivo F15-01** | Abrir formalmente a Fase 15 para consolidar a governança de segurança e privacidade da camada observacional, sem alteração funcional. |
| **Documento criado** | `docs/audits/f15-01-abertura-formal-governanca-seguranca-privacidade-observacional-2026-06-05.md` |
| **Confirmação de abertura formal da Fase 15** | Fase 15 aberta formalmente: governança de segurança e privacidade observacional. |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a `CHECKLIST.md` e ao documento de auditoria F15-01. |
| **Confirmação de ausência de alteração funcional** | Sem alterações em código, runtime, geração, ZIP, preview funcional, execução, prompts, providers/modelos, orquestração, Auth/SaaS/Payments, Especialistas ou ABNT. |
| **Confirmação de ausência de backend/API/migration** | Sem backend novo, sem endpoint novo, sem alteração em `api/` e sem migration em `supabase/migrations/`. |
| **Confirmação de ausência de UI funcional nova** | Não houve nova UI funcional; entrega restrita à abertura documental da fase. |
| **Confirmação de ausência de payload bruto** | Proibidos e não expostos: eventos brutos quando proibidos pelo contrato, conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email`, feedback bruto, segredos/tokens, payload de execução e logs como execução funcional real. |
| **Confirmação de limites sem overclaim** | Observabilidade não é prova criptográfica completa, auditoria externa, garantia de integridade absoluta, histórico Git, versionamento completo, time-travel funcional, restauração/execução de artefatos ou garantia de SLA/uptime/p95/p99/segurança absoluta/clientes/receita/tração. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo nesta abertura formal. |
| **Recomendação para F15-02** | Executar F15-02 como matriz documental de risco de segurança/privacidade observacional antes de iniciar qualquer funcionalidade nova. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-05 — docs(observability): F14-06 registrar encerramento formal da Fase 14

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(observability): F14-06 registrar encerramento formal da Fase 14` |
| **Objetivo F14-06** | Registrar formalmente o encerramento da Fase 14, consolidando F14-01 a F14-05 no escopo de consumo visual observacional read-only. |
| **Documento criado** | `docs/audits/f14-06-encerramento-formal-fase14-consumo-visual-observacional-2026-06-05.md` |
| **Confirmação de encerramento formal da Fase 14** | Fase 14 encerrada formalmente no escopo documental/observacional definido para consumo visual read-only. |
| **Consolidação F14-01 a F14-05** | Consolidado: abertura formal, documentação canônica, contrato de UI observacional, consumo visual mínimo no `ArtifactPreviewPanel` e validação documental pós-merge com ressalva não bloqueante. |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a `CHECKLIST.md` e ao documento de auditoria F14-06, sem implementação funcional. |
| **Confirmação de ausência de alteração funcional** | Sem alterações em `api/`, `src/`, `supabase/migrations/`, testes, prompts, providers/modelos, orquestração, geração, ZIP, preview funcional, execução, UI funcional, Auth/SaaS/Payments, Stripe/Vercel/secrets/workflows, `package.json` ou `package-lock.json`. |
| **Confirmação de limites read-only/observacionais** | Mantido: consumo visual estritamente observacional/read-only, sem escrita, sem decisão de runtime e sem mistura de camadas. |
| **Confirmação de ausência de backend/API/migration** | Sem backend novo, sem endpoint novo, sem alteração em `api/` e sem migration em `supabase/migrations/`. |
| **Confirmação de ausência de UI funcional nova** | Não houve nova UI funcional nesta entrega; apenas registro documental de encerramento da fase. |
| **Confirmação de ausência de payload bruto** | Proibidos e não tratados: eventos brutos, conteúdo bruto, feedback bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email`, segredos/tokens e payload de execução. |
| **Confirmação de limites sem overclaim** | Mantido: consumo visual observacional não é prova criptográfica completa, auditoria externa, garantia absoluta, histórico Git/versionamento completo, time-travel funcional, restauração/execução de artefatos ou garantia de SLA/uptime/p95/p99/segurança absoluta/clientes/receita/tração. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo neste encerramento formal. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-05 — docs(observability): F14-05 registrar validação do consumo visual observacional

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(observability): F14-05 registrar validação do consumo visual observacional` |
| **Objetivo F14-05** | Registrar formalmente a validação/auditoria documental pós-merge da F14-04, confirmando o consumo visual mínimo observacional/read-only e seus limites. |
| **Documento criado** | `docs/audits/f14-05-validacao-consumo-visual-minimo-observacional-2026-06-05.md` |
| **PR validado** | #565 / F14-04 — `feat(observability): F14-04 consumo visual mínimo observacional read-only (#565)` |
| **HEAD validado** | `25854787d1898dc958678f0467ba6c0a7c17c5cc` em `origin/main`. |
| **Arquivos validados** | `src/components/construtor/ArtifactPreviewPanel.jsx`; `src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx`; `src/styles/HybridAgent.css`; `CHECKLIST.md`; `docs/audits/f14-04-consumo-visual-minimo-observacional-2026-06-04.md` |
| **Confirmação de consumo visual read-only** | Painel apenas visual/observacional, sem `fetch` novo, escrita, alteração de decisão, geração, ZIP, execução, providers/modelos, prompts ou bypass ao Serginho. |
| **Confirmação da ressalva documental não bloqueante** | A auditoria citou `src/components/construtor/tests/ArtifactPreviewPanel.test.jsx`, mas o caminho real incorporado foi `src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx`; isso não é falha funcional nem regressão. |
| **Confirmação de ausência de alteração funcional** | F14-05 é exclusivamente documental e não altera UI, código, testes, prompts, providers/modelos, orquestração, geração, ZIP, preview funcional, execução, Auth/SaaS/Payments, Especialistas ou ABNT. |
| **Confirmação de ausência de backend/API/migration** | Sem alterações em `api/`, sem backend novo, sem endpoint novo e sem migration em `supabase/migrations/`. |
| **Confirmação de ausência de payload bruto** | Payload permitido restrito a metadados seguros (`artifactId`, `traceId` quando disponível, status, contagens, timestamp, flag de checksum, `hasFeedback` booleano e limitações); proibidos eventos brutos, conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email`, feedback bruto, segredos/tokens, payload de execução e logs como execução funcional real. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo nesta validação documental. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-04 — feat(observability): F14-04 consumo visual mínimo observacional read-only

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(observability): F14-04 consumo visual mínimo observacional read-only` |
| **Objetivo F14-04** | Implementar consumo visual mínimo observacional/read-only no fluxo do Construtor/Híbrido, sem backend novo e sem alteração de runtime. |
| **Arquivos alterados** | `src/components/construtor/ArtifactPreviewPanel.jsx`; `src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx`; `src/styles/HybridAgent.css`; `CHECKLIST.md`; `docs/audits/f14-04-consumo-visual-minimo-observacional-2026-06-04.md` |
| **Ponto visual mínimo implementado** | Painel discreto de **Rastreabilidade observacional (read-only)** dentro de `ArtifactPreviewPanel`, aproveitando `artifactId` e metadados já disponíveis no preview. |
| **Confirmação de consumo observacional/read-only** | O novo painel só exibe metadados seguros (`artifactId`, `traceId` quando disponível, status, contagens, timestamp, flag de checksum, `hasFeedback`) e texto de limites observacionais. |
| **Confirmação de ausência de alteração em api/backend** | Nenhuma alteração em `api/` ou backend funcional. |
| **Confirmação de ausência de endpoint novo** | Nenhum endpoint criado/alterado. |
| **Confirmação de ausência de migration** | Nenhuma alteração em `supabase/migrations/`. |
| **Confirmação de ausência de execução** | A seção é read-only; não aciona geração, ZIP, execução ou alteração de decisão de aprovação/rejeição. |
| **Confirmação de ausência de payload bruto** | O painel observacional não exibe payload bruto (`zipBase64`, `content`, `contentPreview`, `user_email`, feedback bruto, segredos/tokens, payload de execução). |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo nesta entrega. |
| **Validações executadas** | Pré: `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅. Pós: `npm test -- --runInBand src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx` ✅, `git diff --check origin/main...HEAD` ✅, `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-04 — docs(observability): F14-03 formalizar contrato de UI observacional read-only

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(observability): F14-03 formalizar contrato de UI observacional read-only` |
| **Objetivo F14-03** | Formalizar contrato documental de UI/consumo visual observacional read-only, preservando limites de segurança, não execução e não acoplamento ao runtime. |
| **Documento criado** | `docs/audits/f14-03-contrato-ui-consumo-visual-observacional-2026-06-04.md` |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a `CHECKLIST.md` e ao documento de auditoria F14-03, sem implementação funcional. |
| **Confirmação do contrato de UI observacional read-only** | Contrato formalizado: consumo futuro apenas observacional/read-only, sem escrita no banco, sem alteração de runtime e sem bypass ao Serginho IA. |
| **Confirmação dos endpoints contemplados** | Contemplados apenas endpoints reais existentes: `GET /api/artifact-ledger?artifactId=<artifact-id>`, `GET /api/artifact-provenance?artifactId=<artifact-id>`, `GET /api/artifact-replay?artifactId=<artifact-id>`, `GET /api/artifact-replay-diff?artifactId=<artifact-id>` e `GET /api/artifact-trace?traceId=<trace-id>`. |
| **Confirmação de payload permitido/proibido** | Permitido: metadados seguros (status, contagens, timestamps, `artifactId`, `traceId`, flags de checksum, timeline segura, warnings, limitations, `hasFeedback`). Proibido: payload bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email`, feedback bruto, segredos/tokens e payload de execução. |
| **Confirmação de ausência de alteração funcional** | Sem alterações em `api/`, `src/`, `supabase/migrations/`, testes, prompts, providers/modelos, orquestração, geração, ZIP, preview funcional, execução, UI funcional, Auth/SaaS/Payments, Stripe/Vercel/secrets/workflows, `package.json` ou `package-lock.json`. |
| **Confirmação de que não houve UI funcional** | Não houve implementação de UI funcional; entrega restrita ao contrato documental. |
| **Confirmação de que não houve endpoint novo** | Nenhum endpoint foi criado ou alterado nesta entrega. |
| **Confirmação de que não houve migration** | Nenhuma migration foi criada ou alterada. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo neste PR. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-04 — docs(observability): F14-02 documentar endpoints observacionais e alinhar README

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(observability): F14-02 documentar endpoints observacionais e alinhar README` |
| **Objetivo F14-02** | Documentar canonicamente os endpoints observacionais existentes e alinhar o README para evitar overclaim sobre execução, preview funcional, sandbox real e time-travel funcional. |
| **Arquivos alterados** | `docs/api.md`; `README.md`; `CHECKLIST.md`; `docs/audits/f14-02-documentacao-canonica-endpoints-observacionais-2026-06-04.md` |
| **Confirmação de PR exclusivamente documental** | Alterações restritas aos quatro arquivos permitidos; sem implementação funcional. |
| **Confirmação de documentação canônica dos endpoints observacionais** | Registrados os endpoints reais `GET /api/artifact-ledger?artifactId=<artifact-id>`, `GET /api/artifact-provenance?artifactId=<artifact-id>`, `GET /api/artifact-replay?artifactId=<artifact-id>`, `GET /api/artifact-replay-diff?artifactId=<artifact-id>` e `GET /api/artifact-trace?traceId=<trace-id>`. |
| **Confirmação de alinhamento do README** | README alinhado para explicitar que `executeArtifact` permanece desativado, sem execução sandboxed real, sem time-travel funcional e com replay/diff/traceId observacionais/read-only. |
| **Confirmação de ausência de alteração funcional** | Sem alterações em `api/`, `src/`, `supabase/migrations/`, testes, prompts, providers/modelos, orquestração, geração, ZIP, preview funcional, execução, UI funcional, Auth/SaaS/Payments, Stripe/Vercel/secrets/workflows, `package.json` ou `package-lock.json`. |
| **Confirmação de que não houve UI funcional** | F14-02 não implementa UI funcional; apenas prepara documentação para consumo visual observacional futuro. |
| **Confirmação de que não houve endpoint novo** | Nenhum endpoint foi criado ou alterado; apenas documentação dos handlers existentes. |
| **Confirmação de que não houve migration** | Nenhuma migration foi criada ou alterada. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo neste PR. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-04 — docs(observability): F14-01 abrir fase de consumo visual observacional read-only

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(observability): F14-01 abrir fase de consumo visual observacional read-only` |
| **Objetivo F14-01** | Abrir formalmente a Fase 14 para consumo visual observacional read-only, com foco exclusivo em governança documental. |
| **Documento criado** | `docs/audits/f14-01-abertura-formal-consumo-visual-observacional-2026-06-04.md` |
| **Confirmação de abertura formal da Fase 14** | Fase 14 aberta formalmente: **consumo visual observacional read-only**. |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a `CHECKLIST.md` e ao documento de auditoria F14-01; sem implementação funcional. |
| **Confirmação de ausência de alteração funcional** | Sem alterações em `api/`, `src/`, `supabase/migrations/`, testes, prompts, providers/modelos, orquestração, geração, ZIP, preview, execução, UI funcional, Auth/SaaS/Payments, Stripe/Vercel/secrets/workflows, `package.json` ou `package-lock.json`. |
| **Confirmação dos limites read-only/observacionais** | Mantido: consumo visual apenas observacional/read-only, sem escrita, sem payload bruto (`zipBase64`, `files`, `content`, `contentPreview`, `user_email`, eventos brutos e feedback bruto) e sem decisão automática de runtime. |
| **Confirmação de que não há UI funcional nesta etapa** | Nesta F14-01 não houve implementação de painel/visualização funcional; apenas abertura documental da fase. |
| **Confirmação de que endpoints, runtime, geração, ZIP, preview, execução, prompts, providers/modelos e orquestração não foram alterados** | Confirmado: nenhum desses itens foi alterado nesta entrega. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo neste PR. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-04 — docs(trace): F13-04 registrar encerramento formal da Fase 13

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(trace): F13-04 registrar encerramento formal da Fase 13` |
| **Objetivo** | Registrar o encerramento formal da Fase 13 (consulta observacional por `traceId`), consolidando F13-01 a F13-03 no escopo observacional/read-only atual. |
| **Documento criado** | `docs/audits/f13-04-encerramento-formal-fase13-consulta-traceid-2026-06-04.md` |
| **Confirmação de encerramento formal da Fase 13** | Fase 13 encerrada formalmente no escopo documental/observacional definido. |
| **F13-01 a F13-03 consolidadas** | Consolidação registrada: abertura formal da fase, endpoint read-only de consulta observacional por `traceId` e contrato de consumo da consulta por `traceId`. |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a `CHECKLIST.md` e ao documento de auditoria F13-04. |
| **Confirmação de ausência de alteração funcional** | Sem alterações em `api/`, `src/`, `supabase/migrations/`, testes, prompts, providers/modelos, orquestração, geração, ZIP, preview, execução, UI, Auth/SaaS/Payments, Stripe/Vercel/secrets/workflows, `package.json` ou `package-lock.json`. |
| **Confirmação de autenticação e filtro `trace_id` + `user_id`** | Mantido: consulta autenticada com filtro obrigatório por `trace_id + user_id`, sem consulta pública/global e sem enumeração entre usuários. |
| **Confirmação de payload seguro** | Mantido: retorno apenas de metadados observacionais seguros, sem eventos brutos, sem conteúdo bruto e sem feedback bruto. |
| **Confirmação de limites sem overclaim** | Mantido: `traceId` é metadado observacional; não é garantia, prova criptográfica completa, sessão global pública, commit Git ou rastreamento global entre usuários; a consulta não revalida conteúdo atual, não substitui auditoria externa, não garante SLA/uptime/p95/p99/segurança absoluta/clientes/receita/tração e não altera runtime. |
| **Confirmação de próximos itens fora de escopo** | Permanecem fora de escopo: UI, certificado exportável, consulta pública/global por `traceId`, enumeração entre usuários, execução sandboxed real, reativar `executeArtifact`, geração/ZIP/preview/execução, prompts, providers/modelos, Auth/SaaS/Payments, Especialistas e ABNT. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot não foi tratado neste PR e permanece em janela técnica separada. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-04 — docs(trace): F13-03 formalizar contrato de consumo da consulta por traceId

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(trace): F13-03 formalizar contrato de consumo da consulta por traceId` |
| **Objetivo F13-03** | Formalizar contrato documental de consumo da consulta observacional por `traceId`, incluindo limites de privacidade, payload permitido e vedações de uso. |
| **Documento criado** | `docs/audits/f13-03-contrato-consumo-consulta-traceid-2026-06-04.md` |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a `CHECKLIST.md` e ao documento de auditoria F13-03, sem implementação funcional. |
| **Confirmação do contrato de consumo da consulta por `traceId`** | Contrato formalizado como camada observacional/read-only, consumida apenas como metadados seguros e sem controle de runtime. |
| **Confirmação do endpoint contemplado** | `GET /api/artifact-trace?traceId=<trace-id>`. |
| **Confirmação de autenticação e filtro por `user_id`** | Requisito obrigatório mantido: consumo autenticado com filtro `trace_id + user_id`, sem consulta pública/global entre usuários. |
| **Confirmação de limites sem overclaim** | Mantido: consulta por `traceId` não é prova criptográfica completa, não é sessão global pública, não é rastreamento entre usuários e não altera runtime/decisão/geração/ZIP/preview/execução/prompts/providers/modelos/UI/orquestração. |
| **Confirmação de payload proibido** | Vedado: eventos brutos, conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email` e feedback bruto. |
| **Confirmação de ausência de alteração funcional** | Sem alterações em `api/`, `src/`, `supabase/migrations/`, testes, prompts, providers/modelos, orquestração, geração, ZIP, preview, execução, UI, Auth/SaaS/Payments, Stripe/Vercel/secrets/workflows, `package.json` ou `package-lock.json`. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo nesta entrega. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-04 — feat(trace): F13-02 criar endpoint read-only de consulta por traceId

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(trace): F13-02 criar endpoint read-only de consulta por traceId` |
| **Objetivo F13-02** | Criar endpoint observacional/read-only autenticado para consulta por `traceId`, derivado do Artifact Ledger, sem alteração funcional de runtime. |
| **Endpoint criado** | `GET /api/artifact-trace?traceId=<trace-id>` |
| **Arquivos alterados** | `api/artifact-trace.js`; `api/_utils/artifactTrace.js`; `api/_utils/artifactLedger.js`; `api/tests/artifact-trace.test.js`; `CHECKLIST.md` |
| **Microajuste final F13-02** | `deriveStatus` em `api/_utils/artifactTrace.js` prioriza `event_type` desconhecido (`unknown`) antes de `single_artifact`/`multi_artifact`, com fallback conservador `incomplete_history` para histórico inconsistente. |
| **Confirmação de consulta read-only por `traceId`** | Endpoint realiza somente leitura via `readLedgerEventsByTraceId` (`select`), sem insert/update/delete e sem alteração de decisão/runtime. |
| **Confirmação de filtro `trace_id + user_id`** | Consulta obrigatória com `readLedgerEventsByTraceId({ traceId, userId: user.id })` após `verifyAuth(req)`, sem consulta pública/global. |
| **Confirmação de payload seguro** | Resposta retorna somente `trace` derivado (status, timeline segura e metadados observacionais), sem eventos brutos. |
| **Confirmação de ausência de conteúdo bruto e feedback bruto** | Não retorna conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email` nem feedback bruto (apenas `hasFeedback`). |
| **Confirmação de ausência de alteração funcional indevida** | Não altera runtime, geração, ZIP, preview, execução, prompts, providers/modelos, UI, orquestração, replay/diff/proveniência ou Dependabot. |
| **Validações executadas** | Baseline pré-alteração: `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅. Pós-microajuste: `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅, `npm test -- --runInBand api/tests/artifact-trace.test.js` ✅. |
| **Dependabot fora de escopo** | Dependabot não foi tratado nesta entrega. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — docs(trace): F13-01 abrir fase de consulta observacional por traceId

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(trace): F13-01 abrir fase de consulta observacional por traceId` |
| **Objetivo F13-01** | Abrir formalmente a Fase 13 para consulta observacional por `traceId`, derivada do Artifact Ledger e sem alteração de runtime. |
| **Documento criado** | `docs/audits/f13-01-abertura-formal-consulta-traceid-2026-06-03.md` |
| **Confirmação de abertura formal da Fase 13** | Fase 13 aberta formalmente: consulta observacional por `traceId`. |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a `CHECKLIST.md` e documento de auditoria em `docs/audits/`; sem implementação funcional. |
| **Confirmação de que nenhuma camada funcional foi alterada** | Sem alterações em `api/`, `src/`, `supabase/migrations/`, testes, prompts, providers/modelos, orquestração, geração, ZIP, preview, execução, UI, Auth/SaaS/Payments, Stripe, Vercel/secrets/workflows, `package.json` ou `package-lock.json`. |
| **Confirmação dos limites read-only/observacionais** | Mantido: consulta por `traceId` apenas observacional/read-only, sem conteúdo bruto, sem `zipBase64`, sem `files`, sem `content`, sem `contentPreview`, sem `user_email`, sem feedback bruto, sem consulta pública/global por `traceId`, sem enumeração entre usuários e sem prova criptográfica completa. |
| **Confirmação de privacidade/filtro por usuário** | Requisito futuro obrigatório: consulta autenticada, filtrada por `user_id`, com payload seguro e sem rastreamento entre usuários. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo neste PR. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — docs(replay): F12-05 registrar encerramento formal da Fase 12

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(replay): F12-05 registrar encerramento formal da Fase 12` |
| **Objetivo** | Registrar o encerramento formal da Fase 12 (replay/diff observacional do ciclo de revisão), consolidando F12-01 a F12-04 no escopo observacional/read-only atual. |
| **Documento criado** | `docs/audits/f12-05-encerramento-formal-fase12-replay-diff-2026-06-03.md` |
| **Confirmação de encerramento formal da Fase 12** | Fase 12 encerrada formalmente no escopo documental/observacional definido. |
| **F12-01 a F12-04 consolidadas** | Consolidação registrada: abertura formal da fase, endpoint replay read-only, endpoint diff/veredito observacional read-only e contrato de consumo do replay/diff. |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a `CHECKLIST.md` e ao documento de auditoria F12-05. |
| **Confirmação de ausência de alteração funcional** | Sem alterações em `api/`, `src/`, `supabase/migrations/`, testes, prompts, providers/modelos, orquestração, geração, ZIP, preview, execução, UI, Auth/SaaS/Payments, Stripe/Vercel/secrets/workflows, `package.json` ou `package-lock.json`. |
| **Confirmação de limites sem overclaim** | Mantido: replay/diff não são restauração funcional, time-travel funcional, histórico Git, versionamento completo ou prova criptográfica completa; não revalidam conteúdo atual, não substituem auditoria externa e não garantem SLA/uptime/p95/p99/segurança absoluta/clientes/receita/tração. |
| **Confirmação de próximos itens fora de escopo** | Permanecem fora de escopo: UI, certificado exportável, consulta por `traceId`, execução sandboxed real, reativar `executeArtifact`, geração/ZIP/preview/execução, prompts, providers/modelos, Auth/SaaS/Payments, Especialistas e ABNT. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot não foi tratado neste PR e permanece em janela técnica separada. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — docs(replay): F12-04 formalizar contrato de consumo do replay/diff observacional

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(replay): F12-04 formalizar contrato de consumo do replay/diff observacional` |
| **Objetivo F12-04** | Formalizar o contrato documental de consumo do replay/diff observacional para auditoria e monitoramento, sem acoplamento funcional ao runtime. |
| **Documento criado** | `docs/audits/f12-04-contrato-consumo-replay-diff-2026-06-03.md` |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a `CHECKLIST.md` e ao documento de auditoria F12-04; sem implementação funcional. |
| **Confirmação do contrato de consumo** | Replay/diff mantidos como camada observacional read-only, consumida apenas como metadados e sempre com `artifact_id + user_id`, sem controle de runtime. |
| **Confirmação dos endpoints contemplados** | `GET /api/artifact-replay?artifactId=<uuid>` e `GET /api/artifact-replay-diff?artifactId=<uuid>`. |
| **Confirmação de limites sem overclaim** | Registrado que replay/diff não são restauração funcional, time-travel funcional, histórico Git, versionamento completo ou prova criptográfica completa; também não revalidam conteúdo atual nem substituem auditoria externa, e não garantem SLA/uptime/p95/p99/segurança absoluta/clientes/receita/tração. |
| **Confirmação de payload proibido** | Mantida vedação de conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email` e feedback bruto. |
| **Confirmação de ausência de alteração funcional** | Sem alterações em `api/`, `src/`, `supabase/migrations/`, testes, prompts, providers/modelos, orquestração, geração, ZIP, preview, execução, UI, Auth/SaaS/Payments, Stripe/Vercel/secrets/workflows, `package.json` ou `package-lock.json`. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo nesta entrega. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — feat(replay): F12-03 criar diff observacional do ciclo de revisão

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(replay): F12-03 criar diff observacional do ciclo de revisão` |
| **Objetivo F12-03** | Criar endpoint de diff/veredito observacional/read-only entre eventos do ciclo de revisão, derivado do Artifact Ledger e filtrado por `artifact_id + user_id`. |
| **Endpoint criado** | `GET /api/artifact-replay-diff?artifactId=<uuid>` |
| **Arquivos alterados** | `api/artifact-replay-diff.js`; `api/_utils/artifactReplayDiff.js`; `api/__tests__/artifact-replay-diff.test.js`; `CHECKLIST.md` |
| **Confirmação diff observacional/read-only** | Endpoint realiza somente leitura via `readLedgerEvents` e deriva `diff` determinístico sem alterar runtime/decisão. |
| **Confirmação de filtro por `artifact_id` + `user_id`** | Consulta obrigatória com `readLedgerEvents({ artifactId, userId: user.id })` após `verifyAuth(req)`. |
| **Confirmação de payload seguro** | Resposta retorna apenas `diff` derivado (status, transições e metadados seguros), sem eventos brutos. |
| **Confirmação de dados não expostos** | Não retorna conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email` nem feedback bruto (somente flag `hasFeedbackOnToEvent`). |
| **Confirmação de escopo preservado** | Não altera runtime, geração, ZIP, preview, execução, prompts, providers/modelos, UI, orquestração ou Dependabot. |
| **Validações executadas** | Baseline pré-alteração: `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅. Pós-alteração: `npm test -- --runInBand api/__tests__/artifact-replay-diff.test.js` ✅, `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — feat(replay): F12-02 criar endpoint replay read-only do ciclo de revisão

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(replay): F12-02 criar endpoint replay read-only do ciclo de revisão` |
| **Objetivo F12-02** | Criar endpoint replay observacional/read-only do ciclo de revisão derivado do Artifact Ledger, autenticado e filtrado por `artifact_id + user_id`. |
| **Endpoint criado** | `GET /api/artifact-replay?artifactId=<uuid>` |
| **Arquivos alterados** | `api/artifact-replay.js`; `api/_utils/artifactReplay.js`; `api/__tests__/artifact-replay.test.js`; `CHECKLIST.md` |
| **Confirmação replay read-only** | Endpoint realiza apenas leitura via `readLedgerEvents`; sem insert/update/delete e sem alteração de decisão/runtime. |
| **Confirmação de filtro por `artifact_id` + `user_id`** | Consulta obrigatória com `readLedgerEvents({ artifactId, userId: user.id })` após `verifyAuth(req)`. |
| **Confirmação de payload seguro** | Retorna somente `replay` derivado (timeline segura e metadados), sem eventos brutos. |
| **Confirmação de dados não expostos** | Não retorna conteúdo bruto, `zipBase64`, `files`, `content`, `contentPreview`, `user_email` nem feedback bruto (apenas `hasFeedback`). |
| **Confirmação de escopo preservado** | Não altera runtime, geração, ZIP, preview, execução, prompts, providers/modelos, UI, orquestração ou Dependabot. |
| **Validações executadas** | Baseline pré-alteração: `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅. Pós-alteração: `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅. Teste alvo: `npm test -- --runInBand api/__tests__/artifact-replay.test.js` ✅. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — docs(replay): F12-01 abrir fase de replay observacional do ciclo de revisão

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(replay): F12-01 abrir fase de replay observacional do ciclo de revisão` |
| **Objetivo F12-01** | Abrir formalmente a Fase 12 para replay/diff observacional do ciclo de revisão, derivado do Artifact Ledger e sem alteração de runtime. |
| **Documento criado** | `docs/audits/f12-01-abertura-formal-fase12-replay-diff-2026-06-03.md` |
| **Confirmação de abertura formal da Fase 12** | Fase 12 aberta formalmente: **Replay/diff observacional do ciclo de revisão**. |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a `CHECKLIST.md` e documento de auditoria em `docs/audits/`; sem implementação funcional. |
| **Confirmação de que nenhuma camada funcional foi alterada** | Sem alterações em `api/`, `src/`, `supabase/migrations/`, testes, prompts, providers/modelos, orquestração, geração, ZIP, preview, execução, UI, Auth/SaaS/Payments, Stripe, Vercel/secrets/workflows, `package.json` ou `package-lock.json`. |
| **Confirmação dos limites read-only/observacionais** | Mantido: replay/diff apenas observacional/read-only, sem conteúdo bruto, sem `zipBase64`, sem arquivos brutos, sem `contentPreview`, sem restauração funcional e sem time-travel funcional. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo neste PR. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — docs(ledger): registrar encerramento formal da Fase 11

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(ledger): registrar encerramento formal da Fase 11` |
| **Objetivo** | Registrar o encerramento formal da Fase 11 (Artifact Ledger / proveniência observacional), consolidando F11-02 a F11-06 no escopo observacional atual. |
| **Documento criado** | `docs/audits/f11-encerramento-formal-fase11-2026-06-03.md` |
| **Confirmação de encerramento formal da Fase 11** | Fase 11 encerrada formalmente no escopo documental/observacional definido. |
| **F11-02 a F11-06 consolidadas** | Consolidação registrada: ledger observacional com escrita append-only/fail-silent, leitura autenticada com `artifact_id + user_id`, `traceId` opcional, veredito read-only e contrato documental de limites/critérios futuros. |
| **Confirmação de ausência de alteração funcional** | PR exclusivamente documental; sem alteração em runtime, decisão, geração, ZIP, preview, execução, prompts, providers/modelos, UI, Auth/SaaS/Payments, orquestração, `api/`, `src/`, `supabase/migrations/` ou testes. |
| **Confirmação de limites sem overclaim** | Mantido: sem conteúdo bruto/`zipBase64`/arquivos brutos/`contentPreview`, sem prova criptográfica completa, sem auditoria externa, sem promessa de SLA/uptime/p95/p99/segurança absoluta/clientes/receita/tração. |
| **Confirmação de próximos itens fora de escopo** | Certificado exportável, certificado anexável ao ZIP, consulta por `traceId`, execução sandboxed real, reativação de `executeArtifact`, Dependabot, UI, prompts, providers/modelos e Auth/SaaS/Payments permanecem fora de escopo. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot não foi tratado neste PR. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — docs(ledger): F11-06 formalizar contrato de proveniência e critérios para certificado exportável

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(ledger): F11-06 formalizar contrato de proveniência e critérios para certificado exportável` |
| **Objetivo F11-06** | Formalizar contratualmente a proveniência observacional do Artifact Ledger e os critérios mínimos para eventual certificado exportável futuro, antes de qualquer etapa funcional. |
| **Documento criado** | `docs/audits/f11-06-contrato-proveniencia-artifact-ledger-2026-06-03.md` |
| **Confirmação de PR exclusivamente documental** | Alterações restritas a documentação (`CHECKLIST.md` e documento de auditoria); sem implementação funcional. |
| **Confirmação do contrato de proveniência** | Contrato consolidado para ledger/veredito: append-only, read-only autenticado, filtro obrigatório por `artifact_id + user_id`, `traceId` opcional e veredito derivado do histórico. |
| **Confirmação dos limites sem overclaim** | Registrado que o veredito é observacional, não é prova criptográfica completa, não substitui auditoria externa, não garante SLA/uptime/p95/p99/segurança absoluta/clientes/receita/tração e não altera runtime. |
| **Confirmação dos critérios para certificado exportável futuro** | Definidos critérios mínimos read-only, derivados do ledger, com filtro por usuário, sem payload bruto (`zipBase64`/arquivos), com limitações explícitas, opcional, reversível e desacoplado do runtime. |
| **Confirmação de que nenhuma camada funcional foi alterada** | Sem alterações em `api/`, `src/`, `supabase/migrations/`, testes, prompts, providers/modelos, orquestração, geração, ZIP, preview, execução, UI, Auth/SaaS/Payments, Stripe, Vercel/secrets/workflows ou pacotes. |
| **Confirmação de que Dependabot não foi tratado** | Dependabot permanece fora de escopo nesta entrega. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — feat(ledger): F11-05 gerar veredito read-only de proveniência

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ledger): F11-05 gerar veredito read-only de proveniência` |
| **Objetivo F11-05** | Gerar veredito/certificado determinístico e conservador de proveniência, em modo read-only, a partir dos eventos existentes do Artifact Ledger. |
| **Arquivos alterados** | `api/_utils/artifactProvenance.js`; `api/artifact-provenance.js`; `api/__tests__/artifact-provenance.test.js`; `CHECKLIST.md` |
| **Confirmação endpoint/veredito read-only** | Novo endpoint `GET /api/artifact-provenance` autentica usuário, lê ledger via `readLedgerEvents` e retorna apenas veredito derivado; sem escrita no banco. |
| **Confirmação de filtro por usuário autenticado** | Consulta sempre filtrada por `artifact_id + user_id` por meio de `readLedgerEvents({ artifactId, userId: user.id })` após `verifyAuth(req)`. |
| **Confirmação de payload seguro** | Resposta retorna somente metadados seguros (`provenance`) e não expõe `user_email`. |
| **Confirmação de não gravação de conteúdo bruto** | Não grava nem retorna conteúdo bruto, `zipBase64`, raw files ou `contentPreview`. |
| **Escopo preservado** | Sem alterações em Serginho, orquestração, prompts, providers/modelos, UI, ZIP, geração, validação, execução ou Dependabot. |
| **Validações executadas** | `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅ |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — feat(ledger): F11-04 propagar traceId no artifact ledger

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ledger): F11-04 propagar traceId no artifact ledger` |
| **Objetivo F11-04** | Propagar `traceId` como metadado observacional no `artifact_ledger`, sem alterar decisão de runtime do Construtor/Híbrido. |
| **Arquivos alterados** | `supabase/migrations/20260603_add_trace_id_to_artifact_ledger.sql`; `api/_utils/artifactLedger.js`; `api/artifact-preview.js`; `api/artifact-ledger.js`; `api/__tests__/artifactLedger.test.js`; `api/__tests__/artifact-ledger.test.js`; `api/__tests__/artifact-preview.test.js`; `CHECKLIST.md` |
| **Confirmação traceId observacional** | `traceId` é tratado apenas como metadado de rastreabilidade/proveniência no ledger; sem impacto no fluxo decisório de execução. |
| **Confirmação de opcionalidade** | `trace_id` é nullable e `normalizeTraceId` converte vazio/`undefined`/`null` para `null`. |
| **Ausência de traceId não quebra fluxo** | POST/PATCH de `/api/artifact-preview`, leitura de `/api/artifact-ledger` e persistência no ledger continuam funcionais sem `traceId`. |
| **Garantias do ledger preservadas** | Ledger segue observacional; write path append-only (insert), endpoint read-only (`GET`) e escrita fail-silent (erro no ledger não bloqueia resposta do endpoint). |
| **Confirmação de payload seguro** | Não grava nem expõe conteúdo bruto, arquivos, `zipBase64` ou `contentPreview`. |
| **Escopo preservado** | Sem alterações em Serginho, orquestração, prompts, providers/modelos, UI, ZIP, geração, validação ou Dependabot. |
| **Validações executadas** | `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅ |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — feat(ledger): F11-03 consultar histórico read-only do artifact ledger

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ledger): F11-03 consultar histórico read-only do artifact ledger` |
| **Objetivo F11-03** | Criar endpoint read-only autenticado para consultar histórico do `artifact_ledger` por `artifactId`, com filtro obrigatório por usuário autenticado. |
| **Arquivos alterados** | `api/artifact-ledger.js`; `api/_utils/artifactLedger.js`; `api/__tests__/artifact-ledger.test.js`; `api/__tests__/artifactLedger.test.js`; `CHECKLIST.md` |
| **Confirmação endpoint read-only** | Novo endpoint `GET /api/artifact-ledger` realiza apenas leitura (`select`) e não executa escrita no banco. |
| **Confirmação de filtro por usuário autenticado** | Consulta sempre filtrada por `artifact_id` + `user_id` com `verifyAuth(req)` obrigatório. |
| **Confirmação de privacidade de payload** | Resposta inclui somente metadados seguros e não retorna conteúdo bruto, arquivos brutos, `zipBase64` ou `contentPreview`. |
| **Escopo preservado** | Sem alterações em geração, preview, ZIP, UI, prompts, providers/modelos, Serginho/orquestração ou Dependabot. |
| **Validações executadas** | Baseline pré-alteração: `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅. Pós-alteração: `npm run lint` ✅, `npm run build` ✅, `npm test -- --runInBand` ✅. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — feat(ledger): F11-02 criar artifact ledger write-only

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ledger): F11-02 criar artifact ledger write-only` |
| **Objetivo F11-02** | Implementação mínima de ledger de artefatos write-only/append-only para proveniência verificável, sem alterar o fluxo atual do Construtor. |
| **Arquivos alterados** | `supabase/migrations/20260603_create_artifact_ledger.sql`; `api/_utils/artifactLedger.js`; `api/artifact-preview.js`; `api/__tests__/artifactLedger.test.js`; `api/__tests__/artifact-preview.test.js`; `CHECKLIST.md` |
| **Confirmação write-only ledger** | Registro de eventos via `recordLedgerEvent(event)` apenas com `insert` em `artifact_ledger`; sem leitura para tomada de decisão de runtime. |
| **Confirmação append-only** | Tabela com `ledger_id` UUID por evento, `artifact_id` UUID (coerente com `manifest.id`), RLS habilitado e triggers que bloqueiam `UPDATE` e `DELETE` (`artifact_ledger_prevent_mutation`). |
| **Dados NÃO armazenados** | Não armazena conteúdo completo de artefato, `zipBase64` ou arquivos brutos; apenas metadados, checksum, validação, status, decisão e rastreabilidade mínima. |
| **Confirmação fail-silent** | `recordLedgerEvent` é best-effort, com `try/catch` interno, sem lançar erro para o fluxo principal e sem bloquear resposta do endpoint. |
| **Escopo preservado** | Sem mudanças em Serginho/orquestração, prompts, providers/modelos, UI, ZIP/generation/validation engines e Dependabot. |
| **Validações executadas** | Baseline pré-alteração: `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅. Pós-alteração: `npm run lint` ✅, `npm run build` ✅, `npm test -- --runInBand` ✅. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — docs(f10): registrar encerramento formal da Fase 10

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f10): registrar encerramento formal da Fase 10` |
| **Documento criado** | `docs/audits/f10-encerramento-formal-fase10-2026-06-03.md` |
| **Veredito de encerramento da Fase 10** | ✅ Fase 10 encerrada formalmente no escopo técnico/documental/UX operacional. |
| **Entregas consolidadas** | F10-01 (#534), F10-03 (#535), F10-04 (#541), F10-06 (#542), F10-07 (#543), F10-09 (#544) e auditoria F10-10 de transição. |
| **Confirmação de não alteração funcional** | PR exclusivamente documental; sem alteração em `src/`, `api/`, prompts, providers/modelos, orquestração, Auth/SaaS/Payments, Supabase/Stripe/Vercel, workflows, secrets ou Dependabot. |
| **Pendências opcionais fora de escopo** | Validação visual adicional e PRs Dependabot em janela separada. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — feat(ui): F10-09 adicionar edição local de arquivos no preview do Construtor

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ui): F10-09 adicionar edição local de arquivos no preview do Construtor` |
| **Identificação** | Fase 10 — F10-09 (UX local de edição/deleção no preview do Construtor) |
| **Arquivos alterados** | `src/components/construtor/ArtifactPreviewPanel.jsx`; `src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx`; `src/styles/HybridAgent.css`; `CHECKLIST.md` |
| **Escopo local** | Edição somente em estado React no `ArtifactPreviewPanel`; conteúdo original preservado em memória (`summary.fileContents[path]`), sem persistência de artefato. |
| **Aviso de exportação** | ZIP/exportação permanecem com o artefato original (`handleDownload`/`delivery.zipBase64` inalterados). |
| **Fluxo do Construtor preservado** | Revisar/Aprovar/Solicitar ajuste/Rejeitar/Baixar ZIP/Copiar/Copiar tudo, histórico de revisão e métricas do ciclo permanecem intactos. |
| **Limites técnicos preservados** | Sem alterações em API, prompts, providers/modelos, orquestração, `src/config/modelPriority.js`, `src/lib/construtor/artifactPreview.js`, `src/pages/HybridAgentSimple.jsx`, Serginho, Especialistas, ABNT, Auth/SaaS/Payments, Supabase/Stripe/Vercel, secrets, workflows ou Dependabot. |
| **Sem bypass ao Serginho** | Mantido: Serginho IA segue como gateway/orquestrador único. |
| **Validações executadas** | Baseline pré-alteração: `npm run lint` ✅ (warnings pré-existentes, 0 errors), `npm run build` ✅, `npm test -- --runInBand` ✅. Pós-alteração: `npm run lint` ✅ (warnings pré-existentes, 0 errors), `npm run build` ✅, `npm test -- --runInBand` ✅. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-03 — feat(ui): F10-07 adicionar copiar arquivo completo no preview do Construtor

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ui): F10-07 adicionar copiar arquivo completo no preview do Construtor` |
| **Arquivos alterados** | `src/components/construtor/ArtifactPreviewPanel.jsx`; `src/components/construtor/__tests__/ArtifactPreviewPanel.test.jsx`; `src/lib/construtor/artifactPreview.js`; `src/lib/construtor/__tests__/artifactPreview.test.js`; `CHECKLIST.md` |
| **Justificativa para `src/lib/construtor/artifactPreview.js`** | Alteração **necessária** para o painel acessar conteúdo integral por arquivo via `summary.fileContents`; sem isso o `ArtifactPreviewPanel` só teria `contentPreview` truncado e não conseguiria copiar o conteúdo completo com segurança. |
| **Escopo funcional preservado** | Mudança restrita ao Híbrido/Construtor (preview/revisão de artefatos). Sem alterações em API, prompts, providers/modelos, `src/config/modelPriority.js`, orquestração, Serginho, Especialistas, ABNT, Auth/SaaS/Payments, Supabase/Stripe/Vercel, secrets, workflows ou Dependabot. |
| **Hardening aplicado na cópia** | Cópia individual e “copiar tudo” usam conteúdo completo apenas para arquivos textuais, com feedback quando conteúdo está ausente/vazio e sem tentativa de cópia de binários. A prévia visual (`contentPreview`) permanece truncada. |
| **Validações executadas** | Baseline após `npm install`: `npm run lint` ✅ (warnings pré-existentes, 0 errors), `npm run build` ✅, `npm test -- --runInBand` ✅. Pós-microajuste: `npm run lint` ✅ (warnings pré-existentes, 0 errors), `npm run build` ✅, `npm test -- --runInBand` ✅. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-02 — fix(prompt): remover conflito no HYBRID_GENIUS_PROMPT para permitir “Serginho IA” como conteúdo de artefato

| Item | Detalhe |
|------|---------|
| **Título do PR** | `fix(prompt): remover conflito no HYBRID_GENIUS_PROMPT para permitir “Serginho IA” como conteúdo de artefato` |
| **Objetivo da F10-06** | Ajuste mínimo e reversível no `HYBRID_GENIUS_PROMPT` para permitir "Serginho IA" quando for nome de produto/marca/título/conteúdo do artefato solicitado, preservando bloqueio de exposição da arquitetura interna. |
| **Motivo** | Recusa indevida identificada na F10-05 por conflito da regra absoluta "Nunca mencione Serginho" com pedidos legítimos de landing page para o produto **Serginho IA**. |
| **Arquivos alterados** | `src/prompts/geniusPrompts.js`; `src/prompts/__tests__/geniusPrompts.test.js`; `CHECKLIST.md` |
| **Confirmação de escopo** | Em produção, apenas o prompt do Híbrido/Construtor foi alterado (sem mudanças em `SERGINHO_GENIUS_PROMPT`, `SPECIALIST_GENIUS_PROMPT`, few-shot ou suffixes); houve apenas ajuste estritamente necessário no teste estático correspondente. |
| **Confirmação de não alteração técnica fora de escopo** | Sem mudanças em runtime/orquestração/UI/providers/classificador (`api/`, `src/pages/`, `src/styles/`, `src/config/modelPriority.js` e correlatos permanecem intactos). |
| **Validações executadas** | Baseline antes da instalação: `npm run lint` ❌ (`eslint: not found`), `npm run build` ❌ (`vite: not found`), `npm test -- --runInBand` ❌ (`jest: not found`). Após `npm install`: `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅. Pós-ajuste F10-06: `npm run lint` ✅ (warnings pré-existentes), `npm run build` ✅, `npm test -- --runInBand` ✅. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-02 — feat(ui): F10-04 sanear visibilidade do seletor de IA no Híbrido

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ui): F10-04 sanear visibilidade do seletor de IA no Híbrido` |
| **Objetivo da F10-04** | Saneamento mínimo de UX do seletor de IA/modelo no `/hybrid`, com visibilidade e legibilidade reforçadas perto da área de input/ação do Construtor. |
| **Arquivos alterados** | `src/pages/HybridAgentSimple.jsx`; `src/styles/HybridAgent.css`; `CHECKLIST.md` |
| **Confirmação sobre Serginho** | `src/pages/Serginho.jsx` e `src/pages/Serginho.css` não foram alterados nesta entrega. |
| **Preservação do Híbrido/Construtor** | Fluxo funcional preservado: input do Construtor, geração, `ArtifactPreviewPanel`, Revisar/Aprovar/Solicitar ajuste, histórico/revisão, `reviewCycleMetrics`, empacotamento/exportação, `zipBase64`, persistências em `sessionStorage`. |
| **MANUAL_MODEL_OPTIONS preservado** | Mantido como fonte única das opções do seletor (sem duplicação de lista e sem alteração em `src/config/modelPriority.js`). |
| **`forceProvider` preservado** | Contrato mantido: `forceProvider` só é enviado quando `providerName != null` (modo diferente de `auto`); `auto` segue sem `forceProvider`. |
| **Sem bypass ao Serginho** | Fluxo continua via `/api/ai` e orquestrador; nenhuma chamada direta a provider/modelo foi adicionada. |
| **Validações executadas** | `npm run lint` ✅ (warnings pré-existentes); `npm run build` ✅; `npm test -- --runInBand` ✅ |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-02 — feat(ui): F10-03 sanear visibilidade do seletor de IA no Serginho

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(ui): F10-03 sanear visibilidade do seletor de IA no Serginho` |
| **Objetivo da F10-03** | Saneamento mínimo de UX no `/serginho` para tornar o seletor de IA/modelo visível, legível e rotulado, sem alteração de runtime. |
| **Escopo confirmado deste PR (#535)** | F10-03 permanece restrita ao `/serginho`; qualquer ajuste de visibilidade do seletor no `/hybrid` fica explicitamente para PR futuro separado (**F10-04**). |
| **Arquivos alterados** | `src/pages/Serginho.jsx`; `src/pages/Serginho.css`; `CHECKLIST.md` |
| **Confirmação de UX mínima (sem runtime)** | Remoção do seletor flutuante minúsculo e reposicionamento para bloco legível e rotulado próximo ao input, mantendo o comportamento funcional do chat inalterado. |
| **MANUAL_MODEL_OPTIONS preservado** | Mantido como fonte única de opções do seletor em `/serginho` (sem duplicação de lista). |
| **Sem bypass ao Serginho** | Fluxo continua via `/api/ai` com orquestração do Serginho; nenhuma chamada direta a provider foi adicionada. |
| **`forceProvider` preservado** | Contrato mantido: envio de `forceProvider: selectedModel` apenas quando `selectedModel !== 'auto'`; modo `'auto'` segue sem `forceProvider`. |
| **Validações executadas** | `npm run lint` ✅ (warnings pré-existentes); `npm run build` ✅; `npm test -- --runInBand` ✅ |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-01 — docs(f10): abrir formalmente a Fase 10

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f10): abrir formalmente a Fase 10` |
| **Documento criado** | `docs/audits/f10-01-abertura-formal-fase10-2026-06-01.md` |
| **Nome oficial da Fase 10** | `Fase 10 — Unificação operacional Serginho + Híbrido e saneamento UX do seletor de IA` |
| **Objetivo da Fase 10 (resumo)** | Unificar a experiência operacional entre Serginho/generalista e Híbrido/Construtor e sanear a visibilidade/organização do seletor de IA/modelo nas UIs operacionais autenticadas, preservando o Serginho IA como gateway único sem bypass. |
| **Pendências que motivam a fase** | Seletor de IA/modelo não visível no Híbrido/Construtor; seletor de IA/modelo não claramente visível no Serginho/generalista; pequeno ajuste visual no Serginho/generalista. |
| **Confirmação de não alteração funcional** | Sem alteração em `src/`, `api/`, rotas, CSS, testes, dependências, `package.json`, `package-lock.json`, workflows, providers/modelos, prompts, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments. |
| **Limites sem overclaim** | Sem clientes/receita/SLA/uptime/p95/p99/tração/maturidade comercial; seletor não plenamente validado; posicionamento oficial = **protótipo avançado em validação**. |
| **Próximo passo recomendado** | Executar auditoria/diagnóstico **F10-02 em modo leitura** antes de qualquer implementação. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-01 — docs(audit): registrar transição pós-Fase 9 para decisão sobre Fase 10

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(audit): registrar transição pós-Fase 9 para decisão sobre Fase 10` |
| **Documento criado** | `docs/audits/transicao-pos-fase9-para-fase10-2026-06-01.md` |
| **Estado pós-Fase 9 confirmado** | PR #532 incorporado em `main`; `main` limpa; sem PRs abertos; Dependabot #475/#477 tratados isoladamente em #527/#528. |
| **Pendências não bloqueantes preservadas** | Seletor de IA/modelo não visível no Híbrido/Construtor; seletor de IA/modelo não claramente visível no Serginho/generalista; pequeno ajuste visual no Serginho/generalista. |
| **Recomendação sobre Fase 10** | `Fase 10 — Unificação operacional Serginho + Híbrido e saneamento UX do seletor de IA`, sem iniciar implementação neste PR. |
| **Confirmação de não alteração funcional** | Sem alteração em `src/`, `api/`, rotas, CSS, testes, dependências, `package.json`, `package-lock.json`, workflows, providers/modelos, prompts, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments. |
| **Limites sem overclaim** | Sem clientes/receita/SLA/uptime/p95/p99/tração/maturidade comercial; seletor de IA/modelo não plenamente validado; posicionamento oficial = **protótipo avançado em validação**. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-01 — docs(validation): registrar validação autenticada manual das UIs operacionais pós-Fase 9

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(validation): registrar validação autenticada manual das UIs operacionais pós-Fase 9` |
| **Documento criado** | `docs/audits/validacao-autenticada-uis-operacionais-pos-fase9-2026-06-01.md` |
| **Rotas autenticadas validadas manualmente em produção (owner / Android / Chrome)** | `/serginho`, `/hybrid`, `/specialists`, fluxo de especialista individual em `/specialist/...` (incluindo Didak). |
| **Funcionamento confirmado** | Serginho respondeu autenticado; Híbrido/Construtor respondeu autenticado; Especialistas abriu com lista e acesso a especialista individual; Didak abriu e respondeu; sem redirecionamento indevido para `/login`. |
| **Pendências preservadas (UX, não bloqueio técnico)** | Seletor de IA/modelo não está claramente visível no Serginho/generalista e no Híbrido/Construtor; pequeno ajuste visual no Serginho/generalista; organização/correção do seletor e ajustes visuais devem ser tratados em etapa futura (preferencialmente com possível unificação Serginho + Híbrido). |
| **Confirmação de não alteração funcional** | PR estritamente documental; sem alterações em `src/`, `api/`, rotas React, CSS, testes, dependências, `package.json`, `package-lock.json`, workflows, providers/modelos, prompts, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments ou configurações externas. |
| **Limites sem overclaim** | Esta validação não comprova clientes, receita, SLA, uptime, p95/p99, tração ou maturidade comercial; não afirmar validação plena do seletor de IA/modelo em todas as UIs; posicionamento oficial mantido: **protótipo avançado em validação**. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-01 — docs(validation): registrar evidência operacional pós-Fase 9 e reduzir overclaim no pitch

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(validation): registrar evidência operacional pós-Fase 9 e reduzir overclaim no pitch` |
| **Documento criado** | `docs/audits/validacao-operacional-pitch-pos-fase9-2026-06-01.md` |
| **Rotas públicas validadas manualmente em produção (owner / Android / Chrome)** | `/pitch/`, `/startup`, `/demo`, `/demo-autoplay` |
| **Pitch (texto)** | Frases suavizadas em `public/pitch/index.html` para reduzir overclaim e reforçar posição conservadora. |
| **Pendências preservadas** | Validação autenticada manual de `/serginho`, `/hybrid` e `/specialists` permanece pendente. |
| **Confirmação de não alteração funcional** | Mudança estritamente documental/textual; sem alteração em `src/`, `api/`, rotas React, CSS global, dependências, workflows, integrações externas, runtime, Auth/SaaS/Payments ou arquitetura do Serginho IA. |
| **Rollback** | Reverter este PR restaura o estado anterior; nenhuma migração, efeito colateral ou ajuste de infraestrutura é necessário. |

---

## 2026-06-01 — docs(pitch): adicionar página estática funcional em /pitch/

| Item | Detalhe |
|------|---------|
| **PR alvo** | #530 (`docs(pitch): preparar roteiro de banca do Serginho IA`) |
| **Página criada** | `public/pitch/index.html` |
| **URL esperada** | `/pitch/` |
| **Ajustes de link interno** | Link institucional aponta para `/startup` e link de demonstração aponta para `/demo`. |
| **Apoio textual mantido** | `docs/pitch/roteiro-banca-serginho-ia-2026-06-01.md` mantido com menção discreta ao pitch funcional em `/pitch/`. |
| **Confirmação de não alteração funcional do app principal** | Sem alterações em `src/`, `api/`, testes, rotas React, dependências, workflows, providers/modelos, prompts, registry/fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets, tag/release ou runtime do app principal. |
| **Validações executadas** | Baseline pré-mudança: `npm run build` ✅, `npm run lint` ✅ (warnings pré-existentes), `npm test -- --runInBand` ✅. Pós-mudança: `npm run build` ✅, `npm run lint` ✅ (warnings pré-existentes), `npm test -- --runInBand` ✅. Verificação de artefato estático: `dist/pitch/index.html` ✅. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-01 — docs(pitch): preparar roteiro de banca do Serginho IA

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(pitch): preparar roteiro de banca do Serginho IA` |
| **Documento criado** | `docs/pitch/roteiro-banca-serginho-ia-2026-06-01.md` |
| **Objetivo do roteiro** | Preparar roteiro conservador, claro e demonstrável para banca/startups, com foco em apresentação institucional pós-Fase 9 sem overclaim comercial. |
| **Decisão de nomenclatura** | Produto = **Serginho IA**; nome completo = **Serginho Inteligência Artificial**; RKMMAX = ecossistema/projeto. |
| **Confirmação de não alteração funcional** | PR estritamente documental; sem alterações em runtime, UI, código, rotas, testes, dependências, workflows, providers/modelos, prompts, registry/fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets, tag/release ou implementação funcional. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-01 — docs(validation): registrar validação visual pós-Fase 9

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(validation): registrar validação visual pós-Fase 9` |
| **Documento criado** | `docs/audits/validacao-visual-pos-fase9-2026-06-01.md` |
| **Rotas públicas** | `/`, `/startup`, `/demo`, `/demo-autoplay`, `/showcase`, `/login` tentadas via Playwright local; `/showcase` redirecionou para `/demo`. |
| **Screenshots automáticos** | Gerados e anexados em `docs/audits/evidence/visual-pos-fase9/` (sem imagem manual do owner). |
| **UIs operacionais** | Serginho IA (`/serginho`), Híbrido/Construtor (`/hybrid`) e Especialistas (`/specialists`) redirecionaram para `/login`; validação visual autenticada e presença do seletor de IA permanecem pendentes do owner. |
| **Confirmação de não alteração funcional** | Mudança documental/evidências apenas; sem alteração em runtime, UI funcional, código, rotas, testes, dependências, workflows, providers/modelos, prompts, registry/fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets, tag/release ou implementação funcional. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-01 — chore(deps): tratar Dependabot #477 isoladamente

| Item | Detalhe |
|------|---------|
| **Título do PR** | `chore(deps): tratar Dependabot #477 isoladamente` |
| **Escopo** | PR técnico isolado para atualizar `archiver` no pipeline de empacotamento ZIP do Construtor/Híbrido, sem expansão funcional. |
| **Origem da pendência** | Dependabot #477. |
| **Pacote** | `archiver` (`^7.0.1` → `^8.0.0`). |
| **Arquivos alterados** | `package.json`, `package-lock.json`, `src/lib/construtor/artifactPackager.js`, `CHECKLIST.md`. |
| **Compatibilidade `artifactPackager.js`** | Ajuste mínimo necessário no import/instanciação para `archiver@8` (substituição de default import por `ZipArchive`). |
| **Validações executadas** | `npm install` ✅; `npm test -- --runInBand src/lib/construtor/__tests__/artifactPackager.test.js` ✅; `npm run lint` ✅ (253 warnings pré-existentes, 0 errors); `npm run build` ✅; `npm test -- --runInBand` ✅ (68 suítes, 2471 testes). |
| **Risco** | Moderado controlado: upgrade major de `archiver` no empacotador ZIP, mitigado por adaptação mínima e validações específicas/completas. |
| **Confirmação sobre #475** | #475 não foi tocado neste PR. |
| **Confirmação de não alteração funcional ampla** | Houve alteração técnica mínima e isolada em `src/lib/construtor/artifactPackager.js`, restrita à compatibilidade com `archiver@8`, sem expansão funcional do Construtor/Híbrido; sem alterações em Serginho, Especialistas, ABNT, Auth/SaaS/Payments, providers/modelos, prompts, registry, fallback, rotas, workflows ou UI. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-06-01 — chore(deps): tratar Dependabot #475 isoladamente

| Item | Detalhe |
|------|---------|
| **Título do PR** | `chore(deps): tratar Dependabot #475 isoladamente` |
| **Escopo** | PR técnico isolado para atualização mínima de dependência, sem alteração funcional. |
| **Origem da pendência** | Dependabot #475 (`@stripe/stripe-js` de `^9.2.0` para `^9.6.0`). |
| **Confirmação de escopo** | Dependabot #477 (`archiver`) não foi tocado neste PR. |
| **Arquivos alterados** | `package.json`, `package-lock.json`, `CHECKLIST.md`. |
| **Validações executadas** | `npm install` ✅; `npm run lint` ✅ (253 warnings pré-existentes, 0 errors); `npm run build` ✅; `npm test -- --runInBand` ✅ (68 suítes, 2471 testes). |
| **Confirmação de não alteração funcional** | Sem alterações em `src/`, `api/`, testes, CSS, rotas, workflows, providers/modelos, prompts, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments ou integrações externas. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-05-31 — docs(f9): registrar encerramento e decisão da Fase 9

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f9): registrar encerramento e decisão da Fase 9` |
| **Identificação** | **F9-06 — Encerramento e decisão da Fase 9** |
| **Escopo** | Documental / governança / encerramento de fase, sem implementação funcional. |
| **Documento criado** | [`docs/audits/f9-06-encerramento-decisao-fase9-2026-05-31.md`](docs/audits/f9-06-encerramento-decisao-fase9-2026-05-31.md) |
| **Veredito** | Bloco 6 da Fase 9 concluído com encerramento documental e decisão conservadora sobre próxima etapa. |
| **Consolidação da Fase 9** | Blocos F9-01 a F9-06 registrados e rastreáveis, sem implementação funcional, sem tag/release e sem resolver #475/#477 nesta tarefa. |
| **Pendências preservadas** | Dependabot #475/#477, tag/release futura, validação visual manual real com evidência, observabilidade/métricas/telemetria reais, implementação funcional futura, evoluções de Auth/SaaS/Payments e alterações em providers/modelos/prompts/registry/fallback, Serginho, Híbrido/Construtor, Especialistas ou ABNT. |
| **Recomendação sobre próxima etapa** | Encerrar Fase 9 documentalmente e só avançar após decisão explícita do owner (PR técnico isolado #475, PR técnico isolado #477, validação visual real com evidência, tag/release de baseline ou auditoria de transição para eventual Fase 10). |
| **Confirmação de não alteração funcional** | Sem alteração em runtime, UI, código, rotas, testes, dependências, workflows, providers/modelos, prompts, registry, fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets, tag/release, dashboard, endpoint, telemetria real ou implementação funcional. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-05-31 — docs(f9): planejar observabilidade real mínima

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f9): planejar observabilidade real mínima` |
| **Identificação** | **F9-05 — Plano mínimo de observabilidade real sem implementação externa** |
| **Escopo** | Documental / governança / planejamento de observabilidade, sem implementação funcional. |
| **Documento criado** | [`docs/audits/f9-05-plano-minimo-observabilidade-real-2026-05-31.md`](docs/audits/f9-05-plano-minimo-observabilidade-real-2026-05-31.md) |
| **Veredito** | Bloco 5 da Fase 9 registrado como plano mínimo e seguro de observabilidade futura, sem criação de dashboard/endpoint/integração externa/telemetria nova. |
| **Limites explícitos** | Sem SLA, uptime, p95/p99, custo real, volume real de usuários, clientes/receita/tração, dashboard real, integração externa ou alteração de runtime comprovados nesta tarefa. |
| **Pendências preservadas** | Dependabot #475/#477, tag/release futura, validação visual manual real, observabilidade/métricas/telemetria reais ainda não implementadas, implementação funcional futura, evoluções de Auth/SaaS/Payments e alterações em providers/modelos/prompts/registry/fallback, Serginho, Híbrido/Construtor, Especialistas ou ABNT. |
| **Confirmação de não alteração funcional** | Sem alteração em runtime, UI, código, rotas, testes, dependências, workflows, providers/modelos, prompts, registry, fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets, tag/release, dashboard, endpoint, telemetria real ou implementação funcional. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-05-31 — docs(f9): registrar validação visual manual controlada

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f9): registrar validação visual manual controlada` |
| **Identificação** | **F9-04 — Validação visual manual controlada** |
| **Escopo** | Documental / checklist / validação manual, sem implementação funcional. |
| **Documento criado** | [`docs/audits/f9-04-validacao-visual-manual-controlada-2026-05-31.md`](docs/audits/f9-04-validacao-visual-manual-controlada-2026-05-31.md) |
| **Veredito** | Bloco 4 da Fase 9 registrado como checklist visual manual controlado; execução visual real permanece pendente do owner sem evidência anexada nesta tarefa. |
| **Pendências preservadas** | Dependabot #475/#477, tag/release futura, observabilidade/métricas/telemetria reais, implementação funcional futura, evoluções de Auth/SaaS/Payments e alterações em providers/modelos/prompts/registry/fallback, Serginho, Híbrido/Construtor, Especialistas ou ABNT. |
| **Confirmação de não alteração funcional** | Sem alteração em runtime, UI, código, rotas, testes, dependências, workflows, providers/modelos, prompts, registry, fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets, tag/release ou implementação funcional. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-05-31 — docs(f9): auditar pendências Dependabot

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f9): auditar pendências Dependabot` |
| **Identificação** | **F9-03 — Auditoria controlada das pendências Dependabot** |
| **Escopo** | Documental / governança / decisão técnica, sem atualização de dependências e sem implementação funcional. |
| **Documento criado** | [`docs/audits/f9-03-auditoria-pendencias-dependabot-2026-05-31.md`](docs/audits/f9-03-auditoria-pendencias-dependabot-2026-05-31.md) |
| **Veredito** | Bloco 3 da Fase 9 concluído em modo documental; #475 e #477 devem seguir separados em trilhas técnicas posteriores e isoladas. |
| **Decisão sobre #475** | `@stripe/stripe-js` 9.2.0→9.6.0: manter pendente e tratar apenas em PR técnico isolado futuro (risco menor/isolado, sem mistura com Auth/SaaS/Payments). |
| **Decisão sobre #477** | `archiver` 7.0.1→8.0.0: não aceitar automaticamente; tratar somente em PR técnico isolado com adaptação e testes (risco maior por breaking change). |
| **Confirmação de não alteração funcional** | Sem alteração em runtime, UI, código, testes, dependências, workflows, providers/modelos, prompts, registry, fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets, tag/release ou implementação funcional. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-05-31 — docs(f9): registrar decisão sobre baseline/tag/release

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f9): registrar decisão sobre baseline/tag/release` |
| **Identificação** | **F9-02 — Decisão explícita sobre baseline/tag/release** |
| **Escopo** | Documental / governança / decisão, sem implementação funcional. |
| **Documento criado** | [`docs/audits/f9-02-decisao-baseline-tag-release-2026-05-31.md`](docs/audits/f9-02-decisao-baseline-tag-release-2026-05-31.md) |
| **Decisão** | Tag/release condicionada e não criada nesta tarefa. |
| **Pendências preservadas** | Dependabot #475/#477, validação visual manual controlada, observabilidade/métricas/telemetria reais, tag/release futura e implementação funcional futura. |
| **Confirmação de não alteração funcional** | Sem alteração em runtime, UI, código, rotas, testes, dependências, workflows, providers/modelos, prompts, registry, fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets ou tag/release. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-05-31 — docs(f9): abrir formalmente a Fase 9

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f9): abrir formalmente a Fase 9` |
| **Identificação** | **F9-01 — Abertura formal da Fase 9** |
| **Escopo** | Documental / governança / abertura de fase, sem implementação funcional. |
| **Documento criado** | [`docs/audits/f9-01-abertura-formal-fase9-2026-05-31.md`](docs/audits/f9-01-abertura-formal-fase9-2026-05-31.md) |
| **Veredito** | Fase 9 aberta documentalmente, sem implementação funcional. |
| **Plano** | Fase 9 estruturada em até 6 blocos (Bloco 1 a Bloco 6) com trilha curta, controlada e reversível. |
| **Pendências preservadas** | Dependabot #475/#477, tag/release, validação visual manual, observabilidade real, métricas reais, telemetria real e implementação funcional futura. |
| **Confirmação de não alteração funcional** | Sem alteração em runtime, UI, código, rotas, testes, dependências, workflows, providers/modelos, prompts, registry, fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments, Vercel, Supabase, Stripe, secrets ou tag/release. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-05-31 — docs(audit): revisar auditoria de transição F7→F8 sem overclaim do seletor

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(audit): revisar auditoria de transição F7→F8 sem overclaim do seletor` |
| **Identificação** | **Revisão documental — Auditoria de transição Pós-Fase 7 → Fase 8** |
| **Escopo** | Revisão exclusivamente documental da auditoria de transição F7→F8, sem implementação funcional. |
| **Documento revisado** | [`docs/audits/fase7-para-fase8-auditoria-transicao-2026-05-29.md`](docs/audits/fase7-para-fase8-auditoria-transicao-2026-05-29.md) |
| **Correção aplicada** | Remoção de overclaim sobre o seletor de IA; relato reclassificado como não verificável visual/runtime no ambiente disponível, com inspeção estática sem inconsistência com F7-UX-08. |
| **Limitação preservada** | Sem validação visual/runtime em preview/produção e sem execução nominal comprovada dos testes do seletor nesta auditoria. |
| **Confirmação de não alteração funcional** | Sem alteração em `src/`, `api/`, testes, CSS, rotas, dependências, workflows, providers/modelos, prompts, Auth, Payments, Serginho, Híbrido/Construtor, Especialistas ou ABNT. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-05-30 — docs(f8): registrar decisão pós-baseline sobre tag/release

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f8): registrar decisão pós-baseline sobre tag/release` |
| **Identificação** | **F8-BL-02 — Decisão formal sobre tag/release e próxima trilha pós-baseline** |
| **Data** | 2026-05-30 |
| **Escopo** | Documental pós-baseline, sem implementação funcional |
| **Documento criado** | [`docs/audits/f8-bl-02-decisao-tag-release-proxima-trilha-2026-05-30.md`](docs/audits/f8-bl-02-decisao-tag-release-proxima-trilha-2026-05-30.md) |
| **Veredito** | Baseline pós-Fase 8 formalizado; Fase 8 encerrada documentalmente; Fase 9 não iniciada. |
| **Tag/Release** | Não criada nesta tarefa; recomendação condicionada/adiada para decisão explícita do owner. |
| **Próxima trilha recomendada** | Auditoria específica da Fase 9 antes de qualquer tag/release; manter implementação funcional adiada. |
| **Pendências preservadas** | Dependabot #475/#477, validação visual manual do owner, tag/release, métricas reais e telemetria real. |
| **Restrições preservadas** | Não altera runtime, UI, código, providers/modelos, dependências, workflows, prompts, registry, fallback; não inicia Fase 9. |
| **Rollback** | `git revert <commit-sha>` |

---

## 2026-05-30 — docs(f8): registrar baseline de transição pós-Fase 8

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f8): registrar baseline de transição pós-Fase 8` |
| **Identificação** | **F8-BL-01 — Baseline de Transição Pós-Fase 8** |
| **Data** | 2026-05-30 |
| **Escopo** | Documental/baseline de decisão, sem implementação funcional |
| **Documento criado** | [`docs/audits/f8-bl-01-baseline-transicao-pos-fase8-2026-05-30.md`](docs/audits/f8-bl-01-baseline-transicao-pos-fase8-2026-05-30.md) |
| **Veredito** | Fase 8 encerrada documentalmente; auditoria pós-Fase 8 ≈ 92%; prontidão próxima etapa ≈ 78%; Fase 9 não iniciada. |
| **Decisão tag/release** | Não criada nesta tarefa; condicionada a decisão explícita do owner e CI/revisão final. |
| **Pendências preservadas** | Dependabot #475; Dependabot #477; validação visual manual quando aplicável; métricas/telemetria reais; implementação funcional. |
| **Confirmação de não alteração funcional** | Sem alterações em `src/`, `api/`, testes, CSS, rotas, dependências, `package.json`, `package-lock.json`, workflows, providers/modelos, prompts, registry, fallback, Serginho, Híbrido/Construtor, Especialistas, ABNT, Auth/SaaS/Payments. |
| **Repositório** | Uso exclusivo de `kizirianmax/rkmmax-hibrido`. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-30 — docs(f8): registrar encerramento formal da Fase 8

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f8): registrar encerramento formal da Fase 8` |
| **Identificação** | **F8-OBS-06 — Encerramento formal da Fase 8 (documental/observabilidade)** |
| **Escopo** | Encerramento documental/observabilidade da Fase 8, sem implementação funcional e sem iniciar Fase 9. |
| **Documento criado** | [`docs/audits/fase8-encerramento-formal-2026-05-30.md`](docs/audits/fase8-encerramento-formal-2026-05-30.md) |
| **Entregas consolidadas** | PR #511 (transição F7→F8), PR #512 (F8-OBS-01), PR #513 (F8-OBS-02), PR #514 (F8-OBS-03), PR #515 (F8-OBS-04), PR #516 (F8-OBS-05) e este PR (F8-OBS-06). |
| **Veredito da Fase 8** | **Concluída no escopo documental/observabilidade**. Sem alteração de runtime, UI, código, providers/modelos, dependências ou workflows. |
| **Pendências adiadas** | Dependabot #475 e #477, tag/release, dashboard e qualquer evolução funcional permanecem fora desta tarefa. |
| **Confirmação de não alteração funcional** | Nenhuma alteração em `src/`, `api/`, testes, CSS, rotas, dependências, `package.json`, `package-lock.json`, workflows, providers/modelos, prompts, registry ou fallback. |
| **Status pós-encerramento** | Fase 7 encerrada documentalmente; Fase 8 encerrada documentalmente; arquitetura preservada; Fase 9 **não iniciada**. |
| **Repositório** | Uso exclusivo de `kizirianmax/rkmmax-hibrido` (sem uso de outros repositórios). |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-30 — docs(f8): documentar observabilidade mínima da camada de IA

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f8): documentar observabilidade mínima da camada de IA` |
| **Identificação** | **F8-OBS-05 — Observabilidade mínima da camada de IA/providers usados pelo Serginho (documental)** |
| **Data** | 2026-05-30 |
| **Escopo** | Documental/observabilidade (Fase 8), sem implementação funcional |
| **Documento criado** | [`docs/audits/f8-obs-05-observabilidade-camada-ia-providers-serginho-2026-05-30.md`](docs/audits/f8-obs-05-observabilidade-camada-ia-providers-serginho-2026-05-30.md) |
| **Pré-condições confirmadas** | Base `main`; PRs #511/#512/#513/#514/#515 mergeados; existência de `api/lib/serginho-orchestrator.js`, `api/lib/providers-config.js`, `api/lib/model-registry.js`, `src/utils/intelligentRouter.js`, `src/config/modelPriority.js` e `api/health.js`. |
| **Mapeamento documental entregue** | Orquestração soberana do Serginho; aliases/modelos/providers encontrados; distinção entre provider físico/alias/tier; fallback/prioridade/seleção manual; endpoint de health/status; testes relevantes já documentados. |
| **Confirmação arquitetural** | Serginho permanece gateway único e soberano; Groq/Gemini/outros são motores abaixo da orquestração; nenhum bypass introduzido. |
| **Limitações explícitas** | Sem chamada real a modelos com secret/custo; sem acesso a Vercel/Supabase/logs externos; sem inventar latência/SLA/uptime/status operacional não comprovado. |
| **Confirmação de não alteração funcional** | Sem alterações em `src/`, `api/`, testes, CSS, rotas, dependências, workflows, `package.json`, `package-lock.json`, providers/modelos/prompts/registry/fallback. |
| **Fase 8** | Mantida no escopo documental/observabilidade (sem expansão funcional). |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-30 — docs(f8): avaliar PRs Dependabot pendentes

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f8): avaliar PRs Dependabot pendentes` |
| **Identificação** | **F8-OBS-04 — Avaliação controlada dos PRs Dependabot #475 e #477 (sem upgrade funcional)** |
| **Data** | 2026-05-30 |
| **Escopo** | Documental/decisão (Fase 8), sem implementação funcional, sem alteração de dependências |
| **Documento criado** | [`docs/audits/f8-obs-04-avaliacao-controlada-dependabot-2026-05-30.md`](docs/audits/f8-obs-04-avaliacao-controlada-dependabot-2026-05-30.md) |
| **Pré-condições confirmadas** | Base `main`; PRs #511/#512/#513/#514 mergeados; PRs #475/#477 existentes e abertos; presença de `package.json` e `package-lock.json`. |
| **Avaliação PR #475** | Upgrade **minor** (`@stripe/stripe-js` 9.2.0→9.6.0), sem uso ativo encontrado no código; recomendação: **adiar para PR isolado** de decisão técnica. |
| **Avaliação PR #477** | Upgrade **major** (`archiver` 7.0.1→8.0.0), com falhas de CI na branch Dependabot e regressão de import (`default` export); recomendação: **não aprovar como está** e tratar em PR próprio. |
| **Confirmação de não alteração funcional** | Sem alterações em runtime, UI, código, rotas, estilos, testes, `src/`, `api/`, `package.json`, `package-lock.json`, workflows ou configurações externas. |
| **Dependabot PRs** | Nenhum PR Dependabot foi mergeado, fechado ou aprovado nesta tarefa. |
| **Fase 8** | Mantida no escopo documental/observabilidade (sem expansão funcional). |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-30 — docs(f8): consolidar dossiê externo para incubadoras e editais

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f8): consolidar dossiê externo para incubadoras e editais` |
| **Identificação** | **F8-OBS-03 — Dossiê externo para incubadoras/editais + matriz de evidências públicas** |
| **Data** | 2026-05-30 |
| **Escopo** | Documental / observabilidade e apresentação externa (Fase 8), sem implementação funcional |
| **Documento criado** | [`docs/audits/f8-obs-03-dossie-externo-incubadoras-editais-2026-05-30.md`](docs/audits/f8-obs-03-dossie-externo-incubadoras-editais-2026-05-30.md) |
| **Referências** | PR #511 (transição F7→F8), PR #512 (F8-OBS-01), PR #513 (F8-OBS-02) |
| **Conteúdo consolidado** | Descrição objetiva do RKMMAX/Serginho IA, problema, público-alvo, estágio de **protótipo funcional em validação**, arquitetura em camadas, rotas públicas, limites honestos, riscos de interpretação e roteiro de verificação em até 10 minutos. |
| **Matriz de evidências** | Inclui `/startup`, `/demo`, `/demo-autoplay`, auditoria Fase 7, F8-OBS-01, F8-OBS-02, status do seletor de IA (presente nas UIs operacionais e ausente em `/startup`), status dos testes críticos e limitações de overclaim comercial. |
| **Confirmação de não alteração funcional** | Sem alteração de runtime, UI, código, rotas, estilos, testes, dependências, workflows, `src/` ou `api/`. |
| **Arquivos alterados nesta entrega** | `docs/audits/f8-obs-03-dossie-externo-incubadoras-editais-2026-05-30.md`, `README.md`, `CHECKLIST.md`. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-30 — docs(f8): registrar evidência nominal dos testes críticos

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f8): registrar evidência nominal dos testes críticos` |
| **Identificação** | **F8-OBS-02 — Evidência nominal dos testes críticos (seletor de IA e prioridade/modelos)** |
| **Data local/de referência** | `2026-05-30` |
| **Data/hora da execução nominal (UTC)** | `2026-05-31T00:08:40Z` |
| **Branch / commit auditado** | `copilot/f8-obs-02-registrar-evidencia-nominal` / `3117dfe40bbde663299f16e31e759bf1be22ebca` |
| **Comando executado** | `npm test -- --runInBand api/__tests__/model-priority.test.js api/__tests__/specialist-model-selector.test.js` |
| **Arquivos de teste executados** | `api/__tests__/model-priority.test.js`; `api/__tests__/specialist-model-selector.test.js` |
| **Resultado nominal local** | ✅ **PASS** (`2/2` suites, `28/28` testes) |
| **Documento de evidência** | [`docs/audits/f8-obs-02-evidencia-nominal-testes-criticos-2026-05-30.md`](docs/audits/f8-obs-02-evidencia-nominal-testes-criticos-2026-05-30.md) |
| **Escopo / limitação** | Entrega exclusivamente documental/observabilidade; evidência nominal local (não substitui CI nominal do mesmo comando); sem uso de outros repositórios. |
| **Confirmação de não alteração funcional** | Sem alteração em runtime, UI, código, rotas, estilos, testes, dependências, workflows, `src/` ou `api/`. Nenhuma correção funcional aplicada nesta tarefa. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-30 — docs(f8): criar checklist de validação visual operacional

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(f8): criar checklist de validação visual operacional` |
| **Identificação** | **F8-OBS-01 — Checklist de validação visual operacional pós-Fase 7** |
| **Data** | 2026-05-30 |
| **Escopo** | Documental / observabilidade operacional mínima (Fase 8) |
| **Documento criado** | [`docs/audits/f8-obs-01-checklist-validacao-visual-operacional-2026-05-30.md`](docs/audits/f8-obs-01-checklist-validacao-visual-operacional-2026-05-30.md) |
| **Referências** | PR #511 (transição Fase 7 → Fase 8) e `docs/audits/fase7-para-fase8-auditoria-transicao-2026-05-29.md` |
| **Status** | ✅ Documento criado; **aguardando execução manual pelo owner** em preview/produção |
| **Confirmação de escopo** | Sem alteração de runtime, UI, rotas, estilos, testes, dependências, workflows, `src/` ou `api/`; nenhuma camada funcional alterada; nenhum bypass do Serginho. |
| **Rollback** | `git revert <commit-sha>` |

## 2026-05-30 — docs(checklist): registrar transição pós-Fase 7 e recomendação documental F8

| Item | Detalhe |
|------|---------|
| **Título do PR** | `docs(checklist): registrar transição pós-Fase 7 e recomendação documental F8` |
| **Identificação** | **Governança documental — registro de transição pós-Fase 7 → recomendação documental da Fase 8** |
| **Substitui** | PR #510 (fechado sem merge, travado com Files changed: 0). Esta entrada é o registro substituto, em branch nova, sem reutilizar a branch do #510. |
| **Natureza** | Atualização **exclusivamente documental/governança**, sem runtime. Sem alteração de código, testes, CSS, rotas, dependências, providers, modelos, prompts, Auth, Payments, Vercel, Supabase, Serginho, Híbrido/Construtor, Especialistas ou ABNT. |
| **PR de auditoria já mergeado** | PR #509 — `docs(audit): registrar auditoria de transição pós-Fase 7 e recomendação oficial da Fase 8`. |
| **Merge SHA do PR #509** | `efbd120b3585996f4039a843efda897943698372` |
| **Documento relacionado** | [`docs/audits/fase7-para-fase8-auditoria-transicao-2026-05-29.md`](docs/audits/fase7-para-fase8-auditoria-transicao-2026-05-29.md) |
| **Status da Fase 7** | **100% no escopo documental/estático confirmado**. |
| **Percentual da auditoria de transição** | **≈ 95%**. |
| **Relato do seletor de IA** | **NÃO-PENDÊNCIA CONFIRMADA**. `/startup` é página institucional pública do RKMMAX e corretamente **sem seletor de IA**; o seletor pertence apenas às UIs operacionais: Serginho IA, Híbrido/Construtor e Especialistas. |
| **Evidências de CI utilizadas** | **Apenas agregadas**, baseadas na conclusão dos workflows `test.yml` (run 26585673516) e `coverage.yml` (run 26585673844) com `conclusion: success` para o HEAD `e7a178e009ff13aac956f69e0812fe7a8459311f`; **sem** alegar execução local ou execução nominal de testes não comprovada. |
| **Recomendação documental da Fase 8** | **Definida** no documento do PR #509: *Fase 8 — Hardening operacional pós-UI/UX (observabilidade pública mínima e fechamento das lacunas residuais), sem expansão funcional do produto*. Entrega mínima recomendada: **F8-OBS-01**. |
| **Status da Fase 8** | **Não iniciada nesta tarefa.** |
| **Confirmação explícita de ausência de alteração funcional** | Nenhuma alteração em `src/`, `api/`, testes, CSS, rotas, dependências, providers, modelos, prompts, Auth, Payments, Vercel, Supabase, Stripe, Dependabot, Serginho, Híbrido/Construtor, Especialistas ou ABNT. Nenhum bypass do Serginho. Nenhuma confusão de camadas. |
| **Arquivos alterados** | `CHECKLIST.md` (prepend de uma única entrada nova no topo, sem truncamento, sem reordenação e sem reformatação do histórico anterior). |
| **Validação de diff** | `git diff --name-only` lista somente `CHECKLIST.md`; `git diff CHECKLIST.md` mostra somente adições no topo; zero deleções; zero alterações em linhas históricas. |
| **Risco** | Mínimo. Entrega exclusivamente documental, sem efeito em runtime. |
| **Rollback** | `git revert <commit-sha>`, **sem impacto em runtime**. |

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

## 2026-06-06 — feat(construtor): evidência segura do fluxo candidate → sanitize em `/webcontainer-spike`

| Item | Detalhe |
|------|---------|
| **Título do PR** | `feat(construtor): evidenciar fluxo seguro candidate -> adapter -> sanitize na rota experimental /webcontainer-spike` |
| **Base confirmada** | `origin/main` reconfirmada em `7f03b125e0b240675abbd9658f9f668c3d7b2a0b` (`feat(construtor): conectar artifact candidate controlado ao contrato sanitizado WebContainer (#578)`). |
| **Arquivos alterados** | `CHECKLIST.md`; `src/pages/WebContainerSpike.jsx`; `src/pages/WebContainerSpike.css`; `src/pages/tests/WebContainerSpike.test.jsx`; `src/lib/construtor/webcontainerSpikeEvidence.js`; `src/lib/construtor/tests/webcontainerSpikeEvidence.test.js`. |
| **Escopo** | Somente client-side na rota experimental `/webcontainer-spike`, sem integração com geração real, sem backend, sem `/api/`. |
| **Evidência segura exibida na UI** | Card com: candidate controlado, adapter aprovado, contrato sanitizado aprovado, execução client-side/WebContainer, arquivos permitidos, payload bruto não exibido, backend/API não usado, `executeArtifact` server-side desativado e aviso de spike experimental. |
| **Privacidade e segurança** | Nenhum conteúdo bruto de arquivo, `zipBase64`, `content`, `contentPreview`, `user_email`, secrets ou tokens é exibido. |
| **Execução preservada** | Runner continua manual/lazy via clique; import de `@webcontainer/api` permanece no runner existente. |
| **Validação local** | `npm test`; `npm run build`; `git diff --check origin/main...HEAD`; `git diff --name-only origin/main...HEAD`. |
| **Arquitetura preservada** | `api/` intocado; sem endpoint, sem migration, sem backend; App/AuthGate/Header não alterados; contrato sanitizado e adapter não enfraquecidos. |
