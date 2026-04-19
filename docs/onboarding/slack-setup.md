# Slack Setup Guide

This guide details how to create and configure a Slack App for the Gemini Collaboration Bridge using Socket Mode.

## Step 1: Create App

1. Go to [Slack App Management](https://api.slack.com/apps).
2. Click **Create New App** -> **From scratch**.
3. Name it (e.g., "GCB Bridge") and select your workspace.

## Step 2: Socket Mode & App Token

1. Go to **Settings -> Socket Mode**.
2. Toggle **Enable Socket Mode**.
3. You will be prompted to create an **App-level Token**.
   - Name it (e.g., `GCB_SOCKET_TOKEN`).
   - Add the `connections:write` scope.
4. Copy the token (starts with `xapp-`). This is your `SLACK_APP_TOKEN`.

## Step 3: Scopes & Bot Token

1. Go to **Features -> OAuth & Permissions**.
2. Scroll to **Bot Token Scopes** and add:
   - `app_mention` (to receive commands)
   - `chat:write` (to send logs and messages)
   - `channels:history` (to read responses)
   - `channels:read` (to verify channel membership)
3. Scroll up and click **Install to Workspace**.
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`). This is your `GCB_PROVIDER_TOKEN`.

## Step 4: Event Subscriptions

1. Go to **Features -> Event Subscriptions**.
2. Toggle **Enable Events**.
3. Under **Subscribe to bot events**, add:
   - `app_mention`
   - `message.channels` (required to capture HITL responses in threads)

## Step 5: Channel Configuration

1. Invite the bot to a channel: `/invite @YourBotName`.
2. Get the **Channel ID**: Click the channel name -> Settings. Copy the ID at the bottom (starts with `C`). This is your `SLACK_CHANNEL_ID`.

---

**Back to:** [Quick Start](./quick-start.md)
