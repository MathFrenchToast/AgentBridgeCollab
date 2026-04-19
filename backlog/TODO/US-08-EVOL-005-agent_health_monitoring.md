---
id: US-08-EVOL-005
title: Agent Health Monitoring (Heartbeat)
status: READY
type: feature
---
# Description
As an Operator, I want the bridge to detect if an agent process has hung or become unresponsive so that I can be alerted and the system can maintain reliability.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/process-orchestrator.ts
> *   @src/core/launcher.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Heartbeat detection**
    - Given an active PM2 process
    - When the bridge does not receive a heartbeat signal (via Stdio) for a configurable interval
    - Then the process should be marked as "UNRESPONSIVE".
- [ ] **Scenario 2: Operator notification**
    - Given a process becomes "UNRESPONSIVE"
    - When the health monitor detects the failure
    - Then a warning message should be sent to the project channel/thread.
- [ ] **Scenario 3: Auto-recovery (Optional/Configurable)**
    - Given a process is hung
    - When auto-restart is enabled
    - Then the `ProcessOrchestrator` should attempt to restart the PM2 process.

# Technical Notes (Architect)
- Implement a heartbeat protocol over the Stdio bridge (Launcher Shim).
- Add a background timer in `ProcessOrchestrator` to track the last-seen heartbeat for each active project.
