import { CACHE_CONFIG } from './constants';

interface CacheItem {
    data: unknown;
    timestamp: number;
}

/**
 * Simple in-memory cache with TTL support
 * Used to cache active keywords and reduce Firestore reads
 */
class SimpleCache {
    private cache: Map<string, CacheItem> = new Map();
    private ttl: number = CACHE_CONFIG.TTL;

    /**
     * Store data in cache with current timestamp
     */
    set(key: string, data: unknown): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Retrieve data from cache if not expired
     * @returns Cached data or null if expired/not found
     */
    get(key: string): unknown | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    /**
     * Clear specific key or entire cache
     */
    clear(key?: string): void {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
}

export const cache = new SimpleCache();
