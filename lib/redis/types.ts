import { Redis } from '@upstash/redis'
import { RedisClientType } from 'redis'

export interface RedisWrapper {
  zrange(key: string, start: number, stop: number, options?: { rev: boolean }): Promise<string[]>
  hgetall<T extends Record<string, unknown>>(key: string): Promise<T | null>
  pipeline(): PipelineWrapper
  hmset(key: string, value: Record<string, any>): Promise<'OK' | number>
  zadd(key: string, score: number, member: string): Promise<number>
  zscore(key: string, member: string): Promise<number | null>
  del(key: string): Promise<number>
  zrem(key: string, member: string): Promise<number>
  close(): Promise<void>
  ping(): Promise<string>
  keys(pattern: string): Promise<string[]>
}

export interface PipelineWrapper {
  hgetall(key: string): PipelineWrapper
  del(key: string): PipelineWrapper
  zrem(key: string, member: string): PipelineWrapper
  hmset(key: string, value: Record<string, any>): PipelineWrapper
  zadd(key: string, score: number, member: string): PipelineWrapper
  zrange(key: string, start: number, stop: number, options?: { rev: boolean }): PipelineWrapper
  exec(): Promise<any[]>
}

export class LocalRedisWrapper implements RedisWrapper {
  constructor(private client: RedisClientType) {}

  async zrange(key: string, start: number, stop: number, options?: { rev: boolean }): Promise<string[]> {
    return this.client.zRange(key, start, stop, options?.rev ? { REV: true } : undefined)
  }

  async hgetall<T extends Record<string, unknown>>(key: string): Promise<T | null> {
    const result = await this.client.hGetAll(key)
    return Object.keys(result).length > 0 ? result as T : null
  }

  pipeline(): PipelineWrapper {
    const multi = this.client.multi()
    return {
      hgetall(key: string) {
        multi.hGetAll(key)
        return this
      },
      del(key: string) {
        multi.del(key)
        return this
      },
      zrem(key: string, member: string) {
        multi.zRem(key, member)
        return this
      },
      hmset(key: string, value: Record<string, any>) {
        const args: Record<string, string> = {}
        for (const [field, val] of Object.entries(value)) {
          args[field] = typeof val === 'string' ? val : JSON.stringify(val)
        }
        for (const [field, val] of Object.entries(args)) {
          multi.hSet(key, field, val)
        }
        return this
      },
      zadd(key: string, score: number, member: string) {
        multi.zAdd(key, { score, value: member })
        return this
      },
      zrange(key: string, start: number, stop: number, options?: { rev: boolean }) {
        multi.zRange(key, start, stop, options?.rev ? { REV: true } : undefined)
        return this
      },
      async exec() {
        try {
          const results = await multi.exec()
          if (!results) {
            throw new Error('Pipeline execution returned no results')
          }
          return results
        } catch (error) {
          console.error('Pipeline execution error:', error)
          throw error
        }
      }
    }
  }

  async hmset(key: string, value: Record<string, any>): Promise<number> {
    const args: Record<string, string> = {}
    for (const [field, val] of Object.entries(value)) {
      args[field] = typeof val === 'string' ? val : JSON.stringify(val)
    }
    return this.client.hSet(key, args)
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    const result = await this.client.zAdd(key, { score, value: member })
    return result ? 1 : 0
  }

  async zscore(key: string, member: string): Promise<number | null> {
    return this.client.zScore(key, member)
  }

  async del(key: string): Promise<number> {
    return this.client.del(key)
  }

  async zrem(key: string, member: string): Promise<number> {
    return this.client.zRem(key, member)
  }

  async close(): Promise<void> {
    await this.client.quit()
  }

  async ping(): Promise<string> {
    const result = await this.client.ping()
    return result || 'PONG'
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern)
  }
}

export class UpstashRedisWrapper implements RedisWrapper {
  constructor(private client: Redis) {}

  async zrange(key: string, start: number, stop: number, options?: { rev: boolean }): Promise<string[]> {
    return this.client.zrange(key, start, stop, options)
  }

  async hgetall<T extends Record<string, unknown>>(key: string): Promise<T | null> {
    return this.client.hgetall(key)
  }

  pipeline(): PipelineWrapper {
    const pipeline = this.client.pipeline()
    return {
      hgetall(key: string) {
        pipeline.hgetall(key)
        return this
      },
      del(key: string) {
        pipeline.del(key)
        return this
      },
      zrem(key: string, member: string) {
        pipeline.zrem(key, member)
        return this
      },
      hmset(key: string, value: Record<string, any>) {
        pipeline.hmset(key, value)
        return this
      },
      zadd(key: string, score: number, member: string) {
        pipeline.zadd(key, { score, member })
        return this
      },
      zrange(key: string, start: number, stop: number, options?: { rev: boolean }) {
        pipeline.zrange(key, start, stop, options)
        return this
      },
      async exec() {
        try {
          const results = await pipeline.exec()
          return results || []
        } catch (error) {
          console.error('Pipeline execution error:', error)
          throw error
        }
      }
    }
  }

  async hmset(key: string, value: Record<string, any>): Promise<'OK'> {
    return this.client.hmset(key, value)
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    const result = await this.client.zadd(key, { score, member })
    return result || 0
  }

  async zscore(key: string, member: string): Promise<number | null> {
    return this.client.zscore(key, member)
  }

  async del(key: string): Promise<number> {
    return this.client.del(key)
  }

  async zrem(key: string, member: string): Promise<number> {
    return this.client.zrem(key, member)
  }

  async close(): Promise<void> {
    // Upstash Redis doesn't require explicit closing
  }

  async ping(): Promise<string> {
    return this.client.ping()
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern)
  }
} 