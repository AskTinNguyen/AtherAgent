# Chat Components Documentation

## Overview

The chat interface provides a rich chat experience with support for text messages, markdown formatting, file attachments, and an expandable interface.

## Core Components

### ChatPanel (`components/chat-panel.tsx`) ✅

The main chat interface component that integrates all chat functionality.

```typescript
interface ChatPanelProps {
  input: string                    // Current input value
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean              // Loading state for message sending
  messages: Message[]             // Chat message history
  setMessages: (messages: Message[]) => void
  stop: () => void               // Stop message generation
  query?: string                 // Initial query (if any)
  append: (message: Message) => void // Add new message
  onSearchModeChange?: (enabled: boolean) => void // Search mode toggle handler
}
```

Implemented Features ✅:
- Text input with autosize and height management
- File attachments with drag & drop
- Image and PDF previews
- Markdown preview toggle
- Full-size toggle mode
- Model selection
- Search mode toggle
- New chat functionality
- IME input support

### FileDropzone (`components/chat/FileDropzone.tsx`)

Handles file uploads with drag & drop support.

```typescript
interface FileDropzoneProps {
  onFileAccepted: (files: File[]) => void
  supportedTypes: string[]        // Allowed file types
  maxSize: number                // Max file size in bytes
  isActive: boolean              // Dropzone active state
  onActiveChange: (active: boolean) => void
}
```

Features:
- Drag & drop file upload
- File type validation
- Size limit enforcement
- Visual feedback during drag
- Accessibility support

### ImagePreview (`components/chat/ImagePreview.tsx`) ✅

Displays uploaded images and documents.

```typescript
interface PreviewProps {
  attachments: AttachmentFile[]
  onRemove: (id: string) => void
}
```

Features ✅:
- Image thumbnails
- Document previews
- Remove attachments
- Upload progress indication
- Error state handling

### SourceQuickInsert (`components/chat/SourceQuickInsert.tsx`)

Manages research sources and citations.

```typescript
interface SourceQuickInsertProps {
  sources: ResearchSource[]
  onSourceClick: (source: ResearchSource) => void
  searchMode: boolean
}
```

Features:
- Source list with relevance scores
- Quick insertion
- Search mode integration
- Source previews
- Citation formatting

### AutoComplete (`components/chat/AutoComplete.tsx`)

Provides AI-powered text suggestions.

```typescript
interface AutoCompleteProps {
  suggestions: AutocompleteSuggestion[]
  onSelect: (suggestion: AutocompleteSuggestion) => void
  onDismiss: () => void
  inputValue: string
  position: { top: number; left: number }
}
```

Features:
- Context-aware suggestions
- Confidence scores
- Keyboard navigation
- Position tracking
- Dismissible interface

### HistoryItem (`components/history-item.tsx`) ✅

Displays individual chat history items with deletion capability.

```typescript
interface HistoryItemProps {
  chat: Chat                     // Chat data to display
}
```

Features ✅:
- Date formatting with relative time
- Active state indication
- Hover-based delete button
- Confirmation dialog before deletion
- Loading state during deletion
- Redis storage cleanup
- Automatic UI refresh after deletion
- Error state handling with user feedback

Implementation Details:
- Uses Shadcn UI AlertDialog for confirmation
- Handles both chat data and reference deletion in Redis
- Atomic operations using Redis pipeline
- Error handling with user feedback
- Proper cleanup of all related Redis keys
- Handles edge cases:
  - Invalid chat IDs
  - Non-existent chats
  - Failed deletions
  - Network errors
- State management:
  - Loading states
  - Error states
  - UI feedback
  - Automatic refresh

Redis Implementation:
```typescript
// Delete chat data and references
const deleteChat = async (chatId: string) => {
  const redis = await getRedisClient()
  const chatKey = `chat:${chatId}`
  const userChatKey = `user:v2:chat:${userId}`

  // Delete chat data and its reference atomically
  const [deleteResult, removeResult] = await Promise.all([
    redis.del(chatKey),
    redis.zrem(userChatKey, chatKey)
  ])

  return deleteResult && removeResult
}
```

## Types

### Current Types ✅

```typescript
interface Message {
  role: string
  content: string
  id: string
  attachments?: AttachmentFile[]
}

interface AttachmentFile {
  id: string
  file: File
  type: 'image' | 'document' | 'other'
  previewUrl?: string
  status: 'uploading' | 'ready' | 'error'
  progress: number
  url?: string
  error?: string
}

interface ResearchSource {
  id: string
  url: string
  title?: string
  relevance?: number
  snippet?: string
}

interface AutocompleteSuggestion {
  id: string
  text: string
  confidence: number
  source?: ResearchSource
}
```

## Usage Example

```typescript
import { ChatPanel } from '@/components/chat-panel'

function Chat() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Handle message submission
  }

  return (
    <ChatPanel
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isLoading={isLoading}
      messages={messages}
      setMessages={setMessages}
      stop={() => setIsLoading(false)}
      append={(message) => setMessages(prev => [...prev, message])}
      onSearchModeChange={(enabled) => console.log('Search mode:', enabled)}
    />
  )
}
```

## File Upload Flow ✅

1. User drags or selects files
2. Files are validated (type and size)
3. Upload starts with progress tracking
4. Previews are generated for images
5. Success/error states are handled
6. Attachments can be removed

## Current Features

