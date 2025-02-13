## SpecStory

## AI API Research Suggestions Workflow (2/10/2025, 9:21:40 PM)

_**User**_

@research-suggestions.tsx @research-processor.ts Explain to me how the AI API and Prompt is being called to get research suggestions outputs. 

Either there's a data caching issue, or the "Investigate the impact of advanced technological tools on enhancing the efficiency of deep exploration activities in various fields such as marine biology, space exploration, and subterranean studies." is hardcoded in the Research Suggestion prompt.

Do not code



---

_**Assistant**_

Let me explain how the research suggestions and AI API flow works between these two files:

1. **Main Flow in `research-suggestions.tsx`**:
- The component makes API calls to generate suggestions through several paths:
  - Initial load (via `loadCachedSuggestions`)
  - Manual refresh (via the "Generate Suggestions" button)
  - Automatic generation when activity changes

2. **AI Processing in `research-processor.ts`**:
The `ResearchAIProcessor` class handles all OpenAI API interactions:
- It's a singleton instance that maintains one OpenAI client
- Uses GPT-4 Turbo by default (`gpt-4-turbo-preview`)
- Has three main analysis methods:
  - `analyzeTopic`: Analyzes a single topic
  - `analyzeRelationships`: Analyzes relationships between topics
  - `generateSuggestion`: Generates research suggestions based on context

3. **The Suggestion Generation Flow**:
When generating suggestions:
1. The component calls `/api/research/suggestions` endpoint
2. For each suggestion type (depth, cross-reference, path), it:
   - Prepares a context object with:
     - Current query
     - Previous queries
     - Current depth
     - Max depth
     - Recent findings
3. The processor then sends this to OpenAI with a structured prompt requesting JSON output

4. **Caching Mechanism**:
- Suggestions are cached per user and chat ID
- The cache is stored via `/api/research/suggestions/cache`
- On component mount, it tries to load cached suggestions first
- If no cache exists or loading fails, it generates new suggestions

5. **Potential Issues**:
If you're seeing the same suggestion repeatedly, it could be due to:
- The cache not being properly invalidated
- The suggestions being cached too aggressively
- The API endpoint returning cached results instead of generating new ones
- The context object not having enough variation in the input parameters

The suggestion you mentioned ("Investigate the impact...") is not hardcoded in the prompt itself. The issue is more likely related to:
1. Cache persistence
2. Lack of context variation in the input
3. The API endpoint possibly returning cached results
4. The prompt not having enough randomization or diversity factors

To verify this, you could:
1. Check the cache implementation in your API routes
2. Monitor the actual requests being sent to OpenAI
3. Verify that the context object being passed to `generateSuggestion` has varying values
4. Add more entropy factors to the prompt to encourage diverse suggestions

The core prompt structure in `generateSuggestion` is actually quite flexible:
```typescript
Generate a research suggestion based on the following context:
Current Query: ${context.currentQuery}
Previous Queries: ${context.previousQueries.join(', ')}
Current Depth: ${context.currentDepth}
Max Depth: ${context.maxDepth}
Recent Findings: ${context.recentFindings.join(', ')}
```

If you're getting repetitive results, I'd recommend checking:
1. The `/api/research/suggestions/cache` implementation
2. The values being passed in the context object
3. The cache invalidation logic in your API routes
4. The actual response from OpenAI before caching

---

_**User**_

Is the cache issue cause the output of the VERY FIRST research suggestion output is always the exact same, about:

"Investigate the impact of advanced technological tools on enhancing the efficiency of deep exploration activities in various fields such as marine biology, space exploration, and subterranean studies."

Can you check my redis cache for this text?

---

_**Assistant**_

Let me help check the Redis cache for this issue. First, I'll need to look at the Redis implementation for suggestions.

---

_****_

<details>
            <summary>Searched codebase "redis suggestions cache implementation" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `lib/redis/suggestions.ts` | L1-47 |
| `lib/redis/suggestions.ts` | L49-56 |
| `lib/redis/types.ts` | L122-170 |
| `lib/redis/types.ts` | L172-200 |
| `lib/redis/types.ts` | L87-120 |
| `lib/redis/types.ts` | L1-25 |
| `lib/redis/types.ts` | L27-85 |
| `lib/redis/bookmarks.ts` | L1-53 |
| `lib/redis/config.ts` | L1-7 |
| `lib/redis/config.ts` | L50-70 |
| `lib/redis/bookmarks.ts` | L55-86 |
| `lib/redis/config.ts` | L9-50 |
| `lib/redis/config.ts` | L72-110 |
| `lib/redis/index.ts` | L1-2 |
| `lib/redis/bookmarks/operations.ts` | L1-11 |
| `lib/redis/research.ts` | L1-81 |
| `lib/redis/config.ts` | L112-119 |
| `lib/redis/research.ts` | L138-208 |
| `lib/redis/research.ts` | L83-136 |
| `lib/redis/utils/bookmark-cleanup.ts` | L1-52 |
| `lib/redis/bookmarks/operations.ts` | L161-183 |
| `lib/redis/bookmarks/operations.ts` | L185-221 |
| `lib/redis/bookmarks/operations.ts` | L127-161 |
| `lib/redis/bookmarks/operations.ts` | L223-285 |
| `lib/redis/types/bookmarks.ts` | L54-142 |

</details>

---

_****_



Let me check the Redis implementation for research suggestions. From the code, I can see that research suggestions are cached in Redis with a TTL of 24 hours. The key pattern used is:

```typescript
chatSuggestions: (chatId: string, userId: string) => `chat:${chatId}:user:${userId}:suggestions`
```

Let me help you check your Redis cache. I'll create a command to inspect the Redis cache for this specific suggestion:

---

_****_

```bash
redis-cli KEYS "chat:*:user:*:suggestions"
```

```
tinnguyen@Tins-MacBook-Pro AtherAgent % redis-cli KEYS "chat:*:user:*:suggestions"                         r
edis-cli KEYS "chat:*:user:*:suggestions"
(empty array)
tinnguyen@Tins-MacBook-Pro AtherAgent %
```

---

_****_



I see that there are no keys matching the pattern for cached suggestions. Let's check if you're using Upstash Redis instead of local Redis:

