import { LocalRedisWrapper, RedisWrapper } from '@/lib/redis/types'

jest.mock('redis', () => ({
  createClient: jest.fn()
}))

describe('Redis Wrapper', () => {
  let mockRedisClient: jest.Mocked<any>
  let redisWrapper: RedisWrapper

  beforeEach(() => {
    // Create a fresh mock for each test
    mockRedisClient = {
      hGetAll: jest.fn(),
      hSet: jest.fn(),
      zAdd: jest.fn(),
      zRange: jest.fn(),
      multi: jest.fn().mockReturnValue({
        hSet: jest.fn().mockReturnThis(),
        zAdd: jest.fn().mockReturnThis(),
        exec: jest.fn()
      }),
      del: jest.fn(),
      zRem: jest.fn(),
      keys: jest.fn()  // Add keys mock
    }

    redisWrapper = new LocalRedisWrapper(mockRedisClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('hgetall', () => {
    it('should return null for empty result', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({})

      const result = await redisWrapper.hgetall('test-key')
      expect(result).toBeNull()
    })

    it('should handle different value types correctly', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({
        stringValue: 'test',
        numberValue: '123',
        booleanValue: 'true',
        falsyBooleanValue: 'false',
        nullValue: '',
        undefinedValue: undefined
      })

      const result = await redisWrapper.hgetall('test-key')
      expect(result).toEqual({
        stringValue: 'test',
        numberValue: 123,  // Number strings are parsed to numbers
        booleanValue: true,  // Boolean strings are parsed to booleans
        falsyBooleanValue: false,  // 'false' is parsed to boolean false
        nullValue: null,  // Empty strings become null
        undefinedValue: null  // Undefined values become null
      })
    })

    it('should parse JSON values correctly', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({
        data: '{"key":"value","number":42}',
        invalidJson: '{not-valid-json}'
      })

      const result = await redisWrapper.hgetall('test-key')
      expect(result).toEqual({
        data: { key: 'value', number: 42 },
        invalidJson: '{not-valid-json}'  // Invalid JSON remains as string
      })
    })
  })

  describe('hmset', () => {
    it('should set hash fields correctly', async () => {
      mockRedisClient.hSet.mockResolvedValue(1)

      const data = {
        stringValue: 'test',
        numberValue: 123,
        booleanValue: true,
        nullValue: null,
        objectValue: { key: 'value' }
      }

      await redisWrapper.hmset('test-key', data)

      // Verify that hSet was called with stringified values
      expect(mockRedisClient.hSet).toHaveBeenCalledWith('test-key', {
        stringValue: 'test',
        numberValue: '123',
        booleanValue: 'true',
        nullValue: '',
        objectValue: '{"key":"value"}'
      })
    })

    it('should handle empty object without making Redis call', async () => {
      const result = await redisWrapper.hmset('test-key', {})

      expect(result).toBe(0)
      expect(mockRedisClient.hSet).not.toHaveBeenCalled()
    })

    it('should handle object with only null/undefined values', async () => {
      mockRedisClient.hSet.mockResolvedValue(1)
      const result = await redisWrapper.hmset('test-key', {
        nullValue: null,
        undefinedValue: undefined
      })

      expect(result).toBe(1)
      expect(mockRedisClient.hSet).toHaveBeenCalledWith('test-key', {
        nullValue: '',
        undefinedValue: ''
      })
    })
  })

  describe('zadd', () => {
    it('should add member with score correctly', async () => {
      mockRedisClient.zAdd.mockResolvedValue(1)

      const result = await redisWrapper.zadd('test-key', 42, 'test-member')

      expect(result).toBe(1)
      expect(mockRedisClient.zAdd).toHaveBeenCalledWith('test-key', {
        score: 42,
        value: 'test-member'
      })
    })

    it('should handle empty member without making Redis call', async () => {
      const result = await redisWrapper.zadd('test-key', 42, '')

      expect(result).toBe(0)
      expect(mockRedisClient.zAdd).not.toHaveBeenCalled()
    })

    it('should handle update of existing member', async () => {
      mockRedisClient.zAdd.mockResolvedValue(0)  // Redis returns 0 when updating existing member

      const result = await redisWrapper.zadd('test-key', 42, 'test-member')

      expect(result).toBe(0)
      expect(mockRedisClient.zAdd).toHaveBeenCalledWith('test-key', {
        score: 42,
        value: 'test-member'
      })
    })
  })

  describe('zrange', () => {
    it('should return members in order', async () => {
      mockRedisClient.zRange.mockResolvedValue(['member1', 'member2', 'member3'])

      const result = await redisWrapper.zrange('test-key', 0, 2)

      expect(result).toEqual(['member1', 'member2', 'member3'])
      expect(mockRedisClient.zRange).toHaveBeenCalledWith('test-key', 0, 2, undefined)
    })

    it('should handle empty result', async () => {
      mockRedisClient.zRange.mockResolvedValue([])

      const result = await redisWrapper.zrange('test-key', 0, -1)

      expect(result).toEqual([])
      expect(mockRedisClient.zRange).toHaveBeenCalledWith('test-key', 0, -1, undefined)
    })

    it('should handle reverse order', async () => {
      mockRedisClient.zRange.mockResolvedValue(['member3', 'member2', 'member1'])

      const result = await redisWrapper.zrange('test-key', 0, 2, { rev: true })

      expect(result).toEqual(['member3', 'member2', 'member1'])
      expect(mockRedisClient.zRange).toHaveBeenCalledWith('test-key', 0, 2, { REV: true })
    })
  })

  describe('transactions', () => {
    beforeEach(() => {
      mockRedisClient.multi = jest.fn().mockReturnValue({
        hSet: jest.fn().mockReturnThis(),
        zAdd: jest.fn().mockReturnThis(),
        exec: jest.fn()
      })
    })

    it('should execute basic transaction successfully', async () => {
      const transaction = mockRedisClient.multi()
      transaction.exec.mockResolvedValue([
        { err: null, result: 1 },
        { err: null, result: 1 }
      ])

      const result = await redisWrapper.multi()
        .hmset('test-hash', { field1: 'value1' })
        .zadd('test-sorted-set', 1, 'member1')
        .exec()

      expect(result).toEqual([
        { err: null, result: { err: null, result: 1 } },
        { err: null, result: { err: null, result: 1 } }
      ])
      expect(transaction.hSet).toHaveBeenCalledWith('test-hash', {
        field1: 'value1'
      })
      expect(transaction.zAdd).toHaveBeenCalledWith('test-sorted-set', {
        score: 1,
        value: 'member1'
      })
      expect(transaction.exec).toHaveBeenCalled()
    })

    it('should handle transaction error', async () => {
      const transaction = mockRedisClient.multi()
      transaction.exec.mockRejectedValue(new Error('Transaction failed'))

      await expect(
        redisWrapper.multi()
          .hmset('test-hash', { field1: 'value1' })
          .exec()
      ).rejects.toThrow('Transaction failed')
    })

    it('should handle empty transaction without making Redis call', async () => {
      const result = await redisWrapper.multi().exec()
      
      expect(result).toEqual([])
    })

    it('should chain multiple commands correctly', async () => {
      const transaction = mockRedisClient.multi()
      transaction.exec.mockResolvedValue([
        { err: null, result: 1 },
        { err: null, result: 1 },
        { err: null, result: 1 }
      ])

      const result = await redisWrapper.multi()
        .hmset('hash1', { field1: 'value1' })
        .hmset('hash2', { field2: 'value2' })
        .zadd('sorted-set', 1, 'member1')
        .exec()

      expect(result).toEqual([
        { err: null, result: { err: null, result: 1 } },
        { err: null, result: { err: null, result: 1 } },
        { err: null, result: { err: null, result: 1 } }
      ])
      expect(transaction.hSet).toHaveBeenCalledTimes(2)
      expect(transaction.zAdd).toHaveBeenCalledTimes(1)
      expect(transaction.exec).toHaveBeenCalled()
    })

    it('should handle partial transaction failure', async () => {
      const transaction = mockRedisClient.multi()
      transaction.exec.mockResolvedValue([
        { err: null, result: 1 },
        { err: new Error('Command failed'), result: null }
      ])

      const result = await redisWrapper.multi()
        .hmset('key1', { field1: 'value1' })
        .hmset('key2', { field2: 'value2' })
        .exec()

      expect(result).toEqual([
        { err: null, result: { err: null, result: 1 } },
        { err: null, result: { err: new Error('Command failed'), result: null } }
      ])
    })
  })

  describe('del', () => {
    beforeEach(() => {
      mockRedisClient.del = jest.fn()
    })

    it('should delete single key successfully', async () => {
      mockRedisClient.del.mockResolvedValue(1)

      const result = await redisWrapper.del('test-key')
      expect(result).toBe(1)
      expect(mockRedisClient.del).toHaveBeenCalledWith(['test-key'])
    })

    it('should handle non-existent key', async () => {
      mockRedisClient.del.mockResolvedValue(0)

      const result = await redisWrapper.del('non-existent-key')
      expect(result).toBe(0)
      expect(mockRedisClient.del).toHaveBeenCalledWith(['non-existent-key'])
    })

    it('should handle multiple key deletion', async () => {
      mockRedisClient.del.mockResolvedValue(2)

      const result = await redisWrapper.del('key1', 'key2')
      expect(result).toBe(2)
      expect(mockRedisClient.del).toHaveBeenCalledWith(['key1', 'key2'])
    })

    it('should handle deletion error', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Deletion failed'))

      await expect(redisWrapper.del('test-key')).rejects.toThrow('Deletion failed')
    })
  })

  describe('zrem', () => {
    beforeEach(() => {
      mockRedisClient.zRem = jest.fn()
    })

    it('should remove member from sorted set successfully', async () => {
      mockRedisClient.zRem.mockResolvedValue(1)

      const result = await redisWrapper.zrem('test-key', 'member1')
      expect(result).toBe(1)
      expect(mockRedisClient.zRem).toHaveBeenCalledWith('test-key', ['member1'])
    })

    it('should handle non-existent member', async () => {
      mockRedisClient.zRem.mockResolvedValue(0)

      const result = await redisWrapper.zrem('test-key', 'non-existent-member')
      expect(result).toBe(0)
      expect(mockRedisClient.zRem).toHaveBeenCalledWith('test-key', ['non-existent-member'])
    })

    it('should handle multiple member removal', async () => {
      mockRedisClient.zRem.mockResolvedValue(2)

      const result = await redisWrapper.zrem('test-key', 'member1', 'member2')
      expect(result).toBe(2)
      expect(mockRedisClient.zRem).toHaveBeenCalledWith('test-key', ['member1', 'member2'])
    })

    it('should handle empty member list without making Redis call', async () => {
      const result = await redisWrapper.zrem('test-key')
      expect(result).toBe(0)
      expect(mockRedisClient.zRem).not.toHaveBeenCalled()
    })

    it('should handle removal error', async () => {
      mockRedisClient.zRem.mockRejectedValue(new Error('Removal failed'))

      await expect(redisWrapper.zrem('test-key', 'member1')).rejects.toThrow('Removal failed')
    })
  })

  describe('Value Type Edge Cases', () => {
    describe('Large JSON Objects', () => {
      it('should handle large nested JSON objects', async () => {
        const largeObject = {
          level1: {
            level2: {
              level3: {
                array: Array(100).fill({ key: 'value', number: 42 }),
                string: 'a'.repeat(1000),
                numbers: Array(100).fill(Math.random())
              }
            }
          }
        }

        mockRedisClient.hSet.mockResolvedValue(1)
        await redisWrapper.hmset('large-json', { data: largeObject })

        expect(mockRedisClient.hSet).toHaveBeenCalledWith('large-json', {
          data: expect.any(String)
        })
        // Verify the stringified object can be parsed back
        const stringified = mockRedisClient.hSet.mock.calls[0][1].data
        expect(() => JSON.parse(stringified)).not.toThrow()
      })

      it('should handle circular references gracefully', async () => {
        const circularObj: any = { key: 'value' }
        circularObj.self = circularObj

        mockRedisClient.hSet.mockResolvedValue(1)
        await redisWrapper.hmset('circular-ref', { data: circularObj })

        expect(mockRedisClient.hSet).toHaveBeenCalledWith('circular-ref', {
          data: '' // Circular references should be handled by returning empty string
        })
      })
    })

    describe('Special Characters', () => {
      it('should handle special characters in keys and values', async () => {
        const specialData = {
          'key!@#$%^&*()': 'value!@#$%^&*()',
          'emoji🎉': '🎈🎊🎉',
          'quotes"\'': '"quoted\'string"',
          'newlines\n\r': 'text\nwith\rbreaks'
        }

        mockRedisClient.hSet.mockResolvedValue(1)
        await redisWrapper.hmset('special-chars', specialData)

        expect(mockRedisClient.hSet).toHaveBeenCalledWith('special-chars', {
          'key!@#$%^&*()': 'value!@#$%^&*()',
          'emoji🎉': '🎈🎊🎉',
          'quotes"\'': '"quoted\'string"',
          'newlines\n\r': 'text\nwith\rbreaks'
        })
      })

      it('should handle control characters', async () => {
        const controlData = {
          null: '\0',
          tab: '\t',
          verticalTab: '\v',
          formFeed: '\f',
          backspace: '\b'
        }

        mockRedisClient.hSet.mockResolvedValue(1)
        await redisWrapper.hmset('control-chars', controlData)

        expect(mockRedisClient.hSet).toHaveBeenCalledWith('control-chars', {
          null: '\0',
          tab: '\t',
          verticalTab: '\v',
          formFeed: '\f',
          backspace: '\b'
        })
      })
    })

    describe('Unicode Support', () => {
      it('should handle various Unicode characters', async () => {
        const unicodeData = {
          chinese: '你好世界',
          arabic: 'مرحبا بالعالم',
          russian: 'Привет, мир',
          japanese: 'こんにちは世界',
          korean: '안녕하세요 세계',
          emoji: '👨‍👩‍👧‍👦👨‍💻🌍'
        }

        mockRedisClient.hSet.mockResolvedValue(1)
        await redisWrapper.hmset('unicode', unicodeData)

        expect(mockRedisClient.hSet).toHaveBeenCalledWith('unicode', unicodeData)

        // Test retrieval
        mockRedisClient.hGetAll.mockResolvedValue(unicodeData)
        const result = await redisWrapper.hgetall('unicode')
        expect(result).toEqual(unicodeData)
      })

      it('should handle Unicode surrogate pairs', async () => {
        const surrogateData = {
          // Using characters that require surrogate pairs in UTF-16
          mathSymbol: '𝒜', // Mathematical Script Capital A
          emoji: '🌍', // Earth Globe Europe-Africa
          ancient: '𐐷', // Deseret Small Letter Ew
        }

        mockRedisClient.hSet.mockResolvedValue(1)
        await redisWrapper.hmset('surrogate-pairs', surrogateData)

        expect(mockRedisClient.hSet).toHaveBeenCalledWith('surrogate-pairs', surrogateData)
      })
    })

    describe('Buffer Handling', () => {
      it('should handle Buffer values', async () => {
        const bufferData = {
          binary: Buffer.from('Hello World'),
          image: Buffer.from('fake-image-data'),
          mixed: Buffer.from('mixed 🌍 data')
        }

        mockRedisClient.hSet.mockResolvedValue(1)
        await redisWrapper.hmset('buffer-data', bufferData)

        expect(mockRedisClient.hSet).toHaveBeenCalledWith('buffer-data', {
          binary: 'Hello World',
          image: 'fake-image-data',
          mixed: 'mixed 🌍 data'
        })
      })

      it('should handle Buffer in sorted sets', async () => {
        mockRedisClient.zAdd.mockResolvedValue(1)
        const bufferMember = Buffer.from('Hello World')
        
        await redisWrapper.zadd('buffer-set', 1, bufferMember.toString('utf-8'))

        expect(mockRedisClient.zAdd).toHaveBeenCalledWith('buffer-set', {
          score: 1,
          value: 'Hello World'
        })
      })
    })
  })

  describe('Error Scenarios', () => {
    describe('Connection Failures', () => {
      it('should handle connection loss during operation', async () => {
        mockRedisClient.hSet.mockRejectedValue(new Error('Connection lost'))

        await expect(
          redisWrapper.hmset('test-key', { field: 'value' })
        ).rejects.toThrow('Connection lost')
      })

      it('should handle connection timeout', async () => {
        mockRedisClient.zAdd.mockRejectedValue(new Error('Connection timeout'))

        await expect(
          redisWrapper.zadd('test-key', 1, 'member')
        ).rejects.toThrow('Connection timeout')
      })

      it('should handle connection refused', async () => {
        mockRedisClient.hGetAll.mockRejectedValue(new Error('Connection refused'))

        await expect(
          redisWrapper.hgetall('test-key')
        ).rejects.toThrow('Connection refused')
      })
    })

    describe('Timeout Handling', () => {
      it('should handle operation timeout', async () => {
        mockRedisClient.zRange.mockRejectedValue(new Error('Operation timed out'))

        await expect(
          redisWrapper.zrange('test-key', 0, -1)
        ).rejects.toThrow('Operation timed out')
      })

      it('should handle slow query timeout', async () => {
        mockRedisClient.keys.mockRejectedValue(new Error('Query timed out'))

        await expect(
          redisWrapper.keys('pattern*')
        ).rejects.toThrow('Query timed out')
      })
    })

    describe('Invalid Key Patterns', () => {
      it('should handle invalid key name', async () => {
        const invalidKey = ' '.repeat(1000) // Very long key name
        mockRedisClient.hSet.mockRejectedValue(new Error('Invalid key name'))

        await expect(
          redisWrapper.hmset(invalidKey, { field: 'value' })
        ).rejects.toThrow('Invalid key name')
      })

      it('should handle invalid key pattern in keys command', async () => {
        const invalidPattern = '[invalid'
        mockRedisClient.keys.mockRejectedValue(new Error('Invalid pattern'))

        await expect(
          redisWrapper.keys(invalidPattern)
        ).rejects.toThrow('Invalid pattern')
      })
    })

    describe('Memory Limits', () => {
      it('should handle out of memory error', async () => {
        const largeData = {
          field: 'x'.repeat(1024 * 1024 * 100) // 100MB string
        }
        mockRedisClient.hSet.mockRejectedValue(new Error('Out of memory'))

        await expect(
          redisWrapper.hmset('large-key', largeData)
        ).rejects.toThrow('Out of memory')
      })

      it('should handle maximum value size exceeded', async () => {
        const hugeValue = 'x'.repeat(1024 * 1024) // 1MB string instead of 512MB
        mockRedisClient.zAdd.mockRejectedValue(new Error('Maximum value size exceeded'))

        await expect(
          redisWrapper.zadd('test-key', 1, hugeValue)
        ).rejects.toThrow('Maximum value size exceeded')
      })
    })

    describe('Transaction Errors', () => {
      it('should handle watch error in transaction', async () => {
        const transaction = mockRedisClient.multi()
        transaction.exec.mockRejectedValue(new Error('WATCH failed: Key modified'))

        await expect(
          redisWrapper.multi()
            .hmset('test-key', { field: 'value' })
            .exec()
        ).rejects.toThrow('WATCH failed: Key modified')
      })

      it('should handle partial transaction failure', async () => {
        const transaction = mockRedisClient.multi()
        transaction.exec.mockResolvedValue([
          { err: null, result: 1 },
          { err: new Error('Command failed'), result: null }
        ])

        const result = await redisWrapper.multi()
          .hmset('key1', { field: 'value1' })
          .hmset('key2', { field: 'value2' })
          .exec()

        expect(result).toEqual([
          { err: null, result: { err: null, result: 1 } },
          { err: null, result: { err: new Error('Command failed'), result: null } }
        ])
      })
    })
  })
})
