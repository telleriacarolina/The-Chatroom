#!/usr/bin/env node

const { io } = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');

const API_BASE_URL = process.env.SMOKE_API_URL || 'http://127.0.0.1:3001';
const SOCKET_URL = process.env.SMOKE_SOCKET_URL || 'http://127.0.0.1:3002';
const LOUNGE_ID = process.env.SMOKE_LOUNGE_ID || '1';
const LANGUAGE_ROOM_ID = process.env.SMOKE_LANGUAGE_ROOM_ID || 'smoke-room';

function timeoutAfter(ms, message) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

async function authenticateSession() {
  if (process.env.SMOKE_TEST_ACCESS_TOKEN) {
    return {
      accessToken: process.env.SMOKE_TEST_ACCESS_TOKEN,
      userId: process.env.SMOKE_TEST_USER_ID || 'unknown-user'
    };
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ageCategory: 'PLUS_18' })
  });

  if (!response.ok) {
    throw new Error(`Authentication failed with status ${response.status}`);
  }

  const body = await response.json();
  if (!body.accessToken || !body.guestId) {
    throw new Error('Authentication response missing accessToken or guestId');
  }

  return {
    accessToken: body.accessToken,
    userId: body.guestId
  };
}

async function run() {
  const prisma = new PrismaClient();
  let socket;

  try {
    const { accessToken } = await authenticateSession();

    socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
      timeout: 10000
    });

    await Promise.race([
      new Promise((resolve, reject) => {
        socket.on('connect', resolve);
        socket.on('connect_error', (error) => reject(new Error(`Socket connect failed: ${error.message}`)));
      }),
      timeoutAfter(15000, 'Timed out connecting socket')
    ]);

    await Promise.race([
      new Promise((resolve, reject) => {
        socket.once('lounge-joined', resolve);
        socket.once('chat-error', (error) => reject(new Error(`Join lounge failed: ${JSON.stringify(error)}`)));
        socket.emit('join-lounge', { loungeId: LOUNGE_ID });
      }),
      timeoutAfter(15000, 'Timed out joining lounge')
    ]);

    const uniqueContent = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const messageEvent = await Promise.race([
      new Promise((resolve, reject) => {
        socket.once('message', resolve);
        socket.once('chat-error', (error) => reject(new Error(`Message send failed: ${JSON.stringify(error)}`)));
        socket.emit('message', {
          loungeId: LOUNGE_ID,
          languageRoomId: LANGUAGE_ROOM_ID,
          content: uniqueContent,
          messageType: 'TEXT'
        });
      }),
      timeoutAfter(15000, 'Timed out waiting for message broadcast')
    ]);

    if (!messageEvent || !messageEvent.id) {
      throw new Error('Broadcast message event missing persisted message id');
    }

    const dbMessage = await prisma.chatMessage.findUnique({
      where: { id: messageEvent.id },
      select: {
        id: true,
        loungeId: true,
        messageText: true
      }
    });

    if (!dbMessage) {
      throw new Error('Message was not persisted to PostgreSQL');
    }

    if (dbMessage.loungeId !== LOUNGE_ID || dbMessage.messageText !== uniqueContent) {
      throw new Error('Persisted message does not match expected lounge/content');
    }

    console.log('✅ Full chat smoke flow passed');
  } finally {
    if (socket) {
      socket.disconnect();
    }
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(`❌ Full chat smoke flow failed: ${error.message}`);
  process.exit(1);
});
