---
id: US-05-MCP-006
title: Stream PM2 Logs to Collaboration Platform
status: READY
type: feature
---
# Description
As a User, I want to see my agent's activity logs in real-time in the project channel so that I can monitor its progress without leaving the chat.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/mcp-bridge.ts
> *   @src/core/process-orchestrator.ts
> *   @src/providers/collaboration-provider.ts

# Acceptance Criteria (DoD)
- [ ] **Scenario 1: Log streaming started**
    - Given a Gemini process is spawned for `projectId` "test-project"
    - When the process writes to `stdout` or `stderr`
    - Then the `ProcessOrchestrator` should capture these logs (via PM2 bus)
    - And the `McpBridge` should route them to `provider.sendMessage(spaceId, logLine)`
- [ ] **Scenario 2: Log Throttling**
    - Given a high volume of log lines
    - When streaming to the provider
    - Then the bridge should implement basic throttling or batching to avoid hitting chat platform rate limits

# Technical Notes (Architect)
- Use `pm2.launchBus()` to listen for `log:out` and `log:err` events.
- Filter logs by `process.name` to match the `projectId`.
- Implement a simple buffer or throttle (e.g., send every 1 second or every 5 lines) to respect Discord/Slack rate limits.
