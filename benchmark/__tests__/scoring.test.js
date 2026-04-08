/**
 * benchmark/__tests__/scoring.test.js
 *
 * Testes unitários para as funções de scoring do benchmark.
 * Garante que cada critério detecta corretamente presença/ausência.
 */

import {
  scoreFilePresence,
  scoreSemanticHTML,
  scoreHeroSection,
  scoreCTA,
  scoreFourSteps,
  scoreUseCases,
  scoreGenericCopyAbsence,
  scoreCSSQuality,
  scoreUsefulJS,
  scoreResponse,
  WEIGHTS,
} from '../scoring.js';

import { runBenchmark, getGrade, BENCHMARK_PROMPTS } from '../hybridBenchmark.js';

// ─── scoreFilePresence ────────────────────────────────────────────────────────

describe('scoreFilePresence', () => {
  it('retorna 10 quando todos os arquivos estão presentes', () => {
    const output = 'index.html\nstyles.css\nscript.js';
    const { score, detail } = scoreFilePresence(output, ['index.html', 'styles.css', 'script.js']);
    expect(score).toBe(10);
    expect(detail).toHaveLength(3);
  });

  it('retorna 0 quando nenhum arquivo está presente', () => {
    const { score, missing } = scoreFilePresence('sem nada aqui', ['index.html', 'styles.css']);
    expect(score).toBe(0);
    expect(missing).toHaveLength(2);
  });

  it('retorna score proporcional quando apenas alguns arquivos estão presentes', () => {
    const output = 'index.html apenas';
    const { score } = scoreFilePresence(output, ['index.html', 'styles.css', 'script.js', 'README.md']);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(10);
  });

  it('é case-insensitive', () => {
    const { score } = scoreFilePresence('INDEX.HTML styles.css', ['index.html', 'styles.css']);
    expect(score).toBe(10);
  });
});

// ─── scoreSemanticHTML ────────────────────────────────────────────────────────

describe('scoreSemanticHTML', () => {
  it('detecta todas as tags semânticas', () => {
    const output = '<header> <main> <section> <footer> <nav> <article>';
    const { score, found } = scoreSemanticHTML(output);
    expect(score).toBe(10);
    expect(found).toHaveLength(6);
  });

  it('retorna 0 para saída sem tags semânticas', () => {
    const { score } = scoreSemanticHTML('<div><span>nada</span></div>');
    expect(score).toBe(0);
  });

  it('score proporcional ao número de tags encontradas', () => {
    const { score } = scoreSemanticHTML('<header> <footer>');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(10);
  });
});

// ─── scoreHeroSection ─────────────────────────────────────────────────────────

describe('scoreHeroSection', () => {
  it('detecta classe hero', () => {
    const { score } = scoreHeroSection('<section class="hero">Bem-vindo</section>');
    expect(score).toBe(10);
  });

  it('detecta variações como banner e destaque', () => {
    expect(scoreHeroSection('class="banner"').score).toBe(10);
    expect(scoreHeroSection('classe destaque').score).toBe(10);
  });

  it('retorna 0 quando hero não está presente', () => {
    const { score } = scoreHeroSection('<section class="about">sobre nós</section>');
    expect(score).toBe(0);
  });
});

// ─── scoreCTA ─────────────────────────────────────────────────────────────────

describe('scoreCTA', () => {
  it('detecta botão com texto de ação', () => {
    const { score } = scoreCTA('<button>Comece agora</button>');
    expect(score).toBe(10);
  });

  it('detecta classe CTA', () => {
    const { score } = scoreCTA('<a class="cta btn-primary" href="#">Experimente</a>');
    expect(score).toBe(10);
  });

  it('retorna 0 sem CTA', () => {
    const { score } = scoreCTA('<a href="/sobre">Sobre</a>');
    expect(score).toBe(0);
  });
});

// ─── scoreFourSteps ───────────────────────────────────────────────────────────

