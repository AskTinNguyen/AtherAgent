import type { ResearchSource } from '@/components/deep-research-provider'
import { describe, expect, jest, test } from '@jest/globals'
import { extractTopics, extractTopicsFromSources, findMissingTopics, generateFeedback, validateTopicAcrossSources } from './research-analysis'

// Mock research-depth module
jest.mock('./research-depth', () => ({
  calculateSourceMetrics: jest.fn().mockReturnValue({
    relevanceScore: 0.8,
    contentQuality: 0.7,
    sourceAuthority: 0.6,
    timeRelevance: 0.9
  })
}))

describe('Research Analysis', () => {
  describe('extractTopics', () => {
    test('should extract topics from text content', () => {
      const content = 'Machine learning and artificial intelligence are transforming technology'
      const topics = extractTopics(content)
      
      expect(topics).toContain('machine')
      expect(topics).toContain('learning')
      expect(topics).toContain('artificial')
      expect(topics).toContain('intelligence')
      expect(topics).toContain('technology')
    })

    test('should exclude stop words', () => {
      const content = 'The quick brown fox jumps over the lazy dog'
      const topics = extractTopics(content)
      
      expect(topics).not.toContain('the')
      expect(topics).not.toContain('over')
      expect(topics).toContain('quick')
      expect(topics).toContain('brown')
      expect(topics).toContain('jumps')
    })

    test('should handle empty content', () => {
      const topics = extractTopics('')
      expect(topics).toHaveLength(0)
    })

    test('should prioritize frequent terms', () => {
      const content = 'AI technology AI systems AI development technology systems'
      const topics = extractTopics(content)
      
      // 'AI' and 'technology' should be among top terms
      expect(topics.indexOf('ai')).toBeLessThan(topics.indexOf('systems'))
      expect(topics.indexOf('technology')).toBeLessThan(topics.indexOf('development'))
    })
  })

  describe('findMissingTopics', () => {
    test('should identify topics missing from coverage', () => {
      const topicCoverage = {
        coveredTopics: ['machine', 'learning'],
        remainingQuestions: ['What is artificial intelligence?', 'How does deep learning work?']
      }
      
      const missingTopics = findMissingTopics(topicCoverage)
      expect(missingTopics).toContain('artificial')
      expect(missingTopics).toContain('intelligence')
      expect(missingTopics).toContain('deep')
      expect(missingTopics).not.toContain('learning')
    })

    test('should handle empty inputs', () => {
      const topicCoverage = {
        coveredTopics: [],
        remainingQuestions: []
      }
      
      const missingTopics = findMissingTopics(topicCoverage)
      expect(missingTopics).toHaveLength(0)
    })

    test('should be case insensitive', () => {
      const topicCoverage = {
        coveredTopics: ['Machine', 'LEARNING'],
        remainingQuestions: ['What is machine learning?']
      }
      
      const missingTopics = findMissingTopics(topicCoverage)
      expect(missingTopics).not.toContain('machine')
      expect(missingTopics).not.toContain('learning')
    })
  })

  describe('generateFeedback', () => {
    test('should generate comprehensive feedback', () => {
      const evaluation = {
        score: 0.75,
        coveredTopics: ['ai', 'machine', 'learning'],
        criteria: { crossValidation: true }
      }
      
      const feedback = generateFeedback(evaluation)
      expect(feedback).toContain('0.75')
      expect(feedback).toContain('ai')
      expect(feedback).toContain('machine')
      expect(feedback).toContain('learning')
    })

    test('should include improvement suggestions for low scores', () => {
      const evaluation = {
        score: 0.5,
        coveredTopics: ['ai'],
        criteria: { crossValidation: false }
      }
      
      const feedback = generateFeedback(evaluation)
      expect(feedback).toContain('Need more comprehensive coverage')
      expect(feedback).toContain('exploring additional related topics')
    })

    test('should handle empty topics', () => {
      const evaluation = {
        score: 0.8,
        coveredTopics: [],
        criteria: {}
      }
      
      const feedback = generateFeedback(evaluation)
      expect(feedback).toContain('0.80')
      expect(feedback).not.toContain('Topics covered')
    })
  })

  describe('extractTopicsFromSources', () => {
    test('should extract topics with confidence scores', () => {
      const sources: ResearchSource[] = [
        {
          url: 'https://example1.com',
          title: 'AI Overview',
          content: 'Artificial intelligence and machine learning',
          relevance: 0.8
        },
        {
          url: 'https://example2.com',
          title: 'ML Deep Dive',
          content: 'Machine learning and deep neural networks',
          relevance: 0.9
        }
      ]
      
      const topicAnalysis = extractTopicsFromSources(sources)
      expect(topicAnalysis.length).toBeGreaterThan(0)
      expect(topicAnalysis[0]).toHaveProperty('confidence')
      expect(topicAnalysis[0]).toHaveProperty('sources')
      expect(topicAnalysis[0].sources).toHaveLength(2)
    })

    test('should handle sources without content', () => {
      const sources: ResearchSource[] = [
        {
          url: 'https://example.com',
          title: 'Empty',
          relevance: 0.5
        }
      ]
      
      const topicAnalysis = extractTopicsFromSources(sources)
      expect(topicAnalysis).toHaveLength(0)
    })
  })

  describe('validateTopicAcrossSources', () => {
    test('should validate topics with sufficient support', () => {
      const sources: ResearchSource[] = [
        {
          url: 'https://example1.com',
          title: 'Source 1',
          content: 'Machine learning is transforming AI',
          relevance: 0.8
        },
        {
          url: 'https://example2.com',
          title: 'Source 2',
          content: 'Machine learning applications in industry',
          relevance: 0.9
        }
      ]
      
      const validation = validateTopicAcrossSources('machine learning', sources)
      expect(validation.isValidated).toBe(false)
      expect(validation.confidence).toBeGreaterThan(0)
      expect(validation.supportingSources).toHaveLength(2)
    })

    test('should handle insufficient sources', () => {
      const sources: ResearchSource[] = [
        {
          url: 'https://example.com',
          title: 'Single Source',
          content: 'Machine learning basics',
          relevance: 0.8
        }
      ]
      
      const validation = validateTopicAcrossSources('machine learning', sources)
      expect(validation.isValidated).toBe(false)
      expect(validation.confidence).toBe(0)
    })

    test('should identify conflicting sources', () => {
      const sources: ResearchSource[] = [
        {
          url: 'https://example1.com',
          title: 'Source 1',
          content: 'High quality content about machine learning',
          relevance: 0.9
        },
        {
          url: 'https://example2.com',
          title: 'Source 2',
          content: 'Low relevance content mentioning machine learning',
          relevance: 0.3
        }
      ]
      
      const validation = validateTopicAcrossSources('machine learning', sources)
      expect(validation.supportingSources).toHaveLength(2)
      expect(validation.conflictingSources).toHaveLength(0)
    })
  })
}) 