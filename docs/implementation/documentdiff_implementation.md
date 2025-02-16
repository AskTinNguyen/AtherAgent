## 9. Document Diffing System Deep Dive

### Overview
The Document Diffing System is a crucial component that enables tracking and visualizing how research content evolves across different depth levels. Based on our analysis of the reference implementation, this system provides sophisticated diffing capabilities at multiple granularity levels.

### Core Functionality

1. **Multi-Level Diffing**
   ```typescript
   interface DocumentDiffing {
     // Sentence-level diffing for detailed text analysis
     sentenceDiff: {
       compareTexts: (oldText: string, newText: string) => SentenceDiffResult
       tokenizeSentences: (text: string) => string[]
       highlightChanges: (diffs: SentenceDiffResult) => HighlightedText
     }
     
     // Node-based structural diffing
     structuralDiff: {
       compareNodes: (oldNode: Node, newNode: Node) => NodeDiffResult
       patchDocument: (oldDoc: Node, patches: NodeDiffResult) => Node
       normalizeContent: (node: Node) => NormalizedNode[]
     }
     
     // Research path diffing
     pathDiff: {
       compareResearchPaths: (oldPath: ResearchPath, newPath: ResearchPath) => PathDiffResult
       visualizePathChanges: (diffs: PathDiffResult) => PathVisualization
     }
   }
   ```

### User Benefits

1. **Research Evolution Tracking**
   - Users can see how information evolves as research goes deeper
   - Highlights new discoveries at each depth level
   - Shows refinements in understanding over time
   
2. **Quality Assessment**
   ```typescript
   interface QualityMetrics {
     contentEvolution: {
       newInsights: number        // Count of new significant findings
       refinements: number        // Count of refined/improved explanations
       contradictions: number     // Count of contradictory information
     }
     sourceProgression: {
       authorityIncrease: number  // Improvement in source authority
       depthRelevance: number     // Relevance at current depth
       crossValidation: number    // Cross-reference validation score
     }
   }
   ```

3. **Visual Progress Indicators**
   ```typescript
   interface DiffVisualization {
     highlightTypes: {
       newContent: 'insertion'      // New information discovered
       refinedContent: 'refinement' // Existing info refined
       contradiction: 'conflict'    // Contradictory information
       validation: 'confirmation'   // Cross-validated information
     }
     renderOptions: {
       inlineHighlighting: boolean  // Show changes inline
       sideBySideView: boolean      // Compare views side by side
       progressiveView: boolean     // Show changes over depth levels
     }
   }
   ```

### Integration with Existing Components

1. **Chat Panel Enhancement**
   ```typescript
   interface DiffAwareChatPanel extends ChatPanelProps {
     diffVisualization: {
       showInlineChanges: boolean
       highlightNewInsights: boolean
       trackSourceEvolution: boolean
     }
     diffControls: {
       toggleDiffView: () => void
       selectDiffLevel: (depth: number) => void
       filterChangeTypes: (types: string[]) => void
     }
   }
   ```

2. **Search Results Integration**
   ```typescript
   interface DiffAwareSearchResults extends SearchResultsProps {
     diffHighlights: {
       newFindings: HighlightData[]
       refinements: HighlightData[]
       validations: HighlightData[]
     }
     evolutionMetrics: {
       depthProgress: number
       qualityImprovement: number
       sourceReliability: number
     }
   }
   ```

### Implementation Strategy

1. **Phase 1: Core Diffing 📅**
   - [ ] Implement sentence-level diffing
   - [ ] Add structural comparison
   - [ ] Create basic visualization
   > Note: Reference implementation available in `REF-deep-research-diff.js`. This is a reference file only and not actual implementation.

2. **Phase 2: Enhanced Visualization 📅**
   - [ ] Add inline diff highlights
   - [ ] Implement side-by-side comparison
   - [ ] Create progress visualization

3. **Phase 3: Quality Metrics 📅**
   - [ ] Add content evolution tracking
   - [ ] Implement source progression metrics
   - [ ] Create quality assessment dashboard

