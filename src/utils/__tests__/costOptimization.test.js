/**
 * COST OPTIMIZATION TESTS
 * Testes unitários completos para o módulo de otimização de custos
 */

import {
  responseCache,
  ResponseCache,
  compressPrompt,
  deduplicateMessages,
  estimateTokens,
  limitContext,
} from "../costOptimization.js";

describe("Cost Optimization Utils", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    responseCache.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("ResponseCache", () => {
    test("should generate consistent MD5 hash for same messages", () => {
      const cache = new ResponseCache();
      const messages = [{ role: "user", content: "Hello" }];

      const hash1 = cache.generateHash(messages);
      const hash2 = cache.generateHash(messages);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(32); // MD5 hash length
    });

    test("should cache and retrieve responses correctly", () => {
      const cache = new ResponseCache();
      const messages = [{ role: "user", content: "Test" }];
      const response = { text: "Response" };

      // Cache miss initially
      expect(cache.get(messages)).toBeNull();

      // Set cache
      cache.set(messages, response);

      // Cache hit
      expect(cache.get(messages)).toEqual(response);
    });

    test("should expire cached items after TTL", () => {
      const cache = new ResponseCache(1000, 100); // 100ms TTL
      const messages = [{ role: "user", content: "Test" }];
      const response = { text: "Response" };

      cache.set(messages, response);

      // Should exist initially
      expect(cache.get(messages)).toEqual(response);

      // Wait for TTL to expire
      jest.advanceTimersByTime(150);

      // Should be expired
      expect(cache.get(messages)).toBeNull();
    });

    test("should evict oldest item when maxSize is reached", () => {
      const cache = new ResponseCache(2); // Max 2 items

      const msg1 = [{ role: "user", content: "First" }];
      const msg2 = [{ role: "user", content: "Second" }];
      const msg3 = [{ role: "user", content: "Third" }];

      cache.set(msg1, { text: "Response 1" });
      cache.set(msg2, { text: "Response 2" });
      cache.set(msg3, { text: "Response 3" });

      // First should be evicted
      expect(cache.get(msg1)).toBeNull();
      expect(cache.get(msg2)).not.toBeNull();
      expect(cache.get(msg3)).not.toBeNull();
    });

    test("should return cache statistics", () => {
      const cache = new ResponseCache(100, 5000);
      const messages = [{ role: "user", content: "Test" }];
      const response = { text: "Response" };

      cache.set(messages, response);

      const stats = cache.stats();

      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(100);
      expect(stats.ttl).toBe(5000);
    });
  });

  describe("Utility Functions", () => {
    test("should compress prompts by removing extra whitespace", () => {
      const prompt = "  Hello    world  \n\n\n  How are you?  ";
      const compressed = compressPrompt(prompt);

      expect(compressed).toBe("Hello world How are you?");
      expect(compressed.length).toBeLessThan(prompt.length);
    });

    test("should remove consecutive duplicate messages", () => {
      const messages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi" },
        { role: "user", content: "Hello" },
        { role: "user", content: "Hello" },
        { role: "user", content: "How are you?" },
      ];

      const deduplicated = deduplicateMessages(messages);

      expect(deduplicated).toHaveLength(4);
      expect(deduplicated[2].content).toBe("Hello");
      expect(deduplicated[3].content).toBe("How are you?");
    });

    test("should estimate tokens correctly", () => {
      expect(estimateTokens("test")).toBe(1); // 4 chars = 1 token
      expect(estimateTokens("Hello world")).toBe(3); // 11 chars = 3 tokens
      expect(estimateTokens("a")).toBe(1); // Should round up
      expect(estimateTokens("")).toBe(0);
    });

    test("should limit context to max tokens", () => {
      const messages = [
        { role: "user", content: "a".repeat(100) }, // 25 tokens
        { role: "assistant", content: "b".repeat(100) }, // 25 tokens
        { role: "user", content: "c".repeat(100) }, // 25 tokens
        { role: "assistant", content: "d".repeat(100) }, // 25 tokens
      ];

      const limited = limitContext(messages, 60);

      // Should keep only the most recent messages that fit within 60 tokens
      expect(limited.length).toBeLessThan(messages.length);
      // The last message should be from the original last messages
      expect(limited[limited.length - 1].content).toBe("d".repeat(100));
    });
  });
});
