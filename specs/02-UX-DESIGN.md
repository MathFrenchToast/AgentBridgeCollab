# UX Design: Gemini Collaboration Bridge (GCB)

## 1. Interaction Model
The bridge utilizes **Slash Commands** for orchestration and **Dedicated Channels/Threads** for real-time interaction and human-in-the-loop (HITL) feedback.

## 2. Slash Commands
| Command | Description | Example |
| :--- | :--- | :--- |
| `/start <id> <prompt>` | Creates a new channel and starts a Gemini process. | `/start refactor-auth "Check all files in /src/auth for security issues"` |
| `/stop <id>` | Gracefully stops the specified Gemini process and deletes the channel. | `/stop refactor-auth` |
| `/status <id>` | Shows the current status (Running, Waiting for Input, Crashed) of a process. | `/status refactor-auth` |
| `/list` | Lists all active GCB processes and their associated channels. | `/list` |

## 3. Dedicated Project Space (e.g., Discord Channel)
When a project starts, GCB creates a dedicated channel.
*   **Agent Output:** The agent's reasoning steps and non-blocking notifications are streamed to this channel as messages.
*   **HITL Prompt:** When `ask_human()` is called, the bot pings the developer in this channel with a clear visual distinction (e.g., an Embed with a specific color).
*   **User Response:** The developer's next message in this specific channel is captured as the input for the agent.

## 4. Visual Language (Discord Specific)
*   **Informational Messages:** Blue sidebar Embeds.
*   **Warning/Error Messages:** Red sidebar Embeds.
*   **HITL Request:** Yellow sidebar Embed with a "WAITING FOR INPUT" header.
*   **Success/Completion:** Green sidebar Embed.

## 5. Security & Authorization
To prevent unauthorized use, commands are restricted to a whitelist of User IDs defined in the configuration.
*   **Unauthorized Attempt:** If a non-whitelisted user attempts to run a slash command, the bot pings them with an **Ephemeral Message** (visible only to them).
*   **Message Content:** "You are not authorized to use this command."

## 6. User Flows
1.  **Kickoff:** Developer enters `/start`.
2.  **Observation:** Developer watches the new channel for live updates.
3.  **Intervention:** Agent asks a question -> Yellow Embed appears -> Developer replies directly in the channel -> Agent resumes.
4.  **Termination:** Developer enters `/stop` or Agent finishes task -> Channel is archived or deleted.
