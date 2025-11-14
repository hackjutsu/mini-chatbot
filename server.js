const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const {
  DEFAULT_SESSION_TITLE,
  createSession,
  createUser,
  getMessagesForSession,
  getSessionOwnedByUser,
  getSessionsForUser,
  getUserById,
  getUserByUsername,
  removeSession,
  updateSessionTitle,
  addMessage,
  setUserPreferredModel,
} = require('./db');

let UndiciAgent;
try {
  ({ Agent: UndiciAgent } = require('undici'));
} catch {
  UndiciAgent = null;
}

const httpKeepAliveAgent = new http.Agent({ keepAlive: true });
const httpsKeepAliveAgent = new https.Agent({ keepAlive: true });
const undiciDispatcher = UndiciAgent
  ? new UndiciAgent({
      connect: { timeout: 30_000 },
      keepAliveTimeout: 60_000,
      keepAliveMaxTimeout: 120_000,
    })
  : null;

const hasNativeFetch = typeof globalThis.fetch === 'function';
const fetchFn = hasNativeFetch
  ? globalThis.fetch
  : (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_CHAT_URL = process.env.OLLAMA_CHAT_URL || 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
let parsedOllamaUrl;
let isOllamaHttps = false;
try {
  parsedOllamaUrl = new URL(OLLAMA_CHAT_URL);
  isOllamaHttps = parsedOllamaUrl.protocol === 'https:';
} catch (error) {
  console.warn('Invalid OLLAMA_CHAT_URL provided, defaulting to HTTP keep-alive agent.', error);
}

const DEFAULT_OLLAMA_BASE = 'http://localhost:11434';
const ollamaBaseOrigin = parsedOllamaUrl
  ? `${parsedOllamaUrl.protocol}//${parsedOllamaUrl.host}`
  : DEFAULT_OLLAMA_BASE;
const OLLAMA_TAGS_URL = `${ollamaBaseOrigin}/api/tags`;
const MODEL_CACHE_TTL = 15_000;
let cachedModels = { timestamp: 0, list: null };

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

const isValidUsername = (username = '') => USERNAME_PATTERN.test(username.trim());

const formatSessionPayload = (session, overrides = {}) => {
  if (!session) return null;
  return {
    id: session.id,
    title: session.title || DEFAULT_SESSION_TITLE,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messageCount:
      typeof session.messageCount === 'number'
        ? session.messageCount
        : overrides.messageCount ?? 0,
  };
};

const formatUserPayload = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    preferredModel: user.preferredModel || OLLAMA_MODEL,
  };
};

const deriveTitleFromMessage = (content = '') => {
  const trimmed = content.replace(/\s+/g, ' ').trim();
  if (!trimmed) return null;
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
};

const maybeAutoTitleSession = (session, userId, content) => {
  if (!session) return;
  const isDefault = !session.title || session.title === DEFAULT_SESSION_TITLE;
  if (!isDefault) return;
  const candidate = deriveTitleFromMessage(content);
  if (!candidate) return;
  if (updateSessionTitle(session.id, userId, candidate)) {
    session.title = candidate;
  }
};

const getUpstreamTransportOptions = () => {
  if (hasNativeFetch) {
    return undiciDispatcher ? { dispatcher: undiciDispatcher } : {};
  }
  if (parsedOllamaUrl) {
    return { agent: isOllamaHttps ? httpsKeepAliveAgent : httpKeepAliveAgent };
  }
  return {};
};

