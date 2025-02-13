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
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null }
  unobserve() { return null }
  disconnect() { return null }
}

// Add Web Streams API polyfills
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream
global.WritableStream = WritableStream
global.TransformStream = TransformStream

// Add Fetch API polyfills
if (!global.fetch) {
  global.fetch = fetch as unknown as typeof global.fetch
  global.Request = Request as unknown as typeof global.Request
  global.Response = Response as unknown as typeof global.Response
  global.Headers = Headers as unknown as typeof global.Headers
}