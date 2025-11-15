# Frontend Modernization Plan

## Goals
- Replace the monolithic vanilla `public/index.html` implementation with a manageable React/Vite client.
- Preserve all existing features (user selection, sessions, character personas, model picker, streaming chat) while improving maintainability.
- Serve the compiled React bundle from Express so the backend/API layer remains unchanged for clients.

## Plan
1. **Audit Current UI/UX**
   - Map every feature in the legacy script (storage, REST calls, streaming flow, picker modals).
   - Document component boundaries and shared utilities (markdown rendering, sanitization, local storage keys).
2. **Bootstrap React Client**
   - Scaffold a `client/` workspace (Vite + React + markdown-it) with a root `<App>` that mirrors the legacy layout.
   - Copy shared assets (avatars, favicon) and recreate the core styling in modular CSS.
3. **Componentize Features**
   - Implement composable React pieces: session list, conversation view, composer, model/user menus, character picker & forms, username modal.
   - Create hooks/utilities for API access, streaming consumption, click-outside detection, markdown sanitization.
   - Reimplement data flows (user profile, sessions, characters, model selection) with `useState`/`useEffect`, keeping localStorage persistence.
4. **Wire Backend + Docs**
   - Update `server.js` to serve the built React app (with fallbacks if the build is missing).
   - Refresh README instructions (install client deps, run `npm --prefix client run build`, mention Vite dev server).
   - Remove the old `public/index.html` to avoid drift.

## Verification
- Run `npm install` and `npm --prefix client install`.
- Build the frontend (`npm --prefix client run build`) and start the Express server (`npm start`).
- Manually verify: username onboarding, session CRUD, character CRUD, model picker, streaming chat, logout/login flows.
