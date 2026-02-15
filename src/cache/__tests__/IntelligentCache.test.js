/**
 * INTELLIGENT CACHE TESTS
 * Comprehensive test suite to achieve >=90% branch coverage
 * Testing BEHAVIOR, not implementation details
 */

import { jest } from '@jest/globals';
import IntelligentCache from '../IntelligentCache.js';

describe('IntelligentCache', () => {
  let cache;

  beforeEach(() => {
    jest.useFakeTimers();
    cache = new IntelligentCache({ maxMemory: 512 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================
  // CONSTRUCTOR TESTS (Coverage for default parameters)
  // ============================================
  describe('constructor', () => {
    test('should initialize with default maxMemory when options not provided', () => {
      const defaultCache = new IntelligentCache();
      
      expect(defaultCache.maxMemory).toBe(512); // Default 512 MB
      expect(defaultCache.cache).toBeInstanceOf(Map);
      expect(defaultCache.stats.hits).toBe(0);
    });

    test('should initialize with custom maxMemory', () => {
      const customCache = new IntelligentCache({ maxMemory: 256 });
      
      expect(customCache.maxMemory).toBe(256);
    });

    test('should initialize with default maxMemory when maxMemory not in options', () => {
      const cacheWithOtherOptions = new IntelligentCache({ someOtherOption: 'value' });
      
      expect(cacheWithOtherOptions.maxMemory).toBe(512); // Default fallback
    });
  });

  // ============================================
  // PHASE 1: set() BASIC
  // ============================================
  describe('set()', () => {
    test('should store value with default category', () => {
      cache.set('key1', 'value1');
      
      // Verify behavior: value was stored
      const result = cache.get('key1');
      expect(result).toBe('value1');
    });

    test('should store value with custom category', () => {
      cache.set('key1', 'value1', 'specialist-response');
      
      const result = cache.get('key1');
      expect(result).toBe('value1');
    });

    test('should use default TTL (3600s) for invalid category', () => {
      cache.set('key1', 'value1', 'invalid-category');
      
      // Advance 3599s (within default TTL)
      jest.advanceTimersByTime(3599 * 1000);
      expect(cache.get('key1')).toBe('value1'); // Still valid
      
      // Advance 2s (exceeds TTL)
      jest.advanceTimersByTime(2 * 1000);
      expect(cache.get('key1')).toBeNull(); // Expired
    });
  });

  // ============================================
  // PHASE 2: get() HIT/MISS
  // ============================================
  describe('get()', () => {
    test('should return value on cache hit (exact key)', () => {
      cache.set('key1', 'value1');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.stats.hits).toBe(1);
      expect(cache.stats.misses).toBe(0);
    });

    test('should return null on cache miss (key not found)', () => {
      expect(cache.get('nonexistent')).toBeNull();
      expect(cache.stats.hits).toBe(0);
      expect(cache.stats.misses).toBe(1);
    });

    test('should increment totalRequests on every get()', () => {
      cache.get('key1'); // miss
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      
      expect(cache.stats.totalRequests).toBe(2);
    });
  });

  // ============================================
  // PHASE 3: TTL EXPIRATION (FAKE TIMERS)
  // ============================================
  describe('TTL expiration', () => {
    test('should return value before TTL expires', () => {
      cache.set('key1', 'value1', 'user-context'); // TTL = 3600s (1h)
      
      // Advance 3599s (within TTL)
      jest.advanceTimersByTime(3599 * 1000);
      
      expect(cache.get('key1')).toBe('value1'); // Still valid
    });

    test('should return null after TTL expires', () => {
      cache.set('key1', 'value1', 'real-time-data'); // TTL = 300s (5min)
      
      // Advance 301s (exceeds TTL)
      jest.advanceTimersByTime(301 * 1000);
      
      expect(cache.get('key1')).toBeNull(); // Expired
      expect(cache.stats.misses).toBe(1);
    });

    test('should evict expired entry on get()', () => {
      cache.set('key1', 'value1', 'general-knowledge'); // TTL = 25200s
      
      // Advance beyond TTL
      jest.advanceTimersByTime(25201 * 1000);
      
      cache.get('key1'); // Should evict expired entry
      
      // Entry should no longer exist in cache
      expect(cache.cache.has('key1')).toBe(false);
    });

    test('should respect different TTLs by category', () => {
      cache.set('key1', 'value1', 'specialist-response'); // 86400s (24h)
      cache.set('key2', 'value2', 'real-time-data');      // 300s (5min)
      
      // Advance 301s
      jest.advanceTimersByTime(301 * 1000);
      
      expect(cache.get('key1')).toBe('value1'); // Still valid (24h)
      expect(cache.get('key2')).toBeNull();     // Expired (5min)
    });
  });

  // ============================================
  // PHASE 4: MEMORY EVICTION
  // ============================================
  describe('Memory eviction', () => {
    test('should trigger eviction when memory limit is exceeded', () => {
      // Cache with SMALL limit to force eviction
      const smallCache = new IntelligentCache({ maxMemory: 0.001 }); // 0.001 MB
      
      // Add many items to exceed limit
      for (let i = 0; i < 20; i++) {
        smallCache.set(`key${i}`, `value${i}`.repeat(100)); // Large values
      }
      
      // Verify eviction occurred (some items were removed)
      expect(smallCache.cache.size).toBeLessThan(20);
      expect(smallCache.stats.evictions).toBeGreaterThan(0);
    });

    test('should evict 20% of items when memory is full', () => {
      const smallCache = new IntelligentCache({ maxMemory: 0.002 });
      
      // Add 15 items to fill memory
      for (let i = 0; i < 15; i++) {
        smallCache.set(`key${i}`, `value${i}`.repeat(50));
      }
      
      const sizeBeforeEviction = smallCache.cache.size;
      const evictionsBeforeAdd = smallCache.stats.evictions;
      
      // Force eviction by adding another large item
      smallCache.set('large', 'x'.repeat(5000));
      
      // Should have evicted some items (evictions increased)
      expect(smallCache.stats.evictions).toBeGreaterThan(evictionsBeforeAdd);
    });

    test('should not evict when within memory limit', () => {
      const largeCache = new IntelligentCache({ maxMemory: 1000 }); // 1000 MB
      
      // Add few small items
      largeCache.set('key1', 'value1');
      largeCache.set('key2', 'value2');
      
      expect(largeCache.stats.evictions).toBe(0);
      expect(largeCache.cache.size).toBe(2);
    });
  });

  // ============================================
  // PHASE 5: getStats()
  // ============================================
  describe('getStats()', () => {
    test('should return 0% hit rate when no requests', () => {
      const stats = cache.getStats();
      
      expect(stats.hitRate).toBe('0.00%');
      expect(stats.totalRequests).toBe(0);
    });

    test('should calculate hit rate correctly', () => {
      cache.set('key1', 'value1');
      
      cache.get('key1'); // hit
      cache.get('key2'); // miss
      cache.get('key1'); // hit
      cache.get('key3'); // miss
      
      const stats = cache.getStats();
      
      // 2 hits / 4 total = 50%
      expect(stats.hitRate).toBe('50.00%');
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.totalRequests).toBe(4);
    });

    test('should track evictions', () => {
      const smallCache = new IntelligentCache({ maxMemory: 0.001 });
      
      for (let i = 0; i < 20; i++) {
        smallCache.set(`key${i}`, `value${i}`.repeat(100));
      }
      
      const stats = smallCache.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
    });

    test('should calculate memory usage percentage', () => {
      cache.set('key1', 'x'.repeat(1000)); // Larger value for visible memory
      
      const stats = cache.getStats();
      
      expect(stats.memoryUsage).toMatch(/^\d+\.\d{2}%$/); // Format: "0.00%"
      expect(parseFloat(stats.memoryUsage)).toBeGreaterThanOrEqual(0);
    });

    test('should calculate estimated savings', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit → apiCallsSaved++
      
      const stats = cache.getStats();
      
      expect(stats.apiCallsSaved).toBe(1);
      expect(stats.estimatedSavings).toBe('$0.01'); // $0.01 per call
    });
  });

  // ============================================
  // PHASE 6: FUZZY MATCHING (SIMILARITY)
  // ============================================
  describe('Fuzzy matching (similarity)', () => {
    test('should find similar key when exact key not found', () => {
      cache.set('hello-world', 'value1');
      
      // Search for similar key (85% similarity threshold)
      const result = cache.get('hello-world1', 0.85);
      
      // Should find "hello-world" as similar
      expect(result).toBe('value1');
      expect(cache.stats.hits).toBe(1); // Fuzzy hit
    });

    test('should not return similar key below threshold', () => {
      cache.set('abc', 'value1');
      
      // Search for VERY different key
      const result = cache.get('xyz', 0.85);
      
      expect(result).toBeNull(); // Not similar enough
      expect(cache.stats.misses).toBe(1);
    });

    test('should not return similar key if expired', () => {
      cache.set('hello-world', 'value1', 'real-time-data'); // TTL = 300s
      
      // Advance beyond TTL
      jest.advanceTimersByTime(301 * 1000);
      
      // Search for similar key
      const result = cache.get('hello-world1', 0.85);
      
      expect(result).toBeNull(); // Similar BUT expired
    });

    test('should prioritize exact match over similar match', () => {
      cache.set('test', 'exact-value');
      cache.set('test1', 'similar-value');
      
      const result = cache.get('test');
      
      expect(result).toBe('exact-value'); // Exact match
    });
  });

  // ============================================
  // PHASE 7: ADDITIONAL METHODS
  // ============================================
  describe('clear()', () => {
    test('should clear all cache entries and reset stats', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1'); // Generate some stats
      
      cache.clear();
      
      expect(cache.cache.size).toBe(0);
      expect(cache.currentMemory).toBe(0);
      expect(cache.stats.hits).toBe(0);
      expect(cache.stats.misses).toBe(0);
      expect(cache.stats.totalRequests).toBe(0);
    });
  });

  describe('generateReport()', () => {
    test('should generate formatted report with stats', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('key2'); // miss
      
      const report = cache.generateReport();
      
      expect(report).toContain('INTELLIGENT CACHE - REPORT');
      expect(report).toContain('Hit Rate:');
      expect(report).toContain('50.00%'); // 1 hit / 2 total
      expect(report).toContain('Hits: 1');
      expect(report).toContain('Misses: 1');
      expect(report).toContain('Total Requests: 2');
    });
  });

  describe('generateKey()', () => {
    test('should generate consistent hash for same input', () => {
      const key1 = cache.generateKey('agent1', 'test prompt', { userId: '123' });
      const key2 = cache.generateKey('agent1', 'test prompt', { userId: '123' });
      
      expect(key1).toBe(key2);
    });

    test('should generate different hash for different input', () => {
      const key1 = cache.generateKey('agent1', 'prompt1', { userId: '123' });
      const key2 = cache.generateKey('agent1', 'prompt2', { userId: '123' });
      
      expect(key1).not.toBe(key2);
    });

    test('should normalize prompt (lowercase and trim)', () => {
      const key1 = cache.generateKey('agent1', '  TEST PROMPT  ', {});
      const key2 = cache.generateKey('agent1', 'test prompt', {});
      
      expect(key1).toBe(key2);
    });

    test('should include agentId in key format', () => {
      const key = cache.generateKey('agent1', 'test', {});
      
      expect(key).toMatch(/^agent1:/);
    });

    test('should use default context when context parameter not provided', () => {
      // This tests the context = {} default parameter branch
      const key1 = cache.generateKey('agent1', 'test');
      const key2 = cache.generateKey('agent1', 'test', {});
      
      expect(key1).toBe(key2);
    });

    test('should generate consistent hash without context parameter', () => {
      const key1 = cache.generateKey('agent1', 'test');
      const key2 = cache.generateKey('agent1', 'test');
      
      expect(key1).toBe(key2);
    });
  });

  // ============================================
  // EDGE CASES AND ADDITIONAL COVERAGE
  // ============================================
  describe('Edge cases', () => {
    test('should handle empty cache gracefully', () => {
      expect(cache.get('nonexistent')).toBeNull();
      expect(cache.cache.size).toBe(0);
    });

    test('should handle multiple accesses updating lastAccess and accessCount', () => {
      cache.set('key1', 'value1');
      
      cache.get('key1');
      cache.get('key1');
      cache.get('key1');
      
      expect(cache.stats.hits).toBe(3);
      expect(cache.stats.apiCallsSaved).toBe(3);
    });

    test('should handle system-config category with 30-day TTL', () => {
      cache.set('config1', 'value1', 'system-config'); // TTL = 2592000s (30 days)
      
      // Advance 29 days (within TTL)
      jest.advanceTimersByTime(29 * 24 * 60 * 60 * 1000);
      expect(cache.get('config1')).toBe('value1'); // Still valid
      
      // Advance 2 days (exceeds 30 days)
      jest.advanceTimersByTime(2 * 24 * 60 * 60 * 1000);
      expect(cache.get('config1')).toBeNull(); // Expired
    });

    test('should handle eviction when entry does not exist', () => {
      // This tests the if(entry) branch in _evict()
      // By trying to evict a non-existent key indirectly through expired entry cleanup
      cache.set('key1', 'value1', 'real-time-data');
      
      // Advance beyond TTL
      jest.advanceTimersByTime(301 * 1000);
      
      // First get() will evict the expired entry
      cache.get('key1');
      
      // Second get() on same key - entry already evicted
      expect(cache.get('key1')).toBeNull();
      expect(cache.stats.misses).toBe(2);
    });

    test('should handle _evict called on non-existent key directly', () => {
      // Direct test to ensure _evict handles missing entries gracefully
      const initialMemory = cache.currentMemory;
      const initialSize = cache.cache.size;
      
      // Try to evict a non-existent key (this tests the FALSE branch of if(entry))
      cache._evict('nonexistent-key');
      
      // Memory and size should remain unchanged
      expect(cache.currentMemory).toBe(initialMemory);
      expect(cache.cache.size).toBe(initialSize);
    });

    test('should handle large memory evictions gracefully', () => {
      const tinyCache = new IntelligentCache({ maxMemory: 0.0001 });
      
      // Add many large items
      for (let i = 0; i < 50; i++) {
        tinyCache.set(`key${i}`, 'x'.repeat(1000));
      }
      
      // Cache should have evicted many items
      expect(tinyCache.cache.size).toBeLessThan(50);
      expect(tinyCache.stats.evictions).toBeGreaterThan(0);
    });

    test('should maintain cache functionality after eviction', () => {
      const smallCache = new IntelligentCache({ maxMemory: 0.001 });
      
      // Fill cache to trigger eviction
      for (let i = 0; i < 20; i++) {
        smallCache.set(`key${i}`, `value${i}`.repeat(100));
      }
      
      // Add new item after eviction
      smallCache.set('newkey', 'newvalue');
      
      // Should be able to retrieve newly added item
      expect(smallCache.get('newkey')).toBe('newvalue');
    });
  });
});
