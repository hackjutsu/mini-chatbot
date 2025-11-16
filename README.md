<p align="center">
   <img src="./client/public/icon_rectangle.png" alt="Mini Chatbot logo" width="150" />
</p>

# Mini Chatbot 

A minimal web chat UI with a modern React frontend (Vite, componentized state) backed by a Node.js proxy that streams requests to a locally running Ollama instance (e.g., `qwen2.5`) while persisting users, sessions, and full conversation history in SQLite.

![](./discussions/character-system-ui.png)


## Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Ollama](https://ollama.ai/) with `ollama serve` running locally
- Qwen model pulled locally, e.g. `ollama pull qwen2.5`

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   npm --prefix client install
   ```

2. Build the React frontend so the Express server can serve it:

   ```bash
   npm --prefix client run build
   ```

3. Ensure the Ollama daemon is running and the desired model is available:

   ```bash
   ollama serve
   ```

4. Start the web server:

   ```bash
   npm start
   ```

5. Visit [http://localhost:3000](http://localhost:3000). On first load you’ll be prompted to choose a username (a handle is stored locally). From there you can create/manage sessions and start chatting.

> Quick shortcut: `npm run dev` runs the production build for the React client and boots the Express server in one command.

> The SQLite database lives at `data/chat.sqlite` (ignored by git). Delete this file if you want a clean slate. Each user is automatically seeded with three sample characters (complete with avatars under `client/public/avatars/`) the first time they sign in.

### Local development tips

- Use `npm --prefix client run dev` for a hot-reloading React dev server (it proxies API calls to `localhost:3000`). Run `npm start` separately so the backend is available.
- Running `npm --prefix client run build` again will refresh the production bundle that Express serves.
- `npm run dev` is handy when you want to rebuild the client and restart the server without typing two commands.

## Linting & Testing

### Backend

- **Lint**: `npm run lint` (or `npm run lint:all` to lint both backend and frontend).
- **Tests**: `npm test` runs the Jest suite (services, middleware, route handlers). Tests mock `db/index.js`/Ollama so no SQLite or network access is required.

### Frontend

- **Lint**: `npm run lint:client` (or `npm run lint:all` to lint backend + frontend together).
- **Tests**: `npm --prefix client run test` (aliased in the root as `npm run test:client`) runs Vitest with Testing Library and jsdom. A sample component test (`Composer.test.jsx`) ensures the wiring works; add more under `client/src/components/__tests__/`.

## Environment Variables

| Name | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Port for the Express server. |
| `OLLAMA_CHAT_URL` | `http://localhost:11434/api/chat` | Endpoint for the local Ollama chat API. |
| `OLLAMA_MODEL` | `qwen2.5` | Model identifier passed to Ollama. |

## Features & Flow

- **Persistent chat history** – Every message is stored centrally (SQLite + better-sqlite3) under a user/session, so conversations survive refreshes and can resume on any device that knows the user handle.
- **Multiple sessions per user** – Users can spin up as many chats as they want, rename them, and delete them; each session history is loaded on demand via REST endpoints.
- **Character personas** – Each user can create reusable characters (name + background + avatar). Sessions can be associated with a specific persona (or none), and the persona prompt is injected automatically so the assistant replies in-character. Three starter characters are seeded for every new user.
- **Streaming proxy to Ollama** – `/api/chat` rebuilds the prompt from stored history, streams NDJSON deltas from Ollama to the browser, and aborts upstream work if the client disconnects.
- **Model picker** – The app queries Ollama for available models, remembers each user’s preferred model, and falls back gracefully if a model is removed; users can switch models from the header at any time.
- **Handle-based identities** – Instead of full auth, users choose a memorable username. The backend enforces session ownership via `{ userId, sessionId }`, and clients can log out to switch identities.

Feel free to extend this further (e.g., auth, RAG, summarization, rate limiting).
