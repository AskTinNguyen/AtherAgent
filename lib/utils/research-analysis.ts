import { ResearchSource } from '@/components/deep-research-provider'
import { calculateSourceMetrics } from './research-depth'

interface TopicAnalysis {
  topics: string[]
  confidence: number
  sources: string[]
}

interface CrossValidationResult {
  isValidated: boolean
  confidence: number
  supportingSources: string[]
  conflictingSources: string[]
}

// Enhanced topic extraction using TF-IDF and basic NLP techniques
export function extractTopics(content: string): string[] {
  // Basic implementation - in production this should use NLP
  const words = content.toLowerCase().split(/\W+/)
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after'
  ])
  
  // Calculate word frequencies
  const frequencies = new Map<string, number>()
  words.forEach(word => {
    if (word.length > 2 && !stopWords.has(word)) {
      frequencies.set(word, (frequencies.get(word) || 0) + 1)
    }
  })
  
  // Calculate TF-IDF scores
  const totalWords = words.length
  const scores = Array.from(frequencies.entries()).map(([word, freq]) => ({
    word,
    score: (freq / totalWords) * Math.log(totalWords / freq)
  }))
  
  // Return top scoring words as topics
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(item => item.word)
}

// Find topics that are missing from coverage
export function findMissingTopics(topicCoverage: {
  coveredTopics: string[],
  remainingQuestions: string[]
}): string[] {
  const { coveredTopics, remainingQuestions } = topicCoverage
  const coveredSet = new Set(coveredTopics.map(t => t.toLowerCase()))
  
  // Extract potential topics from questions
  const questionTopics = remainingQuestions.flatMap(q => 
    extractTopics(q)
  )
  
  // Return topics from questions that aren't covered
  return Array.from(new Set(
    questionTopics.filter(topic => !coveredSet.has(topic.toLowerCase()))
  ))
}

// Generate feedback for evaluation results
export function generateFeedback(evaluation: {
  score: number,
  coveredTopics: string[],
  criteria: any
}): string {
  const feedback = []
  
  feedback.push(`Overview quality score: ${evaluation.score.toFixed(2)}`)
  
  if (evaluation.coveredTopics.length > 0) {
    feedback.push(`Topics covered: ${evaluation.coveredTopics.join(', ')}`)
  }
  
  if (evaluation.score < 0.8) {
    feedback.push('Areas for improvement:')
    if (evaluation.score < 0.6) {
      feedback.push('- Need more comprehensive coverage of topics')
    }
    if (evaluation.coveredTopics.length < 5) {
      feedback.push('- Consider exploring additional related topics')
    }
    if (!evaluation.criteria?.crossValidation) {
      feedback.push('- Additional source validation recommended')
    }
  }
  
  return feedback.join('\n')
}

// Extract topics from a collection of sources with confidence scores
export function extractTopicsFromSources(sources: ResearchSource[]): TopicAnalysis[] {
  const topicMap = new Map<string, Set<string>>()
  
  // Extract topics from each source
  sources.forEach(source => {
    if (!source.content) return
    
    const sourceTopics = extractTopics(source.content)
    sourceTopics.forEach(topic => {
      const sources = topicMap.get(topic) || new Set()
      sources.add(source.url)
      topicMap.set(topic, sources)
    })
  })
  
  // Calculate confidence based on source coverage
  return Array.from(topicMap.entries())
    .map(([topic, sourcesSet]) => ({
      topics: [topic],
      confidence: sourcesSet.size / sources.length,
      sources: Array.from(sourcesSet)
    }))
    .sort((a, b) => b.confidence - a.confidence)
}

// Enhanced cross-validation logic
export function validateTopicAcrossSources(
  topic: string,
  sources: ResearchSource[]
): CrossValidationResult {
  const validationResult: CrossValidationResult = {
    isValidated: false,
    confidence: 0,
    supportingSources: [],
    conflictingSources: []
  }
  
  // Get relevant sources for the topic
  const relevantSources = sources.filter(source => {
    if (!source.content) return false
    const topics = extractTopics(source.content)
    return topics.includes(topic)
  })
  
  if (relevantSources.length < 2) {
    return validationResult
  }
  
  // Calculate source metrics for validation
  const sourceMetrics = relevantSources.map(source => ({
    url: source.url,
    metrics: calculateSourceMetrics(
      source.content || '',
      topic,
      source.url,
      source.publishedDate
    )
  }))
  
  // Analyze agreement between sources
  sourceMetrics.forEach(({ url, metrics }) => {
    if (metrics.relevanceScore > 0.6 && metrics.contentQuality > 0.5) {
      validationResult.supportingSources.push(url)
    } else {
      validationResult.conflictingSources.push(url)
    }
  })
  
  // Calculate overall confidence
  const totalSources = sourceMetrics.length
  const supportingRatio = validationResult.supportingSources.length / totalSources
  
  validationResult.isValidated = supportingRatio >= 0.7
  validationResult.confidence = supportingRatio
  
  return validationResult
}

// Helper function to analyze semantic similarity between texts
function calculateSemanticSimilarity(text1: string, text2: string): number {
  // Basic implementation - in production this should use proper NLP/embeddings
  const words1 = new Set(text1.toLowerCase().split(/\W+/))
  const words2 = new Set(text2.toLowerCase().split(/\W+/))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
} 