# Product Requirement Document (PRD): Gemini Collaboration Bridge (GCB)

## 1. Functional Specifications

### Feature: Collaboration Provider Interface
*   **Rule 1:** Must implement the `ICollaborationProvider` interface: `createSpace()`, `sendMessage()`, `waitForInput()`, and `onCommand()`.
*   **Rule 2 (Discord):** Project channels must be created under a predefined Category ID.
*   **Rule 3 (Slack/Teams):** Project isolation should favor threads in a dedicated channel.
*   **Rule 4:** Provider implementation must be switchable via a single environment variable (`GCB_PROVIDER`).

### Feature: MCP Tools
*   **`notify_user(message)`:** Non-blocking tool. The bridge must route the message to the correct project channel/thread based on the process metadata.
*   **`ask_human(question)`:** Blocking tool. The bridge MUST pause execution until the platform-specific `waitForInput` is resolved.
*   **Rule 1:** Timeouts for `ask_human` should be configurable (Default: 30 minutes).

### Feature: Process Orchestration (PM2 Integration)
*   **Rule 1:** Every project initiation MUST spawn a new PM2 process with a sanitized name.
*   **Rule 2:** The bridge MUST track the PM2 `process_id` and its association with the chat `channel_id`.
*   **Rule 3:** The `/stop` command must gracefully stop and delete the PM2 process.
*   **Rule 4:** PM2 MUST be configured for automatic restarts unless the process exits with code 0 (success).
*   **Rule 5:** GCB must tail the PM2 logs to stream agent activity back to the chat platform.
*   **Rule 6:** The `/status` command must return the current PM2 state (online, stopping, errored) and uptime for a specific `projectId`.
*   **Rule 7:** The `/list` command must provide a summary table of all active `projectId`s and their corresponding `channelId`.

## 2. Data Dictionary
*   **`projectId`:** A unique, sanitized string used as the PM2 process name and channel label.
*   **`channelId` / `threadTs`:** Platform-specific identifier for the communication space.
*   **`pm2Id`:** The internal PM2 process identifier.

## 3. Non-Functional Requirements
*   **Performance:** Message delivery to chat platforms should be near real-time (< 1s latency).
*   **Security:**
    *   **Rule 1:** Whitelist only authorized User IDs allowed to trigger commands.
    *   **Rule 2:** Sanitize all user-provided project names to prevent command injection in PM2 arguments.
    *   **Rule 3:** Protect sensitive environment variables like `GCB_PROVIDER_TOKEN` and `GEMINI_API_KEY`.
*   **Resilience:** The bridge must attempt to reconnect to the chat platform's websocket if disconnected.
