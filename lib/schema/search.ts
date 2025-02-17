import { z } from 'zod'

export const searchSchema = z.object({
  query: z.string().describe('The query to search for'),
  search_depth: z
    .enum(['basic', 'advanced'] as const)
    .describe('The depth of the search. Basic costs 1 credit, advanced costs 2 credits'),
  include_domains: z
    .array(z.string())
    .describe('A list of domains to specifically include in the search results'),
  exclude_domains: z
    .array(z.string())
    .describe('A list of domains to specifically exclude from the search results'),
  topic: z
    .enum(['news', 'general', 'research', 'code'] as const)
    .describe('The topic category for the search'),
  time_range: z
    .enum(['day', 'month', 'year', 'w'] as const)
    .describe('Time range for the search results'),
  include_answer: z
    .enum(['none', 'basic', 'advanced'] as const)
    .describe('Include an LLM-generated answer'),
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
    .optional()
    .describe('Number of days back from current date. Only available if topic is news. Must be > 0')
}).strict()

export const searchSchemaWithDefaults = searchSchema.extend({
  search_depth: z.enum(['basic', 'advanced'] as const).default('basic'),
  include_domains: z.array(z.string()).default([]),
  exclude_domains: z.array(z.string()).default([]),
  topic: z.enum(['news', 'general', 'research', 'code'] as const).default('general'),
  time_range: z.enum(['day', 'month', 'year', 'w'] as const).default('w'),
  include_answer: z.enum(['none', 'basic', 'advanced'] as const).default('none'),
  include_raw_content: z.boolean().default(false),
  include_images: z.boolean().default(true),
  include_image_descriptions: z.boolean().default(true),
  max_results: z.number().default(10)
}) 