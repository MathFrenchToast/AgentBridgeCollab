---
id: US-07-PERS-001
title: Setup SQLite StateStore
status: DONE
type: feature
---
# Description
As a System, I want to initialize a persistent SQLite database so that I can store project metadata and mappings that survive application restarts.

# Context Map
- `src/core/state-store.ts` (New): Main implementation for database lifecycle and queries.
- `src/core/config-validator.ts`: Needs update to include `DATABASE_PATH` validation.
- `specs/03-ARCHITECTURE.md#persistence-layer`: Technical reference.

# Acceptance Criteria (DoD)

- [x] **Scenario 1: Database Initialization**
    - Given the application starts
    - When the `StateStore` is initialized
    - Then it should create a `gcb.sqlite` file (if not exists) and initialize the tables: `projects`, `spaces`, and `audit_log` as defined in the Architecture spec.
- [x] **Scenario 2: Singleton Access**
    - Given the application is running
    - When multiple modules require the `StateStore`
    - Then they should receive the same database connection instance (Singleton).
- [x] **Scenario 3: Schema Integrity**
    - Given an existing database file with an old schema
    - When the application starts
    - Then it should either migrate or safely handle schema validation (basic check for required tables).

# Technical Notes (Architect)
- **Dependencies**: Install `better-sqlite3` and `@types/better-sqlite3`.
- **Configuration**: Add `DATABASE_PATH` to `.env` and `ConfigValidator` (Zod). Default to `./gcb.sqlite`.
- **Singleton Pattern**: Implement `StateStore` as a Singleton to prevent multiple connection handles to the same file.
- **Schema Implementation**:
  - `projects`: `id` (TEXT PRIMARY KEY), `name` (TEXT), `status` (TEXT), `created_at` (DATETIME), `owner_id` (TEXT)
  - `spaces`: `project_id` (TEXT), `provider_type` (TEXT), `space_id` (TEXT), FOREIGN KEY(`project_id`) REFERENCES `projects`(`id`)
  - `audit_log`: `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `timestamp` (DATETIME DEFAULT CURRENT_TIMESTAMP), `user_id` (TEXT), `action` (TEXT), `project_id` (TEXT)
- **UI Impact**: None. This is a core infrastructure task.
- **Testing**: Use an in-memory database (`:memory:`) for unit tests to ensure speed and isolation.
