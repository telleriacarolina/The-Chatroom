const { encryptPhone, decryptPhone } = require('../lib/crypto');

const crypto = require('crypto');

function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

function validateCSRFToken(token, sessionToken) {
  if (!token || !sessionToken) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(sessionToken)
    );
  } catch (e) {
    return false;
  }
}

module.exports = {
  encrypt: encryptPhone,
  decrypt: decryptPhone,
  generateCSRFToken,
  validateCSRFToken
};
