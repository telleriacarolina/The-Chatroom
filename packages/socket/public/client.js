const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

const token = window.localStorage.getItem('chatToken') || window.prompt('JWT access token');
if (token) {
  window.localStorage.setItem('chatToken', token);
}

const loungeId = window.localStorage.getItem('loungeId') || window.prompt('Lounge ID');
const languageRoomId = window.localStorage.getItem('languageRoomId') || window.prompt('Language room ID');
if (loungeId) {
  window.localStorage.setItem('loungeId', loungeId);
}
if (languageRoomId) {
  window.localStorage.setItem('languageRoomId', languageRoomId);
}

const socket = io({
  auth: { token }
});

socket.on('connect', () => {
  if (loungeId && languageRoomId) {
    socket.emit('join_room', { loungeId, languageRoomId });
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value && loungeId && languageRoomId) {
    socket.emit('chat_message', {
      loungeId,
      languageRoomId,
      messageText: input.value
    });
    input.value = '';
  }
});

socket.on('chat_message', (msg) => {
  const item = document.createElement('li');
  item.textContent = `${msg.displayUsername || msg.user?.permanentUsername || 'User'}: ${msg.messageText || ''}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});