### Technical Insights from Reference Implementation

1. **Reference Analysis** ℹ️
   The following insights are derived from analyzing `REF-deep-research-diff.js` as a reference implementation:
   - Efficient diffing algorithms using diff-match-patch
   - Smart text chunking strategies
   - Node-based structural comparison approaches
   - Performance optimization techniques

2. **Proposed Implementation Approach**
   ```typescript
   // TODO: Implement our own version based on reference insights
   interface DeepResearchDiff {
     // Core diffing functionality
     compareDepthLevels: (prevLevel: number, nextLevel: number) => DepthDiff
     trackResearchProgress: (path: ResearchPath) => ProgressMetrics
     visualizeChanges: (changes: DepthDiff) => VisualizationData
   }
   ```

### Next Steps

1. **Immediate Implementation**
   - Integrate core diffing algorithm
   - Add basic visualization
   - Implement change tracking

2. **Future Enhancements**
   - Add advanced metrics
   - Implement interactive navigation
   - Create detailed diff reports

## 10. Reference Documents

### Core Reference Files

1. **`REF-deep-research-diff.js`**
   - **Purpose**: Reference implementation for document diffing and comparison
   - **Key Features**:
     ```typescript
     // Core diffing capabilities
     - patchDocumentNode: (schema, oldNode, newNode) => Node
     - patchTextNodes: (schema, oldNode, newNode) => Node[]
     - diffEditor: (schema, oldDoc, newDoc) => Node
     ```
   - **Implementation Insights**:
     - Uses diff-match-patch for efficient text comparison
     - Implements sentence-level tokenization
     - Provides hierarchical node-based diffing
     - Includes performance optimizations for large documents

2. **`REF-deep-research-functions.tsx`**
   - **Purpose**: Reference for research-related utility functions
   - **Key Features**:
     ```typescript
     // Document management utilities
     - buildDocumentFromContent: (content: string) => Node
     - buildContentFromDocument: (document: Node) => string
     - createDecorations: (suggestions: Array<UISuggestion>, view: EditorView) => DecorationSet
     ```
   - **Implementation Insights**:
     - Markdown processing and rendering
     - Document state management
     - UI decoration handling

3. **`REF-deep-research-suggestions.tsx`**
   - **Purpose**: Reference for suggestion system implementation
   - **Key Features**:
     ```typescript
     // Suggestion management
     interface UISuggestion extends Suggestion {
       selectionStart: number
       selectionEnd: number
     }
     - projectWithPositions: (doc: Node, suggestions: Array<Suggestion>) => Array<UISuggestion>
     - createSuggestionWidget: (suggestion: UISuggestion, view: EditorView) => Widget
     ```
   - **Implementation Insights**:
     - Position-aware suggestions
     - Real-time suggestion updates
     - Plugin-based architecture

### Reference Implementation Status

#### Analyzed ✅
- [x] Core diffing algorithms from `REF-deep-research-diff.js`
- [x] Document management utilities from `REF-deep-research-functions.tsx`
- [x] Suggestion system from `REF-deep-research-suggestions.tsx`

#### Insights Extracted 📝
- [x] Diffing strategies and optimizations
- [x] Document state management patterns
- [x] UI component integration approaches

#### Pending Analysis 📅
- [ ] Performance optimization techniques
- [ ] Error handling strategies
- [ ] Edge case management

### Integration Considerations

1. **Adaptation Requirements**
   ```typescript
   // Areas requiring custom implementation
   interface CustomImplementation {
     diffing: {
       algorithm: 'custom' | 'adapted'
       optimizations: string[]
       constraints: string[]
     }
     stateManagement: {
       persistence: 'redis' | 'memory'
       sync: 'realtime' | 'batch'
     }
     ui: {
       components: string[]
       interactions: string[]
     }
   }
   ```

2. **Reference vs Implementation**
   - Reference code provides architectural guidance only
   - Custom implementation needed for specific requirements
   - Performance optimizations must be tailored to our use case