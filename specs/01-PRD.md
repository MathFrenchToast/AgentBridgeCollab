# Product Requirement Document (PRD): Agent Bridge Collaboration (ABC)

## 1. Functional Specifications

### Feature: Collaboration Provider Interface
*   **Rule 1:** Must implement the `ICollaborationProvider` interface: `createSpace()`, `sendMessage()`, `waitForInput()`, and `onCommand()`.
*   **Rule 2 (Discord):** Project channels must be created under a predefined Category ID.
*   **Rule 3 (Slack/Teams):** Project isolation should favor threads in a dedicated channel.
*   **Rule 4:** Provider implementation must be switchable via a single environment variable (`ABC_PROVIDER`).

### Feature: MCP Tools
*   **`notify_user(message)`:** Non-blocking tool. The bridge must route the message to the correct project channel/thread based on the process metadata.
*   **`ask_human(question)`:** Blocking tool. The bridge MUST pause execution until the platform-specific `waitForInput` is resolved.
*   **Rule 1:** Timeouts for `ask_human` should be configurable (Default: 30 minutes).

### Feature: Process Orchestration (PM2 Integration)
*   **Rule 1:** Every project initiation MUST spawn a new PM2 process with a sanitized name.
*   **Rule 2:** The bridge MUST track the PM2 `process_id` and its association with the chat `channel_id`.
*   **Rule 3:** The `/stop` command must gracefully stop and delete the PM2 process.
*   **Rule 4:** PM2 MUST be configured for automatic restarts unless the process exits with code 0 (success).
*   **Rule 5:** ABC must tail the PM2 logs to stream agent activity back to the chat platform.
*   **Rule 6:** The `/status` command must return the current PM2 state (online, stopping, errored) and uptime for a specific `projectId`.
*   **Rule 7:** The `/list` command must provide a summary table of all active `projectId`s and their corresponding `channelId`.

### Feature: Advanced Orchestration & Security
*   **Rule 1 (Dynamic Whitelist):** Authorized users must be manageable at runtime via commands (e.g., `/whitelist add @user`). Changes MUST be persisted in the `StateStore`.
*   **Rule 2 (Health Monitoring):** The bridge MUST implement a heartbeat mechanism to detect if an agent process is unresponsive despite being "online" in PM2.
*   **Rule 3 (Rich Interactivity):** Providers SHOULD use platform-native interactive elements (Buttons, Menus) for frequent actions to reduce command typing.

## 2. Data Dictionary
*   **`projectId`:** A unique, sanitized string used as the PM2 process name and channel label.
*   **`channelId` / `threadTs`:** Platform-specific identifier for the communication space.
*   **`pm2Id`:** The internal PM2 process identifier.

## 3. Non-Functional Requirements
*   **Performance:** Message delivery to chat platforms should be near real-time (< 1s latency).
*   **Security:**
    *   **Rule 1:** Whitelist only authorized User IDs allowed to trigger commands.
    *   **Rule 2:** Sanitize all user-provided project names to prevent command injection in PM2 arguments.
    **Rule 3:** Protect sensitive environment variables like `ABC_PROVIDER_TOKEN` and `AGENT_API_KEY`.
*   **Resilience:** The bridge must attempt to reconnect to the chat platform's websocket if disconnected.

## 4. Documentation & Onboarding

### Feature: Onboarding & Installation Guides
*   **Rule 1 (Provider Setup):** Each supported platform (Discord, Slack) MUST have a dedicated setup guide covering:
    *   Platform application/bot creation (e.g., Discord Developer Portal steps).
    *   Required permissions and scopes (e.g., `Manage Channels`, `Send Messages`).
    *   Integration setup (e.g., inviting the bot to a server).
*   **Rule 2 (Quick Start):** A global `README.md` or dedicated `INSTALL.md` MUST provide a "First Steps" guide covering:
    *   Environment variable configuration (`.env.example`).
    *   Installation of dependencies and build process.
    *   Launching the bridge using PM2.
    *   The first command to run to verify the setup (e.g., `/list`).
*   **Rule 3 (Troubleshooting):** Documentation MUST include a section on common issues (e.g., PM2 logs access, permission errors).
