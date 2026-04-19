---
id: US-05-MCP-008
title: Implement Process Lifecycle Notifications
status: DONE
type: feature
---
# Description
As a User, I want to receive automated status updates in the project channel when my agent starts, finishes, or crashes so that I can monitor the agent's health without manual checks.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/mcp-bridge.ts
> *   @src/core/process-orchestrator.ts
> *   @src/providers/collaboration-provider.ts

# Acceptance Criteria (DoD)
- [x] **Scenario 1: Notification on Successful Start**
    - Given a `/start` command was successful
    - When the process enters the 'online' state
    - Then the bridge should send a "🚀 Agent started and connected." message to the project channel.
- [x] **Scenario 2: Notification on Graceful Exit**
    - Given a Gemini process finishes its task and exits with code 0
    - When the orchestrator detects the exit
    - Then the bridge should send a "✅ Agent completed its task and shut down gracefully." message.
- [x] **Scenario 3: Notification on Crash/Restart**
    - Given a Gemini process crashes (exit code != 0)
    - When the orchestrator detects the failure
    - Then the bridge should send a "⚠️ Agent crashed unexpectedly. PM2 is attempting a restart..." message.

# Technical Notes (Architect)
- The `ProcessOrchestrator` should emit events for process lifecycle changes (started, exited, crashed).
- The `McpBridge` should listen to these events and use the `CollaborationProvider` to post messages.
- Ensure the `projectId` -> `channelId` mapping is used to route notifications.
