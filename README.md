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

## Request Flow

- The browser stores the conversation history locally and sends the entire `messages` array to `/api/chat` on each submit.
- The Express backend forwards that payload to the Ollama API with `stream: false` to collect a single response chunk.
- The UI renders both user and assistant turns in a simple two-column-style layout.

Feel free to extend this (e.g., persistence, streaming updates, authentication) as needed.
