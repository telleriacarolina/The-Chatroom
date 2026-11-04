function isRoomMembershipValid(socket, languageRoomId) {
  return (
    socket &&
    socket.data &&
    socket.data.currentRoom === languageRoomId &&
    socket.rooms &&
    socket.rooms.has(languageRoomId)
  );
}

function isUserRestrictedFromMessaging(user) {
  if (!user) {
    return { restricted: true, reason: 'User not found' };
  }

  const now = new Date();
  const banActive = user.isBanned && (!user.banExpiresAt || user.banExpiresAt > now);
  if (banActive || user.accountStatus === 'SUSPENDED' || user.accountStatus === 'BANNED') {
    return { restricted: true, reason: 'User is banned from chat' };
  }

  if (user.isMuted && (!user.muteExpiresAt || user.muteExpiresAt > now)) {
    return { restricted: true, reason: 'User is muted and cannot send messages' };
  }

  return { restricted: false, reason: null };
}

module.exports = {
  isRoomMembershipValid,
  isUserRestrictedFromMessaging
};
