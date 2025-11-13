import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { Cache, createCacheKey, getCacheConfig } from "./cache.ts";

Deno.test("Cache - basic set and get", () => {
  const cache = new Cache({ enabled: true, ttl: 60 });
  
  cache.set("key1", "value1");
  const result = cache.get("key1");
  
  assertEquals(result, "value1");
});

Deno.test("Cache - returns null for non-existent key", () => {
  const cache = new Cache({ enabled: true, ttl: 60 });
  
  const result = cache.get("non-existent");
  
  assertEquals(result, null);
});

Deno.test("Cache - respects TTL", async () => {
  const cache = new Cache({ enabled: true, ttl: 1 }); // 1 second TTL
  
  cache.set("key1", "value1");
  
  // Should exist immediately
  assertEquals(cache.get("key1"), "value1");
  
  // Wait for TTL to expire
  await new Promise(resolve => setTimeout(resolve, 1100));
  
  // Should be expired
  assertEquals(cache.get("key1"), null);
});

Deno.test("Cache - disabled cache always returns null", () => {
  const cache = new Cache({ enabled: false, ttl: 60 });
  
  cache.set("key1", "value1");
  const result = cache.get("key1");
  
  assertEquals(result, null);
});

Deno.test("Cache - clear removes all entries", () => {
  const cache = new Cache({ enabled: true, ttl: 60 });
  
  cache.set("key1", "value1");
  cache.set("key2", "value2");
  
  cache.clear();
  
  assertEquals(cache.get("key1"), null);
  assertEquals(cache.get("key2"), null);
  assertEquals(cache.getStats().size, 0);
});

Deno.test("Cache - delete removes specific entry", () => {
  const cache = new Cache({ enabled: true, ttl: 60 });
  
  cache.set("key1", "value1");
  cache.set("key2", "value2");
  
  cache.delete("key1");
  
  assertEquals(cache.get("key1"), null);
  assertEquals(cache.get("key2"), "value2");
});

Deno.test("Cache - tracks hits and misses", () => {
  const cache = new Cache({ enabled: true, ttl: 60 });
  
  cache.set("key1", "value1");
  
  // Hit
  cache.get("key1");
  // Miss
  cache.get("key2");
  // Another hit
  cache.get("key1");
  
  const stats = cache.getStats();
  assertEquals(stats.hits, 2);
  assertEquals(stats.misses, 1);
  assertEquals(stats.hitRate, "66.67%");
});

Deno.test("Cache - cleanup removes expired entries", async () => {
  const cache = new Cache({ enabled: true, ttl: 1 }); // 1 second TTL
  
  cache.set("key1", "value1");
  cache.set("key2", "value2");
  
  // Wait for TTL to expire
  await new Promise(resolve => setTimeout(resolve, 1100));
  
  // Add a new entry that won't be expired
  cache.set("key3", "value3");
  
  cache.cleanup();
  
  const stats = cache.getStats();
  assertEquals(stats.size, 1); // Only key3 should remain
  assertEquals(cache.get("key3"), "value3");
});

Deno.test("createCacheKey - creates consistent keys", () => {
  const key1 = createCacheKey("/test", "content", "prompt", "system", "model", { style: "test" });
  const key2 = createCacheKey("/test", "content", "prompt", "system", "model", { style: "test" });
  
  assertEquals(key1, key2);
});

Deno.test("createCacheKey - different inputs create different keys", () => {
  const key1 = createCacheKey("/test1", "content", "prompt", "system", "model");
  const key2 = createCacheKey("/test2", "content", "prompt", "system", "model");
  
  assertEquals(key1 === key2, false);
});

Deno.test("createCacheKey - handles undefined parameters", () => {
  const key = createCacheKey("/test");
  
  assertEquals(typeof key, "string");
  assertEquals(key.length > 0, true);
});

Deno.test("getCacheConfig - reads from environment", () => {
  // Save original values
  const originalEnabled = Deno.env.get("CACHE_ENABLED");
  const originalTtl = Deno.env.get("CACHE_TTL");
  
  try {
    // Set test values
    Deno.env.set("CACHE_ENABLED", "false");
    Deno.env.set("CACHE_TTL", "1800");
    
    const config = getCacheConfig();
    
    assertEquals(config.enabled, false);
    assertEquals(config.ttl, 1800);
  } finally {
    // Restore original values
    if (originalEnabled !== undefined) {
      Deno.env.set("CACHE_ENABLED", originalEnabled);
    } else {
      Deno.env.delete("CACHE_ENABLED");
    }
    
    if (originalTtl !== undefined) {
      Deno.env.set("CACHE_TTL", originalTtl);
    } else {
      Deno.env.delete("CACHE_TTL");
    }
  }
});

Deno.test("getCacheConfig - uses defaults when not set", () => {
  // Save original values
  const originalEnabled = Deno.env.get("CACHE_ENABLED");
  const originalTtl = Deno.env.get("CACHE_TTL");
  
  try {
    // Clear values
    Deno.env.delete("CACHE_ENABLED");
    Deno.env.delete("CACHE_TTL");
    
    const config = getCacheConfig();
    
    assertEquals(config.enabled, true); // Default is enabled
    assertEquals(config.ttl, 3600); // Default is 1 hour
  } finally {
    // Restore original values
    if (originalEnabled !== undefined) {
      Deno.env.set("CACHE_ENABLED", originalEnabled);
    }
    
    if (originalTtl !== undefined) {
      Deno.env.set("CACHE_TTL", originalTtl);
    }
  }
});
