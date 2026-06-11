# ADR — conteudo-com-acesso-dinamico e taxonomia de artefatos exportáveis/executáveis

## 1) Status

Aceita como decisão documental inicial, sem implementação de código.

## 2) Contexto

O Gerador de Artefatos já gera e exporta ZIP real. O sistema possui preview estrutural e diagnóstico verdict-only. O sistema ainda não executa artefatos: WebContainer permanece desativado e `executeArtifact` server-side permanece `disabled`.

No estado atual, o reason `conteudo-com-acesso-dinamico` aparece quando JavaScript contém acesso dinâmico/DOM. Esse bloqueio veio do contrato de execução Node/WebContainer e hoje também impacta a trilha estática, porque o contrato estático client-side reutiliza a mesma validação.

## 3) Diagnóstico

O reason `conteudo-com-acesso-dinamico` nasce em `src/lib/construtor/webcontainerArtifactContract.js`, no array `FORBIDDEN_CONTENT_PATTERNS` (regex com `jsOnly: true`, aplicado apenas em arquivos `.js` por `validateArtifactContent`).

Ele bloqueia padrões como:

- `globalThis`, `window`, `self`, `document`, `navigator`, `location`
- acesso dinâmico por colchetes (`["..."]` e `[x + ...]`)
- `eval(` e `Function(`

No contrato Node/WebContainer, esse bloqueio é correto e protege contra evasão de rede e execução dinâmica insegura (há teste dedicado em `src/lib/construtor/__tests__/webcontainerArtifactContract.test.js` confirmando a intenção anti-evasão).

Porém, o contrato estático client-side (`src/lib/construtor/constructorStaticClientArtifactContract.js`) reutiliza essa validação. Como o reader (`src/lib/construtor/constructorApprovedPreviewDiagnosticReader.js`) roteia HTML/CSS/JS com entrypoint `index.html` para esse contrato (`stage: "static-contract"`), artefatos com DOM caem em `unavailable`.

Esse comportamento é conservador e seguro no estado atual (nada é executado), mas conceitualmente desalinhado para caminho estático, onde DOM é comportamento normal de front-end. A decisão correta **não** é relaxar contrato; é separar classificação de artefatos antes de qualquer execução.

## 4) Decisão

Adotar, como direção arquitetural futura, taxonomia separada:

- `exportable`: artefato pode ser gerado, empacotado e baixado como ZIP (já suportado hoje).
- `previewable-static`: artefato pode ter preview visual estático HTML/CSS sem executar JavaScript (futuro, não implementado).
- `executable-client`: artefato requer execução client-side com JavaScript/DOM; só poderá ser considerado futuramente via WebContainer ou sandbox client-side equivalente.
- `blocked`: artefato inseguro, fora de contrato, com rede/import externo/path perigoso/padrão proibido sem isolamento adequado.

## 5) Invariantes

- Serginho IA permanece orquestrador soberano/gateway único.
- Híbrido/Construtor gera artefatos.
- ZIP exportável **não** significa artefato executável.
- Preview estrutural **não** significa execução.
- Diagnóstico verdict-only não executa nada.
- WebContainer permanece desativado.
- `executeArtifact` server-side permanece `disabled`.
- Não há bypass ao Serginho.
- Contratos e allowlists não serão relaxados sem evidência e sem decisão separada.

## 6) Decisões negativas (fora deste PR)

Este PR **não decide**:

- ativar WebContainer;
- reativar `executeArtifact`;
- permitir execução server-side;
- relaxar `conteudo-com-acesso-dinamico`;
- expandir allowlist;
- executar JS em iframe;
- criar preview executável;
- tratar DOM como `eligible` imediatamente.

## 7) Critérios mínimos futuros para execução client-side

Antes de considerar ativar WebContainer:

- ADR mergeada.
- Taxonomia documentada.
- Camada de classificação verdict-only implementada e testada em PR futuro separado.
- Telemetria real validando rótulos.
- Contrato client-side separado do contrato Node/WebContainer.
- COOP/COEP/`crossOriginIsolated` verificados.
- Licenciamento/uso de `@webcontainer/api` resolvido.
- Boot manual/lazy.
- Sem autoexecução.
- Rollback testado.
- UX deixando explícito exportável vs executável.
- `executeArtifact` server-side continua `disabled`.

## 8) Roadmap recomendado

1. Este PR documental ADR.
2. PR futuro de camada pura de classificação verdict-only, sem execução.
3. PR futuro de UX para diferenciar "exportável agora" de "executável futuramente".
4. Avaliação futura de preview visual estático HTML/CSS em iframe sandbox sem `allow-scripts`.
5. WebContainer somente após gates documentados e aprovados.

## 9) Consequências

### Prós

- Evita relaxar contrato prematuramente.
- Preserva segurança.
- Melhora clareza arquitetural.
- Prepara evolução para WebContainer.
- Ajuda pitch/incubadora com narrativa honesta.

### Contras

- Ainda não resolve preview executável.
- DOM continua bloqueado para elegibilidade executável.
- Exige PRs futuros para classificação/UX.

## 10) Rollback

Como é documental, rollback por `git revert <commit-sha>`.
