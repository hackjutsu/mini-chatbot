const { CACHE_PROVIDER } = require('../config');
const { createMemoryCache } = require('./providers/memoryCache');
const logger = require('../logger');

const providers = {
  memory: createMemoryCache(),
};

const resolveProvider = () => {
  const key = (CACHE_PROVIDER || 'memory').toLowerCase();
  if (providers[key]) {
    return providers[key];
  }
  logger.warn('cache.provider.unknown', { provider: CACHE_PROVIDER });
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
