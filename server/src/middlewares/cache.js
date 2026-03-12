/**
 * Simple in-memory cache middleware with TTL.
 * Caches GET responses per-user to avoid hammering the database
 * when the SPA refetches on every page navigation.
 */

const caches = new Map(); // name → Map<key, { data, expiry }>

/**
 * Create a cache middleware for a specific cache group.
 *
 * @param {string} name - Cache group name (e.g. "conversations")
 * @param {number} ttlSeconds - Time-to-live in seconds (default: 5)
 */
function cacheMiddleware(name, ttlSeconds = 5) {
  if (!caches.has(name)) caches.set(name, new Map());

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") return next();

    const userId = req.user?.id || "anon";
    const orgId = req.organization?.id || "no-org";
    const cacheKey = `${userId}:${orgId}:${req.originalUrl}`;
    const store = caches.get(name);

    const cached = store.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return res.json(cached.data);
    }

    // Intercept res.json to capture and cache the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        store.set(cacheKey, {
          data: body,
          expiry: Date.now() + ttlSeconds * 1000,
        });
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate all entries in a cache group.
 *
 * @param {string} name - Cache group name to invalidate
 */
function invalidateCache(name) {
  const store = caches.get(name);
  if (store) store.clear();
}

/**
 * Invalidate cache entries for a specific user+org.
 */
function invalidateCacheForOrg(name, orgId) {
  const store = caches.get(name);
  if (!store) return;
  for (const [key] of store) {
    if (key.includes(`:${orgId}:`)) store.delete(key);
  }
}

// Periodic cleanup of expired entries (every 60 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [, store] of caches) {
    for (const [key, entry] of store) {
      if (entry.expiry <= now) store.delete(key);
    }
  }
}, 60000).unref();

module.exports = { cacheMiddleware, invalidateCache, invalidateCacheForOrg };
