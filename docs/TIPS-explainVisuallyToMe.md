[deep-research-visualization.tsx](../components/deep-research-visualization.tsx) Explain visually this component to me and where is it appearing?

*Answer*:
I'll help explain the DeepResearchVisualization component and its visual structure. This component appears to be a sophisticated visualization panel for displaying research-related information in a chat interface.
Location & Appearance:
It appears either in the sidebar (left side) or header (right side) of the application
When in header mode, it's only visible on mobile/small screens (hidden on lg screens)
When in sidebar mode, it's only visible on large screens (hidden on mobile)
Visual Structure:
Main Container
Fixed position panel that can be:
Collapsed (9px width)
Normal (440px width)
Fullscreen (entire screen)
Located on either left (sidebar) or right (header) side
Height spans from top navigation (14px from top) to bottom of viewport
Control Buttons (Absolute positioned)
Collapse toggle button (ChevronLeft/Right)
Fullscreen toggle button (only when expanded)
Located on the opposite edge of the panel (e.g., right side if panel is on left)
Main Content (When expanded)
   ┌─────────────────────────────────┐
   │ Research Status + Clear Button   │
   ├─────────────────────────────────┤
   │ Progress Bar                    │
   ├─────────────────────────────────┤
   │ Tab Navigation                  │
   │ ┌─────┬────────┬───────┬─────┐ │
   │ │Path │Activity│Sources│ ... │ │
   │ └─────┴────────┴───────┴─────┘ │
   ├─────────────────────────────────┤
   │                                 │
   │ Tab Content Area               │
   │ (Scrollable)                   │
   │                                 │
   │                                 │
   └─────────────────────────────────┘
Tabs Content:
Path: Research path visualization
Activity: Chronological list of research activities with status indicators
Sources: List of discovered sources with relevance scores
Suggestions: Research suggestions (can be clicked to select)
History: Timeline of research history
Visual States:
Active/Inactive status indicator (green/gray dot)
Progress bar showing completion status
Activity items with status colors (yellow=pending, green=complete, red=error)
Source items with relevance percentages
This component serves as a comprehensive research visualization dashboard that can be toggled between different views and states, providing users with detailed information about the ongoing or completed research process in their chat interface.
The component is part of what appears to be a larger chat application with AI research capabilities, where it helps users track and visualize the AI's research process, sources, and suggestions in real-time.
Note: There's currently a linter error indicating that the ResearchSuggestions component is missing a required chatId prop, which should be passed down from the parent component's props.