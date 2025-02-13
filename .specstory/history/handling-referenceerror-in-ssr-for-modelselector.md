## SpecStory

## Handling ReferenceError in SSR for ModelSelector (2/13/2025, 9:17:38 PM)

_**User**_

ReferenceError: navigator is not defined within the ⁠ModelSelector component (specifically, the ⁠model-selector.tsx file, line 95).  The code attempts to access ⁠navigator.platform to determine whether the user is on a Mac and display the appropriate keyboard shortcut (⌘ or Ctrl).  The error suggests that the ⁠navigator object, which provides information about the user’s browser, is not available in the environment where the code is running, likely a server-side rendering (SSR) context where the browser’s ⁠navigator API is not defined.

@model-selector.tsx should this handle the context about user is on a Mac?

---

_**Assistant**_

Let me help you fix this issue. The error occurs because we're trying to access the `navigator` object during server-side rendering where it's not available. Since this is a Next.js application, we need to ensure we only access browser APIs on the client side.

Let me search for any relevant patterns or similar code first.

---

_****_

<details>
            <summary>Searched codebase "Check platform or navigator.platform in components" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `.specstory/history/debugging-localhost-3000-issues.md` | L327-373 |
| `.specstory/history/debugging-localhost-3000-issues.md` | L373-413 |
| `.specstory/history/debugging-localhost-3000-issues.md` | L214-254 |
| `.specstory/history/debugging-localhost-3000-issues.md` | L481-519 |
| `.specstory/history/debugging-localhost-3000-issues.md` | L290-327 |
| `components/search-mode-toggle.tsx` | L1-32 |
| `components/model-selector.tsx` | L65-100 |
| `.specstory/history/debugging-localhost-3000-issues.md` | L254-290 |
| `.specstory/history/debugging-localhost-3000-issues.md` | L519-561 |
| `.specstory/history/debugging-localhost-3000-issues.md` | L413-449 |
| `.specstory/history/debugging-localhost-3000-issues.md` | L164-214 |
| `components/command/command-example.tsx` | L1-35 |
| `.specstory/history/debugging-localhost-3000-issues.md` | L449-481 |
| `components/chat-panel.tsx` | L41-93 |
| `components/history-container.tsx` | L7-27 |
| `components/ui/codeblock.tsx` | L49-82 |
| `lib/hooks/use-copy-to-clipboard.ts` | L7-33 |
| `components/command/render-results.tsx` | L34-72 |
| `components/header.tsx` | L1-23 |
| `components/ui/sonner.tsx` | L1-6 |
| `components/ui/alert-dialog.tsx` | L1-46 |
| `components/tool-section.tsx` | L18-65 |
| `components/message-actions.tsx` | L16-49 |
| `components/chat-panel.tsx` | L1-25 |
| `components/ui/carousel.tsx` | L121-195 |

</details>

---

_****_



I see that we need to handle the browser API access safely in the `ModelSelector` component. Let me modify the code to handle this properly by:

1. Moving the platform check to a client-side effect
2. Using state to store the keyboard shortcut display

---

_****_

```diff
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
    const [selectedModelId, setSelectedModelId] = useState<string>('')
+   const [shortcutKey, setShortcutKey] = useState<string>('Ctrl')
  
    const isControlled = controlledOpen !== undefined
      }
    }
+ 
+   useEffect(() => {
+     // Check platform on client side
+     if (typeof window !== 'undefined') {
+       setShortcutKey(navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl')
+     }
+   }, [])
  
    useEffect(() => {
              )}
              <kbd className="ml-1 text-[10px] text-muted-foreground hidden sm:inline-block">
-               {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'} + ↑
+               {shortcutKey} + ↑
              </kbd>
            </div>
```

---

_****_



I've made the following changes to fix the issue:

1. Added a new state variable `shortcutKey` to store the keyboard shortcut display text
2. Created a new `useEffect` hook that safely checks the platform on the client side
3. Replaced the direct `navigator.platform` check with the state variable in the render

This solution:
- Avoids the "navigator is not defined" error during server-side rendering
- Still provides the correct platform-specific shortcut (⌘ for Mac, Ctrl for others)
- Defaults to "Ctrl" if the platform check fails or during initial render
- Maintains the same functionality but in a SSR-safe way

The component will now work correctly in both server-side and client-side contexts. The keyboard shortcut will initially show "Ctrl" during server-side rendering, then update to the correct platform-specific key (⌘ or Ctrl) once the component mounts on the client side.

