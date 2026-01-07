const CACHE_PREFIX = 'tb_cache_';
const CACHE_VERSION = 'v1';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
}

export const cacheManager = {
  set: <T>(key: string, data: T, ttl: number = 10 * 60 * 1000): void => {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(item));
      
      setTimeout(() => {
        cacheManager.remove(key);
      }, ttl);
    } catch (error) {
      // Silently handle storage errors
    }
  },

  get: <T>(key: string, maxAge: number = 10 * 60 * 1000): T | null => {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const item: CacheItem<T> = JSON.parse(cached);
      
      if (item.version !== CACHE_VERSION) {
        cacheManager.remove(key);
        return null;
      }
      
      const age = Date.now() - item.timestamp;
      if (age > maxAge) {
        cacheManager.remove(key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      return null;
    }
  },

  remove: (key: string): void => {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      // Silently handle errors
    }
  },

  clear: (): void => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      // Silently handle errors
    }
  },

  clearExpired: (): void => {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const item: CacheItem<any> = JSON.parse(cached);
              const age = now - item.timestamp;
              
              if (age > 30 * 60 * 1000 || item.version !== CACHE_VERSION) {
                localStorage.removeItem(key);
              }
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      // Silently handle errors
    }
  },
};

if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.clearExpired();
  }, 5 * 60 * 1000);
}
