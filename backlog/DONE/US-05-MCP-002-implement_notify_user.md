---
id: US-05-MCP-002
title: Implement notify_user Tool
status: DONE
type: feature
---
# Description
As a Gemini Agent, I want to notify the user of my progress so that they are kept informed without interrupting my execution.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/mcp-bridge.ts
> *   @src/providers/collaboration-provider.ts
> *   @src/core/process-orchestrator.ts
> *   @src/types/index.ts
> *   @tests/unit/mcp-bridge.test.ts

# Acceptance Criteria (DoD)
- [x] **Scenario 1: Route message to correct channel**
    - Given a Gemini process running for `projectId` "test-project"
    - When it calls the `notify_user` tool with message "Task started"
    - Then the bridge should identify the `projectId` from the process context
    - And call `provider.sendMessage(spaceId, "Task started")` where `spaceId` is associated with "test-project"
- [x] **Scenario 2: Non-blocking execution**
    - Given a call to `notify_user`
    - When the tool is executed
    - Then it should return a success status to the agent immediately after triggering the send (fire-and-forget from agent perspective)

# UI element
- **Informational Messages**: Blue sidebar Embeds (as per `specs/02-UX-DESIGN.md`).
- **Formatting**: The notification should be visually distinct from direct HITL prompts.

# Technical Notes (Architect)
- **Tool definition**: `name: "notify_user"`, `description: "Sends a non-blocking notification to the user"`.
- **Arguments schema**: `{ type: "object", properties: { message: { type: "string" } }, required: ["message"] }`.
- **Implementation**:
    - Add `registerDefaultTools()` method to `McpBridge`.
    - In `notify_user` handler:
        1. Retrieve `channelId` using `this.orchestrator.getProcessInfo(projectId).channelId`.
        2. Call `this.provider.sendMessage(channelId, message)` WITHOUT `await`.
        3. Handle potential errors from `sendMessage` with a `.catch()` block for logging (e.g., `console.error`).
        4. Return `{ success: true }`.
- **Initialization**: Ensure `McpBridge` calls `registerDefaultTools()` during construction or initialization.
- **Dependency**: Requires `ProcessOrchestrator` to have valid metadata for the calling `projectId`.

# Implementation Plan
1.  **Tool Definition**: Define the JSON schema for the `notify_user` tool.
2.  **Handler Logic**: Implement the handler that uses the `ProcessOrchestrator` to map `projectId` to `channelId`.
3.  **Fire-and-Forget**: Ensure the message sending is non-blocking as per Scenario 2.
4.  **Registration**: Register the tool within `McpBridge`.
5.  **Validation**: Add a unit test in `tests/unit/mcp-bridge.test.ts` to verify the tool's registration and behavior.

# Reviewer Feedback
- The implementation of `notify_user` correctly follows the non-blocking requirement using a fire-and-forget pattern.
- Unit tests are comprehensive and verify both success and failure (unknown project) scenarios.
- The use of `EmbedBuilder` in `DiscordProvider` ensures a blue sidebar, making notifications visually distinct from input prompts.
- Good integration with `ProcessOrchestrator` to lookup the correct `channelId` based on `projectId`.
