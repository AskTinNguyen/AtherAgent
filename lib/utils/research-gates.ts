import { ResearchSource } from '@/components/deep-research-provider'
import { EnhancedResearchState, GateEvaluation, QualityGate } from '../types/research'
import { extractTopics, findMissingTopics, generateFeedback } from './research-analysis'
import { checkCrossValidation } from './research-depth'

// Define the quality gates with their criteria and evaluation logic
export const researchGates: QualityGate[] = [
  {
    gateNumber: 1,
    name: 'Initial Overview',
    criteria: {
      minSources: 3,
      minRelevanceScore: 0.6,
      requiredCoverage: ['overview', 'main_topics']
    },
    evaluator: async (state: EnhancedResearchState): Promise<GateEvaluation> => {
      const evaluation = await evaluateOverview(state)
      const hasRequiredCoverage = checkTopicCoverage(
        state.sources,
        evaluation.criteria.requiredCoverage || []
      )

      return {
        passed: evaluation.score >= 0.8 && hasRequiredCoverage,
        score: evaluation.score,
        feedback: generateFeedback(evaluation),
        decision: evaluation.score >= 0.8 && hasRequiredCoverage
          ? 'PROCEED_TO_DEEP_RESEARCH'
          : 'CONTINUE_OVERVIEW'
      }
    }
  },
  {
    gateNumber: 2,
    name: 'Deep Research',
    criteria: {
      minSourcesPerTopic: 2,
      crossValidation: true,
      depthScore: 0.7
    },
    evaluator: async (state: EnhancedResearchState): Promise<GateEvaluation> => {
      const evaluation = await evaluateDepth(state)
      const crossValidated = await checkCrossValidation(state.sources)
      const topicCoverage = await analyzeTopicCoverage(
        state.sources,
        state.researchProgress.remainingQuestions
      )

      const shouldContinue = shouldContinueResearch(evaluation, crossValidated, topicCoverage)

      return {
        passed: evaluation.score >= 0.7 && crossValidated && !shouldContinue,
        score: evaluation.score,
        feedback: generateDetailedFeedback({
          evaluation,
          crossValidated,
          topicCoverage
        }),
        decision: shouldContinue ? 'CONTINUE_RESEARCH' : 'PREPARE_REPORT'
      }
    }
  },
  {
    gateNumber: 3,
    name: 'Final Verification',
    criteria: {
      qualityThreshold: 0.8,
      crossValidation: true
    },
    evaluator: async (state: EnhancedResearchState): Promise<GateEvaluation> => {
      const evaluation = await evaluateFinal(state)
      const isComplete = evaluation.score >= 0.8 && 
        !evaluation.hasUnansweredQuestions &&
        evaluation.crossValidated

      return {
        passed: isComplete,
        score: evaluation.score,
        feedback: generateFinalFeedback(evaluation),
        decision: isComplete ? 'FINALIZE' : 'CONTINUE_RESEARCH'
      }
    }
  }
]

// Helper function to check topic coverage in sources
function checkTopicCoverage(
  sources: ResearchSource[],
  requiredTopics: string[]
): boolean {
  const coveredTopics = new Set(
    sources.flatMap(source => 
      extractTopics(source.content || '')
    )
  )
  
  return requiredTopics.every(topic =>
    coveredTopics.has(topic)
  )
}

// Helper to generate detailed feedback for gate evaluation
function generateDetailedFeedback({
  evaluation,
  crossValidated,
  topicCoverage
}: {
  evaluation: any,
  crossValidated: boolean,
  topicCoverage: any
}): string {
  const feedback = []
  
  feedback.push(`Overall quality score: ${evaluation.score}`)
  
  if (!crossValidated) {
    feedback.push('Some facts need additional verification')
  }
  
  const missingTopics = findMissingTopics(topicCoverage)
  if (missingTopics.length > 0) {
    feedback.push(`Missing coverage for: ${missingTopics.join(', ')}`)
  }
  
  return feedback.join('\n')
}

