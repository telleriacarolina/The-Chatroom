#!/usr/bin/env node
const assert = require('assert');
const http = require('http');
const path = require('path');
const jwt = require('jsonwebtoken');
const { io: createClient } = require('socket.io-client');

const ROOT = path.resolve(__dirname, '..');
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForEvent(socket, event, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timed out waiting for "${event}"`));
    }, timeoutMs);
    const onEvent = payload => {
      clearTimeout(timer);
      resolve(payload);
    };
    socket.once(event, onEvent);
  });
}

async function expectNoEvent(socket, event, waitMs = 400) {
  let gotEvent = false;
  const handler = () => { gotEvent = true; };
  socket.on(event, handler);
  await delay(waitMs);
  socket.off(event, handler);
  assert.strictEqual(gotEvent, false, `Unexpected "${event}" event received`);
}

async function connectAuthenticated(url, userId) {
  const token = jwt.sign({ userId }, ACCESS_SECRET);
  const socket = createClient(url, {
    auth: { token },
    reconnection: false,
    timeout: 3000,
    transports: ['websocket']
  });
  await waitForEvent(socket, 'connect');
  return socket;
}

async function expectConnectError(url) {
  const socket = createClient(url, {
    reconnection: false,
    timeout: 3000,
    transports: ['websocket']
  });
  try {
    const err = await waitForEvent(socket, 'connect_error');
    assert.ok(String(err?.message || '').toLowerCase().includes('auth'), 'Expected auth connect error');
  } finally {
    socket.close();
  }
}

function createFakePrismaState() {
  const rooms = [
    { id: 'room-1', loungeId: 'lounge-1', isActive: true },
    { id: 'room-2', loungeId: 'lounge-2', isActive: true },
    { id: 'room-inactive', loungeId: 'lounge-1', isActive: false }
  ];

  const users = {
    alice: { id: 'alice', permanentUsername: 'alice', preferredName: 'Alice', avatarUrl: null, accountStatus: 'ACTIVE', isBanned: false, banExpiresAt: null, isMuted: false, muteExpiresAt: null },
    bob: { id: 'bob', permanentUsername: 'bob', preferredName: 'Bob', avatarUrl: null, accountStatus: 'ACTIVE', isBanned: false, banExpiresAt: null, isMuted: false, muteExpiresAt: null },
    carol: { id: 'carol', permanentUsername: 'carol', preferredName: 'Carol', avatarUrl: null, accountStatus: 'ACTIVE', isBanned: false, banExpiresAt: null, isMuted: false, muteExpiresAt: null },
    muted: { id: 'muted', permanentUsername: 'muted', preferredName: 'Muted', avatarUrl: null, accountStatus: 'ACTIVE', isBanned: false, banExpiresAt: null, isMuted: true, muteExpiresAt: new Date(Date.now() + 60_000) },
    banned: { id: 'banned', permanentUsername: 'banned', preferredName: 'Banned', avatarUrl: null, accountStatus: 'ACTIVE', isBanned: true, banExpiresAt: new Date(Date.now() + 60_000), isMuted: false, muteExpiresAt: null },
    suspended: { id: 'suspended', permanentUsername: 'suspended', preferredName: 'Suspended', avatarUrl: null, accountStatus: 'SUSPENDED', isBanned: false, banExpiresAt: null, isMuted: false, muteExpiresAt: null },
    expiredmute: { id: 'expiredmute', permanentUsername: 'expiredmute', preferredName: 'ExpiredMute', avatarUrl: null, accountStatus: 'ACTIVE', isBanned: false, banExpiresAt: null, isMuted: true, muteExpiresAt: new Date(Date.now() - 60_000) }
  };

  const messages = [];
  const updates = [];

  return {
    state: { rooms, users, messages, updates },
    prisma: {
      languageRoom: {
        async findFirst({ where }) {
          return rooms.find(r => r.id === where.id && r.loungeId === where.loungeId && r.isActive === where.isActive) || null;
        }
      },
      user: {
        async findUnique({ where }) {
          return users[where.id] ? { ...users[where.id] } : null;
        },
        async update({ where, data }) {
          if (!users[where.id]) throw new Error('User not found');
          users[where.id] = { ...users[where.id], ...data };
          updates.push({ where, data });
          return { ...users[where.id] };
        }
      },
      chatMessage: {
        async create({ data }) {
          const user = users[data.userId];
          const message = {
            id: `m-${messages.length + 1}`,
            ...data,
            isEdited: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            user: {
              id: user.id,
              permanentUsername: user.permanentUsername,
              preferredName: user.preferredName,
              avatarUrl: user.avatarUrl
            }
          };
          messages.push(message);
          return message;
        }
      }
    }
  };
}

function setMockModule(modulePath, exportsValue) {
  const resolved = require.resolve(modulePath);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: exportsValue
  };
}

async function startApiServiceTarget(modulePath, prismaModulePath, mockModules = {}) {
  const { prisma, state } = createFakePrismaState();
  global.prisma = prisma;
  delete require.cache[require.resolve(prismaModulePath)];
  for (const mockPath of Object.keys(mockModules)) {
    delete require.cache[require.resolve(mockPath)];
    setMockModule(mockPath, mockModules[mockPath]);
  }
  delete require.cache[require.resolve(modulePath)];
  const { initializeSocketIO } = require(modulePath);
  const server = http.createServer((_req, res) => res.end('ok'));
  const io = initializeSocketIO(server);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    io,
    server,
    prisma,
    state
  };
}

async function startStandaloneTarget(modulePath = `${ROOT}/packages/socket/src/socket-server.js`) {
  const { prisma, state } = createFakePrismaState();
  global.prisma = prisma;
  const port = 3200 + Math.floor(Math.random() * 1000);
  process.env.SOCKET_PORT = String(port);
  delete require.cache[require.resolve(modulePath)];
  const server = require(modulePath);
  await delay(200);
  return {
    url: `http://127.0.0.1:${port}`,
    server,
    prisma,
    state
  };
}

