# MultimodalChat Implementation Plan

## 1. Architecture Overview ✅

### A. Core Components

*   `/components`
    *   `chat-panel.tsx` ✅           # Main chat component with enhanced features
    *   `/chat`                       # Supporting components
        *   `ImagePreview.tsx` ✅     # Image preview component
        *   `ModelSelector.tsx` ✅    # Model selection component
        *   `SearchModeToggle.tsx` ✅ # Search mode toggle component
    *   `/ui`                         # Shared UI components
        *   `button.tsx` ✅
        *   `icons.tsx` ✅

### B. State Management ✅

```typescript
// Current ChatPanel state
interface ChatPanelState {
  // Core state
  input: string
  isComposing: boolean
  enterDisabled: boolean
  showEmptyScreen: boolean
  
  // View states
  isFullSize: boolean
  isMarkdownView: boolean
  searchMode: boolean
  
  // File handling
  attachments: AttachmentFile[]
  isDragActive: boolean
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

interface Message {
  role: string
  content: string
  id: string
  attachments?: AttachmentFile[]
}
```

## 2. Implementation Strategy

### A. Enhanced ChatPanel Features ✅

1. **Base Functionality**
   * Text input with markdown support ✅
   * Full-size toggle mode ✅
   * Responsive height management ✅
   * IME input support ✅

2. **File Handling**
   * Drag and drop interface ✅
   * File validation ✅
   * Upload progress tracking ✅
   * Preview generation ✅

3. **UI Components**
   * Model selector integration ✅
   * Search mode toggle ✅
   * New chat button ✅
   * Format toggle button ✅

4. **Markdown Features**
   * Toggle between raw/preview ✅
   * Syntax highlighting
   * Custom component styling ✅
   * Responsive layout ✅

## 2. Next Steps

### A. Integration Testing

1. Test each component in isolation:
   - File upload and preview
   - Drag and drop functionality
   - Source insertion
   - Autocomplete suggestions

2. Test component interactions:
   - File upload with message sending
   - Source selection with message context
   - Model selection with state persistence

### B. API Integration

1. Implement file upload endpoints:
   - Create upload handler
   - Add progress tracking
   - Handle optimization for images
   - Implement error handling

2. Enhance message handling:
   - Update message format for attachments
   - Add source context processing
   - Implement file type validation

### C. UI Polish

1. Add loading states and animations:
   - File upload progress
   - Message sending states
   - Autocomplete loading

2. Enhance accessibility:
   - Add ARIA labels
   - Implement keyboard navigation
   - Add screen reader support

3. Add error handling UI:
   - Upload error messages
   - Validation feedback
   - Recovery options

## 3. Testing Strategy

### A. Unit Tests

*   Test component rendering
*   Verify state management
*   Test file handling
*   Validate source integration

### B. Integration Tests

*   Test full message flow
*   Verify file uploads
*   Test source integration
*   Check state persistence

### C. E2E Tests

*   Test complete user flows
*   Verify cross-browser support
*   Test mobile responsiveness
*   Validate error handling

## 4. Deployment Plan

1. Stage 1: Core Components
   - Deploy base components ✅
   - Add basic image and pdf file handling ✅

2. Stage 2: Enhanced Features
   - Add file upload endpoints
   - Implement optimization
   - Add advanced features

3. Stage 3: Polish & Testing
   - Add final UI touches
   - Run full test suite
   - Document features

## 5. Documentation

1. User Documentation
   - Feature overview
   - Usage guidelines
   - Supported file types

2. Developer Documentation
   - Component API
   - State management
   - Integration guide

## 2. Feature Implementation Plan

### A. File Attachment System

*   **Dropzone Implementation**

    ```typescript
    interface FileDropzoneProps {
      onFileAccepted: (files: File[]) => void
      supportedTypes: string[]
      maxSize: number
      isActive: boolean
      onActiveChange: (active: boolean) => void
    }
    ```

*   **File Processing**

    *   Image optimization and validation
    *   Progress tracking with existing loading states
    *   Error handling integrated with current toast system
    *   Backward compatibility with text-only messages

### B. Rich Content Preview

*   **Image Preview Component**

    ```typescript
    interface PreviewProps {
      attachments: AttachmentFile[]
      onRemove: (id: string) => void
      onReorder: (dragIndex: number, dropIndex: number) => void
      expanded: boolean
      onExpandChange: (expanded: boolean) => void
    }
    ```

*   **Preview Features**

    *   Thumbnail generation with loading states
    *   Lazy loading with current suspense boundaries
    *   Drag to reorder with accessibility
    *   Remove capability with undo
    *   Size optimization and caching

### C. Research Source Integration

