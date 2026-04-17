---
id: US-05-MCP-007
title: Implement Project Context Extraction
status: READY
type: feature
---
# Description
As a Bridge, I want to reliably identify which project is calling a tool so that I can route messages to the correct collaboration space (channel/thread).

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/mcp-bridge.ts
> *   @src/core/process-orchestrator.ts

# Acceptance Criteria (DoD)
- [ ] **Scenario 1: Extract Project ID from Environment**
    - Given the MCP Server is running for a spawned process
    - When a tool call is received
    - Then the bridge should retrieve the `GCB_PROJECT_ID` from the environment variables of the process.
- [ ] **Scenario 2: Validate Project Context**
    - Given an extracted `projectId`
    - When the bridge checks its internal state
    - Then it should verify that this `projectId` is currently tracked and has an associated `spaceId`.
- [ ] **Scenario 3: Handle Missing Context**
    - Given a tool call from a process where `GCB_PROJECT_ID` is missing or invalid
    - When the bridge attempts to process the tool call
    - Then it should return a clear error to the MCP Client (agent) and log the event.

# Technical Notes (Architect)
- The `McpBridge` should have a helper method `getProjectContext()` that encapsulates this logic.
- Ensure that when multiple MCP server instances are running (if using Stdio per process), each instance is correctly initialized with its specific context.
- Log context extraction failures to `stderr` for visibility in PM2 logs.
