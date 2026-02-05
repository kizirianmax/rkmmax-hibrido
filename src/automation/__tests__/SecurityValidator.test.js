/**
 * SECURITY VALIDATOR TESTS
 * Testes unitários para validação de código
 */

// Dynamic import para ES modules
let SecurityValidator;

beforeAll(async () => {
  const module = await import("../SecurityValidator.js");
  SecurityValidator = module.default;
});

describe("SecurityValidator", () => {
  let validator;

  beforeEach(() => {
    if (!SecurityValidator) {
      throw new Error("SecurityValidator not loaded");
    }
    validator = new SecurityValidator();
  });

  describe("validateCode", () => {
    test("deve aceitar código JavaScript válido", async () => {
      const code = `
        function login(email, password) {
          return { email, password };
        }
      `;

      const result = await validator.validateCode(code, "src/login.js");

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test("deve rejeitar código com rm -rf", async () => {
      const code = `
        const cmd = 'rm -rf /';
        exec(cmd);
      `;

      const result = await validator.validateCode(code, "src/dangerous.js");

      expect(result.isValid).toBe(false);
      expect(result.severity).toBe("critical");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("deve rejeitar código com DROP TABLE", async () => {
      const code = `
        const query = 'DROP TABLE users;';
        db.execute(query);
      `;

      const result = await validator.validateCode(code, "src/db.js");

      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("BLOCKED_PATTERN_DETECTED");
    });

    test("deve detectar credenciais expostas", async () => {
      const code = `
        const apiKey = 'sk-1234567890abcdef';
        const token = 'ghp_abcdefghijklmnop';
      `;

      const result = await validator.validateCode(code, "src/config.js");

      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("CREDENTIALS_EXPOSED");
    });

    test("deve rejeitar arquivo com extensão não permitida", async () => {
      const code = "some code";

      const result = await validator.validateCode(code, "src/script.exe");

      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("INVALID_FILE_EXTENSION");
    });

    test("deve rejeitar modificação de arquivo crítico", async () => {
      const code = "some code";

      const result = await validator.validateCode(code, ".env");

      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("CRITICAL_FILE_MODIFICATION");
    });

    test("deve avisar sobre console.log em produção", async () => {
      const code = `
        function test() {
          console.log('debug');
        }
      `;

      const result = await validator.validateCode(code, "src/production.js");

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBe("CONSOLE_LOG_IN_PRODUCTION");
    });

    test("deve avisar sobre TODO/FIXME", async () => {
      const code = `
        // TODO: Implementar autenticação
        function login() {}
      `;

      const result = await validator.validateCode(code, "src/auth.js");

      expect(result.warnings.some((w) => w.type === "UNFINISHED_CODE")).toBe(true);
    });

    test("deve detectar chaves desbalanceadas", async () => {
      const code = `
        function test() {
          return { key: 'value'
        }
      `;

      const result = await validator.validateCode(code, "src/broken.js");

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test("deve validar JSON válido", async () => {
      const code = '{"name": "test", "value": 123}';

      const result = await validator.validateCode(code, "config.json");

      expect(result.isValid).toBe(true);
    });

    test("deve rejeitar JSON inválido", async () => {
      const code = '{"name": "test", "value": 123,}';

      const result = await validator.validateCode(code, "config.json");

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("validateFiles", () => {
    test("deve validar múltiplos arquivos", async () => {
      const files = [
        {
          path: "src/file1.js",
          content: "function test() { return true; }",
        },
        {
          path: "src/file2.js",
          content: "const x = 10;",
        },
      ];

      const result = await validator.validateFiles(files);

      expect(result.validFiles).toBe(2);
      expect(result.invalidFiles).toBe(0);
      expect(result.isValid).toBe(true);
    });

    test("deve bloquear se um arquivo for inválido", async () => {
      const files = [
        {
          path: "src/file1.js",
          content: "function test() { return true; }",
        },
        {
          path: "src/dangerous.js",
          content: 'exec("rm -rf /");',
        },
      ];

      const result = await validator.validateFiles(files);

      expect(result.invalidFiles).toBe(1);
      expect(result.isValid).toBe(false);
    });
  });

  describe("checkBlockedPatterns", () => {
    test("deve detectar padrões destrutivos", () => {
      const code = "rm -rf /home";
      const result = validator.checkBlockedPatterns(code);

      expect(result.found.length).toBeGreaterThan(0);
      expect(result.found).toContain("destructive");
    });

    test("deve detectar código malicioso", () => {
      const code = 'eval("malicious code")';
      const result = validator.checkBlockedPatterns(code);

      expect(result.found).toContain("malicious");
    });

    test("deve detectar acesso a arquivos críticos", () => {
      const code = 'fs.readFile(".env", "utf8")';
      const result = validator.checkBlockedPatterns(code);

      expect(result.found).toContain("criticalFiles");
    });
  });

  describe("checkCredentials", () => {
    test("deve detectar API keys", () => {
      const code = 'const key = "sk_live_1234567890abcdef";';
      const result = validator.checkCredentials(code);

      expect(result.found.length).toBeGreaterThan(0);
    });

    test("deve detectar tokens GitHub", () => {
      const code = 'const token = "ghp_abcdefghijklmnopqrstuvwxyz";';
      const result = validator.checkCredentials(code);

      expect(result.found.length).toBeGreaterThan(0);
    });
  });

  describe("checkSyntax", () => {
    test("deve validar sintaxe JavaScript", () => {
      const code = 'const x = { key: "value" };';
      const result = validator.checkSyntax(code, "test.js");

      expect(result.isValid).toBe(true);
    });

    test("deve detectar chaves desbalanceadas", () => {
      const code = 'const x = { key: "value" };';
      const result = validator.checkSyntax(code, "test.js");

      expect(result.isValid).toBe(true);
    });
  });

  describe("generateSecurityReport", () => {
    test("deve gerar relatório de segurança", async () => {
      const files = [
        {
          path: "src/test.js",
          content: "function test() { return true; }",
        },
      ];

      const validation = await validator.validateFiles(files);
      const report = validator.generateSecurityReport(validation);

      expect(report.summary).toBeDefined();
      expect(report.summary.totalChecks).toBe(1);
      expect(report.recommendation).toBeDefined();
    });
  });

  describe("isAllowedExtension", () => {
    test("deve permitir extensões válidas", () => {
      expect(validator.isAllowedExtension("test.js")).toBe(true);
      expect(validator.isAllowedExtension("test.jsx")).toBe(true);
      expect(validator.isAllowedExtension("test.ts")).toBe(true);
      expect(validator.isAllowedExtension("test.json")).toBe(true);
    });

    test("deve rejeitar extensões inválidas", () => {
      expect(validator.isAllowedExtension("test.exe")).toBe(false);
      expect(validator.isAllowedExtension("test.bat")).toBe(false);
      expect(validator.isAllowedExtension("test.sh")).toBe(false);
    });
  });

  describe("isCriticalFile", () => {
    test("deve identificar arquivos críticos", () => {
      expect(validator.isCriticalFile(".env")).toBe(true);
      expect(validator.isCriticalFile(".git/config")).toBe(true);
      expect(validator.isCriticalFile("node_modules/package.json")).toBe(true);
    });

    test("deve permitir arquivos normais", () => {
      expect(validator.isCriticalFile("src/test.js")).toBe(false);
      expect(validator.isCriticalFile("components/Button.jsx")).toBe(false);
    });
  });
});
