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
- Multiple search providers (Tavily, SearXNG, Exa)
- Model selection with visible reasoning
- Demo authentication (username: demo, password: demo)
- Deep research with configurable depth
- Dynamic charts and visualizations
- Source tracking and scoring

### Chat & History

- Multimodal chat interface
- File attachments with previews
- Markdown and full-size toggles
- Redis-based chat history
- Share and delete chat functionality
- Source quick insert
- IME support

### Research & Analysis

- Configurable research depth (1-10)
- Activity tracking and visualization
- Source quality assessment
- Time and authority tracking
- Real-time data visualization
- Multiple chart types
- Responsive layouts

### Search Capabilities

- URL and video search
- Multi-level exploration
- Context preservation
- SearXNG integration
  - Customizable depth and engines
  - Results filtering
  - Safe search
- Content crawling
- Domain filtering
- Redis caching

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

#### Input
- Expandable text area with preview
- Markdown & full-size toggles
- IME support
- Enter to submit, Shift+Enter for newline

#### Files
- Drag & drop upload
- Validation & progress tracking
- Preview & removal options

#### Shortcuts
- Search: `⌘/.` (Mac), `Ctrl + .` (Win/Linux) 
- Model: `⌘/Ctrl + ↑`
- Quick Insert: `@` + arrows, Enter to select, Esc to dismiss

#### Search Source Integration
Quick reference and URL insertion from search results with filtering, real-time updates, keyboard navigation, and metadata preservation.

## File Upload
- Images (JPEG, PNG, GIF) //TODO: Add more formats
- Documents (PDF) 
- Size limit: //TODO
- Drag & drop with progress tracking and previews

## Research Integration //TODO
- Source and citation management
- Relevance scoring
- Context preservation
- Search integration

## Accessibility //TODO
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management

## 🔬 Deep Research
Comprehensive topic exploration with configurable depth levels (1-10), source tracking, relevance scoring, and progress visualization.

## 📊 Chart Generation
Dynamic data visualization with:
- Multiple chart types
- Real-time updates
- Custom styling
- Natural language queries
- Data analysis integration
- JSON/custom data input

- Docker ready

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

- [Supabase Auth](https://supabase.com/docs/guides/auth) - Authentication for Next.js
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
NEXT_PUBLIC_APP_URL=http://localhost:3000    # Your app URL
NEXT_PUBLIC_SUPABASE_URL=    # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Your Supabase anon key

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

