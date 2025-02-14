## SpecStory

## Debugging Next.js Context Provider Error (2/13/2025, 1:06:52 PM)

_**User**_

@research-sources-context.tsx @search-section.tsx 

Check these files, i'm getting the errors. Check our @MasterProjectTracker.md  

The Next.js application is throwing an error because the ⁠useSources hook is being called outside of a ⁠SourcesProvider. The error originates in ⁠lib/contexts/research-sources-context.tsx and is triggered when the ⁠useContext(SourcesContext) call returns ⁠null, indicating that the component using the hook is not wrapped in the appropriate provider. The component causing this issue is likely ⁠SearchSection located in ⁠components/search-section.tsx.



---

_**Assistant**_

I'll help analyze and fix this issue. Let me check the files and the project tracker to understand the context better.

First, let's analyze the error. The issue occurs because components are trying to use the `useSources` hook without being wrapped in a `SourcesProvider`. Looking at the files:

1. In `research-sources-context.tsx`, the context and provider are correctly defined
2. In `search-section.tsx`, the component is using `useSources` from a provider import
3. From the MasterProjectTracker, we can see we're in the middle of fixing research visualization and state management issues

Let me search for where the provider should be implemented.

---

_****_

<details>
            <summary>Searched codebase "SourcesProvider implementation or usage" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `lib/contexts/research-sources-context.tsx` | L111-139 |
| `lib/contexts/research-provider.tsx` | L14-32 |
| `lib/contexts/research-sources-context.tsx` | L139-148 |
| `lib/contexts/research-provider.tsx` | L36-37 |
| `lib/contexts/research-sources-context.tsx` | L32-38 |
| `lib/contexts/research-provider.tsx` | L1-14 |
| `lib/contexts/research-sources-context.tsx` | L59-111 |
| `components/visualization/source-item.tsx` | L1-7 |
| `lib/contexts/research-sources-context.tsx` | L23-28 |
| `components/chat/SourceQuickInsert.tsx` | L20-26 |
| `lib/contexts/research-sources-context.tsx` | L28-32 |
| `lib/contexts/research-sources-context.tsx` | L1-12 |
| `components/chat/SearchSourceManager.tsx` | L19-69 |
| `components/chat/SearchSourceManager.tsx` | L105-148 |
| `lib/contexts/research-sources-context.tsx` | L47-59 |
| `lib/contexts/research-sources-context.tsx` | L12-23 |
| `components/visualization/research-content.tsx` | L1-10 |
| `lib/utils/research-analysis.ts` | L1-8 |
| `components/retrieve-section.tsx` | L14-45 |
| `lib/contexts/research-context.tsx` | L256-313 |
| `components/chat/SearchSourceManager.tsx` | L1-19 |
| `components/visualization/research-tabs.tsx` | L104-152 |
| `components/search-section.tsx` | L94-158 |
| `components/chat/SourceQuickInsert.tsx` | L109-113 |
| `components/chat/SearchSourceManager.tsx` | L69-105 |

</details>

---

_****_



Let me also check where the `SearchSection` component is being used.

---

_****_

<details>
            <summary>Searched codebase "SearchSection component usage or implementation" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `components/retrieve-section.tsx` | L1-14 |
| `components/tool-section.tsx` | L1-15 |
| `components/search-section.tsx` | L34-43 |
| `components/video-search-section.tsx` | L1-14 |
| `components/search-section.tsx` | L1-30 |
| `components/video-search-section.tsx` | L14-45 |
| `components/tool-section.tsx` | L15-56 |
| `components/search-section.tsx` | L94-158 |
| `components/search-section.tsx` | L205-237 |
| `components/search-section.tsx` | L43-94 |
| `components/retrieve-section.tsx` | L14-45 |
| `components/search-section.tsx` | L158-205 |
| `docs/UI-cleanup-implementation.md` | L234-285 |
| `components/search/search-header.tsx` | L11-40 |
| `components/search/search-header.tsx` | L1-11 |
| `components/search-section.tsx` | L30-34 |
| `components/search-results-image.tsx` | L33-72 |
| `components/search/search-header.tsx` | L40-48 |
| `components/search-results-image.tsx` | L72-105 |
| `components/search-results-image.tsx` | L1-33 |
| `docs/UI-cleanup-implementation.md` | L341-400 |
| `components/section.tsx` | L10-25 |
| `components/search-results.tsx` | L136-156 |
| `components/research-diff-view.tsx` | L15-56 |
| `components/default-skeleton.tsx` | L12-27 |

</details>

---

_****_



Based on my analysis, I can see that:

1. The `SearchSection` component is used in `ToolSection` which is likely part of the chat interface
2. The `SearchSection` uses hooks from `research-provider.tsx` which includes `useSources`, `useActivity`, and `useDepth`
3. Looking at the project tracker, we're in the middle of fixing research visualization and state management issues

The issue is that the `SearchSection` component is not properly wrapped in the required providers. Let me check the app structure to see where we should add the providers.

---

_****_

<details>
            <summary>Searched codebase "app layout or main app structure" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `app/layout.tsx` | L48-55 |
