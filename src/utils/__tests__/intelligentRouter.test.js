/**
 * INTELLIGENT ROUTER TESTS
 * Testes unitários completos para o módulo de roteamento inteligente
 */

import {
  analyzeComplexity,
  routeToProvider,
  intelligentRoute,
  getNextFallback,
  FALLBACK_CHAIN,
} from "../intelligentRouter.js";

describe("Intelligent Router", () => {
  describe("analyzeComplexity", () => {
    test("should analyze simple short message correctly", () => {
      const result = analyzeComplexity("Olá, como vai?");

      expect(result.wordCount).toBe(3);
      expect(result.hasCode).toBe(false);
      expect(result.analysis.isVeryShort).toBe(true);
      expect(result.scores.simple).toBeGreaterThan(0);
    });

    test("should detect code blocks and increase complexity score", () => {
      const message =
        "Como implementar isso?\n```javascript\nfunction test() {}\n```";
      const result = analyzeComplexity(message);

      expect(result.hasCode).toBe(true);
      expect(result.scores.complexity).toBeGreaterThan(3);
      expect(result.lineCount).toBeGreaterThan(1);
    });

    test("should detect technical terms and long messages", () => {
      const message =
        "Preciso analisar a arquitetura do backend, configurar o endpoint da API REST e otimizar a query do database. Como implementar isso de forma escalável considerando microserviços?";
      const result = analyzeComplexity(message);

      expect(result.wordCount).toBeGreaterThan(20);
      expect(result.scores.complexity).toBeGreaterThan(5);
      expect(result.analysis.hasTechnicalTerms).toBe(true);

      const routing = routeToProvider(result);
      expect(routing.provider).toBe("gemini-pro");
    });
  });

  describe("routeToProvider", () => {
    test("should route messages with code to gemini-pro", () => {
      const analysis = {
        hasCode: true,
        scores: { complexity: 5, speed: 0, simple: 0 },
        analysis: {
          isVeryShort: false,
          isLong: false,
          hasTechnicalTerms: true,
        },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe("gemini-pro");
      expect(result.reason).toContain("código");
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test("should route simple short messages to gemini-flash", () => {
      const analysis = {
        hasCode: false,
        scores: { complexity: 0, speed: 0, simple: 2 },
        analysis: {
          isVeryShort: true,
          isLong: false,
          hasTechnicalTerms: false,
        },
      };

      const result = routeToProvider(analysis);

      expect(result.provider).toBe("gemini-flash");
      expect(result.reason).toContain("curta");
    });
  });

  describe("intelligentRoute", () => {
    test("should return complete routing with analysis and timestamp", () => {
      const message = "Preciso debugar esse código complexo";
      const result = intelligentRoute(message);

      expect(result).toHaveProperty("provider");
      expect(result).toHaveProperty("reason");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("analysis");
      expect(result).toHaveProperty("timestamp");
      expect(result.provider).toBe("gemini-pro"); // "debugar" + "complexo" = alta complexidade
    });
  });

  describe("getNextFallback", () => {
    test("should return correct fallback provider", () => {
      // gemini-pro falhou, próximo é gemini-flash
      expect(getNextFallback("gemini-pro", [])).toBe("gemini-flash");

      // gemini-pro falhou, gemini-flash já tentado, próximo é groq
      expect(getNextFallback("gemini-pro", ["gemini-flash"])).toBe("groq");

      // groq falhou, sem fallback
      expect(getNextFallback("groq", [])).toBeNull();

      // todos tentados
      expect(getNextFallback("gemini-pro", ["gemini-flash", "groq"])).toBeNull();
    });
  });
});
