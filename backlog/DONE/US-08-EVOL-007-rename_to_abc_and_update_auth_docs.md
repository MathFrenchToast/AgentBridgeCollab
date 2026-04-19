---
id: US-08-EVOL-007
title: Rename to ABC and Update Auth Documentation
status: DONE
---

# User Story: Rename GCB to ABC and Update Auth Documentation

As a Project Maintainer,
I want to rename the project to "Agent Bridge Collaboration (ABC)" and update the authentication documentation
so that the project's identity is correctly reflected and the authentication instructions are accurate.

## Acceptance Criteria

1.  **Rename occurrences**:
    - Change "Gemini Collaboration Bridge" to "Agent Bridge Collaboration" in all documentation (`.md` files in `specs/`, `docs/`, and `README.md`).
    - Change "GCB" to "ABC" in the same documentation files.
2.  **Update Authentication Documentation**:
    - Review documentation mentioning `AGENT_API_KEY` or Google AI Studio API key.
    - Update it to explain that authentication can be interactive (by the user) or based on the tool used (MCP), rather than just a static API key.
3.  **Consistency**:
    - Ensure the documentation is consistent with the new naming.
    - (Optional/Later) Evaluate if environment variables like `ABC_PROVIDER` should also be changed to `ABC_PROVIDER`. *Self-correction: The user specifically mentioned "the doc", so I will focus on documentation first, but I should probably update `.env.example` too.*

## Implementation Plan

1.  **Search & Replace in Documentation**:
    - `specs/01-PRD.md`
    - `specs/02-UX-DESIGN.md`
    - `specs/03-ARCHITECTURE.md`
    - `specs/productContext.md`
    - `README.md`
    - `docs/onboarding/*.md`
2.  **Auth Docs Update**:
    - Identify sections in `README.md` or `docs/` that discuss `AGENT_API_KEY`.
    - Update to describe flexible authentication.
3.  **Verification**:
    - Run a script or grep to ensure no "GCB" or "Gemini Collaboration Bridge" remains in the documentation.
    - Review the updated auth sections for clarity.
