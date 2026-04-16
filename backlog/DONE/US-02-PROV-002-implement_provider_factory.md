---
id: US-02-PROV-002
title: Implement Provider Factory and Environment Switching
status: DONE
type: feature
---
# Description
As a DevOps engineer, I want the system to automatically select the correct collaboration provider based on my environment variables so that I can switch between Discord, Slack, or Teams without code changes.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/providers/provider-factory.ts`
> *   `src/core/config-validator.ts`
> *   `src/providers/collaboration-provider.ts` (Interface reference)
> *   `src/providers/discord-provider.ts` (Placeholder/Partial implementation)

# Acceptance Criteria (DoD)
- **x** **Scenario 1: Valid Provider Selection**
    - Given the environment variable `GCB_PROVIDER=discord`
    - When I request a provider from the factory
    - Then it returns an instance of a provider implementing `ICollaborationProvider`.
- **x** **Scenario 2: Unsupported Provider**
    - Given an unsupported `GCB_PROVIDER` value or a missing value
    - When the factory is initialized
    - Then it throws a clear descriptive error during configuration validation or factory creation.

# UI element
None.

# Technical Notes (Architect)
- **Factory Implementation**: Create `src/providers/provider-factory.ts` that exports a `createProvider(config: AppConfig): ICollaborationProvider` function.
- **Provider Switching**: Use a switch statement or object mapping based on `config.GCB_PROVIDER`. 
- **Type Safety**: Leverage the `AppConfig` type which is already a discriminated union to ensure the correct sub-config (e.g. `DiscordSchema` properties) is available when instantiating the specific provider.
- **Dependency Injection**: The factory must receive the validated `AppConfig` as an argument.
- **Discord Provider Placeholder**: Since Epic 3 is for full Discord implementation, this story should create a minimal `DiscordProvider` class in `src/providers/discord-provider.ts` that implements `ICollaborationProvider` to satisfy the factory requirement.

# Reviewer Feedback (Reviewer)
<!-- If status is REWORK, details on what failed (AT or Code Quality) -->
