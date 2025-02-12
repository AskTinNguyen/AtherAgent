import { DeepPartial } from 'ai'
import { z } from 'zod'

// Base schema without defaults for OpenAI compatibility
export const searchSchema = z.object({
  query: z.string().describe('The query to search for'),
  max_results: z
    .number()
    .describe('The maximum number of results to return'),
  search_depth: z
    .enum(['basic', 'advanced'])
    .describe('The depth of the search. Allowed values are "basic" or "advanced"'),
  include_domains: z
    .array(z.string())
    .describe(
      'A list of domains to specifically include in the search results'
    ),
  exclude_domains: z
    .array(z.string())
    .describe(
      'A list of domains to specifically exclude from the search results'
    )
}).strict()

// Extended schema with defaults for internal use
export const searchSchemaWithDefaults = searchSchema.extend({
  max_results: z.number().default(10),
  search_depth: z.enum(['basic', 'advanced']).default('basic'),
  include_domains: z.array(z.string()).default([]),
  exclude_domains: z.array(z.string()).default([])
})

export type PartialInquiry = DeepPartial<typeof searchSchema>
