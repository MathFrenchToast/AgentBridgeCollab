---
id: US-05-MCP-005
title: Main Application Entry Point and Bootstrapping
status: READY
type: feature
---
# Description
As a Developer, I want a central entry point to bootstrap the bridge, providers, and orchestrator so that the application can be started as a single service.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/index.ts
> *   @src/core/config-validator.ts

# Acceptance Criteria (DoD)
- [ ] **Scenario 1: Application Start**
    - Given the `npm start` command is run
    - When `src/index.ts` executes
    - Then it should validate the environment using `ConfigValidator`
    - And instantiate the `DiscordProvider` (or the configured provider)
    - And instantiate the `ProcessOrchestrator`
    - And initialize the `McpBridge` with these dependencies
- [ ] **Scenario 2: Fatal Error Handling**
    - Given a missing critical environment variable
    - When the application starts
    - Then it should log a clear error message and exit with code 1

# Technical Notes (Architect)
- This is the "Composition Root" of the application.
- Ensure proper logging of the initialization sequence.
