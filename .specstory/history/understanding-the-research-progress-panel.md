## SpecStory

## Understanding the Research Progress Panel (2/10/2025, 12:13:24 PM)

_**User**_

 in the @search-results.tsx , we have the Research Progress panel, explain to me what it does

---

_**Assistant**_

I'll explain the Research Progress panel in the `search-results.tsx` component. This panel appears to be a visualization dashboard that shows how search results have evolved or improved between different searches.

The Research Progress panel is only displayed when there are `diffResult` values (meaning there are previous results to compare against) and `showDiff` is enabled. Here's what it tracks:

1. **Overall Progress Header**
- Shows a title "Research Progress"
- Displays the total number of changes in the top right corner

2. **Four Key Metrics** displayed in a 2x2 grid:

a) **New Insights**
- Tracks newly discovered information
- Shows a green progress bar
- Width of the bar represents the proportion of new insights relative to total changes
- Displays the actual number of new insights

b) **Refinements**
- Tracks improvements or modifications to existing results
- Shows a blue progress bar
- Width represents the proportion of refinements relative to total changes
- Displays the actual number of refinements

c) **Relevance Improvement**
- Shows how much more relevant the new results are compared to previous ones
- Uses a yellow progress bar
- Displays the improvement as a percentage
- Bar is capped between 0-100%

d) **Depth Progress**
- Tracks how much deeper the research has gone
- Uses a purple progress bar
- Shows progress in "levels"
- Bar width is calculated as `(depthProgress / 10) * 100%`, capped at 100%

The panel has a nice visual design:
- Uses a semi-transparent background with blur effect
- Has a subtle yellow border
- Each metric has its own progress bar with distinct colors
- Shows both labels and numerical values for each metric

This visualization helps users understand:
1. How their search results have evolved
2. The quality of new information discovered
3. The depth of the research progress
4. Overall improvements in relevance

The metrics are calculated using the `compareSearchResults` function (imported from `@/lib/diff`) which compares previous results with current ones to generate these analytics.

This is a sophisticated way to show users how their research or search has improved over time, making the search process more transparent and informative.

---

_**User**_

Help me debug why the progresses are not updated as users perform more research?

---

_**Assistant**_

I'll help investigate why the progress metrics aren't updating properly. Let's first look at how the progress data flows and then identify potential issues.

First, let me search for the code that handles the diff calculations:

---

_****_

<details>
            <summary>Searched codebase "compareSearchResults function implementation for search results diff" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `lib/diff/index.ts` | L69-82 |
| `lib/diff/index.ts` | L82-124 |
| `lib/diff/index.ts` | L1-69 |
| `components/search-results.tsx` | L19-70 |
| `components/search-results.tsx` | L1-19 |
| `components/search-results.tsx` | L102-134 |
| `components/search-results.tsx` | L134-156 |
| `components/search-results.tsx` | L156-176 |
| `lib/diff/index.ts` | L137-146 |
| `lib/diff/types.ts` | L3-19 |
| `components/search-results.tsx` | L70-102 |
| `lib/diff/index.ts` | L128-137 |
| `lib/diff/types.ts` | L35-44 |
| `lib/diff/index.ts` | L124-128 |
| `components/search-section.tsx` | L265-298 |
| `components/search-results.tsx` | L176-207 |
| `components/search-results.tsx` | L207-246 |
| `docs/deepsearch_implementation.md` | L703-764 |
| `components/search-section.tsx` | L201-225 |
| `components/diff-view.tsx` | L66-95 |
| `components/diff-view.tsx` | L66-95 |
| `lib/diff/types.ts` | L1-3 |
| `components/diff-view.tsx` | L121-168 |
| `components/diff-view.tsx` | L121-168 |
| `importedcode-newfeature-editor/REF-deep-research-diff.js` | L138-199 |

</details>

---

_****_



Let me check the `SearchResult` type to understand what properties should be present in the search results:

---

_****_

<details>
            <summary>Searched codebase "SearchResult interface or type definition" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `lib/types.ts` | L1-10 |
