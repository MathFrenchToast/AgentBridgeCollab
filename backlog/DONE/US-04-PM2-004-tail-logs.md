---
id: US-04-PM2-004
title: Implement PM2 Log Tailing and Event Routing
status: DONE
type: feature
---
# Description
As a Developer, I want the Orchestrator to tail the logs of managed PM2 processes and emit events, so that the Bridge can stream agent activity back to the chat platform.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/core/process-orchestrator.ts`
> *   `src/types/index.ts`

# Acceptance Criteria (DoD)
- [x] **Scenario 1: Capture Stdout/Stderr**
    - Given an active managed PM2 process (prefixed with `gcb-`)
    - When the process writes to `stdout` or `stderr`
    - Then the orchestrator should capture this output via `pm2.launchBus()`
    - And it should emit a structured log event containing the `projectId`, `channelId`, and the log `content`.
- [x] **Scenario 2: Ignore Unmanaged Processes**
    - Given a log event from a PM2 process not prefixed with `gcb-`
    - When the orchestrator processes the event bus
    - Then it should ignore the log and NOT emit an event.
- [x] **Scenario 3: Log Sanitization**
    - Given a log message with excessive whitespace or newlines at the end
    - When the orchestrator emits the event
    - Then the content should be trimmed to avoid redundant empty messages in the chat platform.

# UI element
None.

# Technical Notes (Architect)
- **Event Bus:** Use `pm2.launchBus((err, bus) => { ... })` to subscribe to PM2 events.
- **Log Listeners:** Listen for `log:out` and `log:err` events on the bus.
- **Filtering:** 
    - The `packet.process.name` MUST start with `gcb-`.
    - Extract `projectId` by removing the `gcb-` prefix.
- **Metadata:** Use the internal state map (from US-04-PM2-002) to resolve the `channelId` associated with the `projectId`.
- **Event Emission:** `ProcessOrchestrator` should extend `EventEmitter` or accept a callback in its constructor/method to bubble up logs.
- **Payload Structure:** 
  ```typescript
  {
    projectId: string;
    channelId: string;
    content: string;
    type: 'stdout' | 'stderr';
  }
  ```
- **Cleanup:** Ensure the bus connection is closed or listeners are removed if the orchestrator is stopped.

# Reviewer Feedback (Reviewer)
<!-- If status is REWORK, details on what failed (AT or Code Quality) -->