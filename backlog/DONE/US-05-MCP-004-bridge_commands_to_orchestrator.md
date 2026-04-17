---
id: US-05-MCP-004
title: Bridge Provider Commands to Orchestrator Actions
status: DONE
type: feature
---
# Description
As a User, I want to control my Gemini processes via chat commands (/start, /stop, /status, /list) so that I can manage my agents easily from the collaboration platform.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/mcp-bridge.ts
> *   @src/core/process-orchestrator.ts
> *   @src/providers/collaboration-provider.ts

# Acceptance Criteria (DoD)
- [x] **Scenario 1: Handle /start command**
    - Given a `/start <projectId>` command
    - When the bridge processes it
    - Then it should call `provider.createSpace(projectId)`
    - And then `orchestrator.spawnProcess(projectId, { channelId })`
- [x] **Scenario 2: Handle /stop command**
    - Given a `/stop` command in a project channel
    - When the bridge processes it
    - Then it should call `orchestrator.stopProcess(projectId)`
    - And send a confirmation message back to the channel
- [x] **Scenario 3: Handle /status command**
    - Given a `/status` command
    - When the bridge processes it
    - Then it should retrieve process state (online/uptime/status) from `orchestrator`
    - And format it as a message to the user
- [x] **Scenario 4: Handle /list command**
    - Given a `/list` command
    - When the bridge processes it
    - Then it should retrieve all active processes from `orchestrator`
    - And return a summary table/list of `projectId`s and their status

# Technical Notes (Architect)
- **Implementation**:
    - Add a `listenToProviderCommands()` method to `McpBridge`.
    - In `this.provider.onCommand(async (command) => { ... })`:
        - `/start <projectId>`:
            1. Validate `projectId` format.
            2. Call `await this.provider.createSpace(projectId)`.
            3. Call `await this.orchestrator.spawnProcess(projectId, { channelId })`.
            4. Inform user that the process has been spawned.
        - `/stop`:
            1. Identify `projectId` from current channel (using `orchestrator.getProjectFromChannel(command.channelId)`).
            2. Call `await this.orchestrator.stopProcess(projectId)`.
            3. Confirm stopping.
        - `/status`:
            1. Similar to `/stop`, but call `orchestrator.getProcessInfo(projectId)`.
            2. Format information as a message and call `provider.sendMessage`.
        - `/list`:
            1. Call `orchestrator.listProcesses()`.
            2. Format the list and send via `provider.sendMessage`.
- **Command Dispatcher**: Consider using a simple `switch-case` for dispatching commands based on `command.type`.
- **Error Handling**: Use `try-catch` blocks around each command's execution and report errors to the user in the channel via `provider.sendMessage`.
