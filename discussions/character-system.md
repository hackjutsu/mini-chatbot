# Character Persona System

## Goals
- Let each user define reusable characters (name, avatar, persona prompt) and reuse them across conversations.
- Require the user to pick a character (or "no character") when starting a session so the assistant can role-play in that persona.
- Persist the persona background server-side and inject it into `/api/chat` automatically, avoiding any trust in browser-provided prompts.
- Seed three starter characters with avatars so new users can try the feature immediately.

## Data Model
```
users
├─ id, username, preferred_model, …
├─ characters (1:N)
│   ├─ id, name, prompt, avatar_url
│   └─ ON DELETE CASCADE per user
└─ sessions (1:N)
    ├─ id, title, character_id (nullable)
    └─ ON DELETE SET NULL when a character is removed
```

- `characters` is keyed per user and stores all persona metadata (name, background text, avatar URL).
- `sessions.character_id` links a chat to the selected persona; if `NULL`, the default assistant style is used.
- Three default characters (Nova, Chef Lumi, Professor Willow) plus SVG avatars are inserted whenever a user is created or whenever we detect a user has zero characters.

## API Surface
- `GET /api/characters?userId=…` → list all characters for a user (auto-seeds defaults if empty).
- `POST /api/characters` / `PATCH /api/characters/:id` / `DELETE /api/characters/:id` → manage characters.
- `POST /api/sessions` now accepts an optional `characterId` and stores it on the new session.
- `/api/sessions` and `/api/sessions/:id/messages` include the attached `character` blob so the UI can display avatars and persona summaries.
- `/api/chat` loads the session’s character prompt (if any) and prepends it as a `system` message before forwarding the conversation to Ollama.

## Frontend Flow
- Characters live inside a dedicated modal (opened via the header “Characters” button or when starting a new chat). Cards show avatar, persona summary, and the full prompt so users immediately understand the role.
- When the modal is opened in “Start chat” mode, cards offer a single “Start chat” button (including a “No character” card). In “Manage” mode the same cards expose Edit/Delete buttons.
- Conversation list shows the character name next to message counts, and the active chat area renders a persona banner that stays pinned above the transcript.
- When the user deletes or edits a character, all local sessions referencing that character update in-place; if the persona is removed, those sessions fall back to “no character”.

## Prompt Injection Strategy
1. Load messages for the session from SQLite as before.
2. If the session has a `character_id`, fetch the corresponding character prompt and insert `[{ role: 'system', content: prompt }]` ahead of the stored history before calling Ollama.
3. Stream responses back exactly as before; only the initial context changes.

This keeps persona data authoritative on the backend, avoids trusting the browser for prompts, and allows new UX features (avatars, summaries) via the existing REST responses.
