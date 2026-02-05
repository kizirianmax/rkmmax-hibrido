/**
 * Tests for Smart Cache functionality
 */

import { SmartCache } from '../lib/cache.js';

describe('SmartCache', () => {
  let cache;

  beforeEach(() => {
    cache = new SmartCache(10, 1000); // Max 10 items, 1s TTL
  });

  afterEach(() => {
    cache.clear();
  });

  test('should store and retrieve cached values', () => {
    const messages = [{ role: 'user', content: 'test message' }];
    const value = { response: 'cached response' };
    
    cache.set(messages, value);
    const retrieved = cache.get(messages);
    
    expect(retrieved).toEqual(value);
    expect(cache.hits).toBe(1);
    expect(cache.misses).toBe(0);
  });

  test('should return null for cache miss', () => {
    const messages = [{ role: 'user', content: 'not cached' }];
    const retrieved = cache.get(messages);
    
    expect(retrieved).toBeNull();
    expect(cache.misses).toBe(1);
  });

  test('should expire old entries', async () => {
    const messages = [{ role: 'user', content: 'expire test' }];
    const value = { response: 'will expire' };
    
    cache.set(messages, value);
    
    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const retrieved = cache.get(messages);
    expect(retrieved).toBeNull();
  });

  test('should evict oldest entry when max size reached', () => {
    // Fill cache to max
    for (let i = 0; i < 10; i++) {
      cache.set([{ role: 'user', content: `message ${i}` }], { response: `response ${i}` });
    }
    
    expect(cache.cache.size).toBe(10);
    
    // Add one more - should evict oldest
    cache.set([{ role: 'user', content: 'message 10' }], { response: 'response 10' });
    expect(cache.cache.size).toBe(10);
    
    // First entry should be evicted
    const firstEntry = cache.get([{ role: 'user', content: 'message 0' }]);
    expect(firstEntry).toBeNull();
  });

  test('should calculate hit rate correctly', () => {
    const messages1 = [{ role: 'user', content: 'test 1' }];
    const messages2 = [{ role: 'user', content: 'test 2' }];
    
    cache.set(messages1, { response: 'response 1' });
    
    // 1 hit
    cache.get(messages1);
    // 1 miss
    cache.get(messages2);
    
    expect(cache.getHitRate()).toBe('50.00');
  });

  test('should provide accurate stats', () => {
    const messages = [{ role: 'user', content: 'stats test' }];
    cache.set(messages, { response: 'test' });
    cache.get(messages); // hit
    cache.get([{ role: 'user', content: 'not found' }]); // miss
    
    const stats = cache.getStats();
    
    expect(stats.size).toBe(1);
    expect(stats.maxSize).toBe(10);
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe('50.00');
    expect(stats.totalRequests).toBe(2);
  });

  test('should generate consistent keys for same messages', () => {
    const messages = [{ role: 'user', content: 'consistency test' }];
    
    const key1 = cache.generateKey(messages);
    const key2 = cache.generateKey(messages);
    
    expect(key1).toBe(key2);
  });

  test('should generate different keys for different messages', () => {
    const messages1 = [{ role: 'user', content: 'message 1' }];
    const messages2 = [{ role: 'user', content: 'message 2' }];
    
    const key1 = cache.generateKey(messages1);
    const key2 = cache.generateKey(messages2);
    
    expect(key1).not.toBe(key2);
  });

  test('should clear all cache', () => {
    for (let i = 0; i < 5; i++) {
      cache.set([{ role: 'user', content: `message ${i}` }], { response: `response ${i}` });
    }
    
    expect(cache.cache.size).toBe(5);
    
    cache.clear();
    
    expect(cache.cache.size).toBe(0);
    expect(cache.hits).toBe(0);
    expect(cache.misses).toBe(0);
  });

  test('should cleanup expired entries', async () => {
    const messages1 = [{ role: 'user', content: 'will expire' }];
    const messages2 = [{ role: 'user', content: 'still valid' }];
    
    // Create cache with short TTL for testing
    const shortCache = new SmartCache(10, 500);
    
    shortCache.set(messages1, { response: 'expires soon' });
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 600));
    
    shortCache.set(messages2, { response: 'fresh entry' });
    
    // Cleanup
    shortCache.cleanup();
    
    // Expired should be gone
    expect(shortCache.get(messages1)).toBeNull();
    // Fresh should still be there
    expect(shortCache.get(messages2)).not.toBeNull();
  });
});
