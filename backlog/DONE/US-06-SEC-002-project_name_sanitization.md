---
id: US-06-SEC-002
title: Project Name Sanitization
status: DONE
type: feature
---
# Description
As a System Administrator, I want to ensure all project names are sanitized before being passed to PM2 so that command injection attacks via malicious project names are prevented.

# Context Map
- **Logic Implementation**: `src/core/process-orchestrator.ts` (`sanitizeName` method)
- **Command Handling**: `src/core/mcp-bridge.ts` (ensuring early sanitization)
- **Tests**: `tests/unit/process-orchestrator.test.ts`

# Acceptance Criteria (DoD)

- [x] **Scenario 1: Standard project name**
    - Given a project name "My Project 123"
    - When `startProcess` is called
    - Then the resulting PM2 process name is "gcb-my-project-123"
- [x] **Scenario 2: Malicious project name (Command Injection)**
    - Given a project name "test; rm -rf /"
    - When `startProcess` is called
    - Then the resulting PM2 process name is "gcb-test-rm-rf"
    - And no shell command injection occurs
- [x] **Scenario 3: Special characters**
    - Given a project name "Project @#$%^&*()!"
    - When `startProcess` is called
    - Then the resulting PM2 process name is "gcb-project"
- [x] **Scenario 4: Empty or Invalid Input**
    - Given an input that results in an empty string after sanitization (e.g., "!!!")
    - When `startProcess` is called
    - Then it should throw an error or use a fallback UUID to avoid invalid PM2 names.

# UI element
- None (Internal logic). The user receives the sanitized ID in the confirmation message.

# Technical Notes (Architect)
- **Implementation**: The `sanitizeName` method in `ProcessOrchestrator` should be made public or moved to a utility to ensure consistency across the bridge.
- **Vulnerability**: Currently, `McpBridge` calls `provider.createSpace` using the raw `command.projectId`. This must be changed to use the sanitized version to prevent passing malicious strings to the Collaboration Provider (Discord/Slack).
- **Refactoring**: In `McpBridge.listenToProviderCommands`, sanitize the `projectId` immediately after receiving the 'start' command.
- **Edge Cases**: Handle cases where sanitization results in an empty string. PM2 process names cannot be empty.

# Reviewer Feedback (Reviewer)
The sanitization logic is correctly implemented in `src/core/utils.ts` and used consistently in both `McpBridge` and `ProcessOrchestrator`. It correctly handles all edge cases, including malicious strings and strings that sanitize to empty values by using a random UUID as fallback.
