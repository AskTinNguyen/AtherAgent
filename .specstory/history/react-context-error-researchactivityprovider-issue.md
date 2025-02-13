## SpecStory

## React Context Error: ResearchActivityProvider Issue (2/12/2025, 12:40:49 AM)

_**User**_

The error message “useResearchContext must be used within a ResearchActivityProvider” indicates that a React component called ⁠ResearchCommandCenter (specifically line 56 in ⁠components/visualization/research-command-center.tsx) is trying to access a context called ⁠ResearchContext using the ⁠useResearchContext hook, but it’s not wrapped within a ⁠ResearchActivityProvider.  The ⁠ResearchActivityProvider is necessary to supply the context that ⁠useResearchContext expects.

---

_**Assistant**_

Let me help you investigate and fix this issue. First, I'll check the `ResearchCommandCenter` component to understand how it's using the context.

---

_****_

Read file: components/visualization/research-command-center.tsx

---

_****_



Now let me check where this component is being used to see if it's properly wrapped with the provider.

---

_****_

<details>
            <summary>Grep search for "ResearchCommandCenter" • **6** files</summary>
        
| File | Line | Match |
|------|------|-------|
| `file:///Users/tinnguyen/AtherAgent/lib/types/research-command-center.ts` | L2 | `export interface ResearchCommandCenterProps {` |
| `file:///Users/tinnguyen/AtherAgent/components/left-sidebar.tsx` | Lundefined | `import { ResearchCommandCenter } from './visualization/research-command-center'` |
| `file:///Users/tinnguyen/AtherAgent/components/left-sidebar.tsx` | L5 | `<ResearchCommandCenter` |
| `file:///Users/tinnguyen/AtherAgent/docs/research-command-center.md` | L138 | `ResearchCommandCenter` |
| `file:///Users/tinnguyen/AtherAgent/docs/research-command-center.md` | L180 | `<ResearchCommandCenter className="h-full" />` |
| `file:///Users/tinnguyen/AtherAgent/components/visualization/research-command-center.tsx` | L40 | `export interface ResearchCommandCenterProps {` |
| `file:///Users/tinnguyen/AtherAgent/components/visualization/research-command-center.tsx` | L48 | `export function ResearchCommandCenter({` |
| `file:///Users/tinnguyen/AtherAgent/components/visualization/research-command-center.tsx` | L54 | `}: ResearchCommandCenterProps) {` |
| `file:///Users/tinnguyen/AtherAgent/components/visualization/research-command-center.tsx` | L319 | `interface DeepResearchCommandCenterWrapperProps {` |
| `file:///Users/tinnguyen/AtherAgent/components/visualization/research-command-center.tsx` | L327 | `export function DeepResearchCommandCenterWrapper({` |
| `file:///Users/tinnguyen/AtherAgent/components/visualization/research-command-center.tsx` | L333 | `}: DeepResearchCommandCenterWrapperProps) {` |
| `file:///Users/tinnguyen/AtherAgent/components/visualization/research-command-center.tsx` | L40 | `export interface ResearchCommandCenterProps {` |
| `file:///Users/tinnguyen/AtherAgent/components/visualization/research-command-center.tsx` | L48 | `export function ResearchCommandCenter({` |
| `file:///Users/tinnguyen/AtherAgent/components/visualization/research-command-center.tsx` | L54 | `}: ResearchCommandCenterProps) {` |
| `file:///Users/tinnguyen/AtherAgent/components/visualization/research-command-center.tsx` | L319 | `interface DeepResearchCommandCenterWrapperProps {` |
| `file:///Users/tinnguyen/AtherAgent/components/visualization/research-command-center.tsx` | L327 | `export function DeepResearchCommandCenterWrapper({` |
| `file:///Users/tinnguyen/AtherAgent/components/visualization/research-command-center.tsx` | L333 | `}: DeepResearchCommandCenterWrapperProps) {` |
| `file:///Users/tinnguyen/AtherAgent/components/left-sidebar.tsx` | Lundefined | `import { ResearchCommandCenter } from './visualization/research-command-center'` |
| `file:///Users/tinnguyen/AtherAgent/components/left-sidebar.tsx` | L5 | `<ResearchCommandCenter` |

</details>

---

_****_



Let me check the `left-sidebar.tsx` component since that's where `ResearchCommandCenter` is being used:

---

_****_

Read file: components/left-sidebar.tsx

---

_****_



I can see that the issue is that the `ResearchCommandCenter` component is being used in `LeftSidebar` without being wrapped in a `ResearchActivityProvider`. The provider needs to be higher up in the component tree to provide the necessary context.

Looking at the code, I notice that there's also a `DeepResearchCommandCenterWrapper` component in the same file that might be intended to provide this context. Let me check its implementation:

