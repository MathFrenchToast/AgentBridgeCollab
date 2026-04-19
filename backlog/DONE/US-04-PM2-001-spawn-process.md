---
id: US-04-PM2-001
title: Implement Process Spawning and Naming
status: DONE
type: feature
---
# Description
As a Developer, I want the Orchestrator to spawn a new PM2 process with a sanitized name when a project is initiated, so that each project has a dedicated, trackable agent process.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/core/process-orchestrator.ts`
> *   `src/types/index.ts`

# Acceptance Criteria (DoD)
- [x] Scenario 1: Successful Spawning
    - Given a valid, unsanitized `projectName` (e.g., `My Cool Project!`) and a `channelId`
    - When `startProcess(projectName, channelId)` is called
    - Then the orchestrator should sanitize the name to create a `projectId` (e.g., `my-cool-project`)
    - And it should spawn a PM2 process named `abc-my-cool-project`
    - And it should pass `ABC_CHANNEL_ID` and `ABC_PROJECT_ID` as environment variables to the new process.
- [x] Scenario 2: Process Name Sanitization
    - Given a `projectName` with special characters or spaces
    - When the name is sanitized
    - Then the resulting `projectId` should only contain alphanumeric characters and dashes (a-z, 0-9, -).
- [x] Scenario 3: Auto-Restart Configuration
    - Given a call to start a new process
    - When the PM2 start configuration is built
    - Then it MUST include settings for automatic restarts (e.g., `autorestart: true`) BUT configure it to NOT restart if the process exits with code 0 (success).

# UI element
None.

# Technical Notes (Architect)
- **PM2 Library:** Use the programmatic API from `pm2` (`import pm2 from 'pm2'`).
- **Connection:** Before calling `pm2.start()`, ensure `pm2.connect()` resolves successfully. Provide a way to disconnect (`pm2.disconnect()`) for graceful shutdown of the orchestrator itself if needed.
- **Sanitization:** Use a simple RegEx like `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')` for the `projectId`. 
- **Start Config:** 
  - `name`: Must be \`abc-${projectId}\`
  - `script`: The target script to run (for now, assume a placeholder path like `gemini` or an echo script for testing, pass it via environment or config).
  - `autorestart`: `false` (PM2's default autorestart doesn't cleanly support the "restart unless exit 0" natively out-of-the-box without `stop_exit_codes`, use `stop_exit_codes: [0]` if supported, otherwise just rely on `autorestart: true` and `stop_exit_codes: [0]`). *Correction:* PM2 supports `stop_exit_codes: [0]`. Use `autorestart: true` and `stop_exit_codes: [0]`.
  - `env`: Inject `ABC_CHANNEL_ID` and `ABC_PROJECT_ID`.
- **Promises:** Wrap PM2 callback-based functions (`pm2.connect`, `pm2.start`) in `Promise`s to maintain modern `async/await` syntax.

# Reviewer Feedback (Reviewer)
<!-- If status is REWORK, details on what failed (AT or Code Quality) -->