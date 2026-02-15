/**
 * AUDIT LOGGER
 * Registra todas as ações de automação para auditoria e compliance
 * Rastreia: Quem pediu, O que foi feito, Quando, Status, Detalhes
 */

class AuditLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 10000; // Máximo de logs em memória
  }

  /**
   * Log de requisição de automação
   */
  logAutomationRequest(data) {
    const log = {
      id: this.generateLogId(),
      type: "AUTOMATION_REQUEST",
      timestamp: new Date().toISOString(),
      userId: data.userId,
      username: data.username,
      command: data.command,
      mode: data.mode, // 'OPTIMIZED' ou 'HYBRID'
      selectedSpecialist: data.selectedSpecialist,
      suggestedSpecialist: data.suggestedSpecialist,
      description: data.description,
      status: "INITIATED",
      details: {
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        sessionId: data.sessionId,
      },
    };

    this.addLog(log);
    return log.id;
  }

  /**
   * Log de análise de código
   */
  logCodeAnalysis(data) {
    const log = {
      id: this.generateLogId(),
      type: "CODE_ANALYSIS",
      timestamp: new Date().toISOString(),
      automationId: data.automationId,
      specialist: data.specialist,
      filesAnalyzed: data.filesAnalyzed,
      codeGenerated: data.codeGenerated,
      linesOfCode: data.linesOfCode,
      status: "COMPLETED",
      details: {
        analysisTime: data.analysisTime,
        model: data.model,
        temperature: data.temperature,
      },
    };

    this.addLog(log);
    return log.id;
  }

  /**
   * Log de validação de segurança
   */
  logSecurityValidation(data) {
    const log = {
      id: this.generateLogId(),
      type: "SECURITY_VALIDATION",
      timestamp: new Date().toISOString(),
      automationId: data.automationId,
      filesChecked: data.filesChecked,
      status: data.isValid ? "PASSED" : "BLOCKED",
      severity: data.severity,
      errors: data.errors || [],
      warnings: data.warnings || [],
      details: {
        validationTime: data.validationTime,
        blockedPatterns: data.blockedPatterns || [],
        credentialsFound: data.credentialsFound || [],
      },
    };

    this.addLog(log);
    return log.id;
  }

  /**
   * Log de commit automático
   */
  logGitCommit(data) {
    const log = {
      id: this.generateLogId(),
      type: "GIT_COMMIT",
      timestamp: new Date().toISOString(),
      automationId: data.automationId,
      commitHash: data.commitHash,
      commitMessage: data.commitMessage,
      branch: data.branch,
      filesChanged: data.filesChanged,
      insertions: data.insertions,
      deletions: data.deletions,
      status: "COMPLETED",
      details: {
        author: data.author,
        pushedTo: data.pushedTo,
        prCreated: data.prCreated || false,
        prNumber: data.prNumber || null,
      },
    };

    this.addLog(log);
    return log.id;
  }

  /**
   * Log de créditos debitados
   */
  logCreditDebit(data) {
    const log = {
      id: this.generateLogId(),
      type: "CREDIT_DEBIT",
      timestamp: new Date().toISOString(),
      userId: data.userId,
      automationId: data.automationId,
      creditsDeducted: data.creditsDeducted,
      creditsRemaining: data.creditsRemaining,
      mode: data.mode,
      breakdown: {
        analysis: data.breakdown?.analysis || 0,
        codeGeneration: data.breakdown?.codeGeneration || 0,
        securityValidation: data.breakdown?.securityValidation || 0,
        gitOperations: data.breakdown?.gitOperations || 0,
      },
      status: "COMPLETED",
    };

    this.addLog(log);
    return log.id;
  }

  /**
   * Log de erro
   */
  logError(data) {
    const log = {
      id: this.generateLogId(),
      type: "ERROR",
      timestamp: new Date().toISOString(),
      automationId: data.automationId,
      userId: data.userId,
      errorType: data.errorType,
      errorMessage: data.errorMessage,
      errorStack: data.errorStack,
      phase: data.phase, // 'ANALYSIS', 'CODE_GENERATION', 'SECURITY', 'GIT', etc
      status: "FAILED",
      details: {
        recoveryAttempted: data.recoveryAttempted || false,
        recoverySuccessful: data.recoverySuccessful || false,
      },
    };

    this.addLog(log);
    return log.id;
  }

  /**
   * Log de conclusão de automação
   */
  logAutomationCompletion(data) {
    const log = {
      id: this.generateLogId(),
      type: "AUTOMATION_COMPLETION",
      timestamp: new Date().toISOString(),
      automationId: data.automationId,
      userId: data.userId,
      status: data.status, // 'SUCCESS' ou 'FAILED'
      totalDuration: data.totalDuration,
      commitHash: data.commitHash,
      prUrl: data.prUrl,
      summary: {
        filesCreated: data.filesCreated || 0,
        filesModified: data.filesModified || 0,
        filesDeleted: data.filesDeleted || 0,
        linesAdded: data.linesAdded || 0,
        linesRemoved: data.linesRemoved || 0,
      },
      details: {
        specialist: data.specialist,
        mode: data.mode,
        creditsUsed: data.creditsUsed,
      },
    };

    this.addLog(log);
    return log.id;
  }

  /**
   * Log de ação manual do usuário
   */
  logManualAction(data) {
    const log = {
      id: this.generateLogId(),
      type: "MANUAL_ACTION",
      timestamp: new Date().toISOString(),
      userId: data.userId,
      username: data.username,
      action: data.action, // 'EDIT', 'REVIEW', 'APPROVE', 'REJECT', etc
      targetFile: data.targetFile,
      description: data.description,
      status: "COMPLETED",
      details: {
        ipAddress: data.ipAddress,
        sessionId: data.sessionId,
      },
    };

    this.addLog(log);
    return log.id;
  }

  /**
   * Log de acesso ao repositório
   */
  logRepositoryAccess(data) {
    const log = {
      id: this.generateLogId(),
      type: "REPOSITORY_ACCESS",
      timestamp: new Date().toISOString(),
      userId: data.userId,
      action: data.action, // 'READ', 'WRITE', 'DELETE', etc
      repository: data.repository,
      branch: data.branch,
      filesAccessed: data.filesAccessed,
      status: "COMPLETED",
      details: {
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    this.addLog(log);
    return log.id;
  }

  /**
   * Adicionar log à fila
   */
  addLog(log) {
    this.logs.push(log);

    // Manter limite de logs em memória
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Enviar para servidor (async)
    this.persistLog(log).catch((err) => console.error("Erro ao persistir log:", err));
  }

  /**
   * Persistir log no servidor
   */
  async persistLog(log) {
    try {
      const response = await fetch("/api/audit-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        console.error("Erro ao persistir log:", response.status);
      }
    } catch (error) {
      console.error("Erro ao enviar log:", error);
    }
  }

  /**
   * Gerar ID único para log
   */
  generateLogId() {
    return `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Buscar logs por filtros
   */
  searchLogs(filters) {
    let results = this.logs;

    if (filters.type) {
      results = results.filter((log) => log.type === filters.type);
    }

    if (filters.userId) {
      results = results.filter((log) => log.userId === filters.userId);
    }

    if (filters.status) {
      results = results.filter((log) => log.status === filters.status);
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      results = results.filter((log) => new Date(log.timestamp) >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      results = results.filter((log) => new Date(log.timestamp) <= end);
    }

    if (filters.automationId) {
      results = results.filter((log) => log.automationId === filters.automationId);
    }

    return results;
  }

  /**
   * Gerar relatório de auditoria
   */
  generateAuditReport(filters = {}) {
    const logs = this.searchLogs(filters);

    const report = {
      generatedAt: new Date().toISOString(),
      filters,
      summary: {
        totalLogs: logs.length,
        byType: {},
        byStatus: {},
        byUser: {},
      },
      details: logs,
    };

    // Contar por tipo
    logs.forEach((log) => {
      report.summary.byType[log.type] = (report.summary.byType[log.type] || 0) + 1;
      report.summary.byStatus[log.status] = (report.summary.byStatus[log.status] || 0) + 1;
      report.summary.byUser[log.userId] = (report.summary.byUser[log.userId] || 0) + 1;
    });

    return report;
  }

  /**
   * Exportar logs em JSON
   */
  exportLogs(filters = {}) {
    const logs = this.searchLogs(filters);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Exportar logs em CSV
   */
  exportLogsCSV(filters = {}) {
    const logs = this.searchLogs(filters);

    if (logs.length === 0) return "";

    // Headers
    const headers = Object.keys(logs[0]);
    const csv = [headers.join(",")];

    // Rows
    logs.forEach((log) => {
      const row = headers.map((header) => {
        const value = log[header];
        if (typeof value === "object") {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csv.push(row.join(","));
    });

    return csv.join("\n");
  }

  /**
   * Limpar logs antigos
   */
  clearOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const beforeCount = this.logs.length;
    this.logs = this.logs.filter((log) => new Date(log.timestamp) > cutoffDate);

    return {
      logsRemoved: beforeCount - this.logs.length,
      logsRemaining: this.logs.length,
    };
  }

  /**
   * Obter estatísticas
   */
  getStatistics() {
    const stats = {
      totalLogs: this.logs.length,
      logTypes: {},
      statusCounts: {},
      userActivity: {},
      timeRange: {
        oldest: this.logs.length > 0 ? this.logs[0].timestamp : null,
        newest: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null,
      },
    };

    this.logs.forEach((log) => {
      stats.logTypes[log.type] = (stats.logTypes[log.type] || 0) + 1;
      stats.statusCounts[log.status] = (stats.statusCounts[log.status] || 0) + 1;

      if (log.userId) {
        stats.userActivity[log.userId] = (stats.userActivity[log.userId] || 0) + 1;
      }
    });

    return stats;
  }
}

export default AuditLogger;
