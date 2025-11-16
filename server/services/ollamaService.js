const http = require('http');
const https = require('https');
const { OLLAMA_CHAT_URL, OLLAMA_MODEL } = require('../config');
const logger = require('../logger');

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

let parsedOllamaUrl;
let isOllamaHttps = false;
try {
  parsedOllamaUrl = new URL(OLLAMA_CHAT_URL);
  isOllamaHttps = parsedOllamaUrl.protocol === 'https:';
} catch (error) {
  logger.warn('ollama.invalidUrl', { error: error?.message });
}

const DEFAULT_OLLAMA_BASE = 'http://localhost:11434';
const ollamaBaseOrigin = parsedOllamaUrl
  ? `${parsedOllamaUrl.protocol}//${parsedOllamaUrl.host}`
  : DEFAULT_OLLAMA_BASE;
const OLLAMA_TAGS_URL = `${ollamaBaseOrigin}/api/tags`;
const MODEL_CACHE_TTL = 15_000;
let cachedModels = { timestamp: 0, list: null };

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
    logger.warn('ollama.fetchModels.error', { error: error?.message });
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

const requestChatStream = async ({ messages, model, signal }) => {
  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: {
        temperature: 0.7,
        top_p: 0.9,
      },
    }),
    signal,
    ...getUpstreamTransportOptions(),
  };

  return fetchFn(OLLAMA_CHAT_URL, fetchOptions);
};

module.exports = {
  fetchAvailableModels,
  resolveUserModel,
  requestChatStream,
};
