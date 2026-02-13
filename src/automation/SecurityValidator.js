/**
 * SECURITY VALIDATOR
 * Validação rigorosa de código antes de commits automáticos
 * Previne: Malware, credenciais expostas, deletar arquivos críticos, etc
 */

class SecurityValidator {
  constructor() {
    this.blockedPatterns = {
      // Comandos perigosos
      destructive: [
        /rm\s+-rf\s+\//,
        /rm\s+-rf\s+\*/,
        /del\s+\/s\s+\/q/,
        /DROP\s+TABLE/i,
        /DELETE\s+FROM/i,
        /TRUNCATE\s+TABLE/i,
      ],

      // Código malicioso
      malicious: [
        /eval\s*\(/,
        /Function\s*\(/,
        /exec\s*\(/,
        /spawn\s*\(/,
        /require\s*\(\s*['"]child_process['"]\s*\)/,
        /import\s+.*\s+from\s+['"]child_process['"]/,
        /\.shell\s*\(/,
        /\.exec\s*\(/,
      ],

      // Acesso a arquivos críticos
      criticalFiles: [
        /\.git\//,
        /\.env/,
        /node_modules\//,
        /\.github\/workflows/,
        /vercel\.json/,
        /package-lock\.json/,
        /yarn\.lock/,
      ],

      // Modificações perigosas
      dangerousModifications: [
        /delete\s+.*\.git/i,
        /remove\s+.*package\.json/i,
        /truncate\s+.*database/i,
      ],
    };

    // Padrões de credenciais (verificados separadamente)
    this.credentialPatterns = [
      /sk[-_](?:live_|test_)?[a-zA-Z0-9]{10,}/,  // Stripe/OpenAI API keys (sk- or sk_)
      /ghp_[a-zA-Z0-9]{16,}/,                    // GitHub personal access tokens
      /aws_secret_access_key\s*=\s*['"][^'"]+['"]/i,
      /private_key\s*=\s*['"][^'"]+['"]/i,
      /bearer\s+[a-z0-9]{40,}/i,
    ];

    this.criticalFiles = [
      ".git",
      ".github",
      "node_modules",
      ".env",
      ".env.production",
      ".env.local",
      "package-lock.json",
      "yarn.lock",
      "vercel.json",
      "firebase.json",
    ];

    this.allowedExtensions = [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".json",
      ".css",
      ".scss",
      ".html",
      ".md",
      ".py",
      ".go",
      ".java",
      ".rb",
      ".php",
      ".sql",
      ".yml",
      ".yaml",
    ];
  }

  /**
   * Validação completa de código
   */
  async validateCode(code, filePath) {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      severity: "none", // none, low, medium, high, critical
      details: {
        codeLength: code.length,
        filePath,
        timestamp: new Date().toISOString(),
      },
    };

    // 1. Verificar se é arquivo crítico (PRIORITY)
    if (this.isCriticalFile(filePath)) {
      results.isValid = false;
      results.severity = "critical";
      results.errors.push({
        type: "CRITICAL_FILE_MODIFICATION",
        message: `Não é permitido modificar arquivo crítico: ${filePath}`,
        severity: "critical",
      });
      return results;
    }

    // 2. Verificar extensão do arquivo
    if (!this.isAllowedExtension(filePath)) {
      results.isValid = false;
      results.severity = "critical";
      results.errors.push({
        type: "INVALID_FILE_EXTENSION",
        message: `Extensão de arquivo não permitida: ${filePath}`,
        severity: "critical",
      });
      return results;
    }

    // 3. Verificar padrões bloqueados
    const patternCheck = this.checkBlockedPatterns(code);
    if (patternCheck.found.length > 0) {
      results.isValid = false;
      results.severity = "critical";
      results.errors.push({
        type: "BLOCKED_PATTERN_DETECTED",
        message: `Padrões perigosos detectados: ${patternCheck.found.join(", ")}`,
        severity: "critical",
        patterns: patternCheck.details,
      });
      return results;
    }

    // 4. Verificar credenciais expostas
    const credentialCheck = this.checkCredentials(code);
    if (credentialCheck.found.length > 0) {
      results.isValid = false;
      results.severity = "critical";
      results.errors.push({
        type: "CREDENTIALS_EXPOSED",
        message: `Credenciais potencialmente expostas: ${credentialCheck.found.join(", ")}`,
        severity: "critical",
        credentials: credentialCheck.details,
      });
      return results;
    }

    // 5. Verificar sintaxe básica
    const syntaxCheck = this.checkSyntax(code, filePath);
    if (!syntaxCheck.isValid) {
      results.warnings.push({
        type: "SYNTAX_WARNING",
        message: syntaxCheck.message,
        severity: "medium",
      });
    }

    // 6. Verificar tamanho do arquivo
    if (code.length > 1000000) {
      results.warnings.push({
        type: "FILE_TOO_LARGE",
        message: `Arquivo muito grande (${code.length} bytes)`,
        severity: "low",
      });
    }

    // 7. Verificar padrões de boas práticas
    const bestPracticesCheck = this.checkBestPractices(code, filePath);
    results.warnings.push(...bestPracticesCheck);

    return results;
  }

  /**
   * Validar múltiplos arquivos
   */
  async validateFiles(files) {
    const results = {
      totalFiles: files.length,
      validFiles: 0,
      invalidFiles: 0,
      warnings: 0,
      details: [],
      isValid: true,
    };

    for (const file of files) {
      const validation = await this.validateCode(file.content, file.path);

      results.details.push({
        path: file.path,
        ...validation,
      });

      if (!validation.isValid) {
        results.invalidFiles++;
        results.isValid = false;
      } else {
        results.validFiles++;
      }

      if (validation.warnings.length > 0) {
        results.warnings += validation.warnings.length;
      }
    }

    return results;
  }

  /**
   * Verificar extensão permitida
   */
  isAllowedExtension(filePath) {
    const ext = filePath.substring(filePath.lastIndexOf("."));
    return this.allowedExtensions.includes(ext.toLowerCase());
  }

  /**
   * Verificar se é arquivo crítico
   */
  isCriticalFile(filePath) {
    return this.criticalFiles.some(
      (critical) => filePath.includes(critical) || filePath.startsWith(critical)
    );
  }

  /**
   * Verificar padrões bloqueados
   */
  checkBlockedPatterns(code) {
    const found = [];
    const details = [];

    for (const [category, patterns] of Object.entries(this.blockedPatterns)) {
      for (const pattern of patterns) {
        const matches = code.match(pattern);
        if (matches) {
          found.push(category);
          details.push({
            category,
            pattern: pattern.toString(),
            matches: matches.slice(0, 3), // Primeiras 3 ocorrências
          });
        }
      }
    }

    return { found: [...new Set(found)], details };
  }

  /**
   * Verificar credenciais expostas
   */
  checkCredentials(code) {
    const found = [];
    const details = [];

    for (const pattern of this.credentialPatterns) {
      const matches = code.match(new RegExp(pattern, "g"));
      if (matches) {
        found.push(...matches);
        details.push({
          pattern: pattern.toString(),
          count: matches.length,
        });
      }
    }

    return {
      found: [...new Set(found)],
      details,
      riskLevel: found.length > 0 ? "CRITICAL" : "SAFE",
    };
  }

  /**
   * Verificar sintaxe básica
   */
  checkSyntax(code, filePath) {
    const ext = filePath.substring(filePath.lastIndexOf("."));

    // Verificações básicas por tipo de arquivo
    if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
      // Verificar chaves balanceadas
      const openBraces = (code.match(/{/g) || []).length;
      const closeBraces = (code.match(/}/g) || []).length;

      if (openBraces !== closeBraces) {
        return {
          isValid: false,
          message: `Chaves desbalanceadas: ${openBraces} abertas, ${closeBraces} fechadas`,
        };
      }

      // Verificar parênteses balanceados
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;

      if (openParens !== closeParens) {
        return {
          isValid: false,
          message: `Parênteses desbalanceados: ${openParens} abertos, ${closeParens} fechados`,
        };
      }
    }

    if ([".json"].includes(ext)) {
      try {
        JSON.parse(code);
      } catch (error) {
        return {
          isValid: false,
          message: `JSON inválido: ${error.message}`,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Verificar boas práticas
   */
  checkBestPractices(code, filePath) {
    const warnings = [];

    // Verificar console.log em produção
    if (code.includes("console.log") && !filePath.includes("test")) {
      warnings.push({
        type: "CONSOLE_LOG_IN_PRODUCTION",
        message: "console.log detectado em código de produção",
        severity: "low",
        suggestion: "Use logger apropriado em vez de console.log",
      });
    }

    // Verificar TODO/FIXME
    if (code.includes("TODO") || code.includes("FIXME")) {
      warnings.push({
        type: "UNFINISHED_CODE",
        message: "Código com TODO/FIXME detectado",
        severity: "low",
        suggestion: "Remova comentários TODO/FIXME antes de fazer commit",
      });
    }

    // Verificar comentários de debug
    if (code.includes("debugger")) {
      warnings.push({
        type: "DEBUG_STATEMENT",
        message: "Declaração debugger detectada",
        severity: "medium",
        suggestion: "Remova debugger antes de fazer commit",
      });
    }

    return warnings;
  }

  /**
   * Gerar relatório de segurança
   */
  generateSecurityReport(validationResults) {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks: validationResults.details.length,
        passed: validationResults.validFiles,
        failed: validationResults.invalidFiles,
        warnings: validationResults.warnings,
        overallStatus: validationResults.isValid ? "SAFE" : "BLOCKED",
      },
      details: validationResults.details,
      recommendation: validationResults.isValid
        ? "✅ Código aprovado para commit"
        : "❌ Código bloqueado - Corrija os erros antes de fazer commit",
    };
  }
}

// Exportar
if (typeof module !== "undefined" && module.exports) {
  module.exports = SecurityValidator;
}

export default SecurityValidator;
