import { type SearchResultItem } from '@/types/search'
import { ResearchDiffSystem } from '../research-diff'

describe('ResearchDiffSystem', () => {
  let diffSystem: ResearchDiffSystem

  beforeEach(() => {
    diffSystem = new ResearchDiffSystem()
  })

  describe('compareResults', () => {
    const oldResults: SearchResultItem[] = [
      {
        url: 'https://example.com/1',
        title: 'Old Result 1',
        content: 'This is old content 1'
      },
      {
        url: 'https://example.com/2',
        title: 'Old Result 2',
        content: 'This is old content 2'
      }
    ]

    const newResults: SearchResultItem[] = [
      {
        url: 'https://example.com/1',
        title: 'Old Result 1',
        content: 'This is updated content 1'
      },
      {
        url: 'https://example.com/3',
        title: 'New Result',
        content: 'This is new content'
      }
    ]

    it('should correctly identify added, removed, and modified content', () => {
      const diff = diffSystem.compareResults(oldResults, newResults)

      expect(diff.added).toContain('This is new content')
      expect(diff.removed).toContain('This is old content 2')
      expect(diff.modified).toContainEqual({
        before: 'This is old content 1',
        after: 'This is updated content 1'
      })
    })

    it('should handle empty result sets', () => {
      const emptyDiff = diffSystem.compareResults([], [])
      expect(emptyDiff.added).toHaveLength(0)
      expect(emptyDiff.removed).toHaveLength(0)
      expect(emptyDiff.modified).toHaveLength(0)
      expect(emptyDiff.unchanged).toHaveLength(0)
    })
  })

  describe('trackChanges', () => {
    const results: SearchResultItem[] = [
      {
        url: 'https://example.com/1',
        title: 'Result 1',
        content: 'Content 1',
        depth: 1
      },
      {
        url: 'https://example.com/2',
        title: 'Result 2',
        content: 'Content 2',
        depth: 2
      }
    ]

    it('should track new insights correctly', () => {
      const metrics = diffSystem.trackChanges(results)
      expect(metrics.newInsights).toBe(2) // Both results are new
      expect(metrics.refinements).toBe(0)
      expect(metrics.validations).toBe(0)
    })

    it('should calculate depth progress', () => {
      // First set of results
      diffSystem.trackChanges(results)

      // Second set with higher depth
      const newResults = results.map(r => ({
        ...r,
        depth: (r.depth || 0) + 1
      }))
      const metrics = diffSystem.trackChanges(newResults)

      expect(metrics.depthProgress).toBeGreaterThan(0)
    })
  })

  describe('visualizeDiffs', () => {
    const diff = {
      added: ['New content'],
      removed: ['Old content'],
      modified: [{ before: 'Old version', after: 'New version' }],
      unchanged: ['Unchanged content']
    }

    it('should generate correct visualization data', () => {
      const visualization = diffSystem.visualizeDiffs(diff)

      expect(visualization.diffHighlights.newFindings).toHaveLength(1)
      expect(visualization.diffHighlights.refinements).toHaveLength(1)
      expect(visualization.diffHighlights.validations).toHaveLength(1)
    })

    it('should calculate confidence scores correctly', () => {
      const visualization = diffSystem.visualizeDiffs(diff)

      // Check confidence scores are between 0 and 1
      visualization.diffHighlights.newFindings.forEach(finding => {
        expect(finding.confidence).toBeGreaterThanOrEqual(0)
        expect(finding.confidence).toBeLessThanOrEqual(1)
      })
    })

    it('should include evolution metrics', () => {
      const visualization = diffSystem.visualizeDiffs(diff)

      expect(visualization.evolutionMetrics).toHaveProperty('depthProgress')
      expect(visualization.evolutionMetrics).toHaveProperty('qualityImprovement')
      expect(visualization.evolutionMetrics).toHaveProperty('sourceReliability')
    })
  })

  describe('private methods', () => {
    it('should calculate average depth correctly', () => {
      const results: SearchResultItem[] = [
        { url: 'url1', title: 'title1', content: 'content1', depth: 1 },
        { url: 'url2', title: 'title2', content: 'content2', depth: 2 }
      ]

      // @ts-ignore - Testing private method
      const avgDepth = diffSystem.calculateAverageDepth(results)
      expect(avgDepth).toBe(1.5)
    })

    it('should calculate confidence based on content', () => {
      const shortContent = 'Short content'
      const longContent = 'A'.repeat(1000)

      // @ts-ignore - Testing private method
      const shortConfidence = diffSystem.calculateConfidence(shortContent)
      // @ts-ignore - Testing private method
      const longConfidence = diffSystem.calculateConfidence(longContent)

      expect(shortConfidence).toBeLessThan(longConfidence)
    })
  })
}) 