---

_**User**_

Now do the same for @search-mode-toggle.tsx 

---

_**Assistant**_

I'll modify the `SearchModeToggle` component to handle the platform detection in the same safe way as we did for the `ModelSelector`.

---

_****_

```diff
  import { cn } from '@/lib/utils'
  import { Globe } from 'lucide-react'
+ import { useEffect, useState } from 'react'
  import { Toggle } from './ui/toggle'
  
  export function SearchModeToggle() {
    const { state, toggleSearch } = useResearch()
+   const [shortcutKey, setShortcutKey] = useState<string>('Ctrl')
+ 
+   useEffect(() => {
+     // Check platform on client side
+     if (typeof window !== 'undefined') {
+       setShortcutKey(navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl')
+     }
+   }, [])
  
    return (
        <span className="text-xs">Search</span>
        <kbd className="ml-2 text-[10px] text-muted-foreground">
-         {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'} + .
+         {shortcutKey} + .
        </kbd>
      </Toggle>
```

---

_****_



I've made similar changes to the `SearchModeToggle` component:

1. Added the `useState` import and created a new state variable `shortcutKey` to store the keyboard shortcut display text
2. Added a `useEffect` hook that safely checks the platform on the client side
3. Replaced the direct `navigator.platform` check with the state variable in the render

This solution:
- Fixes the "navigator is not defined" error during server-side rendering
- Maintains consistent behavior with the `ModelSelector` component
- Defaults to "Ctrl" during server-side rendering and initial client render
- Updates to the correct platform-specific key (⌘ for Mac, Ctrl for others) after mounting

The component will now work correctly in both server-side and client-side contexts, just like the `ModelSelector` component.

---

_**User**_

Check why "⌘+." shortcut does not work for search-mode-toggle

---

_**Assistant**_

Let me check the implementation of the keyboard shortcut handling for the search mode toggle.

---

_****_

<details>
            <summary>Searched codebase "handleKeyDown search mode toggle keyboard shortcut" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `components/search-mode-toggle.tsx` | L1-32 |
| `components/chat/SearchSourceManager.tsx` | L69-105 |
| `components/chat-panel.tsx` | L41-93 |
| `.specstory/history/implementing-command-bar-interface-plan.md` | L4188-4247 |
| `.specstory/history/implementing-ather-command-shortcuts.md` | L1072-1148 |
| `.specstory/history/implementing-command-bar-interface-plan.md` | L3462-3522 |
| `.specstory/history/implementing-ather-command-shortcuts.md` | L1245-1317 |
| `.specstory/history/implementing-command-bar-interface-plan.md` | L3522-3616 |
| `components/command/render-results.tsx` | L34-72 |
| `.specstory/history/implementing-ather-command-shortcuts.md` | L930-998 |
| `.specstory/history/implementing-command-bar-interface-plan.md` | L4247-4328 |
| `components/command/command-example.tsx` | L227-285 |
| `.specstory/history/implementing-command-bar-interface-plan.md` | L1326-1371 |
| `.specstory/history/implementing-command-bar-interface-plan.md` | L2299-2364 |
| `.specstory/history/implementing-ather-command-shortcuts.md` | L535-615 |
| `components/chat-panel.tsx` | L261-291 |
| `components/search-depth-toggle.tsx` | L34-61 |
| `.specstory/history/implementing-ather-command-shortcuts.md` | L2178-2230 |
| `components/providers/command-provider-wrapper.tsx` | L35-59 |
| `.specstory/history/implementing-ather-command-shortcuts.md` | L1631-1681 |
| `components/command/command-example.tsx` | L77-128 |
| `components/chat-panel.tsx` | L213-261 |
| `components/search-depth-toggle.tsx` | L61-98 |
| `components/chat/SourceQuickInsert.tsx` | L109-113 |
| `components/command/command-example.tsx` | L128-166 |

</details>

---

_****_



I see the issue. The keyboard shortcut for search mode toggle is implemented in the `ChatPanel` component, but the `SearchModeToggle` component is not connected to that functionality. Let me check the chat panel implementation.

---

_****_

<details>
            <summary>Searched codebase "useResearch context implementation" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `lib/contexts/research-context.tsx` | L313-322 |
