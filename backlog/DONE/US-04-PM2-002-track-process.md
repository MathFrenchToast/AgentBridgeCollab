---
id: US-04-PM2-002
title: Implement Process Tracking and State Management
status: DONE
type: feature
---
# Description
As a Developer, I want the Orchestrator to track the relationship between PM2 `process_id`, `projectId`, and `channelId`, so that messages and commands can be routed correctly.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/core/process-orchestrator.ts`
> *   `src/types/index.ts`

# Acceptance Criteria (DoD)
- [x] Scenario 1: Retrieve Tracked Process
    - Given an active process tracked by the orchestrator
    - When `getProcessInfo(projectId)` is called
    - Then it should return the associated PM2 `pm2Id` and the chat `channelId`.
- [x] Scenario 2: Handle Unknown Process
    - Given a `projectId` that is not currently running or tracked
    - When `getProcessInfo(projectId)` is called
    - Then it should return `null` or throw a specific `ProcessNotFoundError`.
- [x] Scenario 3: State Recovery
    - Given existing PM2 processes named with the `gcb-` prefix
    - When the orchestrator initializes
    - Then it should populate its internal tracking map with the `pm2Id`, `projectId`, and `channelId` (retrieved from process environment variables).

# UI element
None.

# Technical Notes (Architect)
- **State Storage:** Implement a private `Map<string, ProcessMetadata>` within `ProcessOrchestrator`.
- **Interface:** Define `ProcessMetadata` in `src/types/index.ts`:
  ```typescript
  export interface ProcessMetadata {
    pm2Id: number;
    projectId: string;
    channelId: string;
  }
  ```
- **Recovery Logic:** Use `pm2.list()` during construction/initialization. Filter processes where `name` starts with `gcb-`. Extract `channelId` from `proc.pm2_env.GCB_CHANNEL_ID`.
- **Query Method:** `getProcessInfo(projectId: string)` should first check the internal map. If missing, it could optionally perform a `pm2.describe` check before throwing `ProcessNotFoundError`.
- **Dependency:** Ensure `pm2` programmatic API is properly typed or used safely within the orchestrator.

# Reviewer Feedback (Reviewer)
<!-- If status is REWORK, details on what failed (AT or Code Quality) -->