async function runSuite(label, starter) {
  const target = await starter();
  const sockets = [];
  const closeSocket = socket => {
    try {
      socket.close();
    } catch {}
  };

  try {
    console.log(`\n[${label}] Running regression checks...`);
    await expectConnectError(target.url);

    const bob = await connectAuthenticated(target.url, 'bob');
    const carol = await connectAuthenticated(target.url, 'carol');
    const alice = await connectAuthenticated(target.url, 'alice');
    sockets.push(bob, carol, alice);

    alice.emit('join_room', { loungeId: 'lounge-1', languageRoomId: 'room-inactive' });
    const inactiveErr = await waitForEvent(alice, 'error');
    assert.ok(String(inactiveErr?.message || '').includes('Room not found for lounge'));

    alice.emit('join_room', { loungeId: 'lounge-2', languageRoomId: 'room-1' });
    const mismatchErr = await waitForEvent(alice, 'error');
    assert.ok(String(mismatchErr?.message || '').includes('Room not found for lounge'));

    bob.emit('join_room', { loungeId: 'lounge-1', languageRoomId: 'room-1' });
    await waitForEvent(bob, 'room_joined');
    carol.emit('join_room', { loungeId: 'lounge-2', languageRoomId: 'room-2' });
    await waitForEvent(carol, 'room_joined');

    const bobJoinedPromise = waitForEvent(bob, 'user_joined');
    alice.emit('join_room', { loungeId: 'lounge-1', languageRoomId: 'room-1' });
    await waitForEvent(alice, 'room_joined');
    await bobJoinedPromise;
    await expectNoEvent(carol, 'user_joined');

    const bobTypingPromise = waitForEvent(bob, 'user_typing');
    alice.emit('typing_start', { languageRoomId: 'room-1' });
    const typingEvent = await bobTypingPromise;
    assert.strictEqual(typingEvent.isTyping, true);
    await expectNoEvent(carol, 'user_typing');

    const bobMessagePromise = waitForEvent(bob, 'chat_message');
    alice.emit('chat_message', { loungeId: 'lounge-1', languageRoomId: 'room-1', messageText: 'hello room 1' });
    const roomMessage = await bobMessagePromise;
    assert.strictEqual(roomMessage.messageText, 'hello room 1');
    await expectNoEvent(carol, 'chat_message');

    carol.emit('chat_message', { loungeId: 'lounge-1', languageRoomId: 'room-1', messageText: 'intrude' });
    const notJoinedErr = await waitForEvent(carol, 'error');
    assert.ok(String(notJoinedErr?.message || '').includes('Not joined'));

    const muted = await connectAuthenticated(target.url, 'muted');
    sockets.push(muted);
    muted.emit('join_room', { loungeId: 'lounge-1', languageRoomId: 'room-1' });
    await waitForEvent(muted, 'room_joined');
    muted.emit('chat_message', { loungeId: 'lounge-1', languageRoomId: 'room-1', messageText: 'muted try' });
    const mutedErr = await waitForEvent(muted, 'error');
    assert.ok(String(mutedErr?.message || '').toLowerCase().includes('muted'));

    const banned = await connectAuthenticated(target.url, 'banned');
    sockets.push(banned);
    banned.emit('join_room', { loungeId: 'lounge-1', languageRoomId: 'room-1' });
    await waitForEvent(banned, 'room_joined');
    banned.emit('chat_message', { loungeId: 'lounge-1', languageRoomId: 'room-1', messageText: 'banned try' });
    const bannedErr = await waitForEvent(banned, 'error');
    assert.ok(String(bannedErr?.message || '').toLowerCase().includes('banned'));

    const suspended = await connectAuthenticated(target.url, 'suspended');
    sockets.push(suspended);
    suspended.emit('join_room', { loungeId: 'lounge-1', languageRoomId: 'room-1' });
    await waitForEvent(suspended, 'room_joined');
    suspended.emit('chat_message', { loungeId: 'lounge-1', languageRoomId: 'room-1', messageText: 'suspended try' });
    const suspendedErr = await waitForEvent(suspended, 'error');
    const suspendedMessage = String(suspendedErr?.message || '').toLowerCase();
    assert.ok(
      suspendedMessage.includes('suspended') || suspendedMessage.includes('banned'),
      'Expected suspended/banned restriction message for suspended user'
    );

    const expiredMute = await connectAuthenticated(target.url, 'expiredmute');
    sockets.push(expiredMute);
    expiredMute.emit('join_room', { loungeId: 'lounge-1', languageRoomId: 'room-1' });
    await waitForEvent(expiredMute, 'room_joined');
    const expiredMsgPromise = waitForEvent(expiredMute, 'chat_message');
    expiredMute.emit('chat_message', { loungeId: 'lounge-1', languageRoomId: 'room-1', messageText: 'expired mute cleared' });
    await expiredMsgPromise;
    assert.strictEqual(target.state.users.expiredmute.isMuted, false, 'Expired mute should be cleared');

    console.log(`[${label}] ✅ passed`);
  } finally {
    sockets.forEach(closeSocket);
    if (target.io) {
      await new Promise(resolve => target.io.close(resolve));
    }
    if (target.server) {
      await new Promise(resolve => target.server.close(resolve));
    }
  }
}

async function main() {
  try {
    await runSuite(
      'root api/services/socketio',
      () => startApiServiceTarget(
        `${ROOT}/api/services/socketio.js`,
        `${ROOT}/api/utils/prisma.js`
      )
    );
    await runSuite(
      'packages/api/src/services/socketio',
      () => startApiServiceTarget(
        `${ROOT}/packages/api/src/services/socketio.js`,
        `${ROOT}/packages/api/src/lib/prisma.js`,
        {
          [`${ROOT}/packages/api/src/utils/logger.js`]: {
            info: () => {},
            warn: () => {},
            error: () => {},
            debug: () => {}
          }
        }
      )
    );
    await runSuite(
      'packages/socket/src/socket-server',
      () => startStandaloneTarget(`${ROOT}/packages/socket/src/socket-server.js`)
    );
    console.log('\nAll socket regression checks passed.');
  } catch (error) {
    console.error('\nSocket regression checks failed:', error);
    process.exitCode = 1;
  }
}

main();
