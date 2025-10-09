import { CACHE_CONFIG } from './constants';

interface CacheItem {
    data: unknown;
    timestamp: number;
}

class SimpleCache {
    private cache: Map<string, CacheItem> = new Map();
    private ttl: number = CACHE_CONFIG.TTL;

    set(key: string, data: unknown): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    get(key: string): unknown | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    clear(key?: string): void {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
}

export const cache = new SimpleCache();
