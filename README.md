# Mini Chatbot

A minimal web chat UI backed by a Node.js proxy that forwards conversation history to a locally running Ollama instance (e.g., `qwen2.5`).

![](./screenshot.png)


## Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Ollama](https://ollama.ai/) with `ollama serve` running locally
- Qwen model pulled locally, e.g. `ollama pull qwen2.5`

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Ensure the Ollama daemon is running and the desired model is available:

   ```bash
   ollama serve
   ```

3. Start the web server:

   ```bash
   npm start
   ```

4. Visit [http://localhost:3000](http://localhost:3000) and begin chatting.

## Environment Variables

| Name | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Port for the Express server. |
| `OLLAMA_CHAT_URL` | `http://localhost:11434/api/chat` | Endpoint for the local Ollama chat API. |
| `OLLAMA_MODEL` | `qwen2.5` | Model identifier passed to Ollama. |

## Features & Request Flow

- Conversations are stored locally per browser session. You can maintain multiple chat sessions via the sidebar, rename them, or delete them using the context menu.
- The UI sends the selected session’s `messages` array to `/api/chat` on each submit; the backend forwards that payload to the Ollama API with `stream: false` to gather a single reply.
- A `/api/config` helper returns the current `OLLAMA_MODEL`, which the front-end displays next to the status pill for easy reference.
- Markdown responses from the assistant are rendered with light HTML sanitization so lists, code blocks, etc., display cleanly.

Feel free to extend this further (e.g., persistence server-side, streaming updates, authentication).
