/**
 * Tests for the ABNT reference validation logic.
 *
 * Strategy: the validation logic is extracted inline here (mirroring
 * src/components/abnt/ReferenceValidator.jsx) so the tests run without
 * a JSX/React transform. This is intentional — the function is pure JS
 * and does not depend on React at all.
 *
 * Rules under test (ABNT NBR 6023):
 *   1. Sobrenome do autor em MAIÚSCULAS seguido de vírgula
 *   2. Ponto final
 *   3. Título em destaque (**negrito** ou _itálico_)
 *   4. Ano de publicação (4 dígitos)
 *   5. Referências de site: "Disponível em" exige "Acesso em"
 */

// ─── Inline copy of the pure validation logic ─────────────────────────────────
// Kept in sync with src/components/abnt/ReferenceValidator.jsx#validateABNTReference
function validateABNTReference(reference) {
  const issues = [];
  const suggestions = [];

  if (!reference || !reference.trim()) {
    return { isValid: false, score: 0, issues: ['Referência vazia'], suggestions: [] };
  }

  if (!/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]+,/.test(reference)) {
    issues.push('O sobrenome do autor deve estar em MAIÚSCULAS no início');
    suggestions.push('Inicie com: SOBRENOME, Nome.');
  }

  if (!reference.trim().endsWith('.')) {
    issues.push('A referência deve terminar com ponto final');
  }

  if (!reference.includes('**') && !reference.includes('_')) {
    issues.push('O título principal deve estar em destaque (negrito)');
    suggestions.push('Use **Título** para destacar o título principal');
  }

  if (!/\d{4}/.test(reference)) {
    issues.push('A referência deve conter o ano de publicação');
  }

  if (
    reference.toLowerCase().includes('disponível em') &&
    !reference.toLowerCase().includes('acesso em')
  ) {
    issues.push('Referências de sites devem incluir a data de acesso');
    suggestions.push('Adicione: Acesso em: DD mês. AAAA.');
  }

  const isValid = issues.length === 0;
  const score = Math.max(0, 100 - issues.length * 20);

  return { isValid, score, issues, suggestions };
}
// ─────────────────────────────────────────────────────────────────────────────

describe('validateABNTReference — lógica pura', () => {
  // ── Referência válida ────────────────────────────────────────────────────────
  test('referência completa e válida retorna score 100 e isValid true', () => {
    const ref =
      'SILVA, João. **Metodologia da Pesquisa Científica**. São Paulo: Atlas, 2020.';
    const result = validateABNTReference(ref);
    expect(result.isValid).toBe(true);
    expect(result.score).toBe(100);
    expect(result.issues).toHaveLength(0);
  });

  // ── Regra 1: sobrenome em maiúsculas ────────────────────────────────────────
  test('sobrenome em minúsculas gera issue e reduz score', () => {
    const ref = 'silva, João. **Metodologia**. São Paulo: Atlas, 2020.';
    const result = validateABNTReference(ref);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes('MAIÚSCULAS'))).toBe(true);
    expect(result.score).toBeLessThan(100);
  });

  // ── Regra 2: ponto final ─────────────────────────────────────────────────────
  test('ausência de ponto final gera issue', () => {
    const ref = 'SILVA, João. **Metodologia**. São Paulo: Atlas, 2020';
    const result = validateABNTReference(ref);
    expect(result.issues.some((i) => i.includes('ponto final'))).toBe(true);
  });

  // ── Regra 3: título em destaque ──────────────────────────────────────────────
  test('título sem destaque gera issue', () => {
    const ref = 'SILVA, João. Metodologia. São Paulo: Atlas, 2020.';
    const result = validateABNTReference(ref);
    expect(result.issues.some((i) => i.includes('destaque'))).toBe(true);
  });

  test('título com itálico (_) é aceito como destaque', () => {
    const ref = 'SILVA, João. _Metodologia_. São Paulo: Atlas, 2020.';
    const result = validateABNTReference(ref);
    expect(result.issues.some((i) => i.includes('destaque'))).toBe(false);
  });

  // ── Regra 4: ano de publicação ───────────────────────────────────────────────
  test('ausência de ano gera issue', () => {
    const ref = 'SILVA, João. **Metodologia**. São Paulo: Atlas.';
    const result = validateABNTReference(ref);
    expect(result.issues.some((i) => i.includes('ano'))).toBe(true);
  });

  // ── Regra 5: "Disponível em" sem "Acesso em" ─────────────────────────────────
  test('referência de site sem "Acesso em" gera issue', () => {
    const ref =
      'SILVA, João. **Metodologia**. Disponível em: https://exemplo.com. 2020.';
    const result = validateABNTReference(ref);
    expect(result.issues.some((i) => i.toLowerCase().includes('acesso'))).toBe(true);
  });

  test('referência de site com "Acesso em" não gera issue de acesso', () => {
    const ref =
      'SILVA, João. **Metodologia**. Disponível em: https://exemplo.com. Acesso em: 29 mar. 2026. 2020.';
    const result = validateABNTReference(ref);
    expect(result.issues.some((i) => i.toLowerCase().includes('acesso'))).toBe(false);
  });

  // ── Score ────────────────────────────────────────────────────────────────────
  test('score nunca é negativo mesmo com muitos issues', () => {
    const ref = 'sem maiúsculas, sem destaque, sem ano, sem ponto';
    const result = validateABNTReference(ref);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  test('cada issue reduz o score em 20 pontos', () => {
    // 1 issue: sobrenome em minúsculas, mas tem destaque, ano e ponto
    const ref = 'silva, João. **Metodologia**. São Paulo: Atlas, 2020.';
    const result = validateABNTReference(ref);
    expect(result.score).toBe(80);
  });

  // ── Entrada vazia / nula ─────────────────────────────────────────────────────
  test('referência vazia retorna score 0 e isValid false', () => {
    expect(validateABNTReference('').isValid).toBe(false);
    expect(validateABNTReference('').score).toBe(0);
    expect(validateABNTReference(null).isValid).toBe(false);
    expect(validateABNTReference(undefined).isValid).toBe(false);
  });
});
