---
id: US-05-MCP-006
title: Stream PM2 Logs to Collaboration Platform
status: DONE
type: feature
---
# Description
As a User, I want to see my agent's activity logs in real-time in the project channel so that I can monitor its progress without leaving the chat.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/mcp-bridge.ts
> *   @src/core/process-orchestrator.ts
> *   @src/providers/collaboration-provider.ts
> *   @src/core/log-batcher.ts

# Acceptance Criteria (DoD)
- [x] **Scenario 1: Log streaming started**
    - Given a Gemini process is spawned for `projectId` "test-project"
    - When the process writes to `stdout` or `stderr` (that are not MCP protocol messages)
    - Then the `ProcessOrchestrator` should capture these logs (via PM2 bus)
    - And the `McpBridge` should route them to `provider.sendMessage(spaceId, logLine)`
- [x] **Scenario 2: Log Throttling & Batching**
    - Given a high volume of log lines
    - When streaming to the provider
    - Then the bridge should implement batching (e.g., max 10 lines or 1 second delay) to avoid hitting chat platform rate limits
- [x] **Scenario 3: Visual Formatting**
    - Given log lines from the agent
    - When displayed in Discord
    - Then they should be formatted as "Agent Output" using Blue Sidebar Embeds or code blocks as per @specs/02-UX-DESIGN.md.

# Technical Notes (Architect)
- **Log Source**: `ProcessOrchestrator` already emits `LOG_EMITTED` events from PM2's `log:out` and `log:err`.
- **MCP Protocol Filtering**: Standard `stdout` will contain MCP JSON-RPC messages. These MUST NOT be streamed to the user as they are part of the protocol. Only non-JSON or specific logs should be forwarded.
- **Throttling Mechanism**:
    - Implement a `LogBatcher` class or logic within `McpBridge`.
    - Buffer logs per `projectId`.
    - Flush conditions: `buffer.length >= 10` OR `timeSinceLastFlush >= 1000ms`.
    - Ensure total message length < 2000 characters (Discord limit).
- **UX Alignment**:
    - Use `provider.sendMessage` which should eventually support Embeds.
    - If high volume, prefer code blocks: ` ```\n[LOG] ...\n``` `.
    - Color-coding: Use Blue Sidebar Embeds for `stdout` and Red Sidebar Embeds for `stderr` as per @specs/02-UX-DESIGN.md.
- **Lifecycle**: Start log tailing in `ProcessOrchestrator` during bootstrap (`US-05-MCP-005`).

# Technical Context Map
- `src/core/process-orchestrator.ts`: Emits logs via `EventEmitter`.
- `src/core/mcp-bridge.ts`: Needs a new listener for `LOG_EMITTED` and the batching logic.
- `src/providers/discord-provider.ts`: Ensure `sendMessage` can handle the volume.

# Reviewer Feedback
The implementation is solid. `LogBatcher` correctly handles the requirements for batching and filtering MCP protocol messages. The visual formatting in Discord using colored embeds and code blocks provides a great user experience and follows the specifications. Tests are comprehensive and pass successfully.
