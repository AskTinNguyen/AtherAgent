import { Redis } from '@upstash/redis'
import { createClient } from 'redis'

export interface RedisWrapper {
  hmset(key: string, data: Record<string, any>): Promise<'OK'>
  hgetall(key: string): Promise<Record<string, string>>
  zadd(key: string, score: number, member: string): Promise<number>
  zrange(key: string, start: number, stop: number, options?: { rev?: boolean }): Promise<string[]>
  del(...keys: string[]): Promise<number>
  zrem(key: string, ...members: string[]): Promise<number>
  multi(): RedisMulti
  keys(pattern: string): Promise<string[]>
}

export interface RedisMulti {
  hmset(key: string, data: Record<string, any>): RedisMulti
  zadd(key: string, score: number, member: string): RedisMulti
  exec(): Promise<any[]>
}

export class LocalRedisWrapper implements RedisWrapper {
  constructor(private client: ReturnType<typeof createClient>) {}

  async hmset(key: string, data: Record<string, any>): Promise<'OK'> {
    const stringifiedData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, JSON.stringify(v)])
    )
    await this.client.hSet(key, stringifiedData)
    return 'OK'
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const data = await this.client.hGetAll(key)
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, JSON.parse(v)])
    )
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    const result = await this.client.zAdd(key, [{ score, value: member }])
    return result ?? 0
  }

  async zrange(
    key: string,
    start: number,
    stop: number,
    options?: { rev?: boolean }
  ): Promise<string[]> {
    return await this.client.zRange(key, start, stop)
  }

  async del(...keys: string[]): Promise<number> {
    const result = await this.client.del(keys)
    return result ?? 0
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    const result = await this.client.zRem(key, members)
    return result ?? 0
  }

  multi(): RedisMulti {
    const multi = this.client.multi()
    return {
      hmset: (key: string, data: Record<string, any>): RedisMulti => {
        const stringifiedData = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, JSON.stringify(v)])
        )
        multi.hSet(key, stringifiedData)
        return this.multi()
      },
      zadd: (key: string, score: number, member: string): RedisMulti => {
        multi.zAdd(key, [{ score, value: member }])
        return this.multi()
      },
      exec: () => multi.exec()
    }
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern)
  }
}

export class UpstashRedisWrapper implements RedisWrapper {
  constructor(private client: Redis) {}

  async hmset(key: string, data: Record<string, any>): Promise<'OK'> {
    const stringifiedData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, JSON.stringify(v)])
    )
    await this.client.hmset(key, stringifiedData)
    return 'OK'
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const data = await this.client.hgetall(key)
    if (!data) return {}
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, JSON.parse(v as string)])
    )
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    const result = await this.client.zadd(key, { [member]: score })
    return result ?? 0
  }

  async zrange(
    key: string,
    start: number,
    stop: number,
    options?: { rev?: boolean }
  ): Promise<string[]> {
    return options?.rev
      ? await this.client.zrange(key, start, stop, { rev: true })
      : await this.client.zrange(key, start, stop)
  }

  async del(...keys: string[]): Promise<number> {
    const result = await this.client.del(keys[0])
    return result ?? 0
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    const result = await this.client.zrem(key, ...members)
    return result ?? 0
  }

  multi(): RedisMulti {
    const pipeline = this.client.pipeline()
    return {
      hmset: (key: string, data: Record<string, any>): RedisMulti => {
        const stringifiedData = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, JSON.stringify(v)])
        )
        pipeline.hmset(key, stringifiedData)
        return this.multi()
      },
      zadd: (key: string, score: number, member: string): RedisMulti => {
        pipeline.zadd(key, { [member]: score })
        return this.multi()
      },
      exec: () => pipeline.exec()
    }
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern)
  }
} 