| `lib/types.ts` | L1-10 |
| `lib/types/index.ts` | L29-36 |
| `lib/types/index.ts` | L8-16 |
| `lib/utils/search.ts` | L1-7 |
| `lib/types/index.ts` | L107-114 |
| `lib/types/index.ts` | L1-8 |
| `lib/types/index.ts` | L36-45 |
| `lib/types/index.ts` | L90-99 |
| `lib/types/index.ts` | L16-20 |
| `lib/diff/types.ts` | L3-19 |
| `lib/types/index.ts` | L99-105 |
| `lib/types/index.ts` | L45-57 |
| `lib/types/index.ts` | L144-153 |
| `lib/types/index.ts` | L20-29 |
| `lib/types.ts` | L10-17 |
| `lib/types.ts` | L10-17 |
| `lib/diff/types.ts` | L1-3 |
| `lib/diff/types.ts` | L35-44 |
| `components/ranked-search-results.tsx` | L31-35 |
| `components/ranked-search-results.tsx` | L35-42 |
| `lib/types/index.ts` | L124-132 |
| `lib/tools/search.ts` | L92-114 |
| `lib/schema/search.tsx` | L1-22 |
| `lib/tools/search.ts` | L261-285 |

</details>

---

_****_



After analyzing the code, I can identify several potential issues that might be causing the progress metrics not to update:

1. **Missing Required Properties**: 
- The `SearchResult` interface requires `relevance` and `depth` properties, but looking at the search implementation in `lib/tools/search.ts`, these properties are not being set when mapping the results from SearXNG:
```typescript
results: generalResults.map(
  (result: SearXNGResult): SearchResultItem => ({
    title: result.title,
    url: result.url,
    content: result.content
    // Missing relevance and depth properties
  })
)
```

2. **Previous Results Update Logic Issue**:
In `search-section.tsx`, the logic for updating previous results seems incorrect:
```typescript
setPreviousResults(prevResults => {
  // Only update if the results are different
  const currentUrls = new Set(searchResults.results.map(r => r.url))
  const prevUrls = new Set(prevResults.map(r => r.url))
  const hasChanges = 
    currentUrls.size !== prevUrls.size || 
    ![...currentUrls].every(url => prevUrls.has(url))
  return hasChanges ? prevResults : searchResults.results  // This logic is reversed
})
```
The ternary operator is returning the old results when there are changes, and the new results when there aren't changes - which is the opposite of what we want.

3. **Metrics Calculation Issues**:
In the `compareSearchResults` function, the metrics calculations might be affected by missing properties:
- `relevanceImprovement` calculation depends on the `relevance` property
- `depthProgress` calculation depends on the `depth` property
If these properties are missing or NaN, it would explain why we're seeing "NaN%" and "+NaN levels" in the UI.

Here's how we can fix these issues:

1. First, let's fix the search results mapping to include the required properties:

---

_****_

```diff
            title: result.title,
            url: result.url,
-           content: result.content
+           content: result.content,
+           relevance: result.score || 0.5,
+           depth: searchDepth === 'advanced' ? 2 : 1
          })
        ),
```

---

_****_



2. Now, let's fix the previous results update logic:

---

_****_

```diff
            currentUrls.size !== prevUrls.size || 
            ![...currentUrls].every(url => prevUrls.has(url))
-         return hasChanges ? prevResults : searchResults.results
+         return hasChanges ? searchResults.results : prevResults
        })
      }
```

---

_****_



These changes should help fix the progress metrics not updating. Here's what we've done:

1. Added `relevance` and `depth` properties to search results:
   - Using the SearXNG score for relevance (defaulting to 0.5 if not available)
   - Setting depth based on search depth parameter (2 for advanced, 1 for basic)

2. Fixed the previous results update logic:
   - Now correctly stores new results when changes are detected
   - Keeps old results when no changes are detected

The linter errors we see are related to type mismatches in the search results interface. We should update the types to match our implementation, but that would require a broader refactoring of the search types system. For now, the core functionality for progress metrics should work better.

To verify if these changes fixed the issue:
1. Try performing a search
2. The progress metrics should now show proper numerical values instead of NaN
3. When you perform subsequent searches, you should see the metrics update based on the differences between searches

Let me know if you'd like me to help fix the type issues as well, or if you're still seeing any issues with the progress metrics.

---



---

