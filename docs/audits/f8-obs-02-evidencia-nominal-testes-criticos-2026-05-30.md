# F8-OBS-02 — Evidência nominal dos testes críticos (seletor de IA e prioridade/modelos)

**ID:** F8-OBS-02  
**Fase:** 8 — Observabilidade operacional mínima  
**Data local de referência do registro:** 2026-05-30  
**Tipo:** Documental (sem implementação funcional)  
**Repositório auditado:** `kizirianmax/rkmmax-hibrido` (exclusivo)  

---

## Objetivo

Registrar evidência **nominal e verificável** dos testes críticos relacionados a seletor de IA, prioridade/modelos, Especialistas e consistência da configuração de modelos, reduzindo dependência de evidência apenas agregada de CI.

---

## Pré-condições verificadas

1. Branch base confirmada em `main` (merge-base com `origin/main` em `484e42113fce08f6e3696fe38614fbc5ec405746`).
2. PR #511 confirmado como **mergeado** em `main`.
3. PR #512 confirmado como **mergeado** em `main`.
4. Documento F8-OBS-01 confirmado em `main`: `docs/audits/f8-obs-01-checklist-validacao-visual-operacional-2026-05-30.md`.
5. Testes críticos confirmados no repositório:
   - `api/__tests__/model-priority.test.js`
   - `api/__tests__/specialist-model-selector.test.js`
6. Script correto de testes confirmado em `package.json`:
   - `"test": "NODE_OPTIONS='--experimental-vm-modules' jest"`

---

## Execução nominal controlada

- **Data local de referência desta evidência:** `2026-05-30`
- **Data/hora da execução nominal (UTC):** `2026-05-31T00:08:40Z`
- **Branch auditada:** `copilot/f8-obs-02-registrar-evidencia-nominal`
- **Commit auditado:** `3117dfe40bbde663299f16e31e759bf1be22ebca`
- **Comando executado:**

```bash
npm test -- --runInBand api/__tests__/model-priority.test.js api/__tests__/specialist-model-selector.test.js
```

- **Arquivos de teste executados nominalmente:**
  - `api/__tests__/model-priority.test.js`
  - `api/__tests__/specialist-model-selector.test.js`

- **Resultado:** **PASS**
  - Test Suites: `2 passed, 2 total`
  - Tests: `28 passed, 28 total`
  - Ran all test suites matching `api/__tests__/model-priority.test.js|api/__tests__/specialist-model-selector.test.js`

---

## Resumo objetivo

A execução nominal local confirmou, neste commit auditado, a passagem dos dois testes críticos diretamente ligados a prioridade/modelos e seletor de IA na camada de Especialistas, sem necessidade de alteração funcional.

---

## Limitações e escopo

- Evidência desta entrega é de **execução local nominal** no ambiente do agente.
- Este registro **não** substitui logs de execução nominal em CI para o mesmo comando.
- Nenhum outro repositório foi consultado, comparado, inferido ou utilizado.

---

## Confirmação de não alteração funcional

Esta entrega é **exclusivamente documental/observabilidade** (Fase 8, F8-OBS-02):

- sem alteração de runtime;
- sem alteração de UI, código, rotas, estilos, testes, dependências, workflows ou configurações;
- sem correção de testes;
- sem expansão de escopo arquitetural.

Rollback documental, se necessário: `git revert <commit-sha>`.
