import http from 'http'
import https from 'https'

const httpAgent = new http.Agent({ keepAlive: true })
const httpsAgent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: true
})

export async function fetchJsonWithRetry(url: string, retries: number): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchJson(url)
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

export function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http
    const agent = url.startsWith('https:') ? httpsAgent : httpAgent
    
    const request = protocol.get(url, { agent }, res => {
      let data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => {
        try {
          if (res.headers['content-type']?.includes('application/json')) {
            resolve(JSON.parse(data))
          } else {
            resolve({
              error: 'Invalid JSON response',
              status: res.statusCode,
              data: data.substring(0, 200)
            })
          }
        } catch (e) {
          reject(e)
        }
      })
    })
    
    request.on('error', reject)
    request.on('timeout', () => {
      request.destroy()
      reject(new Error('Request timed out'))
    })
    request.setTimeout(15000)
  })
}

export async function fetchHtmlWithTimeout(
  url: string,
  timeoutMs: number
): Promise<string> {
  try {
    return await Promise.race([
      fetchHtml(url),
      timeout(timeoutMs, `Fetching ${url} timed out after ${timeoutMs}ms`)
    ])
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return `<html><body>Error fetching content: ${errorMessage}</body></html>`
  }
}

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http
    const agent = url.startsWith('https:') ? httpsAgent : httpAgent
    
    const request = protocol.get(url, { agent }, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchHtml(new URL(res.headers.location, url).toString())
          .then(resolve)
          .catch(reject)
        return
      }
      
      let data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => resolve(data))
    })
    
    request.on('error', reject)
    request.on('timeout', () => {
      request.destroy()
      resolve('')
    })
    request.setTimeout(10000)
  })
}

function timeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message))
    }, ms)
  })
} 