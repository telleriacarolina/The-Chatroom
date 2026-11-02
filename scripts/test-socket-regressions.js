#!/usr/bin/env node

const assert = require('assert');
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const SECRET = process.env.ACCESS_TOKEN_SECRET || '01234567890123456789012345678901';
process.env.ACCESS_TOKEN_SECRET = SECRET;

const users = new Map([
  ['user-ok', { id: 'user-ok', accountStatus: 'ACTIVE', isBanned: false, isMuted: false, muteExpiresAt: null, banExpiresAt: null }],
  ['user-muted', { id: 'user-muted', accountStatus: 'ACTIVE', isBanned: false, isMuted: true, muteExpiresAt: new Date(Date.now() + 60_000), banExpiresAt: null }],
  ['user-banned', { id: 'user-banned', accountStatus: 'ACTIVE', isBanned: true, isMuted: false, muteExpiresAt: null, banExpiresAt: null }]
]);

const activeSessions = new Set(['user-ok', 'user-muted', 'user-banned']);

const prisma = {};

prisma.session = {
  findFirst: async ({ where }) => (activeSessions.has(where.userId) ? { id: `sess-${where.userId}` } : null)
};

prisma.user = {
  findUnique: async ({ where }) => users.get(where.id) || null,
  update: async () => ({}),
  findMany: async () => [],
  updateMany: async () => ({ count: 0 })
};

prisma.lounge = {
  findUnique: async ({ where }) => (['1', '2', '3'].includes(where.id) ? { id: where.id } : null)
};

prisma.chatMessage = {
  create: async ({ data }) => ({
    id: `msg-${Date.now()}`,
    loungeId: data.loungeId,
    languageRoomId: data.languageRoomId || null,
    userId: data.userId,
    displayUsername: data.displayUsername || 'test-user',
    messageText: data.messageText,
    messageType: data.messageType,
    moderationStatus: 'APPROVED',
    isEdited: false,
    isDeleted: false,
    createdAt: new Date(),
    user: { id: data.userId, permanentUsername: null, preferredName: null, avatarUrl: null }
  })
};

const prismaModulePath = require.resolve('../socket/lib/prisma');
require.cache[prismaModulePath] = {
  id: prismaModulePath,
  filename: prismaModulePath,
  loaded: true,
  exports: prisma
};

const { initChat } = require('../socket/initChat');

function signToken(payload, options = {}) {
  return jwt.sign(payload, SECRET, { expiresIn: '15m', ...options });
}

function connectClient(url, token) {
  return new Promise((resolve, reject) => {
    const client = Client(url, {
      transports: ['websocket'],
      timeout: 5000,
      ...(typeof token === 'undefined' ? {} : { auth: { token } })
    });

    client.once('connect', () => resolve(client));
    client.once('connect_error', (error) => {
      client.close();
      reject(error);
    });
  });
}

function onceEvent(socket, event, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });
}

async function expectConnectError(url, token, expectedCode) {
  try {
    await connectClient(url, token);
    throw new Error(`Expected connect_error ${expectedCode} but connected successfully`);
  } catch (error) {
    assert.strictEqual(error.data?.code, expectedCode, `Expected ${expectedCode}, got ${error.data?.code || error.message}`);
  }
}

async function run() {
  const httpServer = http.createServer();
  const io = new Server(httpServer, { cors: { origin: '*', credentials: true } });
  initChat(io);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const port = httpServer.address().port;
  const url = `http://127.0.0.1:${port}`;

  let guestClient;
  let mutedClient;
  let userClient;

  try {
    await expectConnectError(url, undefined, 'AUTH_REQUIRED');
    await expectConnectError(url, 'not-a-valid-token', 'AUTH_INVALID');

    const expiredToken = signToken({ userId: 'expired-user', sessionType: 'user' }, { expiresIn: -1 });
    await expectConnectError(url, expiredToken, 'AUTH_INVALID');

    const guestToken = signToken({
      userId: 'guest-1',
      sessionType: 'guest',
      allowedLoungeIds: ['1'],
      permissions: ['chat:connect', 'chat:join', 'chat:message']
    }, { expiresIn: '30m' });
    guestClient = await connectClient(url, guestToken);

    guestClient.emit('join-lounge', { loungeId: '1' });
    const guestJoin = await onceEvent(guestClient, 'lounge-joined');
    assert.strictEqual(guestJoin.loungeId, '1');

    guestClient.emit('join-lounge', { loungeId: '2' });
    const unauthorizedJoin = await onceEvent(guestClient, 'chat-error');
    assert.strictEqual(unauthorizedJoin.code, 'AUTHZ_DENIED');

    const bannedToken = signToken({ userId: 'user-banned', sessionType: 'user' });
    const bannedClient = await connectClient(url, bannedToken);
    bannedClient.emit('join-lounge', { loungeId: '1' });
    const bannedError = await onceEvent(bannedClient, 'chat-error');
    assert.strictEqual(bannedError.code, 'AUTHZ_DENIED');
    bannedClient.close();

    const mutedToken = signToken({ userId: 'user-muted', sessionType: 'user' });
    mutedClient = await connectClient(url, mutedToken);
    mutedClient.emit('join-lounge', { loungeId: '1' });
    await onceEvent(mutedClient, 'lounge-joined');

    mutedClient.emit('message', { loungeId: '1', content: 'should be blocked', messageType: 'TEXT' });
    const mutedError = await onceEvent(mutedClient, 'chat-error');
    assert.strictEqual(mutedError.code, 'AUTHZ_DENIED');

    const userToken = signToken({ userId: 'user-ok', sessionType: 'user' });
    userClient = await connectClient(url, userToken);
    userClient.emit('join-lounge', { loungeId: '1' });
    await onceEvent(userClient, 'lounge-joined');

    userClient.emit('message', {
      loungeId: '1',
      languageRoomId: 'room-1',
      content: 'hello world',
      messageType: 'TEXT'
    });
    const message = await onceEvent(userClient, 'message');
    assert.strictEqual(message.content, 'hello world');
    assert.strictEqual(message.loungeId, '1');

    console.log('✅ Socket auth/authorization regression checks passed');
  } finally {
    if (guestClient) guestClient.close();
    if (mutedClient) mutedClient.close();
    if (userClient) userClient.close();

    await new Promise((resolve) => io.close(resolve));
    await new Promise((resolve) => httpServer.close(resolve));
  }
}

run().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error(`❌ Socket auth/authorization regression checks failed: ${error.message}`);
  process.exit(1);
});