// Decision helper for continuing research
function shouldContinueResearch(
  evaluation: any,
  crossValidated: boolean,
  topicCoverage: any
): boolean {
  return (
    evaluation.score < 0.7 ||
    !crossValidated ||
    hasMissingTopics(topicCoverage) ||
    evaluation.hasUnansweredQuestions
  )
}

// Helper to evaluate overview phase
async function evaluateOverview(state: EnhancedResearchState): Promise<any> {
  // Implement overview evaluation logic
  const overviewScore = calculateOverviewScore(state)
  const coveredTopics = extractTopics(state.sources)
  
  return {
    score: overviewScore,
    coveredTopics,
    criteria: state.gateStatus.gateResults[1] || {}
  }
}

// Helper to evaluate deep research phase
async function evaluateDepth(state: EnhancedResearchState): Promise<any> {
  // Implement depth evaluation logic
  const depthScore = calculateDepthScore(state)
  const topicCoverage = await analyzeTopicCoverage(
    state.sources,
    state.researchProgress.remainingQuestions
  )
  
  return {
    score: depthScore,
    topicCoverage,
    hasUnansweredQuestions: state.researchProgress.remainingQuestions.length > 0
  }
}

// Helper to evaluate final phase
async function evaluateFinal(state: EnhancedResearchState): Promise<any> {
  // Implement final evaluation logic
  const finalScore = calculateFinalScore(state)
  const crossValidated = await checkCrossValidation(state.sources)
  
  return {
    score: finalScore,
    crossValidated,
    hasUnansweredQuestions: state.researchProgress.remainingQuestions.length > 0
  }
}

// Helper to calculate overview score
function calculateOverviewScore(state: EnhancedResearchState): number {
  const relevanceScores = state.sources.map(s => s.relevance)
  const avgRelevance = relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length
  
  const hasEnoughSources = state.sources.length >= 3
  const sourceQualityScore = hasEnoughSources ? 1 : state.sources.length / 3
  
  return (avgRelevance + sourceQualityScore) / 2
}

// Helper to calculate depth score
function calculateDepthScore(state: EnhancedResearchState): number {
  const sourceMetrics = state.sourceMetrics
  const depthScores = sourceMetrics.map(m => 
    (m.relevanceScore + m.contentQuality + m.sourceAuthority) / 3
  )
  
  return depthScores.reduce((a, b) => a + b, 0) / depthScores.length
}

// Helper to calculate final score
function calculateFinalScore(state: EnhancedResearchState): number {
  const sourceMetrics = state.sourceMetrics
  const qualityScores = sourceMetrics.map(m => 
    (m.relevanceScore + m.contentQuality + m.sourceAuthority + (m.crossValidation || 0)) / 4
  )
  
  return qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
}

// Helper to analyze topic coverage
async function analyzeTopicCoverage(
  sources: ResearchSource[],
  remainingQuestions: string[]
): Promise<any> {
  const coveredTopics = new Set(
    sources.flatMap(source => 
      extractTopics(source.content || '')
    )
  )
  
  const coverage = {
    coveredTopics: Array.from(coveredTopics),
    remainingQuestions,
    coverageScore: remainingQuestions.length === 0 ? 1 : 
      1 - (remainingQuestions.length / (coveredTopics.size + remainingQuestions.length))
  }
  
  return coverage
}

// Helper to check for missing topics
function hasMissingTopics(topicCoverage: any): boolean {
  return topicCoverage.remainingQuestions.length > 0
}

// Helper to generate final feedback
function generateFinalFeedback(evaluation: any): string {
  const feedback = []
  
  feedback.push(`Final quality score: ${evaluation.score}`)
  
  if (!evaluation.crossValidated) {
    feedback.push('Some information still needs cross-validation')
  }
  
  if (evaluation.hasUnansweredQuestions) {
    feedback.push('There are still unanswered questions remaining')
  }
  
  return feedback.join('\n')
} 