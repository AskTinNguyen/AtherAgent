## SpecStory

## Streamlining Ather AI Command Prompts (2/13/2025, 5:57:29 PM)

_**User**_

Check my @command-example.tsx , help me clean up, so that the ATHER AI Commands are simple "saved prompts" that can be quickly fired out into the Chat Panel and trigger a new conversation

---

_**Assistant**_

I'll help you clean up the command-example.tsx file to simplify the Ather AI Commands. Let me analyze the current implementation and propose changes.

First, I'll examine the current file to understand its structure.

The main changes we need to make are:
1. Simplify the ATHER_SYSTEM_PROMPTS to be more direct saved prompts
2. Streamline the command actions to just trigger these prompts
3. Keep the core functionality of dispatching to chat panel

Here's how I'll modify the file:

---

_****_

```diff
  }
  
- // Add system prompts for each command type
+ // Simplified saved prompts for quick access
  const ATHER_SYSTEM_PROMPTS: SystemPrompts = {
-   understand: `You are an expert at analyzing and summarizing text. Your goal is to:
- 1. Identify key points and main ideas
- 2. Provide clear, concise summaries
- 3. Extract important insights and patterns
- 4. Maintain the original context and meaning
- Please analyze the following text:`,
+   understand: `I want you to analyze and summarize the following text, focusing on key points and main ideas while maintaining context:`,
  
-   research: `You are a research assistant with deep knowledge across multiple domains. Your goal is to:
- 1. Provide comprehensive, well-researched information
- 2. Cite relevant sources and examples
- 3. Consider multiple perspectives
- 4. Identify key trends and developments
- Please research the following topic:`,
+   research: `I want you to act as a research assistant and provide comprehensive information about the following topic:`,
  
-   code: `You are an expert software developer and code analyst. Your goal is to:
- 1. Write clean, efficient, and maintainable code
- 2. Explain complex technical concepts clearly
- 3. Follow best practices and patterns
- 4. Consider edge cases and error handling
- Please assist with the following code request:`,
+   code: `I want you to act as an expert software developer. Please help me with the following code-related request:`,
  
-   explain: `You are a knowledgeable teacher and expert explainer. Your goal is to:
- 1. Break down complex concepts into simple terms
- 2. Provide clear examples and analogies
- 3. Build understanding step by step
- 4. Address common misconceptions
- Please explain the following concept:`
+   explain: `I want you to explain the following concept in clear, simple terms with examples:`
  }
  
  }
  
- // Add this helper to dispatch chat messages
+ // Simplified helper to dispatch chat messages
  function dispatchChatMessage(systemPrompt: string, userContent: string) {
-   // First, send the system message
+   // Create a new conversation with the system prompt and user content
    document.dispatchEvent(new CustomEvent('chat-message', {
      detail: createChatMessage(systemPrompt, 'system')
    }))
  
-   // Then, send the user message
    document.dispatchEvent(new CustomEvent('chat-message', {
      detail: createChatMessage(userContent, 'user')
    }))
  
-   // Finally, trigger the send action
+   // Trigger send
    document.dispatchEvent(new CustomEvent('chat-send'))
  }
  const AI_ROOT_ACTION: Action = {
    id: 'ather-root',
-   name: 'AI Commands',
+   name: 'Quick Prompts',
    keywords: '',
    section: 'AI',
-   subtitle: 'Process text with AI'
+   subtitle: 'Launch saved prompts'
  }
  
    const { query } = useKBar()
  
-   // Add Ather AI actions
+   // Simplified Ather AI actions
    const atherActions: Action[] = [
      {
        id: 'ather-understand',
-       name: 'Text Understanding',
+       name: 'Analyze Text',
        shortcut: ['meta', 'shift', 't'],
        keywords: 'analyze summarize understand text',
-       subtitle: 'Analyze or summarize any text',
+       subtitle: 'Analyze or summarize text',
        parent: 'ather-root',
        icon: <Brain className="w-4 h-4" />,
      {
        id: 'ather-research',
-       name: 'Research Assistant',
+       name: 'Research Topic',
        shortcut: ['meta', 'shift', 'r'],
        keywords: 'research investigate study topic',
-       subtitle: 'Deep research on any topic',
+       subtitle: 'Research any topic',
        parent: 'ather-root',
        icon: <Search className="w-4 h-4" />,
      {
        id: 'ather-code',
-       name: 'Code Assistant',
+       name: 'Code Help',
        shortcut: ['meta', 'shift', 'c'],
-       keywords: 'code program develop explain optimize',
-       subtitle: 'Help with coding tasks',
+       keywords: 'code program develop explain',
+       subtitle: 'Get coding assistance',
        parent: 'ather-root',
        icon: <Code className="w-4 h-4" />,
      {
        id: 'ather-explain',
-       name: 'Knowledge Base',
+       name: 'Explain Concept',
        shortcut: ['meta', 'shift', 'k'],
        keywords: 'explain understand learn concept',
-       subtitle: 'Explain concepts and answer questions',
+       subtitle: 'Get concept explanations',
        parent: 'ather-root',
        icon: <BookOpen className="w-4 h-4" />,
```

---

_****_



I've made several key changes to simplify the command interface:

1. **Simplified System Prompts**:
   - Removed the verbose, multi-point prompts
   - Replaced them with direct, single-sentence prompts that are more focused
   - Made them more conversational and action-oriented

2. **Streamlined Command Actions**:
   - Renamed the root action from "AI Commands" to "Quick Prompts"
   - Made command names shorter and more action-oriented
   - Simplified subtitles to be more concise
   - Kept the core functionality intact while making it more user-friendly

3. **Improved Helper Function**:
   - Simplified the comments in `dispatchChatMessage`
   - Maintained the same functionality but with clearer purpose

4. **UI/UX Improvements**:
   - Made command names more action-oriented (e.g., "Analyze Text" instead of "Text Understanding")
   - Kept the same keyboard shortcuts for consistency
   - Maintained the same icons for visual recognition

The core functionality remains the same - users can still:
1. Type their text into the command bar
2. Select a quick prompt action
3. Have it immediately dispatched to the chat panel with the appropriate system prompt

This simplified version makes the commands more straightforward while maintaining all the essential functionality. The prompts are now more direct and easier to understand, which should make them more effective for quick access.

Would you like me to make any additional adjustments to the simplification?

---



---

