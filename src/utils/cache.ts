/**
 * Simple in-memory cache with TTL support
 */

export interface CacheEntry {
  value: string;
  expiresAt: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
}

export class Cache {
  private store: Map<string, CacheEntry>;
  private config: CacheConfig;
  private hits: number;
  private misses: number;

  constructor(config: CacheConfig) {
    this.store = new Map();
    this.config = config;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get a value from the cache
   */
  get(key: string): string | null {
    if (!this.config.enabled) {
      return null;
    }

    const entry = this.store.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: string): void {
    if (!this.config.enabled) {
      return;
    }

    const expiresAt = Date.now() + (this.config.ttl * 1000);
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Remove a specific key from the cache
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; size: number; hitRate: string } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : "0.00";
    
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Create a cache key from various parameters
 */
export function createCacheKey(
  pathname: string,
  content?: string,
  prompt?: string,
  systemPrompt?: string,
  model?: string,
  style?: unknown
): string {
  // Create a deterministic key from the parameters
  const parts = [
    pathname,
    content || "",
    prompt || "",
    systemPrompt || "",
    model || "",
    style ? JSON.stringify(style) : "",
  ];
  
  return parts.join("|");
}

/**
 * Get cache configuration from environment variables
 */
export function getCacheConfig(): CacheConfig {
  const enabled = Deno.env.get("CACHE_ENABLED") !== "false"; // Default to enabled
  const ttl = parseInt(Deno.env.get("CACHE_TTL") || "3600"); // Default to 1 hour
  
  return { enabled, ttl };
}

// Global cache instance
export const globalCache = new Cache(getCacheConfig());

// Cleanup expired entries every 5 minutes
setInterval(() => {
  globalCache.cleanup();
}, 5 * 60 * 1000);
