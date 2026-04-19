---
id: US-01-INIT-003
title: Basic PM2 Integration & Scripts
status: DONE
type: feature
---
# Description
As a DevOps engineer, I want basic PM2 scripts configured in the project so that I have a standard way to interact with the PM2 programmatic API and start/stop the bridge.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `package.json`
> *   `src/core/Orchestrator.ts` (for future programmatic usage)

# Acceptance Criteria (DoD)
<!-- 
Must be testable and binary (Pass/Fail).
Include Success, Error, and Edge cases.
-->

- [x] **Scenario 1:** PM2 Dependency
    - Given the project dependencies
    - When I inspect `package.json`
    - Then `pm2` is listed as a dependency.
- [x] **Scenario 2:** PM2 Type Safety
    - Given the project dependencies
    - When I inspect `node_modules/pm2`
    - Then built-in types are available for use in `src/core/Orchestrator.ts`.
- [x] **Scenario 3:** PM2 Start Script
    - Given the `package.json` scripts
    - When I look for execution scripts
    - Then there is a `start` script that uses `pm2` to launch the application.

# UI element
None.

# Technical Notes (Architect)
- **Dependency Management:** PM2 includes built-in types, so `@types/pm2` is not required.
- **Runtime Choice:** The PM2 process uses `tsx` to run `src/index.ts` directly in development via `--import tsx`. For production, it points to `dist/index.js`.
- **Configuration:** An `ecosystem.config.cjs` has been added with `restart_delay: 3000` and `max_memory_restart: '200M'`.
- **Naming:** The bridge process is named `abc-bridge`. Project-specific processes spawned later should follow `abc-[projectId]`.

# Reviewer Feedback (Reviewer)
<!-- If status is REWORK, details on what failed (AT or Code Quality) -->