---

_****_

Read file: components/visualization/research-command-center.tsx

---

_****_



I see the issue now. The `DeepResearchCommandCenterWrapper` provides `ResearchProvider` and `DeepResearchProvider`, but it's missing the `ResearchActivityProvider` that's needed for the `useResearchContext` hook to work.

Let me fix this by modifying the `LeftSidebar` component to wrap the `ResearchCommandCenter` with the `ResearchActivityProvider`:

---

_****_

```diff
+ import { ResearchActivityProvider } from '@/lib/contexts/research-activity-context'
  import { ResearchCommandCenter } from './visualization/research-command-center'
  
  export function LeftSidebar({ chatId }: { chatId: string }) {
    return (
      <div className="h-screen p-2 fixed top-0 left-0 flex-col justify-center pb-24 hidden lg:flex w-[400px]">
+       <ResearchActivityProvider>
          <ResearchCommandCenter 
            chatId={chatId}
            className="w-full h-full"
          />
+       </ResearchActivityProvider>
      </div>
    )
```

---

_****_



I've made the following changes to fix the error:

1. Added the import for `ResearchActivityProvider` from the research activity context
2. Wrapped the `ResearchCommandCenter` component with `ResearchActivityProvider`

This should resolve the error "useResearchContext must be used within a ResearchActivityProvider" because now the `ResearchCommandCenter` component has access to the context it needs through the provider.

The error occurred because the component was trying to use the `useResearchContext` hook without having access to the context provided by `ResearchActivityProvider`. In React, components that use context hooks must be wrapped with their corresponding provider components higher up in the component tree.

Is there anything else you'd like me to explain or help you with?

---

_**User**_

@research-sources-context.tsx The error message “useSources must be used within a SourcesProvider” indicates that the ⁠useSources hook in ⁠lib/contexts/research-sources-context.tsx is being called within the ⁠SearchSection component (⁠components/search-section.tsx) but not within the scope of a ⁠SourcesProvider. This means the necessary context for ⁠useSources to function correctly is missing.  The error is occurring multiple times.

---

_**Assistant**_

I'll help you fix this issue. First, let me check the `SearchSection` component to see how it's using the `useSources` hook.

---

_****_

Read file: components/search-section.tsx

---

_****_



I notice that the `SearchSection` component is using multiple context hooks: `useSources`, `useActivity`, and `useDepth`. Looking at the imports, these are coming from `@/lib/contexts/research-provider`:

```typescript
import { useActivity, useDepth, useSources } from '@/lib/contexts/research-provider'
```

Let me check the `research-provider` context to understand how these hooks are being provided:

---

_****_

Read file: lib/contexts/research-provider.tsx

---

_****_



Now I see the issue. The `SearchSection` component is using the `useSources` hook, but it's not wrapped with the `ResearchProvider` which provides all the necessary context providers (`ResearchActivityProvider`, `SourcesProvider`, and `DepthProvider`).

Let's modify the `LeftSidebar` component to use `ResearchProvider` instead of just `ResearchActivityProvider`:

---

_****_

```diff
- import { ResearchActivityProvider } from '@/lib/contexts/research-activity-context'
+ import { ResearchProvider } from '@/lib/contexts/research-provider'
  import { ResearchCommandCenter } from './visualization/research-command-center'
  
  export function LeftSidebar({ chatId }: { chatId: string }) {
    return (
      <div className="h-screen p-2 fixed top-0 left-0 flex-col justify-center pb-24 hidden lg:flex w-[400px]">
-       <ResearchActivityProvider>
+       <ResearchProvider chatId={chatId}>
          <ResearchCommandCenter 
            chatId={chatId}
            className="w-full h-full"
          />
-       </ResearchActivityProvider>
+       </ResearchProvider>
      </div>
    )
```

---

_****_



I've made the following changes to fix the error:

1. Replaced the import of `ResearchActivityProvider` with `ResearchProvider` from the research provider context
2. Replaced the `ResearchActivityProvider` component with `ResearchProvider`
3. Added the required `chatId` prop to `ResearchProvider`

This change should resolve the error because `ResearchProvider` includes all three necessary providers:
- `ResearchActivityProvider`
- `SourcesProvider`
- `DepthProvider`

The error was occurring because while we had the `ResearchActivityProvider` in place, we were missing the `SourcesProvider` that's required for the `useSources` hook to work. The `ResearchProvider` component is a higher-level provider that combines all three providers, ensuring that all the necessary context is available to child components.

Now the `SearchSection` component (and any other components that use these hooks) will have access to all the required contexts through the `ResearchProvider`.

Is there anything else you'd like me to explain or help you with?

---



---

