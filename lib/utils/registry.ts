import { anthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { deepseek } from '@ai-sdk/deepseek'
import { createFireworks, fireworks } from '@ai-sdk/fireworks'
import { google } from '@ai-sdk/google'
import { groq } from '@ai-sdk/groq'
import { createOpenAI, openai } from '@ai-sdk/openai'
import {
  experimental_createProviderRegistry as createProviderRegistry,
  extractReasoningMiddleware,
  wrapLanguageModel
} from 'ai'
import { createOllama } from 'ollama-ai-provider'

export const registry = createProviderRegistry({
  openai,
  anthropic,
  google,
  groq,
  ollama: createOllama({
    baseURL: `${process.env.OLLAMA_BASE_URL}/api`
  }),
  azure: createAzure({
    apiKey: process.env.AZURE_API_KEY,
    resourceName: process.env.AZURE_RESOURCE_NAME
  }),
  deepseek,
  fireworks: {
    ...createFireworks({
      apiKey: process.env.FIREWORKS_API_KEY
    }),
    languageModel: fireworks
  },
  'openai-compatible': createOpenAI({
    apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
    baseURL: process.env.OPENAI_COMPATIBLE_API_BASE_URL
  })
})

export function getModel(model: string) {
  const [provider, ...modelNameParts] = model.split(':') ?? []
  const modelName = modelNameParts.join(':')
  if (model.includes('ollama')) {
    const ollama = createOllama({
      baseURL: `${process.env.OLLAMA_BASE_URL}/api`
    })

    // if model is deepseek-r1, add reasoning middleware
    if (model.includes('deepseek-r1')) {
      return wrapLanguageModel({
        model: ollama(modelName),
        middleware: extractReasoningMiddleware({
          tagName: 'think'
        })
      })
    }

    // if ollama provider, set simulateStreaming to true
    return ollama(modelName, {
      simulateStreaming: true
    })
  }

  // if model is groq and includes deepseek-r1, add reasoning middleware
  if (model.includes('groq') && model.includes('deepseek-r1')) {
    return wrapLanguageModel({
      model: groq(modelName),
      middleware: extractReasoningMiddleware({
        tagName: 'think'
      })
    })
  }

  // if model is fireworks and includes deepseek-r1, add reasoning middleware
  if (model.includes('fireworks') && model.includes('deepseek-r1')) {
    return wrapLanguageModel({
      model: fireworks(modelName),
      middleware: extractReasoningMiddleware({
        tagName: 'think'
      })
    })
  }

  return registry.languageModel(model)
}

export function isProviderEnabled(providerId: string): boolean {
  switch (providerId) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY
    case 'google':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    case 'groq':
      return !!process.env.GROQ_API_KEY
    case 'ollama':
      return !!process.env.OLLAMA_BASE_URL
    case 'azure':
      return !!process.env.AZURE_API_KEY && !!process.env.AZURE_RESOURCE_NAME
    case 'deepseek':
      return !!process.env.DEEPSEEK_API_KEY
    case 'fireworks':
      return !!process.env.FIREWORKS_API_KEY
    case 'openai-compatible':
      return (
        !!process.env.OPENAI_COMPATIBLE_API_KEY &&
        !!process.env.OPENAI_COMPATIBLE_API_BASE_URL &&
        !!process.env.NEXT_PUBLIC_OPENAI_COMPATIBLE_MODEL
      )
    default:
      return false
  }
}

export function isToolCallSupported(model?: string) {
  const [provider, ...modelNameParts] = model?.split(':') ?? []
  const modelName = modelNameParts.join(':')

  if (provider === 'ollama') {
    return false
  }

  if (provider === 'google') {
    return true
  }

  // Enable tool calling for DeepSeek models except DeepSeek R1
  if (provider === 'deepseek') {
    return !modelName.includes('deepseek-r1')
  }

  return true
}

export function getToolCallModel(model?: string) {
  const [provider, ...modelNameParts] = model?.split(':') ?? []
  const modelName = modelNameParts.join(':')
  switch (provider) {
    case 'deepseek':
      // Use the same DeepSeek model for tool calling if it's not DeepSeek R1
      return modelName.includes('deepseek-r1') 
        ? getModel('deepseek:deepseek-chat')
        : getModel(`deepseek:${modelName}`)
    case 'fireworks':
      return getModel(
        'fireworks:accounts/fireworks/models/llama-v3p1-8b-instruct'
      )
    case 'groq':
      return getModel('groq:llama-3.1-8b-instant')
    case 'ollama':
      const ollamaModel =
        process.env.NEXT_PUBLIC_OLLAMA_TOOL_CALL_MODEL || modelName
      return getModel(`ollama:${ollamaModel}`)
    case 'google':
      return getModel(`google:${modelName}`)
    default:
      return getModel('openai:o3-mini')
  }
}

export function isReasoningModel(model: string): boolean {
  if (typeof model !== 'string') {
    return false
  }
  return (
    model.includes('deepseek-r1') ||
    model.includes('deepseek-reasoner') ||
    model.includes('o3-mini')
  )
}
