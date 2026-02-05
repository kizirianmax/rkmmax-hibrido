/**
 * AUTOMATION ENGINE TESTS
 * Testes unitários para motor de automação
 */

// Mock the AuditLogger module
jest.mock("../AuditLogger.js", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    logAutomationRequest: jest.fn().mockReturnValue("mock-automation-id"),
    logSecurityValidation: jest.fn(),
    logAutomationCompletion: jest.fn(),
    logError: jest.fn(),
    searchLogs: jest.fn().mockReturnValue([]),
    logAutomationStarted: jest.fn(),
    logAutomationCompleted: jest.fn(),
    logAutomationFailed: jest.fn(),
    getAutomationHistory: jest.fn().mockReturnValue([]),
    getAutomationStats: jest.fn().mockReturnValue({
      totalAutomations: 0,
      successfulAutomations: 0,
      failedAutomations: 0,
    }),
  })),
}));

import AutomationEngine from "../AutomationEngine.js";

describe("AutomationEngine", () => {
  let engine;

  beforeEach(() => {
    engine = new AutomationEngine({
      aiModel: "gemini-2.0-flash",
      temperature: 0.7,
    });
  });

  describe("initialization", () => {
    test("deve inicializar com configurações padrão", () => {
      expect(engine.config.aiModel).toBe("gemini-2.0-flash");
      expect(engine.config.temperature).toBe(0.7);
      expect(engine.config.maxRetries).toBe(3);
    });

    test("deve inicializar componentes", () => {
      expect(engine.validator).toBeDefined();
      expect(engine.auditLogger).toBeDefined();
      expect(engine.specialistSelector).toBeDefined();
    });
  });

  describe("analyzeCommand", () => {
    test("deve analisar comando simples", async () => {
      const analysis = await engine.analyzeCommand("cria um componente de login");

      expect(analysis.command).toBeDefined();
      expect(analysis.taskType).toBeDefined();
      expect(analysis.keywords).toBeDefined();
      expect(analysis.commitMessage).toBeDefined();
    });

    test("deve detectar tipo de tarefa COMPONENT", async () => {
      const analysis = await engine.analyzeCommand("cria um componente de login");

      expect(analysis.taskType).toBe("COMPONENT");
    });

    test("deve detectar tipo de tarefa FUNCTION", async () => {
      const analysis = await engine.analyzeCommand("cria uma função de autenticação");

      expect(analysis.taskType).toBe("FUNCTION");
    });

    test("deve detectar tipo de tarefa TEST", async () => {
      const analysis = await engine.analyzeCommand("cria testes para login");

      expect(analysis.taskType).toBe("TEST");
    });

    test("deve detectar tipo de tarefa REFACTOR", async () => {
      const analysis = await engine.analyzeCommand("refatora o código de autenticação");

      expect(analysis.taskType).toBe("REFACTOR");
    });

    test("deve extrair keywords do comando", async () => {
      const analysis = await engine.analyzeCommand("cria componente login form");

      expect(analysis.keywords.length).toBeGreaterThan(0);
      expect(analysis.keywords).toContain("cria");
      expect(analysis.keywords).toContain("componente");
    });
  });

  describe("generateCode", () => {
    test("deve gerar código", async () => {
      const analysis = {
        taskType: "COMPONENT",
        description: "componente de login",
        keywords: ["login", "form"],
      };

      const generation = await engine.generateCode(analysis, "Frontend", {});

      expect(generation.files).toBeDefined();
      expect(generation.files.length).toBeGreaterThan(0);
      expect(generation.totalLines).toBeGreaterThan(0);
    });

    test("arquivo gerado deve ter conteúdo", async () => {
      const analysis = {
        taskType: "COMPONENT",
        description: "componente de login",
      };

      const generation = await engine.generateCode(analysis, "Frontend", {});

      expect(generation.files[0].path).toBeDefined();
      expect(generation.files[0].content).toBeDefined();
      expect(generation.files[0].content.length).toBeGreaterThan(0);
    });
  });

  describe("validateCode", () => {
    test("deve validar código gerado", async () => {
      const files = [
        {
          path: "src/LoginComponent.jsx",
          content: "export default function Login() { return <div>Login</div>; }",
        },
      ];

      const validation = await engine.validateCode(files);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test("deve rejeitar código perigoso", async () => {
      const files = [
        {
          path: "src/dangerous.js",
          content: 'exec("rm -rf /");',
        },
      ];

      const validation = await engine.validateCode(files);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe("executeAutomation", () => {
    test("deve executar automação completa", async () => {
      const request = {
        userId: "user123",
        username: "Test User",
        command: "cria um componente de login",
        mode: "OPTIMIZED",
        description: "componente de login com validação",
        creditsUsed: 5,
        ipAddress: "127.0.0.1",
        userAgent: "test",
        sessionId: "session123",
      };

      const result = await engine.executeAutomation(request);

      expect(result.automationId).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.steps).toBeDefined();
    });

    test("deve retornar automationId", async () => {
      const request = {
        userId: "user123",
        username: "Test User",
        command: "test command",
        mode: "MANUAL",
      };

      const result = await engine.executeAutomation(request);

      expect(result.automationId).toMatch(/^LOG_/);
    });

    test("deve incluir fases de execução", async () => {
      const request = {
        userId: "user123",
        username: "Test User",
        command: "cria um componente",
        mode: "OPTIMIZED",
      };

      const result = await engine.executeAutomation(request);

      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps.some((s) => s.phase === "ANALYSIS")).toBe(true);
      expect(result.steps.some((s) => s.phase === "SPECIALIST_SELECTION")).toBe(true);
      expect(result.steps.some((s) => s.phase === "CODE_GENERATION")).toBe(true);
      expect(result.steps.some((s) => s.phase === "SECURITY_VALIDATION")).toBe(true);
    });

    test("deve bloquear código perigoso", async () => {
      engine.generateCode = async () => ({
        files: [
          {
            path: "dangerous.js",
            content: 'exec("rm -rf /");',
          },
        ],
        totalLines: 1,
      });

      const request = {
        userId: "user123",
        username: "Test User",
        command: "test",
        mode: "MANUAL",
      };

      const result = await engine.executeAutomation(request);

      expect(result.status).toBe("BLOCKED");
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("getAutomationHistory", () => {
    test("deve retornar histórico de automações", () => {
      const history = engine.getAutomationHistory("user123", 10);

      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("getAutomationStats", () => {
    test("deve retornar estatísticas", () => {
      const stats = engine.getAutomationStats("user123");

      expect(stats).toBeDefined();
      expect(stats.totalAutomations).toBeGreaterThanOrEqual(0);
      expect(stats.successfulAutomations).toBeGreaterThanOrEqual(0);
      expect(stats.failedAutomations).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Modo Híbrido", () => {
    test("deve permitir seleção manual de especialista", async () => {
      const request = {
        userId: "user123",
        username: "Test User",
        command: "cria um componente",
        mode: "HYBRID",
        selectedSpecialist: "Frontend",
      };

      const result = await engine.executeAutomation(request);

      const selectionStep = result.steps.find((s) => s.phase === "SPECIALIST_SELECTION");
      expect(selectionStep.specialist).toBe("Frontend");
    });

    test("deve usar especialista selecionado em modo HYBRID", async () => {
      const request = {
        userId: "user123",
        username: "Test User",
        command: "cria um componente",
        mode: "HYBRID",
        selectedSpecialist: "Designer",
      };

      const result = await engine.executeAutomation(request);

      const selectionStep = result.steps.find((s) => s.phase === "SPECIALIST_SELECTION");
      expect(selectionStep.mode).toBe("HYBRID");
    });
  });

  describe("Modo Otimizado", () => {
    test("deve selecionar especialista automaticamente em OPTIMIZED", async () => {
      const request = {
        userId: "user123",
        username: "Test User",
        command: "cria um componente de login",
        mode: "OPTIMIZED",
      };

      const result = await engine.executeAutomation(request);

      const selectionStep = result.steps.find((s) => s.phase === "SPECIALIST_SELECTION");
      expect(selectionStep.specialist).toBeDefined();
      expect(selectionStep.mode).toBe("OPTIMIZED");
    });
  });

  describe("Error Handling", () => {
    test("deve capturar erros durante execução", async () => {
      engine.generateCode = async () => {
        throw new Error("Erro na geração de código");
      };

      const request = {
        userId: "user123",
        username: "Test User",
        command: "test",
        mode: "MANUAL",
      };

      const result = await engine.executeAutomation(request);

      expect(result.status).toBe("FAILED");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("deve incluir mensagem de erro", async () => {
      engine.generateCode = async () => {
        throw new Error("Erro específico");
      };

      const request = {
        userId: "user123",
        username: "Test User",
        command: "test",
        mode: "MANUAL",
      };

      const result = await engine.executeAutomation(request);

      expect(result.errors[0].message).toContain("Erro específico");
    });
  });

  describe("Logging", () => {
    test("deve registrar automação iniciada", async () => {
      const request = {
        userId: "user123",
        username: "Test User",
        command: "test command",
        mode: "MANUAL",
      };

      const result = await engine.executeAutomation(request);

      expect(result.automationId).toBeDefined();
    });

    test("deve registrar conclusão de automação", async () => {
      const request = {
        userId: "user123",
        username: "Test User",
        command: "test command",
        mode: "MANUAL",
      };

      const result = await engine.executeAutomation(request);

      expect(result.status).toBeDefined();
    });
  });
});