*   **Source Quick Insert**

    ```typescript
    interface SourceQuickInsertProps {
      sources: ResearchSource[]
      onSourceClick: (source: ResearchSource) => void
      searchMode: boolean      // Integration with existing search
    }
    ```

*   **Source Management**

    *   URL validation with error handling
    *   Duplicate detection
    *   Citation formatting
    *   Context preservation
    *   Integration with existing search results

### D. AI-Powered Autocomplete

*   **Autocomplete Engine**

    ```typescript
    interface AutocompleteEngine {
      getSuggestions: (input: string, context: ChatContext) => Promise<string[]>
      rankSuggestions: (suggestions: string[]) => string[]
      modelContext: string    // Integration with model selector
    }
    ```

*   **Implementation Details**

    *   Debounced input processing (reuse existing debounce)
    *   Context-aware suggestions with model integration
    *   Performance optimization using current patterns
    *   Tab completion with IME support

## 3. User Experience Considerations

### A. File Handling

1.  **Visual Feedback**

    *   Drag overlay with supported file types
    *   Upload progress using existing loading states
    *   Error messages through current toast system
    *   Success confirmation integrated with message flow

2.  **Interaction States**

    *   Drag hover state with accessibility
    *   Upload progress with cancel option
    *   Processing state with existing spinners
    *   Error state with recovery options

### B. Preview Experience

1.  **Layout**

    *   Grid layout for multiple images
    *   Responsive sizing using current breakpoints
    *   Maintain aspect ratios
    *   Loading placeholders with Suspense

2.  **Interactions**

    *   Click to enlarge with modal
    *   Drag to reorder with keyboard support
    *   Remove button with confirmation
    *   Edit metadata with validation

### C. Source Integration

1.  **Source Display**

    *   Compact URL preview in current message style
    *   Source metadata with relevance
    *   Relevance indicator using existing UI patterns
    *   Quick action buttons matching current style

2.  **Insertion UX**

    *   One-click insert with keyboard shortcut
    *   Keyboard shortcuts matching existing ones
    *   Format options with preview
    *   Undo capability using current pattern

## 4. Implementation Phases

### Phase 1: Foundation Integration

*   Enhance `ChatPanel` with new state management
*   Maintain current functionality
*   Add file handling infrastructure
*   Ensure backward compatibility

### Phase 2: Core Features

*   Implement basic file upload with preview
*   Add image optimization and validation
*   Integrate source management with search
*   Maintain existing chat experience

### Phase 3: Enhanced Features

*   Add AI-powered autocomplete
*   Implement advanced preview features
*   Enhance source integration
*   Polish UX and accessibility

### Phase 4: Performance & Polish

*   Optimize image handling
*   Enhance autocomplete performance
*   Fine-tune accessibility
*   Add final UX improvements

#### Recent UI Improvements ✅

1. **Chat Input Height Optimization**
   * Reduced default input height for better space efficiency
   * Adjusted minimum heights:
     - Regular mode: `min-h-8` (reduced from `min-h-12`)
     - Full-size mode: `min-h-[200px]`
   * Implemented responsive max heights:
     - Regular mode: maxRows={10}
     - Full-size mode: `max-h-[500px]`
   * Added overflow handling with `overflow-y-auto`
   * Maintained consistent padding with `px-4 py-3`

2. **Markdown View Height Adjustments**
   * Synchronized height constraints with text input
   * Set markdown view heights:
     - Regular mode: `min-h-12`
     - Full-size mode: `min-h-[120px]` with `max-h-[820px]`
   * Preserved responsive behavior across view modes

## 5. Technical Considerations

### A. Performance

1.  **Image Optimization**

    *   Client-side compression with worker
    *   Lazy loading with Suspense
    *   Progressive loading for large images
    *   Caching strategy using current patterns

2.  **Autocomplete Performance**

    *   Debouncing using existing patterns
    *   Throttling for API calls
    *   Caching suggestions with context
    *   Lightweight rendering with virtualization

3.  **Existing Optimizations**

    *   Maintain current debouncing strategy
    *   Keep component memoization patterns
    *   Integrate with existing loading states
    *   Reuse successful performance patterns

### B. Accessibility

1.  **Keyboard Navigation**

    *   Maintain existing tab order
    *   Integrate new components into focus flow
    *   Keep IME input support
    *   Enhanced keyboard shortcuts

2.  **Screen Reader Support**

    *   ARIA labels following current patterns
    *   Role definitions for new components
    *   State announcements for uploads
    *   Focus management integration

### C. Error Handling

1.  **File Errors**

    *   Size limits with user feedback
    *   Type validation with clear messages
    *   Upload failures with retry
    *   Processing errors with fallback

2.  **Source Errors**

    *   Invalid URLs with validation
    *   Failed fetches with retry
    *   Context errors with recovery
    *   Integration failures with fallback
