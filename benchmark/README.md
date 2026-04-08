# 📊 Benchmark Interno — Hybrid/Construtor

Ferramenta mínima e reprodutível para medir a qualidade de saída do **RKMMAX Hybrid/Construtor** antes e depois de mudanças no prompt.

---

## Por que existe

Mudanças no prompt do Hybrid eram feitas "no escuro" — sem uma forma objetiva de saber se a saída melhorou ou piorou. Este benchmark permite:

- **Comparar** respostas antes e depois de um ajuste de prompt
- **Medir** 10 critérios heurísticos de qualidade
- **Rastrear** evolução da qualidade ao longo do tempo

---

## Estrutura

```
benchmark/
├── scoring.js              # Funções de avaliação heurística (10 critérios)
├── hybridBenchmark.js      # Runner com 3 prompts fixos e nota final
├── README.md               # Este arquivo
└── __tests__/
    └── scoring.test.js     # Testes unitários do scoring
```

---

## Critérios de avaliação (10)

| # | Critério | Peso | O que mede |
|---|---------|------|-----------|
| 1 | **Presença de arquivos pedidos** | 15 | Se `index.html`, `styles.css`, `script.js`, `README.md` aparecem na saída |
| 2 | **HTML semântico** | 10 | Uso de `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`, `<article>` |
| 3 | **Hero section** | 15 | Presença de `.hero`, `banner`, `destaque`, `showcase` |
| 4 | **CTA** | 15 | Botão com verbo de ação, classe `.cta`, link com texto de ação |
| 5 | **4 etapas** | 10 | Presença de "Etapa 1–4", "Passo 1–4" ou "Step 1–4" |
| 6 | **Casos de uso** | 5 | "casos de uso", "para quem", "quando usar", "aplicação" |
| 7 | **Ausência de copy genérica** | 10 | Penaliza "Lorem ipsum", "clique aqui", frases repetitivas |
| 8 | **Qualidade do CSS** | 10 | Media queries, custom properties, gradients, animations, flexbox, grid |
| 9 | **JS útil** | 10 | `addEventListener`, `querySelector`, `classList`, DOM manipulation |
| 10 | **Nota final** | — | Soma ponderada dos 9 critérios → 0–100 |

---

## Os 3 prompts fixos

### Prompt 1 — Simples
Solicita 3 arquivos (`index.html`, `styles.css`, `script.js`) com tema de página escura.
Baseline mínimo — mede capacidade básica de entrega de artefatos.

### Prompt 2 — Intermediário
Solicita 4 arquivos + hero section + 4 etapas + seção "diferente de chat" + CTA final.
Mede seguimento de requisitos explícitos e estrutura de landing page profissional.

### Prompt 3 — Exigente
Solicita a mesma estrutura do Prompt 2, mas com expectativa de qualidade de produto real.
Mede se o modelo eleva a qualidade da copy, CSS e JS além do rascunho básico.

---

## Como usar

### Pré-requisito
Node.js 22+ (o projeto já usa).

### 1. Rodar o benchmark de demonstração (saída de exemplo)

```bash
node benchmark/hybridBenchmark.js
```

Exibe pontuações para os 3 prompts usando uma saída de exemplo embutida.

### 2. Avaliar uma saída real do modelo

```js
// evaluate-output.mjs (crie temporariamente, não commitar)
import { runBenchmark, printResult } from './benchmark/hybridBenchmark.js';
import { readFileSync } from 'fs';

const output = readFileSync('output-do-modelo.txt', 'utf8');
const result = runBenchmark('prompt2', output);
printResult(result);
```

```bash
node evaluate-output.mjs
```

### 3. Comparar antes e depois de uma mudança de prompt

1. Gere a saída do modelo com o prompt **antes** da mudança → salve em `output-before.txt`
2. Aplique a mudança no prompt
3. Gere a saída do modelo com o prompt **depois** da mudança → salve em `output-after.txt`
4. Execute o scoring nas duas saídas e compare `total`:

```js
import { runBenchmark } from './benchmark/hybridBenchmark.js';
import { readFileSync } from 'fs';

const before = runBenchmark('prompt2', readFileSync('output-before.txt', 'utf8'));
const after  = runBenchmark('prompt2', readFileSync('output-after.txt', 'utf8'));

console.log(`Antes : ${before.total}/100 [${before.grade}]`);
console.log(`Depois: ${after.total}/100 [${after.grade}]`);
console.log(`Delta : ${after.total - before.total > 0 ? '+' : ''}${after.total - before.total}`);
```

### 4. Rodar os testes unitários

```bash
npm test -- --testPathPattern=benchmark
```

---

## Escala de nota

| Nota | Conceito | Significado |
|------|---------|-------------|
| 90–100 | A+ | Excelente — peça real de produto |
| 80–89  | A  | Ótimo — poucos ajustes necessários |
| 70–79  | B  | Bom — estrutura correta, copy pode melhorar |
| 60–69  | C  | Regular — faltam elementos importantes |
| 50–59  | D  | Fraco — muitos critérios ausentes |
| 0–49   | F  | Insuficiente — saída abaixo do esperado |

---

## O que NÃO foi alterado

Este benchmark é **somente leitura** em relação ao runtime:

- ✅ `api/lib/serginho-orchestrator.js` — não tocado
- ✅ `src/prompts/geniusPrompts.js` — não tocado
- ✅ Especialistas, ABNT, orchestrator, providers, retry — não tocados
- ✅ Estabilidade e rotas do sistema — não afetadas

Os arquivos criados são:
- `benchmark/scoring.js`
- `benchmark/hybridBenchmark.js`
- `benchmark/README.md`
- `benchmark/__tests__/scoring.test.js`
