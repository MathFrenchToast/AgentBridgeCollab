This Product Requirements Document (PRD) outlines the development of a unified bridge between the Gemini CLI (running in a sandboxed Ubuntu environment) and Discord. The system utilizes the Model Context Protocol (MCP) to facilitate bidirectional communication, enabling remote orchestration and human-in-the-loop intervention.

---

# PRD: Gemini Collaboration Bridge (GCB)

**Version:** 1.1  
**Status:** Draft  
**Target Platform:** Ubuntu 24.04 LTS (Sandbox VM)

## 1. Executive Summary
The goal is to create a communication and control layer for autonomous AI agents. By wrapping the Gemini CLI with a modular MCP server, developers can monitor agent progress in real-time, provide critical feedback, and trigger new tasks remotely via various collaboration platforms (Discord, Slack, Teams, etc.). The architecture prioritizes a clear separation between core logic and platform-specific implementations.

## 2. Objectives
* **Observability:** Stream agent logs and status updates to dedicated channels/threads.
* **Remote Control:** Trigger, pause, or kill Gemini CLI processes via chat commands.
* **Human-in-the-Loop (HITL):** Implement a blocking MCP tool that pauses agent execution until a human provides input.
* **Project Isolation:** Automatically manage a "One Channel/Thread Per Project" structure.
* **Platform Agnosticism:** Architect the system using a provider-based pattern so that Discord can be swapped for Slack, Teams, or Mattermost with minimal changes to core logic.

## 3. User Stories
* *As a developer*, I want to type `/start issue-42` in Discord and have the VM spin up a Gemini CLI instance dedicated to that issue.
* *As a developer*, I want the agent to ping me on Discord when it requires a secret key or a high-risk confirmation.
* *As a developer*, I want to see the agent's step-by-step reasoning in a project-specific channel so I can audit its work without SSH-ing into the VM.

## 4. Functional Requirements

### 4.1 Collaboration Provider Capabilities (General)
* **Standard Interface:** All platforms (Discord, Slack, etc.) must implement a shared interface for project lifecycle management.
* **Dynamic Space Creation:** Create a channel (Discord/Mattermost) or thread (Slack/Teams) for every new project/task.
* **Command Parsing:** Support platform-specific slash commands or mentions (e.g., `/gemini-run`, `@gemini status`).
* **State Management:** Track active Gemini PID (Process ID) and associate it with the corresponding platform-specific `channel_id` or `thread_ts`.

### 4.2 MCP Server Capabilities
* **`notify_user(message)`:** A tool Gemini calls to post non-blocking status updates.
* **`request_input(prompt)`:** A blocking tool that pauses the agent and waits for a human response in the project channel.
* **Standard Input/Output:** Communicate with Gemini CLI via `stdio` using the MCP standard.

### 4.3 Orchestration
* **Session Management:** Use `tmux` or `screen` to run Gemini processes so they persist if the bridge process restarts.
* **Environment Injection:** Pass `GCB_PROVIDER_NAME`, `GCB_CHANNEL_ID`, and `PROJECT_NAME` as environment variables to the Gemini sub-process.

## 5. Technical Architecture

| Component | Role | Notes |
| :--- | :--- | :--- |
| **Bridge Core** | MCP tool registration & tool-flow logic. | Platform-independent. |
| **Provider Interface** | Defines `create_channel()`, `send_message()`, `wait_for_input()`. | Abstract Base Class. |
| **Discord Implementation** | Concrete provider using `discord.py`. | Current target. |
| **Process Manager** | Manages `tmux` lifecycle and PID tracking. | Linux-native via `subprocess`. |
| **MCP SDK** | Implements the Model Context Protocol (Python). | FastMCP favored. |

### 5.1 Communication Flow
1.  User triggers a command in the **Collaboration Platform** (e.g., Discord).
2.  **Provider** translates the event into a generic `StartProject` intent.
3.  **Bridge Core** spawns a `tmux` session running `gemini --mcp-config config.json`.
4.  Gemini initializes the MCP bridge via `stdio`.
5.  When Gemini needs input, it calls `request_input`.
6.  **Bridge Core** delegates to **Provider** to send a message and wait for a response.
7.  **Provider** returns the human input; the bridge returns it to Gemini.

### 5.2 Abstraction Strategy
The system follows a "Clean Architecture" approach:
- **`ICollaborationProvider` (ABC):** Defines the signature for all interactions.
- **`DiscordProvider` (Impl):** Implements Discord-specific WebSocket and HTTP API calls.
- **`FastMCP` Wrapper:** Bridges the provider to Gemini's tool calls without knowing the underlying platform details.



## 6. Setup & Deployment Guide

This guide assumes a clean Ubuntu 24.04 environment where the Gemini CLI and basic tools are already available.

### Phase 1: Dependency Installation
Use `uv` for isolated and fast dependency management.

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create project directory
mkdir gemini-discord-bridge && cd gemini-discord-bridge

# Initialize environment
uv venv
source .venv/bin/activate

# Install core libraries
uv add discord.py mcp fastmcp python-dotenv
```

### Phase 2: Configuration
Create a `.env` file to store sensitive credentials and select the provider.

```env
GCB_PROVIDER=discord  # options: discord, slack, teams
GCB_PROVIDER_TOKEN=your_token_here
GUILD_ID=your_server_id
CATEGORY_ID=your_project_category_id
GEMINI_API_KEY=your_google_api_key
```

### Phase 3: The Bridge Implementation (`bridge.py`)
The implementation uses a dependency-injection pattern.

* **Provider Abstraction:** Define an `AbstractProvider` class to handle common communication patterns.
* **Tool implementation:**
    ```python
    @mcp.tool()
    async def ask_human(question: str, ctx: Context) -> str:
        # 1. Identity context (provider-agnostic)
        provider = get_active_provider()
        # 2. Delegate message/wait to the concrete provider
        result = await provider.request_input(question)
        # 3. Return result to Gemini
        return result
    ```

### Phase 4: Gemini CLI Integration
Create a `mcp_config.json` for the Gemini CLI to point to your bridge.

```json
{
  "mcpServers": {
    "collab-bridge": {
      "command": "python",
      "args": ["/path/to/bridge.py"],
      "env": {
        "PYTHONPATH": "."
      }
    }
  }
}
```

### Phase 5: Execution
1.  Start the Bridge: `python bridge.py`.
2.  Trigger a task via the selected platform: `/start project_alpha "Analyze the files in /src"`.
3.  The bridge will handle the `tmux` creation and handoff, using the provider-specific logic for interaction.

## 7. Security Requirements
* **User Whitelisting:** The bridge must only respond to specific User IDs/Emails from the selected platform.
* **Command Sanitization:** All project names passed to `tmux` must be sanitized to prevent shell injection.
* **Access Control:** Tokens for the Collaboration Provider (e.g., Discord) should follow the principle of least privilege, scoped to specific channels/categories.