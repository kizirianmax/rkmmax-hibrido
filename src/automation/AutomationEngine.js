/**
 * AUTOMATION ENGINE
 * Motor central de automação que orquestra todo o processo
 * Coordena: Análise → Seleção de Especialista → Geração de Código → Validação → Commit
 */

import SecurityValidator from "./SecurityValidator.js";
import AuditLogger from "./AuditLogger.js";
import GitHubAutomation from "./GitHubAutomation.js";
import SpecialistSelector from "./SpecialistSelector.js";

class AutomationEngine {
  constructor(config = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      aiModel: config.aiModel || "llama-8b",
      temperature: config.temperature || 0.7,
      ...config,
    };

    this.validator = new SecurityValidator();
    this.auditLogger = new AuditLogger();
    this.specialistSelector = new SpecialistSelector();

    // GitHub será inicializado quando necessário
    this.gitHub = null;
  }

  /**
   * Inicializar GitHub Automation
   */
  initializeGitHub(token) {
    try {
      this.gitHub = new GitHubAutomation(token);
      return true;
    } catch (error) {
      console.error("Erro ao inicializar GitHub:", error);
      return false;
    }
  }

  /**
   * Executar automação completa
   */
  async executeAutomation(request) {
    const automationId = this.auditLogger.logAutomationRequest({
      userId: request.userId,
      username: request.username,
      command: request.command,
      mode: request.mode || "OPTIMIZED",
      selectedSpecialist: request.selectedSpecialist,
      description: request.description,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      sessionId: request.sessionId,
    });

    const result = {
      automationId,
      status: "INITIATED",
      steps: [],
      errors: [],
    };

    try {
      // Fase 1: Análise do comando
      console.log(`\n📋 FASE 1: Análise do comando`);
      const analysis = await this.analyzeCommand(request.command);
      result.steps.push({
        phase: "ANALYSIS",
        status: "COMPLETED",
        details: analysis,
      });

      // Fase 2: Seleção de especialista
      console.log(`\n🎯 FASE 2: Seleção de especialista`);
      let specialist;

      if (request.mode === "HYBRID" && request.selectedSpecialist) {
        specialist = request.selectedSpecialist;
        console.log(`✅ Especialista selecionado manualmente: ${specialist}`);
      } else {
        specialist = await this.specialistSelector.selectSpecialist(
          analysis.taskType,
          analysis.keywords
        );
        console.log(`✅ Especialista selecionado automaticamente: ${specialist}`);
      }

      result.steps.push({
        phase: "SPECIALIST_SELECTION",
        status: "COMPLETED",
        specialist,
        mode: request.mode,
      });

      // Fase 3: Geração de código
      console.log(`\n💻 FASE 3: Geração de código`);
      const codeGeneration = await this.generateCode(analysis, specialist, request.repositoryInfo);

      result.steps.push({
        phase: "CODE_GENERATION",
        status: "COMPLETED",
        filesGenerated: codeGeneration.files.length,
        linesOfCode: codeGeneration.totalLines,
      });

      // Fase 4: Validação de segurança
      console.log(`\n🔐 FASE 4: Validação de segurança`);
      const securityValidation = await this.validateCode(codeGeneration.files);

      if (!securityValidation.isValid) {
        result.status = "BLOCKED";
        result.errors.push({
          phase: "SECURITY_VALIDATION",
          message: "Código bloqueado por validação de segurança",
          details: securityValidation,
        });

        this.auditLogger.logSecurityValidation({
          automationId,
          filesChecked: codeGeneration.files.length,
          isValid: false,
          severity: securityValidation.severity,
          errors: securityValidation.errors,
          warnings: securityValidation.warnings,
        });

        return result;
      }

      result.steps.push({
        phase: "SECURITY_VALIDATION",
        status: "COMPLETED",
        warnings: securityValidation.warnings.length,
      });

      // Fase 5: Commit + Push
      console.log(`\n📝 FASE 5: Commit + Push`);
      let commitResult = null;

      if (request.repositoryInfo && this.gitHub) {
        commitResult = await this.commitAndPush(
          codeGeneration.files,
          analysis.commitMessage,
          request.repositoryInfo,
          specialist
        );

        result.steps.push({
          phase: "GIT_COMMIT",
          status: "COMPLETED",
          commitHash: commitResult.commit.sha,
          filesChanged: commitResult.filesChanged,
        });
      }

      // Fase 6: Criar PR (opcional)
      console.log(`\n🔀 FASE 6: Criar Pull Request (opcional)`);
      let prResult = null;

      if (request.createPR && this.gitHub && commitResult) {
        prResult = await this.createPullRequest(analysis, specialist, request.repositoryInfo);

        result.steps.push({
          phase: "CREATE_PR",
          status: "COMPLETED",
          prNumber: prResult.pr.number,
          prUrl: prResult.pr.url,
        });
      }

      // Sucesso!
      result.status = "SUCCESS";
      result.output = {
        files: codeGeneration.files,
        commit: commitResult?.commit,
        pr: prResult?.pr,
      };

      // Log de conclusão
      this.auditLogger.logAutomationCompletion({
        automationId,
        userId: request.userId,
        status: "SUCCESS",
        totalDuration: result.totalDuration,
        commitHash: commitResult?.commit.sha,
        prUrl: prResult?.pr.url,
        filesCreated: codeGeneration.files.length,
        linesAdded: codeGeneration.totalLines,
        specialist,
        mode: request.mode,
        creditsUsed: request.creditsUsed,
      });

      return result;
    } catch (error) {
      console.error(`❌ Erro na automação: ${error.message}`);

      result.status = "FAILED";
      result.errors.push({
        message: error.message,
        stack: error.stack,
      });

      // Log de erro
      this.auditLogger.logError({
        automationId,
        userId: request.userId,
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack,
        phase: result.steps[result.steps.length - 1]?.phase || "UNKNOWN",
      });

      return result;
    }
  }

  /**
   * Analisar comando do usuário
   */
  async analyzeCommand(command) {
    // Aqui seria chamada uma IA para analisar o comando
    // Por enquanto, análise simples

    const keywords = command.toLowerCase().split(" ");

    let taskType = "GENERAL";
    if (command.includes("componente") || command.includes("component")) taskType = "COMPONENT";
    if (command.includes("função") || command.includes("function")) taskType = "FUNCTION";
    if (command.includes("teste") || command.includes("test")) taskType = "TEST";
    if (command.includes("estilo") || command.includes("style")) taskType = "STYLE";
    if (command.includes("documentação") || command.includes("documentation"))
      taskType = "DOCUMENTATION";
    if (command.includes("refatora") || command.includes("refatorar") || command.includes("refactor")) taskType = "REFACTOR";

    return {
      command,
      taskType,
      keywords,
      commitMessage: `feat: ${command.substring(0, 50)}`,
      description: command,
    };
  }

  /**
   * Gerar código via IA
   */
  async generateCode(analysis, specialist, repositoryInfo) {
    // Aqui seria chamada a IA (Gemini, GROQ, etc)
    // Por enquanto, simulação

    console.log(`🤖 Gerando código com ${specialist}...`);

    // Simular geração de código
    const files = [
      {
        path: `src/generated_${Date.now()}.js`,
        content: `// Gerado automaticamente por ${specialist}\n// Tarefa: ${analysis.description}\n\nexport default function generated() {\n  // Código gerado aqui\n}\n`,
      },
    ];

    return {
      files,
      totalLines: files.reduce((sum, f) => sum + f.content.split("\n").length, 0),
      specialist,
    };
  }

  /**
   * Validar código
   */
  async validateCode(files) {
    console.log(`🔍 Validando ${files.length} arquivos...`);

    const validation = await this.validator.validateFiles(files);

    if (!validation.isValid) {
      console.log(`❌ Validação falhou!`);
      return {
        isValid: false,
        severity: "critical",
        errors: validation.details.flatMap((d) => d.errors),
        warnings: validation.details.flatMap((d) => d.warnings),
      };
    }

    console.log(`✅ Código validado com sucesso!`);
    return {
      isValid: true,
      severity: "none",
      errors: [],
      warnings: validation.details.flatMap((d) => d.warnings),
    };
  }

  /**
   * Fazer commit + push
   */
  async commitAndPush(files, message, repositoryInfo, specialist) {
    console.log(`📝 Fazendo commit + push...`);

    if (!this.gitHub) {
      throw new Error("GitHub não inicializado");
    }

    const result = await this.gitHub.commitAndPush(
      repositoryInfo.owner,
      repositoryInfo.repo,
      files,
      message,
      repositoryInfo.branch || "main",
      {
        name: `${specialist} Bot`,
        email: `${specialist.toLowerCase()}@rkmmax.com`,
      }
    );

    console.log(`✅ Commit realizado: ${result.commit.sha.substring(0, 7)}`);

    return result;
  }

  /**
   * Criar Pull Request
   */
  async createPullRequest(analysis, specialist, repositoryInfo) {
    console.log(`🔀 Criando Pull Request...`);

    if (!this.gitHub) {
      throw new Error("GitHub não inicializado");
    }

    const branchName = `automation/${specialist.toLowerCase()}/${Date.now()}`;

    const pr = await this.gitHub.createPullRequest(
      repositoryInfo.owner,
      repositoryInfo.repo,
      `[${specialist}] ${analysis.commitMessage}`,
      `Automação executada por ${specialist}\n\nTarefa: ${analysis.description}`,
      branchName,
      repositoryInfo.branch || "main"
    );

    console.log(`✅ PR criado: ${pr.url}`);

    return { pr };
  }

  /**
   * Obter histórico de automações
   */
  getAutomationHistory(userId, limit = 50) {
    return this.auditLogger
      .searchLogs({
        type: "AUTOMATION_REQUEST",
        userId,
      })
      .slice(-limit);
  }

  /**
   * Obter estatísticas de automação
   */
  getAutomationStats(userId) {
    const logs = this.auditLogger.searchLogs({ userId });

    const stats = {
      totalAutomations: logs.length,
      successfulAutomations: logs.filter((l) => l.status === "SUCCESS").length,
      failedAutomations: logs.filter((l) => l.status === "FAILED").length,
      blockedAutomations: logs.filter((l) => l.status === "BLOCKED").length,
      byMode: {},
      bySpecialist: {},
    };

    logs.forEach((log) => {
      if (log.mode) {
        stats.byMode[log.mode] = (stats.byMode[log.mode] || 0) + 1;
      }
      if (log.selectedSpecialist) {
        stats.bySpecialist[log.selectedSpecialist] =
          (stats.bySpecialist[log.selectedSpecialist] || 0) + 1;
      }
    });

    return stats;
  }
}

export default AutomationEngine;
