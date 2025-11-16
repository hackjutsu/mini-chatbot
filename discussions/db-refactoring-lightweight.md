# Lightweight DB Refactoring Notes

## Goals
- Keep the sqlite helper approachable while eliminating the monolithic `db.js` pain points.
- Isolate schema creation/migrations and default seeding so future changes don't require scrolling through hundreds of lines.
- Preserve the existing public API (the repo helpers) so services/routes/plugins don't need changes.

## Changes
1. **`db/index.js`** is now the single entry for database access. It
   - initializes the SQLite connection,
   - runs schema migrations via `runMigrations`, and
   - seeds default characters via `seedDefaultCharacters`.
2. **`db/migrations.js`** encapsulates table creation, column migrations, and index setup. It's easier to add or tweak migrations without touching repository logic.
3. **`db/seed.js`** holds the system user + default persona seeding logic. This keeps the canonical character definitions in one place and makes it clear when seed data runs.
4. Re-pointed imports/docs/tests to `db/index.js`, and ensured the DB file path stays consistent even after moving the module.

## Benefits
- **Readability**: `db/index.js` is nearly half the length of the old `db.js`, focused on prepared statements and exported helpers.
- **Maintenance**: schema or seed changes now happen in dedicated files. There's less risk of accidentally editing repository code while tweaking migrations.
- **Reuse**: the `migrations` and `seed` modules can be imported in isolation for tooling or tests, without bootstrapping the full repo.
- **Safety**: moving the module forced us to explicitly set the `data/` directory path, avoiding accidental creation of a new DB file when changing file locations.

## Next Steps (optional)
- Consider creating small domain-specific repository modules (users, characters, sessions) to further simplify `db/index.js`.
- Add unit tests for `migrations`/`seed` that run against an in-memory SQLite file to catch future schema regressions.
