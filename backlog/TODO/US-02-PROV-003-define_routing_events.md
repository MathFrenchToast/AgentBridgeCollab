---
id: US-02-PROV-003
title: Define Core Routing Events and Payloads
status: READY
type: feature
---
# Description
As a Developer, I want to define standard event names and data payloads for the bridge so that agent logs and status updates can be routed to any collaboration platform in a unified format.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/types/index.ts`

# Acceptance Criteria (DoD)
- [ ] **Scenario 1: Event Type Safety**
    - Given the `src/types/index.ts` file
    - When I define event enums or constants for `LOG_EMITTED`, `STATUS_CHANGED`, and `INPUT_REQUESTED`
    - Then each event must have a strictly typed payload associated with it.
- [ ] **Scenario 2: Payload Structure**
    - Given a `LOG_EMITTED` event
    - When the payload is generated
    - Then it must contain the `projectId`, `stream` (stdout/stderr), and the `content` string.

# UI element
None.

# Technical Notes (Architect)
- **Event Definition**: Use a `const enum` or a union of string literals to define `GcbEventName`.
- **Payload Interfaces**: 
    - `LogPayload`: `{ projectId: string, stream: 'stdout' | 'stderr', content: string }`.
    - `StatusPayload`: `{ projectId: string, status: 'starting' | 'running' | 'waiting' | 'stopped' | 'error', message?: string }`.
    - `InputRequestPayload`: `{ projectId: string, prompt: string, channelId: string }`.
- **Typing Strategy**: Consider a Discriminated Union for events to facilitate safe handling in the `Orchestrator` and `Bridge`.

# Reviewer Feedback (Reviewer)
<!-- If status is REWORK, details on what failed (AT or Code Quality) -->
