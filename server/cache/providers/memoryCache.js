const createMemoryCache = () => {
  const store = new Map();

  const get = (key) => {
    if (!store.has(key)) {
      return null;
    }
    const entry = store.get(key);
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  };

  const set = (key, value, ttlMs = 0) => {
    const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : null;
    store.set(key, { value, expiresAt });
  };

  const del = (key) => {
    store.delete(key);
  };

  const wrap = (key, ttlMs, factory) => {
    const cached = get(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
    const value = factory();
    if (value && typeof value.then === 'function') {
      return value.then((resolved) => {
        if (resolved !== undefined && resolved !== null) {
          set(key, resolved, ttlMs);
        }
        return resolved;
      });
    }
    if (value !== undefined && value !== null) {
      set(key, value, ttlMs);
    }
    return value;
  };

  const clear = () => store.clear();

  return {
    get,
    set,
    delete: del,
    wrap,
    clear,
  };
};

module.exports = {
  createMemoryCache,
};
