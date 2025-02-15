import '@testing-library/jest-dom'
import fetch, { Headers, Request, Response } from 'node-fetch'
import { ReadableStream, TransformStream, WritableStream } from 'stream/web'
import { TextDecoder, TextEncoder } from 'util'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn().mockImplementation((callback, options) => ({
  root: null,
  rootMargin: '',
  thresholds: [],
  disconnect: jest.fn(),
  observe: jest.fn(),
  takeRecords: jest.fn(),
  unobserve: jest.fn(),
}))
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: mockIntersectionObserver,
})

// Add Web Streams API polyfills
Object.defineProperty(global, 'TextEncoder', { value: TextEncoder })
Object.defineProperty(global, 'TextDecoder', { value: TextDecoder })
Object.defineProperty(global, 'ReadableStream', { value: ReadableStream })
Object.defineProperty(global, 'WritableStream', { value: WritableStream })
Object.defineProperty(global, 'TransformStream', { value: TransformStream })

// Add Fetch API polyfills
if (!global.fetch) {
  Object.defineProperty(global, 'fetch', { value: fetch })
  Object.defineProperty(global, 'Request', { value: Request })
  Object.defineProperty(global, 'Response', { value: Response })
  Object.defineProperty(global, 'Headers', { value: Headers })
}

// Add setImmediate polyfill
const setImmediatePolyfill = (callback: (...args: any[]) => void, ...args: any[]) => {
  return setTimeout(callback, 0, ...args)
}
setImmediatePolyfill.prototype = undefined
Object.defineProperty(global, 'setImmediate', {
  value: setImmediatePolyfill,
  configurable: true,
  writable: true,
})

// Mock Redis client for tests
jest.mock('redis', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    keys: jest.fn().mockResolvedValue([]),
    scan: jest.fn().mockResolvedValue({ keys: [], cursor: '0' }),
    zadd: jest.fn().mockResolvedValue(1),
    zrange: jest.fn().mockResolvedValue([]),
    zrangebyscore: jest.fn().mockResolvedValue([]),
    zrem: jest.fn().mockResolvedValue(1),
    zscore: jest.fn().mockResolvedValue(1),
    hset: jest.fn().mockResolvedValue(1),
    hget: jest.fn().mockResolvedValue(null),
    hgetall: jest.fn().mockResolvedValue({}),
    hdel: jest.fn().mockResolvedValue(1),
    multi: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
    watch: jest.fn().mockResolvedValue('OK'),
    unwatch: jest.fn().mockResolvedValue('OK'),
  })),
}))

// Set test environment variables
process.env.USE_LOCAL_REDIS = 'true'
process.env.LOCAL_REDIS_URL = 'redis://localhost:6379'
process.env.TEST_REDIS_URL = 'redis://localhost:6379'