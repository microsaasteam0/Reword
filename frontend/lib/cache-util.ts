/**
 * Request Cache - A simple in-memory cache for API requests
 * Provides caching, deduplication, and invalidation for API calls
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>()
  private pendingRequests = new Map<string, Promise<any>>()

  /**
   * Get data from cache or execute the request function
   * @param key - Cache key
   * @param requestFn - Function that returns a promise with the data
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   */
  async get<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    // Check if data is in cache and still valid
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }

    // Check if request is already pending (deduplication)
    const pending = this.pendingRequests.get(key)
    if (pending) {
      return pending
    }

    // Execute the request
    const requestPromise = requestFn()

    // Store the pending request
    this.pendingRequests.set(key, requestPromise)

    try {
      const data = await requestPromise

      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      })

      return data
    } catch (error) {
      console.error(`❌ Request failed for key: ${key}`, error)
      throw error
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(key)
    }
  }

  /**
   * Get cached data without making a request
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  getCached<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    return null
  }

  /**
   * Invalidate a specific cache entry
   * @param key - Cache key to invalidate
   */
  invalidate(key: string): void {
    this.cache.delete(key)
    this.pendingRequests.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

// Export a singleton instance
export const requestCache = new RequestCache()