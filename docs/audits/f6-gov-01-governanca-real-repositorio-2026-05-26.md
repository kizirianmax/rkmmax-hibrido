# F6-GOV-01 — Auditoria de Governança Real do Repositório

**Data:** 2026-05-26  
**Repositório:** `kizirianmax/rkmmax-hibrido`  
**Escopo:** documental (`docs/audits/` + `CHECKLIST.md`)  
**Fase:** 6 — Governança Documental  
**Status:** ✅ Documentado / sem alteração de runtime

---

## Fontes auditadas

| Arquivo | O que revelou |
|---------|--------------|
| `CHECKLIST.md` | Histórico verificável de F1 a F6 (append-only, rastreável por data e PR) |
| `README.md` | Proposta de valor, estado atual do produto, separação pronto/estabilização/futuro |
| `docs/DEVELOPMENT_GUIDELINES.md` | Política de merge obrigatória: CI verde como pré-condição absoluta |
| `CONTRIBUTING.md` | Fluxo documentado de branch naming, testes, lint, PR template |
| `SECURITY.md` | Canal de reporte privado, prazos de resposta, escopo de vulnerabilidades |
| `docs/BRANCH_PROTECTION_GUIDE.md` | Guia de configuração (instrucional — status real discutido abaixo) |
| `docs/MAINTENANCE.md` | Stub mínimo com referência a `DEVELOPMENT_GUIDELINES.md` |
| `.github/workflows/test.yml` | CI ativo: test + coverage em push/PR |
| `.github/workflows/coverage.yml` | CI ativo: coverage em push/PR |
| `docs/audits/f5-urgentes-encerramento-2026-05-25.md` | Baseline verificado: lint PASS, build PASS, 66 suítes / 2455 testes PASS |
| `docs/audits/fase-4-para-fase-5-auditoria-transicao-2026-05-25.md` | Decisão formal de Fase 5, critérios de prontidão |
| PRs F4, F5, F6 (registros em `CHECKLIST.md`) | Histórico de PRs pequenos e reversíveis, com escopo controlado |

---

## 1. Governança já existente

O que de fato está implementado e verificável no repositório hoje:

### 1.1 Trilha de auditoria documental (`CHECKLIST.md`)

- Arquivo `CHECKLIST.md` funciona como log append-only de cada PR significativo.
- Cada entrada registra: identificação da fase, o que foi auditado, o que mudou, arquivos alterados, validação executada, riscos/limites conhecidos e instrução de rollback.
- Histórico cobre F1 → F6, com entradas datadas e rastreáveis.
- **Verificável:** qualquer avaliador pode ler o arquivo e reconstruir a sequência de decisões.

### 1.2 Integração Contínua (CI)

- Dois workflows ativos (`.github/workflows/test.yml`, `.github/workflows/coverage.yml`) executam em todo push e PR.
- Ambos rodam `npm test` e `npm run test:coverage` no Node.js 22.
- **Resultado verificado (baseline F5):** 66 suítes / 2455 testes passando, lint com 0 errors.
- CI é o gate operacional real — qualquer PR pode ter seu status verificado em `https://github.com/kizirianmax/rkmmax-hibrido/actions`.

### 1.3 Política de merge documentada

- `docs/DEVELOPMENT_GUIDELINES.md` declara explicitamente: **nenhum código entra na `main` sem CI verde**.
- A regra é absoluta no documento: falha em testes, CI vermelho ou alertas críticos bloqueiam o merge.
- Seguida na prática pelo owner como disciplina operacional.

### 1.4 Documentação de segurança

- `SECURITY.md` define canal de reporte privado (e-mail), prazos de resposta (48h acuse, 5 dias úteis avaliação, 7 dias úteis correção crítica), escopo e modelo de divulgação coordenada.
- **Verificável:** documento público e acionável.

### 1.5 Guia de configuração de branch protection

