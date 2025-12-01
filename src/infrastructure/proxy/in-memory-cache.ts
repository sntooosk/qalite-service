import { ExternalApiResponse } from '../../domain/interfaces/external-api.js'

interface CacheEntry<T = unknown> {
  expiresAt: number
  value: ExternalApiResponse<T>
}

export class InMemoryCache {
  private readonly store = new Map<string, CacheEntry>()

  get<T>(key: string): ExternalApiResponse<T> | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.value as ExternalApiResponse<T>
  }

  set<T>(key: string, value: ExternalApiResponse<T>, ttlMs: number): void {
    this.store.set(key, {
      expiresAt: Date.now() + ttlMs,
      value,
    })
  }
}
