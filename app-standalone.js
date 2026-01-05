#!/usr/bin/env node

/**
 * The Chatroom - Standalone Single-File Application
 * Run with: node app-standalone.js
 * Then open: http://localhost:3000
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_secret_key_change_in_production';

// Initialize Express and Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', credentials: true }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// In-memory data store (replace with database in production)
const users = new Map();
const sessions = new Map();
const messages = [];
const rooms = new Map();

// Initialize default rooms
const languages = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Arabic', 'Portuguese'];
languages.forEach(lang => {
  rooms.set(lang, {
    name: lang,
    users: new Set(),
    messages: []
  });
});

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    users: users.size,
    rooms: rooms.size,
    messages: messages.length
  });
});

// Guest signup
app.post('/api/auth/guest', (req, res) => {
  try {
    const { username, ageCategory } = req.body;
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    const user = {
      id: guestId,
      username: username || guestId,
      type: 'GUEST',
      ageCategory: ageCategory || '18PLUS',
      createdAt: new Date()
    };
    
    users.set(guestId, user);
    
    const token = jwt.sign({ userId: guestId, type: 'GUEST' }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      ok: true,
      user: { id: user.id, username: user.username, type: user.type },
      token
    });
  } catch (error) {
    console.error('Guest signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Check if user exists
    const existing = Array.from(users.values()).find(u => u.username === username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = {
      id: userId,
      username,
      email,
      passwordHash,
      type: 'REGISTERED',
      createdAt: new Date()
    };
    
    users.set(userId, user);
    
    const token = jwt.sign({ userId, type: 'REGISTERED' }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      ok: true,
      user: { id: user.id, username: user.username, type: user.type },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User signin
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const user = Array.from(users.values()).find(u => u.username === username);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id, type: user.type }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      ok: true,
      user: { id: user.id, username: user.username, type: user.type },
      token
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      ok: true,
      user: { id: user.id, username: user.username, type: user.type }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get rooms
app.get('/api/rooms', (req, res) => {
  const roomsList = Array.from(rooms.entries()).map(([name, room]) => ({
    name,
    userCount: room.users.size,
    messageCount: room.messages.length
  }));
  res.json({ rooms: roomsList });
});

// Get messages for a room
app.get('/api/rooms/:room/messages', (req, res) => {
  const room = rooms.get(req.params.room);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({ messages: room.messages.slice(-50) }); // Last 50 messages
});

// ============================================
// SOCKET.IO HANDLERS
// ============================================

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);
  
  // Join room
  socket.on('join-room', ({ room, username, token }) => {
    try {
      if (!rooms.has(room)) {
        rooms.set(room, { name: room, users: new Set(), messages: [] });
      }
      
      const roomData = rooms.get(room);
      socket.join(room);
      roomData.users.add(socket.id);
      
      socket.data.room = room;
      socket.data.username = username || socket.id;
      
      console.log(`👤 ${socket.data.username} joined room: ${room}`);
      
      // Notify room
      io.to(room).emit('user-joined', {
        username: socket.data.username,
        userCount: roomData.users.size,
        timestamp: new Date()
      });
      
      // Send recent messages
      socket.emit('message-history', roomData.messages.slice(-20));
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });
  
  // Send message
  socket.on('chat-message', ({ room, message, token }) => {
    try {
      const roomData = rooms.get(room || socket.data.room);
      if (!roomData) {
        return socket.emit('error', { message: 'Room not found' });
      }
      
      const msg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        username: socket.data.username || 'Anonymous',
        message: message,
        room: room || socket.data.room,
        timestamp: new Date()
      };
      
      roomData.messages.push(msg);
      messages.push(msg);
      
      // Broadcast to room
      io.to(msg.room).emit('chat-message', msg);
      
      console.log(`💬 [${msg.room}] ${msg.username}: ${msg.message}`);
    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Typing indicator
  socket.on('typing', ({ room, username }) => {
    socket.to(room || socket.data.room).emit('typing', { username });
  });
  
  // Stop typing
  socket.on('stop-typing', ({ room, username }) => {
    socket.to(room || socket.data.room).emit('stop-typing', { username });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    
    if (socket.data.room) {
      const roomData = rooms.get(socket.data.room);
      if (roomData) {
        roomData.users.delete(socket.id);
        
        io.to(socket.data.room).emit('user-left', {
          username: socket.data.username,
          userCount: roomData.users.size,
          timestamp: new Date()
        });
      }
    }
  });
});

// ============================================
// SERVE FRONTEND HTML
// ============================================

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Chatroom</title>
  <script src="/socket.io/socket.io.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d1a1a 100%);
      color: #fff;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: #700303;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .sidebar {
      width: 250px;
      background: #2a2a2a;
      padding: 20px;
      overflow-y: auto;
      border-right: 1px solid #444;
    }
    .sidebar h3 { margin-bottom: 15px; color: #700303; }
    .room-btn {
      display: block;
      width: 100%;
      padding: 12px;
      margin-bottom: 8px;
      background: #3a3a3a;
      border: none;
      color: #fff;
      cursor: pointer;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.2s;
    }
    .room-btn:hover { background: #700303; transform: translateX(5px); }
    .room-btn.active { background: #700303; }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #1e1e1e;
    }
    .chat-header {
      padding: 15px 20px;
      background: #2a2a2a;
      border-bottom: 1px solid #444;
    }
    .chat-header h2 { font-size: 20px; }
    .chat-header .info { font-size: 12px; opacity: 0.7; margin-top: 5px; }
    #messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .message {
      padding: 12px 16px;
      background: #2a2a2a;
      border-radius: 8px;
      max-width: 70%;
      word-wrap: break-word;
    }
    .message.own { align-self: flex-end; background: #700303; }
    .message .username {
      font-weight: bold;
      margin-bottom: 4px;
      font-size: 13px;
      opacity: 0.9;
    }
    .message .text { font-size: 14px; line-height: 1.4; }
    .message .time {
      font-size: 11px;
      opacity: 0.6;
      margin-top: 4px;
    }
    .system-message {
      text-align: center;
      padding: 8px;
      font-size: 12px;
      opacity: 0.6;
      font-style: italic;
    }
    .typing-indicator {
      padding: 10px 20px;
      font-size: 12px;
      opacity: 0.7;
      font-style: italic;
      height: 30px;
    }
    .input-area {
      padding: 20px;
      background: #2a2a2a;
      border-top: 1px solid #444;
      display: flex;
      gap: 10px;
    }
    #messageInput {
      flex: 1;
      padding: 12px 16px;
      background: #3a3a3a;
      border: 1px solid #555;
      border-radius: 6px;
      color: #fff;
      font-size: 14px;
    }
    #messageInput:focus { outline: none; border-color: #700303; }
    #sendBtn {
      padding: 12px 24px;
      background: #700303;
      border: none;
      color: #fff;
      cursor: pointer;
      border-radius: 6px;
      font-weight: bold;
      transition: all 0.2s;
    }
    #sendBtn:hover { background: #8a0404; }
    .login-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .login-box {
      background: #2a2a2a;
      padding: 40px;
      border-radius: 12px;
      width: 400px;
      max-width: 90%;
    }
    .login-box h2 { margin-bottom: 20px; color: #700303; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-size: 14px; }
    .form-group input {
      width: 100%;
      padding: 12px;
      background: #3a3a3a;
      border: 1px solid #555;
      border-radius: 6px;
      color: #fff;
      font-size: 14px;
    }
    .btn-primary {
      width: 100%;
      padding: 12px;
      background: #700303;
      border: none;
      color: #fff;
      cursor: pointer;
      border-radius: 6px;
      font-weight: bold;
      font-size: 14px;
      margin-top: 10px;
    }
    .btn-primary:hover { background: #8a0404; }
    .btn-secondary {
      width: 100%;
      padding: 12px;
      background: #3a3a3a;
      border: none;
      color: #fff;
      cursor: pointer;
      border-radius: 6px;
      font-size: 14px;
      margin-top: 10px;
    }
    .btn-secondary:hover { background: #4a4a4a; }
    @media (max-width: 768px) {
      .container { flex-direction: column; }
      .sidebar { width: 100%; height: auto; max-height: 200px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔥 The Chatroom</h1>
    <p>Connect • Chat • Explore</p>
  </div>

  <div id="loginModal" class="login-modal">
    <div class="login-box">
      <h2>Welcome to The Chatroom</h2>
      <div class="form-group">
        <label>Username</label>
        <input type="text" id="usernameInput" placeholder="Enter your username" />
      </div>
      <button class="btn-primary" onclick="joinAsGuest()">Join as Guest</button>
      <button class="btn-secondary" onclick="toggleAdvanced()">Sign In / Sign Up</button>
      <div id="advancedForm" style="display:none; margin-top: 20px;">
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="passwordInput" placeholder="Enter password" />
        </div>
        <button class="btn-primary" onclick="signin()">Sign In</button>
        <button class="btn-secondary" onclick="signup()">Sign Up</button>
      </div>
    </div>
  </div>

  <div class="container" style="display:none;" id="mainContainer">
    <div class="sidebar">
      <h3>🌍 Language Rooms</h3>
      <div id="roomsList"></div>
    </div>
    <div class="main">
      <div class="chat-header">
        <h2 id="currentRoom">Select a room</h2>
        <div class="info" id="roomInfo"></div>
      </div>
      <div id="messages"></div>
      <div class="typing-indicator" id="typingIndicator"></div>
      <div class="input-area">
        <input type="text" id="messageInput" placeholder="Type a message..." disabled />
        <button id="sendBtn" disabled>Send</button>
      </div>
    </div>
  </div>

  <script>
    const socket = io();
    let currentRoom = null;
    let username = null;
    let token = null;
    let typingTimeout = null;

    const rooms = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Arabic', 'Portuguese'];

    function toggleAdvanced() {
      const form = document.getElementById('advancedForm');
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }

    async function joinAsGuest() {
      username = document.getElementById('usernameInput').value.trim() || 'Guest' + Math.floor(Math.random() * 1000);
      
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, ageCategory: '18PLUS' })
      });
      
      const data = await response.json();
      if (data.ok) {
        token = data.token;
        username = data.user.username;
        hideLoginModal();
      }
    }

    async function signup() {
      const user = document.getElementById('usernameInput').value.trim();
      const pass = document.getElementById('passwordInput').value;
      
      if (!user || !pass) return alert('Please enter username and password');
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      
      const data = await response.json();
      if (data.ok) {
        token = data.token;
        username = data.user.username;
        hideLoginModal();
      } else {
        alert(data.error || 'Signup failed');
      }
    }

    async function signin() {
      const user = document.getElementById('usernameInput').value.trim();
      const pass = document.getElementById('passwordInput').value;
      
      if (!user || !pass) return alert('Please enter username and password');
      
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      
      const data = await response.json();
      if (data.ok) {
        token = data.token;
        username = data.user.username;
        hideLoginModal();
      } else {
        alert(data.error || 'Login failed');
      }
    }

    function hideLoginModal() {
      document.getElementById('loginModal').style.display = 'none';
      document.getElementById('mainContainer').style.display = 'flex';
      initializeRooms();
    }

    function initializeRooms() {
      const roomsList = document.getElementById('roomsList');
      rooms.forEach(room => {
        const btn = document.createElement('button');
        btn.className = 'room-btn';
        btn.textContent = room;
        btn.onclick = () => joinRoom(room);
        roomsList.appendChild(btn);
      });
    }

    function joinRoom(room) {
      if (currentRoom) {
        socket.emit('leave-room', { room: currentRoom });
      }
      
      currentRoom = room;
      socket.emit('join-room', { room, username, token });
      
      document.getElementById('currentRoom').textContent = '🌍 ' + room;
      document.getElementById('messages').innerHTML = '';
      document.getElementById('messageInput').disabled = false;
      document.getElementById('sendBtn').disabled = false;
      
      document.querySelectorAll('.room-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === room);
      });
    }

    function addMessage(data, isOwn = false) {
      const messagesDiv = document.getElementById('messages');
      const div = document.createElement('div');
      div.className = 'message' + (isOwn ? ' own' : '');
      div.innerHTML = \`
        <div class="username">\${data.username}</div>
        <div class="text">\${escapeHtml(data.message)}</div>
        <div class="time">\${new Date(data.timestamp).toLocaleTimeString()}</div>
      \`;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function addSystemMessage(text) {
      const messagesDiv = document.getElementById('messages');
      const div = document.createElement('div');
      div.className = 'system-message';
      div.textContent = text;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function sendMessage() {
      const input = document.getElementById('messageInput');
      const message = input.value.trim();
      
      if (message && currentRoom) {
        socket.emit('chat-message', { room: currentRoom, message, token });
        input.value = '';
        socket.emit('stop-typing', { room: currentRoom, username });
      }
    }

    document.getElementById('sendBtn').onclick = sendMessage;
    document.getElementById('messageInput').onkeypress = (e) => {
      if (e.key === 'Enter') sendMessage();
      else {
        socket.emit('typing', { room: currentRoom, username });
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          socket.emit('stop-typing', { room: currentRoom, username });
        }, 1000);
      }
    };

    socket.on('message-history', (messages) => {
      messages.forEach(msg => addMessage(msg, msg.username === username));
    });

    socket.on('chat-message', (data) => {
      addMessage(data, data.username === username);
    });

    socket.on('user-joined', (data) => {
      addSystemMessage(\`\${data.username} joined the room\`);
      document.getElementById('roomInfo').textContent = \`\${data.userCount} users online\`;
    });

    socket.on('user-left', (data) => {
      addSystemMessage(\`\${data.username} left the room\`);
      document.getElementById('roomInfo').textContent = \`\${data.userCount} users online\`;
    });

    socket.on('typing', (data) => {
      if (data.username !== username) {
        document.getElementById('typingIndicator').textContent = \`\${data.username} is typing...\`;
      }
    });

    socket.on('stop-typing', () => {
      document.getElementById('typingIndicator').textContent = '';
    });

    socket.on('error', (data) => {
      alert('Error: ' + data.message);
    });
  </script>
</body>
</html>
  `);
});

// ============================================
// START SERVER
// ============================================

server.listen(PORT, () => {
  console.log('');
  console.log('🚀 ================================');
  console.log('🔥  The Chatroom is running!');
  console.log('🌐  http://localhost:' + PORT);
  console.log('📊  Health: http://localhost:' + PORT + '/health');
  console.log('================================');
  console.log('');
  console.log('💡 Press CTRL+C to stop');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
