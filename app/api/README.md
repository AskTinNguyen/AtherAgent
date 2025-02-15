# API Routes Documentation

This directory contains all the API routes for the AtherAgent application. The routes are organized by feature and version.

## Directory Structure

```
/api/
  /v1/                    # Version namespace
    /auth/               # Authentication routes
      /[...nextauth]/    # NextAuth.js authentication
      /session/          # Session management
    
    /chat/               # Chat-related routes
      /[id]/            # Individual chat operations
        /init/          # Chat initialization
        /validate/      # Chat validation
      /cleanup/         # Chat cleanup operations
      /init/           # New chat initialization
      /migrate/        # Chat migration utilities
    
    /research/          # Research-related routes
      /suggestions/     # Research suggestions
        /cache/        # Suggestion caching
    
    /folders/           # Folder management
      /[folderId]/     # Individual folder operations
        /chats/        # Folder-specific chats
      /cleanup/        # Folder cleanup operations
    
    /bookmarks/         # Bookmark management
      /check/          # Bookmark validation
      /cleanup/        # Bookmark cleanup
      /verify/         # Bookmark verification
    
    /usage/            # Usage tracking
    /upload/           # File upload handling
```

## API Versioning

All routes are versioned under the `/v1` namespace. This allows us to:
- Make breaking changes in new versions while maintaining backward compatibility
- Phase out deprecated endpoints gradually
- Support multiple API versions simultaneously when needed

## Route Conventions

Each route follows these conventions:
1. Uses Next.js App Router format with `route.ts` files
2. Implements standard HTTP methods (GET, POST, PUT, DELETE)
3. Returns consistent response formats using our response utilities
4. Includes request validation using Zod schemas
5. Implements proper error handling

## Authentication

Most routes require authentication via NextAuth.js. Protected routes should:
1. Verify the session using the auth middleware
2. Include proper rate limiting
3. Implement role-based access control where necessary

## Error Handling

All routes use the centralized error handling system from `lib/api/response.ts`:
- Consistent error response format
- Proper HTTP status codes
- Detailed error messages for debugging
- Production-safe error responses

## Request Validation

Input validation is handled by Zod schemas defined in `lib/api/validation.ts`:
- Type-safe request parsing
- Consistent validation errors
- Reusable validation schemas

## Performance Considerations

Routes are optimized for performance with:
- Proper caching headers
- Request throttling where necessary
- Streaming responses for large data
- Efficient database queries

## Development Guidelines

When adding new routes:
1. Place them in the appropriate feature directory
2. Follow the existing naming conventions
3. Implement proper validation and error handling
4. Add appropriate tests
5. Update API documentation
