## SpecStory

## Backend Data Storage Inquiry (2/10/2025, 12:45:31 PM)

_**User**_

Check the codebase, to see what Backend Data Storage we are using.

@README.md could be a reference

---

_**Assistant**_

I'll help you check what backend data storage is being used in the codebase. From the attached README.md, I can see that the project uses Redis as its primary data storage solution, with two implementation options:

1. **Upstash** - A serverless Redis solution
2. **Redis** - Local Redis option

Let me search the codebase to find more specific implementation details.

---

_****_

<details>
            <summary>Searched codebase "redis configuration or setup implementation" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `lib/redis/config.ts` | L70-110 |
| `lib/redis/config.ts` | L1-50 |
| `lib/redis/config.ts` | L50-70 |
| `lib/redis/config.ts` | L110-119 |
| `lib/redis/suggestions.ts` | L1-21 |
| `lib/redis/index.ts` | L1-1 |
| `lib/redis/types.ts` | L1-14 |
| `lib/redis/types.ts` | L36-84 |
| `lib/redis/types.ts` | L92-97 |
| `lib/redis/types.ts` | L126-165 |
| `lib/redis/bookmarks.ts` | L1-16 |
| `lib/redis/research.ts` | L35-81 |
| `lib/redis/types.ts` | L182-186 |
| `lib/redis/types.ts` | L84-92 |
| `lib/redis/types.ts` | L109-114 |
| `lib/redis/types.ts` | L27-31 |
| `lib/redis/types.ts` | L105-109 |
| `lib/redis/types.ts` | L169-174 |
| `lib/redis/types.ts` | L101-105 |
| `lib/redis/types.ts` | L165-169 |
| `lib/redis/types.ts` | L186-190 |
| `lib/redis/types.ts` | L14-24 |
| `lib/redis/types.ts` | L97-101 |
| `lib/redis/types.ts` | L178-182 |
| `lib/redis/types.ts` | L118-122 |

</details>

---

_****_



Based on the codebase analysis, I can provide a detailed overview of the backend data storage implementation:

1. **Primary Storage Solution: Redis**
   - The project implements a flexible Redis setup that supports two different modes:

2. **Implementation Options:**

   a) **Upstash Redis (Cloud/Serverless)**
   - Uses `@upstash/redis` package
   - Configured using environment variables:
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`
   - Implemented through `UpstashRedisWrapper` class
   - Ideal for production/serverless deployments

   b) **Local Redis**
   - Uses the standard `redis` npm package
   - Can be configured using `LOCAL_REDIS_URL` (defaults to 'redis://localhost:6379')
   - Activated by setting `USE_LOCAL_REDIS=true`
   - Implemented through `LocalRedisWrapper` class
   - Ideal for development and self-hosted deployments

3. **Key Features of the Implementation:**
   - Connection pooling and retry logic
   - Error handling and reconnection strategies
   - Pipeline support for batch operations
   - Configurable timeouts and keepalive settings
   - Type-safe wrapper interfaces
   - Support for various Redis data structures (hashes, sorted sets)

4. **Used For:**
   - Research state persistence
   - Bookmarks storage
   - Research suggestions caching
   - Chat history
   - User data storage

The implementation includes robust error handling, connection management, and retry logic with configurable parameters:
- Maximum retry attempts: 3
- Retry delay: Starting at 1 second with exponential backoff
- Connection timeout: 10 seconds
- Keepalive interval: 5 seconds

This setup provides a flexible and reliable data storage solution that can work both in development (local Redis) and production (Upstash) environments.

---



---