- `docs/BRANCH_PROTECTION_GUIDE.md` documenta passo a passo para configurar branch protection na interface do GitHub.
- Especifica: 1 approval obrigatório, status checks `test` e `coverage`, dismiss stale approvals, no bypassing.
- **Nota importante:** o guia é instrucional — o status real da ativação é declarado na seção de limitações abaixo.

### 1.6 Padrões de contribuição documentados

- `CONTRIBUTING.md` cobre: branch naming, workflow de desenvolvimento, coding standards, testing requirements (80%+ coverage), commit conventions, PR template, processo de revisão.
- `CODE_OF_CONDUCT.md` presente.
- `.github/PULL_REQUEST_TEMPLATE.md` estruturado com checklist obrigatório.
- `.github/ISSUE_TEMPLATE/` com templates de bug report e feature request.

### 1.7 Histórico de PRs pequenos e reversíveis

- Padrão consistente desde Fase 1: cada PR tem escopo único, é documentado no `CHECKLIST.md` e inclui instrução de rollback (`git revert <commit-sha>`).
- PRs F4, F5 e F6 seguiram rigorosamente esse padrão — verificável no histórico do repositório.

### 1.8 Decisões arquiteturais documentadas e rastreáveis

- Desativação do `executeArtifact` documentada em `docs/audits/P4-artifactRunner-audit.md`.
- Fixture estática na demo documentada como decisão deliberada.
- Serginho como orquestrador soberano (sem bypass) é invariante registrada em múltiplos documentos.

---

## 2. Limitações reais

O que ainda falta ou é parcial, declarado sem eufemismo:

### 2.1 Projeto single-owner

- Único mantenedor real: `@kizirianmax`.
- Não há co-mantenedor, revisor humano independente ou time de engenharia.
- Toda decisão arquitetural, de merge e de roadmap é tomada por uma única pessoa.
- A `CONTRIBUTING.md` descreve um processo de revisão como se houvesse múltiplos mantenedores — na prática, a revisão é auto-revisão do owner.

### 2.2 PRs produzidos com assistência de IA (Copilot/agent)

- Os PRs das Fases 4, 5 e 6 foram gerados majoritariamente via GitHub Copilot coding agent.
- A revisão humana é feita pelo owner (`@kizirianmax`) antes do merge.
- Isso é um modelo legítimo e rastreável, mas representa autoria assistida por IA com revisão de uma única pessoa — não revisão independente por par humano.
- Não foi fingida revisão externa que não aconteceu.

### 2.3 Branch protection: status incerto para repositório privado

- O `docs/BRANCH_PROTECTION_GUIDE.md` é um guia instrucional — não é evidência de que as regras estão ativas.
- Repositórios privados no GitHub **não têm branch protection nativa gratuita** (a funcionalidade de "required reviewers" requer GitHub Team/Enterprise ou repositório público).
- O que está documentado como "recomendado" pode não estar ativo no repositório privado.
- **Esta é uma limitação real, não exagerada nem minimizada.**
- Consequência prática: o CI verde como pré-condição do merge é uma disciplina do owner, não uma restrição técnica imposta pelo GitHub.

### 2.4 Ausência de revisor externo independente

- Nenhum revisor externo (par técnico, advisor, co-founder técnico) revisou o código ou as decisões arquiteturais.
- A consistência do projeto depende inteiramente da disciplina e do julgamento do owner.

### 2.5 `MAINTENANCE.md` com conteúdo mínimo

- O arquivo existe mas contém apenas um stub com referência a `DEVELOPMENT_GUIDELINES.md`.
- Não há plano formal de manutenção, rotação de dependências, política de deprecação ou SLA de resposta a bugs não-críticos.

### 2.6 Sem CODEOWNERS

- Não há arquivo `.github/CODEOWNERS` definindo responsáveis por seções críticas do código.
- Em um projeto single-owner, isso é redundante hoje — mas sinalizaria maturidade de processo para avaliadores externos.