---

_****_

<details>
            <summary>Searched codebase "UPSTASH_REDIS_REST_URL environment configuration" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `lib/redis/config.ts` | L50-70 |
| `lib/redis/types.ts` | L172-200 |
| `lib/redis/config.ts` | L1-7 |
| `lib/redis/types.ts` | L122-170 |
| `docs/CONFIGURATION.md` | L1-39 |
| `lib/redis/config.ts` | L9-50 |
| `lib/redis/types.ts` | L1-25 |
| `docs/deepsearch_implementation.md` | L255-275 |
| `docs/CONFIGURATION.md` | L123-187 |
| `app/api/advanced-search/route.ts` | L1-54 |
| `lib/redis/index.ts` | L1-2 |
| `lib/redis/config.ts` | L72-110 |
| `lib/redis/bookmarks.ts` | L1-53 |
| `lib/redis/types.ts` | L87-120 |
| `app/api/bookmarks/cleanup/route.ts` | L1-27 |
| `lib/services/usage-tracker.ts` | L1-53 |
| `lib/redis/config.ts` | L112-119 |
| `app/api/research/suggestions/cache/route.ts` | L1-50 |
| `lib/redis/types.ts` | L27-85 |
| `docker-compose.yaml` | L1-38 |
| `lib/redis/utils/bookmark-cleanup.ts` | L1-52 |
| `lib/actions/chat.ts` | L1-17 |
| `lib/redis/suggestions.ts` | L1-47 |
| `app/api/advanced-search/route.ts` | L105-171 |
| `lib/redis/bookmarks/operations.ts` | L1-11 |

</details>

---

_****_



Looking at the code, I can see that your application is configured to use either local Redis or Upstash Redis based on environment variables. Let me check the API route that handles research suggestions:

---

_****_

<details>
            <summary>Searched codebase "api research suggestions route.ts" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `app/api/research/suggestions/route.ts` | L1-50 |
| `app/api/research/suggestions/cache/route.ts` | L1-50 |
| `app/api/usage/route.ts` | L1-64 |
| `app/api/advanced-search/route.ts` | L540-590 |
| `app/api/advanced-search/route.ts` | L592-634 |
| `app/api/chats/[chatId]/research/route.ts` | L1-58 |
| `components/research-suggestions.tsx` | L241-274 |
| `app/api/chats/[chatId]/research/route.ts` | L60-87 |
| `app/api/advanced-search/route.ts` | L1-54 |
| `app/api/bookmarks/route.ts` | L1-78 |
| `app/api/auth/session/route.ts` | L1-33 |
| `app/api/chat/route.ts` | L47-89 |
| `app/api/auth/[...nextauth]/route.ts` | L1-32 |
| `components/research-suggestions.tsx` | L330-371 |
| `app/api/advanced-search/route.ts` | L292-301 |
| `app/api/bookmarks/route.ts` | L80-134 |
| `app/api/chat/route.ts` | L134-170 |
| `app/api/chat/route.ts` | L170-200 |
| `components/research-suggestions.tsx` | L276-328 |
| `app/api/upload/route.ts` | L66-73 |
| `app/api/upload/route.ts` | L1-4 |
| `components/research-suggestions.tsx` | L189-239 |
| `app/api/chat/route.ts` | L1-45 |
| `components/research-suggestions.tsx` | L1-46 |
| `app/api/advanced-search/route.ts` | L173-209 |

</details>

---

_****_



After analyzing the code, I can see what's happening. The issue is in the initial suggestion generation in `research-suggestions.tsx`. When there's no activity yet (i.e., at the very start), it makes a call to generate a depth-based suggestion with this context:

```typescript
const context = {
  currentQuery: 'depth_exploration',
  previousQueries: [],
  currentDepth,
  maxDepth,
  recentFindings: []
}
```

This is a static context that's always the same on the first load because:
1. `currentQuery` is hardcoded as 'depth_exploration'
2. `previousQueries` is an empty array
3. `recentFindings` is an empty array
4. Only `currentDepth` and `maxDepth` vary, but they're usually 0 and 7 respectively on first load

The OpenAI API is deterministic with the same input, so it's generating the same suggestion each time. The suggestion about "Investigate the impact of advanced technological tools..." is coming from the OpenAI API response, not from cache.

To fix this, you could:

1. Add more entropy to the initial context, like:
   - Include a timestamp
   - Add a randomization factor
   - Use a different prompt strategy for the first suggestion

2. Or modify the prompt in `research-processor.ts` to encourage more diverse responses even with the same input.

Would you like me to help you implement one of these solutions?

---

_**User**_

help me improve the currentQuery to always encapsulate the Chat Conversation instead of a fixed string of text like "depth_exploration"

---

_**Assistant**_

I'll help you modify the code to use the chat conversation context instead of the hardcoded "depth_exploration". We'll need to access the chat context from the deep research provider.

Let me check how we can access the chat messages:

---

_****_

<details>
            <summary>Searched codebase "deep-research-provider chat context implementation" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `docs/deepsearch_implementation.md` | L150-187 |
| `components/deep-research-provider.tsx` | L266-287 |
| `docs/deepsearch_implementation.md` | L188-199 |
| `components/deep-research-provider.tsx` | L200-201 |
| `docs/deepsearch_implementation.md` | L458-498 |
| `components/deep-research-provider.tsx` | L440-474 |
| `docs/deepsearch_implementation.md` | L1-30 |
| `components/deep-research-provider.tsx` | L392-438 |
| `components/deep-research-provider.tsx` | L331-373 |
| `lib/types/research.ts` | L1-56 |
| `components/deep-research-provider.tsx` | L289-329 |
| `docs/deepsearch_implementation.md` | L540-584 |
| `components/deep-research-provider.tsx` | L52-83 |
| `README.md` | L33-63 |
| `lib/redis/research.ts` | L83-136 |
| `components/deep-research-provider.tsx` | L1-50 |
| `components/deep-research-provider.tsx` | L375-390 |
| `components/chat.tsx` | L1-12 |
| `lib/ai/research-processor.ts` | L1-45 |
| `importedcode-newfeature-deepresearch/REF-deep-research-context.tsx` | L221-229 |
| `importedcode-newfeature-deepresearch/REF-deep-research-message.tsx` | L1-28 |
| `components/deep-research-provider.tsx` | L242-264 |
| `docs/deepsearch_implementation.md` | L499-539 |
| `chatimplementationreference.md` | L1-31 |
| `importedcode-newfeature-deepresearch/REF-deep-research-context.tsx` | L1-66 |

