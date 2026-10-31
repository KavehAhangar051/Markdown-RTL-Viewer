/**
 * @file utils/lruCache.ts
 * @description Bounded Least-Recently-Used (LRU) in-memory cache with hit/miss telemetry.
 * Eliminates duplicated caching mechanics across markdownEngine and syntaxHighlighter (DRY / ADR-0012).
 */

/**
 * Snapshot of bounded LRU cache telemetry metrics.
 */
export interface CacheTelemetryStats {
  readonly size: number;
  readonly hits: number;
  readonly misses: number;
}

/**
 * Public contract for a bounded LRU cache instance.
 */
export interface BoundedCache<V> {
  readonly get: (key: string) => V | undefined;
  readonly set: (key: string, value: V) => void;
  readonly clear: () => void;
  readonly getStats: () => CacheTelemetryStats;
}

/**
 * Creates a bounded LRU cache backed by insertion-ordered Map storage.
 * Enforces positive capacity precondition and evicts the least-recently-used key when full.
 *
 * @param {number} maxEntries - Maximum number of entries retained in memory (must be >= 1).
 * @returns {BoundedCache<V>} Orthogonal cache controller with telemetry.
 */
export function createBoundedCache<V>(maxEntries: number): BoundedCache<V> {
  const safeLimit = maxEntries >= 1 ? Math.floor(maxEntries) : 1;
  const entries = new Map<string, V>();
  let hits = 0;
  let misses = 0;

  return {
    get(key: string): V | undefined {
      const cached = entries.get(key);

      if (cached !== undefined) {
        hits++;
        // Refresh recency order in Map
        entries.delete(key);
        entries.set(key, cached);

        return cached;
      }

      misses++;

      return undefined;
    },

    set(key: string, value: V): void {
      if (entries.has(key)) {
        entries.delete(key);
      } else if (entries.size >= safeLimit) {
        const oldestKey = entries.keys().next().value;

        if (oldestKey !== undefined) {
          entries.delete(oldestKey);
        }
      }

      entries.set(key, value);
    },

    clear(): void {
      entries.clear();
      hits = 0;
      misses = 0;
    },

    getStats(): CacheTelemetryStats {
      return {
        size: entries.size,
        hits,
        misses,
      };
    },
  };
}
