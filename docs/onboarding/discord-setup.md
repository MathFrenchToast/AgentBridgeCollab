# Discord Setup Guide

This guide details how to create and configure a Discord Bot for the Gemini Collaboration Bridge.

## Step 1: Create Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and give it a name (e.g., "GCB-Agent").
3. Navigate to **Installation** and ensure "Guild Install" is allowed.

## Step 2: Bot Configuration

1. In the sidebar, click **Bot**.
2. **Reset Token** (or copy it) - this is your `GCB_PROVIDER_TOKEN`.
3. **Privileged Gateway Intents**: You MUST enable **Message Content Intent**.
   - *Why?* GCB needs to read user responses for Human-in-the-Loop tasks.

## Step 3: OAuth2 & Permissions

1. Go to **OAuth2 -> URL Generator**.
2. Select `bot` and `applications.commands` scopes.
3. Select the following **Bot Permissions**:
   - Manage Channels
   - View Channels
   - Send Messages
   - Embed Links
   - Read Message History
4. Copy the generated URL and open it in your browser to invite the bot to your server.

## Step 4: Server Configuration

To fill your `.env`, you need these IDs:

1. **Guild ID**: Right-click your server name and select "Copy Server ID".
2. **Category ID**: Create a Category where agent channels will live. Right-click it and select "Copy Category ID".
3. **User ID**: Right-click your own name and select "Copy User ID" to add it to `AUTHORIZED_USER_IDS`.

*Note: You must have Discord "Developer Mode" enabled in User Settings -> Advanced to see "Copy ID" options.*

---

**Back to:** [Quick Start](./quick-start.md)
