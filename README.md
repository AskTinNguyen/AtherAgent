# AtherAgent

An AI-powered search engine with a generative UI and advanced research capabilities.



## 🗂️ Overview

- 🛠 [Features](#-features)
- 🧱 [Stack](#-stack)
- 🚀 [Quickstart](#-quickstart)
- 🌐 [Deploy](#-deploy)
- 🔎 [Search Engine](#-search-engine)
- ✅ [Verified models](#-verified-models)
- ⚡ [Vercel AI SDK Implementation](#-ai-sdk-implementation)
- 👥 [Contributing](#-contributing)

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

- [Upstash](https://upstash.com/) - Serverless Redis
- [Redis](https://redis.io/) - Local Redis option

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

### 2. Install dependencies

```bash
cd atheragent
bun install
```

### 3. Configure environment variables

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
```

For optional features configuration (Redis, SearXNG, etc.), see [CONFIGURATION.md](./docs/CONFIGURATION.md)

### 4. Run app locally

#### Using Bun

```bash
bun dev
```

#### Using Docker

```bash
docker compose up -d
```

Visit http://localhost:3000 in your browser.

## 🌐 Deploy

Host your own live version of AtherAgent with Vercel or Cloudflare Pages.

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmiurla%2Fatheragent&env=OPENAI_API_KEY,TAVILY_API_KEY,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN)

## 🔎 Search Engine

### Setting up the Search Engine in Your Browser

If you want to use AtherAgent as a search engine in your browser, follow these steps:

1. Open your browser settings.
2. Navigate to the search engine settings section.
3. Select "Manage search engines and site search".
4. Under "Site search", click on "Add".
5. Fill in the fields as follows:
   - **Search engine**: AtherAgent
   - **Shortcut**: ather
   - **URL with %s in place of query**: `https://atheragent.ai/search?q=%s`
6. Click "Add" to save the new search engine.
7. Find "AtherAgent" in the list of site search, click on the three dots next to it, and select "Make default".

This will allow you to use AtherAgent as your default search engine in the browser.

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
- Ollama
  - qwen2.5
  - deepseek-r1
- Groq
  - deepseek-r1-distill-llama-70b
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

For detailed documentation on chat components and features, see [Chat Components Documentation](docs/chat-components.md)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## File Upload

Supports:
- Images (JPEG, PNG, GIF)
- Documents (PDF)
- Size limit: 5MB per file
- Drag & drop interface
- Progress tracking
- Preview generation

## Research Integration

- Source management
- Relevance scoring
- Quick citation insertion
- Context preservation
- Search mode integration

## Accessibility

- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management
- Error announcements


## 🔬 Deep Research

### Overview

AtherAgent includes a sophisticated Deep Research system that enables comprehensive exploration of topics with configurable depth levels and advanced source tracking.

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
- Research visualizations
- Custom data input

For chart configuration and customization, see [CHART_CONFIGURATION.md](./docs/CHART_CONFIGURATION.md)