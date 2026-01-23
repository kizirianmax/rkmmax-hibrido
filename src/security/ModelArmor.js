/**
 * MODEL ARMOR - Filtros de Segurança de Alto Padrão
 * Análise multi-camada de prompts e respostas
 * Detecção de: Prompt Injection, Sensitive Data, SQL Injection, Code Execution, Jailbreak
 */

class ModelArmor {
  constructor() {
    this.filters = {
      // PROMPT INJECTION DETECTION
      promptInjection: [
        /(?:ignore|forget|discard)[\s\n]*(?:previous|prior|above)[\s\n]*(?:instructions|rules|prompts)/gi,
        /(?:system|admin|root)[\s\n]*(?:prompt|instruction|command)/gi,
        /(?:reveal|show|display)[\s\n]*(?:system|hidden|secret)[\s\n]*(?:prompt|message)/gi,
        /(?:what is|what's|tell me)[\s\n]*(?:your|the)[\s\n]*(?:system|hidden|secret)[\s\n]*(?:prompt|instruction)/gi,
      ],

      // SENSITIVE DATA PATTERNS
      sensitiveData: [
        /\b(?:password|passwd|pwd|secret|token|api[_-]?key|auth|credential|bearer)\b[\s:=]*[^\s\n]*/gi,
        /\b(?:credit[\s-]?card|cc|cvv|ssn|social[\s-]?security|pii)\b[\s:=]*\d+/gi,
        /\b(?:email|phone|address|cpf|cnpj|rg|passport)\b[\s:=]*[^\s\n]*/gi,
        /\b(?:private[\s-]?key|secret[\s-]?key|access[\s-]?key)\b[\s:=]*[^\s\n]*/gi,
      ],

      // SQL INJECTION PATTERNS
      sqlInjection: [
        /(?:union|select|insert|update|delete|drop|create|alter|truncate)[\s\n]+(?:from|into|table|database|schema)/gi,
        /(?:--|#|\/\*|\*\/)\s*(?:comment|drop|delete|insert|union)/gi,
        /(?:or|and)[\s\n]*['"]?\d+['"]?[\s\n]*=[\s\n]*['"]?\d+['"]?/gi,
      ],

      // CODE EXECUTION PATTERNS
      codeExecution: [
        /(?:eval|exec|system|shell|bash|cmd|powershell|spawn|fork)\s*\(/gi,
        /(?:require|import|load|include)[\s\n]*\([\s\n]*['"]/gi,
        /(?:process\.env|process\.argv|__dirname|__filename)/gi,
      ],

      // JAILBREAK ATTEMPTS
      jailbreak: [
        /(?:pretend|imagine|roleplay|assume|act as|be a)[\s\n]+(?:you are|you're|you have|you've)[\s\n]+(?:not|no longer|no more|without)/gi,
        /(?:forget|ignore|disregard|override)[\s\n]+(?:your|the)[\s\n]+(?:guidelines|rules|restrictions|limitations|constraints)/gi,
        /(?:DAN|do anything now|unrestricted|unfiltered|uncensored)/gi,
      ],
    };

    this.severityMap = {
      promptInjection: "CRITICAL",
      sensitiveData: "HIGH",
      sqlInjection: "CRITICAL",
      codeExecution: "CRITICAL",
      jailbreak: "HIGH",
    };

    this.severityWeights = {
      CRITICAL: 100,
      HIGH: 50,
      MEDIUM: 25,
      LOW: 5,
    };
  }

  /**
   * Análise Multi-Camada de Prompts
   * @param {string} prompt - Prompt do usuário
   * @returns {Object} Resultado da análise
   */
  analyzePrompt(prompt) {
    if (!prompt || typeof prompt !== "string") {
      return {
        isClean: false,
        violations: [{ category: "invalid_input", severity: "HIGH" }],
        riskScore: 50,
        recommendation: "BLOCK",
      };
    }

    const violations = [];
    const scores = {};

    // Análise por categoria
    for (const [category, patterns] of Object.entries(this.filters)) {
      scores[category] = 0;

      for (const pattern of patterns) {
        const matches = (prompt.match(pattern) || []).length;
        if (matches > 0) {
          scores[category] += matches;
          violations.push({
            category,
            pattern: pattern.toString().substring(0, 50),
            matches,
            severity: this.severityMap[category] || "MEDIUM",
          });
        }
      }
    }

    const riskScore = this._calculateRiskScore(violations);
    const recommendation = this._getRecommendation(violations, riskScore);

    return {
      isClean: violations.length === 0,
      violations,
      scores,
      riskScore,
      recommendation,
      timestamp: Date.now(),
    };
  }

  /**
   * Filtragem de Respostas com Redação
   * @param {string} response - Resposta do modelo
   * @returns {Object} Resposta filtrada
   */
  filterResponse(response) {
    if (!response || typeof response !== "string") {
      return {
        filtered: response,
        redactions: [],
        isModified: false,
      };
    }

    let filtered = response;
    const redactions = [];

    // Redact sensitive data
    for (const pattern of this.filters.sensitiveData) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        const original = match[0];
        const preview = original.substring(0, 10) + "...";

        redactions.push({
          original: preview,
          category: "sensitive_data",
          position: match.index,
        });

        filtered = filtered.replace(original, "[REDACTED_SENSITIVE_DATA]");
      }
    }

    return {
      filtered,
      redactions,
      isModified: redactions.length > 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Validação Completa (Prompt + Response)
   * @param {string} prompt - Prompt original
   * @param {string} response - Resposta do modelo
   * @returns {Object} Resultado da validação completa
   */
  validateComplete(prompt, response) {
    const promptAnalysis = this.analyzePrompt(prompt);
    const responseFiltered = this.filterResponse(response);

    return {
      prompt: promptAnalysis,
      response: responseFiltered,
      isValid: promptAnalysis.recommendation !== "BLOCK",
      requiresApproval:
        promptAnalysis.recommendation === "REQUIRE_CONSENT" || responseFiltered.isModified,
      timestamp: Date.now(),
    };
  }

  /**
   * Cálculo de Score de Risco
   * @param {Array} violations - Array de violações
   * @returns {number} Score de risco (0-1000)
   */
  _calculateRiskScore(violations) {
    return violations.reduce((score, v) => {
      return score + (this.severityWeights[v.severity] || 0);
    }, 0);
  }

  /**
   * Recomendação Baseada em Análise
   * @param {Array} violations - Array de violações
   * @param {number} riskScore - Score de risco
   * @returns {string} Recomendação (ALLOW, WARN, REQUIRE_CONSENT, BLOCK)
   */
  _getRecommendation(violations, riskScore) {
    if (violations.length === 0) return "ALLOW";

    const critical = violations.filter((v) => v.severity === "CRITICAL");
    if (critical.length > 0) return "BLOCK";

    const high = violations.filter((v) => v.severity === "HIGH");
    if (high.length > 0) return "REQUIRE_CONSENT";

    if (riskScore > 50) return "WARN";

    return "ALLOW";
  }

  /**
   * Gerar Relatório de Segurança
   * @param {Object} analysis - Resultado da análise
   * @returns {string} Relatório formatado
   */
  generateReport(analysis) {
    const { isClean, violations, riskScore, recommendation } = analysis;

    let report = `
╔════════════════════════════════════════╗
║     MODEL ARMOR - SECURITY REPORT      ║
╚════════════════════════════════════════╝

Status: ${isClean ? "✅ CLEAN" : "⚠️  VIOLATIONS DETECTED"}
Risk Score: ${riskScore}/1000
Recommendation: ${recommendation}

Violations: ${violations.length}
`;

    if (violations.length > 0) {
      report += "\nDetailed Violations:\n";
      violations.forEach((v, i) => {
        report += `  ${i + 1}. [${v.severity}] ${v.category} (${v.matches} match${v.matches > 1 ? "es" : ""})\n`;
      });
    }

    report += `\nTimestamp: ${new Date(analysis.timestamp).toISOString()}`;

    return report;
  }
}

module.exports = ModelArmor;
