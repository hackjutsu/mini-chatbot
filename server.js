const path = require('path');
const express = require('express');
const cors = require('cors');

const fetchFn = globalThis.fetch
  ? globalThis.fetch
  : (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_CHAT_URL = process.env.OLLAMA_CHAT_URL || 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const response = await fetchFn(OLLAMA_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama request failed: ${response.status} ${text}`);
    }

    const upstreamStream = response.body;

    if (!upstreamStream || typeof upstreamStream.getReader !== 'function') {
      throw new Error('Upstream response body is not readable');
    }

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.status(200);
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const reader = upstreamStream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const writeChunk = (payload) => {
      try {
        res.write(`${JSON.stringify(payload)}\n`);
      } catch (error) {
        console.error('Failed to write chunk to client:', error);
        throw error;
      }
    };

    const processBuffer = () => {
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) continue;

        let parsed;
        try {
          parsed = JSON.parse(line);
        } catch (error) {
          console.warn('Skipping non-JSON chunk from Ollama:', line);
          continue;
        }

        if (typeof parsed?.message?.content === 'string' && parsed.message.content.length > 0) {
          writeChunk({ type: 'delta', content: parsed.message.content });
        } else if (typeof parsed?.response === 'string' && parsed.response.length > 0) {
          // Some models use `response` instead of `message.content` for streaming tokens.
          writeChunk({ type: 'delta', content: parsed.response });
        }

        if (parsed?.error) {
          writeChunk({ type: 'error', message: parsed.error });
        }
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      processBuffer();
    }

    buffer += decoder.decode();
    processBuffer();

    writeChunk({ type: 'done' });
    res.end();
  } catch (error) {
    console.error('Error calling Ollama:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to contact Ollama' });
      return;
    }
    res.write(`${JSON.stringify({ type: 'error', message: 'Failed to contact Ollama' })}\n`);
    res.end();
  }
});

app.get('/api/config', (req, res) => {
  res.json({
    model: OLLAMA_MODEL,
  });
});

app.get(/^\/(?!api).*/, (req, res) => {
  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
