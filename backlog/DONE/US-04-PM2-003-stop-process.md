---
id: US-04-PM2-003
title: Implement Graceful Process Stopping
status: DONE
type: feature
---
# Description
As a Developer, I want the Orchestrator to gracefully stop and delete a PM2 process when requested, so that project resources can be cleaned up cleanly.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/core/process-orchestrator.ts`
> *   `src/types/index.ts`

# Acceptance Criteria (DoD)
- [x] **Scenario 1: Successful Stop and Delete**
    - Given an active PM2 process named `abc-test-project` and tracked in the internal state
    - When `stopProcess('test-project')` is called
    - Then the orchestrator should call PM2 to stop the process
    - And then it should call PM2 to delete the process
    - And the process metadata should be removed from the internal tracking map.
- [x] **Scenario 2: Stop Non-Existent Process**
    - Given a request to stop a `projectId` that does not exist in PM2 or internal map
    - When `stopProcess('unknown-project')` is called
    - Then the orchestrator should return successfully (idempotent behavior) and not throw.
- [x] **Scenario 3: PM2 Inconsistency**
    - Given a `projectId` that is in the internal map but missing from PM2 (e.g., manual deletion)
    - When `stopProcess(projectId)` is called
    - Then the orchestrator should still remove the entry from the internal map and handle the PM2 "Process not found" error gracefully.

# UI element
None.

# Technical Notes (Architect)
- **Method Signature:** `async stopProcess(projectId: string): Promise<void>`.
- **Workflow:**
    1.  Construct the PM2 name: \`abc-${projectId}\`.
    2.  Try `pm2.stop(name)`.
    3.  Try `pm2.delete(name)`.
    4.  Always remove from the internal `Map` regardless of PM2 errors (idempotency).
- **Error Handling:** 
    - Wrap PM2 callbacks in Promises.
    - Specifically catch errors where `err.message` contains "process name not found" or similar PM2-specific error strings to ensure the method is idempotent.
- **State Integrity:** Ensure the internal map is cleaned up to prevent memory leaks or incorrect `/status` reports later.

# Reviewer Feedback (Reviewer)
<!-- If status is REWORK, details on what failed (AT or Code Quality) -->