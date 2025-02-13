## SpecStory

## Cloning and Setting Up GitHub Project (2/13/2025, 9:23:56 AM)

_**User**_

Help me clone this project @https://github.com/modelcontextprotocol/servers/tree/main/src/github 

---

_**Assistant**_

I'll help you clone and set up this project based on the provided MasterProjectTracker.md and codebase context. Here's a step-by-step guide:

1. First, let's clone the repository:

```bash
git clone https://github.com/modelcontextprotocol/servers.git
cd servers/src/github
```

2. Based on the package.json and project structure, here's what you'll need to set up:

```bash
# Install dependencies
bun install

# Copy environment variables template
cp .env.local.example .env.local
```

3. Configure your `.env.local` file with the required environment variables:

```bash:.env.local
# Required
OPENAI_API_KEY=     # Get from https://platform.openai.com/api-keys
TAVILY_API_KEY=     # Get from https://app.tavily.com/home

# Authentication (Required for demo login)
NEXTAUTH_URL=http://localhost:3000    # Your app URL
NEXTAUTH_SECRET=    # Generate with: openssl rand -base64 32

# Optional - Add these if needed
UPSTASH_REDIS_REST_URL=     # For Redis integration
UPSTASH_REDIS_REST_TOKEN=   # For Redis integration
```

4. Start the development server:

```bash
# Using Bun
bun dev

# OR using Docker
docker compose up -d
```

The application should now be running at http://localhost:3000.

Key Features Available:
- Deep Research System with Quality Gates
- Vercel AI SDK Integration
- UI/UX Components with Chat Panel
- Authentication & Session Management
- Token Usage Implementation
- Research Visualization
- Search functionality

Current Priority Tasks (from MasterProjectTracker.md):
1. Fix default "depth_exploration" placeholder prompt
2. Fix API Statistics
3. Fix AI Streaming Issues
4. Fix the "Research" page
5. Fix the "Suggestions" page
6. Add the "Settings" page
7. Add External Links navigation for Bookmarked Articles
8. Add URL drag support for Bookmarked Articles
9. Add Deep Research creation features

The project uses:
- Next.js 15.1.3
- React 19.0.0
- TypeScript
- Tailwind CSS
- Various AI SDKs (OpenAI, Anthropic, Google, etc.)
- Redis for caching
- NextAuth.js for authentication

For development, you have access to:
- Jest for testing
- ESLint for linting
- Docker support
- Hot module replacement with Next.js

Would you like me to provide more specific details about any particular aspect of the setup or codebase?

---



---

