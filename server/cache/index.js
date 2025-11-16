const { CACHE_PROVIDER } = require('../config');
const { createMemoryCache } = require('./providers/memoryCache');

const providers = {
  memory: createMemoryCache(),
};

const resolveProvider = () => {
  const key = (CACHE_PROVIDER || 'memory').toLowerCase();
  if (providers[key]) {
    return providers[key];
  }
  console.warn(`Unknown cache provider "${CACHE_PROVIDER}", falling back to in-memory cache.`);
  return providers.memory;
};

const provider = resolveProvider();

const get = (key) => provider.get(key);
const set = (key, value, ttlMs) => provider.set(key, value, ttlMs);
const del = (key) => provider.delete(key);
const wrap = (key, ttlMs, factory) => provider.wrap(key, ttlMs, factory);

module.exports = {
  get,
  set,
  delete: del,
  wrap,
};