describe('scoreFourSteps', () => {
  it('detecta 4 etapas numeradas', () => {
    const output = 'Etapa 1: x\nEtapa 2: y\nEtapa 3: z\nEtapa 4: w';
    const { score, count } = scoreFourSteps(output);
    expect(score).toBe(10);
    expect(count).toBeGreaterThanOrEqual(4);
  });

  it('detecta passos em inglês', () => {
    const output = 'Step 1: x\nStep 2: y\nStep 3: z\nStep 4: w';
    const { score } = scoreFourSteps(output);
    expect(score).toBe(10);
  });

  it('retorna score reduzido para menos de 4 etapas', () => {
    const output = 'Etapa 1: apenas uma';
    const { score } = scoreFourSteps(output);
    expect(score).toBeLessThan(10);
  });

  it('retorna 0 sem etapas', () => {
    const { score } = scoreFourSteps('sem nenhuma etapa aqui');
    expect(score).toBe(0);
  });
});

// ─── scoreUseCases ────────────────────────────────────────────────────────────

describe('scoreUseCases', () => {
  it('detecta padrões de casos de uso', () => {
    const output = 'Casos de uso: para quem usa o produto.';
    const { score } = scoreUseCases(output);
    expect(score).toBeGreaterThan(0);
  });

  it('retorna 0 sem menção a casos de uso', () => {
    const { score } = scoreUseCases('título, subtítulo e texto de rodapé');
    expect(score).toBe(0);
  });
});

// ─── scoreGenericCopyAbsence ──────────────────────────────────────────────────

