---
id: US-07-PERS-004
title: Orchestrator State Synchronization
status: DONE
type: feature
---
# Description
As a System, I want the Process Orchestrator to synchronize its internal state with the persistent store on startup so that it can manage existing PM2 processes without requiring a re-creation.

# Context Map
- @src/core/process-orchestrator.ts
- @src/core/state-store.ts

# Acceptance Criteria (DoD)

- [x] **Scenario 1: Bootstrap Sync**
    - Given the ABC application is starting
    - When the `ProcessOrchestrator` initializes
    - Then it should query the `StateStore` for all projects marked as 'active' and sync them with the current PM2 process list.
- [x] **Scenario 2: Handle Orphaned PM2 Processes**
    - Given a PM2 process is running but not in the `StateStore`
    - When the sync occurs
    - Then the Orchestrator should log a warning or attempt to re-register the mapping (if metadata is recoverable).
- [x] **Scenario 3: Handle Missing PM2 Processes**
    - Given a project is marked 'active' in the `StateStore` but the PM2 process is missing
    - When the sync occurs
    - Then the Orchestrator should update the `StateStore` status to 'errored' or 'stopped'.

# Technical Notes (Architect)
- Add a `syncWithPersistentStore()` method to the `ProcessOrchestrator`.
- This should be called in the main `bootstrap` sequence in `src/index.ts`.