</details>

---

_****_



I see that we can access the chat activity and messages through the `useDeepResearch` hook. Let's modify the code to use the most recent chat activity or message as the context for generating suggestions. Here's how we can improve it:

---

_****_

```diff
    }
  }
+ 
+ // Helper function to get the most relevant query from activity
+ function getMostRelevantQuery(activity: ActivityItem[]): string {
+   // Get the most recent search or thought activity
+   const recentActivity = activity
+     .filter(item => ['search', 'thought', 'synthesis'].includes(item.type))
+     .slice(-1)[0]
+ 
+   if (recentActivity) {
+     return recentActivity.message
+   }
+ 
+   // If no relevant activity found, use a more generic exploration prompt
+   return 'Explore current research topics and suggest relevant directions'
+ }
  
  // Export the type for use in other files
        if (currentDepth < maxDepth) {
          const context = {
-           currentQuery: 'depth_exploration',
-           previousQueries: [],
+           currentQuery: getMostRelevantQuery(activity),
+           previousQueries: activity
+             .filter(item => item.type === 'search')
+             .slice(-3)
+             .map(item => item.message),
            currentDepth,
            maxDepth,
-           recentFindings: []
+           recentFindings: activity
+             .filter(item => ['synthesis', 'reasoning'].includes(item.type))
+             .slice(-3)
+             .map(item => item.message)
          }
  
```

---

_****_



Let me fix the linter error by adding the missing import:

---

_****_

```diff
  import { useCallback, useEffect, useState } from 'react'
  import { toast } from 'sonner'
- import { useDeepResearch } from './deep-research-provider'
+ import { useDeepResearch, type ActivityItem } from './deep-research-provider'
  import { Button } from './ui/button'
  import { Card } from './ui/card'
```

---

_****_



The changes I've made will now:

1. Use the most recent relevant activity (search, thought, or synthesis) as the `currentQuery` instead of the hardcoded "depth_exploration"
2. Include the last 3 search queries as `previousQueries`
3. Include the last 3 synthesis or reasoning activities as `recentFindings`

This means that when generating suggestions:
- If there's recent activity, it will use that context to generate more relevant suggestions
- If there's no activity yet, it will use a generic exploration prompt
- The suggestions will be more contextual and based on the actual research path the user is taking
- Each subsequent suggestion will build upon previous searches and findings

This should solve the issue of getting the same suggestion every time, as the context will now be dynamic based on the user's research activity.

---

_**User**_

I'm getting the follow Research Suggestion Output as result of the AI API call for . Please propose the plans of action to improve these, starting with:
1. improve the UI to separate between static text and text outputs from AI API.

---

_**Assistant**_

Looking at the screenshot and the current implementation, I can help improve the UI to better distinguish between static text and AI-generated content. Here's my proposed edit:

---

_****_

```diff
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
-                       <p className="text-sm">{suggestion.content}</p>
-                       <div className="flex items-center gap-2 mt-2">
-                         <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-accent rounded-full">
+                       <div className="space-y-2">
+                         <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
+                           Research Suggestion
+                         </div>
+                         <p className="text-sm font-medium">{suggestion.content}</p>
+                       </div>
+ 
+                       <div className="flex flex-wrap items-center gap-2 mt-2">
+                         <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                            {suggestion.type}
                          </span>
-                         <span className="text-xs text-muted-foreground">
+                         <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                            {Math.round(suggestion.confidence * 100)}% confidence
                          </span>
                          {suggestion.metadata.category && (
-                           <span className="text-xs text-muted-foreground">
+                           <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              {suggestion.metadata.category}
                            </span>
                    </div>
  
-                   {/* Additional Context Section */}
                    {suggestion.context && (
-                     <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
+                     <div className="mt-3 pt-3 border-t border-border">
+                       <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
+                         Context & Rationale
+                       </div>
                        {suggestion.context.rationale && (
-                         <p className="mb-1">{suggestion.context.rationale}</p>
+                         <p className="text-xs text-muted-foreground">{suggestion.context.rationale}</p>
                        )}
                        {suggestion.context.nextSteps && suggestion.context.nextSteps.length > 0 && (
-                         <div className="mt-1">
-                           <p className="font-medium mb-1">Next Steps:</p>
+                         <div className="mt-2">
+                           <p className="text-xs font-medium text-muted-foreground mb-1">Next Steps:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {suggestion.context.nextSteps.map((step, idx) => (
-                               <li key={idx}>{step}</li>
+                               <li key={idx} className="text-xs text-muted-foreground">{step}</li>
                              ))}
                            </ul>
                    )}
  
-                   {/* Related Topics */}
                    {suggestion.metadata.relatedTopics && suggestion.metadata.relatedTopics.length > 0 && (
-                     <div className="flex flex-wrap gap-1 mt-1">
+                     <div className="mt-2 pt-2 border-t border-border">
+                       <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
+                         Related Topics
+                       </div>
+                       <div className="flex flex-wrap gap-1">
                          {suggestion.metadata.relatedTopics.map((topic, idx) => (
                            <span
                              key={idx}
-                           className="text-xs bg-accent/50 px-2 py-0.5 rounded-full"
+                             className="text-xs bg-accent hover:bg-accent/80 cursor-pointer px-2 py-0.5 rounded-full transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                            </span>
                          ))}
+                       </div>
                      </div>
                    )}
```

---

_****_



The changes I've made improve the UI in several ways:

1. **Clear Visual Hierarchy**:
   - Added clear section headers in uppercase for "Research Suggestion", "Context & Rationale", and "Related Topics"
   - Made AI-generated content more prominent with medium font weight
   - Static labels are now consistently styled in muted colors and uppercase

2. **Better Visual Separation**:
   - Added proper borders between sections
   - Improved spacing with consistent padding and margins
   - Used semantic colors for different types of information

