---
id: US-01-INIT-001
title: Setup Node.js & TypeScript Environment
status: DONE
type: feature
---
# Description
As a developer, I want to initialize a Node.js and TypeScript project with strict typing and a modern testing framework (Vitest) so that I can start building the GCB with a solid foundation.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `package.json`
> *   `tsconfig.json`
> *   `vitest.config.ts`

# Acceptance Criteria (DoD)
<!-- 
Must be testable and binary (Pass/Fail).
Include Success, Error, and Edge cases.
-->

- [x] **Scenario 1:** Project Initialization
    - Given a fresh repository
    - When I run `npm install`
    - Then a `package.json` with Node.js 20+ engine requirement is present and dependencies are installed.
- [x] **Scenario 2:** TypeScript Strict Mode
    - Given the TypeScript configuration (`tsconfig.json`)
    - When I inspect the file
    - Then `strict: true` must be enabled and `noImplicitAny` should be true.
- [x] **Scenario 3:** Directory Structure
    - Given the project folder
    - When I look at the file tree
    - Then `src/core/`, `src/providers/`, `src/types/`, and `tests/` directories must exist.
- [x] **Scenario 4:** Testing Framework Setup
    - Given the testing setup
    - When I run `npm run test`
    - Then Vitest executes and reports success on a dummy test.

# UI element
None.

# Technical Notes (Architect)
- **Runtime:** Node.js 20.x LTS.
- **Module System:** Set `"type": "module"` in `package.json`. Use `.ts` extensions and ESM imports.
- **TypeScript Configuration:**
  - Target: `ESNext` or `ES2022`.
  - ModuleResolution: `bundler` or `node16/nodenext`.
  - Enable `esModuleInterop`, `skipLibCheck`, and `forceConsistentCasingInFileNames`.
  - Paths: Setup `@/*` alias for `src/*`.
- **Directory Structure:** Manually create `src/core`, `src/providers`, `src/types`, and `tests` as per the Context Map.
- **Testing:** Install `vitest` and configure it to support TypeScript and the `@` alias. Create a simple `tests/unit/smoke.test.ts` to verify the setup.
- **Linting/Formatting:** (Optional but recommended) Initialize `prettier` and `eslint` with TypeScript support.


# Reviewer Feedback (Reviewer)
<!-- If status is REWORK, details on what failed (AT or Code Quality) -->
