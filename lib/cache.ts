/**
 * Simple in-memory cache with TTL (Time To Live)
 * Reduces redundant Firestore queries
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTLMinutes: number = 5) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLMinutes * 60 * 1000;
  }

  /**
   * Get cached data if still valid
   */
  get<T>(key: string, customTTL?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const ttl = customTTL || this.defaultTTL;
    const isExpired = Date.now() - entry.timestamp > ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if cache has valid data
   */
  has(key: string, customTTL?: number): boolean {
    return this.get(key, customTTL) !== null;
  }

  /**
   * Clear specific cache entry or all cache
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cache = new CacheManager(5); // 5 minutes default TTL

// Convenience functions
export function getCachedData<T>(key: string, ttl?: number): T | null {
  return cache.get<T>(key, ttl);
}

export function setCachedData<T>(key: string, data: T): void {
  cache.set(key, data);
}

export function hasCachedData(key: string, ttl?: number): boolean {
  return cache.has(key, ttl);
}

export function clearCache(key?: string): void {
  cache.clear(key);
}

// Auto cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 10 * 60 * 1000);
}
