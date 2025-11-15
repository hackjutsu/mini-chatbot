const JSON_HEADERS = { 'Content-Type': 'application/json' };

const normalizeOptions = (options = {}) => {
  const config = { ...options };
  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
    config.headers = { ...JSON_HEADERS, ...(config.headers || {}) };
  }
  return config;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  return text ? { message: text } : null;
};

export const request = async (path, options = {}) => {
  const response = await fetch(path, normalizeOptions(options));
  const data = await parseResponse(response);
  return { ok: response.ok, status: response.status, data };
};

export const requireJson = async (path, options = {}) => {
  const result = await request(path, options);
  if (!result.ok) {
    const detail = result.data?.error || result.data?.message || `Request failed (${result.status})`;
    throw new Error(detail);
  }
  return result.data;
};

export const lookupUser = (username) => request(`/api/users/${encodeURIComponent(username)}`);

export const createUser = (username) =>
  requireJson('/api/users', {
    method: 'POST',
    body: { username },
  });

export const fetchCharacters = (userId) =>
  requireJson(`/api/characters?${new URLSearchParams({ userId }).toString()}`);

const DEFAULT_AVATARS = [
  '/avatars/default.svg',
  '/avatars/nova.svg',
  '/avatars/lumi.svg',
  '/avatars/willow.svg',
  '/avatars/guide.svg',
  '/avatars/artisan.svg',
  '/avatars/nebula.svg',
];

const withAvatarFallback = (payload = {}) => {
  if (payload.avatarUrl && payload.avatarUrl.trim()) {
    return payload;
  }
  const random = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
  return { ...payload, avatarUrl: random };
};

export const createCharacter = (userId, payload) =>
  requireJson('/api/characters', {
    method: 'POST',
    body: { userId, ...withAvatarFallback(payload) },
  });

export const updateCharacter = (userId, characterId, payload) =>
  requireJson(`/api/characters/${characterId}`, {
    method: 'PATCH',
    body: { userId, ...payload },
  });

export const deleteCharacter = (userId, characterId) =>
  requireJson(`/api/characters/${characterId}`, {
    method: 'DELETE',
    body: { userId },
  });

export const fetchModels = (userId) =>
  requireJson(`/api/models?${new URLSearchParams({ userId }).toString()}`);

export const updateUserModel = (userId, model) =>
  requireJson(`/api/users/${userId}/model`, {
    method: 'PATCH',
    body: { model },
  });

export const fetchSessions = (userId) =>
  requireJson(`/api/sessions?${new URLSearchParams({ userId }).toString()}`);

export const createSession = (userId, payload = {}) =>
  requireJson('/api/sessions', {
    method: 'POST',
    body: { userId, ...payload },
  });

export const renameSession = (userId, sessionId, title) =>
  requireJson(`/api/sessions/${sessionId}`, {
    method: 'PATCH',
    body: { userId, title },
  });

export const deleteSession = (userId, sessionId) =>
  requireJson(`/api/sessions/${sessionId}?${new URLSearchParams({ userId }).toString()}`, {
    method: 'DELETE',
  });

export const fetchMessages = (userId, sessionId) =>
  requireJson(`/api/sessions/${sessionId}/messages?${new URLSearchParams({ userId }).toString()}`);

const decodeChunk = (line) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
};

export const streamChat = async ({ userId, sessionId, content, onDelta }) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ userId, sessionId, content }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const payload = await response.json();
      detail = payload?.error || '';
    } catch {
      try {
        detail = await response.text();
      } catch {
        detail = '';
      }
    }
    throw new Error(detail || 'Unable to contact the model.');
  }

  if (!response.body || typeof response.body.getReader !== 'function') {
    throw new Error('Streaming is not supported in this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulated = '';

  const flushBuffer = () => {
    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const rawLine = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (rawLine) {
        const payload = decodeChunk(rawLine);
        if (payload?.type === 'delta' && typeof payload.content === 'string') {
          accumulated += payload.content;
          onDelta?.(payload.content, accumulated);
        } else if (payload?.type === 'error') {
          throw new Error(payload.message || 'Model failed to respond.');
        }
      }
      newlineIndex = buffer.indexOf('\n');
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      flushBuffer();
    }
    buffer += decoder.decode();
    flushBuffer();
  } finally {
    reader.releaseLock?.();
  }

  return accumulated;
};
