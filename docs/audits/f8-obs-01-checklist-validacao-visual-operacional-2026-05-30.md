# F8-OBS-01 — Checklist de validação visual operacional pós-Fase 7

**ID:** F8-OBS-01  
**Fase:** 8 — Observabilidade operacional mínima  
**Data:** 2026-05-30  
**Tipo:** Documental (sem implementação funcional)  
**Escopo desta entrega:** exclusivamente documental (`docs/audits/` + `CHECKLIST.md`)  
**Referências:** PR #511 (transição Fase 7 → Fase 8), `docs/audits/fase7-para-fase8-auditoria-transicao-2026-05-29.md`

---

## Objetivo

Fornecer um checklist manual, claro e reproduzível para validação visual operacional em preview/produção, garantindo coerência entre rotas públicas e UIs operacionais após a Fase 7.

---

## Escopo e não-escopo

### Escopo

- [ ] Executar validação visual manual das rotas públicas: `/`, `/startup`, `/demo`, `/demo-autoplay`, `/login`.
- [ ] Executar validação visual manual das UIs operacionais: Serginho IA, Híbrido/Construtor, Especialistas.
- [ ] Validar posicionamento arquitetural do seletor de IA (presença/ausência esperadas).
- [ ] Validar comunicação externa de protótipo funcional em validação.

### Não-escopo

- Não corrigir UI/UX, runtime, rotas, estilos, testes, APIs ou código.
- Não alterar `src/`, `api/`, dependências, workflows, Auth, Payments, ABNT, Serginho, Híbrido/Construtor ou Especialistas.
- Não executar mudanças funcionais nesta tarefa.

---

## Pré-requisitos para execução manual

- [ ] Acesso ao ambiente **preview** e/ou **produção**.
- [ ] Navegador atualizado (Chrome/Edge/Firefox) com DevTools.
- [ ] Janela anônima para validar experiência pública sem sessão.
- [ ] Registro de evidências (anotações e, opcionalmente, screenshots locais).
- [ ] Tempo reservado: **< 30 minutos**.

---

## Seção A — Rotas públicas

### A.1 — `/`
- [ ] Carrega sem erro de renderização (tela útil exibida).
- [ ] Layout e identidade visual estão coerentes com páginas públicas.
- [ ] Não há erro crítico no console (exceptions que bloqueiem uso da página).
- [ ] Mensagem pública mantém posicionamento de produto em validação, sem promessa exagerada.

### A.2 — `/startup`
- [ ] Carrega sem login e sem redirecionamento indevido.
- [ ] Conteúdo institucional está claro e separado de operação interna.
- [ ] **Não há seletor de IA** visível na página.
- [ ] Não há confusão visual entre institucional público e UI operacional.

### A.3 — `/demo`
- [ ] Carrega sem login e sem erro crítico.
- [ ] Permite entendimento do produto por avaliador externo.
- [ ] Comunicação evita alegações não comprovadas (produção, clientes, receita, uso real).

### A.4 — `/demo-autoplay`
- [ ] Carrega sem login e sem erro crítico.
- [ ] Fluxo ajuda avaliador externo a compreender proposta do produto rapidamente.
- [ ] Comunicação evita alegações não comprovadas (produção, clientes, receita, uso real).

### A.5 — `/login`
- [ ] Carrega sem erro de layout.
- [ ] Mantém separação entre camada pública e acesso operacional autenticado.

---

## Seção B — UIs operacionais

### B.1 — Serginho IA (`/serginho`)
- [ ] Tela operacional carrega sem erro crítico.
- [ ] Contexto visual é operacional (não institucional).
- [ ] Seletor de IA está presente e funcionalmente visível.

### B.2 — Híbrido/Construtor (`/hybrid`)
- [ ] Tela operacional carrega sem erro crítico.
- [ ] Contexto visual é operacional (não institucional).
- [ ] Seletor de IA está presente e funcionalmente visível.

### B.3 — Especialistas (`/specialists` e fluxo de especialista)
- [ ] Tela de especialistas carrega sem erro crítico.
- [ ] Fluxo operacional mantém separação de camada.
- [ ] Seletor de IA aparece na interface operacional esperada.

---

## Seção C — Seletor de IA (verificação arquitetural visual)

- [ ] Confirmar que `/startup` **não possui** seletor de IA.
- [ ] Confirmar presença do seletor apenas nas UIs operacionais previstas: Serginho IA, Híbrido/Construtor, Especialistas.
- [ ] Confirmar que não há mensagem, CTA ou fluxo que gere bypass do Serginho como gateway único.
- [ ] Confirmar ausência de confusão entre página institucional pública e telas operacionais.

---

## Seção D — Comunicação externa

- [ ] Página pública comunica que o RKMMAX é **protótipo funcional em validação**.
- [ ] `/demo` e `/demo-autoplay` ajudam avaliador externo a entender o produto sem login.
- [ ] Não há promessa exagerada de ambiente de produção, base de clientes, receita ou uso real não comprovado.
- [ ] Linguagem pública permanece coerente com escopo documental e estado atual do produto.

---

## Observações e riscos (preencher durante execução manual)

- [ ] Sem observações no momento.
- [ ] Risco identificado 1: ________________________________
- [ ] Risco identificado 2: ________________________________
- [ ] Divergência visual/arquitetural documentada (sem correção nesta tarefa): ________________________________

---

## Resultado da execução manual

- [ ] **APROVADO** — validação visual operacional concluída sem divergências críticas.
- [ ] **APROVADO COM RESSALVAS** — divergências registradas em observações/riscos.
- [ ] **REPROVADO** — divergências críticas exigem nova análise documental.

---

## Rollback documental

Em caso de necessidade de reversão desta entrega documental:

```bash
git revert <commit-sha>
```
