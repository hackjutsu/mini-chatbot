# Character Marketplace / Shared Personas

## Problem to Solve
- Fragmented personas lived inside each user account, so edits required copy/paste and other users never received updates.
- Users could create and edit characters inside the picker, which mixed “start chat” flow with persona authoring and led to conflicting UX expectations.
- No single source of truth for ownership and publish state; everyone could effectively clone “Chef Lumi” and modify it independently.
- Marketplace/library distinction was unclear, so default assistant, drafts, and published personas blended together.

## Features Implemented
- **Centralized characters** persisted once with `owner_user_id`, `status`, `short_description`, `avatar_url`, etc.; sessions reference the shared `character_id`.
- **Character picker as unified launcher** showing default assistant, marketplace personas, and the user’s own drafts/published characters in one grid (no editing, no pin/unpin).
- **Dedicated character manager** modal listing only owned personas with edit, publish/unpublish, and delete actions plus right-aligned “Create character” CTA.
- **Owner metadata surfaced** on cards (“By username”) and every edit flow enforces ownership, while marketplace cards remain read-only.
- **Consistent visual system**: both picker and manager reuse the same card component, state badges, hover lift, and marketplace highlighting.

## Technical Architecture Diagram
```
┌─────────────┐        HTTPS        ┌────────────────────────┐
│   Browser   │  fetch/list/manage  │  Express/Node backend  │
│(Picker/UI)  │ ───────────────────▶│  /characters APIs      │
└─────┬───────┘                     └──────────┬─────────────┘
      │                                      CRUD / publish
      │                                      │
      ▼                                      ▼
┌─────────────┐       owns/edits      ┌──────────────────────┐
│Character    │◀──────────────────────│characters table      │
│Manager      │                       │id, owner_user_id,    │
│(owned only) │                       │status, prompt, meta… │
└─────┬───────┘                       └──────────┬───────────┘
      │                                         references
      │ selects                                 │
      ▼                                         ▼
┌─────────────┐                         ┌────────────────────┐
│Character    │  provides character id  │sessions.character_id│
│Picker modal │────────────────────────▶│and chat execution   │
└─────────────┘                         └────────────────────┘
```

## Key Decisions
- Characters live in their own table and are referenced by ID; we never duplicate or snapshot prompts when users start chats.
- Publishing is an explicit owner-only action; marketplace entries are just published rows, and the default assistant appears as the first marketplace card.
- Picker is purely for selection—no creation, editing, or pinning—while the manager is the single place to author personas.
- Default assistant, marketplace characters, and personal drafts are visually differentiated but rendered via the same card layout to keep consistency.
- Pin/unpin is intentionally removed in this iteration to reduce complexity; users can start chats directly from any published persona or their own drafts.

## TODO
1. **Database & models**
   - Add shared `characters` table fields: `owner_user_id`, `status (draft/published)`, `short_description`, `last_published_at`, `version` (no `tags` or `snapshot`).
   - Introduce `user_characters` (or similar) join table for pins/favorites.
   - Update `sessions.character_id` FK to point to shared characters.
   - Migrate existing per-user copies into the new structure.
2. **Backend services & routes**
   - Update character CRUD endpoints to enforce ownership, publishing rules, and status filtering (drafts only to owner, published to all).
   - Add endpoints for publishing/unpublishing and for pinning/unpinning characters.
   - Ensure chat flow fetches the shared character and handles missing/unpublished states gracefully.
3. **Frontend experience**
   - Build the character management dashboard (list, create/edit form, publish/unpublish actions, status indicators).
   - Revamp the character picker to be selection-only, showing pinned characters, indicating drafts, and linking to the dashboard for creation/edits.
   - Add a discovery/browse view for published personas with pinning controls.
4. **Permissions & UX details**
   - Surface warnings when owners edit published characters (“This affects all users using this persona”).
   - Hide drafts from non-owners; show status badges and ownership metadata.
   - Define default avatars/metadata for newly published characters.
5. **QA & rollout**
   - Write migration scripts/tests for the new schema.
   - Add integration tests covering ownership, pinning, publish/unpublish flows, and chat behavior when characters change.
   - Update docs (README/discussions) to explain the marketplace model and dashboard usage.
