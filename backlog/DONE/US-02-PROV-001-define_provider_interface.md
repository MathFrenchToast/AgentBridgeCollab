---
id: US-02-PROV-001
title: Define Collaboration Provider Interface and Shared Types
status: DONE
type: feature
---
# Description
As a Developer, I want to have a clear code definition for the `ICollaborationProvider` interface and the `GcbCommand` type so that I can implement platform-specific providers consistently.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/providers/collaboration-provider.ts`
> *   `src/types/index.ts`

# Acceptance Criteria (DoD)
- **x** **Scenario 1: Interface Definition**
    - Given the `src/providers/collaboration-provider.ts` file
    - When I define the `ICollaborationProvider` interface
    - Then it must contain `connect()`, `createSpace()`, `sendMessage()`, `waitForInput()`, and `onCommand()` methods as specified in @specs/03-ARCHITECTURE.md.
- **x** **Scenario 2: Shared Types Definition**
    - Given the `src/types/index.ts` file
    - When I define the `GcbCommand` and `GcbCommandType`
    - Then they must match the schema: `{ type: 'start'|'stop'|'status'|'list', projectId?: string, args?: string[], userId: string, channelId: string }`.

# UI element
None.

# Technical Notes (Architect)
- **Interface Location**: Define `ICollaborationProvider` in `src/providers/collaboration-provider.ts`.
- **Type Definitions**: `GcbCommand` and `GcbCommandType` MUST be defined in `src/types/index.ts`.
- **Exporting**: All interfaces and types must be explicitly exported.
- **Strict Typing**: `GcbCommandType` should be a union of string literals: `'start' | 'stop' | 'status' | 'list'`.
- **Pattern Compliance**: Ensure the interface methods return `Promise<void>` or `Promise<string>` as appropriate to allow for asynchronous platform interactions (e.g., API calls to Discord).
- **Dependency**: No external dependencies should be introduced in these files yet (except for standard TypeScript types).

# Reviewer Feedback (Reviewer)
<!-- If status is REWORK, details on what failed (AT or Code Quality) -->
