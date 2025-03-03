# Supabase Implementation Plan for AtherAgent

## Overview

This document outlines the implementation plan for integrating Supabase as the primary database system for AtherAgent, working alongside Redis for caching and temporary storage. Supabase provides a full Postgres database with additional features that will help solve our state management and hydration issues.

## Current Status

Completed Steps:

1. Setup: Installed Supabase CLI, initialized project, created database schema with RLS, and configured local environment.
2. Configuration: Created Supabase client config, defined TypeScript types, and updated environment variables.
3. Database: Created tables (research_sessions, search_results, research_states, sources), implemented RLS, and added indexes.
4. Auth: Integrated Supabase Auth with NextAuth.js, configured providers, created auth middleware, and configured JWT sessions.
5. Migration: Created migration script, implemented parallel writes, and added data validation.
6. State: Updated research provider to use Supabase, implemented real-time subscriptions, and created sync component.
7. Testing: Set up Jest, created test helpers, database utilities, and integration tests for research service, real-time subscriptions, and state sync.


## 📝 Next Steps

### Implementing SSR-Specific Clients

AtherAgent must use two distinct Supabase clients optimized for Next.js SSR:

### SSR-Specific Clients for Next.js Applications with Supabase

**Separation of Concerns & Environment Context**

*   Server Components: Run exclusively on the server.
*   Client Components: Run in the browser after hydration.
*   Environment Capabilities and Constraints:
    *   Server: Direct database access, no `localStorage`/`sessionStorage`.
    *   Browser: Access to browser APIs, needs cookie management.

**Session Management & Security**

*   `@supabase/ssr` package provides specialized clients:
    *   `createBrowserClient`: Manages sessions via cookies in the browser.
    *   `createServerClient`: Reads session data from cookies on the server.
*   Security Advantages:
    *   Server-side session validation on every request.
    *   Tokens stored in HTTP-only cookies (prevents token exposure to client-side JavaScript).

**Caching & Performance**

*   Server Components can leverage Next.js's server-side caching.
*   SSR clients designed to work with Next.js's caching mechanisms.
*   Proper cache invalidation when auth state changes.

**Token Refresh & Middleware Integration**

*   SSR clients work with Next.js middleware for automatic token refresh.
*   Handles complex scenarios like:


**Edge Function Compatibility**

*   SSR clients designed to work with Next.js Edge Runtime.
*   Important for global deployments and optimal performance.

**Prevention of Common Issues**

*   The "Access to storage is not allowed from this context" error occurs because:
    *   Regular Supabase client tries to use browser storage APIs on the server.
    *   SSR clients prevent this by using appropriate storage mechanisms per context.

### Implementation Steps:

**Server Components Client**
  
   - Used in Server Components, API routes, and Server Actions
   - Handles server-side operations
   - Manages cookie-based session reading
   - Performs secure auth validation

**Browser Client**
   
   - Used exclusively in Client Components
   - Manages real-time subscriptions
   - Handles client-side operations
   - Maintains browser-side state


**Cookie-Based Session Management**

*   More secure than `localStorage`.
*   Works across tabs and windows.
*   Better protection against XSS attacks.
*   Automatic handling of secure and `httpOnly` flags.

**Proper Error Handling**

*   Different error handling strategies for server and client.
*   Better debugging capabilities.
*   Clear separation of client and server errors.


## Usage Guide

### Local Development

1. Start Supabase services:
```bash
supabase start
```

2. Stop Supabase services:
```bash
supabase stop
```

3. Reset database (will delete all data):
```bash
supabase db reset
```

4. Run tests:
```bash
npm test
npm test:watch  # For development
npm test:coverage  # For coverage report
```

### Testing

The test suite includes:

1. Integration Tests
   - Research service operations
   - Real-time subscriptions
   - State synchronization
   - Error handling

2. Test Helpers
   - Supabase test utilities
   - Database cleanup
   - Test data generation

### Environment Variables

Required environment variables for local development:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-key>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- [Supabase Next.js Server-Side Auth Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Server Components Documentation](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

## Support

For issues or questions:
1. Check Supabase status: http://127.0.0.1:54323
2. View logs: `supabase logs`
3. Reset environment: `supabase db reset` 



## Problem: Incorrect User ID Causing Save Failures

The system was failing to save messages to Supabase due to a mismatch between the accessed user ID and the actual user ID structure within the authentication setup.

## Authentication Setup

*   **NextAuth.js:** Used for general session management.
*   **Supabase Auth:** Used for database access and row-level security (RLS).

## Attempts to Fix the Issue

*   **First Attempt:**

    *   Code: `const userId = session?.user?.id`
    *   Result: Failed because the session structure was different than expected.
*   **Second Attempt:**

    *   Code: `const userId = (session as any)?.session?.userId || (session as any)?.userId`
    *   Result: Failed because the user ID was not located in the NextAuth session.

## Final Working Solution

*   Implementation:

    ```javascript
    const [userId, setUserId] = useState<string | null>(null)
    
    useEffect(() => {
        if (supabase) {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user?.id) {
                    setUserId(session.user.id)
                }
            })
        }
    }, [supabase])
    ```

## Why the Final Solution Works

*   **Direct Supabase Session Access:** Retrieves the user ID directly from the Supabase session.
*   **State Management:** Uses `useState` to track the user ID and trigger re-renders when available.
*   **Proper Timing:** The `useEffect` hook ensures the Supabase session is fetched after the Supabase client is initialized.
*   **Clean Error Handling:** Saves messages only when a valid user ID is available, with proper error logging.

## Database Side (Row Level Security - RLS)

*   RLS Policies Configuration:
    *   Allow authenticated users to insert their own messages.
    *   Allow users to read messages from their chats.
    *   Verify that the user ID from the Supabase session matches the `user_id` in the records.

## Key Learnings

*   Crucial to use the appropriate authentication session for the intended purpose when integrating multiple authentication systems.
*   Supabase RLS policies rely on the Supabase's authentication system, therefore requiring the Supabase user ID.
*   Debugging logs are essential for understanding session structures and identifying the location of the user ID.
*   React's state management is important for handling the asynchronous nature of session initialization.

## Outcomes

The implemented solution provides:

*   Secure user identification.
*   Message saving with the correct user ID.
*   Proper database access control via RLS.
*   Graceful handling of edge cases and errors.
