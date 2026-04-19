---
id: US-05-MCP-009
title: Implement Launcher Shim for Stdio-to-IPC Bridging
status: DONE
type: feature
---
# Description
As a Developer, I want a Launcher Shim script that wraps the Gemini CLI process so that I can bridge PM2's IPC messages to the process's standard input (stdin). This is necessary because PM2's programmatic API does not support continuous stdin piping.

# Context Map
| Feature / Module | Key Files / Directories | Entry Point |
| :--- | :--- | :--- |
| **Core Orchestration** | `src/core/process-orchestrator.ts`, `src/core/launcher.ts` | `src/core/process-orchestrator.ts` |

**Specific files for this story:**
*   `src/core/launcher.ts` (Implementation)
*   `src/core/process-orchestrator.ts` (Spawning logic)
*   `specs/03-ARCHITECTURE.md` (Section 4.5 reference)

# Acceptance Criteria (DoD)
- [x] **Scenario 1: Child Process Spawning**
    - Given the shim is executed with a target command and arguments
    - When the shim starts
    - Then it should spawn the target command as a child process
    - And forward all `stdout` and `stderr` from the child to the shim's own output streams.
- [x] **Scenario 2: IPC to Stdin Bridging**
    - Given a running child process managed by the shim
    - When the shim receives an IPC message with topic `gcb:stdin`
    - Then it should write the message payload (JSON-RPC string) followed by a newline to the child process's `stdin`.
- [x] **Scenario 3: Graceful Exit Propagation**
    - Given the child process exits
    - When the exit event is captured by the shim
    - Then the shim should exit with the same exit code as the child.
- [x] **Scenario 4: Error Handling**
    - Given the child process fails to start or crashes
    - When the error occurs
    - Then the shim should log the error to `stderr` and exit with a non-zero code.

# Technical Notes (Architect)
- **Implementation**: Create `src/core/launcher.ts`.
- **Spawning**: Use `child_process.spawn(command, args, { stdio: ['pipe', 'inherit', 'inherit'] })`.
- **IPC Handling**: Use `process.on('message', (packet: any) => { ... })`. PM2 sends packets where the payload is often in `packet.data` or similar, but according to our architecture, we look for `packet.topic === 'gcb:stdin'`.
- **Message Format**: The payload received via IPC should be written directly to `child.stdin.write(payload + '\n')`.
- **Signal Forwarding**: Listen for `SIGINT`, `SIGTERM` on the shim process and forward them to the child process to ensure graceful shutdown of the Gemini CLI.
- **Exit Code**: Capture `child.on('exit', (code) => process.exit(code ?? 1))`.
- **KISS**: Keep the shim as minimal as possible to reduce overhead and potential failure points.
- **No UI Impact**: This is a backend infrastructure component; no changes to `specs/02-UX-DESIGN.md` are required.
