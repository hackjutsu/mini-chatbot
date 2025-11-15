## Backend Refactor Summary

### Problem

The original backend lived entirely inside `server.js`, tightly coupling HTTP routes, DB access, and third-party streaming logic. This made the codebase fragile (700+ line files), duplicated validation logic, mixed read/write semantics, and provided no unit-test seams. The `/api/chat` handler managed everything from DB persistence to NDJSON parsing in one place, and GET endpoints occasionally wrote to the database (`ensureSeedCharacters`), making caching and reasoning difficult. Finally, there was no linting/testing tooling to guard against regressions.

### Solution Overview

1. **Modular app structure**  
   - Exported a reusable Express app factory (`server/app.js`) and trimmed `server.js` to just boot the server.  
   - Split routes into domain modules under `server/routes`, with corresponding helper modules for formatting, validation, and session titling.  
   - Added middleware (`requireUser*`, `requireSessionForUser`) so controllers can rely on a normalized `req.user`/`req.session`.  
   - Confined character seeding to user creation (`db.js`), removing side-effectful GET handlers.

2. **Service layer and DTOs**  
   - Introduced `server/services/characterService.js`, `sessionService.js`, and `chatService.js` to encapsulate DB access, DTO formatting, and Ollama streaming logic.  
   - Routes now delegate to services, reducing duplication and making it easy to change persistence or add pagination.

3. **Streaming abstraction**  
   - Extracted the Ollama call into `chatService.streamChatResponse`, handling message history assembly, abort handling, NDJSON parsing, and DB writes in one place.

4. **Tooling & quality gates**  
   - Added ESLint configurations for backend and frontend (React) with scripts (`npm run lint`, `lint:client`, `lint:all`).  
   - Added Jest with `jest.config.js`, plus unit tests for services, middleware, and route handlers to catch regressions without hitting the network or SQLite.  
   - Chat service tests mock the Ollama client to cover streaming success/failure paths; middleware tests ensure proper status codes; route-handler tests verify controllers translate service errors to HTTP responses correctly.

### Architecture Diagram (text form)

```
┌──────────────┐            ┌──────────────┐        ┌────────────┐
│  Express App │  uses      │  Routers     │  call  │ Middleware │
└─────┬────────┘            └─────┬────────┘        └─┬──────────┘
      │                           │                   │
      │                    ┌──────▼──────┐            │ attaches req.user/session
      │                    │ Services    │<───────────┘
      │                    │ (chat,      │
      │                    │  sessions,  │
      │                    │  characters)│───┐
      │                    └──────┬──────┘   │ format DTOs / orchestrate logic
      │                           │          │
      │                           ▼          │
      │                    ┌──────────────┐  │
      └───────────────────▶│   db.js      │◄─┘
                           │ better-sqlite│
                           └──────────────┘
```

### Key Decisions

- **Middleware-first auth plumbing**: Instead of every route validating `userId`, we added reusable middleware. This keeps controllers thin and behaves like a lightweight auth layer for a toy app.
- **Service DTOs**: Formatting (`formatSessionPayload`, etc.) now happens inside services so controllers can just `res.json(serviceResponse)`. This sets us up to add pagination or swap persistence with minimal churn.
- **Stream abstraction**: Moving `/api/chat` logic into `chatService` enables isolated testing, easier retries, and guards against regressions when adjusting streaming behavior.
- **Testing strategy**: Rather than spinning up the HTTP listener (blocked in this environment), we test handlers directly by pulling the final function off the Express stack and mocking services/DB. This provides meaningful coverage without requiring network privilege.
- **Lint everywhere**: ESLint covers server and client, including tests via Jest globals. Combined with Jest suites, this establishes a baseline quality bar for future work.

### How the Backend Is Tested

- **Jest unit tests** target the core services (`server/services/__tests__`) to validate DTO shaping, streaming edge cases, and error handling with mocked `db.js` and Ollama clients.
- **Middleware tests** (`server/middleware/__tests__`) verify each validator returns the correct HTTP status code and sets `req.user`/`req.session` as expected.
- **Route-handler tests** (`server/routes/__tests__`) pull the final Express handler from the router stack, mock the underlying service module, and assert that HTTP responses mirror service outcomes (success vs. service errors). This covers controller logic without needing network permissions.
- **Tooling**: `npm test` runs all suites; `npm run lint:all` ensures code (including tests) conforms to ESLint rules. Together they provide fast feedback and guard against regressions before manual QA.
