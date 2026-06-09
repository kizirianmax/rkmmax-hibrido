# Runbook — Amostragem real da telemetria verdict-only do Construtor em DEV

## 1) Base
`main = 6f6f74ba24a44f09c4e03aee90c2f3ba7c1de2c2`

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
| 1 |  |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |  |  |  |
| 11 |  |  |  |  |  |  |  |  |  |
| 12 |  |  |  |  |  |  |  |  |  |
| 13 |  |  |  |  |  |  |  |  |  |
| 14 |  |  |  |  |  |  |  |  |  |
| 15 |  |  |  |  |  |  |  |  |  |
| 16 |  |  |  |  |  |  |  |  |  |
| 17 |  |  |  |  |  |  |  |  |  |
| 18 |  |  |  |  |  |  |  |  |  |
| 19 |  |  |  |  |  |  |  |  |  |
| 20 |  |  |  |  |  |  |  |  |  |

## 6) Tabela de consolidação

| Métrica | Valor |
|---|---|
| Total de amostras |  |
| Total eligible |  |
| Total unavailable |  |
| Percentual eligible |  |
| Percentual unavailable |  |
| Top reasons |  |
| Top statuses |  |

## 7) Interpretação (decisão do próximo passo)
- Se `unavailable` dominar por **shape documental**, o próximo PR deve focar ajuste controlado do shape do Construtor.
- Se `fileContents` estiver ausente, o próximo PR deve investigar/ajustar o contrato entre `/api/artifact-preview` e o preview real.
- Se houver muitos `eligible`, o próximo PR pode preparar UI diagnóstica honesta ou etapa controlada rumo ao handoff.
- Se a coleta manual for ruim ou impossível, o próximo PR deve ser uma consolidação DEV-only sem storage persistente.
- Referências de leitura para `byReason` (guia interpretativo): `real-preview-invalido`, `real-preview-summary-invalido`, `real-preview-filecontents-invalido`, `real-preview-filecontents-vazio`, `inmemory-*`, `derivation-*`, `multifile-sem-delimitadores`, `caminho-perigoso`, `multifile-body-vazio`.

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
Este runbook deve permitir decidir o #599 com evidência.

## Status da execução neste ambiente
> Coleta real não executada neste ambiente; runbook preparado para execução manual/assistida.
