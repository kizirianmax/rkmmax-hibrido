/**
 * INTELLIGENT ROUTER TESTS
 * Testes unitários para o sistema de roteamento inteligente
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
    test("should analyze simple short message", () => {
      const result = analyzeComplexity("Olá, como vai?");

      expect(result.wordCount).toBe(3);
      expect(result.hasCode).toBe(false);
      expect(result.analysis.isVeryShort).toBe(true);
    });

    test("should detect code in message", () => {
      const result = analyzeComplexity(
        "```javascript\nfunction test() { return true; }\n```"
      );

      expect(result.hasCode).toBe(true);
      expect(result.scores.complexity).toBeGreaterThan(0);
    });

    test("should analyze complex technical message", () => {
      const result = analyzeComplexity(
        "Preciso analisar a arquitetura do banco de dados e otimizar as queries SQL para melhorar a performance"
      );

      expect(result.scores.complexity).toBeGreaterThan(5);
      expect(result.analysis.hasTechnicalTerms).toBe(true);
    });

    test("should detect multiple questions", () => {
      const result = analyzeComplexity("Como? Quando? Por quê? Onde?");

      expect(result.analysis.hasMultipleQuestions).toBe(true);
    });
  });

  describe("routeToProvider", () => {
    test("should route code to llama-70b", () => {
      const analysis = analyzeComplexity(
        "```function test() { return true; }```"
      );
      const result = routeToProvider(analysis);

      expect(result.provider).toBe("llama-70b");
      expect(result.reason).toContain("código");
      expect(result.confidence).toBe(0.95);
    });

    test("should route high complexity to llama-70b", () => {
      const analysis = analyzeComplexity(
        "Preciso analisar a arquitetura do sistema, debugar problemas de performance e implementar uma solução escalável"
      );
      const result = routeToProvider(analysis);

      expect(result.provider).toBe("llama-70b");
      expect(result.reason).toContain("complexidade");
    });

    test("should route short messages to llama-8b", () => {
      const analysis = analyzeComplexity("Olá!");
      const result = routeToProvider(analysis);

      expect(result.provider).toBe("llama-8b");
      expect(result.reason).toContain("curta");
      expect(result.confidence).toBe(0.8);
    });

    test("should route standard messages to llama-8b", () => {
      const analysis = analyzeComplexity("Como faço para criar um array?");
      const result = routeToProvider(analysis);

      expect(result.provider).toBe("llama-8b");
      expect(result.reason).toContain("curta");
    });

    test("should route long technical messages to llama-70b", () => {
      const longTechnicalMessage =
        "Eu preciso criar uma API REST completa com endpoints para gerenciar usuários, autenticação JWT e integração com banco de dados PostgreSQL. " +
        "Quero também implementar validação de dados, tratamento de erros e logging adequado. Como devo estruturar este projeto?";

      const analysis = analyzeComplexity(longTechnicalMessage);
      const result = routeToProvider(analysis);

      expect(result.provider).toBe("llama-70b");
    });

    test("should route multiple complex questions to llama-70b", () => {
      const analysis = analyzeComplexity(
        "Como implementar autenticação? Qual a melhor arquitetura? Como debugar? Como otimizar?"
      );
      const result = routeToProvider(analysis);

      expect(result.provider).toBe("llama-70b");
      expect(result.reason).toContain("complexidade");
    });
  });

  describe("intelligentRoute", () => {
    test("should return complete routing information for simple message", () => {
      const result = intelligentRoute("Olá, como vai?");

      expect(result).toHaveProperty("provider");
      expect(result).toHaveProperty("reason");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("analysis");
      expect(result).toHaveProperty("timestamp");
      expect(result.provider).toBe("llama-8b");
    });

    test("should return complete routing information for code message", () => {
      const result = intelligentRoute(
        "```function test() { return true; }```"
      );

      expect(result.provider).toBe("llama-70b");
      expect(result.analysis.hasCode).toBe(true);
    });

    test("should return complete routing information for complex message", () => {
      const result = intelligentRoute(
        "Preciso analisar a arquitetura do banco de dados e otimizar as queries SQL..."
      );

      expect(result.provider).toBe("llama-70b");
    });
  });

  describe("FALLBACK_CHAIN", () => {
    test("should have correct fallback chain for llama-70b", () => {
      expect(FALLBACK_CHAIN["llama-70b"]).toEqual([
        "llama-8b",
        "groq-fallback",
      ]);
    });

    test("should have correct fallback chain for llama-8b", () => {
      expect(FALLBACK_CHAIN["llama-8b"]).toEqual(["groq-fallback"]);
    });

    test("should have no fallback for groq-fallback", () => {
      expect(FALLBACK_CHAIN["groq-fallback"]).toEqual([]);
    });

    test("should have 3-level fallback system", () => {
      expect(Object.keys(FALLBACK_CHAIN)).toHaveLength(3);
    });
  });

  describe("getNextFallback", () => {
    test("should return llama-8b when llama-70b fails", () => {
      const result = getNextFallback("llama-70b", []);

      expect(result).toBe("llama-8b");
    });

    test("should return groq-fallback when llama-8b fails", () => {
      const result = getNextFallback("llama-8b", []);

      expect(result).toBe("groq-fallback");
    });

    test("should skip already tried providers", () => {
      const result = getNextFallback("llama-70b", ["llama-8b"]);

      expect(result).toBe("groq-fallback");
    });

    test("should return null when all providers tried", () => {
      const result = getNextFallback("llama-8b", ["groq-fallback"]);

      expect(result).toBeNull();
    });

    test("should return null for groq-fallback", () => {
      const result = getNextFallback("groq-fallback", []);

      expect(result).toBeNull();
    });

    test("should handle 3-level fallback chain", () => {
      // Level 1: llama-70b fails, try llama-8b
      const fallback1 = getNextFallback("llama-70b", []);
      expect(fallback1).toBe("llama-8b");

      // Level 2: llama-8b fails, try groq-fallback
      const fallback2 = getNextFallback("llama-8b", ["llama-70b"]);
      expect(fallback2).toBe("groq-fallback");

      // Level 3: groq-fallback has no fallback
      const fallback3 = getNextFallback("groq-fallback", [
        "llama-70b",
        "llama-8b",
      ]);
      expect(fallback3).toBeNull();
    });
  });

  describe("Expected Results from Problem Statement", () => {
    test("Test 1: Simple greeting should route to llama-8b", () => {
      const result = intelligentRoute("Olá, como vai?");

      expect(result.provider).toBe("llama-8b");
      expect(result.reason).toContain("curta");
    });

    test("Test 2: Code should route to llama-70b", () => {
      const result = intelligentRoute("```function test() { return true; }```");

      expect(result.provider).toBe("llama-70b");
      expect(result.reason).toContain("código");
    });

    test("Test 3: Complex message should route to llama-70b", () => {
      const result = intelligentRoute(
        "Preciso analisar a arquitetura do banco de dados e otimizar as queries SQL..."
      );

      expect(result.provider).toBe("llama-70b");
      expect(result.reason).toContain("complexidade");
    });

    test("Test 4: Fallback from llama-70b should return llama-8b", () => {
      const result = getNextFallback("llama-70b", []);

      expect(result).toBe("llama-8b");
    });

    test("Test 5: Fallback from llama-8b (with llama-70b tried) should return groq-fallback", () => {
      const result = getNextFallback("llama-8b", ["llama-70b"]);

      expect(result).toBe("groq-fallback");
    });
  });
});
