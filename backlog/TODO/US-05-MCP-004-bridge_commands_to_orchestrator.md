---
id: US-05-MCP-004
title: Bridge Provider Commands to Orchestrator Actions
status: READY
type: feature
---
# Description
As a User, I want to control my Gemini processes via chat commands (like /start, /stop) so that I can manage my agents easily from Discord.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/mcp-bridge.ts
> *   @src/core/process-orchestrator.ts
> *   @src/providers/collaboration-provider.ts

# Acceptance Criteria (DoD)
- [ ] **Scenario 1: Handle /start command**
    - Given a `/start <projectId>` command received from the provider
    - When the bridge processes it
    - Then it should call `orchestrator.spawnProcess(projectId, context)`
    - And associate the resulting PM2 process with the chat channel ID
- [ ] **Scenario 2: Handle /stop command**
    - Given a `/stop` command in a project channel
    - When the bridge processes it
    - Then it should call `orchestrator.stopProcess(projectId)`
    - And confirm the deletion to the user via `provider.sendMessage`
- [ ] **Scenario 3: Handle /status command**
    - Given a `/status` command in a project channel
    - When the bridge processes it
    - Then it should retrieve process state from `orchestrator`
    - And send a summary (online/uptime) back to the channel

# Technical Notes (Architect)
- The bridge acts as the glue between `ICollaborationProvider` events and `ProcessOrchestrator` methods.
- Implement `onCommand` listener from the provider and route based on command name.
