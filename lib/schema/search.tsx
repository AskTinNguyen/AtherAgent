import { DeepPartial } from 'ai'
import { z } from 'zod'

// Base schema without defaults for OpenAI compatibility
export const searchSchema = z.object({
  query: z.string().describe('The query to search for'),
  search_depth: z
    .enum(['basic', 'advanced'])
    .describe('The depth of the search. Basic costs 1 credit, advanced costs 2 credits'),
  include_domains: z
    .array(z.string())
    .describe(
      'A list of domains to specifically include in the search results'),
  exclude_domains: z
    .array(z.string())
    .describe(
      'A list of domains to specifically exclude from the search results'),
  topic: z
    .enum(['news', 'general'])
    .describe('The topic category for the search'),
  time_range: z
    .enum(['day', 'week', 'month', 'year', 'd', 'w', 'm', 'y'])
    .describe('Time range for the search results'),
  include_answer: z
    .union([z.boolean(), z.enum(['basic', 'advanced'])])
    .describe('Include an LLM-generated answer. basic/true returns quick answer, advanced returns detailed answer'),
  include_raw_content: z
    .boolean()
    .describe('Include the cleaned and parsed HTML content of each result'),
  include_images: z
    .boolean()
    .describe('Also perform an image search and include the results'),
  include_image_descriptions: z
    .boolean()
    .describe('When include_images is true, add descriptive text for each image'),
  max_results: z
    .number()
    .describe('Maximum number of results to return (range: 1-20)'),
  days: z
    .number()
    .describe('Number of days back from current date. Only available if topic is news. Must be > 0')
}).strict()

// Extended schema with defaults for internal use
export const searchSchemaWithDefaults = searchSchema.extend({
  max_results: z.number().min(1).max(20).default(10),
  search_depth: z.enum(['basic', 'advanced']).default('basic'),
  topic: z.enum(['news', 'general']).default('general'),
  time_range: z.enum(['day', 'week', 'month', 'year', 'd', 'w', 'm', 'y']).default('w'),
  include_answer: z.union([z.boolean(), z.enum(['basic', 'advanced'])]).default('basic'),
  include_raw_content: z.boolean().default(false),
  include_images: z.boolean().default(true),
  include_image_descriptions: z.boolean().default(true),
  include_domains: z.array(z.string()).default([]),
  exclude_domains: z.array(z.string()).default([]),
  days: z.number().min(1).default(3)
}).strict()

export type PartialInquiry = DeepPartial<typeof searchSchema>
