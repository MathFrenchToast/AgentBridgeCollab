---
id: US-08-EVOL-001
title: Slack Provider Implementation
status: READY
type: feature
---
# Description
As a Developer, I want to use Slack as a collaboration platform so that teams using Slack can bridge their Gemini agents.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/providers/slack-provider.ts
> *   @src/providers/provider-factory.ts
> *   @src/core/config-validator.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Successful connection to Slack**
    - Given `ABC_PROVIDER="slack"` and valid `SLACK_BOT_TOKEN`/`SLACK_APP_TOKEN`
    - When the application starts
    - Then the `SlackProvider` should initialize using Bolt SDK and connect via Socket Mode.
- [ ] **Scenario 2: Project isolation via threads**
    - Given a new project is started
    - When `createSpace()` is called
    - Then the provider should create a new thread in the channel specified by `SLACK_CHANNEL_ID`.
- [ ] **Scenario 3: Implementing ICollaborationProvider**
    - Given a `SlackProvider` instance
    - When calling `createSpace`, `sendMessage`, `waitForInput`, and `onCommand`
    - Then it should fulfill the interface contract using Slack-specific API calls.
- [ ] **Scenario 4: Configuration Validation**
    - Given Slack provider is selected
    - When the app starts
    - Then it should validate `SLACK_APP_TOKEN` and `SLACK_CHANNEL_ID` are present.

# Technical Notes (Architect)
- **SDK**: Use `@slack/bolt` for Slack integration.
- **Connection**: Implement Socket Mode (`socketMode: true`) to avoid the need for public HTTP endpoints. Requires `SLACK_APP_TOKEN`.
- **Space Isolation**: 
    - `createSpace(projectId)`: Post an initial "Project [projectId] started" message to `SLACK_CHANNEL_ID`. Return the `ts` of this message as the `spaceId`.
    - `sendMessage(spaceId, content)`: Call `chat.postMessage` with `thread_ts: spaceId` and `channel: SLACK_CHANNEL_ID`.
    - `waitForInput(spaceId, prompt)`: Post prompt to thread, then use a listener or `client.conversations.replies` to capture the next user message in that thread.
- **Security**: Implement whitelist check for Slack User IDs.
- **Config**: Update `src/core/config-validator.ts` to include Slack-specific variables in the `SlackSchema`.
