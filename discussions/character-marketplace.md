# Character Marketplace / Shared Personas

## Summary
- **Centralized characters** – Store personas once with an `owner_user_id` so updates apply everywhere. Sessions and user “pins” reference shared `character_id`s, eliminating per-user copies.
- **Owner-only management** – Only a character’s creator can edit, delete, publish, or unpublish that persona. Non-owners can view/use published characters but cannot modify them.
- **Draft vs Published** – Characters start as drafts (visible only to the owner). Publishing exposes them to all users. Owners can unpublish to hide them again; draft entries should be clearly labeled.
- **Character marketplace** – Users browse published personas, pin favorites into their personal library, and select them in chats. Pinned entries update automatically when owners change the underlying persona.
- **Management dashboard** – A dedicated UI replaces the picker’s create/edit flow. Owners manage drafts/published personas here. The picker becomes read-only selection with CTA(s) directing users to the dashboard for creation.

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
