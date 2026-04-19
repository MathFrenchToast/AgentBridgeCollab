---
id: US-08-EVOL-002
title: Test Suite TypeScript Migration
status: READY
type: feature
---
# Description
As a Maintainer, I want all tests to be in TypeScript so that the codebase is consistent, type-safe, and easier to refactor.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @tests/unit/*.js
> *   @tests/integration/*.js

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Complete migration of unit tests**
    - Given existing `.js` test files in `tests/unit/`
    - When they are converted to `.ts` and updated with proper types
    - Then `npm test` should pass and no `.js` files remain in the directory.
- [ ] **Scenario 2: Complete migration of integration tests**
    - Given existing `.js` test files in `tests/integration/`
    - When they are converted to `.ts`
    - Then all integration tests should pass under the Vitest runner.

# Technical Notes (Architect)
- Leverage existing `@types/vitest` and `@types/node`.
- Ensure redundant JS files are deleted to avoid confusion.
