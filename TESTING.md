# Testing and Quality Assurance Guide

This document outlines the testing and quality assurance setup for the Rep Dashboard application.

## Overview

Our application uses a comprehensive testing strategy:

1. **Unit Testing**: Testing individual functions, components, and utilities
2. **Integration Testing**: Testing API routes and database interactions
3. **End-to-End Testing**: Testing complete user flows
4. **Quality Assurance Tools**: Ensuring code quality through linting, formatting, and type checking

## Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL for database tests

### Installation

```bash
# Install dependencies
npm install

# Setup Husky hooks
npm run prepare
```

## Testing Workflow

### Unit Tests

Unit tests focus on testing isolated pieces of functionality:

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Get test coverage
npm run test:coverage
```

Unit tests are located in the `__tests__` directory and match the structure of the source code.

### Integration Tests

Integration tests focus on API routes and database interactions:

```bash
# Run all integration tests
npm run test:integration
```

Integration tests require a test database. Make sure to set up the `DATABASE_URL` environment variable.

### End-to-End Tests

E2E tests use Cypress to test complete user flows:

```bash
# Open Cypress UI
npm run cypress

# Run Cypress tests headlessly
npm run cypress:headless

# Start the application and run E2E tests
npm run e2e

# Start the application and run E2E tests headlessly
npm run e2e:headless
```

### Type Checking

```bash
# Run TypeScript type checking
npm run typecheck
```

## Quality Assurance

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

### Pre-commit Hooks

We use Husky to run pre-commit hooks that:

1. Lint and format staged files using lint-staged
2. Run TypeScript type checking
3. Validate commit message format

### Commit Message Format

Commit messages must follow the format:
```
type(scope): message
```

Available types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools
- `ci`: Changes to CI configuration files and scripts
- `build`: Changes that affect the build system
- `revert`: Reverts a previous commit

Example: `feat(auth): add password reset functionality`

## Continuous Integration

Our CI workflow using GitHub Actions includes:

1. **Linting & Type Checking**: Ensuring code quality
2. **Unit Tests**: Testing individual components and utilities
3. **Integration Tests**: Testing API routes with a test database
4. **E2E Tests**: Running Cypress tests against a deployed application

### Deployment Pipeline

Our deployment pipeline:

1. Deploys the application to the production environment
2. Runs database migrations
3. Sends deployment notifications

## Best Practices

### Writing Test Cases

1. **Descriptive Names**: Use descriptive test names that explain what's being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification phases
3. **Test Edge Cases**: Include tests for edge cases and error conditions
4. **Isolation**: Ensure tests are isolated and don't depend on each other
5. **Mocking**: Use mocks for external dependencies to keep tests fast and reliable

### Component Testing

1. Use React Testing Library to test components as users would interact with them
2. Focus on testing behavior, not implementation details
3. Use screen queries that mirror how users would find elements

### API Testing

1. Test success and error responses
2. Verify authentication and authorization
3. Check input validation
4. Test edge cases and error handling

### E2E Testing

1. Focus on critical user journeys
2. Test responsive behavior on different viewports
3. Use data fixtures for consistent test data
4. Ensure tests clean up after themselves

## Test Coverage

We aim for at least 70% code coverage across the codebase. Coverage reports are generated when running `npm run test:coverage`.

## Troubleshooting

If you encounter issues with the tests:

1. Make sure all dependencies are installed
2. Check that the test database is properly configured
3. Verify environment variables are set correctly
4. Look for error messages in the test output
5. Check the CI logs for detailed information