### 2.7 Sem processo de release versionado

- Não há tags de versão regulares, releases automáticos ou changelog gerado automaticamente.
- O `CHANGELOG.md` existe mas é atualizado manualmente.

---

## 3. Riscos para banca/incubadora

Como esses gaps podem ser percebidos por avaliadores externos:

| Risco | Como pode ser percebido | Severidade para avaliador |
|-------|------------------------|--------------------------|
| Single-owner | Risco de bus factor = 1: se o owner sair, o projeto para | Alta (questão padrão de due diligence) |
| Revisão assistida por IA sem par humano | Pode gerar dúvida sobre qualidade de decisões técnicas | Média (mitigável com transparência) |
| Branch protection incerta em repo privado | Ausência de gate técnico obrigatório — merge depende de disciplina | Média (mitigável com CI verde documentado) |
| Ausência de revisor externo | Sem validação independente da arquitetura ou decisões de produto | Alta (especialmente para incubadora) |
| `MAINTENANCE.md` stub | Sinaliza processo de manutenção informal | Baixa |
| Sem CODEOWNERS | Sinaliza ausência de processo formal | Baixa |
| Sem releases versionados formais | Dificulta rastreabilidade de versões para parceiros/usuários | Baixa a Média |

**Nota:** Nenhum desses riscos é fatal para um projeto em estágio inicial (seed/pré-seed). São riscos **conhecidos, esperados e documentados** para esse estágio. A postura honesta — declará-los explicitamente — é mais forte do que escondê-los.

---

## 4. Mitigadores atuais

O que já reduz os riscos hoje:

| Mitigador | Como reduz o risco |
|-----------|-------------------|
| CI obrigatório (test.yml + coverage.yml) em todo push/PR | Impede regressão funcional silenciosa mesmo sem branch protection ativa |
| `CHECKLIST.md` como log append-only | Qualquer decisão pode ser rastreada e revertida — transparência total do histórico |
| PRs pequenos e reversíveis com `git revert` | Minimiza impacto de erros — nenhuma mudança é irreversível |
| Política de merge documentada em `DEVELOPMENT_GUIDELINES.md` | Disciplina operacional registrada e verificável |
| Baseline reproduzível público: `npm run lint && npm run build && npm test -- --runInBand` | Qualquer avaliador pode validar independentemente sem acesso ao owner |
| `SECURITY.md` com canal e prazos | Processo de resposta a vulnerabilidades documentado e acionável |
| Transparência sobre `executeArtifact` desativado e fixture estática | Anti-fake-AI documentado — reduz risco de overclaim técnico |
| Autoria assistida por IA declarada explicitamente | Transparência sobre o modelo de desenvolvimento — sem fingir revisão que não ocorreu |
| Decisões arquiteturais documentadas em `docs/audits/` | Rastreabilidade de decisões técnicas para due diligence |

---

## 5. Mitigadores recomendados

Passos mínimos a adotar antes de exposição externa (banca/incubadora/investidor):

### 5.1 Ativar branch protection na `main` (se possível no plano atual)

- Verificar se o plano GitHub atual permite branch protection no repositório privado.
- Se sim: ativar as regras documentadas em `docs/BRANCH_PROTECTION_GUIDE.md` (1 approval, CI obrigatório, no bypassing).
- Se não: documentar explicitamente que a proteção é disciplina operacional (CI verde como gate), não restrição técnica do GitHub.
- **Não criar regras falsas ou fingir proteção que não existe.**

### 5.2 Adicionar nota explícita sobre single-owner no `README.md` (seção "Para avaliadores")

- Uma frase direta: "Projeto de desenvolvedor individual. Mantenedor: @kizirianmax. Sem co-mantenedor hoje."
- Transforma limitação em transparência ativa — avaliadores de incubadora valorizam honestidade sobre bus factor.

### 5.3 Identificar um par técnico voluntário para revisão pontual

