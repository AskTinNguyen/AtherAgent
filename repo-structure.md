# Repository Structure

This document provides a complete overview of the project's directory structure, excluding development directories like `node_modules`, `.git`, `.next`, etc.

## Directory Tree
```
.
├── ./.cursor
│   ├── ./.cursor/rules
│   │   ├── ./.cursor/rules/coding-principles.mdc
│   │   ├── ./.cursor/rules/next-js.mdc
│   │   ├── ./.cursor/rules/openai-sdk.mdc
│   │   ├── ./.cursor/rules/reference-code.mdc
│   │   └── ./.cursor/rules/vercel-ai-sdk.mdc
│   └── ./.cursor/.DS_Store
├── ./.github
│   └── ./.github/ISSUE_TEMPLATE
│       ├── ./.github/ISSUE_TEMPLATE/bug_report.yml
│       └── ./.github/ISSUE_TEMPLATE/feature_request.yml
├── ./.husky
│   └── ./.husky/_
│       ├── ./.husky/_/.gitignore
│       └── ./.husky/_/husky.sh
├── ./.swc
│   └── ./.swc/plugins
│       └── ./.swc/plugins/v7_macos_aarch64_4.0.0
├── ./.vscode
│   └── ./.vscode/settings.json
├── ./app
│   ├── ./app/api
│   │   ├── ./app/api/advanced-search
│   │   │   └── ./app/api/advanced-search/route.ts
│   │   ├── ./app/api/auth
│   │   │   ├── ./app/api/auth/[...nextauth]
│   │   │   │   └── ./app/api/auth/[...nextauth]/route.ts
│   │   │   └── ./app/api/auth/session
│   │   │       └── ./app/api/auth/session/route.ts
│   │   ├── ./app/api/bookmarks
│   │   │   ├── ./app/api/bookmarks/check
│   │   │   │   └── ./app/api/bookmarks/check/route.ts
│   │   │   ├── ./app/api/bookmarks/cleanup
│   │   │   │   ├── ./app/api/bookmarks/cleanup/verify
│   │   │   │   │   └── ./app/api/bookmarks/cleanup/verify/route.ts
│   │   │   │   └── ./app/api/bookmarks/cleanup/route.ts
│   │   │   ├── ./app/api/bookmarks/verify
│   │   │   │   └── ./app/api/bookmarks/verify/route.ts
│   │   │   └── ./app/api/bookmarks/route.ts
│   │   ├── ./app/api/chat
│   │   │   ├── ./app/api/chat/[id]
│   │   │   │   └── ./app/api/chat/[id]/route.ts
│   │   │   └── ./app/api/chat/route.ts
│   │   ├── ./app/api/chats
│   │   │   └── ./app/api/chats/[chatId]
│   │   │       └── ./app/api/chats/[chatId]/research
│   │   │           └── ./app/api/chats/[chatId]/research/route.ts
│   │   ├── ./app/api/research
│   │   │   └── ./app/api/research/suggestions
│   │   │       ├── ./app/api/research/suggestions/cache
│   │   │       │   └── ./app/api/research/suggestions/cache/route.ts
│   │   │       └── ./app/api/research/suggestions/route.ts
│   │   ├── ./app/api/search
│   │   │   └── ./app/api/search/[id]
│   │   │       └── ./app/api/search/[id]/results
│   │   │           └── ./app/api/search/[id]/results/route.ts
│   │   ├── ./app/api/upload
│   │   │   └── ./app/api/upload/route.ts
│   │   ├── ./app/api/usage
│   │   │   └── ./app/api/usage/route.ts
│   │   └── ./app/api/v1
│   │       ├── ./app/api/v1/chats
│   │       └── ./app/api/v1/research
│   │           └── ./app/api/v1/research/[chatId]
│   ├── ./app/auth
│   │   ├── ./app/auth/error
│   │   └── ./app/auth/signin
│   │       └── ./app/auth/signin/page.tsx
│   ├── ./app/bookmarks
│   │   └── ./app/bookmarks/page.tsx
│   ├── ./app/chart-test
│   │   └── ./app/chart-test/page.tsx
│   ├── ./app/search
│   │   ├── ./app/search/[id]
│   │   │   └── ./app/search/[id]/page.tsx
│   │   └── ./app/search/page.tsx
│   ├── ./app/share
│   │   └── ./app/share/[id]
│   │       └── ./app/share/[id]/page.tsx
│   ├── ./app/favicon.ico
│   ├── ./app/globals.css
│   ├── ./app/layout.tsx
│   ├── ./app/opengraph-image.png
│   └── ./app/page.tsx
├── ./components
│   ├── ./components/auth
│   ├── ./components/chat
│   │   ├── ./components/chat/AutoComplete.tsx
│   │   ├── ./components/chat/ImagePreview.tsx
│   │   ├── ./components/chat/SearchSourceManager.tsx
│   │   └── ./components/chat/SourceQuickInsert.tsx
│   ├── ./components/providers
│   │   └── ./components/providers/session-provider.tsx
│   ├── ./components/search
│   │   ├── ./components/search/search-header.tsx
│   │   ├── ./components/search/search-result-card.tsx
│   │   └── ./components/search/search-results-grid.tsx
│   ├── ./components/shared
│   │   └── ./components/shared/error-boundary.tsx
│   ├── ./components/skeletons
│   │   └── ./components/skeletons/index.tsx
│   ├── ./components/ui
│   │   ├── ./components/ui/accordion.tsx
│   │   ├── ./components/ui/alert-dialog.tsx
│   │   ├── ./components/ui/alert.tsx
│   │   ├── ./components/ui/avatar.tsx
│   │   ├── ./components/ui/badge.tsx
│   │   ├── ./components/ui/button.tsx
│   │   ├── ./components/ui/card.tsx
│   │   ├── ./components/ui/carousel.tsx
│   │   ├── ./components/ui/chart.tsx
│   │   ├── ./components/ui/checkbox.tsx
│   │   ├── ./components/ui/codeblock.tsx
│   │   ├── ./components/ui/collapsible.tsx
│   │   ├── ./components/ui/command.tsx
│   │   ├── ./components/ui/dialog.tsx
│   │   ├── ./components/ui/dropdown-menu.tsx
│   │   ├── ./components/ui/icons.tsx
│   │   ├── ./components/ui/input.tsx
│   │   ├── ./components/ui/label.tsx
│   │   ├── ./components/ui/markdown.tsx
│   │   ├── ./components/ui/popover.tsx
│   │   ├── ./components/ui/progress.tsx
│   │   ├── ./components/ui/scroll-area.tsx
│   │   ├── ./components/ui/select.tsx
│   │   ├── ./components/ui/separator.tsx
│   │   ├── ./components/ui/sheet.tsx
│   │   ├── ./components/ui/skeleton.tsx
│   │   ├── ./components/ui/slider.tsx
│   │   ├── ./components/ui/sonner.tsx
│   │   ├── ./components/ui/spinner.tsx
│   │   ├── ./components/ui/status-indicator.tsx
│   │   ├── ./components/ui/switch.tsx
│   │   ├── ./components/ui/tabs.tsx
│   │   ├── ./components/ui/textarea.tsx
│   │   ├── ./components/ui/toggle.tsx
│   │   └── ./components/ui/tooltip.tsx
│   ├── ./components/visualization
│   │   ├── ./components/visualization/activity-item.tsx
│   │   ├── ./components/visualization/metrics-grid.tsx
│   │   ├── ./components/visualization/research-command-center.tsx
│   │   ├── ./components/visualization/research-content.tsx
│   │   ├── ./components/visualization/research-diff-view.tsx
│   │   ├── ./components/visualization/research-findings.tsx
│   │   ├── ./components/visualization/research-header.tsx
│   │   ├── ./components/visualization/research-history-timeline.tsx
│   │   ├── ./components/visualization/research-path-visualization.tsx
│   │   ├── ./components/visualization/research-tabs.tsx
│   │   ├── ./components/visualization/research-timeline.tsx
│   │   └── ./components/visualization/source-item.tsx
│   ├── ./components/answer-section.tsx
│   ├── ./components/blur-reveal.tsx
│   ├── ./components/bookmark-manager.tsx
│   ├── ./components/chart-message.tsx
│   ├── ./components/chat-messages.tsx
│   ├── ./components/chat-panel.tsx
│   ├── ./components/chat-share.tsx
│   ├── ./components/chat.tsx
│   ├── ./components/clear-history.tsx
│   ├── ./components/client-header-actions.tsx
│   ├── ./components/collapsible-message.tsx
│   ├── ./components/custom-link.tsx
│   ├── ./components/deep-research-config.tsx
│   ├── ./components/deep-research-visualization.tsx
│   ├── ./components/default-skeleton.tsx
│   ├── ./components/diff-view.tsx
│   ├── ./components/empty-screen.tsx
│   ├── ./components/footer.tsx
│   ├── ./components/header.tsx
│   ├── ./components/history-container.tsx
│   ├── ./components/history-item.tsx
│   ├── ./components/history-list.tsx
│   ├── ./components/history-skeleton.tsx
│   ├── ./components/history.tsx
│   ├── ./components/message-actions.tsx
│   ├── ./components/message.tsx
│   ├── ./components/mode-toggle.tsx
│   ├── ./components/model-selector.tsx
│   ├── ./components/ranked-search-results.tsx
│   ├── ./components/reasoning-answer-section.tsx
│   ├── ./components/related-questions.tsx
│   ├── ./components/render-message.tsx
│   ├── ./components/research-diff-view.tsx
│   ├── ./components/research-history-timeline.tsx
│   ├── ./components/research-initializer.tsx
│   ├── ./components/research-suggestions.tsx
│   ├── ./components/retrieve-section.tsx
│   ├── ./components/search-depth-toggle.tsx
│   ├── ./components/search-mode-toggle.tsx
│   ├── ./components/search-results-image.tsx
│   ├── ./components/search-results.tsx
│   ├── ./components/search-section.tsx
│   ├── ./components/section.tsx
│   ├── ./components/sidebar.tsx
│   ├── ./components/theme-provider.tsx
│   ├── ./components/tool-badge.tsx
│   ├── ./components/tool-section.tsx
│   ├── ./components/usage-stats.tsx
│   ├── ./components/user-message.tsx
│   ├── ./components/video-search-results.tsx
│   └── ./components/video-search-section.tsx
├── ./docs
│   ├── ./docs/AI-streaming_explanation.md
│   ├── ./docs/BetterVercel_Implementation.md
│   ├── ./docs/CONFIGURATION.md
│   ├── ./docs/MasterProjectTracker.md
│   ├── ./docs/TIPS-explainVisuallyToMe.md
│   ├── ./docs/To Do lists.md
│   ├── ./docs/UI-cleanup-implementation.md
│   ├── ./docs/bookmark_implementation.md
│   ├── ./docs/chart-implementation.md
│   ├── ./docs/chat-components_implementation.md
│   ├── ./docs/deep-research-enhancement.md
│   ├── ./docs/deep-research-visualization-fixes.md
│   ├── ./docs/deepsearch_implementation.md
│   ├── ./docs/documentdiff_implementation.md
│   ├── ./docs/openai-sdk-imports.md
│   └── ./docs/research-command-center.md
├── ./lib
│   ├── ./lib/actions
│   │   └── ./lib/actions/chat.ts
│   ├── ./lib/agents
│   │   ├── ./lib/agents/generate-related-questions.ts
│   │   ├── ./lib/agents/manual-researcher.ts
│   │   └── ./lib/agents/researcher.ts
│   ├── ./lib/ai
│   │   └── ./lib/ai/research-processor.ts
│   ├── ./lib/constants
│   │   └── ./lib/constants/index.ts
│   ├── ./lib/contexts
│   │   ├── ./lib/contexts/research-activity-context.tsx
│   │   ├── ./lib/contexts/research-context.tsx
│   │   ├── ./lib/contexts/research-depth-context.tsx
│   │   ├── ./lib/contexts/research-provider.tsx
│   │   └── ./lib/contexts/research-sources-context.tsx
│   ├── ./lib/diff
│   │   ├── ./lib/diff/index.ts
│   │   └── ./lib/diff/types.ts
│   ├── ./lib/hooks
│   │   ├── ./lib/hooks/use-copy-to-clipboard.ts
│   │   ├── ./lib/hooks/use-debounce.ts
│   │   └── ./lib/hooks/use-deep-research.ts
│   ├── ./lib/mocks
│   │   └── ./lib/mocks/research-command-center.ts
│   ├── ./lib/redis
│   │   ├── ./lib/redis/bookmarks
│   │   │   └── ./lib/redis/bookmarks/operations.ts
│   │   ├── ./lib/redis/types
│   │   │   └── ./lib/redis/types/bookmarks.ts
│   │   ├── ./lib/redis/utils
│   │   │   ├── ./lib/redis/utils/bookmark-cleanup.ts
│   │   │   └── ./lib/redis/utils/bookmark-verify.ts
│   │   ├── ./lib/redis/bookmarks.ts
│   │   ├── ./lib/redis/config.ts
│   │   ├── ./lib/redis/index.ts
│   │   ├── ./lib/redis/research.ts
│   │   ├── ./lib/redis/search-results.ts
│   │   ├── ./lib/redis/suggestions.ts
│   │   └── ./lib/redis/types.ts
│   ├── ./lib/schema
│   │   ├── ./lib/schema/related.tsx
│   │   ├── ./lib/schema/retrieve.tsx
│   │   └── ./lib/schema/search.tsx
│   ├── ./lib/services
│   │   ├── ./lib/services/chart-parser.ts
│   │   ├── ./lib/services/chart-processor.ts
│   │   └── ./lib/services/usage-tracker.ts
│   ├── ./lib/streaming
│   │   ├── ./lib/streaming/create-manual-tool-stream.ts
│   │   ├── ./lib/streaming/create-tool-calling-stream.ts
│   │   ├── ./lib/streaming/handle-stream-finish.ts
│   │   ├── ./lib/streaming/parse-tool-call.ts
│   │   ├── ./lib/streaming/stream-protocol-manager.ts
│   │   ├── ./lib/streaming/tool-execution.ts
│   │   └── ./lib/streaming/types.ts
│   ├── ./lib/tools
│   │   ├── ./lib/tools/.DS_Store
│   │   ├── ./lib/tools/human-review.ts
│   │   ├── ./lib/tools/retrieve.ts
│   │   ├── ./lib/tools/search.ts
│   │   └── ./lib/tools/video-search.ts
│   ├── ./lib/types
│   │   ├── ./lib/types/chart.test.ts
│   │   ├── ./lib/types/chart.ts
│   │   ├── ./lib/types/deep-research.ts
│   │   ├── ./lib/types/index.ts
│   │   ├── ./lib/types/messages.ts
│   │   ├── ./lib/types/models.ts
│   │   ├── ./lib/types/research-command-center.ts
│   │   ├── ./lib/types/research.ts
│   │   ├── ./lib/types/search.ts
│   │   ├── ./lib/types/usage.ts
│   │   └── ./lib/types/visualization.ts
│   ├── ./lib/utils
│   │   ├── ./lib/utils/__tests__
│   │   │   └── ./lib/utils/__tests__/research-diff.test.ts
│   │   ├── ./lib/utils/context-window.ts
│   │   ├── ./lib/utils/cookies.ts
│   │   ├── ./lib/utils/index.ts
│   │   ├── ./lib/utils/registry.ts
│   │   ├── ./lib/utils/research-analysis.test.ts
│   │   ├── ./lib/utils/research-analysis.ts
│   │   ├── ./lib/utils/research-depth.ts
│   │   ├── ./lib/utils/research-diff.ts
│   │   ├── ./lib/utils/research-gates.ts
│   │   ├── ./lib/utils/research-loop.test.ts
│   │   ├── ./lib/utils/research-loop.ts
│   │   ├── ./lib/utils/result-ranking.ts
│   │   ├── ./lib/utils/search.ts
│   │   ├── ./lib/utils/token-counter.ts
│   │   └── ./lib/utils/upload.ts
│   ├── ./lib/.DS_Store
│   ├── ./lib/auth.ts
│   └── ./lib/types.ts
├── ./public
│   ├── ./public/images
│   │   └── ./public/images/placeholder-image.png
│   ├── ./public/providers
│   │   └── ./public/providers/logos
│   │       ├── ./public/providers/logos/anthropic.svg
│   │       ├── ./public/providers/logos/azure.svg
│   │       ├── ./public/providers/logos/deepseek.svg
│   │       ├── ./public/providers/logos/fireworks.svg
│   │       ├── ./public/providers/logos/google.svg
│   │       ├── ./public/providers/logos/groq.svg
│   │       ├── ./public/providers/logos/ollama.svg
│   │       ├── ./public/providers/logos/openai-compatible.svg
│   │       └── ./public/providers/logos/openai.svg
│   ├── ./public/uploads
│   │   ├── ./public/uploads/DJKubo7ws9MS6kC3QiyKt.png
│   │   ├── ./public/uploads/G7zrv1qe2wkJ9Kqq1zUyj.png
│   │   ├── ./public/uploads/Pdg0qtztfEu2vW_horYTL.png
│   │   ├── ./public/uploads/RDTj4OrcdomKJGQfYMLwd.png
│   │   ├── ./public/uploads/fcZq9FKLRJ8ImOrh9H7aB.png
│   │   ├── ./public/uploads/vTwgCLflH1DXSb9nvICa2.png
│   │   └── ./public/uploads/xvGPlTi-6XsOkhglkkvgI.png
│   ├── ./public/screenshot-2025-01-31.png
│   └── ./public/wallpaper-bw.png
├── ./reference
│   ├── ./reference/importedcode-newfeature-deepresearch
│   │   ├── ./reference/importedcode-newfeature-deepresearch/REF-deep-research-context.tsx
│   │   ├── ./reference/importedcode-newfeature-deepresearch/REF-deep-research-explanation.md
│   │   ├── ./reference/importedcode-newfeature-deepresearch/REF-deep-research-message.tsx
│   │   ├── ./reference/importedcode-newfeature-deepresearch/REF-deep-research-multimodal-input.tsx
│   │   ├── ./reference/importedcode-newfeature-deepresearch/REF-deep-research-visual-components.tsx
│   │   └── ./reference/importedcode-newfeature-deepresearch/propose-deep-research-new-flow.md
│   ├── ./reference/importedcode-newfeature-editor
│   │   ├── ./reference/importedcode-newfeature-editor/REF-deep-research-config.ts
│   │   ├── ./reference/importedcode-newfeature-editor/REF-deep-research-diff.js
│   │   ├── ./reference/importedcode-newfeature-editor/REF-deep-research-functions.tsx
│   │   └── ./reference/importedcode-newfeature-editor/REF-deep-research-suggestions.tsx
│   └── ./reference/REF_framer_blurrevealeffect.ts
├── ./servers
├── ./types
│   ├── ./types/search.ts
│   └── ./types/ui.d.ts
├── ./.DS_Store
├── ./.cursorrules
├── ./.env.local
├── ./.eslintrc.json
├── ./.gitignore
├── ./CODE_OF_CONDUCT.md
├── ./CONTRIBUTING.md
├── ./Dockerfile
├── ./LICENSE
├── ./README.md
├── ./bun.lockb
├── ./chatimplementationreference.md
├── ./components.json
├── ./docker-compose.yaml
├── ./jest.config.js
├── ./jest.setup.ts
├── ./next-env.d.ts
├── ./next.config.mjs
├── ./package-lock.json
├── ./package.json
├── ./postcss.config.mjs
├── ./prettier.config.js
├── ./repo-structure.md
├── ./repomix-output.txt
├── ./searxng-limiter.toml
├── ./searxng-settings.yml
├── ./tailwind.config.ts
├── ./tsconfig.json
└── ./tsconfig.tsbuildinfo

88 directories, 299 files

## Key Directories Explained

### `/app` - Next.js Application
- **API Routes** (`/app/api/*`): RESTful endpoints for various features
  - Authentication, bookmarks, chat, search, and research functionality
  - Versioned API endpoints (v1)
- **Pages** (`/app/*`): Next.js pages and layouts
  - Authentication flows
  - Bookmark management
  - Search interface
  - Sharing functionality

### `/components` - React Components
- **Chat Components**: Real-time chat interface components
- **UI Library**: Reusable UI components following design system
- **Visualization**: Data visualization and research components
- **Feature Components**: Specific feature implementations
- **Shared Components**: Error boundaries and common utilities

### `/lib` - Core Library
- **Actions**: Server-side actions for data mutations
- **Agents**: AI agent implementations for research and analysis
- **Contexts**: React context providers for state management
- **Redis**: Database operations and data persistence
- **Services**: Business logic and service implementations
- **Streaming**: Real-time data streaming functionality
- **Tools**: Tool implementations for various features
- **Utils**: Utility functions and helpers

### `/public` - Static Assets
- **Images**: Static image assets
- **Provider Logos**: Authentication provider logos
- **Uploads**: User-uploaded content

### `/reference` - Reference Code
- Deep research feature implementation references
- Editor feature implementation references

### `/types` - TypeScript Definitions
- Global type definitions
- Feature-specific interfaces

## Statistics
- Total Directories: 88
- Total Files: 298
- Major Feature Areas: 
  - Chat & Research
  - Search & Bookmarks
  - Authentication
  - Data Visualization
  - API Services
```

Last updated: 2025-02-15