describe('scoreGenericCopyAbsence', () => {
  it('retorna 10 para texto sem copy genérica', () => {
    const { score } = scoreGenericCopyAbsence('Construa artefatos reais com o RKMMAX Construtor.');
    expect(score).toBe(10);
  });

  it('penaliza presença de "Lorem ipsum"', () => {
    const { score, found } = scoreGenericCopyAbsence('Lorem ipsum dolor sit amet');
    expect(score).toBeLessThan(10);
    expect(found.length).toBeGreaterThan(0);
  });

  it('penaliza "clique aqui"', () => {
    const { score } = scoreGenericCopyAbsence('Para mais informações, clique aqui.');
    expect(score).toBeLessThan(10);
  });

  it('não vai abaixo de 0', () => {
    const output = 'Lorem ipsum clique aqui bem-vindo ao nosso simples simples solution solution';
    const { score } = scoreGenericCopyAbsence(output);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

// ─── scoreCSSQuality ──────────────────────────────────────────────────────────

describe('scoreCSSQuality', () => {
  it('detecta CSS avançado com media queries, gradients e animações', () => {
    const css = `
      :root { --color: #fff; }
      @media (max-width: 768px) { body { padding: 0; } }
      @keyframes fade { from { opacity:0; } to { opacity:1; } }
      .hero { background: linear-gradient(135deg, #000, #fff); }
      .box { display: flex; transition: all .3s; transform: scale(1); }
      .grid { display: grid; }
    `;
    const { score, found } = scoreCSSQuality(css);
    expect(score).toBe(10);
    expect(found.length).toBeGreaterThanOrEqual(8);
  });

  it('retorna score baixo para CSS básico', () => {
    const { score } = scoreCSSQuality('body { color: red; } h1 { font-size: 2rem; }');
    expect(score).toBeLessThanOrEqual(3);
  });
});

// ─── scoreUsefulJS ────────────────────────────────────────────────────────────

describe('scoreUsefulJS', () => {
  it('detecta JS útil com event listeners e DOM manipulation', () => {
    const js = `
      document.addEventListener('DOMContentLoaded', () => {
        const btn = document.querySelector('.cta');
        btn.addEventListener('click', () => btn.classList.add('active'));
      });
    `;
    const { score } = scoreUsefulJS(js);
    expect(score).toBeGreaterThan(0);
  });

  it('retorna 0 para JS trivial (apenas console.log)', () => {
    const { score } = scoreUsefulJS('console.log("hello")');
    expect(score).toBe(0);
  });

  it('retorna 0 para saída sem JS', () => {
    const { score } = scoreUsefulJS('<html><body>sem js</body></html>');
    expect(score).toBe(0);
  });
});

// ─── scoreResponse (integração) ───────────────────────────────────────────────

describe('scoreResponse', () => {
  const FULL_OUTPUT = `
<!-- index.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>RKMMAX</title><link rel="stylesheet" href="styles.css"></head>
<body>
  <header><nav><a href="/">RKMMAX</a></nav></header>
  <main>
    <section class="hero">
      <h1>Construa artefatos reais</h1>
      <a href="#" class="cta btn-primary">Comece agora</a>
    </section>
    <section>
      <ol>
        <li>Etapa 1: Descreva</li>
        <li>Etapa 2: O modelo interpreta</li>
        <li>Etapa 3: Arquivos gerados</li>
        <li>Etapa 4: Baixe</li>
      </ol>
    </section>
    <section>Casos de uso: para quem precisa de artefatos.</section>
  </main>
  <footer><p>© 2025 RKMMAX</p></footer>
</body>
</html>

/* styles.css */
:root { --color-primary: #7c3aed; }
@media (max-width: 768px) { body { padding: 1rem; } }
.hero { background: linear-gradient(135deg, #000, #7c3aed); display: flex; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.cta { transition: transform 0.2s; transform: scale(1); display: grid; }

// script.js
document.addEventListener('DOMContentLoaded', () => {
  const cta = document.querySelector('.cta');
  cta.addEventListener('click', () => cta.classList.add('active'));
  document.querySelectorAll('section').forEach(s => s.classList.toggle('visible'));
});

# README.md
Casos de uso: geração de artefatos.
`;

  it('retorna total entre 0 e 100', () => {
    const { total } = scoreResponse(FULL_OUTPUT, ['index.html', 'styles.css', 'script.js', 'README.md']);
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it('retorna breakdown com todos os critérios', () => {
    const { breakdown } = scoreResponse(FULL_OUTPUT);
    expect(breakdown).toHaveProperty('filePresence');
    expect(breakdown).toHaveProperty('semanticHTML');
    expect(breakdown).toHaveProperty('heroSection');
    expect(breakdown).toHaveProperty('cta');
    expect(breakdown).toHaveProperty('fourSteps');
    expect(breakdown).toHaveProperty('useCases');
    expect(breakdown).toHaveProperty('genericCopyAbsence');
    expect(breakdown).toHaveProperty('cssQuality');
    expect(breakdown).toHaveProperty('usefulJS');
  });

  it('pontuação de saída completa é alta (>= 60)', () => {
    const { total } = scoreResponse(FULL_OUTPUT, ['index.html', 'styles.css', 'script.js', 'README.md']);
    expect(total).toBeGreaterThanOrEqual(60);
  });

  it('pontuação de saída vazia é baixa (< 20)', () => {
    const { total } = scoreResponse('', ['index.html', 'styles.css', 'script.js']);
    expect(total).toBeLessThan(20);
  });

  it('pesos somam 100', () => {
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });
});

// ─── runBenchmark ─────────────────────────────────────────────────────────────

describe('runBenchmark', () => {
  it('aceita prompt1 e retorna resultado válido', () => {
    const result = runBenchmark('prompt1', 'index.html styles.css script.js <header><main><section class="hero"><a class="cta">Comece</a>');
    expect(result).toHaveProperty('promptId', 'prompt1');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('grade');
    expect(result).toHaveProperty('breakdown');
    expect(result).toHaveProperty('timestamp');
  });

  it('aceita prompt2 e prompt3', () => {
    const out = 'index.html styles.css script.js README.md <header>';
    expect(runBenchmark('prompt2', out).promptId).toBe('prompt2');
    expect(runBenchmark('prompt3', out).promptId).toBe('prompt3');
  });

  it('lança erro para promptId inválido', () => {
    expect(() => runBenchmark('prompt99', 'qualquer coisa')).toThrow(/desconhecido/i);
  });

  it('BENCHMARK_PROMPTS contém os 3 prompts fixos', () => {
    expect(BENCHMARK_PROMPTS).toHaveProperty('prompt1');
    expect(BENCHMARK_PROMPTS).toHaveProperty('prompt2');
    expect(BENCHMARK_PROMPTS).toHaveProperty('prompt3');
    expect(BENCHMARK_PROMPTS.prompt2.expectedFiles).toContain('README.md');
  });
});

// ─── getGrade ─────────────────────────────────────────────────────────────────

describe('getGrade', () => {
  it('A+ para 90+', () => expect(getGrade(95)).toBe('A+'));
  it('A  para 80-89', () => expect(getGrade(85)).toBe('A'));
  it('B  para 70-79', () => expect(getGrade(75)).toBe('B'));
  it('C  para 60-69', () => expect(getGrade(65)).toBe('C'));
  it('D  para 50-59', () => expect(getGrade(55)).toBe('D'));
  it('F  para abaixo de 50', () => expect(getGrade(40)).toBe('F'));
});
