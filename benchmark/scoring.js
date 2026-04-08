/**
 * benchmark/scoring.js
 *
 * Funções de avaliação heurística para respostas do Hybrid/Construtor.
 * Recebe a saída bruta do modelo como string e retorna pontuações por critério.
 *
 * Critérios (0–10 cada, peso variável na nota final 0–100):
 *  1. presença de arquivos pedidos
 *  2. presença de HTML semântico
 *  3. presença de hero section
 *  4. presença de CTA
 *  5. presença das 4 etapas
 *  6. presença de casos de uso
 *  7. ausência de copy genérica/repetitiva
 *  8. qualidade do CSS (acima do básico)
 *  9. presença de JS útil
 * 10. nota final heurística ponderada
 */

// ─── 1. Presença de arquivos pedidos ─────────────────────────────────────────

/**
 * Verifica quais dos arquivos esperados estão presentes na saída.
 * @param {string} output  — texto bruto do modelo
 * @param {string[]} expectedFiles — ex: ['index.html', 'styles.css', 'script.js']
 * @returns {{ score: number, detail: string[] }}  score 0–10
 */
export function scoreFilePresence(output, expectedFiles = ['index.html', 'styles.css', 'script.js']) {
  const found = expectedFiles.filter(f => output.toLowerCase().includes(f.toLowerCase()));
  const score = expectedFiles.length > 0 ? Math.round((found.length / expectedFiles.length) * 10) : 0;
  return {
    score,
    detail: found,
    missing: expectedFiles.filter(f => !found.includes(f)),
  };
}

// ─── 2. Presença de HTML semântico ───────────────────────────────────────────

const SEMANTIC_TAGS = ['<header', '<main', '<section', '<footer', '<nav', '<article'];

/**
 * @param {string} output
 * @returns {{ score: number, found: string[] }}  score 0–10
 */
export function scoreSemanticHTML(output) {
  const found = SEMANTIC_TAGS.filter(tag => output.toLowerCase().includes(tag.toLowerCase()));
  const score = Math.round((found.length / SEMANTIC_TAGS.length) * 10);
  return { score, found };
}

// ─── 3. Presença de hero section ─────────────────────────────────────────────

const HERO_PATTERNS = [/hero/i, /banner/i, /destaque/i, /showcase/i];

/**
 * @param {string} output
 * @returns {{ score: number, matches: string[] }}  score 0 ou 10
 */
export function scoreHeroSection(output) {
  const matches = HERO_PATTERNS.filter(p => p.test(output)).map(p => p.source);
  const score = matches.length > 0 ? 10 : 0;
  return { score, matches };
}

// ─── 4. Presença de CTA ──────────────────────────────────────────────────────

