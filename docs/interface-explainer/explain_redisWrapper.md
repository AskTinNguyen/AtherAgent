## RedisWrapper Implementation

### Core Interface

The `RedisWrapper` Adapter Pattern interface defines a common set of Redis operations:

*   `hgetall`: Get all fields in a hash
*   `hmset`: Set multiple hash fields
*   `zadd`: Add a member to a sorted set
*   `zrange`: Get a range of members from a sorted set
*   `zrem`: Remove members from a sorted set
*   `keys`: Get keys matching a pattern
*   `del`: Delete keys
*   `multi`: Start a transaction/pipeline

### Implementations

The project provides two implementations of the `RedisWrapper`:

**a) LocalRedisWrapper:**

*   Used for local development with a standard Redis server.
*   Wraps the Node.js Redis client (`redis` package).
*   Handles data serialization/deserialization.
*   Includes robust error handling and type conversion.
*   Implements buffer to string conversions.
*   Has value stringification for complex objects.

**b) UpstashRedisWrapper:**

*   Used for production with Upstash Redis.
*   Wraps the Upstash REST client (`@upstash/redis`).
*   Simpler implementation as Upstash handles some conversions.
*   Optimized for REST-based Redis access.

### Configuration & Connection Management

The `config.ts` file handles:

*   Singleton pattern for Redis client management.
*   Environment-based client selection (Local vs Upstash).
*   Connection retry logic with exponential backoff.
*   Connection event handling.
*   Proper connection cleanup.

### Key Features

*   Type-safe operations with generics.
*   Automatic serialization/deserialization of complex objects.
*   Consistent error handling across implementations.
*   Support for Redis transactions/pipelines.
*   Connection pooling and reuse.
*   Graceful error handling and reconnection strategies.

### Usage Pattern

```javascript
// Get the appropriate Redis client
const redis = await getRedisClient()

// Use it with type safety
const data = await redis.hgetall<UserData>('user:123')
```

### Environment Configuration

*   **Local Redis:** Controlled by `USE_LOCAL_REDIS=true` and `LOCAL_REDIS_URL`.
*   **Upstash:** Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.


### RedisWrapper Adapter Pattern

The RedisWrapper Adapter Pattern is a design pattern that allows you to use different Redis clients with the same interface.

Why is it an adapter pattern?

// Our common interface
interface RedisWrapper {
    hgetall<T>(): Promise<T>
    hmset(): Promise<number>
    // ... other methods
}

// Adapters for different implementations
class LocalRedisWrapper implements RedisWrapper {
    constructor(private readonly client: RedisClient) {}
    // Adapts local Redis methods
}

class UpstashRedisWrapper implements RedisWrapper {
    constructor(private readonly client: Redis) {}
    // Adapts Upstash Redis methods
}

### Similar Patterns in Popular Libraries:
DatabaseAdapter in ORMs
HttpClient in networking libraries
StorageAdapter in file storage systems
CacheProvider in caching systems