- Não precisa ser co-founder. Um advisor técnico ou colega que revise 1-2 PRs críticos antes da banca.
- Objetivo: ter pelo menos uma revisão humana independente rastreável antes da apresentação.

### 5.4 Criar `.github/CODEOWNERS` mínimo

- Mesmo sendo `@kizirianmax` o único responsável, o arquivo sinaliza processo formal.
- Exemplo mínimo: `* @kizirianmax` para indicar owner de todo o repositório.

### 5.5 Criar uma tag de versão antes da banca

- `git tag v6.0.0` (ou equivalente) com release notes no GitHub Releases.
- Permite que avaliadores referenciem uma versão específica do produto apresentado.

### 5.6 Documentar o modelo de autoria assistida por IA no `README.md` ou `CONTRIBUTING.md`

- Frase direta: "PRs são gerados com GitHub Copilot coding agent e revisados pelo owner antes do merge."
- Já é a realidade — documentar elimina ambiguidade para avaliadores.

---

## 6. O que NÃO deve ser prometido

Overclaim a evitar em pitches, slides e banca:

| Não prometer | Por quê |
|--------------|---------|
| "O repositório tem branch protection ativa" | Status real é incerto para repo privado no plano atual |
| "Há revisão de código por múltiplos revisores" | Revisão é auto-revisão do owner + Copilot |
| "O sistema usa IA em tempo real na demo" | A demo opera sobre fixtures estáticas — documentado em `docs/DEMO.md` |
| "executeArtifact está disponível" | Está desativado por decisão de segurança — não reverter |
| "Temos um time de engenharia" | Projeto individual com assistência de IA |
| "Coverage de 80%+" | O `CONTRIBUTING.md` menciona 80% como meta — verificar número real antes de citar |
| "O processo de revisão é independente" | Não há revisor externo hoje |

---

## 7. Declaração de integridade arquitetural

Esta auditoria confirma que os seguintes invariantes da verdade arquitetural fixa permanecem íntegros:

- ✅ Serginho é o orquestrador soberano — sem bypass
- ✅ `executeArtifact` permanece desativado
- ✅ Providers/modelos/prompts inalterados
- ✅ Runtime funcional inalterado
- ✅ Especialistas, ABNT, Auth/SaaS/Payments inalterados
- ✅ Nenhum endpoint novo criado
- ✅ Nenhuma dependência adicionada

---

## 8. Resumo executivo para banca/incubadora

> **Rkmmax Híbrido é um projeto de desenvolvedor individual em estágio inicial, com governança documentada e transparente sobre suas limitações.**
>
> O que existe hoje é verificável: CI verde, baseline reproduzível, histórico de decisões rastreável via `CHECKLIST.md`, política de merge documentada e PRs pequenos e reversíveis.
>
> O que ainda é limitação é declarado sem eufemismo: single-owner, revisão assistida por IA sem par externo, branch protection de status incerto em repositório privado, sem revisor independente.
>
> Esses são riscos **conhecidos, documentados e mitigáveis** — não fatais para o estágio atual do projeto. A postura de transparência ativa é parte da estratégia de governança, não uma fraqueza.

---

## 9. Escopo e segurança desta auditoria

PR exclusivamente documental.

- Nenhum código funcional, runtime, rota, componente, endpoint, dependência, provider/modelo/prompt foi alterado.
- Serginho, Construtor, Especialistas, ABNT, Auth/SaaS/Payments **inalterados**.
- `executeArtifact` permanece desativado.
- Nenhuma regra de branch protection foi criada ou fingida.
- Nenhuma revisão externa foi fingida.

---

## 10. Arquivos alterados nesta auditoria

- `docs/audits/f6-gov-01-governanca-real-repositorio-2026-05-26.md` (este documento — novo)
- `CHECKLIST.md` (entrada F6-GOV-01 adicionada)

---

## 11. Rollback

PR exclusivamente documental.

```bash
git revert <commit-sha>
```
