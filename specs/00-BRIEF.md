# Project Brief: Gemini Collaboration Bridge (GCB)

## 1. Product Vision
To enable seamless and secure interaction between autonomous AI agents running in sandboxed Ubuntu environments and human developers via their existing collaboration platforms (Discord, Slack, Teams). GCB turns a headless CLI agent into a conversational, observable, and controllable teammate.

## 2. Target Audience
- **DevOps/SRE:** Monitoring agent progress on infrastructure tasks.
- **AI Developers:** Providing HITL feedback during complex coding tasks.
- **Product Managers:** Auditing agent reasoning without technical overhead.

## 3. Goals
- **Real-time Monitoring:** Visualizing agent status without direct terminal access.
- **Remote Orchestration:** Starting and stopping tasks from mobile or desktop clients.
- **HITL Integration:** Standardizing how agents request human confirmation or secrets.
- **Platform Agnostic Architecture:** Supporting the "Big Three" (Discord, Slack, Teams) via a common interface.

## 4. Key Metrics for Success
- **Latency:** Minimizing the delay between user response and agent resumption.
- **Reliability:** No orphaned `tmux` sessions upon bridge crashes.
- **Usability:** Single-command project setup from the chat interface.
- **Portability:** Ability to switch from Discord to Slack with only configuration changes.
