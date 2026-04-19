# Agent Bridge Collaboration (ABC)

Secure, observable, and remote-controllable interface for interfacing a Coding Agent (like gemini cli, claude code, openai codex, ...) to a collaboration platform (like discrod, teams, slack, mattermost, ...)

## 🚀 Quick Start

New to ABC? Follow our **[Onboarding Guide](docs/onboarding/quick-start.md)** to get started in minutes.

- **[Discord Setup](docs/onboarding/discord-setup.md)**
- **[Slack Setup](docs/onboarding/slack-setup.md)**

## 🛠 Features

- **Multi-Platform Support**: Discord, Slack (and Teams coming soon).
- **Process Orchestration**: Built-in PM2 integration for agent lifecycle management.
- **Human-in-the-Loop**: Real-time interaction with autonomous agents via standard chat.
- **Persistent State**: SQLite-backed session and audit logging.
- **Security**: Whitelist-based authorization and strict input sanitization.

## 📖 Documentation

- **[Architecture](./specs/03-ARCHITECTURE.md)**
- **[Product Roadmap](./specs/04-EPICS.md)**
- **[Context Map](./specs/context-map.md)**

## 🧪 Testing

```bash
npm test
```

## 📜 License

[Apache 2.0](./LICENSE)