| `lib/contexts/research-context.tsx` | L256-313 |
| `lib/contexts/research-activity-context.tsx` | L195-201 |
| `lib/contexts/research-activity-context.tsx` | L149-188 |
| `components/research-initializer.tsx` | L1-33 |
| `lib/contexts/research-context.tsx` | L1-14 |
| `lib/contexts/research-context.tsx` | L243-256 |
| `lib/contexts/research-context.tsx` | L67-152 |
| `lib/contexts/research-activity-context.tsx` | L132-149 |
| `lib/contexts/research-activity-context.tsx` | L57-64 |
| `lib/contexts/research-depth-context.tsx` | L1-12 |
| `lib/contexts/research-activity-context.tsx` | L64-119 |
| `lib/contexts/research-sources-context.tsx` | L1-12 |
| `lib/contexts/research-context.tsx` | L29-56 |
| `.specstory/history/reviewing-deep-research-flow-implementation.md` | L1208-1305 |
| `lib/contexts/research-provider.tsx` | L1-14 |
| `.specstory/history/reviewing-duplicate-files-and-next-steps.md` | L1644-1711 |
| `lib/contexts/research-activity-context.tsx` | L13-20 |
| `.specstory/history/deep-research-visualization-component-overview.md` | L800-874 |
| `lib/contexts/research-provider.tsx` | L32-35 |
| `lib/contexts/research-provider.tsx` | L14-32 |
| `lib/contexts/research-activity-context.tsx` | L20-27 |
| `lib/contexts/research-depth-context.tsx` | L87-120 |
| `lib/contexts/research-provider.tsx` | L35-36 |
| `.specstory/history/feature-documentation-review-and-implementation-check.md` | L1244-1311 |

</details>

---

_****_



I see the issue now. The keyboard shortcut for search mode toggle is implemented in the `ChatPanel` component, but the `SearchModeToggle` component is using the `useResearch` context. We need to connect these two together.

Let me modify the `ChatPanel` component to use the research context for toggling search mode:

---

_****_

```diff
  'use client'
  
+ import { useResearch } from '@/contexts/ResearchContext'
  import { AttachmentFile, SearchSource } from '@/lib/types'
  import { cn } from '@/lib/utils'
  }: ChatPanelProps) {
    const [showEmptyScreen, setShowEmptyScreen] = useState(false)
-   const [searchMode, setSearchMode] = useState(false)
    const [isFullSize, setIsFullSize] = useState(false)
    const [isMarkdownView, setIsMarkdownView] = useState(false)
    const router = useRouter()
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const isFirstRender = useRef(true)
-   const [isComposing, setIsComposing] = useState(false) // Composition state
-   const [enterDisabled, setEnterDisabled] = useState(false) // Disable Enter after composition ends
+   const [isComposing, setIsComposing] = useState(false)
+   const [enterDisabled, setEnterDisabled] = useState(false)
    const [attachments, setAttachments] = useState<AttachmentFile[]>([])
    const [isSourcePickerVisible, setIsSourcePickerVisible] = useState(false)
    const [sourcePickerPosition, setSourcePickerPosition] = useState({ top: 0, left: 0 })
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
+   const { toggleSearch } = useResearch()
  
    // Add keyboard shortcuts handler
        if ((e.metaKey || e.ctrlKey) && e.key === '.') {
          e.preventDefault()
-         const newSearchMode = !searchMode
-         setSearchMode(newSearchMode)
-         onSearchModeChange?.(newSearchMode)
+         toggleSearch()
        }
        
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
-   }, [searchMode, onSearchModeChange, modelSelectorOpen])
+   }, [toggleSearch, modelSelectorOpen])
  
    const handleCompositionStart = () => setIsComposing(true)
      setMessages([])
      setShowEmptyScreen(false)
-     setSearchMode(false)
      setIsFullSize(false)
      setIsMarkdownView(false)
        handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLTextAreaElement>)
        setShowEmptyScreen(false)
-       setSearchMode(false)
        setIsFullSize(false)
        setIsMarkdownView(false)
                  <ModelSelector open={modelSelectorOpen} onOpenChange={setModelSelectorOpen} />
                  <SearchModeToggle
-                     enabled={searchMode}
+                     enabled={toggleSearch()}
                      onEnabledChange={(enabled: boolean) => {
-                         setSearchMode(enabled)
+                         toggleSearch()
                          onSearchModeChange?.(enabled)
                      }}
                  />
                  <SearchDepthToggle
-                     enabled={searchMode}
+                     enabled={toggleSearch()}
                      currentDepth={currentDepth}
                      maxDepth={maxDepth}
```

---

_****_



Let me fix those linter errors:

---

_****_



---

_****_



---



---

