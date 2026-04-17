---
id: US-05-MCP-002
title: Implement notify_user Tool
status: READY
type: feature
---
# Description
As a Gemini Agent, I want to notify the user of my progress so that they are kept informed without interrupting my execution.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/mcp-bridge.ts
> *   @src/providers/collaboration-provider.ts

# Acceptance Criteria (DoD)
- [ ] **Scenario 1: Route message to correct channel**
    - Given a Gemini process running for `projectId` "test-project"
    - When it calls the `notify_user` tool with message "Task started"
    - Then the bridge should look up the provider's communication space associated with "test-project"
    - And call `provider.sendMessage("Task started")` to that space
- [ ] **Scenario 2: Handle non-blocking execution**
    - Given a call to `notify_user`
    - When the tool is executed
    - Then it should return immediately to the agent after triggering the message send

# Technical Notes (Architect)
- Tools must be registered with the `McpServer` instance.
- The bridge needs a mapping or logic to extract `projectId` from the environment or process context (e.g., via environment variables passed to the child process).
