## High Priority

  - Split server.js into routers/services and move helpers (formatSessionPayload, Ollama fetch utilities) into their own modules to keep the
    backend maintainable as it grows (server.js:1-667).
  - Add middleware- or validator-based user/session loading so every route doesn’t hand-roll getUserById, getSessionOwnedByUser, and payload
    validation (server.js:209-443, server.js:472-509).
  - Extract the Ollama streaming code into its own service/client so the /api/chat route isn’t juggling DB writes, prompt assembly, request
    plumbing, and NDJSON parsing all at once (server.js:472-646).

## Medium Priority

  - Confine character seeding to the data layer (e.g., only during user creation) instead of calling ensureSeedCharacters inside read endpoints
    to avoid unexpected writes and simplify request handlers (server.js:241-247, server.js:363-377, db.js:187-212).
  - Introduce a service layer over db.js so routes receive already-shaped DTOs, making it easier to swap persistence strategies or add
    pagination without touching every controller (db.js:94-312, server.js:363-429).
  - Standardize how userId is supplied (ideally via auth/middleware) rather than accepting it from both body and query parameters, which
    complicates validation and caching (server.js:297-312, server.js:432-443).