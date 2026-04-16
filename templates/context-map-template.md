# Context Map
> **Note:** This file maps Business Features to Source Code. The Architect updates this when files are added/moved. Use this to find where code lives without searching.

## Feature Map

| Feature / Module | Key Files / Directories | Entry Point |
| :--- | :--- | :--- |
| **Auth** | `src/auth/`, `tests/auth/` | `src/auth/service.ts` |
| **User Profile** | `src/user/` | `src/user/controller.ts` |
| **Shared UI** | `src/components/` | `src/components/index.ts` |

## Dependency Graph (Optional)
*   `src/feature-a` depends on `src/shared-utils`