const CTA_PATTERNS = [
  /class=["'][^"']*cta[^"']*["']/i,
  /<button[^>]*>(Comece|Experimente|Saiba mais|Get started|Try|Start|Ver demo|Acessar|Criar)[^<]*<\/button>/i,
  /href[^>]*(cta|action|start|comece|experimente)/i,
  /btn[^"']*primary/i,
];

/**
 * @param {string} output
 * @returns {{ score: number, matches: string[] }}  score 0 ou 10
 */
export function scoreCTA(output) {
  const matches = CTA_PATTERNS.filter(p => p.test(output)).map(p => p.source);
  const score = matches.length > 0 ? 10 : 0;
  return { score, matches };
}

// ─── 5. Presença das 4 etapas ────────────────────────────────────────────────

const STEP_PATTERNS = [
  /etapa\s*[1-4]/gi,
  /passo\s*[1-4]/gi,
  /step\s*[1-4]/gi,
  /\b(1|2|3|4)\.\s+\w/g,
];

/**
 * Verifica se há pelo menos 4 etapas/passos/steps mencionados.
 * @param {string} output
 * @returns {{ score: number, count: number }}  score 0–10
 */
export function scoreFourSteps(output) {
  let totalMatches = 0;
  for (const p of STEP_PATTERNS) {
    const m = output.match(p);
    if (m) totalMatches = Math.max(totalMatches, m.length);
  }
  // 4 ou mais = 10, proporional abaixo
  const score = Math.min(10, Math.round((totalMatches / 4) * 10));
  return { score, count: totalMatches };
}

// ─── 6. Presença de casos de uso ─────────────────────────────────────────────

const USE_CASE_PATTERNS = [
  /caso[s]?\s+de\s+uso/i,
  /use\s+case/i,
  /exemplo[s]?\s+de\s+uso/i,
  /quem\s+(usa|é|pode)/i,
  /para\s+quem/i,
  /aplicaç[aã]o/i,
  /quando\s+usar/i,
];

/**
 * @param {string} output
 * @returns {{ score: number, matches: string[] }}  score 0–10
 */
export function scoreUseCases(output) {
  const matches = USE_CASE_PATTERNS.filter(p => p.test(output)).map(p => p.source);
  // Cada padrão encontrado = +2, max 10
  const score = Math.min(10, matches.length * 2);
  return { score, matches };
}

// ─── 7. Ausência de copy genérica/repetitiva ─────────────────────────────────

const GENERIC_COPY_PATTERNS = [
  /lorem\s+ipsum/i,
  /clique\s+aqui/i,
  /saiba\s+mais\s+sobre/i,
  /bem[-\s]vindo\s+ao\s+nosso/i,
  /\bsolution[s]?\b.*\bsolution[s]?\b/i,
  /\bsimple[s]?\b.*\bsimple[s]?\b/i,
];

/**
 * Penaliza presença de copy genérica/repetitiva.
 * Score 10 = sem copy genérica; vai caindo a cada padrão encontrado.
 * @param {string} output
 * @returns {{ score: number, found: string[] }}  score 0–10
 */
export function scoreGenericCopyAbsence(output) {
  const found = GENERIC_COPY_PATTERNS.filter(p => p.test(output)).map(p => p.source);
  const score = Math.max(0, 10 - found.length * 3);
  return { score, found };
}

// ─── 8. Qualidade do CSS (acima do básico) ───────────────────────────────────

const CSS_QUALITY_PATTERNS = [
  /@media\s/i,          // media queries
  /--[\w-]+\s*:/,       // CSS custom properties
  /@keyframes/i,        // animations
  /gradient/i,          // gradients
  /flex(box)?/i,        // flexbox
  /grid/i,              // CSS grid
  /transition/i,        // transitions
  /transform/i,         // transforms
];

/**
 * @param {string} output
 * @returns {{ score: number, found: string[] }}  score 0–10
 */
export function scoreCSSQuality(output) {
  const found = CSS_QUALITY_PATTERNS.filter(p => p.test(output)).map(p => p.source);
  const score = Math.round((found.length / CSS_QUALITY_PATTERNS.length) * 10);
  return { score, found };
}

// ─── 9. Presença de JS útil ──────────────────────────────────────────────────

const JS_USEFUL_PATTERNS = [
  /addEventListener/i,
  /querySelector/i,
  /getElementById/i,
  /classList\.(add|remove|toggle)/i,
  /\.innerHTML\s*=/i,
  /\.textContent\s*=/i,
  /fetch\s*\(/i,
  /IntersectionObserver/i,
  /scrollTo|scrollIntoView/i,
];

const JS_TRIVIAL_ONLY = [/^\s*console\.log/m];

/**
 * @param {string} output
 * @returns {{ score: number, found: string[] }}  score 0–10
 */
export function scoreUsefulJS(output) {
  const found = JS_USEFUL_PATTERNS.filter(p => p.test(output)).map(p => p.source);
  const trivialOnly = JS_TRIVIAL_ONLY.some(p => p.test(output)) && found.length === 0;
  if (trivialOnly) return { score: 0, found: [] };
  const score = Math.min(10, Math.round((found.length / 3) * 10));
  return { score, found };
}

// ─── 10. Nota final heurística ponderada ─────────────────────────────────────

/**
 * Pesos de cada critério na nota final (somam 100).
 * Ajuste conforme prioridade do produto.
 */
export const WEIGHTS = {
  filePresence:        15,
  semanticHTML:        10,
  heroSection:         15,
  cta:                 15,
  fourSteps:           10,
  useCases:             5,
  genericCopyAbsence:  10,
  cssQuality:          10,
  usefulJS:            10,
};

/**
 * Calcula a nota final ponderada (0–100) a partir da saída do modelo.
 *
 * @param {string} output        — texto bruto da resposta do modelo
 * @param {string[]} expectedFiles — arquivos esperados conforme o prompt usado
 * @returns {{
 *   total: number,
 *   breakdown: Record<string, { score: number, weight: number, weighted: number, detail: * }>
 * }}
 */
export function scoreResponse(output, expectedFiles = ['index.html', 'styles.css', 'script.js']) {
  const results = {
    filePresence:       scoreFilePresence(output, expectedFiles),
    semanticHTML:       scoreSemanticHTML(output),
    heroSection:        scoreHeroSection(output),
    cta:                scoreCTA(output),
    fourSteps:          scoreFourSteps(output),
    useCases:           scoreUseCases(output),
    genericCopyAbsence: scoreGenericCopyAbsence(output),
    cssQuality:         scoreCSSQuality(output),
    usefulJS:           scoreUsefulJS(output),
  };

  let total = 0;
  const breakdown = {};

  for (const [key, result] of Object.entries(results)) {
    const weight = WEIGHTS[key];
    const weighted = Math.round((result.score / 10) * weight);
    total += weighted;
    breakdown[key] = {
      score: result.score,
      weight,
      weighted,
      detail: result,
    };
  }

  return { total, breakdown };
}
