---
id: US-05-MCP-010
title: Integrate Launcher Shim in ProcessOrchestrator
status: DONE
type: feature
---
# Description
As an Orchestrator, I want to use the Launcher Shim script when spawning processes via PM2 so that I can send data to their `stdin` via IPC. This enables bidirectional communication with Gemini CLI processes.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/process-orchestrator.ts
> *   @src/core/launcher.ts

# Acceptance Criteria (DoD)
- [x] **Scenario 1: Spawn Process with Shim**
    - Given a request to `spawnProcess(projectId, options)`
    - When the orchestrator calls `pm2.start()`
    - Then it should use the Launcher Shim (e.g., `tsx src/core/launcher.ts` or the compiled JS) as the script
    - And pass the original agent command and arguments as arguments to the shim.
- [x] **Scenario 2: Implement sendToProcess Method**
    - Given a running process with a known `pm2Id`
    - When `orchestrator.sendToProcess(projectId, data)` is called
    - Then the orchestrator should use `pm2.sendDataToProcessId()` to send an IPC message
    - And the message must have the topic `abc:stdin` and the data payload.
- [x] **Scenario 3: Validation of IPC Support**
    - Given a process spawned with the shim
    - When `sendToProcess` is called
    - Then the orchestrator should ensure that the IPC message is correctly dispatched and acknowledged by the PM2 API.

# Technical Notes (Architect)
- **Script Path**: Locate the path to `launcher.ts`. For development, use `tsx src/core/launcher.ts`.
- **Arguments Construction**: 
    - `args` should contain the path to the `gemini-cli` entry point and its user-provided arguments.
- **PM2 Send IPC**:
    ```typescript
    pm2.sendDataToProcessId({
      id: pm2Id,
      topic: 'abc:stdin',
      data: payload,
    }, (err, res) => { ... });
    ```
- **Error Handling**: Log failures in `pm2.sendDataToProcessId` to the Bridge's logs.
