# Research Depth Management Architecture

## Overview
This document tracks the implementation of research depth management in the AtherAgent system.

## Architecture

### 1. USER CONFIGURATION (Forward-Looking)
─────────────────────────────────────
SearchDepthToggle
├─ Purpose: Configure next research depth only
├─ Props:
│  └─ enabled={searchMode}
│
└─ UI State:
   ├─ Configures: targetDepth (1 to maxAllowedDepth)
   ├─ Shows: current targetDepth/maxAllowedDepth
   └─ No current progress shown

Status: ✅ Complete
- [x] Component accepts forward-looking props only
- [x] Removed current progress display
- [x] Implement configuration persistence
- [x] Connect to ResearchContext

### 2. RESEARCH STATE MANAGEMENT
──────────────────────────────
ResearchContext
├─ Configuration (for next research)
│  ├─ targetDepth: number
│  ├─ maxAllowedDepth: number
│  └─ sessionConfig: {
│     ├─ sessionId: string
│     └─ timestamp: number
│  }
│
└─ Progress (current research)
   ├─ currentDepth: number
   ├─ maxDepth: number
   └─ sessionState: {
      ├─ sessionId: string
      ├─ startTime: number
      └─ status: 'idle' | 'running' | 'completed'
   }

Status: ✅ Complete
- [x] Update ResearchContext types
- [x] Implement configuration state
- [x] Add session management
- [x] Connect with SearchDepthToggle
- [x] Add state transitions

Next:
- Implement ResearchManager for state transitions
- Test the complete flow with real research sessions

### 3. RESEARCH VISUALIZATION (Current Progress)
─────────────────────────────────────────
DeepResearchVisualization
├─ Purpose: Show current research progress
├─ Displays:
│  ├─ Current depth progress
│  ├─ Research quality metrics
│  └─ Source analysis
└─ No configuration controls

Status: ✅ Complete
- [x] Already properly separated
- [x] Only shows current progress
- [x] No configuration controls

### 4. STATE TRANSITIONS
──────────────────
ResearchManager
├─ Handles research session lifecycle
│  ├─ Start: Apply targetDepth → maxDepth
│  ├─ End: Reset progress state
│  └─ Interrupt: Save state for resume
│
└─ Session Management
   ├─ Generate unique session IDs
   └─ Track session history

Status: ✅ Complete
- [x] Define session lifecycle states
- [x] Implement basic state transitions
- [x] Add session tracking
- [x] Add state persistence
- [ ] Add recovery mechanisms

Next:
- Implement recovery mechanisms for interrupted sessions
- Add error handling for edge cases
- Add session cleanup utilities

### 5. PERSISTENCE LAYER
──────────────────
LocalStorage
├─ research_config
│  ├─ targetDepth
│  ├─ maxAllowedDepth
│  └─ lastSessionId
│
└─ research_sessions
   └─ [sessionId]: {
      ├─ config: ResearchConfig
      ├─ timestamp: number
      └─ status: string
   }

Status: ⏳ In Progress
- [x] Implement storage utilities
- [x] Add configuration persistence
- [x] Add session storage
- [ ] Add recovery mechanisms

## Implementation Plan

1. ✅ SearchDepthToggle
   - Component is complete and working as expected
   - Forward-looking configuration only
   - Connected to ResearchContext

2. ✅ ResearchContext
   - State management implementation complete
   - Session management implemented
   - State transitions added

3. ✅ ResearchManager
   - Session tracking implemented
   - Persistence layer integrated
   - Basic error handling added

4. ⏳ Recovery Mechanisms
   - Next major component to implement
   - Will handle interrupted sessions
   - Will provide error recovery

## Data Flow Implementation Status

1. User Input Flow: ✅ Complete
   - SearchDepthToggle changes implemented
   - Configuration flow established

2. Research Execution Flow: ✅ Complete
   - ResearchContext updates implemented
   - Researcher.ts integration complete

3. Progress Visualization Flow: ✅ Complete
   - Already properly separated in DeepResearchVisualization

4. Session Transition: ⏳ In Progress
   - Basic transitions implemented
   - Need to add recovery mechanisms

## Notes
- Keep SearchDepthToggle focused only on future configuration
- Maintain clear separation between current progress and future configuration
- Ensure smooth state transitions between research sessions
- Add proper error handling for state transitions
- Implement robust recovery mechanisms for interrupted sessions

DATA FLOW
─────────
1. User Input Flow:
   User → SearchDepthToggle → ResearchContext.configuration
   └─ Only affects future research

2. Research Execution Flow:
   ResearchContext.configuration → Researcher.ts → ResearchContext.progress
   └─ Current research uses its own maxDepth

3. Progress Visualization Flow:
   ResearchContext.progress → DeepResearchVisualization
   └─ Shows only current progress

4. Session Transition:
   When new research starts:
   ├─ Generate new sessionId
   ├─ Copy targetDepth to maxDepth
   └─ Reset currentDepth to 1