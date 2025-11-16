const { getCharacterOwnedByUser, getMessagesForSession, addMessage } = require('../../db');
const { maybeAutoTitleSession } = require('../helpers/sessionTitle');
const { requestChatStream } = require('./ollamaService');
const { OLLAMA_MODEL, SYSTEM_PROMPT } = require('../config');

const buildConversationHistory = ({ sessionId, session, userId }) => {
  let characterPrompt = null;
  if (session.characterId) {
    const character = getCharacterOwnedByUser(session.characterId, userId);
    characterPrompt = character?.prompt || null;
  }

  const history = getMessagesForSession(sessionId).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  return { characterPrompt, history };
};

const createAbortHandlers = ({ req, res, abortController }) => {
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

  const cleanup = () => {
    req.removeListener('aborted', handleClientAbort);
    res.removeListener('close', handleResponseClose);
  };

  const wasClientClosedEarly = () => clientClosedEarly;

  return { wasClientClosedEarly, cleanup };
};

const streamChatResponse = async ({ req, res, user, session, content }) => {
  const sessionId = session.id;
  const userId = user.id;
  const trimmedContent = content.trim();
  const { characterPrompt, history } = buildConversationHistory({ sessionId, session, userId });

  const outgoingMessages = [];
  if (typeof SYSTEM_PROMPT === 'string' && SYSTEM_PROMPT.length > 0) {
    outgoingMessages.push({ role: 'system', content: SYSTEM_PROMPT });
  }
  if (characterPrompt) {
    outgoingMessages.push({ role: 'system', content: characterPrompt });
  }
  outgoingMessages.push(...history, { role: 'user', content: trimmedContent });

  addMessage(sessionId, 'user', trimmedContent);
  maybeAutoTitleSession(session, userId, trimmedContent);

  const targetModel = user.preferredModel || OLLAMA_MODEL;

  const abortController = new AbortController();
  const { cleanup, wasClientClosedEarly } = createAbortHandlers({ req, res, abortController });

  try {
    const response = await requestChatStream({
      messages: outgoingMessages,
      model: targetModel,
      signal: abortController.signal,
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
          console.warn('Skipping non-JSON chunk from Ollama:', line, error);
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
    if (abortController.signal.aborted && wasClientClosedEarly()) {
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
    cleanup();
  }
};

module.exports = {
  streamChatResponse,
};
