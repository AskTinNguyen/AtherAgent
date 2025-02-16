# AtherAgent

An AI-powered search engine with a generative UI and advanced research capabilities.

## 🗂️ Overview

- 🛠 [Features](#-features)
- 🧱 [Stack](#-stack)
- 🚀 [Quickstart](#-quickstart)
- 🔎 [Search Engine](#-search-engine)
- ✅ [Verified models](#-verified-models)

## 🛠 Features

### Core Features

- AI-powered search with GenerativeUI
- Natural language question understanding
- Multiple search providers support (Tavily, SearXNG, Exa)
- Model selection from UI (switch between available AI models)
  - Reasoning models with visible thought process
- Simple authentication with demo account (username: demo, password: demo)
- Deep Research capabilities with configurable depth levels
- Dynamic chart generation and visualization
- Advanced source tracking and relevance scoring

### Chat & History

- Enhanced chat interface with multimodal capabilities
- File attachments with drag & drop support for Image and PDF with previews
- Markdown Prettify Format preview toggle
- Full-size Chat toggle mode
- Chat history functionality with:
  - Persistent storage using Redis
  - Individual chat deletion with confirmation
  - Hover-based delete controls
- Share search results (Optional)
- Redis support (Local/Upstash) with research state persistence
- Source Quick Insert feature with keyboard shortcuts
- IME input support

### Research & Analysis

- Deep Research implementation with:
  - Configurable depth levels (1-10)
  - Activity tracking and visualization
  - Source relevance scoring
  - Content quality assessment
  - Time relevance prioritization
  - Source authority tracking
- Dynamic chart generation:
  - Real-time data visualization
  - Multiple chart types support
  - Custom styling options
  - Responsive layout
  - Data preprocessing capabilities

### Search Capabilities

- URL-specific search
- Video search support (Optional)
- Multi-level depth exploration
- Research context preservation
- SearXNG integration with:
  - Customizable search depth (basic/advanced)
  - Configurable engines
  - Adjustable results limit
  - Safe search options
  - Custom time range filtering
- Advanced content crawling
- Domain filtering (include/exclude)
- Redis-based caching system

### AI Providers

- OpenAI (Default)
- Google Generative AI
- Azure OpenAI
- Anthropic
- Ollama
- Groq
- DeepSeek
- Fireworks
- OpenAI Compatible

### Additional Features

- Docker deployment ready
- Browser search engine integration

## 🧱 Stack

### Core Framework

- [Next.js](https://nextjs.org/) - App Router, React Server Components
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vercel AI SDK](https://sdk.vercel.ai/docs) - Text streaming / Generative UI

### AI & Search

- [OpenAI](https://openai.com/) - Default AI provider (Optional: Google AI, Anthropic, Groq, Ollama, Azure OpenAI, DeepSeek, Fireworks)
- [Tavily AI](https://tavily.com/) - Default search provider
- Alternative providers:
  - [SearXNG](https://docs.searxng.org/) - Self-hosted search
  - [Exa](https://exa.ai/) - Neural search

### Data Storage

- [Supabase](https://supabase.com/) - Primary database (PostgreSQL)
  - Row Level Security (RLS)
  - Real-time subscriptions
  - JSONB support
  - Complex relationships
<!-- - [Upstash](https://upstash.com/) - Serverless Redis -->
- [Redis](https://redis.io/) - Local Redis option

### Database Features

- Comprehensive data model with:
  - User profiles and preferences
  - Project organization
  - Research session tracking
  - Chat message history
  - Source management
  - Research state tracking
- Real-time updates via Supabase
- Row Level Security for data protection
- Complex relationships and constraints
- Performance-optimized indexes
- JSONB for flexible metadata
- Automated timestamps and sequences
- Team collaboration support
- Activity tracking and metrics

### UI & Styling

- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable components
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components
- [Lucide Icons](https://lucide.dev/) - Beautiful & consistent icons
- [Chart.js](https://www.chartjs.org/) - Dynamic chart generation
- Custom chart styling and theming support
- Responsive design with mobile optimization
- Accessibility-first components

### Authentication

- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- Simple credential provider setup for demo:
  - Username: `demo`
  - Password: `demo`
- Easily extensible to support:
  - OAuth providers (GitHub, Google, etc.)
  - Database integration
  - Custom authentication logic

## 🚀 Quickstart

### 1. Fork and Clone repo

Fork the repo to your Github account, then run the following command to clone the repo:

```bash
git clone git@github.com:[YOUR_GITHUB_ACCOUNT]/atheragent.git
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the required environment variables in `.env.local`:

```bash
# Required
OPENAI_API_KEY=     # Get from https://platform.openai.com/api-keys
TAVILY_API_KEY=     # Get from https://app.tavily.com/home

# Authentication (Required for demo login)
NEXTAUTH_URL=http://localhost:3000    # Your app URL
NEXTAUTH_SECRET=    # Generate with: openssl rand -base64 32

# Supabase Configuration (for local development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Optional: Redis Configuration (if not using Docker)
REDIS_URL=redis://localhost:6379

# Optional: SearXNG Configuration (if not using Docker)
SEARXNG_URL=[Get SearXNG URL from Site]
```

### 3. Run with Docker (Recommended for beginners)

This will start all required services: Next.js app, Supabase, Redis, and SearXNG.

```bash
docker compose up -d
```

The following services will be available:
- Web App: http://localhost:3000
- Supabase Studio: http://localhost:54323
  - Email: demo@example.com
  - Password: demo123
- Supabase API: http://localhost:54321
- Redis: localhost:6379
- SearXNG: http://localhost:8080

To view logs:
```bash
docker compose logs -f app  # For Next.js app logs
docker compose logs -f      # For all services
```

To stop all services:
```bash
docker compose down
```

To reset all data (including database):
```bash
docker compose down -v
docker compose up -d
```

### 4. Run locally (Alternative)

If you prefer to run services individually:

```bash
# Install dependencies
npm install --legacy-peer-deps
# --legacy-peer-deps is required for Next.js 15.0.3 which is too modern for others


# Start the development server
npm run dev
```

You'll also need to run these services separately (if you're not using Docker):
- Supabase: Follow [Supabase CLI setup](https://supabase.com/docs/guides/cli)
- Redis: Install and run locally
- SearXNG: Follow [SearXNG setup](https://docs.searxng.org/)

#Start the App
Visit http://localhost:3000 in your browser.

## 🌐 Deploy for Cloudflare Pages or Vercel

// TODO: Add deploy instructions

## ✅ Verified models

### List of models applicable to all

- OpenAI
  - o3-mini
  - gpt-4o
  - gpt-4o-mini
  - gpt-4-turbo
  - gpt-3.5-turbo
- Google
  - Gemini 2.0 Pro (Experimental)
  - Gemini 2.0 Flash Thinking (Experimental)
  - Gemini 2.0 Flash
- Anthropic
  - Claude 3.5 Sonnet
  - Claude 3.5 Hike
<!-- - Ollama
  - qwen2.5
  - deepseek-r1 -->
<!-- - Groq
  - deepseek-r1-distill-llama-70b -->
- DeepSeek
  - DeepSeek V3
  - DeepSeek R1

# AtherAgent Chat

A powerful chat interface with multimodal capabilities, built with Next.js and TypeScript.

## Features

- 💬 Text-based chat with AI models
- 📎 File attachments and image uploads
- 🔍 Research mode with source integration
- 💡 AI-powered text suggestions
- 🎯 Context-aware responses
- 🖼️ Image and document previews
- 📱 Responsive design
- ♿ Accessibility support

## Chat Components

The chat interface is built with modular components:

### Core Components

- `ChatPanel`: Main chat interface with expandable input
- `FileDropzone`: File upload with drag & drop support
- `ImagePreview`: Media preview and management
- `SourceQuickInsert`: Research source integration
- `AutoComplete`: AI suggestions

### Features & Capabilities

#### Input Management
- Expandable text input
- Markdown preview toggle
- Full-size mode toggle
- IME composition handling
- Enter key submission
- Shift+Enter for new lines

#### File Handling
- Drag and drop support
- File type validation
- Upload progress tracking
- Preview generation
- Error handling
- Removal capability

#### Keyboard Shortcuts

##### Search Mode
- Mac: `⌘ + .`
- Windows/Linux: `Ctrl + .`

##### Model Selector
- Mac: `⌘ + ↑`
- Windows/Linux: `Ctrl + ↑`

##### Source Quick Insert
- Trigger: `@`
- Navigation: Arrow keys
- Selection: Enter
- Dismiss: Escape

#### Search Source Integration

The Search Source Quick Insert feature allows quick reference and insertion of URLs from previous search results:

- Source filtering based on relevance
- Real-time updates
- Keyboard navigation
- Markdown link formatting
- Automatic cursor positioning
- Source metadata preservation

## File Upload

Supports:
- Images (JPEG, PNG, GIF) //TODO: Add support for other image formats
- Documents (PDF)
- Size limit: //TODO
- Drag & drop interface
- Progress tracking
- Preview generation

## Research Integration //TODO

- Source management
- Relevance scoring
- Quick citation insertion
- Context preservation
- Search mode integration

## Accessibility //TODO

- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management
- Error announcements


## 🔬 Deep Research

### Overview

AtherAgent includes a Deep Research system that enables comprehensive exploration of topics with configurable depth levels and advanced source tracking.

### Key Features

- Depth-based exploration (levels 1-10)
- Source relevance scoring
- Content quality assessment
- Time-based relevance tracking
- Domain authority evaluation
- Research context preservation
- Activity visualization
- Progress tracking


## 📊 Chart Generation

### Overview

AtherAgent supports dynamic chart generation with real-time data visualization capabilities.

### Features

- Multiple chart types (line, bar, pie, etc.)
- Real-time data updates
- Custom styling options
- Responsive layout
- Data preprocessing
- Theme integration

### Usage

Charts can be generated through:
- Natural language queries
- Data analysis results
- Custom data input as JSON or any other data format
