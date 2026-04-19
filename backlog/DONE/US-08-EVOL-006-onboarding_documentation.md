---
id: US-08-EVOL-006
title: Onboarding & Installation Documentation
status: DONE
type: documentation
---
# Description
As a New Developer or Operator, I want clear, step-by-step instructions for setting up the Discord bot, Slack App, and the GCB bridge so that I can reach a "First Command" state quickly and without errors.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @docs/onboarding/quick-start.md
> *   @docs/onboarding/discord-setup.md
> *   @docs/onboarding/slack-setup.md
> *   @README.md
> *   @specs/03-ARCHITECTURE.md (Section 8)

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Discord Setup Guide**
    - Given the requirement for Discord integration
    - When I follow the `discord-setup.md` guide
    - Then I should successfully create a Discord Application, Bot, and retrieve all mandatory IDs (Token, Guild, Category).
    - **And** I must have enabled the "Message Content Intent" in the Developer Portal.
- [ ] **Scenario 2: Slack Setup Guide**
    - Given the requirement for Slack integration
    - When I follow the `slack-setup.md` guide
    - Then I should successfully create a Slack App with Socket Mode enabled and retrieve necessary tokens (Bot, App).
    - **And** the App must be subscribed to `app_mention` and `message.channels` events.
- [ ] **Scenario 3: Quick Start verification**
    - Given a fresh environment
    - When I follow the `quick-start.md` steps (Clone, Install, Env, Build, Start)
    - Then the bridge should be online and the `/list` command should return a valid response.
- [ ] **Scenario 4: Troubleshooting coverage**
    - Given a common installation error (e.g., missing API key or PM2 process failure)
    - When I check the documentation
    - Then I should find a clear explanation and resolution path (e.g., checking `pm2 logs`).

# Technical Notes (Architect)
- **Documentation Standards:** Use GitHub Flavored Markdown. Prefer Mermaid.js for diagrams (e.g., for describing the Stdio Bridge flow).
- **Discord Setup:** Detailed steps for [Discord Developer Portal](https://discord.com/developers/applications). Explicitly mention Permission Integer calculation (Manage Channels, Read Messages/View Channels, Send Messages, Embed Links).
- **Slack Setup:** Detailed steps for [Slack App Management](https://api.slack.com/apps). Focus on "Socket Mode" to avoid needing a public URL. Document the `SLACK_APP_TOKEN` (starting with `xapp-`) vs `SLACK_BOT_TOKEN` (starting with `xoxb-`).
- **Quick Start:**
    1. Prerequisites (Node.js 20+, PM2).
    2. `.env` setup based on `.env.example`.
    3. Lifecycle: `npm install` -> `npm run build` -> `pm2 start ecosystem.config.cjs`.
- **Environment Variables:** Document every key validated in `src/core/config-validator.ts`.