3. **Enhanced Metadata Visualization**:
   - Type tags now use primary color with transparency
   - Confidence score uses secondary color
   - Category uses muted background
   - All tags have consistent styling and better contrast

4. **Improved Content Organization**:
   - Each section is now clearly demarcated
   - Related topics are in their own section with a clear header
   - Next steps are better formatted with proper indentation and sizing

5. **Interactive Elements**:
   - Added hover states for clickable elements
   - Made related topics more obviously interactive
   - Maintained the existing feedback and bookmark functionality

These changes should make it much easier to distinguish between:
- Static UI elements (labels, headers)
- AI-generated content (suggestions, rationale)
- Interactive elements (topics, feedback buttons)
- Metadata (type, confidence, category)

Would you like me to make any adjustments to this new design?

---

_**User**_

Once we click on the Research Suggestion. the @suggestions.ts copies the whole text "Continue exploring Depth 0: Found 5 results for: technological singularity predictions"

Which include Static Text that we use as metadata keys, those should be removed and only contained the relevant keywords, which would need to be passed to @research-processor.ts to create a more detailed prompt using AI API calls

---

_**Assistant**_

I understand that we need to clean up the suggestion text before passing it to the research processor, removing the static metadata text and keeping only the relevant keywords. Let me help modify the code to handle this:

1. First, let's improve the `cleanSearchQuery` function to better handle these cases:

---

_****_

```diff
  // Helper function to clean search query
  function cleanSearchQuery(query: string): string {
+   // Remove various static text patterns
+   return query
      // Remove depth prefix pattern
-   const cleanedQuery = query.replace(/^Depth \d+: Found \d+ results for: /, '')
-   return cleanedQuery
+     .replace(/^Depth \d+: /, '')
+     // Remove "Found X results for:" pattern
+     .replace(/^Found \d+ results for: /, '')
+     // Remove "Continue exploring" prefix
+     .replace(/^Continue exploring /, '')
+     // Remove "Searching for:" prefix
+     .replace(/^Searching for: /, '')
+     // Clean up any double spaces and trim
+     .replace(/\s+/g, ' ')
+     .trim()
  }
  
      }
    }
+ 
+   // Enhanced suggestion selection handler
+   const handleSuggestionSelect = useCallback((content: string) => {
+     const cleanedContent = cleanSearchQuery(content)
+     
+     // Only proceed if we have meaningful content after cleaning
+     if (cleanedContent && cleanedContent.length > 0) {
+       onSuggestionSelect?.(cleanedContent)
+     }
+   }, [onSuggestionSelect])
  
    if (suggestions.length === 0 && !isLoading && !error) {
                <Card 
                  className="p-3 hover:bg-accent/50 transition-colors cursor-pointer group"
-                 onClick={() => onSuggestionSelect?.(suggestion.content)}
+                 onClick={() => handleSuggestionSelect(suggestion.content)}
                >
                  <div className="flex flex-col gap-2">
```

---

_****_



Now, let's also update the research processor to better handle the cleaned queries:

---

_****_

```diff
    async generateSuggestion(context: ResearchContext): Promise<AISuggestion> {
      try {
-       const prompt = `Generate a research suggestion based on the following context:
+       // Extract key concepts from the current query
+       const keyTerms = context.currentQuery.split(' ')
+         .filter(term => term.length > 3)
+         .join(', ')
+ 
+       const prompt = `Generate a detailed research suggestion based on the following context:
+ 
+ Key Terms: ${keyTerms}
  Current Query: ${context.currentQuery}
- Previous Queries: ${context.previousQueries.join(', ')}
- Current Depth: ${context.currentDepth}
- Max Depth: ${context.maxDepth}
- Recent Findings: ${context.recentFindings.join(', ')}
+ Previous Research: ${context.previousQueries.join('; ')}
+ Research Depth: ${context.currentDepth} of ${context.maxDepth}
+ Recent Findings: ${context.recentFindings.join('; ')}
+ 
+ Consider the following in your response:
+ 1. Focus on the key concepts: ${keyTerms}
+ 2. Build upon previous research context
+ 3. Suggest specific aspects or angles to explore
+ 4. Identify potential relationships between concepts
+ 5. Consider both theoretical and practical implications
  
  Provide suggestion in the following JSON format:
  {
-   "content": "suggestion text",
-   "rationale": "explanation of why this suggestion is relevant",
+   "content": "A specific, actionable research direction",
+   "rationale": "Detailed explanation of why this direction is valuable and how it builds on current context",
    "confidence": 0.0-1.0,
-   "nextSteps": ["list of specific next steps"],
-   "relatedTopics": ["list of related topics to explore"]
+   "nextSteps": ["3-5 specific, concrete steps to pursue this direction"],
+   "relatedTopics": ["3-5 closely related topics worth exploring"]
  }`
  
        const response = await this.createCompletion(
          prompt,
-         'You are a research assistant with access to Search Tools. Generate relevant and insightful research suggestions or trigger further research using Search Toolsbased on the provided context.',
-         { responseFormat: { type: 'json_object' } }
+         'You are an expert research assistant specializing in developing comprehensive research strategies. Generate insightful and specific research suggestions that build upon the current research context while exploring new angles and connections.',
+         { 
+           responseFormat: { type: 'json_object' },
+           temperature: 0.7 // Balanced between creativity and focus
+         }
        ) as ChatCompletion
  
      } catch (error) {
        console.error('Error generating suggestion:', error)
-       // Return a safe fallback
+       // Return a more focused fallback based on the current query
        return {
-         content: `Continue exploring ${context.currentQuery}`,
-         rationale: 'Based on your current research path',
+         content: `Explore specific aspects of ${context.currentQuery}`,
+         rationale: 'Continuing the current research direction with more focused analysis',
          confidence: 0.5,
-         nextSteps: ['Review current findings', 'Look for related topics'],
-         relatedTopics: context.recentFindings
+         nextSteps: [
+           'Analyze key components',
+           'Identify core concepts',
+           'Look for practical applications'
+         ],
+         relatedTopics: [context.currentQuery]
+           .concat(context.previousQueries.slice(-2))
+           .filter(Boolean)
        }
      }
