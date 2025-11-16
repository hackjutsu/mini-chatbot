# Repository Guidelines

## Project Structure & Module Organization
- `server/` holds the Express app (routes, middleware, services, helpers); each layer keeps business logic out of `server.js`.
- `client/` is a Vite + React SPA; components live in `src/`, assets in `public/`, and UI tests in `src/components/__tests__/`.
- Shared data such as migrations/seed scripts live in `db/`, while runtime SQLite files land in `data/` (ignored by git). Persona prompts and UX notes live in `prompts/` and `discussions/`.
- Keep new server-side tests near the code under `__tests__/` folders to mirror the import path.

## Build, Test, and Development Commands
- `npm install && npm --prefix client install` ensures both backend and frontend dependencies are in sync.
- `npm run dev` rebuilds the client and starts the production-style Express server; use when validating the integrated stack.
- `npm start` alone serves the already-built client from `client/dist/`. For hot reload, run `npm --prefix client run dev` alongside `npm start`.
- `npm run lint` lints backend CommonJS; `npm run lint:client` targets the React code; `npm run lint:all` runs both.
- `npm test` runs the Jest suite (services, middleware, route handlers with Supertest); `npm run test:client` triggers Vitest via the client package.

## Coding Style & Naming Conventions
- JavaScript/JSX use 2-space indentation, semicolons, and ESLint configs defined in `eslint.config.js` (root and `client/`). Run the relevant lint command before committing.
- Backend modules stay CommonJS (`module.exports`), while frontend code is ES modules. Name files after their primary export (`chatService.js`, `Composer.jsx`).
- Use camelCase for functions/variables, PascalCase for React components, and uppercase snake case for constants (e.g., `OLLAMA_CHAT_URL`). Keep HTTP handlers pure and delegate to services.

## Testing Guidelines
- Backend: Jest with Supertest. Place specs next to their subjects (`server/services/__tests__/chatService.test.js`) and stub SQLite/Ollama via helpers. Prefer descriptive `describe` blocks like `describe('createSession')`.
- Frontend: Vitest with Testing Library in `client/src/components/__tests__/`. Render components with fake session data pulled from `prompts/` when relevant, and assert ARIA labels rather than implementation details.
- Aim to cover every new endpoint, reducer, or critical UI interaction. Use `npm --prefix client run test:watch` for iterative work and add regression tests for reported bugs.

## Commit & Pull Request Guidelines
- Follow the existing style—short, imperative subjects such as `Improve share modal layout` or `Move db.js into db/`. Include the scope if helpful (`Add sessionService tests`).
- Every PR should describe: motivation, key changes, manual verification steps (`npm run dev`, screenshot of UI states), and linked issues/discussions. Mention migrations or new env vars explicitly.
- Keep commits small and logically grouped: tests with their implementation, refactors isolated from feature work, and never commit the `data/*.sqlite` files or local `.env` secrets.

## Configuration & Ops Tips
- Required env vars (`PORT`, `OLLAMA_CHAT_URL`, `OLLAMA_MODEL`) can be exported locally or stored in a `.env` ignored file; document non-default values in the PR.
- `data/chat.sqlite` is recreated automatically—delete it when you need a clean slate, but never modify files inside `db/` without adding matching migration notes. Always verify Ollama is running (`ollama serve`) before reporting backend issues.

## Other guidelines
- Always summarize the request and explain your plan before making code changes.
- Always summarize your changes after showing the diff.