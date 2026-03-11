/**
 * api/lib/serginho/analysis/githubAnalyticalResponseFormatter.js
 * Pós-processador de respostas analíticas do LLM sobre contexto GitHub.
 *
 * Estrutura a resposta analítica do Serginho em blocos Markdown leve e acionáveis,
 * sem inventar dados, sem re-fetch, sem tocar em UI.
 *
 * Funções exportadas:
 *   - detectAnalyticalSections(rawText) → extrai estrutura intermediária via heurística
 *   - formatAnalyticalResponse(rawText, options) → formata resposta em Markdown leve
 *
 * Regras:
 *   - ESM (import/export) — NUNCA require()
 *   - Zero dependências novas
 *   - NUNCA inventar seções — se não detectar conteúdo, não cria bloco
 *   - NUNCA modificar conteúdo detectado — apenas organizar/estruturar
 */

// ---------------------------------------------------------------------------
// Heurísticas — palavras-chave PT-BR e EN
// ---------------------------------------------------------------------------

const STRENGTH_KEYWORDS = [
  'bom', 'boa', 'excelente', 'forte', 'positivo', 'maduro', 'bem estruturado',
  'boa prática', 'ponto forte', 'good', 'strong', 'excellent', 'well', 'solid', 'clean',
];

const RISK_KEYWORDS = [
  'risco', 'problema', 'falta', 'ausente', 'vulnerabilidade', 'limitação', 'fraco',
  'atenção', 'risk', 'problem', 'missing', 'absent', 'vulnerability', 'limitation',
  'weak', 'concern', 'issue', 'warning',
];

const NEXT_STEP_KEYWORDS = [
  'próximo passo', 'recomendo', 'adicionar', 'implementar', 'considerar', 'melhorar',
  'seria bom', 'sugestão', 'todo', 'next step', 'recommend', 'add', 'implement',
  'consider', 'improve', 'suggestion', 'should',
];

const LOW_CONFIDENCE_PATTERNS = [
  /não sei\b/i,
  /não tenho certeza/i,
  /insuficiente/i,
  /não posso afirmar/i,
  /pouco claro/i,
  /não consigo\b/i,
  /i'm not sure/i,
  /insufficient/i,
  /cannot determine/i,
  /unclear/i,
  /limited context/i,
];

const MEDIUM_CONFIDENCE_PATTERNS = [
  /\bparece\b/i,
  /\bprovavelmente\b/i,
  /\bpode ser\b/i,
  /\btalvez\b/i,
  /\bpossivelmente\b/i,
  /\bseems\b/i,
  /\bprobably\b/i,
  /\blikely\b/i,
  /\bpossibly\b/i,
  /\bmight\b/i,
];

// Regex para detectar linhas que começam como bullet/list
const LIST_LINE_RE = /^\s*[-*•]|\s*\d+[.)]\s/;

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Retorna true se a linha for um item de lista/bullet.
 * @param {string} line
 * @returns {boolean}
 */
function _isListLine(line) {
  return LIST_LINE_RE.test(line);
}

/**
 * Retorna o texto limpo de um bullet (remove marcador inicial).
 * @param {string} line
 * @returns {string}
 */
function _stripBullet(line) {
  return line.replace(/^\s*[-*•]\s*/, '').replace(/^\s*\d+[.)]\s*/, '').trim();
}

/**
 * Verifica se uma string contém alguma das palavras-chave (case-insensitive).
 * @param {string} text
 * @param {string[]} keywords
 * @returns {boolean}
 */
function _containsKeyword(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Analisa texto bruto de resposta analítica do LLM e extrai estrutura intermediária
 * via heurística mínima baseada em regex/padrões PT-BR e EN.
 *
 * @param {string|null|undefined} rawText - Texto bruto da resposta do LLM
 * @returns {{
 *   summary: string|null,
 *   strengths: string[],
 *   risks: string[],
 *   nextSteps: string[],
 *   confidence: 'alto'|'médio'|'baixo'|null
 * }}
 */
export function detectAnalyticalSections(rawText) {
  const empty = { summary: null, strengths: [], risks: [], nextSteps: [], confidence: null };

  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return empty;
  }

  const lines = rawText.split('\n');
  const strengths = [];
  const risks = [];
  const nextSteps = [];
  let summary = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (_isListLine(trimmed)) {
      const content = _stripBullet(trimmed);
      if (!content) continue;

      // Um item pode se enquadrar em múltiplas categorias — verificar cada uma
      if (_containsKeyword(content, STRENGTH_KEYWORDS)) {
        strengths.push(content);
      }
      if (_containsKeyword(content, RISK_KEYWORDS)) {
        risks.push(content);
      }
      if (_containsKeyword(content, NEXT_STEP_KEYWORDS)) {
        nextSteps.push(content);
      }
    } else {
      // Linha não-lista: candidata a summary (primeiro parágrafo significativo)
      if (summary === null && trimmed.length >= 20) {
        summary = trimmed;
      }
    }
  }

  // Detectar confidence a partir do texto completo
  let confidence = null;
  if (LOW_CONFIDENCE_PATTERNS.some((re) => re.test(rawText))) {
    confidence = 'baixo';
  } else if (MEDIUM_CONFIDENCE_PATTERNS.some((re) => re.test(rawText))) {
    confidence = 'médio';
  } else if (rawText.trim().length > 100) {
    confidence = 'alto';
  }

  return { summary, strengths, risks, nextSteps, confidence };
}

/**
 * Formata a resposta analítica bruta do LLM em Markdown leve, útil e orientado a ação.
 *
 * @param {string|null|undefined} rawText - Texto bruto da resposta do LLM
 * @param {object} [options={}]
 * @param {boolean} [options.includeStructure=true] - Se true, estrutura em blocos; se false, apenas limpa
 * @param {number} [options.maxLength=2000] - Trunca a resposta se ultrapassar esse limite
 * @returns {string}
 */
export function formatAnalyticalResponse(rawText, options = {}) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return '';
  }

  const includeStructure = options.includeStructure !== false; // default true
  const maxLength = typeof options.maxLength === 'number' ? options.maxLength : 2000;

  let result;

  if (!includeStructure) {
    // Apenas limpa: remove linhas em branco excessivas e espaços no final de linhas
    result = rawText
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
  } else {
    const sections = detectAnalyticalSections(rawText);
    const hasAnySection =
      sections.summary !== null ||
      sections.strengths.length > 0 ||
      sections.risks.length > 0 ||
      sections.nextSteps.length > 0 ||
      sections.confidence !== null;

    if (!hasAnySection) {
      // Fallback: retornar texto original limpo
      result = rawText
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n');
    } else {
      const parts = [];

      if (sections.summary) {
        parts.push(`**Resumo:** ${sections.summary}`);
      }

      if (sections.strengths.length > 0) {
        parts.push(`\n**Pontos fortes:**\n${sections.strengths.map((s) => `- ${s}`).join('\n')}`);
      }

      if (sections.risks.length > 0) {
        parts.push(`\n**Riscos / Limitações:**\n${sections.risks.map((r) => `- ${r}`).join('\n')}`);
      }

      if (sections.nextSteps.length > 0) {
        parts.push(`\n**Próximos passos:**\n${sections.nextSteps.map((s) => `- ${s}`).join('\n')}`);
      }

      if (sections.confidence !== null) {
        parts.push(`\n*Nível de confiança: ${sections.confidence}*`);
      }

      result = parts.join('');
    }
  }

  // Aplicar truncamento se necessário
  if (result.length > maxLength) {
    result = result.slice(0, maxLength) + '\n\n[resposta truncada]';
  }

  return result;
}
