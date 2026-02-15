/**
 * COST OPTIMIZATION TESTS
 * Testes unitários completos para o módulo de otimização de custos
 */

import { jest } from '@jest/globals';
import {
  responseCache,
  ResponseCache,
  compressPrompt,
  deduplicateMessages,
  estimateTokens,
  limitContext,
  requestBatcher,
  RequestBatcher,
  optimizeRequest,
  cacheResponse,
  getCostStats,
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

  describe("RequestBatcher", () => {
    let batcher;

    beforeEach(() => {
      batcher = new RequestBatcher();
    });

    describe("Constructor and Initial State", () => {
      test("should initialize with correct default values", () => {
        const batcher = new RequestBatcher();

        expect(batcher.queue).toEqual([]);
        expect(batcher.timer).toBeNull();
        expect(batcher.batchSize).toBe(5);
        expect(batcher.batchDelay).toBe(100);
      });

      test("should accept custom config", () => {
        const batcher = new RequestBatcher(10, 200);

        expect(batcher.batchSize).toBe(10);
        expect(batcher.batchDelay).toBe(200);
      });
    });

    describe("add() Method", () => {
      test("should add request to queue", () => {
        const request = jest.fn(() => Promise.resolve("result"));

        batcher.add(request);

        expect(batcher.queue.length).toBe(1);
        expect(batcher.queue[0].request).toBe(request);
      });

      test("should trigger processing when batch is full", async () => {
        const batcher = new RequestBatcher(2, 100);
        const spy = jest.spyOn(batcher, "flush");

        const request1 = jest.fn(() => Promise.resolve("result1"));
        const request2 = jest.fn(() => Promise.resolve("result2"));

        batcher.add(request1);
        batcher.add(request2);

        expect(spy).toHaveBeenCalled();
      });

      test("should return a promise that resolves", async () => {
        const batcher = new RequestBatcher(1, 100);
        const request = jest.fn(() => Promise.resolve("test-result"));

        const promise = batcher.add(request);

        await expect(promise).resolves.toBe("test-result");
      });

      test("should schedule processing with delay when batch not full", () => {
        const batcher = new RequestBatcher(5, 100);
        const request = jest.fn(() => Promise.resolve("result"));

        batcher.add(request);

        expect(batcher.timer).not.toBeNull();
      });

      test("should clear previous timer when adding new request", () => {
        const batcher = new RequestBatcher(5, 100);
        const request1 = jest.fn(() => Promise.resolve("result1"));
        const request2 = jest.fn(() => Promise.resolve("result2"));

        batcher.add(request1);
        const firstTimer = batcher.timer;

        batcher.add(request2);
        const secondTimer = batcher.timer;

        expect(secondTimer).not.toBe(firstTimer);
      });
    });

    describe("flush() Method", () => {
      test("should process batch correctly", async () => {
        const batcher = new RequestBatcher(2, 100);

        const request1 = jest.fn(() => Promise.resolve("result1"));
        const request2 = jest.fn(() => Promise.resolve("result2"));

        const promise1 = batcher.add(request1);
        const promise2 = batcher.add(request2);

        const results = await Promise.all([promise1, promise2]);

        expect(request1).toHaveBeenCalled();
        expect(request2).toHaveBeenCalled();
        expect(results).toEqual(["result1", "result2"]);
      });

      test("should handle empty queue gracefully", async () => {
        const batcher = new RequestBatcher();

        await expect(batcher.flush()).resolves.toBeUndefined();
      });

      test("should resolve promises with correct results", async () => {
        const batcher = new RequestBatcher(2, 100);

        const request1 = jest.fn(() => Promise.resolve("result1"));
        const request2 = jest.fn(() => Promise.resolve("result2"));

        const promise1 = batcher.add(request1);
        const promise2 = batcher.add(request2);

        const results = await Promise.all([promise1, promise2]);

        expect(results).toEqual(["result1", "result2"]);
      });

      test("should reject promises on request failure", async () => {
        const batcher = new RequestBatcher(2, 100);

        const request1 = jest.fn(() => Promise.resolve("result1"));
        const request2 = jest.fn(() => Promise.reject(new Error("Failed")));

        const promise1 = batcher.add(request1);
        const promise2 = batcher.add(request2);

        await expect(promise1).resolves.toBe("result1");
        await expect(promise2).rejects.toThrow("Failed");
      });

      test("should handle batch delay correctly", async () => {
        const batcher = new RequestBatcher(5, 50);
        const request = jest.fn(() => Promise.resolve("test"));

        const promise = batcher.add(request);

        // Advance timers to trigger the batch delay
        jest.advanceTimersByTime(50);
        
        await promise;

        expect(request).toHaveBeenCalled();
      });

      test("should handle multiple concurrent adds", async () => {
        const batcher = new RequestBatcher(3, 100);

        const request1 = jest.fn(() => Promise.resolve("msg1"));
        const request2 = jest.fn(() => Promise.resolve("msg2"));
        const request3 = jest.fn(() => Promise.resolve("msg3"));

        const promises = [
          batcher.add(request1),
          batcher.add(request2),
          batcher.add(request3),
        ];

        const results = await Promise.all(promises);

        expect(results).toHaveLength(3);
        expect(results).toEqual(["msg1", "msg2", "msg3"]);
      });

      test("should process only batchSize items per flush", async () => {
        const batcher = new RequestBatcher(2, 100);

        const request1 = jest.fn(() => Promise.resolve("result1"));
        const request2 = jest.fn(() => Promise.resolve("result2"));
        const request3 = jest.fn(() => Promise.resolve("result3"));

        batcher.add(request1);
        batcher.add(request2);
        batcher.add(request3);

        // First flush should process 2 items
        expect(batcher.queue.length).toBe(1);
      });
    });
  });

  describe("optimizeRequest", () => {
    beforeEach(() => {
      responseCache.clear();
    });

    test("should return cached response when available", () => {
      const messages = [{ role: "user", content: "Hello" }];
      const cachedResponse = { text: "Cached response" };

      responseCache.set(messages, cachedResponse);

      const result = optimizeRequest(messages, "System prompt");

      expect(result.cached).toBe(true);
      expect(result.response).toEqual(cachedResponse);
    });

    test("should deduplicate and optimize messages", () => {
      const messages = [
        { role: "user", content: "  Hello    world  " },
        { role: "assistant", content: "Response 1" },
        { role: "assistant", content: "Response 1" }, // Duplicate
        { role: "user", content: "Another message" },
      ];
      const systemPrompt = "  System    prompt  ";

      const result = optimizeRequest(messages, systemPrompt);

      expect(result.cached).toBe(false);
      expect(result.systemPrompt).toBe("System prompt");
      expect(result.messages.length).toBeLessThan(messages.length);
    });

    test("should limit context to maxTokens", () => {
      const messages = [
        { role: "user", content: "a".repeat(2000) }, // ~500 tokens
        { role: "assistant", content: "b".repeat(2000) },
        { role: "user", content: "c".repeat(2000) },
        { role: "assistant", content: "d".repeat(2000) },
      ];

      const result = optimizeRequest(messages, "Test");

      const totalTokens = result.messages.reduce(
        (sum, msg) => sum + estimateTokens(msg.content),
        0
      );

      expect(totalTokens).toBeLessThanOrEqual(4000); // Default maxTokens
    });

    test("should calculate correct stats", () => {
      const messages = [
        { role: "user", content: "Test message 1" },
        { role: "assistant", content: "Response" },
        { role: "user", content: "Test message 2" },
      ];

      const result = optimizeRequest(messages, "System");

      expect(result.stats).toBeDefined();
      expect(result.stats.originalMessages).toBe(3);
      expect(result.stats.optimizedMessages).toBeDefined();
      expect(result.stats.totalTokens).toBeGreaterThan(0);
      expect(result.stats.estimatedCost).toBeGreaterThan(0);
    });

    test("should handle empty messages array", () => {
      const result = optimizeRequest([], "System prompt");

      expect(result.cached).toBe(false);
      expect(result.messages).toEqual([]);
      expect(result.stats.originalMessages).toBe(0);
      expect(result.stats.optimizedMessages).toBe(0);
    });

    test("should handle single message", () => {
      const messages = [{ role: "user", content: "Single message" }];

      const result = optimizeRequest(messages, "System");

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toBe("Single message");
    });

    test("should preserve message roles", () => {
      const messages = [
        { role: "system", content: "System message" },
        { role: "user", content: "User message" },
        { role: "assistant", content: "AI response" },
      ];

      const result = optimizeRequest(messages, "System");

      expect(result.messages[0].role).toBe("system");
      expect(result.messages[1].role).toBe("user");
      expect(result.messages[2].role).toBe("assistant");
    });

    test("should return optimization metadata", () => {
      const messages = [{ role: "user", content: "test message" }];

      const result = optimizeRequest(messages, "System");

      expect(result).toHaveProperty("cached");
      expect(result).toHaveProperty("messages");
      expect(result).toHaveProperty("systemPrompt");
      expect(result).toHaveProperty("stats");
      expect(result.stats).toHaveProperty("originalMessages");
      expect(result.stats).toHaveProperty("optimizedMessages");
      expect(result.stats).toHaveProperty("totalTokens");
      expect(result.stats).toHaveProperty("estimatedCost");
    });
  });

  describe("cacheResponse", () => {
    test("should cache response correctly", () => {
      const messages = [{ role: "user", content: "Test" }];
      const response = { text: "Response" };

      cacheResponse(messages, response);

      expect(responseCache.get(messages)).toEqual(response);
    });
  });

  describe("getCostStats", () => {
    test("should return cache statistics", () => {
      const stats = getCostStats();

      expect(stats).toHaveProperty("cache");
      expect(stats.cache).toHaveProperty("size");
      expect(stats.cache).toHaveProperty("maxSize");
      expect(stats.cache).toHaveProperty("ttl");
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty array in deduplicateMessages", () => {
      const result = deduplicateMessages([]);
      expect(result).toEqual([]);
    });

    test("should handle empty string in compressPrompt", () => {
      const result = compressPrompt("");
      expect(result).toBe("");
    });

    test("should handle negative maxTokens in limitContext", () => {
      const messages = [{ role: "user", content: "test" }];
      const result = limitContext(messages, -100);
      expect(result).toEqual([]);
    });

    test("should handle zero maxTokens in limitContext", () => {
      const messages = [{ role: "user", content: "test" }];
      const result = limitContext(messages, 0);
      expect(result).toEqual([]);
    });
  });
});
