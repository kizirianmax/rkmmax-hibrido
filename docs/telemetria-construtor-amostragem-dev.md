# Runbook — Amostragem real da telemetria verdict-only do Construtor em DEV

## 1) Base
`origin/main = 029013449d9d9f652d2f1c3806c7a3404f8766e5` (HEAD pós-merge do #599)

## 2) Objetivo
Medir a taxa real `eligible/unavailable` do Construtor a partir da telemetria DEV verdict-only.

## 3) Pré-requisitos
- App rodando em modo DEV (`import.meta.env.DEV`).
- Usuário autenticado, se necessário (o fluxo de preview exige JWT).
- Console do navegador aberto.
- Gerar previews reais pelo fluxo normal do Construtor (botão **"🔍 Revisar artefato"**).
- Capturar as linhas que começam com `[construtor:real-preview-telemetry][dev]`.

## 4) Procedimento
Gerar pelo menos **10 a 20 previews reais** com prompts variados, cobrindo:
1. pedido documental simples;
2. landing page;
3. componente React simples;
4. página HTML simples;
5. app com múltiplos arquivos;
6. prompt explicitando `index.js`;
7. prompt explicitando `lib/*.js`;
8. prompt com estrutura `--- FILE: index.js ---`;
9. prompt de dashboard;
10. prompt de formulário.

## 5) Registro por amostra
Registrar **uma linha por amostra** na tabela abaixo.

| # amostra | Categoria do prompt | Resumo do prompt | Última linha da telemetria | total | eligible | unavailable | byReason | byStatus | Observação |
|---|---|---|---|---:|---:|---:|---|---|---|
| 1 | pedido documental simples | Pedido de documentação simples para gerar artefato textual | `constructor-approved-preview-diagnostic-reader:unavailable` | 1 | 0 | 1 | `entrypoint-nao-permitido` | `constructor-approved-preview-diagnostic-reader:unavailable` | Gerou `content.md`, `README.md`, `manifest.json` e logs; ZIP válido, artefato completo, mas não executável. |
| 2 | landing page | Landing page simples com HTML/CSS | `constructor-approved-preview-diagnostic-reader:unavailable` | 2 | 0 | 2 | `entrypoint-nao-permitido` | `constructor-approved-preview-diagnostic-reader:unavailable` | Gerou `index.html` e `style.css`; ZIP válido, artefato completo, mas não executável. |
| 3 | componente React simples | Componente React simples com estilo separado | `constructor-approved-preview-diagnostic-reader:unavailable` | 3 | 0 | 3 | `entrypoint-nao-permitido` | `constructor-approved-preview-diagnostic-reader:unavailable` | Gerou `ProdutoCard.js`, `App.js` e `estilo.css`; ZIP válido, artefato completo, mas não executável. |
| 4 | página HTML simples | Página HTML simples com CSS e JS | `constructor-approved-preview-diagnostic-reader:unavailable` | 4 | 0 | 4 | `entrypoint-nao-permitido` | `constructor-approved-preview-diagnostic-reader:unavailable` | Gerou `index.html`, `styles.css` e `script.js`; ZIP válido, artefato completo, mas não executável. |
| 5 | app com múltiplos arquivos | App Node com múltiplos arquivos e dependência externa | `constructor-approved-preview-diagnostic-reader:unavailable` | 5 | 0 | 5 | `dependencias-externas-nao-permitidas` | `constructor-approved-preview-diagnostic-reader:unavailable` | Gerou `package.json`, `index.js` e `lib/utils.js`, mas usou Express/dependência externa. |
| 6 | index.js puro sem dependências externas | Prompt com `--- FILE: index.js ---` sem libs externas | `constructor-approved-preview-diagnostic-reader:unavailable` | 6 | 0 | 6 | `multifile-body-vazio` | `constructor-approved-preview-diagnostic-reader:unavailable` | O conteúdo com marcador `--- FILE: index.js ---` ficou dentro de `content.md` e não virou arquivo real `index.js`. |
| 7 | index.js + lib/helpers.js | Prompt explícito para `index.js` e `lib/helpers.js` | `constructor-approved-preview-diagnostic-reader:unavailable` | 7 | 0 | 7 | `arquivo-fora-da-allowlist` | `constructor-approved-preview-diagnostic-reader:unavailable` | Gerou `index.js` e `lib/helpers.js` corretamente, mas ainda ficou não executável. |
| 8 | delimitador explícito com index.js + lib/helpers.js | Prompt com delimitador explícito e estrutura mínima | `constructor-approved-preview-diagnostic-reader:unavailable` | 8 | 0 | 8 | `arquivo-fora-da-allowlist` | `constructor-approved-preview-diagnostic-reader:unavailable` | Gerou `index.js` e `lib/helpers.js` corretamente, sem `package.json` e sem dependências externas, mas ainda ficou não executável. |
| 9 | dashboard simples HTML/CSS/JS | Dashboard simples em HTML/CSS/JS | `constructor-approved-preview-diagnostic-reader:unavailable` | 9 | 0 | 9 | `entrypoint-nao-permitido` | `constructor-approved-preview-diagnostic-reader:unavailable` | Gerou `index.html`, `styles.css` e `script.js`; ZIP válido, artefato completo, mas não executável. |
| 10 | formulário HTML/CSS/JS | Formulário HTML/CSS/JS com validações simples | `constructor-approved-preview-diagnostic-reader:unavailable` | 10 | 0 | 10 | `entrypoint-nao-permitido` | `constructor-approved-preview-diagnostic-reader:unavailable` | Gerou `index.html`, `styles.css` e `script.js`; ZIP válido, artefato completo, mas não executável. |

## 6) Tabela de consolidação

| Métrica | Valor |
|---|---|
| Total de amostras | 10 |
| Total eligible | 0 |
| Total unavailable | 10 |
| Percentual eligible | 0% |
| Percentual unavailable | 100% |
| Top reasons | `entrypoint-nao-permitido (6)`, `arquivo-fora-da-allowlist (2)`, `dependencias-externas-nao-permitidas (1)`, `multifile-body-vazio (1)` |
| Top statuses | `constructor-approved-preview-diagnostic-reader:unavailable (10)` |

## 7) Interpretação (decisão do próximo passo)
- A coleta real confirmou **0% `eligible` / 100% `unavailable`** nas 10 amostras.
- Motivo dominante: `entrypoint-nao-permitido` (6/10).
- Também ocorreram `arquivo-fora-da-allowlist` (2/10), `dependencias-externas-nao-permitidas` (1/10) e `multifile-body-vazio` (1/10).
- O Construtor gera artefatos completos e ZIP válido, mas o diagnóstico segue classificando os casos como **não executáveis**.
- Isso **bloqueia WebContainer real por enquanto**; não avançar para WebContainer, UI pública ou handoff nesta etapa.
- Próximo passo técnico recomendado (#601): **auditoria/correção mínima do contrato/reader/allowlist de entrypoint** para entender por que artefatos com `index.html`, `index.js` e `lib/helpers.js` ainda ficam `unavailable`.

## 8) Proibições de registro
- Não usar payload bruto.
- Não colar conteúdo de arquivos.
- Não colar `rawContent`.
- Não colar `fileContents`.
- Não colar `agentMessage`.
- Não colar `zipBase64`.
- Não expor dados sensíveis.
- Registrar apenas contadores e `reason`/`status`.

## 9) Critério de sucesso
Este runbook registra a coleta real manual assistida com evidência consolidada.

## Status da execução neste ambiente
> Coleta real executada manualmente em ambiente autenticado (gated por `?constructorTelemetry=1`), com 10 amostras reais.
>
> **Resultado final:** 0 `eligible` / 10 `unavailable` (0% / 100%).
>
> **byReason final:** `{"entrypoint-nao-permitido":6,"dependencias-externas-nao-permitidas":1,"multifile-body-vazio":1,"arquivo-fora-da-allowlist":2}`
>
> **byStatus final:** `{"constructor-approved-preview-diagnostic-reader:unavailable":10}`
>
> Observação de consistência: a soma de `byReason` é 10 (6 + 1 + 1 + 2), coerente com o total de amostras e com `byStatus` (10 `unavailable`).
