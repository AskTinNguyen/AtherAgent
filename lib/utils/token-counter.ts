import { Message } from 'ai'
import { encode as gptEncode } from 'gpt-tokenizer'

interface TokenCount {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

type ModelFamily = 'gpt' | 'claude' | 'deepseek' | 'gemini' | 'ollama'

export function getModelFamily(model: string): ModelFamily {
  if (model.includes('gpt')) return 'gpt'
  if (model.includes('claude')) return 'claude'
  if (model.includes('deepseek')) return 'deepseek'
  if (model.includes('gemini')) return 'gemini'
  if (model.includes('ollama')) return 'ollama'
  return 'gpt' // default to GPT tokenizer
}

export function countTokens(text: string, modelFamily: ModelFamily): number {
  // For now, we'll use GPT tokenizer for all models as a baseline
  // TODO: Add specific tokenizers for other model families
  return gptEncode(text).length
}

export function countMessageTokens(messages: Message[], model: string): TokenCount {
  const modelFamily = getModelFamily(model)
  let promptTokens = 0
  let completionTokens = 0

  messages.forEach(message => {
    const tokens = countTokens(message.content, modelFamily)
    if (message.role === 'assistant') {
      completionTokens += tokens
    } else {
      promptTokens += tokens
    }
  })

  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens
  }
}

export function estimateTokens(text: string, model: string): number {
  const modelFamily = getModelFamily(model)
  return countTokens(text, modelFamily)
} 