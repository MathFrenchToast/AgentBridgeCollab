---
id: US-05-MCP-003
title: Implement ask_human Tool with Blocking Logic
status: READY
type: feature
---
# Description
As a Gemini Agent, I want to ask the user a question and wait for their response so that I can proceed with the correct information.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/mcp-bridge.ts
> *   @src/providers/collaboration-provider.ts

# Acceptance Criteria (DoD)
- [ ] **Scenario 1: Successful blocking input**
    - Given a Gemini process calling `ask_human` with question "What is the target dir?"
    - When the bridge receives the request
    - Then it should call `provider.waitForInput("What is the target dir?")`
    - And the tool execution MUST wait for the user response
    - And return the response string back to the agent
- [ ] **Scenario 2: Configurable Timeout**
    - Given the default timeout is 30 minutes (or a custom configured value)
    - When the user does not respond within that timeframe
    - Then the bridge should return an error/timeout response to the agent
- [ ] **Scenario 3: Empty Response**
    - Given a user provides an empty response
    - When the provider returns it
    - Then the bridge should return the empty string or a default placeholder to the agent

# Technical Notes (Architect)
- This tool is blocking; the MCP request handler should return a Promise that resolves when the user replies.
- Use `GCB_ASK_TIMEOUT` environment variable (validated by `ConfigValidator`) for the timeout logic.
