/**
 * benchmark/hybridBenchmark.js
 *
 * Benchmark mínimo e reprodutível para medir a qualidade de saída do Hybrid/Construtor.
 *
 * USO:
 *   1. Copie a saída do modelo para uma variável `output` (string).
 *   2. Chame runBenchmark(promptId, output) para obter a pontuação.
 *   3. Compare pontuações antes e depois de mudanças no prompt.
 *
 * Execução direta (sem chamar a API):
 *   node benchmark/hybridBenchmark.js
 *
 * Execução com saída real (pipe ou arquivo):
 *   node -e "
 *     import('./benchmark/hybridBenchmark.js').then(m => {
 *       const output = require('fs').readFileSync('output.txt','utf8');
 *       console.log(JSON.stringify(m.runBenchmark('prompt2', output), null, 2));
 *     });
 *   "
 */

import { scoreResponse } from './scoring.js';

// ─── Prompts fixos de referência ─────────────────────────────────────────────

export const BENCHMARK_PROMPTS = {
  /** Prompt 1 — simples */
  prompt1: {
    id: 'prompt1',
    label: 'Simples',
    text: `Crie um artefato simples com:
- index.html
- styles.css
- script.js
Tema: página escura apresentando o RKMMAX Construtor.
Entregue por arquivo.`,
    expectedFiles: ['index.html', 'styles.css', 'script.js'],
  },

  /** Prompt 2 — intermediário */
  prompt2: {
    id: 'prompt2',
    label: 'Intermediário',
    text: `Aja como Construtor de artefato, não como chat.
Crie uma landing page profissional para apresentar o RKMMAX Construtor.
Entregue:
- index.html
- styles.css
- script.js
- README.md
A página deve ter:
- hero section
- seção com as 4 etapas
- seção explicando por que é diferente de um chat comum
- CTA final`,
    expectedFiles: ['index.html', 'styles.css', 'script.js', 'README.md'],
  },

  /** Prompt 3 — exigente */
  prompt3: {
    id: 'prompt3',
    label: 'Exigente',
    text: `Aja como Construtor de artefato, não como chat.
Crie uma landing page de nível mais alto para apresentar o RKMMAX Construtor como plataforma de geração de artefatos reais.
Entregue:
- index.html
- styles.css
- script.js
- README.md
Objetivo:
a saída deve parecer uma peça real de apresentação de produto, não um rascunho.`,
    expectedFiles: ['index.html', 'styles.css', 'script.js', 'README.md'],
  },
};

// ─── Runner principal ─────────────────────────────────────────────────────────

/**
 * Avalia a saída do modelo para um prompt específico.
 *
 * @param {'prompt1'|'prompt2'|'prompt3'} promptId
 * @param {string} modelOutput — texto bruto retornado pelo modelo
 * @returns {{
 *   promptId: string,
 *   label: string,
 *   total: number,
 *   grade: string,
 *   breakdown: object,
 *   timestamp: string
 * }}
 */
export function runBenchmark(promptId, modelOutput) {
  const prompt = BENCHMARK_PROMPTS[promptId];
  if (!prompt) {
    throw new Error(`Prompt desconhecido: "${promptId}". Use: prompt1, prompt2 ou prompt3.`);
  }

  const { total, breakdown } = scoreResponse(modelOutput, prompt.expectedFiles);
  const grade = getGrade(total);

  return {
    promptId,
    label: prompt.label,
    total,
    grade,
    breakdown,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Converte nota numérica em conceito de letra.
 * @param {number} total 0–100
 * @returns {string}
 */
export function getGrade(total) {
  if (total >= 90) return 'A+';
  if (total >= 80) return 'A';
  if (total >= 70) return 'B';
  if (total >= 60) return 'C';
  if (total >= 50) return 'D';
  return 'F';
}

/**
 * Formata e exibe o resultado do benchmark no console.
 * @param {ReturnType<runBenchmark>} result
 */
export function printResult(result) {
  const { promptId, label, total, grade, breakdown, timestamp } = result;
  console.log('\n' + '═'.repeat(60));
  console.log(`📊 BENCHMARK HYBRID — ${label} (${promptId})`);
  console.log(`   Timestamp : ${timestamp}`);
  console.log(`   Nota Final: ${total}/100  [${grade}]`);
  console.log('─'.repeat(60));

  for (const [key, { score, weight, weighted }] of Object.entries(breakdown)) {
    const bar = '█'.repeat(Math.round(score / 2)) + '░'.repeat(5 - Math.round(score / 2));
    console.log(`  ${key.padEnd(22)} ${bar}  ${score}/10  (peso ${weight} → ${weighted} pts)`);
  }
  console.log('═'.repeat(60) + '\n');
}

// ─── Execução direta: demonstração com saída de exemplo ──────────────────────

if (process.argv[1] && process.argv[1].endsWith('hybridBenchmark.js')) {
  const EXAMPLE_OUTPUT = `
<!-- index.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>RKMMAX Construtor</title><link rel="stylesheet" href="styles.css"></head>
<body>
  <header><nav><a href="/">RKMMAX</a></nav></header>
  <main>
    <section class="hero">
      <h1>Construa artefatos reais em segundos</h1>
      <p>Não é um chat. É um Construtor de artefatos completos.</p>
      <a href="#start" class="cta btn-primary">Comece agora</a>
    </section>
    <section class="steps">
      <h2>Como funciona</h2>
      <ol>
        <li>Etapa 1: Descreva o que precisa</li>
        <li>Etapa 2: O Construtor interpreta</li>
        <li>Etapa 3: Os arquivos são gerados</li>
        <li>Etapa 4: Baixe ou visualize</li>
      </ol>
    </section>
    <section class="use-cases">
      <h2>Para quem é?</h2>
      <p>Para desenvolvedores, designers e times que precisam de artefatos prontos.</p>
    </section>
    <section class="cta-final">
      <a href="#app" class="cta">Experimente grátis</a>
    </section>
  </main>
  <footer><p>© 2025 RKMMAX</p></footer>
</body>
</html>

/* styles.css */
:root { --color-primary: #7c3aed; --color-bg: #0f0f0f; }
body { background: var(--color-bg); color: #fff; font-family: sans-serif; }
.hero { display: flex; flex-direction: column; align-items: center; }
@media (max-width: 768px) { .hero { padding: 1rem; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.cta { background: linear-gradient(135deg, #7c3aed, #a78bfa); transition: transform 0.2s; }

// script.js
document.addEventListener('DOMContentLoaded', () => {
  const cta = document.querySelector('.cta');
  cta.addEventListener('click', () => cta.classList.add('active'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting));
  });
  document.querySelectorAll('section').forEach(s => observer.observe(s));
});

# README.md
## RKMMAX Construtor — Landing Page
Artefato gerado pelo Construtor.
Caso de uso: apresentação do produto.
`;

  console.log('🔍 Rodando benchmark com saída de EXEMPLO (não é saída real do modelo)...');
  for (const promptId of ['prompt1', 'prompt2', 'prompt3']) {
    const result = runBenchmark(promptId, EXAMPLE_OUTPUT);
    printResult(result);
  }
  console.log('ℹ️  Para usar com saída real, importe runBenchmark() e passe a saída do modelo.');
}
