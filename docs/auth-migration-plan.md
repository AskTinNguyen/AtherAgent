# Authentication Migration Plan: NextAuth to Supabase

## Overview
This document outlines the step-by-step plan for migrating our authentication system from the current dual NextAuth/Supabase setup to a pure Supabase authentication solution.

## Migration Goals
1. Simplify authentication to single source of truth (Supabase)

## Phase 1: Preparation and Setup ✅
### 1.1 Create New Supabase Auth Utilities ✅
- [x] Create `lib/supabase/auth.ts` for core auth functions
  - Implemented server-side session management
  - Added client-side auth utilities
  - Created development mode support
  - Added TypeScript types and interfaces
- [x] Implement server-side auth middleware
  - Created middleware.ts with route protection
  - Added public routes configuration
  - Implemented session refresh
- [x] Create client-side auth hooks
  - Implemented in supabase-provider.tsx
  - Added useSupabase hook
  - Removed NextAuth dependencies
- [x] Set up proper TypeScript types for auth
- [x] Implement error handling utilities

### 1.2 Update Environment Configuration ✅
- [x] Audit all auth-related environment variables
- [x] Create new Supabase-specific environment variables if needed
- [x] Update environment variable documentation
- [x] Create development environment configuration guide

### 1.3 Create Test Environment
- [ ] Set up testing infrastructure for new auth system
- [ ] Create test cases for all auth scenarios
- [ ] Implement test user support in new system
- [ ] Set up CI/CD pipeline modifications

## Implementation Details

### Completed Components ✅

1. `lib/supabase/auth.ts`:
- Server-side session management
- Client-side auth utilities
- Development mode support
- TypeScript types and interfaces
- Helper functions for common auth operations

2. `middleware.ts`:
 features:
- Route protection
- Public routes handling
- Session refresh
- Redirect handling

3. `components/providers/supabase-provider.tsx`:
- Auth context provider
- Session management
- Real-time auth state updates
- Clean API for auth operations
- Consolidated auth functionality
- Proper TypeScript types
- Exposed necessary Supabase client methods

4. `components/auth/supabase-auth-dialog.tsx`:
- Clean login form UI
- Integration with new auth utilities
- Improved error handling
- Redirect handling
- Toast notifications

5. `components/auth/require-auth.tsx`:
- Client-side auth protection
- Loading states
- Auth dialog integration
- Clean fallback UI
- Simplified props handling

### NextAuth Cleanup Progress ✅

Files Removed:
- [x] `lib/auth/auth-options.ts`
- [x] `lib/types/next-auth.d.ts`
- [x] `app/api/auth/[...nextauth]/route.ts`
- [x] `components/providers/session-sync.tsx`

Components Updated:
- [x] `app/layout.tsx` - Removed SessionProvider
- [x] `components/providers/client-providers.tsx` - Removed SessionSync
- [x] `components/client-header-actions.tsx` - Migrated to pure Supabase auth
- [x] `components/chat.tsx` - Migrated to pure Supabase auth
- [x] `components/bookmark-manager.tsx` - Migrated to pure Supabase auth
- [x] `components/auth-status.tsx` - Migrated to pure Supabase auth
- [x] `components/research-realtime-sync.tsx` - Migrated to pure Supabase auth
- [x] `lib/hooks/use-chat-state.ts` - Migrated to pure Supabase auth
- [x] `app/tasks/page.tsx` - Updated to use consolidated Supabase provider
- [x] `app/login/login-form.tsx` - Updated to use consolidated Supabase provider

Environment Variables to Remove:
- [x] `NEXTAUTH_URL`
- [x] `NEXTAUTH_SECRET`
- [x] `GOOGLE_CLIENT_ID`
- [x] `GOOGLE_CLIENT_SECRET`

Dependencies to Remove:
- [x] `next-auth` package
- [x] `@auth/prisma-adapter`

### Next Steps
1. Complete test environment setup
2. Update documentation to reflect pure Supabase auth
3. Test all authentication flows thoroughly
4. Deploy and monitor for any issues

### Migration Progress
- [x] Core auth utilities
- [x] Middleware implementation
- [x] Auth provider
- [x] Auth dialog
- [x] Auth guard component
- [x] Environment configuration
- [ ] Testing setup
- [x] Initial NextAuth cleanup
- [x] Complete NextAuth removal
- [x] Provider consolidation
- [x] Type safety improvements

## Phase 2: Core Implementation ✅
### 2.1 Implement New Auth Provider ✅
- [x] Create new Supabase auth provider component
- [x] Implement session management
- [x] Add real-time session synchronization
- [x] Set up proper error boundaries
- [x] Add loading states and transitions

### 2.2 Create New Auth Hooks and Utilities ✅
- [x] `useAuth` hook for client components
- [x] Server-side auth utilities
- [x] Session management utilities
- [x] Type-safe auth guards
- [x] Error handling utilities

### 2.3 Protected Routes Implementation ✅
- [x] Create new middleware for protected routes
- [x] Implement route guards
- [x] Set up redirect handling
- [x] Add proper error pages
- [x] Implement loading states

## Phase 3: Migration Process ✅
### 3.1 Component Updates ✅
- [x] Identify all components using NextAuth
- [x] Create migration checklist for each component
- [x] Update components to use new auth system
- [x] Add proper error handling
- [x] Implement loading states

### 3.2 API Route Updates ✅
- [x] Audit all protected API routes
- [x] Create new auth middleware for API routes
- [x] Update route handlers to use Supabase auth
- [x] Implement proper error responses
- [x] Add rate limiting where needed

### 3.3 Database and Storage Access ✅
- [x] Update database access patterns
- [x] Implement proper RLS policies
- [x] Update storage access controls
- [x] Verify security policies
- [x] Test all database operations

## Phase 4: Testing and Validation
### 4.1 Testing Strategy
- [ ] Unit tests for new auth utilities
- [ ] Integration tests for protected routes
- [ ] E2E tests for auth flows
- [ ] Performance testing
- [ ] Security testing

### 4.2 Validation Checklist
- [ ] Verify all protected routes
- [ ] Test error scenarios
- [ ] Validate session management
- [ ] Check real-time updates
- [ ] Verify rate limiting
- [ ] Test development mode
- [ ] Validate production build

## Phase 5: Cleanup and Documentation
### 5.1 Code Cleanup ✅
- [x] Remove NextAuth dependencies
- [x] Clean up unused auth files
- [x] Remove deprecated environment variables
- [x] Update package.json
- [x] Clean up types and interfaces

### 5.2 Documentation Updates
- [ ] Update API documentation
- [ ] Update component documentation
- [ ] Create migration guide for future reference
- [ ] Update README
- [ ] Update development setup guide

## Final Steps
1. Complete remaining test implementation
2. Finish documentation updates
3. Deploy to staging for final validation
4. Monitor production deployment