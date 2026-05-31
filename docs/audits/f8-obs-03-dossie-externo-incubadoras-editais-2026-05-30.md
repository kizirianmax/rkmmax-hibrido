# F8-OBS-03 — Dossiê externo para incubadoras, editais e avaliadores

**ID:** F8-OBS-03  
**Fase:** 8 — Observabilidade e apresentação externa  
**Data de referência:** 2026-05-30  
**Tipo:** Documental (sem implementação funcional)  
**Repositório auditado:** `kizirianmax/rkmmax-hibrido` (exclusivo)  

---

## 1) Resumo objetivo do projeto

O **RKMMAX / Serginho IA** é um sistema de orquestração de IA em que o **Serginho IA** atua como orquestrador soberano e gateway único de decisões/execução por IA.  
O foco do projeto é reduzir esforço e retrabalho na geração de entregáveis estruturados, com separação clara de camadas e rastreabilidade documental.

**Estágio atual:** **protótipo funcional em validação** (não classificado como produto em produção).

---

## 2) Problema que o projeto resolve

Em fluxos comuns de IA, a saída tende a ser texto solto, sem ciclo consistente de geração, revisão e conformidade documental.  
O RKMMAX organiza esse processo com orquestração central, camadas especializadas e evidências públicas/documentais de governança.

---

## 3) Público-alvo

- estudantes, pesquisadores e profissionais que precisam de entregáveis estruturados;
- avaliadores técnicos (incubadoras, editais, bancas) que precisam verificar arquitetura, coerência de camadas e evidências de validação;
- interessados em inspeção pública do projeto via rotas de demonstração institucional.

---

## 4) Arquitetura em camadas (verdade fixa)

- **Serginho IA:** orquestrador soberano e gateway único de decisões/execução por IA.
- **Híbrido/Construtor:** geração e revisão de artefatos concretos.
- **Especialistas:** especialistas de domínio.
- **ABNT:** validação/conformidade documental.
- **UI/UX/Demo:** camada pública de apresentação e demonstração.
- **Auth / SaaS / Payments:** camadas separadas.
- **/startup:** página institucional pública do RKMMAX, corretamente **sem** seletor de IA.
- O seletor de IA pertence somente às UIs operacionais (Serginho IA, Híbrido/Construtor e Especialistas).

---

## 5) Rotas públicas para avaliadores

- `/startup` — página institucional pública para entendimento do projeto.
- `/demo` — demonstração pública guiada.
- `/demo-autoplay` — demonstração pública em modo autoplay.

---

## 6) Matriz de evidências públicas (F8-OBS-03)

| Evidência | Tipo | Onde verificar | Status registrado | Observação de limite |
|---|---|---|---|---|
| Página institucional `/startup` | Rota pública | `/startup` | Presente e pública | Deve permanecer sem seletor de IA |
| Demo pública `/demo` | Rota pública | `/demo` | Presente e pública | Comunicação deve evitar overclaim |
| Demo pública `/demo-autoplay` | Rota pública | `/demo-autoplay` | Presente e pública | Comunicação deve evitar overclaim |
| Auditoria de transição Fase 7 → Fase 8 | Documento | `docs/audits/fase7-para-fase8-auditoria-transicao-2026-05-29.md` | Registrada | Base documental da transição |
| F8-OBS-01 (checklist visual operacional) | Documento | `docs/audits/f8-obs-01-checklist-validacao-visual-operacional-2026-05-30.md` | Registrado | Execução manual é do owner |
| F8-OBS-02 (evidência nominal de testes críticos) | Documento | `docs/audits/f8-obs-02-evidencia-nominal-testes-criticos-2026-05-30.md` | Registrado | Evidência nominal local documentada |
| Seletor de IA nas UIs operacionais | Requisito arquitetural | Serginho IA / Híbrido / Especialistas | Esperado como presente | Sem bypass ao Serginho |
| Seletor de IA em `/startup` | Requisito arquitetural | `/startup` | Esperado como ausente | Ausência é comportamento correto |
| Testes críticos (`model-priority`, `specialist-model-selector`) | Evidência técnica | Documento F8-OBS-02 | PASS nominal documentado | Não extrapolar para produção real |
| Tração comercial (clientes, receita, MRR, produção real) | Limitação explícita | Comunicação externa | **Não alegar sem comprovação** | Não inventar dados comerciais |

---

## 7) Limites honestos do estado atual

- o projeto está em estágio de **protótipo funcional em validação**;
- este dossiê não comprova operação comercial em produção;
- não há alegação de clientes pagantes, receita, MRR ou tração real sem comprovação formal;
- esta entrega é apenas documental/observabilidade, sem alteração de runtime, UI ou código.

---

## 8) Riscos de interpretação externa

1. Confundir demo pública com operação comercial em produção.
2. Interpretar linguagem institucional como prova de tração comercial.
3. Confundir `/startup` (institucional) com UIs operacionais (onde o seletor de IA existe).
4. Assumir que evidência documental substitui due diligence técnica/comercial completa.

---

## 9) Verificação rápida para avaliador (até 10 minutos)

1. Abrir `/startup` e confirmar caráter institucional público e ausência de seletor de IA.
2. Abrir `/demo` e `/demo-autoplay` para entendimento rápido da proposta.
3. Ler os documentos:
   - `docs/audits/fase7-para-fase8-auditoria-transicao-2026-05-29.md`
   - `docs/audits/f8-obs-01-checklist-validacao-visual-operacional-2026-05-30.md`
   - `docs/audits/f8-obs-02-evidencia-nominal-testes-criticos-2026-05-30.md`
4. Confirmar coerência arquitetural: seletor de IA somente em UIs operacionais, nunca em `/startup`.
5. Confirmar ausência de alegações comerciais não comprovadas (clientes, receita, MRR, produção real).

---

## 10) Escopo desta entrega (F8-OBS-03)

- Consolidação documental para uso externo (incubadoras/editais/avaliadores).
- Sem implementação funcional.
- Sem alterações em `src/`, `api/`, testes, dependências, workflows ou rotas.

Rollback documental, se necessário: `git revert <commit-sha>`.