| `app/layout.tsx` | L1-48 |
| `app/page.tsx` | L1-28 |
| `app/layout.tsx` | L55-92 |
| `app/page.tsx` | L28-60 |
| `components/chat-panel.tsx` | L333-358 |
| `docs/TIPS-explainVisuallyToMe.md` | L1-21 |
| `components/shared/error-boundary.tsx` | L12-43 |
| `components/chat-panel.tsx` | L449-489 |
| `docs/research-command-center.md` | L179-183 |
| `components/header.tsx` | L27-29 |
| `components/header.tsx` | L1-27 |
| `package.json` | L1-89 |
| `components/chat-panel.tsx` | L489-537 |
| `docs/research-command-center.md` | L72-179 |
| `components/chat-panel.tsx` | L358-382 |
| `components/chat-panel.tsx` | L41-93 |
| `components/shared/error-boundary.tsx` | L1-7 |
| `components/blur-reveal.tsx` | L1-44 |
| `components/chat-panel.tsx` | L537-575 |
| `docs/UI-cleanup-implementation.md` | L400-463 |
| `components/chat-panel.tsx` | L25-41 |
| `components/research-diff-view.tsx` | L56-96 |
| `components/visualization/research-diff-view.tsx` | L24-71 |
| `components/chat.tsx` | L73-137 |

</details>

---

_****_



Based on my analysis, I can see that:

1. The `SearchSection` component is used within the `ToolSection` component
2. The `ToolSection` is used to display different types of tool results in the chat interface
3. The research-related providers are defined in `research-provider.tsx`
4. Looking at `app/layout.tsx`, we have a `ResearchProvider` at the root level, but it's not the one we need

The issue is that we need to wrap the `ToolSection` component with the proper providers. Let me propose a fix:

---

_****_

```diff
  'use client'
  
+ import { DepthProvider, ResearchActivityProvider, SourcesProvider } from '@/lib/contexts/research-provider'
  import { Message, ToolInvocation } from 'ai'
  import RetrieveSection from './retrieve-section'
      case 'search':
        return (
+         <ResearchActivityProvider>
+           <SourcesProvider>
+             <DepthProvider>
                <SearchSection
                  tool={tool}
                  chatId={chatId}
                />
+             </DepthProvider>
+           </SourcesProvider>
+         </ResearchActivityProvider>
        )
      case 'video_search':
```

---

_****_



I see the issue. The providers are not being exported correctly from the research-provider file. Let me check the correct exports:

---

_****_

<details>
            <summary>Searched codebase "ResearchActivityProvider SourcesProvider DepthProvider exports" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `lib/contexts/research-provider.tsx` | L14-32 |
| `lib/contexts/research-provider.tsx` | L1-14 |
| `lib/utils/research-depth.ts` | L1-25 |
| `lib/contexts/research-context.tsx` | L256-313 |
| `lib/contexts/research-depth-context.tsx` | L87-120 |
| `lib/contexts/research-activity-context.tsx` | L13-20 |
| `lib/contexts/research-context.tsx` | L1-14 |
| `lib/contexts/research-context.tsx` | L29-56 |
| `lib/utils/research-analysis.ts` | L1-8 |
| `lib/types/deep-research.ts` | L1-36 |
| `lib/types/research.ts` | L46-53 |
| `lib/contexts/research-context.tsx` | L152-208 |
| `lib/contexts/research-activity-context.tsx` | L119-132 |
| `lib/contexts/research-activity-context.tsx` | L64-119 |
| `lib/redis/research.ts` | L23-35 |
| `lib/contexts/research-context.tsx` | L67-152 |
| `lib/types/index.ts` | L50-57 |
| `reference/importedcode-newfeature-deepresearch/REF-deep-research-context.tsx` | L156-219 |
| `lib/contexts/research-depth-context.tsx` | L17-24 |
| `lib/redis/research.ts` | L95-136 |
| `lib/contexts/research-provider.tsx` | L35-36 |
| `lib/contexts/research-activity-context.tsx` | L41-48 |
| `lib/contexts/research-context.tsx` | L243-256 |
| `lib/utils/research-depth.ts` | L99-139 |
| `components/visualization/research-content.tsx` | L1-10 |

</details>

---

_****_



I see the issue now. Let me fix the imports in the tool-section.tsx file:

---

_****_

```diff
  'use client'
  
- import { DepthProvider, ResearchActivityProvider, SourcesProvider } from '@/lib/contexts/research-provider'
+ import { ResearchActivityProvider } from '@/lib/contexts/research-activity-context'
+ import { DepthProvider } from '@/lib/contexts/research-depth-context'
+ import { SourcesProvider } from '@/lib/contexts/research-sources-context'
  import { Message, ToolInvocation } from 'ai'
  import RetrieveSection from './retrieve-section'
```

---

_****_



Great! The changes look good. I've made the following fixes:

1. Imported each provider from its respective context file:
   - `ResearchActivityProvider` from `research-activity-context.tsx`
   - `DepthProvider` from `research-depth-context.tsx`
   - `SourcesProvider` from `research-sources-context.tsx`

2. Wrapped the `SearchSection` component with all three providers in the correct order:
   - Outermost: `ResearchActivityProvider`
   - Middle: `SourcesProvider`
   - Innermost: `DepthProvider`

This should resolve the error about `useSources` being called outside of a `SourcesProvider`. The providers are now properly set up to provide the necessary context to the `SearchSection` component.

The order of the providers matches the order used in the `ResearchProvider` component, ensuring consistent behavior. Each provider adds its own piece of functionality:

1. `ResearchActivityProvider`: Manages research activity state and tracking
2. `SourcesProvider`: Manages source collection and metrics
3. `DepthProvider`: Manages research depth configuration and optimization

Is there anything else you'd like me to help you with?

---



---