const fetchAvailableModels = async () => {
  const now = Date.now();
  if (cachedModels.list && now - cachedModels.timestamp < MODEL_CACHE_TTL) {
    return cachedModels.list;
  }
  try {
    const response = await fetchFn(OLLAMA_TAGS_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      ...getUpstreamTransportOptions(),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to fetch models: ${response.status} ${body}`);
    }
    const payload = await response.json();
    const names = Array.isArray(payload?.models)
      ? payload.models
          .map((entry) => entry?.model || entry?.name)
          .filter((value) => typeof value === 'string' && value.trim().length > 0)
      : [];
    const uniqueNames = Array.from(new Set(names));
    const finalList = uniqueNames.length > 0 ? uniqueNames : [OLLAMA_MODEL];
    cachedModels = { list: finalList, timestamp: Date.now() };
    return finalList;
  } catch (error) {
    console.warn('Unable to load models from Ollama:', error);
    if (cachedModels.list) {
      return cachedModels.list;
    }
    return [OLLAMA_MODEL];
  }
};

const resolveUserModel = (user, availableModels = []) => {
  const normalizedList = Array.isArray(availableModels) ? availableModels : [];
  if (!normalizedList.length) {
    return user?.preferredModel || OLLAMA_MODEL;
  }
  if (user?.preferredModel && normalizedList.includes(user.preferredModel)) {
    return user.preferredModel;
  }
  if (normalizedList.includes(OLLAMA_MODEL)) {
    return OLLAMA_MODEL;
  }
  return normalizedList[0];
};

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/users', (req, res) => {
  const username = req.body?.username;
  if (typeof username !== 'string' || !isValidUsername(username)) {
    return res.status(400).json({ error: 'Username must be 3-32 characters (letters, numbers, _ or -).' });
  }

  const existing = getUserByUsername(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already exists.' });
  }

  try {
    const user = createUser(username.trim(), OLLAMA_MODEL);
    return res.status(201).json(formatUserPayload(user));
  } catch (error) {
    console.error('Failed to create user:', error);
    return res.status(500).json({ error: 'Unable to create user.' });
  }
});

app.get('/api/users/:username', (req, res) => {
  const username = req.params.username;
  if (!isValidUsername(username)) {
    return res.status(400).json({ error: 'Invalid username.' });
  }
  const user = getUserByUsername(username);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.json(formatUserPayload(user));
});

app.get('/api/models', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required.' });
  }
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  try {
    const models = await fetchAvailableModels();
    const selectedModel = resolveUserModel(user, models);
    if (selectedModel !== user.preferredModel) {
      setUserPreferredModel(userId, selectedModel);
      user.preferredModel = selectedModel;
    }
    return res.json({
      models,
      selectedModel,
    });
  } catch (error) {
    console.error('Failed to load models list:', error);
    return res.status(502).json({ error: 'Unable to load model list from Ollama.' });
  }
});

app.patch('/api/users/:userId/model', async (req, res) => {
  const { userId } = req.params;
  const { model } = req.body || {};
  if (!model || typeof model !== 'string') {
    return res.status(400).json({ error: 'model is required.' });
  }
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  try {
    const models = await fetchAvailableModels();
    if (!models.includes(model)) {
      return res.status(400).json({ error: 'Model is not available on the server.' });
    }
    setUserPreferredModel(userId, model);
    return res.json({ model });
  } catch (error) {
    console.error('Failed to update user model:', error);
    return res.status(502).json({ error: 'Unable to update model preference.' });
  }
});

app.get('/api/sessions', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required.' });
  }
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  const sessions = getSessionsForUser(userId).map((session) => ({
    ...formatSessionPayload(session),
  }));
  return res.json({ sessions });
});

app.post('/api/sessions', (req, res) => {
  const { userId, title } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  try {
    const session = createSession(userId, title);
    return res.status(201).json({ session: formatSessionPayload({ ...session }, { messageCount: 0 }) });
  } catch (error) {
    console.error('Failed to create session:', error);
    return res.status(500).json({ error: 'Unable to create session.' });
  }
});

app.patch('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const { userId, title } = req.body || {};
  if (!userId || typeof title !== 'string') {
    return res.status(400).json({ error: 'userId and title are required.' });
  }
  const updated = updateSessionTitle(sessionId, userId, title);
  if (!updated) {
    return res.status(404).json({ error: 'Session not found.' });
  }
  const session = getSessionOwnedByUser(sessionId, userId);
  return res.json({ session: formatSessionPayload(session) });
});

app.delete('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const userId = req.body?.userId || req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }
  const removed = removeSession(sessionId, userId);
  if (!removed) {
    return res.status(404).json({ error: 'Session not found.' });
  }
  return res.status(204).end();
});

app.get('/api/sessions/:sessionId/messages', (req, res) => {
  const { sessionId } = req.params;
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required.' });
  }
  const session = getSessionOwnedByUser(sessionId, userId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }
  const messages = getMessagesForSession(sessionId).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  }));
  return res.json({ session: formatSessionPayload(session, { messageCount: messages.length }), messages });
});

app.post('/api/chat', async (req, res) => {
  const { userId, sessionId, content } = req.body || {};

  if (!userId || !sessionId || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'userId, sessionId, and content are required' });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const session = getSessionOwnedByUser(sessionId, userId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found for user.' });
  }

  const existingMessages = getMessagesForSession(sessionId).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const userMessageContent = content.trim();
  const outgoingMessages = [...existingMessages, { role: 'user', content: userMessageContent }];

  addMessage(sessionId, 'user', userMessageContent);
  maybeAutoTitleSession(session, userId, userMessageContent);

  const targetModel = user.preferredModel || OLLAMA_MODEL;

  const abortController = new AbortController();
  let clientClosedEarly = false;
  const abortUpstream = () => {
    if (!abortController.signal.aborted) {
      abortController.abort();
    }
  };
  const handleClientAbort = () => {
    clientClosedEarly = true;
    abortUpstream();
  };
  const handleResponseClose = () => {
    if (res.writableEnded) {
      return;
    }
    clientClosedEarly = true;
    abortUpstream();
  };
  req.on('aborted', handleClientAbort);
  res.on('close', handleResponseClose);

  try {
    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: targetModel,
        messages: outgoingMessages,
        stream: true,
      }),
      signal: abortController.signal,
    };

    Object.assign(fetchOptions, getUpstreamTransportOptions());

    const response = await fetchFn(OLLAMA_CHAT_URL, fetchOptions);

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

    let assistantContent = '';

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

        let delta;
        if (typeof parsed?.message?.content === 'string' && parsed.message.content.length > 0) {
          delta = parsed.message.content;
        } else if (typeof parsed?.response === 'string' && parsed.response.length > 0) {
          delta = parsed.response;
        }

        if (delta) {
          assistantContent += delta;
          writeChunk({ type: 'delta', content: delta });
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
    if (assistantContent.trim()) {
      addMessage(sessionId, 'assistant', assistantContent);
    }
    res.end();
  } catch (error) {
    if (abortController.signal.aborted && clientClosedEarly) {
      console.warn('Client connection closed before response finished.');
    } else {
      console.error('Error calling Ollama:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to contact Ollama' });
        return;
      }
      res.write(`${JSON.stringify({ type: 'error', message: 'Failed to contact Ollama' })}\n`);
      res.end();
    }
  } finally {
    req.removeListener('aborted', handleClientAbort);
    res.removeListener('close', handleResponseClose);
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
