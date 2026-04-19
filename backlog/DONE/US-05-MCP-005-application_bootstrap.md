---
id: US-05-MCP-005
title: Main Application Entry Point and Bootstrapping
status: DONE
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
- [x] **Scenario 1: Application Start**
    - Given the `npm start` command is run
    - When `src/index.ts` executes
    - Then it should validate environment variables
    - And initialize the `CollaborationProvider` (based on `ABC_PROVIDER`)
    - And initialize `ProcessOrchestrator`
    - And finally initialize `McpBridge` and start listening
- [x] **Scenario 2: Graceful Shutdown**
    - Given the bridge is running
    - When a SIGTERM or SIGINT is received
    - Then it should gracefully disconnect from the provider and stop any internal listeners

# Technical Notes (Architect)
- **Configuration**: Use `validateConfig` from `@/core/config-validator` to ensure environment integrity.
- **Provider Initialization**: 
    - Use `createProvider(config)` from `@/providers/provider-factory`.
    - Call `await provider.connect()`.
- **Orchestrator Initialization**: 
    - Instantiate `ProcessOrchestrator`.
    - Call `await orchestrator.init()` followed by `await orchestrator.startLogTailing()`.
- **Bridge Initialization**: 
    - Instantiate `McpBridge(provider, orchestrator, config)`.
    - Call `bridge.listenToProviderCommands()`.
- **Graceful Shutdown**: 
    - Implement listeners for `SIGINT` and `SIGTERM`.
    - Ensure `await orchestrator.disconnect()` and `await provider.disconnect()` are called before `process.exit(0)`.

# Reviewer Feedback
- Implementation is clean and follows the technical notes perfectly.
- Unit tests cover both successful bootstrap and graceful shutdown scenarios.
- MCP Bridge commands (/start, /stop, /status, /list) are well integrated and tested.
