---
id: US-07-PERS-003
title: Track Session Audit Log
status: DONE
type: feature
---
# Description
As an Admin, I want to track user actions and project lifecycle events in a persistent audit log so that I can debug issues and audit usage.

# Context Map
- @src/core/state-store.ts
- @src/core/process-orchestrator.ts
- @src/providers/discord-provider.ts
- @src/types/index.ts

# Acceptance Criteria (DoD)

- [x] **Scenario 1: Log Command Execution**
    - Given a user issues a `/start` or `/stop` command
    - When the command is processed by `DiscordProvider`
    - Then an entry should be added to the `audit_log` table via `StateStore.logEvent()`.
- [x] **Scenario 2: Log Process Failure**
    - Given a PM2 process crashes or restarts
    - When the `ProcessOrchestrator` detects the event
    - Then it should log the failure event to the `audit_log`.
- [x] **Scenario 3: Query Audit Log**
    - Given the database is populated
    - When the `StateStore` retrieves logs for a specific project
    - Then it should return the events in chronological order.

# Technical Notes (Architect)
- **Data Model**: Define `AuditEntry` in `src/types/index.ts`.
  ```typescript
  export interface AuditEntry {
    userId: string;
    action: string;
    projectId?: string;
    timestamp?: string;
  }
  ```
- **StateStore**:
    - Implement `logEvent(entry: AuditEntry): void`. Use `INSERT INTO audit_log (user_id, action, project_id) VALUES (?, ?, ?)`.
    - Implement `getAuditLogs(projectId?: string): AuditEntry[]`.
- **Integration**:
    - In `DiscordProvider.onCommand`, call `stateStore.logEvent` after authorization check.
    - In `ProcessOrchestrator`, use the PM2 bus to listen for `process:exception` or `exit` events and log them.
- **UI Alignment**: No direct UI impact for logging, but ensures traceability for support and debugging.
