# Cache System Overview

## Goals & Provider Abstraction

- Introduce a centralized cache layer for data that changes infrequently (published character prompts, future user lookups) so the backend no longer re-queries SQLite for every chat message.
- Wrap cache access in `server/cache/index.js`, exposing a minimal async API (`get`, `set`, `delete`, `wrap`). The provider is selected via the `CACHE_PROVIDER` env var (defaults to `memory`), so swapping to Redis later just means registering another provider implementation.

## Message Flow With Cache

```
POST /api/chat
└── chatService.buildConversationHistory()
    └── session.characterId? yes → characterService.getCharacterForUser()
        ├── cache.get('character:published:<id>') hit → return prompt (no DB)
        ├── cache miss → check getCharacterOwnedByUser(characterId, userId)
        │     └── owned draft → format + return (skip cache)
        └── not owned → cache.wrap('character:published:<id>', loader)
              └── loader fetches from SQLite → format payload → cache.set → return
```

- Every chat message now checks the cache first; only cache misses hit SQLite. Owned/draft characters still bypass caching so creators see edits immediately.
- When a character is published, updated, unpublished, or removed, the cache entry is refreshed or invalidated, so the next chat request reads up-to-date prompts.

## Key Decisions

1. **Facade-first API** – Services interact solely through `cache.get/set/delete/wrap`, keeping business logic unaware of the underlying provider.
2. **Cache-first lookup** – `getCharacterForUser` now checks `cache.get` before touching SQLite, so published sessions rarely hit the DB.
3. **Memory provider by default** – Local development and initial deployments require zero infra; the in-memory Map handles TTLs and async loaders. Production can flip to Redis via config.
4. **Key helpers** – `server/cache/keys.js` standardizes cache key formats (`character:published:<id>`), making invalidation less error-prone.
5. **Selective caching** – Only published character prompts are cached; drafts still read from SQLite to ensure creators see edits immediately.
6. **Aggressive invalidation** – Publishing/unpublishing/removing/updating characters explicitly updates the cache so downstream services never serve stale prompts.

## Current Usage: Published Characters

- `server/services/characterService.js` caches published character payloads for 5 minutes (`PUBLISHED_CHARACTER_CACHE_TTL_MS`).
- `getCharacterForUser` order of operations:
  1. `cache.get` for published entries.
  2. Fallback to `getCharacterOwnedByUser` for drafts.
  3. Fallback to `cache.wrap` + SQLite loader for published miss.
- Invalidation occurs in `updateForUser`, `publishForUser`, `unpublishForUser`, and `removeForUser`.

## Next Steps

1. **Redis provider** – Implement a Redis-backed provider that satisfies the same API, then flip `CACHE_PROVIDER=redis` in production.
2. **Per-entity metrics** – Add logging/metrics (hit/miss counters) around the cache facade to quantify savings and detect invalidation bugs.
3. **Additional cache targets** – Reuse the abstraction for other slow-but-static data (user lookups in `requireUser*`, published character lists, model availability).
4. **Cache warming** – Preload popular published characters on startup or when a publish event occurs to avoid cold misses after deploys.
5. **Distributed invalidation hooks** – Once Redis is in place, consider pub/sub or key tagging so invalidations propagate across multiple API instances.

This design keeps the local loop fast, isolates cache logic from business code, and sets us up to bolt on a centralized cache without refactoring services.
