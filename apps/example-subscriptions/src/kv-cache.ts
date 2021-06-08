import {
  KeyValueCache,
  KeyValueCacheSetOptions
} from 'apollo-server-caching/dist'

export class KVCache implements KeyValueCache {
  get(key: string) {
    return WORKERS_GRAPHQL_CACHE.get(key) as any
  }

  set(key: string, value: any, options: KeyValueCacheSetOptions) {
    const opts: Parameters<typeof WORKERS_GRAPHQL_CACHE['put']>[2] = {}
    const ttl = options && options.ttl
    if (ttl) {
      opts.expirationTtl = ttl
    }
    return WORKERS_GRAPHQL_CACHE.put(key, value, opts) as any
  }

  delete(key: string) {
    return WORKERS_GRAPHQL_CACHE.delete(key)
  }
}
