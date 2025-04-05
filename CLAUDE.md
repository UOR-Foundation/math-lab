# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Lint/Test Commands
- `npm run dev` - Run development server
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test -- -t "test name"` - Run a specific test
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Run Prettier formatting

## Code Style Guidelines
- **Format**: Use Prettier with default configuration
- **Types**: Strong TypeScript typing (strict mode)
- **Imports**: Use path aliases (@/core/...) for internal imports
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Components**: Functional React components with hooks
- **State**: Redux/Redux Toolkit for global state
- **Error Handling**: Use try/catch with explicit error types
- **Documentation**: JSDoc for public APIs and components
- **Testing**: Unit tests for all business logic, components using react-testing-library

## Other Details
- You are in a codespace
- repo url github.com/UOR-Foundation/math-lab
