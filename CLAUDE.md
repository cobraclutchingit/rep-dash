# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test Commands

- `pnpm dev`: Run dev server with turbopack
- `pnpm build`: Build for production
- `pnpm lint`: Run ESLint
- `pnpm typecheck`: Run TypeScript type check
- `pnpm test`: Run all tests
- `pnpm test:unit`: Run unit tests only
- `pnpm test --testPathPattern=path/to/file.test.ts`: Run single test file
- `pnpm test -t "test name"`: Run tests matching name
- `pnpm cypress`: Run E2E tests with Cypress UI

## Code Style Guidelines

- **Formatting**: Use Prettier with 100 char line limit, 2 space indentation
- **Imports**: Group imports (builtin/external, internal, parent/sibling) with newlines between groups
- **Naming**: Use PascalCase for components, camelCase for variables/functions
- **Types**: Use TypeScript strict mode, avoid `any`, prefer explicit return types
- **Components**: Keep small, focused on single responsibility
- **Error Handling**: Validate inputs on client & server, use zod for validation
- **State Management**: Use React Query for server state, context for UI state
- **Testing**: 70% code coverage minimum, follow AAA pattern (Arrange-Act-Assert)
