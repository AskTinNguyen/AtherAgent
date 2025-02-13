import { Redis } from '@upstash/redis'
import { createClient } from 'redis'

export type RedisClient = ReturnType<typeof createClient>

export interface RedisWrapper {
  hgetall<T extends Record<string, any>>(key: string): Promise<T | null>
  hmset(key: string, value: Record<string, any>): Promise<number>
  zadd(key: string, score: number, member: string): Promise<number>
  zrange(key: string, start: number, stop: number, options?: { rev?: boolean }): Promise<string[]>
  keys(pattern: string): Promise<string[]>
  del(key: string): Promise<number>
}

export class LocalRedisWrapper implements RedisWrapper {
  private client: RedisClient

  constructor(client: RedisClient) {
    this.client = client
  }

  private stringifyValues(data: Record<string, any>): Record<string, string> {
    const stringified: Record<string, string> = {}
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) {
        stringified[key] = ''
      } else if (typeof value === 'string') {
        stringified[key] = value
      } else if (Buffer.isBuffer(value)) {
        stringified[key] = value.toString('utf-8')
      } else if (typeof value === 'object') {
        try {
          stringified[key] = JSON.stringify(value)
        } catch {
          stringified[key] = ''
        }
      } else {
        stringified[key] = String(value)
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
      if (typeof item === 'string') return item
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
    const result = await this.client.zAdd(key, { score, value: member.toString() })
    return result || 0
  }

  async keys(pattern: string): Promise<string[]> {
    const result = await this.client.keys(pattern)
    return result.map(item => {
      if (Buffer.isBuffer(item)) return item.toString('utf-8')
      if (typeof item === 'string') return item
      return String(item)
    })
  }

  async del(key: string): Promise<number> {
    return this.client.del(key)
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
  constructor(private client: Redis) {}

  async zrange(key: string, start: number, stop: number, options?: { rev?: boolean }): Promise<string[]> {
    return this.client.zrange(key, start, stop, options?.rev ? { rev: true } : undefined)
  }

  async hgetall<T extends Record<string, any>>(key: string): Promise<T | null> {
    const result = await this.client.hgetall(key)
    return result as T | null
  }

  async hmset(key: string, value: Record<string, any>): Promise<number> {
    const result = await this.client.hmset(key, value)
    return result === 'OK' ? 1 : 0
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    const result = await this.client.zadd(key, { score, member })
    return result || 0
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern)
  }

  async del(key: string): Promise<number> {
    return this.client.del(key)
  }
} 