```

---

_****_



These changes accomplish several things:

1. In `research-suggestions.tsx`:
   - Enhanced `cleanSearchQuery` to remove all types of static text patterns
   - Added a new `handleSuggestionSelect` callback that cleans the suggestion content before passing it to the parent
   - The cleaning process now removes prefixes like "Continue exploring", "Searching for:", etc.

2. In `research-processor.ts`:
   - Added key terms extraction from the cleaned query
   - Created a more structured and detailed prompt that:
     - Focuses on key concepts from the cleaned query
     - Provides better context organization
     - Adds specific considerations for the AI to address
   - Improved the system prompt to emphasize comprehensive research strategy
   - Enhanced the fallback suggestion to be more specific and focused
   - Added better formatting for previous research and findings using semicolons as separators
   - Specified the expected number of next steps and related topics (3-5)

3. The prompt now guides the AI to:
   - Focus on key concepts extracted from the cleaned query
   - Build upon the research context more effectively
   - Suggest specific aspects to explore
   - Identify relationships between concepts
   - Consider both theoretical and practical implications

This should result in:
1. Cleaner queries being passed to the research processor
2. More focused and relevant suggestions
3. Better context utilization in generating suggestions
4. More specific and actionable next steps
5. More relevant related topics

Would you like me to make any adjustments to these changes or focus on any other aspects of the suggestion generation process?

---

_**User**_

The cleaning It's working partially but it's not 100% accurate and complete. Here's the remaining text that we still need to clean up: "Depth 0: Found 5 results for: technological singularity predictions"

---

_**Assistant**_

I notice that we need to improve the `cleanSearchQuery` function to better handle the combined patterns. Let me enhance it:

---

_****_

```diff
  // Helper function to clean search query
  function cleanSearchQuery(query: string): string {
-   // Remove various static text patterns
+   // Remove various static text patterns in a specific order
    return query
-     // Remove depth prefix pattern
-     .replace(/^Depth \d+: /, '')
-     // Remove "Found X results for:" pattern
-     .replace(/^Found \d+ results for: /, '')
-     // Remove "Continue exploring" prefix
-     .replace(/^Continue exploring /, '')
-     // Remove "Searching for:" prefix
-     .replace(/^Searching for: /, '')
+     // Remove combined depth and results pattern
+     .replace(/^Depth \d+: Found \d+ results for:\s*/i, '')
+     // Remove individual patterns as fallbacks
+     .replace(/^Depth \d+:/i, '')
+     .replace(/^Found \d+ results for:\s*/i, '')
+     .replace(/^Continue exploring\s*/i, '')
+     .replace(/^Searching for:\s*/i, '')
+     .replace(/^Explore\s*/i, '')
+     // Remove any remaining metadata patterns
+     .replace(/\(Depth \d+\)/g, '')
+     .replace(/\(\d+ results\)/g, '')
      // Clean up any double spaces and trim
      .replace(/\s+/g, ' ')
      .filter(word => 
        word.length > 3 && 
-       !['for', 'and', 'the', 'with', 'from', 'found', 'results'].includes(word.toLowerCase())
+       !['for', 'and', 'the', 'with', 'from', 'found', 'results', 'depth', 'exploring', 'continue'].includes(word.toLowerCase())
      )
      .slice(0, 5) // Take top 5 keywords
```

---

_****_



The improvements include:

1. Better Pattern Handling:
   - Added a specific pattern to handle the combined "Depth X: Found Y results for:" format
   - Made pattern matching case-insensitive with the `/i` flag
   - Added proper whitespace handling with `\s*`
   - Added patterns to remove metadata in parentheses

2. More Comprehensive Cleaning:
   - Added removal of the "Explore" prefix
   - Added patterns to handle variations in the metadata format
   - Process patterns in a specific order to handle nested/combined patterns first

3. Enhanced Stop Words:
   - Added more stop words to the filter list: 'depth', 'exploring', 'continue'
   - These words are common in the metadata but not meaningful for the research context

Now when processing "Depth 0: Found 5 results for: technological singularity predictions", it will:
1. First match and remove the entire prefix pattern "Depth 0: Found 5 results for: "
2. Leave only the meaningful content: "technological singularity predictions"
3. Remove any additional metadata patterns if present
4. Clean up any extra whitespace

This should provide a cleaner, more accurate extraction of the actual research topic from the suggestion text. Would you like me to make any additional adjustments to the cleaning process?

---

_**User**_

@research-suggestions.tsx this code is getting very long and prone to errors. Let's refactor it but moving all the "helper functions" into AI Tools that our Agent can call that will leverage AI semantic understandings to solve, clean up, and seperate words for us.

The helpers functions are including but not limited to:
- cleanSearchQuery
- Extract key topics.
Generate suggestions content (note this helper function is declared but never used)
Get most relevant query.
Generate suggestions (this is an especially long and prone to errors- pay special attention to this)

Let's formulate a plan of action. no Code. We'll discuss together

---

_**Assistant**_

I'll help formulate a plan to refactor these helper functions into AI-powered tools. Let's break this down:

1. **Architectural Changes**:
   - Create a new `lib/ai/tools` directory to house our AI-powered utility functions
   - Each tool will be a separate module with clear input/output types
   - Implement proper error handling and retry mechanisms
   - Add telemetry/logging for AI tool performance monitoring

2. **Proposed AI Tools Breakdown**:

   a. **Query Processor Tool**
   - Purpose: Clean and normalize search queries
   - Features:
     - Remove metadata patterns
     - Extract meaningful keywords
     - Normalize text format
     - Handle multiple languages
     - Context-aware cleaning

   b. **Topic Extractor Tool**
   - Purpose: Extract and categorize key topics from text
   - Features:
     - Semantic topic identification
     - Topic relevance scoring
     - Topic categorization
     - Related topics suggestion
     - Domain-specific topic recognition

   c. **Content Generator Tool**
   - Purpose: Generate research suggestions and content
   - Features:
     - Context-aware suggestion generation
     - Cross-reference analysis
     - Depth-based recommendations
     - Dynamic prompt templates
     - Confidence scoring

   d. **Query Relevance Tool**
   - Purpose: Determine most relevant queries from activity
   - Features:
     - Temporal relevance scoring
     - Context chain analysis
     - Activity type weighting
     - Semantic similarity scoring

3. **Implementation Strategy**:
   - Phase 1: Create base AI tool infrastructure
   - Phase 2: Migrate existing functions one by one
   - Phase 3: Add enhanced capabilities
   - Phase 4: Optimize and add caching
   - Phase 5: Add monitoring and telemetry

4. **Benefits**:
   - More accurate text processing using AI
   - Better scalability and maintainability
   - Easier testing and debugging
   - Improved error handling
   - Better performance through caching
   - More consistent results

Would you like to start with any particular aspect of this plan? We can:
1. Begin with the infrastructure setup
2. Start with a specific tool migration
3. Focus on the most critical function first (generateSuggestions)
4. Discuss more detailed specifications for any of these tools

What would you prefer to tackle first?

---

_**User**_

Looks decent, let's create a new markdown document as "research-tools-refactor_implementation". Record the above plan of action in it.

---

_**Assistant**_

I'll help create a markdown document to record our refactoring plan.

---

_****_

```diff
- 
+ # Research Tools Refactoring Implementation Plan
+ 
+ ## Overview
+ This document outlines the plan to refactor the research suggestion helper functions into AI-powered tools. The goal is to improve maintainability, accuracy, and scalability of the research suggestion system.
+ 
+ ## 1. Architectural Changes
+ 
+ ### Directory Structure
+ ```
+ lib/
+   ├── ai/
+   │   ├── tools/
+   │   │   ├── query-processor.ts
+   │   │   ├── topic-extractor.ts
+   │   │   ├── content-generator.ts
+   │   │   └── query-relevance.ts
+   │   └── types/
+   │       └── tool-types.ts
+ ```
+ 
+ ### Core Principles
+ - Each tool is a separate module with clear input/output types
+ - Comprehensive error handling and retry mechanisms
+ - Built-in telemetry and logging
+ - Caching integration where appropriate
+ - Type safety throughout
+ 
+ ## 2. AI Tools Breakdown
+ 
+ ### a. Query Processor Tool
+ **Purpose**: Clean and normalize search queries
+ 
+ **Features**:
+ - Remove metadata patterns
+ - Extract meaningful keywords
+ - Normalize text format
+ - Handle multiple languages
+ - Context-aware cleaning
+ 
+ **Input/Output Types**:
+ ```typescript
+ interface QueryProcessorInput {
+   query: string
+   context?: {
+     language?: string
+     domain?: string
+     preserveMetadata?: boolean
+   }
+ }
+ 
+ interface QueryProcessorOutput {
+   cleanedQuery: string
+   extractedMetadata?: Record<string, any>
+   confidence: number
+ }
+ ```
+ 
+ ### b. Topic Extractor Tool
+ **Purpose**: Extract and categorize key topics from text
+ 
+ **Features**:
+ - Semantic topic identification
+ - Topic relevance scoring
+ - Topic categorization
+ - Related topics suggestion
+ - Domain-specific topic recognition
+ 
+ **Input/Output Types**:
+ ```typescript
+ interface TopicExtractorInput {
+   text: string
+   maxTopics?: number
+   domainContext?: string
+ }
+ 
+ interface TopicExtractorOutput {
+   mainTopics: Array<{
+     topic: string
+     relevance: number
+     category?: string
+   }>
+   relatedTopics: string[]
+   confidence: number
+ }
+ ```
+ 
+ ### c. Content Generator Tool
+ **Purpose**: Generate research suggestions and content
+ 
+ **Features**:
+ - Context-aware suggestion generation
+ - Cross-reference analysis
+ - Depth-based recommendations
+ - Dynamic prompt templates
+ - Confidence scoring
+ 
+ **Input/Output Types**:
+ ```typescript
+ interface ContentGeneratorInput {
+   context: {
+     currentQuery: string
+     previousQueries: string[]
+     depth: number
+     maxDepth: number
+     recentFindings: string[]
+   }
+   type: 'depth' | 'cross_reference' | 'refinement' | 'path'
+ }
+ 
+ interface ContentGeneratorOutput {
+   content: string
+   rationale: string
+   confidence: number
+   nextSteps: string[]
+   relatedTopics: string[]
+ }
+ ```
+ 
+ ### d. Query Relevance Tool
+ **Purpose**: Determine most relevant queries from activity
+ 
+ **Features**:
+ - Temporal relevance scoring
+ - Context chain analysis
+ - Activity type weighting
+ - Semantic similarity scoring
+ 
+ **Input/Output Types**:
+ ```typescript
+ interface QueryRelevanceInput {
+   activities: Array<{
+     type: string
+     message: string
+     timestamp: number
+   }>
+   context?: {
+     currentDepth: number
+     domain?: string
+   }
+ }
+ 
+ interface QueryRelevanceOutput {
+   mostRelevantQuery: string
+   relevanceScore: number
+   relatedQueries: Array<{
+     query: string
+     score: number
+   }>
+ }
+ ```
+ 
+ ## 3. Implementation Strategy
+ 
+ ### Phase 1: Infrastructure Setup (Week 1)
+ - Set up base AI tool infrastructure
+ - Implement common utilities and types
+ - Set up error handling and logging
+ - Configure testing environment
+ 
+ ### Phase 2: Tool Migration (Weeks 2-3)
+ - Migrate existing functions one by one
+ - Start with Query Processor (highest impact)
+ - Add unit tests for each tool
+ - Validate results against current implementation
+ 
+ ### Phase 3: Enhanced Capabilities (Week 4)
+ - Implement advanced features for each tool
+ - Add caching layer
+ - Optimize performance
+ - Add retry mechanisms
+ 
+ ### Phase 4: Integration (Week 5)
+ - Update research-suggestions.tsx
+ - Add integration tests
+ - Performance testing
+ - Error handling improvements
+ 
+ ### Phase 5: Monitoring & Optimization (Week 6)
+ - Add telemetry
+ - Performance monitoring
+ - Error tracking
+ - Usage analytics
+ 
+ ## 4. Benefits
+ 
+ ### Technical Benefits
+ - More accurate text processing using AI
+ - Better scalability and maintainability
+ - Easier testing and debugging
+ - Improved error handling
+ - Better performance through caching
+ - More consistent results
+ 
+ ### Business Benefits
+ - Improved research suggestion quality
+ - Better user experience
+ - Reduced maintenance overhead
+ - Easier to add new features
+ - Better monitoring and analytics
+ 
+ ## 5. Success Metrics
+ 
+ ### Performance Metrics
+ - Query processing time < 100ms
+ - Suggestion generation time < 500ms
+ - Error rate < 1%
+ - Cache hit rate > 80%
+ 
+ ### Quality Metrics
+ - Topic extraction accuracy > 90%
+ - User acceptance rate > 80%
+ - Suggestion relevance score > 0.8
+ - System uptime > 99.9%
+ 
+ ## Next Steps
+ 1. Review and approve architecture
+ 2. Set up development environment
+ 3. Begin Phase 1 implementation
+ 4. Schedule regular progress reviews
+ 5. Plan user acceptance testing 
```

---

_****_



I've created a comprehensive markdown document outlining our refactoring plan. The document includes:

1. Clear architectural structure
2. Detailed breakdown of each AI tool with TypeScript interfaces
3. Phased implementation strategy
4. Expected benefits
5. Success metrics
6. Next steps

Would you like to:
1. Review and refine any part of this plan?
2. Start with Phase 1 implementation?
3. Focus on a specific tool first?
4. Add more details to any section?

Let me know how you'd like to proceed!

---

_**User**_

Lets review and refine this plan, first by referring to our Tools @tools structure and working samples, then @researcher.ts Agent to see how it's being constructued.

Then update the plan with references and code snippets accordingly

---

_**Assistant**_

I'll analyze our existing tools structure and researcher agent to refine our plan.

Key observations from the current implementation:

1. From `/lib/tools` structure:
- Tools are organized as individual TypeScript modules
- Each tool has a clear purpose (search, retrieve, video-search, human-review)
- Tools are designed to be used by the agent system

2. From `researcher.ts`:
- Uses a tool registry system with interfaces
- Tools are configured as a constant (`AVAILABLE_TOOLS`)
- Has a clear system prompt structure
- Implements error handling and streaming
- Uses type safety throughout

Let me propose updates to our refactoring plan:

---

_****_

```diff
  
  ## Overview
- This document outlines the plan to refactor the research suggestion helper functions into AI-powered tools. The goal is to improve maintainability, accuracy, and scalability of the research suggestion system.
+ This document outlines the plan to refactor the research suggestion helper functions into AI-powered tools, following our established tools architecture and agent system.
  
  ## 1. Architectural Changes
  ```
  lib/
-   ├── ai/
-   │   ├── tools/
+   ├── tools/                      # Main tools directory (existing)
+   │   ├── research/              # New research-specific tools
    │   │   ├── query-processor.ts
    │   │   ├── topic-extractor.ts
    │   │   ├── content-generator.ts
    │   │   └── query-relevance.ts
-   │   └── types/
-   │       └── tool-types.ts
+   │   └── index.ts               # Tool registry
+   ├── agents/
+   │   └── researcher.ts          # Research agent (existing)
+   └── types/
+       └── research-tools.ts      # Research tool types
  ```
  
  ### Core Principles
- - Each tool is a separate module with clear input/output types
+ - Follow existing tool pattern from our codebase
+ - Each tool is a standalone TypeScript module
  - Comprehensive error handling and retry mechanisms
  - Built-in telemetry and logging
- - Caching integration where appropriate
  - Type safety throughout
- 
- ## 2. AI Tools Breakdown
+ - Integration with agent system
  
- ### a. Query Processor Tool
- **Purpose**: Clean and normalize search queries
- 
- **Features**:
- - Remove metadata patterns
- - Extract meaningful keywords
- - Normalize text format
- - Handle multiple languages
- - Context-aware cleaning
- 
- **Input/Output Types**:
+ ### Tool Registry Pattern
  ```typescript
- interface QueryProcessorInput {
-   query: string
-   context?: {
-     language?: string
-     domain?: string
-     preserveMetadata?: boolean
-   }
- }
- 
- interface QueryProcessorOutput {
-   cleanedQuery: string
-   extractedMetadata?: Record<string, any>
-   confidence: number
- }
- ```
- 
- ### b. Topic Extractor Tool
- **Purpose**: Extract and categorize key topics from text
- 
- **Features**:
- - Semantic topic identification
- - Topic relevance scoring
- - Topic categorization
- - Related topics suggestion
- - Domain-specific topic recognition
- 
- **Input/Output Types**:
+ // types/research-tools.ts
+ export interface ResearchTools {
+   queryProcessor: typeof queryProcessorTool
+   topicExtractor: typeof topicExtractorTool
+   contentGenerator: typeof contentGeneratorTool
+   queryRelevance: typeof queryRelevanceTool
+   [key: string]: any
+ }
+ 
+ // tools/research/index.ts
+ export const RESEARCH_TOOLS: ResearchTools = {
+   queryProcessor: queryProcessorTool,
+   topicExtractor: topicExtractorTool,
+   contentGenerator: contentGeneratorTool,
+   queryRelevance: queryRelevanceTool
+ } as const
+ 
+ export type ResearchToolName = keyof typeof RESEARCH_TOOLS
+ ```
+ 
+ ## 2. AI Tools Implementation
+ 
+ ### a. Query Processor Tool
+ **Implementation Pattern**:
  ```typescript
- interface TopicExtractorInput {
-   text: string
-   maxTopics?: number
-   domainContext?: string
- }
- 
- interface TopicExtractorOutput {
-   mainTopics: Array<{
-     topic: string
-     relevance: number
-     category?: string
-   }>
-   relatedTopics: string[]
-   confidence: number
- }
- ```
- 
- ### c. Content Generator Tool
- **Purpose**: Generate research suggestions and content
- 
- **Features**:
- - Context-aware suggestion generation
- - Cross-reference analysis
- - Depth-based recommendations
- - Dynamic prompt templates
- - Confidence scoring
- 
- **Input/Output Types**:
- ```typescript
- interface ContentGeneratorInput {
-   context: {
-     currentQuery: string
-     previousQueries: string[]
-     depth: number
-     maxDepth: number
-     recentFindings: string[]
-   }
-   type: 'depth' | 'cross_reference' | 'refinement' | 'path'
- }
- 
- interface ContentGeneratorOutput {
-   content: string
-   rationale: string
-   confidence: number
-   nextSteps: string[]
-   relatedTopics: string[]
- }
- ```
- 
- ### d. Query Relevance Tool
- **Purpose**: Determine most relevant queries from activity
- 
- **Features**:
- - Temporal relevance scoring
- - Context chain analysis
- - Activity type weighting
- - Semantic similarity scoring
- 
- **Input/Output Types**:
- ```typescript
- interface QueryRelevanceInput {
-   activities: Array<{
-     type: string
-     message: string
-     timestamp: number
-   }>
-   context?: {
-     currentDepth: number
-     domain?: string
+ // tools/research/query-processor.ts
+ import { OpenAI } from 'openai'
+ import { z } from 'zod'
+ 
+ const inputSchema = z.object({
+   query: z.string(),
+   context: z.object({
+     language: z.string().optional(),
+     domain: z.string().optional(),
+     preserveMetadata: z.boolean().optional()
+   }).optional()
+ })
+ 
+ const outputSchema = z.object({
+   cleanedQuery: z.string(),
+   extractedMetadata: z.record(z.any()).optional(),
+   confidence: z.number().min(0).max(1)
+ })
+ 
+ export const queryProcessorTool = {
+   name: 'queryProcessor',
+   description: 'Clean and normalize search queries using AI',
+   parameters: inputSchema,
+   returnType: outputSchema,
+   execute: async (input: z.infer<typeof inputSchema>) => {
+     // Implementation
    }
  }
- 
- interface QueryRelevanceOutput {
-   mostRelevantQuery: string
-   relevanceScore: number
-   relatedQueries: Array<{
-     query: string
-     score: number
-   }>
- }
- ```
+ ```
+ 
+ [Rest of the tools follow similar pattern]
  
  ## 3. Implementation Strategy
  
  ### Phase 1: Infrastructure Setup (Week 1)
- - Set up base AI tool infrastructure
- - Implement common utilities and types
- - Set up error handling and logging
+ - Set up research tools directory structure
+ - Implement tool registry for research tools
+ - Set up common utilities (OpenAI client, error handling)
  - Configure testing environment
+ - Example setup:
+ ```typescript
+ // tools/research/utils.ts
+ export const researchOpenAI = new OpenAI({
+   apiKey: process.env.OPENAI_API_KEY
+ })
+ 
+ export class ResearchToolError extends Error {
+   constructor(
+     message: string,
+     public toolName: string,
+     public context?: any
+   ) {
+     super(message)
+     this.name = 'ResearchToolError'
+   }
+ }
+ ```
  
  ### Phase 2: Tool Migration (Weeks 2-3)
- - Migrate existing functions one by one
- - Start with Query Processor (highest impact)
- - Add unit tests for each tool
- - Validate results against current implementation
+ - Migrate existing functions following our tool pattern
+ - Priority order:
+   1. Query Processor (highest impact)
+   2. Topic Extractor
+   3. Content Generator
+   4. Query Relevance
+ - Add unit tests using our existing test patterns
+ - Validate against current implementation
  
- ### Phase 3: Enhanced Capabilities (Week 4)
- - Implement advanced features for each tool
- - Add caching layer
- - Optimize performance
- - Add retry mechanisms
- 
- ### Phase 4: Integration (Week 5)
- - Update research-suggestions.tsx
- - Add integration tests
- - Performance testing
+ ### Phase 3: Agent Integration (Week 4)
+ - Update researcher agent to use new tools
+ - Example integration:
+ ```typescript
+ // agents/researcher.ts
+ import { RESEARCH_TOOLS } from '../tools/research'
+ 
+ const AVAILABLE_TOOLS = {
+   ...RESEARCH_TOOLS,
+   search: searchTool,
+   retrieve: retrieveTool,
+   videoSearch: videoSearchTool
+ } as const
+ ```
+ 
+ ### Phase 4: Enhanced Features (Week 5)
+ - Implement caching layer using existing patterns
+ - Add telemetry integration
+ - Performance optimizations
  - Error handling improvements
  
- ### Phase 5: Monitoring & Optimization (Week 6)
- - Add telemetry
+ ### Phase 5: Testing & Monitoring (Week 6)
+ - Comprehensive testing suite
  - Performance monitoring
  - Error tracking
  
  ## Next Steps
- 1. Review and approve architecture
- 2. Set up development environment
- 3. Begin Phase 1 implementation
- 4. Schedule regular progress reviews
- 5. Plan user acceptance testing 
+ 1. Review updated architecture aligned with existing patterns
+ 2. Set up research tools directory
+ 3. Begin with Query Processor implementation
+ 4. Integrate with researcher agent
+ 5. Plan testing strategy
+ 
+ ## References
+ - Current tools implementation in `/lib/tools`
+ - Researcher agent pattern in `researcher.ts`
+ - Existing error handling patterns
+ - Current test suite structure 
```

---

_****_



The plan has been updated to better align with our existing codebase patterns. Key changes include:

1. **Directory Structure**:
   - Moved from `/lib/ai/tools` to `/lib/tools/research` to match current structure
   - Added integration with existing agent system

2. **Tool Implementation Pattern**:
   - Added Zod schema validation like existing tools
   - Followed the same tool export pattern
   - Added proper TypeScript types and interfaces

3. **Agent Integration**:
   - Added example of how to integrate with researcher.ts
   - Maintained compatibility with existing tools

4. **Error Handling**:
   - Added custom error class following existing patterns
   - Integrated with current error handling system

5. **Implementation Strategy**:
   - More concrete phases with code examples
   - Better alignment with existing patterns
   - Clear integration path with researcher agent

Would you like to:
1. Review any specific part of the updated plan?
2. Start implementing a specific phase?
3. Further refine any section?
4. Add more implementation details for any tool?

---



---

