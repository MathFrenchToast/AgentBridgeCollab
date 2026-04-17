---
id: US-06-SEC-002
title: Project Name Sanitization
status: READY
type: feature
---
# Description
As a System Administrator, I want to ensure all project names are sanitized before being passed to PM2 so that command injection attacks via malicious project names are prevented.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/process-orchestrator.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Standard project name**
    - Given a project name "My Project 123"
    - When `startProcess` is called
    - Then the resulting PM2 process name is "gcb-my-project-123"
- [ ] **Scenario 2: Malicious project name (Command Injection)**
    - Given a project name "test; rm -rf /"
    - When `startProcess` is called
    - Then the resulting PM2 process name is "gcb-test-rm-rf-"
    - And no shell command injection occurs
- [ ] **Scenario 3: Special characters**
    - Given a project name "Project @#$%^&*()!"
    - When `startProcess` is called
    - Then the resulting PM2 process name is "gcb-project-"

# UI element
- None (Internal logic)

# Technical Notes (Architect)
- The current `sanitizeName` in `ProcessOrchestrator` uses `replace(/[^a-z0-9]+/g, '-')`.
- Verify if this is sufficient for PM2 process names.
- Ensure `projectId` used in environment variables is also the sanitized version.
- Add comprehensive unit tests in `tests/unit/process-orchestrator.test.ts` specifically for sanitization edge cases.

# Reviewer Feedback (Reviewer)
