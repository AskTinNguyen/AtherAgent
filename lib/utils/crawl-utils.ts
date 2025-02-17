import { CrawlResult, SearXNGResult } from '@/lib/types/searxng.type'
import { JSDOM, VirtualConsole } from 'jsdom'
import { fetchHtmlWithTimeout } from './http-utils'

export async function crawlPage(
  result: SearXNGResult,
  query: string
): Promise<SearXNGResult | null> {
  try {
    const html = await fetchHtmlWithTimeout(result.url, 20000)
    const virtualConsole = new VirtualConsole()
    virtualConsole.on('error', () => {})
    virtualConsole.on('warn', () => {})

    const dom = new JSDOM(html, {
      runScripts: 'outside-only',
      resources: 'usable',
      virtualConsole
    })

    const crawlResult = extractContent(dom.window.document, query)
    
    return {
      ...result,
      content: crawlResult.content,
      publishedDate: crawlResult.publishedDate,
      score: crawlResult.score
    }
  } catch (error) {
    console.error(`Error crawling ${result.url}:`, error)
    return null
  }
}

function extractContent(document: Document, query: string): CrawlResult {
  // Remove non-content elements
  document.querySelectorAll('script, style, nav, header, footer')
    .forEach(el => el.remove())

  const mainContent = document.querySelector('main') ||
    document.querySelector('article') ||
    document.querySelector('.content') ||
    document.querySelector('#content') ||
    document.body

  if (!mainContent) {
    return { content: '', score: 0 }
  }

  const extractedText = extractTextContent(mainContent)
  const metadata = extractMetadata(document)
  const score = calculateRelevanceScore(extractedText, query)

  return {
    content: highlightQueryTerms(extractedText, query),
    publishedDate: metadata.publishedDate,
    score
  }
}

function extractTextContent(element: Element): string {
  const priorityElements = element.querySelectorAll('h1, h2, h3, p')
  let extractedText = Array.from(priorityElements)
    .map(el => el.textContent?.trim())
    .filter(Boolean)
    .join('\n\n')

  if (extractedText.length < 500) {
    const contentElements = element.querySelectorAll(
      'h4, h5, h6, li, td, th, blockquote, pre, code'
    )
    extractedText += '\n\n' + Array.from(contentElements)
      .map(el => el.textContent?.trim())
      .filter(Boolean)
      .join('\n\n')
  }

  return extractedText.substring(0, 10000)
}

function extractMetadata(document: Document): { publishedDate?: string } {
  const dateSelectors = [
    'meta[name="article:published_time"]',
    'meta[property="article:published_time"]',
    'meta[name="publication-date"]',
    'meta[name="date"]',
    'time[datetime]',
    'time[pubdate]'
  ]

  for (const selector of dateSelectors) {
    const element = document.querySelector(selector)
    if (element) {
      const dateStr = element.getAttribute('content') ||
        element.getAttribute('datetime') ||
        element.getAttribute('pubdate')
      if (dateStr) {
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
          return { publishedDate: date.toISOString() }
        }
      }
    }
  }

  return {}
}

function calculateRelevanceScore(content: string, query: string): number {
  try {
    const lowercaseContent = content.toLowerCase()
    const lowercaseQuery = query.toLowerCase()
    const queryWords = lowercaseQuery
      .split(/\s+/)
      .filter(word => word.length > 2)
      .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

    let score = 0

    // Exact phrase match
    if (lowercaseContent.includes(lowercaseQuery)) {
      score += 30
    }

    // Individual word matches
    queryWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g')
      const wordCount = (lowercaseContent.match(regex) || []).length
      score += wordCount * 3
    })

    // Content length scoring
    if (content.length < 200) {
      score -= 10
    } else if (content.length > 1000) {
      score += 5
    }

    return score
  } catch (error) {
    return 0
  }
}

function highlightQueryTerms(content: string, query: string): string {
  try {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2)
      .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

    let highlightedContent = content

    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi')
      highlightedContent = highlightedContent.replace(
        regex,
        match => `<mark>${match}</mark>`
      )
    })

    return highlightedContent
  } catch (error) {
    return content
  }
} 