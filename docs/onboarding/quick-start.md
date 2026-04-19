# Quick Start Guide

Welcome to the Agent Bridge Collaboration (ABC). This guide will help you get up and running with your own autonomous agent bridge in minutes.

## Prerequisites

- **Node.js**: Version 20.x or higher (LTS recommended).
- **PM2**: Process manager for Node.js (`npm install -g pm2`).
- **Agent Authentication**: 
  - Some agents (like Gemini CLI) may require an API key (e.g. from [Google AI Studio](https://aistudio.google.com/)).
  - Other agents might use interactive authentication or tool-based authentication (like MCP-based authentication).
  - Ensure you have the necessary credentials for the agent you intend to bridge.
- **Collaboration Platform Account**: Discord or Slack (see specific setup guides).

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MathFrenchToast/AgentBridgeCollab.git
   cd AgentBridgeCollab
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

## Environment Configuration

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** and fill in your credentials:

   ```env
   # Core
   ABC_PROVIDER=discord # or 'slack'
   ABC_PROVIDER_TOKEN=your_token_here
   # If your agent requires a static API key, set it here.
   # Note: Authentication can also be interactive or managed by MCP tools.
   AGENT_API_KEY=your_api_key_if_needed

   # Discord Specific (if using discord)
   DISCORD_GUILD_ID=your_guild_id
   DISCORD_CATEGORY_ID=your_category_id

   # Slack Specific (if using slack)
   SLACK_APP_TOKEN=xapp-your-app-token
   SLACK_CHANNEL_ID=your_main_channel_id

   # Security
   AUTHORIZED_USER_IDS=user_id_1,user_id_2
   ```

## Launching ABC

1. **Start the bridge with PM2**:
   ```bash
   pm2 start ecosystem.config.cjs
   ```

2. **Verify it's running**:
   ```bash
   pm2 status
   ```

## First Command

Go to your Discord server (or Slack channel) and type:

```
/list
```

If the bridge responds with an empty list (or a list of active projects), you are successfully connected!

## Troubleshooting

- **Process won't start**: Check PM2 logs using `pm2 logs`. Common issues include missing environment variables or invalid API keys.
- **Bot not responding**: 
  - Ensure `ABC_PROVIDER` is set correctly.
  - Check that the bot has been invited to the server/channel.
  - Verify that "Message Content Intent" (Discord) or Event Subscriptions (Slack) are enabled.
- **Permission Errors**: Verify that the bot has the required permissions (Manage Channels, Send Messages) in the platform developer portal.

---

**Next Steps:**
- [Discord Setup Guide](./discord-setup.md)
- [Slack Setup Guide](./slack-setup.md)
- [Technical Architecture](../../specs/03-ARCHITECTURE.md)
