---
id: US-05-MCP-007
title: Implement Project Context Extraction
status: DONE
type: feature
---
# Description
As a Bridge, I want to reliably identify which project is calling a tool so that I can route messages to the correct collaboration space (channel/thread). This ensures that even in multi-project environments, tools like `notify_user` and `ask_human` interact with the correct Discord channel.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/mcp-bridge.ts (Implementation of extraction logic)
> *   @src/core/process-orchestrator.ts (Source of truth for process metadata)
> *   @src/types/index.ts (Define ProjectContext interface)

# Acceptance Criteria (DoD)
- [ ] **Scenario 1: Extract Project ID from Environment**
    - Given the MCP Server is running for a spawned process
    - When a tool call is received
    - Then the bridge should retrieve the `GCB_PROJECT_ID` from the environment variables of the process or the pre-registered context.
- [ ] **Scenario 2: Validate Project Context**
    - Given an extracted `projectId`
    - When the bridge checks its internal state via `ProcessOrchestrator`
    - Then it should verify that this `projectId` is currently tracked and has an associated `channelId`.
- [ ] **Scenario 3: Handle Missing Context**
    - Given a tool call from a process where `GCB_PROJECT_ID` is missing or invalid
    - When the bridge attempts to process the tool call
    - Then it should return a clear error to the MCP Client (agent) and log the event to `stderr`.

# Technical Notes (Architect)
- **Interface Definition**: Add `ProjectContext` to `src/types/index.ts`:
  ```typescript
  export interface ProjectContext {
    projectId: string;
    channelId: string;
    pm2Id: number;
  }
  ```
- **McpBridge Helper**: Implement `private getProjectContext(projectId?: string): ProjectContext`.
  - If `projectId` is provided as an argument, use it to fetch from `orchestrator.getProcessInfo(projectId)`.
  - If not provided, fallback to `process.env.GCB_PROJECT_ID` (enables single-project/sidecar mode).
  - Throw a `ContextError` (custom error) if extraction fails.
- **Validation Logic**: Use the existing `ProcessOrchestrator.getProcessInfo()` which already performs validation.
- **Error Handling**: Ensure tool handlers catch context errors and return them as MCP standard errors (e.g., code `-32603`).
- **Logging**: Use `console.error` for context failures to ensure they appear in the PM2 error logs for the Bridge.

# UI/UX Impact
- None. This is a backend architectural enhancement to ensure routing reliability.
