import { Redis } from '@upstash/redis'
import { createClient } from 'redis'

export type RedisClient = ReturnType<typeof createClient>

export interface RedisMulti {
  hmset(key: string, value: Record<string, any>): this
  zadd(key: string, score: number, member: string): this
  exec(): Promise<Array<{ err: Error | null; result: any }>>
}

export interface RedisWrapper {
  hgetall<T extends Record<string, any>>(key: string): Promise<T | null>
  hmset(key: string, value: Record<string, any>): Promise<number>
  zadd(key: string, score: number, member: string): Promise<number>
  zrange(key: string, start: number, stop: number, options?: { rev?: boolean }): Promise<string[]>
  zrem(key: string, ...members: string[]): Promise<number>
  keys(pattern: string): Promise<string[]>
  del(...keys: string[]): Promise<number>
  multi(): RedisMulti
}

export class LocalRedisWrapper implements RedisWrapper {
  constructor(private readonly client: RedisClient) {}

  private stringifyValues(data: Record<string, any>): Record<string, string> {
    const stringified: Record<string, string> = {}
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) {
        stringified[key] = ''
        continue
      }
      if (typeof value === 'string') {
        stringified[key] = value
        continue
      }
      if (Buffer.isBuffer(value)) {
        stringified[key] = value.toString('utf-8')
        continue
      }
      try {
        stringified[key] = typeof value === 'object' ? JSON.stringify(value) : String(value)
      } catch {
        stringified[key] = ''
      }
    }
    return stringified
  }

  private parseValues<T extends Record<string, any>>(data: Record<string, string>): T {
    const parsed: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      if (!value) {
        parsed[key] = null
        continue
      }
      try {
        parsed[key] = JSON.parse(value)
      } catch {
        parsed[key] = value
      }
    }
    return parsed as T
  }

  async zrange(key: string, start: number, stop: number, options?: { rev?: boolean }): Promise<string[]> {
    const result = await this.client.zRange(key, start, stop, options?.rev ? { REV: true } : undefined)
    return result.map(item => {
      if (Buffer.isBuffer(item)) return item.toString('utf-8')
      return String(item)
    })
  }

  async hgetall<T extends Record<string, any>>(key: string): Promise<T | null> {
    const result = await this.client.hGetAll(key)
    if (!Object.keys(result).length) return null
    return this.parseValues<T>(result)
  }

  async hmset(key: string, data: Record<string, any>): Promise<number> {
    const stringified = this.stringifyValues(data)
    const validEntries = Object.entries(stringified).filter(([_, val]) => val !== undefined && val !== null)
    if (!validEntries.length) return 0
    
    const result = await this.client.hSet(key, Object.fromEntries(validEntries))
    return result || 0
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!member) return 0
    const result = await this.client.zAdd(key, { score, value: member })
    return result ? 1 : 0
  }

  async keys(pattern: string): Promise<string[]> {
    const result = await this.client.keys(pattern)
    return result.map(item => {
      if (Buffer.isBuffer(item)) return item.toString('utf-8')
      return String(item)
    })
  }

  async del(...keys: string[]): Promise<number> {
    if (!keys.length) return 0
    return this.client.del(keys as any)
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    if (!members.length) return 0
    const result = await this.client.zRem(key, members as any)
    return result || 0
  }

  multi(): RedisMulti {
    const multi = this.client.multi()
    const wrapper: RedisMulti = {
      hmset: (key: string, value: Record<string, any>) => {
        const stringified = this.stringifyValues(value)
        const validEntries = Object.entries(stringified).filter(([_, val]) => val !== undefined && val !== null)
        if (validEntries.length) {
          multi.hSet(key, Object.fromEntries(validEntries))
        }
        return wrapper
      },
      zadd: (key: string, score: number, member: string) => {
        if (member) {
          multi.zAdd(key, { score, value: member })
        }
        return wrapper
      },
      exec: async () => {
        const results = await multi.exec()
        return results?.map(result => ({
          err: result instanceof Error ? result : null,
          result: result instanceof Error ? null : result
        })) || []
      }
    }
    return wrapper
  }
}

let redisClient: LocalRedisWrapper | null = null

export async function getRedisClient(): Promise<LocalRedisWrapper> {
  if (!redisClient) {
    const client = createClient({
      url: process.env.LOCAL_REDIS_URL || 'redis://localhost:6379'
    })

    await client.connect()
    redisClient = new LocalRedisWrapper(client)
  }

  return redisClient
}

export class UpstashRedisWrapper implements RedisWrapper {
  constructor(private readonly client: Redis) {}

  async zrange(key: string, start: number, stop: number, options?: { rev?: boolean }): Promise<string[]> {
    const result = await this.client.zrange(key, start, stop, options?.rev ? { rev: true } : undefined)
    return result.map(String)
  }

  async hgetall<T extends Record<string, any>>(key: string): Promise<T | null> {
    const result = await this.client.hgetall<Record<string, string>>(key)
    if (!result || !Object.keys(result).length) return null
    return result as T
  }

  async hmset(key: string, value: Record<string, any>): Promise<number> {
    const stringified = Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
    )
    const result = await this.client.hmset(key, stringified)
    return result === 'OK' ? 1 : 0
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!member) return 0
    const result = await this.client.zadd(key, { score, member: String(member) })
    return result || 0
  }

  async keys(pattern: string): Promise<string[]> {
    const result = await this.client.keys(pattern)
    return result.map(String)
  }

  async del(...keys: string[]): Promise<number> {
    if (!keys.length) return 0
    const result = await this.client.del(keys as any)
    return result || 0
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    if (!members.length) return 0
    const result = await this.client.zrem(key, members as any)
    return result || 0
  }

  multi(): RedisMulti {
    const pipeline = this.client.pipeline()
    const wrapper: RedisMulti = {
      hmset: (key: string, value: Record<string, any>) => {
        const stringified = Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
        )
        pipeline.hmset(key, stringified)
        return wrapper
      },
      zadd: (key: string, score: number, member: string) => {
        if (member) {
          pipeline.zadd(key, { score, member: String(member) })
        }
        return wrapper
      },
      exec: async () => {
        const results = await pipeline.exec()
        return results?.map(result => ({
          err: result instanceof Error ? result : null,
          result: result instanceof Error ? null : result
        })) || []
      }
    }
    return wrapper
  }
} 