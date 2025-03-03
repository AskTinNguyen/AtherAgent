# OpenAI SDK Import Patterns and TypeScript Best Practices

## Import Patterns

### Correct Import Pattern
```typescript
import { OpenAI } from 'openai'
import { type ChatCompletion, type ChatCompletionChunk } from 'openai/resources/chat/completions'
import { type Stream } from 'openai/streaming'
```

### Common Mistakes to Avoid
```typescript
// ❌ Don't use default import
import OpenAI from 'openai'

// ❌ Don't omit type keyword for type imports
import { ChatCompletion, ChatCompletionChunk } from 'openai/resources/chat/completions'

// ❌ Don't mix type imports without curly braces
import type Stream from 'openai/streaming'
```

## Best Practices

1. **Named Imports**
   - Always use named imports with curly braces `{ OpenAI }`
   - Never use default imports from the OpenAI SDK

2. **Type Imports**
   - Use explicit `type` keyword before each type import
   - Keep type imports in curly braces
   - Example: `import { type ChatCompletion }`

3. **Import Organization**
   - Keep imports organized by external dependencies first
   - Group related OpenAI imports together
   - Separate type imports from value imports

4. **Path Structure**
   - Main SDK: `'openai'`
   - Chat completions: `'openai/resources/chat/completions'`
   - Streaming: `'openai/streaming'`

## Example Implementation

```typescript
// Core OpenAI import
import { OpenAI } from 'openai'

// Type imports from specific modules
import { type ChatCompletion, type ChatCompletionChunk } from 'openai/resources/chat/completions'
import { type Stream } from 'openai/streaming'

// Other dependencies
import { z } from 'zod'  // Example of another dependency
```

## Common Use Cases

```typescript
// Creating an OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Type annotations
async function createCompletion(): Promise<ChatCompletion> {
  // Implementation
}

// Stream handling
async function handleStream(stream: Stream<ChatCompletionChunk>) {
  // Implementation
}
```

## Additional Notes

- These patterns ensure consistency across the codebase
- They provide better TypeScript type inference
- They follow the official OpenAI SDK documentation
- They prevent common TypeScript compilation issues 