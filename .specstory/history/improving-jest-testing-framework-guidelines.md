## SpecStory

## Improving Jest Testing Framework Guidelines (2/10/2025, 10:40:54 PM)

_**User**_

Help me improve this Cursor Rule for Jest testing framework

---

_**Assistant**_

I'll help you improve the Jest testing framework rule by making it more detailed and structured. Here's an enhanced version:

```markdown:testing-framework-jest.mdc
# Jest Testing Framework Guidelines

## Test Types & Organization
- Unit Tests
  - Location: `__tests__/unit/`
  - Focus: utilities, hooks, and pure functions
  - Naming: `*.test.ts` or `*.test.tsx`

- Integration Tests
  - Location: `__tests__/integration/`
  - Focus: component interactions, complex features
  - Naming: `*.integration.test.tsx`

- E2E Tests (Playwright)
  - Location: `e2e/`
  - Focus: full user flows and scenarios
  - Naming: `*.spec.ts`

## Testing Standards
- Test file structure:
  ```javascript
  describe('ComponentName or FeatureName', () => {
    beforeEach(() => {
      // Setup code
    });

    afterEach(() => {
      // Cleanup code
    });

    it('should do something specific', () => {
      // Test code
    });
  });
  ```

## Key Testing Areas
1. IPC Communication
   - Mock main process events
   - Verify renderer process handlers
   - Test bi-directional communication

2. Auto-Update Functionality
   - Update checking
   - Download progress
   - Installation process
   - Error handling

3. Supabase Integration
   - Use local development instance
   - Mock database responses
   - Test authentication flows
   - Verify data mutations

## Best Practices
- Write descriptive test names
- Follow AAA pattern (Arrange-Act-Assert)
- Mock external dependencies
- One assertion per test when possible
- Use test coverage reports
- Maintain test isolation
```

This improved version:
1. Provides clear structure for different test types
2. Includes specific file naming conventions
3. Shows example test structure
4. Details key testing areas with specific focus points
5. Adds best practices section
6. Includes file organization guidelines
7. Makes it easier to understand where and how to write different types of tests

Would you like me to explain any specific section in more detail?

---



---