### Input Management ✅
- Expandable text input
- Markdown preview toggle
- Full-size mode toggle
- IME composition handling
- Enter key submission
- Shift+Enter for new lines

### File Handling ✅
- Drag and drop support
- File type validation
- Upload progress tracking
- Preview generation
- Error handling
- Removal capability

### UI Components ✅
- Model selector
- Search mode toggle
- New chat button
- Format toggle
- Submit/Stop button
- Loading states

### Keyboard Shortcuts ✅
- Search Mode Toggle:
  - Mac: `⌘ + .`
  - Windows/Linux: `Ctrl + .`
  - Visual indicator in button
  - Prevents default browser behavior
  - Accessible across entire chat interface

- Model Selector:
  - Mac: `⌘ + ↑`
  - Windows/Linux: `Ctrl + ↑`
  - Visual indicator in button (hidden on mobile)
  - Controlled component state
  - Preserves selected model on toggle

### Markdown Support ✅
- Preview mode
- Custom styling
- Dark mode support
- Responsive layout
- GFM support via remark-gfm

### Chat History Management ✅
- Individual chat deletion
- Hover-based controls
- Confirmation dialogs
- Loading states
- Redis storage cleanup
- Automatic UI updates
- Error handling

## Search Source Quick Insert Feature 🚀

### Overview
The Search Source Quick Insert feature allows users to quickly reference and insert URLs from previous search results in the chat history into their current message. Sources are stored in messages and can be accessed via the @ trigger in the chat input.

### Components Structure

#### SearchSourceManager (`components/chat/SearchSourceManager.tsx`)
```typescript
interface SearchSourceManagerProps {
  messages: Message[]      // To extract search sources from chat history
  onSourceSelect: (source: SearchSource) => void
  inputValue: string      // Current input value for context
  position: {             // For positioning the source picker
    top: number
    left: number
  }
  isVisible: boolean      // Control visibility of the source picker
  onClose: () => void    // Handle closing the source picker
}
```

### Implementation Details ✅

#### Source Storage
- Sources are automatically extracted from search results
- Stored in messages using ExtendedMessage type:
```typescript
interface ExtendedMessage extends Message {
  searchSources?: SearchSource[]
}

interface SearchSource {
  url: string
  title?: string
  snippet?: string
  timestamp: number
  messageId: string
  searchQuery?: string
}
```

#### Source Filtering ✅
- Shows all sources when @ is first typed
- Filters based on text after @ symbol
- Matches against title, URL, and snippet
- Updates in real-time as user types
- Preserves selection state during filtering

#### Position Calculation ✅
- Accurate caret position tracking
- Accounts for:
  - Scroll position
  - Text wrapping
  - Padding and line height
  - Viewport boundaries
- Prevents picker from going off-screen

#### Keyboard Navigation ✅
- Arrow Up/Down: Navigate through sources
- Enter: Select current source
- Escape: Close picker
- Maintains selection state during filtering

#### Source Insertion ✅
- Inserts as markdown link: `[Title](URL)`
- Uses title if available, falls back to URL
- Preserves text before and after insertion
- Automatically focuses textarea after insertion
- Places cursor after inserted link for continued typing

#### Keyboard Shortcuts Implementation ✅
- Centralized keyboard event handling in ChatPanel
- Event listeners with proper cleanup
- Platform-specific shortcut detection:
  ```typescript
  const isMac = navigator.platform.toLowerCase().includes('mac')
  const shortcutText = isMac ? '⌘' : 'Ctrl'
  ```
- Controlled component architecture:
  ```typescript
  interface ModelSelectorProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
  ```
- Visual feedback:
  ```tsx
  <kbd className="ml-2 text-[10px] text-muted-foreground">
    {shortcutText} + {key}
  </kbd>
  ```
- State management:
  - Search mode toggle state
  - Model selector open state
  - Proper dependency tracking in useEffect
  - Event prevention for browser defaults

### Usage Flow ✅

1. **Source Creation**
   - Search results automatically stored in messages
   - Sources include metadata (title, URL, snippet)

2. **Source Access**
   - Type @ to trigger source picker
   - Picker appears at cursor position
   - All available sources shown initially

3. **Source Selection**
   - Filter by typing after @
   - Navigate with keyboard or mouse
   - Click or press Enter to select

4. **Post-Selection**
   - Source inserted as markdown link
   - Textarea automatically focused
   - Cursor positioned for continued typing

### Best Practices

1. **Performance**
   - Efficient source extraction and storage
   - Optimized source filtering
   - Smart source management
   - Batched state updates

2. **UX Considerations**
   - Intuitive @ trigger mechanism
   - Clear source presentation
   - Keyboard navigation support
   - Responsive picker positioning
   - Seamless typing experience

3. **Source Management**
   - Proper source storage in messages
   - Efficient source retrieval
   - Source metadata preservation
   - Duplicate handling

### Future Improvements
1. Source categorization
2. Enhanced filtering algorithms
3. Source preview improvements
4. Undo/redo support
5. Visual feedback enhancements

## Best Practices

1. **State Management**
   - Controlled components
   - Loading state handling
   - Error state management
   - File upload tracking

2. **Performance**
   - Optimized height calculations
   - Efficient file handling
   - Responsive layout
   - Preview management

3. **Error Handling**
   - File validation
   - Upload error handling
   - User feedback
   - Recovery options

4. **Accessibility**
   - Keyboard support
   - Screen reader compatibility
   - Loading indicators
   - Error announcements 