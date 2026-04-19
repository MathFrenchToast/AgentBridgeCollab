---
id: US-05-MCP-003
title: Implement ask_human Tool with Blocking Logic
status: DONE
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
- [x] **Scenario 1: Successful blocking input**
    - Given a Gemini process calling `ask_human` with prompt "Confirm deployment?"
    - When the bridge receives the request
    - Then it should call `provider.waitForInput(spaceId, "Confirm deployment?")`
    - And the tool execution MUST wait (await) for the user response
    - And return the response string back to the agent
- [x] **Scenario 2: Configurable Timeout**
    - Given the default timeout is 30 minutes (or `GCB_ASK_TIMEOUT`)
    - When the user does not respond within that timeframe
    - Then the bridge should return an error message to the agent indicating a timeout
- [x] **Scenario 3: Empty Response**
    - Given a user provides an empty response
    - When the provider returns it
    - Then the bridge should return the response to the agent (letting the agent handle empty strings)

# Technical Notes (Architect)
- **Tool definition**: `name: "ask_human"`, `description: "Sends a prompt to the user and waits for a reply"`.
- **Arguments schema**: `{ type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] }`.
- **Implementation**:
    - Add `ask_human` handler in `registerDefaultTools()`.
    - In the handler:
        1. Retrieve `channelId` using `this.orchestrator.getProcessInfo(projectId).channelId`.
        2. Set a timeout using `Promise.race` with a `setTimeout` (based on `process.env.GCB_ASK_TIMEOUT || 1800000`).
        3. Await `this.provider.waitForInput(channelId, prompt)`.
        4. If the provider returns a response, return `{ response: response }`.
        5. If timeout occurs, return an error object or throw an MCP Error (e.g., `-32603`).
- **Error Handling**: Catch and log any provider-level errors, then return a fallback error message to the agent.
- **Dependency**: Requires `ICollaborationProvider` to have a working `waitForInput` implementation (Discord already does).
