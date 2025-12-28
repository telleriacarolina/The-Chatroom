const rateLimit = require('express-rate-limit');
let RedisStore;
try {
  RedisStore = require('rate-limit-redis');
} catch (e) {
  RedisStore = null;
}
let redisClient;
try {
  redisClient = require('../config/redis');
} catch (e) {
  redisClient = null;
}

function createStore(prefix) {
  if (RedisStore && redisClient) {
    return new RedisStore({ client: redisClient, prefix });
  }
  return undefined; // fallback to memory store
}

const authLimiter = rateLimit({
  store: createStore('rl:auth:'),
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  store: createStore('rl:api:'),
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false
});

const heartbeatLimiter = rateLimit({
  store: createStore('rl:heartbeat:'),
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: 'Heartbeat rate exceeded.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  apiLimiter,
  heartbeatLimiter
};
